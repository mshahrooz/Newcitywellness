"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"

export function EditorDialog({ title, subtitle, close, busy, children }: {
  title: string
  subtitle?: string
  close: () => void
  busy?: boolean
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useId()
  useEffect(() => {
    const node = dialog.current
    if (!node) return
    node.showModal()
    node.querySelector<HTMLElement>("input, textarea, .editor-dialog-body button")?.focus()
    return () => { if (node.open) node.close() }
  }, [])

  return (
    <dialog ref={dialog} className="editor-dialog" aria-labelledby={heading}
      onCancel={event => { event.preventDefault(); if (!busy) close() }}>
      <div className="editor-dialog-heading">
        <div><span className="editor-kicker">{subtitle || "PAGE EDITOR"}</span><h2 id={heading}>{title}</h2></div>
        <button type="button" className="editor-dialog-close" aria-label="Close popup" onClick={close} disabled={busy}>×</button>
      </div>
      {children}
    </dialog>
  )
}
