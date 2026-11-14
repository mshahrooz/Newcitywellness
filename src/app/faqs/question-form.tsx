"use client"

import { SiteCopy, copyText } from "../builder-page"
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
        <label><SiteCopy scope={"faqs"} id={"question-form-label"}>First Name</SiteCopy><input data-builder-copy={"question-form-placeholder-first-name"} data-builder-attr="placeholder" name="first_name" autoComplete="given-name" placeholder={copyText("faqs", "question-form-placeholder-first-name", "First name")} /></label>
        <label><SiteCopy scope={"faqs"} id={"question-form-label-2"}>Last Name</SiteCopy><input data-builder-copy={"question-form-placeholder-last-name"} data-builder-attr="placeholder" name="last_name" autoComplete="family-name" placeholder={copyText("faqs", "question-form-placeholder-last-name", "Last name")} /></label>
        <label><SiteCopy scope={"faqs"} id={"question-form-label-3"}>Email </SiteCopy><span aria-hidden="true">*</span><input data-builder-copy={"question-form-placeholder-email"} data-builder-attr="placeholder" name="email" type="email" autoComplete="email" placeholder={copyText("faqs", "question-form-placeholder-email", "you@example.com")} required /></label>
        <label><SiteCopy scope={"faqs"} id={"question-form-label-4"}>Phone </SiteCopy><span aria-hidden="true">*</span><input data-builder-copy={"question-form-placeholder-phone"} data-builder-attr="placeholder" name="phone" type="tel" autoComplete="tel" placeholder={copyText("faqs", "question-form-placeholder-phone", "845-000-0000")} required /></label>
        <label className="faq-field-full"><SiteCopy scope={"faqs"} id={"question-form-faq-field-full"}>Message</SiteCopy><textarea data-builder-copy="question-form-placeholder-message" data-builder-attr="placeholder" name="message" rows={5} placeholder={copyText("faqs", "question-form-placeholder-message", "How can we help?")} required /></label>
        <label className="faq-honeypot" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="faq-form-actions">
        <button type="submit" className="btn"><SiteCopy scope={"faqs"} id={"question-form-btn"}>Send Message </SiteCopy><span className="arrow" aria-hidden="true">→</span></button>
        <p><SiteCopy scope={"faqs"} id={"question-form-p"}>Opens your email app with a draft. Nothing is sent until you send it there.</SiteCopy></p>
      </div>
      <p className="faq-form-status" role="status">{status}</p>
    </form>
  )
}
