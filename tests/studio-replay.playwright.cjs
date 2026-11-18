/* Run against a GitHub Pages build: NODE_PATH=/path/to/modules node --test tests/studio-replay.playwright.cjs */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {chromium}=require('playwright');

test('fixed practitioner replay preserves formatted text, link, and 3,000+ characters',async()=>{
  const base='https://mshahrooz.github.io/Newcitywellness/';
  const out=path.resolve(process.env.STUDIO_OUT||'out');
  assert.ok(fs.existsSync(path.join(out,'studio/studio.js')),'Run a Pages build before this test.');
  const browser=await chromium.launch({executablePath:process.env.STUDIO_CHROMIUM||undefined,args:['--no-sandbox']});
  try{
    const tab=await browser.newPage({viewport:{width:1300,height:950}});
    await tab.route(base+'**',async route=>{
      let file=decodeURI(new URL(route.request().url()).pathname.slice('/Newcitywellness/'.length));
      if(!file||file.endsWith('/'))file+='index.html';
      const revision='a'.repeat(24);
      if(file==='homepage-studio/live-revision.json')return route.fulfill({json:{revision,publication:null}});
      if(file==='index.html')return route.fulfill({contentType:'text/html',body:'<meta name="ncw-home-revision" content="'+revision+'">'});
      if(file==='studio/canvas.html'){
        const canvas=fs.readFileSync(path.join(out,file),'utf8').replace(/(<p\b[^>]*\bdata-editor-field="bio-copy"[^>]*>).*?(<\/p>)/s,
          '$1Meet <strong>Mordechai</strong> for <em>personalized care</em>. <a href="/Newcitywellness/about-us/">About us</a>.$2');
        return route.fulfill({contentType:'text/html',body:canvas});
      }
      const full=path.join(out,file);
      if(!full.startsWith(out+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile())return route.fulfill({status:404,body:''});
      return route.fulfill({path:full});
    });
    await tab.goto(base+'studio/');
    await tab.getByText('Live version verified',{exact:true}).waitFor();
    const frame=tab.frameLocator('#canvas'), locator='p[data-editor-field="bio-copy"]';
    const long='A'.repeat(3200);
    await tab.evaluate(({long,selector})=>{
      const bio=D.querySelector(selector), id=idOf(bio);
      const ops=[
        {kind:'copy-text',id,value:'Meet Mordechai for personalized care. About us today.'},
        {kind:'rich-text',id,value:'<strong>'+long+'</strong> <em>practice</em> <a href="/Newcitywellness/about-us/">About us</a>'},
      ];
      for(const op of ops)if(!record(op))throw Error('Replay operation was rejected.');
      replay();
    },{long,selector:locator});
    const bio=frame.locator(locator);
    assert.equal(await bio.locator('strong').textContent(),long);
    assert.equal(await bio.locator('em').textContent(),'practice');
    assert.equal(await bio.locator('a').getAttribute('href'),'/Newcitywellness/about-us/');
    await tab.locator('#undo').click();
    assert.equal(await bio.locator('a').textContent(),'About us today');
    await tab.locator('#redo').click();
    assert.equal(await bio.locator('strong').textContent(),long);
  }finally{await browser.close();}
});
