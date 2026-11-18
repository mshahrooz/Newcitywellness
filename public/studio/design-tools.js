'use strict';
const StudioDesign=(()=>{
  const palette=['#1c5b42','#245440','#cfaa67','#f5f0e7','#ffffff','#172b23','#646b60'];
  const presets={services:['Services grid','','Three editable services','Section presets'],faq:['FAQ section','','Two editable questions','Section presets'],reviews:['Testimonials section','','An editable testimonial layout','Section presets'],cta:['Call to action','','Heading, description and button','Section presets'],hours:['Hours section','','An editable opening-hours list','Section presets'],booking:['Book Appointment','','Uses the clinic booking link','Section presets']};
  const accent='https://acusimple.com/bookings/8635';
  const styles={
    'font-weight':{label:'Font weight',options:['400','500','600','700','800']},
    'line-height':{label:'Line height',lo:1,hi:3},
    'background-color':{label:'Background',color:true},
    'border-radius':{label:'Corner radius (px)',lo:0,hi:96,unit:'px'},
  };
  const hex=/^#[\da-f]{6}$/i;
  function style(n,e,op){
    const f=styles[op.prop];
    if(!f)return false;
    const target=['border-radius','background-color'].includes(op.prop)?n:e;
    if(!target?.style)return false;
    if(op.value===''){target.style.removeProperty(op.prop);return true;}
    if(f.options&&!f.options.includes(op.value)||f.color&&!hex.test(op.value))return false;
    let value=op.value;
    if(!f.options&&!f.color){
      const number=Number(value);
      if(!Number.isFinite(number)||number<f.lo||number>f.hi)return false;
      value=number+(f.unit||'');
    }
    target.style.setProperty(op.prop,value);return true;
  }
  const sizes={S:14,M:18,L:26,XL:38};
  function c(rgb){
    return rgb.split(',').map(Number).slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((r,x,i)=>r+x*[.2126,.7152,.0722][i],0);
  }
  function contrast(f,b){const [a,z]=[c(f),c(b)].sort((a,b)=>b-a);return (a+.05)/(z+.05);}
  function colorValues(value){
    if(hex.test(value))return value.slice(1).match(/.{2}/g).map(n=>parseInt(n,16)).join(',');
    const m=/^rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*([\d.]+))?\)$/.exec(value);
    return m&&(!m[4]||+m[4]===1)?m.slice(1,4).join(','):null;
  }
  function contrastMessage(n,e){
    const win=e.ownerDocument.defaultView, foreground=win.getComputedStyle(e);
    let bg='255,255,255';
    for(let x=e;x;x=x.parentElement){
      const s=win.getComputedStyle(x);
      if(s.backgroundImage!=='none'&&s.backgroundImage)return 'Contrast over a photo or gradient needs a visual check.';
      if(s.backgroundColor?.startsWith('rgba')&&s.backgroundColor!=='rgba(0, 0, 0, 0)'&&!colorValues(s.backgroundColor))return 'Contrast over a transparent tint needs a visual check.';
      const solid=colorValues(s.backgroundColor);
      if(solid){bg=solid;break;}
    }
    const fg=colorValues(foreground.color);
    if(!fg)return 'Contrast could not be measured for this color.';
    const ratio=contrast(fg,bg), px=parseFloat(foreground.fontSize), bold=Number(foreground.fontWeight)>=700;
    const min=px>=24||bold&&px>=18.67?3:4.5;
    return ratio<min?'Low contrast · '+ratio.toFixed(2)+':1 (needs '+min+':1 for this text size).':'Contrast · '+ratio.toFixed(2)+':1 on the current solid background.';
  }
  function controls(n,e,parent,readColor){
    if(!n?.style||!e?.style)return;
    const refresh=()=>{status.textContent=contrastMessage(n,e);};
    const status=create('p',{class:'contrast-status',role:'status'});
    const swatches=create('div',{class:'brand-swatches',role:'group','aria-label':'Brand text colors'});
    for(const value of palette){
      const b=button(swatches,'',()=>{if(record({kind:'text-color',id:idOf(n),value})){if(readColor)readColor.value=value;refresh();}},{'aria-label':'Text color '+value,title:value});
      b.style.backgroundColor=value;
    }
    const scale=create('div',{class:'chips',role:'group','aria-label':'Font size presets'});
    for(const [name,size] of Object.entries(sizes))button(scale,name,()=>{record({kind:'font-size',id:idOf(n),value:size});refresh();},{title:size+' px'});
    parent.append(swatches,scale);
    for(const [prop,f] of Object.entries(styles)){
      const source=['border-radius','background-color'].includes(prop)?n:e, old=source.style.getPropertyValue(prop);
      const set=value=>{if(record({kind:'brand-style',id:idOf(n),prop,value}))refresh();};
      if(f.options){
        const label=create('label',{},f.label), select=create('select');
        select.append(create('option',{value:''},'Original'));
        f.options.forEach(x=>select.append(create('option',{value:x},x)));
        select.value=old;label.append(select);parent.append(label);select.addEventListener('change',()=>set(select.value));
      }else{
        input(parent,f.label,old?f.color?old:parseFloat(old):'',f.color?{type:'text',placeholder:'#ffffff',maxlength:7}
          :{type:'number',min:f.lo,max:f.hi,step:f.unit?1:.05,placeholder:'Original'},x=>set(x.value),'change');
      }
    }
    parent.append(status);refresh();
    parent.addEventListener('input',refresh);
  }
  function make(kind,id){
    let serial=0;
    const node=(tag,copy='',attrs={})=>addNative(tag,{...attrs,...(copy?{'data-bs-id':id+'-p-'+(++serial),'data-bs-kind':tag==='a'?'button':/^h[1-6]$/.test(tag)?'title':'text','data-bs-native-copy':''}:{})},copy);
    if(kind==='booking')return node('a','Book Appointment',{class:'btn',href:accent});
    if(!Object.hasOwn(presets,kind))return null;
    const section=node('div','',{class:'bs-preset bs-preset-'+kind});
    section.append(node('h2',({services:'Our Services',faq:'Frequently Asked Questions',reviews:'What Our Patients Say',cta:'Ready to Book?',hours:'Clinic Hours'})[kind]));
    if(kind==='services'){
      const grid=node('div','',{class:'bs-preset-grid'});
      for(const [title,desc,link] of [['Acupuncture','Traditional acupuncture tailored to your visit.','/services/acupuncture/'],['Chinese Herbal Medicine','Learn about our guided herbal care.','/services/chinese-herbal-medicine/'],['Cupping','Explore cupping and what to expect.','/services/cupping/']]){
        const card=node('article');card.append(node('h3',title),node('p',desc),node('a','Learn More',{class:'btn',href:StudioDesign.local(link)}));grid.append(card);
      }
      section.append(grid);
    }
    if(kind==='faq')for(const [q,a] of [['How do I book?','Use the booking button or call the clinic.'],['What should I bring?','Contact the clinic before your first visit for details.']]){
      const box=node('details');box.append(node('summary',q),node('p',a));section.append(box);
    }
    if(kind==='reviews')section.append(node('p','Add a verified patient testimonial here. Obtain consent before publishing.'));
    if(kind==='cta')section.append(node('p','Schedule your visit online.'),node('a','Book Appointment',{class:'btn',href:accent}));
    if(kind==='hours'){
      const group=node('dl');
      for(const [day,time] of [['Sunday – Thursday','9:00 am – 9:00 pm'],['Friday','9:00 am – 2:00 pm'],['Saturday','Closed']])group.append(node('dt',day),node('dd',time));
      section.append(group);
    }
    return section;
  }
  const local=url=>new URL('../',location.href).pathname.replace(/\/$/,'')+url;
  function settingsTabs(){
    if(body.querySelector('.studio-settings-tabs')||!['ELEMENT SETTINGS','SECTION SETTINGS','ROW / COLUMN','CARD SETTINGS'].includes($('popup-type').textContent))return;
    const groups=['Content','Style','Layout','Advanced'];
    const source=[...body.children];
    const map=new Map(groups.map(name=>[name,create('div',{class:'studio-settings-tab',role:'tabpanel','aria-label':name,hidden:''})]));
    function category(el){
      const label=el.matches('label,fieldset,details')?(el.firstChild?.textContent||''):'';
      if(el.matches('.responsive-fields')||/Padding|Alignment|spacing|Column|Minimum height/.test(label))return 'Layout';
      if(/appearance|Background|Overlay|color|Font|height|radius/i.test(label))return 'Style';
      if(el.classList.contains('actions'))return 'Advanced';
      return 'Content';
    }
    for(const el of source)map.get(category(el)).append(el);
    const tabs=create('div',{class:'studio-settings-tabs',role:'tablist','aria-label':'Element settings'});
    const buttons=new Map();
    function show(name){
      for(const [key,panel] of map){panel.hidden=key!==name;buttons.get(key).setAttribute('aria-selected',String(key===name));buttons.get(key).tabIndex=key===name?0:-1;}
      adjustPopup(now());
    }
    for(const [name,panel] of map){
      if(!panel.childElementCount){map.delete(name);continue;}
      panel.id='studio-panel-'+name.toLowerCase();
      const b=button(tabs,name,()=>show(name),{role:'tab','aria-controls':panel.id});buttons.set(name,b);
    }
    if(map.size<2){body.append(...(map.values().next().value?.children||[]));return;}
    tabs.addEventListener('keydown',event=>{
      const names=[...buttons.keys()], index=[...buttons.values()].indexOf(document.activeElement);
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)||index<0)return;
      const j=event.key==='Home'?0:event.key==='End'?names.length-1:(index+(event.key==='ArrowRight'?1:-1)+names.length)%names.length;
      event.preventDefault();show(names[j]);buttons.get(names[j]).focus();
    });
    body.prepend(tabs);for(const panel of map.values())body.append(panel);
    const first=map.keys().next().value;show(first);
  }
  function breadcrumb(n){
    const bar=$('selection-trail');if(!bar)return;
    bar.replaceChildren();
    const items=[];
    for(let node=n?.parentElement;node;node=node.parentElement){
      if(!node.hasAttribute('data-bs-id'))continue;
      if(node.hasAttribute('data-bs-row')||node.hasAttribute('data-bs-column')||node.hasAttribute('data-bs-zone')||StudioFlow.cardOf(node)===node)items.unshift(node);
    }
    for(const item of items.slice(-3))button(bar,(item.dataset.bsLabel||titleOf(item)).slice(0,33)+' ›',()=>choose(item));
    if(n)bar.append(create('span',{},titleOf(n)));
    bar.hidden=items.length===0;
  }
  function snap(n,rect){
    const siblings=[...n.parentElement.children].filter(x=>x!==n&&!x.matches('[hidden],template,script,style')&&x.getBoundingClientRect().width>5).slice(0,40);
    if(!siblings.length)return rect;
    const peers=siblings.map(s=>s.getBoundingClientRect());
    const pick=(start,size,a,b)=>{
      let best=null;
      for(const peer of peers)for(const dest of [peer[a],peer[b],(peer[a]+peer[b])/2])
        for(const edge of [0,size/2,size]){
          const delta=dest-start-edge;
          if(Math.abs(delta)<7&&(!best||Math.abs(delta)<Math.abs(best.delta)))best={pos:dest,delta};
        }
      return best;
    };
    const x=pick(rect.left,rect.width,'left','right'),y=pick(rect.top,rect.height,'top','bottom');
    return {...rect,left:rect.left+(x?.delta||0),top:rect.top+(y?.delta||0),xGuide:x?.pos,yGuide:y?.pos};
  }
  function guides(position){
    const frameBox=frame.getBoundingClientRect();
    for(const [id,at,styles] of [['smart-x',position?.xGuide,{top:frameBox.top+'px',left:(frameBox.left+position?.xGuide)+'px',width:'1px',height:frameBox.height+'px'}],
      ['smart-y',position?.yGuide,{left:frameBox.left+'px',top:(frameBox.top+position?.yGuide)+'px',height:'1px',width:frameBox.width+'px'}]]){
      const el=$(id);if(!el)continue;
      el.hidden=!Number.isFinite(at);
      if(!el.hidden)Object.assign(el.style,styles);
    }
  }
  function alignFree(n,device,direction){
    const shell=freeShell(n), layer=shell?.parentElement;
    if(!layer)return false;
    const peers=[...layer.children].map(x=>({node:x.firstElementChild,p:coords(x,device)})).filter(x=>x.node&&x.p);
    if(peers.length<3)return false;
    const axis=direction==='horizontal'?'x':'y',size=axis==='x'?'w':'h';
    peers.sort((a,b)=>a.p[axis]-b.p[axis]);
    const start=peers[0].p[axis], end=peers.at(-1).p[axis]+peers.at(-1).p[size];
    const gap=(end-start-peers.reduce((r,x)=>r+x.p[size],0))/(peers.length-1);
    if(gap<0){flash('Move the items farther apart before distributing.');return false;}
    let next=start;
    const items=peers.map(({node,p})=>{const at=next;next+=p[size]+gap;return {id:idOf(node),p:{...p,[axis]:at}};});
    return record({kind:'distribute-free',id:idOf(n),device,items});
  }
  function distribute(n,op){
    const layer=freeShell(n)?.parentElement;
    if(!layer||!['desktop','tablet','mobile'].includes(op.device)||!Array.isArray(op.items)||op.items.length>80||op.items.length<3)return false;
    const safe=op.items.map(({id,p})=>[freeShell(byId(id)),normalizeGrid(p||{})]);
    if(safe.some(([shell])=>shell?.parentElement!==layer))return false;
    for(const [shell,p] of safe)writeCoords(shell,op.device,p);
    syncGridSize(layer);return true;
  }
  return {style,controls,make,presets,local,contrast,settingsTabs,breadcrumb,snap,guides,alignFree,distribute};
})();
