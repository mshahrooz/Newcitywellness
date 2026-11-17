'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const studio = fs.readFileSync('public/studio/studio.js', 'utf8');
const css = fs.readFileSync('public/studio/studio.css', 'utf8');
const code = studio.slice(studio.indexOf('function buildElementPalette('), studio.indexOf('function startAdd('));

test('the Add element tile is a drag surface with a hover grip and no click action', () => {
  const make = (tag, attrs, text) => ({
    tag, attrs, text, children: [], handlers: {},
    append(...children) { this.children.push(...children); },
    hasChildNodes() { return this.children.length>0; },
    addEventListener(name, handler) { this.handlers[name] = handler; }
  });
  const body = make('div');
  const calls = [];
  const ctx = {
    create: make, clearGridPick() {}, close() {}, mode:'edit', switching:false,
    $: id => { assert.equal(id,'element-sidebar-body');return body; },
    StudioElementIcons:{create:kind=>make('svg',{'data-icon':kind})},
    beginPaletteDrag: (event, kind) => calls.push([event, kind]),
    types: { title: ['Heading', '', 'Section title', 'Text'] }
  };
  vm.runInNewContext(code + '\nbuildElementPalette();buildElementPalette();', ctx);
  const tile = body.children[2].children[0];
  assert.equal(tile.tag, 'div');
  assert.equal(tile.attrs.class, 'palette-block');
  assert.ok(tile.children.some(child => child.attrs.class === 'palette-grip'));
  assert.equal(tile.children[0].attrs['data-icon'],'title');
  assert.equal(body.children.length,3);
  assert.deepEqual(Object.keys(tile.handlers), ['pointerdown']);
  const evt = {type: 'pointerdown'};
  tile.handlers.pointerdown(evt);
  assert.deepEqual(calls, [[evt, 'title']]);
  assert.match(css, /\.palette-block:hover \.palette-grip/);
});

test('the arrow toggles compact mode without hiding or rebuilding the tools',()=>{
  const attrs = new Map();
  const panel = {
    hasAttribute: key => attrs.has(key),
    toggleAttribute: (key, value) => value ? attrs.set(key, '') : attrs.delete(key)
  };
  const button = {setAttribute:(k,v)=>attrs.set(k,v), title:'', focus(){}};
  const toggle = vm.runInNewContext(studio.slice(studio.indexOf('function toggleElementSidebar('),
    studio.indexOf('function buildElementPalette('))+'\ntoggleElementSidebar;',{
      $: id => id==='element-sidebar'?panel:button, requestAnimationFrame(){}
    });
  toggle(false);
  assert.equal(panel.hasAttribute('data-collapsed'),true);
  assert.equal(attrs.get('aria-expanded'),'false');
  assert.equal(button.title,'Expand Add Elements');
  toggle(true);
  assert.equal(panel.hasAttribute('data-collapsed'),false);
  assert.equal(attrs.get('aria-expanded'),'true');
  assert.match(css,/#element-sidebar\[data-collapsed\] \.palette-block\{[^}]*min-height/);
});
