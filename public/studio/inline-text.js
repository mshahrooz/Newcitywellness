'use strict';

// Rich-text operations live in the same draft as the existing Studio edits.
const StudioInline=(()=>{
  const LIMIT=40000;
  const tags=new Set('a strong em span br small builder-copy cite'.split(' '));
  const drop=new Set('script style svg math iframe object template img input button video audio'.split(' '));
  const inlineAttrs=new Set('id class title lang dir aria-hidden data-builder-copy data-builder-shared data-bs-id data-bs-kind data-bs-native-copy data-bs-copy-only data-bs-generated'.split(' '));
  const badStyle=/(?:url\s*\(|expression\s*\(|@import|javascript\s*:|[\\<>])/i;
  function validLink(value){
    if(!value||value.length>4096||/[\x00-\x20\\]/.test(value)||value.startsWith('//'))return false;
    if(/^(#|\/)/.test(value))return true;
    if(/^tel:/i.test(value))return /^tel:\+?[0-9().-]{3,32}(?:;ext=[0-9]{1,10})?$/i.test(value);
    if(/^mailto:/i.test(value))return /^mailto:[^@?\s]+@[^@?\s]+\.[^@?\s]+(?:\?[^#]*)?$/i.test(value);
    try{const u=new URL(value);return /^(https?):$/.test(u.protocol)&&!u.username&&!u.password;}catch{return false;}
  }
  const edits=link=>validLink(link)||!!link&&link.length<=4096&&!/[\x00-\x20\\]/.test(link)&&!link.startsWith('//')&&!/^[a-z][a-z0-9+.-]*:/i.test(link);
  function sanitize(doc,html,insideLink=false){
    if(typeof html!=='string'||html.length>LIMIT*5)return null;
    const template=doc.createElement('template'), out=doc.createElement('div');
    template.innerHTML=html;
    let count=0, valid=true;
    function add(parent,node,depth,inLink){
      if(!valid)return;
      if(depth>32||++count>8000){valid=false;return;}
      if(node.nodeType===3){parent.append(doc.createTextNode(node.data));return;}
      if(node.nodeType!==1)return;
      const tag=({b:'strong',i:'em'})[node.localName]||node.localName;
      if(drop.has(tag))return;
      if(['div','p','li'].includes(tag)&&parent.childNodes.length)parent.append(doc.createElement('br'));
      if(!tags.has(tag)||tag==='a'&&inLink){for(const c of node.childNodes)add(parent,c,depth+1,inLink);return;}
      const next=doc.createElement(tag);
      for(const {name,value} of node.attributes){
        if(inlineAttrs.has(name)&&value.length<300)next.setAttribute(name,value);
        if(name==='style'&&value.length<500&&!badStyle.test(value)&&!/!important/i.test(value))next.setAttribute(name,value);
        if(tag==='a'&&name==='href'&&edits(value))next.setAttribute(name,value);
        if(tag==='a'&&name==='target'&&['_blank','_self'].includes(value))next.setAttribute(name,value);
        if(tag==='a'&&name==='rel'&&/^[a-z -]{1,80}$/i.test(value))next.setAttribute(name,value);
      }
      if(next.getAttribute('target')==='_blank')next.relList.add('noopener');
      for(const c of node.childNodes)add(next,c,depth+1,inLink||tag==='a');
      parent.append(next);
    }
    for(const n of template.content.childNodes)add(out,n,0,insideLink);
    return valid&&out.textContent.length<=LIMIT?out:null;
  }
  let edit=null;
  function rootFor(n){
    if(!n||n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone')||n.hasAttribute('data-builder-attr'))return null;
    const el=StudioText.available(n)?StudioText.root(n):content(n);
    if(!el?.matches('h1,h2,h3,h4,h5,h6,p,summary,blockquote,figcaption,strong,em,b,i,small,span,a,button,builder-copy,div,li,dt,dd,label'))return null;
    return el.querySelector('h1,h2,h3,h4,h5,h6,p,ol,ul,form,button,input,textarea,select,iframe,img,picture,video,audio,svg,table,details,section,article,code')?null:el;
  }
  function apply(n,op){
    const node=rootFor(n), clean=node&&sanitize(node.ownerDocument,op.value,!!node.closest('a,button'));
    if(!clean)return false;
    node.replaceChildren(...clean.childNodes);return true;
  }
  const running=()=>!!edit, contains=target=>!!edit?.node.contains(target), inToolbar=target=>!!edit?.toolbar.contains(target);
  function position(){
    if(!edit)return;
    const {target,toolbar}=edit, b=anchorRect(target);
    const left=b?.left||window.innerWidth/2-140, top=b?.top||100;
    toolbar.style.left=Math.max(8,Math.min(window.innerWidth-toolbar.offsetWidth-8,left))+'px';
    toolbar.style.top=Math.max(8,Math.min(window.innerHeight-toolbar.offsetHeight-8,top-toolbar.offsetHeight-7))+'px';
  }
  function finish(commit=true){
    if(!edit)return true;
    const {node,target,toolbar,before,previousEditable,stop}=edit, changed=node.innerHTML!==before;
    const clean=commit&&changed?sanitize(node.ownerDocument,node.innerHTML,!!node.closest('a,button')):null;
    if(commit&&changed&&!clean){flash('This edit is too long or complex. Shorten it or press Esc to cancel.');return false;}
    edit=null;stop();toolbar.remove();node.classList.remove('bs-inline-editing');
    if(previousEditable===null)node.removeAttribute('contenteditable');else node.setAttribute('contenteditable',previousEditable);
    if(changed)node.innerHTML=before;
    if(clean&&clean.innerHTML!==before)record({kind:'rich-text',id:idOf(target),value:clean.innerHTML});
    paint();return true;
  }
  function start(n){
    if(!n||!finish())return false;
    const node=rootFor(n);
    if(!node)return false;
    const doc=node.ownerDocument, toolbar=create('div',{class:'inline-tools',role:'toolbar','aria-label':'Inline formatting'});
    const before=node.innerHTML, previousEditable=node.getAttribute('contenteditable');
    if(!doc.getElementById('ncw-inline-only-css')){
      const style=doc.createElement('style');
      style.id='ncw-inline-only-css';
      style.textContent='.bs-inline-editing{outline:2px solid #385ace!important;outline-offset:3px;cursor:text!important;user-select:text!important;touch-action:auto!important} .bs-inline-editing *{cursor:text!important;user-select:text!important}';
      doc.head.append(style);
    }
    const handlers=[];
    const watch=(el,type,fn)=>{el.addEventListener(type,fn);handlers.push(()=>el.removeEventListener(type,fn));};
    edit={node,target:n,toolbar,before,previousEditable,stop:()=>handlers.forEach(stop=>stop())};
    close();active=idOf(n);node.classList.add('bs-inline-editing');node.setAttribute('contenteditable','true');
    const selected=()=>{const sel=doc.getSelection();return sel?.rangeCount&&!sel.isCollapsed&&contains(sel.anchorNode)&&contains(sel.focusNode);};
    for(const [name,cmd] of [['Bold','bold'],['Italic','italic'],['Link','createLink']]){
      const control=button(toolbar,name,()=>{
        if(!selected()){flash('Select the text you want to format first.');return;}
        if(name!=='Link'){doc.execCommand(cmd,false);return;}
        const range=doc.getSelection().getRangeAt(0).cloneRange();
        const old=toolbar.querySelector('.inline-link-controls');
        if(old){old.querySelector('input').focus();return;}
        const group=create('div',{class:'inline-link-controls'});
        const address=input(group,'Link URL','',{placeholder:'https://…',maxlength:4096},el=>el.setCustomValidity(''));
        const set=()=>{
          const url=address.value.trim();
          if(!validLink(url)){address.setCustomValidity('Enter a valid link address.');address.reportValidity();return;}
          node.focus();const sel=doc.getSelection();sel.removeAllRanges();sel.addRange(range);
          doc.execCommand(cmd,false,url);group.remove();position();
        };
        button(group,'Apply link',set);toolbar.append(group);position();address.focus();
        address.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();set();}});
      });
      control.addEventListener('pointerdown',e=>e.preventDefault());
      if(name==='Link'&&node.closest('a,button'))control.disabled=true;
    }
    button(toolbar,'Done',()=>finish());button(toolbar,'Cancel',()=>finish(false));
    document.body.append(toolbar);
    const keys=e=>{
      if(e.key==='Escape'||e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
        e.stopPropagation();e.preventDefault();finish(e.key!=='Escape');
      }
    };
    watch(node,'keydown',keys);watch(toolbar,'keydown',keys);
    watch(node,'paste',e=>{
      e.preventDefault();
      const text=e.clipboardData?.getData('text/plain')||'';
      if(node.textContent.length-(doc.getSelection()?.toString().length||0)+text.length>LIMIT){flash('That paste exceeds the 40,000-character limit. Nothing was inserted.');return;}
      doc.execCommand('insertText',false,text);
    });
    watch(node,'drop',e=>e.preventDefault());
    watch(node,'beforeinput',e=>{
      if(e.data&&node.textContent.length-(doc.getSelection()?.toString().length||0)+e.data.length>LIMIT){e.preventDefault();flash('40,000-character limit reached.');}
    });
    node.focus();
    const sel=doc.getSelection(), range=doc.createRange();range.selectNodeContents(node);sel.removeAllRanges();sel.addRange(range);
    paint();return true;
  }
  return {apply,start,finish,running,contains,inToolbar,position};
})();
