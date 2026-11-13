"use client"

import { useEffect } from "react"

export function AboutMotion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".ncw-about main")
    if (!main || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const targets = main.querySelectorAll<HTMLElement>(".clinic-reveal")
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add("is-visible")
        observer.unobserve(entry.target)
      }
    }, { threshold: 0, rootMargin: "0px 0px -20px 0px" })

    targets.forEach((target) => {
      if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add("is-visible")
      else observer.observe(target)
    })
    main.classList.add("clinic-motion")

    return () => {
      observer.disconnect()
      main.classList.remove("clinic-motion")
      targets.forEach((target) => target.classList.remove("is-visible"))
    }
  }, [])
  return null
}
