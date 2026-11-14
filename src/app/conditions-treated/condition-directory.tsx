"use client"

import { useEffect, useState } from "react"
import { conditionGroups } from "./conditions-data"

const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim()

export function ConditionDirectory({ imageBase }: { imageBase: string }) {
  const [query, setQuery] = useState("")
  const [linkedGroup, setLinkedGroup] = useState("")
  const keywords = normalize(query).split(/\s+/).filter(Boolean)
  const matches = conditionGroups.flatMap((group) => {
    const inCategory = keywords.every((word) => normalize(group.title).includes(word))
    const topics = inCategory ? group.topics : group.topics.filter((topic) => {
      const text = normalize(group.title + " " + topic)
      return keywords.every((word) => text.includes(word))
    })
    return topics.length ? [{ group, topics }] : []
  })

  useEffect(() => {
    function followAnchor() {
      const id = window.location.hash.slice(1)
      if (!conditionGroups.some((group) => group.id === id)) return
      setQuery("")
      setLinkedGroup(id)
    }
    followAnchor()
    window.addEventListener("hashchange", followAnchor)
    return () => window.removeEventListener("hashchange", followAnchor)
  }, [])

  useEffect(() => {
    if (!linkedGroup) return
    document.getElementById(linkedGroup)?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [linkedGroup])

  return (
    <section className="condition-directory" id="directory" aria-labelledby="directory-title">
      <div className="container">
        <div className="condition-directory-head">
          <div>
            <span className="eyebrow">Browse by Category</span>
            <h2 className="section-title" id="directory-title">Find a health concern</h2>
            <div className="gold-rule" aria-hidden="true" />
            <p>Open a category or search for a symptom or condition.</p>
          </div>
          <div className="condition-search" role="search" aria-label="Condition directory">
            <label htmlFor="condition-query">Search the directory</label>
            <div>
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>
              <input id="condition-query" type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Try back pain, IBS, or sleep" />
              {query && <button type="button" onClick={() => { setQuery(""); document.getElementById("condition-query")?.focus() }}>Clear</button>}
            </div>
            <p className="condition-result-count" role="status">
              {keywords.length ? `${matches.reduce((count, entry) => count + entry.topics.length, 0)} matching topics in ${matches.length} ${matches.length === 1 ? "category" : "categories"}` : "11 health categories"}
            </p>
          </div>
        </div>
        {matches.length > 0 ? (
          <div className="condition-catalog">
            {matches.map(({ group, topics }) => (
              <details key={group.id + (keywords.length ? ":search" : "")} className="condition-entry" id={group.id} open={keywords.length > 0 || linkedGroup === group.id ? true : undefined}>
                <summary>
                  <div className="condition-entry-photo"><img src={`${imageBase}/${group.id}.webp`} alt="" width={640} height={360} loading="lazy" decoding="async" /></div>
                  <div className="condition-entry-label">
                    <div><span className="condition-topic-count">{topics.length} topics</span><h3>{group.title}</h3></div>
                    <span className="condition-expand" aria-hidden="true" />
                  </div>
                </summary>
                <div className="condition-entry-content">
                  <ul>{topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
                  {"note" in group && <p>{group.note}</p>}
                </div>
              </details>
            ))}
          </div>
        ) : <p className="condition-empty">No matches. Try a broader term, such as <strong>pain</strong>, or <a href="tel:+18455792428">call the clinic</a> with your question.</p>}
      </div>
    </section>
  )
}
