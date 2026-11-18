'use strict';
/* Responsive overrides are separate from shared content and the native page layout. */
const StudioDeviceLayout=(()=>{
  const devices=['tablet','mobile'];
  const fields={
    width:{label:'Width (%)',min:15,max:100,unit:'%'},
    height:{label:'Minimum height (px)',min:0,max:12000,unit:'px'},
    font:{label:'Text size (px)',min:10,max:96,unit:'px'},
    align:{label:'Alignment',options:['left','center','right']},
    'pad-top':{label:'Top',min:0,max:220,unit:'px'},
    'pad-right':{label:'Right',min:0,max:220,unit:'px'},
    'pad-bottom':{label:'Bottom',min:0,max:220,unit:'px'},
    'pad-left':{label:'Left',min:0,max:220,unit:'px'},
  };
  const property=(d,k)=>'--bs-device-'+d+'-'+k;
  const marker=d=>'data-bs-responsive-'+d;
  const name=d=>d==='tablet'?'Tablet':'Mobile';
  function values(op){
    if(!devices.includes(op.device)||!op.value||typeof op.value!=='object')return null;
    const out={};
    for(const [k,value] of Object.entries(op.value)){
      if(!Object.hasOwn(fields,k))return null;
      const f=fields[k];
      if(f.options){
        if(!f.options.includes(value))return null;
        out[k]=value;continue;
      }
      if((typeof value!=='number'&&typeof value!=='string')||value===''||!Number.isFinite(Number(value)))return null;
      out[k]=Math.round(Math.min(f.max,Math.max(f.min,Number(value))))+f.unit;
    }
    return out;
  }
  function nodes(n){
    const row=n.hasAttribute('data-bs-row'), item=row?(surfaceOf(n)||n):n;
    const text=row?item:(content(n)||item);
    return {item,text,row};
  }
  function apply(n,op){
    const v=values(op);
    if(!v)return false;
    const {item,text,row}=nodes(n), d=op.device, keys=Object.keys(v).filter(k=>!row||!['width','font','align'].includes(k));
    // Mark only the properties actually set; untouched properties keep the native/desktop cascade.
    for(const el of new Set([item,text])){
      const own=keys.filter(k=>el===(k==='font'||k==='align'?text:item));
      if(own.length)el.setAttribute(marker(d),own.join(' '));
      else el.removeAttribute(marker(d));
      for(const k of Object.keys(fields))el.style.removeProperty(property(d,k));
    }
    for(const k of keys){
      (k==='font'||k==='align'?text:item).style.setProperty(property(d,k),v[k]);
    }
    return true;
  }
  function controls(n){
    const d=view;
    if(!devices.includes(d))return;
    const {item,text,row}=nodes(n);
    const canFont=!row&&!['image','captioned','divider','spacer','video','youtube','embed'].includes(n.dataset.bsKind), canAlign=!row&&!['image','video','youtube','embed','spacer','divider'].includes(n.dataset.bsKind);
    const box=create('details',{class:'look responsive-fields',open:''});
    box.append(create('summary',{},name(d)+' layout overrides'));
    box.append(create('p',{class:'muted'},'Blank fields follow the shared layout. Text, images and element order are shared on every device.'));
    body.append(box);
    const sizing=create('div',{class:'responsive-sizes'});
    const spacing=create('div',{class:'pad'});
    const alignment=create('label',{},'Alignment');
    const select=create('select');
    alignment.append(select);
    select.append(create('option',{value:''},'Follow shared layout'));
    const previous={};
    const read=k=>(k==='font'||k==='align'?text:item).style.getPropertyValue(property(d,k));
    const measurements={};
    const sync=token=>{
      const v={};
      for(const [k,control] of Object.entries(measurements)){
        if(!control.validity.valid)return;
        if(control.value!=='')v[k]=control.value;
      }
      if(select.value)v.align=select.value;
      record({kind:'device-layout',id:idOf(n),device:d,value:v},token);
    };
    for(const [k,f] of Object.entries(fields)){
      if(k==='align'||row&&k==='width'||k==='font'&&!canFont)continue;
      const value=read(k), token=Symbol();
      if(value)previous[k]=value;
      measurements[k]=input(k.startsWith('pad-')?spacing:sizing,f.label,value?parseInt(value,10):'',
        {type:'number',min:f.min,max:f.max,step:1,placeholder:'Shared'},()=>sync(token));
    }
    for(const option of fields.align.options)select.append(create('option',{value:option},option[0].toUpperCase()+option.slice(1)));
    select.value=read('align');
    select.addEventListener('change',()=>sync());
    box.append(sizing);if(canAlign)box.append(alignment);
    box.append(create('p',{class:'responsive-spacing-label'},'Padding (px)'),spacing);
    button(box,'Reset to desktop',()=>{
      if(!Object.keys(previous).length&&!Object.values(measurements).some(x=>x.value)&&!select.value)return;
      Object.values(measurements).forEach(x=>{x.value='';});select.value='';sync();
      flash(name(d)+' overrides cleared.');
    });
  }
  return {apply,controls,values,markers:devices.map(marker)};
})();
