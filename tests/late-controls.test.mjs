import test from "node:test";
import assert from "node:assert/strict";

const stored = new Map();
const callbacks = new Map();
const id = "foundry-nav-order";
const k = name => `${id}.${name}`;
const nativeCalls = [];
let prepared = {};
const nativeControls = {
  get controls() { return prepared; },
  addEventListener(event, cb) { callbacks.set(event, cb); },
  async render(options = {}) {
    nativeCalls.push(options);
    if (options.reset) {
      prepared = makeCore();
      runtime.updateSceneControls(prepared); // Navbar hook runs early
      addModuleTools(prepared);               // Other modules run AFTER navbar
    }
    callbacks.get("render")?.();
    return this;
  }
};
globalThis.ui = {controls: nativeControls, sidebar:null};
globalThis.game = {
  user:{role:4,isGM:true},
  i18n:{localize:s=>s},
  settings:{
    get(_id,name) { return structuredClone(stored.get(k(name))); },
    async set(_id,name,value) {stored.set(k(name),structuredClone(value));return value;}
  }
};
globalThis.document = {getElementById:()=>null};
const runtime = await import("../scripts/runtime.mjs");
const visibility = await import("../scripts/visibility.mjs");

const buttonAction = () => "native action still callable";
function makeCore() {
  return {
    tokens:{name:"tokens", title:"Token Controls", order:0, visible:true, onChange:buttonAction,
      tools:{ select:{name:"select",title:"Select Tokens",order:0,visible:true,onChange:buttonAction},
              target:{name:"target",title:"Select Targets",order:1,visible:true},
              measure:{name:"measure",title:"Measure Distance",order:2,visible:true},
              move:{name:"move",title:"Unconstrained Movement",order:3,visible:true} }},
    tiles:{name:"tiles",title:"Tiles",order:1,visible:true,tools:{place:{name:"place",title:"Place Tiles",order:0}}}
  };
}
const names = ["moduleLight","moduleWeather","moduleDraw","moduleNotes","moduleTeleporter","moduleEffect","moduleMagic","moduleHealth","moduleAssets"];
function addModuleTools(target) {
  for(let i=0;i<names.length;i++) {
    const name=names[i];
    target.tokens.tools[name] = {name,title:`Addon tool ${i+1}`,visible:true,order:i+4,onChange:buttonAction};
  }
  target.tokens.tools.gmRestricted={name:"gmRestricted",title:"Private GM tool",order:99,visible:false};
  target.pluginLayer={name:"pluginLayer",title:"Addon Layer",order:12,visible:true,
    tools:{pluginTool:{name:"pluginTool",title:"Addon tool",order:0,visible:true,onChange:buttonAction}}};
}
function showIds(items) { return items.map(x=>x.id); }
function sleepMicrotasks() {return new Promise(resolve=>setImmediate(resolve));}
stored.set(k("minimumHideRole"),4);
stored.set(k("visibility"),visibility.normalizeVisibility(null));
stored.set(k("layout"),runtime.getLayout());
visibility.initializeVisibilityFromSettings();

await test("late hook additions appear in the native prepared control list", async () => {
  prepared=makeCore();
  runtime.updateSceneControls(prepared);
  assert.equal(runtime.getToolsFor("tokens").length,4);
  addModuleTools(prepared);
  assert.equal(runtime.getToolsFor("tokens").length,13);
  assert.deepEqual(showIds(runtime.getToolsFor("tokens")).slice(4),names);
  assert.ok(showIds(runtime.getLeftControls()).includes("pluginLayer"));
  assert.ok(showIds(runtime.getToolsFor("pluginLayer")).includes("pluginTool"));
  assert.equal(runtime.getToolsFor("tokens").some(tool=>tool.id==="gmRestricted"),false);
  assert.equal(prepared.tokens.tools.moduleMagic.onChange,buttonAction);
});

await test("reads newly prepared records rather than an older hook snapshot", async () => {
  const old=prepared;
  const replacement=makeCore();
  runtime.updateSceneControls(replacement);
  addModuleTools(replacement);
  prepared=replacement;
  assert.notEqual(prepared,old);
  assert.ok(showIds(runtime.getToolsFor("tokens")).includes("moduleHealth"));
});

await test("saved native ordering applies to late-added tools without changing callbacks", async () => {
  await runtime.saveLayout({version:1,left:["pluginLayer","tokens"],right:[],tools:{tokens:["moduleMagic","select","moduleWeather"]}});
  prepared=makeCore();
  runtime.updateSceneControls(prepared);
  assert.equal(prepared.tokens.tools.select.order,-100000);
  addModuleTools(prepared);
  assert.equal(prepared.tokens.tools.moduleMagic.order,10);
  assert.equal(runtime.reconcilePreparedControls(prepared),true);
  assert.equal(prepared.tokens.tools.moduleMagic.order,-100000);
  assert.equal(prepared.tokens.tools.select.order,-99999);
  assert.equal(prepared.tokens.tools.moduleWeather.order,-99998);
  assert.equal(prepared.pluginLayer.order,-100000);
  assert.equal(prepared.tokens.tools.moduleMagic.onChange,buttonAction);
  assert.equal(runtime.reconcilePreparedControls(prepared),false);
});

await test("saved hidden late module tool stays restorable; restricted tools stay unavailable", async () => {
  await visibility.saveVisibility(visibility.toggleHidden(visibility.getVisibility(),"tools","moduleLight","tokens",true));
  prepared=makeCore();
  runtime.updateSceneControls(prepared);
  addModuleTools(prepared);
  assert.equal(prepared.tokens.tools.moduleLight.visible,true);
  assert.equal(runtime.reconcilePreparedControls(prepared),true);
  assert.equal(prepared.tokens.tools.moduleLight.visible,false);
  assert.ok(showIds(runtime.getToolsFor("tokens")).includes("moduleLight"));
  assert.ok(!showIds(runtime.getToolsFor("tokens")).includes("gmRestricted"));
  assert.equal(prepared.tokens.tools.moduleLight.onChange,buttonAction);
});

await test("user-hidden native control remains recoverable when omitted by UI getter", async () => {
  await visibility.saveVisibility(visibility.toggleHidden(visibility.getVisibility(),"left","tiles",null,true));
  prepared=makeCore();
  runtime.updateSceneControls(prepared);
  addModuleTools(prepared);
  assert.equal(prepared.tiles.visible,false);
  delete prepared.tiles;
  assert.ok(showIds(runtime.getLeftControls()).includes("tiles"));
  assert.ok(showIds(runtime.getToolsFor("tokens")).includes("moduleMagic"));
});

await test("a player with no hide permission never sees protected foreign tools", async () => {
  game.user={role:1,isGM:false};
  prepared=makeCore();
  runtime.updateSceneControls(prepared);
  addModuleTools(prepared);
  runtime.reconcilePreparedControls(prepared);
  assert.equal(visibility.canUserHide(),false);
  assert.ok(showIds(runtime.getToolsFor("tokens")).includes("moduleMagic"));
  assert.equal(showIds(runtime.getToolsFor("tokens")).includes("gmRestricted"),false);
  game.user={role:4,isGM:true};
});

await test("control render event reconciles late-added tools with one non-reset refresh", async () => {
  await visibility.resetVisibility();
  runtime.attachSceneControlEvents();
  nativeCalls.length=0;
  await nativeControls.render({reset:true});
  await sleepMicrotasks();
  await sleepMicrotasks();
  assert.equal(nativeCalls.length,2);
  assert.deepEqual(nativeCalls.map(x=>x.reset),[true,false]);
  assert.equal(prepared.tokens.tools.moduleMagic.order,-100000);
  assert.equal(prepared.tokens.tools.moduleMagic.onChange,buttonAction);
});

await test("no extra toolbar render when layout/visibility are defaults", async () => {
  await runtime.resetLayout();
  await visibility.resetVisibility();
  await sleepMicrotasks();
  await sleepMicrotasks();
  nativeCalls.length=0;
  await nativeControls.render({reset:true});
  await sleepMicrotasks();
  await sleepMicrotasks();
  assert.deepEqual(nativeCalls.map(x=>x.reset),[true]);
  assert.equal(runtime.getToolsFor("tokens").length,13);
});
