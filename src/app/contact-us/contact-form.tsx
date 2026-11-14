"use client"

import { useState, type FormEvent } from "react"

export function ContactForm({ email }: { email: string }) {
  const [draftOpened, setDraftOpened] = useState(false)

  function prepareDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const value = (key: string) => String(values.get(key) ?? "").trim()
    const name = [value("firstName"), value("lastName")].filter(Boolean).join(" ")
    const body = [
      ...(name ? ["Name: " + name] : []),
      "Email: " + value("email"),
      "Phone: " + value("phone"),
      "",
      value("message"),
    ].join("\r\n")
    setDraftOpened(true)
    window.location.href = `mailto:${email}?subject=${encodeURIComponent("Website contact inquiry")}&body=${encodeURIComponent(body)}`
  }

  return (
    <form className="contact-page-form" method="post" onSubmit={prepareDraft} aria-describedby="contact-form-note">
      <div className="contact-page-fields">
        <label>First name<input name="firstName" autoComplete="given-name" maxLength={80} /></label>
        <label>Last name<input name="lastName" autoComplete="family-name" maxLength={80} /></label>
        <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Phone <span aria-hidden="true">*</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label>
        <label className="contact-message">Message <span aria-hidden="true">*</span><textarea name="message" rows={5} maxLength={1000} required /></label>
      </div>
      <div className="contact-form-actions">
        <button className="btn btn-gold" type="submit">Open Email Draft <span className="arrow" aria-hidden="true">→</span></button>
        <p id="contact-form-note">Opens a draft in your email app. Nothing is sent until you send it there.</p>
      </div>
      <p className="contact-draft-status" role="status">{draftOpened ? <>If your email app didn’t open, write to <a href={`mailto:${email}`}>{email}</a>.</> : ""}</p>
      <noscript><p>JavaScript is off. <a href={`mailto:${email}`}>Email the clinic directly</a> instead.</p></noscript>
    </form>
  )
}
