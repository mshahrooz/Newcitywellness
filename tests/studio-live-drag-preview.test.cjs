'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const flowCode=fs.readFileSync('public/studio/flow.js','utf8');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const code=studio.slice(studio.indexOf('function moveLiveCard('),studio.indexOf('function updateDrag('));
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});

function groupFixture(){
  let startX=0,startY=0,canceled=0;
  const group={children:[],scrollLeft:0,scrollTop:0,getBoundingClientRect:()=>rect(startX,startY,410,100)};
  const insert=(node,anchor,after=false)=>{
    group.children.splice(group.children.indexOf(node),1);
    group.children.splice(anchor?group.children.indexOf(anchor)+Number(after):group.children.length,0,node);
  };
  group.insertBefore=insert;
  const animations=[];
  for(const name of ['a','b','c','d']){
    const n={name,parentElement:group,parentNode:group,matches:()=>true,
      get nextSibling(){return group.children[group.children.indexOf(n)+1]||null;},
      getBoundingClientRect:()=>rect(startX+group.children.indexOf(n)*100-group.scrollLeft,startY-group.scrollTop,90,90),
      before:node=>insert(node,n),after:node=>insert(node,n,true),
      animate:(keyframes,options)=>{animations.push({name,keyframes,options});return {cancel(){canceled++;}};},
      removeAttribute(){this.lifted=false;}
    };
    group.children.push(n);
  }
  return {group,animations,countCanceled:()=>canceled,moveGroup:(x,y)=>{startX=x;startY=y;}};
}

test('the lifted card changes its real slot during drag, tracks stable targets, and restores the original order for cancellation',()=>{
  const flow=vm.runInNewContext(flowCode+'\nStudioFlow;');
  const {group,animations,countCanceled,moveGroup}=groupFixture();
  const [a,b,c,d]=group.children;
  const state=flow.captureCardSlots(a);
  const gesture={node:a,cardSlots:state,cardAnimations:[]};
  const D={defaultView:{matchMedia:()=>({matches:false})}};
  const preview=vm.runInNewContext(code+'\n({moveLiveCard,releaseDragItem});',{D});
  let target=flow.cardTarget(a,250,48,state);
  assert.equal(target.node,c);
  preview.moveLiveCard(gesture,target);
  assert.deepEqual(group.children,[b,c,a,d]);
  assert.deepEqual(animations.map(item=>item.name),['b','c']);
  assert.equal(flow.cardTarget(a,250,48,state).node,c);
  moveGroup(0,-25);group.scrollLeft=10;
  target=flow.cardTarget(a,340,30,state);
  assert.equal(target.node,d);
  preview.moveLiveCard(gesture,target);
  assert.deepEqual(group.children,[b,c,d,a]);
  assert.ok(countCanceled()>=2);
  a.lifted=true;
  preview.releaseDragItem(gesture);
  assert.deepEqual(group.children,[a,b,c,d]);
  assert.equal(a.lifted,false);
  assert.equal(gesture.cardAnimations.length,0);
});
