'use client'

import { useEffect } from "react"
import { editorImage, editorValue } from "./../content/editor-model"
import { EditorBlocks } from "./editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor, copyText } from "./builder-page"
import Link from "next/link"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { BranchWatermark, Ornament } from "./wellness-art"
import { TestimonialSlider } from "./testimonial-slider"
import "./wellness.css"

function LeafArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 70" fill="none" aria-hidden="true">
      <path d="M7 64C20 49 27 32 40 6M13 53C4 49 2 41 4 33c9 2 14 8 14 17M22 39c-2-11 3-19 13-24 2 11-2 20-13 24M28 25c-1-9 3-16 11-20 2 9-2 16-11 20M9 59C3 55-1 48 0 41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function Home() {
  const heroTitle = editorValue("home", "hero-title", "Personalized Acupuncture & Holistic Care for Pain, Stress, & Better Health")
  useEffect(() => {
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
      contactForm?.removeEventListener("submit", onContactSubmit)
    }
  }, [])

  return (
    <div className="ncw">
      <SiteHeader current="home" />

      <BuilderMain page={"home"}>
        {/* ===================== Hero ===================== */}
        <NativeSection id="hero" label="Home hero"><section className="hero" aria-labelledby="hero-title">
          <div className="hero-media">
            <img data-editor-image="hero"
              {...editorImage("home", "hero", {
                src: "images/home/acupuncture-hero.webp",
                srcSet: "images/home/acupuncture-hero-960.webp 960w, images/home/acupuncture-hero.webp 1694w",
                width: 1694, height: 928, alt: "Patient receiving acupuncture in a sunlit treatment room",
              })}
              sizes="100vw" fetchPriority="high"
            />
          </div>
          <div className="hero-content">
            <div className="hero-copy motion-reveal from-left">
              <h1 id="hero-title" data-editor-field="hero-title">
                {heroTitle === "Personalized Acupuncture & Holistic Care for Pain, Stress, & Better Health" ? <>
                  <span>Personalized Acupuncture</span>{" "}
                  <span>&amp; Holistic Care for Pain,</span>{" "}
                  <span>Stress, &amp; Better Health</span>
                </> : heroTitle}
              </h1>
              <p data-editor-field="hero-description"><FieldText page={"home"} id={"hero-description"}>{editorValue("home", "hero-description", "We take the time to listen and understand your concerns, considering your symptoms, lifestyle, nutrition, and overall health to provide thoughtful, individualized care focused on helping you feel better.")}</FieldText></p>
              <div className="hero-actions">
                <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener"><span data-editor-field="appointment-button">{editorValue("home", "appointment-button", "Book Appointment")}</span> <span className="arrow"><SiteCopy scope={"home"} id={"home-arrow"}>→</SiteCopy></span></a>
                <a className="btn btn-outline" href="#therapies"><span data-editor-field="services-button">{editorValue("home", "services-button", "Explore Services")}</span> <span className="arrow"><SiteCopy scope={"home"} id={"home-arrow-2"}>→</SiteCopy></span></a>
              </div>
            </div>
          </div>
          <div className="hero-seal" aria-label="Personalized care tailored to you">
            <svg viewBox="0 0 50 50" fill="none" aria-hidden="true"><path d="M25 42c-1-11-1-21 0-33M25 39C15 30 10 21 9 11c10 3 15 10 16 20 1-10 6-17 16-20-1 10-6 19-16 28Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M25 35C17 25 18 14 25 6c7 8 8 19 0 29Z" stroke="currentColor" strokeWidth="1.7" /></svg>
            <span><SiteCopy scope={"home"} id={"home-span"}>Care tailored<br />to you</SiteCopy></span>
          </div>
          <div className="hero-cue" aria-hidden="true">
            <span className="cue-line" />
          </div>
        </section></NativeSection>

        {/* ===================== Therapies ===================== */}
        <NativeSection id="therapies" label="Explore Our Therapies"><section className="therapies" id="therapies" aria-labelledby="therapy-title">
          <div className="container">
            <div className="section-heading motion-reveal">
              <h2 id="therapy-title" data-editor-field="therapies-heading"><FieldText page={"home"} id={"therapies-heading"}>{editorValue("home", "therapies-heading", "Explore Our Therapies")}</FieldText></h2>
              <Ornament />
              <p data-editor-field="therapies-copy"><FieldText page={"home"} id={"therapies-copy"}>{editorValue("home", "therapies-copy", "Traditional practices, thoughtfully personalized")}</FieldText></p>
            </div>
            <div className="therapy-grid">
              <article className="therapy-card motion-reveal delay-1">
                <Link href="/services/acupuncture/" aria-label="Learn more about Acupuncture">
                  <div className="therapy-image"><img data-editor-image="acupuncture-card" {...editorImage("home", "acupuncture-card", { src: "images/acupuncture.png", width: 1024, height: 1024, alt: "A patient receiving acupuncture treatment" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="acupuncture-card-heading"><FieldText page={"home"} id={"acupuncture-card-heading"}>{editorValue("home", "acupuncture-card-heading", "Acupuncture")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-2">
                <Link href="/services/chinese-medical-massage-tui-na/" aria-label="Learn more about Chinese Medical Massage (Tui-Na)">
                  <div className="therapy-image"><img data-editor-image="tui-na-card" {...editorImage("home", "tui-na-card", { src: "images/tuina.png", width: 1024, height: 1024, alt: "Chinese medical massage treatment" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="tui-na-card-heading"><FieldText page={"home"} id={"tui-na-card-heading"}>{editorValue("home", "tui-na-card-heading", "Chinese Medical Massage (Tui-Na)")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-2"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-3">
                <Link href="/services/cupping/" aria-label="Learn more about Cupping">
                  <div className="therapy-image"><img data-editor-image="cupping-card" {...editorImage("home", "cupping-card", { src: "images/cupping.png", width: 1024, height: 1024, alt: "Cupping therapy in progress" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="cupping-card-heading"><FieldText page={"home"} id={"cupping-card-heading"}>{editorValue("home", "cupping-card-heading", "Cupping")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-3"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-4">
                <Link href="/services/moxibustion/" aria-label="Learn more about Moxibustion">
                  <div className="therapy-image"><img data-editor-image="moxibustion-card" {...editorImage("home", "moxibustion-card", { src: "images/moxibustion.png", width: 1024, height: 1024, alt: "Moxibustion warming therapy" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="moxibustion-card-heading"><FieldText page={"home"} id={"moxibustion-card-heading"}>{editorValue("home", "moxibustion-card-heading", "Moxibustion")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-4"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-1">
                <Link href="/services/chinese-herbal-medicine/" aria-label="Learn more about Chinese Herbal Medicine">
                  <div className="therapy-image"><img data-editor-image="herbal-card" {...editorImage("home", "herbal-card", { src: "images/herbal.png", width: 1024, height: 1024, alt: "Natural herbs and ingredients used in Chinese herbal medicine" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="herbal-card-heading"><FieldText page={"home"} id={"herbal-card-heading"}>{editorValue("home", "herbal-card-heading", "Chinese Herbal Medicine")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-5"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-2">
                <Link href="/services/gua-sha/" aria-label="Learn more about Gua-Sha">
                  <div className="therapy-image"><img data-editor-image="gua-sha-card" {...editorImage("home", "gua-sha-card", { src: "images/guasha.png", width: 1024, height: 1024, alt: "Traditional hands-on therapy session" })} loading="lazy" /></div>
                  <div className="therapy-body"><h3 data-editor-field="gua-sha-card-heading"><FieldText page={"home"} id={"gua-sha-card-heading"}>{editorValue("home", "gua-sha-card-heading", "Gua-Sha")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-6"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
              <article className="therapy-card motion-reveal delay-3">
                <Link href="/services/qi-gong/" aria-label="Learn more about Qi-Gong">
                  <div className="therapy-image"><img data-editor-image="qi-gong-card" {...editorImage("home", "qi-gong-card", { src: "images/services/qi-gong/practice-640.webp", srcSet: "images/services/qi-gong/practice-640.webp 640w, images/services/qi-gong/practice-1000.webp 1000w", width: 640, height: 427, alt: "A group practicing Tai Chi together" })} sizes="(max-width: 900px) 50vw, (max-width: 980px) 33vw, (max-width: 1370px) 25vw, 312px" loading="lazy" decoding="async" /></div>
                  <div className="therapy-body"><h3 data-editor-field="qi-gong-card-heading"><FieldText page={"home"} id={"qi-gong-card-heading"}>{editorValue("home", "qi-gong-card-heading", "Qi-Gong")}</FieldText></h3><span className="text-link"><SiteCopy scope={"home"} id={"home-text-link-7"}>Learn More <span>→</span></SiteCopy></span></div>
                </Link>
              </article>
            </div>
            <div className="services-overview-link"><Link className="btn btn-outline" href="/services/"><SiteCopy scope={"home"} id={"home-btn"}>View All Services </SiteCopy><span className="arrow" aria-hidden="true">→</span></Link></div>
          </div>
        </section></NativeSection>

        {/* ===================== First Visit ===================== */}
        <NativeSection id="first-visit" label="Your First Visit"><section className="first-visit-wrap" aria-labelledby="first-visit-title">
          <div className="container">
            <div className="first-visit motion-reveal">
              <div className="first-visit-media">
                <img data-editor-image="first-visit" {...editorImage("home", "first-visit", { src: "images/first-visit.png", width: 1344, height: 768, alt: "Welcoming clinic interior for your first visit" })} loading="lazy" />
              </div>
              <div className="first-visit-copy">
                <span className="eyebrow"><SiteCopy scope={"home"} id={"home-eyebrow"}>Begin Your Journey</SiteCopy></span>
                <h2 id="first-visit-title" data-editor-field="first-visit-heading"><FieldText page={"home"} id={"first-visit-heading"}>{editorValue("home", "first-visit-heading", "Your First Visit")}</FieldText></h2>
                <p data-editor-field="first-visit-copy"><FieldText page={"home"} id={"first-visit-copy"}>{editorValue("home", "first-visit-copy", "What can you expect at your first session?")}</FieldText></p>
                <Link className="text-link" href="/faqs/#first-session"><SiteCopy scope={"home"} id={"home-text-link-8"}>Learn More </SiteCopy><span><SiteCopy scope={"home"} id={"home-span-2"}>→</SiteCopy></span></Link>
              </div>
            </div>
          </div>
        </section></NativeSection>

        {/* ===================== Practitioner ===================== */}
        <NativeSection id="practitioner" label="Meet the Practitioner"><section className="practitioner" aria-labelledby="practitioner-title">
          <BranchWatermark className="practitioner-art" />
          <div className="container practitioner-grid">
            <div className="practitioner-photo motion-reveal from-left">
              <img data-editor-image="practitioner" {...editorImage("home", "practitioner", { src: "images/home/practitioner-portrait.webp", width: 411, height: 410, alt: "Mordechai Genut, New City Acupuncture and Wellness Center practitioner" })} loading="lazy" decoding="async" />
            </div>
            <div className="practitioner-copy motion-reveal from-right">
              <h2 id="practitioner-title" data-editor-field="secondary-heading"><FieldText page={"home"} id={"secondary-heading"}>{editorValue("home", "secondary-heading", "Meet the Practitioner")}</FieldText></h2>
              <BuilderAnchor page={"home"} section={"practitioner"} id={"home-after-h3"}><h3><SiteCopy scope={"home"} id={"home-h3"}>Mordechai Genut, MS, L.Ac.</SiteCopy></h3></BuilderAnchor>
              <div className="gold-rule" />
              <p data-editor-field="bio-copy"><FieldText page={"home"} id={"bio-copy"}>{editorValue("home", "bio-copy", "Mordechai Genut is the owner of New City Acupuncture & Wellness Center. He is a licensed acupuncturist, holistic health practitioner, wellness coach, and martial arts expert. His practice is client-centered which focuses on providing care, compassion, attentiveness, and healing aimed at the whole person—mind, body, and spirit. He creates individualized treatment plans that target the specific needs of each person.")}</FieldText></p>
              <p data-editor-field="secondary-copy"><FieldText page={"home"} id={"secondary-copy"}>{editorValue("home", "secondary-copy", "Mordechai’s goal is to help others maintain a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.")}</FieldText></p>
              <Link className="btn" href="/about-us/"><SiteCopy scope={"home"} id={"home-btn-2"}>About the Center </SiteCopy><span className="arrow"><SiteCopy scope={"home"} id={"home-arrow-3"}>→</SiteCopy></span></Link>
            </div>
          </div>
        </section></NativeSection>

        {/* ===================== Conditions ===================== */}
        <NativeSection id="conditions" label="Areas We Support"><section className="conditions" aria-labelledby="conditions-title">
          <div className="container">
            <div className="section-heading motion-reveal">
              <span className="eyebrow"><SiteCopy scope={"home"} id={"home-eyebrow-2"}>Whole-Person Care</SiteCopy></span>
              <BuilderAnchor page={"home"} section={"conditions"} id={"home-after-conditions-title"}><h2 id="conditions-title"><SiteCopy scope={"home"} id={"home-conditions-title"}>Areas We Support</SiteCopy></h2></BuilderAnchor>
              <Ornament />
            </div>
            <div className="condition-grid">
              <Link className="condition-card motion-reveal delay-1" href="/conditions-treated/#digestive" aria-label="Digestive Issues">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 5c-3 4-2 9 2 12 2 2 2 4 0 6-3 3-8 3-9 8-1 6 3 11 10 11 7 0 12-5 12-12 0-5-3-8-6-10-3-2-3-5-1-8" /><path d="M22 16c-1 4 1 7 5 8 4 1 7 4 7 8M12 28c3 2 6 2 9 0" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-3"}>Digestive<br />Issues</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-2" href="/conditions-treated/#prenatal" aria-label="Prenatal Care">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M25 8c-5 0-8 4-8 9 0 4 2 6 5 8-4 2-7 6-7 12M24 25c8-1 13 4 13 12M24 25c-4 0-6-3-6-7 0-3 3-5 6-5 5 0 8 4 8 9 0 5-3 8-8 8" /><path d="M17 14c-2-2-5-1-6 2-1 3 1 6 4 7M15 37l-4 4M36 36l3 4" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-4"}>Prenatal<br />Care</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-3" href="/conditions-treated/#general-wellness" aria-label="General Wellness">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41C11 33 8 23 13 15c6 0 10 5 11 11 1-7 5-12 11-12 5 9 1 20-11 27Z" /><path d="M24 41V18M24 29c-5-5-9-7-14-7M24 33c5-6 9-9 14-10" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-5"}>General<br />Wellness</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-4" href="/conditions-treated/#postpartum" aria-label="Postpartum">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 7c-4 3-5 8-3 12 2 4 5 6 9 6 5 0 8-4 8-9 0-4-3-8-7-9M24 25c-5 2-8 6-8 12M24 25c6 1 10 6 10 13M15 37h-4M36 38h4" /><path d="M24 14c2 0 4 2 4 4" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-6"}>Postpartum</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-1" href="/conditions-treated/#musculoskeletal" aria-label="Musculoskeletal">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18 5c-3 5-2 9 1 12l-1 14c-3 3-4 7-1 12M30 5c3 5 2 9-1 12l1 14c3 3 4 7 1 12" /><path d="M17 16h14M16 31h16M20 10h8M20 38h8" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-7"}>Musculoskeletal</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-2" href="/conditions-treated/#respiratory" aria-label="Respiratory">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M23 7v16c-4-6-8-7-11-3-4 5-5 14-3 20 5 2 10 0 13-5l1-12M25 7v16c4-6 8-7 11-3 4 5 5 14 3 20-5 2-10 0-13-5l-1-12" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-8"}>Respiratory</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-3" href="/conditions-treated/#womens-health" aria-label="Women's Health">
                <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="10" /><path d="M24 25v17M18 35h12" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-9"}>Women&apos;s<br />Health</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-4" href="/conditions-treated/#emotional" aria-label="Psychological and Emotional">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7c-9 0-16 6-16 15 0 6 4 10 9 12v7h14v-8c5-3 9-7 9-13C40 12 33 7 24 7Z" /><path d="M18 19c2-4 10-4 12 0M18 25c2 4 10 4 12 0M24 18v12" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-10"}>Psychological &amp;<br />Emotional</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-1" href="/conditions-treated/#neurological" aria-label="Neurological">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7c-5-4-11 0-10 6-5 1-7 7-3 11-3 5 0 10 5 10 0 6 6 8 9 4M24 7c5-4 11 0 10 6 5 1 7 7 3 11 3 5 0 10-5 10 0 6-6 8-9 4M24 8v34M14 18l7 2M34 18l-7 2M14 29l7-2M34 29l-7-2" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-11"}>Neurological</SiteCopy></span>
              </Link>
              <Link className="condition-card motion-reveal delay-2" href="/conditions-treated/#urogenital" aria-label="Urogenital">
                <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 8c-5 0-8 4-8 9s3 8 8 8c4 0 6-3 6-7V8M33 8c5 0 8 4 8 9s-3 8-8 8c-4 0-6-3-6-7V8M24 24v18M18 37c2-3 4-4 6-4s4 1 6 4" /></svg>
                <span><SiteCopy scope={"home"} id={"home-span-12"}>Urogenital</SiteCopy></span>
              </Link>
            </div>
          </div>
        </section></NativeSection>

        {/* ===================== Testimonials ===================== */}
        <NativeSection id="experiences" label="Patient Experiences"><section className="testimonials" aria-labelledby="testimonials-title">
          <div className="container">
            <div className="section-heading motion-reveal">
              <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-testimonials-title"}><h2 id="testimonials-title"><SiteCopy scope={"home"} id={"home-testimonials-title"}>Patient Experiences</SiteCopy></h2></BuilderAnchor>
              <Ornament />
            </div>
            <TestimonialSlider>
              <article className="testimonial-card motion-reveal from-left">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-h3-2"}><h3><SiteCopy scope={"home"} id={"home-h3-2"}>Hip &amp; Knee Pain</SiteCopy></h3></BuilderAnchor>
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-p"}><p><SiteCopy scope={"home"} id={"home-p"}>“Highly recommend!! Tried everything for my hip &amp; knee &amp; nothing worked. 4 years later I decided to try acupuncture. Only gone once &amp; it&apos;s relieved a lot of the stiffness in my hips &amp; pain in my knee... Wish I tried this sooner! ❤️”</SiteCopy></p></BuilderAnchor>
                  <div className="reviewer"><SiteCopy scope={"home"} id={"home-reviewer"}>A. B.</SiteCopy></div>
                </div>
              </article>
              <article className="testimonial-card motion-reveal">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-h3-3"}><h3><SiteCopy scope={"home"} id={"home-h3-3"}>IBS &amp; Headache</SiteCopy></h3></BuilderAnchor>
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-p-2"}><p><SiteCopy scope={"home"} id={"home-p-2"}>“I went to New City Acupuncture for various health issues, including IBS and headaches. I was very impressed with the depth of the questions that Mordechai asked and the amount of time that he spent. I have seen a number of acupuncturists over the years, and I have great confidence in Mordechai’s knowledge and skill. I have already noticed very positive results after a few treatments.”</SiteCopy></p></BuilderAnchor>
                  <div className="reviewer"><SiteCopy scope={"home"} id={"home-reviewer-2"}>S. B.</SiteCopy></div>
                </div>
              </article>
              <article className="testimonial-card motion-reveal from-right">
                <div className="leaf-art"><LeafArt /></div>
                <div className="testimonial-copy">
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-h3-4"}><h3><SiteCopy scope={"home"} id={"home-h3-4"}>Anxiety &amp; Depression</SiteCopy></h3></BuilderAnchor>
                  <BuilderAnchor page={"home"} section={"experiences"} id={"home-after-p-3"}><p><SiteCopy scope={"home"} id={"home-p-3"}>“I started with Mordechai 4 weeks ago. I was severely depressed, anxious &amp; was unable to keep up with my daily routine. After just one appointment I felt a huge difference. It&apos;s now a month later &amp; I Thank God I have my life back. I&apos;m feeling energized, positive and happy and going on a vacation I could never have taken a month ago. Mordechai is very professional with a pleasant disposition. I urge people who suffer from these symptoms to try this out. Very, very Highly recommended!!”</SiteCopy></p></BuilderAnchor>
                  <div className="reviewer"><SiteCopy scope={"home"} id={"home-reviewer-3"}>D. G.</SiteCopy></div>
                </div>
              </article>
            </TestimonialSlider>
            <div className="testimonial-more"><Link href="/testimonials/"><SiteCopy scope={"home"} id={"home-link"}>Read More Patient Testimonials </SiteCopy><span className="arrow" aria-hidden="true">→</span></Link></div>
          </div>
        </section></NativeSection>

        {/* ===================== Contact ===================== */}
        <NativeSection id="contact" label="Contact and hours"><section className="contact-section" id="contact" aria-labelledby="contact-title">
          <BranchWatermark className="contact-art" />
          <div className="container contact-grid">
            <div className="contact-intro motion-reveal from-left">
              <span className="eyebrow"><SiteCopy scope={"home"} id={"home-eyebrow-3"}>Get In Touch</SiteCopy></span>
              <h2 id="contact-title" data-editor-field="contact-heading"><FieldText page={"home"} id={"contact-heading"}>{editorValue("home", "contact-heading", "Let’s Connect")}</FieldText></h2>
              <p data-editor-field="contact-copy"><FieldText page={"home"} id={"contact-copy"}>{editorValue("home", "contact-copy", "Contact us to make an appointment or find out what acupuncture can do for you.")}</FieldText></p>
              <div className="gold-rule" />
              <div className="contact-details">
                <a href="tel:8455792428"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg><SiteCopy scope={"home"} id={"home-a"}>845-579-2428</SiteCopy></a>
                <a href="mailto:newcitywellness@gmail.com"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 8L4 7v10h16V7l-8 6Zm0-2 7-4H5l7 4Z" /></svg><SiteCopy scope={"home"} id={"home-a-2"}>newcitywellness@gmail.com</SiteCopy></a>
                <a href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" fill="currentColor" /></svg><SiteCopy scope={"home"} id={"home-a-3"}>125 South Main Street, New City, NY 10956</SiteCopy></a>
              </div>
            </div>
            <div className="clinic-hours motion-reveal">
              <BuilderAnchor page={"home"} section={"contact"} id={"home-after-h3-5"}><h3>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg><SiteCopy scope={"home"} id={"home-h3-5"}>
                Clinic Hours
              </SiteCopy></h3></BuilderAnchor>
              <div className="hours-row"><strong><SiteCopy scope={"home"} id={"home-strong"}>Sunday – Thursday</SiteCopy></strong><span><SiteCopy scope={"home"} id={"home-span-13"}>9:00 am – 9:00 pm</SiteCopy></span></div>
              <div className="hours-row"><strong><SiteCopy scope={"home"} id={"home-strong-2"}>Friday</SiteCopy></strong><span><SiteCopy scope={"home"} id={"home-span-14"}>9:00 am – 2:00 pm</SiteCopy></span></div>
              <div className="hours-row"><strong><SiteCopy scope={"home"} id={"home-strong-3"}>Saturday</SiteCopy></strong><span><SiteCopy scope={"home"} id={"home-span-15"}>Closed</SiteCopy></span></div>
            </div>
            <div className="contact-form-wrap motion-reveal from-right">
              <BuilderAnchor page={"home"} section={"contact"} id={"home-after-h3-6"}><h3><SiteCopy scope={"home"} id={"home-h3-6"}>Send a Message</SiteCopy></h3></BuilderAnchor>
              <BuilderAnchor page={"home"} section={"contact"} id={"home-after-p-4"}><p><SiteCopy scope={"home"} id={"home-p-4"}>We&apos;ll reply within one business day.</SiteCopy></p></BuilderAnchor>
              <form className="contact-form" id="contactForm">
                <input data-builder-copy={"home-placeholder-name"} data-builder-attr="placeholder" type="text" name="name" placeholder={copyText("home", "home-placeholder-name", "Name")} aria-label="Name" required />
                <input data-builder-copy={"home-placeholder-email"} data-builder-attr="placeholder" type="email" name="email" placeholder={copyText("home", "home-placeholder-email", "Email")} aria-label="Email" required />
                <input data-builder-copy={"home-placeholder-phone"} data-builder-attr="placeholder" className="full" type="tel" name="phone" placeholder={copyText("home", "home-placeholder-phone", "Phone")} aria-label="Phone" />
                <textarea className="full" name="message" placeholder="Message" aria-label="Message" required />
                <button className="btn" type="submit"><SiteCopy scope={"home"} id={"home-btn-3"}>Send Message </SiteCopy><span className="arrow">→</span></button>
              </form>
              <BuilderAnchor page={"home"} section={"contact"} id={"home-after-form-note"}><p className="form-note"><SiteCopy scope={"home"} id={"home-form-note"}>Your message opens in your email app, ready to send.</SiteCopy></p></BuilderAnchor>
            </div>
          </div>
        </section></NativeSection>
        <EditorBlocks page={"home"} />
      </BuilderMain>

      <SiteFooter />
    </div>
  )
}
