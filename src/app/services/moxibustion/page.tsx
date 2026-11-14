import { BuilderAnchor, SiteCopy } from "../../builder-page"
import type { Metadata } from "next"
import Link from "next/link"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Moxibustion in New City, NY | New City Acupuncture & Wellness Center",
  description: "Learn how moxibustion uses warmth from dried mugwort, what to expect at a visit, and how to book at New City Acupuncture & Wellness Center.",
}

const visitSteps = [
  { title: "Talk through your concerns", copy: "Tell your practitioner what brings you in. Mention if you’re sensitive to heat or smoke, or if you have reduced sensation in an area." },
  { title: "Feel the warmth", copy: "Your practitioner may hold a smoldering moxa stick near selected points. Let them know immediately if the heat feels too strong or uncomfortable." },
  { title: "Check in afterward", copy: "Tell your practitioner how the treatment felt. Ask what to watch for afterward and whether moxibustion or another approach makes sense for a future visit." },
]

const questions = [
  { title: "What does moxibustion feel like?", copy: "Indirect moxibustion is intended to feel warm, not painfully hot. Because it uses heat, burns are possible. Speak up immediately if you feel stinging, burning, or discomfort." },
  { title: "Does moxibustion produce smoke or an odor?", copy: "Burning mugwort can produce smoke and a noticeable herbal smell. Tell the clinic before your visit if you have asthma or are sensitive to smoke or strong scents." },
  { title: "Is moxibustion the same as acupuncture?", copy: "No. Moxibustion uses warmth, while acupuncture uses fine needles. The two techniques can be used together, but moxibustion can also be performed without needles." },
]

export default function MoxibustionPage() {
  return (
    <ServiceDetailPage
      id="moxibustion"
      title="Moxibustion"
      shortTitle="Moxibustion"
      description="A traditional warming therapy in New City, NY. Learn how moxa is used and what to expect during a visit."
      heroPhoto={{ path: "moxibustion/hero-moxa-stick.webp", width: 1500, height: 358 }}
      photo={{ path: "moxibustion/treatment", height: 667, alt: "A practitioner holding a moxa stick near a patient during moxibustion" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Have a question about moxibustion? Call the center or book your visit online."
      intro={
        <>
          <BuilderAnchor page="moxibustion" section="practice" id="intro-after-1"><p><SiteCopy scope="moxibustion" id="intro-copy-1">Moxibustion is a traditional Chinese medicine technique that uses heat from dried mugwort, called <em>moxa</em>, to warm selected points on the body. In traditional Chinese medicine, that warmth is understood in terms of <em>qi</em> and the pathways known as meridians.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="moxibustion" section="practice" id="intro-after-2"><p><SiteCopy scope="moxibustion" id="intro-copy-2">In an indirect treatment, the practitioner holds a smoldering moxa stick close to the skin without touching it. Some techniques combine moxa with </SiteCopy><Link href="/services/acupuncture/"><SiteCopy scope="moxibustion" id="intro-acupuncture-link">acupuncture</SiteCopy></Link><SiteCopy scope="moxibustion" id="intro-copy-3"> by warming a needle. The practitioner can explain which technique they plan to use.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="moxibustion" section="practice" id="intro-after-3"><p><SiteCopy scope="moxibustion" id="intro-copy-4">People may ask about moxibustion for muscle or joint discomfort, and some find the warmth relaxing. Evidence varies by condition, and the treatment isn’t appropriate for everyone. </SiteCopy><a href="https://health.clevelandclinic.org/moxibustion"><SiteCopy scope="moxibustion" id="intro-copy-5">Read Cleveland Clinic’s overview of moxibustion.</SiteCopy></a></p></BuilderAnchor>
        </>
      }
    />
  )
}
