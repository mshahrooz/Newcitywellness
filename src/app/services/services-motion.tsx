"use client"

import { useEffect } from "react"

export function ServicesMotion() {
  useEffect(() => {
    const main = document.querySelector(".ncw-services main")
    if (!main || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const targets = main.querySelectorAll<HTMLElement>(".service-reveal")
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add("is-visible")
        observer.unobserve(entry.target)
      }
    })
    targets.forEach((target) => {
      if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add("is-visible")
      else observer.observe(target)
    })
    main.classList.add("service-motion")

    return () => {
      observer.disconnect()
      main.classList.remove("service-motion")
      targets.forEach((target) => target.classList.remove("is-visible"))
    }
  }, [])
  return null
}
