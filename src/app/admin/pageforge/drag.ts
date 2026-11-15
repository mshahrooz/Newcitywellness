// Adapted from PageForge Studio's js/dragdrop.js by Vinod Prabhashvara (MIT).
// The original vertical canvas drag state and midpoint insertion rule are
// adapted for iframe-backed, model-driven pages. See licenses/PageForge-Studio.txt.
import { isElementType, type ElementType } from "../../../content/builder-model"

export type PageForgeDrag = { type: "palette"; kind: ElementType } |
  { type: "item" | "section"; id: string } |
  { type: "native"; id: string; scope: "copy" | "field" }

export const dragMime = "application/x-ncw-builder"
const eventName = "ncw-pageforge-drag"
let active: PageForgeDrag | null = null
export const activePageForgeDrag = () => active

function announce(item: PageForgeDrag | null) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(eventName, { detail: item }))
}

export function beginPageForgeDrag(transfer: DataTransfer | null, item: PageForgeDrag) {
  if (!transfer) return
  active = item
  transfer.setData(dragMime, JSON.stringify(item))
  transfer.effectAllowed = item.type === "palette" ? "copy" : "move"
  announce(item)
}

export function endPageForgeDrag() {
  if (!active) return
  active = null
  announce(null)
}

export function subscribePageForgeDrag(change: (item: PageForgeDrag | null) => void) {
  const listener: EventListener = event => change((event as CustomEvent<PageForgeDrag | null>).detail)
  window.addEventListener(eventName, listener)
  return () => window.removeEventListener(eventName, listener)
}

export function acceptsPageForgeDrag(transfer: DataTransfer | null) {
  return !!transfer?.types.includes(dragMime)
}

export function readPageForgeDrop(transfer: DataTransfer | null): PageForgeDrag | null {
  if (!acceptsPageForgeDrag(transfer)) return null
  try {
    const item = JSON.parse(transfer!.getData(dragMime))
    if (item?.type === "palette" && isElementType(item.kind)) return item
    if (typeof item?.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,68}$/.test(item.id)) return null
    if (item.type === "item" || item.type === "section") return item
    if (item.type === "native" && (item.scope === "field" || item.scope === "copy")) return item
  } catch { /* Ignore data that wasn't created by the editor. */ }
  return null
}

export function insertBeforeAtMidpoint(y: number, sections: { id: string; top: number; height: number }[], dragged?: string) {
  return sections.find(section => section.id !== dragged && y < section.top + section.height / 2)?.id ?? null
}
