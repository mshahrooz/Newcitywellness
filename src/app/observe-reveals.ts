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
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const main = root.querySelector(".ncw main")
  if (!main) return
  const tracked = new Set<HTMLElement>()
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const target = entry.target as HTMLElement
      target.dataset.reveal = "shown"
      observer.unobserve(target)
    }
  }, { rootMargin: "0px 0px 20px 0px" })

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
      if (target.isConnected) return
      observer.unobserve(target)
      tracked.delete(target)
    })

    candidates.forEach((target) => {
      if (tracked.has(target)) return
      tracked.add(target)
      // A deep link, browser restore, or live filter must never hide visible content.
      if (target.getBoundingClientRect().top <= window.innerHeight || target.closest(".is-searching")) return
      target.dataset.reveal = "pending"
      observer.observe(target)
    })
  }

  function revealFocused(event: FocusEvent) {
    if (!(event.target instanceof Element)) return
    for (const target of tracked) {
      if (target.dataset.reveal !== "pending" || !target.contains(event.target)) continue
      delete target.dataset.reveal
      observer.unobserve(target)
    }
  }

  refresh()
  root.addEventListener("focusin", revealFocused)
  // The condition and testimonial directories can replace content after a filter.
  const changes = new MutationObserver(refresh)
  for (const directory of main.querySelectorAll("#conditions-list, #review-results")) {
    changes.observe(directory, { childList: true, subtree: true })
  }
  return () => {
    root.removeEventListener("focusin", revealFocused)
    changes.disconnect()
    observer.disconnect()
    tracked.forEach((target) => { delete target.dataset.reveal })
  }
}
