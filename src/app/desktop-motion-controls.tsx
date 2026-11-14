"use client"

import { useEffect, useState } from "react"
import {
  applyMotionOverride, desktopMotionQuery, readMotionOverride, reducedMotionQuery,
} from "./motion-preference"
import "./desktop-motion-controls.css"

export function DesktopMotionControls() {
  const [status, setStatus] = useState<{ reduced: boolean; override: boolean } | null>(null)

  useEffect(() => {
    const preference = window.matchMedia(reducedMotionQuery)
    const sync = () => {
      const override = document.documentElement.dataset.ncwMotion === "on"
      setStatus({ reduced: preference.matches, override })
    }
    applyMotionOverride(readMotionOverride())
    sync()
    preference.addEventListener("change", sync)
    return () => preference.removeEventListener("change", sync)
  }, [])

  function replay() {
    if (!window.matchMedia(desktopMotionQuery).matches) return
    const hero = document.querySelector<HTMLElement>(".ncw main :is(.hero, .page-hero)")
    if (!hero) return
    window.scrollTo({ top: 0, behavior: "instant" })
    hero.setAttribute("data-entrance-reset", "")
    // Apply the stopped state so the same animation can start again.
    void hero.offsetWidth
    hero.removeAttribute("data-entrance-reset")
  }

  function toggleOverride() {
    if (!status) return
    const override = !status.override
    applyMotionOverride(override, true)
    setStatus({ ...status, override })
    if (override) replay()
  }

  if (!status) return null

  const needsOptIn = status.reduced && !status.override
  return (
    <aside className="desktop-motion-controls" aria-label="Website animation controls">
      <button
        type="button"
        onClick={needsOptIn ? toggleOverride : replay}
        title={needsOptIn ? "Your device is set to reduce motion. Enable animations on this website only." : undefined}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 11a8 8 0 1 1 2 6m-2-6V5m0 6h6" /></svg>
        {needsOptIn ? "Enable site animations" : "Replay intro"}
      </button>
      {status.override && <button type="button" onClick={toggleOverride}>Use device setting</button>}
    </aside>
  )
}
