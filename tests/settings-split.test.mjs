import test from "node:test";
import assert from "node:assert/strict";

const registry = new Map();
const values = new Map();
const hooks = {};
const id = "foundry-nav-order";
const key = name => id + "." + name;
const styleNodes = new Map();

class FakeApplicationV2 {
  constructor() { this.element = { querySelector() { return null; } }; }
  async _onRender() {}
}
globalThis.foundry = { applications: { api: { ApplicationV2: FakeApplicationV2 } } };
globalThis.document = {
  head: { appendChild(element) { styleNodes.set(element.id, element); } },
  createElement(tag) {
    if (tag === "style") return { id:null, textContent:"", remove() { styleNodes.delete(this.id); } };
    return { className:"", innerHTML:"" };
  },
  getElementById(elementId) { return styleNodes.get(elementId) ?? null; }
};
globalThis.Hooks = { once(name, callback) { hooks[name] = callback; }, on() {} };
globalThis.ui = { sidebar:null, controls:null, notifications:{info(){},warn(){},error(){}} };
globalThis.game = {
  user:{ role:4, isGM:true },
  i18n:{localize: value => value},
  settings:{
    register(ns,name,meta) { registry.set(ns+"."+name,meta); },
    registerMenu(ns,name,meta) { registry.set(ns+"."+name,meta); },
    get(ns,name) { return structuredClone(values.get(ns+"."+name)); },
    async set(ns,name,value) {
      const full=ns+"."+name;
      values.set(full,structuredClone(value));
      registry.get(full)?.onChange?.(value);
      return value;
    }
  }
};

const { NavOrganizerApp, NavColorsApp } = await import("../scripts/organizer.mjs");
const appearance = await import("../scripts/appearance.mjs");
const runtime = await import("../scripts/runtime.mjs");
const visibility = await import("../scripts/visibility.mjs");
await import("../scripts/main.mjs");
hooks.init();

test("distinct Arrange Icon Order and Change Colors menu entries share module identity", () => {
  const a=registry.get(key("arrangeIcons"));
  const b=registry.get(key("changeColors"));
  assert.equal(a.label,"Arrange Icon Order");
  assert.equal(b.label,"Change Colors");
  assert.equal(a.type,NavOrganizerApp);
  assert.equal(b.type,NavColorsApp);
  assert.equal(a.restricted,false);
  assert.equal(b.restricted,false);
  assert.notEqual(a.type,b.type);
  assert.match(a.name,/AFT Navbar\+/);
  assert.match(b.name,/AFT Navbar\+/);
  assert.equal(NavOrganizerApp.DEFAULT_OPTIONS.window.title,"AFT Navbar+ — Arrange Icon Order");
  assert.equal(NavColorsApp.DEFAULT_OPTIONS.window.title,"AFT Navbar+ — Change Colors");
  assert.notEqual(NavOrganizerApp.DEFAULT_OPTIONS.id,NavColorsApp.DEFAULT_OPTIONS.id);
});

test("existing saved settings and GM hide threshold retain their original keys/scopes", () => {
  for(const name of ["layout","appearance","visibility"]) assert.equal(registry.get(key(name)).scope,"user");
  assert.equal(registry.get(key("minimumHideRole")).scope,"world");
  assert.equal(registry.get(key("minimumHideRole")).default,4);
});

test("order dialog contains sortable areas, eye controls and no color widgets", async () => {
  const html=(await new NavOrganizerApp()._renderHTML({},{})).innerHTML;
  for(const name of ["left","tools","right"]) assert.ok(html.includes('data-area="'+name+'"'));
  assert.match(html,/Reset Icon Order/);
  assert.match(html,/Restore All Hidden Icons/);
  assert.doesNotMatch(html,/fno-appearance|fno-theme-picker|Restore Default Colors/);
});

test("color dialog contains exactly six independent color switches and no ordering controls", async () => {
  const html=(await new NavColorsApp()._renderHTML({},{})).innerHTML;
  assert.equal((html.match(/class="fno-theme-toggle"/g)||[]).length,6);
  assert.equal((html.match(/class="fno-theme-picker"/g)||[]).length,6);
  assert.match(html,/Restore Default Colors/);
  assert.match(html,/data-fno-action="restore-colors"/);
  assert.doesNotMatch(html,/data-area="(left|right|tools)"|data-move=|Reset Icon Order|Restore All Hidden Icons/);
});

test("all player roles retain independent Change Colors menu regardless of hide access", async () => {
  values.set(key("minimumHideRole"),4);
  for(const role of [1,2,3]) {
    game.user={role,isGM:false};
    assert.equal(visibility.canUserHide(),false);
    assert.equal(registry.get(key("changeColors")).restricted,false);
    assert.match((await new NavColorsApp()._renderHTML({},{})).innerHTML,/fno-theme-picker/);
  }
  game.user={role:4,isGM:true};
});

test("previous color values persist on new screen and color reset leaves icon order unchanged", async () => {
  const original={version:1,left:["tiles","tokens"],right:["actors","chat"],tools:{tokens:["select"]}};
  await runtime.saveLayout(original);
  const before=runtime.getLayout();
  await appearance.saveAppearance({left:{background:"#123456"},right:{icons:"#abcdef"}});
  const html=(await new NavColorsApp()._renderHTML({},{})).innerHTML;
  assert.match(html,/data-side="left" data-field="background" checked/);
  assert.match(html,/data-side="right" data-field="icons" checked/);
  assert.deepEqual(runtime.getLayout(),before);
  await appearance.resetAppearance();
  assert.deepEqual(runtime.getLayout(),before);
});
