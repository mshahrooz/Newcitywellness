import type { Metadata } from "next"
import { editorImage, editorValue, hasEditorImage } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { Ornament } from "../wellness-art"
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

function Chips({ items, group }: { items: readonly string[]; group: string }) {
  return (
    <ul className="chips">
      {items.map((item, index) => <li key={item} className="chip"><SiteCopy scope={"services"} id={"services-chip-" + group + "-" + (index + 1)}>{item}</SiteCopy></li>)}
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
          <span className="eyebrow"><SiteCopy scope={"services"} id={"services-eyebrow" + "-" + therapy.id}>{therapy.eyebrow}</SiteCopy></span>
          <BuilderAnchor page={"services"} section={therapy.id} id={"services-after-section-title" + "-" + therapy.id}><h2 className="section-title" id={titleId}><SiteCopy scope={"services"} id={"services-section-title" + "-" + therapy.id}>{therapy.title}</SiteCopy></h2></BuilderAnchor>
          <div className="gold-rule" aria-hidden="true" />
          <BuilderAnchor page={"services"} section={therapy.id} id={"services-after-p" + "-" + therapy.id}><p><SiteCopy scope={"services"} id={"services-p" + "-" + therapy.id}>{therapy.description}</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page={"services"} section={therapy.id} id={"services-after-chip-label" + "-" + therapy.id}><p className="chip-label"><SiteCopy scope={"services"} id={"services-chip-label" + "-" + therapy.id}>At a glance</SiteCopy></p></BuilderAnchor>
          <Chips items={therapy.highlights} group={therapy.id} />
          {href.startsWith("/") ? (
            <Link className="btn service-btn" href={href} aria-label={`Read more about ${therapy.title}`}><SiteCopy scope={"services"} id={"services-btn" + "-" + therapy.id}>
              Read More </SiteCopy><span className="arrow" aria-hidden="true">→</span>
            </Link>
          ) : (
            <a className="btn service-btn" href={href} aria-label={`Read more about ${therapy.title}`}><SiteCopy scope={"services"} id={"services-btn-2" + "-" + therapy.id}>
              Read More </SiteCopy><span className="arrow" aria-hidden="true">→</span>
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
      <BuilderMain page={"services"} id="main-content">
        <NativeSection id="hero" label="Services hero"><section className="page-hero page-hero--photo services-overview-hero" aria-labelledby="services-title">
          <picture className="page-hero-photo" aria-hidden="true">
            {!hasEditorImage("services", "hero") && <source media="(max-width: 600px)" srcSet={`${imageBase}/hero-botanical-mobile.webp`} />}
            <img data-editor-image="hero" {...editorImage("services", "hero", { src: `${imageBase}/hero-botanical.webp`, width: 1365, height: 540, alt: "" })} fetchPriority="high" />
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
                  <li><Link href="/"><SiteCopy scope={"services"} id={"services-link"}>Home</SiteCopy></Link></li>
                  <li aria-current="page"><SiteCopy scope={"services"} id={"services-li"}>Services</SiteCopy></li>
                </ol>
              </nav>
              <h1 id="services-title" className="rise d1" data-editor-field="hero-title">{editorValue("services", "hero-title", "Services")}</h1>
              <div className="gold-rule rise d2" aria-hidden="true" />
              <p className="rise d3" data-editor-field="hero-description"><FieldText page={"services"} id={"hero-description"}>{editorValue("services", "hero-description", "Traditional Chinese medicine modalities for optimal health, inner peace, and an overall good quality of life.")}</FieldText></p>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="statement" label="Our approach to treatment"><section className="statement" aria-label="Our approach to treatment">
          <div className="container statement-inner service-reveal">
            <Ornament />
            <p data-editor-field="secondary-copy"><FieldText page={"services"} id={"secondary-copy"}>{editorValue("services", "secondary-copy", "Our wellness center offers holistic treatment plans specifically tailored to your needs, balancing the emotional health, physical well-being, and lifestyle of each person.")}</FieldText></p>
            <nav aria-labelledby="jump-label">
              <BuilderAnchor page={"services"} section={"statement"} id={"services-after-jump-label"}><p id="jump-label" className="jump-label"><SiteCopy scope={"services"} id={"services-jump-label"}>Jump to a service</SiteCopy></p></BuilderAnchor>
              <ul className="chips chips--center">
                {therapies.map((therapy) => <li key={therapy.id}><a className="chip" href={`#${therapy.id}`}><SiteCopy scope={"services"} id={"services-jump-" + therapy.id}>{therapy.label}</SiteCopy></a></li>)}
              </ul>
            </nav>
          </div>
        </section></NativeSection>

        {therapies.map((therapy, index) => <NativeSection key={therapy.id} id={therapy.id} label={therapy.title}><Therapy therapy={therapy} reverse={index % 2 === 1} /></NativeSection>)}

        <NativeSection id="sessions" label="Weekly Group Sessions"><section className="sessions-wrap" aria-labelledby="sessions-title">
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg><SiteCopy scope={"services"} id={"services-session-badge"}>
                  Mondays · 9:30 am
                </SiteCopy></span>
                <h2 id="sessions-title" data-editor-field="session-heading"><FieldText page={"services"} id={"session-heading"}>{editorValue("services", "session-heading", "Weekly Group Sessions")}</FieldText></h2>
                <div className="gold-rule" aria-hidden="true" />
                <p data-editor-field="session-copy"><FieldText page={"services"} id={"session-copy"}>{editorValue("services", "session-copy", "Start the week with affordable group sessions in Qigong, breathing, meditation, and relaxation. The sessions take place at our New City wellness center and focus on gentle movement, posture, and relaxation. Call the center for details before attending.")}</FieldText></p>
                <Chips items={sessionActivities} group="sessions" />
              </div>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="cta-title">
          <div className="container cta-inner service-reveal">
            <span className="eyebrow"><SiteCopy scope={"services"} id={"services-eyebrow-2"}>Get In Touch</SiteCopy></span>
            <h2 id="cta-title" data-editor-field="closing-heading"><FieldText page={"services"} id={"closing-heading"}>{editorValue("services", "closing-heading", "Let’s Talk About Your First Visit")}</FieldText></h2>
            <p data-editor-field="closing-copy"><FieldText page={"services"} id={"closing-copy"}>{editorValue("services", "closing-copy", "Have questions about a service or what to expect? Call the center or book a visit online.")}</FieldText></p>
            <div className="cta-actions">
              <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer"><SiteCopy scope={"services"} id={"services-btn-3"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428"><SiteCopy scope={"services"} id={"services-cta-phone"}>845-579-2428</SiteCopy></a>
            </div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={"services"} />
      </BuilderMain>
      <SiteFooter />
    </div>
  )
}
