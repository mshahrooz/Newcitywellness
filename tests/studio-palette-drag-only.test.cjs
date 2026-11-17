'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const studio = fs.readFileSync('public/studio/studio.js', 'utf8');
const css = fs.readFileSync('public/studio/studio.css', 'utf8');
const code = studio.slice(studio.indexOf('function startAdd('), studio.indexOf('let paletteDrag='));

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
    toggleElementSidebar: visible => assert.equal(visible,true),
    beginPaletteDrag: (event, kind) => calls.push([event, kind]),
    types: { title: ['Heading', '', 'Section title', 'Text'] }
  };
  vm.runInNewContext(code + '\nstartAdd(null);', ctx);
  const tile = body.children[2].children[0];
  assert.equal(tile.tag, 'div');
  assert.equal(tile.attrs.class, 'palette-block');
  assert.ok(tile.children.some(child => child.attrs.class === 'palette-grip'));
  assert.deepEqual(Object.keys(tile.handlers), ['pointerdown']);
  const evt = {type: 'pointerdown'};
  tile.handlers.pointerdown(evt);
  assert.deepEqual(calls, [[evt, 'title']]);
  assert.match(css, /\.palette-block:hover \.palette-grip/);
});
