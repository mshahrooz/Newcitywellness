import type { ReactNode } from "react"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { Ornament } from "../wellness-art"
import { serviceDetailHref, serviceLinks, type PublishedService } from "./service-links"
import "../wellness.css"
import "./services.css"
import "./service-detail.css"

const bookingUrl = "https://acusimple.com/bookings/8635"
const clinicPhone = "tel:+18455792428"

type TextItem = { title: string; copy: string }
type ServiceDetailProps = {
  id: PublishedService
  title: string
  shortTitle: string
  description: string
  intro: ReactNode
  photo: { path: string; height: number; alt: string }
  visitSteps: readonly TextItem[]
  questions: readonly TextItem[]
  bookingCopy: string
}

function ServiceDetailLink({ id, children }: { id: string; children: ReactNode }) {
  const href = serviceDetailHref(id)
  return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>
}

function BookingLink() {
  return <a className="btn btn-gold" href={bookingUrl} target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
}

export function ServiceDetailPage({ id, title, shortTitle, description, intro, photo, visitSteps, questions, bookingCopy }: ServiceDetailProps) {
  const aboutId = `about-${id}`
  const faqId = `${id}-faq`
  const sections = [
    { id: aboutId, label: `About ${shortTitle}` },
    { id: "what-to-expect", label: "What to Expect" },
    { id: faqId, label: "Common Questions" },
  ]
  const treatmentImage = `${process.env.BASE_PATH || ""}/images/services/${photo.path}`
  const related = serviceLinks.filter((therapy) => therapy.id !== id)
  return (
    <div className="ncw ncw-services ncw-service-detail">
      <SiteHeader current="services" currentService={id} />
      <main id="main-content">
        <section className="page-hero" aria-labelledby={`${id}-title`}>
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M42 59C30 45 29 25 42 7C55 25 54 45 42 59Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M8 43C18 55 29 63 42 68C55 63 66 55 76 43" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs">
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/services/">Services</Link></li>
                  <li aria-current="page">{shortTitle}</li>
                </ol>
              </nav>
              <h1 id={`${id}-title`}>{title}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p>{description}</p>
            </div>
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

        <section className="block block--paper acu-section" id={aboutId} aria-labelledby="acu-about-title">
          <div className="container acu-editorial">
            <div className="copy acu-article">
              <span className="eyebrow">The Practice</span>
              <h2 id="acu-about-title" className="section-title">What Is {shortTitle}?</h2>
              <div className="gold-rule" aria-hidden="true" />
              {intro}
            </div>
            <figure className="frame frame--right acu-treatment-photo">
              <img
                src={`${treatmentImage}-1000.webp`}
                srcSet={`${treatmentImage}-640.webp 640w, ${treatmentImage}-1000.webp 1000w`}
                sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 760px) calc(100vw - 40px), (max-width: 1304px) 41vw, 520px"
                width={1000}
                height={photo.height}
                loading="lazy"
                decoding="async"
                alt={photo.alt}
              />
            </figure>
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

        <section className="block block--paper acu-section" id={faqId} aria-labelledby="acu-faq-title">
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
                <li key={therapy.id}>
                  <ServiceDetailLink id={therapy.id}>
                    <span><strong>{therapy.title}</strong><span className="acu-related-copy">{therapy.copy}</span></span>
                    <span className="acu-related-arrow" aria-hidden="true">→</span>
                  </ServiceDetailLink>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="acu-cta-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="acu-cta-title">Let’s Talk About Your First Visit</h2>
            <p>{bookingCopy}</p>
            <div className="cta-actions"><BookingLink /><a className="cta-phone" href={clinicPhone}>845-579-2428</a></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
