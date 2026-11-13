import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../../site-header"
import { SiteFooter } from "../../site-footer"
import { Ornament } from "../../wellness-art"
import "../../wellness.css"
import "../services.css"
import "./acupuncture.css"

export const metadata: Metadata = {
  title: "Acupuncture in New City, NY | New City Acupuncture & Wellness Center",
  description: "Learn about acupuncture with Mordechai Genut, MS, L.Ac., in New City, NY. Find out what to expect at your first visit and book an appointment.",
}

const imageBase = `${process.env.BASE_PATH || ""}/images`
const treatmentImage = `${imageBase}/services/acupuncture/treatment`
const bookingUrl = "https://acusimple.com/bookings/8635"
const clinicPhone = "tel:+18455792428"
const clinicServices = "https://newcitywellness.com/services"

const sections = [
  { id: "about-acupuncture", label: "About Acupuncture" },
  { id: "what-to-expect", label: "What to Expect" },
  { id: "acupuncture-faq", label: "Common Questions" },
]

const visitSteps = [
  { title: "Talk through your concerns", copy: "Your practitioner asks about your symptoms, health history, and what you hope to get from your visit. This is a good time to mention any concerns about needles." },
  { title: "Begin your treatment", copy: "Based on that conversation, your practitioner selects acupuncture points and places fine, sterile, single-use needles. You can let them know how you’re feeling throughout the session." },
  { title: "Rest and discuss next steps", copy: "You’ll have time to rest while the needles are in place. Afterward, you and your practitioner can discuss how the visit felt and whether follow-up makes sense." },
]

const questions = [
  { title: "What does acupuncture feel like?", copy: "The needles are much thinner than those used for injections. Some people feel a brief pinch, pressure, or a dull ache, while others notice very little. Let your practitioner know if anything feels uncomfortable." },
  { title: "What should I share before my first visit?", copy: "Tell your practitioner about your medical history, medications, and any treatments you’re currently receiving. Mention if you’re pregnant or take medication that affects bleeding." },
  { title: "How many visits will I need?", copy: "There isn’t a set number of visits for everyone. Your practitioner can suggest a plan based on your goals, your health history, and how you respond to treatment." },
]

const related = [
  { title: "Chinese Herbal Medicine", href: "chinese-herbal-medicine", copy: "Individualized herbal formulas." },
  { title: "Cupping", href: "cupping", copy: "A traditional technique that uses suction cups." },
  { title: "Moxibustion", href: "moxibustion", copy: "A traditional technique that applies warmth near selected points." },
]

function BookingLink() {
  return <a className="btn btn-gold" href={bookingUrl} target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
}

export default function AcupuncturePage() {
  return (
    <div className="ncw ncw-services ncw-acupuncture">
      <SiteHeader current="services" currentService="acupuncture" />
      <main id="main-content">
        <section className="page-hero acu-hero" aria-labelledby="acupuncture-title">
          <div className="container acu-hero-grid">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs">
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/services/">Services</Link></li>
                  <li aria-current="page">Acupuncture</li>
                </ol>
              </nav>
              <span className="eyebrow acu-hero-kicker">Traditional Chinese Medicine</span>
              <h1 id="acupuncture-title">Acupuncture</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p>Personalized acupuncture in New City, NY, with Mordechai Genut, MS, L.Ac.</p>
              <div className="acu-hero-actions"><BookingLink /><a href={clinicPhone} className="acu-hero-phone">845-579-2428</a></div>
            </div>
            <figure className="acu-hero-photo">
              <img src={`${treatmentImage}-1000.webp`} srcSet={`${treatmentImage}-640.webp 640w, ${treatmentImage}-1000.webp 1000w`} sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1304px) 43vw, 550px" width={1000} height={667} fetchPriority="high" decoding="async" alt="Fine acupuncture needles being placed along a patient’s upper back" />
            </figure>
          </div>
        </section>

        <div className="acu-index">
          <nav className="container" aria-label="On this page">
            <ul>
              {sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>)}
            </ul>
            <Link className="acu-all-services" href="/services/"><span aria-hidden="true">←</span> All Services</Link>
          </nav>
        </div>

        <section className="block block--paper acu-section" id="about-acupuncture" aria-labelledby="acu-about-title">
          <div className="container acu-editorial">
            <div className="copy acu-article">
              <span className="eyebrow">The Practice</span>
              <h2 id="acu-about-title" className="section-title">What Is Acupuncture?</h2>
              <div className="gold-rule" aria-hidden="true" />
              <p>Acupuncture has been part of traditional Chinese medicine for more than 2,000 years. Early descriptions appear in the <em>Huang Di Nei Jing</em>, also known as the <em>Yellow Emperor’s Classic of Internal Medicine</em>. Today, acupuncture is practiced around the world.</p>
              <p>In the traditional framework, <em>qi</em> (pronounced “chee”) is often described as vital energy. It is understood to move through pathways called meridians. Traditional Chinese medicine describes 12 primary meridians, with specific points along them that practitioners select based on the individual.</p>
              <p>Modern researchers study acupuncture from a different perspective, including how it affects the nervous system and pain signaling. Evidence varies by condition. <a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">Read the NIH overview of acupuncture.</a></p>
            </div>
            <aside className="acu-practitioner" aria-labelledby="acu-practitioner-title">
              <img src={`${imageBase}/about/mordechai-genut.webp`} width={411} height={410} alt="Mordechai Genut" loading="lazy" decoding="async" />
              <span className="eyebrow">Your Practitioner</span>
              <h3 id="acu-practitioner-title">Mordechai Genut, MS, L.Ac.</h3>
              <p>New York State licensed acupuncturist and owner of New City Acupuncture &amp; Wellness Center.</p>
              <Link className="text-link" href="/about-us/">Meet Your Practitioner <span aria-hidden="true">→</span></Link>
            </aside>
          </div>
        </section>

        <section className="block block--cream acu-section" id="what-to-expect" aria-labelledby="acu-visit-title">
          <div className="container">
            <div className="section-heading acu-visit-heading">
              <span className="eyebrow">Your First Visit</span>
              <h2 id="acu-visit-title">What to Expect</h2>
              <Ornament />
            </div>
            <ol className="acu-steps">
              {visitSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="acu-step-number" aria-hidden="true">0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block block--paper acu-section" id="acupuncture-faq" aria-labelledby="acu-faq-title">
          <div className="container acu-faq-layout">
            <div className="copy">
              <span className="eyebrow">Before You Book</span>
              <h2 id="acu-faq-title" className="section-title">Common Questions</h2>
              <div className="gold-rule" aria-hidden="true" />
              <p>Have a question that’s not answered here? <a href={clinicPhone}>Call the clinic</a> before your visit.</p>
            </div>
            <div className="acu-faq-list">
              {questions.map((question) => (
                <details key={question.title}>
                  <summary>{question.title}</summary>
                  <p>{question.copy}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="acu-related" aria-labelledby="acu-related-title">
          <div className="container">
            <h2 className="section-title" id="acu-related-title">Explore Other Therapies</h2>
            <ul>
              {related.map((therapy) => (
                <li key={therapy.href}>
                  <a href={`${clinicServices}/${therapy.href}/`}>
                    <span><strong>{therapy.title}</strong><span className="acu-related-copy">{therapy.copy}</span></span>
                    <span className="acu-related-arrow" aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="acu-cta-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="acu-cta-title">Let’s Talk About Your First Visit</h2>
            <p>Have a question about acupuncture? Call the center or book your visit online.</p>
            <div className="cta-actions"><BookingLink /><a className="cta-phone" href={clinicPhone}>845-579-2428</a></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
