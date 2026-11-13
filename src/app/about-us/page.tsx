import type { Metadata } from "next"
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
const directions = "https://www.google.com/maps/search/?api=1&query=125+South+Main+Street+New+City+NY+10956"
const appointmentPhone = "tel:+18455792428"
const heroPhoto = "https://newcitywellness.com/wp-content/uploads/2023/01/white-stones-white-plumeria-near-water-wimming-pool-min.jpg"
const [approach, quote] = about.approach.split(" As Mordechai likes to say- ")
const contactLinkText = "Contact us"
const [educationIntro, educationEnd] = about.education.split(contactLinkText)

export default function AboutPage() {
  return (
    <div className="ncw ncw-about">
      <SiteHeader current="about" />
      <main id="main-content">
        <section className="about-hero" aria-labelledby="about-title">
          <img className="about-hero-image" src={heroPhoto} alt="" fetchPriority="high" />
          <div className="container about-wrap about-hero-inner">
            <div className="about-hero-copy">
              <span className="eyebrow">Our Story</span>
              <h1 id="about-title">About Us</h1>
              <p>{about.mission.trim()}</p>
            </div>
          </div>
        </section>

        <section id="practitioner" className="about-section about-bio" aria-labelledby="practitioner-title">
          <BranchWatermark className="about-bio-art" />
          <div className="container about-wrap about-practitioner-grid">
            <figure className="about-portrait">
              <img {...about.photos[0]} alt="Mordechai Genut, owner of New City Acupuncture & Wellness Center" decoding="async" />
              <figcaption>Owner · NYS licensed acupuncturist</figcaption>
            </figure>
            <div className="about-copy about-practitioner-copy">
              <span className="eyebrow">Owner · Founder</span>
              <h2 id="practitioner-title">Mordechai Genut, <span>MS, L.Ac.</span></h2>
              <div className="about-gold-rule" aria-hidden="true" />
              <p>{about.training}</p>
              <p>{about.origin}</p>
              <h3>Movement &amp; Mindful Practice</h3>
              <p>{about.movement}</p>
              <h3>Individualized Care</h3>
              <p>{approach}</p>
              <blockquote className="about-pullquote">
                <p>“{quote}”</p>
                <cite>— Mordechai Genut</cite>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="about-section about-facility" aria-labelledby="facility-title">
          <div className="container about-wrap">
            <div className="section-heading about-facility-heading">
              <span className="eyebrow">Our Space · New City, NY</span>
              <h2 id="facility-title">Our Facility</h2>
              <Ornament />
            </div>
            <div className="about-gallery" role="group" aria-label="Original photos of the wellness center">
              <figure><img {...about.photos[1]} alt="Inside New City Acupuncture & Wellness Center" loading="lazy" decoding="async" /></figure>
              <figure><img {...about.photos[2]} alt="A view of the wellness center" loading="lazy" decoding="async" /></figure>
              <figure><img {...about.photos[3]} alt="Another view inside the wellness center" loading="lazy" decoding="async" /></figure>
            </div>
            <div className="about-facility-copy about-copy">
              <p>{about.rooms}</p>
              <p>{about.facility}</p>
              <p className="about-education">{educationIntro}<a className="about-text-link" href={contact}>{contactLinkText}</a>{educationEnd}</p>
            </div>
            <div className="about-session">
              <div className="about-session-heading">
                <span className="eyebrow">Weekly Group Sessions</span>
                <h3 id="qigong-title">Qigong, Breathing &amp; Meditation</h3>
                <p className="about-session-time">Mondays at 9:30 am</p>
              </div>
              <p className="about-session-copy">{about.qigong}</p>
            </div>
          </div>
        </section>

        <section className="about-contact" aria-labelledby="about-contact-heading">
          <BranchWatermark className="about-contact-art" />
          <div className="container about-wrap about-contact-inner">
            <span className="eyebrow">Get in Touch</span>
            <h2 id="about-contact-heading">We’re Just a Click Away</h2>
            <div className="about-actions">
              <a className="btn btn-gold" href={contact}>Contact Us <span className="arrow" aria-hidden="true">→</span></a>
              <a className="about-phone" href={appointmentPhone}>845-579-2428</a>
            </div>
            <div className="about-social" aria-label="Social media">
              {about.social.map(({ label, href }) => <a key={label} href={href} target="_blank" rel="noopener">{label} <span aria-hidden="true">↗</span></a>)}
            </div>
            <div className="about-contact-details">
              <div>
                <h3>Visit the Center</h3>
                <address>
                  <a href={directions} target="_blank" rel="noopener">125 South Main Street<br />New City, NY 10956</a>
                  <a href="mailto:newcitywellness@gmail.com">newcitywellness@gmail.com</a>
                </address>
              </div>
              <div>
                <h3>Clinic Hours</h3>
                <dl className="about-hours">
                  <div><dt>Sunday–Thursday</dt><dd>9:00 am–9:00 pm</dd></div>
                  <div><dt>Friday</dt><dd>9:00 am–2:00 pm</dd></div>
                  <div><dt>Saturday</dt><dd>Closed</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter expanded />
    </div>
  )
}
