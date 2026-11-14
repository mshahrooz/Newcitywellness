import type { Metadata } from "next"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Gua-Sha in New City, NY | New City Wellness",
  description: "Learn how Gua-Sha is performed at New City Acupuncture & Wellness Center, why it may leave temporary marks, and what to expect at your visit.",
}

const visitSteps = [
  { title: "Talk about your goals", copy: "Tell your practitioner where you feel tight or sore. Mention any skin irritation, bleeding conditions, or blood-thinning medications so they can decide whether Gua-Sha is appropriate." },
  { title: "Set a comfortable pressure", copy: "Your practitioner uses a smooth-edged tool to make repeated strokes across the skin. Let them know if the pressure is uncomfortable so they can adjust it." },
  { title: "Know what to expect afterward", copy: "You may see small pink, red, or purple marks where the tool was used. They usually fade over a few days. Ask your practitioner what to expect before you leave." },
]

const questions = [
  { title: "Does Gua-Sha hurt?", copy: "You may feel pressure or some tenderness, but the treatment should not be painful. Speak up if a stroke feels uncomfortable." },
  { title: "Why can Gua-Sha leave marks?", copy: "Pressure can cause tiny blood vessels just beneath the skin to leak, leaving small spots called petechiae or bruise-like marks. These are temporary and generally fade within a few days." },
  { title: "When should I check with the clinic first?", copy: "Call before booking if you take blood thinners, bruise or bleed easily, or have broken or irritated skin where you want treatment. Your practitioner can discuss whether Gua-Sha is appropriate for you." },
]

export default function GuaShaPage() {
  return (
    <ServiceDetailPage
      id="gua-sha"
      title="Gua-Sha"
      shortTitle="Gua-Sha"
      description="A traditional Chinese medicine technique that uses a smooth-edged tool to apply pressure across the skin."
      heroPhoto="gua-sha/hero-jade-roller.webp"
      photo={{ path: "gua-sha/treatment", height: 650, alt: "Practitioner using a smooth-edged Gua-Sha tool on a patient’s upper back" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Curious about Gua-Sha? Call the center to ask whether it’s right for you, or book your visit online."
      intro={
        <>
          <p>Gua-Sha is a hands-on practice in traditional Chinese medicine. A practitioner moves a smooth tool, sometimes shaped like a spoon, across the skin in short strokes. The clinic offers it as an option for people with muscle tightness or soreness.</p>
          <p>The strokes can leave tiny spots called petechiae. The marks range from pink or red to purple and typically fade over a few days. Your practitioner can explain where marks might appear and adjust the pressure during the session.</p>
        </>
      }
    />
  )
}
