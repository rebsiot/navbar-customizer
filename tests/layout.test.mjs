import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLayout, orderedIds, sortedEntries, applySceneOrders,
  reorderTabElements, escapeHtml, safeIconClasses
} from '../scripts/layout.mjs';

test('normalization rejects malformed, duplicate, and unsafe IDs', () => {
  assert.deepEqual(normalizeLayout(null), { version: 1, left: [], tools: {}, right: [] });
  const value = normalizeLayout({
    version: -5, left: ['tokens', 'tokens', null, '__proto__', 'tiles'],
    right: 'chat', tools: { tokens: ['select','select','ruler'], constructor: ['bad'] }
  });
  assert.deepEqual(value.left, ['tokens', 'tiles']);
  assert.deepEqual(value.right, []);
  assert.deepEqual(value.tools.tokens, ['select','ruler']);
  assert.equal(Object.hasOwn(value.tools, 'constructor'), false);
});

test('saved items precede unsaved, unknown saved items are ignored', () => {
  assert.deepEqual(orderedIds(['tiles','missing','tokens'], ['tokens','drawing','tiles']), ['tiles','tokens','drawing']);
  assert.deepEqual(orderedIds([], ['tokens','drawing','tiles']), ['tokens','drawing','tiles']);
});

test('left controls and subtools change only order, not callback or metadata', () => {
  const callback = () => 'native callback';
  const controls = {
    tokens: {name:'tokens', title:'Tokens', order:1, onChange: callback, tools: {
      select:{name:'select', order:0, onChange:callback}, target:{name:'target',order:1}
    }},
    tiles: {name:'tiles',order:2,tools:{place:{name:'place',order:0}}},
    pluginControl: {name:'pluginControl',order:99,tools:{other:{name:'other',order:0}}}
  };
  applySceneOrders(controls, {left:['tiles','tokens'],tools:{tokens:['target','select']}});
  assert.deepEqual(sortedEntries(controls).map(x => x.id),['tiles','tokens','pluginControl']);
  assert.deepEqual(sortedEntries(controls.tokens.tools).map(x => x.id),['target','select']);
  assert.equal(controls.tokens.onChange, callback);
  assert.equal(controls.tokens.tools.select.onChange, callback);
  assert.equal(controls.pluginControl.order, 99);
  assert.equal(controls.tiles.tools.place.order,0);
});

test('visible filtering does not include GM-only hidden scene control', () => {
  assert.deepEqual(sortedEntries({a:{order:0},gm:{order:1, visible:false}}).map(x=>x.id), ['a']);
});

class Element {
  constructor(id) { this.id=id; this.parentElement=null; this.children=[]; this.dataset={}; }
  get nextElementSibling() {
    if (!this.parentElement) return null;
    const siblings=this.parentElement.children;
    return siblings[siblings.indexOf(this)+1] ?? null;
  }
  insertBefore(child, before) {
    if (child === before) return;
    if (child.parentElement) {
      child.parentElement.children.splice(child.parentElement.children.indexOf(child),1);
    }
    const idx=before == null ? this.children.length : this.children.indexOf(before);
    if (idx < 0) throw new Error('reference node not present');
    this.children.splice(idx,0,child); child.parentElement=this;
  }
}
function nav(ids) {
  const parent=new Element('nav');
  for(const id of ids) parent.insertBefore(new Element(id),null);
  return parent;
}

test('sidebar tab DOM nodes are moved without replacing existing nodes', () => {
  const container=nav(['chat','combat','actors','settings']);
  const originals=[...container.children];
  const changed=reorderTabElements(container,originals.map(element=>({id:element.id,element})),['actors','chat','combat','settings']);
  assert.equal(changed,true);
  assert.deepEqual(container.children.map(x=>x.id),['actors','chat','combat','settings']);
  assert.deepEqual(new Set(container.children), new Set(originals));
  assert.equal(reorderTabElements(container,container.children.map(element=>({id:element.id,element})),['actors','chat','combat','settings']),false);
});

test('unrelated navigation children stay present', () => {
  const container=nav(['non-tab', 'chat', 'combat', 'actors']);
  const entries=container.children.slice(1).map(element=>({id:element.id,element}));
  reorderTabElements(container,entries,['actors','chat','combat']);
  assert.deepEqual(container.children.map(x=>x.id),['non-tab','actors','chat','combat']);
});

test('HTML escaping and safe icon class filtering exclude injection', () => {
  assert.equal(escapeHtml('<img src="x" & other>'), '&lt;img src=&quot;x&quot; &amp; other&gt;');
  assert.equal(safeIconClasses('fa-solid fa-cat onload=alert(1)'), 'fa-solid fa-cat');
});
