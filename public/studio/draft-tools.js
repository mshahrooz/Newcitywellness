'use strict';
const StudioDraft=(()=>{
  const LIMIT=4000, trail=[];
  const setter=new Set(['rich-text','link','alt','align','font-size','text-color','pad','brand-style','section-name','section-height','device-layout','column-widths','row-gap','row-color','embed-title','seo','part','space','form-field']);
  const textKinds=new Set(['copy-text','text','rich-text']);
  function compact(operations){
    const out=[], choices=new Map(), lastText=new Map();
    for(const op of operations){
      if(!setter.has(op.kind)){choices.clear();lastText.clear();out.push(op);continue;}
      if(textKinds.has(op.kind)){
        const other=lastText.get(op.id);
        if(other&&other!==op.kind)for(const kind of textKinds)choices.delete(JSON.stringify([op.id,kind,null,null,null]));
        lastText.set(op.id,op.kind);
      }
      const id=JSON.stringify([op.id,op.kind,op.prop,op.edge,op.device]);
      if(choices.has(id))out[choices.get(id)]=null;
      choices.set(id,out.length);out.push(op);
    }
    return out.filter(Boolean);
  }
  function log(area,error){
    const msg=error instanceof Error?error.message:String(error||'Unknown issue');
    if(trail.at(-1)?.area===area&&trail.at(-1)?.message===msg)return;
    trail.push({area,message:msg.slice(0,350),at:Date.now()});
    if(trail.length>30)trail.shift();
  }
  function guide(){
    const place=open('Keyboard shortcuts','STUDIO HELP');
    const shortcuts=[['Double-click text','Edit inline'],['Ctrl/⌘ + Enter','Apply inline text'],['Esc','Cancel or close'],['Ctrl/⌘ + Z','Undo'],
      ['Ctrl/⌘ + Y or Shift + Z','Redo'],['Ctrl/⌘ + C / V','Copy or paste a selected block'],['Ctrl/⌘ + D','Duplicate the selected block'],
      ['Delete','Delete the selected element'],['Ctrl/⌘ + S','Save a draft now'],['Alt + click','Select the enclosing layout'],['Arrow keys','Move the selection'],['Alt + arrow','Nudge the selection']];
    const list=create('dl',{class:'studio-key-guide'});
    for(const [key,meaning] of shortcuts)list.append(create('dt',{},key),create('dd',{},meaning));
    body.append(list);
    const panel=create('details',{class:'look'});
    panel.append(create('summary',{},'Diagnostics'));
    if(trail.length)for(const e of [...trail].reverse())panel.append(create('p',{class:'muted'},new Date(e.at).toLocaleTimeString()+' · '+e.area+' · '+e.message));
    else panel.append(create('p',{class:'muted'},'No errors recorded in this session.'));
    body.append(panel);place();
  }
  const operationLabel={text:'Text', 'copy-text':'Text','rich-text':'Formatted text',heading:'Heading','heading-level':'Heading level',link:'Links',alt:'Image descriptions',
    image:'Images',file:'Documents',video:'Videos','row-add':'New sections','palette-add':'New elements','paste-block':'Pasted blocks',remove:'Removed items',seo:'SEO',
    'brand-style':'Style','font-size':'Typography','text-color':'Colors','device-layout':'Responsive layout'};
  function summary(live,draft){
    let start=0;
    while(start<live.length&&start<draft.length&&(live[start]===draft[start]||JSON.stringify(live[start])===JSON.stringify(draft[start])))start++;
    const result=new Map();
    for(const op of compact(draft.slice(start))){
      const label=operationLabel[op.kind]||'Layout and settings';
      result.set(label,(result.get(label)||0)+1);
    }
    if(live.length>start&&!result.size)result.set('Reverted draft changes',live.length-start);
    return [...result];
  }
  function issues(root,seo,defaultSeo,site,pagePath){
    const out=[];
    const push=(key,detail)=>out.push({key,detail});
    const main=root.querySelector('main')||root;
    const headings=[...main.querySelectorAll('h1')].filter(x=>!x.closest('[hidden],[aria-hidden="true"]'));
    if(headings.length!==1)push('Page headings',headings.length?headings.length+' H1 headings found. Use one main H1.':'No H1 found. Add a main heading.');
    const missing=[...root.querySelectorAll('img')].filter(n=>!n.getAttribute('alt')?.trim()&&!n.closest('[aria-hidden="true"],[role="presentation"],[hidden]'));
    if(missing.length)push('Image descriptions',missing.length+' image'+(missing.length===1?' is':'s are')+' missing alt text.');
    if(!(seo.title||defaultSeo.title))push('SEO title','No page title is set.');
    if(!(seo.description||defaultSeo.description))push('SEO description','No meta description is set.');
    const external=new Set(), internal=new Set(), invalid=[], bare=[];
    for(const n of root.querySelectorAll('a')){
      if(n.hasAttribute('download')||n.closest('[hidden]'))continue;
      const value=n.getAttribute('href');
      if(!value||value==='#'){
        if(!n.matches('.brand,.footer-brand')&&n.textContent.trim()!=='Home')bare.push(n.textContent.trim()||'(unlabelled link)');
        continue;
      }
      if(value[0]==='#'){
        const target=value.slice(1);
        if(![...root.querySelectorAll('[id]')].some(x=>x.id===target))invalid.push(value);
        continue;
      }
      if(!StudioAuthoring.href(value)){invalid.push(value);continue;}
      if(/^tel:|^mailto:/i.test(value))continue;
      let url;try{url=new URL(value,site+pagePath);}catch{invalid.push(value);continue;}
      if(url.origin===new URL(site).origin)internal.add(url.href);
      else external.add(url.href);
    }
    if(bare.length)push('Empty links',bare.length+' empty link destination'+(bare.length===1?'':'s')+'.');
    if(invalid.length)push('Broken or invalid links',invalid.slice(0,5).join(', ')+(invalid.length>5?' …':''));
    return {out,internal:[...internal],external:external.size};
  }
  async function checkPaths(paths){
    const seen=new Set(), missing=[], unknown=[];
    for(const href of paths){
      const u=new URL(href);u.hash='';u.search='';seen.add(u.href);
    }
    const limited=[...seen].slice(0,30);
    await Promise.all(limited.map(async url=>{
      try{
        const result=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(3500)});
        if(result.status===404||result.status===410)missing.push(new URL(url).pathname);
        else if(!result.ok)unknown.push(url);
      }catch{unknown.push(url);}
    }));
    return {missing:missing.sort(),unchecked:unknown.length+seen.size-limited.length};
  }
  function review(parent,target){
    const panel=create('details',{class:'look',open:''});panel.append(create('summary',{},'Review changes and checks'));
    const changes=summary(liveOps,list.slice(0,cursor));
    const rows=create('ul',{},'');
    if(!changes.length)rows.append(create('li',{},'No new draft changes.'));
    for(const [what,count] of changes)rows.append(create('li',{},what+' · '+count));
    const data=issues(D.body,StudioSeo.fromOperations(list.slice(0,cursor)),pageAssets[target[0]]?.seo||{},StudioPublish.details.LIVE,target[2]?target[2]+'/':'');
    const status=create('p',{class:'muted',role:'status'},'Checking public site links…');
    const warning=create('ul',{class:'publish-check-list'});
    for(const x of data.out)warning.append(create('li',{},x.key+' · '+x.detail));
    if(data.external)warning.append(create('li',{},data.external+' external links need a manual check. Their destinations cannot be verified here.'));
    panel.append(rows,warning,status);parent.append(panel);
    const done=checkPaths(data.internal).then(result=>{
      if(!panel.isConnected)return;
      if(result.missing.length)warning.append(create('li',{},'Missing public pages · '+result.missing.join(', ')));
      status.textContent=result.missing.length?result.missing.length+' site link(s) returned not found.':
        result.unchecked?result.unchecked+' site link(s) could not be verified.':'Checked the public site URLs in this draft.';
    });
    return done;
  }
  async function history(){
    if(!baselineReady||!liveSource)return;
    const target=page, epoch=canvasEpoch, place=open('Published versions · '+target[1],'PAGE HISTORY');
    if(!StudioPublish.canCloud()){
      para('Sign in with your publisher account to restore a version.');
      button(group(),'Open publisher sign-in',()=>$('publish').click());place();return;
    }
    para('Restore a published version as a draft. It goes live only after you review it and publish.');
    const row=create('div',{class:'version-list'}), status=create('p',{class:'muted',role:'status'},'Loading versions…');
    const more=button(group(),'Load more',()=>void load());more.hidden=true;
    body.insertBefore(row,body.lastChild);body.insertBefore(status,body.lastChild);
    let offset=1;
    const check=()=>epoch===canvasEpoch&&status.isConnected;
    async function load(){
      more.disabled=true;const current=offset;
      try{
        const result=await StudioPublish.action('history',{offset:current},target);
        if(!check())return;
        for(const item of result.entries){
          const entry=create('div',{class:'studio-link-row'});
          const date=item.date?new Date(item.date).toLocaleString():'Date unavailable';
          entry.append(create('strong',{},date),create('small',{},item.publisher));
          button(entry,'Restore as draft',async()=>{
            try{
              status.textContent='Checking this version…';
              const old=await StudioPublish.action('history-version',{offset:current,commit:item.commit},target);
              if(!check())return;
              if(!StudioPublish.compatible(old.guard))throw Error('This version uses a different source template and cannot be safely restored.');
              const oldDraft=await StudioPublish.fromPublishedDraft(old.draft);
              if(!check())return;
              if(!operationsMatch(liveOps)&&!await recoverLater(draftString()))throw Error('Studio could not back up your current draft.');
              if(!check())return;
              const raw=JSON.stringify({...oldDraft,publishedBase:liveSource});
              if(!await storeBrowserDraft(storageKey(),raw))throw Error('Studio could not save the restored draft.');
              if(!check())return;
              setDraft(raw);close();flash('Previous version restored as a draft. Nothing was published.');
            }catch(e){if(check())status.textContent=e.message;}
          });row.append(entry);
        }
        more.hidden=!result.more;offset++;status.textContent=row.children.length?'Choose a version to restore.':'There are no Studio versions saved for this page.';
        place();
      }catch(e){if(check()){status.textContent=e.message;more.hidden=false;}}
      finally{more.disabled=false;}
    }
    place();await load();
  }
  return {LIMIT,compact,log,guide,summary,issues,review,history};
})();
