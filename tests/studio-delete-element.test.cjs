'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');
const studio=fs.readFileSync('public/studio/studio.js','utf8');
const source=studio.slice(studio.indexOf('function canDeleteElement'),studio.indexOf('function apply(op)'));

function setup({photo=false,zone=false,row=false,grid=false}={}){
  const calls=[];
  const frame={children:[1],id:'',querySelectorAll:()=>[],remove:()=>calls.push('photo-frame')};
  const node={
    isConnected:true,id:'subject',parentElement:frame,dataset:{bsKind:photo?'image':row?'':'title'},
    hasAttribute:key=>key==='data-bs-row'?row:key==='data-bs-zone'?zone:false,
    matches:()=>false,querySelectorAll:()=>[],remove:()=>calls.push('node'),
  };
  const slot={dataset:{bsFlowOrigin:'item'},remove:()=>calls.push('origin-slot')};
  const reference={
    getAttribute:name=>name==='aria-labelledby'?'subject unrelated':null,
    setAttribute:(name,value)=>calls.push([name,value]),removeAttribute:()=>{},
  };
  const env=vm.createContext({
    idOf:()=> 'item',therapyPhoto:()=>photo,freeShell:()=>grid?'shell':null,
    removeFreeContainer:value=>calls.push(value),dePair:()=>calls.push('pair-check'),
    StudioFlow:{cleanupAutoColumn:()=>{}},
    D:{querySelectorAll:q=>q.startsWith('template')?[slot]:[reference],getElementById:()=>null},
  });
  vm.runInContext(source,env);
  return {env,node,calls};
}

test('existing selectable content can be deleted while structural zones stay intact',()=>{
  const {env,node,calls}=setup();
  assert.equal(env.deleteElement(node),true);
  assert.deepEqual(calls,['node','pair-check','origin-slot',['aria-labelledby','unrelated']]);
  const protectedZone=setup({zone:true});
  assert.equal(protectedZone.env.deleteElement(protectedZone.node),false);
  assert.deepEqual(protectedZone.calls,[]);
});

test('delete cleans up a free grid wrapper and a removed therapy photo has no empty frame',()=>{
  const grid=setup({grid:true}),photo=setup({photo:true});
  assert(grid.env.deleteElement(grid.node));
  assert.deepEqual(grid.calls.slice(0,3),['node','shell','origin-slot']);
  assert(photo.env.deleteElement(photo.node));
  assert.deepEqual(photo.calls,['photo-frame','pair-check','origin-slot']);
});

test('the larger text editor targets popup copy fields, not published typography',()=>{
  const css=fs.readFileSync('public/studio/studio.css','utf8');
  assert.match(css,/\.popup-body \.studio-text\{font-size:14px/);
  assert.match(css,/textarea\.studio-text\{min-height:clamp\(132px/);
  assert.match(css,/\.popup-footer\{[^}]*flex-shrink:0/);
});

test('native and added divider settings both expose Delete divider and record one undoable removal',()=>{
  const openSource=studio.slice(studio.indexOf('function open(title,'),studio.indexOf('function para('));
  const settingsSource=studio.slice(studio.indexOf('function openSettings('),studio.indexOf('  if(n.hasAttribute(\'data-bs-column\')){',studio.indexOf('function openSettings(')));
  for(const native of [true,false]){
    const {env,node,calls}=setup();
    const ids={};
    const get=id=>ids[id]??=({textContent:'',setAttribute(){},focus(){calls.push('focus '+id);}});
    const history=[];
    Object.assign(env,{
      $:get, body:{replaceChildren(){}}, popup:{hidden:true}, active:'item',
      flash:copy=>calls.push(copy), close(){env.popup.hidden=true;},
      paint(){}, adjustPopup(){}, para(){}, dragResetControl(){}, group(){},
      record(op){
        if(!env.deleteElement(node))return false;
        history.push([op.kind,op.id]);return true;
      }
    });
    node.dataset.bsKind='divider';
    node.hasAttribute=name=>native&&name==='data-bs-divider';
    vm.runInContext(openSource+settingsSource+'}\n'+(native?'openSettings(subject);':"open('Divider','ELEMENT SETTINGS',subject);"),Object.assign(env,{subject:node}));
    assert.equal(ids['popup-footer'].hidden,false);
    assert.equal(ids['delete-element'].textContent,'Delete divider');
    ids['delete-element'].onclick();
    assert.deepEqual(history,[['remove','item']]);
    assert.ok(calls.includes('node'));
    assert.ok(calls.includes('focus undo'));
    assert.equal(env.popup.hidden,true);
  }
});

test('the sticky Add Elements button and collapse arrow use the requested blue',()=>{
  const css=fs.readFileSync('public/studio/studio.css','utf8');
  assert.match(css,/#add,#element-sidebar-close\{background:#3756ff;color:#fff\}/);
});
