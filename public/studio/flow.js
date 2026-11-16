'use strict';

/* Normal-flow drops are intentionally limited to content that can move without
   detaching part of a native card, form, menu, or image mask. */
const StudioFlow = (() => {
  const blocked = 'a,button,form,nav,label,p,ul,ol,dl,li,details,summary,.hero-actions,.therapy-card,.testimonial-card,.reviews-card,.condition-card,.clinic-hours,.contact-form-wrap,.page-hero-photo,.bs-pair';
  function unit(n) {
    if(n?.matches('img')&&n.parentElement?.matches('picture'))return n.parentElement;
    return n;
  }
  function source(n) {
    if(!n?.isConnected||!rowOf(n)||n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-column')||
      n.dataset.bsMove!=='yes'&&!freeShell(n))return false;
    const el=unit(n);
    return !el.parentElement?.closest(blocked)&&!el.matches('input,select,textarea,form')&&
      !el.querySelector('form,input,select,textarea');
  }
  const isSide=side=>side==='left'||side==='right';
  const autoParent=el=>el?.parentElement?.matches('.bs-auto-col')?el.parentElement:null;
  const autoGrid=el=>autoParent(el)?.parentElement;
  function sideAnchor(t){
    const el=unit(t);
    return autoParent(el)||el;
  }
  function target(n,t,side) {
    if(!source(n)||!t?.isConnected||!rowOf(t)||t===n||n.contains(t)||t.contains(n))return false;
    const el=unit(t), origin=unit(n);
    if(origin===el||origin.contains(el)||el.contains(origin)||el.closest('.bs-free-layer')||el.parentElement?.closest(blocked))return false;
    if(isSide(side))return !!sideTarget(t);
    if(side==='inside')return t.hasAttribute('data-bs-column')&&t.children.length===0;
    return ['before','after'].includes(side)&&t.dataset.bsMove==='yes'&&!!el.parentElement;
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
  function noop(n,t,side) {
    const el=unit(t), origin=unit(n);
    return !n.classList.contains('bs-offset-item')&&origin.parentElement===el.parentElement&&neighboring(el,side)===origin;
  }
  function move(n,t,side) {
    if(!target(n,t,side))return false;
    const el=unit(n), dest=unit(t), shell=freeShell(n), old=el.parentElement;
    if(side==='inside')dest.append(el);else dest[side](el);
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
    for(const t of row.querySelectorAll('[data-bs-move="yes"],[data-bs-column]')){
      if(t.closest('[hidden]')||t.closest('details:not([open])')&&!t.closest('summary'))continue;
      const rect=unit(t).getBoundingClientRect();
      if(rect.width<12||rect.height<6)continue;
      if(x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom&&target(n,t,'inside'))
        return {node:t,side:'inside'};
      const candidates=edges(rect,x,y);
      if(!candidates.length||!lane(unit(t)))continue;
      for(const [side,d] of candidates) {
        if(!target(n,t,side))continue;
        const score=d+(hit&&unit(t).contains(hit)?-.5:0);
        if(!best||score<best.score)best={node:t,side,score};
      }
    }
    return best;
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
    if(!parent||el.closest('.bs-free-layer')||parent.closest(blocked))return false;
    return !grid||grid.children.length<StudioColumns.LIMIT;
  }
  function sideEdges(r,x,y){
    if(r.width<36||r.height<8)return [];
    const inset=Math.min(22,r.height*.24);
    if(y<r.top+inset||y>r.bottom-inset)return [];
    const band=Math.min(28,Math.max(12,r.width*.11));
    return [['left',Math.abs(x-r.left)],['right',Math.abs(x-r.right)]].filter(([,d])=>d<=band);
  }
  function sideHit(x,y,n=null,selectedRow=null){
    if(!D.defaultView.matchMedia?.('(min-width: 768px)')?.matches)return null;
    const hit=D.elementFromPoint?.(x,y);
    const row=selectedRow||hit?.closest('[data-bs-row]')||rowList().find(r=>{
      const rect=r.getBoundingClientRect();return y>=rect.top&&y<=rect.bottom&&x>=rect.left-28&&x<=rect.right+28;
    });
    if(!row)return null;
    let best=null;
    for(const t of row.querySelectorAll('[data-bs-move="yes"]')){
      if(t.closest('[hidden],details:not([open])'))continue;
      if(n?!target(n,t,'left'):!sideTarget(t))continue;
      const el=unit(t), r=sideAnchor(t).getBoundingClientRect();
      if(!autoGrid(el)&&!lane(el))continue;
      for(const [side,d] of sideEdges(r,x,y)){
        const score=d+(hit&&el.contains(hit)?-.5:0);
        if(!best||score<best.score)best={node:t,side,score};
      }
    }
    return best;
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
    if(!isSide(side)||!validId(id)||!validId(id+'-c1')||byId(id)||byId(id+'-c0')||byId(id+'-c1')||
       (fromLibrary?!sideTarget(t):!target(n,t,side)))return false;
    const el=unit(n), anchor=unit(t), old=el.parentElement, shell=freeShell(n);
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
  return {unit,source,target,move,edges,find,noop,libraryTarget,placeNew,isSide,sideAnchor,sideEdges,alongside,cleanupAutoColumn,compactAutoGrid};
})();
