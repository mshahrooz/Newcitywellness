'use strict';

// The step labels are confirmed events. The in-between percentage is an estimate.
const StudioRelease=(()=>{
  const steps=['Prepare','Save to GitHub','Deploy','Verify live'];
  const phase={idle:-1,prepare:0,checking:0,package:0,commit:1,deploy:2,waiting:2,verify:3,live:4};
  const pace={prepare:[10,5],checking:[22,5],package:[34,5.5],commit:[56,5],deploy:[94,3.5],verify:[99,5.5]};
  const titles={idle:'Ready to publish',prepare:'Preparing your page',checking:'Checking the live version',package:'Packaging your edits',
    commit:'Saving the release',deploy:'Putting your page live',waiting:'Waiting for GitHub Pages',verify:'Verifying the live page',
    live:'Your page is live',error:'Couldn’t publish'};
  const states=new Map(), views=new Map();
  const idle={step:'idle',index:-1,from:0,since:0,message:'Your changes go live when GitHub Pages finishes deploying.'};
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>motion.matches;
  function estimate(state,now){
    const seconds=Math.max(0,(now-state.since)/1000);
    if(state.step==='live'){
      if(reduced())return 100;
      const duration=Math.min(1.5,(100-state.from)*.032);
      return seconds>=duration?100:state.from+(100-state.from)*(seconds/duration);
    }
    const stage=pace[state.step];
    if(!stage)return state.from;
    const [limit,rate]=stage, distance=limit-state.from;
    if(distance<=0)return state.from;
    // Approach each stage's ceiling gently instead of jumping when a stage changes.
    const coast=Math.max(0,(distance-8)/rate);
    if(seconds<=coast)return state.from+seconds*rate;
    return limit-Math.min(8,distance)*Math.exp(-(seconds-coast)*rate/8);
  }
  function meter(view,state,now){
    const value=estimate(state,now), integer=Math.floor(value);
    if(view.integer!==integer){
      view.integer=integer;
      view.track.setAttribute('aria-valuenow',integer);
      view.track.setAttribute('aria-valuetext',integer===100?'100 percent, live page verified':integer+' percent estimated');
      view.number.textContent=integer+'%';
    }
    const width=(reduced()?integer:value).toFixed(2)+'%';
    if(view.width!==width){view.width=width;view.fill.style.width=width;}
    if((pace[state.step]&&value<pace[state.step][0]-.01||state.step==='live'&&value<100)&&
       view.card.isConnected&&!view.card.closest('[hidden]')){
      view.frame=requestAnimationFrame(next=>meter(view,state,next));
    }
  }
  function render(key){
    const view=views.get(key);
    if(!view?.card.isConnected)return;
    const state=states.get(key)||idle;
    view.card.dataset.phase=state.step;
    view.title.textContent=titles[state.step];
    view.note.textContent=state.message;
    view.steps.forEach((item,i)=>{
      const status=i<state.index?'done':i===state.index?(state.step==='error'?'error':'current'):'next';
      item.dataset.state=status;
      item.querySelector('span').textContent=status==='done'?'✓':String(i+1).padStart(2,'0');
      if(status==='current'||status==='error')item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
    });
    view.dismiss.hidden=state.step!=='live';
    if(state.step==='live')view.dismiss.href=state.url;
    cancelAnimationFrame(view.frame);
    view.progress.hidden=state.step==='error';
    view.number.hidden=state.step==='waiting';
    view.label.textContent=state.step==='waiting'?'GitHub Pages is deploying':'Estimated progress';
    if(state.step==='waiting'){
      view.integer=null;view.width='';
      view.track.removeAttribute('aria-valuenow');view.track.removeAttribute('aria-valuetext');
      view.fill.style.width='100%';
    }else meter(view,state,performance.now());
  }
  function set(key,step,message,url){
    const prior=states.get(key)||idle, now=performance.now();
    if(step==='live'&&prior.step===step&&prior.url===url)return;
    states.set(key,{step,message,url,index:phase[step]??Math.max(0,prior?.index??0),
      since:now,from:step==='prepare'?0:estimate(prior,now)});
    render(key);
  }
  function mount(target,parent){
    const key=target[0];
    const card=create('section',{class:'release-card','aria-label':'Publishing progress'});
    const head=create('div',{class:'release-hero'});
    const mark=create('span',{class:'release-mark','aria-hidden':'true'});
    const svg=mark.ownerDocument.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('focusable','false');
    const arrow=mark.ownerDocument.createElementNS(svg.namespaceURI,'path');
    arrow.setAttribute('d','M6 18 18 6M8 6h10v10');svg.append(arrow);mark.append(svg);head.append(mark);
    const copy=create('div',{class:'release-copy'});
    copy.append(create('span',{class:'release-label'},'RELEASE TRACKER'));
    const title=create('h3'), note=create('p'), live=create('div',{role:'status','aria-live':'polite','aria-atomic':'true'});
    live.append(title,note);copy.append(live);head.append(copy);
    const sequence=create('ol',{class:'release-steps','aria-label':'Publish steps'});
    const items=steps.map(label=>{
      const li=create('li');li.append(create('span',{'aria-hidden':'true'}),create('b',{},label));sequence.append(li);return li;
    });
    const progress=create('div',{class:'release-meter'});
    const caption=create('div',{class:'release-meter-caption'});
    const number=create('strong',{'aria-hidden':'true'},'0%');
    const label=create('span',{},'Estimated progress');
    caption.append(label,number);
    const track=create('div',{class:'release-track',role:'progressbar','aria-label':'Publishing milestones','aria-valuemin':'0','aria-valuemax':'100'});
    const fill=create('span',{class:'release-fill'});
    track.append(fill);progress.append(caption,track);
    const dismiss=create('a',{class:'release-live-link',target:'_blank',rel:'noopener noreferrer',hidden:''},'View live page ↗');
    card.append(head,progress,sequence,dismiss);parent.append(card);
    const prior=views.get(key);if(prior)cancelAnimationFrame(prior.frame);
    views.set(key,{card,title,note,steps:items,dismiss,progress,label,track,fill,number,integer:null,width:'',frame:0});
    render(key);
    return card;
  }
  const clearFinished=key=>{if(states.get(key)?.step==='live')states.delete(key);};
  return {mount,set,clearFinished};
})();
