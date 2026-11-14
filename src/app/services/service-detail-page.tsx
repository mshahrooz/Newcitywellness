import type { ReactNode } from "react"
import { editorImage, editorValue, type FieldKey } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
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
  heroPhoto?: { path: string; width: number; height: number }
  photo: { path: string; height: number; alt: string }
  visitSteps: readonly TextItem[]
  questions: readonly TextItem[]
  bookingCopy: string
}

function ServiceDetailLink({ id, children }: { id: string; children: ReactNode }) {
  const href = serviceDetailHref(id)
  return href.startsWith("/") ? <Link href={href}>{children}</Link> : <a href={href}>{children}</a>
}

function BookingLink({ id }: { id: PublishedService }) {
  return <a className="btn btn-gold" href={bookingUrl} target="_blank" rel="noopener noreferrer"><SiteCopy scope={id} id={"detail-btn"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
}

export function ServiceDetailPage({ id, title, shortTitle, description, intro, heroPhoto, photo, visitSteps, questions, bookingCopy }: ServiceDetailProps) {
  const aboutId = `about-${id}`
  const faqId = `${id}-faq`
  const sections = [
    { id: aboutId, label: `About ${shortTitle}` },
    { id: "what-to-expect", label: "What to Expect" },
    { id: faqId, label: "Common Questions" },
  ]
  const treatmentImage = `${process.env.BASE_PATH || ""}/images/services/${photo.path}`
  const related = serviceLinks.filter((therapy) => therapy.id !== id)
  const heroImage = editorImage(id, "hero", {
    src: heroPhoto ? `${process.env.BASE_PATH || ""}/images/services/${heroPhoto.path}` : "",
    width: heroPhoto?.width ?? 1600, height: heroPhoto?.height ?? 900, alt: "",
  })
  return (
    <div className="ncw ncw-services ncw-service-detail">
      <SiteHeader current="services" currentService={id} />
      <BuilderMain page={id} id="main-content">
        <NativeSection id="hero" label="Service hero"><section className={heroImage.src ? "page-hero page-hero--photo" : "page-hero"} aria-labelledby={`${id}-title`}>
          {heroImage.src && (
            <div className="page-hero-photo" aria-hidden="true">
              <img data-editor-image="hero" {...heroImage} fetchPriority="high" />
            </div>
          )}
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
                  <li><Link href="/"><SiteCopy scope={id} id={"detail-link"}>Home</SiteCopy></Link></li>
                  <li><Link href="/services/"><SiteCopy scope={id} id={"detail-link-2"}>Services</SiteCopy></Link></li>
                  <li aria-current="page"><SiteCopy scope={id} id={"detail-li"}>{shortTitle}</SiteCopy></li>
                </ol>
              </nav>
              <h1 id={`${id}-title`} data-editor-field="hero-title">{editorValue(id, "hero-title", title)}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description"><FieldText page={id} id={"hero-description"}>{editorValue(id, "hero-description", description)}</FieldText></p>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="index" label="On this page"><div className="acu-index">
          <nav className="container" aria-label="On this page">
            <ul>
              {sections.map((section) => <li key={section.id}><a href={`#${section.id}`}><SiteCopy scope={id} id={"detail-a-" + section.id}>{section.label}</SiteCopy></a></li>)}
            </ul>
            <Link className="acu-all-services" href="/services/"><span aria-hidden="true">←</span><SiteCopy scope={id} id={"detail-acu-all-services"}> All Services</SiteCopy></Link>
          </nav>
        </div></NativeSection>

        <NativeSection id="practice" label="The practice"><section className="block block--paper acu-section" id={aboutId} aria-labelledby="acu-about-title">
          <div className="container acu-editorial">
            <div className="copy acu-article">
              <span className="eyebrow"><SiteCopy scope={id} id={"detail-eyebrow"}>The Practice</SiteCopy></span>
              <h2 id="acu-about-title" className="section-title" data-editor-field="practice-heading"><FieldText page={id} id={"practice-heading"}>{editorValue(id, "practice-heading", `What Is ${shortTitle}?`)}</FieldText></h2>
              <div className="gold-rule" aria-hidden="true" />
              {intro}
            </div>
            <figure className="frame frame--right acu-treatment-photo">
              <img data-editor-image="treatment"
                {...editorImage(id, "treatment", {
                  src: `${treatmentImage}-1000.webp`,
                  srcSet: `${treatmentImage}-640.webp 640w, ${treatmentImage}-1000.webp 1000w`,
                  width: 1000, height: photo.height, alt: photo.alt,
                })}
                sizes="(max-width: 600px) calc(100vw - 32px), (max-width: 760px) calc(100vw - 40px), (max-width: 1304px) 41vw, 520px"
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section></NativeSection>

        <NativeSection id="visit" label="What to expect"><section className="block block--cream acu-section" id="what-to-expect" aria-labelledby="acu-visit-title">
          <div className="container">
            <div className="section-heading acu-visit-heading">
              <span className="eyebrow"><SiteCopy scope={id} id={"detail-eyebrow-2"}>Your First Visit</SiteCopy></span>
              <h2 id="acu-visit-title" data-editor-field="visit-heading"><FieldText page={id} id={"visit-heading"}>{editorValue(id, "visit-heading", "What to Expect")}</FieldText></h2>
              <Ornament />
            </div>
            <ol className="acu-steps">
              {visitSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="acu-step-number" aria-hidden="true">0{index + 1}</span>
                  <h3 data-editor-field={`step-heading-${index + 1}`}><FieldText page={id} id={`step-heading-${index + 1}`}>{editorValue(id, `step-heading-${index + 1}` as FieldKey, step.title)}</FieldText></h3>
                  <p data-editor-field={`step-copy-${index + 1}`}><FieldText page={id} id={`step-copy-${index + 1}`}>{editorValue(id, `step-copy-${index + 1}` as FieldKey, step.copy)}</FieldText></p>
                </li>
              ))}
            </ol>
          </div>
        </section></NativeSection>

        <NativeSection id="faq" label="Common questions"><section className="block block--paper acu-section" id={faqId} aria-labelledby="acu-faq-title">
          <div className="container acu-faq-layout">
            <div className="copy">
              <span className="eyebrow"><SiteCopy scope={id} id={"detail-eyebrow-3"}>Before You Book</SiteCopy></span>
              <h2 id="acu-faq-title" className="section-title" data-editor-field="questions-heading"><FieldText page={id} id={"questions-heading"}>{editorValue(id, "questions-heading", "Common Questions")}</FieldText></h2>
              <div className="gold-rule" aria-hidden="true" />
              <BuilderAnchor page={id} section={"faq"} id={"detail-after-p"}><p><SiteCopy scope={id} id={"detail-p"}>Have a question that’s not answered here? </SiteCopy><a href={clinicPhone}><SiteCopy scope={id} id={"detail-a-2"}>Call the clinic</SiteCopy></a><SiteCopy scope={id} id={"detail-p-2"}> before your visit.</SiteCopy></p></BuilderAnchor>
            </div>
            <div className="acu-faq-list">
              {questions.map((question, index) => (
                <details key={question.title}>
                  <summary data-editor-field={`question-heading-${index + 1}`}>{editorValue(id, `question-heading-${index + 1}` as FieldKey, question.title)}</summary>
                  <p data-editor-field={`question-copy-${index + 1}`}><FieldText page={id} id={`question-copy-${index + 1}`}>{editorValue(id, `question-copy-${index + 1}` as FieldKey, question.copy)}</FieldText></p>
                </details>
              ))}
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="related" label="Explore other therapies"><section className="acu-related" aria-labelledby="acu-related-title">
          <div className="container">
            <BuilderAnchor page={id} section={"related"} id={"detail-after-acu-related-title"}><h2 className="section-title" id="acu-related-title"><SiteCopy scope={id} id={"detail-acu-related-title"}>Explore Other Therapies</SiteCopy></h2></BuilderAnchor>
            <ul>
              {related.map((therapy) => (
                <li key={therapy.id}>
                  <ServiceDetailLink id={therapy.id}>
                    <span><strong><SiteCopy scope={id} id={"detail-strong" + "-" + therapy.id}>{therapy.title}</SiteCopy></strong><span className="acu-related-copy"><SiteCopy scope={id} id={"detail-acu-related-copy" + "-" + therapy.id}>{therapy.copy}</SiteCopy></span></span>
                    <span className="acu-related-arrow" aria-hidden="true">→</span>
                  </ServiceDetailLink>
                </li>
              ))}
            </ul>
          </div>
        </section></NativeSection>

        <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="acu-cta-title">
          <div className="container cta-inner">
            <span className="eyebrow"><SiteCopy scope={id} id={"detail-eyebrow-4"}>Get In Touch</SiteCopy></span>
            <h2 id="acu-cta-title" data-editor-field="closing-heading"><FieldText page={id} id={"closing-heading"}>{editorValue(id, "closing-heading", "Let’s Talk About Your First Visit")}</FieldText></h2>
            <p data-editor-field="closing-copy"><FieldText page={id} id={"closing-copy"}>{editorValue(id, "closing-copy", bookingCopy)}</FieldText></p>
            <div className="cta-actions"><BookingLink id={id} /><a className="cta-phone" href={clinicPhone}><SiteCopy scope={id} id={"detail-cta-phone"}>845-579-2428</SiteCopy></a></div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={id} />
      </BuilderMain>
      <SiteFooter />
    </div>
  )
}
