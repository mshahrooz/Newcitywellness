"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type Question = { id: string; title: string; answer: ReactNode }

type Photo = { src: string; width: number; height: number }

export function FaqAccordion({ questions, photos }: { questions: readonly Question[]; photos: readonly Photo[] }) {
  const list = useRef<HTMLDivElement>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    function openFromHash() {
      const items = Array.from(list.current?.querySelectorAll("details") ?? [])
      const index = items.findIndex((item) => "#" + item.id === window.location.hash)
      if (index < 0) return
      const target = items[index]
      target.open = true
      setPhotoIndex(index)
      target.scrollIntoView({ block: "start", behavior: "instant" })
    }
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [])

  return (
    <section className="faq-section" id="questions" aria-labelledby="questions-title">
      <div className="container faq-grid">
        <aside className="faq-aside" aria-label="Appointment booking">
          <figure className="frame faq-media" aria-hidden="true">
            {photos.map((photo, index) => (
              <img key={photo.src} src={photo.src} width={photo.width} height={photo.height} loading="lazy" decoding="async" alt="" className={index === photoIndex ? "is-active" : undefined} data-photo={index} />
            ))}
          </figure>
          <div className="aside-card">
            <strong>Ready to begin?</strong>
            <p>Book your appointment online with Mordechai Genut, MS, L.Ac.</p>
            <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
          </div>
        </aside>
        <div className="faq-main">
          <div className="faq-head copy">
            <span className="eyebrow">Acupuncture</span>
            <h2 className="section-title" id="questions-title">Frequently Asked Questions</h2>
            <div className="gold-rule" aria-hidden="true" />
          </div>
          <div className="faq-list" ref={list}>
            {questions.map((question, index) => (
              <details className="faq-item" key={question.id} id={question.id} name="acupuncture-faq" open={index === 0 ? true : undefined} onToggle={(event) => {
                if (event.currentTarget.open) setPhotoIndex(index)
              }}>
                <summary><span className="faq-q">{question.title}</span><span className="faq-icon" aria-hidden="true" /></summary>
                <div className="faq-answer copy">
                  <figure className="faq-thumb" aria-hidden="true">
                    <img src={photos[index].src} width={photos[index].width} height={photos[index].height} loading="lazy" decoding="async" alt="" />
                  </figure>
                  {question.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
