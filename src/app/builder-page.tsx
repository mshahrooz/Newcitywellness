import { Children, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react"
import { blankLayout, customSection, sectionOrder, type BuilderElement, type BuilderRow, type SectionStyle } from "../content/builder-model"
import { published, type PageKey } from "../content/editor-model"
import "./builder-page.css"
import grapesPublished from "../content/grapes-published.json"
import { designScope, type DesignPart } from "../content/grapes-model"

const base = process.env.BASE_PATH || ""
export const publicAsset = (path: string) => base + "/" + path
type CopyScope = PageKey | "shared"
const lookupCopy = (scope: CopyScope, id: string) => scope === "shared" ? published.shared?.[id] : published.pages[scope]?.copy?.[id]
export const copyText = (scope: CopyScope, id: string, fallback: string) => lookupCopy(scope, id) ?? fallback

export function movedSource(page: PageKey, scope: "copy" | "field" | "shared", key: string) {
  for (const bySection of Object.values(published.pages[page]?.layout?.sections ?? {})) {
    const rows = [...(bySection.before ?? []), ...(bySection.after ?? []), ...Object.values(bySection.anchors ?? {}).flat()]
    if (rows.some(row => row.columns.some(column => column.some(item => item.source?.key === key && item.source.scope === scope)))) return true
  }
  return false
}

export function SiteCopy({ scope, id, children }: { scope: CopyScope; id: string; children: ReactNode }) {
  const Tag = "builder-copy" as "span"
  return <Tag data-builder-copy={id} data-builder-shared={scope === "shared" ? "true" : undefined}
    data-builder-moved-source={scope !== "shared" && movedSource(scope, "copy", id) || undefined}>{lookupCopy(scope, id) ?? children}</Tag>
}

export function FieldText({ page, id, children }: { page: PageKey; id: string; children: ReactNode }) {
  return movedSource(page, "field", id) ? <span data-builder-moved-field hidden>{children}</span> : children
}

export function builderSectionStyle(style?: SectionStyle) {
  return {
    "--builder-bg": style?.background,
    "--builder-fg": style?.foreground,
  } as CSSProperties
}

export function PageElement({ item, resolve = publicAsset }: { item: BuilderElement; resolve?: (path: string) => string }) {
  if (item.type === "heading") {
    const Heading = item.level === 4 ? "h4" : item.level === 3 ? "h3" : "h2"
    return <Heading>{item.text}</Heading>
  }
  if (item.type === "paragraph") return <p>{item.text}</p>
  if (item.type === "photo" && item.path) return <img src={resolve(item.path)} alt={item.text} width={item.width} height={item.height} loading="lazy" decoding="async" />
  if (item.type === "button") return <a className="builder-link builder-button" href={item.link?.startsWith("/") ? base + item.link : item.link}>{item.text} <span aria-hidden="true">→</span></a>
  if (item.type === "document" && item.path) return <a className="builder-link builder-download" href={resolve(item.path)} download><span aria-hidden="true">↓</span> {item.text}</a>
  if (item.type === "video" && item.path) return <video src={resolve(item.path)} controls playsInline preload="none" aria-label={item.text} />
  if (item.type === "youtube") return <iframe className="builder-youtube" src={`https://www.youtube-nocookie.com/embed/${item.link}`} title={item.text} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
  return null
}

function PageRows({ rows, zone, inline = false }: { rows?: BuilderRow[]; zone: string; inline?: boolean }) {
  const populated = rows?.filter(row => row.columns.some(column => column.length))
  if (!populated?.length) return null
  return <div className={inline ? "builder-zone builder-zone-inline" : "builder-zone"} data-builder-public-zone={zone}><div className={inline ? "builder-zone-inner" : "container builder-zone-inner"}>
    {populated.map(row => <div className="builder-row" key={row.id} style={{ "--builder-columns": row.columns.length } as CSSProperties}>
      {row.columns.map((column, index) => <div className="builder-column" key={index}>
        {column.map(item => <div className="builder-element" key={item.id}><PageElement item={item} /></div>)}
      </div>)}
    </div>)}
  </div></div>
}

export function BuilderAnchor({ page, section, id, children }: { page: PageKey; section: string; id: string; children: ReactNode }) {
  const rows = published.pages[page]?.layout?.sections?.[section]?.anchors?.[id]
  return <>{children}<span hidden data-builder-anchor={id} data-builder-anchor-section={section} /><PageRows rows={rows} zone={id} inline /></>
}

type NativeProps = { id: string; label: string; children: ReactNode }
export function NativeSection({ children }: NativeProps) {
  return <>{children}</>
}

export function BuilderMain({ page, id, children }: { page: PageKey; id?: string; children: ReactNode }) {
  const nodes = Children.toArray(children)
  const native = nodes.filter((node): node is ReactElement<NativeProps> => isValidElement<NativeProps>(node) && !!node.props.id && !!node.props.label)
  const fallback = nodes.filter(node => !native.includes(node as ReactElement<NativeProps>))
  const layout = published.pages[page]?.layout ?? blankLayout
  const byId = new Map(native.map(({ props }) => [props.id, props]))
  const design = (grapesPublished as Partial<Record<PageKey, { parts: DesignPart[]; css: string }>>)[page]
  const originalOrder = sectionOrder(layout, native.map(item => item.props.id))
  const retained = new Set(design?.parts.flatMap(part => part.type === "native" ? [part.id] : []) ?? [])
  function renderNative(key: string) {
      const source = byId.get(key)
      const style = layout.sections?.[key]
      const isNew = customSection(key)
      return <div key={key} className={isNew ? "builder-section builder-custom" : "builder-section builder-native"}
        data-builder-section={key} data-builder-label={source?.label ?? style?.name ?? "New section"}
        data-builder-custom={isNew || undefined}
        data-builder-background={!!style?.background || undefined}
        data-builder-foreground={!!style?.foreground || undefined} style={builderSectionStyle(style)}>
        <PageRows rows={style?.before} zone="before" />
        {source?.children}
        <PageRows rows={style?.after} zone="after" />
      </div>
  }
  return <main id={id} data-builder-page={page}>
    {design?.css && <style data-grapes-css={page}>{design.css}</style>}
    {(design?.parts ?? []).map((part, index) => {
      if (part.type === "native") return originalOrder.includes(part.id) ? renderNative(part.id) : null
      // Only compiler-validated HTML is rendered. Rewrite local paths for GitHub Project Pages.
      const html = base ? part.html.replace(/ (src|href|poster)="(\/(?!\/)[^"]*)"/g, (match, attr, value) => value.startsWith(base + "/") ? match : ` ${attr}="${base}${value}"`) : part.html
      return <div key={"design-" + index} className={designScope(page)} data-grapes-section=""><div className="grapes-markup" dangerouslySetInnerHTML={{ __html: html }} /></div>
    })}
    {originalOrder.filter(key => !retained.has(key)).map(renderNative)}
    {fallback}
  </main>
}
