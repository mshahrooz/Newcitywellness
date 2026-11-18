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
      if(!/^[a-f0-9-]{36}$/.test(stored?.id)||!Number.isFinite(stored?.at)||Date.now()-stored.at>86400000)stored=null;
      pendingByPage.set(k,stored);
    }
    return pendingByPage.get(k);
  }
  function submitted(target,id){
    const record={id,at:Date.now()}, k=target[0];
    pendingByPage.set(k,record);
    try{localStorage.setItem(pendingKey(k),JSON.stringify(record));}catch{}
    touchStatus();
  }
  function verified(target,state,submittedRaw){
    const k=target[0];
    if(pending(k)?.id!==state.publication)return;
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
    if(state){kind='pending';message=Date.now()-state.at>180000?'Waiting for GitHub Pages':'Publishing…';}
    else if(stale()){kind='conflict';message='Newer live version';}
    else if(liveRevision){kind='live';message='Live version verified';}
    if(kind)el.dataset.state=kind;else el.removeAttribute('data-state');
    el.textContent=message;
  }
  const isPending=(target=page)=>{const state=pending(target[0]);return !!state&&Date.now()-state.at<180000;};
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
    if(s.task)return;
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
      if(current(mark)){
        touchStatus();
        if(!s.remote&&!s.error&&!clean()&&s.current&&s.current!==draftString())schedule();
      }
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
  function cloudPanel(){
    toggleMenu(false);
    const place=open('Cloud draft · '+page[1],'DRAFT TOOLS');
    const actions=group(), status=create('p',{class:'muted',role:'status'});
    actions.before(status);
    if(!StudioPublish.canCloud()){
      status.textContent='Sign in with your approved publisher account to save a private copy of this draft across computers.';
      button(actions,'Open publisher sign-in',()=>$('publish').click());place();return;
    }
    const s=slot(), remote=s?.remote;
    if(!remote){
      status.textContent=s?.error||(!s?.ready?'Checking your account for a draft…':s.raw?'This draft syncs to your account. It is not published.':'No cloud draft for this page yet. Edits sync automatically.');
      button(actions,'Sync now',async()=>{await sync();if(status.isConnected)cloudPanel();});
      if(!s?.ready&&!s?.error)void sync().then(()=>{if(status.isConnected&&slot()?.ready)cloudPanel();});
      place();return;
    }
    status.textContent=(remote.updated_at?'A different cloud draft was saved '+formatDate(remote.updated_at)+'.':'The cloud copy was removed on another device.')+' Choose which copy to continue editing. Nothing will be published.';
    const mark=nowKey();
    const exchange=async useCloud=>{
      for(const b of actions.querySelectorAll('button'))b.disabled=true;
      try{
        if(!current(mark)||slot()!==s||!s.remote)return;
        if(useCloud){
          if(!remote.raw)throw Error('There is no cloud draft to open.');
          if(!clean()&&!await recoverLater(draftString()))throw Error('The current draft could not be backed up. Download it first.');
          const ops=readDraft(remote.raw);
          if(!current(mark))return;
          setDraft(remote.raw,ops);s.raw=remote.raw;s.current=remote.raw;
          await save({quiet:true});
        }else{
          if(remote.raw&&!await recoverLater(remote.raw))throw Error('The other draft could not be backed up. Your cloud copy is unchanged.');
          s.raw=null;
        }
        s.revision=remote.revision;s.remote=null;s.error=null;
        if(current(mark)){schedule();close();flash(useCloud?'Cloud draft opened.':'Browser draft kept. The other copy is in Recovered drafts.');}
      }catch(error){status.textContent=error.message;}
      finally{for(const b of actions.querySelectorAll('button'))b.disabled=false;}
    };
    if(remote.raw)button(actions,'Open cloud copy',()=>exchange(true));
    button(actions,'Keep this browser copy',()=>exchange(false));place();
  }
  async function forgetCloud(){
    const target=page,s=slot();
    if(!s?.ready||!s.revision||s.remote||!StudioPublish.canCloud())return;
    try{
      if(s.task)await s.task;
      if(!s.revision||s.remote)return;
      await StudioPublish.action('draft-clear',{revision:s.revision},target);
      s.revision=null;s.raw=null;s.error=null;touchStatus();
    }catch(e){flash('Browser draft reset. The cloud copy was not removed.');}
  }
  const operationNames={
    text:'Edited text', part:'Edited text', link:'Changed a link', image:'Replaced an image', alt:'Edited image alt text', file:'Changed a document',
    move:'Moved an item', 'flow-move':'Moved an item','drag-offset':'Changed position','edge-size':'Resized an element','section-height':'Resized a section',
    'section-name':'Renamed a section',remove:'Removed an item',duplicate:'Duplicated an item',seo:'Edited page SEO',columns:'Changed columns',
    'column-widths':'Adjusted column widths','device-layout':'Changed responsive layout','row-add':'Added a section',add:'Added an item',
    'palette-add':'Added an item','grid-add':'Added an item','grid-place':'Moved an item', 'section-bg':'Changed the background',
    align:'Changed alignment',pad:'Changed spacing','font-size':'Changed text size','text-color':'Changed text color',
  };
  const dataKinds=new Set(['text','part','link','alt','section-name']);
  const opFields=op=>JSON.stringify([op.kind,op.id,op.device,op.edge]);
  function diff(before,after){
    let prefix=0;
    while(prefix<before.length&&prefix<after.length&&JSON.stringify(before[prefix])===JSON.stringify(after[prefix]))prefix++;
    // Group edits to the same setting; omit earlier keystrokes. Keep order-sensitive moves and additions.
    const a=before.slice(prefix), b=after.slice(prefix);
    const repeated=new Set(['text','part','link','alt','section-name','pad','font-size','text-color','align','seo','device-layout','section-overlay']);
    const used=new Set(), changes=[];
    for(let i=b.length-1;i>=0;i--){
      const right=b[i], key=opFields(right);
      if(repeated.has(right.kind)&&used.has(key))continue;
      used.add(key);
      const left=repeated.has(right.kind)?[...before].reverse().find(x=>opFields(x)===key):undefined;
      if(left&&JSON.stringify(left)===JSON.stringify(right))continue;
      changes.unshift({op:right,was:left?.value,removed:false});
    }
    for(const op of a){
      if(!used.has(opFields(op))&&!b.some(x=>JSON.stringify(x)===JSON.stringify(op))){
        changes.push({op,removed:true});used.add(opFields(op));
      }
    }
    return changes;
  }
  const formatDate=s=>{
    const date=new Date(s);
    return s&&Number.isFinite(date.valueOf())?date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Unknown date';
  };
  function review(){
    toggleMenu(false);
    const place=open('Review changes · '+page[1],'PAGE REVIEW');
    if(!liveRevision){para('The current live page has not been verified yet. Try again when GitHub Pages is reachable.');place();return;}
    const delta=diff(liveOps,list.slice(0,cursor));
    para(stale()?'This draft uses an older version of the page. Studio will not overwrite the newer live page. Your draft can still be saved or downloaded.'
      :delta.length?'These draft changes are compared with the verified live page. Nothing has been published.':'There are no draft changes to publish.');
    if(delta.length){
      const items=create('ul',{class:'studio-changes'});
      for(const {op,was,removed} of delta){
        const li=create('li'), node=byId(op.id);
        const item=node?(node.hasAttribute('data-bs-row')?rowTitle(node):textCopy(content(node)||node).trim().slice(0,56)||titleOf(node)):null;
        const label=operationNames[op.kind]||'Updated '+op.kind.replaceAll('-',' ');
        li.append(create('strong',{},(removed?'Reverted · ':'')+label+(op.device?' · '+op.device:'')));
        if(item&&!dataKinds.has(op.kind))li.append(create('p',{class:'studio-change-copy'},item));
        if(!removed&&dataKinds.has(op.kind)&&typeof op.value==='string'){
          const copy=create('p',{class:'studio-change-copy'});
          if(typeof was==='string'&&was!==op.value)copy.append(create('del',{},was.slice(0,240)),document.createElement('br'));
          copy.append(create('ins',{},op.value.slice(0,240)||'(cleared)'));li.append(copy);
        }
        items.append(li);
      }
      body.append(items);
    }
    if(stale()){
      const actions=group();
      button(actions,'Download this draft',()=>exportFile(draftString(),pageIdentity()+'-draft.json','application/json'));
      button(actions,'Open newer live version',async()=>{
        if(!await recoverLater(draftString())){flash('The draft could not be backed up. Download it first.');return;}
        setDraft(JSON.stringify({version:1,page:pageIdentity(),operations:liveOps,publishedBase:liveSource}),liveOps);
        await save({quiet:true});close();flash('Live page opened. Your other draft is in Recovered drafts.');
      });
    }
    place();
  }
  function previewMarkup(html){
    const esc=s=>String(s).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'})[c]);
    const sample=document.createElement('template');
    sample.innerHTML=String(html);
    sample.content.querySelectorAll('script,link,style,iframe,base,meta,object,embed').forEach(node=>node.remove());
    const styles=[...D.querySelectorAll('head link[rel=stylesheet]')].map(link=>link.href)
      .filter(url=>new URL(url).origin===location.origin)
      .map(url=>'<link rel="stylesheet" href="'+esc(url)+'">').join('');
    return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
      '<base href="'+esc(D.URL)+'"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src '+esc(location.origin)+' \'unsafe-inline\'; img-src '+esc(location.origin)+' data:; font-src '+esc(location.origin)+'; media-src '+esc(location.origin)+'; form-action \'none\'">'+
      styles+'<style>body{margin:0}a,button,iframe{pointer-events:none}</style><body>'+sample.innerHTML+'</body></html>';
  }
  async function historyPanel(){
    toggleMenu(false);
    const place=open('Page history · '+page[1],'PAGE HISTORY');
    if(!StudioPublish.canCloud()){
      para('Sign in with your approved publisher account to view saved page versions.');
      button(group(),'Open publisher sign-in',()=>$('publish').click());place();return;
    }
    para('Preview an earlier version or restore it as a draft. The live site changes only when you publish.');
    const versions=create('ol',{class:'studio-versions'});
    const status=create('p',{class:'muted',role:'status'},'Loading history…');
    const actions=group();
    actions.before(versions,status);place();
    const mark=nowKey(), target=page;
    const alive=()=>current(mark)&&status.isConnected;
    let offset=1;
    async function showVersion(entry, index){
      const put=open('Version preview · '+page[1],'PAGE HISTORY');
      const controls=group();
      button(controls,'Back to history',historyPanel);
      const text=create('p',{class:'muted',role:'status'},'Opening saved version…');
      controls.before(text);put();
      try{
        const old=await StudioPublish.action('history-version',{commit:entry.commit,offset:index},target);
        if(!current(mark)||!text.isConnected)return;
        const exam=create('iframe',{class:'studio-history-preview',sandbox:'',title:'Preview of '+page[1]+' from '+formatDate(entry.date)});
        exam.srcdoc=previewMarkup(old.html);body.append(exam);
        text.textContent=formatDate(entry.date)+' · '+entry.publisher;
        if(!StudioPublish.compatible(old.guard)){
          para('This version is previewed with the current site styles. Its original page template has changed, so it cannot be safely restored in this editor.');
        }else{
          const restore=button(controls,'Restore as draft',async()=>{
            restore.disabled=true;
            try{
              if(!current(mark)||!liveRevision)throw Error('Wait for Studio to verify the current live page.');
              const restored=await StudioPublish.fromPublishedDraft(old.draft);
              if(!current(mark)||!exam.isConnected)return;
              const raw=JSON.stringify({...restored,publishedBase:liveSource});
              const ops=readDraft(raw);
              if(!clean()&&!await recoverLater(draftString()))throw Error('The current draft could not be backed up. Download it first.');
              if(!current(mark)||!exam.isConnected)return;
              if(!await storeBrowserDraft(storageKey(),raw))throw Error('The restored draft could not be saved. Browser storage is unavailable.');
              setDraft(raw,ops);close();schedule();flash('Version restored as a draft. Nothing was published.');
            }catch(e){text.textContent=e.message;}
            finally{restore.disabled=false;}
          });
          restore.disabled=mode!=='edit'||!liveRevision;
        }
        put();
      }catch(e){if(text.isConnected)text.textContent=e.message;}
    }
    const more=button(actions,'Load more',load);more.hidden=true;
    async function load(){
      const index=offset;more.disabled=true;
      try{
        const result=await StudioPublish.action('history',{offset:index},target);
        if(!alive())return;
        for(const entry of result.entries){
          const li=create('li'), caption=create('div');
          caption.append(create('strong',{},formatDate(entry.date)),create('small',{},entry.publisher));
          li.append(caption);button(li,'Preview',()=>showVersion(entry,index),{'aria-label':'Preview version from '+formatDate(entry.date)});
          versions.append(li);
        }
        status.textContent=versions.children.length?'':'No Studio publications for this page yet.';
        more.hidden=!result.more;offset++;
      }catch(e){if(alive()){status.textContent=e.message;more.hidden=false;}}
      finally{more.disabled=false;if(alive())place();}
    }
    await load();
  }
  function start(){
    for(const [id,fn] of [['review-changes',review],['page-history',historyPanel],['cloud-draft',cloudPanel]])$(id).onclick=fn;
  }
  return {start,account,schedule,sync,pageReady,connect,disconnect,draftStatus,renderStatus,submitted,verified,forgetCloud,isPending,diff};
})();
