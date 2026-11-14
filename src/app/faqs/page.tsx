import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
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
    answer: <><p><SiteCopy scope={"faqs"} id={"faqs-p"}>Acupuncture is a practice from traditional Chinese medicine in which a practitioner inserts very fine needles at specific points on the body. In traditional Chinese medicine, these points are described in relation to pathways called meridians and the flow of <em>qi</em>.</SiteCopy></p><p><Link href="/services/acupuncture/"><SiteCopy scope={"faqs"} id={"faqs-link"}>Explore our acupuncture service</SiteCopy></Link><SiteCopy scope={"faqs"} id={"faqs-p-2"}> for more about how it’s practiced at the clinic.</SiteCopy></p></>,
  },
  {
    id: "first-session",
    title: "What can I expect at my first session?",
    answer: <><p><SiteCopy scope={"faqs"} id={"faqs-p-3"}>Your practitioner will ask about your symptoms, health and family history, daily routine, and diet. The assessment may include feeling your pulse and looking at your tongue, two methods used in traditional Chinese medicine.</SiteCopy></p><p><SiteCopy scope={"faqs"} id={"faqs-p-4"}>You’ll discuss your goals and a care plan tailored to your needs. It’s a good time to bring up any concerns or ask what your first treatment will involve.</SiteCopy></p><p className="faq-chip-label"><SiteCopy scope={"faqs"} id={"faqs-faq-chip-label"}>Traditional assessment methods</SiteCopy></p><ul className="chips">{["Inquiry", "Observation", "Listening", "Palpation"].map((method) => <li className="chip" key={method}><SiteCopy scope={"faqs"} id={"faqs-method-" + method.toLowerCase()}>{method}</SiteCopy></li>)}</ul></>,
  },
  {
    id: "does-it-hurt",
    title: "Does acupuncture hurt?",
    answer: <p><SiteCopy scope={"faqs"} id={"faqs-p-5"}>Acupuncture needles are much thinner than the needles used for injections. Some people feel a brief pinch, tingling, warmth, or a dull ache, while others feel very little. Tell your practitioner if a needle feels uncomfortable so they can adjust it.</SiteCopy></p>,
  },
  {
    id: "safety",
    title: "Is acupuncture safe?",
    answer: <><p><SiteCopy scope={"faqs"} id={"faqs-p-6"}>Acupuncture is generally considered safe when a qualified practitioner uses sterile, single-use needles. Mild soreness, minor bleeding, or bruising can occur. Serious complications are uncommon, but possible, particularly if treatment is performed improperly.</SiteCopy></p><p><SiteCopy scope={"faqs"} id={"faqs-p-7"}>Tell your practitioner about your medications and health history before treatment. </SiteCopy><a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety"><SiteCopy scope={"faqs"} id={"faqs-a"}>Read the NIH guide to acupuncture safety</SiteCopy></a><SiteCopy scope={"faqs"} id={"faqs-p-8"}>.</SiteCopy></p></>,
  },
  {
    id: "what-it-may-help",
    title: "What can acupuncture help me with?",
    answer: <><p><SiteCopy scope={"faqs"} id={"faqs-p-9"}>Research suggests acupuncture may help with some kinds of pain. The evidence varies by condition and includes studies on:</SiteCopy></p><ul className="faq-check-list"><li><SiteCopy scope={"faqs"} id={"faqs-li"}>Chronic low-back pain</SiteCopy></li><li><SiteCopy scope={"faqs"} id={"faqs-li-2"}>Neck pain</SiteCopy></li><li><SiteCopy scope={"faqs"} id={"faqs-li-3"}>Knee osteoarthritis pain</SiteCopy></li><li><SiteCopy scope={"faqs"} id={"faqs-li-4"}>Some types of headaches</SiteCopy></li></ul><p><a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety"><SiteCopy scope={"faqs"} id={"faqs-a-2"}>See what the research says</SiteCopy></a><SiteCopy scope={"faqs"} id={"faqs-p-10"}> or </SiteCopy><a href="tel:+18455792428"><SiteCopy scope={"faqs"} id={"faqs-a-3"}>ask the clinic how acupuncture might fit alongside your current care</SiteCopy></a><SiteCopy scope={"faqs"} id={"faqs-p-11"}>.</SiteCopy></p><Link className="btn btn-outline faq-answer-button" href="/conditions-treated/"><SiteCopy scope={"faqs"} id={"faqs-btn"}>Discover More </SiteCopy><span className="arrow" aria-hidden="true">→</span></Link></>,
  },
  {
    id: "number-of-treatments",
    title: "How many treatments do I need?",
    answer: <><p><SiteCopy scope={"faqs"} id={"faqs-p-12"}>There’s no set number. Your plan depends on your goals, how long you’ve had your symptoms, and how you respond.</SiteCopy></p><dl className="faq-facts"><div><dt><SiteCopy scope={"faqs"} id={"faqs-dt"}>Typical frequency</SiteCopy></dt><dd><SiteCopy scope={"faqs"} id={"faqs-dd"}>Once or twice a week</SiteCopy></dd></div><div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-2"}>Session length</SiteCopy></dt><dd><SiteCopy scope={"faqs"} id={"faqs-dd-2"}>45 to 60 minutes</SiteCopy></dd></div><div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-3"}>Number of visits</SiteCopy></dt><dd><SiteCopy scope={"faqs"} id={"faqs-dd-3"}>Depends on your response</SiteCopy></dd></div></dl><p><SiteCopy scope={"faqs"} id={"faqs-p-13"}>Ask your practitioner when you’ll review progress together and whether the plan should change.</SiteCopy></p><a className="btn btn-gold faq-answer-button" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer"><SiteCopy scope={"faqs"} id={"faqs-btn-2"}>Book Now </SiteCopy><span className="arrow" aria-hidden="true">→</span></a></>,
  },
]

export default function FaqsPage() {
  const heroImage = `${process.env.BASE_PATH || ""}/images/faqs/hero-herbal-medicine.webp`
  return (
    <div className="ncw ncw-services ncw-faqs">
      <SiteHeader current="faqs" />
      <BuilderMain page={"faqs"} id="main-content">
        <NativeSection id="hero" label="FAQs hero"><section className="page-hero page-hero--photo" aria-labelledby="faq-title">
          <div className="page-hero-photo" aria-hidden="true">
            <img data-editor-image="hero" {...editorImage("faqs", "hero", { src: heroImage, width: 1200, height: 800, alt: "" })} fetchPriority="high" />
          </div>
          <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" stroke="currentColor" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M42 68C41 48 41 25 42 7M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65ZM42 59C30 45 29 25 42 7C55 25 54 45 42 59ZM8 43C18 55 29 63 42 68C55 63 66 55 76 43" />
          </svg>
          <div className="container">
            <div className="page-hero-copy">
              <nav aria-label="Breadcrumb">
                <ol className="crumbs"><li><Link href="/"><SiteCopy scope={"faqs"} id={"faqs-link-2"}>Home</SiteCopy></Link></li><li aria-current="page"><SiteCopy scope={"faqs"} id={"faqs-li-5"}>FAQs</SiteCopy></li></ol>
              </nav>
              <h1 id="faq-title" data-editor-field="hero-title">{editorValue("faqs", "hero-title", "FAQs")}</h1>
              <div className="gold-rule" aria-hidden="true" />
              <p data-editor-field="hero-description"><FieldText page={"faqs"} id={"hero-description"}>{editorValue("faqs", "hero-description", "Answers to common questions about acupuncture, from your first session to how many treatments you may need.")}</FieldText></p>
            </div>
          </div>
        </section></NativeSection>

        <NativeSection id="questions" label="Frequently asked questions"><FaqAccordion questions={questions} photos={faqPhotos} /></NativeSection>

        <NativeSection id="ask" label="Ask us"><section className="faq-ask" id="ask-us" aria-labelledby="ask-title">
          <div className="container faq-ask-grid">
            <div className="copy">
              <span className="eyebrow"><SiteCopy scope={"faqs"} id={"faqs-eyebrow"}>Ask Us</SiteCopy></span>
              <BuilderAnchor page={"faqs"} section={"ask"} id={"faqs-after-ask-title"}><h2 className="section-title" id="ask-title"><SiteCopy scope={"faqs"} id={"faqs-ask-title"}>Do You Have a Question?</SiteCopy></h2></BuilderAnchor>
              <div className="gold-rule" aria-hidden="true" />
              <BuilderAnchor page={"faqs"} section={"ask"} id={"faqs-after-p"}><p><SiteCopy scope={"faqs"} id={"faqs-p-14"}>Use the form to draft an email, or reach the clinic directly.</SiteCopy></p></BuilderAnchor>
              <dl className="faq-contact-list">
                <div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-4"}>Call</SiteCopy></dt><dd><a href="tel:+18455792428"><SiteCopy scope={"faqs"} id={"faqs-a-4"}>845-579-2428</SiteCopy></a></dd></div>
                <div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-5"}>Email</SiteCopy></dt><dd><a href="mailto:newcitywellness@gmail.com"><SiteCopy scope={"faqs"} id={"faqs-a-5"}>newcitywellness@gmail.com</SiteCopy></a></dd></div>
                <div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-6"}>Visit</SiteCopy></dt><dd><a href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener noreferrer"><SiteCopy scope={"faqs"} id={"faqs-a-6"}>125 South Main Street, New City, NY 10956</SiteCopy></a></dd></div>
                <div><dt><SiteCopy scope={"faqs"} id={"faqs-dt-7"}>Hours</SiteCopy></dt><dd><SiteCopy scope={"faqs"} id={"faqs-dd-4"}>Sunday–Thursday: 9:00 am – 9:00 pm<br />Friday: 9:00 am – 2:00 pm<br />Saturday: Closed</SiteCopy></dd></div>
              </dl>
            </div>
            <QuestionForm />
          </div>
        </section></NativeSection>

        <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="faq-contact-title">
          <div className="container cta-inner">
            <span className="eyebrow"><SiteCopy scope={"faqs"} id={"faqs-eyebrow-2"}>Get In Touch</SiteCopy></span>
            <h2 id="faq-contact-title" data-editor-field="closing-heading"><FieldText page={"faqs"} id={"closing-heading"}>{editorValue("faqs", "closing-heading", "Still have a question?")}</FieldText></h2>
            <p data-editor-field="closing-copy"><FieldText page={"faqs"} id={"closing-copy"}>{editorValue("faqs", "closing-copy", "Call the clinic before your visit, or book online when you’re ready.")}</FieldText></p>
            <div className="cta-actions">
              <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer"><SiteCopy scope={"faqs"} id={"faqs-btn-3"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
              <a className="cta-phone" href="tel:+18455792428"><SiteCopy scope={"faqs"} id={"faqs-cta-phone"}>845-579-2428</SiteCopy></a>
            </div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={"faqs"} />
      </BuilderMain>
      <SiteFooter />
    </div>
  )
}
