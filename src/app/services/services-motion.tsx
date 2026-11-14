"use client"

import { useEffect } from "react"
import { observeReveals } from "../observe-reveals"

export function ServicesMotion() {
  useEffect(() => {
    const main = document.querySelector(".ncw-services main")
    if (main) return observeReveals(main)
  }, [])
  return null
}
