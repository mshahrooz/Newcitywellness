import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { BrandMark, Ornament } from "../wellness-art"
import { ReviewCollection } from "./review-collection"
import { testimonials } from "./testimonials-data"
import "../wellness.css"
import "../services/services.css"
import "./testimonials.css"

export const metadata: Metadata = {
  title: "Patient Testimonials | New City Acupuncture & Wellness Center",
  description: "Read patient stories about care at New City Acupuncture & Wellness Center in Rockland County, NY.",
}

const featured = testimonials.find((story) => story.initials === "M. G.")!
const collection = testimonials.filter((story) => story !== featured)
const bookingUrl = "https://acusimple.com/bookings/8635"

export default function TestimonialsPage() {
  const images = `${process.env.BASE_PATH || ""}/images/about`

  return (
    <div className="ncw ncw-services ncw-testimonials">
      <SiteHeader current="testimonials" />
      <main id="main-content">
        <section className="page-hero" aria-labelledby="testimonials-title">
          <BrandMark className="page-hero-art" />
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Testimonials</li></ol>
              </nav>
              <h1 id="testimonials-title">Patient Testimonials</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p>In their own words, patients share what it was like to receive care at New City Acupuncture &amp; Wellness Center.</p>
              <a className="btn btn-gold reviews-hero-link" href="#patient-stories">Read Patient Stories <span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section className="reviews-feature" aria-labelledby="featured-story-title">
          <div className="container reviews-feature-inner">
            <div className="reviews-feature-copy">
              <span className="eyebrow">In Their Own Words</span>
              <h2 className="section-title" id="featured-story-title">A whole-person approach</h2>
              <div className="gold-rule" aria-hidden="true" />
              <figure className="reviews-feature-quote">
                <blockquote><p>{featured.quote}</p></blockquote>
                <figcaption><span className="reviews-initials" aria-hidden="true">MG</span><span><strong>{featured.initials}</strong><small>New City Wellness patient</small></span></figcaption>
              </figure>
            </div>
            <figure className="reviews-feature-photo">
              <picture className="frame">
                <source media="(min-width: 820px)" srcSet={`${images}/treatment-room-960.avif`} type="image/avif" />
                <img src={`${images}/treatment-room-640.webp`} alt="A treatment room at New City Acupuncture and Wellness Center" width={640} height={663} loading="lazy" decoding="async" />
              </picture>
              <figcaption>Inside the New City clinic</figcaption>
            </figure>
          </div>
        </section>

        <section className="reviews-directory" id="patient-stories" aria-labelledby="stories-title">
          <div className="container">
            <header className="reviews-intro">
              <Ornament />
              <span className="eyebrow">Patient Experiences</span>
              <h2 id="stories-title" className="section-title">More stories from our patients</h2>
              <p>These testimonials describe individual experiences. They do not predict what another patient will experience or replace medical advice.</p>
            </header>
            <ReviewCollection stories={collection} />
          </div>
        </section>

        <section className="cta-band" aria-labelledby="testimonials-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="testimonials-contact-title">Have questions about your first visit?</h2>
            <p>Call the New City clinic to talk through what to expect, or book an appointment online.</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href={bookingUrl} target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428">845-579-2428</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
