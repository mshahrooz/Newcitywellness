import { Buffer } from 'node:buffer';
import { createHash, sign } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { parseFragment } from 'npm:parse5@8.1.1';

const repo='mshahrooz/Newcitywellness', base='/repos/'+repo;
const source='src/content/homepage-studio-published.json', draft='public/homepage-studio/draft.json';
const support=['scripts/apply-homepage-studio.py','public/homepage-studio/layout-v1.css','public/homepage-studio/homepage-v1.js'];
const media=/^public\/(?:images\/homepage-studio\/[a-f0-9]{32}\.(?:png|jpg|webp|avif|gif)|media\/homepage-studio\/[a-f0-9]{32}\.(?:pdf|mp4|webm))$/;
const guardPaths=['src/content/editor-content.json','src/content/grapes-designs.json',...['page.tsx','site-header.tsx','site-footer.tsx','layout.tsx','builder-page.tsx','editor-blocks.tsx','testimonial-slider.tsx','wellness.css','globals.css','local-fonts.css','builder-page.css','clinic-footer.css','floating-booking-link.tsx','floating-booking-link.css'].map(n=>'src/app/'+n)];
const sha=/^[a-f0-9]{40}$/; const id=/^[a-f0-9-]{36}$/;
const emptyBlob='e69de29bb2d1d6434b8b29ae775ad8c2e48c5391';
const maxZip=24*1024*1024, maxText=850000;
const sha256=b=>createHash('sha256').update(b).digest('hex');
const gitSha=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const segments=path=>path.split('/').map(encodeURIComponent).join('/');
class PublishError extends Error {constructor(status,message,fallback=false){super(message);this.status=status;this.fallback=fallback;}}
const fail=(s,m,f=false)=>{throw new PublishError(s,m,f);};
const badZip=()=>fail(422,'The upload is not a valid Homepage Studio package. Prepare it again in the editor.');
const mediaPath=p=>p.startsWith('public/')&&media.test(p);

export function unpackPackage(buf){
  if(buf.length<512||buf.length>maxZip)badZip();
  const end=buf.length-22;
  if(buf.readUInt32LE(end)!==0x06054b50||buf.readUInt32LE(end+4)!==0||buf.readUInt16LE(end+20)!==0)badZip();
  const count=buf.readUInt16LE(end+10), central=buf.readUInt32LE(end+16);
  if(count<2||count>500||buf.readUInt16LE(end+8)!==count||central>=end||central+buf.readUInt32LE(end+12)!==end)badZip();
  let off=0;
  const files=new Map();
  for(let i=0;i<count;i++){
    if(off+30>central||buf.readUInt32LE(off)!==0x04034b50||![0,0x800].includes(buf.readUInt16LE(off+6))||buf.readUInt16LE(off+8)!==0)badZip();
    const length=buf.readUInt32LE(off+18), nameLength=buf.readUInt16LE(off+26), nameEnd=off+30+nameLength;
    if(length!==buf.readUInt32LE(off+22)||buf.readUInt16LE(off+28)!==0||nameLength>160||nameEnd+length>central)badZip();
    const name=buf.toString('utf8',off+30,nameEnd), data=buf.subarray(nameEnd,nameEnd+length);
    if(files.has(name)||(![source,draft].includes(name)&&!mediaPath(name)))badZip();
    if(name===source||name===draft){if(length>maxText)badZip();}
    else if(!length||length>20*1024*1024||name.split('/').at(-1).split('.')[0]!==sha256(data).slice(0,32)||!validMedia(name,data))badZip();
    files.set(name,data);
    off=nameEnd+length;
  }
  if(off!==central||!files.has(source)||!files.has(draft))badZip();
  return files;
}
function validMedia(path,b){
  switch(path.split('.').at(-1)){
    case 'png': return b.subarray(0,8).toString('hex')==='89504e470d0a1a0a';
    case 'jpg': return b.subarray(0,3).toString('hex')==='ffd8ff';
    case 'webp': return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
    case 'avif': case 'mp4': return b.toString('ascii',4,8)==='ftyp';
    case 'gif': return /^GIF8[79]a$/.test(b.toString('ascii',0,6));
    case 'pdf': return b.toString('ascii',0,5)==='%PDF-';
    case 'webm': return b.subarray(0,4).toString('hex')==='1a45dfa3';
    default: return false;
  }
}
const tags=new Set('a article br builder-copy button circle div footer form h1 h2 h3 h4 h5 h6 header img input li main nav p path rect section span strong svg textarea ul label select option video source figure figcaption template ol em small'.split(' '));
const attrAllow=new Set('id class style title href target rel tabindex role for type name value required disabled selected placeholder referrerpolicy autocomplete inputmode minlength maxlength pattern rows cols checked alt src srcset sizes width height loading decoding fetchpriority viewBox viewbox fill stroke d x y rx ry cx cy r x1 x2 y1 y2 stroke-width stroke-linecap stroke-linejoin fill-rule clip-rule preserveAspectRatio preserveaspectratio focusable xmlns viewbox media poster preload autoplay loop muted playsinline controls download lang dir hidden'.split(' '));
function verifyHtml(html,files,tree){
  if(typeof html!=='string'||html.length>maxText||/<!doctype|<\/?(?:body|html|head)[\s>]/i.test(html))badZip();
  const seen=new Set();let main=0;
  const resource=v=>{
    if(!/^\/Newcitywellness\/(?:images|media\/homepage-studio)\/[A-Za-z0-9_./-]+$/.test(v)||v.split('/').slice(1).some(x=>!x||x==='..'||x==='.'))badZip();
    const file='public'+v.slice('/Newcitywellness'.length);
    if(!files.has(file)&&!tree.has(file))fail(422,'A homepage image, document or video is missing from the draft or repository.');
  };
  const walk=node=>{
    if(node.tagName){
      if(!tags.has(node.tagName))fail(422,'The draft contains unsupported homepage markup.');
      if(node.tagName==='main')main++;
      if(node.tagName==='form'&&!node.attrs.some(a=>a.name==='class'&&a.value.split(/\s+/).includes('contact-form')))badZip();
      for(const {name,value,prefix} of node.attrs){
        if(prefix||!(attrAllow.has(name)||/^(aria|data)-[a-z0-9_-]+$/.test(name)))badZip();
        if(name==='style'&&/url\s*\(|expression\s*\(|@import|javascript\s*:|\\|[<>]/i.test(value))badZip();
        if(name==='src'||name==='poster')resource(value);
        if(name==='srcset')value.split(',').forEach(v=>resource(v.trim().split(/\s+/)[0]));
        if(name==='href'){
          if(/[\x00-\x20\\]/.test(value)||value.startsWith('//')||/^[a-z][a-z0-9+.-]*:/i.test(value)&&!/^(https?|mailto|tel):/i.test(value))badZip();
          if(/^\/Newcitywellness\/(?:images\/homepage-studio|media\/homepage-studio)\//.test(value))resource(value);
        }
        if(name==='id') {if(seen.has(value))badZip();seen.add(value);}
      }
    }
    for(const child of node.childNodes??[])walk(child);
    if(node.content)walk(node.content);
  };
  walk(parseFragment(html));if(main!==1)badZip();
}
function readPublication(files){
  let pub, state;
  try{
    pub=JSON.parse(files.get(source));state=JSON.parse(files.get(draft));
    if(state.encoding==='gzip-base64'){
      if(typeof state.data!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(state.data))badZip();
      state=JSON.parse(gunzipSync(Buffer.from(state.data,'base64'),{maxOutputLength:4*1024*1024}));
    }
  }catch{badZip();}
  if(pub?.version!==1||!id.test(pub.id)||pub.draftSha256!==sha256(files.get(draft))||Object.keys(pub.guard??{}).length!==guardPaths.length||!guardPaths.every(n=>/^[a-f0-9]{64}$/.test(pub.guard?.[n])))badZip();
  if(state?.version!==1||state.page!=='new-city-wellness-homepage'||!Array.isArray(state.operations))badZip();
  return {pub,state};
}
const validId = s => typeof s === 'string' && /^[a-z0-9-]{1,96}$/i.test(s);
function validateStoredDraft(draftState, files, tree){
  if (draftState.operations.length > 800) badZip();
  for(const op of draftState.operations){
    if(!op||typeof op.kind!=='string'||!validId(op.id)||['target','pair','copy'].some(k=>op[k]&&!validId(op[k])))badZip();
    if(op.value && typeof op.value==='object' && 'studioAsset' in op.value){
      const name='public/'+op.value.studioAsset;
      if(!mediaPath(name)||!files.has(name)&&!tree.has(name))badZip();
    }
  }
}
function fromGitHub(res,payload,what,accessHint){
  const words=[payload?.message,...(Array.isArray(payload?.errors)?payload.errors.flatMap(x=>[x?.type,x?.message]):[])].filter(s=>typeof s==='string').join(' ');
  if(res.status===401||/bad credentials/i.test(words))fail(503,'GitHub rejected the publishing connection. Ask the site owner to check the GitHub App configuration.');
  if(res.status===429||res.headers.get('x-ratelimit-remaining')==='0'||/rate limit|abuse detection/i.test(words))fail(429,'GitHub is limiting requests. Try again later.');
  if(/protected branch|repository rule|ruleset|GH006|GH013|must be made through a pull request|not permitted to update this branch/i.test(words))fail(409,'A GitHub rule blocks direct publishing to main. No branch rules were changed.');
  if(res.status===409||/expected head|expected branch|STALE_DATA|branch.*(?:out of date|changed)|not a fast forward/i.test(words))fail(409,'The homepage or main branch changed. Reload the editor and submit a fresh revision.');
  if(res.status===413||/too large|payload size|maximum.*size/i.test(words))fail(413,'GitHub rejected the size of this commit. Try reducing the uploaded media.',true);
  if(res.status===403||res.status===404||/FORBIDDEN|not accessible|does not have.*permission|permission denied|not authorized/i.test(words)){
    const permissions=res.headers.get('x-accepted-github-permissions');
    const suffix=permissions&&/^[a-z0-9_,=; ]{1,140}$/i.test(permissions)?' GitHub lists '+permissions+' for this operation.':'';
    fail(403,'GitHub denied permission to '+what+' ('+(res.status===200?403:res.status)+'). '+accessHint+suffix,true);
  }
  fail(502,'GitHub did not confirm the operation. Check the Pages build before retrying.');
}


const allowedOrigin = 'https://mshahrooz.github.io';
const apiVersion = '2026-03-10';
const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const packageType = 'application/zip';

export async function readLimited(req, maximum) {
  if (+(req.headers.get('content-length') || 0) > maximum) fail(413, 'The publication exceeds 24 MB. Reduce the uploaded media and try again.');
  if (!req.body) fail(400, 'The homepage package is missing.');
  const reader = req.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        void reader.cancel().catch(() => {});
        fail(413, 'The publication exceeds 24 MB. Reduce the uploaded media and try again.');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks, length);
  } finally {
    reader.releaseLock();
  }
}

export function createPublisher({ request = fetch, env, now = Date.now } = {}) {
  return async function handle(req) {
    const origin = req.headers.get('origin');
    if (origin && origin !== allowedOrigin) return new Response(null, { status: 403 });
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      'Access-Control-Max-Age': '600',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      Vary: 'Origin',
    };
    const json = (o, status = 200) => Response.json(o, { status, headers });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

    try {
      const auth = req.headers.get('Authorization') || '';
      if (!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(auth)) fail(401, 'Sign in to publish.');
      const url = env('SUPABASE_URL');
      const allow = new Set((env('STUDIO_PUBLISHER_IDS') || '').split(/[\s,]+/).filter(Boolean));
      let publicKey;
      try { publicKey = JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS') || '{}').default; } catch { /* older projects use ANON_KEY */ }
      publicKey ||= env('SUPABASE_ANON_KEY');
      if (!url || !publicKey || !allow.size) fail(503, 'Publishing is not configured yet. Ask the site owner.');
      const a = await request(url.replace(/\/$/, '') + '/auth/v1/user', {
        headers: { Authorization: auth, apikey: publicKey }, signal: AbortSignal.timeout(10000),
      });
      if (a.status === 401 || a.status === 403) fail(401, 'Your publishing session expired. Sign in again.');
      if (!a.ok) fail(502, 'Supabase could not verify your sign-in. Try again.');
      const actor = await a.json();
      if (!actor?.id || actor.is_anonymous || !actor.email_confirmed_at || !allow.has(actor.id)) {
        fail(403, 'This account does not have permission to publish. Ask the site owner.');
      }
      const action = new URL(req.url).searchParams.get('action') || 'publish';
      if (!['check', 'status', 'publish'].includes(action)) fail(400, 'Unknown publishing action.');
      let files, pub, state;
      if (action === 'publish') {
        if (req.headers.get('content-type') !== packageType) fail(415, 'The editor must send a ZIP package.');
        files = unpackPackage(await readLimited(req, maxZip));
        ({ pub, state } = readPublication(files));
        if (!sha.test(pub.baseRevision)) fail(400, 'The editor did not provide a valid GitHub revision.');
      }

      const appId = env('STUDIO_GITHUB_APP_ID'), installation = env('STUDIO_GITHUB_INSTALLATION_ID');
      const key = env('STUDIO_GITHUB_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      if (!/^\d+$/.test(appId || '') || !/^\d+$/.test(installation || '') || !key) {
        fail(503, 'The site owner still needs to connect the GitHub App.');
      }
      const t = Math.floor(now() / 1000);
      const claim = b64url({ alg: 'RS256', typ: 'JWT' }) + '.' + b64url({ iat: t - 60, exp: t + 480, iss: appId });
      let appJwt;
      try { appJwt = claim + '.' + sign('RSA-SHA256', Buffer.from(claim), key).toString('base64url'); }
      catch { fail(503, 'The GitHub App private key needs to be configured in Supabase.'); }
      const accessHint = 'Check that the GitHub App is installed on Newcitywellness with Contents read and write.';
      async function gh(path, what, method = 'GET', data, credential) {
        let r;
        try {
          r = await request('https://api.github.com' + path, {
            method, redirect: 'error', signal: AbortSignal.timeout(method === 'GET' ? 12000 : 35000),
            headers: {
              Authorization: 'Bearer ' + credential, Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': apiVersion, ...(data ? { 'Content-Type': 'application/json' } : {}),
            }, ...(data ? { body: JSON.stringify(data) } : {}),
          });
        } catch { fail(502, 'The connection to GitHub was interrupted. Check the Pages build before retrying.'); }
        const p = await r.json().catch(() => null);
        if (!r.ok) fromGitHub(r, p, what, accessHint);
        if (!p) fail(502, 'GitHub did not return confirmation.');
        return p;
      }
      const app = await gh('/app/installations/' + installation + '/access_tokens', 'connect the publishing app', 'POST', {
        repositories: ['Newcitywellness'], permissions: { contents: 'write' },
      }, appJwt);
      if (typeof app.token !== 'string' || app.permissions?.contents !== 'write') fail(503, accessHint);
      const git = (path, description, method, data) => gh(base + path, description, method, data, app.token);
      if (action === 'check') {
        // The empty blob does not change any file, branch, commit or deployment.
        const probe = await git('/git/blobs', 'write to Newcitywellness', 'POST', { encoding: 'base64', content: '' });
        if (probe.sha !== emptyBlob) fail(502, 'GitHub did not confirm write access.');
        return json({ ok: true, email: actor.email || '', canWrite: true });
      }
      const getHead = async () => (await git('/git/ref/heads/main', 'read the live branch')).object?.sha;
      const head = await getHead();
      if (!sha.test(head)) fail(502, 'GitHub did not return the current main revision.');
      if (action === 'publish' && head !== pub.baseRevision) fail(409, 'Main changed after this draft was prepared. Save your draft and try Publish again.');
      const treeSha = (await git('/git/commits/' + head, 'read the current homepage revision')).tree?.sha;
      if (!sha.test(treeSha)) fail(502, 'GitHub did not return a valid source tree.');
      const snapshot = await git('/git/trees/' + treeSha + '?recursive=1', 'read the current homepage files');
      if (!Array.isArray(snapshot.tree) || snapshot.truncated) fail(502, 'GitHub did not return the full source tree.');
      const tree = new Map(snapshot.tree.filter(n => n.type === 'blob').map(n => [n.path, n.sha]));
      if (!support.every(n => tree.has(n))) fail(409, 'The GitHub Pages homepage integration is missing.');
      const read = async n => {
        const p = await git('/contents/' + segments(n) + '?ref=' + head, 'verify the current homepage source');
        if (p.sha !== tree.get(n) || p.encoding !== 'base64' || typeof p.content !== 'string') fail(409, 'The homepage source changed before publication.');
        return Buffer.from(p.content, 'base64');
      };
      const [guardEntries, config] = await Promise.all([
        Promise.all(guardPaths.map(async n => {
          if (!tree.has(n)) fail(409, 'The GitHub homepage source is missing ' + n + '.');
          return [n, sha256(await read(n))];
        })),
        read('package.json'),
      ]);
      const guard = Object.fromEntries(guardEntries);
      if (!JSON.parse(config).scripts?.['build:pages']?.includes('apply-homepage-studio.py')) {
        fail(409, 'The GitHub Pages homepage integration is disabled.');
      }
      if (action === 'status') {
        let publication = null;
        const sourceSha = tree.get(source) || null;
        if (sourceSha) {
          const [rawSource, rawDraft] = await Promise.all([read(source), read(draft)]);
          const {state: savedState} = readPublication(new Map([[source, rawSource], [draft, rawDraft]]));
          validateStoredDraft(savedState, new Map(), tree);
          publication = { draft: savedState };
        }
        return json({ ok: true, parent: head, source: sourceSha, guard, publication,
          assets: [...tree.keys()].filter(path => path.startsWith('public/images/') || path.startsWith('public/media/homepage-studio/')) });
      }
      if (!guardPaths.every(n => guard[n] === pub.guard[n])) {
        fail(409, 'The homepage source changed. Refresh the editor before publishing.');
      }
      validateStoredDraft(state, files, tree);
      verifyHtml(pub.html, files, tree);
      const entries = [];
      for (const [path, buf] of files) {
        const expected = gitSha(buf);
        if (tree.get(path) === expected) continue;
        const blob = await git('/git/blobs', 'write a homepage file', 'POST', { encoding: 'base64', content: buf.toString('base64') });
        if (blob.sha !== expected) fail(502, 'GitHub did not confirm a homepage file.');
        entries.push({ path, mode: '100644', type: 'blob', sha: expected });
      }
      if (!entries.length) return json({ ok: true, sha: head, id: pub.id, source: gitSha(files.get(source)) });
      const next = await git('/git/trees', 'assemble the homepage files', 'POST', { base_tree: treeSha, tree: entries });
      if (!sha.test(next.sha)) fail(502, 'GitHub did not confirm the homepage file tree.');
      const made = await git('/git/commits', 'create the homepage commit', 'POST', {
        message: 'Publish New City Wellness homepage from Homepage Studio',
        tree: next.sha, parents: [head],
      });
      if (!sha.test(made.sha)) fail(502, 'GitHub did not confirm the homepage commit.');
      if (await getHead() !== head) fail(409, 'Main changed while the draft was being prepared. Reload the editor.');
      const updated = await git('/git/refs/heads/main', 'advance the live branch', 'PATCH', { sha: made.sha, force: false });
      if (updated.object?.sha !== made.sha) fail(502, 'GitHub did not confirm the commit. Check the Pages build before retrying.');
      return json({ ok: true, sha: made.sha, id: pub.id, source: gitSha(files.get(source)) });
    } catch (e) {
      if (e instanceof PublishError) return json({ error: e.message }, e.status);
      console.error('Homepage publisher failed', e?.name || 'Error');
      return json({ error: 'Publishing could not be completed. Your draft is still in the editor.' }, 503);
    }
  };
}
