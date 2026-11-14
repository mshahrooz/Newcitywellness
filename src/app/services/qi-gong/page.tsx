import type { Metadata } from "next"
import { ServiceDetailPage } from "../service-detail-page"

export const metadata: Metadata = {
  title: "Qi-Gong in New City, NY | New City Wellness",
  description: "Explore Qi-Gong at New City Acupuncture & Wellness Center and learn what to expect from guided practice in gentle movement, posture, and breathing.",
}

const visitSteps = [
  { title: "Talk about how you move", copy: "Share your goals, any movements that feel difficult, and whether you would prefer to practice seated or standing." },
  { title: "Learn a few gentle movements", copy: "Your instructor guides you through simple postures and slow, flowing movements. Take your time and ask for an adjustment if a movement feels uncomfortable." },
  { title: "Bring movement and breath together", copy: "Practice moving at an easy pace while paying attention to your breath and posture. Ask which movements you can comfortably practice on your own." },
]

const questions = [
  { title: "Do I need experience to begin?", copy: "No. You can start with a few basic postures and movements and learn them at your own pace." },
  { title: "Can I practice Qi-Gong seated?", copy: "Yes. Qi-Gong can be practiced seated, standing, walking, or lying down, depending on the form. Let your instructor know what is comfortable for you." },
  { title: "How is Qi-Gong different from Tai Chi?", copy: "Both can combine movement, breathing, and attention. Tai Chi grew out of a martial art and often uses longer sequences. Qi-Gong can include simpler repeated movements, still postures, or breathing exercises." },
]

export default function QiGongPage() {
  return (
    <ServiceDetailPage
      id="qi-gong"
      title="Qi-Gong"
      shortTitle="Qi-Gong"
      description="Gentle movement, mindful breathing, and quiet focus. Learn the practice at your own pace in New City, NY."
      heroPhoto={{ path: "qi-gong/hero-outdoor-practice.webp", width: 1000, height: 668 }}
      photo={{ path: "qi-gong/practice", height: 667, alt: "A group practicing slow, coordinated movements in a bright studio" }}
      visitSteps={visitSteps}
      questions={questions}
      bookingCopy="New to Qi-Gong? Call the center to ask about guided practice, or book a visit online."
      intro={
        <>
          <p>Qi-Gong, also spelled qigong, is a traditional Chinese practice that brings together gentle movement, breathing, and meditation. <em>Qi</em> is often translated as “life energy,” and <em>gong</em> refers to the work of cultivating it through practice.</p>
          <p>At New City Acupuncture &amp; Wellness Center, the focus is on learning simple movements with attention to posture and breathing. Some forms are practiced standing or walking, while others can be done sitting or lying down.</p>
          <p>People often practice Qi-Gong for relaxation or to work on balance and ease of movement. <a href="https://www.nccih.nih.gov/health/qigong-what-you-need-to-know">Learn more about Qi-Gong from the NIH.</a></p>
        </>
      }
    />
  )
}
