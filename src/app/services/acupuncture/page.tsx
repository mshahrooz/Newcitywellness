import { BuilderAnchor, SiteCopy } from "../../builder-page"
import type { Metadata } from "next"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Acupuncture in New City, NY | New City Acupuncture & Wellness Center",
  description: "Learn about acupuncture with Mordechai Genut, MS, L.Ac., in New City, NY. Find out what to expect at your first visit and book an appointment.",
}

const visitSteps = [
  { title: "Talk through your concerns", copy: "Your practitioner asks about your symptoms, health history, and what you hope to get from your visit. This is a good time to mention any concerns about needles." },
  { title: "Begin your treatment", copy: "Based on that conversation, your practitioner selects acupuncture points and places fine, sterile, single-use needles. You can let them know how you’re feeling throughout the session." },
  { title: "Rest and discuss next steps", copy: "You’ll have time to rest while the needles are in place. Afterward, you and your practitioner can discuss how the visit felt and whether follow-up makes sense." },
]

const questions = [
  { title: "What does acupuncture feel like?", copy: "The needles are much thinner than those used for injections. Some people feel a brief pinch, pressure, or a dull ache, while others notice very little. Let your practitioner know if anything feels uncomfortable." },
  { title: "What should I share before my first visit?", copy: "Tell your practitioner about your medical history, medications, and any treatments you’re currently receiving. Mention if you’re pregnant or take medication that affects bleeding." },
  { title: "How many visits will I need?", copy: "There isn’t a set number of visits for everyone. Your practitioner can suggest a plan based on your goals, your health history, and how you respond to treatment." },
]

export default function AcupuncturePage() {
  return (
    <ServiceDetailPage
      id="acupuncture"
      title="Acupuncture"
      shortTitle="Acupuncture"
      description="Personalized acupuncture in New City, NY, with Mordechai Genut, MS, L.Ac."
      heroPhoto={{ path: "acupuncture/hero-electro-needling.webp", width: 1600, height: 1000 }}
      photo={{ path: "acupuncture/treatment", height: 667, alt: "Fine acupuncture needles being placed along a patient’s upper back" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Have a question about acupuncture? Call the center or book your visit online."
      intro={
        <>
          <BuilderAnchor page="acupuncture" section="practice" id="intro-after-1"><p><SiteCopy scope="acupuncture" id="intro-copy-1">Acupuncture has been part of traditional Chinese medicine for more than 2,000 years. Early descriptions appear in the <em>Huang Di Nei Jing</em>, also known as the <em>Yellow Emperor’s Classic of Internal Medicine</em>. Today, acupuncture is practiced around the world.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="acupuncture" section="practice" id="intro-after-2"><p><SiteCopy scope="acupuncture" id="intro-copy-2">In the traditional framework, <em>qi</em> (pronounced “chee”) is often described as vital energy. It is understood to move through pathways called meridians. Traditional Chinese medicine describes 12 primary meridians, with specific points along them that practitioners select based on the individual.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="acupuncture" section="practice" id="intro-after-3"><p><SiteCopy scope="acupuncture" id="intro-copy-3">Modern researchers study acupuncture from a different perspective, including how it affects the nervous system and pain signaling. Evidence varies by condition. </SiteCopy><a href="https://www.nccih.nih.gov/health/acupuncture-effectiveness-and-safety"><SiteCopy scope="acupuncture" id="intro-copy-4">Read the NIH overview of acupuncture.</SiteCopy></a></p></BuilderAnchor>
        </>
      }
    />
  )
}
