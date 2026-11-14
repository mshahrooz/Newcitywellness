import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
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
    answer: <><p>Your practitioner will ask about your symptoms, health and family history, daily routine, and diet. The assessment may include feeling your pulse and looking at your tongue, two methods used in traditional Chinese medicine.</p><p>You’ll discuss your goals and a care plan tailored to your needs. It’s a good time to bring up any concerns or ask what your first treatment will involve.</p></>,
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
    answer: <><p>Research suggests acupuncture may help with some types of pain, including chronic low-back or neck pain and knee osteoarthritis. It may also help reduce the frequency of some headaches. Evidence varies by condition, so ask whether acupuncture is appropriate for your goals and how it might fit alongside your current care.</p><p><a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety">See what the research says</a> or <a href="tel:+18455792428">ask the clinic about your situation</a>.</p></>,
  },
  {
    id: "number-of-treatments",
    title: "How many treatments do I need?",
    answer: <><p>There’s no set number. Your plan depends on your goals, how long you’ve had your symptoms, and how you respond. The clinic describes typical sessions as 45 to 60 minutes, with some plans starting at one or two visits per week.</p><p>Ask your practitioner when you’ll review progress together and whether the plan should change.</p></>,
  },
]

export default function FaqsPage() {
  const image = `${process.env.BASE_PATH || ""}/images/faqs/acupuncture`
  return (
    <div className="ncw ncw-services ncw-faqs">
      <SiteHeader current="faqs" />
      <main id="main-content">
        <section className="page-hero" aria-labelledby="faq-title">
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65ZM42 59C30 45 29 25 42 7C55 25 54 45 42 59ZM8 43C18 55 29 63 42 68C55 63 66 55 76 43" />
          </svg>
          <div className="container page-hero-copy">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">FAQs</li></ol>
            </nav>
            <h1 id="faq-title">Frequently Asked Questions</h1>
            <div className="gold-rule" aria-hidden="true" />
            <p>What acupuncture feels like, what happens at your first visit, and how we plan your care.</p>
          </div>
        </section>

        <section className="block block--paper faq-body" id="questions" aria-labelledby="questions-title">
          <div className="container faq-grid">
            <div>
              <span className="eyebrow">Before Your Visit</span>
              <h2 className="section-title" id="questions-title">Your acupuncture questions, answered</h2>
              <div className="gold-rule" aria-hidden="true" />
              <div className="faq-accordion">
                {questions.map((question, index) => (
                  <details key={question.id} id={question.id} open={question.id === "first-session" ? true : undefined}>
                    <summary><span className="faq-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{question.title}</span><span className="faq-toggle-icon" aria-hidden="true" /></summary>
                    <div className="faq-answer">{question.answer}</div>
                  </details>
                ))}
              </div>
            </div>
            <aside className="faq-aside" aria-labelledby="faq-visit-title">
              <figure className="frame frame--right faq-photo">
                <img src={`${image}-800.webp`} srcSet={`${image}-480.webp 480w, ${image}-800.webp 800w`} sizes="(max-width: 760px) calc(100vw - 40px), 32vw" width={800} height={532} loading="lazy" decoding="async" alt="Patient receiving facial acupuncture during a treatment session" />
              </figure>
              <div className="faq-visit">
                <span className="eyebrow">New City, NY</span>
                <h2 id="faq-visit-title">Planning your first visit?</h2>
                <p>Get to know your practitioner and explore the therapies available at the clinic.</p>
                <Link href="/about-us/">Meet your practitioner <span aria-hidden="true">→</span></Link>
                <Link href="/services/">Explore all services <span aria-hidden="true">→</span></Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="cta-band" aria-labelledby="faq-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow">Get In Touch</span>
            <h2 id="faq-contact-title">Still have a question?</h2>
            <p>Call the clinic before your visit, or book online when you’re ready.</p>
            <div className="cta-actions">
              <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer">Book Appointment <span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428">845-579-2428</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
