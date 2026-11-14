import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { BrandMark } from "../wellness-art"
import "../wellness.css"
import "../services/services.css"
import "./insurance.css"

export const metadata: Metadata = {
  title: "Acupuncture Insurance Verification | New City Wellness",
  description: "Ask New City Acupuncture & Wellness Center to check your acupuncture benefits. Use the clinic’s AcuSimple insurance verification form.",
}

const formUrl = "https://acusimple.com/access2/8635/#/portal/public_form/1020736/"
const phone = "tel:+18455792428"

const benefits = [
  ["01", "Visit limits", "How many acupuncture visits your plan may cover."],
  ["02", "Deductible & copay", "Whether a deductible or copay applies to your visits."],
  ["03", "Treatment coverage", "What portion of the cost your plan may cover."],
]

export default function InsurancePage() {
  const banner = `${process.env.BASE_PATH || ""}/images/insurance/insurance-banner.webp`

  return (
    <div className="ncw ncw-services ncw-insurance">
      <SiteHeader current="insurance" />
      <main id="main-content">
        <section className="page-hero page-hero--photo insurance-hero" aria-labelledby="insurance-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img data-editor-image="hero" {...editorImage("insurance", "hero", { src: banner, width: 1024, height: 341, alt: "" })} fetchPriority="high" />
          </div>
          <BrandMark className="page-hero-art" />
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Insurance</li></ol>
              </nav>
              <h1 id="insurance-title" data-editor-field="hero-title">{editorValue("insurance", "hero-title", "Does your insurance cover acupuncture?")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description">{editorValue("insurance", "hero-description", "Our New City clinic can help you check your acupuncture benefits before your visit.")}</p>
              <a className="btn btn-gold insurance-hero-link" href="#verify-benefits">Check My Benefits <span className="arrow" aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <section className="insurance-overview" aria-labelledby="insurance-overview-title">
          <div className="container">
            <div className="insurance-overview-copy">
              <span className="eyebrow">Understanding Your Plan</span>
              <h2 className="section-title" id="insurance-overview-title">What we can help you check</h2>
              <p data-editor-field="secondary-copy">{editorValue("insurance", "secondary-copy", "Some plans include out-of-network acupuncture benefits. The details vary by plan, so our office can review your benefits as a courtesy and help you understand what to expect.")}</p>
            </div>
            <ul className="insurance-benefits">
              {benefits.map(([number, label, body]) => (
                <li key={number}><span aria-hidden="true">{number}</span><div><h3>{label}</h3><p>{body}</p></div></li>
              ))}
            </ul>
          </div>
        </section>

        <section className="insurance-verification" id="verify-benefits" aria-labelledby="insurance-verification-title">
          <div className="container insurance-form-wrap">
            <header className="insurance-form-header">
              <div>
                <span className="eyebrow">AcuSimple Patient Portal</span>
                <h2 id="insurance-verification-title" className="section-title">Request insurance verification</h2>
                <p>Have your insurance card handy and enter your details as they appear on your plan. Verification doesn’t guarantee coverage or payment.</p>
              </div>
              <a className="btn btn-outline insurance-direct" href={formUrl} target="_blank" rel="noopener noreferrer">Open Form in New Tab <span className="arrow" aria-hidden="true">↗</span></a>
            </header>
            <div className="insurance-frame">
              <iframe
                src={formUrl}
                title="AcuSimple insurance benefits verification form"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                width="1024"
                height="2800"
              />
            </div>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="insurance-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="insurance-contact-title" data-editor-field="closing-heading">{editorValue("insurance", "closing-heading", "Have a question about your coverage?")}</h2>
            <p data-editor-field="closing-copy">{editorValue("insurance", "closing-copy", "Call our office if you need help with the form or want to know what to bring to your first visit.")}</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href={phone}>Call the Clinic <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href={phone}>845-579-2428</a>
            </div>
          </div>
        </section>
        <EditorBlocks page={"insurance"} />
      </main>
      <SiteFooter />
    </div>
  )
}
