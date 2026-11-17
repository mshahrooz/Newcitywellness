'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const grid=fs.readFileSync('public/studio/grid.js','utf8');

test('first-press dragging lifts ordinary blocks, cards and dividers without consuming simple clicks or touch scrolling',()=>{
  const listeners={},calls=[];
  const capture={},doc={documentElement:capture,addEventListener:(name,handler)=>listeners[name]=handler};
  const el=(name,attrs=[])=>({name,dataset:{bsMove:'yes'},closest:()=>null,hasAttribute:k=>attrs.includes(k),
    contains:n=>n===hit});
  const selected=el('selected'),block=el('ordinary'),card=el('card'),divider=el('divider'),section=el('section',['data-bs-row']);
  const hit=el('hit');let picked=block,selection=null,whole=null,line=null;
  const env={now:()=>selection,StudioFlow:{cardOf:()=>whole},dividerFrom:()=>line,targetFrom:()=>picked,
    canDragCanvas:n=>!!n,beginItemDrag:(...args)=>calls.push(args),itemPointerMove:()=>{},itemPointerUp:()=>{},itemPointerCancel:()=>{},
    gridPick:null,mode:'edit',canvasDragTarget:selected};
  vm.runInNewContext(studio.slice(studio.indexOf('function directDragTarget('),studio.indexOf("$('drag').addEventListener('click'"))+'\nbindCanvasDragging(doc);',{...env,doc});
  const down={target:hit,isPrimary:true};
  listeners.pointerdown(down);
  assert.deepEqual(calls[0].slice(0,4),[down,block,capture,true]);
  let suppressed=0;
  const click={detail:1,preventDefault:()=>suppressed++,stopImmediatePropagation:()=>suppressed++};
  listeners.click(click);assert.equal(suppressed,0);
  calls[0][4]();listeners.click(click);assert.equal(suppressed,2);
  listeners.click(click);assert.equal(suppressed,2);
  listeners.pointerdown({...down,pointerType:'touch'});
  assert.equal(calls.length,1);
  whole=card;listeners.pointerdown(down);assert.equal(calls.at(-1)[1],card);
  line=divider;listeners.pointerdown(down);assert.equal(calls.at(-1)[1],divider);
  line=null;whole=null;picked=section;listeners.pointerdown(down);assert.equal(calls.length,3);
  picked=null;selection=selected;listeners.pointerdown({...down,pointerType:'touch'});
  assert.equal(calls.at(-1)[1],selected);
  const formField={closest:()=>true};listeners.pointerdown({target:formField,isPrimary:true});
  assert.equal(calls.length,4);
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
