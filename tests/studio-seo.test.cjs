'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const seo=vm.runInNewContext(fs.readFileSync('public/studio/seo.js','utf8')+'\nStudioSeo',{URL});
const source=fs.readFileSync('public/studio/studio.js','utf8');
const operation=value=>({kind:'seo',id:'page-seo',value});
test('SEO is one undoable page operation, with blank values restoring default tags',()=>{
 const timeline=[operation({title:'Home SEO',robots:'noindex'}),operation({title:'  Another   Title   '})];
 assert.equal(seo.fromOperations(timeline).title,'Another Title');
 assert.equal(seo.fromOperations(timeline.slice(0,1)).robots,'noindex');
 assert.equal(seo.fromOperations([...timeline,operation({})]).title,'');
 assert.equal(seo.fromOperations([operation({title:'x'.repeat(161)})]).title,'');
});
test('canonical settings accept HTTPS only and text remains data',()=>{
 for(const url of ['javascript:alert(1)','//example.com','https://a.example/#tag','https://me:pass@example.org/','https://exa mple.org/','https://example.org:99999/']){
   assert.equal(seo.normalize({canonical:url}),null);
 }
 assert.equal(seo.normalize({canonical:'https://example.com/about?x=1&y=2'}).canonical,'https://example.com/about?x=1&y=2');
 assert.equal(seo.normalize({title:'<script> text </script>'}).title,'<script> text </script>');
 assert.match(source,/record\(\{kind:'seo',id:'page-seo',value\}\)/);
});
