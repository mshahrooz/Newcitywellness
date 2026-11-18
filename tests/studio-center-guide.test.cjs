'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');

const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
function fixture({width=1200,box=rect(135,160,274,48),section=rect(30,90,1134,620),clip=null}={}){
  const root={clientWidth:width,scrollHeight:2000};
  const win={innerWidth:width,innerHeight:700,scrollX:0,scrollY:0,getComputedStyle:()=>({overflowX:'hidden',overflowY:'visible'})};
  const zone={dataset:{bsRow:'custom'},getBoundingClientRect:()=>section};
  const n={parentElement:clip?{parentElement:root,getBoundingClientRect:()=>clip}:root};
  const line={hidden:true,style:{}};
  const env=vm.createContext({D:{defaultView:win,documentElement:root},rowOf:()=>zone,$:()=>line,
    bounded:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/studio/grid.js'),'utf8'),env);
  const device=width<601?'mobile':'desktop';
  const start={device,r:box,base:{x:2,y:0},scrollX:0,scrollY:0};
  return {env,n,start,win,line,zone};
}

test('the center override ignores the nearest grid cell and persists the exact visual center',()=>{
  const {env,n,start}=fixture();
  const target=env.centerDragTarget(n,start,320,0,185,{free:true});
  assert.equal(target.centerX,597);
  assert.equal(target.left,460);
  assert.notEqual(env.offsetDragTarget(n,start,320,0,true).left,460);
  assert.ok(Math.abs(start.r.left+(target.p.x-start.base.x)*12+start.r.width/2-597)<.001);
});

test('near-center jitter keeps the snap but wider drags, vertical sorting and crop drags do not',()=>{
  const {env,n,start}=fixture();
  assert.ok(env.centerDragTarget(n,start,336,0,185));
  assert.equal(env.centerDragTarget(n,start,342,0,185),null);
  assert.ok(env.centerDragTarget(n,start,342,0,185,{snapped:true}));
  assert.equal(env.centerDragTarget(n,start,348,0,185,{snapped:true}),null);
  const centered={...start,r:rect(460,160,274,48)};
  assert.equal(env.centerDragTarget(n,centered,1,70,255),null);
  assert.equal(env.centerDragTarget(n,{...start,crop:true},325,0,185),null);
  assert.equal(env.centerDragTarget(n,start,325,0,765),null);
});

test('a clipped element does not promise a center it cannot reach',()=>{
  const {env,n,start}=fixture({clip:rect(0,0,545,900)});
  assert.equal(env.centerDragTarget(n,start,325,0,185),null);
});

test('the guide clips to the visible iframe and narrow previews use the section midpoint',()=>{
  const {env,n,start,line}=fixture({width:390,box:rect(25,70,90,30),section:rect(8,-90,374,1100)});
  const target=env.centerDragTarget(n,start,121,0,85);
  assert.equal(target.left,150);
  assert.equal(target.device,'mobile');
  env.showCenterGuide({left:40,top:92,width:390,height:600},target);
  assert.equal(line.hidden,false);
  assert.deepEqual(line.style,{left:'235px',top:'92px',height:'600px'});
  env.hideCenterGuide();
  assert.equal(line.hidden,true);
});
