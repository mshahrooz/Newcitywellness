import type { PageKey } from "./editor-model"

export type DesignAsset = { src: string; name: string; type: "image" }
export type DesignPart = { type: "native"; id: string } | { type: "design"; html: string }
export type GrapesDesign = { parts: DesignPart[]; css: string; assets: DesignAsset[] }
export type GrapesDesigns = Partial<Record<PageKey, GrapesDesign>>
export const designPath = "src/content/grapes-designs.json"
export const nativeTag = "data-ncw-native"
export const builderBase = process.env.BASE_PATH || ""
export const designScope = (page: PageKey) => "ncw-grapes-" + page
export const assetUrl = (path: string) => builderBase + "/" + path
export const studioImages: DesignAsset[] = [
  { src: assetUrl("images/home/acupuncture-hero.webp"), name: "Acupuncture treatment", type: "image" },
  { src: assetUrl("images/home/practitioner-portrait.webp"), name: "Mordechai Genut", type: "image" },
  { src: assetUrl("images/first-visit.png"), name: "Clinic interior", type: "image" },
]

export function isNativeKey(id: string) { return /^[a-z0-9][a-z0-9-]{0,68}$/.test(id) }
