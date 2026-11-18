import { createHash } from 'node:crypto';
// The caller has already checked the verified Auth user and the publisher allowlist.
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const limit=32*1024*1024;
export const draftAction=action=>['draft-info','draft-read','draft-write','draft-clear','draft-asset-read','draft-asset-write'].includes(action);

export function studioState({request, env, authUser, page, now, fail, bodyReader}){
  let secret=env('SUPABASE_SERVICE_ROLE_KEY');
  if(!secret)try{secret=JSON.parse(env('SUPABASE_SECRET_KEYS')||'{}').default;}catch{}
  const base=(env('SUPABASE_URL')||'').replace(/\/$/,'');
  const bucket='studio-private-drafts';
  const user=authUser.id;
  const filter='user_id=eq.'+encodeURIComponent(user)+'&page=eq.'+encodeURIComponent(page);
  const metadata=rows=>rows?.[0]||null;
  const valid=rev=>typeof rev==='string'&&uuid.test(rev);
  const flags={apikey:secret,...(secret?.startsWith('ey')?{Authorization:'Bearer '+secret}:{})};
  const path=rev=>user+'/'+page+'/'+rev+'.gz';
  async function service(route,method='GET',body,extra={},signal=AbortSignal.timeout(55000)){
    if(!secret||!base||!valid(user))fail(503,'Private Studio storage is not available.');
    const result=await request(base+route,{method,headers:{...flags,...extra},body,signal,redirect:'error'});
    if(!result.ok)fail(result.status===413?413:503,result.status===413?'This draft is too large for cloud storage. It is still in this browser.':'Private Studio storage is temporarily unavailable. Your browser draft has not been removed.');
    return result;
  }
  function object(revision){return '/storage/v1/object/'+bucket+'/'+path(revision);}
  const erase=rev=>service('/storage/v1/object/'+bucket,'DELETE',JSON.stringify({prefixes:[path(rev)]}),{'Content-Type':'application/json'}).catch(()=>null);
  async function rows(query,method='GET',data,prefer='return=representation',route='studio_cloud_drafts',timeout=55000){
    const res=await service('/rest/v1/'+route+'?'+query,method,data===undefined?undefined:JSON.stringify(data),{'Content-Type':'application/json',Prefer:prefer},AbortSignal.timeout(timeout));
    return res.status===204?[]:await res.json();
  }
  async function info(){
    return metadata(await rows(filter+'&select=revision,bytes,updated_at'));
  }
  function conflict(){fail(409,'This draft changed on another device. Both copies are preserved.');}
  async function handle(action,req,params,headers,json){
    if(action.startsWith('draft-asset-')){
      if(!secret||!base||!valid(user))fail(503,'Private Studio storage is not available.');
      const hash=params.get('hash');
      if(!/^[a-f0-9]{64}$/.test(hash))fail(400,'Invalid private media identifier.');
      const file=user+'/attachments/'+hash;
      const readPath='/storage/v1/object/authenticated/'+bucket+'/'+file;
      if(action==='draft-asset-read'){
        const asset=await service(readPath);
        return new Response(asset.body,{headers:{...headers,'Content-Type':'application/octet-stream'}});
      }
      const bytes=Number(params.get('bytes')), max=25*1024*1024;
      if(!Number.isInteger(bytes)||bytes<1||bytes>max||req.headers.get('content-type')!=='application/octet-stream')fail(415,'Invalid private media upload.');
      const data=await bodyReader(req,max);
      if(data.length!==bytes||createHash('sha256').update(data).digest('hex')!==hash)fail(422,'Private media integrity check failed.');
      const write=await request(base+'/storage/v1/object/'+bucket+'/'+file,{
        method:'POST',headers:{...flags,'Content-Type':'application/octet-stream','x-upsert':'false'},
        body:data,signal:AbortSignal.timeout(55000),redirect:'error',
      });
      if(!write.ok){
        // A duplicate immutable upload already exists. Do not overwrite it.
        const problem=await write.json().catch(()=>null);
        if(![400,409].includes(write.status)||!['Duplicate','ResourceAlreadyExists','The resource already exists'].includes(problem?.code||problem?.error))fail(503,'Private media could not be saved.');
      }
      return json({ok:true});
    }
    const current=await info();
    if(action==='draft-info')return json({ok:true,draft:current});
    const revision=params.get('revision'), previous=current?.revision||null;
    if(revision!==previous||(revision!==null&&!valid(revision)))conflict();
    if(action==='draft-read'){
      if(!revision)fail(404,'There is no cloud draft for this page.');
      const stored=await service('/storage/v1/object/authenticated/'+bucket+'/'+path(revision));
      return new Response(stored.body,{headers:{...headers,'Content-Type':'application/octet-stream'}});
    }
    if(action==='draft-clear'){
      if(!current)return json({ok:true});
      const deleted=await rows(filter+'&revision=eq.'+revision,'DELETE');
      if(!deleted.length)conflict();
      await erase(revision);
      return json({ok:true});
    }
    const bytes=Number(req.headers.get('content-length')||params.get('bytes'));
    if(req.headers.get('content-type')!=='application/octet-stream'||!req.body||!Number.isInteger(bytes)||bytes<1||bytes>limit){
      fail(413,'Cloud drafts can contain up to 32 MB of compressed data. The browser copy is unchanged.');
    }
    const next=crypto.randomUUID(), stamp=new Date(now()).toISOString();
    let seen=0;
    const stream=req.body.pipeThrough(new TransformStream({
      transform(chunk,controller){
        seen+=chunk.byteLength;
        if(seen>bytes||seen>limit)throw Error('Draft size exceeded');
        controller.enqueue(chunk);
      },
      flush(){if(seen!==bytes)throw Error('Incomplete draft');}
    }));
    await service(object(next),'POST',stream,{'Content-Type':'application/octet-stream','Content-Length':String(bytes),'x-upsert':'false','cache-control':'0'});
    let saved;
    try{
      const data={revision:next,bytes,updated_at:stamp};
      saved=metadata(revision
        ?await rows(filter+'&revision=eq.'+revision,'PATCH',data)
        :await rows('on_conflict=user_id,page','POST',{...data,user_id:user,page},'resolution=ignore-duplicates,return=representation'));
    }catch(error){
      // A response can be lost after the database commits. Never remove an object we cannot prove was not adopted.
      throw error;
    }
    if(!saved){await erase(next);conflict();}
    if(revision)await erase(revision);
    return json({ok:true,draft:saved});
  }
  async function authors(commits){
    if(!commits.length)return new Map();
    const result=await rows('page=eq.'+page+'&commit_sha=in.('+commits.join(',')+')&select=commit_sha,publisher','GET',undefined,undefined,'studio_publish_receipts',3500);
    return new Map(result.map(row=>[row.commit_sha,row.publisher]));
  }
  async function recordAuthor(commit){
    const label=String(authUser.user_metadata?.full_name||authUser.user_metadata?.name||authUser.email?.split('@')[0]||'Studio publisher').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,80)||'Studio publisher';
    return rows('on_conflict=commit_sha','POST',{commit_sha:commit,page,publisher:label},'resolution=ignore-duplicates,return=minimal','studio_publish_receipts',3500);
  }
  return {handle,authors,recordAuthor};
}
