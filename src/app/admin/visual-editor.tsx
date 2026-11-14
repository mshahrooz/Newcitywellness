"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Columns3, Eye, Grid2X2, LayoutTemplate, Plus, Redo2, Search, Undo2 } from "lucide-react"
import { addRow, appendSection, blankLayout, changeSection, customSection, elementTypes, isElementType, locateItem, moveSection, placeItem, removeItem, removeRow, removeSection, replaceItem, rowsAt, safeButtonUrl, setColumns, validLayout, youtubeId, type BuilderElement, type BuilderLayout, type ElementType, type Position, type SectionStyle } from "../../content/builder-model"
import { fieldLabels, imageLabels, isField, isImage, maxFieldLength, pages, published, type Block, type EditorContent, type FieldKey, type ImageKey, type PageContent, type PageKey } from "../../content/editor-model"
import { EditorDialog } from "./editor-dialog"
import { BuilderCanvas, canvasCss, dragMime, type DragItem, type NativeCanvas } from "./builder-canvas"
import { ColumnOptions, ElementFields, ElementPalette, PositionPicker, SectionForm } from "./builder-controls"
import { optimizeImage } from "./optimize-image"
import { prepareBuilderUpload } from "./builder-upload"
import { GitHubAccessError, publish, repoUrl, tokenSetupUrl, unlock, type Snapshot } from "./github-store"

const base = process.env.BASE_PATH || ""
const emptyPage: PageContent = {}
const emptyContent: EditorContent = { version: 1, pages: {} }
const id = () => crypto.randomUUID()
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Try again."
const selector = "[data-editor-field], [data-builder-copy], img[data-editor-image], [data-editor-block-id]"
const plain = (node: HTMLElement) => (node.dataset.builderAttr ? node.getAttribute(node.dataset.builderAttr) : node.innerText || node.textContent)?.replace(/\s+/g, " ").trim() ?? ""

type CopyTarget = { type: "field" | "copy" | "shared" | "image" | "legacy"; key: string }
type Target = CopyTarget | { type: "find" | "outline" } | { type: "palette"; position: Position } |
  { type: "position"; element?: ElementType; moving?: string; native?: CopyTarget } |
  { type: "item"; kind: ElementType; position?: Position; itemId?: string } |
  { type: "section"; section?: string; before?: string | null } | { type: "columns"; position: Position }
type NativeText = { target: CopyTarget; node: HTMLElement; text: string; original: Node[]; attr?: string; saved?: string; movable?: "heading" | "paragraph"; handle?: HTMLButtonElement }

function movableText(node: HTMLElement, item: CopyTarget) {
  const heading = node.closest("h2,h3,h4,p")
  if (!heading?.closest("[data-builder-section]") || heading.closest("label,button,summary") || heading.querySelector("a,button,svg,img,iframe")) return
  const allowed = item.type === "field" && node === heading || item.type === "copy" && heading.children.length === 1 && heading.firstElementChild === node && heading.textContent?.trim() === node.textContent?.trim()
  return allowed ? heading.tagName === "P" ? "paragraph" : "heading" : undefined
}
function captureCopy(node: HTMLElement): CopyTarget | null {
  if (node.dataset.editorField && isField(node.dataset.editorField)) return { type: "field", key: node.dataset.editorField }
  if (node.dataset.builderCopy) return { type: node.hasAttribute("data-builder-shared") ? "shared" : "copy", key: node.dataset.builderCopy }
  if (node.dataset.editorImage && isImage(node.dataset.editorImage)) return { type: "image", key: node.dataset.editorImage }
  if (node.dataset.editorBlockId) return { type: "legacy", key: node.dataset.editorBlockId }
  return null
}
const isCopyTarget = (target: Target | null): target is CopyTarget => !!target && ["field", "copy", "shared", "image", "legacy"].includes(target.type)
const copyLabel = (entry: NativeText) => entry.target.type === "field" && isField(entry.target.key) ? fieldLabels[entry.target.key] :
  entry.target.type === "image" && isImage(entry.target.key) ? imageLabels[entry.target.key] :
  entry.attr ? `Placeholder · ${entry.text}` : entry.text || "Text item"

export function VisualEditor() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [previewOnly, setPreviewOnly] = useState(false)
  const [history, setHistory] = useState<{ past: EditorContent[]; now: EditorContent; next: EditorContent[] }>({ past: [], now: emptyContent, next: [] })
  const content = history.now
  const [page, setPage] = useState<PageKey>("home")
  const [width, setWidth] = useState("Desktop")
  const [canvas, setCanvas] = useState<NativeCanvas | null>(null)
  const [entries, setEntries] = useState<NativeText[]>([])
  const [position, setPosition] = useState<Position | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const [value, setValue] = useState("")
  const [link, setLink] = useState("")
  const [level, setLevel] = useState<2 | 3 | 4>(2)
  const [file, setFile] = useState<File | null>(null)
  const [find, setFind] = useState("")
  const [popupError, setPopupError] = useState("")
  const [showMarks, setShowMarks] = useState(false)
  const [clean, setClean] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [reconnect, setReconnect] = useState(false)
  const [needsToken, setNeedsToken] = useState(false)
  const [commit, setCommit] = useState("")
  const [available, setAvailable] = useState({ width: 0, height: 0 })
  const token = useRef("")
  const uploads = useRef(new Map<string, Blob>())
  const previewUrls = useRef(new Map<string, string>())
  const frame = useRef<HTMLIFrameElement>(null)
  const frameArea = useRef<HTMLDivElement>(null)
  const app = useRef<HTMLElement>(null)
  const focusTarget = useRef<HTMLElement | null>(null)
  const events = useRef<(() => void) | null>(null)
  const clickPicker = useRef<(target: CopyTarget, node: HTMLElement) => void>(() => {})
  const images = useRef(new Map<HTMLImageElement, Record<string, string | null>>())
  const pictureSources = useRef(new Map<HTMLSourceElement, string>())
  const captured = useRef<NativeText[]>([])

  const editorOpen = !!snapshot || previewOnly
  const changed = snapshot ? content !== snapshot.content : previewOnly && content !== published
  const active = pages.find(([key]) => key === page)!
  const draft = content.pages[page] ?? emptyPage
  const layout = draft.layout ?? blankLayout
  const nativeKeys = canvas ? [...canvas.native.keys()] : []
  const nativeLabels = new Map(canvas ? [...canvas.native].map(([key, el]) => [key, el.dataset.builderLabel ?? key]) : [])
  const screenWidth = width === "Mobile" ? 390 : width === "Tablet" ? 768 : Math.max(1024, Math.floor(available.width))
  const scale = available.width ? Math.min(1, available.width / screenWidth) : 1
  const screenHeight = available.height ? Math.max(1, Math.floor(available.height / scale)) : 800
  const editingItem = target?.type === "item" && target.itemId ? locateItem(layout, target.itemId)?.element : undefined
  const editingEntry = isCopyTarget(target) ? entries.find(entry => entry.target.key === target.key && entry.target.type === target.type && !entry.node.hasAttribute("data-builder-proxy")) : undefined
  const resolve = (path: string) => previewUrls.current.get(path) ?? base + "/" + path

  const popupTitle = !target ? "" : isCopyTarget(target) ? (target.type === "image" ? imageLabels[target.key as ImageKey] : "Edit text") :
    target.type === "item" ? `${target.itemId ? "Edit" : "Add"} ${elementTypes[target.kind]}` :
    target.type === "section" ? target.section ? "Section settings" : "Add a section" :
    target.type === "columns" ? "Row and columns" : target.type === "find" ? "Find editable text and photos" :
    target.type === "outline" ? "Page sections" : target.type === "palette" ? "Choose an element" : target.type === "position" && (target.moving || target.native) ? "Move element" : "Choose where to place it"

  function update(next: EditorContent) {
    if (next === content) return
    setHistory(previous => ({ past: [...previous.past.slice(-39), previous.now], now: next, next: [] }))
    setCommit(""); setNotice(""); setError("")
  }
  function updatePage(next: PageContent) {
    update({ ...content, pages: { ...content.pages, [page]: next } })
  }
  function updateLayout(next: BuilderLayout) {
    if (next === layout) return false
    if (!validLayout(next)) { setPopupError("This action exceeds the layout limit. Use a new row or section."); return false }
    updatePage({ ...draft, layout: next })
    return true
  }
  function undo() {
    setHistory(previous => previous.past.length ? { past: previous.past.slice(0, -1), now: previous.past.at(-1)!, next: [previous.now, ...previous.next] } : previous)
    setPosition(null); setNotice("")
  }
  function redo() {
    setHistory(previous => previous.next.length ? { past: [...previous.past, previous.now], now: previous.next[0], next: previous.next.slice(1) } : previous)
    setPosition(null); setNotice("")
  }

  function entryValue(item: CopyTarget) {
    const original = entries.find(entry => entry.target.key === item.key && entry.target.type === item.type && !entry.node.hasAttribute("data-builder-proxy"))?.text ?? ""
    if (item.type === "field") return draft.fields?.[item.key as FieldKey] ?? original
    if (item.type === "image") return draft.images?.[item.key as ImageKey]?.alt ?? original
    if (item.type === "legacy") return draft.blocks?.find(block => block.id === item.key)?.text ?? original
    return (item.type === "shared" ? content.shared?.[item.key] : draft.copy?.[item.key]) ?? original
  }

  function open(item: Target, focus?: HTMLElement) {
    if (busy) return
    if (focus) focusTarget.current = focus
    else if (!target) focusTarget.current = document.activeElement as HTMLElement | null
    setPopupError(""); setFind(""); setFile(null); setValue(""); setLink(""); setLevel(2)
    if (isCopyTarget(item)) setValue(entryValue(item))
    if (item.type === "item") {
      const previous = item.itemId ? locateItem(layout, item.itemId)?.element : undefined
      setValue(previous?.text ?? (item.kind === "document" ? "Download file" : ""))
      setLink(previous?.link ?? "")
      setLevel(previous?.level ?? 2)
    }
    setTarget(item)
  }
  useEffect(() => { clickPicker.current = (item, el) => open(item, el) })

  function close() {
    setTarget(null); setPopupError(""); setFile(null)
    const previous = focusTarget.current
    focusTarget.current = null
    requestAnimationFrame(() => { if (previous?.isConnected) previous.focus({ preventScroll: true }) })
  }

  const preparePreview = useCallback(() => {
    events.current?.()
    const doc = frame.current?.contentDocument
    const main = doc?.querySelector<HTMLElement>("[data-builder-page]")
    if (!doc || !main || !doc.defaultView) { setCanvas(null); setError("This page couldn’t be loaded in the builder. Try Reload preview."); return }
    for (const details of doc.querySelectorAll<HTMLDetailsElement>("details")) {
      details.dataset.builderInitiallyOpen = String(details.open)
      if (details.name) { details.dataset.builderGroup = details.name; details.removeAttribute("name") }
      details.open = true
    }
    const css = doc.createElement("style")
    css.textContent = canvasCss
    doc.head.append(css)
    doc.querySelectorAll("[data-builder-public-zone]").forEach(el => el.remove())

    const native = new Map<string, HTMLElement>()
    const publishedCustom: HTMLElement[] = []
    for (const node of main.querySelectorAll<HTMLElement>(":scope > [data-builder-section]")) {
      if (node.hasAttribute("data-builder-custom")) publishedCustom.push(node)
      else if (node.dataset.builderSection) native.set(node.dataset.builderSection, node)
    }
    publishedCustom.forEach(node => node.remove())
    const legacy = main.querySelector<HTMLElement>("[data-editor-blocks]")
    const root = doc.createElement("div")
    root.className = "builder-studio-root"
    main.append(root)
    const anchors = [...main.querySelectorAll<HTMLElement>("[data-builder-anchor]")].flatMap(node => {
      const { builderAnchor: id, builderAnchorSection: section } = node.dataset
      if (!id || !section || !native.has(section)) return []
      const previous = node.previousElementSibling?.textContent?.trim().replace(/\s+/g, " ")
      return [{ id, section, label: previous?.slice(0, 36) || "this item", node }]
    })
    const handles: HTMLButtonElement[] = []
    const text: NativeText[] = [...doc.querySelectorAll<HTMLElement>(selector)].flatMap(node => {
      const item = captureCopy(node)
      if (!item) return []
      if (!["INPUT", "TEXTAREA"].includes(node.tagName)) node.tabIndex = 0
      const movable = movableText(node, item)
      let handle: HTMLButtonElement | undefined
      if (movable && !node.closest(".reviews-preview")) {
        handle = doc.createElement("button")
        handle.type = "button"; handle.className = "builder-studio-native-drag"; handle.draggable = true
        handle.textContent = "⠿"; handle.title = "Drag text to another position"
        handle.setAttribute("aria-label", "Drag text to move it, or click text for a Move to option")
        handle.addEventListener("dragstart", event => {
          event.dataTransfer?.setData(dragMime, JSON.stringify({ type: "native", scope: item.type, id: item.key }))
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
        })
        handle.addEventListener("click", event => { event.preventDefault(); clickPicker.current(item, node) })
        handles.push(handle)
        node.closest("h2,h3,h4,p")?.before(handle)
      }
      return [{ node, target: item, movable: handle ? movable : undefined, handle, attr: node.dataset.builderAttr, original: [...node.childNodes].map(child => child.cloneNode(true)), text: item.type === "image" ? (node as HTMLImageElement).alt : plain(node) }]
    })
    captured.current = text
    images.current = new Map(text.filter(entry => entry.target.type === "image").map(entry => [
      entry.node as HTMLImageElement, Object.fromEntries(["src", "srcset", "alt", "width", "height"].map(attr => [attr, entry.node.getAttribute(attr)])),
    ]))
    pictureSources.current = new Map([...doc.querySelectorAll<HTMLSourceElement>("picture:has(img[data-editor-image]) source[srcset]")].map(source => [source, source.getAttribute("srcset")!]))
    function select(event: MouseEvent | KeyboardEvent) {
      if (doc!.documentElement.classList.contains("builder-studio-clean")) return
      const start = event.target as Element | null
      if (!(start instanceof doc!.defaultView!.Element) || start.closest(".builder-studio-host,.builder-studio-junction,.builder-studio-anchor,.builder-studio-root")) return
      const node = start.closest<HTMLElement>(selector)
      const nested = !node ? start.closest("a,button,label,h1,h2,h3,h4,p,summary")?.querySelector<HTMLElement>(selector) : null
      const clicked = node ?? nested
      const item = clicked && captureCopy(clicked)
      if (item && clicked) { event.preventDefault(); clickPicker.current(item, clicked) }
      else if (start.closest("a,button,form")) event.preventDefault()
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") select(event)
    }
    function blockExternal(event: MouseEvent) {
      if (doc!.documentElement.classList.contains("builder-studio-clean")) {
        const link = (event.target as Element)?.closest("a")
        if (link && !link.getAttribute("href")?.startsWith("#")) event.preventDefault()
      }
    }
    function stopSubmit(event: Event) { event.preventDefault() }
    doc.addEventListener("click", select, true)
    doc.addEventListener("click", blockExternal, true)
    doc.addEventListener("keydown", keyboard, true)
    doc.addEventListener("submit", stopSubmit, true)
    events.current = () => {
      doc.removeEventListener("click", select, true)
      doc.removeEventListener("click", blockExternal, true)
      doc.removeEventListener("keydown", keyboard, true)
      doc.removeEventListener("submit", stopSubmit, true)
      handles.forEach(handle => handle.remove())
      root.remove()
      css.remove()
    }
    setEntries(text)
    setCanvas({ main, native, anchors, root, legacy, hosts: new Map() })
    setError("")
  }, [])

  useEffect(() => {
    const area = frameArea.current
    if (!area || !("ResizeObserver" in window)) return
    const observer = new ResizeObserver(([entry]) => setAvailable({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(area)
    return () => observer.disconnect()
  }, [editorOpen])
  useEffect(() => {
    const sync = () => setFullScreen(document.fullscreenElement === app.current)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])
  useEffect(() => () => events.current?.(), [])
  useEffect(() => {
    if (!changed) return
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", protect)
    return () => window.removeEventListener("beforeunload", protect)
  }, [changed])
  useEffect(() => {
    if (!canvas) return
    const doc = canvas.main.ownerDocument
    doc.documentElement.classList.toggle("editor-show-marks", showMarks)
    doc.documentElement.classList.toggle("builder-studio-clean", clean)
    for (const details of doc.querySelectorAll<HTMLDetailsElement>("details[data-builder-initially-open]")) {
      if (!clean) { details.removeAttribute("name"); details.open = true }
      else {
        details.open = details.dataset.builderInitiallyOpen === "true"
        if (details.dataset.builderGroup) details.name = details.dataset.builderGroup
      }
    }
    const moved = new Set(Object.values(layout.sections ?? {}).flatMap(section => [
      ...(section.before ?? []), ...(section.after ?? []), ...Object.values(section.anchors ?? {}).flat(),
    ]).flatMap(row => row.columns.flat().flatMap(item => item.source ? [item.source.scope + ":" + item.source.key] : [])))
    for (const entry of captured.current) {
      const { target, node, attr, original } = entry
      if (target.type === "image" || target.type === "legacy" || !node.isConnected) continue
      if (entry.movable) {
        const hidden = moved.has(target.type + ":" + target.key)
        const host = node.closest("h2,h3,h4,p")
        host?.toggleAttribute("data-builder-native-hidden", hidden)
        if (entry.handle) entry.handle.hidden = hidden
        if (!hidden) {
          node.removeAttribute("data-builder-moved-source")
          const placeholder = node.querySelector("[data-builder-moved-field]")
          if (placeholder) placeholder.replaceWith(...placeholder.childNodes)
        }
      }
      const next = target.type === "field" ? draft.fields?.[target.key as FieldKey] : target.type === "shared" ? content.shared?.[target.key] : draft.copy?.[target.key]
      if (next === entry.saved) continue
      if (attr) node.setAttribute(attr, next ?? entry.text)
      else if (next !== undefined && next !== entry.text) node.textContent = next
      else {
        node.replaceChildren(...original.map(child => child.cloneNode(true)))
        if (!moved.has(target.type + ":" + target.key)) {
          const placeholder = node.querySelector("[data-builder-moved-field]")
          if (placeholder) placeholder.replaceWith(...placeholder.childNodes)
        }
      }
      entry.saved = next
    }
    for (const [node, original] of images.current) {
      const key = node.dataset.editorImage as ImageKey
      const image = draft.images?.[key]
      for (const source of node.closest("picture")?.querySelectorAll("source") ?? []) {
        const original = pictureSources.current.get(source)
        if (image) source.removeAttribute("srcset")
        else if (original) source.setAttribute("srcset", original)
      }
      if (image) {
        node.removeAttribute("srcset")
        if (node.getAttribute("src") !== resolve(image.path)) node.src = resolve(image.path)
        node.alt = image.alt; node.width = image.width; node.height = image.height
      } else for (const [key, value] of Object.entries(original)) {
        if (value === null) node.removeAttribute(key)
        else if (node.getAttribute(key) !== value) node.setAttribute(key, value)
      }
    }
    const inner = canvas.legacy?.querySelector(".editor-blocks-inner")
    if (inner && canvas.legacy) {
      const blocks = draft.blocks ?? []
      canvas.legacy.hidden = !blocks.length
      inner.replaceChildren(...blocks.map(block => {
        const node = doc.createElement(block.type === "heading" ? "h2" : block.type === "paragraph" ? "p" : "a")
        node.textContent = block.text
        node.dataset.editorBlockId = block.id
        node.tabIndex = 0
        if (block.type === "document") { node.className = "editor-document"; node.setAttribute("href", resolve(block.file)); node.setAttribute("download", "") }
        return node
      }))
    }
  }, [canvas, content.shared, draft, clean, showMarks, layout])

  function changePage(next: PageKey) {
    if (next === page) return
    close(); setCanvas(null); setEntries([]); setPosition(null); setPage(next); setError("")
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === app.current) await document.exitFullscreen()
      else await app.current?.requestFullscreen()
    } catch { setError("Your browser did not allow fullscreen. The canvas still fills the editor window.") }
  }

  function rememberUpload(path: string, blob: Blob) {
    uploads.current.set(path, blob)
    previewUrls.current.set(path, URL.createObjectURL(blob))
  }
  function clearUploads() {
    uploads.current.clear()
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
    previewUrls.current.clear()
  }

  function placeNative(target: CopyTarget, destination: Position) {
    const entry = entries.find(entry => entry.target.key === target.key && entry.target.type === target.type)
    if (!entry?.movable || (target.type !== "field" && target.type !== "copy")) return false
    if (entry.node.closest("[data-builder-native-hidden]")) return false
    const tag = entry.node.closest("h2,h3,h4,p")?.tagName
    const value = entryValue(target).trim()
    if (!value) return false
    const item: BuilderElement = { id: id(), type: entry.movable, text: value, source: { key: target.key, scope: target.type },
      ...(entry.movable === "heading" ? { level: tag === "H4" ? 4 : tag === "H3" ? 3 : 2 } : {}) }
    if (!updateLayout(placeItem(layout, destination, item, id()))) return false
    setPosition(destination)
    return true
  }
  function placeDragged(drag: DragItem, where: Position) {
    if (busy) return
    setPosition(where)
    if (drag.type === "palette" && isElementType(drag.kind)) open({ type: "item", kind: drag.kind, position: where })
    if (drag.type === "native") placeNative({ type: drag.scope, key: drag.id }, where)
    if (drag.type === "item") {
      const item = locateItem(layout, drag.id)?.element
      if (item) updateLayout(placeItem(layout, where, item, id()))
    }
  }
  function sectionMove(key: string, before: string | null) {
    if (!busy) updateLayout(moveSection(layout, nativeKeys, key, before))
  }
  function applySection(config: SectionStyle) {
    if (target?.type !== "section") return
    let next: BuilderLayout
    if (target.section) next = changeSection(layout, target.section, config)
    else {
      const key = "section-" + id()
      const added = appendSection(layout, nativeKeys, key, target.before ?? null, config.name || "New section")
      if (added === layout) { setPopupError("This page has reached its section limit."); return }
      next = changeSection(added, key, { ...config, name: config.name || "New section" })
      setPosition({ section: key, zone: "after" })
    }
    if (updateLayout(next)) close()
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!target || busy) return
    const text = value.trim()
    setPopupError(""); setBusy(true)
    try {
      if (target.type === "item") {
        const { kind, position: destination } = target
        if (!text && kind !== "photo") throw new Error("Enter text before applying.")
        const item: BuilderElement = { ...editingItem, type: kind, text, id: editingItem?.id ?? id() }
        if (kind === "heading") item.level = level
        if (kind === "button") {
          if (!safeButtonUrl(link.trim())) throw new Error("Enter a valid website URL, site path, email, phone link, or page anchor.")
          item.link = link.trim()
        }
        if (kind === "youtube") {
          item.link = youtubeId(link)
          if (!item.link) throw new Error("Enter a valid YouTube video URL or 11-character video ID.")
        }
        if (["photo", "document", "video"].includes(kind)) {
          if (file) {
            const prepared = await prepareBuilderUpload(kind, file)
            Object.assign(item, prepared.item)
            rememberUpload(prepared.item.path!, prepared.blob)
          }
          if (!item.path) throw new Error("Choose a file before applying.")
        }
        const next = editingItem ? replaceItem(layout, item) : destination ? placeItem(layout, destination, item, id()) : layout
        if (next === layout) throw new Error("This location is full. Pick another row or column.")
        if (!updateLayout(next)) return
      } else if (target.type === "field" && isField(target.key)) {
        if (!text) throw new Error("Enter text before applying.")
        updatePage({ ...draft, fields: { ...draft.fields, [target.key]: text } })
      } else if (target.type === "copy" || target.type === "shared") {
        // Keep the whitespace used between inline fragments and neighbouring links/icons.
        const raw = editingEntry?.node.textContent ?? ""
        const leading = /^\s/.test(raw) ? " " : ""
        const trailing = /\s$/.test(raw) ? " " : ""
        const normalized = text ? (leading + text + trailing).slice(0, 6000) : ""
        if (target.type === "shared") update({ ...content, shared: { ...content.shared, [target.key]: normalized } })
        else updatePage({ ...draft, copy: { ...draft.copy, [target.key]: normalized } })
      } else if (target.type === "image" && isImage(target.key)) {
        const key = target.key
        const saved = draft.images?.[key]
        if (file) {
          const { blob, width, height } = await optimizeImage(file, key === "hero" ? 1600 : 1000)
          const path = `images/editor/${key}-${id()}.webp`
          rememberUpload(path, blob)
          updatePage({ ...draft, images: { ...draft.images, [key]: { path, width, height, alt: text } } })
        } else if (saved) updatePage({ ...draft, images: { ...draft.images, [key]: { ...saved, alt: text } } })
        else throw new Error("Choose a replacement photo to update this image.")
      } else if (target.type === "legacy") {
        if (!text) throw new Error("Enter text before applying.")
        updatePage({ ...draft, blocks: draft.blocks?.map(block => block.id === target.key ? { ...block, text } as Block : block) })
      }
      close()
    } catch (error) { setPopupError(errorText(error)) }
    finally { setBusy(false) }
  }

  async function connect(event: FormEvent) {
    event.preventDefault()
    const input = event.currentTarget.querySelector<HTMLInputElement>('input[type="password"]')
    const credential = input?.value.trim()
    if (!credential || busy) return
    if (input) input.value = ""
    setBusy(true); setError(""); setPopupError(""); setNeedsToken(false)
    try {
      const data = await unlock(credential)
      if (reconnect && snapshot && snapshot.sha !== data.sha) {
        throw new Error("Someone else published changes while this draft was open. Back up your draft before reopening the builder so you don’t overwrite their edits.")
      }
      token.current = credential
      if (reconnect) {
        setReconnect(false)
        setNotice("GitHub reconnected. Your draft is still open. Select Publish to GitHub to retry.")
      } else {
        if (window.innerWidth < 650) setWidth("Mobile")
        setSnapshot(data); setHistory({ past: [], now: data.content, next: [] })
      }
    } catch (error) {
      if (reconnect) setPopupError(errorText(error))
      else setError(errorText(error))
      setNeedsToken(error instanceof GitHubAccessError && error.needsToken)
    }
    finally { setBusy(false) }
  }
  function startDemo() {
    setPreviewOnly(true); setError("")
    if (window.innerWidth < 650) setWidth("Mobile")
    setHistory({ past: [], now: published, next: [] })
  }
  async function save() {
    if (!snapshot || !changed || previewOnly) return
    setConfirmPublish(false); setBusy(true); setError(""); setNotice(""); setNeedsToken(false)
    try {
      const result = await publish(token.current, snapshot, content, uploads.current)
      setCommit(result.commit); setSnapshot(result.snapshot)
      setNotice("Committed to GitHub. GitHub Pages is rebuilding the public website.")
    } catch (error) {
      setError(errorText(error))
      setNeedsToken(error instanceof GitHubAccessError && error.needsToken)
    }
    finally { setBusy(false) }
  }
  function backup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }))
    const anchor = document.createElement("a")
    anchor.href = url; anchor.download = "newcitywellness-content-draft.json"; anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function lock() {
    if (changed && !window.confirm("Leave the editor and discard unpublished changes?")) return
    token.current = ""; clearUploads()
    if (document.fullscreenElement === app.current) void document.exitFullscreen().catch(() => {})
    close(); setCanvas(null); setEntries([]); setPosition(null); setSnapshot(null); setPreviewOnly(false)
    setHistory({ past: [], now: emptyContent, next: [] })
    setPage("home"); setConfirmPublish(false); setReconnect(false); setNeedsToken(false); setNotice(""); setCommit(""); setClean(false); setError("")
  }

  const currentRow = target?.type === "columns" ? rowsAt(layout, target.position).find(row => row.id === target.position.row) : undefined
  const legacyBlock = target?.type === "legacy" ? draft.blocks?.find(block => block.id === target.key) : undefined
  const editingPhoto = target?.type === "image" ? draft.images?.[target.key as ImageKey] : undefined
  const dialogKey = !target ? "" : isCopyTarget(target) ? target.type + target.key : target.type === "item" ? (target.itemId ?? target.kind) : target.type

  return <main ref={app} className={editorOpen ? "editor-app editor-app-unlocked builder-app" : "editor-app builder-app"}>
    <header className="editor-top">
      <div className="builder-brand"><LayoutTemplate size={22} aria-hidden="true" /><div><span className="editor-kicker">NEW CITY WELLNESS</span><h1>Website Builder</h1></div></div>
      <div className="editor-top-actions">
        <a href={base + "/admin/grapes/"}>GrapesJS Design Studio ↗</a>
        <a href={base + "/"} target="_blank" rel="noopener noreferrer">View website ↗</a>
        {editorOpen && <button type="button" onClick={toggleFullscreen}>{fullScreen ? "Exit fullscreen" : "Fullscreen"}</button>}
        {editorOpen && <button type="button" disabled={busy} onClick={lock}>{previewOnly ? "Exit demo" : "Lock editor"}</button>}
      </div>
    </header>
    {notice && <div className="editor-message" role="status">{notice} {commit && <a href={`${repoUrl}/actions?query=sha%3A${commit}`} target="_blank" rel="noopener noreferrer">Check deployment ↗</a>}</div>}
    {error && <div className="editor-message editor-error" role="alert">{error} {needsToken && snapshot &&
      <button type="button" disabled={busy} onClick={() => { setPopupError(""); setReconnect(true) }}>Reconnect GitHub without losing draft</button>}</div>}
    {!editorOpen ? <section className="editor-lock">
      <span className="editor-kicker">SITE ADMIN</span>
      <h2>Unlock the website builder</h2>
      <p>Edit your pages visually and publish directly to GitHub.</p>
      <form onSubmit={connect}>
        <label htmlFor="editor-pass">Editor password (GitHub token)</label>
        <input id="editor-pass" type="password" autoComplete="off" required spellCheck={false} disabled={busy} />
        <button className="editor-primary" disabled={busy}>{busy ? "Checking access…" : "Unlock editor"}</button>
      </form>
      <p className="editor-muted">On GitHub, choose <strong>Only select repositories → Newcitywellness</strong> and confirm <strong>Contents → Read and write</strong>. Paste the token here only. It stays in this tab and is sent only to GitHub.</p>
      <a href={tokenSetupUrl} target="_blank" rel="noopener noreferrer">Set up a Newcitywellness GitHub token ↗</a>
      <button type="button" onClick={startDemo} disabled={busy}>Try the builder without publishing</button>
    </section> : <>
      <div className="editor-toolbar builder-toolbar">
        <label>Page <select value={page} disabled={busy} onChange={event => changePage(event.currentTarget.value as PageKey)}>{pages.map(([key, , label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div className="editor-view-buttons" role="group" aria-label="Preview screen size">{["Desktop", "Tablet", "Mobile"].map(size => <button key={size} type="button" aria-pressed={width === size} onClick={() => setWidth(size)}>{size}</button>)}</div>
        <div className="editor-toolbar-actions">
          <button type="button" aria-label="Undo" title="Undo" disabled={!history.past.length || busy} onClick={undo}><Undo2 size={16} /></button>
          <button type="button" aria-label="Redo" title="Redo" disabled={!history.next.length || busy} onClick={redo}><Redo2 size={16} /></button>
          <span role="status">{previewOnly ? "Demo · not published" : changed ? "Unpublished changes" : "Up to date"}</span>
          {!previewOnly && <button className="editor-primary" disabled={busy || !changed} onClick={() => setConfirmPublish(true)}>{busy ? "Working…" : "Publish to GitHub"}</button>}
        </div>
      </div>
      {confirmPublish && <div className="editor-message editor-confirm" role="group" aria-label="Confirm publishing">
        <strong>Publish to the public site?</strong> Layouts, text and attached files will be committed to GitHub. <button className="editor-primary" disabled={busy} onClick={save}>Publish now</button><button onClick={() => setConfirmPublish(false)}>Keep editing</button>
      </div>}
      <section className="editor-preview" aria-label="Visual page canvas">
        <div className="editor-preview-bar">
          {!clean && <ElementPalette choose={kind => position ? open({ type: "item", kind, position }) : open({ type: "position", element: kind })} disabled={!canvas || busy} />}
          <div className="editor-view-buttons builder-tools">
            {!clean && <><button type="button" disabled={!canvas || busy} onClick={() => open({ type: "section" })}><Plus size={15} /> Section</button>
              <button type="button" disabled={!canvas || busy} onClick={() => open({ type: "outline" })}><Grid2X2 size={15} /> Sections</button>
              <button type="button" disabled={!canvas || busy} onClick={() => open({ type: "find" })}><Search size={15} /> Find text</button>
              <button type="button" disabled={!canvas || busy} aria-pressed={showMarks} onClick={() => setShowMarks(!showMarks)}>Highlights</button></>}
            <button type="button" disabled={!canvas || busy} aria-pressed={clean} onClick={() => setClean(!clean)}><Eye size={15} /> {clean ? "Back to editing" : "Preview"}</button>
            <details className="editor-more"><summary>More</summary><div>
              <button type="button" disabled={busy} onClick={backup}>Download draft JSON</button>
              {!previewOnly && <button type="button" disabled={busy} onClick={() => { setPopupError(""); setReconnect(true) }}>Reconnect GitHub</button>}
              <button type="button" disabled={busy} onClick={() => { setCanvas(null); setRevision(revision + 1) }}>Reload preview</button>
            </div></details>
          </div>
          {!clean && <p className="builder-tip">{canvas ? "Drag an element onto a dotted slot, or tap a slot to add. Click text to edit." : "Loading page canvas…"}</p>}
        </div>
        <div className="editor-frame-scroll" ref={frameArea}>
          <div className="editor-frame-device" style={{ width: screenWidth * scale, height: screenHeight * scale }}>
            <iframe key={`${page}-${revision}`} ref={frame} title={`${active[2]} canvas`} src={base + active[1]} onLoad={preparePreview}
              sandbox="allow-same-origin" referrerPolicy="no-referrer" style={{ width: screenWidth, height: screenHeight, transform: `scale(${scale})` }} />
          </div>
        </div>
      </section>
      {canvas && <BuilderCanvas canvas={canvas} layout={layout} clean={clean} resolve={resolve} selection={position} select={setPosition}
        add={position => open({ type: "palette", position })} addSection={before => open({ type: "section", before })}
        edit={item => open({ type: "item", kind: item.type, itemId: item.id })} columns={position => open({ type: "columns", position })}
        sectionSettings={section => open({ type: "section", section })} moveSection={sectionMove} place={placeDragged} />}
      {reconnect && <EditorDialog title="Reconnect GitHub" close={() => setReconnect(false)} busy={busy}>
        <form className="editor-dialog-body" onSubmit={connect}>
          <p>Your current draft and selected uploads stay in this tab.</p>
          {popupError && <p className="editor-popup-error" role="alert">{popupError}</p>}
          <label>New GitHub token<input type="password" autoComplete="off" spellCheck={false} required disabled={busy} /></label>
          <a href={tokenSetupUrl} target="_blank" rel="noopener noreferrer">Set up a Newcitywellness GitHub token ↗</a>
          <div className="editor-dialog-actions"><button type="button" onClick={() => setReconnect(false)} disabled={busy}>Cancel</button><button className="editor-primary" type="submit" disabled={busy}>{busy ? "Checking access…" : "Reconnect GitHub"}</button></div>
        </form>
      </EditorDialog>}
      {target && <EditorDialog key={dialogKey} title={popupTitle} subtitle={active[2]} close={close} busy={busy}>
        {popupError && <p className="editor-popup-error builder-dialog-error" role="alert">{popupError}</p>}
        {target.type === "find" ? <div className="editor-dialog-body">
          <label>Search this page <input type="search" value={find} onChange={event => setFind(event.currentTarget.value)} placeholder="Search headings, labels, or body text" /></label>
          <div className="editor-find-results">{entries.filter(entry => !entry.node.hasAttribute("data-builder-proxy") && (copyLabel(entry) + " " + entryValue(entry.target)).toLowerCase().includes(find.toLowerCase())).map((entry, index) =>
            <button key={entry.target.type + entry.target.key + index} type="button" onClick={() => open(entry.target)}>
              {copyLabel(entry).slice(0, 110)}{entry.target.type === "shared" && <small>Shared across the site</small>}
            </button>)}</div>
        </div> : target.type === "outline" ? <div className="editor-dialog-body">
          <p className="editor-muted">Click a section to jump to it on the canvas.</p>
          <div className="editor-find-results">{[...(layout.order ?? []), ...nativeKeys].filter((key, index, keys) => keys.indexOf(key) === index).map(key => {
            const label = layout.sections?.[key]?.name ?? nativeLabels.get(key) ?? "New section"
            return <button key={key} type="button" onClick={() => {
              close()
              canvas?.hosts.get(key + ":before")?.scrollIntoView({ block: "start" })
            }}>{label}</button>
          })}</div>
        </div> : target.type === "section" ? <SectionForm style={target.section ? { ...layout.sections?.[target.section], name: layout.sections?.[target.section]?.name ?? nativeLabels.get(target.section) } : {}}
          isNew={!target.section} removable={!!target.section && customSection(target.section)} close={close} apply={applySection}
          remove={() => { if (target.section) { updateLayout(removeSection(layout, target.section)); if (position?.section === target.section) setPosition(null); close() } }} />
        : target.type === "columns" ? <div className="editor-dialog-body"><ColumnOptions columns={currentRow?.columns.length ?? 1} exists={!!currentRow} choose={count => {
          const next = currentRow ? setColumns(layout, target.position, count) : addRow(layout, target.position, id(), count)
          if (next === layout && currentRow?.columns.length !== count) { setPopupError("There’s no room for this layout. Try a different row."); return }
          if (next === layout || updateLayout(next)) { setPosition(null); close() }
        }} remove={() => { updateLayout(removeRow(layout, target.position)); setPosition(null); close() }} /></div>
        : target.type === "palette" ? <div className="editor-dialog-body">
          <ElementPalette choose={kind => open({ type: "item", kind, position: target.position })} />
          <button type="button" onClick={() => open({ type: "columns", position: target.position })}><Columns3 size={15} /> Add a row with columns</button>
        </div> : target.type === "position" ? <div className="editor-dialog-body">
          <PositionPicker layout={layout} labels={nativeLabels} initial={position} submitLabel={target.moving || target.native ? "Move here" : "Continue"} select={destination => {
            if (target.native) {
              if (placeNative(target.native, destination)) close()
              else setPopupError("Choose another available position.")
            } else if (target.moving) {
              const item = locateItem(layout, target.moving)?.element
              if (item && updateLayout(placeItem(layout, destination, item, id()))) { setPosition(destination); close() }
              else setPopupError("Choose a different row or column.")
            } else if (target.element) { setPosition(destination); open({ type: "item", kind: target.element, position: destination }) }
          }} />
        </div> : <form className="editor-dialog-body" onSubmit={submit}>
          {target.type === "item" ? <ElementFields type={target.kind} item={editingItem} value={value} setValue={setValue} link={link} setLink={setLink} level={level} setLevel={setLevel} chooseFile={setFile} file={file} />
          : target.type === "image" ? <>
            {(editingPhoto || editingEntry) && <img className="editor-photo-preview" alt="Current image" src={editingPhoto ? resolve(editingPhoto.path) : (editingEntry?.node as HTMLImageElement | undefined)?.src} />}
            <label>Replacement photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => setFile(event.currentTarget.files?.[0] ?? null)} /></label>
            <label>Image description<input value={value} maxLength={160} onChange={event => setValue(event.currentTarget.value)} /></label>
          </> : <><label>{editingEntry?.attr ? "Placeholder text" : "Text"}
            <textarea value={value} onChange={event => setValue(event.currentTarget.value)} maxLength={target.type === "field" && isField(target.key) ? maxFieldLength(target.key) : target.type === "legacy" ? legacyBlock?.type === "paragraph" ? 2400 : 140 : 6000} />
            </label>{target.type === "shared" && <p className="editor-muted">This label is shared across all pages.</p>}</>}
          <div className="editor-dialog-actions">
            {editingEntry?.movable && <button type="button" onClick={() => open({ type: "position", native: editingEntry.target })}>Move to…</button>}
            {editingItem && <><button type="button" className="editor-remove" onClick={() => { if (updateLayout(removeItem(layout, editingItem.id))) close() }}>Remove</button>
              <button type="button" onClick={() => open({ type: "position", moving: editingItem.id })}>Move to…</button></>}
            {legacyBlock && <button type="button" className="editor-remove" onClick={() => { updatePage({ ...draft, blocks: draft.blocks?.filter(block => block.id !== legacyBlock.id) }); close() }}>Remove</button>}
            <button type="button" onClick={close} disabled={busy}>Cancel</button>
            <button type="submit" className="editor-primary" disabled={busy}>{busy ? "Preparing…" : "Apply to draft"}</button>
          </div>
        </form>}
      </EditorDialog>}
    </>}
  </main>
}
