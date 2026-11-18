'use strict';
const StudioAuthoring=(()=>{
  const LIMIT=40000;
  const safeInline=new Set(['a','strong','em','span','br','small','builder-copy','cite','code']);
  const safeStyle=/(?:url\s*\(|expression\s*\(|@import|javascript\s*:|\\|[<>])/i;
  const plain=text=>typeof text==='string'&&text.length<=LIMIT;
  function href(value){
    if(typeof value!=='string'||value.length>4096||/[\x00-\x20\\]/.test(value)||value.startsWith('//'))return false;
    if(!value||value.startsWith('#'))return true;
    if(value.startsWith('/'))return true;
    if(/^tel:/i.test(value))return /^tel:\+?[0-9().-]{3,32}(?:;ext=[0-9]{1,10})?$/i.test(value);
    if(/^mailto:/i.test(value))return /^mailto:[^@?\s]+@[^@?\s]+\.[^@?\s]+(?:\?[^#]*)?$/i.test(value);
    try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}
  }
  function sanitize(doc,html,insideLink=false){
    if(typeof html!=='string'||html.length>LIMIT*5)return null;
    const t=doc.createElement('template'), out=doc.createElement('div');
    t.innerHTML=html;
    let count=0, valid=true;
    function add(parent,node,depth){
      if(!valid)return;
      if(depth>32||++count>8000){valid=false;return;}
      if(node.nodeType===3){parent.append(doc.createTextNode(node.data));return;}
      if(node.nodeType!==1)return;
      const tag=({b:'strong',i:'em'})[node.localName]||node.localName;
      if(['script','style','svg','math','iframe','object','template','img','input','button','video','audio'].includes(tag))return;
      if(['div','p','li'].includes(tag)&&parent.childNodes.length)parent.append(doc.createElement('br'));
      if(!safeInline.has(tag)||tag==='a'&&insideLink){for(const child of node.childNodes)add(parent,child,depth+1);return;}
      const next=doc.createElement(tag);
      for(const {name,value} of node.attributes){
        if(name==='href'&&tag==='a'&&value&&href(value))next.setAttribute(name,value);
        if(['class','aria-hidden','data-builder-copy','data-builder-shared','data-bs-id','data-bs-legacy-id','data-bs-kind','data-bs-native-copy','data-bs-copy-only','data-bs-generated'].includes(name)&&value.length<200)next.setAttribute(name,value);
        if(name==='style'&&value.length<500&&!safeStyle.test(value)&&!/!important/i.test(value))next.setAttribute(name,value);
      }
      for(const child of node.childNodes)add(next,child,depth+1);
      parent.append(next);
    }
    for(const n of t.content.childNodes)add(out,n,0);
    return valid&&plain(out.textContent)?out:null;
  }
  let inline=null;
  function rootFor(n){
    const contentNode=content(n);
    if(!contentNode||n.hasAttribute('data-bs-row')||n.hasAttribute('data-bs-zone'))return null;
    const el=StudioText.available(n)?StudioText.root(n):contentNode;
    if(!el?.matches('h1,h2,h3,h4,h5,h6,p,summary,blockquote,figcaption,strong,em,b,i,small,span,a,button,builder-copy,div,li,dt,dd,label'))return null;
    if(el.querySelector('h1,h2,h3,h4,h5,h6,p,ol,ul,form,button,input,textarea,select,iframe,img,picture,video,audio,svg,table,details,section,article'))return null;
    return el;
  }
  function applyRich(n,op){
    const node=rootFor(n);
    if(!node)return false;
    const result=sanitize(n.ownerDocument,op.value,!!node.closest('a[href]'));
    if(!result)return false;
    node.replaceChildren(...result.childNodes);return true;
  }
  function counter(parent,input){
    const meter=create('small',{class:'studio-char-count','aria-live':'polite'});
    const update=()=>{meter.textContent=input.value.length.toLocaleString()+' / '+LIMIT.toLocaleString()+' characters';};
    parent.append(meter);input.addEventListener('input',update);update();
  }
  function finish(commit=true){
    const edit=inline;if(!edit)return true;
    const {node,target,toolbar,before,previousEditable}=edit;
    const html=node.innerHTML;
    const checked=commit?sanitize(node.ownerDocument,html,!!node.closest('a[href]')):null;
    if(commit&&!checked){flash('This text exceeds the 40,000-character limit. Shorten it or press Esc to cancel.');return false;}
    inline=null;toolbar.remove();
    if(previousEditable===null)node.removeAttribute('contenteditable');else node.setAttribute('contenteditable',previousEditable);
    node.classList.remove('bs-inline-editing');
    node.innerHTML=before;
    if(commit&&html!==before)record({kind:'rich-text',id:idOf(target),value:checked.innerHTML});
    paint();return true;
  }
  function running(){return !!inline;}
  function startInline(n){
    if(!n||!finish())return false;
    const node=rootFor(n);
    if(!node)return false;
    const doc=node.ownerDocument, toolbar=create('div',{class:'inline-tools',role:'toolbar','aria-label':'Inline formatting'});
    const counterEl=create('span',{class:'studio-char-count','aria-live':'polite'});
    const snapshot=node.innerHTML, previousEditable=node.getAttribute('contenteditable');
    inline={node,target:n,toolbar,before:snapshot,previousEditable};
    close();active=idOf(n);node.classList.add('bs-inline-editing');node.setAttribute('contenteditable','true');
    const announce=()=>{counterEl.textContent=node.textContent.length.toLocaleString()+' / '+LIMIT.toLocaleString();};
    const validSelection=()=>{
      const sel=doc.getSelection();
      return !!(sel?.rangeCount&&node.contains(sel.anchorNode)&&node.contains(sel.focusNode)&&!sel.isCollapsed);
    };
    for(const [name,cmd] of [['Bold','bold'],['Italic','italic'],['Link','createLink']]){
      const control=button(toolbar,name,()=>{
        if(!validSelection()){flash('Select the text you want to format first.');return;}
        if(name!=='Link'){doc.execCommand(cmd,false);announce();return;}
        const range=doc.getSelection().getRangeAt(0).cloneRange();
        const set=()=>{const url=address.value.trim();if(!url||!href(url)){address.setCustomValidity('Enter a safe link address.');address.reportValidity();return;}
          node.focus();const sel=doc.getSelection();sel.removeAllRanges();sel.addRange(range);doc.execCommand(cmd,false,url);group.remove();announce();};
        const group=create('div',{class:'inline-link-controls'}), address=input(group,'Link URL','',{placeholder:'https://…',maxlength:4096},el=>el.setCustomValidity(''));
        button(group,'Apply link',set);toolbar.append(group);address.focus();
        address.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();set();}});
      });
      control.addEventListener('pointerdown',e=>e.preventDefault());
      if(name==='Link'&&node.closest('a[href]'))control.disabled=true;
    }
    toolbar.append(counterEl);button(toolbar,'Done',()=>finish());button(toolbar,'Cancel',()=>finish(false));
    document.body.append(toolbar);
    const bounds=anchorRect(n);
    toolbar.style.left=Math.max(8,Math.min(window.innerWidth-toolbar.offsetWidth-8,bounds?.left||window.innerWidth/2-140))+'px';
    toolbar.style.top=Math.max(8,Math.min(window.innerHeight-toolbar.offsetHeight-8,(bounds?.top||100)-toolbar.offsetHeight-7))+'px';
    node.focus();
    const sel=doc.getSelection(), range=doc.createRange();range.selectNodeContents(node);sel.removeAllRanges();sel.addRange(range);
    for(const type of ['input','paste','keydown','beforeinput']){
      node.addEventListener(type,function listener(e){
        if(inline?.node!==node){node.removeEventListener(type,listener);return;}
        if(type==='keydown'&&e.key==='Escape'){e.stopPropagation();e.preventDefault();finish(false);}
        if(type==='keydown'&&e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.stopPropagation();e.preventDefault();finish();}
        if(type==='paste'){
          e.preventDefault();
          const text=e.clipboardData?.getData('text/plain')||'';
          const selection=doc.getSelection()?.toString().length||0;
          if(node.textContent.length-selection+text.length>LIMIT){flash('Paste exceeds the 40,000-character limit. Nothing was inserted.');return;}
          doc.execCommand('insertText',false,text);
        }
        if(type==='beforeinput'&&e.data&&node.textContent.length-(doc.getSelection()?.toString().length||0)+e.data.length>LIMIT){e.preventDefault();flash('40,000-character limit reached.');}
        announce();
      });
    }
    announce();return true;
  }
  function editHref(n,container=body){
    const anchor=n.matches('a')?n:n.hasAttribute('data-bs-new')?n.querySelector('a[href]'):n.closest('a[href]');
    if(!anchor||!idOf(anchor)&&!idOf(n)||anchor.hasAttribute('download'))return;
    const key=anchor.hasAttribute('data-bs-id')?idOf(anchor):idOf(n);
    const token=Symbol();
    input(container,'Link destination',anchor.getAttribute('href')||'',{type:'text',maxlength:4096,placeholder:'https://… · /page/ · tel: · mailto:'},field=>{
      const value=field.value.trim();
      field.setCustomValidity(href(value)?'':'Enter a valid website, page, phone, or email link.');
      if(href(value))record({kind:'link',id:key,value},token);
    },'change');
  }
  function links(){
    if(!baselineReady||mode!=='edit'||!finish())return;
    const place=open('Navigation & footer','SITE LINKS');
    para('Edit the links on the selected page. Shared links can also be updated across existing pages using Copy and Paste where needed.');
    for(const [label,selector] of [['Header, navigation and booking','.site-header a[href],.floating-booking-link[href]'],['Footer','.site-footer a[href]']]){
      const section=create('details',{class:'look',open:''});section.append(create('summary',{},label));
      for(const n of D.querySelectorAll(selector)){
        if(!idOf(n)||n.hasAttribute('download'))continue;
        const name=StudioText.available(n)?StudioText.value(n):textCopy(n);
        const entry=create('div',{class:'studio-link-row'});
        entry.append(create('strong',{},(name||n.getAttribute('aria-label')||n.getAttribute('href')).trim()));
        editHref(n,entry);section.append(entry);
      }
      body.append(section);
    }
    place();
  }
  function formControls(field,parent=body){
    if(!field.matches('input:not([type=hidden]),textarea,select')||!field.closest('form')||!idOf(field))return;
    const edit=(prop,value)=>record({kind:'form-field',id:idOf(field),prop,value});
    input(parent,'Accessible field label',field.getAttribute('aria-label')||'',{maxlength:160},x=>edit('aria-label',x.value),'change');
    const box=create('label',{class:'form-required'},'Required field');
    const check=create('input',{type:'checkbox'});check.checked=field.required;box.prepend(check);
    check.addEventListener('change',()=>edit('required',check.checked));parent.append(box);
  }
  function applyForm(n,op){
    if(!n.matches('input:not([type=hidden]),textarea,select')||!n.closest('form'))return false;
    if(op.prop==='required'&&typeof op.value==='boolean'){n.required=op.value;return true;}
    if(op.prop==='aria-label'&&typeof op.value==='string'&&op.value.length<=160){
      if(op.value)n.setAttribute('aria-label',op.value);else n.removeAttribute('aria-label');
      return true;
    }
    return false;
  }
  function heading(n,e){
    if(!e?.matches('h1,h2,h3,h4,h5,h6'))return;
    const label=create('label',{},'Heading level'), field=create('select');
    for(let i=1;i<=6;i++)field.append(create('option',{value:'h'+i},'H'+i+(i===1?' · Main page heading':'')));
    field.value=e.localName;
    field.addEventListener('change',()=>{const id=idOf(n);if(record({kind:'heading-level',id,value:field.value}))choose(byId(id));});
    label.append(field);body.append(label);
  }
  function applyHeading(n,e,tag){
    if(!e?.matches('h1,h2,h3,h4,h5,h6')||!/^h[1-6]$/.test(tag))return false;
    if(tag===e.localName)return true;
    const replacement=n.ownerDocument.createElement(tag);
    for(const a of e.attributes)replacement.setAttribute(a.name,a.value);
    replacement.append(...e.childNodes);e.replaceWith(replacement);return true;
  }
  function pasteBlock(target){
    if(!target||!clipboard)return false;
    let ref=target;
    if(target.hasAttribute('data-bs-row')&&!target.hasAttribute('data-bs-new'))ref=target;
    const id=unique(), op={kind:'paste-block',id:idOf(ref),copy:id,value:clipboard,row:target.hasAttribute('data-bs-row')};
    if(!record(op))return false;
    choose(byId(id));return true;
  }
  let clipboard=null;
  function copyBlock(n){
    if(!n||n.hasAttribute('data-bs-zone')||n.matches('input,textarea,select,label,form,summary,builder-copy')||n.hasAttribute('data-bs-copy-only'))return false;
    const clone=n.cloneNode(true);
    clone.querySelectorAll('script,style,iframe,form,input,textarea,select,[data-bs-drop-slot],template').forEach(x=>x.remove());
    // Keep copied blocks portable without taking page-specific JavaScript with them.
    if(clone.querySelector('[src^="data:"],[href^="data:"]')){flash('Publish or replace uploaded media before copying this block.');return false;}
    for(const el of [clone,...clone.querySelectorAll('*')])for(const attr of [...el.attributes]){
      if(/^on/i.test(attr.name)||['srcdoc','contenteditable','data-bs-drag-ready'].includes(attr.name))el.removeAttribute(attr.name);
      if(['src','href','poster'].includes(attr.name)&&attr.value&&!attr.value.startsWith('#')&&!attr.value.startsWith('/')){
        try{const u=new URL(attr.value,n.ownerDocument.URL);if(['http:','https:'].includes(u.protocol)&&u.origin===location.origin)el.setAttribute(attr.name,u.pathname+u.search+u.hash);}catch{}
      }
    }
    clipboard=clone.outerHTML;flash('Block copied. Select a destination and use Paste.');return true;
  }
  function applyPaste(n,op){
    const d=n.ownerDocument;
    if(typeof op.value!=='string'||op.value.length>180000||!/^new-[a-f0-9-]{36}$/.test(op.copy)||byId(op.copy))return false;
    const t=d.createElement('template');t.innerHTML=op.value;
    if(t.content.children.length!==1)return false;
    const el=t.content.firstElementChild;
    for(const x of [el,...el.querySelectorAll('*')]){
      if(!/^(?:a|article|aside|blockquote|br|builder-copy|button|div|dl|dt|dd|em|figcaption|figure|footer|h[1-6]|header|hr|img|li|main|nav|ol|p|picture|section|small|source|span|strong|ul|video|details|summary)$/.test(x.localName))return false;
      for(const a of [...x.attributes]){
        if(/^on/i.test(a.name)||['srcdoc','contenteditable','autofocus','formaction','action','ping'].includes(a.name)||a.name==='style'&&safeStyle.test(a.value))return false;
        if(a.name==='href'&&!href(a.value))return false;
        if(['src','poster','srcset'].includes(a.name)&&!a.value.split(',').every(part=>/^\/(?!\/)/.test(part.trim())))return false;
        if(a.name==='data-bs-legacy-id')x.removeAttribute(a.name);
      }
    }
    const copied=safeDuplicate(el,op.copy);
    if(op.row&&n.hasAttribute('data-bs-row')){n.after(copied);return true;}
    if(copied.hasAttribute('data-bs-row'))return false;
    if(n.hasAttribute('data-bs-column')){n.append(copied);return true;}
    return StudioFlow.placeNew(copied,n,'after');
  }
  return {LIMIT,plain,href,sanitize,applyRich,startInline,finish,running,counter,editHref,links,heading,applyHeading,copyBlock,pasteBlock,applyPaste,formControls,applyForm};
})();
