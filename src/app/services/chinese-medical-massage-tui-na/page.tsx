import { BuilderAnchor, SiteCopy } from "../../builder-page"
import type { Metadata } from "next"
import Link from "next/link"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Chinese Medical Massage (Tui-Na) in New City, NY | New City Wellness",
  description: "Learn about Tui-Na Chinese medical massage at New City Acupuncture & Wellness Center, including its hands-on techniques and what to expect at your first visit.",
}

const visitSteps = [
  { title: "Talk through your concerns", copy: "Tell your practitioner what brings you in, where you feel tension or discomfort, and whether you have any injuries or areas you’d prefer them to avoid." },
  { title: "Begin your massage", copy: "Your practitioner may use rolling, pressing, kneading, or other rhythmic movements. Pressure can range from gentle to firm, and you can ask for it to be adjusted at any time." },
  { title: "Check in after treatment", copy: "Tell your practitioner how you feel afterward. Together you can discuss whether another massage session or a different approach makes sense for you." },
]

const questions = [
  { title: "How is Tui-Na different from a relaxation massage?", copy: "Tui-Na uses targeted, rhythmic techniques drawn from traditional Chinese medicine. The practitioner may focus on particular muscle groups or points rather than following a full-body routine." },
  { title: "Can Tui-Na be combined with acupuncture?", copy: "Yes, the clinic may include Tui-Na alongside acupuncture. The massage itself uses hands-on techniques rather than needles. Ask the clinic whether a combined visit is appropriate for you." },
  { title: "What should I mention before my first visit?", copy: "Tell the clinic about recent injuries or surgery, pregnancy, relevant health conditions, and medications that affect bleeding. This helps the practitioner decide whether to modify or avoid certain techniques." },
]

export default function TuiNaPage() {
  return (
    <ServiceDetailPage
      id="chinese-medical-massage-tui-na"
      title="Chinese Medical Massage (Tui-Na)"
      shortTitle="Tui-Na"
      description="Traditional hands-on massage in New City, NY, with pressure and techniques tailored to your comfort."
      heroPhoto={{ path: "chinese-medical-massage-tui-na/hero-palm-massage.webp", width: 1500, height: 844 }}
      photo={{ path: "chinese-medical-massage-tui-na/treatment", height: 665, alt: "A practitioner’s hands positioned above a patient’s upper back" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Have a question about Tui-Na? Call the center or book your visit online."
      intro={
        <>
          <BuilderAnchor page="chinese-medical-massage-tui-na" section="practice" id="intro-after-1"><p><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-1">Tui-Na is a hands-on form of traditional Chinese medicine with roots in the Ming Dynasty. Its name means “pushing and grasping,” two of the movements that distinguish it from other styles of massage.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="chinese-medical-massage-tui-na" section="practice" id="intro-after-2"><p><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-2">A practitioner may roll, knead, press, or tap areas of the body, adjusting the pressure from gentle to firm. In the traditional framework, these movements work with acupuncture points and pathways called meridians, through which </SiteCopy><em>qi</em><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-3"> is understood to flow. The clinic may offer Tui-Na on its own or alongside </SiteCopy><Link href="/services/acupuncture/"><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-acupuncture-link">acupuncture</SiteCopy></Link><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-4">.</SiteCopy></p></BuilderAnchor>
          <BuilderAnchor page="chinese-medical-massage-tui-na" section="practice" id="intro-after-3"><p><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-5">People may ask about Tui-Na for muscle tension or discomfort in areas such as the neck, shoulders, or back. Tell your practitioner what you’re experiencing so they can discuss whether this type of massage suits your needs. </SiteCopy><a href="https://www.nccih.nih.gov/health/massage-therapy-what-you-need-to-know"><SiteCopy scope="chinese-medical-massage-tui-na" id="intro-copy-6">Read the NIH overview of massage therapy.</SiteCopy></a></p></BuilderAnchor>
        </>
      }
    />
  )
}
