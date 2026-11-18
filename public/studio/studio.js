'use strict';
const $=id=>document.getElementById(id);
const frame=$('canvas'), stage=$('stage'), popup=$('popup'), body=$('popup-body'), outline=$('outline'), selection=$('selection');
const pages=typeof STUDIO_PAGES==='undefined'?[['home','Home','']]:STUDIO_PAGES;
const pageAssets=typeof STUDIO_PAGE_ASSETS==='undefined'?{}:STUDIO_PAGE_ASSETS;
const picker=$('page-picker');
const pageIdentity=()=>page[0]==='home'?'new-city-wellness-homepage':'new-city-wellness-'+page[0];
const canvasPath=()=>page[0]==='home'?'canvas.html?v=verified-studio1':'pages/'+page[0]+'.html?v='+pageAssets[page[0]].canvas;
const storageKey=()=>{
  const key=page[0]==='home'?'ncw.bakery.home.v1':'ncw.studio.page.v1.'+page[0];
  const account=typeof StudioWorkflow==='undefined'?null:StudioWorkflow.account();
  return account?key+'.account.'+account:key;
};
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
  youtube:['YouTube video','','Paste a YouTube link','Media & links'],
  embed:['Embed code','','Paste iframe code or HTML','Media & links'],
  video:['Video','','Upload an MP4 or WebM','Media & links'],
  button:['Button','Learn more','Link or call to action','Media & links'],
  document:['Document','Download document','Downloadable file','Media & links'],
  callout:['Callout','Put a useful note or reminder here.','Highlighted note','Layout'],
  accordion:['Accordion','A short answer goes here.','Expandable question and answer','Layout'],
  divider:['Divider','','Horizontal rule','Layout'],
  spacer:['Spacer','','Adjustable vertical space','Layout'],
  row:['Columns','','Set the count and drag to resize','Layout']
};
const imageKind=k=>k==='image'||k==='captioned';
const listKind=k=>k==='bullets'||k==='numbered';
const isEmbed=k=>k==='youtube'||k==='embed';
const richKinds=['subheading','quote','callout','accordion','divider','spacer','captioned','bullets','numbered','video','youtube','embed'];
// Baseline operations are the active deployed version. Browser drafts and
// submitted-but-not-deployed edits are never treated as live.
let liveOps=[], liveRevision=null, liveSource=null, liveSync=null;
const submittedDrafts=new Map();
const rememberSubmitted=(key,id,raw)=>submittedDrafts.set(key,{id,raw});
let D, original, list=[], savedOps=[], cursor=0, active=null, mode='edit', view='desktop', drag, guide, stopBehavior, toastTimer, gesture, viewportTick, baselineReady=false;
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
const titleOf=n=>n.matches('.condition-grid > .condition-card')?'Condition card':n.matches('.therapy-card')?'Therapy card':n.matches('.testimonial-card,.reviews-card')?'Testimonial card':n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone')?rowTitle(n):n.hasAttribute('data-bs-column')?'Column':({image:'Image',button:'Button',document:'Document',title:'Heading',text:'Paragraph',link:'Link',component:'Component',detail:'Detail',form:'Form',field:'Form field',video:'Video',media:'Embedded media'})[n.dataset.bsKind]||types[n.dataset.bsKind]?.[0]||'Element';
const rowList=()=>[...main().children].filter(x=>x.hasAttribute('data-bs-row'));
const unique=()=> 'new-'+crypto.randomUUID();
const asString=(v,len=3000)=>typeof v==='string'?v.slice(0,len):'';
const bounded=(v,lo,hi)=>Number.isFinite(Number(v))?Math.min(hi,Math.max(lo,Number(v))):lo;
function flash(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function showState(){
  $('undo').disabled=mode==='preview'||!cursor;
  $('redo').disabled=mode==='preview'||cursor===list.length;
  const workflow=typeof StudioWorkflow!=='undefined'&&typeof StudioPublish!=='undefined'?StudioWorkflow:null;
  if(workflow)workflow.renderStatus();
  $('saved').textContent=operationsMatch(liveOps)&&(!workflow||StudioPublish.baseOfDraft()===liveSource)?
    (liveRevision?(liveSource?'Live version':'Original layout'):'Live version not yet verified'):
    workflow?.draftStatus()||(operationsMatch(savedOps)?'Draft saved in this browser':'Unsaved draft');
}
function record(op, token){
  if (!apply(op)) return false;
  if (token && gesture===token && cursor>0 && cursor===list.length) list[cursor-1]=op;
  else {list.splice(cursor);list.push(op);cursor=list.length;}
  gesture=token||null;refreshFreeSizes();if(typeof StudioWorkflow!=='undefined')StudioWorkflow.schedule();showState();paint();return true;
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
  if(resizeDrag)stopResize(false);
  if(drag)finishDrag(false);
  if(paletteDrag)finishPaletteDrag();
  endColumnDrag(false);
  const next=cursor+step;
  if(next<0||next>list.length)return;
  cursor=next;gesture=null;close();replay();if(typeof StudioWorkflow!=='undefined')StudioWorkflow.schedule();
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
  registerExtraNodes();markMoreDraggables();markCardAndDividerTargets();markDirectDragSurfaces();
}
function markMoreDraggables(){
  // Mark after legacy IDs so previously saved drafts retain their anchors.
  const selectors='img,svg,iframe,video,audio,blockquote,figcaption,hr,dl,dt,dd,summary,details,aside,table,tr,th,td,legend,strong,em,small,span,div';
  D.querySelectorAll('.faq-list > details').forEach((item,index)=>{item.dataset.ncwFaqPhoto=String(index);});
  const flowUnits='h1,h2,h3,h4,h5,h6,p,img,figure,iframe,video,blockquote,hr,dl,details,aside,table,form,a.btn,.hero-actions,.hero-seal,.therapy-card,.condition-card,.testimonial-card,.reviews-card,.contact-form-wrap,.contact-map-frame,.insurance-frame,[data-builder-zone]';
  let serial=0;
  for(const el of D.querySelectorAll(selectors)){
    if(idOf(el)||!zoneOf(el)||el.closest('script,style,template,[hidden]')||el.hasAttribute('data-builder-anchor'))continue;
    if(el.closest('svg,[aria-hidden="true"]')&&!el.matches('img,svg,iframe'))continue;
    if(el.matches('div,span')&&!el.matches(flowUnits)&&!el.className&&!el.id&&el.childElementCount===0)continue;
    el.dataset.bsId='detail-new-'+(++serial);
    el.dataset.bsKind=el.matches('img')?'image':el.matches('iframe,video,audio')?'media':el.matches('span,strong,em,small,figcaption,dt,dd,legend')&&!el.children.length?'detail':'component';
  }
  for(const el of D.querySelectorAll(flowUnits)){
    if(!el.dataset.bsKind||!rowOf(el)||el.closest('.page-hero-photo,.hero-media'))continue;
    if(el.matches('img')&&el.parentElement?.classList.contains('therapy-image'))continue;
    el.dataset.bsMove='yes';
  }
}
function markCardAndDividerTargets(){
  for(const card of D.querySelectorAll('.condition-grid > .condition-card')){
    if(idOf(card))card.dataset.bsMove='yes';
  }
  let index=0;
  for(const n of D.querySelectorAll('.ncw .ornament,.ncw .gold-rule,.ncw hr,.ncw [role="separator"],.ncw .cue-line')){
    if(!zoneOf(n)||n.closest('[data-bs-new],template,[hidden]'))continue;
    if(!idOf(n))n.dataset.bsId='native-divider-'+(++index);
    n.dataset.bsDivider='';n.dataset.bsKind='divider';
    if(rowOf(n)&&!n.matches('.cue-line'))n.dataset.bsMove='yes';
  }
}
function dividerFrom(hit,x,y){
  const exact=hit.closest('[data-bs-divider]');
  if(exact)return exact;
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  // A thin rule may be only one pixel tall. Give it a small hit area in
  // edit mode without changing the size or margins of the published line.
  for(const n of hit.querySelectorAll(':scope > [data-bs-divider]')){
    const r=n.getBoundingClientRect();
    const px=r.width>0&&r.width<=5?6:0, py=r.height>0&&r.height<=5?6:0;
    if((px||py)&&r.width+r.height>5&&x>=r.left-px&&x<=r.right+px&&y>=r.top-py&&y<=r.bottom+py)return n;
  }
  return null;
}
// Register additions after the old targets. Published operations and local
// drafts keep their pre-existing IDs and continue to replay in their old order.
function markDirectDragSurfaces(){
  let serial=0;
  const extras='h5,h6,a[href],.eyebrow,.section-kicker,.text-link,.reviewer,.clinic-footer-brand,.footer-col,figure';
  for(const n of D.querySelectorAll(extras)){
    if(!zoneOf(n)||n.closest('[hidden],template,svg,input,textarea,select'))continue;
    if(!idOf(n)){
      n.dataset.bsId='studio-drag-surface-'+(++serial);
      n.dataset.bsKind=n.matches('h5,h6')?'title':n.matches('a')?'link':n.matches('figure,.footer-col,.clinic-footer-brand')?'component':'detail';
    }
    if(rowOf(n)&&n.matches('h5,h6,.eyebrow,.section-kicker,figure,a.text-link')&&!n.closest('a:not(.text-link),form,.therapy-card,.condition-card,.testimonial-card,.reviews-card,.hero-media,.page-hero-photo'))
      n.dataset.bsMove='yes';
  }
  for(const card of D.querySelectorAll(StudioFlow.cardSelector)){
    if(idOf(card)&&rowOf(card))card.dataset.bsMove='yes';
  }
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
  return kind==='document'?!!StudioDocuments.parse(value):typeof value==='string'&&value.length<=MAX_FILE*1.35+100&&/^data:image\/(?:jpeg|png|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/.test(value);
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
  const initial=grid.children.length;
  const widths=StudioColumns.read(grid);
  while(grid.children.length<count){let i=grid.children.length;while(byId(idOf(row)+'-c'+i))i++;grid.append(addNative('div',{class:'bs-col','data-bs-id':idOf(row)+'-c'+i,'data-bs-column':''}));}
  while(grid.children.length>count){
    const last=grid.lastElementChild;
    [...last.children].forEach(e=>grid.children[count-1].append(e));last.remove();
  }
  if(initial===count)StudioColumns.sync(grid);
  else {
    const average=initial?widths.reduce((a,b)=>a+b,0)/initial:1;
    const equal=widths.every(width=>width===widths[0]);
    const next=Array.from({length:count},(_,i)=>equal?1:widths[i]??average);
    if(!equal&&initial>count)next[count-1]+=widths.slice(count).reduce((a,b)=>a+b,0);
    StudioColumns.set(grid,next);
  }
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
  else if(isEmbed(kind))node=embedPlaceholder(kind);
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
function embedPlaceholder(kind){
  return addNative('div',{class:'bs-placeholder'},kind==='youtube'?'Paste a YouTube video link':'Paste your embed code');
}
function applyEmbed(n,kind,value){
  if(!isEmbed(kind)||!n.hasAttribute('data-bs-new')||typeof value!=='string')return false;
  const spec=StudioEmbeds.getSpec(kind,value,D);
  if(!spec&&value.trim())return false;
  n.dataset.bsEmbedInput=value;
  if(!spec){n.replaceChildren(embedPlaceholder(kind));return true;}
  const old=n.querySelector('iframe');
  const title=n.dataset.bsEmbedTitle||spec.title;
  if(old?.getAttribute('src')===spec.src){old.title=title;return true;}
  const box=addNative('iframe',{
    class:'bs-embed-frame',title,src:spec.src,'data-ncw-embed':spec.type,
    sandbox:spec.sandbox,allow:StudioEmbeds.ALLOW,referrerpolicy:StudioEmbeds.REFERRER,
    allowfullscreen:'',loading:'lazy'
  });
  n.replaceChildren(box);return true;
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
    &&(!n.hasAttribute('data-bs-column')||n.parentElement.children.length>1)
    &&(n.dataset.bsKind||n.hasAttribute('data-bs-column')||n.hasAttribute('data-bs-row')));
}
function deleteElement(n){
  if(!canDeleteElement(n))return false;
  const shell=freeShell(n),parent=n.parentElement;
  const col=n.hasAttribute('data-bs-column')&&parent.classList.contains('bs-grid');
  if(col&&parent.children.length===1)return false;
  const widths=col?StudioColumns.read(parent):null;
  if(widths)widths.splice(Array.from(parent.children).indexOf(n),1);
  // Remove an empty photo frame too, without deleting its card or service link.
  const removed=therapyPhoto(n)&&parent.children.length===1?parent:n;
  const ids=new Set([removed,...removed.querySelectorAll('[id]')].map(el=>el.id).filter(Boolean));
  removed.remove();
  if(widths){
    if(parent.matches('.bs-auto-columns'))StudioFlow.compactAutoGrid(parent,widths);
    else StudioColumns.set(parent,widths);
  }
  if(shell)removeFreeContainer(shell);
  else {dePair(parent);StudioFlow.cleanupAutoColumn(parent);}
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
  if(op.kind==='seo')return op.id==='page-seo'&&!!StudioSeo.normalize(op.value);
  const n=byId(op.id), target=op.target?byId(op.target):null;
  if(op.kind==='grid-add'&&!n&&target&&Object.hasOwn(types,op.type)&&op.type!=='row'){
    return attachFree(makeBlock(op.type,op.id),target,op.device,op.p);
  }
  if(op.kind==='row-add' && !n){
    if(op.target && !target?.hasAttribute('data-bs-row'))return false;
    const count=StudioColumns.count(op.cols??1);if(!count)return false;
    if(op.type&&(!Object.hasOwn(types,op.type)||op.type==='row'||!validId(op.id+'-block')||byId(op.id+'-block')))return false;
    const row=makeRow(op.id,count);
    if(op.type)row.querySelector('.bs-col').append(makeBlock(op.type,op.id+'-block'));
    if(op.blank)row.classList.add('bs-blank-section');
    if(target)target[op.side==='before'?'before':'after'](row);
    else if(op.side==='before')main().prepend(row);
    else main().insertBefore(row,main().querySelector(':scope > .editor-blocks'));
    return true;
  }
  if(op.kind==='palette-add'&&!n&&target&&Object.hasOwn(types,op.type)&&op.type!=='row'){
    const block=makeBlock(op.type,op.id);
    return StudioFlow.isSide(op.side)?StudioFlow.alongside(block,target,op.side,op.pair,true):StudioFlow.placeNew(block,target,op.side);
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
    case 'section-height':return StudioResize.applySection(n,op);
    case 'edge-size':return StudioResize.apply(n,op);
    case 'device-layout':return StudioDeviceLayout.apply(n,op);
    case 'flow-move':return StudioFlow.isSide(op.side)?StudioFlow.alongside(n,target,op.side,op.pair):StudioFlow.move(n,target,op.side);
    case 'move': {
      if(n.hasAttribute('data-bs-row')){
        if(!target?.hasAttribute('data-bs-row')||target===n||n.parentElement!==main()||target.parentElement!==main())return false;
        target[op.side==='before'?'before':'after'](n);return true;
      }
      if(n.dataset.bsMove!=='yes'&&!freeShell(n))return false;
      const shell=freeShell(n),old=n.parentElement;
      if(!insertNear(n,target,op.side,op.pair||op.id+'-pair'))return false;
      if(shell)removeFreeContainer(shell);else dePair(old);return true;
    }
    case 'columns':
      if(n.dataset.bsRow!=='custom'||!StudioColumns.count(op.value))return false;
      setColumns(n,Number(op.value));return true;
    case 'column-widths':
      return StudioColumns.set(n.matches('.bs-auto-columns')?n:n.dataset.bsRow==='custom'?n.querySelector(':scope > .bs-row-inner'):null,op.value);
    case 'embed':
      return applyEmbed(n,k,op.value);
    case 'embed-title':
      if(!isEmbed(k)||!e?.matches('iframe'))return false;
      n.dataset.bsEmbedTitle=asString(op.value,160).trim()||'Embedded content';
      e.title=n.dataset.bsEmbedTitle;return true;
    case 'embed-height':
      if(k!=='embed')return false;
      if(op.value==='')n.style.removeProperty('--bs-embed-height');
      else n.style.setProperty('--bs-embed-height',bounded(op.value,120,1800)+'px');
      return true;
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
      e.href=op.value;e.download=StudioDocuments.filename(op.name);return true;
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
function operationsMatch(operations){
  return cursor===operations.length&&operations.every((op,i)=>op===list[i]);
}
const sameOperations=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function setDraft(raw,ops=readDraft(raw)){
  list=ops.slice();cursor=list.length;savedOps=ops.slice();active=null;
  StudioPublish.bindSource(JSON.parse(raw).publishedBase||null);
  replay();
}
let saveQueue=Promise.resolve();
async function readBrowserDraft(key){
  let raw=null;
  try{raw=localStorage.getItem(key);}catch{}
  if(raw&&raw!=='@indexeddb')return raw;
  if(window.indexedDB)return (await draftStore('readonly',s=>s.get(key)))||null;
  return null;
}
async function storeBrowserDraft(key,data){
  if(data.length<3500000){
    try{localStorage.setItem(key,data);return true;}catch{}
  }
  try{
    await draftStore('readwrite',s=>s.put(data,key));
    try{localStorage.setItem(key,'@indexeddb');}catch{try{localStorage.removeItem(key);}catch{}}
    return true;
  }catch{return false;}
}
async function clearBrowserDraft(key){
  try{localStorage.removeItem(key);}catch{}
  if(window.indexedDB)await draftStore('readwrite',s=>s.delete(key)).catch(()=>{});
}
const recoveryKey=()=>storageKey()+'.recovery';
async function recoveredDrafts(key){
  const entries=JSON.parse((await readBrowserDraft(key))||'[]');
  if(!Array.isArray(entries)||!entries.every(item=>typeof item?.raw==='string'&&Number.isFinite(item.savedAt)))throw Error('Could not read recovered drafts.');
  return entries;
}
async function recoverLater(raw){
  if(!raw)return true;
  const key=recoveryKey();
  const entries=await recoveredDrafts(key).catch(()=>null);
  if(!entries)return false;
  if(entries.some(item=>item.raw===raw))return true;
  entries.push({savedAt:Date.now(),raw});
  return storeBrowserDraft(key,JSON.stringify(entries));
}
function save({quiet=false}={}){
  const key=storageKey(), data=draftString(), stamp=list.slice(0,cursor), epoch=canvasEpoch;
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
    const saved=await storeBrowserDraft(key,data);
    if(epoch!==canvasEpoch)return saved;
    if(saved){
      savedOps=stamp;showState();
      if(!quiet)flash('Draft saved in this browser. Nothing was published.');
    }else flash('Browser storage is full or unavailable. Download an editable draft to keep it.');
    return saved;
  });
  return saveQueue;
}
async function loadCanvasLive(localRaw){
  const target=page, state=await StudioPublish.liveManifest(target);
  if(!state)return false;
  const remote=await StudioPublish.loadLiveDraft(target,state);
  const raw=JSON.stringify(remote?{...remote,publishedBase:state.source}:{version:1,page:pageIdentity(),operations:[],publishedBase:null});
  const operations=readDraft(raw);
  let useLocal=false, kept=false;
  if(localRaw){
    let ops;
    try{ops=readDraft(localRaw);}catch{ /* Invalid data must not mask the live page. */ }
    if(ops&&!sameOperations(ops,operations)){
      if((JSON.parse(localRaw).publishedBase||null)===state.source)useLocal=true;
      else{
        kept=await recoverLater(localRaw);
        if(!kept)throw Error('Could not keep the previous browser draft.');
      }
    }
  }
  liveOps=operations;liveRevision=state.revision;liveSource=state.source;
  setDraft(useLocal?localRaw:raw,useLocal?undefined:operations);
  if(localRaw&&!useLocal)await clearBrowserDraft(storageKey());
  if(typeof StudioWorkflow!=='undefined')StudioWorkflow.verified(target,state);
  $('publish-status').textContent=useLocal?'Working on a local draft':'Synced with GitHub Pages';
  if(kept)flash('Live version loaded. Your previous draft is in Draft tools → Recovered drafts.');
  return true;
}
function safeToSync(){
  const input=(!popup.hidden&&$('popup-type').textContent==='PAGE SEO')||$('popup-body').contains(document.activeElement)&&document.activeElement?.matches('input,textarea,select,[contenteditable]');
  return baselineReady&&!switching&&!drag&&!paletteDrag&&!resizeDrag&&!columnDrag&&!gridPick&&!input&&!StudioPublish.isBusy();
}
async function syncLiveCanvas(){
  if(liveSync||!safeToSync())return false;
  const epoch=canvasEpoch, target=page;
  const current=()=>epoch===canvasEpoch&&safeToSync();
  const sync=(async()=>{
    try{
      const state=await StudioPublish.liveManifest(target);
      if(!state||!current()||state.revision===liveRevision)return false;
      if(liveRevision&&state.source===liveSource){
        await StudioPublish.verifyLivePage(target,state);
        if(!current())return false;
        liveRevision=state.revision;StudioWorkflow.verified(target,state);showState();return false;
      }
      const remote=await StudioPublish.loadLiveDraft(target,state);
      if(!current())return false;
      const raw=JSON.stringify(remote?{...remote,publishedBase:state.source}:{version:1,page:pageIdentity(),operations:[],publishedBase:null});
      const operations=readDraft(raw), old=draftString();
      const submitted=submittedDrafts.get(target[0]);
      const alreadyPublished=submitted?.id===state.publication&&submitted.raw===old;
      const dirty=!alreadyPublished&&(!operationsMatch(liveOps)||StudioPublish.baseOfDraft()!==liveSource)&&!sameOperations(JSON.parse(old).operations,operations);
      if(dirty&&!(await recoverLater(old)))return false;
      if(!current()||old!==draftString())return false;
      // Do not let a save queued before this check recreate a stale cache.
      await saveQueue;
      if(!current()||old!==draftString())return false;
      liveOps=operations;liveRevision=state.revision;liveSource=state.source;
      StudioWorkflow.verified(target,state,alreadyPublished?old:null);
      if(submitted?.id===state.publication)submittedDrafts.delete(target[0]);
      if(dirty){
        showState();
        flash('A newer version is live. Your draft is preserved. Open Draft tools → Review changes.');
        void StudioWorkflow.sync();
        return true;
      }
      const panel=$('popup-type').textContent;
      if(!popup.hidden&&!['GITHUB PAGES','PAGE HISTORY','DRAFT TOOLS'].includes(panel))close();
      setDraft(raw,operations);
      const key=storageKey();
      saveQueue=saveQueue.catch(()=>{}).then(()=>clearBrowserDraft(key));
      StudioWorkflow.pageReady();
      flash('The live page is now open in Studio.');
      return true;
    }catch{ /* Keep working if Pages is offline or still deploying. */ return false;}
  })();
  liveSync=sync;
  try{return await sync;}finally{if(liveSync===sync)liveSync=null;}
}
function exportFile(data,name,type){
  const href=URL.createObjectURL(new Blob([data],{type}));const a=create('a',{href,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(href),5000);
}
function fileRead(file,kind,done){
  if(!file)return;
  if(kind==='document'){
    if(file.size>StudioDocuments.MAX_FILE){flash('Choose a document no larger than 25 MB.');return;}
    const reader=new FileReader();
    reader.onload=()=>done(String(reader.result),StudioDocuments.filename(file.name));
    reader.onerror=()=>flash('This document could not be opened.');
    // Read downloads as opaque bytes even if a file declares an executable MIME type.
    reader.readAsDataURL(new Blob([file],{type:StudioDocuments.MIME}));
    return;
  }
  if(file.size>MAX_FILE){flash('Choose a file no larger than 2 MB.');return;}
  const ext=file.name.split('.').pop().toLowerCase();
  const map={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',gif:'image/gif'};
  if(!Object.hasOwn(map,ext)){flash('Choose a JPG, PNG, WebP, AVIF or GIF.');return;}
  const reader=new FileReader();reader.onload=()=>{const uri=String(reader.result).replace(/^data:[^;]*;/,'data:'+map[ext]+';');
    const check=new Image();check.onload=()=>done(uri,file.name);check.onerror=()=>flash('This file could not be opened as an image.');check.src=uri;
  };reader.onerror=()=>flash('This file could not be opened.');reader.readAsDataURL(file);
}
function exportStandalone(){
  if(drag||paletteDrag||resizeDrag){flash('Finish dragging or resizing before exporting.');return;}
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
    root.querySelectorAll("script,.bs-drag-ghost,template[data-bs-flow-origin],[data-bs-drop-slot]").forEach(s=>s.remove());
    root.removeAttribute('data-bs-device');
    root.classList.remove('bs-editor-mode');
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
    root.querySelectorAll('[data-bs-id]').forEach(e=>[...e.attributes].filter(a=>a.name.startsWith('data-bs-')&&a.name!=='data-bs-bg'&&a.name!=='data-bs-look'&&!StudioDeviceLayout.markers.includes(a.name)).forEach(a=>e.removeAttribute(a.name)));
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
  const f=frame.getBoundingClientRect(), r=StudioResize.box(n).getBoundingClientRect();
  const line=n.hasAttribute('data-bs-divider'), px=line&&r.width>0&&r.width<6?4:0,py=line&&r.height>0&&r.height<6?4:0;
  return {left:f.left+r.left-px,right:f.left+r.right+px,top:f.top+r.top-py,bottom:f.top+r.bottom+py,
    width:r.width+2*px,height:r.height+2*py,f};
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
let canvasDragTarget=null;
function canDragCanvas(n){
  return canDragIndependently(n)||!!(n?.isConnected&&n.hasAttribute('data-bs-row')&&n.parentElement===main());
}
function syncCanvasDragTarget(n){
  const next=mode==='edit'&&canDragCanvas(n)?n:null;
  if(next===canvasDragTarget)return;
  canvasDragTarget?.removeAttribute('data-bs-drag-ready');
  next?.setAttribute('data-bs-drag-ready','');
  canvasDragTarget=next;
}
function paint(){
  const n=now();
  syncCanvasDragTarget(n);
  paintColumnHandles();
  if(!D||mode!=='edit'||!active||paletteDrag?.moved||(drag?.moved&&drag.direct)){outline.hidden=true;selection.hidden=true;hideResizeHandles();return;}
  const r=anchorRect(n);
  if(!r){outline.hidden=true;selection.hidden=true;hideResizeHandles();return;}
  const top=Math.max(r.f.top,r.top),bt=Math.min(r.f.bottom,r.bottom);
  const l=Math.max(r.f.left,r.left),rt=Math.min(r.f.right,r.right);
  if(bt-top<3||rt-l<3){outline.hidden=true;selection.hidden=true;hideResizeHandles();return;}
  const row=n.hasAttribute('data-bs-row'); outline.toggleAttribute('data-row',row);
  Object.assign(outline.style,{left:l+'px',top:top+'px',width:(rt-l)+'px',height:(bt-top)+'px'});
  outline.hidden=false;
  $('selection-label').textContent=titleOf(n);
  $('drag').hidden=!canDragCanvas(n);
  $('selection-add').hidden=false;
  $('selection-section').hidden=row||!rowOf(n);
  for(const [id,step] of [['selection-up',-1],['selection-down',1]]){
    const control=$(id), direction=step<0?'up':'down';
    const label='Move '+(row?'section ':'element ')+direction;
    control.hidden=!canDragCanvas(n);
    control.disabled=!canStepSelection(n,step);
    control.setAttribute('aria-label',label);
    control.title=control.disabled?'No movable item '+(step<0?'above':'below'):label;
  }
  $('selection-duplicate').hidden=false;
  paintResizeHandles(n,r);
  selection.hidden=false;
  const y=top-35>=r.f.top?top-35:top+2;
  selection.style.top=y+'px';
  selection.style.left=Math.max(r.f.left,Math.min(l+2,r.f.right-selection.offsetWidth-1))+'px';
}
function close(){popup.hidden=true;gesture=null;$('page-seo').setAttribute('aria-expanded','false');}
function open(title,category,anchor=null){
  $('popup-title').textContent=title;$('popup-type').textContent=category;
  $('page-seo').setAttribute('aria-expanded',String(category==='PAGE SEO'));
  body.replaceChildren();body.scrollTop=0;popup.hidden=false;gesture=null;
  const footer=$('popup-footer'),remove=$('delete-element');
  footer.hidden=!canDeleteElement(anchor)||!['ELEMENT SETTINGS','CARD SETTINGS','DIVIDER SETTINGS','SECTION SETTINGS','ROW / COLUMN'].includes(category);
  remove.onclick=null;
  if(!footer.hidden){
    const label=anchor.matches('.therapy-card')?'card':anchor.hasAttribute('data-bs-row')?'section'
      :anchor.hasAttribute('data-bs-column')?'column':anchor.dataset.bsKind==='divider'?'divider':anchor.dataset.bsKind==='image'?'image':'element';
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
    if(e.key==='Shift'&&drag?.moved)updateDrag(drag.x,drag.y,true);
    if(e.key==='Escape'){
      if(paletteDrag){finishPaletteDrag();return;}
      if(drag){finishDrag();return;}
      if(resizeDrag){stopResize(false);return;}
      if(columnDrag){endColumnDrag(false);return;}
      if(gridPick){clearGridPick();return;}
      if(!popup.hidden){const seo=$('popup-type').textContent==='PAGE SEO';close();$(seo?'page-seo':'selection-settings').focus();return;}
      if(!$('element-sidebar').hasAttribute('data-collapsed')){toggleElementSidebar(false,true);return;}
      if(!$('menu').hidden){toggleMenu(false);$('more').focus();return;}
      active=null;paint();return;
    }
    if(e.target?.closest?.('input,textarea,select,[contenteditable],[role="textbox"],[role="slider"]'))return;
    if(!e.defaultPrevented&&mode==='edit'&&!drag&&!paletteDrag&&!columnDrag&&!resizeDrag&&!gridPick
      &&!e.ctrlKey&&!e.metaKey&&handleSelectionArrow(e))return;
    if(mode==='edit'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'&&now()){e.preventDefault();cloneSelected(now());return;}
    if(mode==='edit'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();stepHistory(e.shiftKey?1:-1);}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
  }
  const release=e=>{
    if(e.key==='Shift'&&drag?.moved)updateDrag(drag.x,drag.y,false);
    if(e.key?.startsWith('Arrow'))endKeyboardNudge();
  };
  if(!useKeys.outer){document.addEventListener('keydown',handle);document.addEventListener('keyup',release);useKeys.outer=true;}
  D.addEventListener('keydown',handle);D.addEventListener('keyup',release);
}
function targetFrom(el,wholeCard=false){
  const divider=el.closest('[data-bs-divider]');
  if(divider)return divider;
  const card=therapyCard(el);
  if(wholeCard&&(card||StudioFlow.cardOf(el)))return card||StudioFlow.cardOf(el);
  const exact=el.closest('[data-bs-kind]');
  const interactive=el.closest('a[href][data-bs-kind],button[data-bs-kind],label[data-bs-kind],summary[data-bs-kind]');
  if(!wholeCard&&interactive&&exact?.dataset.bsId?.startsWith('detail-new-'))return interactive;
  if(card){
    if(therapyPhoto(exact)||exact?.matches('h3'))return exact;
    const photo=el.closest('.therapy-image')?.querySelector('img[data-bs-kind="image"]');
    return photo||card;
  }
  if(exact)return exact;
  const col=el.closest('[data-bs-column]');if(col)return col;
  return el.closest('[data-bs-row],[data-bs-zone]');
}
function sectionNeighbor(n,step){
  const rows=rowList(), index=rows.indexOf(n);
  return index<0?null:rows[index+step];
}
function moveInDirection(n,step,{scroll=true}={}){
  if(!n?.hasAttribute('data-bs-row'))return false;
  const peer=sectionNeighbor(n,step);
  if(!peer||!record({kind:'move',id:idOf(n),target:idOf(peer),side:step<0?'before':'after'}))return false;
  if(scroll)n.scrollIntoView({block:'nearest'});
  paint();return true;
}
function canStepSelection(n,step){
  if(!n)return false;
  return n.hasAttribute('data-bs-row')?!!sectionNeighbor(n,step):!!StudioFlow.stepTarget(n,step);
}
function stepSelection(n,step){
  if(!n)return false;
  if(n.hasAttribute('data-bs-row')){
    const moved=moveInDirection(n,step);
    if(moved&&!popup.hidden)adjustPopup(n);
    return moved;
  }
  const choice=StudioFlow.stepTarget(n,step);
  if(!choice||!record({kind:'flow-move',id:idOf(n),target:idOf(choice.node),side:choice.side}))return false;
  n.scrollIntoView({block:'nearest'});paint();
  if(!popup.hidden)adjustPopup(n);
  return true;
}
const arrowSteps={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
let keyboardNudge=null;
function endKeyboardNudge(){
  if(keyboardNudge?.token===gesture)gesture=null;
  keyboardNudge=null;
}
function handleSelectionArrow(e){
  if(!Object.hasOwn(arrowSteps,e.key))return false;
  const n=now();if(!canDragCanvas(n))return false;
  const [dx,dy]=arrowSteps[e.key];
  const section=n.hasAttribute('data-bs-row');
  if(section&&(!dy||e.altKey))return false;
  e.preventDefault();
  if(dy&&!e.altKey&&(section||canStepSelection(n,dy))){
    endKeyboardNudge();
    stepSelection(n,dy);
    return true;
  }
  if(!canDragIndependently(n))return true;
  const device=devicePlacement(), id=idOf(n), amount=e.shiftKey?10:2;
  const previous=dragOffset(n,device);
  const current=offsetDragStart(n);
  if(!keyboardNudge||keyboardNudge.id!==id||keyboardNudge.key!==e.key||keyboardNudge.device!==device){
    keyboardNudge={id,key:e.key,device,token:Symbol()};
  }
  const {p}=offsetDragTarget(n,current,dx*amount,dy*amount,false);
  if(Math.abs(p.x-previous.x)<.0001&&Math.abs(p.y-previous.y)<.01)return true;
  if(record(dragOperation(n,device,p),keyboardNudge.token)&&!popup.hidden)adjustPopup(n);
  return true;
}
function sectionOrder(focusId,focusStep){
  const put=open('Jump to section','PAGE LAYOUT');
  const rows=rowList();
  if(!rows.length){para('There are no sections to reorder.');put();return;}
  para('Choose a section to jump to it, or use the arrows to change its order.');
  const list=create('ol',{class:'section-order-list'});body.append(list);
  let focus;
  for(const [index,row] of rows.entries()){
    const item=create('li'), text=rowTitle(row);
    item.append(create('span',{class:'section-index','aria-hidden':'true'},String(index+1)));
    const name=button(item,text,()=>{row.scrollIntoView({block:'start'});choose(row);},{class:'section-name'});
    name.title=text;
    if(focusId===idOf(row))focus=name;
    for(const [step,label,arrow] of [[-1,'up','↑'],[1,'down','↓']]){
      const b=button(item,arrow,()=>{
        if(moveInDirection(row,step,{scroll:false}))sectionOrder(idOf(row),step);
      },{'aria-label':'Move '+text+' '+label,title:'Move '+label});
      b.disabled=!rows[index+step];
      if(!b.disabled&&focusId===idOf(row)&&focusStep===step)focus=b;
    }
    list.append(item);
  }
  put();focus?.focus();
}
function pickTarget(){
  const n=now();
  if(!n)return;
  const place=open('Move '+titleOf(n).toLowerCase(),'ELEMENT PLACEMENT',n);
  para('Choose an available destination. To keep other items in place, hold Shift while dragging.');
  const allowed=[...D.querySelectorAll('[data-bs-column],[data-bs-move=yes]')].filter(t=>t!==n&&!n.contains(t)&&canInline(n,t,t.hasAttribute('data-bs-column')?'inside':'before'));
  if(!allowed.length){para('Add a row or another editable element to create a destination.');place();return;}
  const sel=create('select',{'aria-label':'Move destination'});
  allowed.forEach(t=>sel.append(create('option',{value:idOf(t)},rowTitle(rowOf(t))+' · '+(t.hasAttribute('data-bs-column')?'Column '+(Array.from(t.parentElement.children).indexOf(t)+1):textCopy(content(t)).slice(0,44)||titleOf(t)))));
  const label=create('label',{},'Destination');label.append(sel);body.append(label);
  const actions=group();
  const commit=(s)=>{
    const peer=byId(sel.value), side=peer.hasAttribute('data-bs-column')?'inside':s;
    if(!record({kind:StudioFlow.isSide(side)?'flow-move':'move',id:idOf(n),target:idOf(peer),side,pair:unique()})){flash('Choose another destination.');return;}
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
    para('Drag the whole card onto another therapy card to reorder it. Its image and link move with it.');
    if(photo)replaceImageControl(body,photo,'Replace card image');
    const actions=group();
    if(photo)button(actions,'Select card image',()=>choose(photo));
    if(title)button(actions,'Edit card heading',()=>choose(title));
    dragResetControl(actions,n);
    if(typeof StudioDeviceLayout!=='undefined')StudioDeviceLayout.controls(n);
    place();return;
  }
  if(n.hasAttribute('data-bs-divider')){
    const place=open('Divider','DIVIDER SETTINGS',n);
    para('Drag the divider to move the whole decoration without separating its parts.');
    dragResetControl(group(),n);place();return;
  }
  if(n.hasAttribute('data-bs-column')){
    const place=open('Column settings','ROW / COLUMN',n);
    para('Add any block to this column. Drag a green divider to resize neighbouring columns. Columns stack on phones.');
    const a=group();button(a,'Add element',()=>startAdd(n));button(a,'Duplicate column',()=>cloneSelected(n));button(a,'Position and size',()=>gridPanel(n));button(a,'Edit parent section',()=>choose(rowOf(n)));
    place();return;
  }
  if(n.hasAttribute('data-bs-row')) {
    const custom=n.dataset.bsRow==='custom', inner=n.querySelector(':scope > .bs-row-inner');
    const place=open(rowTitle(n),'SECTION SETTINGS',n);
    const labelToken=Symbol();input(body,'Section name',rowTitle(n),{maxlength:80},x=>record({kind:'section-name',id:idOf(n),value:x.value},labelToken));
    backgroundPanel(n);
    para('Drag the blue grip on the top or bottom border to resize the section.');
    const heightToken=Symbol();input(body,'Minimum height (px)',parseInt(surfaceOf(n).style.getPropertyValue('--bs-manual-height'))||'',{type:'number',min:0,max:StudioResize.SECTION_LIMIT,placeholder:'Automatic'},x=>record({kind:'section-height',id:idOf(n),value:x.value},heightToken));
    if(custom){
      const count=inner.children.length;
      columnCountControl(body,count,'Apply column count',next=>{
        if(record({kind:'columns',id:idOf(n),value:next}))openSettings(n);
      });
      const actions=group();
      if(count>1){
        button(actions,'Resize on canvas',()=>{
          close();paint();$('column-handles').querySelector('button:not([hidden])')?.focus({preventScroll:true});
        });
        button(actions,'Reset to equal widths',()=>{record({kind:'column-widths',id:idOf(n),value:Array(count).fill(1)});openSettings(n);});
      }
      const cb=Symbol();
      input(body,'Column gap (px)',inner.style.getPropertyValue('--bs-gap')?Number.parseInt(inner.style.getPropertyValue('--bs-gap')):18,{type:'number',min:0,max:80},x=>record({kind:'row-gap',id:idOf(n),value:x.value},cb));
      para('Drag the green dividers left or right, or focus a divider and use the arrow keys. Columns stack on phones.');
    }
    const a=group();
    for(const [step,text] of [[-1,'↑ Move section up'],[1,'↓ Move section down']]){
      const control=button(a,text,()=>{if(moveInDirection(n,step))openSettings(n);});
      control.disabled=!sectionNeighbor(n,step);
    }
    button(a,'All sections',()=>sectionOrder(idOf(n)));
    button(a,'＋ Add section above',()=>rowChoices(n,'before'));
    button(a,'＋ Add section below',()=>rowChoices(n,'after'));
    button(a,'Add element',()=>startAdd(n));
    button(a,'Duplicate section',()=>cloneSelected(n));
    if(typeof StudioDeviceLayout!=='undefined')StudioDeviceLayout.controls(n);
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
      button(a,'Position and size',()=>gridPanel(n));button(a,'Duplicate',()=>cloneSelected(n));
      if(rowOf(n))button(a,'Section settings',()=>choose(rowOf(n)));
    }
    put();return;
  }
  const place=open(titleOf(n),'ELEMENT SETTINGS',n);
  if(StudioFlow.cardOf(n)===n)para('Drag this card over another card in its group to reorder it.');
  if(imageKind(k)){
    replaceImageControl(body,n);
    if(therapyPhoto(n))para('Drag the image grip to adjust the crop. Select the whole card to move it with its image.');
    const token=Symbol();input(body,'Alternative text',n.dataset.bsAlt??e?.alt??'',{maxlength:250},el=>record({kind:'alt',id:idOf(n),value:el.value},token));
    if(k==='captioned'){
      const cap=Symbol();input(body,'Caption',textCopy(n.querySelector('figcaption')),{maxlength:300},el=>record({kind:'part',id:idOf(n),value:el.value},cap));
    }
  }else if(isEmbed(k)){
    const feedback=create('p',{class:'muted',role:'status'});
    const token=Symbol();
    const ex=k==='youtube'?'https://www.youtube.com/watch?v=…':'<iframe src="https://…"></iframe>';
    input(body,k==='youtube'?'YouTube video URL':'Embed code or HTTPS URL',n.dataset.bsEmbedInput||'',
      {tag:k==='embed'?'textarea':'input',placeholder:ex,maxlength:k==='embed'?30000:4096,class:'studio-text'},el=>{
      if(record({kind:'embed',id:idOf(n),value:el.value},token)){
        feedback.textContent=el.value.trim()?'Embed loaded. Use Preview to interact with it.':'';
      }else feedback.textContent=k==='youtube'?'Enter a YouTube watch, share, Shorts, live or embed link.':'Paste HTML, iframe code or a valid HTTPS URL.';
    });
    body.append(feedback);
    const label=Symbol();
    input(body,'Accessible title',n.dataset.bsEmbedTitle||n.querySelector('iframe')?.title||'',{maxlength:160,placeholder:k==='youtube'?'YouTube video':'Embedded content'},el=>{
      record({kind:'embed-title',id:idOf(n),value:el.value},label);
    });
    if(k==='embed'){
      const height=Symbol();
      const value=n.style.getPropertyValue('--bs-embed-height');
      input(body,'Height (px)',value?parseInt(value,10):'',{type:'number',min:120,max:1800,placeholder:'Automatic (16:9)'},el=>{
        record({kind:'embed-height',id:idOf(n),value:el.value},height);
      });
      para('Custom HTML runs in an isolated frame. Some providers require a specific embed URL or block embedding.');
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
    if(k==='document'){
      const attachment=create('p',{class:'note','aria-live':'polite'},e.download?'Attached: '+e.download:'No document attached yet.');
      body.append(attachment);
      input(body,'Upload a document (any format, up to 25 MB)','',{type:'file'},el=>{
        const file=el.files[0];
        fileRead(file,k,(value,name)=>{
          if(el.files[0]===file&&n.isConnected&&record({kind:'file',id:idOf(n),value,name})){
            attachment.textContent='Attached: '+name;flash(name+' attached.');
          }
        });
      },'change');
    }
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
  if(!therapyPhoto(n)){button(actions,'Position and size',()=>gridPanel(n));button(actions,'Duplicate',()=>cloneSelected(n));}
  if(n.dataset.bsMove==='yes')button(actions,'Move to…',()=>pickTarget(n));
  dragResetControl(actions,n);
  const groupParent=n.parentElement?.closest('.therapy-card,.reviews-card,.testimonial-card,form,details,figure,[data-bs-column]');
  if(groupParent&&idOf(groupParent))button(actions,'Select whole '+titleOf(groupParent).toLowerCase(),()=>choose(groupParent));
  if(!therapyPhoto(n))button(actions,'Add nearby',()=>startAdd(n));
  const parent=n.parentElement?.closest('[data-bs-kind],[data-bs-column]');
  if(parent&&!therapyCard(n))button(actions,'Select parent '+titleOf(parent).toLowerCase(),()=>choose(parent));
  if(rowOf(n))button(actions,'Section settings',()=>choose(rowOf(n)));
  if(!imageKind(k)&&!['spacer','divider','video','youtube','embed'].includes(k)&&e){
    const details=create('details',{class:'look'});details.append(create('summary',{},'Text appearance'));body.append(details);
    const font=Symbol(), color=Symbol();
    input(details,'Font size (px)',e.style.fontSize?Number.parseInt(e.style.fontSize):'',{type:'number',min:10,max:96,placeholder:'Original'},x=>record({kind:'font-size',id:idOf(n),value:x.value},font));
    const rgb=D.defaultView.getComputedStyle(e).color.match(/\d+/g)?.slice(0,3);
    const hex=rgb?'#'+rgb.map(x=>Number(x).toString(16).padStart(2,'0')).join(''):'#23392e';
    const colorInput=input(details,'Text color',hex,{type:'color'},x=>record({kind:'text-color',id:idOf(n),value:x.value},color));
    button(details,'Reset color',()=>{record({kind:'text-color',id:idOf(n),value:''});colorInput.value=hex;});
  }
  if(typeof StudioDeviceLayout!=='undefined')StudioDeviceLayout.controls(n);
  place();
}
function columnCountControl(parent,count,action,submit){
  const countField=input(parent,'Number of columns',count,{type:'number',min:1,max:StudioColumns.LIMIT,step:1},()=>{});
  const add=button(group(),action,()=>{
    const next=StudioColumns.count(countField.value);
    if(!next){countField.reportValidity();return;}
    submit(next);
  });
  countField.required=true;
  countField.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();add.click();}});
}
function rowChoices(anchor,side='after',columnsOnly=false){
  const r=anchor&&rowOf(anchor);
  const place=open(columnsOnly?'Add columns':'Add a section','CHOOSE A SECTION LAYOUT',r);
  para(r?'The new section will go '+(side==='before'?'above':'below')+' '+rowTitle(r)+'.':'The new section will go '+(side==='before'?'at the top of this page.':'before the footer.'));
  const choices=group('quick-grid');
  function add(cols,blank=false){
    const id=unique();record({kind:'row-add',id,cols,target:idOf(r)||null,side,blank});
    const n=byId(id);n.scrollIntoView({block:'center'});choose(n);
  }
  if(!columnsOnly){
    const grid=button(choices,'Blank grid',()=>add(1,true));
    grid.append(create('small',{},'Place items at any point'));
  }
  for(let cols=1;cols<=4;cols++)button(choices,cols===1?'1 column':cols+' equal columns',()=>add(cols));
  columnCountControl(body,columnsOnly?2:1,'Add columns',add);
  if(!r)button(group(),side==='before'?'Insert at the bottom instead':'Insert at the top instead',()=>rowChoices(null,side==='before'?'after':'before',columnsOnly));
  place();
}
function toggleElementSidebar(visible,returnFocus=false){
  const sidebar=$('element-sidebar'), toggle=$('add');
  sidebar.toggleAttribute('data-collapsed',!visible);
  sidebar.toggleAttribute('inert',!visible);
  toggle.setAttribute('aria-expanded',String(visible));
  toggle.title=visible?'Hide Add Elements':'Show Add Elements';
  if(returnFocus)toggle.focus({preventScroll:true});
}
function buildElementPalette(){
  const palette=$('element-sidebar-body');
  if(palette.hasChildNodes())return;
  palette.append(create('p',{class:'palette-instruction'},'Drag any tool onto the page.'));
  const sections={};
  for(const [kind,[t,,description,category]] of Object.entries(types)){
    if(!sections[category]){
      palette.append(create('h3',{class:'library-group'},category));
      sections[category]=create('div',{class:'quick-grid'});palette.append(sections[category]);
    }
    const tile=create('div',{class:'palette-block',title:'Drag '+t+' onto the page','aria-label':t+' · '+description});
    tile.append(StudioElementIcons.create(kind),create('span',{class:'palette-name'},t),
      create('span',{class:'palette-grip','aria-hidden':'true'},'⠿'));
    sections[category].append(tile);
    tile.addEventListener('pointerdown',e=>beginPaletteDrag(e,kind));
  }
}
function startAdd(){
  if(mode!=='edit'||switching)return;
  clearGridPick();close();toggleElementSidebar(true);
}
function openSeo(){
  if(!baselineReady||switching||mode!=='edit'||StudioPublish.isBusy())return;
  const current=StudioSeo.fromOperations(list.slice(0,cursor));
  const baseline=pageAssets[page[0]]?.seo||{};
  const defaultDescription=baseline.description||'Use the site default';
  const place=open('SEO settings · '+page[1],'PAGE SEO');
  para('These settings apply to '+page[1]+' only. Apply them to the draft, then use Publish page to make them live.');
  const form=create('form',{class:'seo-fields'});
  const search=create('fieldset'), social=create('details',{class:'look'});
  search.append(create('legend',{},'Search and indexing'));
  social.append(create('summary',{},'Social sharing'));
  const fields={};
  function field(parent,key,label,placeholder,multi=false){
    const wrap=create('label',{},label);
    const control=create(multi?'textarea':'input',{name:key,maxlength:StudioSeo.limits[key],placeholder});
    control.value=current[key];wrap.append(control);parent.append(wrap);fields[key]=control;
    if(!multi)control.type=key==='canonical'?'url':'text';
  }
  field(search,'title','Page title',baseline.title||page[1]);
  field(search,'description','Meta description',defaultDescription,true);
  field(search,'canonical','Canonical URL',baseline.canonical||'Use the site default');
  const indexLabel=create('label',{},'Search indexing');
  const indexing=create('select',{name:'robots'});
  for(const [value,label] of [['','Use the site default'],['index','Allow indexing'],['noindex','Do not index this page']])indexing.append(create('option',{value},label));
  indexing.value=current.robots;indexLabel.append(indexing);search.append(indexLabel);fields.robots=indexing;
  field(social,'socialTitle','Social title',baseline.socialTitle||baseline.title||page[1]);
  field(social,'socialDescription','Social description',baseline.socialDescription||defaultDescription,true);
  const feedback=create('p',{role:'alert',class:'seo-error'});
  const actions=create('div',{class:'actions'});
  const applyButton=create('button',{type:'submit'},'Apply to draft');
  const reset=button(actions,'Use site defaults',()=>{
    for(const input of Object.values(fields))input.value='';
    feedback.textContent='Defaults selected. Apply to keep this change.';
  });
  actions.prepend(applyButton);reset.type='button';
  form.append(search,social,feedback,actions);body.append(form);
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const value=StudioSeo.normalize(Object.fromEntries(Object.entries(fields).map(([key,control])=>[key,control.value])));
    if(!value){feedback.textContent='Enter a valid HTTPS canonical URL without a fragment or leave it blank. Check the field lengths.';return;}
    if(JSON.stringify(value)===JSON.stringify(current)){close();$('page-seo').focus();return;}
    if(record({kind:'seo',id:'page-seo',value})){
      close();$('page-seo').focus();flash('SEO settings added to the '+page[1]+' draft.');
    }
  });
  place();fields.title.focus({preventScroll:true});
}
let paletteDrag=null,paletteTick=0;
function beginPaletteDrag(e,kind){
  if(e.button!==0||e.isPrimary===false||mode!=='edit'||switching||drag||resizeDrag||columnDrag||paletteDrag||StudioPublish.isBusy())return;
  if(e.pointerType==='touch'&&!e.target.closest('.palette-grip'))return;
  // Capture before the pointer crosses into the iframe. A press without
  // enough movement does nothing and leaves the toolbox open.
  const capture=e.currentTarget;
  capture.setPointerCapture(e.pointerId);
  paletteDrag={kind,pointer:e.pointerId,capture,startX:e.clientX,startY:e.clientY,moved:false};
}
function updatePaletteDrag(x,y){
  const d=paletteDrag;
  if(!d)return;
  d.x=x;d.y=y;
  if(!d.moved){
    if(Math.hypot(x-d.startX,y-d.startY)<6)return;
    d.moved=true;
    // Preview the actual block while the guide shows where it will land.
    d.preview=d.kind==='row'?null:makeBlock(d.kind,'drag-preview');
    d.capture=document.documentElement;
    d.capture.setPointerCapture(d.pointer);
    close();clearGridPick();
    toggleElementSidebar(false);
    paint();
    stage.classList.add('bs-dragging');D.documentElement.classList.add('bs-dragging');
    paletteTick=requestAnimationFrame(scrollDuringPaletteDrag);
  }
  const chip=$('palette-drag-chip'), f=frame.getBoundingClientRect();
  chip.hidden=false;chip.textContent=types[d.kind][0];
  chip.style.left=Math.max(6,Math.min(innerWidth-150,x+14))+'px';
  chip.style.top=Math.max(6,y-34)+'px';
  const px=x-f.left,py=y-f.top;
  if(px<0||px>=f.width||py<0||py>=f.height){
    d.choice=null;clearFlowPreview();hideGridVisual();return;
  }
  showDragGrid(f);
  if(d.preview){
    chip.hidden=true;
    const width=Math.min(290,Math.max(120,f.width-24));
    drawGhost(d.preview,x-Math.min(width*.32,72),y-18,width,42,true);
  }
  if(retainFlowPreview(px,py)){positionFlowGuide(f);return;}
  clearFlowPreview();
  d.choice=StudioFlow.libraryTarget(d.kind,px,py);
  if(d.choice)showFlowPreview(d.choice,f,d.kind==='row'?72:48,true);
}
function scrollDuringPaletteDrag(){
  if(!paletteDrag?.moved)return;
  const d=paletteDrag;
  if(scrollDragCanvas(d.x,d.y))updatePaletteDrag(d.x,d.y);
  paletteTick=requestAnimationFrame(scrollDuringPaletteDrag);
}
function placePaletteBlock(kind,choice){
  if(!choice)return false;
  const id=unique(), target=idOf(choice.node)||null;
  const addRow=choice.row;
  if(!record(addRow?{kind:'row-add',id,target,side:choice.side==='before'?'before':'after',cols:kind==='row'?2:1,...(kind==='row'?{}:{type:kind})}
    :{kind:'palette-add',id,target,type:kind,side:choice.side,pair:StudioFlow.isSide(choice.side)?unique():undefined}))return false;
  const fresh=byId(addRow&&kind!=='row'?id+'-block':id);
  $('hint').textContent=defaultHint();
  fresh.scrollIntoView({block:'nearest'});choose(fresh);
  return true;
}
function finishPaletteDrag(commit=false){
  const d=paletteDrag;
  if(!d)return;
  paletteDrag=null;cancelAnimationFrame(paletteTick);
  if(!d.moved){
    if(d.capture.hasPointerCapture?.(d.pointer))d.capture.releasePointerCapture(d.pointer);
    return;
  }
  $('palette-drag-chip').hidden=true;
  clearFlowPreview();hideGridVisual();
  stage.classList.remove('bs-dragging');D?.documentElement.classList.remove('bs-dragging');
  if(d.capture.hasPointerCapture(d.pointer))d.capture.releasePointerCapture(d.pointer);
  if(commit&&d.choice)placePaletteBlock(d.kind,d.choice);
  paint();
}
document.addEventListener('pointermove',e=>{if(paletteDrag?.pointer===e.pointerId)updatePaletteDrag(e.clientX,e.clientY);});
document.addEventListener('pointerup',e=>{
  if(paletteDrag?.pointer!==e.pointerId)return;
  if(paletteDrag.moved)updatePaletteDrag(e.clientX,e.clientY);
  finishPaletteDrag(true);
},true);
for(const name of ['pointercancel','lostpointercapture'])document.addEventListener(name,e=>{
  if(paletteDrag?.pointer===e.pointerId&&(name!=='lostpointercapture'||e.target===paletteDrag.capture))finishPaletteDrag();
});
window.addEventListener('blur',()=>{if(paletteDrag)finishPaletteDrag();});
let flowPreview=null;
function clearFlowPreview(){
  flowPreview?.restore?.();
  flowPreview?.slot?.remove();
  flowPreview?.animations?.forEach(a=>a.cancel());
  flowPreview=null;
  $('drop-guide').hidden=true;
  $('drop-target-outline').hidden=true;
}
function retainFlowPreview(x,y){
  if(flowPreview?.edgeBox){
    const r=flowPreview.edgeBox, dy=flowPreview.scrollY-D.defaultView.scrollY;
    return StudioFlow.sideEdges({...r,top:r.top+dy,bottom:r.bottom+dy},x,y).some(([side])=>side===flowPreview.side);
  }
  const r=flowPreview?.slot?.getBoundingClientRect();
  return !!(r&&r.width>0&&r.height>0&&x>=r.left-10&&x<=r.right+10&&y>=r.top-12&&y<=r.bottom+12);
}
function showFlowPreview(choice,f,height=drag?.layout.r.height||48,fromPalette=false){
  if(choice.card){flowPreview=choice;positionFlowGuide(f);return;}
  const el=choice.node&&StudioFlow.unit(choice.node);
  const slot=addNative('div',{'data-bs-drop-slot':'','aria-hidden':'true'});
  slot.style.height=Math.max(24,Math.min(height,240))+'px';
  if(StudioFlow.isSide(choice.side)){
    const edgeBox=StudioFlow.sideBox(choice.node),scrollY=D.defaultView.scrollY;
    const restore=!choice.native?StudioFlow.previewAside(choice.node,choice.side,slot):null;
    flowPreview={...choice,edgeBox,scrollY,restore,...(restore?{slot}:{})};
    positionFlowGuide(f);return;
  }
  // Animate ordinary neighbors as they make space for a drop. No transient
  // transform, placeholder, or preview column ever enters the saved draft.
  const peers=D.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?[]:
    Array.from(el?.parentElement?.children||[]).filter(n=>n!==drag?.node&&n.animate).slice(0,36)
      .map(n=>[n,StudioFlow.layoutBox(n)]).filter(([,r])=>r.height&&r.bottom>=0&&r.top<=f.height);
  if(!el)main().append(slot);
  else if(!choice.row&&(fromPalette||choice.side.startsWith('section-'))){if(!StudioFlow.placeNew(slot,choice.node,choice.side))return;}
  else if(choice.side==='inside')el.append(slot);
  else el[choice.side](slot);
  const animations=peers.flatMap(([n,before])=>{
    const visual=n.getBoundingClientRect().height?n:n.firstElementChild;
    const now=StudioFlow.layoutBox(n), dx=before.left-now.left,dy=before.top-now.top;
    return visual?.animate&&Math.abs(dx)+Math.abs(dy)>1?[visual.animate([
      {transform:'translate('+dx+'px,'+dy+'px)',composite:'add'},
      {transform:'translate(0,0)',composite:'add'}
    ],{duration:145,easing:'cubic-bezier(.18,.62,.24,1)'})]:[];
  });
  flowPreview={...choice,slot,animations};positionFlowGuide(f);
}
function showTargetOutline(f,r){
  const outline=$('drop-target-outline');
  const left=Math.max(1,r.left), right=Math.min(f.width-1,r.right);
  const top=Math.max(1,r.top), bottom=Math.min(f.height-1,r.bottom);
  outline.hidden=right-left<6||bottom-top<6;
  if(!outline.hidden)Object.assign(outline.style,{left:(f.left+left)+'px',top:(f.top+top)+'px',
    width:(right-left)+'px',height:(bottom-top)+'px'});
}
function positionFlowGuide(f){
  const marker=$('drop-guide'), side=flowPreview.side, vertical=StudioFlow.isSide(side);
  const target=flowPreview.node;
  const anchor=target&&StudioFlow.layoutBox(StudioFlow.unit(flowPreview.landing||target));
  if(anchor)showTargetOutline(f,anchor);
  const track=vertical?(flowPreview.slot?.getBoundingClientRect()||StudioFlow.sideBox(target)):null;
  const line=vertical?Math.max(3,Math.min(f.width-3,track[flowPreview.slot?(side==='left'?'right':'left'):side])):null;
  const r=flowPreview.card?
    {left:anchor.left+3,right:anchor.right-3,top:anchor.top+3,bottom:anchor.bottom-3}:
    vertical?{left:line-2,right:line+2,top:track.top,bottom:track.bottom}:flowPreview.slot.getBoundingClientRect();
  marker.classList.toggle('side-guide',vertical);
  marker.classList.toggle('card-guide',!!flowPreview.card);
  const left=Math.max(0,r.left), right=Math.min(f.width,r.right);
  const top=Math.max(0,r.top), bottom=Math.min(f.height,r.bottom);
  if(right<=left||bottom<=top){marker.hidden=true;return;}
  const label=$('guide-label');
  label.textContent=flowPreview.card?'Reorder here':vertical?(flowPreview.native?'Move ':'Add column ')+side:side==='inside'?'Place in column':
    side==='before'||side==='section-start'?'Insert above':'Insert below';
  Object.assign(marker.style,{left:(f.left+left)+'px',top:(f.top+top)+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
  marker.hidden=false;
  const labelWidth=label.offsetWidth;
  label.style.left=Math.max(4-left,Math.min(vertical?-labelWidth/2:5,f.width-left-labelWidth-4))+'px';
}
function moveLiveCard(gesture,choice,animate=true){
  if(gesture.cardChoice?.node===choice?.node)return;
  const {node,cardSlots:{group,cards,next}}=gesture;
  const motion=animate&&!D.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const before=motion?cards.filter(peer=>peer!==node&&peer.animate).map(peer=>[peer,peer.getBoundingClientRect()]):[];
  gesture.cardAnimations.forEach(animation=>animation.cancel());
  gesture.cardAnimations=[];
  if(choice)choice.node[choice.side](node);
  else if(node.parentElement===group)group.insertBefore(node,next?.parentNode===group?next:null);
  gesture.cardChoice=choice;
  if(!motion)return;
  const shifts=before.map(([peer,old])=>{
    const pos=peer.getBoundingClientRect();return [peer,old.left-pos.left,old.top-pos.top];
  });
  for(const [peer,x,y] of shifts){
    if(Math.abs(x)+Math.abs(y)<1)continue;
    gesture.cardAnimations.push(peer.animate([
      {transform:'translate('+x+'px,'+y+'px)',composite:'add'},{transform:'translate(0px,0px)',composite:'add'}
    ],{duration:155,easing:'cubic-bezier(.18,.62,.24,1)'}));
  }
}
function liftDragItem(gesture,x,y){
  const r=gesture.layout.r;
  drawGhost(gesture.node,x-gesture.grabX,y-gesture.grabY,r.width,r.height,true);
  gesture.node.setAttribute('data-bs-drag-origin','');
}
function releaseDragItem(gesture){
  if(gesture.cardChoice)moveLiveCard(gesture,null,false);
  gesture.cardAnimations.forEach(animation=>animation.cancel());
  gesture.cardAnimations=[];
  gesture.node.removeAttribute('data-bs-drag-origin');
}
function updateDrag(x,y,free=drag?.free){
  if(!drag)return;
  drag.x=x;drag.y=y;drag.free=free;
  if(!drag.moved&&Math.hypot(x-drag.startX,y-drag.startY)>5){
    if(drag.direct){
      drag.capture.setPointerCapture(drag.pointer);
      drag.cancelClick();
      active=idOf(drag.node);
    }
    drag.moved=true;
    if(drag.card)drag.cardSlots=StudioFlow.captureCardSlots(drag.node);
    clearGridPick();close();
    stage.classList.add('bs-dragging');
    D.documentElement.classList.add('bs-dragging');
    paint();
  }
  if(!drag.moved)return;
  const f=frame.getBoundingClientRect();
  if(!drag.node.isConnected||drag.layout.device!==devicePlacement()||x<f.left||x>=f.right||y<f.top||y>=f.bottom){
    guide=null;releaseDragItem(drag);clearFlowPreview();hideGridVisual();return;
  }
  showDragGrid(f);
  if(drag.card&&!free){
    const choice=StudioFlow.cardTarget(drag.node,x-f.left,y-f.top,drag.cardSlots);
    if(choice?.node!==drag.cardChoice?.node){
      clearFlowPreview();
      moveLiveCard(drag,choice);
      if(choice)showFlowPreview({...choice,landing:drag.node},f);
    }else if(flowPreview?.card)positionFlowGuide(f);
    guide=choice;
    liftDragItem(drag,x,y);
    return;
  }
  if(drag.cardChoice)moveLiveCard(drag,null);
  if(!free||drag.section){
    const px=x-f.left, py=y-f.top;
    if(retainFlowPreview(px,py)){
      liftDragItem(drag,x,y);positionFlowGuide(f);return;
    }
    clearFlowPreview();
    const choice=drag.section?StudioFlow.sectionTarget(drag.node,px,py):StudioFlow.find(drag.node,px,py);
    if(choice){
      guide=choice;
      liftDragItem(drag,x,y);showFlowPreview(choice,f);return;
    }
  } else clearFlowPreview();
  if(drag.section){guide=null;liftDragItem(drag,x,y);return;}
  guide=offsetDragTarget(drag.node,drag.layout,x-drag.startX,y-drag.startY,!!free&&!drag.layout.crop);
  const {left,top,width,height}=guide;
  drawGhost(drag.node,f.left+left,f.top+top,width,height,true);
  drag.node.setAttribute('data-bs-drag-origin','');
}
function scrollDragCanvas(x,y){
  const f=frame.getBoundingClientRect(), zone=55;
  if(x<f.left||x>f.right||y<f.top||y>f.bottom)return false;
  const n=y>f.bottom-zone?Math.ceil((y-(f.bottom-zone))/3):y<f.top+zone?-Math.ceil((f.top+zone-y)/3):0;
  if(!n)return false;
  D.defaultView.scrollBy(0,n);return true;
}
function duringDrag(){
  if(!drag)return;
  if(drag.moved&&scrollDragCanvas(drag.x,drag.y))updateDrag(drag.x,drag.y);
  viewportTick=requestAnimationFrame(duringDrag);
}
function finishDrag(commit=false){
  if(!drag)return;
  const gesture=drag, choice=guide;drag=null;guide=null;cancelAnimationFrame(viewportTick);
  releaseDragItem(gesture);clearFlowPreview();hideGridVisual();
  stage.classList.remove('bs-dragging');
  D?.documentElement.classList.remove('bs-dragging');
  if(gesture.capture.hasPointerCapture?.(gesture.pointer))gesture.capture.releasePointerCapture(gesture.pointer);
  if(!commit){paint();return;}
  if(choice&&gesture.moved){
    if(choice.node&&!gesture.section&&!StudioFlow.isSide(choice.side)&&StudioFlow.noop(gesture.node,choice.node,choice.side)){paint();return;}
    const op=choice.node?{kind:gesture.section?'move':'flow-move',id:idOf(gesture.node),target:idOf(choice.node),side:choice.side,pair:StudioFlow.isSide(choice.side)?unique():undefined}:dragOperation(gesture.node,choice.device,choice.p);
    if(record(op)){
      if(choice.node)gesture.node.scrollIntoView({block:'nearest'});
      choose(gesture.node,false);
    }else paint();
  }else if(!gesture.moved&&!gesture.direct){
    if(gesture.section||gesture.card||gesture.node.hasAttribute('data-bs-divider')||therapyPhoto(gesture.node))openSettings(gesture.node);else gridPanel(gesture.node);
  }else paint();
}
function beginItemDrag(e,n,capture,direct=false,cancelClick=null){
  if(e.button!==0||e.isPrimary===false||switching||mode!=='edit'||drag||paletteDrag||resizeDrag||columnDrag||StudioPublish.isBusy()||!canDragCanvas(n))return;
  if(!direct){e.preventDefault();clearGridPick();capture.setPointerCapture(e.pointerId);}
  const f=frame.getBoundingClientRect(), x=e.clientX+(direct?f.left:0), y=e.clientY+(direct?f.top:0);
  const section=n.hasAttribute('data-bs-row');
  const layout=section?{r:(surfaceOf(n)||n).getBoundingClientRect(),device:devicePlacement()}:offsetDragStart(n);
  const {r}=layout, px=x-f.left,py=y-f.top;
  const grabX=px>=r.left&&px<=r.right?px-r.left:r.width*.5;
  const grabY=py>=r.top&&py<=r.bottom?py-r.top:Math.min(r.height*.5,26);
  drag={node:n,section,card:StudioFlow.cardOf(n)===n,cardAnimations:[],pointer:e.pointerId,capture,direct,cancelClick,startX:x,startY:y,x,y,moved:false,free:e.shiftKey,layout,grabX,grabY};
  viewportTick=requestAnimationFrame(duringDrag);
}
function itemPointerMove(e,direct){
  if(drag?.pointer!==e.pointerId||drag.direct!==direct)return;
  const f=frame.getBoundingClientRect();
  updateDrag(e.clientX+(direct?f.left:0),e.clientY+(direct?f.top:0),e.shiftKey);
  if(drag?.moved)e.preventDefault();
}
function itemPointerUp(e,direct){
  if(drag?.pointer!==e.pointerId||drag.direct!==direct)return;
  if(drag.moved)itemPointerMove(e,direct);
  finishDrag(true);
}
function itemPointerCancel(e,direct){
  if(drag?.pointer===e.pointerId&&drag.direct===direct)finishDrag(false);
}
const grip=$('drag');
grip.addEventListener('pointerdown',e=>beginItemDrag(e,now(),grip));
grip.addEventListener('pointermove',e=>itemPointerMove(e,false));
grip.addEventListener('pointerup',e=>itemPointerUp(e,false));
grip.addEventListener('pointercancel',e=>itemPointerCancel(e,false));
grip.addEventListener('lostpointercapture',e=>itemPointerCancel(e,false));
function directDragTarget(hit,selected,e){
  if(!hit?.closest||hit.closest('[contenteditable],input,textarea,select,option,form button,.mobile-toggle,.nav-dropdown-toggle,[data-studio-runtime]'))return null;
  // Unselected touch content stays scrollable. Tap it first to reveal a grip.
  if(e.pointerType==='touch'&&!selected?.contains(hit))return null;
  const divider=dividerFrom(hit,e.clientX,e.clientY), card=StudioFlow.cardOf(hit);
  if(divider&&canDragCanvas(divider))return divider;
  if(card){
    if(e.altKey){const detail=targetFrom(hit);if(detail!==card&&canDragCanvas(detail))return detail;}
    if(!e.shiftKey&&selected!==card&&selected?.contains(hit)&&card.contains(selected)&&canDragCanvas(selected))return selected;
    if(canDragCanvas(card))return card;
  }
  // Preserve an explicit selection of a nested part. Otherwise lift the
  // visible element on the first drag, without opening its settings first.
  const target=targetFrom(hit);
  if(selected?.contains(hit)&&selected!==target&&canDragCanvas(selected)&&!selected.hasAttribute('data-bs-row')&&
     !selected.hasAttribute('data-bs-column')&&(e.altKey||!target?.dataset.bsMove))return selected;
  if(canDragCanvas(target)&&(!target.hasAttribute('data-bs-row')||target===selected))return target;
  return selected?.contains(hit)&&canDragCanvas(selected)?selected:null;
}
function bindCanvasDragging(doc){
  let dragged=false;
  doc.addEventListener('pointerdown',e=>{
    if(e.isPrimary===false)return;
    dragged=false;
    if(gridPick)return;
    const n=directDragTarget(e.target,now(),e);
    if(!n)return;
    // Don't capture a simple click. Once the pointer moves, capture on a stable
    // node so it stays active as the element or insertion gap moves.
    beginItemDrag(e,n,doc.documentElement,true,()=>{dragged=true;});
  },true);
  doc.addEventListener('pointermove',e=>itemPointerMove(e,true),true);
  doc.addEventListener('pointerup',e=>itemPointerUp(e,true),true);
  doc.addEventListener('pointercancel',e=>itemPointerCancel(e,true),true);
  doc.addEventListener('lostpointercapture',e=>{if(e.target===drag?.capture)itemPointerCancel(e,true);},true);
  doc.addEventListener('pointerleave',e=>{if(!drag?.moved)itemPointerCancel(e,true);});
  doc.addEventListener('dragstart',e=>{if(mode==='edit'&&(canvasDragTarget?.contains(e.target)||drag?.direct))e.preventDefault();},true);
  doc.addEventListener('selectstart',e=>{if(drag?.direct)e.preventDefault();},true);
  doc.addEventListener('click',e=>{
    if(!dragged||e.detail===0||mode!=='edit')return;
    dragged=false;e.preventDefault();e.stopImmediatePropagation();
  },true);
}
$('drag').addEventListener('click',e=>{if(e.detail===0&&canDragCanvas(now())){
  const n=now();if(n.hasAttribute('data-bs-row')||StudioFlow.cardOf(n)===n||n.hasAttribute('data-bs-divider')||therapyPhoto(n))openSettings(n);else gridPanel(n);
}});
$('section-order').onclick=()=>sectionOrder();
$('selection-up').onclick=()=>stepSelection(now(),-1);
$('selection-down').onclick=()=>stepSelection(now(),1);
$('selection-settings').onclick=()=>now()&&openSettings(now());
$('selection-add').onclick=()=>startAdd();
$('selection-section').onclick=()=>{const row=rowOf(now());if(row){close();choose(row,false);}};
$('selection-duplicate').onclick=()=>now()&&cloneSelected(now());
$('add-section').onclick=()=>rowChoices(now());
/* These handles live above the canvas, so they never enter a saved page or capture video clicks. */
const handles=$('column-handles');
let columnDrag=null, handleGrid=null;
function directColumnGrid(n){
  const auto=n?.closest('.bs-auto-columns');if(auto)return auto;
  const row=rowOf(n);
  return row?.dataset.bsRow==='custom'?row.querySelector(':scope > .bs-row-inner'):null;
}
function columnMin(grid,widths){
  const gap=parseFloat(D.defaultView.getComputedStyle(grid).columnGap)||0;
  const pixels=grid.getBoundingClientRect().width-gap*(widths.length-1);
  return {pixels, units:widths.reduce((sum,value)=>sum+value,0)};
}
function paintColumnHandles(){
  if(!handles)return;
  const grid=columnDrag?.grid||directColumnGrid(now());
  const row=grid?.matches('.bs-auto-columns')?grid:grid?.parentElement;
  const visible=D&&mode==='edit'&&!switching&&!drag?.moved&&!paletteDrag?.moved&&!resizeDrag&&!gridPick&&grid?.children.length>1
    &&D.defaultView.matchMedia('(min-width: 768px)').matches;
  if(!visible){handles.hidden=true;return;}
  const fr=frame.getBoundingClientRect(), gr=grid.getBoundingClientRect(), rr=row.getBoundingClientRect();
  const above=Math.max(gr.top,rr.top,0), below=Math.min(gr.bottom,rr.bottom,fr.height);
  if(below-above<24){handles.hidden=true;return;}
  const n=grid.children.length-1;
  if(handleGrid!==grid||handles.children.length!==n){
    handleGrid=grid;handles.replaceChildren();
    for(let i=0;i<n;i++){
      const control=create('button',{type:'button',class:'column-handle','aria-label':'Resize columns '+(i+1)+' and '+(i+2),title:'Drag left or right · arrow keys also work'});
      control.innerHTML='<span aria-hidden="true">↔</span>';
      control.addEventListener('pointerdown',e=>beginColumnDrag(e,grid,i));
      control.addEventListener('pointermove',updateColumnDrag);
      control.addEventListener('pointerup',e=>endColumnDrag(true,e));
      control.addEventListener('pointercancel',e=>endColumnDrag(false,e));
      control.addEventListener('lostpointercapture',e=>endColumnDrag(false,e));
      control.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
        e.preventDefault();e.stopPropagation();
        const widths=StudioColumns.read(grid), {pixels,units}=columnMin(grid,widths);
        if(pixels<=0)return;
        const delta=(e.key==='ArrowLeft'?-1:1)*(e.shiftKey?24:8)*units/pixels;
        const next=StudioColumns.resize(widths,i,delta,Math.min(60,pixels/widths.length*.55)*units/pixels);
        if(next)record({kind:'column-widths',id:idOf(row),value:next});
      });
      handles.append(control);
    }
  }
  const widths=StudioColumns.shares(StudioColumns.read(grid)), lower=Math.max(0,rr.left), upper=Math.min(fr.width,rr.right);
  for(let i=0;i<n;i++){
    const control=handles.children[i], first=grid.children[i].getBoundingClientRect(), second=grid.children[i+1].getBoundingClientRect();
    const x=(first.right+second.left)/2;
    control.hidden=x<lower+6||x>upper-6;
    control.setAttribute('aria-label','Resize columns '+(i+1)+' and '+(i+2)+' ('+Math.round(widths[i])+'% and '+Math.round(widths[i+1])+'%)');
    Object.assign(control.style,{left:(fr.left+x)+'px',top:(fr.top+above)+'px',height:(below-above)+'px'});
  }
  handles.hidden=false;
}
function beginColumnDrag(e,grid,index){
  if(e.button!==0||columnDrag||!grid.isConnected)return;
  const widths=StudioColumns.read(grid), {pixels,units}=columnMin(grid,widths);
  if(pixels<=0)return;
  e.preventDefault();e.stopPropagation();
  const control=e.currentTarget;
  columnDrag={grid,index,widths,pixels,units,control,pointer:e.pointerId,x:e.clientX,next:null};
  close();control.setPointerCapture(e.pointerId);handles.classList.add('dragging');
}
function updateColumnDrag(e){
  const r=columnDrag;
  if(!r||e.pointerId!==r.pointer)return;
  const delta=(e.clientX-r.x)*r.units/r.pixels, min=Math.min(60,r.pixels/r.widths.length*.55)*r.units/r.pixels;
  const widths=StudioColumns.resize(r.widths,r.index,delta,min);
  if(!widths)return;
  r.next=widths;
  StudioColumns.set(r.grid,widths);paint();
}
function endColumnDrag(commit,e){
  const r=columnDrag;
  if(!r||e&&e.pointerId!==r.pointer)return;
  columnDrag=null;handles.classList.remove('dragging');
  if(r.control.hasPointerCapture(r.pointer))r.control.releasePointerCapture(r.pointer);
  if(!r.grid.isConnected)return;
  if(commit&&r.next?.some((v,i)=>Math.abs(v-r.widths[i])>0.0001))record({kind:'column-widths',id:idOf(r.grid.matches('.bs-auto-columns')?r.grid:r.grid.parentElement),value:r.next});
  else {StudioColumns.set(r.grid,r.widths);paint();}
}

const resizeHandles=$('resize-handles'), resizeSize=$('resize-size');
const resizeGrips={};
function hideResizeHandles(){
  if(!resizeDrag)resizeHandles.hidden=true;
}
function paintResizeHandles(n,rect){
  if(switching||drag||paletteDrag?.moved||columnDrag||gridPick){hideResizeHandles();return;}
  const edges=StudioResize.edges(n), positions=StudioResize.gripPositions(rect);
  const section=n.hasAttribute('data-bs-row');
  resizeHandles.toggleAttribute('data-section',section);
  let visible=false;
  for(const [edge,button] of Object.entries(resizeGrips)){
    const held=resizeDrag?.control===button;
    const position=edges.includes(edge)&&positions[edge];
    button.hidden=!(held||position&&!resizeDrag);
    if(button.hidden)continue;
    visible=true;
    if(position)Object.assign(button.style,{left:position[0]+'px',top:position[1]+'px'});
    const name='Resize '+(section?'section height':StudioResize.vertical(edge)?'element height':'element width')+' from '+edge+' edge';
    button.setAttribute('aria-label',name);button.title=name+' · drag or use arrow keys';
  }
  resizeHandles.hidden=!visible;
}
function allowResize(n,edge){
  return baselineReady&&mode==='edit'&&!switching&&!drag&&!paletteDrag&&!columnDrag&&!resizeDrag&&!gridPick&&!StudioPublish.isBusy()&&StudioResize.edges(n).includes(edge);
}
function updateResize(e){
  const d=resizeDrag;
  if(!d||e.pointerId!==d.pointer)return;
  const dX=e.clientX-d.x,dY=e.clientY-d.y;
  if(!d.moved&&Math.abs(StudioResize.signedDelta(d.edge,dX,dY))<3)return;
  d.moved=true;
  d.next=StudioResize.preview(d,StudioResize.signedDelta(d.edge,dX,dY));
  refreshFreeSizes();paint();
  const r=d.el.getBoundingClientRect();
  resizeSize.textContent=d.row?Math.round(r.height)+' px tall':Math.round(r.width)+' × '+Math.round(r.height)+' px';
  resizeSize.hidden=false;
  resizeSize.style.left=Math.max(4,Math.min(innerWidth-resizeSize.offsetWidth-8,e.clientX+16))+'px';
  resizeSize.style.top=Math.max(4,Math.min(innerHeight-25,e.clientY+14))+'px';
}
function stopResize(commit,e){
  const d=resizeDrag;
  if(!d||e&&e.pointerId!==d.pointer)return;
  if(commit&&e&&Number.isFinite(e.clientX))updateResize(e);
  resizeDrag=null;resizeSize.hidden=true;
  document.documentElement.classList.remove('bs-resizing');
  document.documentElement.style.removeProperty('--resize-cursor');
  if(d.control.hasPointerCapture(d.pointer))d.control.releasePointerCapture(d.pointer);
  d.restore();
  if(commit&&d.next&&record(d.next))return;
  refreshFreeSizes();paint();
}
for(const edge of ['top','right','bottom','left']){
  const vertical=StudioResize.vertical(edge), control=create('button',{
    type:'button',class:'resize-grip','data-edge':edge,'data-axis':vertical?'height':'width',hidden:''
  });
  resizeGrips[edge]=control;resizeHandles.append(control);
  control.addEventListener('pointerdown',e=>{
    const n=now();
    if(e.button!==0||e.isPrimary===false||!allowResize(n,edge))return;
    e.preventDefault();close();toggleElementSidebar(false);
    resizeDrag={...StudioResize.start(n,edge),control,pointer:e.pointerId,x:e.clientX,y:e.clientY};
    control.setPointerCapture(e.pointerId);
    document.documentElement.style.setProperty('--resize-cursor',vertical?'ns-resize':'ew-resize');
    document.documentElement.classList.add('bs-resizing');paint();
  });
  control.addEventListener('pointermove',updateResize);
  control.addEventListener('pointerup',e=>stopResize(true,e));
  control.addEventListener('pointercancel',e=>stopResize(false,e));
  control.addEventListener('lostpointercapture',e=>stopResize(false,e));
  control.addEventListener('keydown',e=>{
    const n=now(), keys=vertical?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight'];
    if(!keys.includes(e.key)||!allowResize(n,edge))return;
    e.preventDefault();e.stopPropagation();
    const delta=(e.key===keys[0]?-1:1)*(e.shiftKey?24:4);
    close();
    const d=StudioResize.start(n,edge), op=StudioResize.preview(d,StudioResize.signedDelta(edge,delta,delta));
    d.restore();
    if(op)record(op);else paint();
  });
}
window.addEventListener('blur',()=>stopResize(false));
$('popup-close').onclick=close;
$('preview').onclick=()=>{
  if(resizeDrag)stopResize(false);
  if(drag)finishDrag(false);
  if(paletteDrag)finishPaletteDrag();
  endColumnDrag(false);clearGridPick();mode=mode==='edit'?'preview':'edit';
  D.documentElement.classList.toggle('bs-editor-mode',mode==='edit');
  if(mode==='edit'&&page[0]!=='home')replay();
  $('preview').textContent=mode==='preview'?'Back to editing':'Preview';$('preview').setAttribute('aria-pressed',String(mode==='preview'));
  $('hint').textContent=mode==='preview'?'Preview mode. The contact form does not send messages.':defaultHint();
  for(const id of ['add','add-section','section-order'])$(id).disabled=mode==='preview'; $('undo').disabled=mode==='preview'||!cursor;$('redo').disabled=mode==='preview'||cursor===list.length;
  if(mode==='preview')toggleElementSidebar(false);
  $('add').hidden=mode==='preview';
  $('page-seo').disabled=mode==='preview';close();paint();
};
function switchView(b){
  if(resizeDrag)stopResize(false);
  if(drag)finishDrag(false);
  if(paletteDrag)finishPaletteDrag();
  endColumnDrag(false);const devicePanel=body.querySelector('.responsive-fields')||['ELEMENT SETTINGS','CARD SETTINGS','SECTION SETTINGS','DIVIDER SETTINGS'].includes($('popup-type').textContent);view=b.dataset.view;stage.dataset.view=view;syncViewport();
  document.querySelectorAll('[data-view]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-pressed',String(el===b));});
  requestAnimationFrame(()=>{refreshFreeSizes();paint();if(now()&&!popup.hidden){
    if(devicePanel)openSettings(now());
    const reset=$('reset-drag-position');
    if(reset)reset.textContent=devicePlacement()==='desktop'?'Reset shared drag position':'Use desktop drag position';
    adjustPopup(now());
  }});
}
document.querySelectorAll('button[data-view]').forEach(b=>b.onclick=()=>switchView(b));
$('add').onclick=()=>{if($('element-sidebar').hasAttribute('data-collapsed'))startAdd();else toggleElementSidebar(false);};
$('element-sidebar-close').onclick=()=>toggleElementSidebar(false,true);
$('page-seo').onclick=()=>{if(!popup.hidden&&$('popup-type').textContent==='PAGE SEO')close();else openSeo();};
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
  try{const raw=await file.text();if(epoch!==canvasEpoch)return;list=readDraft(raw);StudioPublish.bindSource(JSON.parse(raw).publishedBase||null);cursor=list.length;active=null;close();replay();StudioWorkflow.schedule();flash('Draft imported. Nothing was published.');}catch(e){flash(e.message);}
};
$('export-html').onclick=()=>{toggleMenu(false);exportStandalone();};
$('compare').onclick=()=>{toggleMenu(false);window.open(canvasPath(),'_blank','noopener,noreferrer');};
$('help').onclick=()=>{
  toggleMenu(false);const place=open('How to edit this page','QUICK GUIDE');
  para('Click text or a photo to open its settings. Align and adjust spacing while watching the canvas.');
  para('Drag a block into the space beside another block. Release when the side guide appears. Use the green divider to adjust widths. Columns stack on phones.');
  para('Use the up/down buttons on a selected block to move it directly above or below its neighbour. The arrow keys also move the selection. Hold Alt with an arrow key to nudge without reordering.');
  para('Select an element, then press and drag it directly on the canvas or use its grip. The grid shows while dragging. Drop at an Insert above or Insert below marker to make room for it.');
  para('For independent movement without reordering, hold Shift while dragging. Layout moves apply on every device.');
  para('Cards follow the pointer and the surrounding cards shift as you drag. Release to keep the new order. Press Escape to cancel. Click a specific part first to move it on its own.');
  para('Use Delete in the item settings to remove it from your draft. Undo restores deleted content.');
  para('Choose Columns in Add element, enter the count, then drag the green dividers to resize on desktop or tablet. Columns stack on mobile.');
  para('Save keeps edits in this browser. Download an editable draft to move it to another browser. Approved publisher accounts can publish the selected page from this editor.');
  place();
};
$('recover-drafts').onclick=async()=>{
  toggleMenu(false);const key=recoveryKey(), epoch=canvasEpoch;
  const entries=await recoveredDrafts(key).catch(()=>null);
  if(epoch!==canvasEpoch)return;
  const place=open('Recovered drafts','DRAFT TOOLS');
  if(!entries)para('Recovered drafts could not be read in this browser.');
  else if(!entries.length)para('There are no recovered drafts for this page.');
  else{
    para('These drafts were kept before opening the live version. You can resume a draft based on the current page version, or download it for reference.');
    for(const item of entries.slice().reverse()){
      const actions=group(), date=new Date(item.savedAt).toLocaleString();
      let matchingBase=false;
      try{matchingBase=(JSON.parse(item.raw).publishedBase||null)===liveSource;}catch{}
      if(matchingBase&&liveRevision&&operationsMatch(liveOps)){
        button(actions,'Resume · '+date,()=>{
          if(epoch!==canvasEpoch||!operationsMatch(liveOps))return;
          try{setDraft(item.raw);close();void save({quiet:true});flash('Recovered draft opened. Nothing was published.');}
          catch(e){flash(e.message);}
        });
      }
      button(actions,'Download · '+date,()=>exportFile(item.raw,pageIdentity()+'-recovered-'+item.savedAt+'.json','application/json'));
    }
  }
  place();
};
$('reset').onclick=()=>{
  toggleMenu(false);const place=open('Reset this draft?','DRAFT TOOLS');
  para('This resets the working draft to the current live page. If signed in, the matching cloud copy is also cleared. The website will not change.');
  button(group(),'Reset to live',()=>{
    const key=storageKey();
    saveQueue=saveQueue.catch(()=>{}).then(()=>clearBrowserDraft(key));
    StudioPublish.bindSource(liveSource);
    list=liveOps.slice();cursor=list.length;savedOps=list.slice();active=null;close();replay();
    void StudioWorkflow.forgetCloud();
    void syncLiveCanvas();
    flash(liveRevision?'Live version restored.':'Local draft cleared. Waiting for GitHub Pages.');
  },{class:'danger'});place();
};
function wireBehavior(){
  const stopShared=enableHomepageBehavior(D,()=>mode==='edit',flash);
  const stopPage=page[0]!=='home'&&typeof enableStudioPageBehavior==='function'?enableStudioPageBehavior(D,()=>mode==='edit',true):null;
  return ()=>{stopShared?.();stopPage?.();};
}
function busyCanvas(value){
  for(const id of ['add','add-section','section-order','save','more','preview','publish','undo','redo','page-seo'])$(id).disabled=value;
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
  baselineReady=true;markCanvas();syncViewport();D.documentElement.classList.toggle('bs-editor-mode',mode==='edit');original=D.body.innerHTML;stopSize=sizeObserver();
  stopBehavior=wireBehavior();
  useKeys();
  bindCanvasDragging(D);
  D.addEventListener('click',e=>{
    if(switching){e.preventDefault();return;}
    if(mode!=='edit')return;
    const anchor=e.target.closest('a');
    if(anchor)e.preventDefault();
    if(gridPick){e.preventDefault();toggleElementSidebar(false);commitPick(e);return;}
    const summary=e.target.closest('summary');
    if(summary&&!summary.closest('[data-bs-new]')&&!e.altKey&&!anchor){
      e.preventDefault();toggleElementSidebar(false);summary.parentElement.open=!summary.parentElement.open;choose(summary.parentElement,false);return;
    }
    if(e.target.closest('input,textarea,select,button'))e.preventDefault();
    const n=dividerFrom(e.target,e.clientX,e.clientY)||
      (StudioFlow.cardOf(e.target)&&e.altKey?StudioFlow.cardOf(e.target):
        therapyCard(e.target)?targetFrom(e.target,e.altKey):e.altKey
          ?e.target.closest('[data-bs-kind]')?.parentElement?.closest('[data-bs-kind],[data-bs-column],[data-bs-row]')||targetFrom(e.target):targetFrom(e.target));
    toggleElementSidebar(false);
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
  (async()=>{
    let raw=null;
    try{raw=await readBrowserDraft(STORAGE);}catch{}
    try{
      if(await loadCanvasLive(raw))return;
    }catch{
      $('publish-status').textContent='Waiting to verify the live page';
    }
    if(current()&&raw){
      try{setDraft(raw);}
      catch{flash('Could not open the browser draft.');}
    }
  })().finally(()=>{
    if(!current())return;
    busyCanvas(false);
    if(mode==='preview')for(const id of ['add','add-section','section-order','page-seo'])$(id).disabled=true;
    switching=false;if(picker)picker.disabled=false;paint();
    $('hint').textContent=mode==='edit'?defaultHint():$('hint').textContent;showState();StudioWorkflow.pageReady();
  });
}
window.addEventListener('resize',()=>{if(!baselineReady)return;syncViewport();paint();if(!popup.hidden)adjustPopup(now());});
async function openPage(next) {
  if(!next||next===page||switching||typeof StudioPublish!=='undefined'&&StudioPublish.isBusy()){if(picker)picker.value=page[0];return;}
  switching=true;if(picker)picker.disabled=true;
  if(drag)finishDrag(false);
  if(paletteDrag)finishPaletteDrag();
  if(resizeDrag)stopResize(false);
  endColumnDrag(false);clearGridPick();close();toggleMenu(false);
  busyCanvas(true);
  await saveQueue;
  const dirty=cursor!==savedOps.length||savedOps.some((op,i)=>list[i]!==op);
  if(baselineReady&&dirty&&!await save({quiet:true})){
    switching=false;busyCanvas(false);showState();if(picker){picker.disabled=false;picker.value=page[0];}return;
  }
  canvasEpoch++;stopBehavior?.();stopSize?.();
  stopBehavior=null;stopSize=null;baselineReady=false;active=null;D=null;
  list=[];savedOps=[];cursor=0;liveOps=[];liveRevision=null;liveSource=null;liveSync=null;
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
  const url=new URL(canvasPath(),location.href);
  if(page[0]==='home')url.searchParams.set('edit','1');
  frame.src=url.href;
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
buildElementPalette();
frame.addEventListener('load',boot);
loadCanvas();

// Check again when returning to the editor and while a tab stays open.
window.addEventListener('focus',()=>void syncLiveCanvas());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void syncLiveCanvas();});
if(typeof StudioWorkflow!=='undefined')StudioWorkflow.start();
setInterval(()=>{if(!document.hidden)void syncLiveCanvas();},12000);
window.addEventListener('online',()=>{if(baselineReady){void syncLiveCanvas();void StudioWorkflow.sync();}});
