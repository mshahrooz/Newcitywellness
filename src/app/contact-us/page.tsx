import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
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
      <BuilderMain page={"contact"} id="main-content">
        <NativeSection id="hero" label="Contact hero"><section className="page-hero page-hero--photo contact-hero" aria-labelledby="contact-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img data-editor-image="hero" {...editorImage("contact", "hero", { src: hero, width: 1500, height: 1000, alt: "" })} fetchPriority="high" />
          </div>
          <BrandMark className="page-hero-art" />
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/"><SiteCopy scope={"contact"} id={"contact-us-link"}>Home</SiteCopy></Link></li><li aria-current="page"><SiteCopy scope={"contact"} id={"contact-us-li"}>Contact</SiteCopy></li></ol>
              </nav>
              <h1 id="contact-title" data-editor-field="hero-title">{editorValue("contact", "hero-title", "Contact Us")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description"><FieldText page={"contact"} id={"hero-description"}>{editorValue("contact", "hero-description", "Get in touch with New City Acupuncture & Wellness Center to ask a question, plan your visit, or book an appointment.")}</FieldText></p>
              <a className="btn btn-gold contact-hero-link" href="#contact-details"><SiteCopy scope={"contact"} id={"contact-us-btn"}>Get in Touch </SiteCopy><span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="details" label="Contact details"><section className="contact-details-block" id="contact-details" aria-labelledby="contact-details-title">
          <div className="container contact-page-grid">
            <div className="contact-page-details">
              <span className="eyebrow"><SiteCopy scope={"contact"} id={"contact-us-eyebrow"}>New City, New York</SiteCopy></span>
              <BuilderAnchor page={"contact"} section={"details"} id={"contact-us-after-contact-details-tit"}><h2 id="contact-details-title" className="section-title"><SiteCopy scope={"contact"} id={"contact-us-contact-details-title"}>Reach the clinic</SiteCopy></h2></BuilderAnchor>
              <dl className="contact-page-list">
                <div><dt><SiteCopy scope={"contact"} id={"contact-us-dt"}>Phone</SiteCopy></dt><dd><a href={phone}><SiteCopy scope={"contact"} id={"contact-us-a"}>845-579-2428</SiteCopy></a></dd></div>
                <div><dt><SiteCopy scope={"contact"} id={"contact-us-dt-2"}>Email</SiteCopy></dt><dd><a href={`mailto:${email}`}><SiteCopy scope={"contact"} id={"contact-us-a-2"}>{email}</SiteCopy></a></dd></div>
                <div><dt><SiteCopy scope={"contact"} id={"contact-us-dt-3"}>Address</SiteCopy></dt><dd><a href={directions} target="_blank" rel="noopener noreferrer"><SiteCopy scope={"contact"} id={"contact-us-a-3"}>125 South Main Street<br />New City, NY 10956</SiteCopy></a></dd></div>
              </dl>
              <BuilderAnchor page={"contact"} section={"details"} id={"contact-us-after-contact-hours-title"}><h3 className="contact-hours-title"><SiteCopy scope={"contact"} id={"contact-us-contact-hours-title"}>Office hours</SiteCopy></h3></BuilderAnchor>
              <dl className="contact-hours">
                {officeHours.map(([day, hours], index) => <div key={day}><dt><SiteCopy scope={"contact"} id={"contact-us-day-" + index}>{day}</SiteCopy></dt><dd><SiteCopy scope={"contact"} id={"contact-us-hours-" + index}>{hours}</SiteCopy></dd></div>)}
              </dl>
            </div>
            <div className="contact-page-panel">
              <span className="eyebrow"><SiteCopy scope={"contact"} id={"contact-us-eyebrow-2"}>General Inquiries</SiteCopy></span>
              <h2 className="section-title" data-editor-field="secondary-heading"><FieldText page={"contact"} id={"secondary-heading"}>{editorValue("contact", "secondary-heading", "Send us a message")}</FieldText></h2>
              <BuilderAnchor page={"contact"} section={"details"} id={"contact-us-after-p"}><p><SiteCopy scope={"contact"} id={"contact-us-p"}>For help checking your acupuncture benefits, please use the </SiteCopy><Link href="/insurance/"><SiteCopy scope={"contact"} id={"contact-us-link-2"}>insurance verification form</SiteCopy></Link><SiteCopy scope={"contact"} id={"contact-us-p-2"}>.</SiteCopy></p></BuilderAnchor>
              <ContactForm email={email} />
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="map" label="Map and directions"><section className="contact-map-block" aria-labelledby="contact-map-title">
          <div className="container">
            <div className="contact-map-header">
              <div>
                <span className="eyebrow"><SiteCopy scope={"contact"} id={"contact-us-eyebrow-3"}>Find Us</SiteCopy></span>
                <BuilderAnchor page={"contact"} section={"map"} id={"contact-us-after-contact-map-title"}><h2 className="section-title" id="contact-map-title"><SiteCopy scope={"contact"} id={"contact-us-contact-map-title"}>Visit our New City clinic</SiteCopy></h2></BuilderAnchor>
                <BuilderAnchor page={"contact"} section={"map"} id={"contact-us-after-p-2"}><p><SiteCopy scope={"contact"} id={"contact-us-p-3"}>125 South Main Street, New City, NY 10956</SiteCopy></p></BuilderAnchor>
              </div>
              <a className="btn btn-outline" href={directions} target="_blank" rel="noopener noreferrer"><SiteCopy scope={"contact"} id={"contact-us-btn-2"}>Get Directions </SiteCopy><span className="arrow" aria-hidden="true">↗</span></a>
            </div>
            <div className="contact-map-frame">
              <iframe src={map} title="Map of New City Acupuncture and Wellness Center at 125 South Main Street" width="1120" height="400" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="contact-book-title">
          <div className="container cta-inner">
            <span className="eyebrow"><SiteCopy scope={"contact"} id={"contact-us-eyebrow-4"}>Book a Visit</SiteCopy></span>
            <h2 id="contact-book-title" data-editor-field="closing-heading"><FieldText page={"contact"} id={"closing-heading"}>{editorValue("contact", "closing-heading", "Ready to schedule your appointment?")}</FieldText></h2>
            <p data-editor-field="closing-copy"><FieldText page={"contact"} id={"closing-copy"}>{editorValue("contact", "closing-copy", "Book online through AcuSimple or call the clinic if you’d prefer to schedule by phone.")}</FieldText></p>
            <div className="cta-actions">
              <a className="btn btn-gold" href={booking} target="_blank" rel="noopener noreferrer"><SiteCopy scope={"contact"} id={"contact-us-btn-3"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href={phone}><SiteCopy scope={"contact"} id={"contact-us-cta-phone"}>845-579-2428</SiteCopy></a>
            </div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={"contact"} />
      </BuilderMain>
      <SiteFooter />
    </div>
  )
}
