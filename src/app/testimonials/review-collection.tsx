"use client"

import { useState } from "react"

type Story = { topic: string; initials: string; quote: string; excerpt?: boolean }

const topics = {
  "All Stories": null,
  "Pain & Movement": ["A. B.", "I. B.", "J. G.", "K. B.", "J. K.", "B. A.", "K. D.", "E. S.", "R. B.", "M. L.", "H. B.", "O. K."],
  "Sleep, Stress & Energy": ["D. G.", "E. W.", "A. R.", "B. A.", "Y. F.", "K. B.", "E. S.", "A. S."],
  "Other Experiences": ["S. B.", "P. P.", "J. F.", "C. H.", "S. F.", "M. S.", "C. A.", "A. A.", "L. M."],
} as const

type Topic = keyof typeof topics

function previewOf(quote: string) {
  const max = 260
  if (quote.length <= max) return null
  const prefix = quote.slice(0, max)
  const endOfSentence = Math.max(prefix.lastIndexOf(". "), prefix.lastIndexOf("! "), prefix.lastIndexOf("? "))
  const end = endOfSentence >= 135 ? endOfSentence + 1 : prefix.lastIndexOf(" ")
  return `${quote.slice(0, end)}${endOfSentence >= 135 ? "" : "…"}`
}

function ReviewCard({ story }: { story: Story }) {
  const preview = previewOf(story.quote)
  const titleId = `story-${story.initials.replace(/[^A-Z]/g, "").toLowerCase()}`
  return (
    <article className="reviews-card" aria-labelledby={titleId}>
      <div className="reviews-card-header">
        <h3 id={titleId}>{story.topic}</h3>
        <svg className="reviews-quote-mark" viewBox="0 0 32 24" fill="none" aria-hidden="true">
          <path d="M13 2C5 5 2 10 2 16a5 5 0 1 0 5-5c.8-2.5 3-4.8 6-6.2L13 2ZM29 2c-8 3-11 8-11 14a5 5 0 1 0 5-5c.8-2.5 3-4.8 6-6.2L29 2Z" fill="currentColor" />
        </svg>
      </div>
      <figure>
        {preview ? (
          <div className="reviews-expandable">
            <blockquote className="reviews-preview"><p>{preview}</p></blockquote>
            <details className="reviews-disclosure">
              <summary aria-describedby={titleId}>
                <span className="reviews-toggle reviews-toggle-open">Read {story.excerpt ? "excerpt" : "full story"} <span aria-hidden="true">+</span></span>
                <span className="reviews-toggle reviews-toggle-close">Show less <span aria-hidden="true">−</span></span>
              </summary>
              <blockquote className="reviews-full"><p>{story.quote}</p></blockquote>
            </details>
          </div>
        ) : (
          <blockquote className="reviews-short"><p>{story.quote}</p></blockquote>
        )}
        <figcaption><span className="reviews-initials" aria-hidden="true">{story.initials.replace(/[^A-Z]/g, "")}</span><strong>{story.initials}</strong>{story.excerpt && <small>Excerpt</small>}</figcaption>
      </figure>
    </article>
  )
}

export function ReviewCollection({ stories }: { stories: Story[] }) {
  const [active, setActive] = useState<Topic>("All Stories")
  const group: readonly string[] | null = topics[active]
  const filtered = group ? stories.filter(({ initials }) => group.includes(initials)) : stories

  return (
    <>
      <div className="reviews-filters" role="group" aria-label="Filter testimonials by topic">
        {(Object.keys(topics) as Topic[]).map((label) => (
          <button key={label} type="button" aria-pressed={label === active} aria-controls="review-results" onClick={() => setActive(label)}>{label}</button>
        ))}
      </div>
      <p className="reviews-count" role="status">{filtered.length} {filtered.length === 1 ? "story" : "stories"}</p>
      <div className="reviews-grid" id="review-results">
        {filtered.map((story) => <ReviewCard key={story.initials} story={story} />)}
      </div>
    </>
  )
}
