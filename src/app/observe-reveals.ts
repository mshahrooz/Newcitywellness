const explicit = ".motion-reveal, .clinic-reveal, .service-reveal"
const groupParts = [
  ".faq-grid .faq-head", ".faq-grid .faq-item",
  ".reviews-intro", ".reviews-filters", ".reviews-card",
  ".insurance-form-header", ".insurance-frame",
  ".contact-map-header", ".contact-map-frame",
  ".acu-visit-heading", ".acu-steps > li",
].join(", ")

/** Observe content, not section backgrounds, sticky wrappers, or the page hero. */
export function observeReveals(root: Document) {
  const main = root.querySelector(".ncw main")
  if (!main) return
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
  const tracked = new Set<HTMLElement>()
  let frame: number | undefined

  function update() {
    frame = undefined
    if (reducedMotion.matches) {
      tracked.forEach((target) => { delete target.dataset.reveal })
      return
    }

    const height = window.innerHeight
    // Wait until the first part of a section is visible so the motion isn't missed
    // below the fold. Read all positions before changing any styles.
    const revealLine = height - Math.min(96, height * .12)
    const changes: [HTMLElement, "pending" | "shown" | undefined][] = []
    for (const target of tracked) {
      const state = target.dataset.reveal
      if (target.matches(":focus-within") || target.closest(".is-searching")) {
        if (state) changes.push([target, undefined])
        continue
      }

      // Transforms from the reveal itself must not change the trigger point.
      const top = target.getBoundingClientRect().top
      if (top > height + 36 || (!state && top > revealLine)) {
        if (state !== "pending") changes.push([target, "pending"])
      } else if (state === "pending" && top <= revealLine) {
        changes.push([target, "shown"])
      }
    }
    for (const [target, state] of changes) {
      if (state) target.dataset.reveal = state
      else delete target.dataset.reveal
    }
  }

  function schedule() {
    if (frame === undefined) frame = window.requestAnimationFrame(update)
  }

  const refresh = () => {
    const candidates = new Set(main.querySelectorAll<HTMLElement>(explicit))
    main.querySelectorAll<HTMLElement>("section:not(.hero, .page-hero)").forEach((section) => {
      if (section.closest(".hero, .page-hero")) return
      const inner = section.querySelector<HTMLElement>(":scope > .container")
      if (!inner || inner.matches(explicit) || inner.querySelector(explicit)) return
      const parts = inner.querySelectorAll<HTMLElement>(groupParts)
      if (parts.length) parts.forEach((part) => candidates.add(part))
      else candidates.add(inner)
    })
    const footer = root.querySelector<HTMLElement>(".ncw .clinic-footer .footer-grid")
    if (footer) candidates.add(footer)

    tracked.forEach((target) => {
      if (!target.isConnected) tracked.delete(target)
    })
    candidates.forEach((target) => tracked.add(target))
    schedule()
  }

  function revealFocused(event: FocusEvent) {
    if (!(event.target instanceof Element)) return
    for (const target of tracked) {
      if (target.dataset.reveal && target.contains(event.target)) delete target.dataset.reveal
    }
  }

  refresh()
  root.addEventListener("focusin", revealFocused)
  root.addEventListener("load", schedule, true)
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule)
  reducedMotion.addEventListener?.("change", schedule)
  // The condition and testimonial directories can replace content after a filter.
  const changes = new MutationObserver(refresh)
  for (const directory of main.querySelectorAll("#conditions-list, #review-results")) {
    changes.observe(directory, { childList: true, subtree: true })
  }
  return () => {
    root.removeEventListener("focusin", revealFocused)
    changes.disconnect()
    root.removeEventListener("load", schedule, true)
    window.removeEventListener("scroll", schedule)
    window.removeEventListener("resize", schedule)
    reducedMotion.removeEventListener?.("change", schedule)
    if (frame !== undefined) window.cancelAnimationFrame(frame)
    tracked.forEach((target) => { delete target.dataset.reveal })
  }
}
