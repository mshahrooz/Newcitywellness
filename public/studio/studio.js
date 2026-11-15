'use strict';
const $=id=>document.getElementById(id);
const frame=$('canvas'), stage=$('stage'), popup=$('popup'), body=$('popup-body'), outline=$('outline'), selection=$('selection');
const STORAGE='ncw.bakery.home.v1', MAX_FILE=2*1024*1024, MAX_JSON=100*1024*1024;
const types={title:['Heading','A new section heading'],'text':['Paragraph','Write a short paragraph here.'],'image':['Image',''],'button':['Button','Learn more'],'document':['Document','Download document'],'row':['Row','']};
let pendingPublisherBase=null;
let D, original, list=[], savedOps=[], cursor=0, active=null, mode='edit', view='desktop', drag, guide, placement, stopBehavior, toastTimer, gesture, viewportTick, baselineReady=false;
const labels={hero:'Home hero',therapies:'Explore Our Therapies','first-visit':'Your First Visit',practitioner:'Meet the Practitioner',conditions:'Areas We Support',experiences:'Patient Experiences',contact:'Contact and hours'};
const idOf=n=>n?.getAttribute('data-bs-id');
const byId=id=>[...D.querySelectorAll('[data-bs-id]')].find(n=>idOf(n)===id);
const rowOf=n=>n?.closest('[data-bs-row]');
const main=()=>D.querySelector('main[data-builder-page]');
const create=(tag,attrs={},label='')=>{const el=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')el.className=v;else el.setAttribute(k,v);}if(label)el.textContent=label;return el;};
const inside=(p,s)=>p?.closest(s);
const isExisting=e=>!!e&&!e.closest('[data-bs-new]');
const rowTitle=n=>n?.dataset.bsLabel||labels[n?.getAttribute('data-builder-section')]||'Section';
const titleOf=n=>n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone')?rowTitle(n):n.hasAttribute('data-bs-column')?'Column':({image:'Image',button:'Button',document:'Document',title:'Heading',text:'Paragraph',link:'Link',component:'Component',detail:'Detail',form:'Form',field:'Form field',video:'Video'})[n.dataset.bsKind]||'Element';
const rowList=()=>[...main().children].filter(x=>x.hasAttribute('data-bs-row'));
const unique=()=> 'new-'+crypto.randomUUID();
const asString=(v,len=3000)=>typeof v==='string'?v.slice(0,len):'';
const bounded=(v,lo,hi)=>Number.isFinite(Number(v))?Math.min(hi,Math.max(lo,Number(v))):lo;
function flash(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function showState(){
  $('undo').disabled=mode==='preview'||!cursor;
  $('redo').disabled=mode==='preview'||cursor===list.length;
  $('saved').textContent=!cursor?'Original layout':cursor===savedOps.length&&savedOps.every((op,i)=>op===list[i])?'Draft saved in this browser':'Unsaved draft';
}
function record(op, token){
  if (!apply(op)) return false;
  if (token && gesture===token && cursor>0 && cursor===list.length) list[cursor-1]=op;
  else {list.splice(cursor);list.push(op);cursor=list.length;}
  gesture=token||null;refreshFreeSizes();showState();paint();return true;
}
function resetBody(){
  stopBehavior?.();
  D.body.innerHTML=original;
}
function replay(){
  const t=D.defaultView.scrollY;
  resetBody();
  for(const op of list.slice(0,cursor))apply(op);
  refreshFreeSizes();
  stopBehavior=enableHomepageBehavior(D,()=>mode==='edit',flash);
  requestAnimationFrame(()=>{D.defaultView.scrollTo(0,t);paint();});
  if(active&&!byId(active)) active=null;
  showState();paint();
}
function history(step){
  const next=cursor+step;
  if(next<0||next>list.length)return;
  cursor=next;gesture=null;close();replay();
}
function syncViewport() {
  if(!D)return;
  const h=view==='tablet'?1024:view==='mobile'?844:window.innerHeight;
  D.documentElement.style.setProperty('--bs-hero-vh88',Math.round(h*.88*100)/100+'px');
  D.documentElement.style.setProperty('--bs-hero-vh80',Math.round(h*.80*100)/100+'px');
  D.documentElement.style.setProperty('--bs-hero-vh10',Math.round(h*.10*100)/100+'px');
  D.documentElement.dataset.bsDevice=view;
}
function markCanvas() {
  const m=main();
  m.querySelectorAll(':scope > [data-builder-section]').forEach(row=>{
    const id=row.getAttribute('data-builder-section');row.dataset.bsId='row-'+id;row.dataset.bsRow='native';
    const candidates=row.querySelectorAll('h1,h2,h3,h4,p,img,a.btn');
    let i=0;
    candidates.forEach(el=>{
      if(el.closest('form') || el.closest('.clinic-hours') || el.classList.contains('form-note'))return;
      if(el.matches('img')&&(!el.hasAttribute('data-editor-image')||el.closest('a.btn')))return;
      const num=++i;
      el.dataset.bsId=id+'-'+num;
      el.dataset.bsKind=el.matches('img')?'image':el.matches('a.btn')?'button':el.matches('h1,h2,h3,h4')?'title':'text';
      // Keep image masks, tab/slider structure, and nested cards intact.
      if(el.matches('h1,h2,h3,h4,p')&&!el.closest('a,.testimonial-card,.contact-form-wrap,.clinic-hours')){
        el.dataset.bsMove='yes';
      } else if(el.matches('a.btn')&&!el.closest('.hero-actions')){el.dataset.bsMove='yes';}
    });
  });
  registerExtraNodes();
}
function content(el){
  if(el.hasAttribute('data-bs-new')){
    if(el.dataset.bsKind==='image')return el.querySelector('img');
    if(el.dataset.bsKind==='button'||el.dataset.bsKind==='document')return el.querySelector('a');
    return el.firstElementChild;
  }
  if(el.dataset.bsKind==='button')return el.querySelector('[data-editor-field],[data-builder-copy]')||el;
  return el;
}
function textCopy(el){if(!el)return '';return el.textContent.replace(/\s+/g,' ').trim();}
function okayURL(link){
  if(/^#[A-Za-z0-9_:-]*$/.test(link))return true;
  try{return ['https:','http:','tel:','mailto:'].includes(new URL(link).protocol);}catch{return false;}
}
function okayData(value,kind){
  return typeof value==='string'&&value.length<=MAX_FILE*1.35+100&& (kind==='image'?/^data:image\/(?:jpeg|png|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/:/^data:application\/(?:pdf|octet-stream);base64,[A-Za-z0-9+/=]+$/).test(value);
}
function addNative(tag,attrs={},copy=''){
  const n=D.createElement(tag);
  for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);
  if(copy)n.textContent=copy;
  return n;
}
function makeRow(id,count){
  const row=addNative('section',{class:'bs-row','data-bs-row':'custom','data-bs-id':id});
  const grid=addNative('div',{class:'bs-row-inner bs-grid'});row.append(grid);
  setColumns(row,count);
  return row;
}
function setColumns(row,count){
  const grid=row.querySelector(':scope > .bs-row-inner');
  while(grid.children.length<count){let i=grid.children.length;while(byId(idOf(row)+'-c'+i))i++;grid.append(addNative('div',{class:'bs-col','data-bs-id':idOf(row)+'-c'+i,'data-bs-column':''}));}
  while(grid.children.length>count){
    const last=grid.lastElementChild;
    [...last.children].forEach(e=>grid.children[count-1].append(e));last.remove();
  }
  grid.style.setProperty('--bs-cols',count);
}
function makeBlock(kind,id){
  const wrap=addNative('div',{class:'bs-new','data-bs-id':id,'data-bs-kind':kind,'data-bs-new':'','data-bs-move':'yes'});
  let node;
  if(kind==='title')node=addNative('h2',{},types[kind][1]);
  else if(kind==='text')node=addNative('p',{},types[kind][1]);
  else if(kind==='image')node=addNative('div',{class:'bs-placeholder'},'Choose an image to replace this placeholder');
  else if(kind==='document')node=addNative('a',{class:'bs-file-name',href:'#'},types[kind][1]);
  else node=addNative('a',{class:'btn',href:'#',target:'_blank',rel:'noopener noreferrer'},types[kind][1]);
  wrap.append(node);return wrap;
}
function canInline(n, target, side){
  if(!target||n===target||n?.contains(target))return false;
  if(target.hasAttribute('data-bs-column'))return side==='inside'&&n?.dataset.bsMove==='yes';
  if(!target.dataset.bsKind||target.dataset.bsMove!=='yes')return false;
  const p=target.parentElement;
  // Original content can be moved between supported areas without detaching navigation, masks or slider items.
  if(!p || p.matches('a,button,form,main,.hero-actions'))return false;
  if(side==='left'||side==='right')return !p.classList.contains('bs-pair');
  return side==='before'||side==='after';
}
function insertNear(n,target,side,pairId){
  if(!canInline(n,target,side))return false;
  if(side==='inside'){target.append(n);return true;}
  if(side==='before'||side==='after'){target[side](n);return true;}
  const pair=addNative('div',{class:'bs-pair','data-bs-id':pairId,'data-bs-pair':''});
  target.before(pair); if(side==='left')pair.append(n,target);else pair.append(target,n);
  return true;
}
function dePair(p){
  if(p?.classList.contains('bs-pair')&&p.children.length===1)p.replaceWith(p.firstElementChild);
  else if(p?.classList.contains('bs-pair')&&!p.children.length)p.remove();
}
function apply(op){
  if(!op||typeof op!=='object')return false;
  const n=byId(op.id), target=op.target?byId(op.target):null;
  if(op.kind==='grid-add'&&!n&&target&&Object.hasOwn(types,op.type)&&op.type!=='row'){
    return attachFree(makeBlock(op.type,op.id),target,op.device,op.p);
  }
  if(op.kind==='row-add' && !n){
    if(op.target && !target?.hasAttribute('data-bs-row'))return false;
    const row=makeRow(op.id,bounded(op.cols||1,1,4));
    if(op.blank)row.classList.add('bs-blank-section');
    if(target)target[op.side==='before'?'before':'after'](row);
    else if(op.side==='before')main().prepend(row);
    else main().insertBefore(row,main().querySelector(':scope > .editor-blocks'));
    return true;
  }
  if(op.kind==='add'&&!n&&target&&Object.hasOwn(types,op.type)&&op.type!=='row'){
    return insertNear(makeBlock(op.type,op.id),target,op.side,op.id+'-pair');
  }
  if(!n)return false;
  const k=n.dataset.bsKind, e=content(n);
  switch(op.kind){
    case 'duplicate': return dupElement(n,op.copy,op.device||'desktop',op.p);
    case 'drag-offset': return applyDragOffset(n,op);
    case 'grid-place': return ['desktop','tablet','mobile'].includes(op.device)&&attachFree(n,target,op.device,op.p,op.baseline);
    case 'grid-flow': return restoreFlow(n);
    case 'grid-auto': {
      const shell=freeShell(n);
      if(!shell||!['tablet','mobile'].includes(op.device))return false;
      shell.removeAttribute('data-bs-coord-'+op.device);
      for(const k of ['x','y','w','h','z'])shell.style.removeProperty('--bs-'+op.device+'-'+k);
      syncGridSize(shell.parentElement);return true;
    }
    case 'section-bg':case 'section-overlay':
      return n.hasAttribute('data-bs-row')&&sectionBackground(n,op);
    case 'section-name':
      if(!n.hasAttribute('data-bs-row'))return false;n.dataset.bsLabel=asString(op.value,80);return true;
    case 'section-height':
      if(!n.hasAttribute('data-bs-row'))return false;
      const el=surfaceOf(n), h=bounded(op.value,0,2500);
      el.classList.toggle('bs-manual-size',h>0);
      el.style.setProperty('--bs-manual-height',h+'px');return true;
    case 'move': {
      if(n.hasAttribute('data-bs-row')){
        if(!target?.hasAttribute('data-bs-row')||target===n)return false;
        target[op.side==='before'?'before':'after'](n);return true;
      }
      if(n.dataset.bsMove!=='yes'&&!freeShell(n))return false;
      const shell=freeShell(n),old=n.parentElement;
      if(!insertNear(n,target,op.side,op.pair||op.id+'-pair'))return false;
      if(shell)removeFreeContainer(shell);else dePair(old);return true;
    }
    case 'columns':if(n.dataset.bsRow!=='custom')return false;setColumns(n,bounded(op.value,1,4));return true;
    case 'row-gap':if(n.dataset.bsRow!=='custom')return false;n.querySelector(':scope > .bs-row-inner').style.setProperty('--bs-gap',bounded(op.value,0,80)+'px');return true;
    case 'row-color':if(n.dataset.bsRow!=='custom'||!/^#[0-9a-f]{6}$/i.test(op.value))return false;n.style.setProperty('--bs-row-color',op.value);return true;
    case 'text':if(!e||!['title','text','button','document','link','detail'].includes(k))return false;e.textContent=asString(op.value);return true;
    case 'image':
      if(k!=='image'||!okayData(op.value,k))return false;
      if(n.hasAttribute('data-bs-new')){
        const alt=n.dataset.bsAlt||e?.alt||''; const im=addNative('img',{src:op.value,alt,decoding:'async'});n.replaceChildren(im);
      } else {n.src=op.value;n.removeAttribute('srcset');n.removeAttribute('sizes');}
      return true;
    case 'alt':
      if(k!=='image')return false;
      const im=n.matches('img')?n:n.querySelector('img');
      n.dataset.bsAlt=asString(op.value,250);if(im)im.alt=n.dataset.bsAlt;return true;
    case 'file':
      if(k!=='document'||!okayData(op.value,k))return false;
      e.href=op.value;e.download=asString(op.name,180)||'download';return true;
    case 'link':
      if(k!=='button'||isExisting(n)||!okayURL(op.value))return false;
      e.setAttribute('href',op.value);return true;
    case 'align': {
      if(!['original','left','center','right'].includes(op.value))return false;
      if(k==='image'){
        const img=n.matches('img')?n:n.querySelector('img');
        if(op.value==='original'){n.style.removeProperty('text-align');img?.style.removeProperty('margin-inline');}
        else {n.style.textAlign=op.value;if(img)img.style.marginInline=op.value==='center'?'auto':op.value==='left'?'0 auto':'auto 0';}
      } else if(k==='button'&&isExisting(n)){
        if(op.value==='original'){n.style.removeProperty('margin-inline');n.style.removeProperty('justify-self');n.style.removeProperty('align-self');}
        else {n.style.marginInline=op.value==='center'?'auto':op.value==='left'?'0 auto':'auto 0';n.style.justifySelf=op.value==='center'?'center':op.value==='left'?'start':'end';n.style.alignSelf=n.style.justifySelf;}
      } else if(op.value==='original')n.style.removeProperty('text-align');else n.style.textAlign=op.value;
      n.dataset.bsAlign=op.value;return true;
    }
    case 'text-color':
      if(k==='image'||!e)return false;
      if(!op.value)e.style.removeProperty('color');
      else if(/^#[0-9a-f]{6}$/i.test(op.value))e.style.color=op.value;
      else return false;
      return true;
    case 'font-size':
      if(k==='image'||!e)return false;
      if(op.value==='')e.style.removeProperty('font-size');else e.style.fontSize=bounded(op.value,10,96)+'px';
      return true;
    case 'pad':
      if(!['top','right','bottom','left'].includes(op.edge))return false;
      const prop='padding-'+op.edge;
      if(op.value==='')n.style.removeProperty(prop);else n.style.setProperty(prop,bounded(op.value,0,220)+'px');return true;
    case 'remove':
      if(!n.hasAttribute('data-bs-new')&&n.dataset.bsRow!=='custom'&&!n.hasAttribute('data-bs-copy'))return false;
      const shell=freeShell(n), old=n.parentElement;n.remove();
      if(shell)removeFreeContainer(shell);else dePair(old);return true;
    default:return false;
  }
}
function validId(value){return typeof value==='string'&&/^[a-z0-9-]{1,96}$/i.test(value);}
function readDraft(raw){
  if(raw.length>MAX_JSON)throw Error('This draft is too large to import.');
  const obj=JSON.parse(raw);
  if(obj?.version!==1||obj?.page!=='new-city-wellness-homepage'||!Array.isArray(obj.operations)||obj.operations.length>800)throw Error('Choose a draft exported by Homepage Studio.');
  const ops=obj.operations;
  if(ops.some(o=>!o||!validId(o.id)||(o.target&&!validId(o.target))||(o.pair&&!validId(o.pair))||(o.copy&&!validId(o.copy))||typeof o.kind!=='string'))throw Error('This draft contains invalid edits.');
  return ops;
}
function draftString(){
  return JSON.stringify({version:1,page:'new-city-wellness-homepage',operations:list.slice(0,cursor),publishedBase:typeof StudioPublish!=='undefined'?StudioPublish.baseOfDraft():null});
}
let saveQueue=Promise.resolve();
function save({quiet=false}={}){
  const data=draftString(), undoStamp=list.slice(0,cursor);
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
    if(data.length<3500000){
      try{
        localStorage.setItem(STORAGE,data);
        if(window.indexedDB)await draftStore('readwrite',s=>s.delete(STORAGE)).catch(()=>{});
        savedOps=undoStamp;showState();if(!quiet)flash('Draft saved in this browser. Nothing was published.');return;
      }catch{}
    }
    try{
      await draftStore('readwrite',s=>s.put(data,STORAGE));
      try{localStorage.setItem(STORAGE,'@indexeddb');}catch{}
      savedOps=undoStamp;showState();if(!quiet)flash('Draft and media saved in this browser.');
    }catch{flash('Browser storage is unavailable or full. Download the editable draft to keep it.');}
  });
  return saveQueue;
}
function exportFile(data,name,type){
  const href=URL.createObjectURL(new Blob([data],{type}));const a=create('a',{href,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(href),5000);
}
function fileRead(file,kind,done){
  if(!file)return;
  if(file.size>MAX_FILE){flash('Choose a file no larger than 2 MB.');return;}
  const ext=file.name.split('.').pop().toLowerCase();
  const map={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',gif:'image/gif',pdf:'application/pdf'};
  if(kind==='image'&&!map[ext]?.startsWith('image/')||kind==='document'&&ext!=='pdf'){flash(kind==='image'?'Choose a JPG, PNG, WebP, AVIF or GIF.':'Choose a PDF document.');return;}
  const reader=new FileReader();reader.onload=()=>{const uri=String(reader.result).replace(/^data:[^;]*;/,'data:'+map[ext]+';');
    if(kind==='image'){
      const check=new Image();check.onload=()=>done(uri,file.name);check.onerror=()=>flash('This file could not be opened as an image.');check.src=uri;
    } else done(uri,file.name);
  };reader.onerror=()=>flash('This file could not be opened.');reader.readAsDataURL(file);
}
function exportStandalone(){
  const url=new URL('canvas.html',location.href);
  const abs=(x,base=url)=>new URL(x,base).href;
  const cache=new Map();
  const inlined=async href=>{
    if(href.startsWith('data:')||href.startsWith('#'))return href;
    if(!cache.has(href))cache.set(href,(async()=>{
      const result=await fetch(href);if(!result.ok)throw Error('An asset could not be downloaded');
      const blob=await result.blob();
      return new Promise((ok,no)=>{const reader=new FileReader();reader.onload=()=>ok(reader.result);reader.onerror=no;reader.readAsDataURL(blob);});
    })());
    return cache.get(href);
  };
  (async()=>{
    flash('Preparing standalone HTML with local photos and fonts…');
    const root=D.documentElement.cloneNode(true);
    root.querySelectorAll("script,.bs-drag-ghost,template[data-bs-flow-origin]").forEach(s=>s.remove());
    root.removeAttribute('data-bs-device');
    for(const key of ['--bs-hero-vh88','--bs-hero-vh80','--bs-hero-vh10'])root.style.removeProperty(key);
    const sheets=[...root.querySelectorAll('link[rel=stylesheet]')];
    await Promise.all(sheets.map(async link=>{
      const href=abs(link.getAttribute('href'));
      const result=await fetch(href);if(!result.ok)throw Error('Cannot read homepage styles');
      let css=await result.text();
      const refs=[...new Set([...css.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)].map(m=>m[2]).filter(r=>!r.startsWith('data:')&&!r.startsWith('#')))];
      const mapped=await Promise.all(refs.map(async ref=>[ref,await inlined(abs(ref,href))]));
      const replacements=new Map(mapped);
      css=css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g,(match,q,ref)=>replacements.has(ref)?'url("'+replacements.get(ref)+'")':match);
      const style=document.createElement('style');style.textContent=css;link.replaceWith(style);
    }));
    await Promise.all([...root.querySelectorAll('img[src]')].map(async img=>{
      const source=img.getAttribute('src');
      if(new URL(source,url).origin!==url.origin&&!source.startsWith('data:'))return;
      if(img.hasAttribute('srcset')){const tokens=img.getAttribute('srcset').split(',').map(x=>x.trim().split(/\s+/));img.setAttribute('srcset',(await Promise.all(tokens.map(async ([src,size])=>(await inlined(abs(src)))+(size?' '+size:'')))).join(', '));}
      img.src=await inlined(abs(img.getAttribute('src')));
    }));
    root.querySelectorAll('[data-bs-id]').forEach(e=>[...e.attributes].filter(a=>a.name.startsWith('data-bs-')&&a.name!=='data-bs-bg'&&a.name!=='data-bs-look').forEach(a=>e.removeAttribute(a.name)));
    root.querySelector('.site-header')?.classList.remove('is-scrolled');
    root.querySelector('.header-nav')?.classList.remove('is-open','is-pinned');
    root.querySelector('.nav-dropdown')?.classList.remove('open');
    const behavior=await fetch('canvas-behavior.js').then(r=>{if(!r.ok)throw Error('Cannot read preview behavior');return r.text();});
    const script=document.createElement('script');
    script.textContent=behavior+'\nenableHomepageBehavior(document,()=>false,notice=>window.alert(notice));';
    root.querySelector('body').append(script);
    exportFile('<!doctype html>\n'+root.outerHTML,'new-city-wellness-homepage-preview.html','text/html;charset=utf-8');
    flash('Standalone preview downloaded.');
  })().catch(()=>flash('The HTML export did not finish. Please retry, or download the draft JSON.'));
}
function anchorRect(n){
  if(!n?.isConnected)return null;
  const f=frame.getBoundingClientRect(), r=(n.hasAttribute('data-bs-row')?surfaceOf(n):n).getBoundingClientRect();
  return {left:f.left+r.left,right:f.left+r.right,top:f.top+r.top,bottom:f.top+r.bottom,width:r.width,height:r.height,f};
}
function now(){return active&&D?byId(active):null;}
function adjustPopup(n, stable=false){
  if(popup.hidden||stable)return;
  const r=n?anchorRect(n):null, ww=window.innerWidth, wh=window.innerHeight, w=popup.offsetWidth,h=popup.offsetHeight;
  let left=ww-w-12, top=($('subbar').getBoundingClientRect().bottom||90)+8;
  if(r){
    if(ww<=600){left=(ww-w)/2;top=r.bottom+10+h<wh?r.bottom+10:wh-h-8;}
    else {
      if(r.right+w+13<=ww)left=r.right+9;
      else if(r.left-w-13>=0)left=r.left-w-9;
      else left=Math.max(8,Math.min(r.right-w,ww-w-8));
      top=r.bottom+10+h<wh?r.bottom+10:(r.top>=top+h+14?r.top-h-10:Math.min(Math.max(top,r.top+42),wh-h-10));
    }
  }
  popup.style.left=Math.max(8,Math.min(left,ww-w-8))+'px';
  popup.style.top=Math.max(6,Math.min(top,wh-h-6))+'px';
}
function paint(){
  if(!D||mode!=='edit'||!active){outline.hidden=true;selection.hidden=true;$('resize-selection').hidden=true;return;}
  const n=now(), r=anchorRect(n);
  if(!r){outline.hidden=true;selection.hidden=true;$('resize-selection').hidden=true;return;}
  const top=Math.max(r.f.top,r.top),bt=Math.min(r.f.bottom,r.bottom);
  const l=Math.max(r.f.left,r.left),rt=Math.min(r.f.right,r.right);
  if(bt-top<3||rt-l<3){outline.hidden=true;selection.hidden=true;$('resize-selection').hidden=true;return;}
  const row=n.hasAttribute('data-bs-row'); outline.toggleAttribute('data-row',row);
  Object.assign(outline.style,{left:l+'px',top:top+'px',width:(rt-l)+'px',height:(bt-top)+'px'});
  outline.hidden=false;
  $('selection-label').textContent=titleOf(n);
  $('drag').hidden=!canDragIndependently(n);
  $('selection-add').hidden=false;
  $('selection-duplicate').hidden=false;
  const resize=$('resize-selection');resize.hidden=!freeShell(n)||drag?.moved||!!resizeDrag||!!gridPick;
  if(!resize.hidden)Object.assign(resize.style,{left:Math.max(l,rt-15)+'px',top:Math.max(top,bt-15)+'px'});
  selection.hidden=false;
  const y=top-35>=r.f.top?top-35:top+2;
  selection.style.top=y+'px';
  selection.style.left=Math.max(r.f.left,Math.min(l+2,r.f.right-selection.offsetWidth-1))+'px';
}
function close(){popup.hidden=true;placement=null;gesture=null;}
function open(title,category,anchor=null){
  $('popup-title').textContent=title;$('popup-type').textContent=category;
  body.replaceChildren();popup.hidden=false;gesture=null;
  const place=()=>adjustPopup(anchor);
  return place;
}
function para(t){body.append(create('p',{class:'muted'},t));}
function group(cl='actions'){const el=create('div',{class:cl});body.append(el);return el;}
function button(parent,t,fn,props={}){
  const b=create('button',{type:'button',...props},t);
  b.addEventListener('click',fn);parent.append(b);return b;
}
function input(parent,title,value,settings,handler,event='input'){
  const lab=create('label',{},title);
  const {tag='input',...attrs}=settings||{};
  const el=create(tag,attrs); el.value=value??'';lab.append(el);parent.append(lab);
  el.addEventListener(event,()=>handler(el));
  return el;
}
function choose(n, edit=true){
  if(!n)return;
  active=idOf(n);paint();if(edit)openSettings(n);
}
function useKeys(){
  if(!D)return;
  function handle(e){
    if(e.key==='Escape'){
      if(drag){finishDrag();return;}
      if(resizeDrag){stopResize(false);return;}
      if(gridPick){clearGridPick();return;}
      if(!popup.hidden){close();$('selection-settings').focus();return;}
      if(!$('menu').hidden){toggleMenu(false);$('more').focus();return;}
      active=null;paint();return;
    }
    if(e.target?.matches('input,textarea,select,[contenteditable=true]'))return;
    if(mode==='edit'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&now()){e.preventDefault();cloneSelected(now());return;}
    if(mode==='edit'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(e.shiftKey?1:-1);}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
  }
  document.addEventListener('keydown',handle);D.addEventListener('keydown',handle);
}
function targetFrom(el){
  const exact=el.closest('[data-bs-kind]');
  if(exact)return exact;
  const col=el.closest('[data-bs-column]');if(col)return col;
  return el.closest('[data-bs-row],[data-bs-zone]');
}
function moveInDirection(n,step){
  const row=n.hasAttribute('data-bs-row'), a=row?rowList():Array.from(n.parentElement.children).filter(c=>c.dataset.bsMove==='yes');
  const peer=a[a.indexOf(n)+step];
  if(!peer)return;
  record({kind:'move',id:idOf(n),target:idOf(peer),side:step<0?'before':'after',pair:unique()});
  n.scrollIntoView({block:'nearest'});paint();
}
function pickTarget(){
  const n=now();
  if(!n)return;
  const place=open('Move '+titleOf(n).toLowerCase(),'ELEMENT PLACEMENT',n);
  para('Choose an available destination. This reorders the page and can move nearby items. Drag the handle instead to keep their positions.');
  const allowed=[...D.querySelectorAll('[data-bs-column],[data-bs-move=yes]')].filter(t=>t!==n&&!n.contains(t)&&canInline(n,t,t.hasAttribute('data-bs-column')?'inside':'before'));
  if(!allowed.length){para('Add a row or another editable element to create a destination.');place();return;}
  const sel=create('select',{'aria-label':'Move destination'});
  allowed.forEach(t=>sel.append(create('option',{value:idOf(t)},rowTitle(rowOf(t))+' · '+(t.hasAttribute('data-bs-column')?'Column '+(Array.from(t.parentElement.children).indexOf(t)+1):textCopy(content(t)).slice(0,44)||titleOf(t)))));
  const label=create('label',{},'Destination');label.append(sel);body.append(label);
  const actions=group();
  const commit=(s)=>{
    const peer=byId(sel.value), side=peer.hasAttribute('data-bs-column')?'inside':s;
    if(!record({kind:'move',id:idOf(n),target:idOf(peer),side,pair:unique()})){flash('Choose another destination.');return;}
    n.scrollIntoView({block:'nearest'});choose(n);
  };
  for(const [side,t] of [['before','Above / inside'],['after','Below'],['left','To the left'],['right','To the right']])button(actions,t,()=>commit(side));
  place();
}
function openSettings(n) {
  if(!n?.isConnected)return;
  if(n.hasAttribute('data-bs-column')){
    const place=open('Column settings','ROW / COLUMN',n);
    para('Use Add element to place content in this column. New row columns stack on phones.');
    const a=group();button(a,'Add element',()=>startAdd(n));button(a,'Duplicate column',()=>cloneSelected(n));button(a,'Grid placement',()=>gridPanel(n));button(a,'Edit parent section',()=>choose(rowOf(n)));
    place();return;
  }
  if(n.hasAttribute('data-bs-row')) {
    const custom=n.dataset.bsRow==='custom', inner=n.querySelector(':scope > .bs-row-inner');
    const place=open(rowTitle(n),'SECTION SETTINGS',n);
    const labelToken=Symbol();input(body,'Section name',rowTitle(n),{maxlength:80},x=>record({kind:'section-name',id:idOf(n),value:x.value},labelToken));
    backgroundPanel(n);
    const heightToken=Symbol();input(body,'Minimum height (px)',parseInt(surfaceOf(n).style.getPropertyValue('--bs-manual-height'))||'',{type:'number',min:0,max:2500,placeholder:'Automatic'},x=>record({kind:'section-height',id:idOf(n),value:x.value},heightToken));
    if(custom){
      const count=inner.children.length;
      const field=create('fieldset');field.append(create('legend',{},'Columns'));
      const chips=create('div',{class:'chips'});field.append(chips);body.append(field);
      for(let i=1;i<=4;i++)button(chips,i===1?'1 column':i+' columns',()=>{record({kind:'columns',id:idOf(n),value:i});openSettings(n);},{'aria-pressed':String(i===count)});
      const cb=Symbol();
      input(body,'Column gap (px)',inner.style.getPropertyValue('--bs-gap')?Number.parseInt(inner.style.getPropertyValue('--bs-gap')):18,{type:'number',min:0,max:80},x=>record({kind:'row-gap',id:idOf(n),value:x.value},cb));
      para('Desktop columns automatically stack at mobile widths.');
    }
    const a=group();
    button(a,'↑ Move section up',()=>moveInDirection(n,-1));button(a,'↓ Move section down',()=>moveInDirection(n,1));
    button(a,'＋ Add section above',()=>rowChoices(n,'before'));
    button(a,'＋ Add section below',()=>rowChoices(n,'after'));
    button(a,'Add element',()=>startAdd(n));
    button(a,'Duplicate section',()=>cloneSelected(n));
    if(custom||n.hasAttribute('data-bs-copy'))button(a,'Remove section',()=>{record({kind:'remove',id:idOf(n)});active=null;close();paint();},{class:'danger'});
    place();return;
  }
  const k=n.dataset.bsKind, e=content(n);
  if(n.hasAttribute('data-bs-zone')||!['title','text','button','document','link','image','detail'].includes(k)){
    const put=open(titleOf(n),'ELEMENT SETTINGS',n);
    const a=group();
    if(n.hasAttribute('data-bs-zone')){
      const nodes=[...n.querySelectorAll('[data-bs-kind]')].filter(x=>x.getBoundingClientRect().width>1);
      nodes.slice(0,35).forEach(item=>button(a,textCopy(item).slice(0,34)||titleOf(item),()=>choose(item)));
      button(a,'Add element',()=>startAdd(n));button(a,'Duplicate',()=>cloneSelected(n));
    } else {
      para('Move or duplicate this component as a single item.');
      button(a,'Grid placement',()=>gridPanel(n));button(a,'Duplicate',()=>cloneSelected(n));
      if(n.hasAttribute('data-bs-copy'))button(a,'Remove',()=>{record({kind:'remove',id:idOf(n)});active=null;close();paint();},{class:'danger'});
      if(rowOf(n))button(a,'Section settings',()=>choose(rowOf(n)));
    }
    put();return;
  }
  const place=open(titleOf(n),'ELEMENT SETTINGS',n);
  if(k==='image'){
    input(body,'Replace image (up to 2 MB)','',{type:'file',accept:'image/jpeg,image/png,image/webp,image/avif,image/gif'},el=>fileRead(el.files[0],k,v=>{if(n.isConnected&&record({kind:'image',id:idOf(n),value:v}))paint();}),'change');
    const token=Symbol();input(body,'Alternative text',n.dataset.bsAlt??e?.alt??'',{maxlength:250},el=>record({kind:'alt',id:idOf(n),value:el.value},token));
  }else{
    const token=Symbol(), current=textCopy(e);
    input(body,k==='button'||k==='document'?'Label':'Text',current,{tag:k==='title'||k==='text'?'textarea':'input',maxlength:3000},el=>record({kind:'text',id:idOf(n),value:el.value},token));
    if(k==='button'&&!isExisting(n)){
      const urlToken=Symbol();input(body,'Button link',e.getAttribute('href'),{placeholder:'https://… or #section'},el=>{
        el.setCustomValidity(okayURL(el.value)?'':'Enter a public link or a section anchor.');
        if(okayURL(el.value))record({kind:'link',id:idOf(n),value:el.value},urlToken);
      });
    }
    if(k==='document')input(body,'Upload PDF (up to 2 MB)','',{type:'file',accept:'.pdf,application/pdf'},el=>fileRead(el.files[0],k,(v,name)=>{if(n.isConnected&&record({kind:'file',id:idOf(n),value:v,name}))flash(name+' attached.');}),'change');
    if(k==='button'&&isExisting(n))para('This original button keeps its existing destination.');
  }
  const fld=create('fieldset');fld.append(create('legend',{},'Alignment'));const chips=create('div',{class:'chips'});fld.append(chips);body.append(fld);
  for(const align of ['original','left','center','right']){
    button(chips,align[0].toUpperCase()+align.slice(1),e=>{
      record({kind:'align',id:idOf(n),value:align});[...chips.children].forEach(el=>el.setAttribute('aria-pressed',String(el===e.currentTarget)));
    },{'aria-pressed':String(align===(n.dataset.bsAlign||'original'))});
  }
  const padding=create('fieldset');padding.append(create('legend',{},'Padding (px)'));const padGroup=create('div',{class:'pad'});padding.append(padGroup);body.append(padding);
  for(const edge of ['top','right','bottom','left']){
    const p=n.style.getPropertyValue('padding-'+edge), token=Symbol();
    input(padGroup,edge[0].toUpperCase()+edge.slice(1),p?Number.parseFloat(p):'',{type:'number',min:0,max:220,placeholder:isExisting(n)?'Auto':(edge==='top'||edge==='bottom'?'12':'16')},el=>record({kind:'pad',id:idOf(n),edge,value:el.value},token));
  }
  const actions=group();
  button(actions,'Grid placement',()=>gridPanel(n));
  button(actions,'Duplicate',()=>cloneSelected(n));
  if(n.dataset.bsMove==='yes')button(actions,'Move to…',()=>pickTarget(n));
  if(n.classList.contains('bs-offset-item')){
    const device=devicePlacement();
    button(actions,device==='desktop'?'Reset shared drag position':'Use desktop drag position',()=>{
      record({kind:'drag-offset',id:idOf(n),device:devicePlacement(),relative:true,p:{x:0,y:0}});
      choose(n);
    },{id:'reset-drag-position'});
  }
  button(actions,'Add nearby',()=>startAdd(n));
  const parent=n.parentElement?.closest('[data-bs-kind],[data-bs-column]');
  if(parent)button(actions,'Select parent '+titleOf(parent).toLowerCase(),()=>choose(parent));
  if(rowOf(n))button(actions,'Section settings',()=>choose(rowOf(n)));
  if(n.hasAttribute('data-bs-new')||n.hasAttribute('data-bs-copy'))button(actions,'Remove',()=>{
    record({kind:'remove',id:idOf(n)});active=null;close();paint();
  },{class:'danger'});
  if(k!=='image'&&e){
    const details=create('details',{class:'look'});details.append(create('summary',{},'Text appearance'));body.append(details);
    const font=Symbol(), color=Symbol();
    input(details,'Font size (px)',e.style.fontSize?Number.parseInt(e.style.fontSize):'',{type:'number',min:10,max:96,placeholder:'Original'},x=>record({kind:'font-size',id:idOf(n),value:x.value},font));
    const rgb=D.defaultView.getComputedStyle(e).color.match(/\d+/g)?.slice(0,3);
    const hex=rgb?'#'+rgb.map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#23392e';
    const colorInput=input(details,'Text color',hex,{type:'color'},x=>record({kind:'text-color',id:idOf(n),value:x.value},color));
    button(details,'Reset color',()=>{record({kind:'text-color',id:idOf(n),value:''});colorInput.value=hex;});
  }
  place();
}
function rowChoices(anchor,side='after'){
  const r=anchor&&rowOf(anchor);
  const place=open('Add a section','CHOOSE A SECTION LAYOUT',r);
  para(r?'The new section will go '+(side==='before'?'above':'below')+' '+rowTitle(r)+'.':'The new section will go '+(side==='before'?'at the top of the homepage.':'before the footer.'));
  const choices=group('quick-grid');
  function add(cols,blank=false){
    const id=unique();record({kind:'row-add',id,cols,target:idOf(r)||null,side,blank});
    const n=byId(id);n.scrollIntoView({block:'center'});choose(n);
  }
  const grid=button(choices,'Blank grid',()=>add(1,true));
  grid.append(create('small',{},'Place items at any point'));
  for(let cols=1;cols<=4;cols++)button(choices,cols===1?'1 column':cols+' equal columns',()=>add(cols));
  if(!r)button(group(),side==='before'?'Insert at the bottom instead':'Insert at the top instead',()=>rowChoices(null,side==='before'?'after':'before'));
  place();
}
function startAdd(n=now()) {
  if(n?.hasAttribute('data-bs-row')&&n.dataset.bsRow==='custom'&&!n.classList.contains('bs-blank-section'))n=n.querySelector(':scope > .bs-row-inner > .bs-col');
  const row=n&&rowOf(n), eligible=n&&(n.dataset.bsMove==='yes'||n.hasAttribute('data-bs-column'));
  const place=open('Add element','PAGE ELEMENTS',n);
  para(eligible?'Add inside a column or beside the selected element.':'Select a new element. You can then choose where it goes on the homepage.');
  const grid=group('quick-grid');
  for(const [kind,[t]] of Object.entries(types)){
    const b=button(grid,t,()=>{
      if(kind==='row'){rowChoices(row);return;}
      if(eligible){locationChoices(n,kind);return;}
      if(gridMode==='grid'){startGridPick({kind});return;}
      close();placement=kind;
      flash('Click a text block or column to choose placement, or add a section.');
      $('hint').textContent='Click a heading, paragraph, movable button or column for placement.';
    });
    b.append(create('small',{},({row:'Responsive columns',title:'Section heading',text:'Plain text block',image:'From your device',button:'Link or call to action',document:'Downloadable PDF'})[kind]));
  }
  place();
}
function locationChoices(n,kind){
  const place=open('Place '+types[kind][0].toLowerCase(),'INSERT WITHOUT A NEW SECTION',n);
  const choices=n.hasAttribute('data-bs-column')?[['inside','Inside this column']]:[['before','Directly above'],['after','Directly below'],['left','To the left'],['right','To the right']];
  para('Side-by-side placements stack on phones.');
  const grid=group('quick-grid');
  const probe=makeBlock(kind,'probe');
  for(const [side,label] of choices)button(grid,label,()=>{
    const id=unique();
    if(!record({kind:'add',id,type:kind,target:idOf(n),side})){flash('This placement is not available.');return;}
    const fresh=byId(id);fresh.scrollIntoView({block:'nearest'});choose(fresh);
  },canInline(probe,n,side)?{}:{disabled:''});
  button(grid,'Pick any spot on the grid',()=>startGridPick({kind}));
  place();
}
function updateDrag(x,y){
  if(!drag)return;
  drag.x=x;drag.y=y;
  if(!drag.moved&&Math.hypot(x-drag.startX,y-drag.startY)>5){drag.moved=true;close();}
  if(!drag.moved)return;
  const f=frame.getBoundingClientRect();
  if(!drag.node.isConnected||drag.layout.device!==devicePlacement()){guide=null;hideGridVisual();return;}
  if(x<f.left||x>=f.right||y<f.top||y>=f.bottom){guide=null;hideGridVisual();return;}
  guide=offsetDragTarget(drag.node,drag.layout,x-drag.startX,y-drag.startY,gridMode==='grid'&&snapGrid);
  const {left,top,width,height}=guide;
  drawGhost(drag.node,f.left+left,f.top+top,width,height);
}
function duringDrag(){
  if(!drag)return;
  if(drag.moved){
    const f=frame.getBoundingClientRect(), zone=55;
    if(drag.x>=f.left&&drag.x<=f.right&&drag.y>=f.top&&drag.y<=f.bottom){
      const n=drag.y>f.bottom-zone?Math.ceil((drag.y-(f.bottom-zone))/3):drag.y<f.top+zone?-Math.ceil((f.top+zone-drag.y)/3):0;
      if(n){D.defaultView.scrollBy(0,n);updateDrag(drag.x,drag.y);}
    }
  }
  viewportTick=requestAnimationFrame(duringDrag);
}
function finishDrag(commit=false){
  if(!drag)return;
  const gesture=drag, choice=guide;drag=null;guide=null;cancelAnimationFrame(viewportTick);$('drop-guide').hidden=true;hideGridVisual();
  if($('drag').hasPointerCapture(gesture.pointer))$('drag').releasePointerCapture(gesture.pointer);
  if(!commit)return;
  if(choice&&gesture.moved){
    const {device,p}=choice;
    if(record(dragOperation(gesture.node,device,p)))choose(gesture.node,false);
  }else if(!gesture.moved)gridPanel(gesture.node);
}
$('drag').addEventListener('pointerdown',e=>{
  const n=now();
  if(e.button!==0||!canDragIndependently(n))return;
  e.preventDefault();clearGridPick();$('drag').setPointerCapture(e.pointerId);
  const layout=offsetDragStart(n);
  drag={node:n,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false,layout};
  viewportTick=requestAnimationFrame(duringDrag);
});
$('drag').addEventListener('pointermove',e=>updateDrag(e.clientX,e.clientY));
$('drag').addEventListener('pointerup',e=>{if(drag?.moved)updateDrag(e.clientX,e.clientY);finishDrag(true);});
$('drag').addEventListener('pointercancel',()=>finishDrag());
$('drag').addEventListener('click',e=>{if(e.detail===0&&canDragIndependently(now()))gridPanel(now());});
$('selection-settings').onclick=()=>now()&&openSettings(now());
$('selection-add').onclick=()=>startAdd();
$('selection-duplicate').onclick=()=>now()&&cloneSelected(now());
$('add-section').onclick=()=>rowChoices(now());
$('grid-mode').onclick=()=>{clearGridPick();setGridMode(gridMode==='grid'?'flow':'grid');paint();};
$('grid-snap').onclick=()=>{snapGrid=!snapGrid;$('grid-snap').setAttribute('aria-pressed',String(snapGrid));flash(snapGrid?'Grid snapping on.':'Snap off. Drag with pixel precision.');};
const resizeControl=$('resize-selection');
resizeControl.addEventListener('pointerdown',e=>{
  const n=now(), shell=freeShell(n), zone=zoneOf(n);
  if(!n||!shell||!zone||e.button!==0)return;
  e.preventDefault();clearGridPick();close();resizeControl.setPointerCapture(e.pointerId);
  const device=devicePlacement(),p=knownPosition(n,zone,device);
  resizeDrag={n,zone,device,p,pointer:e.pointerId,start:e.clientX,width:zoneDims(zone).width};
});
resizeControl.addEventListener('pointermove',e=>{
  if(!resizeDrag)return;
  const r=resizeDrag, step=100/GRID_COLS;
  const raw=r.p.w+(e.clientX-r.start)/r.width*100;
  r.next={...r.p,w:Math.min(100-r.p.x,Math.max(step*2,snapGrid?Math.round(raw/step)*step:raw))};
  showGridVisual(r.zone,r.next,r.n);
});
function stopResize(commit){
  if(!resizeDrag)return;
  const r=resizeDrag;resizeDrag=null;hideGridVisual();
  if(resizeControl.hasPointerCapture(r.pointer))resizeControl.releasePointerCapture(r.pointer);
  if(commit&&r.next)record(gridOperation(r.n,r.zone,r.device,r.next));
  paint();
}
resizeControl.addEventListener('pointerup',()=>stopResize(true));
resizeControl.addEventListener('pointercancel',()=>stopResize(false));
resizeControl.addEventListener('click',e=>{if(e.detail===0&&now())gridPanel(now());});
$('popup-close').onclick=close;
$('preview').onclick=()=>{
  clearGridPick();mode=mode==='edit'?'preview':'edit';
  $('preview').textContent=mode==='preview'?'Back to editing':'Preview';$('preview').setAttribute('aria-pressed',String(mode==='preview'));
  $('hint').textContent=mode==='preview'?'Preview mode. The contact form does not send messages.':defaultHint();
  for(const id of ['add','add-section','grid-mode','grid-snap'])$(id).disabled=mode==='preview'; $('undo').disabled=mode==='preview'||!cursor;$('redo').disabled=mode==='preview'||cursor===list.length;
  close();paint();
};
function switchView(b){
  view=b.dataset.view;stage.dataset.view=view;syncViewport();
  document.querySelectorAll('[data-view]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el===b));});
  requestAnimationFrame(()=>{refreshFreeSizes();paint();if(now()&&!popup.hidden){
    const reset=$('reset-drag-position');
    if(reset)reset.textContent=devicePlacement()==='desktop'?'Reset shared drag position':'Use desktop drag position';
    adjustPopup(now());
  }});
}
document.querySelectorAll('button[data-view]').forEach(b=>b.onclick=()=>switchView(b));
$('add').onclick=()=>startAdd();
$('undo').onclick=()=>history(-1);
$('redo').onclick=()=>history(1);
$('save').onclick=save;
function toggleMenu(val){
  $('menu').hidden=!val;$('more').setAttribute('aria-expanded',String(val));
  if(val)$('menu').style.top=($('more').getBoundingClientRect().bottom+8)+'px';
}
$('more').onclick=()=>toggleMenu($('menu').hidden);
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#menu,#more'))toggleMenu(false);});
$('export-draft').onclick=()=>{toggleMenu(false);exportFile(draftString(),'new-city-wellness-homepage-draft.json','application/json');};
$('import-draft').onclick=()=>{toggleMenu(false);$('import-file').value='';$('import-file').click();};
$('import-file').onchange=async()=>{
  const file=$('import-file').files[0];if(!file)return;
  if(file.size>MAX_JSON){flash('This draft is too large to import.');return;}
  try{const raw=await file.text();list=readDraft(raw);StudioPublish.bindSource(JSON.parse(raw).publishedBase||null);cursor=list.length;active=null;close();replay();flash('Draft imported. Save it to keep it in this browser.');}catch(e){flash(e.message);}
};
$('export-html').onclick=()=>{toggleMenu(false);exportStandalone();};
$('compare').onclick=()=>{toggleMenu(false);window.open('canvas.html','_blank','noopener,noreferrer');};
$('help').onclick=()=>{
  toggleMenu(false);const place=open('How to edit the homepage','QUICK GUIDE');
  para('Click text or a photo to open its settings. Align and adjust spacing while watching the canvas.');
  para('Use Add nearby → Directly above or Directly below to insert without making a new row. Explicit inline moves and insertions can reposition other items.');
  para('Dragging moves only the selected element and preserves its original space. Desktop drags carry over to tablet and mobile. Use their previews to fine-tune placement if needed. Turn Snap off for finer placement.');
  para('Use Duplicate in settings or Ctrl+D. Add a blank or column-based section with + Section. Its settings include color, image, or video backgrounds.');
  para('Save keeps edits in this browser. Download an editable draft to move it to another browser. Approved publisher accounts can publish the homepage from this editor.');
  place();
};
$('reset').onclick=()=>{
  toggleMenu(false);const place=open('Reset this draft?','DRAFT TOOLS');
  para('This restores the original homepage copy and clears this browser’s saved draft. It does not affect the public website.');
  button(group(),'Reset to original',()=>{
    saveQueue=saveQueue.catch(()=>{}).then(()=>{
      try{localStorage.removeItem(STORAGE);}catch{}
      return draftStore('readwrite',s=>s.delete(STORAGE));
    }).catch(()=>{});
    list=[];cursor=0;savedOps=[];active=null;StudioPublish.bindSource(null);close();replay();flash('Original homepage restored.');
  },{class:'danger'});place();
};
function boot(){
  if(baselineReady)return;
  D=frame.contentDocument;
  if(!D?.querySelector('main[data-builder-page]'))return;
  baselineReady=true;markCanvas();syncViewport();original=D.body.innerHTML;sizeObserver();
  stopBehavior=enableHomepageBehavior(D,()=>mode==='edit',flash);
  useKeys();
  D.addEventListener('click',e=>{
    if(mode!=='edit')return;
    const anchor=e.target.closest('a');
    if(anchor)e.preventDefault();
    if(gridPick){e.preventDefault();commitPick(e);return;}
    if(e.target.closest('input,textarea,select,form button'))e.preventDefault();
    const n=e.altKey?e.target.closest('[data-bs-kind]')?.parentElement?.closest('[data-bs-kind],[data-bs-column],[data-bs-row]')||targetFrom(e.target):targetFrom(e.target);
    if(placement){
      if(n&&(n.dataset.bsMove==='yes'||n.hasAttribute('data-bs-column'))){const kind=placement;placement=null;$('hint').textContent='Click text or an image to edit it.';choose(n,false);locationChoices(n,kind);}
      else flash('Select a heading, paragraph, movable button or custom column.');
      return;
    }
    if(n){e.preventDefault();choose(n);}
    else {active=null;close();paint();}
  },true);
  D.addEventListener('pointermove',updatePick,{passive:true});
  D.addEventListener('pointerleave',()=>{if(gridPick)hideGridVisual();});
  D.addEventListener('load',e=>{if(e.target?.closest?.('.bs-free-layer')){refreshFreeSizes();paint();}},true);
  D.fonts?.ready.then(()=>{refreshFreeSizes();paint();});
  D.addEventListener('submit',e=>{e.preventDefault();flash('The contact form is disabled in this preview.');},true);
  D.addEventListener('scroll',()=>{paint();if(!popup.hidden&&now())adjustPopup(now());},{passive:true,capture:true});
  D.defaultView.addEventListener('resize',()=>{refreshFreeSizes();paint();});
  window.addEventListener('resize',()=>{syncViewport();paint();if(!popup.hidden)adjustPopup(now());});
  const loadSaved=(raw)=>{if(!raw||cursor)return;list=readDraft(raw);pendingPublisherBase=JSON.parse(raw).publishedBase||null;if(typeof StudioPublish!=='undefined')StudioPublish.bindSource(pendingPublisherBase);cursor=list.length;savedOps=list.slice();replay();};
  const warn=()=>flash('The saved draft could not be read. The original homepage is open.');
  let raw=null;
  try{raw=localStorage.getItem(STORAGE);if(raw&&raw!=='@indexeddb')loadSaved(raw);}catch{warn();}
  if(!raw||raw==='@indexeddb')draftStore('readonly',s=>s.get(STORAGE)).then(loadSaved).catch(()=>{if(raw==='@indexeddb')warn();});
  setGridMode(gridMode);showState();
}
frame.addEventListener('load',boot);
boot();
