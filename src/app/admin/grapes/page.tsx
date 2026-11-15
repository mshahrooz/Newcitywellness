import type { Metadata } from "next"
import { VisualEditor } from "../visual-editor"
import "../visual-editor.css"

// Keep older dashboard bookmarks working with the full-page editor.
export const metadata: Metadata = {
  title: "PageForge Studio · New City Wellness",
  robots: { index: false, follow: false },
}

export default function StudioBookmark() {
  return <VisualEditor />
}
