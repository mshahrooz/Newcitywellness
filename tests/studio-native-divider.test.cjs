'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const studio = fs.readFileSync('public/studio/studio.js', 'utf8');
const source = studio.slice(studio.indexOf('function markCardAndDividerTargets('), studio.indexOf('function content('));
test('native dividers keep legacy IDs and move as units while narrow lines have a usable hit area',()=>{
  const make = (dataset, rect, extra=false)=>({dataset,getBoundingClientRect:()=>rect,closest:()=>null,matches:()=>extra});
  const horizontal=make({bsId:'detail-new-30'},{left:30,right:250,top:100,bottom:101,width:220,height:1});
  const vertical=make({},{left:70,right:71,top:150,bottom:192,width:1,height:42},true);
  const card={dataset:{bsId:'extra-22'}};
  const D={querySelectorAll:q=>q.includes('condition-grid')?[card]:[horizontal,vertical]};
  const ctx={D,idOf:n=>n.dataset.bsId,zoneOf:()=>true,rowOf:()=>true};
  const finder=vm.runInNewContext(source+'\nmarkCardAndDividerTargets();dividerFrom;',ctx);
  assert.equal(card.dataset.bsMove,'yes');
  assert.equal(horizontal.dataset.bsId,'detail-new-30');
  assert.equal(horizontal.dataset.bsKind,'divider');
  assert.equal(vertical.dataset.bsId,'native-divider-1');
  assert.equal(vertical.dataset.bsMove,undefined);
  const parent={closest:()=>null,querySelectorAll:()=>[horizontal,vertical]};
  assert.equal(finder(parent,60,95),horizontal);
  assert.equal(finder(parent,66,175),vertical);
  assert.equal(finder(parent,60,93),null);
  assert.equal(finder({closest:()=>horizontal},0,0),horizontal);
});
