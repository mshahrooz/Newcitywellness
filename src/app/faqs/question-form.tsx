"use client"

import { useState, type FormEvent } from "react"

export function QuestionForm() {
  const [status, setStatus] = useState("")

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (data.get("website")) return
    const name = [data.get("first_name"), data.get("last_name")].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ")
    const subject = encodeURIComponent("Website question" + (name ? " from " + name : ""))
    const body = encodeURIComponent([
      "Name: " + name,
      "Email: " + data.get("email"),
      "Phone: " + data.get("phone"),
      "",
      data.get("message"),
    ].join("\n"))
    setStatus("Your email app will open with the draft. Review it and send it from there.")
    window.location.href = "mailto:newcitywellness@gmail.com?subject=" + subject + "&body=" + body
  }

  return (
    <form className="faq-form" id="question-form" method="post" onSubmit={prepareEmail}>
      <div className="faq-fields">
        <label>First Name<input name="first_name" autoComplete="given-name" placeholder="First name" /></label>
        <label>Last Name<input name="last_name" autoComplete="family-name" placeholder="Last name" /></label>
        <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
        <label>Phone <span aria-hidden="true">*</span><input name="phone" type="tel" autoComplete="tel" placeholder="845-000-0000" required /></label>
        <label className="faq-field-full">Message<textarea name="message" rows={5} placeholder="How can we help?" required /></label>
        <label className="faq-honeypot" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="faq-form-actions">
        <button type="submit" className="btn">Send Message <span className="arrow" aria-hidden="true">→</span></button>
        <p>Opens your email app with a draft. Nothing is sent until you send it there.</p>
      </div>
      <p className="faq-form-status" role="status">{status}</p>
    </form>
  )
}
