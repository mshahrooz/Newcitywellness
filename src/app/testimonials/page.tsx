import type { Metadata } from "next"
import { editorImage, editorValue, hasEditorImage } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
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

  const heroImages = `${process.env.BASE_PATH || ""}/images/testimonials`

  return (
    <div className="ncw ncw-services ncw-testimonials">
      <SiteHeader current="testimonials" />
      <BuilderMain page={"testimonials"} id="main-content">
        <NativeSection id="hero" label="Testimonials hero"><section className="page-hero page-hero--photo" aria-labelledby="testimonials-title">
          <picture className="page-hero-photo" aria-hidden="true">
            {!hasEditorImage("testimonials", "hero") && <source media="(max-width: 640px)" srcSet={`${heroImages}/hero-sunlit-grass-800.webp`} width={800} height={533} />}
            <img data-editor-image="hero" {...editorImage("testimonials", "hero", { src: `${heroImages}/hero-sunlit-grass-1600.webp`, width: 1600, height: 1066, alt: "" })} fetchPriority="high" />
          </picture>
          <BrandMark className="page-hero-art" />
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/"><SiteCopy scope={"testimonials"} id={"testimonials-link"}>Home</SiteCopy></Link></li><li aria-current="page"><SiteCopy scope={"testimonials"} id={"testimonials-li"}>Testimonials</SiteCopy></li></ol>
              </nav>
              <h1 id="testimonials-title" data-editor-field="hero-title">{editorValue("testimonials", "hero-title", "Patient Testimonials")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description"><FieldText page={"testimonials"} id={"hero-description"}>{editorValue("testimonials", "hero-description", "In their own words, patients share what it was like to receive care at New City Acupuncture & Wellness Center.")}</FieldText></p>
              <a className="btn btn-gold reviews-hero-link" href="#patient-stories"><SiteCopy scope={"testimonials"} id={"testimonials-btn"}>Read Patient Stories </SiteCopy><span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="feature" label="Featured patient story"><section className="reviews-feature" aria-labelledby="featured-story-title">
          <div className="container reviews-feature-inner">
            <div className="reviews-feature-copy">
              <span className="eyebrow"><SiteCopy scope={"testimonials"} id={"testimonials-eyebrow"}>In Their Own Words</SiteCopy></span>
              <BuilderAnchor page={"testimonials"} section={"feature"} id={"testimonials-after-featured-story-titl"}><h2 className="section-title" id="featured-story-title"><SiteCopy scope={"testimonials"} id={"testimonials-featured-story-title"}>A whole-person approach</SiteCopy></h2></BuilderAnchor>
              <div className="gold-rule" aria-hidden="true" />
              <figure className="reviews-feature-quote">
                <blockquote><p><SiteCopy scope={"testimonials"} id={"testimonials-p"}>{featured.quote}</SiteCopy></p></blockquote>
                <figcaption><span className="reviews-initials" aria-hidden="true">MG</span><span><strong><SiteCopy scope={"testimonials"} id={"testimonials-strong"}>{featured.initials}</SiteCopy></strong><small><SiteCopy scope={"testimonials"} id={"testimonials-small"}>New City Wellness patient</SiteCopy></small></span></figcaption>
              </figure>
            </div>
            <figure className="reviews-feature-photo">
              <picture className="frame">
                <source media="(min-width: 820px)" srcSet={`${images}/treatment-room-960.avif`} type="image/avif" />
                <img src={`${images}/treatment-room-640.webp`} alt="A treatment room at New City Acupuncture and Wellness Center" width={640} height={663} loading="lazy" decoding="async" />
              </picture>
              <figcaption><SiteCopy scope={"testimonials"} id={"testimonials-figcaption"}>Inside the New City clinic</SiteCopy></figcaption>
            </figure>
          </div>
        </section></NativeSection>

        <NativeSection id="directory" label="Patient story collection"><section className="reviews-directory" id="patient-stories" aria-labelledby="stories-title">
          <div className="container">
            <header className="reviews-intro">
              <Ornament />
              <span className="eyebrow"><SiteCopy scope={"testimonials"} id={"testimonials-eyebrow-2"}>Patient Experiences</SiteCopy></span>
              <BuilderAnchor page={"testimonials"} section={"directory"} id={"testimonials-after-stories-title"}><h2 id="stories-title" className="section-title"><SiteCopy scope={"testimonials"} id={"testimonials-stories-title"}>More stories from our patients</SiteCopy></h2></BuilderAnchor>
              <BuilderAnchor page={"testimonials"} section={"directory"} id={"testimonials-after-p"}><p><SiteCopy scope={"testimonials"} id={"testimonials-p-2"}>These testimonials describe individual experiences. They do not predict what another patient will experience or replace medical advice.</SiteCopy></p></BuilderAnchor>
            </header>
            <ReviewCollection stories={collection} />
          </div>
        </section></NativeSection>

        <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="testimonials-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow"><SiteCopy scope={"testimonials"} id={"testimonials-eyebrow-3"}>Get In Touch</SiteCopy></span>
            <h2 id="testimonials-contact-title" data-editor-field="closing-heading"><FieldText page={"testimonials"} id={"closing-heading"}>{editorValue("testimonials", "closing-heading", "Have questions about your first visit?")}</FieldText></h2>
            <p data-editor-field="closing-copy"><FieldText page={"testimonials"} id={"closing-copy"}>{editorValue("testimonials", "closing-copy", "Call the New City clinic to talk through what to expect, or book an appointment online.")}</FieldText></p>
            <div className="cta-actions">
              <a className="btn btn-gold" href={bookingUrl} target="_blank" rel="noopener noreferrer"><SiteCopy scope={"testimonials"} id={"testimonials-btn-2"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428"><SiteCopy scope={"testimonials"} id={"testimonials-cta-phone"}>845-579-2428</SiteCopy></a>
            </div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={"testimonials"} />
      </BuilderMain>
      <SiteFooter />
    </div>
  )
}
