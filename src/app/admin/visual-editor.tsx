"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import {
  documentPath, fieldLabels, imageLabels, isImage, isField, isHeading, maxBlocks, maxFieldLength, pages,
  type Block, type EditorContent, type FieldKey, type ImageKey, type PageKey,
} from "../../content/editor-model"
import { EditorDialog } from "./editor-dialog"
import { optimizeImage } from "./optimize-image"
import { publish, repoUrl, unlock, type Snapshot } from "./github-store"

const base = process.env.BASE_PATH || ""
const emptyBlocks: Block[] = []
const maxDocumentBytes = 4 * 1024 * 1024
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Try again."
const fieldSelector = "[data-editor-field]"
const imageSelector = "img[data-editor-image]"
const blockSelector = "[data-editor-block-id]"
const editSelector = [fieldSelector, imageSelector, blockSelector].join(", ")
const blockTypes = ["heading", "paragraph", "document"] as const
type Target = { type: "field"; key: FieldKey } | { type: "image"; key: ImageKey } |
  { type: "block"; id: string } | { type: "new-block"; kind: Block["type"] } |
  { type: "find" } | { type: "blocks" }
const initialText: Record<Block["type"], string> = { heading: "", paragraph: "", document: "Download document" }
const fieldsOf = (doc: Document) => [...doc.querySelectorAll<HTMLElement>(fieldSelector)]
const draftId = () => crypto.randomUUID()
const fileName = (path: string) => path.split("/").at(-1) || "Document"

export function VisualEditor() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [content, setContent] = useState<EditorContent>({ version: 1, pages: {} })
  const [page, setPage] = useState<PageKey>("home")
  const [width, setWidth] = useState("Desktop")
  const [fields, setFields] = useState<Partial<Record<FieldKey, string>>>({})
  const [images, setImages] = useState<Partial<Record<ImageKey, string>>>({})
  const [target, setTarget] = useState<Target | null>(null)
  const [value, setValue] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [popupError, setPopupError] = useState("")
  const [showMarks, setShowMarks] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewVersion, setPreviewVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [changed, setChanged] = useState(false)
  const [commit, setCommit] = useState("")
  const uploads = useRef(new Map<string, File | Blob>())
  const previewUrls = useRef(new Map<string, string>())
  const originalSources = useRef(new Map<HTMLSourceElement, string>())
  const originalPhotos = useRef(new Map<ImageKey, Record<string, string | null>>())
  const token = useRef("")
  const frame = useRef<HTMLIFrameElement>(null)
  const frameArea = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState({ width: 0, height: 0 })
  const app = useRef<HTMLElement>(null)
  const focusTarget = useRef<HTMLElement | null>(null)
  const openFromFrame = useRef<(item: Target, el: HTMLElement) => void>(() => {})
  const pass = useRef<HTMLInputElement>(null)
  const originalMarkup = useRef(new Map<FieldKey, { text: string; children: Node[] }>())
  const cleanedPreview = useRef<(() => void) | undefined>(undefined)

  const active = pages.find(([id]) => id === page)!
  const draft = content.pages[page] ?? {}
  const blocks = draft.blocks ?? emptyBlocks
  const activePath = base + active[1]
  const supportedFields = Object.keys(fields).filter(isField)
  const editorOpen = !!snapshot
  const screenWidth = width === "Mobile" ? 390 : width === "Tablet" ? 768 : Math.max(1120, Math.floor(available.width))
  const scale = available.width ? Math.min(1, available.width / screenWidth) : 1
  const screenHeight = available.height ? Math.max(1, Math.floor(available.height / scale)) : 800
  const editingBlock = target?.type === "block" ? blocks.find(block => block.id === target.id) : undefined
  const blockKind = target?.type === "new-block" ? target.kind : editingBlock?.type
  const popupTitle = target?.type === "field" ? fieldLabels[target.key] :
    target?.type === "image" ? imageLabels[target.key] : target?.type === "find" ? "Find editable content" :
    target?.type === "blocks" ? "Manage added blocks" : blockKind ? `${editingBlock ? "Edit" : "Add"} ${blockKind === "document" ? "document link" : blockKind}` : "Edit item"
  const photoSrc = target?.type === "image" ? (() => {
    const saved = draft.images?.[target.key]
    return saved ? previewUrls.current.get(saved.path) ?? (base + "/" + saved.path) :
      frame.current?.contentDocument?.querySelector<HTMLImageElement>(`[data-editor-image="${target.key}"]`)?.currentSrc
  })() : undefined

  useEffect(() => {
    const area = frameArea.current
    if (!area || !("ResizeObserver" in window)) return
    const resize = new ResizeObserver(entries => setAvailable(entries[0].contentRect))
    resize.observe(area)
    return () => resize.disconnect()
  }, [editorOpen])

  useEffect(() => {
    const sync = () => setFullScreen(document.fullscreenElement === app.current)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === app.current) await document.exitFullscreen()
      else await app.current?.requestFullscreen()
    } catch {
      setError("Your browser did not allow fullscreen. The preview still fills the editor window.")
    }
  }

  function open(item: Target, focus?: HTMLElement) {
    if (busy) return
    if (focus) focusTarget.current = focus
    else if (!target) focusTarget.current = document.activeElement as HTMLElement | null
    setPopupError("")
    setFile(null)
    setValue(item.type === "field" ? draft.fields?.[item.key] ?? fields[item.key] ?? "" :
      item.type === "image" ? draft.images?.[item.key]?.alt ?? images[item.key] ?? "" :
      item.type === "block" ? blocks.find(block => block.id === item.id)?.text ?? "" :
      item.type === "new-block" ? initialText[item.kind] : "")
    setTarget(item)
  }
  useEffect(() => {
    openFromFrame.current = (item, el) => open(item, el)
  })

  function closePopup() {
    setTarget(null)
    setPopupError("")
    setFile(null)
    const previous = focusTarget.current
    focusTarget.current = null
    requestAnimationFrame(() => {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    })
  }

  const preparePreview = useCallback(() => {
    cleanedPreview.current?.()
    const doc = frame.current?.contentDocument
    if (!doc) { setPreviewReady(false); setError("The page preview could not be opened."); return }
    const docWindow = doc.defaultView
    if (!docWindow) return
    const iframeElement = (docWindow as Window & typeof globalThis).Element
    const originals = new Map<FieldKey, { text: string; children: Node[] }>()
    const values: Partial<Record<FieldKey, string>> = {}
    for (const el of fieldsOf(doc)) {
      const key = el.dataset.editorField || ""
      if (!isField(key)) continue
      const text = el.textContent?.replace(/\s+/g, " ").trim() || ""
      originals.set(key, { text, children: [...el.childNodes].map(node => node.cloneNode(true)) })
      values[key] = text
    }
    originalMarkup.current = originals
    const photos = new Map<ImageKey, Record<string, string | null>>()
    const alts: Partial<Record<ImageKey, string>> = {}
    const photoAttrs = ["src", "srcset", "alt", "width", "height"]
    doc.querySelectorAll<HTMLImageElement>(imageSelector).forEach(el => {
      const key = el.dataset.editorImage || ""
      if (!isImage(key)) return
      photos.set(key, Object.fromEntries(photoAttrs.map(attr => [attr, el.getAttribute(attr)])))
      alts[key] = el.alt
    })
    originalPhotos.current = photos
    originalSources.current = new Map([...doc.querySelectorAll<HTMLSourceElement>("picture:has(img[data-editor-image]) source[srcset]")].map(el => [el, el.getAttribute("srcset")!]))
    setImages(alts)
    const css = doc.createElement("style")
    css.textContent = `
      ${editSelector} {cursor: pointer;}
      [data-editor-field] {cursor: text;}
      .hero-media, .page-hero-photo {pointer-events: auto;}
      ${editSelector.split(", ").flatMap(selector => [selector + ":hover", selector + ":focus-visible", ".editor-show-marks " + selector]).join(", ")}
        {outline: 2px dashed #bb8c3d; outline-offset: -2px;}
      [data-editor-current="true"] {outline: 2px solid #d7aa5d; outline-offset: 4px;}
      .floating-booking-link,.page-load-indicator {display:none !important;}
      .ncw *, .ncw *::before, .ncw *::after {animation: none !important; transition: none !important;}
    `
    doc.head.append(css)
    function pick(candidate: EventTarget | null) {
      if (!(candidate instanceof iframeElement)) return false
      const el = (candidate as Element).closest<HTMLElement>(editSelector)
      if (!el) return false
      const { editorField, editorImage, editorBlockId } = el.dataset
      if (editorField && isField(editorField)) openFromFrame.current({ type: "field", key: editorField }, el)
      else if (editorImage && isImage(editorImage)) openFromFrame.current({ type: "image", key: editorImage }, el)
      else if (editorBlockId) openFromFrame.current({ type: "block", id: editorBlockId }, el)
      return true
    }
    function click(event: MouseEvent) {
      if (pick(event.target) || (event.target as Element)?.closest("a, button, input, textarea, select")) event.preventDefault()
    }
    function keydown(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return
      if (pick(event.target) || (event.target as Element)?.closest("a, button")) event.preventDefault()
    }
    function preventSubmit(event: Event) { event.preventDefault() }
    doc.querySelectorAll<HTMLElement>(editSelector).forEach(el => { el.tabIndex = 0 })
    doc.addEventListener("click", click, true)
    doc.addEventListener("keydown", keydown)
    doc.addEventListener("submit", preventSubmit)
    cleanedPreview.current = () => {
      doc.removeEventListener("click", click, true)
      doc.removeEventListener("keydown", keydown)
      doc.removeEventListener("submit", preventSubmit)
      css.remove()
    }
    setFields(values)
    setPreviewReady(originals.size > 0)
    if (!originals.size) setError("This preview has no editable fields. If deployment is in progress, try reloading the preview.")
  }, [])

  useEffect(() => () => cleanedPreview.current?.(), [])
  useEffect(() => {
    if (!changed) return
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", protect)
    return () => window.removeEventListener("beforeunload", protect)
  }, [changed])

  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!doc || !previewReady) return
    for (const el of fieldsOf(doc)) {
      const key = el.dataset.editorField || ""
      if (!isField(key)) continue
      const original = originalMarkup.current.get(key)
      if (!original) continue
      const text = draft.fields?.[key]
      if (text !== undefined && text !== original.text) {
        if (el.textContent !== text || el.children.length) el.textContent = text
      } else if (el.textContent?.replace(/\s+/g, " ").trim() !== original.text || el.childNodes.length !== original.children.length) {
        el.replaceChildren(...original.children.map(node => node.cloneNode(true)))
      }
    }
    doc.querySelectorAll<HTMLImageElement>(imageSelector).forEach(el => {
      const key = el.dataset.editorImage || ""
      if (!isImage(key)) return
      const photo = draft.images?.[key]
      const original = originalPhotos.current.get(key)
      const sources = el.closest("picture")?.querySelectorAll<HTMLSourceElement>("source") ?? []
      for (const source of sources) {
        const originalSet = originalSources.current.get(source)
        if (photo) source.removeAttribute("srcset")
        else if (originalSet) source.setAttribute("srcset", originalSet)
      }
      if (photo) {
        const next = previewUrls.current.get(photo.path) ?? (base + "/" + photo.path)
        if (el.getAttribute("src") !== next) {
          el.removeAttribute("srcset")
          el.src = next
        }
        el.alt = photo.alt
        el.width = photo.width
        el.height = photo.height
      } else if (original) {
        for (const [attr, value] of Object.entries(original)) {
          if (value === null) el.removeAttribute(attr)
          else if (el.getAttribute(attr) !== value) el.setAttribute(attr, value)
        }
      }
    })
    const area = doc.querySelector<HTMLElement>("[data-editor-blocks]")
    const inner = area?.querySelector(".editor-blocks-inner")
    if (!area || !inner) return
    area.hidden = blocks.length === 0
    inner.replaceChildren(...blocks.map(block => {
      const node = doc.createElement(block.type === "heading" ? "h2" : block.type === "paragraph" ? "p" : "a")
      node.dataset.editorBlockId = block.id
      node.tabIndex = 0
      node.textContent = block.text || (block.type === "document" ? "Document download" : block.type === "heading" ? "New heading" : "New paragraph")
      if (node.tagName === "A") {
        node.className = "editor-document"
        node.setAttribute("href", "#")
      }
      return node
    }))
  }, [draft, blocks, previewReady])

  useEffect(() => {
    const doc = frame.current?.contentDocument
    if (!doc || !previewReady) return
    doc.documentElement.classList.toggle("editor-show-marks", showMarks)
    doc.querySelectorAll<HTMLElement>(editSelector).forEach(el => {
      const match = target?.type === "field" ? el.dataset.editorField === target.key :
        target?.type === "image" ? el.dataset.editorImage === target.key :
        target?.type === "block" ? el.dataset.editorBlockId === target.id : false
      if (match) el.dataset.editorCurrent = "true"
      else delete el.dataset.editorCurrent
    })
  }, [target, showMarks, previewReady, draft])

  function changePage(next: PageKey) {
    if (next === page) return
    setPage(next)
    setFields({})
    setImages({})
    closePopup()
    setPreviewReady(false)
    setError("")
  }

  function update(next: EditorContent["pages"][PageKey]) {
    setChanged(true)
    setCommit("")
    setNotice("")
    setContent(previous => ({ ...previous, pages: { ...previous.pages, [page]: next } }))
  }

  function move(id: string, to: number) {
    const from = blocks.findIndex(block => block.id === id)
    if (from < 0 || to < 0 || to >= blocks.length || from === to) return
    const reordered = [...blocks]
    reordered.splice(to, 0, reordered.splice(from, 1)[0])
    update({ ...draft, blocks: reordered })
  }

  function clearUploads() {
    uploads.current.clear()
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }

  async function prepareDocument(file: File) {
    const ext = file.name.split(".").at(-1)?.toLowerCase()
    if ((ext !== "pdf" && ext !== "docx") || file.size > maxDocumentBytes || file.size < 5) {
      throw new Error("Choose a public PDF or DOCX file no larger than 4 MB.")
    }
    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())
    const isPdf = new TextDecoder().decode(signature) === "%PDF-"
    const isZip = signature[0] === 80 && signature[1] === 75 && signature[2] === 3 && signature[3] === 4
    if ((ext === "pdf" && !isPdf) || (ext === "docx" && !isZip)) throw new Error("The file does not match its PDF or DOCX extension.")
    const name = file.name.slice(0, file.name.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "document"
    const path = `documents/editor/${name}-${draftId()}.${ext}`
    if (!documentPath.test(path)) throw new Error("The document filename could not be used.")
    uploads.current.set(path, file)
    return path
  }

  async function applyItem(event: FormEvent) {
    event.preventDefault()
    if (!target || busy) return
    const text = value.trim()
    setPopupError("")
    setBusy(true)
    try {
      if (target.type === "field") {
        if (!text) throw new Error("Enter text before applying.")
        const fields = { ...draft.fields }
        if (text === originalMarkup.current.get(target.key)?.text && snapshot?.content.pages[page]?.fields?.[target.key] === undefined) delete fields[target.key]
        else fields[target.key] = text
        if (fields[target.key] !== draft.fields?.[target.key]) update({ ...draft, fields })
      } else if (target.type === "image") {
        const key = target.key
        const previous = draft.images?.[key]
        if (file) {
          const { blob, width, height } = await optimizeImage(file, key === "hero" ? 1600 : key === "qi-gong-card" ? 720 : 1000)
          const path = `images/editor/${key}-${draftId()}.webp`
          uploads.current.set(path, blob)
          previewUrls.current.set(path, URL.createObjectURL(blob))
          update({ ...draft, images: { ...draft.images, [key]: { path, width, height, alt: text } } })
        } else if (previous && text !== previous.alt) update({ ...draft, images: { ...draft.images, [key]: { ...previous, alt: text } } })
        else if (!previous) throw new Error("Choose a replacement photo before applying.")
      } else if (target.type === "block" || target.type === "new-block") {
        if (!text || !blockKind) throw new Error("Enter text before applying.")
        if (target.type === "new-block" && blocks.length >= maxBlocks) throw new Error("This page has reached the block limit.")
        const id = editingBlock?.id ?? draftId()
        let block: Block
        if (blockKind === "document") {
          const path = file ? await prepareDocument(file) : editingBlock?.type === "document" ? editingBlock.file : ""
          if (!path) throw new Error("Attach a public PDF or Word file.")
          block = { id, type: "document", text, file: path }
        } else block = { id, type: blockKind, text }
        update({ ...draft, blocks: editingBlock ? blocks.map(item => item.id === id ? block : item) : [...blocks, block] })
      }
      const revealBlock = target.type === "new-block"
      closePopup()
      if (revealBlock) requestAnimationFrame(() => frame.current?.contentDocument?.querySelector("[data-editor-blocks]")?.scrollIntoView({ block: "start" }))
    } catch (error) { setPopupError(errorText(error)) }
    finally { setBusy(false) }
  }

  async function connect(event: FormEvent) {
    event.preventDefault()
    const value = pass.current?.value.trim()
    if (!value) return
    setBusy(true); setError("")
    try {
      const data = await unlock(value)
      token.current = value
      setSnapshot(data); setContent(data.content)
      if (pass.current) pass.current.value = ""
    } catch (error) { setError(errorText(error)) }
    finally { setBusy(false) }
  }

  async function save() {
    if (!snapshot || !changed) return
    setConfirmPublish(false); setBusy(true); setError(""); setNotice("")
    try {
      const result = await publish(token.current, snapshot, content, uploads.current)
      setCommit(result.commit); setChanged(false); setSnapshot(result.snapshot)
      // Keep local image previews available until the public deploy includes them.
      uploads.current.clear()
      setNotice("Changes committed to GitHub. GitHub Pages will update after its deployment finishes.")
    } catch (error) { setError(errorText(error)) }
    finally { setBusy(false) }
  }

  function backup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url; link.download = "newcitywellness-content-draft.json"; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function lock() {
    if (changed && !window.confirm("Discard your unpublished edits and lock the editor?")) return
    token.current = ""; clearUploads(); setChanged(false)
    if (document.fullscreenElement === app.current) void document.exitFullscreen().catch(() => {})
    closePopup()
    setPreviewReady(false); setFields({}); setImages({})
    setSnapshot(null); setConfirmPublish(false); setNotice(""); setCommit("")
    changePage("home")
  }

  return <main ref={app} className={editorOpen ? "editor-app editor-app-unlocked" : "editor-app"}>
    <header className="editor-top">
      <div><span className="editor-kicker">NEW CITY WELLNESS</span><h1>Visual Editor</h1></div>
      <div className="editor-top-actions">
        <a href={base + "/"}>View website ↗</a>
        {snapshot && <button type="button" onClick={toggleFullscreen}>{fullScreen ? "Exit fullscreen" : "Fullscreen"}</button>}
        {snapshot && <button onClick={lock} disabled={busy}>Lock editor</button>}
      </div>
    </header>
    {notice && <div className="editor-message" role="status">{notice} {commit && <a href={`${repoUrl}/actions?query=sha%3A${commit}`} target="_blank" rel="noopener noreferrer">Check deployment ↗</a>}</div>}
    {error && <div className="editor-message editor-error" role="alert">{error}</div>}
    {!snapshot ? <section className="editor-lock">
      <span className="editor-kicker">SITE ADMIN</span>
      <h2>Unlock the editor</h2>
      <p>Enter a GitHub fine-grained access token for this repository. It acts as the editor password and authorizes publishing. It isn’t saved in the browser.</p>
      <form onSubmit={connect}>
        <label htmlFor="editor-pass">Editor password (GitHub token)</label>
        <input id="editor-pass" ref={pass} type="password" name="github-token" autoComplete="off" required spellCheck={false} />
        <button className="editor-primary" disabled={busy}>{busy ? "Checking access…" : "Unlock editor"}</button>
      </form>
      <p className="editor-muted">Use a token limited to <strong>Newcitywellness</strong> with <strong>Contents: Read and write</strong>. GitHub Pages cannot make this URL private. No patient records, insurance forms, or other private documents belong here.</p>
      <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Create a GitHub token ↗</a>
    </section> : <>
      <div className="editor-toolbar">
        <label>Page <select value={page} disabled={busy} onChange={event => changePage(event.target.value as PageKey)}>{pages.map(([id, , label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <div className="editor-view-buttons" role="group" aria-label="Preview screen size">{["Desktop", "Tablet", "Mobile"].map(size => <button key={size} type="button" aria-pressed={width === size} onClick={() => setWidth(size)}>{size}</button>)}</div>
        <div className="editor-toolbar-actions"><span role="status">{changed ? "Unpublished changes" : "Up to date"}</span><button disabled={busy} onClick={backup}>Download JSON draft</button><button className="editor-primary" disabled={busy || !changed} onClick={() => setConfirmPublish(true)}>{busy ? "Publishing…" : "Publish to GitHub"}</button></div>
      </div>
      {confirmPublish && <div className="editor-message editor-confirm" role="group" aria-label="Confirm publishing">
        <strong>Publish to the public site?</strong> Your edits and any attached documents will be committed to GitHub. <button className="editor-primary" onClick={save}>Publish now</button><button onClick={() => setConfirmPublish(false)}>Keep editing</button>
      </div>}
      <section className="editor-preview" aria-label="Visual page preview">
        <div className="editor-preview-bar">
          <div><strong>{active[2]}</strong><span className="editor-preview-hint">{previewReady ? "Click text or a photo to edit" : "Loading preview…"}</span></div>
          <div className="editor-view-buttons">
            <button type="button" aria-pressed={showMarks} onClick={() => setShowMarks(marked => !marked)}>Show editable areas</button>
            <button type="button" disabled={!previewReady || busy} onClick={() => open({ type: "find" })}>Find item</button>
            <button type="button" disabled={!previewReady || busy} onClick={() => open({ type: "blocks" })}>Add / manage blocks</button>
            <button type="button" disabled={busy} onClick={() => { setPreviewReady(false); setPreviewVersion(revision => revision + 1) }}>Reload preview</button>
          </div>
        </div>
        <div className="editor-frame-scroll" ref={frameArea}>
          <div className="editor-frame-device" style={{ width: screenWidth * scale, height: screenHeight * scale }}>
            <iframe key={`${page}-${previewVersion}`} ref={frame} title={`${active[2]} preview`} src={activePath} onLoad={preparePreview} sandbox="allow-same-origin" referrerPolicy="no-referrer" style={{ width: screenWidth, height: screenHeight, transform: `scale(${scale})` }} />
          </div>
        </div>
      </section>
      {target && <EditorDialog key={target.type === "field" || target.type === "image" ? target.key : target.type === "block" ? target.id : target.type === "new-block" ? target.kind : target.type} title={popupTitle} subtitle={active[2]} close={closePopup} busy={busy}>
        {target.type === "find" ? <div className="editor-dialog-body editor-find">
          <p className="editor-muted">Choose an item to edit, including hero photos behind the text.</p>
          {supportedFields.length > 0 && <h3>Text</h3>}
          {supportedFields.map(key => <button type="button" key={key} onClick={() => open({ type: "field", key })}>{fieldLabels[key]}</button>)}
          {Object.keys(images).length > 0 && <h3>Photos</h3>}
          {Object.keys(images).filter(isImage).map(key => <button type="button" key={key} onClick={() => open({ type: "image", key })}>{imageLabels[key]}</button>)}
        </div> : target.type === "blocks" ? <div className="editor-dialog-body">
          <p className="editor-muted">Add headings, paragraphs, or public downloads below the existing page. Drag blocks or use the arrow buttons to reorder them.</p>
          <div className="editor-add">{blockTypes.map(kind => <button type="button" key={kind} disabled={blocks.length >= maxBlocks} onClick={() => open({ type: "new-block", kind })}>+ {kind}</button>)}</div>
          {blocks.length === 0 && <p className="editor-muted">There are no added blocks on this page yet.</p>}
          {blocks.map((block, index) => <div className="editor-block-bar" key={block.id}
            onDragOver={event => { if (dragging) event.preventDefault() }}
            onDrop={event => { event.preventDefault(); if (dragging) move(dragging, index); setDragging(null) }}>
            <span className="editor-drag" draggable onDragStart={event => { setDragging(block.id); event.dataTransfer.setData("text/plain", block.id); event.dataTransfer.effectAllowed = "move" }} onDragEnd={() => setDragging(null)} title="Drag to reorder">⠿</span>
            <button type="button" className="editor-block-title" onClick={() => open({ type: "block", id: block.id })}>{block.text}</button>
            <button type="button" aria-label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => move(block.id, index - 1)}>↑</button>
            <button type="button" aria-label={`Move block ${index + 1} down`} disabled={index === blocks.length - 1} onClick={() => move(block.id, index + 1)}>↓</button>
          </div>)}
        </div> : <form onSubmit={applyItem} className="editor-dialog-body">
          {popupError && <p role="alert" className="editor-popup-error">{popupError}</p>}
          {target.type === "image" ? <>
            {photoSrc && <img className="editor-photo-preview" src={photoSrc} alt="Current photo" />}
            <label>Replacement photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} autoFocus /></label>
            <label>Image description<input maxLength={160} value={value} onChange={event => setValue(event.target.value)} disabled={busy} /></label>
            <p className="editor-muted">New photos are compressed to WebP before being added to the draft.</p>
          </> : <>
            <label>{blockKind === "document" ? "Link label" : "Text"}
              {(target.type === "field" && !isHeading(target.key)) || blockKind === "paragraph" ?
                <textarea autoFocus maxLength={target.type === "field" ? maxFieldLength(target.key) : 2400} value={value} disabled={busy} required onChange={event => setValue(event.target.value)} /> :
                <input autoFocus maxLength={target.type === "field" ? maxFieldLength(target.key) : 140} value={value} disabled={busy} required onChange={event => setValue(event.target.value)} />}
            </label>
            {blockKind === "document" && <label>Public PDF or Word file<input type="file" accept=".pdf,.docx" disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)} /><small>{file?.name ?? (editingBlock?.type === "document" && editingBlock.file ? fileName(editingBlock.file) : "No document attached")}</small></label>}
          </>}
          <div className="editor-dialog-actions">
            {editingBlock && <button type="button" className="editor-remove" disabled={busy} onClick={() => { update({ ...draft, blocks: blocks.filter(item => item.id !== editingBlock.id) }); closePopup() }}>Remove block</button>}
            <button type="button" onClick={closePopup} disabled={busy}>Cancel</button>
            <button className="editor-primary" type="submit" disabled={busy}>{busy ? "Preparing…" : "Apply to draft"}</button>
          </div>
        </form>}
      </EditorDialog>}
    </>}
  </main>
}
