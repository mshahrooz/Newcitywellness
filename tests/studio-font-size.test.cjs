'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');

const code=fs.readFileSync('public/studio/font-size.js','utf8');
const settings=vm.runInNewContext(code+'\nStudioFontSize',{StudioText:{available:()=>false},content:n=>n});
function styled(children=[]){
  const properties=new Map(), attributes=new Map();
  return {
    properties,attributes,dataset:{bsKind:'title'},matches:()=>false,querySelectorAll:()=>children,
    getAttribute:k=>attributes.get(k),setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),
    style:{
      get fontSize(){return properties.get('font-size')||'';},
      getPropertyValue:k=>properties.get(k)||'',
      setProperty:(k,v)=>properties.set(k,v),
      removeProperty:k=>properties.delete(k),
    }
  };
}
const edit=(node,device,value)=>settings.apply(node,{device,value});

test('font size edits and resets are independent on desktop, tablet and mobile',()=>{
  const node=styled();
  assert.equal(edit(node,'desktop',48),true);
  assert.deepEqual([...node.properties],[['--bs-font-desktop','48px']]);
  assert.equal(edit(node,'tablet','32'),true);
  assert.equal(edit(node,'mobile',24),true);
  assert.equal(edit(node,'desktop',''),true);
  assert.deepEqual([...node.properties],[['--bs-font-tablet','32px'],['--bs-font-mobile','24px']]);
  assert.equal(edit(node,'all',36),false);
  assert.equal(edit(node,'mobile','99'),false);
  assert.equal(edit(node,'tablet',null),false);
});

test('restoring a legacy inline size to default on mobile preserves other devices and decorations',()=>{
  const titleRun=styled(), heading=styled([titleRun]);
  titleRun.style.setProperty('font-size','48px');
  titleRun.style.setProperty('color','#123456');
  titleRun.style.setProperty('--bs-font-desktop','54px');
  assert.equal(edit(heading,'mobile',''),true);
  assert.deepEqual([...titleRun.properties],[
    ['color','#123456'],['--bs-font-desktop','54px'],['--bs-font-tablet','48px']
  ]);
  assert.equal(heading.properties.size,0);
  assert.equal(edit(heading,'mobile','28'),true);
  assert.equal(heading.properties.get('--bs-font-mobile'),'28px');
  assert.equal(titleRun.properties.get('--bs-font-desktop'),'54px');
});

test('legacy device layout styles unrelated to font size are preserved',()=>{
  const node=styled();
  node.setAttribute('data-bs-responsive-mobile','width font align');
  node.style.setProperty('--bs-device-mobile-font','29px');
  node.style.setProperty('--bs-device-mobile-width','90%');
  assert.equal(edit(node,'desktop',45),true);
  assert.equal(node.getAttribute('data-bs-responsive-mobile'),'width font align');
  assert.equal(edit(node,'mobile',''),true);
  assert.equal(node.getAttribute('data-bs-responsive-mobile'),'width align');
  assert.deepEqual([...node.properties],[['--bs-device-mobile-width','90%'],['--bs-font-desktop','45px']]);
});

test('canvas and public page share the same non-overlapping font-size rules',()=>{
  const block=path=>fs.readFileSync(path,'utf8').split('/* Scoped text size.')[1];
  const css=block('public/studio/canvas-edits.css');
  assert.equal(css,block('public/homepage-studio/layout-v1.css'));
  for(const [device,condition] of [['desktop','width > 900px'],['tablet','600px < width <= 900px'],['mobile','width <= 600px']]){
    const rule=`[style*="--bs-font-${device}:"]{font-size:var(--bs-font-${device})!important}`;
    assert.ok(css.includes(`:root[data-bs-device="${device}"] ${rule}`));
    assert.ok(css.includes(`@media (${condition}) {\n  :root:not([data-bs-device]) ${rule}`));
  }
});
