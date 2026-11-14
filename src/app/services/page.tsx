import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { Ornament } from "../wellness-art"
import { ServicesMotion } from "./services-motion"
import { therapies } from "./content"
import { serviceDetailHref } from "./service-links"
import "../wellness.css"
import "./services.css"

export const metadata: Metadata = {
  title: "Services | New City Acupuncture & Wellness Center",
  description: "Acupuncture, Chinese herbal medicine, cupping, Gua-Sha, Tui-Na medical massage, moxibustion, and Qi-Gong in New City, NY.",
}

const basePath = process.env.BASE_PATH || ""
const imageBase = `${basePath}/images/services`
const sessionActivities = ["Qigong", "Breathing", "Meditation", "Relaxation"]

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="chips">
      {items.map((item) => <li key={item} className="chip">{item}</li>)}
    </ul>
  )
}

function Therapy({ therapy, reverse }: { therapy: (typeof therapies)[number]; reverse: boolean }) {
  const titleId = `service-${therapy.id}`
  const href = serviceDetailHref(therapy.id)
  const src = `${imageBase}/${therapy.image}.webp`
  return (
    <section id={therapy.id} className={`block service ${reverse ? "block--cream" : "block--paper"}`} aria-labelledby={titleId}>
      <div className={`container split${reverse ? " split--reverse" : ""}`}>
        <figure className={`frame split-media service-reveal ${reverse ? "frame--right from-right" : "from-left"}`}>
          <img
            src={src}
            srcSet={`${imageBase}/${therapy.image}-640.webp 640w, ${src} ${therapy.width}w`}
            sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 900px) calc(100vw - 40px), (max-width: 1304px) 45vw, 584px"
            alt={therapy.alt}
            width={therapy.width}
            height={therapy.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className={`split-copy copy service-reveal ${reverse ? "from-left" : "from-right"}`}>
          <span className="eyebrow">{therapy.eyebrow}</span>
          <h2 className="section-title" id={titleId}>{therapy.title}</h2>
          <div className="gold-rule" aria-hidden="true" />
          <p>{therapy.description}</p>
          <p className="chip-label">At a glance</p>
          <Chips items={therapy.highlights} />
          {href.startsWith("/") ? (
            <Link className="btn service-btn" href={href} aria-label={`Read more about ${therapy.title}`}>
              Read More <span className="arrow" aria-hidden="true">→</span>
            </Link>
          ) : (
            <a className="btn service-btn" href={href} aria-label={`Read more about ${therapy.title}`}>
              Read More <span className="arrow" aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export default function ServicesPage() {
  return (
    <div className="ncw ncw-services">
      <SiteHeader current="services" />
      <ServicesMotion />
      <main id="main-content">
        <section className="page-hero page-hero--photo services-overview-hero" aria-labelledby="services-title">
          <picture className="page-hero-photo" aria-hidden="true">
            <source media="(max-width: 600px)" srcSet={`${imageBase}/hero-botanical-mobile.webp`} />
            <img src={`${imageBase}/hero-botanical.webp`} alt="" width={1365} height={540} fetchPriority="high" />
          </picture>
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M42 59C30 45 29 25 42 7C55 25 54 45 42 59Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
            <path d="M8 43C18 55 29 63 42 68C55 63 66 55 76 43" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          </svg>
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs rise">
                  <li><Link href="/">Home</Link></li>
                  <li aria-current="page">Services</li>
                </ol>
              </nav>
              <h1 id="services-title" className="rise d1">Services</h1>
              <div className="gold-rule rise d2" aria-hidden="true" />
              <p className="rise d3">Traditional Chinese medicine modalities for optimal health, inner peace, and an overall good quality of life.</p>
            </div>
          </div>
        </section>

        <section className="statement" aria-label="Our approach to treatment">
          <div className="container statement-inner service-reveal">
            <Ornament />
            <p>Our wellness center offers holistic treatment plans specifically tailored to your needs, balancing the emotional health, physical well-being, and lifestyle of each person.</p>
            <nav aria-labelledby="jump-label">
              <p id="jump-label" className="jump-label">Jump to a service</p>
              <ul className="chips chips--center">
                {therapies.map((therapy) => <li key={therapy.id}><a className="chip" href={`#${therapy.id}`}>{therapy.label}</a></li>)}
              </ul>
            </nav>
          </div>
        </section>

        {therapies.map((therapy, index) => <Therapy key={therapy.id} therapy={therapy} reverse={index % 2 === 1} />)}

        <section className="sessions-wrap" aria-labelledby="sessions-title">
          <div className="container">
            <div className="sessions service-reveal">
              <figure className="sessions-media">
                <img
                  src={`${basePath}/images/about/practitioner-treatment.jpg`}
                  alt="Mordechai Genut working with a patient at New City Acupuncture & Wellness Center"
                  width={640}
                  height={640}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
              <div className="sessions-copy">
                <span className="session-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
                  Mondays · 9:30 am
                </span>
                <h2 id="sessions-title">Weekly Group Sessions</h2>
                <div className="gold-rule" aria-hidden="true" />
                <p>Start the week with affordable group sessions in Qigong, breathing, meditation, and relaxation. The sessions take place at our New City wellness center and focus on gentle movement, posture, and relaxation. Call the center for details before attending.</p>
                <Chips items={sessionActivities} />
              </div>
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="cta-title">
          <div className="container cta-inner service-reveal">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="cta-title">Let’s Talk About Your First Visit</h2>
            <p>Have questions about a service or what to expect? Call the center or book a visit online.</p>
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
