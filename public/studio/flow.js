'use strict';

/* Normal-flow moves keep native widgets intact. Moving within a sibling
   group reorders the group in place without creating columns or wrappers. */
const StudioFlow = (() => {
  // Keep connected widgets intact during structural moves. Their individual
  // pieces can still be positioned visually in their original container.
  const blocked = 'a,button,form,nav,label,p,ul,ol,dl,li,details,summary,.therapy-card,.testimonial-card,.reviews-card,.condition-card,.clinic-hours,.contact-form-wrap,.page-hero-photo,.bs-pair';
  const nativeLane = '.therapy-grid,.testimonial-grid,.reviews-grid,.condition-grid,.hero-actions';
  const cardUnit = 'article,.therapy-card,.testimonial-card,.reviews-card,.condition-card,.service-card,.feature-card,[data-bs-new]';
  const lockedUnit = 'source,track,summary,legend,option,optgroup,svg,picture,script,style,template';
  const strictLane = nativeLane+',.faq-list,.acu-faq-list';
  function unit(n) {
    if(n?.matches('img')&&n.parentElement?.matches('picture'))return n.parentElement;
    return n;
  }
  function source(n) {
    if(!n?.isConnected||!rowOf(n)||n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-column')||
      n.dataset.bsMove!=='yes'&&!freeShell(n))return false;
    const el=unit(n);
    return (!el.parentElement?.closest(blocked)||el.parentElement?.matches(nativeLane))&&!el.matches('input,select,textarea,label');
  }
  const isSide=side=>side==='left'||side==='right';
  const autoParent=el=>el?.parentElement?.matches('.bs-auto-col')?el.parentElement:null;
  const autoGrid=el=>autoParent(el)?.parentElement;
  function sideAnchor(t){
    const el=unit(t);
    return autoParent(el)||el;
  }
  function isNativeSibling(el,dest){
    return el.parentElement===dest.parentElement&&!!el.parentElement?.matches(strictLane);
  }
  function localPair(origin,dest) {
    const parent=origin?.parentElement;
    if(!parent||parent!==dest?.parentElement||origin===dest)return false;
    if(origin.hasAttribute('data-bs-column')&&dest.hasAttribute('data-bs-column')&&parent.matches('.bs-grid'))return true;
    if(!origin.dataset?.bsId||!dest.dataset?.bsId||origin.matches(lockedUnit)||dest.matches(lockedUnit)||
      parent.matches('svg,picture,video,audio,select,thead,tfoot')||parent.closest?.('.bs-free-layer'))return false;
    if(parent.matches(strictLane))return !!origin.dataset.bsKind&&!!dest.dataset.bsKind;
    if(origin.matches('input,textarea,select,label')||dest.matches('input,textarea,select,label'))return false;
    if(!origin.dataset.bsKind||!dest.dataset.bsKind)return false;
    if(origin.matches(cardUnit)&&dest.matches(cardUnit))return true;
    if(origin.localName!==dest.localName||!origin.localName)return false;
    // Reorder matching list entries, fields wrapped in groups, links and label/value stacks
    // without allowing a piece of a widget to move into another widget.
    return origin.matches('li,tr,dd,dt,h2,h3,h4,p,button,a,figure,blockquote,details')||
      !!origin.classList?.length&&Array.from(origin.classList).some(name=>dest.classList?.contains(name));
  }
  function target(n,t,side) {
    if(n&&t&&['before','after'].includes(side)&&n.isConnected&&t.isConnected&&localPair(unit(n),unit(t)))return true;
    if(!source(n)||!t?.isConnected||!rowOf(t)||t===n||n.contains(t)||t.contains(n))return false;
    const el=unit(t), origin=unit(n);
    if(origin===el||origin.contains(el)||el.contains(origin)||el.closest('.bs-free-layer'))return false;
    if(isNativeSibling(origin,el))return ['before','after'].includes(side)||isSide(side)&&origin.parentElement.matches(nativeLane);
    if(el.parentElement?.closest(blocked)||origin.parentElement?.matches(strictLane))return false;
    if(isSide(side))return sideTarget(t);
    if(side==='section-start'||side==='section-end')return t.hasAttribute('data-bs-row')&&t.parentElement===main();
    if(side==='inside')return t.hasAttribute('data-bs-column');
    return ['before','after'].includes(side)&&(t.dataset.bsMove==='yes'||t.matches('.bs-auto-columns[data-bs-id]'))&&!!el.parentElement;
  }
  function lane(el) {
    const win=D.defaultView, css=win.getComputedStyle(el.parentElement);
    if(['absolute','fixed'].includes(win.getComputedStyle(el).position))return false;
    // A horizontal group is not a vertical insertion lane.
    if(css.display.includes('flex')&&!css.flexDirection.startsWith('column')&&css.flexDirection)return false;
    if(css.display.includes('grid')&&css.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length>1)return false;
    return true;
  }
  function neighboring(el,side) {
    let peer=side==='before'?el.previousElementSibling:el.nextElementSibling;
    while(peer?.matches('[hidden],template,[data-bs-drop-slot]'))peer=side==='before'?peer.previousElementSibling:peer.nextElementSibling;
    return peer;
  }
  // Reordering controls follow the rendered lane, never a descendant of the
  // next block. Treat a responsive picture and an automatic group as units.
  function stepTarget(n,step){
    if(!n?.isConnected||![1,-1].includes(step))return null;
    const el=unit(n), side=step<0?'before':'after';
    const nodeIn=peer=>{
      if(peer.matches('[data-bs-move="yes"]'))return peer;
      if(peer.dataset?.bsId&&localPair(el,peer))return peer;
      if(peer.matches('picture'))return peer.querySelector('img[data-bs-move="yes"]');
      if(peer.matches('.bs-auto-columns[data-bs-id]'))return peer;
      return null;
    };
    for(let peer=neighboring(el,side);peer;peer=neighboring(peer,side)){
      const t=nodeIn(peer);
      if(t&&target(n,t,side))return {node:t,side};
    }
    return null;
  }
  function noop(n,t,side) {
    if(!['before','after'].includes(side))return false;
    const el=unit(t), origin=unit(n);
    return !n.classList.contains('bs-offset-item')&&origin.parentElement===el.parentElement&&neighboring(el,side)===origin;
  }
  function move(n,t,side) {
    if(!target(n,t,side))return false;
    const el=unit(n), dest=unit(t), shell=freeShell(n), old=el.parentElement;
    if(el.hasAttribute('data-bs-column')&&dest.hasAttribute('data-bs-column')&&old===dest.parentElement){
      const siblings=Array.from(old.children), widths=StudioColumns.read(old);
      dest[side](el);
      StudioColumns.set(old,Array.from(old.children,c=>widths[siblings.indexOf(c)]));return true;
    }
    if(side==='section-start'||side==='section-end'){if(!placeNew(el,t,side))return false;}
    else if(side==='inside')dest.append(el);else dest[side](el);
    clearOffsets(n,shell);
    if(shell)removeFreeContainer(shell);
    else cleanupAutoColumn(old);
    return true;
  }
  function clearOffsets(n,shell){
    for(const prop of Array.from(n.style))if(prop.startsWith('--bs-drag-')||prop.startsWith('--bs-safe-drag-'))n.style.removeProperty(prop);
    n.classList.remove('bs-offset-item','bs-offset-inline');
    if(shell) {
      for(const slot of D.querySelectorAll('template[data-bs-flow-origin]'))if(slot.dataset.bsFlowOrigin===idOf(n))slot.remove();
    }
  }
  function edges(rect,x,y){
    if(rect.width<12||rect.height<6||x<rect.left-10||x>rect.right+10)return [];
    const band=Math.min(23,Math.max(10,rect.height*.34));
    return [['before',Math.abs(y-rect.top)],['after',Math.abs(y-rect.bottom)]].filter(([,d])=>d<=band);
  }
  function visible(n) {
    const el=unit(n);
    return !el.closest('[hidden]')&&(!el.closest('details:not([open])')||el.matches('details,summary')||!!el.closest('summary'));
  }
  function captureSort(n) {
    const el=unit(n), parent=el?.parentElement;
    if(!parent||n.hasAttribute('data-bs-row'))return null;
    if((n.dataset.bsMove==='yes'&&!el.matches(cardUnit))||el.matches('.bs-new')){
      // Ordinary blocks still support side-by-side column creation on their
      // outer edges. Slot sorting is for cards and contained sibling groups.
      if(!parent.matches(strictLane)&&!parent.closest(blocked))return null;
    }
    const bounds=parent.getBoundingClientRect();
    const children=Array.from(parent.children);
    const slots=children.map((child,index)=>{
      const peer=child.matches('picture')?child.querySelector('img[data-bs-id]'):child;
      if(child!==el&&(!peer||!localPair(el,child)||!visible(peer)))return null;
      const r=child.getBoundingClientRect();
      return r.width>=4&&r.height>=4?{node:peer||n,index,left:r.left-bounds.left+parent.scrollLeft,
        right:r.right-bounds.left+parent.scrollLeft,top:r.top-bounds.top+parent.scrollTop,bottom:r.bottom-bounds.top+parent.scrollTop}:null;
    }).filter(Boolean);
    const ownIndex=children.indexOf(el);
    return slots.length>1&&slots.some(peer=>peer.index===ownIndex)?{n,parent,slots,ownIndex}:null;
  }
  function sortTarget(sort,x,y) {
    if(!sort?.parent.isConnected)return null;
    const {n,parent,slots,ownIndex}=sort;
    const bounds=parent.getBoundingClientRect();
    if(x<bounds.left-16||x>bounds.right+16||y<bounds.top-16||y>bounds.bottom+16)return null;
    const px=x-bounds.left+parent.scrollLeft,py=y-bounds.top+parent.scrollTop;
    let slot=null,score=Infinity;
    for(const item of slots){
      const gap=distance(item,px,py);
      if(gap<score){slot=item;score=gap;}
    }
    if(!slot||score>42)return null;
    const side=slot.index<ownIndex?'before':'after';
    return {node:slot.node,side,sort:true,same:slot.index===ownIndex,source:n};
  }
  function find(n,x,y) {
    let best=null;
    if(!source(n)||!freeShell(n)&&['absolute','fixed'].includes(D.defaultView.getComputedStyle(unit(n)).position))return null;
    const side=sideHit(x,y,n);if(side)return side;
    const hit=D.elementFromPoint?.(x,y);
    // Include targets on either side of a gap, not just the one under the pointer.
    const row=hit?.closest('[data-bs-row]')||rowList().find(r=>{
      const bounds=r.getBoundingClientRect();
      return y>=bounds.top-10&&y<=bounds.bottom+10;
    });
    if(!row)return null;
    let nearest=null;
    for(const t of row.querySelectorAll('[data-bs-move="yes"],[data-bs-column]')){
      if(!visible(t))continue;
      const rect=unit(t).getBoundingClientRect();
      if(rect.width<12||rect.height<6)continue;
      if(!t.children.length&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom&&target(n,t,'inside'))
        return {node:t,side:'inside'};
      const candidates=edges(rect,x,y);
      if(!lane(unit(t)))continue;
      const middle=y<(rect.top+rect.bottom)/2?'before':'after';
      const delta=distance(rect,x,y);
      if(delta<=35&&target(n,t,middle)){
        const score=delta+(hit&&unit(t).contains(hit)?-1:0)+Math.min(1,rect.width*rect.height/1000000);
        if(!nearest||score<nearest.score)nearest={node:t,side:middle,score};
      }
      if(!candidates.length)continue;
      for(const [side,d] of candidates) {
        if(!target(n,t,side))continue;
        const score=d+(hit&&unit(t).contains(hit)?-.5:0);
        if(!best||score<best.score)best={node:t,side,score};
      }
    }
    if(best||nearest)return best||nearest;
    const column=hit?.closest('[data-bs-column]');
    if(column&&target(n,column,'inside'))return {node:column,side:'inside'};
    // Use a clear section edge for cross-section drops. Do not hijack arbitrary
    // drags over existing content that are intended as pixel offsets.
    const r=row.getBoundingClientRect();
    const sideAt=y<r.top+36?'section-start':y>r.bottom-36?'section-end':null;
    return sideAt&&target(n,row,sideAt)?{node:row,side:sideAt}:null;
  }
  function libraryParent(t,side) {
    if(t?.parentElement===main()&&t.hasAttribute('data-bs-row')&&['section-start','section-end'].includes(side))
      return t;
    if(t?.hasAttribute('data-bs-column')&&rowOf(t)&&!t.closest('.bs-free-layer')&&side==='inside')return t;
    if(!t||!rowOf(t)||t.closest('.bs-free-layer')||!['before','after'].includes(side)||t.dataset.bsMove!=='yes')return null;
    const el=unit(t);
    return el.parentElement?.closest(blocked)?null:el.parentElement;
  }
  function placeNew(node,t,side){
    if(!libraryParent(t,side))return false;
    if(side==='section-start'||side==='section-end'){
      const surface=surfaceOf(t);
      if(t.dataset.bsRow==='custom'){
        const columns=t.querySelector(':scope > .bs-row-inner').children;
        const column=side==='section-start'?columns[0]:columns[columns.length-1];
        if(!column)return false;
        if(side==='section-start')column.prepend(node);else column.append(node);
      }else if(side==='section-start')t.insertBefore(node,surface||t.firstChild);
      else if(surface?.parentElement===t)surface.after(node);
      else t.append(node);
    }else if(side==='inside')t.append(node);
    else unit(t)[side](node);
    return true;
  }
  function distance(r,x,y){
    return Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));
  }
  function sectionTarget(n,x,y){
    const hit=D.elementFromPoint?.(x,y);
    if(hit&&!main().contains(hit))return null;
    const rows=rowList().filter(t=>t!==n&&t.getBoundingClientRect().height>1);
    const node=rows.reduce((best,t)=>!best||distance(t.getBoundingClientRect(),x,y)<distance(best.getBoundingClientRect(),x,y)?t:best,null);
    if(!node)return null;
    const r=node.getBoundingClientRect();
    return {node,side:y<(r.top+r.bottom)/2?'before':'after',row:true};
  }
  function libraryTarget(kind,x,y){
    const hit=D.elementFromPoint?.(x,y);
    if(hit&&!main().contains(hit))return null;
    const rows=rowList().filter(row=>{
      const r=row.getBoundingClientRect();return r.width>1&&r.height>1;
    });
    const row=hit?.closest('[data-bs-row]')||rows.reduce((closest,r)=>{
      return !closest||distance(r.getBoundingClientRect(),x,y)<distance(closest.getBoundingClientRect(),x,y)?r:closest;
    },null);
    if(!row)return {node:null,side:'section-end',row:true};
    const bounds=row.getBoundingClientRect();
    if(kind==='row')return {node:row,side:y<(bounds.top+bounds.bottom)/2?'before':'after',row:true};
    const side=sideHit(x,y,null,row);if(side)return side;
    let best=null;
    const col=hit?.closest('[data-bs-column]');
    const scope=col||row;
    for(const t of scope.querySelectorAll('[data-bs-move="yes"]')){
      if(t.closest('[hidden],details:not([open])')||!libraryParent(t,'before')||!lane(unit(t)))continue;
      const r=unit(t).getBoundingClientRect();
      if(r.width<4||r.height<4)continue;
      const d=distance(r,x,y);
      if(!best||d<best.distance||d===best.distance&&unit(t).contains(hit)&&!unit(best.node).contains(hit))
        best={node:t,side:y<(r.top+r.bottom)/2?'before':'after',distance:d};
    }
    if(best&&(col||best.distance<=80))return best;
    if(col&&libraryParent(col,'inside'))return {node:col,side:'inside'};
    return {node:row,side:y<(bounds.top+bounds.bottom)/2?'section-start':'section-end'};
  }
  function sideTarget(t){
    if(!t?.isConnected||!rowOf(t)||t.dataset.bsMove!=='yes')return false;
    const el=unit(t), parent=el.parentElement, grid=autoGrid(el);
    if(!parent||el.closest('.bs-free-layer')||parent.closest(blocked)||parent.matches(strictLane))return false;
    return !grid||grid.children.length<StudioColumns.LIMIT;
  }
  function sideEdges(r,x,y){
    if(r.width<16||r.height<5)return [];
    const overlap=Math.min(28,r.height*.3+6);
    if(y<r.top-overlap||y>r.bottom+overlap)return [];
    const outer=Math.max(64,Math.min(200,r.width*.58));
    const inner=Math.min(100,r.width*.36);
    const nearEnd=y<r.top+Math.min(27,r.height*.20)||y>r.bottom-Math.min(27,r.height*.20);
    const inset=nearEnd?Math.min(10,inner):inner;
    const vertical=Math.max(r.top-y,0,y-r.bottom);
    return [
      ['left', x>=r.left-outer&&x<=r.left+inset, Math.abs(x-r.left)+vertical*1.65],
      ['right', x<=r.right+outer&&x>=r.right-inset, Math.abs(x-r.right)+vertical*1.65]
    ].filter(([,ok])=>ok).map(([side,,score])=>[side,score]);
  }
  function sideHit(x,y,n=null,selectedRow=null){
    if(!D.defaultView.matchMedia?.('(min-width: 768px)')?.matches)return null;
    const hit=D.elementFromPoint?.(x,y);
    const row=selectedRow||hit?.closest('[data-bs-row]')||rowList().find(r=>{
      const rect=r.getBoundingClientRect();return y>=rect.top-14&&y<=rect.bottom+14&&x>=rect.left-200&&x<=rect.right+200;
    });
    if(!row)return null;
    // Top and bottom insertion take priority when directly over those edges.
    const column=hit?.closest('[data-bs-column]');
    if(column){
      const c=column.getBoundingClientRect(), inset=Math.min(44,c.width*.15);
      if(x>c.left+inset&&x<c.right-inset&&!column.querySelector('[data-bs-move="yes"]'))return null;
    }
    let best=null, stack=Infinity;
    for(const t of row.querySelectorAll('[data-bs-move="yes"]')){
      if(t.closest('[hidden]')||t.parentElement?.closest('details:not([open])'))continue;
      const el=unit(t), native=n&&isNativeSibling(unit(n),el)&&el.parentElement.matches(nativeLane);
      if(n?!target(n,t,'left'):!sideTarget(t))continue;
      const anchor=sideAnchor(t), r=anchor.getBoundingClientRect();
      const probes=sideEdges(r,x,y);
      if(!probes.length)continue;
      if(!autoGrid(el)&&!native&&!lane(el))continue;
      const candidateColumn=el.closest('[data-bs-column]');
      const vertical=el.getBoundingClientRect();
      if(!native&&(!column||candidateColumn===column)&&x>=vertical.left+9&&x<=vertical.right-9){
        for(const [,distance] of edges(vertical,x,y))stack=Math.min(stack,distance);
      }
      for(const [side,d] of probes){
        const outside=x<r.left||x>r.right;
        if(column&&column!==candidateColumn&&!outside)continue;
        const group=autoGrid(el);
        const owned=column&&group?.contains(column);
        const score=d+(column&&column!==candidateColumn&&!owned?38:0)+(hit&&el.contains(hit)?-3:0);
        if(!best||score<best.score)best={node:t,side,score,native};
      }
    }
    // A small overlap of the two zones is intentional. A close horizontal
    // edge keeps precise side drops possible while top/bottom wins in the middle.
    return best&&best.score<=stack+26?best:null;
  }
  function cleanupAutoColumn(column){
    const grid=column?.matches('.bs-auto-col')&&column.parentElement;
    if(!grid||column.children.length)return;
    const widths=StudioColumns.read(grid);
    widths.splice(Array.from(grid.children).indexOf(column),1);
    column.remove();compactAutoGrid(grid,widths);
  }
  function compactAutoGrid(grid,widths){
    if(!grid.children.length)grid.remove();
    else if(grid.children.length===1)grid.replaceWith(...grid.firstElementChild.childNodes);
    else StudioColumns.set(grid,widths);
  }
  function alongside(n,t,side,id,fromLibrary=false){
    if(!n||!isSide(side)||!validId(id)||!validId(id+'-c1')||byId(id)||byId(id+'-c0')||byId(id+'-c1')||
       (fromLibrary?!sideTarget(t):!target(n,t,side)))return false;
    const el=unit(n), anchor=unit(t), old=el.parentElement, shell=freeShell(n);
    if(isNativeSibling(el,anchor)){
      anchor[side==='left'?'before':'after'](el);
      clearOffsets(n,shell);return true;
    }
    let grid=autoGrid(anchor);
    const current=autoParent(anchor);
    if(grid&&old?.parentElement===grid&&old!==current&&old.children.length===1){
      const columns=Array.from(grid.children), widths=StudioColumns.read(grid);
      current[side==='left'?'before':'after'](old);
      StudioColumns.set(grid,Array.from(grid.children,c=>widths[columns.indexOf(c)]));
    }else if(grid){
      const widths=StudioColumns.read(grid), at=Array.from(grid.children).indexOf(current);
      const column=addNative('div',{class:'bs-col bs-auto-col','data-bs-id':id+'-c0','data-bs-column':''});
      current[side==='left'?'before':'after'](column);
      const actual=widths[at]/2;
      widths[at]=actual;widths.splice(at+(side==='left'?0:1),0,actual);
      column.append(el);StudioColumns.set(grid,widths);
    }else{
      grid=addNative('div',{class:'bs-grid bs-auto-columns','data-bs-id':id});
      const a=addNative('div',{class:'bs-col bs-auto-col','data-bs-id':id+'-c0','data-bs-column':''});
      const b=addNative('div',{class:'bs-col bs-auto-col','data-bs-id':id+'-c1','data-bs-column':''});
      anchor.before(grid);grid.append(a,b);
      (side==='left'?a:b).append(el);(side==='left'?b:a).append(anchor);
      StudioColumns.set(grid,[1,1]);
    }
    clearOffsets(n,shell);
    if(shell)removeFreeContainer(shell);else cleanupAutoColumn(old);
    return true;
  }
  return {unit,source,target,move,edges,find,noop,stepTarget,captureSort,sortTarget,libraryTarget,sectionTarget,placeNew,isSide,sideAnchor,sideEdges,alongside,cleanupAutoColumn,compactAutoGrid};
})();
