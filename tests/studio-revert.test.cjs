const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {test}=require('node:test');

const code=fs.readFileSync('public/studio/studio-workflow.js','utf8');
const page=['home','Home',''];
const source='src/content/homepage-studio-published.json';
const draft='public/homepage-studio/draft.json';
const base='1'.repeat(40), head='2'.repeat(40), treeId='3'.repeat(40);
const liveRev='a'.repeat(24), nextRev='b'.repeat(24);
const liveId='11111111-2222-4333-8444-555555555555', oldId='22222222-2222-4333-8444-555555555555';
const encode=o=>Buffer.from(JSON.stringify(o));
const gitSha=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const template='src/app/page.tsx', guard={[template]:'z'};

test('Draft tools is gone and Revert only appears for a verified published page',()=>{
  const html=fs.readFileSync('public/studio/index.html','utf8');
  assert.doesNotMatch(html,/id="more"|Draft tools|Page history|Review changes|id="cloud-draft"/i);
  assert.match(html,/<button[^>]*id="revert"[^>]* hidden/);
  const make=()=>({dataset:{},removeAttribute:key=>{}});
  const els={'publish-status':make(),revert:make(),'draft-conflict':make()};
  const localStorage=new Map();
  const context={
    page,liveRevision:null,liveSource:null,mode:'edit',switching:false,
    StudioPublish:{baseOfDraft:()=>null,isBusy:()=>false},
    showState(){},$:id=>els[id],localStorage:{getItem:k=>localStorage.get(k),setItem:(k,v)=>localStorage.set(k,v),removeItem:k=>localStorage.delete(k)},
  };
  const app=vm.runInNewContext(code+'\nStudioWorkflow',context);
  const visible=(yes)=>{app.renderStatus();assert.equal(els.revert.hidden,!yes);};
  visible(false);
  context.liveRevision=liveRev;visible(false);
  context.liveSource='f'.repeat(40);visible(true);
  context.switching=true;visible(false);context.switching=false;
  context.mode='preview';visible(false);context.mode='edit';visible(true);
  app.submitted(page,null,liveRev);visible(false);
  app.verified(page,{revision:liveRev,publication:null});visible(false);
  app.verified(page,{revision:nextRev,publication:null});
  context.liveSource=null;visible(false);
});

test('rollback rejects a manifest if the actual live page still serves different content',async()=>{
  const {assertLiveForRevert}=await import('../supabase/functions/publish-homepage/revert.mjs');
  const expectedSource='a'.repeat(40);
  let htmlRevision=nextRev;
  const result=()=>assertLiveForRevert({page,expectedSource,expectedRevision:liveRev,fail,request:async url=>{
    assert.match(url,/^https:\/\/mshahrooz\.github\.io\/Newcitywellness\//);
    if(url.includes('live-revision.json'))return Response.json({source:expectedSource,revision:liveRev,publication:liveId});
    return new Response('<meta name="ncw-home-revision" content="'+htmlRevision+'">');
  }});
  await assert.rejects(result(),e=>e.status===409);
  htmlRevision=liveRev;
  assert.equal(await result(),liveId);
});

function fixture({original=false,incompatible=false}={}){
  const old=encode({id:oldId,baseRevision:'0'.repeat(40),guard:incompatible?{[template]:'older'}:guard,html:'older markup'});
  const current=encode({id:liveId,baseRevision:base,guard,html:'newer markup'});
  const previousDraft=encode({operations:['older']});
  const nowDraft=encode({operations:['newer']});
  const tree=new Map([[source,gitSha(current)],[draft,gitSha(nowDraft)],[template,'4'.repeat(40)]]);
  const previous=new Map([[template,incompatible?'5'.repeat(40):tree.get(template)]]);
  if(!original){previous.set(source,gitSha(old));previous.set(draft,gitSha(previousDraft));}
  const calls=[];
  const args={
    key:'home',source,draft,head,tree,guard,gitSha,fail,segments:x=>x,
    expectedSource:tree.get(source),expectedId:liveId,
    read:async path=>path===source?current:nowDraft,
    git:async(path,what,method)=>{
      calls.push(path);
      assert.equal(method,undefined);
      if(path==='/git/commits/'+base)return {tree:{sha:treeId}};
      if(path==='/git/trees/'+treeId+'?recursive=1')return {tree:[...previous].map(([path,sha])=>({path,sha,type:'blob'}))};
      const file=path==='/contents/'+source+'?ref='+base?old:path==='/contents/'+draft+'?ref='+base?previousDraft:null;
      if(file)return {sha:gitSha(file),encoding:'base64',content:file.toString('base64')};
      throw Error(path);
    },
    readPublication:files=>({pub:JSON.parse(files.get(source)),state:JSON.parse(files.get(draft))}),
    validateStoredDraft:s=>assert.deepEqual(s.operations,['older']),
    verifyHtml:html=>assert.equal(html,'older markup'),
  };
  return {args,calls,previousDraft};
}

test('rollback follows the published base commit and changes only the selected page files',async()=>{
  const {previousPage}=await import('../supabase/functions/publish-homepage/revert.mjs');
  const {args,calls,previousDraft}=fixture();
  const result=await previousPage(args);
  assert.deepEqual([...result.files.keys()].sort(),[source,draft].sort());
  assert.deepEqual(result.files.get(draft),previousDraft);
  const publication=JSON.parse(result.files.get(source));
  assert.equal(publication.baseRevision,head);
  assert.equal(publication.html,'older markup');
  assert.notEqual(publication.id,oldId);
  assert.equal(publication.id,result.id);
  assert.equal(calls[0],'/git/commits/'+base);
  assert.deepEqual(result.direct,[]);
  await assert.rejects(previousPage({...args,expectedSource:'e'.repeat(40)}),e=>e.status===409);
});

test('first publication can revert to the unchanged native page',async()=>{
  const {previousPage}=await import('../supabase/functions/publish-homepage/revert.mjs');
  const {args}=fixture({original:true});
  const result=await previousPage(args);
  assert.equal(result.id,null);
  assert.equal(result.files.size,0);
  assert.deepEqual(result.direct.map(entry=>[entry.path,entry.sha]),[[source,null],[draft,null]]);
  for(const options of [{original:true,incompatible:true},{incompatible:true}]){
    await assert.rejects(previousPage(fixture(options).args),e=>e.status===409);
  }
});
