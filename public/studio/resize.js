'use strict';

/* Resize in the existing layout. A pointer move previews, and a release records one edit. */
const StudioResize=(()=>{
  const SECTION_LIMIT=12000;
  const vertical=edge=>edge==='top'||edge==='bottom';
  const signedDelta=(edge,dx,dy)=>
    edge==='left'?-dx:edge==='right'?dx:edge==='top'?-dy:dy;
  const limit=(v,min,max)=>Math.min(max,Math.max(min,v));
  const usable=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=max;
  const isRow=n=>n?.hasAttribute('data-bs-row');
  const edges=n=>!n?.isConnected||n.hasAttribute('data-bs-zone')?[]:
    isRow(n)?['top','bottom']:!n.dataset.bsKind||n.hasAttribute('data-bs-column')||n.matches('main,.ncw,body')?[]:
    ['top','right','bottom','left'];
  const box=n=>isRow(n)?surfaceOf(n):therapyPhoto(n)?n.parentElement:n;
  const media=n=>n.matches('img,iframe,video')?n:
    n.hasAttribute('data-bs-new')&&['image','captioned','video','youtube','embed'].includes(n.dataset.bsKind)?
      n.querySelector('img,iframe,video'):null;
  function applySection(n,op){
    if(!isRow(n))return false;
    const el=box(n), h=bounded(op.value,0,SECTION_LIMIT);
    el.classList.toggle('bs-manual-size',h>0);
    el.style.setProperty('--bs-manual-height',h+'px');
    if(vertical(op.edge))el.style.boxSizing='border-box';
    if(vertical(op.edge)&&typeof op.padding==='number'&&Number.isFinite(op.padding)){
      el.style.setProperty('padding-'+op.edge,Math.round(limit(op.padding,0,SECTION_LIMIT))+'px');
    }
    return true;
  }
  function apply(n,op){
    if(!edges(n).length||isRow(n))return false;
    const el=box(n), shell=freeShell(n);
    const width=usable(op.width,4000), height=usable(op.height,4000);
    if(!width&&!height)return false;
    if(op.p){
      if(!shell||!['desktop','tablet','mobile'].includes(op.device))return false;
      writeCoords(shell,op.device,op.p);
    }
    el.style.boxSizing='border-box';
    if(D.defaultView.getComputedStyle(el).display==='inline'&&el!==media(n))el.style.display='inline-block';
    if(width){
      el.style.width=op.p?'100%':'min(100%, '+Math.round(op.width)+'px)';
      el.style.minWidth='0';
      el.style.maxWidth='100%';
      const parent=el.parentElement&&D.defaultView.getComputedStyle(el.parentElement);
      if(parent&&/flex$/.test(parent.display)&&parent.flexDirection.startsWith('row')){
        el.style.flexBasis=el.style.width;el.style.flexGrow='0';
      }
    }
    if(height){
      const visual=media(n);
      const h=Math.round(op.height)+'px';
      if(visual&&visual===el){
        el.style.height=h;el.style.maxWidth='100%';
        if(el.matches('img,video')&&D.defaultView.getComputedStyle(el).objectFit==='fill')el.style.objectFit='contain';
      }else if(visual&&el!==n){
        el.style.height=h;
      }else if(visual&&n.hasAttribute('data-bs-new')){
        const padding=D.defaultView.getComputedStyle(el);
        const inner=Math.max(8,Math.round(op.height)-(parseFloat(padding.paddingTop)||0)-(parseFloat(padding.paddingBottom)||0));
        visual.style.height=inner+'px';
        if(visual.matches('img,video')){visual.style.objectFit='contain';visual.style.maxWidth='100%';}
      }else if(n.dataset.bsKind==='spacer'){
        const padding=D.defaultView.getComputedStyle(el);
        const inner=Math.max(8,Math.round(op.height)-(parseFloat(padding.paddingTop)||0)-(parseFloat(padding.paddingBottom)||0));
        n.firstElementChild?.style.setProperty('--bs-spacer',inner+'px');
      }else{
        // Text and other content can reflow. A minimum never clips it.
        el.style.minHeight=h;
      }
    }
    return true;
  }
  function snapshot(el){
    const style=el.getAttribute('style');
    return ()=>{if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);};
  }
  function start(n,edge){
    const el=box(n), rect=el.getBoundingClientRect(), row=isRow(n);
    const shell=freeShell(n), zone=shell&&zoneOf(n), device=shell&&devicePlacement();
    const positioned=zone&&(device!=='mobile'||coords(shell,'mobile'));
    const p=positioned?knownPosition(n,zone,device):null;
    const coordName=p?'data-bs-coord-'+device:'';
    const coord=p?shell.getAttribute(coordName):null;
    const styles=[...new Set([el,p&&shell,media(n),!row&&n.dataset.bsKind==='spacer'&&n.firstElementChild].filter(Boolean))].map(snapshot);
    const manual=el.classList.contains('bs-manual-size');
    const padding=row?parseFloat(D.defaultView.getComputedStyle(el).getPropertyValue('padding-'+edge))||0:0;
    return {n,el,edge,row,rect,p,padding,zone,device,zoneWidth:p?zoneDims(zone).width:0,restore(){
      for(const restore of styles)restore();
      if(row)el.classList.toggle('bs-manual-size',manual);
      if(p){if(coord===null)shell.removeAttribute(coordName);else shell.setAttribute(coordName,coord);}
    }};
  }
  function operation(r,amount){
    const {n,rect,edge,row,p,device,zoneWidth}=r, tall=vertical(edge);
    if(Math.abs(amount)<1)return null;
    const id=idOf(n);
    if(row){
      const value=Math.round(limit(rect.height+amount,24,SECTION_LIMIT));
      const op={kind:'section-height',id,value,edge};
      if(edge==='top'&&value>rect.height)op.padding=r.padding+(value-rect.height);
      return op;
    }
    const op={kind:'edge-size',id};
    if(tall)op.height=Math.round(limit(rect.height+amount,8,4000));
    else op.width=Math.round(limit(rect.width+amount,8,4000));
    if(p){
      op.device=device;
      op.p={...p};
      if(tall){
        const h=edge==='top'?Math.min(op.height,rect.height+p.y):op.height;
        op.height=Math.round(h);
        op.p.h=h;
        if(edge==='top')op.p.y=Math.max(0,p.y+rect.height-h);
      }else{
        const min=Math.min(p.w,200/GRID_COLS), max=edge==='left'?p.w+p.x:100-p.x;
        op.p.w=limit(p.w+amount*100/zoneWidth,min,max);
        if(edge==='left')op.p.x=Math.max(0,p.x+p.w-op.p.w);
      }
    }
    return op;
  }
  function preview(r,amount){
    r.restore();
    const op=operation(r,amount);
    if(!op)return null;
    if(r.row){
      if(op.value<r.rect.height&&r.padding>0){
        // Trim available whitespace on the grabbed edge if natural padding prevents a shrink.
        applySection(r.n,op);
        const excess=r.el.getBoundingClientRect().height-op.value;
        if(excess>.5)op.padding=Math.max(0,r.padding-excess);
      }
      applySection(r.n,op);
    }else if(!apply(r.n,op))return null;
    const actual=r.el.getBoundingClientRect();
    return Math.abs((vertical(r.edge)?actual.height-r.rect.height:actual.width-r.rect.width))>=.5?op:null;
  }
  function gripPositions(r){
    const f=r.f, left=Math.max(f.left,r.left), right=Math.min(f.right,r.right);
    const top=Math.max(f.top,r.top), bottom=Math.min(f.bottom,r.bottom);
    if(right-left<3||bottom-top<3)return {};
    const visible=(v,lo,hi)=>v>=lo-.5&&v<=hi+.5;
    const x=(left+right)/2,y=(top+bottom)/2;
    const clampX=v=>limit(v,f.left+8,f.right-8),clampY=v=>limit(v,f.top+8,f.bottom-8);
    return {
      top:visible(r.top,f.top,f.bottom)?[x,clampY(r.top)]:null,
      bottom:visible(r.bottom,f.top,f.bottom)?[x,clampY(r.bottom)]:null,
      left:visible(r.left,f.left,f.right)?[clampX(r.left),y]:null,
      right:visible(r.right,f.left,f.right)?[clampX(r.right),y]:null
    };
  }
  return {SECTION_LIMIT,vertical,signedDelta,edges,box,applySection,apply,start,operation,preview,gripPositions};
})();
