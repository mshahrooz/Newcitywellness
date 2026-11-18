const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const load=(file,symbol,env={})=>vm.runInNewContext(readFileSync('public/studio/'+file,'utf8')+'\n'+symbol,{URL,...env});
const author=load('authoring.js','StudioAuthoring');
const draft=load('draft-tools.js','StudioDraft');
const media=load('media.js','StudioMedia');

test('links allow page URLs, tel and mailto but reject javascript and protocol-relative addresses',()=>{
  for(const url of ['https://example.test/book','/about-us/','#hours','tel:+1-845-579-2428','mailto:clinic@example.test'])assert(author.href(url),url);
  for(const url of ['javascript:alert(1)','data:text/html,hi','//example.test','https://someone:pw@example.test','tel:bogus'])assert(!author.href(url),url);
  assert(author.plain('x'.repeat(40000)));assert(!author.plain('x'.repeat(40001)));
});
test('compact drops repeated setters without reordering structural operations',()=>{
  const a={kind:'font-size',id:'h',value:12},b={...a,value:20},c={kind:'move',id:'row-a',target:'row-b'},d={...a,value:21};
  assert.deepEqual(Array.from(draft.compact([a,b,c,d]),op=>op.value),[20,undefined,21]);
  const r={kind:'rich-text',id:'h',value:'<em>A</em>'}, p={kind:'copy-text',id:'h',value:'B'};
  assert.equal(draft.compact([r,p,{...r,value:'<a>B</a>'}]).length,3);
});
test('uploaded media signatures and width variants are parsed independently of filenames',()=>{
  assert(media.matches('jpg',Uint8Array.of(255,216,255,0)));
  assert(!media.matches('jpg',Buffer.from('<script>')));
  assert(media.matches('pdf',Buffer.from('%PDF-1.7')));
  assert(!media.matches('docx',Buffer.from('%PDF-1.7')));
  const variants=media.parseSrcset('data:image/webp;base64,UklGRg== 480w, /images/large.webp 960w');
  assert.deepEqual(Array.from(variants,v=>Array.from(v)),[['data:image/webp;base64,UklGRg==','480w'],['/images/large.webp','960w']]);
});
