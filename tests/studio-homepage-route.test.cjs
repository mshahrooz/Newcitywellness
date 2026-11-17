'use strict';
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const index=readFileSync('public/studio/index.html','utf8');
const classic=readFileSync('public/studio/studio.js','utf8');
test('classic is the default for the homepage and the original page selector',()=>{
  assert.doesNotMatch(index,/<script[^>]+homepage-route/);
  assert.doesNotMatch(classic,/location\.assign\(new URL\('homepage\//);
  const stale=readFileSync('public/studio/homepage-route.js','utf8'),attempts=[];
  vm.runInNewContext(stale,{URL,location:{href:'https://mshahrooz.github.io/Newcitywellness/studio/',replace:url=>attempts.push(url)}});
  assert.deepEqual(attempts,[]);
  assert.match(index,/<select id="page-picker"/);
  assert.match(index,/aria-controls="element-sidebar" aria-expanded="false"/);
  assert.match(index,/<aside id="element-sidebar"[^>]+ hidden>/);
  assert.match(index,/id="page-seo" aria-label="Edit SEO settings for this page"/);
});
