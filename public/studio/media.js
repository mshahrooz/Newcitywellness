'use strict';
const StudioMedia=(()=>{
  const MAX_IMAGE=20*1024*1024, MAX_MEDIA=25*1024*1024;
  const DOCUMENTS='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv,.rtf';
  const TYPE={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',webp:'image/webp',avif:'image/avif',mp4:'video/mp4',webm:'video/webm'};
  const ascii=(b,i,n)=>String.fromCharCode(...b.slice(i,i+n));
  const equal=(b,x)=>x.every((y,i)=>b[i]===y);
  function matches(ext,b){
    switch(ext){
      case 'jpg':case 'jpeg':return equal(b,[255,216,255]);
      case 'png':return equal(b,[137,80,78,71,13,10,26,10]);
      case 'webp':return ascii(b,0,4)==='RIFF'&&ascii(b,8,4)==='WEBP';
      case 'avif':return ascii(b,4,4)==='ftyp'&&/(avif|avis)/.test(ascii(b,8,48));
      case 'gif':return /^GIF8[79]a$/.test(ascii(b,0,6));
      case 'mp4':return ascii(b,4,4)==='ftyp'&&!/(avif|avis|heic|heix)/.test(ascii(b,8,48));
      case 'webm':return equal(b,[26,69,223,163])&&/webm/.test(ascii(b,0,64));
      case 'pdf':return ascii(b,0,5)==='%PDF-';
      case 'doc':case 'xls':case 'ppt':return equal(b,[208,207,17,224,161,177,26,225]);
      case 'docx':case 'xlsx':case 'pptx':case 'odt':case 'ods':case 'odp':return equal(b,[80,75,3,4]);
      case 'rtf':return ascii(b,0,5)==='{\\rtf';
      case 'txt':case 'csv':return b.length>0&&!b.includes(0);
      default:return false;
    }
  }
  const ext=file=>file.name.split('.').at(-1).toLowerCase();
  function uri(bytes,mime){
    let binary='';
    for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return 'data:'+mime+';base64,'+btoa(binary);
  }
  const dataUrl=async(blob,mime=blob.type)=>uri(new Uint8Array(await blob.arrayBuffer()),mime);
  async function read(file,kind){
    const type=ext(file), limit=kind==='image'?MAX_IMAGE:kind==='video'?20*1024*1024:MAX_MEDIA;
    const allowed=kind==='document'?DOCUMENTS.split(',').includes('.'+type):TYPE[type]?.startsWith(kind+'/');
    if(!allowed||!file.size||file.size>limit)throw Error(kind==='document'?'Choose a supported PDF, Office, OpenDocument, text, or CSV file up to 25 MB.':kind==='image'?'Choose a JPEG, PNG, GIF, AVIF or WebP up to 20 MB.':'Choose an MP4 or WebM up to 20 MB.');
    if(!matches(type,new Uint8Array(await file.slice(0,64).arrayBuffer())))throw Error('The file contents do not match its extension.');
    if(kind!=='image')return {value:await dataUrl(file,kind==='document'?StudioDocuments.MIME:TYPE[type]),name:file.name};
    // Animation is retained for GIFs. Ordinary images get optimized WebP derivatives.
    if(type==='gif'){
      if(file.size>2*1024*1024)throw Error('Animated GIFs must be 2 MB or smaller.');
      return {value:await dataUrl(file,TYPE[type]),metadata:{}};
    }
    const image=await createImageBitmap(file);
    try{
      if(!image.width||!image.height||image.width*image.height>45000000)throw Error('Choose an image under 45 megapixels.');
      const max=Math.min(1800,image.width), widths=[...new Set([Math.min(480,max),Math.min(960,max),max])];
      const variants=[];
      for(const width of widths){
        const height=Math.max(1,Math.round(image.height*width/image.width)), canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        canvas.getContext('2d').drawImage(image,0,0,width,height);
        let shot;
        for(const quality of [.83,.72,.58]){
          shot=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
          if(shot?.type==='image/webp'&&shot.size<=2*1024*1024)break;
        }
        if(!shot||shot.type!=='image/webp'||shot.size>2*1024*1024)throw Error('This image could not be converted to a small WebP. Try a smaller file.');
        variants.push({value:await dataUrl(shot),width,height});
      }
      const last=variants.at(-1);
      return {value:last.value,metadata:{width:last.width,height:last.height,variants:variants.length>1?variants.map(({value,width})=>({value,width})):[]}};
    }finally{image.close();}
  }
  function load(file,kind,done){
    if(!file)return;
    void read(file,kind).then(out=>done(out.value,out.name,out.metadata)).catch(e=>flash(e.message));
  }
  function withImage(op,img,newImage){
    if(newImage&&op.width>0&&op.height>0){
      img.width=op.width;img.height=op.height;
    }
    if(Array.isArray(op.variants)&&op.variants.length>1&&op.variants.length<=5&&op.variants.every(x=>Number.isInteger(x.width)&&x.width>0&&x.width<=2200&&okayData(x.value,'image'))){
      img.setAttribute('srcset',op.variants.map(x=>x.value+' '+x.width+'w').join(', '));
      if(!img.hasAttribute('sizes'))img.setAttribute('sizes','(max-width: 700px) 100vw, '+Math.max(480,Math.min(1800,Number(op.width)||1200))+'px');
    }else {img.removeAttribute('srcset');img.removeAttribute('sizes');}
  }
  function parseSrcset(text){
    const list=[], token=/\s*((?:data:[^,\s]+,[a-z0-9+/]+={0,2})|[^,\s]+)(?:\s+([\d.]+[wx]))?\s*(?:,|$)/igy;
    let cursor=0;
    while(cursor<text.length){
      token.lastIndex=cursor;
      const m=token.exec(text);
      if(!m)throw Error('One responsive image has an invalid source list.');
      list.push([m[1],m[2]||'']);cursor=token.lastIndex;
    }
    return list;
  }
  function decode(value){
    const m=/^data:((?:image|video|application)\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})$/i.exec(value);
    if(!m||m[2].length>Math.ceil(MAX_MEDIA/3)*4+8)return null;
    const raw=atob(m[2]), bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return {type:m[1],bytes};
  }
  const hex=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const knownCloud=new Set();
  const tag='media:';
  const put=async(hash,bytes)=>draftStore('readwrite',s=>s.put(new Blob([bytes]),tag+hash));
  const get=async hash=>draftStore('readonly',s=>s.get(tag+hash)).catch(()=>null);
  async function convert(raw,cloud,fetching=false){
    const spec=JSON.parse(raw), nested=Array.isArray(spec);
    if(!fetching&&!window.indexedDB&&!cloud)return raw;
    const cache=new Map();
    async function replace(value){
      if(fetching){
        if(!value||typeof value!=='object'||!value.localMedia)return value;
        if(!/^[a-f0-9]{64}$/.test(value.localMedia)||!/^(?:image|video|application)\/[a-z0-9.+-]+$/i.test(value.mime))throw Error('This draft has an invalid media reference.');
        const hash=value.localMedia, key=hash+value.mime;
        if(!cache.has(key))cache.set(key,(async()=>{
          let file=await get(hash);
          if(!file&&cloud){
            const r=await StudioPublish.action('draft-asset-read',{hash},cloud,null,true);
            const bytes=await r.arrayBuffer();
            if(bytes.byteLength>MAX_MEDIA||await hex(bytes)!==hash)throw Error('A draft upload could not be verified.');
            if(window.indexedDB)await put(hash,bytes).catch(()=>null);
            file=new Blob([bytes]);
          }
          if(!file)throw Error('A draft upload is missing from browser storage.');
          return dataUrl(file,value.mime);
        })());
        return cache.get(key);
      }
      if(typeof value!=='string'||!value.startsWith('data:'))return value;
      if(!cache.has(value))cache.set(value,(async()=>{
        const decoded=decode(value);
        if(!decoded)return value;
        const hash=await hex(decoded.bytes), file=new Blob([decoded.bytes]);
        if(window.indexedDB&&!await get(hash)){
          try{await put(hash,decoded.bytes);}
          catch(e){if(!cloud)throw e;}
        }
        if(cloud){
          const key=(StudioWorkflow.account()||'')+':'+hash;
          if(!knownCloud.has(key)){
            await StudioPublish.action('draft-asset-write',{hash,bytes:file.size},cloud,file);
            knownCloud.add(key);
          }
        }
        return {localMedia:hash,mime:decoded.type};
      })());
      return cache.get(value);
    }
    async function transform(draft){
      if(!Array.isArray(draft.operations))return draft;
      for(const op of draft.operations){
        if(['image','file','video','section-bg'].includes(op.kind))op.value=await replace(op.value);
        if(op.kind==='image'&&Array.isArray(op.variants))for(const variant of op.variants)variant.value=await replace(variant.value);
      }
      return draft;
    }
    if(nested){for(const entry of spec)if(typeof entry.raw==='string')entry.raw=JSON.stringify(await transform(JSON.parse(entry.raw)));return JSON.stringify(spec);}
    return JSON.stringify(await transform(spec));
  }
  return {DOCUMENTS,MAX_IMAGE,load,read,matches,withImage,parseSrcset,externalize:(raw,cloud)=>convert(raw,cloud),hydrate:(raw,cloud)=>convert(raw,cloud,true)};
})();
