'use strict';
/* Measure the smaller-screen layout before applying an inherited visual offset. */
const StudioResponsiveOffsets = (() => {
  const xProp='--bs-safe-drag-x', yProp='--bs-safe-drag-y';
  const clips=value=>/^(hidden|clip|auto|scroll)$/.test(value);
  const clamp=(amount,min,max)=>Math.min(Math.max(max,0),Math.max(Math.min(min,0),amount));
  function recalc(doc){
    const win=doc?.defaultView;
    if(!win)return;
    const nodes=[...doc.querySelectorAll('.bs-offset-item')];
    for(const el of nodes){
      el.style.removeProperty(xProp);el.style.removeProperty(yProp);
    }
    if(win.innerWidth>900||!win.innerWidth)return;
    for(const el of nodes){
      const css=win.getComputedStyle(el);
      const inline=el.classList.contains('bs-offset-inline');
      const values=inline?[css.left,css.top]:css.translate?.split(/\s+/)||[];
      const pixels=(value,axis)=>{
        const n=parseFloat(value)||0;
        return value?.endsWith('%')?n*(axis==='x'?el.offsetWidth:el.offsetHeight)/100:n;
      };
      const [x,y]=[pixels(values[0],'x'),pixels(values[1],'y')];
      if(!x&&!y)continue;
      const r=el.getBoundingClientRect();
      if(!r.width||!r.height)continue;
      let left=0,right=doc.documentElement.clientWidth||win.innerWidth,top=-Infinity,bottom=Infinity;
      for(let p=el.parentElement;p&&p!==doc.documentElement;p=p.parentElement){
        const look=win.getComputedStyle(p),clipX=clips(look.overflowX),clipY=clips(look.overflowY);
        if(!clipX&&!clipY)continue;
        const box=p.getBoundingClientRect();
        if(clipX){left=Math.max(left,box.left);right=Math.min(right,box.right);}
        if(clipY){top=Math.max(top,box.top);bottom=Math.min(bottom,box.bottom);}
      }
      const safeX=clamp(x,left-(r.left-x),right-(r.right-x));
      const safeY=clamp(y,top-(r.top-y),bottom-(r.bottom-y));
      if(Math.abs(x-safeX)>.5)el.style.setProperty(xProp,safeX+'px');
      if(Math.abs(y-safeY)>.5)el.style.setProperty(yProp,safeY+'px');
    }
  }
  function strip(root){
    root.querySelectorAll('.bs-offset-item').forEach(el=>{
      el.style.removeProperty(xProp);el.style.removeProperty(yProp);
    });
  }
  function observe(doc){
    if(!doc.querySelector('.bs-offset-item'))return;
    const win=doc.defaultView;
    if(!win)return;
    let tick=0;
    const refresh=()=>{win.cancelAnimationFrame(tick);tick=win.requestAnimationFrame(()=>recalc(doc));};
    refresh();
    win.addEventListener('resize',refresh,{passive:true});
    doc.addEventListener('load',refresh,true);
    doc.fonts?.ready.then(refresh);
  }
  return {recalc,strip,observe};
})();
