'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const grid=fs.readFileSync('public/studio/grid.js','utf8');

test('clicking the therapy image mask selects its photo and the whole card can be selected explicitly',()=>{
  const card={matches:s=>s==='.therapy-card'};
  const photo={matches:s=>s.includes('.therapy-image'),contains:()=>false};
  const heading={matches:s=>s==='h3',contains:()=>false};
  const src=studio.slice(studio.indexOf('const dragCard'),studio.indexOf('function content('))+
    studio.slice(studio.indexOf('function mediaProxy('),studio.indexOf('function sectionNeighbor('));
  const env=vm.createContext({});vm.runInContext(src,env);
  const make=(exact,mask)=>({closest:s=>s.startsWith('.therapy-card,')?card:s==='[data-bs-kind]'?exact:s==='.therapy-image'?mask:null});
  assert.equal(env.targetFrom(make(photo,null)),photo);
  assert.equal(env.targetFrom(make(card,{querySelector:()=>photo})),photo);
  assert.equal(env.targetFrom(make(heading,null)),heading);
  assert.equal(env.targetFrom(make(card,null)),card);
  assert.equal(env.targetFrom(make(photo,null),true),card);
});

test('an independently dragged therapy image pans within its crop without moving its card',()=>{
  const rect={left:100,top:120,width:300,height:200,right:400,bottom:320};
  const photo={isConnected:true,dataset:{bsKind:'image'},hasAttribute:()=>false,closest:()=>null,matches:()=>true,
    style:{getPropertyValue:()=>''},getBoundingClientRect:()=>rect,parentElement:{getBoundingClientRect:()=>rect}};
  const win={innerWidth:1200,scrollX:0,scrollY:0};
  const env=vm.createContext({D:{defaultView:win},bounded:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))});vm.runInContext(grid,env);
  const start=env.offsetDragStart(photo);
  const target=env.offsetDragTarget(photo,start,300,-300,false);
  assert.equal(start.crop,true);
  assert.equal(target.p.x,3);
  assert.equal(target.p.y,-24);
  assert.equal(target.width,300);
  assert.equal(target.height,200);
  for(const file of ['public/studio/canvas-edits.css','public/homepage-studio/layout-v1.css']){
    const css=fs.readFileSync(file,'utf8');
    assert.match(css,/therapy-image > img\.bs-offset-item\{\s*translate:clamp\(-12%/);
  }
});
