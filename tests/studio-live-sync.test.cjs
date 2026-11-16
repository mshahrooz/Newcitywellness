const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash, webcrypto} = require('node:crypto');
const {gzipSync} = require('node:zlib');
const {test} = require('node:test');
const vm = require('node:vm');

const home = ['home', 'Home', ''];
const about = ['about-us', 'About Us', 'about-us'];
const origin = 'https://mshahrooz.github.io';
const prefix = '/Newcitywellness/';
const studio = path.join(__dirname, '../public/studio');
const publisher = fs.readFileSync(path.join(studio, 'publish.js'), 'utf8');
const publication = '12345678-abcd-4000-a000-123456789abc';
const revision = 'f'.repeat(24);
const source = 'c'.repeat(40);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const draft = {version: 1, page: 'new-city-wellness-about-us', operations: [{kind: 'text', id: 'heading', value: 'New live heading'}]};
const portable = Buffer.from(JSON.stringify({encoding: 'gzip-base64', data: gzipSync(JSON.stringify(draft)).toString('base64')}));
function fixture({pageRevision=revision, bytes=portable, state, pagesOrigin=origin}={}) {
  const calls = [];
  const manifest = state || {revision, source, publication, draftSha256: digest(portable)};
  const ctx = {
    TextEncoder, TextDecoder, URL, AbortSignal, Uint8Array, Response, Blob, DecompressionStream, crypto: webcrypto,
    atob, btoa, $: () => null, location: {origin: pagesOrigin}, fetch: async (addr, options) => {
      const url = new URL(addr);
      calls.push({url, options});
      assert.equal(url.origin, origin);
      if(url.pathname.endsWith('/live-revision.json'))return new Response(JSON.stringify(manifest));
      if(url.pathname.endsWith('/draft.json'))return new Response(bytes);
      return new Response('<meta name="ncw-home-revision" content="'+pageRevision+'">');
    }
  };
  const api=vm.runInNewContext(publisher+'\nStudioPublish;', ctx);
  return {api, calls};
}
test('Studio validates the actual page and portable draft before opening a Pages publication', async () => {
  const {api,calls}=fixture();
  const manifest=await api.liveManifest(about);
  assert.equal(manifest.source,source);
  const opened=await api.loadLiveDraft(about,manifest);
  assert.deepEqual(JSON.parse(JSON.stringify(opened)),draft);
  assert.deepEqual(calls.map(call=>call.url.pathname),[
    prefix+'homepage-studio/pages/about-us/live-revision.json',prefix+'about-us/',prefix+'homepage-studio/pages/about-us/draft.json',
  ]);
  assert.ok(calls.every(({options})=>options.cache==='no-store'));
});
test('a newer manifest alone must not replace the canvas while Pages or the draft remains stale', async () => {
  const mismatch=fixture({pageRevision:'a'.repeat(24)});
  await assert.rejects(mismatch.api.loadLiveDraft(about,await mismatch.api.liveManifest(about)),/serving a different version/);
  const invalid=fixture({bytes:Buffer.from('older draft')});
  await assert.rejects(invalid.api.loadLiveDraft(about,await invalid.api.liveManifest(about)),/draft is not ready/);
});
test('the initial baseline is verified without a draft, with no production lookup on local previews', async () => {
  const original=fixture({state:{revision,publication:null}});
  assert.equal(await original.api.loadLiveDraft(home,await original.api.liveManifest(home)),null);
  assert.deepEqual(original.calls.map(({url})=>url.pathname),[prefix+'homepage-studio/live-revision.json',prefix]);
  const local=fixture({pagesOrigin:'http://localhost'});
  assert.equal(await local.api.liveManifest(about),null);
  assert.equal(local.calls.length,0);
});
test('Studio does not offer a manual published-page load in the Publish panel', () => {
  assert.doesNotMatch(publisher,/Load published page into editor/i);
  assert.match(publisher,/await verifyLivePage\(target,live\)/);
  assert.match(publisher,/void syncLiveCanvas\(\)/);
});
