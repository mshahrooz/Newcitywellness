'use strict';
/* A placement layer is created only in sections that receive free-positioned content. */
const GRID_COLS=48, GRID_STEP=12, GRID_CAP=24000, VIDEO_LIMIT=20*1024*1024;
const MEDIA_TYPES={image:{jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',gif:'image/gif'},video:{mp4:'video/mp4',webm:'video/webm'}};
let gridMode='grid', snapGrid=true, gridPick=null, resizeDrag=null;
const freeShell=n=>n?.parentElement?.classList.contains('bs-free-item')?n.parentElement:null;
const specialZone=n=>n?.closest('[data-bs-zone]');
function surfaceOf(zone){
  if(!zone)return null;
  if(zone.dataset.bsRow==='native')return zone.querySelector(':scope > section')||zone.firstElementChild;
  return zone;
}
const zoneOf=n=>rowOf(n)||specialZone(n);
const allZones=()=>[...D.querySelectorAll('[data-bs-row],[data-bs-zone]')].filter(n=>!n.parentElement?.closest('[data-bs-row],[data-bs-zone]'));
const zoneName=n=>n?.dataset.bsLabel||rowTitle(n);
function zoneAt(x,y,skip){
  const direct=zoneOf(D.elementFromPoint(x,y));
  if(direct&&direct!==skip&&!skip?.contains(direct))return direct;
  let best=null,score=Infinity;
  for(const z of allZones()){
    if(z===skip||skip?.contains(z))continue;
    const r=surfaceOf(z).getBoundingClientRect();
    if(r.height<2||r.width<2)continue;
    const d=Math.max(r.top-y,0,y-r.bottom)+Math.max(r.left-x,0,x-r.right);
    if(d<score){best=z;score=d;}
  }
  return best;
}
function mkLayer(zone){
  const surface=surfaceOf(zone);
  if(!surface)return null;
  let layer=surface.querySelector(':scope > .bs-free-layer');
  if(!layer){
    const style=D.defaultView.getComputedStyle(surface);
    if(style.position==='static'||!style.position)surface.classList.add('bs-pos-relative');
    if(!surface.classList.contains('hero')&&!surface.classList.contains('bs-blank-section')&&parseInt(style.minHeight)>0&&!surface.classList.contains('bs-manual-size'))surface.style.setProperty('--bs-original-min',style.minHeight);
    layer=addNative('div',{class:'bs-free-layer'});surface.append(layer);surface.classList.add('bs-free-surface');
  }
  return layer;
}
function clampNumber(value,lo,hi,fallback=lo){
  if(value===undefined||value===null||value==='')return fallback;
  return bounded(value,lo,hi);
}
function normalizeGrid(p){
  const w=clampNumber(p?.w,2,100,20);
  return {x:clampNumber(p?.x,0,100-w,0),y:clampNumber(p?.y,0,GRID_CAP,0),w,h:clampNumber(p?.h,8,4000,56),z:Math.trunc(clampNumber(p?.z,-90,250,0))};
}
function coords(shell,device){
  try{return JSON.parse(shell?.getAttribute('data-bs-coord-'+device)||'null');}catch{return null;}
}
function writeCoords(shell,device,p){
  if(!['desktop','tablet','mobile'].includes(device))return;
  p=normalizeGrid(p);shell.setAttribute('data-bs-coord-'+device,JSON.stringify(p));
  for(const [key,val] of Object.entries(p)){
    shell.style.setProperty('--bs-'+device+'-'+key,val+(key==='x'||key==='w'?'%':key==='z'?'':'px'));
  }
}
function measure(n){
  const r=n?.getBoundingClientRect();
  return {width:r?.width>5?r.width:230,height:r?.height>5?r.height:56};
}
function zoneDims(zone){
  const r=surfaceOf(zone).getBoundingClientRect();
  return {r,width:r.width||D.defaultView.innerWidth||1200};
}
const roundPercent=(v,w)=>Math.round(v/w*10000)/100;
function devicePlacement(){
  const width=D.defaultView.innerWidth;
  return width<=600&&width>0?'mobile':width<=900&&width>0?'tablet':'desktop';
}
function gridPoint(zone, x, y, dims, device, snap=snapGrid){
  const {r,width}=zoneDims(zone);
  const unit=width/GRID_COLS;
  const snapNum=(v,step)=>Math.round(v/step)*step;
  const w=Math.max(unit*2,Math.min(width,dims.width));
  const snappedW=snap?snapNum(w,unit):w;
  const left=snap?snapNum(x-r.x,unit):x-r.x;
  const top=snap?snapNum(y-r.y,GRID_STEP):y-r.y;
  return normalizeGrid({x:roundPercent(left,width),y:top,w:roundPercent(snappedW,width),h:dims.height});
}
function knownPosition(n,zone,device){
  const shell=freeShell(n);
  if(shell&&zoneOf(shell)===zone){
    const saved=coords(shell,device)||(device==='tablet'&&coords(shell,'desktop'));
    if(saved)return saved;
  }
  const r=n.getBoundingClientRect();
  return gridPoint(zone,r.left,r.top,measure(n),device,false);
}
function syncGridSize(layer){
  if(!layer)return;
  const surface=layer.parentElement;
  if(!layer.children.length){
    layer.remove();surface.classList.remove('bs-free-surface','bs-pos-relative');
    for(const d of ['desktop','tablet','mobile'])surface.style.removeProperty('--bs-required-'+d);
    return;
  }
  const floor={desktop:0,tablet:0,mobile:0};
  const children=[...layer.children];
  children.forEach(el=>{
    const desk=coords(el,'desktop');
    const ps={desktop:desk,tablet:coords(el,'tablet')||desk,mobile:coords(el,'mobile')};
    for(const d in ps){
      if(ps[d]){
        const p=ps[d];const measured=devicePlacement()===d?el.getBoundingClientRect().height:0;
        floor[d]=Math.max(floor[d],p.y+Math.max(p.h,measured)+12);
      }
    }
  });
  for(const d in floor)surface.style.setProperty('--bs-required-'+d,Math.round(floor[d])+'px');
  // Auto-stack is saved as a class so standalone HTML uses the same layout.
  layer.classList.toggle('bs-mobile-stack',children.some(el=>!coords(el,'mobile')));
  surface.classList.toggle('bs-mobile-stack-surface',layer.classList.contains('bs-mobile-stack'));
}
function refreshFreeSizes(){D?.querySelectorAll('.bs-free-layer').forEach(syncGridSize);}
const preserveList=['font-family','font-weight','font-style','letter-spacing','line-height','text-transform','text-decoration','text-align','color','background-color','border-radius','object-fit','object-position','box-shadow'];
function retainAppearance(n,reference=n){
  if(n.dataset.bsLook||n.hasAttribute('data-bs-new')||!n.dataset.bsKind)return;
  if(!['text','title','image','button','link','detail'].includes(n.dataset.bsKind))return;
  n.dataset.bsLook='yes';
  const values=D.defaultView.getComputedStyle(reference);
  const css=n.style;
  for(const p of preserveList){
    const val=values.getPropertyValue(p);
    if(val&&!css.getPropertyValue(p))css.setProperty(p,val);
  }
  if(!css.fontSize){
    const px=parseFloat(values.fontSize);
    if(px){css.setProperty('--bs-native-font',px+'px');css.setProperty('--bs-native-font-mobile',Math.max(13,Math.round(px*.76))+'px');}
  }
}
function attachFree(n,zone,device,p,baseline=null){
  if(!zone||(!zone.hasAttribute('data-bs-row')&&!zone.hasAttribute('data-bs-zone'))||n===zone||n.contains(zone)||n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone'))return false;
  if(!n.dataset.bsKind&&!n.hasAttribute('data-bs-column'))return false;
  let shell=freeShell(n);
  const prevLayer=shell?.parentElement;
  const oldParent=n.parentElement;
  const oldZone=zoneOf(n);
  const desktop=coords(shell,'desktop')||baseline||(n.isConnected?knownPosition(n,oldZone||zone,'desktop'):p);
  const dest=mkLayer(zone);
  if(!shell){
    retainAppearance(n);
    if(n.isConnected&&!oldParent.classList.contains('bs-pair')){
      const origin=addNative('template',{'data-bs-flow-origin':idOf(n)});n.before(origin);
    }
    shell=addNative('div',{class:'bs-free-item'});shell.append(n);
    dePair(oldParent);
  }
  if(device!=='desktop'&&!coords(shell,'desktop')){
    const base=oldZone===zone?desktop:{...p,x:Math.min(p.x,100-p.w)};
    writeCoords(shell,'desktop',base);
  }
  writeCoords(shell,device,p);
  if(shell.parentElement!==dest)dest.append(shell);
  syncGridSize(dest);
  if(prevLayer&&prevLayer!==dest)syncGridSize(prevLayer);
  return true;
}
function restoreFlow(n){
  const shell=freeShell(n);
  const zone=zoneOf(shell);
  if(!shell||!zone)return false;
  const layer=shell.parentElement;
  const destination=zone.dataset.bsRow==='custom'?zone.querySelector('.bs-col'):null;
  const originalSlot=[...D.querySelectorAll('template[data-bs-flow-origin]')].find(el=>el.dataset.bsFlowOrigin===idOf(n));
  if(originalSlot&&zoneOf(originalSlot)===zone)originalSlot.replaceWith(n);
  else {
    originalSlot?.remove();
    if(destination&&!n.contains(destination))destination.append(n);else layer.before(n);
  }
  shell.remove();syncGridSize(layer);
  return true;
}
function removeFreeContainer(shell){if(shell){const parent=shell.parentElement;shell.remove();syncGridSize(parent);}}
function registerExtraNodes(){
  for(const [selector,id,label] of [['.site-header','zone-header','Header'],['.header-nav','zone-nav','Navigation'],['.site-footer','zone-footer','Footer']]){
    const zone=D.querySelector(selector);
    if(zone){zone.dataset.bsId=id;zone.dataset.bsZone='yes';zone.dataset.bsLabel=label;}
  }
  const selector='h1,h2,h3,h4,h5,h6,p,img,figure,a[href],button,form,label,input,textarea,select,video,article,li,[data-builder-copy],.therapy-card,.condition-card,.testimonial-card,.hero-seal,.header-contact,.contact-details,.clinic-hours,.contact-form-wrap';
  let i=0;
  D.querySelectorAll('.ncw '+selector.split(',').join(', .ncw ')).forEach(el=>{
    if(idOf(el)||!zoneOf(el)||el.matches('builder-copy')||el.closest('[hidden]'))return;
    if(el.matches('[data-builder-copy]')&&el.parentElement.closest('[data-bs-kind]'))return;

    const kind=el.matches('h1,h2,h3,h4,h5,h6')?'title':el.matches('p')?'text':el.matches('img')?'image':
      el.matches('a.btn')?'button':el.matches('a[href]')?'link':el.matches('form')?'form':
      el.matches('input,textarea,select,label')?'field':el.matches('video')?'video':
      el.matches('button,[data-builder-copy]')?'detail':'component';
    el.dataset.bsId='extra-'+(++i);el.dataset.bsKind=kind;
  });
  const floating=D.querySelector('.floating-booking-link');
  if(floating&&!idOf(floating)){
    floating.dataset.bsId='floating-booking';floating.dataset.bsKind='button';
  }
}
function shownCandidate(n){return !!(n?.isConnected&&(n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone')||n.hasAttribute('data-bs-column')||n.dataset.bsKind));}
function safeDuplicate(n,id){
  const dup=n.cloneNode(true);
  const attrs=['id','aria-labelledby','aria-describedby','aria-controls','aria-owns','aria-activedescendant','for','headers','list'];
  const nodes=[dup,...dup.querySelectorAll('*')];
  const htmlIds=new Map();
  let j=0, b=0;
  for(const node of nodes){
    if(node.id){const next=id+'-dom'+(++j);htmlIds.set(node.id,next);node.id=next;}
    if(idOf(node)){
      const column=n.dataset.bsRow==='custom'&&node.hasAttribute('data-bs-column')&&node.parentElement?.classList.contains('bs-row-inner')&&node.parentElement.parentElement===dup;
      node.dataset.bsId=node===dup?id:column?id+'-c'+Array.from(node.parentElement.children).indexOf(node):id+'-el'+(++b);
    }
    if(node.hasAttribute('data-bs-flow-origin'))node.remove();
    if(node.matches('input,textarea,select')){
      if(node.matches('input')){node.value=node.defaultValue;node.checked=node.defaultChecked;}
      else if(node.matches('textarea'))node.value=node.defaultValue;
    }
  }
  for(const node of nodes){
    for(const a of attrs.slice(1)){
      if(node.hasAttribute(a))node.setAttribute(a,node.getAttribute(a).split(/\s+/).map(x=>htmlIds.get(x)||x).join(' '));
    }
    for(const a of ['href','xlink:href']){
      const v=node.getAttribute(a);
      if(v?.startsWith('#')&&htmlIds.has(v.slice(1)))node.setAttribute(a,'#'+htmlIds.get(v.slice(1)));
    }
  }
  dup.dataset.bsCopy='yes';
  if(n.hasAttribute('data-bs-row'))dup.dataset.bsLabel=zoneName(n)+' copy';
  return dup;
}
function dupElement(n,id,device,position){
  if(!shownCandidate(n)||!validId(id)||byId(id))return false;
  const clone=safeDuplicate(n,id), z=zoneOf(n)||rowList()[0];
  if(n.hasAttribute('data-bs-zone')){
    const row=makeRow(id,1);row.dataset.bsLabel=zoneName(n)+' copy';
    const el=clone;el.removeAttribute('data-bs-zone');el.removeAttribute('data-bs-id');el.classList.remove('is-scrolled','is-open','is-pinned');
    row.querySelector('.bs-col').append(el);
    if(n.dataset.bsId==='zone-footer')main().insertBefore(row,main().querySelector(':scope > .editor-blocks'));else main().prepend(row);
    return true;
  }
  if(n.hasAttribute('data-bs-column')&&!freeShell(n)){
    clone.classList.add('bs-duplicated-column');n.after(clone);return true;
  }
  if(n.hasAttribute('data-bs-row')){
    n.after(clone);refreshFreeSizes();return true;
  }
  const shell=freeShell(n);
  const designed=n.dataset.bsMove!=='yes'||n.parentElement?.matches('a,form,.hero-actions');
  if(!position&&!shell&&!designed){n.after(clone);return true;}
  if(!z)return false;
  // Measure the original before placing the copy in the active section.
  const p=position||knownPosition(n,z,device);
  const step=100/GRID_COLS;
  retainAppearance(clone,n);
  return attachFree(clone,z,device,{...p,x:Math.min(100-p.w,p.x+step),y:Math.min(GRID_CAP,p.y+GRID_STEP*2),z:Math.min(250,p.z+1)});
}
function mediaValue(v,mode){
  if(typeof v!=='string')return false;
  if(mode==='image'&&okayData(v,'image'))return true;
  if(mode==='video'&&v.length<=Math.ceil(VIDEO_LIMIT/3)*4+80&&/^data:video\/(?:mp4|webm);base64,[A-Za-z0-9+/=]+$/.test(v))return true;
  if(/[<>"'\s\\]/.test(v))return false;
  try{return ['https:','http:'].includes(new URL(v).protocol)&&v.length<=3000;}catch{return false;}
}
function sectionBackground(zone,op){
  const el=surfaceOf(zone);
  if(!el)return false;
  if(op.kind==='section-overlay'){
    el.dataset.bsBgShade=clampNumber(op.value,0,85,24);
    el.style.setProperty('--bs-bg-shade',el.dataset.bsBgShade+'%');return true;
  }
  const type=op.type;
  if(!['original','color','image','video'].includes(type))return false;
  if(type==='color'&&!/^#[0-9a-f]{6}$/i.test(op.value))return false;
  if((type==='image'||type==='video')&&!mediaValue(op.value,type))return false;
  el.querySelector(':scope > .bs-bg-layer')?.remove();
  if(type==='original'){
    delete el.dataset.bsBg;
    el.style.removeProperty('--bs-bg-color');
    return true;
  }
  el.dataset.bsBg=type;
  if(type==='color'){el.style.setProperty('--bs-bg-color',op.value);return true;}
  const layer=addNative('div',{class:'bs-bg-layer','aria-hidden':'true'});
  if(type==='image'){
    layer.append(addNative('img',{src:op.value,alt:'',decoding:'async',referrerpolicy:'no-referrer'}));
  }else{
    const video=addNative('video',{src:op.value,muted:'',loop:'',playsinline:'',preload:'metadata','aria-hidden':'true',tabindex:'-1'});
    video.muted=true;video.defaultMuted=true;
    const reduce=D.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduce){video.autoplay=true;video.setAttribute('autoplay','');}
    layer.append(video);
  }
  el.prepend(layer);
  const video=layer.querySelector('video');
  if(video&&video.autoplay)video.play?.()?.catch(()=>{});
  return true;
}
function fileReadBg(f,kind,done){
  if(!f)return;
  const limit=kind==='video'?VIDEO_LIMIT:MAX_FILE;
  const mime=MEDIA_TYPES[kind][f.name.split('.').at(-1).toLowerCase()];
  if(!mime||!f.size||f.size>limit){flash(kind==='video'?'Choose an MP4 or WebM up to 20 MB.':'Choose a JPG, PNG, AVIF, WebP or GIF up to 2 MB.');return;}
  const rd=new FileReader();
  rd.onload=()=>{
    const value=String(rd.result).replace(/^data:[^;]*;/,'data:'+mime+';');
    if(kind==='image'){const im=new Image();im.onload=()=>done(value);im.onerror=()=>flash('This image could not be opened.');im.src=value;}
    else done(value);
  };
  rd.onerror=()=>flash('This file could not be opened.');rd.readAsDataURL(f);
}
function gridPanel(n){
  const z=zoneOf(n)||rowList()[0];if(!z)return;
  const begin=knownPosition(n,z,devicePlacement());
  const place=open('Grid placement','POSITION / SIZE / LAYER',n);
  para('Drag the grip or use these controls. Desktop, tablet, and mobile can have different positions. On phones, items without a mobile position stack below the original content.');
  const label=create('label',{},'Destination section');
  const selector=create('select',{'aria-label':'Destination section'});
  for(const option of allZones().filter(s=>!n.contains(s))){
    selector.append(create('option',{value:idOf(option)},zoneName(option)));
  }
  selector.value=idOf(z);label.append(selector);body.append(label);
  const initial={...begin}, tokenNames={x:Symbol(),y:Symbol(),w:Symbol(),z:Symbol()};
  const update=(k,value)=>{
    const zone=byId(selector.value);
    if(!zone||!n.isConnected)return;
    if(value!==undefined)initial[k]=Number(value);
    const p=normalizeGrid(initial);
    record(gridOperation(n,zone,devicePlacement(),p),tokenNames[k]);
  };
  const inputs=create('div',{class:'grid-controls'});body.append(inputs);
  input(inputs,'X (%)',Math.round(initial.x*10)/10,{type:'number',min:0,max:100,step:.25},e=>{if(e.value!=='')update('x',e.value);});
  input(inputs,'Y (px)',Math.round(initial.y),{type:'number',min:0,max:GRID_CAP},e=>{if(e.value!=='')update('y',e.value);});
  input(inputs,'Width (%)',Math.round(initial.w*10)/10,{type:'number',min:2,max:100,step:.25},e=>{if(e.value!=='')update('w',e.value);});
  input(inputs,'Layer',initial.z,{type:'number',min:-90,max:250},e=>{if(e.value!=='')update('z',e.value);});
  selector.addEventListener('change',()=>{update();scrollToSelection(n);});
  const actions=group();
  button(actions,'Place on grid',()=>{update();scrollToSelection(n);});
  button(actions,'Pick a spot',()=>startGridPick({node:n}));
  button(actions,'Nudge left',()=>{update('x',initial.x-100/GRID_COLS);gridPanel(n);});
  button(actions,'Nudge right',()=>{update('x',initial.x+100/GRID_COLS);gridPanel(n);});
  button(actions,'Nudge up',()=>{update('y',initial.y-GRID_STEP);gridPanel(n);});
  button(actions,'Nudge down',()=>{update('y',initial.y+GRID_STEP);gridPanel(n);});
  if(freeShell(n)){
    if(devicePlacement()!=='desktop'&&coords(freeShell(n),devicePlacement()))button(actions,'Use automatic '+devicePlacement()+' layout',()=>{
      record({kind:'grid-auto',id:idOf(n),device:devicePlacement()});gridPanel(n);
    });
    button(actions,'Return to page flow',()=>{record({kind:'grid-flow',id:idOf(n)});choose(n);});
  }else if(n.dataset.bsMove==='yes')button(actions,'Move above or below another item',pickTarget);
  place();
}
function backgroundPanel(section){
  const activeSurface=surfaceOf(section);
  const wrap=create('fieldset',{class:'section-background'});
  wrap.append(create('legend',{},'Section background'));body.append(wrap);
  const opts=create('div',{class:'chips'});wrap.append(opts);
  const slot=create('div',{class:'bg-controls'});wrap.append(slot);
  const getMode=()=>activeSurface.dataset.bsBg||'original';
  const getShade=()=>Number(activeSurface.dataset.bsBgShade??(activeSurface.classList.contains('hero')?48:12));
  const shades=Symbol(), colors=Symbol(), urls=Symbol();
  let selected=getMode();
  const cap={original:'Original',color:'Color',image:'Image',video:'Video'};
  function applyBg(type,value,gesture){
    if(record({kind:'section-bg',id:idOf(section),type,value},gesture))return true;
    return false;
  }
  function update(){
    slot.replaceChildren();[...opts.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===selected)));
    if(selected==='color'){
      const value=activeSurface.style.getPropertyValue('--bs-bg-color')||(activeSurface.classList.contains('hero')?'#0d2a1e':'#f6efe0');
      input(slot,'Background color',value,{type:'color'},x=>applyBg('color',x.value,colors));
    }
    if(selected==='image'||selected==='video'){
      const type=selected, video=type==='video';
      const cur=activeSurface.querySelector(':scope > .bs-bg-layer > '+(video?'video':'img'))?.getAttribute('src')||'';
      const controls=create('div',{class:'bg-source'});
      const direct=input(controls,(video?'Direct video':'Image')+' URL',cur.startsWith('http')?cur:'',{type:'url',placeholder:'https://…'+(video?'.mp4':''),maxlength:3000},x=>{
        const v=x.value.trim();
        if(mediaValue(v,type))applyBg(type,v,urls);
      });
      slot.append(controls);
      input(slot,video?'Upload MP4 or WebM (up to 20 MB)':'Upload image (up to 2 MB)','',{type:'file',accept:video?'video/mp4,video/webm':'image/jpeg,image/png,image/webp,image/avif,image/gif'},x=>{
        fileReadBg(x.files[0],type,v=>{if(section.isConnected&&applyBg(type,v))flash(video?'Video background added.':'Image background added.');});
      },'change');
      if(video){const note=create('p',{class:'muted'},'Use a direct MP4 or WebM URL, not a YouTube page. Videos loop without sound.');slot.append(note);}
      input(slot,'Dark overlay (%)',getShade(),{type:'range',min:0,max:85},x=>record({kind:'section-overlay',id:idOf(section),value:x.value},shades));
      if(cur&&!cur.startsWith('http'))direct.placeholder='A file is attached. Paste a URL to replace it.';
    }
  }
  for(const type of ['original','color','image','video']){
    const b=button(opts,cap[type],()=>{
      selected=type;
      if(type==='original')applyBg(type,'');
      if(type==='color'&&getMode()!=='color')applyBg(type,activeSurface.style.getPropertyValue('--bs-bg-color')||(activeSurface.classList.contains('hero')?'#0d2a1e':'#f6efe0'));
      update();adjustPopup(section);
    });
    b.dataset.mode=type;
  }
  update();
}
function scrollToSelection(n){n.scrollIntoView({block:'nearest'});requestAnimationFrame(paint);}
function gridOperation(n,zone,device,p){
  const oldZone=zoneOf(n)||zone;
  const baseline=device==='desktop'||oldZone!==zone?null:knownPosition(n,oldZone,'desktop');
  return {kind:'grid-place',id:idOf(n),target:idOf(zone),device,p,baseline};
}
function cloneSelected(n){
  const id=unique();
  const device=devicePlacement(),zone=zoneOf(n)||rowList()[0];
  const needsPosition=!n.hasAttribute('data-bs-zone')&&!n.hasAttribute('data-bs-row')&&!n.hasAttribute('data-bs-column')&&(freeShell(n)||n.dataset.bsMove!=='yes'||n.parentElement?.matches('a,form,.hero-actions'));
  const p=needsPosition&&zone?knownPosition(n,zone,device):null;
  if(!record({kind:'duplicate',id:idOf(n),copy:id,device,p}))return;
  const el=byId(id);
  scrollToSelection(el);choose(el);
  flash(el.hasAttribute('data-bs-row')?'Section duplicated.':'Element duplicated.');
}
function startGridPick({node=null,kind=null}){
  close();gridPick={node,kind};stage.classList.add('bs-placement-mode');
  $('hint').textContent='Click anywhere on the page grid to place the element. Esc cancels.';
  flash('Click anywhere on the page to place the element.');
}
function clearGridPick(){
  if(!gridPick)return;
  gridPick=null;stage.classList.remove('bs-placement-mode');hideGridVisual();
  if(mode==='edit')$('hint').textContent=defaultHint();
}
function setGridMode(next){
  gridMode=next;
  const btn=$('grid-mode');
  btn.setAttribute('aria-pressed',String(next==='grid'));
  btn.innerHTML=next==='grid'?'<span aria-hidden="true">▦</span> Grid':'<span aria-hidden="true">≡</span> Flow';
  btn.title=next==='grid'?'Free grid placement active. Click to switch to document flow.':'Inline placement active. Click for free grid dragging.';
  if(mode==='edit')$('hint').textContent=defaultHint();
}
function defaultHint(){
  return gridMode==='grid'?'Click an element to edit. Drag its grip anywhere on the page.':'Click an element to edit. Flow drag places it beside another element.';
}
function markerFrame(rect){
  const x=Math.max(rect.f.left,rect.left), y=Math.max(rect.f.top,rect.top);
  return {x,y,w:Math.max(0,Math.min(rect.f.right,rect.right)-x),h:Math.max(0,Math.min(rect.f.bottom,rect.bottom)-y)};
}
function showGridVisual(z, p, n, pointOut){
  const rect=anchorRect(surfaceOf(z));if(!rect)return;
  const frameClipped=markerFrame(rect);
  const grid=$('free-grid');
  if(frameClipped.h>0&&frameClipped.w>0){
    const unit=rect.width/GRID_COLS;
    Object.assign(grid.style,{left:frameClipped.x+'px',top:frameClipped.y+'px',width:frameClipped.w+'px',height:frameClipped.h+'px',
      backgroundSize:unit+'px '+GRID_STEP+'px',backgroundPosition:(rect.left-frameClipped.x)+'px '+(rect.top-frameClipped.y)+'px'});
    grid.hidden=false;
  } else grid.hidden=true;
  const ghost=$('free-ghost');
  const left=rect.left+rect.width*p.x/100, top=rect.top+p.y;
  const width=Math.max(0,Math.min(rect.f.right,left+rect.width*p.w/100)-Math.max(rect.f.left,left));
  if(!width||top>=rect.f.bottom){ghost.hidden=true;freeGhostHide();return;}
  const clippedTop=Math.max(top,rect.f.top);
  const height=Math.max(0,Math.min(rect.f.bottom,top+p.h)-clippedTop);
  const clippedLeft=Math.max(rect.f.left,left);
  Object.assign(ghost.style,{left:clippedLeft+'px',top:clippedTop+'px',width:width+'px',height:height+'px'});
  ghost.hidden=height<3;
  $('free-ghost-label').textContent=zoneName(z)+' · '+Math.round(p.x)+'% × '+Math.round(p.y)+'px';
  if(n&&height>2)drawGhost(n,left,top,rect.width*p.w/100,p.h);
  else freeGhostHide();
}
let liveGhost=null, liveGhostSource=null;
function drawGhost(n,left,top,w,h){
  const f=frame.getBoundingClientRect();
  if(liveGhostSource!==n||!liveGhost?.isConnected){
    freeGhostHide();liveGhost=addNative('div',{class:'bs-drag-ghost','aria-hidden':'true'});
    const c=n.cloneNode(true);c.classList.add('bs-drag-look');c.removeAttribute('id');c.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    const look=D.defaultView.getComputedStyle(n);
    for(const key of [...preserveList,'font-size','padding-top','padding-bottom','padding-left','padding-right','display']){const value=look.getPropertyValue(key);if(value)c.style.setProperty(key,value);}
    for(const v of c.querySelectorAll('video')){v.removeAttribute('autoplay');v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));}
    liveGhost.append(c);D.querySelector('.ncw').append(liveGhost);liveGhostSource=n;
  }
  Object.assign(liveGhost.style,{left:(left-f.left)+'px',top:(top-f.top)+'px',width:w+'px',minHeight:h+'px'});
}
function freeGhostHide(){liveGhost?.remove();liveGhost=null;liveGhostSource=null;}
function hideGridVisual(){
  $('free-grid').hidden=true;$('free-ghost').hidden=true;freeGhostHide();
}
function updatePick(e){
  if(!gridPick)return;
  const z=zoneAt(e.clientX,e.clientY);
  if(!z)return;
  const device=devicePlacement();
  const dims=gridPick.node?measure(gridPick.node):{width:gridPick.kind==='image'?240:250,height:62};
  const p=gridPoint(z,e.clientX,e.clientY,dims,device);
  showGridVisual(z,p,gridPick.node);
}
function commitPick(e){
  if(!gridPick)return false;
  const z=zoneAt(e.clientX,e.clientY);
  const item=gridPick;clearGridPick();
  if(!z)return true;
  const d=devicePlacement();
  const dims=item.node?measure(item.node):{width:item.kind==='image'?240:250,height:62};
  const p=gridPoint(z,e.clientX,e.clientY,dims,d);
  const id=item.node?idOf(item.node):unique();
  if(record(item.node?gridOperation(item.node,z,d,p):{kind:'grid-add',id,target:idOf(z),device:d,p,type:item.kind})){
    const n=byId(id);if(n){scrollToSelection(n);choose(n);}
  }
  return true;
}
function sizeObserver(){
  if(!D||!D.defaultView.ResizeObserver)return;
  const observer=new D.defaultView.ResizeObserver(()=>refreshFreeSizes());
  observer.observe(D.documentElement);
}
/* IndexedDB can hold uploaded background videos beyond localStorage's quota. */
function draftStore(mode, task){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(Error('Large draft storage unavailable'));return;}
    const openReq=indexedDB.open('ncw-studio-drafts',1);
    openReq.onupgradeneeded=()=>openReq.result.createObjectStore('pages');
    openReq.onerror=()=>reject(openReq.error);
    openReq.onblocked=()=>reject(Error('Draft storage is blocked'));
    openReq.onsuccess=()=>{
      const db=openReq.result;
      let transaction, req;
      try{transaction=db.transaction('pages',mode);req=task(transaction.objectStore('pages'));}
      catch(e){db.close();reject(e);return;}
      transaction.oncomplete=()=>{db.close();resolve(req?.result);};
      transaction.onabort=transaction.onerror=()=>{db.close();reject(transaction.error||req?.error);};
    };
  });
}
