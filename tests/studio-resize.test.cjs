'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');
const code=fs.readFileSync('public/studio/resize.js','utf8');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const resize=vm.runInNewContext(code+'\nStudioResize;',{
  idOf:n=>n.id,GRID_COLS:48,therapyPhoto:()=>false
});
const roundTrip=v=>JSON.parse(JSON.stringify(v));
const rect={width:400,height:240};
const n={id:'test-1'};

test('each edge grows or shrinks in the direction of its outward normal',()=>{
  for(const [edge,dx,dy] of [['left',-40,0],['right',40,0],['top',0,-40],['bottom',0,40]]){
    assert.equal(resize.signedDelta(edge,dx,dy),40);
    assert.equal(resize.signedDelta(edge,-dx,-dy),-40);
    const axis=resize.vertical(edge)?'height':'width';
    const base={n,edge,rect};
    assert.equal(resize.operation(base,40)[axis],rect[axis]+40);
    assert.equal(resize.operation(base,-40)[axis],rect[axis]-40);
    assert.equal(resize.operation(base,0),null);
  }
});

test('section handles work on both edges and preserve the content-safe minimum',()=>{
  const row={n,row:true,edge:'top',rect,padding:65};
  assert.deepEqual(roundTrip(resize.operation(row,60)),{kind:'section-height',id:n.id,value:300,edge:'top',padding:125});
  assert.deepEqual(roundTrip(resize.operation(row,-300)),{kind:'section-height',id:n.id,value:24,edge:'top'});
  const bottom={...row,edge:'bottom'};
  assert.deepEqual(roundTrip(resize.operation(bottom,60)),{kind:'section-height',id:n.id,value:300,edge:'bottom'});
});

test('free placement keeps the opposite side anchored and stays inside the section',()=>{
  const p={x:20,y:60,w:40,h:240,z:0};
  const base={n,edge:'left',rect,p,device:'desktop',zoneWidth:1000};
  assert.deepEqual(roundTrip(resize.operation(base,80).p),{x:12,y:60,w:48,h:240,z:0});
  assert.deepEqual(roundTrip(resize.operation({...base,edge:'right'},1200).p),{x:20,y:60,w:80,h:240,z:0});
  assert.deepEqual(roundTrip(resize.operation({...base,edge:'top'},1200).p),{x:20,y:0,w:40,h:300,z:0});
  assert.equal(p.x,20);
});

test('handles are not projected onto a clipped edge at the top or bottom of the canvas',()=>{
  const f={left:0,right:800,top:100,bottom:700};
  const t=roundTrip(resize.gripPositions({left:20,right:700,top:50,bottom:350,f}));
  assert.equal(t.top,null);
  assert.deepEqual(t.bottom,[360,350]);
  const b=roundTrip(resize.gripPositions({left:0,right:800,top:650,bottom:950,f}));
  assert.deepEqual(b.top,[400,650]);
  assert.equal(b.bottom,null);
});

test('resizing records a single operation on release, with cancel restoring the original styles',()=>{
  const update=studio.slice(studio.indexOf('function updateResize(e)'),studio.indexOf("for(const edge of ['top','right','bottom','left'])",studio.indexOf('function stopResize(commit,e)')));
  const calls=[];
  const context={
    StudioResize:{signedDelta:(edge,dx)=>dx,preview:(d,dx)=>({kind:'edge-size',id:n.id,width:400+dx})},
    resizeDrag:{pointer:4,x:0,y:0,edge:'right',el:{getBoundingClientRect:()=>rect},control:{hasPointerCapture:()=>false},restore:()=>calls.push('restore')},
    resizeSize:{style:{},offsetWidth:60},innerWidth:1000,innerHeight:800,
    document:{documentElement:{classList:{remove(){}},style:{removeProperty(){}}}},
    refreshFreeSizes(){},paint(){},record(op){calls.push(op);return true;}
  };
  const env=vm.createContext(context);
  vm.runInContext(update,env);
  const event={pointerId:4,clientX:20,clientY:0};
  env.updateResize(event);
  env.updateResize({...event,clientX:25});
  assert.deepEqual(calls,[]);
  env.stopResize(true,{...event,clientX:30});
  assert.deepEqual(calls,['restore',{kind:'edge-size',id:n.id,width:430}]);
  assert.equal(env.resizeDrag,null);
  env.resizeDrag={pointer:4,next:{kind:'edge-size',id:n.id,width:480},control:{hasPointerCapture:()=>false},restore:()=>calls.push('cancelled')};
  env.stopResize(false,event);
  assert.equal(calls.at(-1),'cancelled');
});
