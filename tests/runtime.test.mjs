import test from 'node:test';
import assert from 'node:assert/strict';

class TestNode {
  constructor({id='',tag='BUTTON',tab=null}={}) {
    this.id=id; this.tagName=tag; this.dataset=tab ? {tab} : {};
    this.children=[]; this.parentElement=null;
  }
  get nextElementSibling() {
    if (!this.parentElement) return null;
    const list=this.parentElement.children;
    return list[list.indexOf(this)+1] ?? null;
  }
  querySelectorAll(selector) {
    if (selector.includes('sidebar-tabs') || selector.includes('nav')) {
      return this.children.filter(x=>x.tagName==='NAV');
    }
    if (selector==='[data-tab]') return this.children.filter(x=>!!x.dataset.tab);
    return [];
  }
  insertBefore(child,before) {
    if (child===before) return;
    if (child.parentElement) {
      const old=child.parentElement.children;
      old.splice(old.indexOf(child),1);
    }
    const index=before ? this.children.indexOf(before):this.children.length;
    if (index<0) throw new Error('insertBefore target not child');
    this.children.splice(index,0,child); child.parentElement=this;
  }
}

const handlers=new Map();
const onceHandlers=new Map();
let registration={};
let currentValue={version:1,left:[],tools:{},right:[]};
let saveFails=false;
const callback=()=>42;
let latestControls=null;
const root=new TestNode({id:'sidebar',tag:'ASIDE'});
const nav=new TestNode({id:'sidebar-tabs',tag:'NAV'});
for (const id of ['chat','combat','scenes','actors','settings']) nav.insertBefore(new TestNode({id,tab:id}),null);
root.insertBefore(nav,null);
class FakeApp { async _onRender() {} }
class FakeSidebar {
  static TABS=Object.fromEntries(['chat','combat','scenes','actors','settings'].map(id=>[id,{tooltip:id}]));
  constructor() {this.element=root; this.listeners=new Map();}
  addEventListener(type,fn) {this.listeners.set(type,fn);}
}
const sidebar=new FakeSidebar();
function freshControls() {
  return {
    tokens: {name:'tokens',title:'Token Controls', order:0,onChange:callback,tools:{
      select:{name:'select',order:0},target:{name:'target',order:1}
    }},
    tiles: {name:'tiles',title:'Tile Controls',order:1,tools:{place:{name:'place',order:0}}},
    drawings: {name:'drawings',title:'Drawing Controls',order:2,tools:{draw:{name:'draw',order:0}}}
  };
}
const controls={
  render: async () => {
    latestControls=freshControls();
    for (const fn of handlers.get('getSceneControlButtons') ?? []) fn(latestControls);
    return controls;
  },
  get controls() {return latestControls;}
};

globalThis.foundry={applications:{api:{ApplicationV2:FakeApp}}};
globalThis.document={getElementById:(id)=>id==='sidebar'?root:null};
globalThis.game={
  i18n:{localize:key=>key}, user:{isGM:true},
  settings:{
    register:(ns,key,meta)=> {registration.setting={ns,key,meta};},
    registerMenu:(ns,key,meta)=> {registration.menu={ns,key,meta};},
    get:()=>structuredClone(currentValue),
    set:async (_ns,_key,value)=> {
      if(saveFails) throw new Error('remote setting failed');
      currentValue=structuredClone(value);
      registration.setting.meta.onChange(value);
      return value;
    }
  }
};
globalThis.ui={sidebar, controls, notifications:{info(){},error(){}}};
globalThis.Hooks={
  on(name,fn) {handlers.set(name,[...(handlers.get(name)??[]),fn]);},
  once(name,fn) {onceHandlers.set(name,fn);}
};

const file=new URL('../scripts/main.mjs', import.meta.url);
await import(file.href);
const runtime=await import(new URL('../scripts/runtime.mjs', import.meta.url).href);

await test('module registers user scoped preference and menu available to players', async () => {
  onceHandlers.get('init')();
  assert.equal(registration.setting.meta.scope,'user');
  assert.equal(registration.setting.meta.config,false);
  assert.equal(registration.menu.meta.restricted,false);
  assert.equal(registration.menu.meta.label,'Arrange Icons');
  await controls.render();
  onceHandlers.get('ready')();
  await new Promise(setImmediate);
});

await test('runtime applies separate left, subtool and right orders and keeps actions', async () => {
  await runtime.saveLayout({
    left:['tiles','tokens','drawings'],tools:{tokens:['target','select']},
    right:['actors','chat','combat','scenes','settings']
  });
  await new Promise(setImmediate);
  const left=Object.values(latestControls).sort((a,b)=>a.order-b.order).map(x=>x.name);
  assert.deepEqual(left,['tiles','tokens','drawings']);
  assert.deepEqual(Object.values(latestControls.tokens.tools).sort((a,b)=>a.order-b.order).map(x=>x.name),['target','select']);
  assert.deepEqual(nav.children.map(n=>n.dataset.tab),['actors','chat','combat','scenes','settings']);
  assert.equal(latestControls.tokens.onChange,callback);
});

await test('re-rendered sidebar retains saved order', async () => {
  for(const fn of handlers.get('renderSidebar') ?? []) fn(sidebar);
  await new Promise(setImmediate);
  assert.equal(nav.children[0].dataset.tab,'actors');
  assert.equal(typeof sidebar.listeners.get('render'),'function');
});

await test('new module tabs and scene controls remain usable and visible', async () => {
  nav.insertBefore(new TestNode({id:'plugin-tab',tab:'plugin-tab'}),null);
  FakeSidebar.TABS['plugin-tab']={tooltip:'Plugin'};
  runtime.sidebarRendered();
  await new Promise(setImmediate);
  assert.equal(nav.children.at(-1).dataset.tab,'plugin-tab');
  const augmented=freshControls();
  augmented['pluginLayer']={name:'pluginLayer',title:'Plugin Layer',order:3,tools:{pluginTool:{name:'pluginTool',order:0}}};
  runtime.updateSceneControls(augmented);
  assert.equal(augmented.pluginLayer.order,3);
  assert.equal(augmented.pluginLayer.tools.pluginTool.order,0);
});

await test('reset returns native ordering and clears only this setting', async () => {
  await runtime.resetLayout();
  await new Promise(setImmediate);
  assert.deepEqual(currentValue,{version:1,left:[],tools:{},right:[]});
  assert.deepEqual(nav.children.map(n=>n.dataset.tab),['chat','combat','scenes','actors','settings','plugin-tab']);
  assert.deepEqual(Object.values(latestControls).sort((a,b)=>a.order-b.order).map(x=>x.name),['tokens','tiles','drawings']);
});

await test('failed user-scoped setting save reverts optimistic layout safely', async () => {
  saveFails=true;
  await assert.rejects(runtime.saveLayout({left:['drawings','tiles']}), /remote setting failed/);
  await new Promise(setImmediate);
  assert.deepEqual(runtime.getLayout(), {version:1,left:[],tools:{},right:[]});
  saveFails=false;
});

await test('Arrange Icons dialog presents three independent sortable lists', async () => {
  const originalCreateElement=document.createElement;
  document.createElement=() => ({ className:'', innerHTML:'' });
  try {
    const app=new registration.menu.meta.type();
    const panel=await app._renderHTML({},{});
    assert.match(panel.innerHTML,/data-area="left"/);
    assert.match(panel.innerHTML,/data-area="right"/);
    assert.match(panel.innerHTML,/data-area="tools"/);
    assert.match(panel.innerHTML,/data-fno-action="defaults"/);
    assert.match(panel.innerHTML,/Changes are saved automatically/);
  } finally { document.createElement=originalCreateElement; }
});
