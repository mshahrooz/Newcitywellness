import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { Ornament } from "../wellness-art"
import { ServicesMotion } from "./services-motion"
import { therapies } from "./content"
import "../wellness.css"
import "./services.css"

export const metadata: Metadata = {
  title: "Services | New City Acupuncture & Wellness Center",
  description: "Acupuncture, Chinese herbal medicine, cupping, Gua-Sha, Tui-Na medical massage, moxibustion, and Qi-Gong in New City, NY.",
}

const basePath = process.env.BASE_PATH || ""
const imageBase = `${basePath}/images/services`
const clinicServices = "https://newcitywellness.com/services"
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
          <a className="btn service-btn" href={`${clinicServices}/${therapy.id}/`} aria-label={`Read more about ${therapy.title}`}>
            Read More <span className="arrow" aria-hidden="true">→</span>
          </a>
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
        <section className="page-hero" aria-labelledby="services-title">
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
            <h2 id="cta-title">Contact Us — We’re Just A Click Away</h2>
            <p>Have questions about a service or your first visit? Get in touch with the center to discuss what to expect and which options may be right for you.</p>
            <a className="cta-phone" href="tel:+18455792428">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg>
              845-579-2428
            </a>
            <div className="clinic-social-row" aria-label="Social media links">
              <a className="clinic-social-link" href="https://www.facebook.com/Newcityacupuncture/" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></svg>
              </a>
              <a className="clinic-social-link" href="https://www.instagram.com/newcitywellness/" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" /></svg>
              </a>
              <a className="clinic-social-link" href="https://www.linkedin.com/in/mordechai-genut-ms-l-ac-93977318" target="_blank" rel="noopener" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3 0-3-1.85-3s-2.15 1.4-2.15 2.9V21H9V9Z" /></svg>
              </a>
              <a className="clinic-social-link" href="https://www.youtube.com/@NewCityAcuandWellness" target="_blank" rel="noopener" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5 3-5 3Z" /></svg>
              </a>
            </div>
            <Link className="btn btn-gold" href="/#contact">Contact Us <span className="arrow" aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
