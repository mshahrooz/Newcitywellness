'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const embedCode = fs.readFileSync('supabase/functions/publish-homepage/embeds.js','utf8');
const columnsCode = fs.readFileSync('public/studio/columns.js','utf8');
const {StudioEmbeds:Embeds,columns:Columns} = vm.runInNewContext(
  embedCode+'\n'+columnsCode+'\n({...globalThis,columns:StudioColumns})',
  {URL,URLSearchParams,TextEncoder,btoa}
);

test('YouTube accepts standard share, Shorts and live links and preserves start time',()=>{
  const id='M7lc1UVf-VE', expected='https://www.youtube-nocookie.com/embed/'+id;
  for(const link of [
    'https://www.youtube.com/watch?v='+id,
    'https://youtu.be/'+id+'?si=abc',
    'https://www.youtube.com/shorts/'+id,
    'https://youtube.com/live/'+id,
    'https://www.youtube.com/embed/'+id,
    expected
  ])assert.equal(Embeds.youtube(link),expected);
  assert.equal(Embeds.youtube('https://youtu.be/'+id+'?t=1m34s'),expected+'?start=94');
  for(const bad of ['https://youtu.be.evil.test/'+id,'https://youtu.be:444/'+id,'https://x@youtu.be/'+id,'https://www.youtube.com/watch?v=x','javascript:alert(1)']){
    assert.equal(Embeds.youtube(bad),null);
  }
});
test('custom embed markup is encoded into an opaque iframe and cannot request parent permissions',()=>{
  const text='<p>Local example</p><script>document.body.dataset.test=1</script>';
  const spec=Embeds.getSpec('embed',text);
  assert.equal(spec.type,'html');
  assert.equal(Buffer.from(spec.src.split(',')[1],'base64').toString(),text);
  const attrs={'data-ncw-embed':spec.type,sandbox:spec.sandbox,src:spec.src,title:spec.title,referrerpolicy:Embeds.REFERRER,allow:Embeds.ALLOW};
  const accepted=()=>Embeds.safeFrame(name=>attrs[name]);
  assert(accepted());
  attrs.sandbox='allow-scripts allow-same-origin';assert(!accepted());
  const remote=Embeds.getSpec('embed','https://example.test/widget');
  Object.assign(attrs,{'data-ncw-embed':remote.type,sandbox:remote.sandbox,src:remote.src});
  assert(accepted());
  attrs.src='https://someone:secret@example.test/widget';assert(!accepted());
  attrs.src='javascript:alert(1)';assert(!accepted());
});
test('column drag keeps adjacent total and untouched neighbours, with a minimum width',()=>{
  const original=[25,25,25,25];
  assert.deepEqual(Array.from(Columns.resize(original,1,7,5)),[25,32,18,25]);
  assert.deepEqual(Array.from(Columns.resize(original,1,500,5)),[25,45,5,25]);
  assert.deepEqual(Array.from(Columns.resize(original,1,-500,5)),[25,5,45,25]);
  assert.deepEqual(original,[25,25,25,25]);
  assert.equal(Columns.count(29),29);
  assert.equal(Columns.count('3.5'),null);
  assert.equal(Columns.count(101),null);
});
