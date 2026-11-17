'use strict';
/* Download uploads are opaque bytes. PDF remains readable for previously saved drafts. */
const StudioDocuments=(()=>{
  const MAX_FILE=25*1024*1024, MIME='application/octet-stream';
  function parse(value){
    if(typeof value!=='string'||value.length>Math.ceil(MAX_FILE/3)*4+48)return null;
    const comma=value.indexOf(',');
    if(comma<0||!/^data:application\/(?:octet-stream|pdf);base64$/.test(value.slice(0,comma)))return null;
    const encoded=value.slice(comma+1);
    const padding=encoded.endsWith('==')?2:encoded.endsWith('=')?1:0;
    const length=encoded.length*.75-padding;
    if(encoded.length%4||length>MAX_FILE||/[^a-z0-9+/]/i.test(encoded.slice(0,encoded.length-padding)))return null;
    return {encoded,length,legacyPdf:value.startsWith('data:application/pdf;')};
  }
  function filename(name){
    return typeof name==='string'&&name.replace(/[\\/\x00-\x1f\x7f]/g,'_').trim().slice(0,180)||'download';
  }
  return Object.freeze({MAX_FILE,MIME,parse,filename});
})();
