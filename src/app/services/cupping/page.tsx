import type { Metadata } from "next"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Cupping in New City, NY | New City Acupuncture & Wellness Center",
  description: "Learn how cupping uses suction, what the temporary marks mean, and what to expect at your first visit to New City Acupuncture & Wellness Center.",
}

const visitSteps = [
  { title: "Talk through your concerns", copy: "Point out where you feel soreness or stiffness and tell your practitioner about any skin conditions or areas you’d prefer them to avoid." },
  { title: "Begin your treatment", copy: "Your practitioner places cups over selected areas. You may feel a steady pulling sensation. Let your practitioner know if the suction feels too strong or uncomfortable." },
  { title: "Check in afterward", copy: "After the cups come off, your practitioner can explain what to expect from any marks and answer questions about how the area feels." },
]

const questions = [
  { title: "What do the round marks mean?", copy: "Suction can leave temporary red or purple circles where the cups were placed. The color does not measure toxins or show how well the treatment worked." },
  { title: "What does cupping feel like?", copy: "People often describe a pulling or tight feeling where a cup is placed. The sensation varies. Tell your practitioner right away if it feels painful or too strong." },
  { title: "What should I mention before my first visit?", copy: "Tell the clinic about sensitive or irritated skin, eczema or psoriasis, and medications that affect bleeding. This helps the practitioner decide whether cupping is appropriate and whether to avoid certain areas." },
]

export default function CuppingPage() {
  return (
    <ServiceDetailPage
      id="cupping"
      title="Cupping"
      shortTitle="Cupping"
      description="A traditional suction-cup therapy in New City, NY. Learn what it feels like and what to expect at your visit."
      photo={{ path: "cupping/treatment", height: 665, alt: "Suction cups placed on a patient’s back during cupping therapy" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="Have a question about cupping? Call the center or book your visit online."
      intro={
        <>
          <p>Cupping is a traditional therapy that uses suction to gently draw the skin into cups placed on the body. People often ask about it for sore or stiff muscles, including after exercise.</p>
          <p>There are two common ways to create the suction. Traditional heated cupping uses warmth to create a partial vacuum inside the cup, while air cupping uses a pump without heat. Both can leave temporary round marks where the cups were placed.</p>
          <p>Some people find cupping relaxing. Research suggests it may help with pain, but the evidence is limited. If you’re unsure whether it’s right for you, ask the clinic what to expect. <a href="https://www.nccih.nih.gov/health/cupping">Read the NIH overview of cupping.</a></p>
        </>
      }
    />
  )
}
