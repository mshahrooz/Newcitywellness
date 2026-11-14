"use client"

import { useState } from "react"
import { AlignLeft, Columns3, FileDown, Heading, Image, Link2, Play, Video } from "lucide-react"
import { colorValue, customSection, elementTypes, sectionOrder, type BuilderElement, type BuilderLayout, type ElementType, type Position, type SectionStyle } from "../../content/builder-model"
import { startDrag } from "./builder-canvas"

const icons = { heading: Heading, paragraph: AlignLeft, photo: Image, button: Link2, document: FileDown, youtube: Play, video: Video }

export function ElementPalette({ choose, disabled }: { choose: (type: ElementType) => void; disabled?: boolean }) {
  return <div className="editor-palette" role="group" aria-label="Page elements">
    {(Object.keys(elementTypes) as ElementType[]).map(kind => {
      const Icon = icons[kind]
      return <button type="button" key={kind} title={`Drag ${elementTypes[kind].toLowerCase()} onto the page, or click to choose a position`}
        disabled={disabled} draggable={!disabled} onDragStart={event => startDrag(event, { type: "palette", kind })} onClick={() => choose(kind)}>
        <Icon size={16} aria-hidden="true" /><span>{elementTypes[kind]}</span>
      </button>
    })}
  </div>
}

export function SectionForm({ style, isNew, removable, close, apply, remove }: {
  style: SectionStyle; isNew: boolean; removable: boolean; close: () => void; apply: (style: SectionStyle) => void; remove: () => void
}) {
  const [name, setName] = useState(style.name ?? "")
  const [background, setBackground] = useState(style.background ?? "")
  const [foreground, setForeground] = useState(style.foreground ?? "")
  const [error, setError] = useState("")
  return <form className="editor-dialog-body" onSubmit={event => {
    event.preventDefault()
    if ([background, foreground].some(value => value && !colorValue.test(value))) { setError("Enter six-digit hex colors, for example #153a2b."); return }
    apply({ ...style, name: name.trim() || undefined, background: background || undefined, foreground: foreground || undefined })
  }}>
    {error && <p className="editor-popup-error" role="alert">{error}</p>}
    <label>Section name <input value={name} placeholder="New section" maxLength={100} onChange={event => setName(event.currentTarget.value)} /></label>
    <p className="editor-muted">The section name is used in the builder. Add a Title element to show a heading to visitors.</p>
    <div className="editor-color-row">
      <label>Background color <input type="color" aria-label="Pick background color" value={colorValue.test(background) ? background : "#fbf8f1"} onChange={event => setBackground(event.currentTarget.value)} /></label>
      <input aria-label="Background hex color" placeholder="Use page default" maxLength={7} value={background} onChange={event => setBackground(event.currentTarget.value)} />
      <button type="button" onClick={() => setBackground("")}>Default</button>
    </div>
    <div className="editor-color-row">
      <label>Text color <input type="color" aria-label="Pick text color" value={colorValue.test(foreground) ? foreground : "#1a261f"} onChange={event => setForeground(event.currentTarget.value)} /></label>
      <input aria-label="Text hex color" placeholder="Use page default" maxLength={7} value={foreground} onChange={event => setForeground(event.currentTarget.value)} />
      <button type="button" onClick={() => setForeground("")}>Default</button>
    </div>
    <div className="editor-dialog-actions">
      {removable && <button type="button" className="editor-remove" onClick={() => { if (window.confirm("Remove this section and all its elements from the draft?")) remove() }}>Remove section</button>}
      <button type="button" onClick={close}>Cancel</button>
      <button type="submit" className="editor-primary">{isNew ? "Add section" : "Apply to draft"}</button>
    </div>
  </form>
}

export function PositionPicker({ layout, labels, initial, select, submitLabel }: {
  layout: BuilderLayout; labels: Map<string, string>; initial?: Position | null; select: (position: Position) => void; submitLabel?: string
}) {
  const native = [...labels.keys()]
  const order = sectionOrder(layout, native)
  const [section, setSection] = useState(initial?.section ?? order.at(0) ?? "")
  const [zone, setZone] = useState<Position["zone"]>(initial?.zone ?? "after")
  const [target, setTarget] = useState(initial?.row ? `${initial.row}:${initial.column ?? 0}` : "")
  const rows = layout.sections?.[section]?.[zone] ?? []
  const [row, column] = target.split(":")
  return <form onSubmit={event => { event.preventDefault(); if (section) select({ section, zone, ...(row ? { row, column: Number(column) } : {}) }) }} className="editor-position-form">
    <label>Section <select value={section} required onChange={event => { setSection(event.currentTarget.value); setTarget(""); setZone("after") }}>
      {order.map(key => <option key={key} value={key}>{layout.sections?.[key]?.name ?? labels.get(key) ?? "New section"}</option>)}
    </select></label>
    {!customSection(section) && <label>Area <select value={zone} onChange={event => { setZone(event.currentTarget.value as Position["zone"]); setTarget("") }}>
      <option value="before">Above section content</option><option value="after">Below section content</option>
    </select></label>}
    <label>Row and column <select value={target} onChange={event => setTarget(event.currentTarget.value)}>
      <option value="">Add in a new row</option>
      {rows.flatMap((item, i) => item.columns.map((_, n) => <option key={`${item.id}:${n}`} value={`${item.id}:${n}`}>Row {i + 1}, column {n + 1}</option>))}
    </select></label>
    <button className="editor-primary" type="submit" disabled={!section}>{submitLabel ?? "Choose position"}</button>
  </form>
}

export function ElementFields({ type, item, value, setValue, link, setLink, level, setLevel, chooseFile, file }: {
  type: ElementType; item?: BuilderElement; value: string; setValue: (text: string) => void; link: string; setLink: (text: string) => void;
  level: 2 | 3 | 4; setLevel: (level: 2 | 3 | 4) => void; file: File | null; chooseFile: (file: File | null) => void;
}) {
  const fields = type === "photo" ? "Image description (alt text)" : type === "button" || type === "document" ? "Button label" : type === "youtube" || type === "video" ? "Accessible video title" : "Text"
  const accept = type === "photo" ? "image/jpeg,image/png,image/webp,image/avif" : type === "video" ? ".mp4,.webm" : ".pdf,.docx,.txt,.xlsx,.pptx,.csv"
  return <>
    <label>{fields}{type === "paragraph" ?
      <textarea maxLength={6000} value={value} onChange={event => setValue(event.currentTarget.value)} required /> :
      <input maxLength={200} value={value} onChange={event => setValue(event.currentTarget.value)} required={type !== "photo"} />}</label>
    {type === "heading" && <label>Heading size <select value={level} onChange={event => setLevel(Number(event.currentTarget.value) as 2 | 3 | 4)}><option value={2}>Large (H2)</option><option value={3}>Medium (H3)</option><option value={4}>Small (H4)</option></select></label>}
    {type === "button" || type === "youtube" ? <label>{type === "button" ? "Destination URL" : "YouTube link or video ID"}<input value={link} onChange={event => setLink(event.currentTarget.value)} placeholder={type === "button" ? "/contact-us/ or https://…" : "https://www.youtube.com/watch?v=…"} maxLength={700} required /></label> : null}
    {(type === "photo" || type === "document" || type === "video") && <label>{type === "photo" ? "Photo to upload" : type === "video" ? "Public MP4 or WebM video (up to 20 MB)" : "Public document (up to 8 MB)"}
      <input type="file" accept={accept} required={!item?.path} onChange={event => chooseFile(event.currentTarget.files?.[0] ?? null)} />
      <small>{file?.name ?? item?.path?.split("/").at(-1) ?? "No file selected"}{type === "photo" ? " · Photos are optimized to WebP." : ""}</small>
    </label>}
  </>
}

export function ColumnOptions({ columns, exists, choose, remove }: { columns: number; exists: boolean; choose: (count: number) => void; remove: () => void }) {
  return <>
    <p className="editor-muted">{exists ? "Choose the number of columns. If you reduce it, elements from the removed columns move into the last remaining column." : "Add a row with one to four columns. Columns stack in order on mobile."}</p>
    <div className="editor-column-options">
      {[1, 2, 3, 4].map(count => <button type="button" key={count} onClick={() => choose(count)} aria-pressed={exists && count === columns}><Columns3 size={17} /> {count}</button>)}
    </div>
    {exists && <button className="editor-remove" type="button" onClick={() => { if (window.confirm("Remove this row and all its elements from the draft?")) remove() }}>Remove row</button>}
  </>
}
