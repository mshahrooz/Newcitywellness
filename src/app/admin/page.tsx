import type { Metadata } from "next"
import { VisualEditor } from "./visual-editor"
import "./visual-editor.css"

export const metadata: Metadata = {
  title: "Visual Editor | New City Wellness",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return <VisualEditor />
}
