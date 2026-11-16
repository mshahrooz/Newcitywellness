'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const code=fs.readFileSync('public/studio/flow.js','utf8');

test('drop bands are limited to the top and bottom of a block',()=>{
  const flow=vm.runInNewContext(code+'\nStudioFlow');
  const r={left:100,right:400,width:300,top:100,bottom:260,height:160};
  for(const [x,y,side] of [[200,95,'before'],[200,253,'after'],[90,261,'after'],[20,100,null],[200,180,null]]){
    assert.equal(flow.edges(r,x,y)[0]?.[0]??null,side);
  }
});

test('ordinary drop moves the responsive picture as one unit and clears free offsets',()=>{
  const row={}, parent={closest:()=>null};
  const removed=[], applied=[];
  const node=(x={})=>({
    isConnected:true,dataset:{bsMove:'yes'},parentElement:parent,hasAttribute:()=>false,
    matches:()=>false,querySelector:()=>null,contains:()=>false,closest:()=>null,...x,
  });
  const picture=node({matches:s=>s==='picture'});
  const img=node({
    matches:s=>s==='img',parentElement:picture,
    style:Object.assign(['--bs-drag-desktop-x','--bs-safe-drag-x','color'],{removeProperty:k=>removed.push(k)}),
    classList:{remove:(...values)=>removed.push(...values)}
  });
  const target=node({after:el=>applied.push(el)});
  const flow=vm.runInNewContext(code+'\nStudioFlow',{rowOf:()=>row,freeShell:()=>null,D:{}});
  assert.equal(flow.move(img,target,'after'),true);
  assert.deepEqual(applied,[picture]);
  assert.deepEqual(removed,['--bs-drag-desktop-x','--bs-safe-drag-x','bs-offset-item','bs-offset-inline']);
  target.parentElement={closest:()=>true};
  assert.equal(flow.move(img,target,'before'),false);
  assert.equal(flow.move(img,img,'after'),false);
});
