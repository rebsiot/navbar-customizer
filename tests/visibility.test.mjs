import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';

const registered = new Map();
const stored = new Map();
let throwNext = false;
const settingChanges = [];
const hooks = { once: {}, on: {} };
let refreshes = 0;

globalThis.game = {
  i18n: { localize: value => value },
  user: { id:'gm', isGM:true, role:4 },
  settings: {
    register(ns,key,meta){ registered.set(`${ns}.${key}`,meta); },
    registerMenu(ns,key,meta){ registered.set(`${ns}.${key}`,meta); },
    get(ns,key){ return structuredClone(stored.get(`${ns}.${key}`)); },
    async set(ns,key,value){
      const id=`${ns}.${key}`;
      if (throwNext) { throwNext = false; throw Error('Simulated settings error'); }
      stored.set(id, structuredClone(value));
      settingChanges.push(id);
      registered.get(id)?.onChange?.(value);
      return value;
    }
  }
};
class ApplicationV2 { constructor(){this.element={querySelector:()=>null};} async _onRender(){} }
globalThis.foundry = { applications:{api:{ApplicationV2}} };
globalThis.Hooks = {
  once(event, cb){ hooks.once[event]=cb; },
  on(event,cb){ (hooks.on[event]??=[]).push(cb); }
};
globalThis.document = { createElement(){return {className:'',innerHTML:''}}, getElementById(){return null} };
globalThis.ui = { sidebar:null, controls:null, notifications:{error(){},warn(){},info(){}} };

const visibility = await import('../scripts/visibility.mjs');
const runtime = await import('../scripts/runtime.mjs');
const appearance = await import('../scripts/appearance.mjs');
await import('../scripts/main.mjs');
const { NavOrganizerApp } = await import('../scripts/organizer.mjs');
const key = (suffix) => `foundry-nav-order.${suffix}`;

await test('module registers hide setting for each user and a GM-controlled world permission setting', () => {
  hooks.once.init();
  const saved = registered.get(key('visibility'));
  const roles = registered.get(key('minimumHideRole'));
  assert.equal(saved.scope,'user');
  assert.equal(saved.config,false);
  assert.equal(roles.scope,'world');
  assert.equal(roles.config,true);
  assert.deepEqual(Object.keys(roles.choices),['1','2','4']);
  assert.equal(roles.default,4);
  assert.equal(registered.get(key('arrangeIcons')).restricted,false);
  assert.equal(registered.get(key('layout')).scope,'user');
  assert.equal(registered.get(key('appearance')).scope,'user');
});

await test('normalizes hidden IDs and always keeps Settings accessible', () => {
  assert.deepEqual(visibility.normalizeVisibility(null), { version:1,left:[],right:[],tools:{} });
  assert.deepEqual(visibility.normalizeVisibility({ left:['tiles','tiles','__proto__','actors'],right:['settings','chat','settings'],tools:{ tokens:['select','select','constructor'] } }), {
    version:1,left:['tiles','actors'],right:['chat'],tools:{tokens:['select']}
  });
  assert.deepEqual(visibility.normalizeVisibility({left:'no',right:[{},42],tools:{}}),{version:1,left:[],right:[],tools:{}});
});

await test('hide/show actions do not move or delete icons, and Settings cannot be hidden', () => {
  let hidden=visibility.toggleHidden(null,'left','tokens',null,true);
  hidden=visibility.toggleHidden(hidden,'tools','select','tokens',true);
  hidden=visibility.toggleHidden(hidden,'right','chat',null,true);
  hidden=visibility.toggleHidden(hidden,'right','settings',null,true);
  assert.equal(visibility.isHidden(hidden,'left','tokens'),true);
  assert.equal(visibility.isHidden(hidden,'tools','select','tokens'),true);
  assert.equal(visibility.isHidden(hidden,'right','chat'),true);
  assert.equal(visibility.isHidden(hidden,'right','settings'),false);
  assert.deepEqual(visibility.toggleHidden(hidden,'tools','select','tokens',false).tools.tokens,[]);
  assert.equal(visibility.toggleHidden(hidden,'tools','x','__proto__',true).tools.__proto__,Object.prototype);
  assert.deepEqual(visibility.toggleHidden(hidden,'right','chat',null,false).right,[]);
});

await test('permission tiers follow Foundry role numbers exactly', () => {
  assert.equal(visibility.canUserHide({role:4},4),true);
  assert.equal(visibility.canUserHide({role:3},4),false);
  assert.equal(visibility.canUserHide({role:2},4),false);
  assert.equal(visibility.canUserHide({role:2},2),true);
  assert.equal(visibility.canUserHide({role:3},2),true);
  assert.equal(visibility.canUserHide({role:1},2),false);
  assert.equal(visibility.canUserHide({role:1},1),true);
  assert.equal(visibility.canUserHide({role:0},1),false);
  assert.equal(visibility.canUserHide(null,1),false);
  assert.equal(visibility.canUserHide({isGM:true},4),true);
});

await test('left control/tool visibility uses native flags and preserves native callbacks', () => {
  const action=()=>42;
  const controls={
    tokens:{name:'tokens',visible:true,order:0,onChange:action,tools:{select:{visible:true,onChange:action},target:{visible:true}}},
    tiles:{visible:true,tools:{}},
    locked:{visible:false,tools:{secret:{visible:false}}}
  };
  visibility.applySceneVisibility(controls,{left:['tiles'],tools:{tokens:['select'],locked:['secret']}},true);
  assert.equal(controls.tiles.visible,false);
  assert.equal(controls.tokens.visible,true);
  assert.equal(controls.tokens.tools.select.visible,false);
  assert.equal(controls.tokens.tools.target.visible,true);
  assert.equal(controls.locked.visible,false);
  assert.equal(controls.tokens.onChange,action);
  assert.equal(controls.tokens.tools.select.onChange,action);
  const untouched={tiles:{visible:true,tools:{select:{visible:true}}}};
  visibility.applySceneVisibility(untouched,{left:['tiles']},false);
  assert.equal(untouched.tiles.visible,true);
});

function node(id, style='') {
  const attrs=new Map();
  return { id, style:{display:style},hidden:false,
    getAttribute(name){return attrs.has(name)?attrs.get(name):null},
    setAttribute(name,value){attrs.set(name,String(value))},
    removeAttribute(name){attrs.delete(name)}
  };
}

await test('right tabs are hidden visually and restored exactly (no DOM replacement)', () => {
  const chat=node('chat','inline-block');
  const actors=node('actors','grid');
  const settings=node('settings');
  const entries=[chat,actors,settings].map(element=>({id:element.id,element}));
  const sidebar={tabGroups:{primary:'settings'},changeTab(id){this.tabGroups.primary=id}};
  visibility.applySidebarVisibility(entries,{right:['actors','settings']},true,sidebar);
  assert.equal(actors.style.display,'none');
  assert.equal(actors.hidden,true);
  assert.equal(actors.getAttribute('aria-hidden'),'true');
  assert.equal(chat.style.display,'inline-block');
  assert.equal(settings.hidden,false);
  visibility.applySidebarVisibility(entries,{right:[]},true,sidebar);
  assert.equal(actors.style.display,'grid');
  assert.equal(actors.hidden,false);
  assert.equal(actors.getAttribute('aria-hidden'),null);
  assert.equal(entries[1].element,actors);
});

await test('active right tab switches to Settings before its icon is hidden', () => {
  const actors=node('actors'),settings=node('settings');
  const entries=[actors,settings].map(element=>({id:element.id,element}));
  const sidebar={tabGroups:{primary:'actors'}, changeTab(id,group){assert.equal(group,'primary');this.tabGroups.primary=id}};
  visibility.applySidebarVisibility(entries,{right:['actors']},true,sidebar);
  assert.equal(sidebar.tabGroups.primary,'settings');
  assert.equal(actors.hidden,true);
  visibility.applySidebarVisibility(entries,{right:['actors']},false,sidebar);
  assert.equal(actors.hidden,false);
});

await test('if native cannot switch tabs, active right tab remains visible', () => {
  const actors=node('actors');
  visibility.applySidebarVisibility([{id:'actors',element:actors}],{right:['actors']},true,{tabGroups:{primary:'actors'}});
  assert.equal(actors.hidden,false);
});

await test('permission revocation restores sidebar tabs; future grants reapply user preferences', () => {
  stored.set(key('minimumHideRole'),4);
  stored.set(key('visibility'),{version:1,left:[],tools:{},right:['actors']});
  visibility.initializeVisibilityFromSettings(()=>{refreshes++});
  assert.equal(visibility.getVisibility().right[0],'actors');
  assert.equal(visibility.canUserHide(),true);
  const callsBefore=refreshes;
  game.user={role:1,isGM:false};
  visibility.hideRoleSettingChanged();
  assert.equal(visibility.canUserHide(),false);
  assert.equal(refreshes,callsBefore+1);
  assert.deepEqual(visibility.getVisibility().right,['actors']);
  stored.set(key('minimumHideRole'),1);
  visibility.hideRoleSettingChanged();
  assert.equal(visibility.canUserHide(),true);
  game.user={role:4,isGM:true};
});

await test('saving user visibility never touches layout or appearance settings', async() => {
  stored.set(key('minimumHideRole'),4);
  stored.set(key('layout'),{version:1,left:['tiles'],right:['chat'],tools:{}});
  stored.set(key('appearance'),{left:{icons:'#abcdef'},right:{}});
  const beforeLayout=structuredClone(stored.get(key('layout')));
  const beforeAppearance=structuredClone(stored.get(key('appearance')));
  await visibility.saveVisibility({left:['tiles'],right:['chat'],tools:{tokens:['select']}});
  assert.deepEqual(stored.get(key('layout')),beforeLayout);
  assert.deepEqual(stored.get(key('appearance')),beforeAppearance);
  assert.equal(stored.get(key('visibility')).left[0],'tiles');
  await visibility.resetVisibility();
  assert.deepEqual(stored.get(key('visibility')),visibility.normalizeVisibility(null));
});

await test('player without GM permission cannot write hidden preferences', async() => {
  stored.set(key('minimumHideRole'),4);
  game.user={role:1,isGM:false};
  const before=structuredClone(stored.get(key('visibility')));
  await assert.rejects(visibility.saveVisibility({left:['tokens']}),/do not have permission/);
  assert.deepEqual(stored.get(key('visibility')),before);
  game.user={role:4,isGM:true};
});

await test('save failure rolls back hidden state and preserves unrelated preferences', async() => {
  const before=visibility.getVisibility();
  throwNext=true;
  await assert.rejects(visibility.saveVisibility({left:['drawings']}),/settings error/);
  assert.deepEqual(visibility.getVisibility(),before);
  assert.deepEqual(stored.get(key('layout')).left,['tiles']);
});

await test('rapid hide operations save in order', async() => {
  const first=visibility.toggleHidden(visibility.getVisibility(),'left','tiles',null,true);
  const second=visibility.toggleHidden(first,'left','tokens',null,true);
  await Promise.all([visibility.saveVisibility(first),visibility.saveVisibility(second)]);
  assert.deepEqual(stored.get(key('visibility')).left,['tiles','tokens']);
  await visibility.resetVisibility();
});

await test('organizer presents Hide/Show alongside arrows only when permitted', async() => {
  // Render stable control and sidebar tab fixtures through runtime's public hook.
  const actions={
    tokens:{name:'tokens',order:0,title:'Tokens',visible:true,tools:{select:{name:'select',title:'Select',visible:true,order:0}}},
    tiles:{name:'tiles',order:1,title:'Tiles',visible:true,tools:{place:{name:'place',title:'Place',visible:true,order:0}}}
  };
  runtime.updateSceneControls(actions);
  const app=new NavOrganizerApp();
  let panel=await app._renderHTML({},{});
  assert.match(panel.innerHTML,/data-area="left"/);
  assert.match(panel.innerHTML,/data-visibility="hide"/);
  assert.match(panel.innerHTML,/fa-eye-slash/);
  assert.match(panel.innerHTML,/Restore All Hidden Icons/);
  assert.match(panel.innerHTML,/Restore Default Colors/);
  game.user={role:1,isGM:false};
  stored.set(key('minimumHideRole'),4);
  panel=await app._renderHTML({},{});
  assert.doesNotMatch(panel.innerHTML,/data-visibility="hide"/);
  assert.doesNotMatch(panel.innerHTML,/Restore All Hidden Icons/);
  stored.set(key('minimumHideRole'),2);
  game.user={role:2,isGM:false};
  panel=await app._renderHTML({},{});
  assert.match(panel.innerHTML,/data-visibility="hide"/);
  game.user={role:4,isGM:true};
});
