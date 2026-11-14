import type { Component, ComponentDefinition, Editor } from "grapesjs"
import { assetUrl, builderBase, nativeTag, studioImages, type DesignPart, type GrapesDesign } from "../../../content/grapes-model"
import { pages, type PageKey } from "../../../content/editor-model"
import { youtubeId, safeButtonUrl } from "../../../content/builder-model"

export type NativeCard = { id: string; label: string; quote: string }
const nativeType = "ncw-native-section"
const zone = "data-ncw-zone"
const media = "data-ncw-media"
const photo = assetUrl("images/home/acupuncture-hero.webp")
const column = (): ComponentDefinition => ({
  type: "default", tagName:"div", name:"Column", attributes:{[zone]:"column"}, droppable:true, removable:true, copyable:true,
  draggable: "[data-ncw-zone='columns']", style:{flex:"1 1 220px","min-width":"0",padding:"16px"}, components:[{type:"text",tagName:"p",components:"Add your content here."}],
})
const row = (n:number):ComponentDefinition => ({
  type:"default",tagName:"div",name:`${n} columns`,attributes:{[zone]:"columns"},droppable:"[data-ncw-zone='column']",
  style:{display:"flex","flex-wrap":"wrap",gap:"18px"},components:Array.from({length:n},column),
})
const section = ():ComponentDefinition => ({
  type:"default",tagName:"section",name:"Section",attributes:{[zone]:"section"},
  style:{padding:"48px 24px","background-color":"#f7f2e7",color:"#182d23"},droppable:true,
  components:[{type:"text",tagName:"h2",components:"New section"},{type:"text",tagName:"p",components:"Double-click to update this text."}],
})
export const palette = [
  ["section","Section","▱",section],
  ["columns-2","Two columns","Ⅱ",()=>row(2)],
  ["columns-3","Three columns","Ⅲ",()=>row(3)],
  ["title","Title","T",()=>({type:"text",tagName:"h2",name:"Title",components:"Add a title"} as ComponentDefinition)],
  ["paragraph","Paragraph","¶",()=>({type:"text",tagName:"p",name:"Paragraph",components:"Double-click to edit this paragraph."} as ComponentDefinition)],
  ["photo","Photo","▧",()=>({type:"image",name:"Photo",attributes:{src:photo,alt:"Acupuncture treatment"},style:{display:"block",width:"100%","max-width":"760px",height:"auto"}} as ComponentDefinition)],
  ["button","Button","↗",()=>({type:"link",name:"Button",attributes:{href:builderBase+"/contact-us/"},components:"Contact us",style:{display:"inline-block",padding:"11px 18px","border-radius":"8px","background-color":"#24533d",color:"#ffffff","text-decoration":"none"}} as ComponentDefinition)],
  ["download","File download","↓",()=>({type:"link",name:"File download",attributes:{[media]:"document",href:"#",download:""},components:"Download file"} as ComponentDefinition)],
  ["youtube","YouTube","▷",()=>({type:"default",tagName:"iframe",name:"YouTube",attributes:{[media]:"youtube",title:"YouTube video",allowfullscreen:"",loading:"lazy"},void:true,droppable:false,style:{width:"100%","max-width":"760px","aspect-ratio":"16/9",border:"0","background-color":"#e4ebe3"}} as ComponentDefinition)],
  ["video","Local video","▶",()=>({type:"default",tagName:"video",name:"Local video",attributes:{[media]:"video",controls:"",playsinline:"",preload:"none"},droppable:false,style:{width:"100%","max-width":"760px","aspect-ratio":"16/9","background-color":"#192820"}} as ComponentDefinition)],
] as const

export function initBlocks(editor:Editor) {
  editor.DomComponents.addType(nativeType,{
    model:{defaults:{
      tagName:"div",name:"Existing section",classes:["ncw-native-card"], droppable:false, editable:false, copyable:false,
      removable:false, stylable:false, draggable:".gjs-wrapper", traits:[],
      toolbar:[{attributes:{title:"Drag section",class:"fa fa-arrows"},command:"tlb-move"}],
    }},
    view:{
      onRender({el,model}) {
        const tag=el.ownerDocument.createElement("div")
        tag.className="ncw-native-card-content"
        const title=el.ownerDocument.createElement("strong")
        title.textContent=String(model.getAttributes()["data-ncw-label"]||"Existing page section")
        const preview=el.ownerDocument.createElement("p")
        preview.textContent=String(model.getAttributes()["data-ncw-quote"]||"Live section preserved")
        const hint=el.ownerDocument.createElement("small")
        hint.textContent="EXISTING SECTION • DRAG TO REORDER • EDIT IN SITE BUILDER"
        tag.append(title,preview,hint)
        el.replaceChildren(tag)
      },
    },
  })
  for(const [id,label,icon,content] of palette) {
    editor.BlockManager.add(id,{label,media:`<div class="studio-block-icon">${icon}</div>`,content:content()})
  }
}

export async function getNativeCards(page:PageKey,signal:AbortSignal):Promise<NativeCard[]> {
  const path=pages.find(([key])=>key===page)?.[1]
  const response=await fetch(builderBase+path,{signal,cache:"no-store"})
  if(!response.ok) throw Error("Could not load existing sections for this page.")
  const template=document.createElement("template")
  template.innerHTML=await response.text()
  const html=template.content
  return Array.from(html.querySelectorAll<HTMLElement>("[data-builder-page] > [data-builder-section]")).map(section=>({
    id:section.dataset.builderSection!,
    label:section.dataset.builderLabel??"Existing section",
    quote:(section.querySelector("h1,h2,p")?.textContent??"").replace(/\s+/g," ").trim().slice(0,160),
  }))
}

function nativeCard(card:NativeCard):ComponentDefinition {
  return {type:nativeType,attributes:{[nativeTag]:card.id,"data-ncw-label":card.label,"data-ncw-quote":card.quote}}
}

function deactivateDraftScripts(value: unknown): unknown {
  if(Array.isArray(value)) return value.map(deactivateDraftScripts).filter(item=>item!==null)
  if(!value || typeof value!=="object") return value
  const record=value as Record<string,unknown>
  if(typeof record.tagName==="string"&&/^(?:script|object|embed|base|link|meta|style)$/i.test(record.tagName))return null
  const entries=Object.entries(record).filter(([key, child])=>{
    if(/^(?:script(?:-export|-props)?|on\w+|srcdoc|__proto__|constructor|prototype)$/i.test(key)) return false
    if(typeof child==="string"&&([ "href","src","poster" ].includes(key.toLowerCase()))) {
      if(/^(?:javascript|vbscript|data):/i.test(child.replace(/[\u0000-\u0020]/g,"")))return false
      if(key==="src" && !/^(?:\/(?!\/)|blob:|https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}$)/i.test(child))return false
    }
    return true
  })
  return Object.fromEntries(entries.map(([key,child])=>[key,deactivateDraftScripts(child)]))
}

export function populate(editor:Editor,native:NativeCard[],project:unknown,design?:GrapesDesign,brandNew=false) {
  const byId=new Map(native.map(card=>[card.id,card]))
  if(project&&typeof project==="object"&&!Array.isArray(project)) {
    editor.loadProjectData(deactivateDraftScripts(project) as Record<string,unknown>)
  } else if(design) {
    editor.setComponents([])
    for(const part of design.parts) {
      if(part.type==="design")editor.addComponents(part.html)
      else { const card=byId.get(part.id); if(card)editor.addComponents(nativeCard(card)) }
    }
    editor.setStyle(design.css)
  } else if(brandNew) {
    editor.setComponents(section())
  } else {
    editor.setComponents(native.map(nativeCard))
  }
  editor.AssetManager.add(studioImages.filter(img=>!editor.AssetManager.get(img.src)))
  if(!brandNew) {
    const existing=new Set(editor.getWrapper()?.components().map(component=>component.getAttributes()[nativeTag]))
    for(const card of native) if(!existing.has(card.id)) editor.addComponents(nativeCard(card))
  }
  editor.UndoManager.clear()
  editor.clearDirtyCount()
}

export function focusedSection(editor:Editor,component?:Component) {
  let current=component??editor.getSelected()
  while(current && current.parent()?.get("type")!=="wrapper") current=current.parent()
  return current?.get("type")==="wrapper"?undefined:current
}

export function addBlock(editor:Editor,id:string) {
  const block=palette.find(block=>block[0]===id)
  if(!block)return
  const selected=editor.getSelected()
  const top=focusedSection(editor,selected)
  const attrs=selected?.getAttributes()
  const parent=attrs?.[zone]==="column"||attrs?.[zone]==="section" ? selected :
    selected?.parent()?.getAttributes()[zone]==="column" ? selected.parent() : undefined
  if(parent&&id!=="section") {
    const [newItem]=parent.append(block[3]())
    if(newItem)editor.select(newItem)
  } else {
    const root=editor.getWrapper()
    const [newItem]=root?.append(block[3](),{at:top?top.index()+1:root.components().length})??[]
    if(newItem)editor.select(newItem)
  }
}

export function editLink(component:Component,value:string) {
  const source=value.trim()
  if(!safeButtonUrl(source)) throw Error("Enter a full website URL, an internal path, or a page anchor.")
  const href=builderBase&&source.startsWith("/")&&!source.startsWith(builderBase+"/")?builderBase+source:source
  component.addAttributes({href})
}

export function editYouTube(component:Component,value:string) {
  const id=youtubeId(value)
  if(!id)throw Error("Enter a valid YouTube video link.")
  component.addAttributes({src:"https://www.youtube-nocookie.com/embed/"+id})
}

const replaceSources=(value:string,urls:Map<string,string>)=>{
  for(const [path,blobUrl] of urls) value=value.replaceAll(blobUrl,assetUrl(path))
  return value
}
export function exportDesign(editor:Editor,urls:Map<string,string>): { design: GrapesDesign; project: unknown } {
  const root=editor.getWrapper()
  const parts=(root?.components().map<DesignPart>(component=>{
    if(component.get("type")===nativeType) {
      return {type:"native" as const,id:String(component.getAttributes()[nativeTag])}
    }
    return {type:"design" as const,html:replaceSources(component.toHTML(),urls)}
  })??[])
  const assets=(editor.AssetManager.getAll().map(asset=>({type:"image" as const,src:replaceSources(asset.getSrc(),urls),name:asset.getName()||"Photo"})))
    .filter(asset=>asset.src.startsWith(builderBase+"/images/"))
  const css=replaceSources(editor.getCss({avoidProtected:true})||"",urls)
  const project=JSON.parse(replaceSources(JSON.stringify(editor.getProjectData()),urls)) as unknown
  return {design:{parts,assets,css},project}
}

export const canvasStyle=`
body {font-family:system-ui,sans-serif;line-height:1.6;color:#182d23;background:#fbfaf6;margin:0;min-height:100vh}
.ncw-native-card {padding:10px 18px;background:#edf4ea;box-sizing:border-box;border-bottom:1px solid #c8d5c5;min-height:62px}
.ncw-native-card-content {pointer-events:none}
.ncw-native-card-content strong {display:block;font-size:15px;line-height:1.25}
.ncw-native-card-content p {font-size:13px;margin:5px 0 1px;color:#435a49}
.ncw-native-card-content small {font-size:8px;letter-spacing:1px;color:#3a5a49}
[data-ncw-zone=column] {box-sizing:border-box;min-height:65px}
iframe,video,img {max-width:100%}
body:empty {min-height:300px}
`
