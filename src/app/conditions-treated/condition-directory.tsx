"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Ornament } from "../wellness-art"
import { conditionGroups } from "./conditions-data"

const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim()
const totalTopics = conditionGroups.reduce((total, group) => total + group.topics.length, 0)
const researchNotes = [
  "Research suggests acupuncture may help with some types of pain, including chronic low-back pain, knee osteoarthritis pain, and some headaches.",
  "Evidence varies by condition. Discuss what you hope to get out of acupuncture and how it would fit alongside your existing care.",
  "At your first visit, share your health history, medications, and goals so your practitioner can discuss whether complementary care is appropriate for you.",
]

export function ConditionDirectory({ imageBase }: { imageBase: string }) {
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const searchWidget = useRef<HTMLDivElement>(null)
  const searchButton = useRef<HTMLButtonElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const searchResults = useRef<HTMLDivElement>(null)
  const [jump, setJump] = useState<{ id: string } | null>(null)
  const keywords = normalize(query).split(/\s+/).filter(Boolean)
  const searching = keywords.length > 0
  const results = conditionGroups.map((group) => {
    const title = normalize(group.title)
    const titleHit = keywords.every((word) => title.includes(word))
    const topics = titleHit ? group.topics : group.topics.filter((topic) => {
      const text = title + " " + normalize(topic)
      return keywords.every((word) => text.includes(word))
    })
    return { group, topics }
  })
  const matchCount = results.reduce((total, entry) => total + entry.topics.length, 0)
  const categoryCount = results.filter(({ topics }) => topics.length > 0).length

  useEffect(() => {
    function followHash() {
      const id = window.location.hash.slice(1)
      if (!conditionGroups.some((group) => group.id === id)) return
      setQuery("")
      setJump({ id })
    }
    window.addEventListener("hashchange", followHash)
    return () => window.removeEventListener("hashchange", followHash)
  }, [])

  useEffect(() => {
    if (jump) document.getElementById(jump.id)?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [jump])

  useEffect(() => {
    if (!searchOpen) return
    searchInput.current?.focus({ preventScroll: true })
    function dismissOnOutsidePress(event: PointerEvent) {
      if (event.target instanceof Node && !searchWidget.current?.contains(event.target)) setSearchOpen(false)
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return
      event.preventDefault()
      setSearchOpen(false)
      if (searchWidget.current?.contains(document.activeElement)) searchButton.current?.focus({ preventScroll: true })
    }
    document.addEventListener("pointerdown", dismissOnOutsidePress)
    document.addEventListener("keydown", dismissOnEscape)
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsidePress)
      document.removeEventListener("keydown", dismissOnEscape)
    }
  }, [searchOpen])

  function viewResults() {
    setSearchOpen(false)
    searchResults.current?.focus({ preventScroll: true })
    searchResults.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }

  return (
    <>
      <section className="statement condition-finder" id="directory" aria-labelledby="directory-title">
        <div className="container statement-inner">
          <Ornament />
          <h2 id="directory-title">Not sure if we can help? Browse by category.</h2>
          <nav aria-labelledby="condition-jump-label">
            <p className="condition-jump-label" id="condition-jump-label">Jump to a category</p>
            <ul className="chips chips--center">
              {conditionGroups.map((group) => (
                <li key={group.id}><a className="chip" href={`#${group.id}`} onClick={(event) => {
                  if (!searching || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
                  event.preventDefault()
                  setQuery("")
                  if (window.location.hash !== "#" + group.id) window.history.pushState(null, "", "#" + group.id)
                  setJump({ id: group.id })
                }}>{group.title}</a></li>
              ))}
            </ul>
          </nav>
          <p className="condition-context-note">These are topics to discuss with a practitioner, not a list of proven treatments. Complementary care does not replace diagnosis, prescribed treatment, or emergency care.</p>
        </div>
      </section>

      <div id="conditions-list" ref={searchResults} tabIndex={-1} role="region" aria-label={searching ? "Condition search results" : "Conditions by category"} className={searching ? "conditions is-searching" : "conditions"}>
        {results.map(({ group, topics }, index) => {
          if (!topics.length) return null
          const reverse = index % 2 === 1
          return (
            <Fragment key={group.id}>
              <section className={`block condition-section ${reverse ? "block--cream" : "block--paper"}`} id={group.id} aria-labelledby={`${group.id}-title`}>
                <div className={`container split${reverse ? " split--reverse" : ""}`}>
                  <figure className={`frame split-media${reverse ? " frame--right" : ""}`}>
                    <img src={`${imageBase}/${group.id}.webp`} alt="" width={640} height={360} loading="lazy" decoding="async" />
                  </figure>
                  <div className="split-copy copy">
                    <span className="eyebrow condition-count">{searching ? `${topics.length} of ${group.topics.length} topics` : `${group.topics.length} topics`}</span>
                    <h2 className="section-title" id={`${group.id}-title`}>{group.title}</h2>
                    <div className="gold-rule" aria-hidden="true" />
                    <ul className="chips" aria-labelledby={`${group.id}-title`}>
                      {topics.map((topic) => {
                        const hit = searching && keywords.every((word) => normalize(topic).includes(word))
                        return <li key={topic} className={`chip${hit ? " is-match" : ""}`}>{topic}</li>
                      })}
                    </ul>
                    {"note" in group && <p className="condition-section-note">{group.note}</p>}
                  </div>
                </div>
              </section>
              {group.id === "musculoskeletal" && !searching && (
                <section className="condition-dyk" id="did-you-know" aria-labelledby="dyk-title">
                  <div className="container condition-dyk-grid">
                    <div>
                      <span className="eyebrow">Good to Know</span>
                      <h2 id="dyk-title">Did you know that…</h2>
                      <div className="gold-rule" aria-hidden="true" />
                      <a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">Read the NIH guide to acupuncture <span aria-hidden="true">↗</span></a>
                    </div>
                    <ol>
                      {researchNotes.map((note, i) => <li key={note}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><p>{note}</p></li>)}
                    </ol>
                  </div>
                </section>
              )}
            </Fragment>
          )
        })}
        {!matchCount && (
          <div className="container condition-empty">
            <h2 className="section-title">We couldn’t find that on the list</h2>
            <p>Try a broader term, or contact the clinic with your question.</p>
            <div>
              <a className="btn" href="tel:+18455792428">Call 845-579-2428</a>
              <Link className="btn btn-gold" href="/faqs/#ask-us">Ask a Question <span className="arrow" aria-hidden="true">→</span></Link>
            </div>
          </div>
        )}
      </div>
      <div className="condition-search-widget" ref={searchWidget}>
        <button
          className="condition-search-trigger"
          type="button"
          ref={searchButton}
          aria-expanded={searchOpen}
          aria-controls="condition-search-panel"
          aria-label={searchOpen ? "Close condition search" : searching ? "Open condition search, filter active" : "Open condition search"}
          title={searchOpen ? "Close search" : "Search conditions"}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {searchOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15 15 4.5 4.5" /></>}
          </svg>
          {searching && !searchOpen && <span className="condition-search-dot" aria-hidden="true" />}
        </button>
        <div className="condition-search-panel" id="condition-search-panel" hidden={!searchOpen}>
          <form role="search" aria-labelledby="condition-search-label" onSubmit={(event) => { event.preventDefault(); viewResults() }}>
            <label htmlFor="condition-query" id="condition-search-label">Search conditions</label>
            <div className="condition-search-field">
              <input id="condition-query" ref={searchInput} type="search" enterKeyHint="search" aria-controls="conditions-list" autoComplete="off" value={query}
                onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Try back pain, IBS, or sleep" />
              {query && <button type="button" className="condition-search-clear" onClick={() => { setQuery(""); searchInput.current?.focus() }}>Clear</button>}
            </div>
            <div className="condition-search-actions">
              <p className="condition-result-count" role="status">
                {!searching ? `${totalTopics} topics to explore` : !matchCount ? "No matching topics" :
                  `${matchCount} ${matchCount === 1 ? "topic" : "topics"} in ${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
              </p>
              <button type="submit" className="condition-search-results">View results <span aria-hidden="true">→</span></button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
