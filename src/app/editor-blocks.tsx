import { published, type PageKey } from "../content/editor-model"
import "./editor-blocks.css"

export function EditorBlocks({ page }: { page: PageKey }) {
  const blocks = published.pages[page]?.blocks ?? []
  return (
    <section className="editor-blocks" data-editor-blocks aria-label="Additional information" hidden={blocks.length === 0}>
      <div className="container editor-blocks-inner">
        {blocks.map((block) => block.type === "heading" ? (
          <h2 className="section-title" data-editor-block-id={block.id} key={block.id}>{block.text}</h2>
        ) : block.type === "paragraph" ? (
          <p data-editor-block-id={block.id} key={block.id}>{block.text}</p>
        ) : block.type === "document" ? (
          <a className="editor-document" data-editor-block-id={block.id} href={`${process.env.BASE_PATH || ""}/${block.file}`} download key={block.id}>
            <span aria-hidden="true">↓</span> {block.text}
            <small>{block.file.endsWith(".pdf") ? "PDF" : "WORD"}</small>
          </a>
        ) : null)}
      </div>
    </section>
  )
}
