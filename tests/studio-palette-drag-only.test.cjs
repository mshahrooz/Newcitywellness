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

test('the arrow hides the whole drawer and its controls until Add Elements is expanded',()=>{
  const attrs = new Map();
  const panel = {
    hasAttribute: key => attrs.has(key),
    toggleAttribute: (key, value) => value ? attrs.set(key, '') : attrs.delete(key)
  };
  let focusCount=0;
  const button = {setAttribute:(k,v)=>attrs.set(k,v), title:'', focus(){focusCount++;}};
  const toggle = vm.runInNewContext(studio.slice(studio.indexOf('function toggleElementSidebar('),
    studio.indexOf('function buildElementPalette('))+'\ntoggleElementSidebar;',{
      $: id => id==='element-sidebar'?panel:button, requestAnimationFrame(){}
    });
  toggle(false,true);
  assert.equal(panel.hasAttribute('data-collapsed'),true);
  assert.equal(attrs.get('aria-expanded'),'false');
  assert.equal(panel.hasAttribute('inert'),true);
  assert.equal(button.title,'Show Add Elements');
  assert.equal(focusCount,1);
  toggle(true);
  assert.equal(panel.hasAttribute('data-collapsed'),false);
  assert.equal(attrs.get('aria-expanded'),'true');
  assert.equal(panel.hasAttribute('inert'),false);
  assert.match(css,/#element-sidebar\[data-collapsed\]\{[^}]*translateX\([^}]*visibility:hidden/);
});
