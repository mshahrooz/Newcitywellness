import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { BranchWatermark, Ornament } from "../wellness-art"
import { about } from "./content"
import "../wellness.css"
import "./about.css"

export const metadata: Metadata = {
  title: "About Us | New City Acupuncture & Wellness Center",
  description: "Meet Mordechai Genut, MS, L.Ac., and explore New City Acupuncture & Wellness Center, our approach to personalized care, and our weekly Qigong sessions.",
  openGraph: {
    title: "About Us | New City Acupuncture & Wellness Center",
    description: "Meet Mordechai Genut, MS, L.Ac., and get to know our wellness center in New City, NY.",
    type: "website",
  },
}

const contact = "https://newcitywellness.com/contact-us/"
const booking = "https://acusimple.com/bookings/8635"
const directions = "https://www.google.com/maps/search/?api=1&query=125+South+Main+Street+New+City+NY+10956"
const contactLinkText = "Contact us"
const [educationIntro, educationEnd] = about.education.split(contactLinkText)

export default function AboutPage() {
  return (
    <div className="ncw ncw-about">
      <SiteHeader current="about" />
      <main id="main-content">
        <section className="about-hero" aria-labelledby="about-title">
          <div className="container about-hero-inner">
            <div className="about-hero-copy">
              <nav className="about-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">About Us</span>
              </nav>
              <span className="eyebrow">New City Acupuncture &amp; Wellness Center</span>
              <h1 id="about-title">About Us</h1>
              <p>Meet our practitioner, get to know our approach, and take a look inside our New City wellness center.</p>
              <div className="about-actions">
                <a className="btn" href={booking} target="_blank" rel="noopener">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
                <a className="about-text-link" href="#practitioner">Meet the Practitioner <span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <figure className="about-portrait">
              <img {...about.photos[0]} alt="Mordechai Genut, owner of New City Acupuncture &amp; Wellness Center" fetchPriority="high" />
              <figcaption><strong>Mordechai Genut, MS, L.Ac.</strong><span>Owner · NYS licensed acupuncturist</span></figcaption>
            </figure>
          </div>
          <BranchWatermark className="about-hero-botanical" />
        </section>

        <section id="practitioner" className="about-section about-practitioner" aria-labelledby="practitioner-heading">
          <div className="container">
            <div className="about-profile">
              <div className="about-copy">
                <span className="eyebrow">Meet the practitioner</span>
                <h2 id="practitioner-heading">Mordechai Genut, <span>MS, L.Ac.</span></h2>
              </div>
              <div className="about-copy about-prose">
                <p>{about.training}</p>
                <p>{about.origin}</p>
              </div>
            </div>
            <div className="about-bio-grid">
              <article className="about-editorial-item about-copy">
                <h3>A lifelong practice in movement</h3>
                <p>{about.movement}</p>
              </article>
              <article className="about-editorial-item about-copy">
                <h3>An individual approach to care</h3>
                <p>{about.approach}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="about-mission" aria-labelledby="mission-heading">
          <BranchWatermark className="about-mission-botanical" />
          <div className="container about-mission-inner">
            <span className="eyebrow">Whole-person wellness</span>
            <h2 id="mission-heading">Our Approach</h2>
            <Ornament />
            <p>{about.mission}</p>
          </div>
        </section>

        <section className="about-section about-facility" aria-labelledby="facility-heading">
          <div className="container">
            <div className="about-facility-intro">
              <div className="about-copy">
                <span className="eyebrow">About · New City, NY</span>
                <h2 id="facility-heading">Our Facility</h2>
                <p>{about.rooms}</p>
                <p>{about.facility}</p>
                <a className="about-text-link" href={directions} target="_blank" rel="noopener">Get Directions <span aria-hidden="true">→</span></a>
              </div>
              <div className="about-gallery" aria-label="Photos from the wellness center">
                <img {...about.photos[2]} alt="New City Acupuncture &amp; Wellness Center" loading="lazy" decoding="async" />
                <img {...about.photos[1]} alt="A photo from New City Acupuncture &amp; Wellness Center" loading="lazy" decoding="async" />
                <img {...about.photos[3]} alt="Another view from New City Acupuncture &amp; Wellness Center" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="about-bio-grid about-programs">
              <article className="about-editorial-item about-copy">
                <span className="eyebrow">Weekly group sessions</span>
                <h3>Qigong, Breathing &amp; Meditation</h3>
                <span className="about-time">Mondays at 9:30 am</span>
                <p>{about.qigong}</p>
              </article>
              <article className="about-editorial-item about-copy">
                <span className="eyebrow">Beyond the treatment room</span>
                <h3>Health &amp; Wellness Education</h3>
                <p>{educationIntro}<a className="about-text-link" href={contact}>{contactLinkText}</a>{educationEnd}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="about-contact about-section" aria-labelledby="about-contact-heading">
          <div className="container about-contact-grid">
            <div className="about-copy">
              <span className="eyebrow">Get in touch</span>
              <h2 id="about-contact-heading">Contact Us <span>We’re Just a Click Away</span></h2>
              <div className="about-actions">
                <a className="btn" href={contact}>Contact Us <span className="arrow" aria-hidden="true">→</span></a>
                <a className="btn btn-outline" href="tel:+18455792428">845-579-2428</a>
              </div>
              <div className="about-social" aria-label="Social media">
                {about.social.map(({ label, href }) => <a key={label} href={href} target="_blank" rel="noopener">{label} <span aria-hidden="true">↗</span></a>)}
              </div>
            </div>
            <div className="about-contact-details">
              <h3>Visit the Center</h3>
              <address>
                <a href={directions} target="_blank" rel="noopener">125 South Main Street<br />New City, NY 10956</a>
                <a href="mailto:newcitywellness@gmail.com">newcitywellness@gmail.com</a>
              </address>
              <h4>Clinic Hours</h4>
              <dl className="about-hours">
                <div><dt>Sunday–Thursday</dt><dd>9:00 am–9:00 pm</dd></div>
                <div><dt>Friday</dt><dd>9:00 am–2:00 pm</dd></div>
                <div><dt>Saturday</dt><dd>Closed</dd></div>
              </dl>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter expanded />
    </div>
  )
}
