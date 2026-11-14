"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import {
  documentPath, fieldLabels, imageLabels, isImage, isField, isHeading, maxBlocks, maxFieldLength, pages,
  type Block, type EditorContent, type FieldKey, type ImageKey, type PageKey,
} from "../../content/editor-model"
import { optimizeImage } from "./optimize-image"
import { publish, repoUrl, unlock, type Snapshot } from "./github-store"

const base = process.env.BASE_PATH || ""
const emptyBlocks: Block[] = []
const maxDocumentBytes = 4 * 1024 * 1024
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Try again."
const fieldSelector = "[data-editor-field]"
const imageSelector = "img[data-editor-image]"
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
  const [selectedImage, setSelectedImage] = useState<ImageKey | null>(null)
  const [selected, setSelected] = useState<FieldKey | null>(null)
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
  const picker = useRef<HTMLInputElement>(null)
  const token = useRef("")
  const frame = useRef<HTMLIFrameElement>(null)
  const frameArea = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)
  const pass = useRef<HTMLInputElement>(null)
  const textField = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const originalMarkup = useRef(new Map<FieldKey, { text: string; children: Node[] }>())
  const cleanedPreview = useRef<(() => void) | undefined>(undefined)

  const active = pages.find(([id]) => id === page)!
  const draft = content.pages[page] ?? {}
  const blocks = draft.blocks ?? emptyBlocks
  const activePath = base + active[1]
  const supportedFields = Object.keys(fields).filter(isField)
  const screenWidth = width === "Mobile" ? 390 : width === "Tablet" ? 768 : 1280
  const scale = available ? Math.min(1, available / screenWidth) : 1
  const screenHeight = width === "Mobile" ? 790 : width === "Tablet" ? 920 : 840

  useEffect(() => {
    const area = frameArea.current
    if (!area || !("ResizeObserver" in window)) return
    const resize = new ResizeObserver(entries => setAvailable(entries[0].contentRect.width))
    resize.observe(area)
    return () => resize.disconnect()
  }, [snapshot])

  const preparePreview = useCallback(() => {
    cleanedPreview.current?.()
    const doc = frame.current?.contentDocument
    if (!doc) { setError("The page preview could not be opened."); return }
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
      [data-editor-field] {cursor: text;}
      .hero-media, .page-hero-photo {pointer-events: auto;}
      [data-editor-image] {cursor: pointer;}
      [data-editor-image]:hover {outline: 2px dashed #bb8c3d; outline-offset: -3px;}
      [data-editor-field]:hover, [data-editor-field]:focus-visible {outline: 2px dashed #bb8c3d; outline-offset: 4px;}
      [data-editor-current="true"] {outline: 2px solid #d7aa5d; outline-offset: 5px;}
      .floating-booking-link,.page-load-indicator,.header-nav .nav-dropdown {pointer-events:none;}
      .ncw *, .ncw *::before, .ncw *::after {animation: none !important; transition: none !important;}
    `
    doc.head.append(css)
    function pick(target: EventTarget | null) {
      const el = target instanceof iframeElement ? (target as Element).closest<HTMLElement>(fieldSelector) : null
      const photo = target instanceof iframeElement ? (target as Element).closest<HTMLImageElement>(imageSelector) : null
      const image = photo?.dataset.editorImage || ""
      if (isImage(image)) {
        setSelected(null); setSelectedImage(image)
        window.requestAnimationFrame(() => picker.current?.focus())
        return
      }
      const key = el?.dataset.editorField || ""
      if (!isField(key)) return
      setSelectedImage(null)
      setSelected(key)
      window.requestAnimationFrame(() => textField.current?.focus({ preventScroll: true }))
    }
    function click(event: MouseEvent) {
      const target = event.target as Element | null
      if (target?.closest("a, button, input, textarea, select")) event.preventDefault()
      pick(target)
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Enter" && (event.target as Element)?.closest("a, button, " + fieldSelector + ", " + imageSelector)) {
        event.preventDefault()
        pick(event.target)
      }
    }
    function preventSubmit(event: Event) { event.preventDefault() }
    doc.querySelectorAll<HTMLElement>(fieldSelector + ", " + imageSelector).forEach(el => { el.tabIndex = 0 })
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
      el.dataset.editorCurrent = String(key === selected)
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
      node.textContent = block.text || (block.type === "document" ? "Document download" : block.type === "heading" ? "New heading" : "New paragraph")
      if (node.tagName === "A") {
        node.className = "editor-document"
        node.setAttribute("href", "#")
      }
      return node
    }))
  }, [draft, blocks, previewReady, selected])

  function changePage(next: PageKey) {
    if (next === page) return
    setPage(next)
    setFields({})
    setImages({})
    setSelectedImage(null)
    setSelected(null)
    setPreviewReady(false)
    setError("")
  }

  function update(next: EditorContent["pages"][PageKey]) {
    setChanged(true)
    setCommit("")
    setNotice("")
    setContent(previous => ({ ...previous, pages: { ...previous.pages, [page]: next } }))
  }

  function writeField(key: FieldKey, value: string) {
    update({ ...draft, fields: { ...draft.fields, [key]: value } })
  }

  function add(type: Block["type"]) {
    if (blocks.length >= maxBlocks) return
    const id = draftId()
    const block: Block = type === "document" ? { id, type, text: "Download document", file: "" } :
      { id, type, text: type === "heading" ? "New heading" : "New paragraph" }
    update({ ...draft, blocks: [...blocks, block] })
  }

  function move(id: string, to: number) {
    const from = blocks.findIndex(block => block.id === id)
    if (from < 0 || to < 0 || to >= blocks.length || from === to) return
    const reordered = [...blocks]
    reordered.splice(to, 0, reordered.splice(from, 1)[0])
    update({ ...draft, blocks: reordered })
  }

  async function uploadPhoto(key: ImageKey, file: File) {
    setBusy(true); setError("")
    try {
      const { blob, width, height } = await optimizeImage(file, key === "hero" ? 1600 : key === "qi-gong-card" ? 720 : 1000)
      const path = `images/editor/${key}-${draftId()}.webp`
      uploads.current.set(path, blob)
      previewUrls.current.set(path, URL.createObjectURL(blob))
      update({ ...draft, images: { ...draft.images, [key]: {
        path, width, height, alt: draft.images?.[key]?.alt ?? images[key] ?? "",
      } } })
    } catch (error) { setError(errorText(error)) }
    finally { setBusy(false) }
  }

  function clearUploads() {
    uploads.current.clear()
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }

  async function attach(id: string, file: File) {
    setError("")
    const ext = file.name.split(".").at(-1)?.toLowerCase()
    if ((ext !== "pdf" && ext !== "docx") || file.size > maxDocumentBytes || file.size < 5) {
      setError("Choose a public PDF or DOCX file no larger than 4 MB.")
      return
    }
    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())
    const isPdf = new TextDecoder().decode(signature) === "%PDF-"
    const isZip = signature[0] === 80 && signature[1] === 75 && signature[2] === 3 && signature[3] === 4
    if ((ext === "pdf" && !isPdf) || (ext === "docx" && !isZip)) { setError("The file does not match its PDF or DOCX extension."); return }
    const name = file.name.slice(0, file.name.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "document"
    const path = `documents/editor/${name}-${draftId()}.${ext}`
    if (!documentPath.test(path)) return
    uploads.current.set(path, file)
    setChanged(true)
    setCommit("")
    setNotice("")
    setContent(current => {
      const draftPage = current.pages[page] ?? {}
      return { ...current, pages: { ...current.pages, [page]: { ...draftPage, blocks: draftPage.blocks?.map(block =>
        block.id === id && block.type === "document" ? { ...block, file: path } : block) } } }
    })
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
    setSnapshot(null); setConfirmPublish(false); setNotice(""); setCommit("")
    changePage("home")
  }

  return <main className="editor-app">
    <header className="editor-top">
      <div><span className="editor-kicker">NEW CITY WELLNESS</span><h1>Visual Editor</h1></div>
      <div className="editor-top-actions">
        <a href={base + "/"}>View website ↗</a>
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
      <div className="editor-workspace">
        <aside className="editor-sidebar" aria-label="Page content controls">
          <fieldset disabled={busy}>
            <h2>Page text</h2>
            <p className="editor-muted">Click a marked heading or paragraph in the preview, or edit it here.</p>
            {!previewReady && <p>Loading page preview…</p>}
            {supportedFields.map(key => <label key={key} className={selected === key ? "editor-selected" : ""} onFocus={() => { setSelectedImage(null); setSelected(key) }}>{fieldLabels[key]}
              {isHeading(key) ? <input value={draft.fields?.[key] ?? fields[key] ?? ""} maxLength={maxFieldLength(key)} onChange={event => writeField(key, event.target.value)} ref={selected === key ? element => { textField.current = element } : undefined} /> :
                <textarea value={draft.fields?.[key] ?? fields[key] ?? ""} maxLength={maxFieldLength(key)} onChange={event => writeField(key, event.target.value)} ref={selected === key ? element => { textField.current = element } : undefined} />}
            </label>)}
          </fieldset>
          {Object.keys(images).length > 0 && <fieldset disabled={busy}>
            <h2>Page photos</h2>
            <p className="editor-muted">Replace supported photos with an automatically compressed WebP.</p>
            {Object.keys(images).filter(isImage).map(key => <label key={key} className={selectedImage === key ? "editor-selected" : ""}>{imageLabels[key]}
              <input ref={selectedImage === key ? picker : undefined} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadPhoto(key, file); event.target.value = "" }} />
              {draft.images?.[key] && <><small>Image description</small><input maxLength={160} value={draft.images?.[key]!.alt} onChange={event => update({ ...draft, images: { ...draft.images, [key]: { ...draft.images?.[key]!, alt: event.target.value } } })} /></>}
            </label>)}
          </fieldset>}
          <fieldset disabled={busy}>
            <h2>Additional blocks</h2>
            <p className="editor-muted">These appear below the existing page content. Drag to reorder or use the arrows.</p>
            <div className="editor-add">{(["heading", "paragraph", "document"] as const).map(type => <button key={type} disabled={blocks.length >= maxBlocks} onClick={() => add(type)}>+ {type}</button>)}</div>
            {blocks.map((block, index) => <article className="editor-block" key={block.id}
              onDragOver={event => { if (dragging) event.preventDefault() }}
              onDrop={event => { event.preventDefault(); if (dragging) move(dragging, index); setDragging(null) }}>
              <div className="editor-block-bar">
                <span className="editor-drag" draggable={!busy} onDragStart={event => { setDragging(block.id); event.dataTransfer.setData("text/plain", block.id); event.dataTransfer.effectAllowed = "move" }} onDragEnd={() => setDragging(null)} title="Drag to reorder">⠿ {block.type}</span>
                <span><button aria-label={`Move block ${index + 1} up`} disabled={index === 0} onClick={() => move(block.id, index - 1)}>↑</button> <button aria-label={`Move block ${index + 1} down`} disabled={index === blocks.length - 1} onClick={() => move(block.id, index + 1)}>↓</button> <button aria-label={`Remove block ${index + 1}`} onClick={() => update({ ...draft, blocks: blocks.filter(item => item.id !== block.id) })}>×</button></span>
              </div>
              <label>{block.type === "document" ? "Link label" : "Text"}{block.type === "paragraph" ?
                <textarea maxLength={2400} value={block.text} onChange={event => update({ ...draft, blocks: blocks.map(item => item.id === block.id ? { ...item, text: event.target.value } : item) })} /> :
                <input maxLength={140} value={block.text} onChange={event => update({ ...draft, blocks: blocks.map(item => item.id === block.id ? { ...item, text: event.target.value } : item) })} />}</label>
              {block.type === "document" && <label>Public PDF or Word file <input type="file" accept=".pdf,.docx" onChange={event => { const file = event.target.files?.[0]; if (file) void attach(block.id, file); event.target.value = "" }} /><small>{block.file ? (uploads.current.get(block.file) as File | undefined)?.name ?? fileName(block.file) : "No document attached"}</small></label>}
            </article>)}
          </fieldset>
        </aside>
        <section className="editor-preview" aria-label="Visual page preview">
          <div className="editor-preview-bar"><span>{active[2]} <small>· Live layout with draft edits</small></span>
            <div className="editor-view-buttons">
              {blocks.length > 0 && <button onClick={() => frame.current?.contentDocument?.querySelector("[data-editor-blocks]")?.scrollIntoView({ block: "start" })}>See new blocks</button>}
              <button onClick={() => { setPreviewReady(false); setPreviewVersion(value => value + 1) }}>Reload preview</button>
            </div>
          </div>
          <div className="editor-frame-scroll" ref={frameArea}>
            <div className="editor-frame-device" style={{ width: screenWidth * scale, height: screenHeight * scale }}>
              <iframe key={`${page}-${previewVersion}`} ref={frame} title={`${active[2]} preview`} src={activePath} onLoad={preparePreview} sandbox="allow-same-origin" referrerPolicy="no-referrer" style={{ width: screenWidth, height: screenHeight, transform: `scale(${scale})` }} />
            </div>
          </div>
        </section>
      </div>
    </>}
  </main>
}
