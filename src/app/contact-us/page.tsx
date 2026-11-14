import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { BrandMark } from "../wellness-art"
import { ContactForm } from "./contact-form"
import "../wellness.css"
import "../services/services.css"
import "./contact.css"

export const metadata: Metadata = {
  title: "Contact & Directions | New City Acupuncture & Wellness Center",
  description: "Contact New City Acupuncture & Wellness Center at 845-579-2428. Find clinic hours, directions, and appointment booking for 125 South Main Street in New City, NY.",
}

const phone = "tel:+18455792428"
const email = "newcitywellness@gmail.com"
const booking = "https://acusimple.com/bookings/8635"
const directions = "https://www.google.com/maps/dir/?api=1&destination=125+South+Main+Street%2C+New+City%2C+NY+10956"
const map = "https://maps.google.com/maps?q=125%20South%20Main%20Street%20New%20City%2C%20NY%2010956&t=m&z=15&output=embed&iwloc=near"
const officeHours = [
  ["Sunday–Thursday", "9:00 am – 9:00 pm"],
  ["Friday", "9:00 am – 2:00 pm"],
  ["Saturday", "Closed"],
]

export default function ContactPage() {
  const hero = `${process.env.BASE_PATH || ""}/images/contact/contact-hero.webp`

  return (
    <div className="ncw ncw-services ncw-contact">
      <SiteHeader current="contact" />
      <main id="main-content">
        <section className="page-hero page-hero--photo contact-hero" aria-labelledby="contact-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img data-editor-image="hero" {...editorImage("contact", "hero", { src: hero, width: 1500, height: 1000, alt: "" })} fetchPriority="high" />
          </div>
          <BrandMark className="page-hero-art" />
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Contact</li></ol>
              </nav>
              <h1 id="contact-title" data-editor-field="hero-title">{editorValue("contact", "hero-title", "Contact Us")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description">{editorValue("contact", "hero-description", "Get in touch with New City Acupuncture & Wellness Center to ask a question, plan your visit, or book an appointment.")}</p>
              <a className="btn btn-gold contact-hero-link" href="#contact-details">Get in Touch <span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section className="contact-details-block" id="contact-details" aria-labelledby="contact-details-title">
          <div className="container contact-page-grid">
            <div className="contact-page-details">
              <span className="eyebrow">New City, New York</span>
              <h2 id="contact-details-title" className="section-title">Reach the clinic</h2>
              <dl className="contact-page-list">
                <div><dt>Phone</dt><dd><a href={phone}>845-579-2428</a></dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
                <div><dt>Address</dt><dd><a href={directions} target="_blank" rel="noopener noreferrer">125 South Main Street<br />New City, NY 10956</a></dd></div>
              </dl>
              <h3 className="contact-hours-title">Office hours</h3>
              <dl className="contact-hours">
                {officeHours.map(([day, hours]) => <div key={day}><dt>{day}</dt><dd>{hours}</dd></div>)}
              </dl>
            </div>
            <div className="contact-page-panel">
              <span className="eyebrow">General Inquiries</span>
              <h2 className="section-title" data-editor-field="secondary-heading">{editorValue("contact", "secondary-heading", "Send us a message")}</h2>
              <p>For help checking your acupuncture benefits, please use the <Link href="/insurance/">insurance verification form</Link>.</p>
              <ContactForm email={email} />
            </div>
          </div>
        </section>

        <section className="contact-map-block" aria-labelledby="contact-map-title">
          <div className="container">
            <div className="contact-map-header">
              <div>
                <span className="eyebrow">Find Us</span>
                <h2 className="section-title" id="contact-map-title">Visit our New City clinic</h2>
                <p>125 South Main Street, New City, NY 10956</p>
              </div>
              <a className="btn btn-outline" href={directions} target="_blank" rel="noopener noreferrer">Get Directions <span className="arrow" aria-hidden="true">↗</span></a>
            </div>
            <div className="contact-map-frame">
              <iframe src={map} title="Map of New City Acupuncture and Wellness Center at 125 South Main Street" width="1120" height="400" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="contact-book-title">
          <div className="container cta-inner">
            <span className="eyebrow">Book a Visit</span>
            <h2 id="contact-book-title" data-editor-field="closing-heading">{editorValue("contact", "closing-heading", "Ready to schedule your appointment?")}</h2>
            <p data-editor-field="closing-copy">{editorValue("contact", "closing-copy", "Book online through AcuSimple or call the clinic if you’d prefer to schedule by phone.")}</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href={booking} target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href={phone}>845-579-2428</a>
            </div>
          </div>
        </section>
        <EditorBlocks page={"contact"} />
      </main>
      <SiteFooter />
    </div>
  )
}
