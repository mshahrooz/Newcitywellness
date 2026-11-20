'use strict';
/* The editor is public. Live publishing requires a Supabase publisher account. */
const StudioPublish = (() => {
  const OWNER='mshahrooz';
  const REPO='Newcitywellness';
  const API='https://api.github.com';
  const REPO_API='/repos/'+OWNER+'/'+REPO;
  const LIVE='https://'+OWNER+'.github.io/'+REPO+'/';
  const BASE='/'+REPO+'/';
  const selected=()=>typeof page==='undefined'?['home','Home','']:page;
  const paths=(key=selected()[0])=>key==='home'
    ? {SOURCE:'src/content/homepage-studio-published.json',DRAFT:'public/homepage-studio/draft.json',MANIFEST:'homepage-studio/live-revision.json'}
    : {SOURCE:'src/content/studio-pages/'+key+'.json',DRAFT:'public/homepage-studio/pages/'+key+'/draft.json',MANIFEST:'homepage-studio/pages/'+key+'/live-revision.json'};
  const liveUrl=(target=selected())=>LIVE+(target[2]?target[2]+'/':'');
  const MAIN_REF=REPO_API+'/git/ref/heads/main';
  const SITE_ORIGIN=new URL(LIVE).origin;
  const MAX_UPLOAD=32*1024*1024;
  let publisherSession=null, loadedSource=null;
  const VALID_SHA=/^[0-9a-f]{40}$/;
  const SUPPORT=['scripts/apply-homepage-studio.py','public/homepage-studio/layout-v1.css','public/homepage-studio/homepage-v1.js'];
  const GUARDED=[
    'src/content/editor-content.json','src/content/grapes-designs.json',
    'src/app/page.tsx','src/app/site-header.tsx','src/app/site-footer.tsx','src/app/layout.tsx',
    'src/app/builder-page.tsx','src/app/editor-blocks.tsx','src/app/testimonial-slider.tsx',
    'src/app/wellness.css','src/app/globals.css','src/app/local-fonts.css','src/app/builder-page.css','src/app/clinic-footer.css',
    'src/app/floating-booking-link.tsx','src/app/floating-booking-link.css',
  ];
  const mediaMap={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/avif':'avif','image/gif':'gif','application/pdf':'pdf','application/octet-stream':'bin','video/mp4':'mp4','video/webm':'webm'};
  const safeMedia=/^(?:images\/|media\/homepage-studio\/)[A-Za-z0-9_ .()\/-]+$/;
  const SAMPLE_TAGS=new Set('a article br builder-copy button circle div footer form h1 h2 h3 h4 h5 h6 header img input li main nav p path rect section span strong svg textarea ul label select option video source figure figcaption template ol em small aside blockquote details summary dl dt dd picture hr iframe noscript cite'.split(' '));
  const utf8=new TextEncoder(), decode=new TextDecoder();
  const checkStyle=/(?:url\s*\(|expression\s*\(|@import|javascript\s*:|\\|[<>])/i;
  let busy=false;
  const cap=(n,max)=>{if(n>max)throw Error('The publication is too large. Compress the uploaded media and try again.');};
  function pack(view){
    const chunks=[];
    for(let i=0;i<view.length;i+=16384)chunks.push(String.fromCharCode(...view.subarray(i,i+16384)));
    return btoa(chunks.join(''));
  }
  function unpack(s){
    if(typeof Uint8Array.fromBase64==='function')return Uint8Array.fromBase64(s);
    const binary=atob(s), out=new Uint8Array(binary.length);
    for(let i=0;i<out.length;i++)out[i]=binary.charCodeAt(i);
    return out;
  }
  const sha256=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const details={LIVE,REPO_API,GUARDED,SUPPORT,...paths('home')};
  const canvasGuard=()=>selected()[0]==='home'?STUDIO_SOURCE_REVISION:pageAssets[selected()[0]]?.guard;
  const guardPaths=()=>selected()[0]==='home'?GUARDED:Object.keys(canvasGuard()||{});
  function pathUrl(path){return path.split('/').map(encodeURIComponent).join('/');}
  async function gh(path){
    let res;
    try{
      res=await fetch(API+path,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',
        headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
    }catch{throw Error('Could not reach GitHub to check the selected page. Your draft is still here.');}
    if(!res.ok){
      if(res.status===429||res.status===403&&res.headers.get('x-ratelimit-remaining')==='0')throw Error('GitHub is temporarily limiting public requests. Save your draft and try again later.');
      throw Error('GitHub could not verify the selected page ('+res.status+'). Your draft is still here.');
    }
    return res.json();
  }
  const fileAt=(path,parent)=>gh(REPO_API+'/contents/'+pathUrl(path)+'?ref='+encodeURIComponent(parent));
  async function publicStatus(includeGuard=false){
    const {SOURCE}=paths(), required=guardPaths();
    const ref=await gh(MAIN_REF);
    const parent=ref.object.sha;
    if(!VALID_SHA.test(parent))throw Error('GitHub returned an invalid branch reference.');
    const commit=await gh(REPO_API+'/git/commits/'+parent);
    const snapshot=await gh(REPO_API+'/git/trees/'+commit.tree.sha+'?recursive=1');
    if(snapshot.truncated)throw Error('GitHub did not return the full site tree. No page was published.');
    const tree=new Map(snapshot.tree.filter(i=>i.type==='blob').map(i=>[i.path,i.sha]));
    if(!SUPPORT.every(name=>tree.has(name)))throw Error('The Page Studio connection is not yet installed in GitHub.');
    if(!tree.has('package.json'))throw Error('The Pages build configuration is missing.');
    const rawPackage=await fileAt('package.json',parent);
    if(!JSON.parse(decode.decode(unpack(rawPackage.content))).scripts?.['build:pages']?.includes('apply-homepage-studio.py'))throw Error('The Pages build connection is not enabled.');
    const baseline={
      parent,tree,source:tree.get(SOURCE)||null,
    };
    if(includeGuard){
      const bytes=await Promise.all(required.map(async name=>{
        const file=await fileAt(name,parent);
        if(!file.content||file.sha!==tree.get(name))throw Error('Could not verify '+name+'. No changes were submitted.');
        return [name,await sha256(unpack(file.content))];
      }));
      baseline.guard=Object.fromEntries(bytes);
    }
    return baseline;
  }
  async function status(includeGuard=false){
    if(!signedIn())return publicStatus(includeGuard);
    const required=guardPaths();
    const snapshot=await publisher('status');
    if(!VALID_SHA.test(snapshot.parent)||snapshot.source!==null&&!VALID_SHA.test(snapshot.source)
      ||!Array.isArray(snapshot.assets)||!required.every(name=>/^[a-f0-9]{64}$/.test(snapshot.guard?.[name]))){
      throw Error('GitHub did not return a valid page revision. Your draft is unchanged.');
    }
    return {parent:snapshot.parent,source:snapshot.source,guard:snapshot.guard,
      tree:new Set(snapshot.assets),publicDraft:snapshot.publication?.draft};
  }
  function canonicalAsset(path){
    const p=decodeURIComponent(path).replace(/^\/+|\/+$/g,'');
    if(!safeMedia.test(p)||p.split('/').some(n=>!n||n==='..'||n==='.'))throw Error('The draft contains an invalid local media path.');
    return p;
  }
  async function fromData(value,isDoc,originalName=''){
    let encoded,ext,legacyPdf=false;
    if(isDoc){
      const document=StudioDocuments.parse(value);
      if(!document)throw Error('Choose a valid document no larger than 25 MB.');
      encoded=document.encoded;legacyPdf=document.legacyPdf;
    }else{
      const m=/^data:(image\/[a-z]+|video\/[a-z0-9]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
      if(!m||!mediaMap[m[1]])throw Error('A file in the draft is not a supported local image or video.');
      cap(m[2].length*.75-(m[2].endsWith('==')?2:m[2].endsWith('=')?1:0),20*1024*1024);
      encoded=m[2];ext=mediaMap[m[1]];
    }
    const digest=await sha256(unpack(encoded));
    const name=isDoc?(legacyPdf&&!originalName?digest.slice(0,32)+'.pdf':StudioDocuments.storageName(originalName,digest)):digest.slice(0,32)+'.'+ext;
    return {encoded,name,ext:name.split('.').pop().toLowerCase()};
  }
  function safeLink(value){
    if(!value||/[\x00-\x20\\]/.test(value)||value.startsWith('//'))throw Error('A button or link has an invalid address.');
    if(value==='#')return value;
    if(value[0]==='#')return value;
    const url=new URL(value,LIVE);
    if(!['http:','https:','mailto:','tel:'].includes(url.protocol)||url.username||url.password)throw Error('A button or link has an invalid address.');
    if(url.origin===new URL(LIVE).origin&&url.pathname.startsWith(BASE)){
      return url.pathname+url.search+url.hash;
    }
    return url.href;
  }
  async function prepare(root,revision,context){
    const key=context?.page||selected()[0];
    const output=Array.from(root.querySelectorAll('.ncw,.floating-booking-link')).filter(n=>n.parentNode===root);
    if(!output.length||!root.querySelector('main[data-builder-page]'))throw Error('The page canvas is not ready.');
    const top=root.ownerDocument.createElement('div');
    output.forEach(n=>top.append(n.cloneNode(true)));
    if(typeof StudioResponsiveOffsets!=='undefined')StudioResponsiveOffsets.strip(top);
    top.querySelectorAll('script,link,style,.bs-drag-ghost,template[data-bs-flow-origin],[data-studio-runtime],[data-bs-drop-slot]').forEach(n=>n.remove());
    top.querySelectorAll('input,textarea').forEach(n=>{n.removeAttribute('value');if(n.tagName==='TEXTAREA')n.textContent='';});
    top.querySelectorAll('.site-header,.header-nav,.nav-dropdown').forEach(n=>n.classList.remove('is-open','is-pinned','is-scrolled','open'));
    top.querySelectorAll('.mobile-toggle,.nav-dropdown-toggle').forEach(n=>n.setAttribute('aria-expanded','false'));
    top.querySelectorAll('.mobile-toggle').forEach(n=>{n.setAttribute('aria-label','Open menu');n.querySelector('path')?.setAttribute('d','M4 7h16M4 12h16M4 17h16');});
    const files=new Map(), mediaCache=new Map(), documentsCache=new Map();
    const docKey=(value,name)=>value+'\u0000'+StudioDocuments.filename(name);
    const clonedOperations=revision.operations.map(op=>({...op}));
    async function media(value,isDoc=false,originalName=''){
      if(!value||value==='#')return value;
      if(value.startsWith('data:')){
        const cache=isDoc?documentsCache:mediaCache;
        const key=isDoc?docKey(value,originalName):value;
        if(!cache.has(key))cache.set(key,(async()=>{
          const f=await fromData(value,isDoc,originalName);
          const path=(isDoc?'media/homepage-studio/':['png','jpg','webp','avif','gif'].includes(f.ext)?'images/homepage-studio/':'media/homepage-studio/')+f.name;
          if(!context?.tree?.has('public/'+path))files.set('public/'+path,f.encoded);
          return BASE+path.split('/').map(encodeURIComponent).join('/');
        })());
        return cache.get(key);
      }
      const here=new URL(context?.canvas||new URL('canvas.html',location.href)), url=new URL(value,here);
      if((url.origin!==here.origin&&url.origin!==new URL(LIVE).origin)||url.search||url.hash){
        throw Error('Linked background media must be uploaded before publishing. Download the image or MP4/WebM and upload it using Section settings, then try again.');
      }
      const path=canonicalAsset(url.pathname.startsWith(BASE)?url.pathname.slice(BASE.length):url.pathname);
      if(!isDoc&&/\.(?:bin|pdf)$/.test(path))throw Error('An uploaded document must be linked as a download.');
      if(!context?.tree?.has('public/'+path))throw Error('The required site asset is missing from GitHub: '+path);
      return BASE+path;
    }
    for(const node of top.querySelectorAll('*')){
      const tag=node.localName;
      if(node.classList.contains('bs-accordion'))node.removeAttribute('open');
      if(!SAMPLE_TAGS.has(tag))throw Error('This element cannot be published: '+tag);
      for(const attr of [...node.attributes]){
        const key=attr.name, value=attr.value;
        if(key.startsWith('on')||['srcdoc','formaction','action','ping','nonce','integrity','contenteditable','autofocus'].includes(key))node.removeAttribute(key);
        else if(key.startsWith('data-bs-')&&!['data-bs-bg','data-bs-look','data-bs-coord-mobile','data-bs-responsive-mobile','data-bs-responsive-tablet'].includes(key))node.removeAttribute(key);
        else if(key==='style'&&checkStyle.test(value))throw Error('The draft contains an unsupported design setting.');
      }
      if(node.hasAttribute('href')){
        const href=node.getAttribute('href');
        if(href.startsWith('data:')&&(tag!=='a'||!node.hasAttribute('download')))throw Error('An uploaded document must be linked as a download.');
        node.setAttribute('href',href.startsWith('data:')?await media(href,true,node.getAttribute('download')):safeLink(href));
        if(node.getAttribute('target')==='_blank'){
          const link=node.getAttribute('href');
          const external=/^https?:\/\//.test(link);
          if(external||node.classList.contains('floating-booking-link'))node.setAttribute('rel','noopener noreferrer');
          else{node.removeAttribute('target');node.removeAttribute('rel');}
        }
        if(node.matches('.brand[href="#"], .footer-brand[href="#"]')||node.getAttribute('href')==='#'&&node.textContent.trim()==='Home')node.setAttribute('href',BASE);
      }
      if(tag==='iframe'){
        const original=typeof STUDIO_EMBEDS!=='undefined'&&Object.hasOwn(STUDIO_EMBEDS,key)&&node.getAttribute('src')===STUDIO_EMBEDS[key]&&!node.hasAttribute('data-ncw-embed');
        if(!original&&!StudioEmbeds.safeFrame(name=>node.getAttribute(name)))throw Error('This page has an unsupported embed.');
      }else for(const attr of ['src','poster']){
        if(node.hasAttribute(attr))node.setAttribute(attr,await media(node.getAttribute(attr)));
      }
      if(node.hasAttribute('srcset')){
        const parts=node.getAttribute('srcset').split(',');
        const rebuilt=[];
        for(const part of parts){const [url,width]=part.trim().split(/\s+/);rebuilt.push(await media(url)+(width?' '+width:''));}
        node.setAttribute('srcset',rebuilt.join(', '));
      }
    }
    for(const op of clonedOperations){
      if((['image','file','video'].includes(op.kind)||op.kind==='section-bg'&&['image','video'].includes(op.type))&&typeof op.value==='string'&&op.value.startsWith('data:')){
        // Preserve full edit history but upload only media referenced by the final canvas.
        const cache=op.kind==='file'?documentsCache:mediaCache;
        const key=op.kind==='file'?docKey(op.value,op.name):op.value;
        if(cache.has(key)){
          const name=decodeURIComponent((await cache.get(key)).slice(BASE.length));
          op.value={studioAsset:name};
        }
      }
    }
    // Intermediate media overwritten later should not bloat the public repository or expose unused uploads.
    const ops=clonedOperations.filter(op=>!((['image','file','video'].includes(op.kind)||op.kind==='section-bg'&&['image','video'].includes(op.type))&&typeof op.value==='string'&&op.value.startsWith('data:')));
    const portable={version:1,page:key==='home'?'new-city-wellness-homepage':'new-city-wellness-'+key,operations:ops};
    const plain=utf8.encode(JSON.stringify(portable)+'\n');
    let draftText;
    if(typeof CompressionStream==='function'){
      const zip=new Blob([plain]).stream().pipeThrough(new CompressionStream('gzip'));
      draftText=JSON.stringify({encoding:'gzip-base64',data:pack(new Uint8Array(await new Response(zip).arrayBuffer()))})+'\n';
    }else draftText=decode.decode(plain);
    const content=JSON.stringify({version:1,...(key==='home'?{}:{page:key}),id:crypto.randomUUID(),baseRevision:context.parent,guard:context.guard,draftSha256:await sha256(utf8.encode(draftText)),html:top.innerHTML})+'\n';
    cap(utf8.encode(content).length,850000);cap(utf8.encode(draftText).length,850000);
    let size=0;
    for(const value of files.values())size+=value.length*.75;
    cap(size,MAX_UPLOAD);
    return {content,draftText,files,id:JSON.parse(content).id};
  }
  async function decodeDraft(bytes) {
    let state=JSON.parse(decode.decode(bytes));
    if(state.encoding==='gzip-base64'){
      const stream=new Blob([unpack(state.data)]).stream().pipeThrough(new DecompressionStream('gzip'));
      state=JSON.parse(await new Response(stream).text());
    }
    return state;
  }
  const fetchLive=(url,limit=7000)=>fetch(url,{cache:'no-store',signal:AbortSignal.timeout(limit)});
  async function liveManifest(target=selected()){
    if(location.origin!==SITE_ORIGIN)return null;
    const {MANIFEST}=paths(target[0]);
    const res=await fetchLive(LIVE+MANIFEST+'?check='+Date.now());
    if(!res.ok)throw Error('The live page could not be checked.');
    const state=await res.json();
    if(!/^[a-f0-9]{24}$/.test(state?.revision)||state.publication!==null&&(!/^[a-f0-9-]{36}$/.test(state.publication)||!VALID_SHA.test(state.source)||!/^[a-f0-9]{64}$/.test(state.draftSha256))){
      throw Error('The live page version is incomplete.');
    }
    return {...state,source:state.publication===null?null:state.source};
  }
  async function verifyLivePage(target,state){
    const url=new URL(liveUrl(target));
    url.searchParams.set('ncw_rev',state.revision);
    const page=await fetchLive(url);
    if(!page.ok||!(await page.text()).includes('name="ncw-home-revision" content="'+state.revision+'"')){
      throw Error('GitHub Pages is still serving a different version.');
    }
    return url.href;
  }
  async function loadLiveDraft(target,state,verified=false){
    if(!state.source){if(!verified)await verifyLivePage(target,state);return null;}
    const {DRAFT}=paths(target[0]);
    const [,draft]=await Promise.all([verified?null:verifyLivePage(target,state),fetchLive(LIVE+DRAFT.slice('public/'.length)+'?ncw_rev='+state.revision)]);
    if(!draft.ok)throw Error('The deployed draft is not ready.');
    const bytes=new Uint8Array(await draft.arrayBuffer());
    if(await sha256(bytes)!==state.draftSha256)throw Error('The deployed draft is not ready.');
    return remoteDraft(await decodeDraft(bytes));
  }
  async function remoteDraft(revision){
    if(!Array.isArray(revision?.operations))throw Error('There is no saved Studio publication to load yet.');
    const ops=await Promise.all(revision.operations.map(async op=>{
      if(!op.value||typeof op.value!=='object'||!op.value.studioAsset)return op;
      const path=canonicalAsset(op.value.studioAsset),ext=path.split('.').pop().toLowerCase();
      const type=op.kind==='file'?(ext==='pdf'&&/^[a-f0-9]{32}\.pdf$/.test(path.split('/').at(-1))?'application/pdf':StudioDocuments.MIME)
        :Object.keys(mediaMap).find(k=>mediaMap[k]===ext);
      if(!type||ext==='bin'&&op.kind!=='file')throw Error('The published draft contains an unknown media format.');
      const url=LIVE+path.split('/').map(encodeURIComponent).join('/');
      const answer=await fetch(url,{cache:'force-cache',signal:AbortSignal.timeout(op.kind==='file'?90000:12000)});
      if(!answer?.ok)throw Error('A published media file is not ready yet. Wait for Pages to finish, then retry.');
      return {...op,value:'data:'+type+';base64,'+pack(new Uint8Array(await answer.arrayBuffer()))};
    }));
    return {...revision,operations:ops};
  }
  function checkCanvas(current){
    const local=canvasGuard();
    if(!local||!guardPaths().every(name=>local[name]===current.guard[name])){
      throw Error('This editor is based on an older version of the original site. Save your draft and reload Studio.');
    }
  }
  async function checkedPackage(update,persist=false){
    if(drag||paletteDrag||resizeDrag)throw Error('Finish dragging or resizing before publishing.');
    const {SOURCE,DRAFT}=paths();
    if(!cursor&&!loadedSource)throw Error('Make a page edit first.');
    const target=selected(), epoch=canvasEpoch, snapshot=draftString();
    update('Checking the publishing connection…','checking');
    const current=await status(true);
    if(target[0]!==selected()[0]||epoch!==canvasEpoch||snapshot!==draftString()){
      throw Error('Your draft changed while Studio was preparing it. Try again when you finish editing.');
    }
    checkCanvas(current);
    // The active draft is authoritative. The new package still uses GitHub’s
    // current branch head, and the server rejects it if that head moves.
    if(current.source!==loadedSource&&!replay()){
      throw Error('Studio could not apply every edit in this draft. Your draft is still in the editor.');
    }
    $('publish-status').textContent='GitHub Pages connected';
    $('publish-status').removeAttribute('title');
    update('Preparing the selected page and its local media…','package');
    const [ready,saved]=await Promise.all([
      prepare(D.body,JSON.parse(snapshot),{...current,canvas:frame.contentDocument.URL}),
      persist?save():true,
    ]);
    if(!saved)throw Error('Studio could not keep a browser copy of this draft. Download it before publishing.');
    if(snapshot!==draftString())throw Error('The draft changed while publishing was prepared. Try again when you finish editing.');
    const files=new Map(ready.files);
    files.set(DRAFT,pack(utf8.encode(ready.draftText)));
    files.set(SOURCE,pack(utf8.encode(ready.content)));
    return {current,ready,files,snapshot};
  }
  const crcTable=Uint32Array.from({length:256},(_,n)=>{
    for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);
    return n>>>0;
  });
  function uploadZip(files){
    const entries=[],index=[];
    let offset=0,totalIndex=0;
    for(const [path,encoded] of files){
      const name=utf8.encode(path),data=unpack(encoded);
      let crc=0xffffffff;
      for(const n of data)crc=(crc>>>8)^crcTable[(crc^n)&255];
      crc=(crc^0xffffffff)>>>0;
      const local=new Uint8Array(30), l=new DataView(local.buffer);
      l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);
      l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);
      l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);
      const record=new Uint8Array(46), c=new DataView(record.buffer);
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
      c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);
      c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);
      c.setUint32(42,offset,true);
      entries.push(local,name,data);
      index.push(record,name);
      offset+=local.length+name.length+data.length;
      totalIndex+=record.length+name.length;
    }
    const end=new Uint8Array(22), e=new DataView(end.buffer);
    e.setUint32(0,0x06054b50,true);e.setUint16(8,files.size,true);e.setUint16(10,files.size,true);
    e.setUint32(12,totalIndex,true);e.setUint32(16,offset,true);
    return new Blob([...entries,...index,end],{type:'application/zip'});
  }
  async function preparedRevision(update=()=>{},persist=false){
    const {files,ready,snapshot}=await checkedPackage(update,persist);
    return {zip:uploadZip(files),id:ready.id,snapshot};
  }
  async function githubPackage(update=()=>{}){
    return (await preparedRevision(update)).zip;
  }
  function supabaseReady(){
    return /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(STUDIO_AUTH.url)
      && /^sb_publishable_[A-Za-z0-9_-]+$/.test(STUDIO_AUTH.key);
  }
  function signedIn(){
    return !!publisherSession && publisherSession.exp>Date.now();
  }
  async function signIn(email,password){
    const response=await fetch(STUDIO_AUTH.url+'/auth/v1/token?grant_type=password',{
      method:'POST',mode:'cors',cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(12000),
      headers:{apikey:STUDIO_AUTH.key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),
    }).catch(()=>null);
    const info=await response?.json().catch(()=>null);
    if(!response)throw Error('Could not reach Supabase sign-in. Try again.');
    if(response.status===429)throw Error('Too many sign-in attempts. Try again later.');
    if(!response.ok||!info?.access_token||!info?.user?.email)throw Error('Sign-in did not work. Check the email and password for your publisher account.');
    publisherSession={token:info.access_token, user:info.user.id, email:info.user.email, exp:Date.now()+(info.expires_in||3600)*1000-5000};
  }
  async function signOut(){
    const token=publisherSession?.token;
    publisherSession=null;
    if(token)await fetch(STUDIO_AUTH.url+'/auth/v1/logout?scope=local',{
      method:'POST',cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(4000),
      headers:{apikey:STUDIO_AUTH.key,Authorization:'Bearer '+token},
    }).catch(()=>null);
  }
  const canCloud=()=>signedIn()&&!!publisherSession.user&&supabaseReady()&&location.origin===SITE_ORIGIN;
  async function publisher(action, zip, params={}, target=selected(), raw=false){
    if(!signedIn())throw Error('Your session expired. Sign in again.');
    let response;
    const query=new URLSearchParams({action,page:target[0]});
    for(const [key,val] of Object.entries(params))if(val!==undefined&&val!==null)query.set(key,String(val));
    try{
      response=await fetch(STUDIO_AUTH.url+'/functions/v1/publish-homepage?'+query,{
        method:'POST',credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(145000),
        headers:{apikey:STUDIO_AUTH.key,Authorization:'Bearer '+publisherSession.token,...(zip?{'Content-Type':action==='draft-write'?'application/octet-stream':'application/zip'}:{})},
        ...(zip?{body:zip}:{}),
      });
    }catch{throw Error(action==='publish'?'Could not confirm publishing. Check the GitHub Pages build before retrying.':'Could not reach the publishing service. Your draft is unchanged. Try again.');}
    if(raw&&response.ok)return response;
    const result=await response.json().catch(()=>null);
    if(response.status===401)publisherSession=null;
    if(!response.ok||!result?.ok){
      const fallback=response.status===401?'Your session expired. Sign in again.':response.status===413?'This upload exceeds the server limit. Your browser draft is unchanged.':'The Studio service could not confirm this request.';
      const error=Error(result?.error||fallback);
      error.status=response.status;throw error;
    }
    return result;
  }
  function bindSource(source){loadedSource=source;}
  function baseOfDraft(){return loadedSource;}
  const watching=new Map();
  const waitingMessage='GitHub has saved your changes. Studio will finish once the public page is verified.';
  const failedMessage='GitHub saved your changes, but the Pages deployment failed. Your draft is still saved. You can publish again.';
  async function deploymentFailed(sha){
    if(!VALID_SHA.test(sha))return false;
    try{
      const filters=new URLSearchParams({head_sha:sha,branch:'main',event:'push',per_page:'5'});
      const response=await fetchLive(API+REPO_API+'/actions/workflows/deploy.yml/runs?'+filters,4500);
      if(!response.ok)return false;
      const {workflow_runs:runs}=await response.json();
      const latest=runs?.filter(run=>run.head_sha===sha).sort((a,b)=>b.run_number-a.run_number)[0];
      return latest?.status==='completed'&&['failure','timed_out','action_required'].includes(latest.conclusion);
    }catch{return false;} // The public status API is optional. The live page is authoritative.
  }
  function waitForLivePublication(target,id,previousRevision,sha){
    if(id===null?!/^[a-f0-9]{24}$/.test(previousRevision):!/^[a-f0-9-]{36}$/.test(id))return Promise.resolve();
    const key=target[0], token=key+':'+id+':'+(previousRevision||'');
    if(watching.has(token))return watching.get(token);
    const task=(async()=>{
      const start=Date.now(), deadline=start+180000;
      let nextStatusCheck=start+7000, waiting=false, matched=false;
      while(Date.now()<deadline){
        try{
          const live=await liveManifest(target);
          if(live&&live.publication===id&&live.revision!==previousRevision){
            matched=true;
            StudioRelease.set(key,'verify','GitHub has announced the release. Checking the public page…');
            const url=await verifyLivePage(target,live);
            StudioRelease.set(key,'live',previousRevision?'The previous version is back online.':'The published page is verified and ready for visitors.',url);
            if(selected()[0]===key)void syncLiveCanvas(live);
            return;
          }
        }catch{ /* Pages may still be deploying. */ }
        const elapsed=Date.now()-start;
        if(!matched&&!waiting&&elapsed>=25000){
          waiting=true;StudioRelease.set(key,'waiting',waitingMessage);
        }
        if(!matched&&Date.now()>=nextStatusCheck){
          nextStatusCheck=Date.now()+8000;
          if(await deploymentFailed(sha)){
            StudioWorkflow.deploymentFailed(target,id,previousRevision,sha);
            StudioRelease.set(key,'error',failedMessage);
            return;
          }
        }
        await new Promise(resolve=>setTimeout(resolve,document.hidden?6000:elapsed<45000?1700:elapsed<90000?4500:8000));
      }
      StudioRelease.set(key,'waiting','GitHub Pages is taking longer than usual. Your changes are saved. Studio will keep checking while this page is open.');
    })().finally(()=>watching.delete(token));
    watching.set(token,task);
    return task;
  }
  function panel(reverting=false){
    if(busy||reverting&&!StudioWorkflow.canRevert())return;
    const pos=open(reverting?'Revert '+selected()[1]+'?':'Publish '+selected()[1],'GITHUB PAGES');
    const target=selected(), key=target[0];
    para(reverting?'Restore the previous published version. Other pages and your unpublished edits stay unchanged.'
      :'Publish the draft currently open in Studio. You can close this panel once the changes are sent.');
    if(!StudioWorkflow.isPending(target)&&(reverting||!operationsMatch(liveOps)))StudioRelease.clearFinished(key);
    StudioRelease.mount(target,body);
    const identity=create('p',{class:'muted',role:'status'});
    const authArea=group('publisher-auth');
    authArea.before(identity);
    const activeDraft=reverting?StudioWorkflow.canRevert():mode==='edit'&&(!!cursor||!!loadedSource);
    const publishing=()=>typeof StudioWorkflow!=='undefined'&&StudioWorkflow.isPending();
    if(!activeDraft)para(mode==='edit'?'Make a page edit before publishing.':'Use Back to editing before publishing.');
    const feedback=create('div',{role:'status',class:'publish-feedback'});
    body.append(feedback);
    const controls=group(reverting?'revert-actions':'publish-actions');
    const progress=message=>{feedback.textContent=message;};
    const running=value=>{
      busy=value;
      direct.disabled=value||!signedIn()||!activeDraft||publishing();
      $('publish').disabled=value;
      if($('revert'))$('revert').disabled=value;
      if($('page-picker'))$('page-picker').disabled=value;
      authArea.querySelectorAll('button,input').forEach(el=>{el.disabled=value;});
    };
    const direct=button(controls,reverting?'Revert Live Page':'Publish Website',()=>void submit(),{class:reverting?'revert-live-button':'publish-website-button'});
    const follow=(id,previousRevision,sha)=>void waitForLivePublication(target,id,previousRevision,sha).finally(()=>{
      if(direct.isConnected)running(busy);
    });
    async function submit(){
      if(busy||!signedIn()||!activeDraft||publishing())return;
      running(true);
      try{
        progress('');
        StudioRelease.set(key,'prepare',reverting?'Checking the saved website version…':'Checking your draft and the publishing connection…');
        if(reverting){
          if(!StudioWorkflow.canRevert())throw Error('Wait for Studio to verify this published page.');
          const previousRevision=liveRevision, expectedSource=liveSource;
          if((!operationsMatch(liveOps)||loadedSource!==liveSource)&&!await save()){
            throw Error('Studio could not save the current draft. This page was not reverted.');
          }
          StudioRelease.set(key,'commit','Sending the previous version to GitHub…');
          const result=await publisher('revert',null,{source:expectedSource,revision:previousRevision},target);
          if(!VALID_SHA.test(result.sha)||!(result.id===null?result.source===null:/^[a-f0-9-]{36}$/.test(result.id)&&VALID_SHA.test(result.source))){
            throw Error('GitHub did not confirm the revert. Check the live page before trying again.');
          }
          StudioWorkflow.submitted(target,result.id,previousRevision,result.sha);
          StudioRelease.set(key,'deploy','The previous version is saved to GitHub. GitHub Pages is deploying it.');
          follow(result.id,previousRevision,result.sha);
          return;
        }
        const update=(message,stage)=>StudioRelease.set(key,stage||'checking',message);
        let packed,result;
        for(let attempt=0;attempt<2;attempt++){
          packed=await preparedRevision(update,true);
          if(packed.snapshot!==draftString())throw Error('The draft changed while publishing was prepared. Try again when you finish editing.');
          if(packed.zip.size>MAX_UPLOAD)throw Error('This publish exceeds 32 MB in total. Publish the uploads in smaller batches.');
          StudioRelease.set(key,'commit','Sending the selected page and media to GitHub…');
          try{result=await publisher('publish',packed.zip);break;}
          catch(error){
            const safeRetry=error.status===409&&/^Main changed (after|while) /.test(error.message);
            if(!safeRetry||attempt!==0||packed.snapshot!==draftString())throw error;
          }
        }
        const {id,snapshot}=packed;
        if(result.id!==id||!VALID_SHA.test(result.source))throw Error('GitHub did not confirm the submitted revision. Your draft is still here.');
        {
          rememberSubmitted(target[0],id,snapshot);
          StudioWorkflow.submitted(target,id,undefined,result.sha);
          void save();
          StudioRelease.set(key,'deploy','GitHub has saved your changes. GitHub Pages is putting the new version online.');
          follow(id,undefined,result.sha);
        }
      }catch(e){
        StudioRelease.set(key,'error',e.message);
      }
      finally{running(false);if(!signedIn())showAuth();pos();}
    }
    function showAuth(){
      authArea.replaceChildren();
      const ready=supabaseReady()&&location.origin===SITE_ORIGIN;
      if(!ready){
        identity.textContent=!supabaseReady()?'Publishing setup is not complete.':'Open Page Studio on GitHub Pages to sign in and publish.';
      }else if(signedIn()){
        identity.textContent='Signed in as '+publisherSession.email+'.';
        button(authArea,'Sign out',async()=>{
          running(true);
          if(await StudioWorkflow.disconnect()===false){running(false);return;}
          await signOut();
          running(false);
          showAuth();
        });
      }else{
        identity.textContent='Sign in with your publisher email and password. No GitHub login or token is needed.';
        const form=create('form',{class:'publisher-form'});
        const email=input(form,'Email','',{type:'email',autocomplete:'username',required:''},()=>{});
        const password=input(form,'Password','',{type:'password',autocomplete:'current-password',required:''},()=>{});
        const submit=create('button',{type:'submit'},'Sign in');
        form.append(submit);authArea.append(form);
        form.addEventListener('submit',async event=>{
          event.preventDefault();
          if(busy)return;
          const address=email.value.trim(),secret=password.value;
          running(true);progress('Signing in…');
          try{await signIn(address,secret);progress('');showAuth();void StudioWorkflow.connect(publisherSession.user);}
          catch(e){progress(e.message);}
          finally{password.value='';running(false);pos();}
        });
      }
      running(busy);pos();
    }
    showAuth();
    const pending=StudioWorkflow.pendingRelease(target);
    if(pending){
      const token=key+':'+pending.id+':'+(pending.previousRevision||'');
      if(!watching.has(token))StudioRelease.set(key,'deploy','GitHub Pages is putting this version online.');
      follow(pending.id,pending.previousRevision,pending.sha);
    }else if(StudioWorkflow.latestRelease(target)?.failed)StudioRelease.set(key,'error',failedMessage);
    else if(StudioWorkflow.latestRelease(target))StudioRelease.set(key,'waiting',waitingMessage);
  }
  const start=()=>{
    if(!$('publish'))return;
    $('publish').onclick=()=>panel();
    if($('revert'))$('revert').onclick=()=>panel(true);
    $('publish-status').textContent='Ready to edit';
  };
  return {start,details,status,prepare,fromData,safeLink,sha256,githubPackage,bindSource,baseOfDraft,liveManifest,loadLiveDraft,verifyLivePage,canCloud,action:(action,params,target,blob,raw)=>publisher(action,blob,params,target,raw),isBusy:()=>busy};
})();

StudioPublish.start();
