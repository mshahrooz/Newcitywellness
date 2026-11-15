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
    idOf:n=>n.getAttribute('data-bs-id'),bounded:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))});
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
  assert.equal(vals.get('--bs-drag-mobile-adjust-y'),'230px');
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
  const style=path=>fs.readFileSync(path,'utf8').split('/* Desktop offsets are shared')[1];
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

test('desktop moves carry over and later desktop moves preserve narrow-screen adjustments', () => {
  const {env,n}=canvas();
  n.getAttribute=()=> 'heading';
  const apply=(device,x,y)=>env.applyDragOffset(n,env.dragOperation(n,device,{x,y}));
  apply('desktop',10,100);
  assert.equal(env.dragOffset(n,'tablet').x,10);
  assert.equal(env.dragOffset(n,'tablet').y,75);
  assert.equal(env.dragOffset(n,'mobile').x,10);
  assert.ok(Math.abs(env.dragOffset(n,'mobile').y-55)<.001);
  apply('mobile',6,35);
  apply('desktop',12,120);
  assert.equal(env.dragOffset(n,'tablet').x,12);
  assert.equal(env.dragOffset(n,'tablet').y,90);
  assert.equal(env.dragOffset(n,'mobile').x,8);
  assert.ok(Math.abs(env.dragOffset(n,'mobile').y-46)<.001);
  env.applyDragOffset(n,{device:'mobile',relative:true,p:{x:0,y:0}});
  assert.equal(env.dragOffset(n,'mobile').x,12);
});

test('old device-specific draft positions replay before subsequent desktop edits', () => {
  const {env,n}=canvas();
  env.applyDragOffset(n,{device:'desktop',p:{x:10,y:100}});
  env.applyDragOffset(n,{device:'tablet',p:{x:4,y:24}});
  assert.equal(env.dragOffset(n,'tablet').x,4);
  assert.equal(env.dragOffset(n,'tablet').y,24);
  env.applyDragOffset(n,{device:'desktop',p:{x:12,y:120}});
  assert.equal(env.dragOffset(n,'tablet').x,6);
  assert.equal(env.dragOffset(n,'tablet').y,39);
});

test('responsive runtime clamps translated elements inside clipping parents without touching their shared offset', () => {
  const root={clientWidth:390};
  const style=new Map([['--bs-drag-desktop-x','30vw']]);
  const parent={parentElement:root,getBoundingClientRect:()=>({left:0,right:390,top:100,bottom:500})};
  const el={parentElement:parent,classList:new Set(),getBoundingClientRect:()=>({left:147,right:477,top:420,bottom:530,width:330,height:110}),
    style:{removeProperty:k=>style.delete(k),setProperty:(k,v)=>style.set(k,v)}};
  el.classList.contains=el.classList.has;
  const doc={documentElement:root,querySelectorAll:()=>[el],defaultView:{innerWidth:390,
    getComputedStyle:n=>n===el?{translate:'117px 55px'}:{overflowX:'clip',overflowY:'hidden'}}};
  const runtime=vm.runInNewContext(fs.readFileSync('public/homepage-studio/responsive-offsets.js','utf8')+'\nStudioResponsiveOffsets');
  runtime.recalc(doc);
  assert.equal(style.get('--bs-safe-drag-x'),'30px');
  assert.equal(style.get('--bs-safe-drag-y'),'25px');
  assert.equal(style.get('--bs-drag-desktop-x'),'30vw');
  runtime.strip(doc);
  assert.equal(style.size,1);
});
