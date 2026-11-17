'use strict';
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const route=readFileSync('public/studio/homepage-route.js','utf8');
const base='https://mshahrooz.github.io/Newcitywellness/studio/';
function redirects(path=''){
  const found=[];
  vm.runInNewContext(route,{ URL,location:{href:base+path,replace:url=>found.push(url)} });
  return found;
}
test('the default editor and explicit Home route open the new homepage builder',()=>{
  assert.deepEqual(redirects(),[base+'homepage/']);
  assert.deepEqual(redirects('?page=home'),[base+'homepage/']);
  assert.deepEqual(redirects('index.html?page=home'),[base+'homepage/']);
});
test('every other page and the explicitly chosen Classic homepage keep the original editor',()=>{
  const registry=readFileSync('supabase/functions/publish-homepage/pages.mjs','utf8');
  const pages=JSON.parse(registry.split('export const PAGES = ')[1].split(';\n')[0]);
  for(const [id] of pages.slice(1))assert.deepEqual(redirects('?page='+id),[]);
  assert.deepEqual(redirects('?page=home&editor=classic'),[]);
  assert.deepEqual(redirects('?editor=classic'),[]);
});
