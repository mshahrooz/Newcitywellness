'use strict';

// Rich-text operations live in the same draft as the existing Studio edits.
const StudioInline=(()=>{
  const LIMIT=40000;
  const tags=new Set('a strong em span br small builder-copy cite'.split(' '));
  const drop=new Set('script style svg math iframe object template img input button video audio'.split(' '));
  const inlineAttrs=new Set('id class title lang dir aria-hidden data-builder-copy data-builder-shared data-bs-id data-bs-kind data-bs-native-copy data-bs-copy-only data-bs-generated'.split(' '));
  const badStyle=/(?:url\s*\(|expression\s*\(|@import|javascript\s*:|[\\<>])/i;
  const svgNS='http://www.w3.org/2000/svg';
  const icons={
    bold:'M7 4h6a4 4 0 0 1 0 8H7zm0 8h7a4 4 0 0 1 0 8H7z',
    italic:'M10 4h9M5 20h9M15 4 9 20',
    underline:'M6 4v7a6 6 0 0 0 12 0V4M4 21h16',
    link:'m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
    color:'M4 17 10 4h2l6 13M6 13h10M3 21h18',
    size:'M3 6h12M9 6v14m7-10h5m-2.5 0v10M6 20h6',
    left:'M4 5h16M4 10h10M4 15h16M4 20h10',
    center:'M4 5h16M7 10h10M4 15h16M7 20h10',
    right:'M4 5h16M10 10h10M4 15h16M10 20h10',
    justify:'M4 5h16M4 10h16M4 15h16M4 20h16',
    check:'m5 12 4 4 10-10',close:'m6 6 12 12M18 6 6 18'
  };
  const alignments=['left','center','right','justify'];
  const palette=['#172238','#3756ff','#154637','#8b3f23','#b6204f','#165f88','#52388d','#ffffff'];
  function icon(name){
    const doc=document, svg=doc.createElementNS(svgNS,'svg'), path=doc.createElementNS(svgNS,'path');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('focusable','false');
    path.setAttribute('d',icons[name]);
    svg.append(path);
    return svg;
  }
  function iconButton(parent,name,glyph,handler,attrs={}){
    const control=button(parent,'',handler,{class:'inline-icon','aria-label':name,title:name,...attrs});
    control.append(icon(glyph));
    return control;
  }
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
      const sourceTag=node.localName;
      const tag=({b:'strong',i:'em',u:'span',font:'span'})[sourceTag]||sourceTag;
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
      if(sourceTag==='u')next.style.textDecorationLine='underline';
      if(sourceTag==='font'){
        const color=node.getAttribute('color')||'';
        if(/^#[0-9a-f]{6}$/i.test(color))next.style.color=color;
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
  function alignmentFor(node){
    const semantic='h1,h2,h3,h4,h5,h6,p,summary,blockquote,figcaption,li,dt,dd';
    const block=node?.closest(semantic)|| (node?.matches('div,button')?node:null);
    return block&&!block.matches('[data-bs-row],[data-bs-column],[data-bs-zone]')?block:null;
  }
  function apply(n,op){
    const node=rootFor(n);
    if(!node)return false;
    const block=alignmentFor(node), hasText=op.value!==undefined;
    if(op.align!==undefined&&(!block||!alignments.includes(op.align)))return false;
    const clean=hasText?sanitize(node.ownerDocument,op.value,!!node.closest('a,button')):null;
    if(hasText&&!clean||!hasText&&op.align===undefined)return false;
    if(clean)node.replaceChildren(...clean.childNodes);
    if(op.align!==undefined)block.style.textAlign=op.align;
    return true;
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
    const {node,target,toolbar,before,previousEditable,block,previousAlign,priority,align,stop}=edit, changed=node.innerHTML!==before;
    const clean=commit&&changed?sanitize(node.ownerDocument,node.innerHTML,!!node.closest('a,button')):null;
    if(commit&&changed&&!clean){flash('This edit is too long or complex. Shorten it or press Esc to cancel.');return false;}
    edit=null;stop();toolbar.remove();node.classList.remove('bs-inline-editing');
    if(previousEditable===null)node.removeAttribute('contenteditable');else node.setAttribute('contenteditable',previousEditable);
    if(changed)node.innerHTML=before;
    if(align!==null)block.style.setProperty('text-align',previousAlign,priority);
    if(commit&&(clean&&clean.innerHTML!==before||align!==null&&align!==previousAlign)){
      const op={kind:'rich-text',id:idOf(target)};
      if(clean&&clean.innerHTML!==before)op.value=clean.innerHTML;
      if(align!==null&&align!==previousAlign)op.align=align;
      record(op);
    }
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
    const block=alignmentFor(node), previousAlign=block?.style.getPropertyValue('text-align')||'', priority=block?.style.getPropertyPriority('text-align')||'';
    edit={node,target:n,toolbar,before,previousEditable,block,previousAlign,priority,align:null,stop:()=>handlers.forEach(stop=>stop())};
    close();active=idOf(n);node.classList.add('bs-inline-editing');node.setAttribute('contenteditable','true');
    let box=null, owner=null;
    const tools=create('div',{class:'inline-main-tools'});
    toolbar.append(tools);
    const selected=()=>{
      const sel=doc.getSelection();
      return sel?.rangeCount&&!sel.isCollapsed&&contains(sel.anchorNode)&&contains(sel.focusNode)?sel.getRangeAt(0).cloneRange():null;
    };
    const selectionOrHint=()=>{
      const range=selected();
      if(!range)flash('Select the text you want to format first.');
      return range;
    };
    const restore=range=>{
      if(!range||!contains(range.startContainer)||!contains(range.endContainer))return false;
      node.focus({preventScroll:true});
      const sel=doc.getSelection();sel.removeAllRanges();sel.addRange(range);return true;
    };
    const dismiss=()=>{
      box?.remove();owner?.setAttribute('aria-expanded','false');
      box=null;owner=null;position();
    };
    const expand=(control,label,render)=>{
      if(owner===control){dismiss();return;}
      const range=label==='Text alignment'?null:selectionOrHint();
      if(label!=='Text alignment'&&!range)return;
      dismiss();
      owner=control;owner.setAttribute('aria-expanded','true');
      box=create('section',{class:'inline-option-panel','aria-label':label});
      box.append(create('small',{class:'inline-option-title'},label));
      toolbar.append(box);render(box,range);position();
    };
    const preserve=control=>{
      control.addEventListener('pointerdown',e=>e.preventDefault());
      return control;
    };
    const marks=[];
    const paintMarks=()=>{
      for(const [control,command] of marks)control.setAttribute('aria-pressed',String(!!doc.queryCommandState?.(command)));
    };
    for(const [label,command] of [['Bold','bold'],['Italic','italic'],['Underline','underline']]){
      const control=preserve(iconButton(tools,label,command,()=>{
        const range=selectionOrHint();
        if(range&&restore(range)){dismiss();doc.execCommand('styleWithCSS',false,false);doc.execCommand(command,false);paintMarks();}
      },{'aria-pressed':'false'}));
      marks.push([control,command]);
    }
    watch(doc,'selectionchange',()=>{if(contains(doc.getSelection()?.anchorNode))paintMarks();});
    const option=(label,glyph,render)=>preserve(iconButton(tools,label,glyph,e=>expand(e.currentTarget,label,render),{'aria-expanded':'false'}));
    const link=option('Link','link',(panel,range)=>{
      const fields=create('div',{class:'inline-option-fields'});panel.append(fields);
      const existing=range.startContainer.parentElement?.closest('a[href]');
      const address=input(fields,'Link URL',existing?.getAttribute('href')||'',{placeholder:'https://…',maxlength:4096},el=>el.setCustomValidity(''));
      const set=()=>{
        const value=address.value.trim();
        if(!validLink(value)){address.setCustomValidity('Enter a valid link address.');address.reportValidity();return;}
        if(restore(range)){doc.execCommand('createLink',false,value);dismiss();}
      };
      button(fields,'Apply link',set);
      address.focus();address.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();set();}});
    });
    link.disabled=!!node.closest('a,button');
    tools.append(create('span',{class:'inline-separator','aria-hidden':'true'}));
    option('Text color','color',(panel,range)=>{
      const chooseColor=value=>{
        if(!/^#[0-9a-f]{6}$/i.test(value)||!restore(range))return;
        doc.execCommand('styleWithCSS',false,true);
        try{doc.execCommand('foreColor',false,value);}
        finally{doc.execCommand('styleWithCSS',false,false);}
        dismiss();
      };
      const swatches=create('div',{class:'inline-swatches'});
      for(const color of palette){
        const control=button(swatches,'',()=>chooseColor(color),{title:color,'aria-label':'Use color '+color});
        control.style.setProperty('--swatch',color);
      }
      panel.append(swatches);
      const fields=create('div',{class:'inline-option-fields'});panel.append(fields);
      const custom=input(fields,'Custom color',palette[0],{type:'color'},()=>{});
      button(fields,'Apply color',()=>chooseColor(custom.value));
    });
    option('Text size','size',(panel,range)=>{
      const device=view;
      panel.append(create('p',{class:'muted'},'Only applies on '+StudioFontSize.label(device)+'.'));
      const set=size=>{
        const px=Number(size);
        if(!Number.isInteger(px)||px<10||px>96||!restore(range))return;
        if(StudioFontSize.applySelection(node,range,device,px))dismiss();
      };
      const sizes=create('div',{class:'inline-sizes'});
      for(const size of [12,14,16,18,20,24,28,32,40])button(sizes,String(size),()=>set(size),{'aria-label':'Set text size to '+size+' pixels'});
      panel.append(sizes);
      const fields=create('div',{class:'inline-option-fields'});panel.append(fields);
      const initial=Math.max(10,Math.min(96,Math.round(parseFloat(doc.defaultView.getComputedStyle(node).fontSize)||16)));
      const custom=input(fields,'Size in pixels',initial,{type:'number',min:10,max:96,step:1},()=>{});
      const applySize=()=>{if(custom.checkValidity()&&custom.value)set(custom.value);else custom.reportValidity();};
      button(fields,'Apply size',applySize);
      custom.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applySize();}});
    });
    option('Text alignment','left',panel=>{
      const row=create('div',{class:'inline-alignments'});
      const current=doc.defaultView.getComputedStyle(block).textAlign;
      for(const side of alignments){
        const label=side==='center'?'Center text':side==='justify'?'Justify text':'Align text '+side;
        iconButton(row,label,side,()=>{
          block.style.textAlign=side;edit.align=side;dismiss();
        },{'aria-pressed':String(current===side||current==='start'&&side==='left'||current==='end'&&side==='right')});
      }
      panel.append(row);
    }).disabled=!block;
    tools.append(create('span',{class:'inline-separator','aria-hidden':'true'}));
    iconButton(tools,'Done','check',()=>finish(),{class:'inline-icon inline-done'});
    iconButton(tools,'Cancel','close',()=>finish(false),{class:'inline-icon inline-cancel'});
    document.body.append(toolbar);
    const keys=e=>{
      if(e.key==='Escape'||e.key==='Enter'&&(e.ctrlKey||e.metaKey)){
        e.stopPropagation();e.preventDefault();
        if(e.key==='Escape'&&box){dismiss();node.focus({preventScroll:true});return;}
        finish(e.key!=='Escape');
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
  return {apply,start,finish,running,contains,inToolbar,position,supports:n=>!!rootFor(n),canAlign:n=>!!alignmentFor(rootFor(n))};
})();
