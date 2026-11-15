'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function canvas() {
  const r = (left, top, width, height) => ({left, top, width, height, right: left+width, bottom: top+height});
  const rect = r(120,240,300,80);
  const root = {clientWidth:1200,scrollHeight:1800};
  const clip = {getBoundingClientRect:()=>r(40,100,1040,450),parentElement:root};
  const vals = new Map();
  const n = {isConnected:true,dataset:{bsKind:'title'},parentElement:clip,getBoundingClientRect:()=>rect,
    hasAttribute:()=>false,closest:()=>null,matches:()=>false,
    style:{getPropertyValue:k=>vals.get(k),setProperty:(k,v)=>vals.set(k,v)},
    classList:new Set()};
  const win = {innerWidth:1200,innerHeight:700,scrollX:0,scrollY:0,
    getComputedStyle:()=>({overflowX:'hidden',overflowY:'hidden'})};
  const env = vm.createContext({D:{documentElement:root,defaultView:win},
    bounded:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))});
  vm.runInContext(fs.readFileSync('public/studio/grid.js','utf8'),env);
  return { env, n, win, clip, vals };
}

test('a drag changes only visual offsets and keeps the element in its original layout parent', () => {
  const {env,n,clip,vals}=canvas();
  const start=env.offsetDragStart(n);
  const target=env.offsetDragTarget(n,start,60,-36,false);
  assert.equal(target.left,180);
  assert.equal(target.top,204);
  assert.equal(env.applyDragOffset(n,target),true);
  assert.equal(n.parentElement,clip);
  assert.equal(vals.get('--bs-drag-desktop-x'),'5vw');
  assert.equal(vals.get('--bs-drag-desktop-y'),'-36px');
  assert.equal(vals.size,2);
  const repeat=env.offsetDragStart(n);
  assert.equal(env.offsetDragTarget(n,repeat,30,0,false).p.x,7.5);
});

test('dragging respects clipping and keeps other responsive preview sizes unchanged', () => {
  const {env,n,win,vals}=canvas();
  win.innerWidth=390;
  const start=env.offsetDragStart(n);
  const target=env.offsetDragTarget(n,start,-900,800,false);
  assert.equal(target.left,40);
  assert.equal(target.top,470);
  assert.equal(target.device,'mobile');
  assert.equal(env.applyDragOffset(n,target),true);
  assert.equal(vals.has('--bs-drag-desktop-x'),false);
  assert.equal(vals.has('--bs-drag-tablet-y'),false);
  assert.equal(vals.get('--bs-drag-mobile-y'),'230px');
});

test('whole sections are excluded from independent drag, and invalid offsets are ignored', () => {
  const {env,n,vals}=canvas();
  n.hasAttribute=key=>key==='data-bs-row';
  assert.equal(env.canDragIndependently(n),false);
  assert.equal(env.applyDragOffset(n,{device:'desktop',p:{x:2,y:3}}),false);
  n.hasAttribute=()=>false;
  assert.equal(env.applyDragOffset(n,{device:'desktop',p:{x:Infinity,y:3}}),false);
  assert.equal(vals.size,0);
});

test('canvas and published homepage use identical visual offset styles for each device', () => {
  const style=path=>fs.readFileSync(path,'utf8').split('/* Dragging changes paint offsets')[1];
  const published=style('public/homepage-studio/layout-v1.css');
  assert.equal(published,style('public/studio/canvas-edits.css'));
  for(const device of ['desktop','tablet','mobile'])assert.match(published,new RegExp('--bs-drag-'+device+'-x'));
  assert.match(published,/translate:var/);
  assert.doesNotMatch(published,/position:(?:absolute|fixed)|(?:[;{\s])(?:margin|padding|width|height):/);
});

test('inline text and links keep their inline display and receive a relative paint offset', () => {
  const {env,n,win}=canvas();
  win.getComputedStyle=()=>({display:'inline'});
  assert.equal(env.applyDragOffset(n,{device:'desktop',p:{x:2,y:3}}),true);
  assert.equal(n.classList.has('bs-offset-inline'),true);
  const style=fs.readFileSync('public/homepage-studio/layout-v1.css','utf8');
  assert.match(style,/bs-offset-inline\{\s*position:relative;left:/);
});
