const explicit = ".motion-reveal, .clinic-reveal, .service-reveal"
const details = [
  ".faq-head", ".faq-item",
  ".reviews-intro", ".reviews-filters", ".reviews-card",
  ".insurance-form-header", ".insurance-frame",
  ".contact-map-header", ".contact-map-frame",
  ".acu-visit-heading", ".acu-steps > li",
].join(", ")

type RevealState = { armed: boolean; animation?: Animation }

export function observeReveals(root: Document) {
  const main = root.querySelector(".ncw main")
  if (!main || !("IntersectionObserver" in window) || !("animate" in Element.prototype)) return

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
  const compact = window.matchMedia("(max-width: 760px)")
  const tracked = new Map<HTMLElement, RevealState>()

  function stop(state: RevealState) {
    state.animation?.cancel()
    state.animation = undefined
  }

  // Keep the page visible by default. Start an independent animation only once
  // a target is actually on screen, so stopping the scroll never freezes it.
  const enter = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const target = entry.target as HTMLElement
      const state = tracked.get(target)
      if (!state || !state.armed || !entry.isIntersecting || reduced.matches) continue
      state.armed = false
      if (target.matches(":focus-within, .is-searching *")) continue
      const x = compact.matches ? 0 : target.classList.contains("from-left") ? -26 : target.classList.contains("from-right") ? 26 : 0
      const y = compact.matches ? 28 : 40
      const animation = target.animate([
        { opacity: .16, translate: `${x}px ${y}px` },
        { opacity: 1, translate: "0 0" },
      ], { duration: 1050, easing: "cubic-bezier(.23,.61,.32,1)", fill: "none" })
      animation.id = "ncw-section-entrance"
      state.animation = animation
      animation.onfinish = () => {
        if (state.animation === animation) state.animation = undefined
      }
    }
  }, { rootMargin: "0px 0px -48px 0px" })

  // Rearm only after the entire section has moved well outside the screen.
  // The buffer prevents flicker when a visitor scrolls near the viewport edge.
  const leave = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const state = tracked.get(entry.target as HTMLElement)
      if (!state || entry.isIntersecting) continue
      stop(state)
      state.armed = true
    }
  }, { rootMargin: "56px 0px 56px 0px" })

  function refresh() {
    for (const [target, state] of tracked) {
      if (target.isConnected) continue
      enter.unobserve(target)
      leave.unobserve(target)
      stop(state)
      tracked.delete(target)
    }

    const candidates = new Set(main!.querySelectorAll<HTMLElement>(explicit))
    main!.querySelectorAll<HTMLElement>("section:not(.hero, .page-hero)").forEach((section) => {
      const inner = section.querySelector<HTMLElement>(":scope > .container")
      if (!inner || inner.matches(explicit) || inner.querySelector(explicit)) return
      const parts = inner.querySelectorAll<HTMLElement>(details)
      if (parts.length) parts.forEach((part) => candidates.add(part))
      else candidates.add(inner)
    })
    const footer = root.querySelector<HTMLElement>(".ncw .clinic-footer .footer-grid")
    if (footer) candidates.add(footer)

    for (const target of candidates) {
      if (tracked.has(target) || target.closest(".hero, .page-hero")) continue
      const bounds = target.getBoundingClientRect()
      // Don't fade out text already being read on load, route change, or filter.
      tracked.set(target, { armed: bounds.top >= window.innerHeight || bounds.bottom <= 0 })
      enter.observe(target)
      leave.observe(target)
    }
  }

  function keepFocusedVisible(event: FocusEvent) {
    if (!(event.target instanceof Element)) return
    for (const [target, state] of tracked) {
      if (!target.contains(event.target)) continue
      stop(state)
      state.armed = false
    }
  }

  function preferenceChanged() {
    if (reduced.matches) tracked.forEach(stop)
  }

  refresh()
  const changes = new MutationObserver(refresh)
  main.querySelectorAll("#conditions-list, #review-results").forEach((list) => {
    changes.observe(list, { childList: true, subtree: true })
  })
  root.addEventListener("focusin", keepFocusedVisible)
  reduced.addEventListener?.("change", preferenceChanged)
  return () => {
    changes.disconnect()
    enter.disconnect()
    leave.disconnect()
    root.removeEventListener("focusin", keepFocusedVisible)
    reduced.removeEventListener?.("change", preferenceChanged)
    tracked.forEach(stop)
  }
}
