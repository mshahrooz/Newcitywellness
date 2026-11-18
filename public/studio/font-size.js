'use strict';

const StudioFontSize=(()=>{
  const devices=['desktop','tablet','mobile'];
  const label=device=>device[0].toUpperCase()+device.slice(1);
  const property=device=>'--bs-font-'+device;
  const read=(node,device)=>node.style.getPropertyValue(property(device));
  const readLegacy=(node,device)=>node.getAttribute('data-bs-responsive-'+device)?.split(/\s+/).includes('font');
  function write(node,device,px){
    if(px==='')node.style.removeProperty(property(device));
    else node.style.setProperty(property(device),px+'px');
  }
  function target(n){
    if(n.matches('[data-bs-row],[data-bs-zone],[data-bs-column]'))return null;
    if(['image','captioned','spacer','divider','video','youtube','embed'].includes(n.dataset.bsKind))return null;
    return StudioText.available(n)?StudioText.root(n):content(n);
  }
  function apply(n,op){
    const d=op.device, raw=op.value;
    if(!devices.includes(d)||!['string','number'].includes(typeof raw))return false;
    const px=raw===''?'':Number(raw);
    if(raw!==''&&(!Number.isInteger(px)||px<10||px>96))return false;
    const node=target(n);
    if(!node)return false;
    // A whole-element change replaces size overrides inside this element for
    // this device only. Preserve older shared inline sizes on other devices.
    const children=node.querySelectorAll(':is(span,a,strong,em,b,i,small,cite,builder-copy,li)[style]');
    for(const el of [node,...children]){
      const legacy=el.style.fontSize;
      if(/^\d+(?:\.\d+)?px$/.test(legacy)){
        for(const other of devices){
          if(other!==d&&!read(el,other)&&!readLegacy(el,other))write(el,other,parseFloat(legacy));
        }
        el.style.removeProperty('font-size');
      }
      const marker='data-bs-responsive-'+d;
      if(readLegacy(el,d)){
        const remaining=el.getAttribute(marker).split(/\s+/).filter(k=>k&&k!=='font');
        if(remaining.length)el.setAttribute(marker,remaining.join(' '));
        else el.removeAttribute(marker);
        el.style.removeProperty('--bs-device-'+d+'-font');
      }
      write(el,d,el===node?px:'');
    }
    return true;
  }
  function applySelection(root,range,device,px){
    if(!devices.includes(device)||!Number.isInteger(px)||px<10||px>96||range.collapsed||
      !root.contains(range.startContainer)||!root.contains(range.endContainer))return false;
    const doc=root.ownerDocument, walker=doc.createTreeWalker(root,4), chunks=[];
    for(let node=walker.nextNode();node;node=walker.nextNode()){
      if(!node.length||!range.intersectsNode(node))continue;
      const start=range.startContainer===node?range.startOffset:0;
      const end=range.endContainer===node?range.endOffset:node.length;
      if(start<end)chunks.push({node,start,end});
    }
    let first=null,last=null;
    for(const {node,start,end} of chunks){
      const parent=node.parentElement;
      // Reuse a span for a full run. A partial run stays nested so the
      // unselected text and the sizes on other devices keep their styles.
      if(parent!==root&&parent.localName==='span'&&parent.childNodes.length===1&&start===0&&end===node.length){
        write(parent,device,px);
        first??=node;last=node;continue;
      }
      if(end<node.length)node.splitText(end);
      const selected=start?node.splitText(start):node;
      const span=doc.createElement('span');
      write(span,device,px);
      selected.replaceWith(span);span.append(selected);
      first??=selected;last=selected;
    }
    if(!first)return false;
    const result=doc.createRange();
    result.setStart(first,0);result.setEnd(last,last.length);
    const selection=doc.getSelection();selection.removeAllRanges();selection.addRange(result);
    return true;
  }
  function controls(n){
    const node=target(n), d=view;
    if(!node)return;
    const title=label(d), token=Symbol();
    const field=create('fieldset',{class:'device-font-fields'});
    field.append(create('legend',{},'Font size · '+title));
    const size=read(node,d);
    const control=input(field,'Size (px)',size?parseFloat(size):'',{type:'number',min:10,max:96,step:1,placeholder:'Default'},x=>{
      if(x.validity.valid)record({kind:'font-size',device:d,id:idOf(n),value:x.value},token);
    });
    button(field,'Use default on '+title,()=>{
      if(record({kind:'font-size',device:d,id:idOf(n),value:''})){
        control.value='';flash(title+' text size reset.');
      }
    });
    body.append(field);
  }
  return {apply,applySelection,controls,label};
})();
