"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import type { Component, Editor } from "grapesjs"
import { Blocks, ChevronLeft, Download, Eye, ImagePlus, Layers, Maximize, Monitor, Palette, Redo2, Smartphone, Tablet, Undo2, X } from "lucide-react"
import { pages, type PageKey } from "../../../content/editor-model"
import { builderBase, nativeTag } from "../../../content/grapes-model"
import { EditorDialog } from "../editor-dialog"
import { prepareBuilderUpload } from "../builder-upload"
import { addBlock, canvasStyle, editLink, editYouTube, exportDesign, getNativeCards, initBlocks, palette, populate } from "./canvas"
import { authorizeStudio, loadStudioProject, publishStudio, tokenSetupUrl, type ProjectSnapshot } from "./github"

const empty: ProjectSnapshot = { designSha:"", projectSha:null, project:null, design:undefined }
const devices = [{id:"desktop",name:"Desktop",width:""},{id:"tablet",name:"Tablet",width:"768px",widthMedia:"900px"},{id:"mobile",name:"Mobile",width:"390px",widthMedia:"600px"}]
const panels = [{id:"blocks",name:"Blocks",icon:Blocks},{id:"styles",name:"Styles",icon:Palette},{id:"layers",name:"Layers",icon:Layers}] as const
const errorText = (e:unknown) => e instanceof Error ? e.message : "Something went wrong. Your draft is still open."
type Dialog = "connect" | "publish" | "media" | null

export function GrapesStudio() {
  const root = useRef<HTMLDivElement>(null)
  const studio = useRef<HTMLDivElement>(null)
  const blockPanel = useRef<HTMLDivElement>(null)
  const stylePanel = useRef<HTMLDivElement>(null)
  const layerPanel = useRef<HTMLDivElement>(null)
  const editor = useRef<Editor | null>(null)
  const token = useRef("")
  const pageRef = useRef<PageKey>("home")
  const projects = useRef(new Map<PageKey,ProjectSnapshot>())
  const abortLoad = useRef<AbortController | null>(null)
  const uploads = useRef(new Map<string,Blob>())
  const previewUrls = useRef(new Map<string,string>())
  const [page,setPage] = useState<PageKey>("home")
  const [tab,setTab] = useState<(typeof panels)[number]["id"]>("blocks")
  const [drawer,setDrawer] = useState(true)
  const [selection,setSelection] = useState<Component>()
  const [device,setDevice] = useState("Desktop")
  const [account,setAccount] = useState("")
  const [loading,setLoading] = useState(true)
  const [preview,setPreview] = useState(false)
  const [busy,setBusy] = useState(false)
  const [dialog,setDialog] = useState<Dialog>(null)
  const [status,setStatus] = useState("")
  const [error,setError] = useState("")
  const [dialogError,setDialogError] = useState("")
  const [file,setFile] = useState<File>()
  const [input,setInput] = useState("")
  const [dirty,setDirty] = useState(false)
  const [commit,setCommit] = useState("")
  const activePage=pages.find(([id])=>id===page)!
  const installed=!!selection
  const attrs=selection?.getAttributes()
  const selectedMedia=attrs?.["data-ncw-media"]
  const native=!!attrs?.[nativeTag]
  const isPhoto=selection?.is("image")??false
  const assetType=isPhoto?"photo":selectedMedia==="document"?"document":selectedMedia==="video"?"video":undefined
  const isLink=selection?.is("link")??false

  useEffect(()=>{
    const mount=root.current, blocks=blockPanel.current, styles=stylePanel.current, layers=layerPanel.current
    if(!mount||!blocks||!styles||!layers)return
    let running=true
    void import("grapesjs").then(({default:grapesjs})=>{
      if(!running)return
      const instance=grapesjs.init({
        container:mount, height:"100%", width:"100%", telemetry:false,
        storageManager:false, panels:{defaults:[]}, blockManager:{appendTo:blocks}, styleManager:{appendTo:styles},
        layerManager:{appendTo:layers}, assetManager:{upload:false,showUrlInput:false}, deviceManager:{devices},
        canvas:{frameStyle:canvasStyle,allowExternalDrop:false},
        parser:{optionsHtml:{allowScripts:false,allowUnsafeAttr:false,allowUnsafeAttrValue:false}},
      })
      editor.current=instance
      initBlocks(instance)
      instance.on("component:selected",component=>{setSelection(component)})
      instance.on("component:deselected",()=>setSelection(instance.getSelected()??undefined))
      instance.on("component:update:attributes",component=>{if(component===instance.getSelected()){ setSelection(undefined); queueMicrotask(()=>setSelection(component)) }})
      instance.on("update",()=>{if(instance.getDirtyCount()>0)setDirty(true)})
      instance.on("load",()=>{
        const frame=instance.Canvas.getDocument()
        frame?.addEventListener("click",(event:MouseEvent)=>{
          if((event.target as Element)?.closest("a"))event.preventDefault()
        },true)
        void loadPage(instance,pageRef.current,null)
      })
    }).catch(()=>{if(running){setLoading(false);setError("The GrapesJS editor could not start. Reload the builder and try again.")}})
    return ()=>{
      running=false
      abortLoad.current?.abort()
      editor.current?.destroy();editor.current=null
      for(const url of previewUrls.current.values())URL.revokeObjectURL(url)
    }
  // GrapesJS owns the single canvas instance for this mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{
    if(!dirty)return
    const protect=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=""}
    window.addEventListener("beforeunload",protect)
    return ()=>window.removeEventListener("beforeunload",protect)
  },[dirty])

  async function loadPage(instance:Editor,key:PageKey,snapshot:ProjectSnapshot|null) {
    abortLoad.current?.abort()
    const controller=new AbortController()
    abortLoad.current=controller
    setLoading(true);setError("");setCommit("");setSelection(undefined)
    try {
      const [cards,saved]=await Promise.all([getNativeCards(key,controller.signal),snapshot??(token.current?loadStudioProject(token.current,key):empty)])
      if(controller.signal.aborted)return
      if(token.current)projects.current.set(key,saved)
      populate(instance,cards,saved.project,saved.design)
      pageRef.current=key
      setPage(key);setDirty(false)
      setStatus(saved.design?"Loaded the saved GrapesJS design.":"Existing sections are preserved. Drag new blocks around them.")
    }catch(e){if(!controller.signal.aborted)setError(errorText(e))}
    finally{if(!controller.signal.aborted)setLoading(false)}
  }
  async function switchPage(next:PageKey) {
    if(loading||busy||next===page||!editor.current)return
    if(dirty&&!window.confirm("Switch pages and discard this page’s unsaved draft? You can download a backup first."))return
    await loadPage(editor.current,next,null)
  }
  function openDialog(next:Dialog) {
    setDialogError("");setInput("");setFile(undefined);setDialog(next)
  }
  async function connect(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const field=event.currentTarget.querySelector<HTMLInputElement>("input[type=password]")
    const credential=field?.value.trim()
    if(!credential||!editor.current)return
    if(field)field.value=""
    setBusy(true);setDialogError("")
    try {
      const login=await authorizeStudio(credential)
      const snapshot=await loadStudioProject(credential,page)
      const previous=projects.current.get(page)
      if(dirty&&((previous?.projectSha??null)!==snapshot.projectSha||JSON.stringify(previous?.design)!==JSON.stringify(snapshot.design))) {
        throw Error("A saved design already exists or was changed while you were editing. Download this draft, then reopen the page to load the published design.")
      }
      token.current=credential
      setAccount(login);setDialog(null)
      if(!dirty)await loadPage(editor.current,page,snapshot)
      else {projects.current.set(page,snapshot);setStatus("GitHub connected. Your draft is ready to publish.")}
    }catch(e){setDialogError(errorText(e))}
    finally{setBusy(false)}
  }
  async function save() {
    const instance=editor.current
    const snapshot=projects.current.get(page)
    if(!instance||!snapshot||!token.current)return
    setBusy(true);setDialogError("");setError("")
    try {
      const {design,project}=exportDesign(instance,previewUrls.current)
      const pending=design.parts.filter(part=>part.type==="design").some(part=>/<iframe\b(?![^>]*\ssrc=)[^>]*>|<video\b(?![^>]*\ssrc=)[^>]*>|data-ncw-media="document"[^>]*href="#"/i.test(part.html))
      if(pending)throw Error("Add a file or video source to each new media block before publishing.")
      const result=await publishStudio(token.current,page,snapshot,project,design,uploads.current)
      projects.current.set(page,result.snapshot)
      instance.clearDirtyCount();setDirty(false);setDialog(null);setCommit(result.commit);setStatus("Committed to GitHub. The live page will update after GitHub Pages finishes deploying.")
    }catch(e){setDialogError(errorText(e))}
    finally{setBusy(false)}
  }
  async function attach(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if(!selection||!editor.current)return
    setBusy(true);setDialogError("")
    try {
      if(selectedMedia==="youtube")editYouTube(selection,input)
      else if(assetType&&file) {
        const result=await prepareBuilderUpload(assetType,file)
        const path=result.item.path!
        const url=URL.createObjectURL(result.blob)
        uploads.current.set(path,result.blob);previewUrls.current.set(path,url)
        if(assetType==="document") selection.addAttributes({href:url,download:file.name})
        else if(assetType==="photo") {
          selection.addAttributes({alt:input.trim(),width:String(result.item.width),height:String(result.item.height)})
          selection.set("src",url)
          editor.current.AssetManager.add({type:"image",src:url,name:file.name})
        }else selection.addAttributes({src:url,"aria-label":input.trim()||"Uploaded video"})
      } else if(isLink) editLink(selection,input)
      else if(isPhoto) selection.addAttributes({alt:input.trim()})
      else throw Error("Choose a file first.")
      setDirty(true);setDialog(null)
    }catch(e){setDialogError(errorText(e))}
    finally{setBusy(false)}
  }
  function showMedia() {
    openDialog("media")
    setInput(isPhoto?String(attrs?.alt??""):selectedMedia==="youtube"?String(attrs?.src??""):isLink&&selectedMedia!=="document"?String(attrs?.href??""):"")
  }
  function downloadFile(contents:string,mime:string,name:string) {
    const url=URL.createObjectURL(new Blob([contents],{type:mime})),link=document.createElement("a")
    link.href=url;link.download=name;link.click()
    window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  function exportFiles(kind:"json"|"html"|"css"="json") {
    if(!editor.current)return
    const {design,project}=exportDesign(editor.current,previewUrls.current)
    const name=`new-city-wellness-${page}-design`
    if(kind==="html") downloadFile(design.parts.flatMap(part=>part.type==="design"?[part.html]:[]).join("\n"),"text/html",name+".html")
    else if(kind==="css") downloadFile(design.css,"text/css",name+".css")
    else downloadFile(JSON.stringify({page,design,project},null,2),"application/json",name+".json")
  }
  function livePreview() {
    if(!editor.current)return
    if(preview)editor.current.stopCommand("preview")
    else editor.current.runCommand("preview")
    setPreview(!preview)
  }

  return <div className="grapes-studio editor-app" ref={studio}>
    <header className="studio-header">
      <div className="studio-brand"><a href={builderBase+"/admin/"} title="Return to the existing builder" aria-label="Return to the existing builder"><ChevronLeft size={20}/></a>
        <div><span>NEW CITY WELLNESS</span><h1>Design Studio</h1></div></div>
      <div className="studio-header-actions">
        <button type="button" onClick={()=>void (document.fullscreenElement?document.exitFullscreen():studio.current?.requestFullscreen())?.catch(()=>setError("Fullscreen is not available in this browser."))}><Maximize size={16}/> Fullscreen</button>
        <button type="button" disabled={busy||loading} onClick={()=>openDialog("connect")}>{account?"Connected as @"+account:"Connect GitHub"}</button>
        <button className="editor-primary" type="button" disabled={busy||loading||!dirty||!account} onClick={()=>openDialog("publish")}>Publish page</button>
      </div>
    </header>
    <div className="studio-toolbar">
      <label>Page <select value={page} onChange={event=>void switchPage(event.currentTarget.value as PageKey)} disabled={busy||loading}>
        {pages.map(([id,,label])=><option key={id} value={id}>{label}</option>)}
      </select></label>
      <div className="studio-toolgroup" role="group" aria-label="Preview size">
        {[[Monitor,"Desktop"],[Tablet,"Tablet"],[Smartphone,"Mobile"]].map(([Icon,label])=>{
          const Symbol=Icon as typeof Monitor, name=label as string
          return <button key={name} type="button" title={name} aria-label={name} aria-pressed={device===name} onClick={()=>{editor.current?.setDevice(name.toLowerCase());setDevice(name)}}><Symbol size={17}/></button>
        })}
      </div>
      <div className="studio-toolgroup" role="group" aria-label="Editing tools">
        <button type="button" aria-label="Undo" disabled={loading} onClick={()=>editor.current?.UndoManager.undo()}><Undo2 size={17}/></button>
        <button type="button" aria-label="Redo" disabled={loading} onClick={()=>editor.current?.UndoManager.redo()}><Redo2 size={17}/></button>
        <button type="button" onClick={livePreview} disabled={loading} aria-pressed={preview}><Eye size={17}/> {preview?"Edit":"Preview"}</button>
        <button type="button" onClick={()=>exportFiles()} disabled={loading}><Download size={16}/> Backup</button>
        <details className="studio-export"><summary>Export</summary><div><button type="button" onClick={()=>exportFiles("html")} disabled={loading}>New blocks HTML</button><button type="button" onClick={()=>exportFiles("css")} disabled={loading}>New blocks CSS</button></div></details>
      </div>
      <div className="studio-state" role="status">{loading?"Loading canvas…":dirty?"Unpublished changes":account?"Ready to edit":"Demo · nothing publishes"}</div>
    </div>
    {error?<p className="studio-notice studio-error" role="alert">{error}</p>:<p className="studio-notice" role="status">{status}{commit&&<> <a href={`https://github.com/mshahrooz/Newcitywellness/actions?query=sha%3A${commit}`} target="_blank" rel="noopener noreferrer">Check deployment ↗</a></>}</p>}
    <div className="studio-workspace">
      <div id="grapes-canvas" ref={root} className="studio-canvas" />
      {!drawer&&!preview&&<button type="button" className="studio-open-tools" onClick={()=>setDrawer(true)}><Blocks size={16}/> Builder tools</button>}
      <aside className={"studio-drawer"+(drawer&&!preview?"":" studio-drawer-hide")} aria-label="Builder tools">
        <div className="studio-tabs">{panels.map(({id,name,icon:Icon})=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={16}/>{name}</button>)}<button type="button" aria-label="Hide builder tools" onClick={()=>setDrawer(false)}><X size={16}/></button></div>
        <div hidden={tab!=="blocks"} className="studio-pane">
          <h2>Build your page</h2><p>Drag a block onto the canvas. Double-click new text to edit it.</p>
          <div ref={blockPanel}/>
          <details><summary>Insert a block without dragging</summary><div className="studio-insert">{palette.map(([id,name])=><button type="button" key={id} disabled={loading} onClick={()=>{if(editor.current)addBlock(editor.current,id)}}>{name}</button>)}</div></details>
        </div>
        <div hidden={tab!=="styles"} className="studio-pane">
          <h2>Style the selection</h2><p>Select a new block to change its colors, layout, or typography.</p>
          <div ref={stylePanel}/>
        </div>
        <div hidden={tab!=="layers"} className="studio-pane">
          <h2>Page layers</h2><p>Reorder top-level sections and work with nested blocks.</p><div ref={layerPanel}/>
        </div>
        <div className="studio-actions">
          {installed&&<p>{native?"Existing React section":selection?.getName()}</p>}
          {native&&<a href={builderBase+"/admin/"}>Edit existing copy in Site Builder ↗</a>}
          {installed&&!native&&<button type="button" onClick={()=>setTab("styles")}><Palette size={15}/> Style selection</button>}
          {installed&&(assetType||selectedMedia==="youtube"||isLink)&&<button type="button" onClick={showMedia}><ImagePlus size={15}/> {isPhoto?"Upload photo / edit alt text":selectedMedia==="youtube"?"Set YouTube link":assetType==="video"?"Upload local video":assetType==="document"?"Attach a file":"Edit destination link"}</button>}
          {isPhoto&&<button type="button" onClick={()=>editor.current?.runCommand("open-assets",{target:selection})}>Open asset library</button>}
          <a href={builderBase+activePage[1]} target="_blank" rel="noopener noreferrer">View live page ↗</a>
        </div>
      </aside>
    </div>
    {dialog&&<EditorDialog title={dialog==="connect"?"Connect to GitHub":dialog==="publish"?"Publish this page?":"Edit media or link"} close={()=>setDialog(null)} busy={busy}>
      {dialog==="connect"?<form className="editor-dialog-body" onSubmit={connect}>
        <p>Use a fine-grained token for Newcitywellness with <strong>Contents → Read and write</strong>. This tab keeps it only in memory.</p>
        <label>GitHub token<input type="password" required autoComplete="off" disabled={busy}/></label>
        <a href={tokenSetupUrl} target="_blank" rel="noopener noreferrer">Set up a GitHub token ↗</a>
        {dialogError&&<p role="alert" className="editor-popup-error">{dialogError}</p>}
        <button className="editor-primary" type="submit" disabled={busy}>{busy?"Checking access…":"Connect GitHub"}</button>
      </form>:dialog==="publish"?<div className="editor-dialog-body">
        <p>This will publish the added blocks and section order on <strong>{activePage[2]}</strong>. Existing clinic widgets, navigation, and forms remain in place.</p>
        {dialogError&&<p role="alert" className="editor-popup-error">{dialogError}</p>}
        <div className="editor-dialog-actions"><button type="button" onClick={()=>setDialog(null)} disabled={busy}>Cancel</button><button className="editor-primary" type="button" disabled={busy} onClick={save}>{busy?"Publishing…":"Confirm publishing"}</button></div>
      </div>:<form className="editor-dialog-body" onSubmit={attach}>
        {(isPhoto||selectedMedia==="youtube"||selectedMedia==="video"||!assetType&&isLink)&&<label>{isPhoto?"Image description":selectedMedia==="youtube"?"YouTube URL or video ID":selectedMedia==="video"?"Video title":"Button destination"}
          <input value={input} onChange={event=>setInput(event.currentTarget.value)} required={!isPhoto&&selectedMedia!=="video"}/></label>}
        {assetType&&<label>{assetType==="photo"?"Upload a public photo":assetType==="document"?"Select a public document (up to 8 MB)":"Select a public MP4 or WebM (up to 20 MB)"}
          <input type="file" required={assetType!=="photo"} accept={assetType==="photo"?"image/jpeg,image/png,image/webp,image/avif":assetType==="document"?".pdf,.docx,.txt,.xlsx,.pptx,.csv":".mp4,.webm"} onChange={event=>setFile(event.currentTarget.files?.[0])}/></label>}
        {dialogError&&<p role="alert" className="editor-popup-error">{dialogError}</p>}
        <button type="submit" className="editor-primary" disabled={busy}>{busy?"Preparing…":"Apply to draft"}</button>
      </form>}
    </EditorDialog>}
  </div>
}
