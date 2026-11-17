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
  // GitHub Pages cannot force Content-Disposition on arbitrary uploads. Keep
  // active formats (.html, .svg, .js, etc.) opaque to prevent same-origin code execution.
  const downloadExtensions=new Set('pdf doc docx xls xlsx ppt pptx txt csv tsv rtf odt ods odp epub zip rar 7z tar tgz gz bz2 xz md markdown json yaml yml log jpg jpeg png gif webp avif heic heif bmp tif tiff mp3 m4a wav ogg flac mp4 webm mov avi mkv webp psd ai dwg dxf stl obj blend eot ttf otf woff woff2'.split(' '));
  function storageName(name,digest){
    const hash=String(digest).slice(0,32);
    if(!/^[a-f0-9]{32}$/.test(hash))throw Error('Invalid document hash.');
    const original=filename(name);
    const extension=/\.([A-Za-z0-9]{1,12})$/.exec(original);
    if(!extension||!downloadExtensions.has(extension[1].toLowerCase()))return hash+'.bin';
    // Keep ordinary filenames (including spaces) at the end of their published URLs.
    // Normalize unsafe URL/path characters and stay under the ZIP entry-size limit.
    const suffix=extension[0];
    const stem=original.slice(0,-suffix.length).replace(/[^A-Za-z0-9 ._()-]/g,'_')
      .replace(/^\.+/,'_').trim().replace(/^[^A-Za-z0-9_]/,'_').slice(0,80-suffix.length).replace(/[ .]+$/,'')||'download';
    return hash+'/'+stem+suffix;
  }
  return Object.freeze({MAX_FILE,MIME,parse,filename,storageName});
})();
