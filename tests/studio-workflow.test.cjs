const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const workflow=vm.runInNewContext(fs.readFileSync('public/studio/studio-workflow.js','utf8')+'\nStudioWorkflow');
const css=fs.readFileSync('public/studio/canvas-edits.css','utf8');
const published=fs.readFileSync('public/homepage-studio/layout-v1.css','utf8');
const layoutCode=fs.readFileSync('public/studio/device-layout.js','utf8');

test('only the final change to a setting is shown, with a comparison against live',()=>{
  const op=(value)=>({id:'heading',kind:'text',value});
  const live=[op('Old text')], draft=[...live,op('N'),op('New text')];
  const result=workflow.diff(live,draft);
  assert.equal(result.length,1);
  assert.equal(result[0].op.value,'New text');
  assert.equal(result[0].was,'Old text');
  assert.equal(workflow.diff(live,draft.slice(0,1)).length,0);
  assert.equal(workflow.diff(draft,live)[0].removed,true);
});
test('device overrides are discrete, resettable and supported by both renderers',()=>{
  const mount=()=>{
    const properties=new Map(), attrs=new Map();
    return {style:{setProperty:(k,v)=>properties.set(k,v),removeProperty:k=>properties.delete(k)},
      setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),hasAttribute:()=>false,properties,attrs};
  };
  const n=mount(), text=mount();
  n.style.setProperty('font-size','42px');
  const api=vm.runInNewContext(layoutCode+'\nStudioDeviceLayout',{content:()=>text});
  assert.equal(api.apply(n,{device:'mobile',value:{font:20,width:60,align:'center','pad-top':5}}),true);
  assert.equal(n.attrs.get('data-bs-responsive-mobile'),'width pad-top');
  assert.equal(text.properties.get('--bs-device-mobile-font'),'20px');
  assert.equal(n.properties.get('font-size'),'42px');
  assert.equal(api.apply(n,{device:'tablet',value:{font:30}}),true);
  assert.equal(api.apply(n,{device:'mobile',value:{}}),true);
  assert.equal(n.attrs.has('data-bs-responsive-mobile'),false);
  assert.equal(text.properties.get('--bs-device-tablet-font'),'30px');
  assert.equal(api.apply(n,{device:'mobile',value:{align:'url(example)'}}),false);
  assert.equal(css.slice(css.indexOf('/* Studio device overrides'),css.indexOf('/* Desktop offsets are shared')),
    published.slice(published.indexOf('/* Studio device overrides'),published.indexOf('/* Desktop offsets are shared')));
});

test('private draft writes use a per-user compare and swap, and keep the winner intact',async()=>{
  const {studioState}=await import('../supabase/functions/publish-homepage/studio-state.mjs');
  const user='01234567-89ab-4def-8123-0123456789ab', other='11111111-1111-4111-8111-111111111111';
  const db=new Map(), objects=new Map();
  let replaceDuringSave=false;
  const api=new Map([['SUPABASE_URL','https://project.test'],['SUPABASE_SERVICE_ROLE_KEY','test-server-key']]);
  const resp=value=>Response.json(value);
  async function request(addr,options){
    assert.equal(options.headers.apikey,'test-server-key');
    const url=new URL(addr), method=options.method, pathname=url.pathname;
    if(pathname.startsWith('/rest/')){
      const payload=options.body?JSON.parse(options.body):null;
      const key=payload?.user_id||url.searchParams.get('user_id')?.substring(3);
      const old=db.get(key), expected=url.searchParams.get('revision')?.slice(3);
      if(method==='GET')return resp(old?[old]:[]);
      if(method==='POST'){
        if(old)return resp([]);
        db.set(key,payload);return resp([payload]);
      }
      if(old?.revision!==expected)return resp([]);
      if(method==='DELETE'){db.delete(key);return resp([old]);}
      db.set(key,{...old,...payload});return resp([payload]);
    }
    if(method==='DELETE'){
      for(const key of JSON.parse(options.body).prefixes)objects.delete(key);
      return resp([]);
    }
    const key=pathname.split('/studio-private-drafts/')[1];
    if(method==='GET')return objects.has(key)?new Response(objects.get(key)):new Response(null,{status:404});
    const uploaded=await new Response(options.body).arrayBuffer();
    assert.equal(+options.headers['Content-Length'],uploaded.byteLength);
    objects.set(key,uploaded);
    if(replaceDuringSave){
      const winner='22222222-2222-4222-8222-222222222222';
      db.set(user,{user_id:user,page:'home',revision:winner});
      objects.set(user+'/home/'+winner+'.gz',new Uint8Array([8]));
    }
    return resp({ok:true});
  }
  const state=actor=>studioState({request,env:api.get.bind(api),authUser:{id:actor},page:'home',now:Date.now,
    fail:(code,message)=>{throw Object.assign(Error(message),{code});}});
  function run(actor,action,query='',bytes=null){
    const input=new Request('https://project.test/?'+query,bytes?{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:bytes}:{method:'POST'});
    return state(actor).handle(action,input,new URL(input.url).searchParams,{},resp);
  }
  const first=(await (await run(user,'draft-write','bytes=3',new Uint8Array([1,2,3]))).json()).draft;
  assert.equal((await (await run(other,'draft-info')).json()).draft,null);
  await assert.rejects(run(other,'draft-read','revision='+first.revision),e=>e.code===409);
  const earlier=await run(user,'draft-read','revision='+first.revision);
  assert.deepEqual([...new Uint8Array(await earlier.arrayBuffer())],[1,2,3]);
  replaceDuringSave=true;
  await assert.rejects(run(user,'draft-write','bytes=2&revision='+first.revision,new Uint8Array([4,5])),e=>e.code===409);
  const winning=(await (await run(user,'draft-info')).json()).draft;
  const download=await run(user,'draft-read','revision='+winning.revision);
  assert.deepEqual([...new Uint8Array(await download.arrayBuffer())],[8]);
  assert.equal(objects.size,2); // stale attempted upload removed, never the new winner
});
