"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import "./page-load-indicator.css"

const showDelay = 120
const safetyTimeout = 12000
const basePath = process.env.BASE_PATH || ""

function pagePath(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/"
}

export function PageLoadIndicator() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const pending = useRef(false)
  const showTimer = useRef<number | undefined>(undefined)
  const resetTimer = useRef<number | undefined>(undefined)

  const reset = useCallback(() => {
    window.clearTimeout(showTimer.current)
    window.clearTimeout(resetTimer.current)
    pending.current = false
    setLoading(false)
  }, [])

  // Next's root layout stays mounted while the destination page commits.
  useEffect(() => {
    reset()
  }, [pathname, reset])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null
      if (!link || (link.target && link.target.toLowerCase() !== "_self") || link.hasAttribute("download")) return

      const next = new URL(link.href, window.location.href)
      if (!/^https?:$/.test(next.protocol) || next.origin !== window.location.origin) return
      if (basePath && next.pathname !== basePath && !next.pathname.startsWith(basePath + "/")) return
      if (pagePath(next.pathname) === pagePath(window.location.pathname)) return

      if (!pending.current) {
        pending.current = true
        showTimer.current = window.setTimeout(() => setLoading(true), showDelay)
      }
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(reset, safetyTimeout)
    }

    // Capture also sees Next links, whose own click handlers prevent a full reload.
    document.addEventListener("click", onClick, true)
    window.addEventListener("pageshow", reset)
    window.addEventListener("popstate", reset)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("pageshow", reset)
      window.removeEventListener("popstate", reset)
      window.clearTimeout(showTimer.current)
      window.clearTimeout(resetTimer.current)
    }
  }, [reset])

  return (
    <>
      <div className="page-load-indicator" data-loading={loading} aria-hidden="true">
        <span className="page-load-indicator__sweep" />
      </div>
      <span className="sr-only" role="status">{loading ? "Loading page…" : ""}</span>
    </>
  )
}
