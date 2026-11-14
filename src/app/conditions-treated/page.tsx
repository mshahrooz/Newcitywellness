import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { ConditionDirectory } from "./condition-directory"
import "../wellness.css"
import "../services/services.css"
import "./conditions.css"

export const metadata: Metadata = {
  title: "Conditions Treated & Areas of Care | New City Wellness",
  description: "Browse health concerns by category and learn how New City Acupuncture & Wellness Center discusses complementary care in New City, NY.",
}

export default function ConditionsPage() {
  const imageBase = `${process.env.BASE_PATH || ""}/images/conditions`
  return (
    <div className="ncw ncw-services ncw-conditions">
      <SiteHeader current="conditions" />
      <main id="main-content">
        <section className="page-hero page-hero--photo" aria-labelledby="conditions-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img src={`${imageBase}/hero.webp`} width={1280} height={853} alt="" fetchPriority="high" />
          </div>
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65ZM42 59C30 45 29 25 42 7C55 25 54 45 42 59ZM8 43C18 55 29 63 42 68C55 63 66 55 76 43" />
          </svg>
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Conditions</li></ol>
              </nav>
              <h1 id="conditions-title">Conditions Treated</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p>Explore common reasons people ask about acupuncture and complementary care at our New City clinic.</p>
              <a className="btn btn-gold condition-hero-link" href="#directory">Browse conditions <span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <div className="condition-context">
          <div className="container">
            <p><strong>How to use this guide.</strong> These are topics to discuss with a practitioner, not a list of conditions acupuncture has been proven to treat. Complementary care does not replace diagnosis, prescribed treatment, or emergency care.</p>
          </div>
        </div>

        <ConditionDirectory imageBase={imageBase} />

        <section className="condition-evidence" aria-labelledby="condition-evidence-title">
          <div className="container condition-evidence-grid">
            <figure className="frame">
              <img src={`${imageBase}/research.webp`} width={800} height={533} alt="Practitioner providing acupuncture to a patient resting on a treatment table" loading="lazy" decoding="async" />
            </figure>
            <div className="copy">
              <span className="eyebrow">Acupuncture &amp; Your Care</span>
              <h2 className="section-title" id="condition-evidence-title">What does the research say?</h2>
              <div className="gold-rule" aria-hidden="true" />
              <p>Research suggests acupuncture may help with some types of pain, including chronic low-back pain, knee osteoarthritis pain, and some headaches. Evidence varies by condition.</p>
              <p>At your first visit, you can share your health history, medications, and goals. Your practitioner can discuss whether complementary care is appropriate alongside the care you already receive.</p>
              <div className="condition-evidence-links">
                <Link href="/faqs/#first-session">What to expect at your first visit <span aria-hidden="true">→</span></Link>
                <a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">NIH guide to acupuncture <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="conditions-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="conditions-contact-title">Wondering if acupuncture is right for you?</h2>
            <p>Call the clinic to talk through your concerns, or book a first visit online.</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428">845-579-2428</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
