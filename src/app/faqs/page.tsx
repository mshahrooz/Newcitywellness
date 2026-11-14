import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { FaqAccordion } from "./faq-accordion"
import { faqPhotos } from "./faq-photos"
import { QuestionForm } from "./question-form"
import "../wellness.css"
import "../services/services.css"
import "./faqs.css"

export const metadata: Metadata = {
  title: "Acupuncture FAQs in New City, NY | New City Wellness",
  description: "Find answers about your first acupuncture visit, what the needles feel like, safety, appointment length, and how your care plan is made.",
}

const questions = [
  {
    id: "what-is-acupuncture",
    title: "What is acupuncture?",
    answer: <><p>Acupuncture is a practice from traditional Chinese medicine in which a practitioner inserts very fine needles at specific points on the body. In traditional Chinese medicine, these points are described in relation to pathways called meridians and the flow of <em>qi</em>.</p><p><Link href="/services/acupuncture/">Explore our acupuncture service</Link> for more about how it’s practiced at the clinic.</p></>,
  },
  {
    id: "first-session",
    title: "What can I expect at my first session?",
    answer: <><p>Your practitioner will ask about your symptoms, health and family history, daily routine, and diet. The assessment may include feeling your pulse and looking at your tongue, two methods used in traditional Chinese medicine.</p><p>You’ll discuss your goals and a care plan tailored to your needs. It’s a good time to bring up any concerns or ask what your first treatment will involve.</p><p className="faq-chip-label">Traditional assessment methods</p><ul className="chips">{["Inquiry", "Observation", "Listening", "Palpation"].map((method) => <li className="chip" key={method}>{method}</li>)}</ul></>,
  },
  {
    id: "does-it-hurt",
    title: "Does acupuncture hurt?",
    answer: <p>Acupuncture needles are much thinner than the needles used for injections. Some people feel a brief pinch, tingling, warmth, or a dull ache, while others feel very little. Tell your practitioner if a needle feels uncomfortable so they can adjust it.</p>,
  },
  {
    id: "safety",
    title: "Is acupuncture safe?",
    answer: <><p>Acupuncture is generally considered safe when a qualified practitioner uses sterile, single-use needles. Mild soreness, minor bleeding, or bruising can occur. Serious complications are uncommon, but possible, particularly if treatment is performed improperly.</p><p>Tell your practitioner about your medications and health history before treatment. <a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">Read the NIH guide to acupuncture safety</a>.</p></>,
  },
  {
    id: "what-it-may-help",
    title: "What can acupuncture help me with?",
    answer: <><p>Research suggests acupuncture may help with some kinds of pain. The evidence varies by condition and includes studies on:</p><ul className="faq-check-list"><li>Chronic low-back pain</li><li>Neck pain</li><li>Knee osteoarthritis pain</li><li>Some types of headaches</li></ul><p><a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">See what the research says</a> or <a href="tel:+18455792428">ask the clinic how acupuncture might fit alongside your current care</a>.</p><Link className="btn btn-outline faq-answer-button" href="/conditions-treated/">Discover More <span className="arrow" aria-hidden="true">→</span></Link></>,
  },
  {
    id: "number-of-treatments",
    title: "How many treatments do I need?",
    answer: <><p>There’s no set number. Your plan depends on your goals, how long you’ve had your symptoms, and how you respond.</p><dl className="faq-facts"><div><dt>Typical frequency</dt><dd>Once or twice a week</dd></div><div><dt>Session length</dt><dd>45 to 60 minutes</dd></div><div><dt>Number of visits</dt><dd>Depends on your response</dd></div></dl><p>Ask your practitioner when you’ll review progress together and whether the plan should change.</p><a className="btn btn-gold faq-answer-button" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer">Book Now <span className="arrow" aria-hidden="true">→</span></a></>,
  },
]

export default function FaqsPage() {
  const heroImage = `${process.env.BASE_PATH || ""}/images/faqs/hero-herbal-medicine.webp`
  return (
    <div className="ncw ncw-services ncw-faqs">
      <SiteHeader current="faqs" />
      <main id="main-content">
        <section className="page-hero page-hero--photo" aria-labelledby="faq-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img data-editor-image="hero" {...editorImage("faqs", "hero", { src: heroImage, width: 1200, height: 800, alt: "" })} fetchPriority="high" />
          </div>
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65ZM42 59C30 45 29 25 42 7C55 25 54 45 42 59ZM8 43C18 55 29 63 42 68C55 63 66 55 76 43" />
          </svg>
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">FAQs</li></ol>
              </nav>
              <h1 id="faq-title" data-editor-field="hero-title">{editorValue("faqs", "hero-title", "FAQs")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description">{editorValue("faqs", "hero-description", "Answers to common questions about acupuncture, from your first session to how many treatments you may need.")}</p>
            </div>
          </div>
        </section>

        <FaqAccordion questions={questions} photos={faqPhotos} />

        <section className="faq-ask" id="ask-us" aria-labelledby="ask-title">
          <div className="container faq-ask-grid">
            <div className="copy">
              <span className="eyebrow">Ask Us</span>
              <h2 className="section-title" id="ask-title">Do You Have a Question?</h2>
              <div className="gold-rule" aria-hidden="true" />
              <p>Use the form to draft an email, or reach the clinic directly.</p>
              <dl className="faq-contact-list">
                <div><dt>Call</dt><dd><a href="tel:+18455792428">845-579-2428</a></dd></div>
                <div><dt>Email</dt><dd><a href="mailto:newcitywellness@gmail.com">newcitywellness@gmail.com</a></dd></div>
                <div><dt>Visit</dt><dd><a href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener noreferrer">125 South Main Street, New City, NY 10956</a></dd></div>
                <div><dt>Hours</dt><dd>Sunday–Thursday: 9:00 am – 9:00 pm<br />Friday: 9:00 am – 2:00 pm<br />Saturday: Closed</dd></div>
              </dl>
            </div>
            <QuestionForm />
          </div>
        </section>

        <section className="cta-band" aria-labelledby="faq-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="faq-contact-title" data-editor-field="closing-heading">{editorValue("faqs", "closing-heading", "Still have a question?")}</h2>
            <p data-editor-field="closing-copy">{editorValue("faqs", "closing-copy", "Call the clinic before your visit, or book online when you’re ready.")}</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428">845-579-2428</a>
            </div>
          </div>
        </section>
        <EditorBlocks page={"faqs"} />
      </main>
      <SiteFooter />
    </div>
  )
}
