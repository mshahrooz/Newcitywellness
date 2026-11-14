"use client"

import { SiteCopy } from "./builder-page"
import { Children, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function TestimonialSlider({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const count = Children.count(children)

  function onScroll() {
    const rail = track.current
    const first = rail?.firstElementChild as HTMLElement | null | undefined
    if (!rail || !first || rail.scrollWidth <= rail.clientWidth) return

    const cards = Array.from(rail.children) as HTMLElement[]
    const position = rail.scrollLeft + first.offsetLeft
    let nearest = 0
    for (let index = 1; index < cards.length; index++) {
      if (Math.abs(cards[index].offsetLeft - position) < Math.abs(cards[nearest].offsetLeft - position)) {
        nearest = index
      }
    }
    setActive(nearest)
  }

  function move(step: number) {
    const rail = track.current
    const next = active + step
    if (!rail || next < 0 || next >= count) return
    const card = rail.children.item(next) as HTMLElement | null
    const first = rail.children.item(0) as HTMLElement | null
    if (card && first) rail.scrollTo({ left: card.offsetLeft - first.offsetLeft })
  }

  return (
    <>
      {count > 1 && (
        <div className="testimonial-slider-controls" role="group" aria-label="Patient experience navigation">
          <button type="button" aria-label="Previous patient experience" aria-controls="home-testimonial-cards" aria-disabled={active === 0} onClick={() => move(-1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span className="testimonial-slider-count" aria-live="polite" aria-atomic="true">{active + 1}<SiteCopy scope={"home"} id={"testimonial-slider-testimonial-slider-count"}> / </SiteCopy>{count}</span>
          <button type="button" aria-label="Next patient experience" aria-controls="home-testimonial-cards" aria-disabled={active >= count - 1} onClick={() => move(1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      )}
      <div id="home-testimonial-cards" className="testimonial-grid" ref={track} onScroll={onScroll}>{children}</div>
    </>
  )
}
