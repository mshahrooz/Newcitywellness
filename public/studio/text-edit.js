'use strict';

// Text targets are added after the older Studio IDs, so saved edit operations still replay.
const StudioText=(()=>{
  const controls='input,textarea,select,option,button,a[href],label,summary';
  const ignored='[hidden],[aria-hidden="true"],template,script,style,svg,.arrow,.faq-icon,.leaf-art,.mobile-toggle,[data-studio-runtime]';
  const marked='[data-bs-native-copy]';
  const copy='builder-copy[data-builder-copy],[data-editor-field]';
  const semantic='h1,h2,h3,h4,h5,h6,p,li,dt,dd,summary,blockquote,figcaption,caption,th,td,legend,a[href],button,label,builder-copy';
  const plain='div,span,strong,em,b,i,small,time,address,abbr,cite,code';
  const supported=new Set(['placeholder','title','aria-label']);
  const hasWords=t=>/[\p{L}\p{N}]/u.test(t||'');
  const normal=t=>t.replace(/[^\S\n]+/g,' ').trim();
  const decorative=n=>n.matches?.('span')&&/^[\s→←↑↓›»]+$/.test(n.textContent);
  function parts(n){
    const list=[];
    function visit(el){
      if(el.nodeType===3){list.push(el);return;}
      if(el!==n&&(el.matches?.(ignored+',input,textarea,select,option')||decorative(el)))return;
      if(el.localName==='br'){list.push(el);return;}
      for(const child of el.childNodes)visit(child);
    }
    visit(n);return list;
  }
  function label(n){
    // Buttons and links often carry an independent decorative arrow or icon.
    if(n.matches('a[href],button,label')){
      const primary=[...n.querySelectorAll(copy)].find(el=>!el.closest(ignored)&&!el.matches('input,textarea,select'));
      if(primary)return primary;
    }
    return n;
  }
  function attribute(n){
    const name=n.getAttribute('data-builder-attr');
    if(supported.has(name))return name;
    if(n.matches('input:not([type=hidden]),textarea')&&n.hasAttribute('placeholder'))return 'placeholder';
    return null;
  }
  function value(n){
    const attr=attribute(n);
    return attr?(n.getAttribute(attr)||''):normal(parts(label(n)).map(x=>x.nodeType===3?x.data:'\n').join(''));
  }
  const available=n=>!!n?.hasAttribute('data-bs-native-copy');
  const getLabel=n=>attribute(n)==='placeholder'?'Placeholder':n.matches('a[href],button,label')?'Label':n.closest('summary')?'Question':'Text';
  function mark(doc,placed){
    let serial=0;
    function set(n){
      if(!n.hasAttribute('data-bs-id')){
        n.dataset.bsId='studio-copy-'+(++serial);
        n.dataset.bsKind='detail';
        // New text-only anchors are not independent layout blocks.
        n.dataset.bsCopyOnly='';
      }
      n.dataset.bsNativeCopy='';
    }
    function valid(n){
      return n?.matches&&!n.closest(ignored)&&!n.hasAttribute('data-bs-divider')&&
        !n.hasAttribute('data-bs-row')&&!n.hasAttribute('data-bs-zone')&&!n.hasAttribute('data-bs-column')&&
        !n.closest('[data-bs-new]')&&(placed(n)||n.matches('.floating-booking-link'));
    }
    for(const n of doc.querySelectorAll(semantic+','+plain+',input,textarea')){
      if(!valid(n))continue;
      if(n.matches('input,textarea')){
        if(attribute(n))set(n);
        continue;
      }
      if(n.matches('.therapy-card,.condition-card,.testimonial-card,.reviews-card'))continue;
      if(n.matches('builder-copy')&&available(n.parentElement))continue;
      if(n.matches(plain)){
        const textChildren=[...n.childNodes].some(child=>child.nodeType===3&&hasWords(child.data));
        const ownCopy=[...n.children].some(child=>child.matches(copy)&&hasWords(child.textContent));
        if(!textChildren&&!ownCopy)continue;
        if(n.querySelector(controls+',h1,h2,h3,h4,h5,h6,p,ul,ol,dl,article,section,form'))continue;
      }
      if(n.matches('li,blockquote,td,th')&&n.querySelector('h1,h2,h3,h4,h5,h6,p,ul,ol,dl,a[href],button'))continue;
      if(hasWords(value(n)))set(n);
    }
  }
  function target(hit){
    if(!hit?.closest||hit.closest(ignored))return null;
    return hit.closest(marked);
  }
  function updateLine(nodes,next){
    if(!nodes.length)return;
    const previous=nodes.map(n=>n.data).join('');
    // Keep leading/trailing spacing used between formatted or decorative siblings.
    const head=previous.match(/^[ \t]*/)[0], tail=previous.trim()?previous.match(/[ \t]*$/)[0]:'';
    const desired=head+next+tail;
    if(previous===desired)return;
    let start=0, end=0;
    while(start<previous.length&&start<desired.length&&previous[start]===desired[start])start++;
    while(end<previous.length-start&&end<desired.length-start&&previous[previous.length-1-end]===desired[desired.length-1-end])end++;
    const insert=desired.slice(start,desired.length-end), limit=previous.length-end;
    let pos=0, inserted=false;
    for(const n of nodes){
      const original=n.data,len=original.length, finish=pos+len;
      const left=Math.max(0,Math.min(len,start-pos)), right=Math.max(0,Math.min(len,limit-pos));
      const injection=!inserted&&start<=finish;
      if(injection)inserted=true;
      if(right>left||injection)n.data=original.slice(0,left)+(injection?insert:'')+original.slice(right);
      pos=finish;
    }
  }
  function apply(n,op){
    if(!available(n)||typeof op.value!=='string')return false;
    const next=op.value.slice(0,3000).replace(/\r\n?/g,'\n');
    const current=value(n);
    if(next===current)return true;
    const attr=attribute(n);
    if(attr){n.setAttribute(attr,next.replace(/\n/g,' '));return true;}
    const root=label(n), groups=[[]];
    for(const node of parts(root)){
      if(node.nodeType===3)groups.at(-1).push(node);
      else groups.push([]);
    }
    const lines=next.split('\n');
    // Retain existing HTML line breaks and apply extra lines to the final run.
    for(const [index,nodes] of groups.entries()){
      const line=index===groups.length-1?lines.slice(index).join(' '):lines[index]||'';
      if(!nodes.length){if(line&&groups.length===1)root.append(root.ownerDocument.createTextNode(line));continue;}
      updateLine(nodes,line);
    }
    const link=n.closest('a[href],button');
    const spoken=link?.getAttribute('aria-label');
    if(spoken&&next.trim()&&normal(spoken)===normal(current.replace(/\n/g,' '))){
      link.setAttribute('aria-label',normal(next.replace(/\n/g,' ')));
    }
    return true;
  }
  function rect(n,box){
    const normal=box.getBoundingClientRect();
    // A builder-copy wrapper may use display:contents. Anchor the popup to the actual text.
    if(!available(n)||normal.width||normal.height||!n.ownerDocument.createRange)return normal;
    const range=n.ownerDocument.createRange();
    range.selectNodeContents(n);
    return range.getBoundingClientRect?.()||normal;
  }
  return {mark,value,target,available,getLabel,apply,rect,root:label};
})();
