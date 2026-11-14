import type { Metadata } from "next"
import { GrapesStudio } from "./studio"
import "grapesjs/dist/css/grapes.min.css"
import "../visual-editor.css"
import "./studio.css"

export const metadata: Metadata = {
  title: "GrapesJS Design Studio | New City Wellness",
  robots:{index:false,follow:false},
}
export default function StudioPage() { return <GrapesStudio/> }
