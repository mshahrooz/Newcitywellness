'use strict';

// A release advances only when Studio gets a real result from that stage.
const StudioRelease=(()=>{
  const steps=['Prepare','Save to GitHub','Deploy','Verify live'];
  const phase={idle:-1,prepare:0,commit:1,deploy:2,verify:3,live:4};
  const titles={idle:'Ready to publish',prepare:'Preparing your page',commit:'Saving the release',
    deploy:'Putting your page live',verify:'Verifying the live page',live:'Your page is live',error:'Publishing paused'};
  const states=new Map(), views=new Map();
  function render(key){
    const view=views.get(key);
    if(!view?.card.isConnected)return;
    const state=states.get(key)||{step:'idle',index:-1,message:'Your changes go live when GitHub Pages finishes deploying.'};
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
  }
  function set(key,step,message,url){
    const prior=states.get(key);
    states.set(key,{step,message,url,index:phase[step]??Math.max(0,prior?.index??0)});
    render(key);
  }
  function mount(target,parent){
    const key=target[0];
    const card=create('section',{class:'release-card','aria-label':'Publishing progress'});
    const head=create('div',{class:'release-hero'});
    head.append(create('span',{class:'release-mark','aria-hidden':'true'},'↗'));
    const copy=create('div',{class:'release-copy'});
    copy.append(create('span',{class:'release-label'},'RELEASE TRACKER'));
    const title=create('h3'), note=create('p'), live=create('div',{role:'status','aria-live':'polite','aria-atomic':'true'});
    live.append(title,note);copy.append(live);head.append(copy);
    const sequence=create('ol',{class:'release-steps','aria-label':'Publish steps'});
    const items=steps.map(label=>{
      const li=create('li');li.append(create('span',{'aria-hidden':'true'}),create('b',{},label));sequence.append(li);return li;
    });
    const dismiss=create('a',{class:'release-live-link',target:'_blank',rel:'noopener noreferrer',hidden:''},'View live page ↗');
    card.append(head,sequence,dismiss);parent.append(card);
    views.set(key,{card,title,note,steps:items,dismiss});
    render(key);
    return card;
  }
  const clearFinished=key=>{if(states.get(key)?.step==='live')states.delete(key);};
  return {mount,set,clearFinished};
})();
