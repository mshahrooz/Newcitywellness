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
  const row={}, parent={closest:()=>null,matches:()=>false};
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

test('library fallback places a new item inside an existing section without creating a new row',()=>{
  const mainElement={};
  const inserted=[];
  const row={
    parentElement:mainElement,dataset:{bsRow:'native'},
    hasAttribute:n=>n==='data-bs-row',
    insertBefore:(node,reference)=>inserted.push(['start',node,reference]),
  };
  const surface={parentElement:row,after:node=>inserted.push(['end',node])};
  const flow=vm.runInNewContext(code+'\nStudioFlow',{main:()=>mainElement,surfaceOf:()=>surface,rowOf:()=>row});
  const node={};
  assert(flow.placeNew(node,row,'section-start'));
  assert(flow.placeNew(node,row,'section-end'));
  assert.deepEqual(inserted,[['start',node,surface],['end',node]]);
});

test('library drops prefer the selected column or nearest safe block and ignore the site header',()=>{
  const mainElement={contains:node=>node!==header}, header={};
  const r=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
  const nearby={
    dataset:{bsMove:'yes'},matches:()=>false,hasAttribute:()=>false,closest:()=>null,contains:node=>node===nearby,
    parentElement:{closest:()=>null},getBoundingClientRect:()=>r(20,70,300,110)
  };
  const column={
    closest:()=>null,hasAttribute:n=>n==='data-bs-column',querySelectorAll:()=>[],
    getBoundingClientRect:()=>r(320,0,600,180)
  };
  const row={
    parentElement:mainElement,getBoundingClientRect:()=>r(0,0,600,180),
    hasAttribute:n=>n==='data-bs-row',querySelectorAll:()=>[nearby]
  };
  let hit={closest:selector=>selector==='[data-bs-row]'?row:null};
  const D={elementFromPoint:()=>hit,defaultView:{getComputedStyle:()=>({display:'block',position:'static'})}};
  const flow=vm.runInNewContext(code+'\nStudioFlow',{D,main:()=>mainElement,rowList:()=>[row],rowOf:()=>row});
  assert.equal(flow.libraryTarget('title',140,72).node,nearby);
  assert.equal(flow.libraryTarget('title',140,108).side,'after');
  assert.equal(flow.libraryTarget('row',140,108).row,true);
  hit={closest:selector=>selector==='[data-bs-column]'?column:row};
  assert.equal(flow.libraryTarget('title',420,90).node,column);
  assert.equal(flow.libraryTarget('title',420,90).side,'inside');
  hit=header;
  assert.equal(flow.libraryTarget('title',150,20),null);
});

test('horizontal edge targets leave the top and bottom available for stacking',()=>{
  const flow=vm.runInNewContext(code+'\nStudioFlow');
  const r={left:100,right:400,width:300,top:100,bottom:260,height:160};
  assert.equal(flow.sideEdges(r,103,170)[0][0],'left');
  assert.equal(flow.sideEdges(r,407,170)[0][0],'right');
  assert.equal(flow.sideEdges(r,160,102).length,0);
  assert.equal(flow.sideEdges(r,340,258).length,0);
  assert.equal(flow.sideEdges(r,240,170).length,0);
  assert.equal(flow.sideEdges(r,40,160)[0][0],'left');
  assert.equal(flow.sideEdges(r,550,165)[0][0],'right');
  assert.equal(flow.sideEdges(r,320,170)[0][0],'right');
});

test('native visual groups permit moving sibling cards while a form field stays within its form',()=>{
  const row={}, grid={matches:q=>q.includes('.therapy-grid'),closest:()=>null}, form={matches:()=>false,closest:()=>true};
  const element=(parent,isInput=false)=>({
    isConnected:true,dataset:{bsMove:'yes'},parentElement:parent,hasAttribute:()=>false,
    matches:q=>isInput&&q.includes('input'),contains:()=>false,closest:()=>null,
  });
  const flow=vm.runInNewContext(code+'\nStudioFlow',{rowOf:()=>row,freeShell:()=>null});
  const a=element(grid), b=element(grid);
  assert.equal(flow.target(a,b,'left'),true);
  assert.equal(flow.source(element(form,true)),false);
  assert.equal(flow.target(a,a,'left'),false);
});
