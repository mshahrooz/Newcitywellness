/* Canonical, sandboxed embeds. Also bundled with the publisher's validation module. */
((root) => {
  'use strict';
  const YOUTUBE_SANDBOX='allow-scripts allow-same-origin allow-presentation';
  const REMOTE_SANDBOX='allow-scripts allow-forms allow-presentation';
  const HTML_SANDBOX='allow-scripts';
  const ALLOW='encrypted-media; fullscreen; picture-in-picture';
  const REFERRER='strict-origin-when-cross-origin';
  const ID=/^[A-Za-z0-9_-]{11}$/;
  const isSafeUrlValue=value=>typeof value==='string'&&value.length<=4096&&!/[\u0000-\u0020\u007f\\]/.test(value);
  function remoteUrl(value){
    if(!isSafeUrlValue(value)||!/^https:\/\//i.test(value))return null;
    try{
      const url=new URL(value);
      return url.protocol==='https:'&&!url.username&&!url.password&&url.port!=='0'?url:null;
    }catch{return null;}
  }
  function startSeconds(value){
    if(/^\d{1,6}$/.test(value||''))return Number(value);
    const time=(value||'').match(/^(?:(\d{1,3})h)?(?:(\d{1,4})m)?(?:(\d{1,6})s)?$/);
    return time?Math.min(999999,(Number(time[1])||0)*3600+(Number(time[2])||0)*60+(Number(time[3])||0)):0;
  }
  function youtube(value){
    if(typeof value!=='string')return null;
    const url=remoteUrl(value.trim());
    if(!url||url.port)return null;
    const host=url.hostname;
    const paths=url.pathname.split('/').filter(Boolean);
    let id;
    if(host==='youtu.be'&&paths.length===1)id=paths[0];
    else if(['www.youtube.com','youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)){
      if(url.pathname==='/watch')id=url.searchParams.get('v');
      else if(paths.length===2&&['shorts','live','embed'].includes(paths[0]))id=paths[1];
    }
    if(!id||!ID.test(id))return null;
    const start=startSeconds(url.searchParams.get('start')||url.searchParams.get('t')||new URLSearchParams(url.hash.slice(1)).get('t'));
    return 'https://www.youtube-nocookie.com/embed/'+id+(start?'?start='+start:'');
  }
  const htmlSource=/^data:text\/html;charset=utf-8;base64,[A-Za-z0-9+/]+={0,2}$/;
  const youtubeSource=/^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}(?:\?start=[1-9][0-9]{0,5})?$/;
  function safeFrame(get){
    const type=get('data-ncw-embed'), src=get('src'), box=get('sandbox'), title=get('title');
    if(typeof title!=='string'||!title.trim()||title.length>160||get('referrerpolicy')!==REFERRER||get('allow')!==ALLOW)return false;
    if(type==='youtube')return box===YOUTUBE_SANDBOX&&youtubeSource.test(src||'');
    if(type==='remote')return box===REMOTE_SANDBOX&&!!remoteUrl(src);
    if(type==='html')return box===HTML_SANDBOX&&typeof src==='string'&&src.length<=125000&&htmlSource.test(src);
    return false;
  }
  function getSpec(kind, input, doc){
    const value=typeof input==='string'?input.trim():'';
    if(!value||value.length>30000)return null;
    if(kind==='youtube'){
      const src=youtube(value);
      return src?{type:'youtube',src,sandbox:YOUTUBE_SANDBOX,title:'YouTube video'}:null;
    }
    let src=remoteUrl(value), title='Embedded content';
    if(!src&&/^<iframe(?:\s|>)/i.test(value)){
      // Parse in a template so pasted code cannot execute in the editor document.
      const template=doc.createElement('template');
      template.innerHTML=value;
      const node=template.content.firstElementChild;
      if(node?.localName==='iframe'&&template.content.children.length===1&&!node.hasAttribute('srcdoc')){
        src=remoteUrl(node.getAttribute('src'));
        title=node.getAttribute('title')?.trim().slice(0,160)||title;
      }
    }
    if(src){
      const video=youtube(src.href);
      if(video)return {type:'youtube',src:video,sandbox:YOUTUBE_SANDBOX,title:title==='Embedded content'?'YouTube video':title};
      return {type:'remote',src:src.href,sandbox:REMOTE_SANDBOX,title};
    }
    if(!/^</.test(value))return null;
    const bytes=new TextEncoder().encode(value);
    let binary='';
    for(let i=0;i<bytes.length;i+=4096)binary+=String.fromCharCode(...bytes.subarray(i,i+4096));
    return {type:'html',src:'data:text/html;charset=utf-8;base64,'+btoa(binary),sandbox:HTML_SANDBOX,title};
  }
  root.StudioEmbeds=Object.freeze({youtube,remoteUrl,safeFrame,getSpec,REFERRER,ALLOW});
})(globalThis);
