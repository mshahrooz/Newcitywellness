/** Reveal below-the-fold content once, without ever hiding already-visible content. */
export function observeReveals(root: ParentNode) {
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const pending = Array.from(root.querySelectorAll<HTMLElement>(".motion-reveal, .clinic-reveal, .service-reveal"))
    .filter((target) => target.getBoundingClientRect().top >= window.innerHeight)
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const target = entry.target as HTMLElement
      target.dataset.reveal = "shown"
      observer.unobserve(target)
    }
  }, { rootMargin: "0px 0px 32px 0px" })

  pending.forEach((target) => {
    target.dataset.reveal = "pending"
    observer.observe(target)
  })

  return () => {
    observer.disconnect()
    pending.forEach((target) => { delete target.dataset.reveal })
  }
}
