'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const grid=fs.readFileSync('public/studio/grid.js','utf8');

test('direct canvas drag preserves ordinary clicks and opts only cards and dividers into first-press dragging',()=>{
  const listeners={}, calls=[];
  let eligible=true, card=null, divider=null;
  const capture={}, doc={documentElement:capture,addEventListener:(name,handler)=>listeners[name]=handler};
  const hit={closest:()=>!eligible}, selected={contains:n=>n===hit};
  const env={now:()=>selected,StudioFlow:{cardOf:()=>card},dividerFrom:()=>divider,beginItemDrag:(...args)=>calls.push(args),
    itemPointerMove:()=>{},itemPointerUp:()=>{},itemPointerCancel:()=>{},
    placement:null,gridPick:null,mode:'edit',canvasDragTarget:selected};
  vm.runInNewContext(studio.slice(studio.indexOf('function bindCanvasDragging('),studio.indexOf("$('drag').addEventListener('click'"))+'\nbindCanvasDragging(doc);',{...env,doc});
  const down={target:hit,isPrimary:true};
  listeners.pointerdown(down);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].slice(0,4),[down,selected,capture,true]);
  let suppressed=0;
  const click={detail:1,preventDefault:()=>suppressed++,stopImmediatePropagation:()=>suppressed++};
  listeners.click(click);
  assert.equal(suppressed,0);
  calls[0][4]();
  listeners.click(click);
  assert.equal(suppressed,2);
  listeners.click(click);
  assert.equal(suppressed,2);
  eligible=false;
  listeners.pointerdown(down);
  const elsewhere={closest:()=>null};
  listeners.pointerdown({target:elsewhere,isPrimary:true});
  assert.equal(calls.length,1);
  card={};
  listeners.pointerdown({target:elsewhere,isPrimary:true});
  assert.equal(calls.at(-1)[1],card);
  card=null;
  divider={};
  listeners.pointerdown({target:elsewhere,isPrimary:true});
  assert.equal(calls.at(-1)[1],divider);
});

test('drag grid stays aligned to the active canvas and its scroll offset',()=>{
  const overlay={style:{},hidden:true};
  vm.runInNewContext(
    grid.slice(grid.indexOf('function showDragGrid('),grid.indexOf('function showGridVisual('))+
    '\nshowDragGrid({left:15,top:80,width:768,height:600});',
    {D:{defaultView:{innerWidth:768,scrollX:8,scrollY:29}},GRID_COLS:48,GRID_STEP:12,$:()=>overlay}
  );
  assert.equal(overlay.hidden,false);
  assert.deepEqual(overlay.style,{left:'15px',top:'80px',width:'768px',height:'600px',backgroundSize:'16px 12px',backgroundPosition:'-8px -29px'});
});
