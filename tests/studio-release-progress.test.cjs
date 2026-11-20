const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const test=require('node:test');

const code=readFileSync(path.join(__dirname,'../public/studio/release-progress.js'),'utf8');
function fixture(reduce=false){
  let now=0, frame=0;
  const pending=new Map();
  const doc={createElementNS:(_,name)=>create(name)};
  function create(tag,attrs={},text=''){
    return {
      tag,attrs:{...attrs},textContent:text,dataset:{},style:{},children:[],
      ownerDocument:doc,isConnected:true,
      append(...children){this.children.push(...children);},
      setAttribute(k,v){this.attrs[k]=String(v);},
      removeAttribute(k){delete this.attrs[k];},
      querySelector(name){return this.children.find(child=>child.tag===name);},
      closest(){return null;},
    };
  }
  const release=vm.runInNewContext(code+'\nStudioRelease',{
    create,performance:{now:()=>now},matchMedia:()=>({matches:reduce}),
    requestAnimationFrame:fn=>{pending.set(++frame,fn);return frame;},
    cancelAnimationFrame:id=>pending.delete(id),
  });
  const card=release.mount(['home'],create('main'));
  const progress=()=>Number(card.children[1].children[1].attrs['aria-valuenow']);
  return {
    set:(stage)=>release.set('home',stage,stage,'https://example.test/'),
    progress,card,
    tick(ms){now+=ms;const calls=[...pending.values()];pending.clear();calls.forEach(fn=>fn(now));return progress();},
  };
}

test('the shown percentage moves in small steps, with no jump on milestones',()=>{
  const f=fixture();
  assert.equal(f.progress(),0);
  f.set('prepare');
  assert.ok(f.tick(1000)>0);
  const first=f.progress();
  f.set('checking');
  assert.equal(f.progress(),first);
  for(let i=0;i<4;i++){
    const prior=f.progress();
    const next=f.tick(700);
    assert.ok(next>prior&&next<=prior+4);
  }
  const before=f.progress();
  f.set('deploy');
  assert.equal(f.progress(),before);
  for(let i=0;i<6;i++){
    const prior=f.progress();
    assert.ok(f.tick(1000)>prior);
  }
});

test('the estimate never reports 100% until the live page is verified',()=>{
  const f=fixture();
  f.set('deploy');
  assert.ok(f.tick(120000)<=94);
  f.set('verify');
  assert.ok(f.tick(120000)<100);
  f.set('live');
  assert.equal(f.tick(1600),100);
});

test('failed attempts stop rising and a new attempt starts at zero',()=>{
  const f=fixture();
  f.set('commit');
  f.tick(1800);
  f.set('error');
  const failed=f.progress();
  assert.equal(f.tick(10000),failed);
  f.set('prepare');
  assert.equal(f.progress(),0);
});

test('reduced motion displays the verified completion immediately',()=>{
  const f=fixture(true);
  f.set('deploy');
  assert.ok(f.tick(3000)<100);
  f.set('live');
  assert.equal(f.progress(),100);
});

test('a slow deployment has no frozen percentage and a failed one hides the meter',()=>{
  const f=fixture();
  f.set('deploy');
  f.tick(25000);
  f.set('waiting');
  assert.ok(Number.isNaN(f.progress()));
  assert.equal(f.card.children[1].children[0].children[1].hidden,true);
  f.set('verify');
  assert.ok(f.progress()<100);
  f.set('error');
  assert.equal(f.card.children[1].hidden,true);
  f.set('prepare');
  assert.equal(f.card.children[1].hidden,false);
  assert.equal(f.progress(),0);
});
