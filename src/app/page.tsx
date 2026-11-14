'use client'

import { useEffect } from "react"
import Link from "next/link"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { BranchWatermark, Ornament } from "./wellness-art"
import "./wellness.css"

function LeafArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 70" fill="none" aria-hidden="true">
      <path d="M7 64C20 49 27 32 40 6M13 53C4 49 2 41 4 33c9 2 14 8 14 17M22 39c-2-11 3-19 13-24 2 11-2 20-13 24M28 25c-1-9 3-16 11-20 2 9-2 16-11 20M9 59C3 55-1 48 0 41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  useEffect(() => {
    /* Reveal on scroll — reveal once, then unobserve (robust: content stays visible) */
    const revealItems = document.querySelectorAll<HTMLElement>(".ncw .reveal")
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let revealObserver: IntersectionObserver | undefined
    if ("IntersectionObserver" in window && !reducedMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible")
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      )
      revealObserver = observer
      revealItems.forEach((item) => observer.observe(item))
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"))
    }

    /* Contact form — mailto fallback (matches source behavior) */
    const contactForm = document.getElementById("contactForm") as HTMLFormElement | null
    const onContactSubmit = (event: SubmitEvent) => {
      if (!contactForm) return
      event.preventDefault()
      const formData = new FormData(contactForm)
      const subject = encodeURIComponent("Website enquiry - New City Acupuncture & Wellness Center")
      const body = encodeURIComponent(
        "Name: " + (formData.get("name") || "") + "\n" +
        "Email: " + (formData.get("email") || "") + "\n" +
        "Phone: " + (formData.get("phone") || "") + "\n\n" +
        "Message:\n" + (formData.get("message") || "")
      )
      window.location.href = "mailto:newcitywellness@gmail.com?subject=" + subject + "&body=" + body
    }
    contactForm?.addEventListener("submit", onContactSubmit)

    return () => {
      revealObserver?.disconnect()
      contactForm?.removeEventListener("submit", onContactSubmit)
    }
  }, [])

  return (
    <div className="ncw">
      <SiteHeader current="home" />

      <main>
        {/* ===================== Hero ===================== */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-media">
            <img
              src="images/hero.png"
              alt="Calm acupuncture and wellness treatment room"
              fetchPriority="high"
            />
          </div>
          <div className="hero-content">
            <div className="hero-copy reveal from-left">
              <span className="eyebrow">Personalized care · Whole-person wellness</span>
              <h1 id="hero-title">Personalized Acupuncture &amp; Holistic Care for Pain, Stress, &amp; Better Health</h1>
              <p>We take the time to listen and understand your concerns, considering your symptoms, lifestyle, nutrition, and overall health to provide thoughtful, individualized care focused on helping you feel better.</p>
              <div className="hero-actions">
                <a className="btn" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener">Book Appointment <span className="arrow">→</span></a>
                <a className="btn btn-outline" href="#therapies">Explore Services <span className="arrow">→</span></a>
              </div>
            </div>
          </div>
          <div className="hero-seal" aria-label="Personalized care tailored to you">
            <svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="M25 42c-1-11-1-21 0-33M25 39C15 30 10 21 9 11c10 3 15 10 16 20 1-10 6-17 16-20-1 10-6 19-16 28Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M25 35C17 25 18 14 25 6c7 8 8 19 0 29Z" stroke="currentColor" strokeWidth="1.7" /></svg>
            <span>Care tailored<br />to you</span>
          </div>
          <div className="hero-cue" aria-hidden="true">
            <span className="cue-line" />
          </div>
        </section>

        {/* ===================== Therapies ===================== */}
        <section className="therapies" id="therapies" aria-labelledby="therapy-title">
          <div className="container">
            <div className="section-heading reveal">
              <span className="eyebrow">Our Therapies</span>
              <h2 id="therapy-title">Explore Our Therapies</h2>
              <Ornament />
              <p>Traditional practices, thoughtfully personalized</p>
            </div>
            <div className="therapy-grid">
              <article className="therapy-card reveal delay-1">
                <Link href="/services/acupuncture/" aria-label="Learn more about Acupuncture">
                  <div className="therapy-image"><img src="images/acupuncture.png" alt="A patient receiving acupuncture treatment" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Acupuncture</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-2">
                <Link href="/services/chinese-medical-massage-tui-na/" aria-label="Learn more about Chinese Medical Massage (Tui-Na)">
                  <div className="therapy-image"><img src="images/tuina.png" alt="Chinese medical massage treatment" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Chinese Medical Massage (Tui-Na)</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-3">
                <Link href="/services/cupping/" aria-label="Learn more about Cupping">
                  <div className="therapy-image"><img src="images/cupping.png" alt="Cupping therapy in progress" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Cupping</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-4">
                <Link href="/services/moxibustion/" aria-label="Learn more about Moxibustion">
                  <div className="therapy-image"><img src="images/moxibustion.png" alt="Moxibustion warming therapy" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Moxibustion</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-1">
                <Link href="/services/chinese-herbal-medicine/" aria-label="Learn more about Chinese Herbal Medicine">
                  <div className="therapy-image"><img src="images/herbal.png" alt="Natural herbs and ingredients used in Chinese herbal medicine" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Chinese Herbal Medicine</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-2">
                <Link href="/services/gua-sha/" aria-label="Learn more about Gua-Sha">
                  <div className="therapy-image"><img src="images/guasha.png" alt="Traditional hands-on therapy session" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Gua-Sha</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
              <article className="therapy-card reveal delay-3">
                <Link href="/services/qi-gong/" aria-label="Learn more about Qi-Gong">
                  <div className="therapy-image"><img src="images/qigong.png" alt="People practicing gentle Tai Chi movements" loading="lazy" /></div>
                  <div className="therapy-body"><h3>Qi-Gong</h3><span className="text-link">Learn More <span>→</span></span></div>
                </Link>
              </article>
            </div>
            <div className="services-overview-link"><Link className="btn btn-outline" href="/services/">View All Services <span className="arrow" aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        {/* ===================== First Visit ===================== */}
        <section className="first-visit-wrap" aria-labelledby="first-visit-title">
          <div className="container">
            <div className="first-visit reveal">
              <div className="first-visit-media">
                <img src="images/first-visit.png" alt="Welcoming clinic interior for your first visit" loading="lazy" />
              </div>
              <div className="first-visit-copy">
                <span className="eyebrow">Begin Your Journey</span>
                <h2 id="first-visit-title">Your First Visit</h2>
                <p>What can you expect at your first session?</p>
                <Link className="text-link" href="/faqs/#first-session">Learn More <span>→</span></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== Practitioner ===================== */}
        <section className="practitioner" aria-labelledby="practitioner-title">
          <BranchWatermark className="practitioner-art" />
          <div className="container practitioner-grid">
            <div className="practitioner-photo reveal from-left">
              <img src="images/practitioner.png" alt="Mordechai Genut, New City Acupuncture and Wellness Center practitioner" loading="lazy" />
            </div>
            <div className="practitioner-copy reveal from-right">
              <span className="eyebrow">Your Practitioner</span>
              <h2 id="practitioner-title">Meet the Practitioner</h2>
              <h3>Mordechai Genut, MS, L.Ac.</h3>
              <div className="gold-rule" />
              <p>Mordechai Genut is the owner of New City Acupuncture &amp; Wellness Center. He is a licensed acupuncturist, holistic health practitioner, wellness coach, and martial arts expert. His practice is client-centered which focuses on providing care, compassion, attentiveness, and healing aimed at the whole person—mind, body, and spirit. He creates individualized treatment plans that target the specific needs of each person.</p>
              <p>Mordechai’s goal is to help others maintain a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.</p>
              <Link className="btn" href="/about-us/">About the Center <span className="arrow">→</span></Link>
            </div>
          </div>
        </section>

        {/* ===================== Conditions ===================== */}
        <section className="conditions" aria-labelledby="conditions-title">
          <div className="container">
            <div className="section-heading reveal">
              <span className="eyebrow">Whole-Person Care</span>
              <h2 id="conditions-title">Areas We Support</h2>
              <Ornament />
            </div>
            <div className="condition-grid">
              <Link className="condition-card reveal delay-1" href="/conditions-treated/#digestive" aria-label="Digestive Issues">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5c-3 4-2 9 2 12 2 2 2 4 0 6-3 3-8 3-9 8-1 6 3 11 10 11 7 0 12-5 12-12 0-5-3-8-6-10-3-2-3-5-1-8" /><path d="M22 16c-1 4 1 7 5 8 4 1 7 4 7 8M12 28c3 2 6 2 9 0" /></svg>
                <span>Digestive<br />Issues</span>
              </Link>
              <Link className="condition-card reveal delay-2" href="/conditions-treated/#prenatal" aria-label="Prenatal Care">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 8c-5 0-8 4-8 9 0 4 2 6 5 8-4 2-7 6-7 12M24 25c8-1 13 4 13 12M24 25c-4 0-6-3-6-7 0-3 3-5 6-5 5 0 8 4 8 9 0 5-3 8-8 8" /><path d="M17 14c-2-2-5-1-6 2-1 3 1 6 4 7M15 37l-4 4M36 36l3 4" /></svg>
                <span>Prenatal<br />Care</span>
              </Link>
              <Link className="condition-card reveal delay-3" href="/conditions-treated/#general-wellness" aria-label="General Wellness">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41C11 33 8 23 13 15c6 0 10 5 11 11 1-7 5-12 11-12 5 9 1 20-11 27Z" /><path d="M24 41V18M24 29c-5-5-9-7-14-7M24 33c5-6 9-9 14-10" /></svg>
                <span>General<br />Wellness</span>
              </Link>
              <Link className="condition-card reveal delay-4" href="/conditions-treated/#postpartum" aria-label="Postpartum">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 7c-4 3-5 8-3 12 2 4 5 6 9 6 5 0 8-4 8-9 0-4-3-8-7-9M24 25c-5 2-8 6-8 12M24 25c6 1 10 6 10 13M15 37h-4M36 38h4" /><path d="M24 14c2 0 4 2 4 4" /></svg>
                <span>Postpartum</span>
              </Link>
              <Link className="condition-card reveal delay-1" href="/conditions-treated/#musculoskeletal" aria-label="Musculoskeletal">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 5c-3 5-2 9 1 12l-1 14c-3 3-4 7-1 12M30 5c3 5 2 9-1 12l1 14c3 3 4 7 1 12" /><path d="M17 16h14M16 31h16M20 10h8M20 38h8" /></svg>
                <span>Musculoskeletal</span>
              </Link>
              <Link className="condition-card reveal delay-2" href="/conditions-treated/#respiratory" aria-label="Respiratory">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M23 7v16c-4-6-8-7-11-3-4 5-5 14-3 20 5 2 10 0 13-5l1-12M25 7v16c4-6 8-7 11-3 4 5 5 14 3 20-5 2-10 0-13-5l-1-12" /></svg>
                <span>Respiratory</span>
              </Link>
              <Link className="condition-card reveal delay-3" href="/conditions-treated/#womens-health" aria-label="Women's Health">
                <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="10" /><path d="M24 25v17M18 35h12" /></svg>
                <span>Women&apos;s<br />Health</span>
              </Link>
              <Link className="condition-card reveal delay-4" href="/conditions-treated/#emotional" aria-label="Psychological and Emotional">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7c-9 0-16 6-16 15 0 6 4 10 9 12v7h14v-8c5-3 9-7 9-13C40 12 33 7 24 7Z" /><path d="M18 19c2-4 10-4 12 0M18 25c2 4 10 4 12 0M24 18v12" /></svg>
                <span>Psychological &amp;<br />Emotional</span>
              </Link>
              <Link className="condition-card reveal delay-1" href="/conditions-treated/#neurological" aria-label="Neurological">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7c-5-4-11 0-10 6-5 1-7 7-3 11-3 5 0 10 5 10 0 6 6 8 9 4M24 7c5-4 11 0 10 6 5 1 7 7 3 11 3 5 0 10-5 10 0 6-6 8-9 4M24 8v34M14 18l7 2M34 18l-7 2M14 29l7-2M34 29l-7-2" /></svg>
                <span>Neurological</span>
              </Link>
              <Link className="condition-card reveal delay-2" href="/conditions-treated/#urogenital" aria-label="Urogenital">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 8c-5 0-8 4-8 9s3 8 8 8c4 0 6-3 6-7V8M33 8c5 0 8 4 8 9s-3 8-8 8c-4 0-6-3-6-7V8M24 24v18M18 37c2-3 4-4 6-4s4 1 6 4" /></svg>
                <span>Urogenital</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== Testimonials ===================== */}
        <section className="testimonials" aria-labelledby="testimonials-title">
          <div className="container">
            <div className="section-heading reveal">
              <span className="eyebrow">Patient Experiences</span>
              <h2 id="testimonials-title">Patient Experiences</h2>
              <Ornament />
            </div>
            <div className="testimonial-grid">
              <article className="testimonial-card reveal from-left">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <h3>Hip &amp; Knee Pain</h3>
                  <p>“Highly recommend!! Tried everything for my hip &amp; knee &amp; nothing worked. 4 years later I decided to try acupuncture. Only gone once &amp; it&apos;s relieved a lot of the stiffness in my hips &amp; pain in my knee... Wish I tried this sooner! ❤️”</p>
                  <div className="reviewer">A. B.</div>
                </div>
              </article>
              <article className="testimonial-card reveal">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <h3>IBS &amp; Headache</h3>
                  <p>“I went to New City Acupuncture for various health issues, including IBS and headaches. I was very impressed with the depth of the questions that Mordechai asked and the amount of time that he spent. I have seen a number of acupuncturists over the years, and I have great confidence in Mordechai’s knowledge and skill. I have already noticed very positive results after a few treatments.”</p>
                  <div className="reviewer">S. B.</div>
                </div>
              </article>
              <article className="testimonial-card reveal from-right">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <h3>Anxiety &amp; Depression</h3>
                  <p>“I started with Mordechai 4 weeks ago. I was severely depressed, anxious &amp; was unable to keep up with my daily routine. After just one appointment I felt a huge difference. It&apos;s now a month later &amp; I Thank God I have my life back. I&apos;m feeling energized, positive and happy and going on a vacation I could never have taken a month ago. Mordechai is very professional with a pleasant disposition. I urge people who suffer from these symptoms to try this out. Very, very Highly recommended!!”</p>
                  <div className="reviewer">D. G.</div>
                </div>
              </article>
            </div>
            <div className="testimonial-more"><Link href="/testimonials/">Read More Patient Testimonials <span className="arrow" aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        {/* ===================== Contact ===================== */}
        <section className="contact-section" id="contact" aria-labelledby="contact-title">
          <BranchWatermark className="contact-art" />
          <div className="container contact-grid">
            <div className="contact-intro reveal from-left">
              <span className="eyebrow">Get In Touch</span>
              <h2 id="contact-title">Let’s Connect</h2>
              <p>Contact us to make an appointment or find out what acupuncture can do for you.</p>
              <div className="gold-rule" />
              <div className="contact-details">
                <a href="tel:8455792428"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg>845-579-2428</a>
                <a href="mailto:newcitywellness@gmail.com"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 8L4 7v10h16V7l-8 6Zm0-2 7-4H5l7 4Z" /></svg>newcitywellness@gmail.com</a>
                <a href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" fill="currentColor" /></svg>125 South Main Street, New City, NY 10956</a>
              </div>
            </div>
            <div className="clinic-hours reveal">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Clinic Hours
              </h3>
              <div className="hours-row"><strong>Sunday – Thursday</strong><span>9:00 am – 9:00 pm</span></div>
              <div className="hours-row"><strong>Friday</strong><span>9:00 am – 2:00 pm</span></div>
              <div className="hours-row"><strong>Saturday</strong><span>Closed</span></div>
            </div>
            <div className="contact-form-wrap reveal from-right">
              <h3>Send a Message</h3>
              <p>We&apos;ll reply within one business day.</p>
              <form className="contact-form" id="contactForm">
                <input type="text" name="name" placeholder="Name" aria-label="Name" required />
                <input type="email" name="email" placeholder="Email" aria-label="Email" required />
                <input className="full" type="tel" name="phone" placeholder="Phone" aria-label="Phone" />
                <textarea className="full" name="message" placeholder="Message" aria-label="Message" required />
                <button className="btn" type="submit">Send Message <span className="arrow">→</span></button>
              </form>
              <p className="form-note">Your message opens in your email app, ready to send.</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
