'use strict';

/* SEO stays in the authenticated page draft as one undoable operation. */
const StudioSeo = (() => {
  const limits=Object.freeze({title:160,description:360,canonical:1200,socialTitle:160,socialDescription:360,socialImage:600,business:20,robots:20});
  const keys=Object.keys(limits);
  function normalize(input){
    if(!input||typeof input!=='object'||Array.isArray(input))return null;
    const out={};
    for(const key of keys){
      const source=input[key]??'';
      if(typeof source!=='string')return null;
      const value=source.trim().replace(/\s+/g,' ');
      if(value.length>limits[key]||/[\u0000-\u001f\u007f]/.test(value))return null;
      out[key]=value;
    }
    if(out.socialImage&&!/^(?:\/Newcitywellness)?\/images\/[a-z0-9_/%.-]+\.(?:png|jpg|jpeg|webp|avif)$/i.test(out.socialImage))return null;
    if(out.socialImage&&(out.socialImage.includes('..')||/%(?:2f|5c|00)/i.test(out.socialImage)))return null;
    if(out.business&&!['medical','local'].includes(out.business))return null;
    if(out.robots&&!['index','noindex'].includes(out.robots))return null;
    if(out.canonical){
      if(!/^https:\/\//i.test(out.canonical)||/[\s\\#]/.test(out.canonical))return null;
      try{
        const url=new URL(out.canonical);
        if(!url.hostname||url.username||url.password)return null;
      }catch{return null;}
    }
    return out;
  }

  function fromOperations(operations){
    for(let i=operations.length-1;i>=0;i--){
      const op=operations[i];
      if(op?.kind!=='seo'||op.id!=='page-seo')continue;
      const value=normalize(op.value);
      if(value)return value;
    }
    return normalize({});
  }
  return Object.freeze({limits,normalize,fromOperations});
})();
