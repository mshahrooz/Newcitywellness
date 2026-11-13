import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { BrandMark, Ornament } from "../wellness-art"
import { therapies } from "./content"
import "../wellness.css"
import "./services.css"

export const metadata: Metadata = {
  title: "Services | New City Acupuncture & Wellness Center",
  description: "Explore acupuncture, Chinese herbal medicine, cupping, Gua-Sha, Tui-Na, moxibustion, and Qi-Gong at New City Acupuncture & Wellness Center in New City, NY.",
}

const [featured, ...otherTherapies] = therapies
const imageBase = `${process.env.BASE_PATH || ""}/images/services`
const clinicServices = "https://newcitywellness.com/services"
const booking = "https://acusimple.com/bookings/8635"

function Therapy({ therapy, feature = false }: { therapy: (typeof therapies)[number]; feature?: boolean }) {
  const titleId = `service-${therapy.id}`
  return (
    <article id={therapy.id} className={feature ? "service-item service-item-featured" : "service-item"} aria-labelledby={titleId}>
      <div className="service-photo">
        <img src={`${imageBase}/${therapy.image}.webp`} alt={therapy.alt} width={768} height={768} loading="lazy" decoding="async" />
      </div>
      <div className="service-item-copy">
        {feature && <span className="eyebrow">Traditional Chinese Medicine</span>}
        <h3 id={titleId}>{therapy.title}</h3>
        <p>{therapy.description}</p>
        <a className="service-detail-link" href={`${clinicServices}/${therapy.id}/`} aria-label={`Learn more about ${therapy.title}`}>
          Learn More <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  )
}

export default function ServicesPage() {
  return (
    <div className="ncw ncw-services">
      <SiteHeader current="services" />
      <main id="main-content">
        <section className="services-hero" aria-labelledby="services-title">
          <BrandMark className="services-hero-art" />
          <div className="container">
            <nav aria-label="Breadcrumb">
              <ol className="services-crumbs">
                <li><Link href="/">Home</Link></li>
                <li aria-current="page">Services</li>
              </ol>
            </nav>
            <h1 id="services-title">Services</h1>
            <div className="services-gold-rule" aria-hidden="true" />
            <p>Explore seven traditional Chinese medicine therapies offered at our wellness center in New City, NY.</p>
          </div>
        </section>

        <div className="services-index">
          <nav className="container" aria-label="Jump to a therapy">
            <span className="services-index-label">Explore by therapy</span>
            <ul>
              {therapies.map((therapy) => <li key={therapy.id}><a href={`#${therapy.id}`}>{therapy.label}</a></li>)}
            </ul>
          </nav>
        </div>

        <section className="services-overview" aria-labelledby="therapies-title">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">New City Acupuncture &amp; Wellness Center</span>
              <h2 id="therapies-title">Explore Our Therapies</h2>
              <Ornament />
            </div>
            <Therapy therapy={featured} feature />
            <div className="services-therapy-grid">
              {otherTherapies.map((therapy) => <Therapy key={therapy.id} therapy={therapy} />)}
            </div>
          </div>
        </section>

        <section className="services-contact" aria-labelledby="services-contact-title">
          <div className="container services-contact-inner">
            <span className="eyebrow">Get in touch</span>
            <h2 id="services-contact-title">Let’s Talk About Your First Visit</h2>
            <p>Have questions about a service or what to expect? Call the center or book a visit online.</p>
            <div className="services-contact-actions">
              <a className="btn btn-gold" href={booking} target="_blank" rel="noopener">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="services-phone" href="tel:+18455792428">845-579-2428</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
