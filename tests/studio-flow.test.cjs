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

test('adjacent layout moves skip hidden anchors and do not move inside nested content',()=>{
  const row={}, parent={closest:()=>null,matches:()=>false};
  const node=(x={})=>({
    isConnected:true,dataset:{bsMove:'yes'},parentElement:parent,hasAttribute:()=>false,
    matches:()=>false,querySelector:()=>null,contains:()=>false,closest:()=>null,...x,
  });
  const above=node({matches:q=>q==='[data-bs-move="yes"]'}), below=node({matches:q=>q==='[data-bs-move="yes"]'});
  const marker=node({matches:()=>true,previousElementSibling:above});
  const n=node({previousElementSibling:marker,nextElementSibling:below});
  const flow=vm.runInNewContext(code+'\nStudioFlow',{rowOf:()=>row,freeShell:()=>null});
  assert.equal(flow.stepTarget(n,-1).node,above);
  assert.equal(flow.stepTarget(n,-1).side,'before');
  assert.equal(flow.stepTarget(n,1).node,below);
  assert.equal(flow.stepTarget(n,1).side,'after');
  n.nextElementSibling=null;
  assert.equal(flow.stepTarget(n,1),null);
});

test('homepage cards move into a peer’s position from the center or nearby gap',()=>{
  const flow=vm.runInNewContext(code+'\nStudioFlow');
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  const group={getBoundingClientRect:()=>rect(20,100,600,260),children:[]};
  for(const [x,y] of [[20,100],[220,100],[420,100],[20,240]])group.children.push({
    parentElement:group,matches:s=>s.includes('.condition-grid > .condition-card'),getBoundingClientRect:()=>rect(x,y,180,120)
  });
  const [a,b,c,d]=group.children;
  assert.equal(flow.cardTarget(a,500,165).node,c);
  assert.equal(flow.cardTarget(a,500,165).side,'after');
  assert.equal(flow.cardTarget(d,110,160).side,'before');
  assert.equal(flow.cardTarget(a,215,165).node,b);
  assert.equal(flow.cardTarget(a,110,160),null);
  assert.equal(flow.cardTarget(a,110,387).node,d);
  assert.equal(flow.cardTarget(a,110,394),null);
});

test('side guides use the visible text edge for wide headings and accept thin rules as vertical targets',()=>{
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
  const heading={matches:s=>s.includes('h1'),getBoundingClientRect:()=>rect(50,70,900,60)};
  const range={selectNodeContents:n=>assert.equal(n,heading),getBoundingClientRect:()=>rect(320,80,360,40)};
  const flow=vm.runInNewContext(code+'\nStudioFlow',{D:{createRange:()=>range}});
  const edge=flow.sideBox(heading);
  assert.deepEqual([edge.left,edge.right,edge.top,edge.bottom],[320,680,70,130]);
  assert.equal(flow.sideEdges(edge,745,100)[0][0],'right');
  assert.equal(flow.edges(rect(30,400,200,1),100,415).length,2);
  const wrapper={getBoundingClientRect:()=>rect(0,0,0,0),firstElementChild:heading};
  assert.equal(flow.layoutBox(wrapper).height,60);
});

test('the live side preview restores the original native block and never writes saved column attributes',()=>{
  const rect={width:100,height:50};
  const make=(tag='div',attrs={})=>{
    const node={tag,attrs:{...attrs},childNodes:[],dataset:{bsMove:'yes'},isConnected:true,getBoundingClientRect:()=>rect,
      get parentElement(){return node.parent;},get children(){return node.childNodes;},matches:()=>false,closest:()=>null,
      getAttribute:k=>node.attrs[k]??null,setAttribute:(k,v)=>{node.attrs[k]=v;},removeAttribute:k=>{delete node.attrs[k];},
      remove(){if(node.parent){const l=node.parent.childNodes;l.splice(l.indexOf(node),1);node.parent=null;}},
      append(...items){for(const n of items){n.remove();n.parent=node;node.childNodes.push(n);}},
      before(n){const p=node.parent;n.remove();p.childNodes.splice(p.childNodes.indexOf(node),0,n);n.parent=p;},
      replaceWith(n){node.before(n);node.remove();},
    };return node;
  };
  const flow=vm.runInNewContext(code+'\nStudioFlow',{rowOf:()=>true,addNative:make});
  const parent=make(),heading=make('h2'),after=make('p'),slot=make('div',{'data-bs-drop-slot':''});
  parent.append(heading,after);
  const restore=flow.previewAside(heading,'right',slot);
  assert.equal(typeof restore,'function');
  const wrapper=parent.children[0];
  assert.equal(wrapper.getAttribute('data-bs-preview-columns'),'');
  assert.equal(wrapper.getAttribute('data-bs-widths'),null);
  assert.equal(wrapper.children[0].children[0],heading);
  assert.equal(wrapper.children[1],slot);
  restore();
  assert.deepEqual(parent.children,[heading,after]);
  assert.equal(heading.parentElement,parent);
});
