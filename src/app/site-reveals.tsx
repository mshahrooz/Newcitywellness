"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { observeReveals } from "./observe-reveals"

export function SiteReveals() {
  const pathname = usePathname()
  useEffect(() => observeReveals(document), [pathname])
  return null
}
