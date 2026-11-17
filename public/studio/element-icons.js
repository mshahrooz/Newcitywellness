'use strict';

// Static stroke icons for the existing Classic Studio palette. These use
// the same visual language as the private builder without adding its runtime.
const StudioElementIcons = (() => {
  const shapes=Object.freeze({
    title: 'M4 6h16M12 6v12m-3 0h6M4 6v3m16-3v3',
    subheading: 'M4 7h14M11 7v10m-3 0h6M4 7v2m14-2v2M4 21h16',
    text: 'M4 6h16M4 10h13M4 14h16m-16 4h10',
    bullets: 'M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1',
    numbered: 'M9 6h12M9 12h12M9 18h12M3 4h1v4M3 11h2v2H3v2h2M3 17h2v4H3m0-2h2',
    quote: 'M5 6h5v6H6v3l-3 2v-4c0-2 1-5 2-7Zm11 0h5v6h-4v3l-3 2v-4c0-2 1-5 2-7Z',
    image: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm-1 13 5-5 3 3 3-4 5 6M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    captioned: 'M4 4h16v12H4V4Zm1 10 4-4 3 3 3-4 4 5M6 20h12',
    youtube: 'M7 5h10c2 0 4 1 4 3v8c0 2-2 3-4 3H7c-2 0-4-1-4-3V8c0-2 2-3 4-3Zm3 3 6 4-6 4V8Z',
    embed: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14',
    video: 'M4 5h16v14H4V5Zm5 3 7 4-7 4V8ZM6 3v2m4-2v2m4-2v2m4-2v2',
    button: 'M6 7h12a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Zm2 5h8',
    document: 'M6 3h8l4 4v14H6V3Zm8 0v5h4M12 10v7m-3-3 3 3 3-3',
    callout: 'M4 5h16v12H9l-5 4V5Zm8 3v4m0 2h.01',
    accordion: 'M4 5h16v5H4V5Zm0 9h16v5H4v-5Zm12-7 1 1 1-1m-2 9h2',
    divider: 'M3 12h7m4 0h7m-9-2 2 2-2 2-2-2 2-2Z',
    spacer: 'M4 4h16M4 20h16m-8-4V8m-3 3 3-3 3 3m-6 2 3 3 3-3',
    row: 'M3 5h18v14H3V5Zm6 0v14m6-14v14',
  });
  function create(kind,doc=document){
    const ns='http://www.w3.org/2000/svg', svg=doc.createElementNS(ns,'svg');
    for(const [attr,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.65','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'palette-icon'}))svg.setAttribute(attr,value);
    const path=doc.createElementNS(ns,'path');
    path.setAttribute('d',shapes[kind]||shapes.text);svg.append(path);
    return svg;
  }
  return Object.freeze({create});
})();
