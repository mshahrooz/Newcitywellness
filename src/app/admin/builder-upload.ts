import { builderDocument, builderVideo, type BuilderElement, type ElementType } from "../../content/builder-model"
import { optimizeImage } from "./optimize-image"

const mb = 1024 * 1024
export async function prepareBuilderUpload(type: ElementType, file: File): Promise<{ item: Pick<BuilderElement, "path" | "width" | "height">; blob: Blob }> {
  const match = /^(.*)\.([^.]+)$/.exec(file.name)
  const name = (match?.[1] ?? "upload").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 39) || "upload"
  const ext = match?.[2]?.toLowerCase()
  const id = `${name}-${crypto.randomUUID()}`
  if (type === "photo") {
    const result = await optimizeImage(file)
    return { item: { path: `images/editor/${id}.webp`, width: result.width, height: result.height }, blob: result.blob }
  }
  if (type !== "document" && type !== "video") throw new Error("This element does not accept uploads.")
  const path = `${type === "document" ? "documents" : "videos"}/editor/${id}.${ext ?? ""}`
  const pattern = type === "document" ? builderDocument : builderVideo
  if (!pattern.test(path) || file.size > (type === "video" ? 20 : 8) * mb || file.size < 1) throw new Error(
    type === "video" ? "Choose an MP4 or WebM video up to 20 MB." : "Choose a PDF, DOCX, TXT, XLSX, PPTX, or CSV file up to 8 MB.")
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const ascii = new TextDecoder().decode(head)
  const zip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 3 && head[3] === 4
  if ((ext === "pdf" && !ascii.startsWith("%PDF-")) ||
      (["docx", "xlsx", "pptx"].includes(ext ?? "") && !zip) ||
      (ext === "mp4" && ascii.slice(4, 8) !== "ftyp") ||
      (ext === "webm" && !(head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3))) {
    throw new Error("The file does not match its extension. Choose a correctly formatted file.")
  }
  return { item: { path }, blob: file }
}
