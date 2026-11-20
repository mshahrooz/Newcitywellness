'use strict';
const StudioWorkflow=(()=>{
  const slots=new Map(), pendingByPage=new Map();
  const nowKey=()=>canvasEpoch+':'+page[0]+':'+(browserAccount||'');
  const clean=()=>operationsMatch(liveOps)&&StudioPublish.baseOfDraft()===liveSource;
  const stale=()=>!!liveRevision&&StudioPublish.baseOfDraft()!==liveSource;
  let browserAccount=null, timer, browserTimer, pendingWrite=null, hydratedEpoch='', paused=false;
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
  function storePending(k,record){
    pendingByPage.set(k,record);
    try{localStorage.setItem(pendingKey(k),JSON.stringify(record));}catch{}
    touchStatus();
  }
  function submitted(target,id,previousRevision,sha){
    storePending(target[0],{id,at:Date.now(),previousRevision,sha});
  }
  function deploymentFailed(target,id,previousRevision,sha){
    const k=target[0], record=pending(k);
    if(record?.id===id&&record.previousRevision===previousRevision&&record.sha===sha){
      // Keep the submission so a workflow rerun can still be verified later.
      storePending(k,{...record,failed:true});
    }
  }
  function verified(target,state,submittedRaw){
    const k=target[0];
    const record=pending(k);
    if(!record||record.id!==state.publication||record.previousRevision===state.revision)return;
    const url=new URL(target[2]?target[2]+'/':'',StudioPublish.details.LIVE);
    url.searchParams.set('ncw_rev',state.revision);
    StudioRelease.set(k,'live',record.previousRevision?'The previous version is back online.':'The published page is verified and ready for visitors.',url.href);
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
    if(state?.failed){kind='error';message='GitHub Pages deployment failed';}
    else if(state){kind='pending';message=followUp?(state.previousRevision?'Reverting…':'Publishing…'):'Waiting for GitHub Pages';}
    else if(stale()){message='';}
    else if(liveRevision){kind='live';message='Live version verified';}
    if(kind)el.dataset.state=kind;else el.removeAttribute('data-state');
    el.textContent=message;
    const revert=$('revert');
    if(revert){
      revert.hidden=!canRevert();
      if(!revert.hidden)revert.disabled=StudioPublish.isBusy();
    }
  }
  const pendingRelease=(target=page)=>{const state=pending(target[0]);return state&&!state.failed&&Date.now()-state.at<180000?state:null;};
  const latestRelease=(target=page)=>pending(target[0]);
  const isPending=(target=page)=>!!pendingRelease(target);
  const canRevert=()=>mode==='edit'&&!!liveRevision&&!!liveSource&&!switching&&!isPending();
  function draftStatus(){
    if(clean())return null;
    if(!StudioPublish.canCloud())return null;
    const s=slot();
    if(s?.remote)return null;
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
    clearTimeout(browserTimer);
    if(paused||!baselineReady||switching)return;
    if(slot())slot().current=null;
    const mark=nowKey();
    browserTimer=setTimeout(()=>{
      if(!current(mark))return;
      void save();
    },140);
    timer=setTimeout(()=>{
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
        await save();
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
    clearTimeout(browserTimer);
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
      if(!clean()&&!await save()){flash('Autosave is unavailable. Keep this tab open or download your draft before signing out.');return false;}
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
  return {account,schedule,sync,pageReady,connect,disconnect,draftStatus,renderStatus,submitted,deploymentFailed,verified,isPending,pendingRelease,latestRelease,canRevert};
})();
