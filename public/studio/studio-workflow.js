'use strict';
const StudioWorkflow=(()=>{
  const slots=new Map(), pendingByPage=new Map();
  const nowKey=()=>canvasEpoch+':'+page[0]+':'+(browserAccount||'');
  const clean=()=>operationsMatch(liveOps)&&StudioPublish.baseOfDraft()===liveSource;
  const stale=()=>!!liveRevision&&StudioPublish.baseOfDraft()!==liveSource;
  let browserAccount=null, timer, pendingWrite=null, hydratedEpoch='', paused=false;
  const key=()=>browserAccount+':'+page[0];
  const slot=()=>slots.get(key());
  const account=()=>browserAccount;
  const current=k=>nowKey()===k&&baselineReady&&!switching;
  const touchStatus=()=>{
    if(typeof StudioPublish==='undefined')return;
    showState();
  };
  const pendingKey=k=>'ncw.studio.publishing.'+k;
  function pending(k){
    if(!pendingByPage.has(k)){
      let stored=null;
      try{stored=JSON.parse(localStorage.getItem(pendingKey(k)));}catch{}
      const hasId=/^[a-f0-9-]{36}$/.test(stored?.id)||stored?.id===null&&/^[a-f0-9]{24}$/.test(stored.previousRevision);
      if(!hasId||!Number.isFinite(stored.at)||Date.now()-stored.at>86400000)stored=null;
      pendingByPage.set(k,stored);
    }
    return pendingByPage.get(k);
  }
  function submitted(target,id,previousRevision){
    const record={id,at:Date.now(),previousRevision}, k=target[0];
    pendingByPage.set(k,record);
    try{localStorage.setItem(pendingKey(k),JSON.stringify(record));}catch{}
    touchStatus();
  }
  function verified(target,state,submittedRaw){
    const k=target[0];
    const record=pending(k);
    if(!record||record.id!==state.publication||record.previousRevision===state.revision)return;
    pendingByPage.delete(k);
    try{localStorage.removeItem(pendingKey(k));}catch{}
    const cloud=slots.get(browserAccount+':'+k), user=browserAccount;
    if(!cloud||!submittedRaw)return;
    void (async()=>{
      await cloud.task;
      if(user!==browserAccount||!cloud.revision||cloud.raw!==submittedRaw||cloud.remote)return;
      // Remove only the exact saved draft that became live, never a newer cloud draft.
      const revision=cloud.revision;
      await StudioPublish.action('draft-clear',{revision},target);
      if(cloud.revision===revision){cloud.revision=null;cloud.raw=null;touchStatus();}
    })().catch(()=>{});

  }
  function renderStatus(){
    const el=$('publish-status'), state=pending(page[0]);
    let kind='', message='Ready to edit';
    const followUp=!!state&&Date.now()-state.at<180000;
    if(state){kind='pending';message=followUp?(state.previousRevision?'Reverting…':'Publishing…'):'Waiting for GitHub Pages';}
    else if(stale()){kind='conflict';message='Newer live version';}
    else if(liveRevision){kind='live';message='Live version verified';}
    if(kind)el.dataset.state=kind;else el.removeAttribute('data-state');
    el.textContent=message;
    const revert=$('revert');
    if(revert){
      revert.hidden=!canRevert();
      if(!revert.hidden)revert.disabled=StudioPublish.isBusy();
    }
    const conflict=$('draft-conflict');
    if(conflict)conflict.hidden=mode!=='edit'||(!stale()&&!slot()?.remote);
  }
  const isPending=(target=page)=>{const state=pending(target[0]);return !!state&&Date.now()-state.at<180000;};
  const canRevert=()=>mode==='edit'&&!!liveRevision&&!!liveSource&&!switching&&!isPending();
  function draftStatus(){
    if(clean())return null;
    if(!StudioPublish.canCloud())return null;
    const s=slot();
    if(s?.remote)return 'Draft needs review';
    if(s?.error)return 'Cloud unavailable · browser copy kept';
    if(s?.raw&&s.raw===s.current)return 'Draft saved to your account';
    if(s?.task)return 'Syncing draft…';
    return null;
  }
  async function pack(raw){
    if(typeof CompressionStream!=='function')throw Error('This browser cannot sync compressed drafts. Use the local draft or download it.');
    const pipe=new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    const zip=await new Response(pipe).blob();
    if(zip.size>32*1024*1024)throw Error('This draft is too large to sync. Your browser copy is unchanged.');
    return zip;
  }
  async function unpack(response){
    if(typeof DecompressionStream!=='function'||!response.body)throw Error('This browser cannot open compressed drafts.');
    const reader=response.body.pipeThrough(new DecompressionStream('gzip')).getReader();
    const decoder=new TextDecoder(), parts=[];
    let size=0;
    try{
      while(true){
        const {value,done}=await reader.read();
        if(done)break;
        size+=value.byteLength;
        if(size>MAX_JSON){await reader.cancel();throw Error('This cloud draft is too large to open.');}
        parts.push(decoder.decode(value,{stream:true}));
      }
      parts.push(decoder.decode());
      return parts.join('');
    }finally{reader.releaseLock();}
  }
  const sameDraft=(a,b)=>a===b||!!(a&&b&&(()=>{
    const x=JSON.parse(a), y=JSON.parse(b);
    return x.publishedBase===y.publishedBase&&sameOperations(x.operations,y.operations);
  })());
  async function readRemote(target){
    const info=(await StudioPublish.action('draft-info',{},target)).draft;
    if(!info)return null;
    const raw=await unpack(await StudioPublish.action('draft-read',{revision:info.revision},target,null,true));
    return {...info,raw};
  }
  function schedule(){
    clearTimeout(timer);
    if(paused||!baselineReady||switching)return;
    if(slot())slot().current=null;
    const mark=nowKey();
    timer=setTimeout(async()=>{
      if(!current(mark))return;
      await save({quiet:true});
      if(current(mark))void sync({allowClear:true});
    },750);
  }
  async function hydrate(s,target,mark){
    const remote=await readRemote(target);
    if(!current(mark))return false;
    if(remote){
      const ops=readDraft(remote.raw), ours=draftString(), anchor=JSON.parse(remote.raw).publishedBase||null;
      if(sameDraft(remote.raw,ours)){
        s.revision=remote.revision;s.raw=ours;s.current=ours;
      }else if(clean()&&liveRevision&&anchor===liveSource&&safeToSync()&&mode==='edit'){
        s.revision=remote.revision;s.raw=remote.raw;s.current=remote.raw;
        setDraft(remote.raw,ops);
        await save({quiet:true});
        if(current(mark))flash('Draft opened from your account.');
      }else s.remote=remote;
    }
    s.ready=true;return true;
  }
  async function sync({allowClear=false}={}){
    if(paused||!baselineReady||switching||!browserAccount||!StudioPublish.canCloud()||!liveRevision)return;
    const target=page, mark=nowKey(), k=key();
    if(!slots.has(k))slots.set(k,{});
    const s=slots.get(k);
    if(s.task){
      s.again=true;s.allowClear=s.allowClear||allowClear;
      return s.task;
    }
    const run=(async()=>{
      try{
        s.error=null;
        const hadCloud=s.ready&&s.revision;
        if(!s.ready&&!await hydrate(s,target,mark))return;
        if(!current(mark)||s.remote)return;
        if(clean()){
          if(allowClear&&hadCloud&&s.revision&&s.raw){
            const cleared=s.revision;
            try{
              await StudioPublish.action('draft-clear',{revision:cleared},target);
              if(s.revision===cleared){s.revision=null;s.raw=null;s.current=null;}
            }catch(error){
              if(error.status!==409)throw error;
              s.remote=await readRemote(target);
            }
          }
          return;
        }
        const raw=draftString();
        s.current=raw;
        if(s.raw&&sameDraft(raw,s.raw)){s.raw=raw;return;}
        const compressed=await pack(raw);
        if(!current(mark)||draftString()!==raw)return;
        try{
          const result=await StudioPublish.action('draft-write',{revision:s.revision,bytes:compressed.size},target,compressed);
          s.revision=result.draft.revision;s.raw=raw;
        }catch(error){
          if(error.status!==409)throw error;
          s.remote=await readRemote(target)||{raw:null,revision:null,updated_at:null};
        }
      }catch(e){s.error=e.message;}
    })();
    s.task=run;pendingWrite=run;touchStatus();
    try{await run;}finally{
      s.task=null;if(pendingWrite===run)pendingWrite=null;
      const again=s.again, clearAfter=s.allowClear;
      s.again=false;s.allowClear=false;
      if(current(mark))touchStatus();
      if(again&&slot()===s)void sync({allowClear:clearAfter});
      else if(current(mark)&&!s.remote&&!s.error&&!clean()&&s.current&&s.current!==draftString())schedule();
    }
  }
  function pageReady(){
    const mark=nowKey();
    if(mark!==hydratedEpoch){hydratedEpoch=mark;if(slot()){slot().ready=false;slot().remote=null;}}
    void sync();
  }
  async function connect(user){
    if(!user||!baselineReady)return;
    clearTimeout(timer);
    await saveQueue;
    if(browserAccount&&browserAccount!==user){
      list=liveOps.slice();cursor=list.length;savedOps=list.slice();active=null;StudioPublish.bindSource(liveSource);replay();
    }
    browserAccount=user;
    const mark=nowKey(), own=await readBrowserDraft(storageKey()).catch(()=>null);
    if(!current(mark))return;
    if(own){
      try{
        const operations=readDraft(own);
        if(clean()&&!sameOperations(operations,liveOps))setDraft(own,operations);
        else if(!sameDraft(own,draftString()))await recoverLater(own);
      }catch{/* A damaged local copy must not block cloud sign-in. */}
    }
    if(current(mark)){pageReady();if(!clean())schedule();}
  }
  async function disconnect(){
    if(!browserAccount)return;
    paused=true;clearTimeout(timer);
    try{
      if(!clean()&&!await save({quiet:true})){flash('Save or download this draft before signing out.');return false;}
      if(pendingWrite)await pendingWrite;
      browserAccount=null;slots.clear();
      const mark=nowKey();
      const local=await readBrowserDraft(storageKey()).catch(()=>null);
      if(!current(mark))return true;
      if(local){try{setDraft(local);return true;}catch{}}
      setDraft(JSON.stringify({version:1,page:pageIdentity(),operations:liveOps,publishedBase:liveSource}),liveOps);
      return true;
    }finally{paused=false;}
  }
  function resolveDraft(){
    const place=open('Keep your unpublished edits','DRAFT CONFLICT');
    const s=slot(), remote=s?.remote, mark=nowKey(), actions=group();
    const status=create('p',{class:'muted',role:'status'});actions.before(status);
    if(!remote){
      if(!stale()){close();return;}
      status.textContent='This draft was based on an earlier live version. Open the live page, or keep this draft for review. If you later publish this draft, it can replace changes made on the live page since you started.';
      button(actions,'Download this draft',()=>exportFile(draftString(),pageIdentity()+'-draft.json','application/json'));
      const review=button(actions,'Keep this draft for review',async()=>{
        if(!current(mark))return;
        const buttons=[...actions.querySelectorAll('button')], picker=$('page-picker');
        for(const b of buttons)b.disabled=true;
        if(picker)picker.disabled=true;
        try{
          await StudioPublish.reviewBase();
          if(current(mark)&&status.isConnected){close();flash('Draft kept. Review the page before using Publish Website. Nothing was published.');}
        }catch(error){status.textContent=error.message;}
        finally{for(const b of buttons)b.disabled=false;if(picker&&current(mark))picker.disabled=false;}
      });
      review.disabled=!StudioPublish.canCloud();
      button(actions,'Open live page in Studio',async()=>{
        const raw=draftString();
        if(!await recoverLater(raw)){status.textContent='The older draft could not be saved. Download it before opening the live page.';return;}
        if(!current(mark)||!status.isConnected||raw!==draftString())return;
        setDraft(JSON.stringify({version:1,page:pageIdentity(),operations:liveOps,publishedBase:liveSource}),liveOps);
        await save({quiet:true});close();flash('Live page opened. Your earlier draft was backed up.');
      });
      place();return;
    }
    status.textContent=remote.raw?'A separate draft was saved to your account. Choose which copy to edit. Nothing will be published.':'The cloud copy changed on another device.';
    async function exchange(useCloud){
      for(const b of actions.querySelectorAll('button'))b.disabled=true;
      try{
        if(!current(mark)||slot()!==s||s.remote!==remote)return;
        if(useCloud){
          const ops=readDraft(remote.raw);
          if(!clean()&&!await recoverLater(draftString()))throw Error('The current draft could not be backed up.');
          if(!current(mark))return;
          setDraft(remote.raw,ops);s.raw=remote.raw;s.current=remote.raw;
          await save({quiet:true});
        }else{
          if(remote.raw&&!await recoverLater(remote.raw))throw Error('The other draft could not be backed up.');
          s.raw=null;
        }
        s.revision=remote.revision;s.remote=null;s.error=null;
        if(current(mark)){schedule();close();showState();flash(useCloud?'Cloud copy opened.':'Browser copy kept.');}
      }catch(error){status.textContent=error.message;}
      finally{for(const b of actions.querySelectorAll('button'))b.disabled=false;}
    }
    if(remote.raw)button(actions,'Open cloud copy',()=>exchange(true));
    button(actions,'Keep browser copy',()=>exchange(false));place();
  }
  function start(){
    $('draft-conflict').onclick=resolveDraft;
  }
  return {start,account,schedule,sync,pageReady,connect,disconnect,draftStatus,renderStatus,submitted,verified,isPending,canRevert,resolveDraft};
})();
