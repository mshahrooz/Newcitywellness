import { BuilderAnchor, SiteCopy } from "../../builder-page"
import type { Metadata } from "next"
import Link from "next/link"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Chinese Herbal Medicine in New City, NY | New City Wellness",
  description: "Learn how Chinese herbal formulas are selected at New City Acupuncture & Wellness Center, what forms they come in, and what to discuss at your first visit.",
}

const visitSteps = [
  { title: "Review what you already take", copy: "Bring a list of your prescriptions, over-the-counter medicines, supplements, and any herbs you use. Share relevant health conditions and allergies." },
  { title: "Discuss a formula", copy: "Your practitioner can explain whether an herbal formula is appropriate, what it contains, and why they’re considering it. Ask what to expect and whether there are interactions to review with your doctor or pharmacist." },
  { title: "Plan a follow-up", copy: "If you decide to try a formula, ask when to check in and what side effects to watch for. Let your healthcare team know about any new herbal products you use." },
]

const questions = [
  { title: "Does everyone get the same herbal formula?", copy: "No. The clinic describes an individualized approach, so the choice of ingredients and preparation may differ from person to person." },
  { title: "Can herbs interact with my medication?", copy: "Yes. Herbal products can interact with prescription and over-the-counter medicines. Ask your doctor or pharmacist to review the specific ingredients before starting a formula, and don’t change prescribed medication on your own." },
  { title: "Can I discuss herbs at an acupuncture visit?", copy: "Yes. The clinic may discuss Chinese herbal medicine alongside acupuncture. Call ahead if you want to know how to book a visit that covers both." },
]

export default function ChineseHerbalMedicinePage() {
  return (
    <ServiceDetailPage
      id="chinese-herbal-medicine"
      title="Chinese Herbal Medicine"
      shortTitle="Chinese Herbal Medicine"
      description="An individualized approach to traditional herbal formulas in New City, NY."
      heroPhoto={{ path: "chinese-herbal-medicine/hero-herbal-tea.webp", width: 1320, height: 880 }}
      photo={{ path: "chinese-herbal-medicine/treatment", height: 750, alt: "Ginger, dried botanicals, and other ingredients arranged on a table" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Have a question about Chinese herbal medicine? Call the center or book your visit online."
      intro={
        <>
          <BuilderAnchor page="chinese-herbal-medicine" section="practice" id="intro-after-1"><p><SiteCopy scope="chinese-herbal-medicine" id="intro-copy-1">Chinese herbal medicine has been part of traditional Chinese medicine for more than 2,000 years. At New City Acupuncture &amp; Wellness Center, the practitioner considers your health history and goals when deciding whether to recommend a formula. Herbal medicine may also be discussed alongside </SiteCopy><Link href="/services/acupuncture/"><SiteCopy scope="chinese-herbal-medicine" id="intro-acupuncture-link">acupuncture</SiteCopy></Link><SiteCopy scope="chinese-herbal-medicine" id="intro-copy-2">.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="chinese-herbal-medicine" section="practice" id="intro-after-2"><p><SiteCopy scope="chinese-herbal-medicine" id="intro-copy-3">Formulas often combine several ingredients, primarily from plants. These can include roots, seeds, leaves, and bark. Depending on the formula, preparations may include dried ingredients, powders, capsules, tinctures, or products applied to the skin.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="chinese-herbal-medicine" section="practice" id="intro-after-3"><p><SiteCopy scope="chinese-herbal-medicine" id="intro-copy-4">Evidence varies by formula and condition. Herbal products can also interact with medicines, so it’s worth reviewing the ingredients with your doctor or pharmacist before you start. </SiteCopy><a href="https://www.nccih.nih.gov/health/traditional-chinese-medicine-what-you-need-to-know/"><SiteCopy scope="chinese-herbal-medicine" id="intro-copy-5">Read the NIH overview of traditional Chinese medicine.</SiteCopy></a></p></BuilderAnchor>
        </>
      }
    />
  )
}
