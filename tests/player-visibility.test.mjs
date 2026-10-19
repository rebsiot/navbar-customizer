import test from "node:test";
import assert from "node:assert/strict";

const saved = new Map();
let minRole = 1;
let failSave = false;
const callback = () => "native action";
const style = (value = "inline-flex", priority = "") => ({
  value, priority,
  get display() { return this.value; },
  set display(v) { this.value = v; this.priority = ""; },
  getPropertyValue(k) { return k === "display" ? this.value : ""; },
  getPropertyPriority(k) { return k === "display" ? this.priority : ""; },
  setProperty(k, v, p = "") { if (k === "display") { this.value = v; this.priority = p; } },
  removeProperty(k) { if (k === "display") { this.value = ""; this.priority = ""; } }
});
const element = (data, display = "inline-flex", priority = "") => {
  const attrs = new Map();
  return {
    dataset: data, hidden: false, style: style(display, priority),
    getAttribute: k => attrs.get(k) ?? null,
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: k => attrs.delete(k),
    closest: () => null
  };
};
const nodes = [element({control:"tokens"}),element({tool:"moduleMagic"},"inline-grid","important")];
const toolbar = {
  element: {querySelectorAll: () => nodes},
  control: {name:"tokens"},
  controls: {},
  render: async () => {},
  addEventListener() {}
};
globalThis.document = { getElementById: () => null };
globalThis.ui = {controls:toolbar, sidebar:null};
globalThis.game = {
  user:{role:1,isGM:false},
  i18n:{localize:s=>s},
  settings:{
    get(id,k) {
      assert.equal(id,"foundry-nav-order");
      return k==="minimumHideRole" ? minRole : structuredClone(saved.get(k));
    },
    async set(id,k,v) {
      assert.equal(id,"foundry-nav-order");
      if (failSave) { failSave=false; throw Error("save failed"); }
      saved.set(k,structuredClone(v));
      return v;
    }
  }
};
const visibility = await import("../scripts/visibility.mjs");
const runtime = await import("../scripts/runtime.mjs");
saved.set("visibility", {version:1,left:[],tools:{},right:[]});
saved.set("layout", {version:1,left:[],tools:{},right:[]});
saved.set("appearance",{left:{background:"#112233",icons:null,active:null},right:{background:null,icons:null,active:null}});
visibility.initializeVisibilityFromSettings(() => visibility.applySceneDomVisibility());

test("ordinary player hide actually conceals an addon toolbar button without deleting its action",async()=>{
  assert.equal(visibility.canUserHide(),true);
  const next = visibility.toggleHidden(visibility.getVisibility(),"tools","moduleMagic","tokens",true);
  await visibility.saveVisibility(next);
  assert.equal(nodes[1].hidden,true);
  assert.equal(nodes[1].style.display,"none");
  assert.equal(nodes[1].style.getPropertyPriority("display"),"important");
  assert.equal(saved.get("visibility").tools.tokens.includes("moduleMagic"),true);
  assert.equal(saved.get("appearance").left.background,"#112233");
});

test("late native hook passes reapply an individual player's chosen hide state",()=>{
  const controls = { tokens:{name:"tokens",visible:true,order:0,tools:{core:{name:"core",visible:true,order:0,onChange:callback}}} };
  runtime.updateSceneControls(controls);
  controls.tokens.tools.moduleMagic={name:"moduleMagic",visible:true,order:2,onChange:callback};
  runtime.finalizeSceneControlButtons(controls);
  assert.equal(controls.tokens.tools.moduleMagic.visible,false);
  assert.equal(controls.tokens.tools.moduleMagic.onChange,callback);
  // Simulate a later addon overriding the visibility field.
  controls.tokens.tools.moduleMagic.visible=true;
  visibility.applySceneDomVisibility();
  assert.equal(nodes[1].hidden,true);
});

test("show restores the exact initial display/priority/accessibility, not native permissions",async()=>{
  await visibility.saveVisibility(visibility.toggleHidden(visibility.getVisibility(),"tools","moduleMagic","tokens",false));
  assert.equal(nodes[1].hidden,false);
  assert.equal(nodes[1].style.display,"inline-grid");
  assert.equal(nodes[1].style.getPropertyPriority("display"),"important");
  assert.equal(nodes[1].getAttribute("aria-hidden"),null);
});

test("trusted player threshold and permission revocation honor GM's world choice",async()=>{
  minRole=2; game.user={role:2,isGM:false};
  await visibility.saveVisibility(visibility.toggleHidden(visibility.getVisibility(),"left","tokens",null,true));
  assert.equal(nodes[0].hidden,true);
  game.user={role:1,isGM:false};
  visibility.hideRoleSettingChanged();
  assert.equal(nodes[0].hidden,false);
  await assert.rejects(visibility.saveVisibility({left:[]}),/permission/);
  game.user={role:2,isGM:false};
  visibility.hideRoleSettingChanged();
  assert.equal(nodes[0].hidden,true);
});

test("ordinary player can hide active sidebar tab, Settings remains reachable",()=>{
  minRole=1;game.user={role:1,isGM:false};
  const sidebar={tabGroups:{primary:"journal"},changeTab(tab,group){this.tabGroups[group]=tab;}};
  const journal=element({tab:"journal"}),settings=element({tab:"settings"});
  const entries=[{id:"journal",element:journal},{id:"settings",element:settings}];
  visibility.applySidebarVisibility(entries,{right:["journal"]},true,sidebar);
  assert.equal(sidebar.tabGroups.primary,"settings");
  assert.equal(journal.hidden,true);
  assert.equal(settings.hidden,false);
  visibility.applySidebarVisibility(entries,{right:[]},true,sidebar);
  assert.equal(journal.hidden,false);
});

test("failed player save rolls visibility back without modifying layout/colors",async()=>{
  minRole=1;game.user={role:1,isGM:false};
  const previous=visibility.getVisibility(),order=structuredClone(saved.get("layout")),colors=structuredClone(saved.get("appearance"));
  failSave=true;
  await assert.rejects(visibility.saveVisibility({left:["other"]}),/save failed/);
  assert.deepEqual(visibility.getVisibility(),previous);
  assert.deepEqual(saved.get("layout"),order);
  assert.deepEqual(saved.get("appearance"),colors);
});
