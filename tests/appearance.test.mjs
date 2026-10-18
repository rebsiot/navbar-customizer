import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

const registry = new Map();
const stored = new Map();
const styleElements = new Map();
const appendCalls = [];
const setCalls = [];
let failNextSave = false;
let saveBarrier = null;

const documentMock = {
  head: {
    appendChild(element) { styleElements.set(element.id, element); appendCalls.push(element); }
  },
  getElementById(id) { return styleElements.get(id) ?? null; },
  createElement(tag) {
    if (tag === "style") {
      const style = {id:null,textContent:"",remove() {styleElements.delete(this.id);}};
      return style;
    }
    if (tag === "div") return {className:"",innerHTML:""};
    throw Error(`Unexpected element: ${tag}`);
  }
};

globalThis.document = documentMock;
globalThis.foundry = { applications: { api: { ApplicationV2: class {
  constructor() { this.element = {querySelector: () => null}; }
  async _onRender() {}
} } } };
globalThis.ui = { sidebar: null, controls: null, notifications: {error(){},info(){}} };
globalThis.Hooks = {once(){},on(){}};
globalThis.game = {
  i18n: {localize: s => s}, user: {isGM:true},
  settings: {
    register(namespace,key,opts) { registry.set(`${namespace}.${key}`, opts); },
    registerMenu(namespace,key,opts) { registry.set(`${namespace}.${key}`, opts); },
    get(namespace,key) { return structuredClone(stored.get(`${namespace}.${key}`)); },
    async set(namespace,key,value) {
      const address=`${namespace}.${key}`;
      setCalls.push({address,value:structuredClone(value)});
      if (saveBarrier) await saveBarrier;
      if (failNextSave) {failNextSave=false;throw Error("save failed");}
      stored.set(address,structuredClone(value));
      registry.get(address)?.onChange?.(value);
      return value;
    }
  }
};

const appearance = await import("../scripts/appearance.mjs");
const {EMPTY_LAYOUT} = await import("../scripts/layout.mjs");
const {MODULE_ID,SETTING_KEY,saveLayout,initializeLayoutFromSettings,getLayout} = await import("../scripts/runtime.mjs");
const {NavColorsApp} = await import("../scripts/organizer.mjs");
const APPEARANCE_KEY = `${MODULE_ID}.${appearance.APPEARANCE_SETTING_KEY}`;
const LAYOUT_KEY = `${MODULE_ID}.${SETTING_KEY}`;

function defaults() {return appearance.normalizeAppearance(null);}

test("no settings mean no color overrides", () => {
  assert.deepEqual(defaults(), {left:{background:null,icons:null,active:null},right:{background:null,icons:null,active:null}});
  assert.equal(appearance.buildAppearanceCss(defaults()), "");
  assert.equal(appearance.buildAppearanceCss(), "");
});

test("normalize each side and field, reject malformed CSS and prototype tricks", () => {
  const input = {
    left: {background:"#ABCDEF", icons:"rgb(0,0,0)", active:"#f00"},
    right:{background:"#012345; } body { color:red",icons:"#ffffff",active:"#aBc123"},
    irrelevant: {value:"#ffffff"}
  };
  const normalized = appearance.normalizeAppearance(input);
  assert.deepEqual(normalized, {
    left:{background:"#abcdef",icons:null,active:null},
    right:{background:null,icons:"#ffffff",active:"#abc123"}
  });
  assert.deepEqual(appearance.normalizeAppearance([]), defaults());
  assert.deepEqual(appearance.normalizeAppearance({left:"#ffffff",right:[]}), defaults());
  assert.equal(appearance.buildAppearanceCss(input).includes("body { color:red"),false);
});

test("left and right CSS is scoped to the actual navigation areas", () => {
  const css=appearance.buildAppearanceCss({left:{background:"#121212", icons:"#efefef", active:"#00ff00"}, right:{background:"#0f0f0f",icons:"#ffffff", active:"#aa0000"}});
  for(const color of ["#121212","#efefef","#00ff00","#0f0f0f","#ffffff","#aa0000"]) assert.ok(css.includes(color));
  for(const root of ["#scene-controls", "#sidebar-tabs", "#sidebar .sidebar-tabs"]) assert.ok(css.includes(root));
  for(const excluded of ["#hotbar","#chat-log", "#actors-directory", "#settings"]) assert.ok(!css.includes(excluded));
  assert.ok(css.indexOf("background-color: #00ff00") > css.indexOf("background-color: #121212"));
});

test("an unchecked property never overrides native computed styles", () => {
  const css=appearance.buildAppearanceCss({left:{icons:"#fffeee"}});
  assert.match(css,/color: #fffeee !important/);
  assert.doesNotMatch(css,/background-color:/);
  assert.doesNotMatch(css,/#sidebar/);
});

test("separate user scoped settings are registered and layout shape stays intact", async() => {
  stored.set(APPEARANCE_KEY, defaults());
  stored.set(LAYOUT_KEY,structuredClone(EMPTY_LAYOUT));
  const {default:nullDefault}={default:null};
  const calls={init:null,ready:null};
  globalThis.Hooks={once(name,fn){calls[name]=fn;},on(){}};
  // Import fresh main: the two registry entries should be independent.
  await import("../scripts/main.mjs");
  calls.init();
  assert.equal(registry.get(APPEARANCE_KEY).scope,"user");
  assert.equal(registry.get(APPEARANCE_KEY).config,false);
  assert.equal(registry.get(LAYOUT_KEY).scope,"user");
  assert.equal(registry.get(LAYOUT_KEY).config,false);
  assert.equal(registry.get(`${MODULE_ID}.arrangeIcons`).label,"Arrange Icon Order");
  assert.equal(registry.get(`${MODULE_ID}.changeColors`).label,"Change Colors");
  appearance.initializeAppearanceFromSettings();
  initializeLayoutFromSettings();
  assert.equal(styleElements.size,0);
});

test("enabling left colors leaves right colors and icon ordering untouched", async() => {
  await saveLayout({version:1,left:["tiles","tokens"],right:["actors","chat"],tools:{tokens:["select"]}});
  const oldLayout = getLayout();
  await appearance.saveAppearance({left:{background:"#202a35",icons:"#ffffff",active:"#2255ee"}});
  assert.deepEqual(getLayout(),oldLayout);
  assert.deepEqual(stored.get(APPEARANCE_KEY).right,defaults().right);
  assert.match(styleElements.get(appearance.APPEARANCE_STYLE_ID).textContent,/#202a35/);
  assert.ok(setCalls.some(call=>call.address===APPEARANCE_KEY));
});

test("saved appearance survives simulated reinitialization", () => {
  const original = appearance.getAppearance();
  appearance.initializeAppearanceFromSettings();
  assert.deepEqual(appearance.getAppearance(),original);
});

test("editing the right side preserves left colors and does not alter user layout", async() => {
  const beforeLayout=getLayout();
  const value=appearance.getAppearance();
  value.right.icons="#000000";
  await appearance.saveAppearance(value);
  assert.equal(appearance.getAppearance().left.background,"#202a35");
  assert.deepEqual(getLayout(),beforeLayout);
  assert.match(styleElements.get(appearance.APPEARANCE_STYLE_ID).textContent,/#000000/);
});

test("reset colors removes style element and leaves icon order unchanged", async() => {
  const beforeLayout=getLayout();
  await appearance.resetAppearance();
  assert.deepEqual(appearance.getAppearance(),defaults());
  assert.equal(styleElements.size,0);
  assert.deepEqual(getLayout(),beforeLayout);
  assert.deepEqual(stored.get(APPEARANCE_KEY),defaults());
});

test("invalid values are stored as null without stylesheet injection", async() => {
  await appearance.saveAppearance({left:{icons:"red; background:url(javascript:alert(1))",background:"#ff00ff"}});
  assert.equal(appearance.getAppearance().left.icons,null);
  assert.equal(appearance.getAppearance().left.background,"#ff00ff");
  assert.doesNotMatch(styleElements.get(appearance.APPEARANCE_STYLE_ID).textContent,/javascript|url\(/);
});

test("failed appearance save restores previous colors and leaves order alone", async() => {
  const before=appearance.getAppearance();
  const beforeLayout=getLayout();
  failNextSave=true;
  await assert.rejects(appearance.saveAppearance({left:{background:"#776655"}}),/save failed/);
  assert.deepEqual(appearance.getAppearance(),before);
  assert.deepEqual(getLayout(),beforeLayout);
  assert.match(styleElements.get(appearance.APPEARANCE_STYLE_ID).textContent,/#ff00ff/);
});

test("multiple rapid color changes persist in order", async() => {
  const a=appearance.getAppearance();
  a.left.icons="#001122";
  const b=appearance.getAppearance();
  b.left.icons="#334455";
  await Promise.all([appearance.saveAppearance(a),appearance.saveAppearance(b)]);
  assert.equal(stored.get(APPEARANCE_KEY).left.icons,"#334455");
  assert.equal(appearance.getAppearance().left.icons,"#334455");
});

test("appearance panel displays independent left/right custom controls", async() => {
  const app=new NavColorsApp();
  const panel=await app._renderHTML({},{});
  assert.match(panel.innerHTML,/fno-appearance-title/);
  assert.match(panel.innerHTML,/Restore Default Colors/);
  assert.doesNotMatch(panel.innerHTML,/Reset Icon Order/);
  assert.doesNotMatch(panel.innerHTML,/data-fno-action="defaults"/);
  for(const side of ["left","right"]) for(const field of ["background","icons","active"]) {
    assert.ok(panel.innerHTML.includes(`class="fno-theme-toggle" data-side="${side}" data-field="${field}"`));
    assert.ok(panel.innerHTML.includes(`class="fno-theme-picker" data-side="${side}" data-field="${field}"`));
  }
});

test("appearance panel accurately checks enabled fields after saved color", async() => {
  await appearance.saveAppearance({left:{background:"#101010"},right:{icons:"#ffffff"}});
  const app=new NavColorsApp();
  const html=(await app._renderHTML({},{})).innerHTML;
  assert.match(html,/data-side="left" data-field="background" checked/);
  assert.match(html,/data-side="right" data-field="icons" checked/);
  assert.match(html,/data-side="left" data-field="active" >/);
  await appearance.resetAppearance();
});
