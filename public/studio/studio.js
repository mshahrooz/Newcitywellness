'use strict';
const $=id=>document.getElementById(id);
const frame=$('canvas'), stage=$('stage'), popup=$('popup'), body=$('popup-body'), outline=$('outline'), selection=$('selection');
const pages=typeof STUDIO_PAGES==='undefined'?[['home','Home','']]:STUDIO_PAGES;
const pageAssets=typeof STUDIO_PAGE_ASSETS==='undefined'?{}:STUDIO_PAGE_ASSETS;
const picker=$('page-picker');
const pageIdentity=()=>page[0]==='home'?'new-city-wellness-homepage':'new-city-wellness-'+page[0];
const canvasPath=()=>page[0]==='home'?'canvas.html?v=all-pages1':'pages/'+page[0]+'.html?v='+pageAssets[page[0]].canvas;
const storageKey=()=>page[0]==='home'?'ncw.bakery.home.v1':'ncw.studio.page.v1.'+page[0];
let page=pages.find(p=>p[0]===new URL(location.href).searchParams.get('page'))||pages[0], canvasEpoch=0, switching=false, stopSize;
const MAX_FILE=2*1024*1024, MAX_JSON=100*1024*1024;
const types={
  title:['Heading','A new section heading','Section title','Text'],
  subheading:['Subheading','A new subheading','Smaller heading','Text'],
  text:['Paragraph','Write a short paragraph here.','Body copy','Text'],
  bullets:['Bulleted list','First item\nSecond item','One item per line','Text'],
  numbered:['Numbered list','First step\nSecond step','Steps in order','Text'],
  quote:['Quote','Add a quote or short excerpt.','Pull quote','Text'],
  image:['Image','','Upload an image','Media & links'],
  captioned:['Captioned image','','Photo with a visible caption','Media & links'],
  video:['Video','','Upload an MP4 or WebM','Media & links'],
  button:['Button','Learn more','Link or call to action','Media & links'],
  document:['Document','Download document','Downloadable PDF','Media & links'],
  callout:['Callout','Put a useful note or reminder here.','Highlighted note','Layout'],
  accordion:['Accordion','A short answer goes here.','Expandable question and answer','Layout'],
  divider:['Divider','','Horizontal rule','Layout'],
  spacer:['Spacer','','Adjustable vertical space','Layout'],
  row:['Row','','Responsive columns','Layout']
};
const imageKind=k=>k==='image'||k==='captioned';
const listKind=k=>k==='bullets'||k==='numbered';
const richKinds=['subheading','quote','callout','accordion','divider','spacer','captioned','bullets','numbered','video'];
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
const therapyCard=n=>n?.closest('.therapy-card');
const therapyPhoto=n=>n?.matches('.therapy-card .therapy-image > img');
const titleOf=n=>n.matches('.therapy-card')?'Therapy card':n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone')?rowTitle(n):n.hasAttribute('data-bs-column')?'Column':({image:'Image',button:'Button',document:'Document',title:'Heading',text:'Paragraph',link:'Link',component:'Component',detail:'Detail',form:'Form',field:'Form field',video:'Video'})[n.dataset.bsKind]||types[n.dataset.bsKind]?.[0]||'Element';
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
  const doc=D, t=doc.defaultView.scrollY;
  resetBody();
  for(const op of list.slice(0,cursor))apply(op);
  refreshFreeSizes();
  stopBehavior=wireBehavior();
  requestAnimationFrame(()=>{if(D===doc){doc.defaultView.scrollTo(0,t);paint();}});
  if(active&&!byId(active)) active=null;
  showState();paint();
}
function stepHistory(step){
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
    if(page[0]!=='home')row.dataset.bsLabel=row.dataset.builderLabel||id.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
    const candidates=row.querySelectorAll('h1,h2,h3,h4,p,img,a.btn');
    let i=0;
    candidates.forEach(el=>{
      if(el.closest('form') || el.closest('.clinic-hours') || el.classList.contains('form-note'))return;
      if(el.matches('img')&&((page[0]==='home'&&!el.hasAttribute('data-editor-image'))||el.closest('a.btn')))return;
      const num=++i;
      el.dataset.bsId=id+'-'+num;
      el.dataset.bsKind=el.matches('img')?'image':el.matches('a.btn')?'button':el.matches('h1,h2,h3,h4')?'title':'text';
      // Keep image masks, tab/slider structure, and nested cards intact.
      if(el.matches('h1,h2,h3,h4,p')&&!el.closest('a,.testimonial-card,.contact-form-wrap,.clinic-hours')){
        el.dataset.bsMove='yes';
      } else if(el.matches('a.btn')&&!el.closest('.hero-actions')||page[0]!=='home'&&el.matches('img')&&!el.closest('.page-hero-photo')){el.dataset.bsMove='yes';}
    });
  });
  registerExtraNodes();
}
function content(el){
  if(el.hasAttribute('data-bs-new')){
    if(imageKind(el.dataset.bsKind))return el.querySelector('img');
    if(el.dataset.bsKind==='accordion')return el.querySelector('p');
    if(el.dataset.bsKind==='button'||el.dataset.bsKind==='document')return el.querySelector('a');
    return el.firstElementChild;
  }
  if(el.dataset.bsKind==='button')return el.querySelector('[data-editor-field],[data-builder-copy]')||el;
  return el;
}
function textCopy(el){if(!el)return '';return el.textContent.replace(/\s+/g,' ').trim();}
function okayURL(link){
  if(/^#[A-Za-z0-9_:-]*$/.test(link))return true;
  try{return /^\/(?!\/)[^\s\\]*$/.test(link)||['https:','http:','tel:','mailto:'].includes(new URL(link).protocol);}catch{return false;}
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
  else if(kind==='subheading')node=addNative('h3',{class:'bs-subheading'},types[kind][1]);
  else if(listKind(kind)) {
    node=addNative(kind==='bullets'?'ul':'ol',{class:'bs-list'});
    setList(node,types[kind][1]);
  }
  else if(kind==='quote')node=addNative('blockquote',{class:'bs-quote'},types[kind][1]);
  else if(kind==='callout')node=addNative('p',{class:'bs-callout'},types[kind][1]);
  else if(kind==='divider')node=addNative('hr',{class:'bs-divider'});
  else if(kind==='spacer')node=addNative('div',{class:'bs-spacer','aria-hidden':'true'});
  else if(kind==='accordion') {
    node=addNative('details',{class:'bs-accordion',open:''});
    node.append(addNative('summary',{},'A common question'),addNative('p',{},types[kind][1]));
  }
  else if(kind==='video')node=addNative('div',{class:'bs-placeholder'},'Choose an MP4 or WebM video');
  else if(imageKind(kind)){
    const placeholder=addNative('div',{class:'bs-placeholder'},'Choose an image to replace this placeholder');
    if(kind==='captioned') {
      node=addNative('figure',{class:'bs-captioned'});
      node.append(placeholder,addNative('figcaption',{},'Add a caption'));
    } else node=placeholder;
  }
  else if(kind==='document')node=addNative('a',{class:'bs-file-name',href:'#'},types[kind][1]);
  else node=addNative('a',{class:'btn',href:'#',target:'_blank',rel:'noopener noreferrer'},types[kind][1]);
  wrap.append(node);return wrap;
}
function setList(node,value){
  node.replaceChildren(...asString(value).split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>addNative('li',{},line)));
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
function canDeleteElement(n){
  return !!(n?.isConnected&&idOf(n)&&!n.hasAttribute('data-bs-zone')&&!n.matches('main,.ncw,body')
    &&(n.dataset.bsKind||n.hasAttribute('data-bs-column')||n.hasAttribute('data-bs-row')));
}
function deleteElement(n){
  if(!canDeleteElement(n))return false;
  const shell=freeShell(n),parent=n.parentElement;
  // Remove an empty photo frame too, without deleting its card or service link.
  const removed=therapyPhoto(n)&&parent.children.length===1?parent:n;
  const ids=new Set([removed,...removed.querySelectorAll('[id]')].map(el=>el.id).filter(Boolean));
  removed.remove();
  if(shell)removeFreeContainer(shell);
  else dePair(parent);
  for(const slot of D.querySelectorAll('template[data-bs-flow-origin]')){
    if(slot.dataset.bsFlowOrigin===idOf(n))slot.remove();
  }
  // Remove only accessibility references that pointed to the deleted item.
  if(ids.size)for(const el of D.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')){
    for(const attr of ['aria-labelledby','aria-describedby','aria-controls']){
      const old=el.getAttribute(attr);
      if(!old)continue;
      const keys=old.trim().split(/\s+/);
      const retained=keys.filter(id=>!ids.has(id)||D.getElementById(id));
      if(retained.length===keys.length)continue;
      if(retained.length)el.setAttribute(attr,retained.join(' '));else el.removeAttribute(attr);
    }
  }
  return true;
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
    case 'text':
      if(!e||!['title','text','button','document','link','detail','subheading','quote','callout','accordion','bullets','numbered'].includes(k))return false;
      if(listKind(k))setList(e,op.value);
      else if(page[0]!=='home'&&k==='detail'&&e.hasAttribute('data-builder-attr')) {
        const att=e.getAttribute('data-builder-attr');
        if(!['placeholder','title','aria-label'].includes(att))return false;
        e.setAttribute(att,asString(op.value));
      } else e.textContent=asString(op.value);return true;
    case 'part': {
      const part=k==='accordion'?n.querySelector('summary'):k==='captioned'?n.querySelector('figcaption'):null;
      if(!part)return false;part.textContent=asString(op.value,300);return true;
    }
    case 'space':
      if(k!=='spacer'||!e)return false;
      e.style.setProperty('--bs-spacer',bounded(op.value,8,200)+'px');return true;
    case 'video': {
      if(k!=='video'||!n.hasAttribute('data-bs-new')||!mediaValue(op.value,'video'))return false;
      n.replaceChildren(addNative('video',{class:'bs-video',src:op.value,controls:'',playsinline:'',preload:'metadata'}));return true;
    }
    case 'image':
      if(!imageKind(k)||!okayData(op.value,'image'))return false;
      if(n.hasAttribute('data-bs-new')){
        const alt=n.dataset.bsAlt||e?.alt||''; const im=addNative('img',{src:op.value,alt,decoding:'async'});if(k==='captioned')(e||n.querySelector('.bs-placeholder')).replaceWith(im);else n.replaceChildren(im);
      } else {
        n.src=op.value;n.removeAttribute('srcset');n.removeAttribute('sizes');
        if(n.parentElement?.matches('picture'))n.parentElement.querySelectorAll(':scope > source').forEach(source=>source.remove());
      }
      return true;
    case 'alt':
      if(!imageKind(k))return false;
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
      if(imageKind(k)){
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
    case 'remove':return deleteElement(n);
    default:return false;
  }
}
function validId(value){return typeof value==='string'&&/^[a-z0-9-]{1,96}$/i.test(value);}
function readDraft(raw){
  if(raw.length>MAX_JSON)throw Error('This draft is too large to import.');
  const obj=JSON.parse(raw);
  if(obj?.version!==1||obj?.page!==pageIdentity()||!Array.isArray(obj.operations)||obj.operations.length>800)throw Error('Choose a draft exported for '+page[1]+'.');
  const ops=obj.operations;
  if(ops.some(o=>!o||!validId(o.id)||(o.target&&!validId(o.target))||(o.pair&&!validId(o.pair))||(o.copy&&!validId(o.copy))||typeof o.kind!=='string'))throw Error('This draft contains invalid edits.');
  return ops;
}
function draftString(){
  return JSON.stringify({version:1,page:pageIdentity(),operations:list.slice(0,cursor),publishedBase:typeof StudioPublish!=='undefined'?StudioPublish.baseOfDraft():null});
}
let saveQueue=Promise.resolve();
function save({quiet=false}={}){
  const STORAGE=storageKey(), data=draftString(), undoStamp=list.slice(0,cursor);
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
    if(data.length<3500000){
      try{
        localStorage.setItem(STORAGE,data);
        if(window.indexedDB)await draftStore('readwrite',s=>s.delete(STORAGE)).catch(()=>{});
        savedOps=undoStamp;showState();if(!quiet)flash('Draft saved in this browser. Nothing was published.');return true;
      }catch{}
    }
    try{
      await draftStore('readwrite',s=>s.put(data,STORAGE));
      try{localStorage.setItem(STORAGE,'@indexeddb');}catch{}
      savedOps=undoStamp;showState();if(!quiet)flash('Draft and media saved in this browser.');return true;
    }catch{flash('Browser storage is unavailable or full. Download the editable draft to keep it.');return false;}
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
  const url=new URL(canvasPath(),location.href), name=pageIdentity();
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
    exportFile('<!doctype html>\n'+root.outerHTML,name+'-preview.html','text/html;charset=utf-8');
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
  body.replaceChildren();body.scrollTop=0;popup.hidden=false;gesture=null;
  const footer=$('popup-footer'),remove=$('delete-element');
  footer.hidden=!canDeleteElement(anchor)||!['ELEMENT SETTINGS','CARD SETTINGS','SECTION SETTINGS','ROW / COLUMN'].includes(category);
  remove.onclick=null;
  if(!footer.hidden){
    const label=anchor.matches('.therapy-card')?'card':anchor.hasAttribute('data-bs-row')?'section'
      :anchor.hasAttribute('data-bs-column')?'column':anchor.dataset.bsKind==='image'?'image':'element';
    remove.textContent='Delete '+label;
    remove.onclick=()=>{
      if(record({kind:'remove',id:idOf(anchor)})){
        active=null;close();paint();
        $('undo').focus({preventScroll:true});
        flash('Deleted from draft. Use Undo to restore.');
      }
    };
  }
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
    if(switching)return;
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
    if(mode==='edit'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();stepHistory(e.shiftKey?1:-1);}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
  }
  if(!useKeys.outer){document.addEventListener('keydown',handle);useKeys.outer=true;}D.addEventListener('keydown',handle);
}
function targetFrom(el,wholeCard=false){
  const card=therapyCard(el);
  if(card&&wholeCard)return card;
  const exact=el.closest('[data-bs-kind]');
  if(card){
    if(therapyPhoto(exact)||exact?.matches('h3'))return exact;
    const photo=el.closest('.therapy-image')?.querySelector('img[data-bs-kind="image"]');
    return photo||card;
  }
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
function replaceImageControl(parent,n,label='Replace image'){
  input(parent,label+' (up to 2 MB)','',{type:'file',accept:'image/jpeg,image/png,image/webp,image/avif,image/gif'},el=>{
    fileRead(el.files[0],'image',value=>{
      if(n.isConnected&&record({kind:'image',id:idOf(n),value}))flash('Image replaced in your draft.');
    });
    el.value='';
  },'change');
}
function dragResetControl(parent,n){
  if(!n.classList.contains('bs-offset-item'))return;
  const device=devicePlacement();
  button(parent,device==='desktop'?'Reset shared drag position':'Use desktop drag position',()=>{
    record({kind:'drag-offset',id:idOf(n),device:devicePlacement(),relative:true,p:{x:0,y:0}});
    choose(n);
  },{id:'reset-drag-position'});
}
function openSettings(n) {
  if(!n?.isConnected)return;
  if(n.matches('.therapy-card')){
    const place=open('Therapy card','CARD SETTINGS',n);
    const title=n.querySelector('h3[data-bs-kind="title"]'), photo=n.querySelector('.therapy-image img[data-bs-kind="image"]');
    if(title)para(textCopy(title));
    para('Drag the grip to move the whole card, including its image. The other cards stay in place.');
    if(photo)replaceImageControl(body,photo,'Replace card image');
    const actions=group();
    if(photo)button(actions,'Select card image',()=>choose(photo));
    if(title)button(actions,'Edit card heading',()=>choose(title));
    dragResetControl(actions,n);
    place();return;
  }
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
    place();return;
  }
  const k=n.dataset.bsKind, e=content(n);
  if(n.hasAttribute('data-bs-zone')||!['title','text','button','document','link','image','detail',...richKinds].includes(k)){
    const put=open(titleOf(n),'ELEMENT SETTINGS',n);
    const a=group();
    if(n.hasAttribute('data-bs-zone')){
      const nodes=[...n.querySelectorAll('[data-bs-kind]')].filter(x=>x.getBoundingClientRect().width>1);
      nodes.slice(0,35).forEach(item=>button(a,textCopy(item).slice(0,34)||titleOf(item),()=>choose(item)));
      button(a,'Add element',()=>startAdd(n));button(a,'Duplicate',()=>cloneSelected(n));
    } else {
      para('Move or duplicate this component as a single item.');
      button(a,'Grid placement',()=>gridPanel(n));button(a,'Duplicate',()=>cloneSelected(n));
      if(rowOf(n))button(a,'Section settings',()=>choose(rowOf(n)));
    }
    put();return;
  }
  const place=open(titleOf(n),'ELEMENT SETTINGS',n);
  if(imageKind(k)){
    replaceImageControl(body,n);
    if(therapyPhoto(n))para('Drag the image grip to adjust the crop. Select the whole card to move it with its image.');
    const token=Symbol();input(body,'Alternative text',n.dataset.bsAlt??e?.alt??'',{maxlength:250},el=>record({kind:'alt',id:idOf(n),value:el.value},token));
    if(k==='captioned'){
      const cap=Symbol();input(body,'Caption',textCopy(n.querySelector('figcaption')),{maxlength:300},el=>record({kind:'part',id:idOf(n),value:el.value},cap));
    }
  }else if(k==='video'&&!isExisting(n)){
    input(body,'Upload a video (MP4 or WebM, up to 20 MB)','',{type:'file',accept:'.mp4,.webm,video/mp4,video/webm'},el=>fileReadBg(el.files[0],'video',(value,fileName)=>{
      if(n.isConnected&&record({kind:'video',id:idOf(n),value}))flash(fileName+' attached.');
    }),'change');
  }else if(k==='spacer'){
    const token=Symbol();
    input(body,'Height (px)',parseFloat(e.style.getPropertyValue('--bs-spacer'))||32,{type:'number',min:8,max:200},el=>record({kind:'space',id:idOf(n),value:el.value},token));
  }else if(k==='divider'){
    para('Use the padding controls to change spacing above or below the line.');
  }else if(k!=='video'){
    const token=Symbol(), current=listKind(k)?[...e.children].map(x=>x.textContent).join('\n'):
      e.hasAttribute('data-builder-attr')?e.getAttribute(e.getAttribute('data-builder-attr'))||'':textCopy(e);
    if(k==='accordion'){
      const part=Symbol();input(body,'Question',textCopy(n.querySelector('summary')),{maxlength:300},el=>record({kind:'part',id:idOf(n),value:el.value},part));
    }
    input(body,k==='button'||k==='document'?'Label':listKind(k)?'List items (one per line)':k==='accordion'?'Answer':'Text',current,{tag:k==='title'||k==='text'||richKinds.includes(k)?'textarea':'input',class:'studio-text',maxlength:3000},el=>record({kind:'text',id:idOf(n),value:el.value},token));
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
  if(!therapyPhoto(n)){button(actions,'Grid placement',()=>gridPanel(n));button(actions,'Duplicate',()=>cloneSelected(n));}
  if(n.dataset.bsMove==='yes')button(actions,'Move to…',()=>pickTarget(n));
  dragResetControl(actions,n);
  if(therapyCard(n))button(actions,'Select whole card',()=>choose(therapyCard(n)));
  if(!therapyPhoto(n))button(actions,'Add nearby',()=>startAdd(n));
  const parent=n.parentElement?.closest('[data-bs-kind],[data-bs-column]');
  if(parent&&!therapyCard(n))button(actions,'Select parent '+titleOf(parent).toLowerCase(),()=>choose(parent));
  if(rowOf(n))button(actions,'Section settings',()=>choose(rowOf(n)));
  if(!imageKind(k)&&!['spacer','divider','video'].includes(k)&&e){
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
  para(r?'The new section will go '+(side==='before'?'above':'below')+' '+rowTitle(r)+'.':'The new section will go '+(side==='before'?'at the top of this page.':'before the footer.'));
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
  para(eligible?'Add inside a column or beside the selected element.':'Select a new element. You can then choose where it goes on this page.');
  const sections={};
  for(const [kind,[t,,description,category]] of Object.entries(types)){
    if(!sections[category]){
      body.append(create('h3',{class:'library-group'},category));
      sections[category]=group('quick-grid');
    }
    const grid=sections[category];
    const b=button(grid,t,()=>{
      if(kind==='row'){rowChoices(row);return;}
      if(eligible){locationChoices(n,kind);return;}
      if(gridMode==='grid'){startGridPick({kind});return;}
      close();placement=kind;
      flash('Click a text block or column to choose placement, or add a section.');
      $('hint').textContent='Click a heading, paragraph, movable button or column for placement.';
    });
    b.append(create('small',{},description));
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
  }else if(!gesture.moved){
    if(gesture.node.matches('.therapy-card')||therapyPhoto(gesture.node))openSettings(gesture.node);else gridPanel(gesture.node);
  }
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
$('drag').addEventListener('click',e=>{if(e.detail===0&&canDragIndependently(now())){
  const n=now();if(n.matches('.therapy-card')||therapyPhoto(n))openSettings(n);else gridPanel(n);
}});
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
  if(mode==='edit'&&page[0]!=='home')replay();
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
$('undo').onclick=()=>stepHistory(-1);
$('redo').onclick=()=>stepHistory(1);
$('save').onclick=save;
function toggleMenu(val){
  $('menu').hidden=!val;$('more').setAttribute('aria-expanded',String(val));
  if(val)$('menu').style.top=($('more').getBoundingClientRect().bottom+8)+'px';
}
$('more').onclick=()=>toggleMenu($('menu').hidden);
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#menu,#more'))toggleMenu(false);});
$('export-draft').onclick=()=>{toggleMenu(false);exportFile(draftString(),pageIdentity()+'-draft.json','application/json');};
$('import-draft').onclick=()=>{toggleMenu(false);$('import-file').value='';$('import-file').click();};
$('import-file').onchange=async()=>{
  const file=$('import-file').files[0], epoch=canvasEpoch;if(!file)return;
  if(file.size>MAX_JSON){flash('This draft is too large to import.');return;}
  try{const raw=await file.text();if(epoch!==canvasEpoch)return;list=readDraft(raw);StudioPublish.bindSource(JSON.parse(raw).publishedBase||null);cursor=list.length;active=null;close();replay();flash('Draft imported. Save it to keep it in this browser.');}catch(e){flash(e.message);}
};
$('export-html').onclick=()=>{toggleMenu(false);exportStandalone();};
$('compare').onclick=()=>{toggleMenu(false);window.open(canvasPath(),'_blank','noopener,noreferrer');};
$('help').onclick=()=>{
  toggleMenu(false);const place=open('How to edit this page','QUICK GUIDE');
  para('Click text or a photo to open its settings. Align and adjust spacing while watching the canvas.');
  para('Use Add nearby → Directly above or Directly below to insert without making a new row. Explicit inline moves and insertions can reposition other items.');
  para('Dragging moves only the selected element and preserves its original space. Desktop drags carry over to tablet and mobile. Use their previews to fine-tune placement if needed. Turn Snap off for finer placement.');
  para('Use Delete in the item settings to remove it from your draft. Undo restores deleted content.');
  para('Use Duplicate in settings or Ctrl+D. Add a blank or column-based section with + Section. Its settings include color, image, or video backgrounds.');
  para('Save keeps edits in this browser. Download an editable draft to move it to another browser. Approved publisher accounts can publish the selected page from this editor.');
  place();
};
$('reset').onclick=()=>{
  toggleMenu(false);const place=open('Reset this draft?','DRAFT TOOLS');
  para('This restores the original page layout and clears this browser’s saved draft. It does not affect the public website.');
  button(group(),'Reset to original',()=>{
    const STORAGE=storageKey();
    saveQueue=saveQueue.catch(()=>{}).then(()=>{
      try{localStorage.removeItem(STORAGE);}catch{}
      return draftStore('readwrite',s=>s.delete(STORAGE));
    }).catch(()=>{});
    list=[];cursor=0;savedOps=[];active=null;StudioPublish.bindSource(null);close();replay();flash('Original page restored.');
  },{class:'danger'});place();
};
function wireBehavior(){
  const stopShared=enableHomepageBehavior(D,()=>mode==='edit',flash);
  const stopPage=page[0]!=='home'&&typeof enableStudioPageBehavior==='function'?enableStudioPageBehavior(D,()=>mode==='edit',true):null;
  return ()=>{stopShared?.();stopPage?.();};
}
function busyCanvas(value){
  for(const id of ['add','add-section','grid-mode','grid-snap','save','more','preview','publish','undo','redo'])$(id).disabled=value;
}
function boot(){
  if(baselineReady)return;
  D=frame.contentDocument;
  const expected=new URL(canvasPath(),location.href);
  if(!D||D.URL.split('?')[0]!==expected.href.split('?')[0])return;
  if(!D.querySelector('main[data-builder-page]')){
    switching=false;if(picker)picker.disabled=false;$('saved').textContent='Page could not open';
    flash('Could not open this page. Choose another page or reload Studio.');return;
  }
  const epoch=canvasEpoch, current=()=>canvasEpoch===epoch, STORAGE=storageKey();
  baselineReady=true;markCanvas();syncViewport();original=D.body.innerHTML;stopSize=sizeObserver();
  stopBehavior=wireBehavior();
  useKeys();
  D.addEventListener('click',e=>{
    if(switching){e.preventDefault();return;}
    if(mode!=='edit')return;
    const anchor=e.target.closest('a');
    if(anchor)e.preventDefault();
    if(gridPick){e.preventDefault();commitPick(e);return;}
    const summary=e.target.closest('summary');
    if(summary&&!summary.closest('[data-bs-new]')&&!placement&&!e.altKey&&!anchor){
      e.preventDefault();summary.parentElement.open=!summary.parentElement.open;return;
    }
    if(e.target.closest('input,textarea,select,form button'))e.preventDefault();
    const n=therapyCard(e.target)?targetFrom(e.target,e.altKey):e.altKey
      ?e.target.closest('[data-bs-kind]')?.parentElement?.closest('[data-bs-kind],[data-bs-column],[data-bs-row]')||targetFrom(e.target):targetFrom(e.target);
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
  D.fonts?.ready.then(()=>{if(current()){refreshFreeSizes();paint();}});
  D.addEventListener('submit',e=>{e.preventDefault();},true);
  D.addEventListener('scroll',()=>{paint();if(!popup.hidden&&now())adjustPopup(now());},{passive:true,capture:true});
  D.defaultView.addEventListener('resize',()=>{refreshFreeSizes();paint();});
  function loadSaved(raw) {
    if(!current()||!raw||cursor)return false;
    list=readDraft(raw);
    pendingPublisherBase=JSON.parse(raw).publishedBase||null;
    if(typeof StudioPublish!=='undefined')StudioPublish.bindSource(pendingPublisherBase);
    cursor=list.length;savedOps=list.slice();replay();return true;
  }
  const warn=()=>{if(current())flash('The saved draft could not be read. The original page is open.');};
  (async()=>{
    let raw=null;
    try{raw=localStorage.getItem(STORAGE);}catch{}
    try{
      if(raw&&raw!=='@indexeddb'){loadSaved(raw);return;}
      if(window.indexedDB&&loadSaved(await draftStore('readonly',s=>s.get(STORAGE))))return;
      if(current()&&!cursor&&typeof StudioPublish!=='undefined'){
        const saved=await StudioPublish.initialDraft();
        if(current()&&!cursor&&saved)loadSaved(JSON.stringify(saved));
      }
    }catch{warn();}
  })().finally(()=>{
    if(!current())return;
    busyCanvas(false);
    if(mode==='preview')for(const id of ['add','add-section','grid-mode','grid-snap'])$(id).disabled=true;
    switching=false;if(picker)picker.disabled=false;
    setGridMode(gridMode);showState();
  });
}
window.addEventListener('resize',()=>{if(!baselineReady)return;syncViewport();paint();if(!popup.hidden)adjustPopup(now());});
async function openPage(next) {
  if(!next||next===page||switching||typeof StudioPublish!=='undefined'&&StudioPublish.isBusy()){if(picker)picker.value=page[0];return;}
  switching=true;if(picker)picker.disabled=true;
  if(drag)finishDrag(false);
  if(resizeDrag)stopResize(false);
  clearGridPick();close();toggleMenu(false);
  busyCanvas(true);
  await saveQueue;
  const dirty=cursor!==savedOps.length||savedOps.some((op,i)=>list[i]!==op);
  if(baselineReady&&dirty&&!await save({quiet:true})){
    switching=false;busyCanvas(false);showState();if(picker){picker.disabled=false;picker.value=page[0];}return;
  }
  canvasEpoch++;stopBehavior?.();stopSize?.();
  stopBehavior=null;stopSize=null;baselineReady=false;active=null;D=null;
  list=[];savedOps=[];cursor=0;pendingPublisherBase=null;
  if(typeof StudioPublish!=='undefined')StudioPublish.bindSource(null);
  page=next;
  const url=new URL(location.href);
  if(page[0]==='home')url.searchParams.delete('page');else url.searchParams.set('page',page[0]);
  window.history.replaceState(null,'',url);
  loadCanvas();
}
function loadCanvas(){
  switching=true;busyCanvas(true);if(picker){picker.value=page[0];picker.disabled=true;}
  $('saved').textContent='Opening '+page[1]+'…';
  $('publish-status').textContent='Ready to edit';
  frame.title='New City Wellness · '+page[1];
  frame.src=canvasPath();
  paint();
}
if(picker) {
  picker.replaceChildren();
  const therapies=create('optgroup',{label:'Therapy pages'});
  for(const [id,label,route] of pages){
    const option=create('option',{value:id},label);
    if(route.startsWith('services/')){if(!therapies.parentNode)picker.append(therapies);therapies.append(option);}
    else picker.append(option);
  }
  picker.addEventListener('change',()=>void openPage(pages.find(p=>p[0]===picker.value)));
}
frame.addEventListener('load',boot);
loadCanvas();
