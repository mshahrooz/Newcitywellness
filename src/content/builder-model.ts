export const elementTypes = {
  heading: "Title", paragraph: "Paragraph", photo: "Photo", button: "Button",
  document: "File download", youtube: "YouTube video", video: "Uploaded video",
} as const
export type ElementType = keyof typeof elementTypes
export type BuilderElement = { id: string; type: ElementType; text: string; link?: string; path?: string; width?: number; height?: number; level?: 2 | 3 | 4; source?: { key: string; scope: "field" | "copy" | "shared" } }
export type BuilderRow = { id: string; columns: BuilderElement[][] }
export type Zone = "before" | "after"
export type SectionStyle = { name?: string; background?: string; foreground?: string; before?: BuilderRow[]; after?: BuilderRow[]; anchors?: Record<string, BuilderRow[]> }
export type BuilderLayout = { order?: string[]; sections?: Record<string, SectionStyle> }
export type Position = { section: string; zone: Zone; anchor?: string; row?: string; column?: number; before?: string }
export type ItemLocation = { position: Position; element: BuilderElement }
export const blankLayout: BuilderLayout = {}
export const customSection = (key: string) => key.startsWith("section-")
export const builderId = /^[a-z0-9][a-z0-9-]{0,68}$/
export const copyKey = /^[a-z][a-z0-9-]{0,68}$/
export const colorValue = /^#[0-9a-f]{6}$/i
export const builderPhoto = /^images\/editor\/[a-z0-9][a-z0-9-]{1,95}\.webp$/
export const builderDocument = /^documents\/editor\/[a-z0-9][a-z0-9-]{1,95}\.(pdf|docx|txt|xlsx|pptx|csv)$/
export const builderVideo = /^videos\/editor\/[a-z0-9][a-z0-9-]{1,95}\.(mp4|webm)$/
const videoId = /^[A-Za-z0-9_-]{11}$/
export const isElementType = (value: unknown): value is ElementType => typeof value === "string" && Object.hasOwn(elementTypes, value)
export const zones: Zone[] = ["before", "after"]
export const isRecord = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x)
const isString = (x: unknown, max: number): x is string => typeof x === "string" && x.length <= max
const idIsValid = (id: unknown): id is string => typeof id === "string" && builderId.test(id)

export function safeButtonUrl(input: string) {
  if (!input || input.length > 700 || /[\u0000-\u0020\\]/.test(input)) return false
  if (input.startsWith("#") || (input.startsWith("/") && !input.startsWith("//"))) return true
  return /^(https?:\/\/[^/]+|mailto:[^@]+@[^@]+|tel:\+?[0-9().-]+)$/i.test(input) || /^https?:\/\/[^/]+\/.*$/i.test(input)
}

export function youtubeId(input: string) {
  const text = input.trim()
  if (videoId.test(text)) return text
  try {
    const url = new URL(text)
    if (url.protocol !== "https:" && url.protocol !== "http:") return ""
    const host = url.hostname.replace(/^(www\.|m\.)/, "")
    const parts = url.pathname.split("/").filter(Boolean)
    const id = host === "youtu.be" ? parts[0] :
      host === "youtube.com" || host === "youtube-nocookie.com" ?
        (parts[0] === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : "") : ""
    return id && videoId.test(id) ? id : ""
  } catch { return "" }
}

export function validLayout(x: unknown): x is BuilderLayout {
  if (!isRecord(x)) return false
  if (x.order !== undefined && (!Array.isArray(x.order) || x.order.length > 48 || !x.order.every(idIsValid) || new Set(x.order).size !== x.order.length)) return false
  if (x.sections === undefined) return !(Array.isArray(x.order) && x.order.some(customSection))
  if (!isRecord(x.sections) || Object.keys(x.sections).length > 48) return false
  if (Array.isArray(x.order) && x.order.some(id => customSection(id) && !Object.hasOwn(x.sections!, id))) return false
  const ids = new Set<string>()
  const unique = (value: unknown) => idIsValid(value) && !ids.has(value) && !!ids.add(value)
  for (const [key, style] of Object.entries(x.sections)) {
    if (!idIsValid(key) || !isRecord(style)) return false
    if (style.name !== undefined && (!isString(style.name, 100) || !style.name.trim())) return false
    if ([style.background, style.foreground].some(value => value !== undefined && (typeof value !== "string" || !colorValue.test(value)))) return false
    if (style.anchors !== undefined && (!isRecord(style.anchors) || Object.keys(style.anchors).length > 100 || !Object.keys(style.anchors).every(idIsValid) || !Object.values(style.anchors).every(Array.isArray))) return false
    for (const rows of [...zones.map(zone => style[zone]), ...Object.values(style.anchors ?? {})]) {
      if (rows === undefined) continue
      if (!Array.isArray(rows) || rows.length > 20) return false
      for (const row of rows) {
        if (!isRecord(row) || !unique(row.id) || !Array.isArray(row.columns) || row.columns.length < 1 || row.columns.length > 4) return false
        for (const column of row.columns) {
          if (!Array.isArray(column) || column.length > 32) return false
          for (const item of column) {
            if (!isRecord(item) || !unique(item.id) || !isElementType(item.type) || !isString(item.text, item.type === "paragraph" ? 6000 : 200)) return false
            if (item.type !== "photo" && !item.text.trim()) return false
            if (item.type === "heading" && item.level !== undefined && (typeof item.level !== "number" || ![2, 3, 4].includes(item.level))) return false
            if (item.source !== undefined && (!isRecord(item.source) || !idIsValid(item.source.key) || !["field", "copy", "shared"].includes(String(item.source.scope)))) return false
            if (item.type === "button" && (typeof item.link !== "string" || !safeButtonUrl(item.link))) return false
            if (item.type === "youtube" && (typeof item.link !== "string" || !videoId.test(item.link))) return false
            if (item.type === "document" && (typeof item.path !== "string" || !builderDocument.test(item.path))) return false
            if (item.type === "video" && (typeof item.path !== "string" || !builderVideo.test(item.path))) return false
            if (item.type === "photo" && (typeof item.path !== "string" || !builderPhoto.test(item.path) ||
                ![item.width, item.height].every(value => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 1600))) return false
          }
        }
      }
    }
  }
  return true
}

export function sectionOrder(layout: BuilderLayout, native: readonly string[]) {
  const usable = (key: string) => native.includes(key) || (customSection(key) && Object.hasOwn(layout.sections ?? {}, key))
  return [...new Set([...(layout.order ?? []).filter(usable), ...native])]
}

export function changeSection(layout: BuilderLayout, id: string, value: SectionStyle): BuilderLayout {
  return { ...layout, sections: { ...layout.sections, [id]: value } }
}
export function moveSection(layout: BuilderLayout, native: readonly string[], id: string, before: string | null) {
  const current = sectionOrder(layout, native)
  if (id === before || !current.includes(id)) return layout
  const order = current.filter(key => key !== id)
  const to = before === null ? order.length : order.indexOf(before)
  if (to < 0) return layout
  order.splice(to, 0, id)
  return order.every((key, index) => key === current[index]) ? layout : { ...layout, order }
}
export function appendSection(layout: BuilderLayout, native: readonly string[], id: string, before: string | null, name: string) {
  if (sectionOrder(layout, native).length >= 48) return layout
  const next = changeSection(layout, id, { name })
  return moveSection({ ...next, order: [...sectionOrder(layout, native), id] }, native, id, before)
}
export function removeSection(layout: BuilderLayout, id: string): BuilderLayout {
  if (!customSection(id)) return layout
  const sections = { ...layout.sections }
  delete sections[id]
  return { ...layout, sections, order: layout.order?.filter(key => key !== id) }
}
export function rowsAt(layout: BuilderLayout, position: Position) {
  const config = layout.sections?.[position.section]
  return (position.anchor ? config?.anchors?.[position.anchor] : config?.[position.zone]) ?? []
}
function updateRows(layout: BuilderLayout, position: Position, rows: BuilderRow[]) {
  const { section, zone, anchor } = position
  const style = layout.sections?.[section]
  return changeSection(layout, section, anchor ? { ...style, anchors: { ...style?.anchors, [anchor]: rows } } : { ...style, [zone]: rows })
}
export function addRow(layout: BuilderLayout, position: Position, id: string, columns: number) {
  const rows = [...rowsAt(layout, position)]
  if (rows.length >= 20 || columns < 1 || columns > 4) return layout
  const index = position.row ? rows.findIndex(row => row.id === position.row) : -1
  rows.splice(index < 0 ? rows.length : index, 0, { id, columns: Array.from({ length: columns }, () => []) })
  return updateRows(layout, position, rows)
}
export function removeRow(layout: BuilderLayout, position: Position) {
  return updateRows(layout, position, rowsAt(layout, position).filter(row => row.id !== position.row))
}
export function setColumns(layout: BuilderLayout, position: Position, columns: number) {
  if (columns < 1 || columns > 4) return layout
  const rows = rowsAt(layout, position)
  const row = rows.find(item => item.id === position.row)
  if (!row || row.columns.length === columns) return layout
  const next = Array.from({ length: columns }, (_, index) => row.columns[index] ?? [])
  if (columns < row.columns.length) next[columns - 1] = row.columns.slice(columns - 1).flat()
  if (next.some(column => column.length > 32)) return layout
  return updateRows(layout, position, rows.map(item => item === row ? { ...row, columns: next } : item))
}
export function locateItem(layout: BuilderLayout, id: string): ItemLocation | undefined {
  for (const [section, settings] of Object.entries(layout.sections ?? {})) {
    const groups = [...zones.map(zone => ({ zone, anchor: undefined as string | undefined, rows: settings[zone] ?? [] })),
      ...Object.entries(settings.anchors ?? {}).map(([anchor, rows]) => ({ zone: "after" as const, anchor, rows }))]
    for (const { zone, anchor, rows } of groups) for (const row of rows) {
      for (const [column, items] of row.columns.entries()) {
        const element = items.find(item => item.id === id)
        if (element) return { position: { section, zone, anchor, row: row.id, column }, element }
      }
    }
  }
}
function updateColumn(layout: BuilderLayout, position: Position, update: (items: BuilderElement[]) => BuilderElement[]) {
  return updateRows(layout, position, rowsAt(layout, position).map(row => row.id === position.row ? {
    ...row, columns: row.columns.map((items, index) => index === position.column ? update(items) : items),
  } : row))
}
export function removeItem(layout: BuilderLayout, id: string) {
  const source = locateItem(layout, id)
  return source ? updateColumn(layout, source.position, items => items.filter(item => item.id !== id)) : layout
}
export function replaceItem(layout: BuilderLayout, element: BuilderElement) {
  const source = locateItem(layout, element.id)
  return source ? updateColumn(layout, source.position, items => items.map(item => item.id === element.id ? element : item)) : layout
}
export function placeItem(layout: BuilderLayout, destination: Position, element: BuilderElement, newRowId: string) {
  if (destination.before === element.id) return layout
  let next = removeItem(layout, element.id)
  let position = destination
  if (!position.row) {
    next = addRow(next, position, newRowId, 1)
    position = { ...position, row: newRowId, column: 0 }
  }
  const column = rowsAt(next, position).find(row => row.id === position.row)?.columns[position.column ?? 0]
  if (!column || column.length >= 32) return layout
  return updateColumn(next, { ...position, column: position.column ?? 0 }, items => {
    const index = position.before ? items.findIndex(item => item.id === position.before) : -1
    const result = [...items]
    result.splice(index < 0 ? result.length : index, 0, element)
    return result
  })
}
export function assetPaths(layout?: BuilderLayout) {
  return Object.values(layout?.sections ?? {}).flatMap(style =>
    [...zones.flatMap(zone => style[zone] ?? []), ...Object.values(style.anchors ?? {}).flat()].flatMap(row => row.columns.flat().flatMap(item => item.path ? [item.path] : [])))
}
