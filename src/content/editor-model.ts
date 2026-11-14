import stored from "./editor-content.json"

export const pages = [
  ["home", "/", "Home"],
  ["about", "/about-us/", "About Us"],
  ["services", "/services/", "Services"],
  ["acupuncture", "/services/acupuncture/", "Acupuncture"],
  ["chinese-medical-massage-tui-na", "/services/chinese-medical-massage-tui-na/", "Chinese Medical Massage (Tui-Na)"],
  ["cupping", "/services/cupping/", "Cupping"],
  ["moxibustion", "/services/moxibustion/", "Moxibustion"],
  ["chinese-herbal-medicine", "/services/chinese-herbal-medicine/", "Chinese Herbal Medicine"],
  ["gua-sha", "/services/gua-sha/", "Gua-Sha"],
  ["qi-gong", "/services/qi-gong/", "Qi-Gong"],
  ["faqs", "/faqs/", "FAQs"],
  ["conditions", "/conditions-treated/", "Conditions Treated"],
  ["testimonials", "/testimonials/", "Testimonials"],
  ["insurance", "/insurance/", "Insurance"],
  ["contact", "/contact-us/", "Contact"],
] as const

export type PageKey = typeof pages[number][0]
export const fieldLabels = {
  "hero-title": "Hero heading",
  "hero-description": "Hero description",
  "secondary-heading": "Main section heading",
  "secondary-copy": "Main section copy",
  "closing-heading": "Closing heading",
  "closing-copy": "Closing copy",
  "therapies-heading": "Therapies heading",
  "therapies-copy": "Therapies introduction",
  "first-visit-heading": "First visit heading",
  "first-visit-copy": "First visit introduction",
  "bio-copy": "Practitioner biography",
  "contact-heading": "Homepage contact heading",
  "contact-copy": "Homepage contact introduction",
  "appointment-button": "Appointment button label",
  "services-button": "Explore services button label",
  "session-heading": "Group sessions heading",
  "session-copy": "Group sessions copy",
  "practice-heading": "Treatment overview heading",
  "visit-heading": "Visit steps heading",
  "questions-heading": "Common questions heading",
  "step-heading-1": "Visit step heading 1",
  "step-copy-1": "Visit step description 1",
  "question-heading-1": "Question 1",
  "question-copy-1": "Answer 1",
  "step-heading-2": "Visit step heading 2",
  "step-copy-2": "Visit step description 2",
  "question-heading-2": "Question 2",
  "question-copy-2": "Answer 2",
  "step-heading-3": "Visit step heading 3",
  "step-copy-3": "Visit step description 3",
  "question-heading-3": "Question 3",
  "question-copy-3": "Answer 3",
  "faq-heading-1": "FAQ question 1",
  "faq-heading-2": "FAQ question 2",
  "faq-heading-3": "FAQ question 3",
  "faq-heading-4": "FAQ question 4",
  "faq-heading-5": "FAQ question 5",
  "faq-heading-6": "FAQ question 6",
  "acupuncture-card-heading": "Acupuncture card title",
  "tui-na-card-heading": "Tui-Na card title",
  "cupping-card-heading": "Cupping card title",
  "moxibustion-card-heading": "Moxibustion card title",
  "herbal-card-heading": "Herbal Medicine card title",
  "gua-sha-card-heading": "Gua-Sha card title",
  "qi-gong-card-heading": "Qi-Gong card title"
} as const
export type FieldKey = keyof typeof fieldLabels
export type Block = { id: string; type: "heading" | "paragraph"; text: string } |
  { id: string; type: "document"; text: string; file: string }
export const imageLabels = {
  "hero": "Hero photo",
  "practitioner": "Practitioner photo",
  "treatment": "Treatment photo",
  "qi-gong-card": "Qi-Gong card photo",
  "first-visit": "First visit photo",
  "acupuncture-card": "Acupuncture card photo",
  "tui-na-card": "Tui-Na card photo",
  "cupping-card": "Cupping card photo",
  "moxibustion-card": "Moxibustion card photo",
  "herbal-card": "Herbal Medicine card photo",
  "gua-sha-card": "Gua-Sha card photo"
} as const
export type ImageKey = keyof typeof imageLabels
export const imagePath = /^images\/editor\/[a-z0-9][a-z0-9-]{1,95}\.webp$/
export const isImage = (key: string): key is ImageKey => Object.hasOwn(imageLabels, key)
export type EditorImage = { path: string; alt: string; width: number; height: number }
export type PageContent = { fields?: Partial<Record<FieldKey, string>>; images?: Partial<Record<ImageKey, EditorImage>>; blocks?: Block[] }
export type EditorContent = { version: 1; pages: Partial<Record<PageKey, PageContent>> }
export const documentPath = /^documents\/editor\/[a-z0-9][a-z0-9-]{1,95}\.(pdf|docx)$/
export const maxBlocks = 24
export const isField = (key: string): key is FieldKey => Object.hasOwn(fieldLabels, key)
export const maxFieldLength = (key: FieldKey) => isHeading(key) ? 140 : 2400
export const isHeading = (key: FieldKey) => /title|heading|button/.test(key)
const record = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x)

/** Validate untrusted repo content before the dashboard reads or publishes it. */
export function validContent(x: unknown): x is EditorContent {
  if (!record(x) || x.version !== 1 || !record(x.pages)) return false
  for (const [key, page] of Object.entries(x.pages)) {
    if (!pages.some(([id]) => id === key) || !record(page)) return false
    if (page.fields !== undefined) {
      if (!record(page.fields)) return false
      for (const [field, value] of Object.entries(page.fields)) {
        if (!isField(field) || typeof value !== "string" || !value.trim() || value.length > maxFieldLength(field)) return false
      }
    }
    if (page.images !== undefined) {
      if (!record(page.images)) return false
      for (const [field, value] of Object.entries(page.images)) {
        if (!isImage(field) || !record(value) || typeof value.path !== "string" || !imagePath.test(value.path) ||
            typeof value.alt !== "string" || value.alt.length > 160 ||
            typeof value.width !== "number" || !Number.isInteger(value.width) || value.width < 1 || value.width > 1600 ||
            typeof value.height !== "number" || !Number.isInteger(value.height) || value.height < 1 || value.height > 1600) return false
      }
    }
    if (page.blocks !== undefined) {
      if (!Array.isArray(page.blocks) || page.blocks.length > maxBlocks) return false
      const ids = new Set<string>()
      for (const block of page.blocks) {
        if (!record(block) || typeof block.id !== "string" || !/^[a-z0-9-]{1,48}$/.test(block.id) || ids.has(block.id)) return false
        if (!["heading", "paragraph", "document"].some(type => type === block.type) || typeof block.text !== "string" || !block.text.trim() || block.text.length > (block.type === "paragraph" ? 2400 : 140)) return false
        if (block.type === "document" && (typeof block.file !== "string" || !documentPath.test(block.file))) return false
        ids.add(block.id)
      }
    }
  }
  return true
}

export const published: EditorContent = validContent(stored) ? stored : { version: 1, pages: {} }
export function editorValue(page: PageKey, field: FieldKey, fallback: string) {
  return published.pages[page]?.fields?.[field] ?? fallback
}


export const hasEditorImage = (page: PageKey, key: ImageKey) => !!published.pages[page]?.images?.[key]

export function editorImage(page: PageKey, key: ImageKey, fallback: { src: string; srcSet?: string; width: number; height: number; alt: string }) {
  const image = published.pages[page]?.images?.[key]
  return image ? {
    src: `${process.env.BASE_PATH || ""}/${image.path}`, width: image.width, height: image.height, alt: image.alt,
  } : fallback
}
