import { Buffer } from 'node:buffer';

const sha=/^[a-f0-9]{40}$/;
const revision=/^[a-f0-9]{24}$/;
const publication=/^[a-f0-9-]{36}$/;
const base='https://mshahrooz.github.io/Newcitywellness/';

// Verify both the deploy manifest and the public page. A commit alone isn't a live publication.
export async function assertLiveForRevert({request,page,expectedSource,expectedRevision,fail}){
  if(!sha.test(expectedSource)||!revision.test(expectedRevision))fail(400,'Choose a verified published page before reverting.');
  const [key,,route]=page;
  const manifest=key==='home'?'homepage-studio/live-revision.json':'homepage-studio/pages/'+key+'/live-revision.json';
  const get=path=>request(base+path,{signal:AbortSignal.timeout(10000),redirect:'error'});
  let state, html, ok=false;
  try{
    const response=await get(manifest+'?check='+crypto.randomUUID());
    if(response.ok)state=await response.json();
    if(state?.source===expectedSource&&state.revision===expectedRevision&&publication.test(state.publication)){
      const current=await get((route?route+'/':'')+'?ncw_rev='+expectedRevision);
      if(current.ok){html=await current.text();ok=html.includes('name="ncw-home-revision" content="'+expectedRevision+'"');}
    }
  }catch{}
  if(!ok)fail(409,'This page is no longer serving the expected version. Wait for Studio to verify the live page, then try again.');
  return state.publication;
}

// Follow the live publication's recorded base commit, not the previous repository commit.
export async function previousPage({source,draft,head,tree,guard,read,git,gitSha,segments,readPublication,validateStoredDraft,verifyHtml,fail,key,expectedSource,expectedId}){
  if(tree.get(source)!==expectedSource)fail(409,'A newer version is waiting to go live. Try again when it has finished.');
  const current=new Map(await Promise.all([source,draft].map(async path=>[path,await read(path)])));
  const {pub}=readPublication(current,key);
  if(pub.id!==expectedId||!sha.test(pub.baseRevision)||pub.baseRevision===head)fail(409,'The prior version of this live page could not be verified.');
  const compatible=old=>Object.keys(old||{}).length===Object.keys(guard).length&&Object.keys(guard).every(k=>old[k]===guard[k]);
  if(!compatible(pub.guard))fail(409,'The page template has changed since this version was published. Studio cannot safely revert it.');
  const commit=await git('/git/commits/'+pub.baseRevision,'read the previous page commit');
  if(!sha.test(commit.tree?.sha))fail(502,'GitHub did not provide the previous page tree.');
  const snapshot=await git('/git/trees/'+commit.tree.sha+'?recursive=1','read the previous page files');
  if(!Array.isArray(snapshot.tree)||snapshot.truncated)fail(502,'The previous page tree could not be verified.');
  const previous=new Map(snapshot.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  const entry=(path,sha)=>({path,mode:'100644',type:'blob',sha});
  if(!previous.has(source)){
    if(!Object.keys(guard).every(k=>previous.get(k)===tree.get(k))){
      fail(409,'The original page template has changed. Studio cannot safely restore that version.');
    }
    if(previous.has(draft)&&!sha.test(previous.get(draft)))fail(502,'The original page files could not be verified.');
    const direct=[entry(source,null)];
    if(tree.has(draft))direct.push(entry(draft,previous.get(draft)||null));
    return {id:null,files:new Map(),direct};
  }
  if(previous.get(source)===expectedSource||!previous.has(draft))fail(409,'There is no different saved version to restore.');
  const files=new Map(await Promise.all([source,draft].map(async path=>{
    const result=await git('/contents/'+segments(path)+'?ref='+pub.baseRevision,'read the prior version of this page');
    const value=result.encoding==='base64'&&typeof result.content==='string'?Buffer.from(result.content,'base64'):null;
    if(!value||result.sha!==previous.get(path)||gitSha(value)!==result.sha)fail(502,'A file from the earlier version could not be verified.');
    return [path,value];
  })));
  const {pub:old,state}=readPublication(files,key);
  if(!compatible(old.guard))fail(409,'The earlier version uses a different page template and cannot be safely restored.');
  validateStoredDraft(state,files,tree);
  verifyHtml(old.html,files,tree,key);
  const id=crypto.randomUUID();
  files.set(source,Buffer.from(JSON.stringify({...old,id,baseRevision:head})+'\n'));
  return {id,files,direct:[]};
}
