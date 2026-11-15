'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');

test('Studio registers all public routes, with unique publication, draft, and identity paths', async()=>{
  const {PAGES,pageFiles,pageDependencies,EMBEDS}=await import('../supabase/functions/publish-homepage/pages.mjs');
  const source=fs.readdirSync('src/app',{recursive:true}).filter(name=>path.basename(name)==='page.tsx'&&!name.startsWith('admin/'));
  const routes=source.map(name=>path.dirname(name)==='.'?'':path.dirname(name));
  assert.deepEqual(PAGES.map(page=>page[2]).sort(),routes.sort());
  assert.equal(new Set(PAGES.map(page=>page[0])).size,PAGES.length);
  for(const field of ['source','draft','identity'])assert.equal(new Set(PAGES.map(page=>pageFiles(page[0])[field])).size,PAGES.length);
  assert.equal(pageFiles('home').identity,'new-city-wellness-homepage');
  assert.equal(pageFiles('home').draft,'public/homepage-studio/draft.json');
  assert.equal(pageFiles('faqs').source,'src/content/studio-pages/faqs.json');
  assert.deepEqual(Object.keys(EMBEDS).sort(),['contact-us','insurance']);
  const tree=fs.readdirSync('src/app',{recursive:true}).map(name=>'src/app/'+name);
  const guarded=pageDependencies(PAGES.find(page=>page[0]==='acupuncture'), tree);
  assert(guarded.includes('src/app/services/acupuncture/page.tsx'));
  assert(guarded.includes('src/app/services/service-detail-page.tsx'));
  assert(!guarded.includes('src/app/services/cupping/page.tsx'));
  assert(!guarded.includes('src/app/about-us/page.tsx'));
});
