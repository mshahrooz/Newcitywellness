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
  function target(n,t,side) {
    if(!source(n)||!t?.isConnected||!rowOf(t)||t===n||n.contains(t)||t.contains(n))return false;
    const el=unit(t), origin=unit(n);
    if(origin===el||origin.contains(el)||el.contains(origin)||el.closest('.bs-free-layer')||el.parentElement?.closest(blocked))return false;
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
    const el=unit(n), dest=unit(t), shell=freeShell(n);
    if(side==='inside')dest.append(el);else dest[side](el);
    for(const prop of Array.from(n.style))if(prop.startsWith('--bs-drag-')||prop.startsWith('--bs-safe-drag-'))n.style.removeProperty(prop);
    n.classList.remove('bs-offset-item','bs-offset-inline');
    if(shell) {
      removeFreeContainer(shell);
      for(const slot of D.querySelectorAll('template[data-bs-flow-origin]'))if(slot.dataset.bsFlowOrigin===idOf(n))slot.remove();
    }
    return true;
  }
  function edges(rect,x,y){
    if(rect.width<12||rect.height<6||x<rect.left-10||x>rect.right+10)return [];
    const band=Math.min(23,Math.max(10,rect.height*.34));
    return [['before',Math.abs(y-rect.top)],['after',Math.abs(y-rect.bottom)]].filter(([,d])=>d<=band);
  }
  function find(n,x,y) {
    let best=null;
    if(!source(n)||!freeShell(n)&&['absolute','fixed'].includes(D.defaultView.getComputedStyle(unit(n)).position))return null;
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
  return {unit,source,target,move,edges,find,noop};
})();
