"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { ArrowDown, ArrowUp, Columns3, GripVertical, Plus, Settings2 } from "lucide-react"
import { builderSectionStyle, PageElement } from "../builder-page"
import { customSection, elementTypes, sectionOrder, type BuilderElement, type BuilderLayout, type BuilderRow, type Position } from "../../content/builder-model"

import { acceptsPageForgeDrag, activePageForgeDrag, beginPageForgeDrag, endPageForgeDrag, insertBeforeAtMidpoint, readPageForgeDrop, subscribePageForgeDrag, type PageForgeDrag } from "./pageforge/drag"

export type DragItem = PageForgeDrag
export function startDrag(event: React.DragEvent, item: DragItem) { beginPageForgeDrag(event.dataTransfer, item) }
function accept(event: React.DragEvent) {
  if (!acceptsPageForgeDrag(event.dataTransfer)) return false
  event.preventDefault()
  event.stopPropagation()
  return true
}
function drop(event: React.DragEvent, next: (item: DragItem) => void) {
  if (!accept(event)) return
  event.currentTarget.classList.remove("is-drop")
  const item = readPageForgeDrop(event.dataTransfer)
  if (item) next(item)
  endPageForgeDrag()
}
const enter = (event: React.DragEvent) => { if (accept(event)) event.currentTarget.classList.add("is-drop") }
const leave = (event: React.DragEvent) => {
  const related = event.relatedTarget
  if (!related || !(related instanceof event.currentTarget.ownerDocument.defaultView!.Node) || !event.currentTarget.contains(related)) event.currentTarget.classList.remove("is-drop")
}

export type NativeCanvas = { main: HTMLElement; native: Map<string, HTMLElement>; anchors: Array<{ section: string; id: string; node: HTMLElement; label: string }>; root: HTMLElement; legacy: HTMLElement | null; publishedOrder: string[]; preserved: { node: HTMLElement; before: string | null }[]; hosts: Map<string, HTMLElement> }

type Props = {
  canvas: NativeCanvas; layout: BuilderLayout; clean: boolean; resolve: (path: string) => string
  add: (position: Position) => void; addSection: (before: string | null) => void
  edit: (item: BuilderElement) => void; columns: (position: Position) => void
  sectionSettings: (id: string) => void; moveSection: (id: string, before: string | null) => void
  place: (item: DragItem, position: Position) => void
  selection: Position | null; select: (position: Position) => void
}

export function BuilderCanvas(p: Props) {
  const { canvas, layout, clean } = p
  const order = sectionOrder({ ...layout, order: layout.order ?? canvas.publishedOrder }, [...canvas.native.keys()])
  const handlers = useRef({ order, moveSection: p.moveSection, place: p.place })
  useEffect(() => { handlers.current = { order, moveSection: p.moveSection, place: p.place } })
  useEffect(() => {
    const { main, hosts } = canvas
    const doc = main.ownerDocument
    const onDragEnd = () => {
      delete doc.documentElement.dataset.pageforgeDrag
      main.querySelectorAll(".is-drop").forEach(node => node.classList.remove("is-drop"))
    }
    const unsubscribe = subscribePageForgeDrag(item => {
      if (item) doc.documentElement.dataset.pageforgeDrag = item.type
      else onDragEnd()
    })
    function sectionBelow(event: DragEvent, dragged?: string) {
      return insertBeforeAtMidpoint(event.clientY, handlers.current.order.flatMap(id => {
        const section = canvas.native.get(id) ?? hosts.get("custom-" + id)
        if (!section) return []
        const rect = section.getBoundingClientRect()
        return rect ? [{ id, top: rect.top, height: rect.height }] : []
      }), dragged)
    }
    function blockDestination(event: DragEvent): Position | undefined {
      const element = event.target
      if (!(element instanceof doc.defaultView!.Element)) return
      const sectionNode = element.closest<HTMLElement>("[data-pageforge-section]")
      const section = sectionNode?.dataset.pageforgeSection
      if (!section) return
      // Drop over an existing text/card area to insert at its nearest registered inline slot.
      const inline = anchorsNear(section, event.clientX, event.clientY)
      if (inline) return { section, zone: "after", anchor: inline }
      const rect = sectionNode.getBoundingClientRect()
      return { section, zone: event.clientY < rect.top + rect.height / 2 ? "before" : "after" }
    }
    function anchorsNear(section: string, x: number, y: number) {
      return canvas.anchors.filter(anchor => {
        const previous = anchor.node.previousElementSibling
        if (anchor.section !== section || !previous?.getClientRects().length) return false
        const rect = previous.getBoundingClientRect()
        return x >= rect.left - 20 && x <= rect.right + 20 && y >= rect.top - 12 && y <= rect.bottom + 26
      }).reduce<{ id: string; distance: number } | undefined>((best, anchor) => {
        const distance = Math.abs(anchor.node.previousElementSibling!.getBoundingClientRect().bottom - y)
        return !best || distance < best.distance ? { id: anchor.id, distance } : best
      }, undefined)?.id
    }
    function mark(event: DragEvent) {
      const drag = activePageForgeDrag()
      if (!drag || !acceptsPageForgeDrag(event.dataTransfer)) return
      main.querySelectorAll(".is-drop").forEach(node => node.classList.remove("is-drop"))
      if (drag.type === "section") {
        event.preventDefault()
        const slot = sectionBelow(event, drag.id)
        const boundary = slot ? hosts.get("junction-" + slot) : canvas.root
        boundary?.querySelector(".builder-studio-boundary")?.classList.add("is-drop")
      } else {
        const position = blockDestination(event)
        if (!position) return
        event.preventDefault()
        const parent = hosts.get(position.anchor ? "anchor-" + position.anchor : position.section + ":" + position.zone)
        parent?.querySelector(".builder-studio-zone-actions > .builder-studio-slot, .builder-studio-empty-zone .builder-studio-slot")?.classList.add("is-drop")
      }
    }
    function move(event: DragEvent) {
      const item = readPageForgeDrop(event.dataTransfer)
      if (!item) return
      const destination = item.type === "section" ? undefined : blockDestination(event)
      if (item.type !== "section" && !destination) return
      event.preventDefault()
      event.stopPropagation()
      if (item.type === "section") handlers.current.moveSection(item.id, sectionBelow(event, item.id))
      else if (destination) handlers.current.place(item, destination)
      endPageForgeDrag()
    }
    main.addEventListener("dragover", mark)
    main.addEventListener("drop", move)
    return () => { unsubscribe(); onDragEnd(); main.removeEventListener("dragover", mark); main.removeEventListener("drop", move) }
  }, [canvas])
  const hosts = useRef(canvas.hosts)
  function host(id: string) {
    let fresh = hosts.current.get(id)
    if (!fresh) {
      fresh = canvas.main.ownerDocument.createElement("div")
      hosts.current.set(id, fresh)
    }
    return fresh
  }

  useEffect(() => {
    const { main, native, anchors, root, legacy } = canvas
    root.hidden = clean
    let cursor: ChildNode | null = main.firstChild
    const insert = (node: HTMLElement) => {
      if (node !== cursor) main.insertBefore(node, cursor)
      cursor = node.nextSibling
    }
    const active = new Set<string>()
    const activate = (id: string) => { active.add(id); return host(id) }
    for (const sectionId of order) {
      const junction = activate("junction-" + sectionId)
      junction.className = "builder-studio-junction"
      insert(junction)
      for (const part of canvas.preserved) if (part.before === sectionId) insert(part.node)
      const template = native.get(sectionId)
      const node = template ?? activate("custom-" + sectionId)
      if (!template) node.className = "builder-section builder-custom"
      node.dataset.pageforgeSection = sectionId
      insert(node)
      const settings = layout.sections?.[sectionId]
      const { "--builder-bg": background, "--builder-fg": foreground } = builderSectionStyle(settings) as Record<string, string | undefined>
      if (background) node.style.setProperty("--builder-bg", background)
      else node.style.removeProperty("--builder-bg")
      if (foreground) node.style.setProperty("--builder-fg", foreground)
      else node.style.removeProperty("--builder-fg")
      node.toggleAttribute("data-builder-background", !!background)
      node.toggleAttribute("data-builder-foreground", !!foreground)
      for (const zone of ["before", "after"] as const) {
        const zoneHost = activate(sectionId + ":" + zone)
        zoneHost.className = "builder-studio-host"
        if (zone === "before" && node.firstChild !== zoneHost) node.prepend(zoneHost)
        if (zone === "after" && node.lastChild !== zoneHost) node.append(zoneHost)
      }
    }
    for (const { section, id, node } of anchors) {
      if (!order.includes(section)) continue
      const anchorHost = activate("anchor-" + id)
      anchorHost.className = "builder-studio-anchor"
      if (node.nextSibling !== anchorHost) node.after(anchorHost)
    }
    for (const part of canvas.preserved) if (!part.before) insert(part.node)
    if (legacy && legacy.nextSibling !== root) main.insertBefore(legacy, root)
    for (const [id, node] of hosts.current) if (!active.has(id)) { node.remove(); hosts.current.delete(id) }
  })

  useEffect(() => () => { hosts.current.forEach(node => node.remove()); hosts.current.clear() }, [canvas])

  function junction(before: string | null) {
    return <div className="builder-studio-boundary" onDragOver={enter} onDragLeave={leave} onDrop={event => drop(event, item => {
      if (item.type === "section") p.moveSection(item.id, before)
      else { const last = order.at(-1); if (before || last) p.place(item, before ? { section: before, zone: "before" } : { section: last!, zone: "after" }) }
    })}>
      <button type="button" onClick={() => p.addSection(before)} aria-label={before ? "Add a section above" : "Add a section at the end"}><Plus size={14} /> Section</button>
    </div>
  }

  function dropSlot(position: Position, label: string, compact = false) {
    const isSelected = p.selection && JSON.stringify(p.selection) === JSON.stringify(position)
    return <button type="button" className={`builder-studio-slot${compact ? " is-compact" : ""}${isSelected ? " is-selected" : ""}`}
      aria-label={label} onClick={() => { p.select(position); p.add(position) }}
      onDragOver={event => { if (activePageForgeDrag()?.type !== "section") enter(event) }} onDragLeave={leave}
      onDrop={event => { if (activePageForgeDrag()?.type !== "section") drop(event, item => p.place(item, position)) }}>
      <Plus size={14} /><span>{label}</span>
    </button>
  }

  function rows(section: string, zone: Position["zone"], prefix: string, layoutRows: BuilderRow[] = [], anchor?: string) {
    const basePosition = { section, zone, ...(anchor ? { anchor } : {}) }
    const shown = clean ? layoutRows.filter(row => row.columns.some(col => col.length)) : layoutRows
    if (clean && !shown.length) return null
    return <div className={`builder-zone ${anchor ? "builder-zone-inline" : ""} ${!shown.length ? "builder-studio-empty-zone" : ""}`}>
      <div className={anchor ? "builder-zone-inner" : "container builder-zone-inner"}>
        {shown.map(row => <div key={row.id} className="builder-studio-row">
          {!clean && <button className="builder-studio-row-settings" type="button" onClick={() => p.columns({ ...basePosition, row: row.id })}><Columns3 size={14} /> {row.columns.length} {row.columns.length === 1 ? "column" : "columns"}</button>}
          <div className="builder-row" style={{ "--builder-columns": row.columns.length } as CSSProperties}>
            {row.columns.map((column, index) => <div key={index} className="builder-column">
              {column.map(item => <div className="builder-element" key={item.id}>
                {!clean && dropSlot({ ...basePosition, row: row.id, column: index, before: item.id }, "Insert above element", true)}
                <div className={!clean ? "builder-studio-item" : undefined} onClick={clean ? undefined : (event) => { event.preventDefault(); p.edit(item) }}>
                  {!clean && <div className="builder-studio-item-bar">
                    <button type="button" aria-label={`Edit ${elementTypes[item.type]}`} onClick={event => { event.stopPropagation(); p.edit(item) }} draggable onDragStart={event => startDrag(event, { type: "item", id: item.id })} onDragEnd={endPageForgeDrag}><GripVertical size={14} /> {elementTypes[item.type]}</button>
                  </div>}
                  <PageElement item={item} resolve={p.resolve} />
                </div>
              </div>)}
              {!clean && dropSlot({ ...basePosition, row: row.id, column: index }, column.length ? "Add to column" : "Drop element here")}
            </div>)}
          </div>
        </div>)}
        {!clean && (anchor && !shown.length ? dropSlot(basePosition, prefix, true) : <div className="builder-studio-zone-actions">
          {dropSlot(basePosition, prefix)}
          <button type="button" onClick={() => p.columns(basePosition)}><Columns3 size={14} /> Add row</button>
        </div>)}
      </div>
    </div>
  }

  return <>
    {!clean && createPortal(junction(null), canvas.root, "end")}
    {order.map((id, index) => {
      const isNew = customSection(id)
      const settings = layout.sections?.[id]
      const label = settings?.name ?? canvas.native.get(id)?.dataset.builderLabel ?? "New section"
      return <span hidden key={id}>
        {!clean && createPortal(junction(id), host("junction-" + id), "junction")}
        {createPortal(<>
          {!clean && <div className="builder-studio-section-bar">
            <button type="button" draggable onDragStart={event => startDrag(event, { type: "section", id })} onDragEnd={endPageForgeDrag} onClick={() => p.sectionSettings(id)} title="Drag to reorder or click for settings"><GripVertical size={16} />{label}</button>
            <div><button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => p.moveSection(id, order[index - 1])}><ArrowUp size={15} /></button>
              <button type="button" aria-label={`Move ${label} down`} disabled={index === order.length - 1} onClick={() => p.moveSection(id, order[index + 2] ?? null)}><ArrowDown size={15} /></button>
              <button type="button" aria-label={`Settings for ${label}`} onClick={() => p.sectionSettings(id)}><Settings2 size={15} /></button></div>
          </div>}
          {(!isNew || settings?.before?.length) ? rows(id, "before", "Add above section content", settings?.before) : null}
        </>, host(id + ":before"), "before")}
        {createPortal(rows(id, "after", isNew ? "Add element to section" : "Add below section content", settings?.after), host(id + ":after"), "after")}
      </span>
    })}
    {canvas.anchors.map(({ section, id, label }) =>
      <span hidden key={id}>{createPortal(rows(section, "after", `Insert after ${label}`, layout.sections?.[section]?.anchors?.[id], id), host("anchor-" + id))}</span>)}
  </>
}

export const canvasCss = `
  .builder-studio-native-drag {position:absolute;z-index:4;margin-inline-start:-24px;opacity:0;pointer-events:none;padding:1px 4px!important;font:600 11px/1.2 system-ui,sans-serif!important;background:#eef6e9!important;color:#1a472d!important;border-radius:4px;border:1px solid #91af97;cursor:grab!important;}
  .builder-studio-native-drag:hover,.builder-studio-native-drag:has(+ :is(h2,h3,h4,p):hover),.builder-studio-native-drag:focus-visible,html.editor-show-marks .builder-studio-native-drag {opacity:1;pointer-events:auto;}
  html.builder-studio-clean .builder-studio-native-drag,.builder-studio-native-drag[hidden] {display:none!important;}
  html:not(.builder-studio-clean) builder-copy[data-builder-copy]:not([data-builder-moved-source]) { display:inline !important; }
  html:not(.builder-studio-clean) :is([data-builder-copy]:not(input),[data-editor-field]) { cursor:text; }
  html:not(.builder-studio-clean) img[data-editor-image] {cursor:pointer;}
  html:not(.builder-studio-clean) .hero-media, html:not(.builder-studio-clean) .page-hero-photo {pointer-events:auto;}
  html:not(.builder-studio-clean) :is([data-builder-copy], [data-editor-field], img[data-editor-image], [data-editor-block-id]):hover,
  html.editor-show-marks:not(.builder-studio-clean) :is([data-builder-copy],[data-editor-field],img[data-editor-image]) {outline:1px dashed #aa791f;outline-offset:2px;}
  .page-load-indicator, html:not(.builder-studio-clean) .condition-search-widget {display:none !important;}
  .ncw *, .ncw *::before, .ncw *::after {animation:none !important;transition:none !important;}

  .builder-studio-junction,.builder-studio-host,.builder-studio-anchor {min-width:0;}
  .builder-studio-junction:empty,.builder-studio-host:empty,.builder-studio-anchor:empty {display:none;}
  .builder-studio-boundary,.builder-studio-section-bar,.builder-studio-zone-actions,.builder-studio-item-bar {display:flex;align-items:center;gap:6px;}
  .builder-studio-boundary {justify-content:center;position:relative;z-index:3;height:0;}
  .builder-studio-boundary > button {position:absolute;top:-12px;opacity:0;min-height:25px!important;pointer-events:none;}
  .builder-studio-boundary:hover > button,.builder-studio-boundary:focus-within > button,html[data-pageforge-drag] .builder-studio-boundary > button,html.editor-show-marks .builder-studio-boundary > button {opacity:1;pointer-events:auto;}
  html[data-pageforge-drag] .builder-studio-boundary {height:26px;}
  .builder-studio-boundary.is-drop {background:#afd4b2;box-shadow:inset 0 3px #226e48;}
  .builder-studio-section-bar {justify-content:space-between;position:absolute;left:12px;right:12px;top:4px;z-index:6;opacity:0;pointer-events:none;}
  .builder-studio-section-bar button {pointer-events:none;}
  .builder-studio-section-bar:hover button,.builder-native:hover .builder-studio-section-bar button,.builder-custom:hover .builder-studio-section-bar button,.builder-studio-section-bar:focus-within button,html.editor-show-marks .builder-studio-section-bar button,html[data-pageforge-drag] .builder-studio-section-bar button {pointer-events:auto;}
  .builder-native:hover .builder-studio-section-bar,.builder-custom:hover .builder-studio-section-bar,.builder-studio-section-bar:focus-within,html.editor-show-marks .builder-studio-section-bar,html[data-pageforge-drag] .builder-studio-section-bar {opacity:1;}
  .builder-native,.builder-custom {display:block!important;position:relative;}
  html.builder-studio-clean .builder-native {display:contents!important;}
  .builder-studio-section-bar > div {display:flex;gap:4px;}
  .ncw :is(.builder-studio-section-bar,.builder-studio-boundary,.builder-studio-item-bar,.builder-studio-zone-actions,.builder-studio-row) button:not(.builder-link), .ncw .builder-studio-slot {border:1px solid #a8bcaa;border-radius:5px;color:#163b29;background:#f6fcf6;font:650 12px/1.25 system-ui,sans-serif;text-align:center;min-height:30px;cursor:pointer;padding:4px 8px;display:inline-flex;align-items:center;justify-content:center;gap:5px;}
  .ncw [draggable=true] {cursor:grab!important;}
  .ncw .builder-studio-section-bar button:disabled {opacity:.4;cursor:default;}
  html:not(.builder-studio-clean) .builder-studio-host .builder-zone,
  html:not(.builder-studio-clean) .builder-studio-anchor .builder-zone {padding:7px 0;}
  html:not(.builder-studio-clean):not([data-pageforge-drag]):not(.editor-show-marks) .builder-studio-empty-zone {position:relative;height:0;padding:0!important;z-index:3;background:none;}
  html:not(.builder-studio-clean):not([data-pageforge-drag]):not(.editor-show-marks) .builder-studio-empty-zone > div {position:relative;top:-8px;opacity:0;pointer-events:none;}
  html:not(.builder-studio-clean):not([data-pageforge-drag]):not(.editor-show-marks) .builder-studio-empty-zone:focus-within > div {opacity:1;pointer-events:auto;}
  .builder-custom .builder-studio-empty-zone {height:auto!important;min-height:45px;}
  .builder-custom .builder-studio-empty-zone > div {opacity:1!important;top:0!important;pointer-events:auto!important;}
  html:not(.builder-studio-clean) .builder-studio-host .builder-zone-inner,
  html:not(.builder-studio-clean) .builder-studio-anchor .builder-zone-inner {gap:8px;}
  .builder-studio-anchor .builder-zone {min-width:0;}
  .ncw .builder-studio-zone-actions {justify-content:center;flex-wrap:wrap;}
  .ncw .builder-studio-zone-actions .builder-studio-slot {flex:1;}
  .ncw .builder-studio-slot {width:100%;border-style:dashed!important;background:#f4faf371!important;min-height:34px!important;}
  .ncw .builder-studio-slot.is-compact {min-height:19px!important;padding-block:1px!important;opacity:.6;font-size:10px!important;}
  .ncw .builder-studio-slot.is-drop,.ncw .builder-studio-slot.is-selected {opacity:1;background:#c0e5c3!important;border-color:#24683e!important;}
  .ncw .builder-studio-slot:hover,.ncw .builder-studio-slot:focus-visible {opacity:1;}
  html:not(.builder-studio-clean) .builder-studio-anchor > .builder-studio-empty-zone {padding:2px 0;}
  .builder-studio-item {position:relative;border:1px dashed #81a78e;border-radius:5px;padding:4px;cursor:pointer;overflow-wrap:anywhere;}
  .builder-studio-item :is(iframe,video) {pointer-events:none;}
  .builder-studio-item-bar {margin-bottom:4px;justify-content:flex-start;}
  .builder-studio-row {min-width:0;}
  .builder-studio-row-settings {margin-bottom:4px;}
  .builder-studio-root[hidden] {display:none!important;}
`
