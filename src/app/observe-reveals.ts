/** Older browsers follow the same viewport progress if CSS view timelines aren't available. */
export function observeReveals(root: Document) {
  if (CSS.supports("animation-timeline: view()") && CSS.supports("animation-range: entry 0px entry 220px")) return

  const site = root.querySelector(".ncw")
  if (!site) return
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
  const candidates = new Map<HTMLElement, { distance: number; offset: number; rest?: number }>()
  let frame: number | undefined

  function clear(element: HTMLElement) {
    delete element.dataset.scrollRevealFallback
    element.style.removeProperty("--reveal-rest")
  }

  function update() {
    frame = undefined
    const height = window.innerHeight
    const compact = window.matchMedia("(max-width: 760px)").matches
    const changes: [HTMLElement, { distance: number; offset: number; rest?: number }, number][] = []
    for (const [element, state] of candidates) {
      if (element.matches(":focus-within, .is-searching *")) {
        if (state.rest !== undefined) changes.push([element, state, 0])
        continue
      }
      const top = element.getBoundingClientRect().top - state.offset
      const progress = Math.max(0, Math.min(1, (height - top) / state.distance))
      const rest = 1 - progress
      if (rest !== state.rest || (rest > 0 && state.offset !== rest * (compact ? 28 : 38))) changes.push([element, state, rest])
    }
    for (const [element, state, rest] of changes) {
      state.rest = rest
      state.offset = rest * (compact ? 28 : 38)
      if (rest === 0) clear(element)
      else {
        element.dataset.scrollRevealFallback = ""
        element.style.setProperty("--reveal-rest", String(rest))
      }
    }
  }

  function schedule() {
    if (!reduced.matches && frame === undefined) frame = window.requestAnimationFrame(update)
  }

  function refresh() {
    for (const element of candidates.keys()) {
      if (element.isConnected && !reduced.matches) continue
      clear(element)
      candidates.delete(element)
    }
    if (reduced.matches) return
    site.querySelectorAll<HTMLElement>("main .container, main .motion-reveal, main .clinic-reveal, main .service-reveal, main .faq-head, main .faq-item, main .reviews-intro, main .reviews-filters, main .reviews-card, main .insurance-form-header, main .insurance-frame, main .contact-map-header, main .contact-map-frame, main .acu-visit-heading, main .acu-steps > li, .footer-grid").forEach((element) => {
      if (candidates.has(element)) return
      const style = getComputedStyle(element)
      if (style.getPropertyValue("--ncw-scroll-reveal").trim() !== "1") return
      // The marker is inherited. Do not register a descendant of another reveal.
      const parent = element.parentElement
      if (parent && getComputedStyle(parent).getPropertyValue("--ncw-scroll-reveal").trim() === "1") return
      candidates.set(element, { distance: parseFloat(style.getPropertyValue("--reveal-distance")) || 220, offset: 0 })
    })
    schedule()
  }

  function preferenceChanged() {
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    frame = undefined
    refresh()
  }

  function focusChanged() {
    for (const [element, state] of candidates) {
      if (!element.matches(":focus-within")) continue
      clear(element)
      state.offset = 0
      state.rest = undefined
    }
    refresh()
  }

  refresh()
  const changes = new MutationObserver(refresh)
  changes.observe(site, { childList: true, subtree: true })
  reduced.addEventListener("change", preferenceChanged)
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule)
  root.addEventListener("load", schedule, true)
  root.addEventListener("focusin", focusChanged)
  root.addEventListener("focusout", schedule)
  return () => {
    changes.disconnect()
    reduced.removeEventListener("change", preferenceChanged)
    window.removeEventListener("scroll", schedule)
    window.removeEventListener("resize", schedule)
    root.removeEventListener("load", schedule, true)
    root.removeEventListener("focusin", focusChanged)
    root.removeEventListener("focusout", schedule)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    candidates.forEach((_, element) => clear(element))
  }
}
