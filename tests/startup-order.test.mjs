import test from 'node:test';
import assert from 'node:assert/strict';

const on = new Map();
const once = new Map();
const registered = new Map();
const stored = new Map();
const key = (name) => `foundry-nav-order.${name}`;
const call = (type, ...args) => { for (const fn of on.get(type) ?? []) fn(...args); };
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };

const action = () => 'native action';
function baseControls() {
  return {
    tokens: { name: 'tokens', title: 'Tokens', order: 0, visible: true,
      onChange: action, tools: {
        select: {name: 'select', title: 'Select Tokens', order: 0, visible: true, onChange: action},
        target: {name: 'target', title: 'Target Tokens', order: 1, visible: true, onChange: action}
      }
    },
    tiles: {name: 'tiles', title: 'Tiles', order: 1, visible: true, tools: {place: {name: 'place', order: 0, visible: true}}}
  };
}
class FakeControls {
  constructor() { this.rendered = false; this.controls = {}; this.events = new Map(); this.calls = []; this.visualOrder = []; }
  addEventListener(name, fn) {this.events.set(name, [...(this.events.get(name) ?? []),fn]);}
  async render(opts = {}) {
    this.calls.push(opts);
    if (!this.rendered && !opts.force) return this; // Foundry ApplicationV2 needs forced first render
    if (opts.reset || !this.rendered) {
      this.controls = baseControls();
      call('getSceneControlButtons', this.controls);
    }
    this.visualOrder = Object.entries(this.controls).sort((a,b) => a[1].order - b[1].order).map(([id])=>id);
    this.rendered = true;
    for (const fn of this.events.get('render') ?? []) fn();
    call('renderSceneControls', this);
    return this;
  }
}
class Node {
  constructor(tab=null, tagName='BUTTON', id='') {this.dataset = tab ? {tab} : {}; this.tagName=tagName; this.id=id; this.children=[]; this.parentElement=null; this.hidden=false; this.style={display:''};}
  get nextElementSibling() { const p=this.parentElement;return p?.children[p.children.indexOf(this)+1] ?? null; }
  querySelectorAll(selector) {return selector.includes('sidebar-tabs') ? this.children.filter(x=>x.id === 'sidebar-tabs') : selector === '[data-tab]' ? this.children.filter(x=>x.dataset.tab):[];}
  getAttribute(){return null;}
  setAttribute(){}
  removeAttribute(){}
  insertBefore(child,before) {
    if(child===before) return;
    if(child.parentElement){const old=child.parentElement.children;old.splice(old.indexOf(child),1);}
    const idx=before?this.children.indexOf(before):this.children.length;
    if(idx<0) throw new Error('Invalid node');
    this.children.splice(idx,0,child);child.parentElement=this;
  }
}
class FakeSidebar {
  static TABS={chat:{tooltip:'Chat'},actors:{tooltip:'Actors'},settings:{tooltip:'Settings'}};
  constructor() {this.element=new Node(null,'ASIDE','sidebar');this.nav=new Node(null,'NAV','sidebar-tabs');this.element.insertBefore(this.nav,null);for(const t of ['chat','actors','settings'])this.nav.insertBefore(new Node(t),null);this.events=new Map();}
  addEventListener(name,fn){this.events.set(name,fn);}
}
const styles = new Map();
globalThis.document = {
  head:{appendChild(el){styles.set(el.id,el)}},
  getElementById(id){return styles.get(id)??null;},
  createElement(){return {id:null,textContent:'',remove(){styles.delete(this.id)}};}
};
globalThis.foundry = {applications:{api:{ApplicationV2:class {async _onRender() {}}}}};
globalThis.Hooks = {
  on(type,fn){on.set(type,[...(on.get(type)??[]),fn]);},
  once(type,fn){once.set(type,fn);}
};
globalThis.ui={controls:new FakeControls(),sidebar:null,notifications:{info(){},error(){},warn(){}}};
globalThis.game={user:{role:4,isGM:true},i18n:{localize:x=>x},settings:{
  register(ns,name,meta){registered.set(`${ns}.${name}`,meta);},
  registerMenu(ns,name,meta){registered.set(`${ns}.${name}`,meta);},
  get(ns,name){return structuredClone(stored.get(`${ns}.${name}`));},
  async set(ns,name,value){stored.set(`${ns}.${name}`,structuredClone(value));registered.get(`${ns}.${name}`)?.onChange?.(value);return value;}
}};

stored.set(key('layout'),{version:1,left:['tiles','tokens'],right:['actors','chat','settings'],tools:{tokens:['target','select']}});
stored.set(key('visibility'),{version:1,left:[],tools:{},right:[]});
stored.set(key('appearance'),{left:{background:null,icons:null,active:null},right:{background:null,icons:null,active:null}});
stored.set(key('minimumHideRole'),4);
await import('../scripts/main.mjs');
const runtime = await import('../scripts/runtime.mjs');

await test('existing native first render before ready is corrected automatically on login', async () => {
  once.get('init')();
  const controls=ui.controls;
  await controls.render({force:true,reset:true});
  assert.deepEqual(controls.visualOrder,['tokens','tiles']);
  once.get('ready')();
  await flush();
  assert.deepEqual(controls.visualOrder,['tiles','tokens']);
  assert.deepEqual(Object.values(controls.controls.tokens.tools).sort((a,b)=>a.order-b.order).map(x=>x.name),['target','select']);
  assert.equal(controls.controls.tokens.onChange,action);
  const extra=controls.calls.filter(c=>c.reset&&!c.force);
  assert.equal(extra.length,1,'exactly one extra automatic ordering pass');
});

await test('sidebar created AFTER ready receives user tab order without refreshing page', async () => {
  const sidebar=new FakeSidebar();ui.sidebar=sidebar;
  call('renderSidebar',sidebar);
  await flush();
  assert.deepEqual(sidebar.nav.children.map(x=>x.dataset.tab),['actors','chat','settings']);
  assert.equal(typeof sidebar.events.get('render'),'function');
  sidebar.events.get('render')();
  await flush();
  assert.deepEqual(sidebar.nav.children.map(x=>x.dataset.tab),['actors','chat','settings']);
});

await test('new controls ApplicationV2 after ready is bound and replays first actual render once',async()=>{
  const fresh=new FakeControls();ui.controls=fresh;
  runtime.initializeStartupOrder();
  call('canvasReady');
  assert.equal(fresh.calls.length,0,'do not force-render not-yet-mounted app');
  await fresh.render({force:true,reset:true});
  await flush();
  assert.deepEqual(fresh.visualOrder,['tiles','tokens']);
  assert.deepEqual(fresh.calls.map(x=>Boolean(x.reset)),[true,true]);
  await fresh.render({reset:false});
  await flush();
  assert.equal(fresh.calls.length,3,'no recursive startup redraws');
});

await test('default preferences do not trigger extra startup redraws',async()=>{
  stored.set(key('layout'),{version:1,left:[],right:[],tools:{}});
  runtime.initializeLayoutFromSettings({apply:false});
  const fresh=new FakeControls();ui.controls=fresh;
  runtime.initializeStartupOrder();
  await fresh.render({force:true,reset:true});
  await flush();
  assert.deepEqual(fresh.visualOrder,['tokens','tiles']);
  assert.equal(fresh.calls.length,1);
});
