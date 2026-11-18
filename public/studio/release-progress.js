'use strict';

// A release advances only when Studio gets a real result from that stage.
const StudioRelease=(()=>{
  const steps=['Prepare','Save to GitHub','Deploy','Verify live'];
  const phase={idle:-1,prepare:0,checking:0,package:0,commit:1,deploy:2,verify:3,live:4};
  const percent={idle:0,prepare:5,checking:14,package:24,commit:40,deploy:65,verify:92,live:100};
  const titles={idle:'Ready to publish',prepare:'Preparing your page',checking:'Checking the live version',package:'Packaging your edits',
    commit:'Saving the release',deploy:'Putting your page live',verify:'Verifying the live page',
    live:'Your page is live',error:'Couldn’t publish'};
  const states=new Map(), views=new Map();
  function render(key){
    const view=views.get(key);
    if(!view?.card.isConnected)return;
    const state=states.get(key)||{step:'idle',index:-1,percent:0,message:'Your changes go live when GitHub Pages finishes deploying.'};
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
    view.track.setAttribute('aria-valuenow',state.percent);
    view.track.setAttribute('aria-valuetext',state.percent+' percent by publishing milestones');
    view.fill.style.width=state.percent+'%';
    if(view.goal!==state.percent){
      cancelAnimationFrame(view.frame);
      const from=Number(view.number.dataset.value||0), to=state.percent, start=performance.now();
      view.goal=to;
      function count(now){
        const t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/420);
        const value=Math.round(from+(to-from)*(1-Math.pow(1-t,2)));
        view.number.dataset.value=value;
        view.number.textContent=value+'%';
        if(t<1&&view.card.isConnected)view.frame=requestAnimationFrame(count);
      }
      count(start);
    }
  }
  function set(key,step,message,url){
    const prior=states.get(key);
    const start=step==='prepare';
    states.set(key,{step,message,url,index:phase[step]??Math.max(0,prior?.index??0),
      percent:start?percent.prepare:Math.max(prior?.percent??0,percent[step]??0)});
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
    caption.append(create('span',{},'Publishing progress'),number);
    const track=create('div',{class:'release-track',role:'progressbar','aria-label':'Publishing milestones','aria-valuemin':'0','aria-valuemax':'100'});
    const fill=create('span',{class:'release-fill'});
    track.append(fill);progress.append(caption,track);
    const dismiss=create('a',{class:'release-live-link',target:'_blank',rel:'noopener noreferrer',hidden:''},'View live page ↗');
    card.append(head,progress,sequence,dismiss);parent.append(card);
    const prior=views.get(key);if(prior)cancelAnimationFrame(prior.frame);
    views.set(key,{card,title,note,steps:items,dismiss,track,fill,number,goal:null,frame:0});
    render(key);
    return card;
  }
  const clearFinished=key=>{if(states.get(key)?.step==='live')states.delete(key);};
  return {mount,set,clearFinished};
})();
