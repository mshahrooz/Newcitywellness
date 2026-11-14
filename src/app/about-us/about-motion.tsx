"use client"

import { useEffect } from "react"
import { observeReveals } from "../observe-reveals"

export function AboutMotion() {
  useEffect(() => {
    const main = document.querySelector(".ncw-about main")
    if (main) return observeReveals(main)
  }, [])
  return null
}
