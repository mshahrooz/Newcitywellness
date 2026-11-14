import type { Metadata } from "next"
import { editorImage, editorValue } from "../../content/editor-model"
import { EditorBlocks } from "../editor-blocks"
import { BuilderMain, NativeSection, FieldText, SiteCopy, BuilderAnchor } from "../builder-page"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { about } from "./content"
import "../wellness.css"
import "./about.css"

export const metadata: Metadata = {
  title: "About Us | New City Acupuncture & Wellness Center",
  description: "Meet Mordechai Genut, MS, L.Ac., and learn about New City Acupuncture & Wellness Center, serving New City and Rockland County.",
}

export default function AboutPage() {
  return (
    <div className="ncw ncw-about">
      <SiteHeader current="about" />
      <BuilderMain page={"about"} id="main-content">

      <NativeSection id="hero" label="About hero"><section className="page-hero page-hero--photo" aria-labelledby="about-title">
        <div className="page-hero-photo" aria-hidden="true">
          <img data-editor-image="hero" {...editorImage("about", "hero", { src: `${process.env.BASE_PATH || ""}/images/about/hero-plumeria.webp`, width: 1500, height: 726, alt: "" })} fetchPriority="high" />
        </div>
        <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" aria-hidden="true">
          <path d="M42 68C41 48 41 25 42 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M42 59C30 45 29 25 42 7C55 25 54 45 42 59Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M8 43C18 55 29 63 42 68C55 63 66 55 76 43" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
        <div className="container">
          <div className="page-hero-copy">
            <nav aria-label="Breadcrumb"><ol className="crumbs rise">
              <li><Link href="/"><SiteCopy scope={"about"} id={"about-us-link"}>Home</SiteCopy></Link></li>
              <li aria-current="page"><SiteCopy scope={"about"} id={"about-us-li"}>About Us</SiteCopy></li>
            </ol>
            </nav>
            <h1 id="about-title" className="rise d1" data-editor-field="hero-title">{editorValue("about", "hero-title", "About Us")}</h1>
            <div className="gold-rule rise d2"></div>
            <p className="rise d3" data-editor-field="hero-description"><FieldText page={"about"} id={"hero-description"}>{editorValue("about", "hero-description", "Meet the practitioner and the wellness center serving New City, NY and all of Rockland County.")}</FieldText></p>
          </div>
        </div>
      </section></NativeSection>


      <NativeSection id="bio" label="Practitioner biography"><section className="bio" aria-labelledby="practitioner-title">
        <div className="container bio-grid">
          <aside className="bio-aside">
            <figure className="bio-photo clinic-reveal from-left">
              <img src={about.photos[0].src} alt="Mordechai Genut, licensed acupuncturist and owner of New City Acupuncture and Wellness Center" width={411} height={410} decoding="async" />
            </figure>
            <div className="creds clinic-reveal delay-1">
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5L2 9Z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /></svg></span>
                <div><strong><SiteCopy scope={"about"} id={"about-us-strong"}>Master’s in Oriental Medicine</SiteCopy></strong><span><SiteCopy scope={"about"} id={"about-us-span"}>Touro College, 2009</SiteCopy></span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg></span>
                <div><strong><SiteCopy scope={"about"} id={"about-us-strong-2"}>NYS Licensed Acupuncturist</SiteCopy></strong><span><SiteCopy scope={"about"} id={"about-us-span-2"}>Holistic health practitioner</SiteCopy></span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg></span>
                <div><strong><SiteCopy scope={"about"} id={"about-us-strong-3"}>Clinical Internship</SiteCopy></strong><span><SiteCopy scope={"about"} id={"about-us-span-3"}>Lutheran Medical Center, Brooklyn</SiteCopy></span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9" /></svg></span>
                <div><strong><SiteCopy scope={"about"} id={"about-us-strong-4"}>3rd Degree Black Belt</SiteCopy></strong><span><SiteCopy scope={"about"} id={"about-us-span-4"}>Master Level Instructor · 20+ years</SiteCopy></span></div>
              </div>
            </div>
          </aside>

          <div className="bio-copy copy clinic-reveal from-right">
            <span className="eyebrow"><SiteCopy scope={"about"} id={"about-us-eyebrow"}>Owner</SiteCopy></span>
            <BuilderAnchor page={"about"} section={"bio"} id={"about-us-after-practitioner-title"}><h2 id="practitioner-title"><SiteCopy scope={"about"} id={"about-us-practitioner-title"}>Mordechai Genut, MS, L.Ac.</SiteCopy></h2></BuilderAnchor>
            <div className="gold-rule"></div>
            <BuilderAnchor page={"about"} section={"bio"} id={"about-us-after-lead"}><p className="lead"><SiteCopy scope={"about"} id={"about-us-lead"}>Mordechai Genut is a NYS licensed acupuncturist and holistic health practitioner. He is the owner of New City Acupuncture &amp; Wellness Center located in New City, NY. He graduated with a Master’s Degree in Oriental Medicine from Touro College in 2009. He gained valuable hands-on experience at Lutheran Medical Center in Brooklyn, NY where he interned in the Oncology Support and in the Neurological and Orthopedic Rehabilitation units. His focus was helping patients rehabilitate from post stroke and paralysis.</SiteCopy></p></BuilderAnchor>
            <p data-editor-field="secondary-copy"><FieldText page={"about"} id={"secondary-copy"}>{editorValue("about", "secondary-copy", "Mordechai has successfully treated hundreds of patients over the years. He is very passionate about helping others heal from pain and illness. When Mordechai was younger, he suffered painful digestive issues throughout his childhood and adolescent years. It was recommended that he see an herbalist and acupuncturist to help manage his debilitating condition. Upon successful treatments, Mordechai became very interested in learning more about Traditional Chinese Medicine. Nowadays Mordechai’s goal is to help others maintain a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.")}</FieldText></p>
            <BuilderAnchor page={"about"} section={"bio"} id={"about-us-after-p"}><p><SiteCopy scope={"about"} id={"about-us-p"}>Mordechai has a passion for health and wellness and is an avid student of life. He is constantly learning and growing which has helped him to become a more centered, calmer, focused person. Mordechai is trained in the internal Chinese systems of Martial Arts including Tai Chi, Ba Gua, and Xing Yi, which focuses on the importance of maintaining a healthy internal environment to develop strength, maintain inner peace, and preserve health. Mordechai holds a 3rd Degree Black Belt and is a Master Level Instructor with over 20 years’ experience in the martial arts. He has been teaching many karate classes, self-defense seminars, Qi-Gong healing therapy programs, specialized breathing and exercises for the elderly and special needs population, and Tai Chi basic techniques to individuals and groups throughout New York, New Jersey, and surrounding areas.</SiteCopy></p></BuilderAnchor>
            <BuilderAnchor page={"about"} section={"bio"} id={"about-us-after-p-2"}><p><SiteCopy scope={"about"} id={"about-us-p-2"}>Mordechai prides himself on his professional, attentive, caring approach to medicine. With the knowledge and experience Mordechai possesses, his treatments are catered to each individual with focus on a treatment plan that is specialized for each person. No two people are looked at the same and there is no cookie cutter solution to solve a problem. A lot of time is spent with a client and researching the needs of the client.</SiteCopy></p></BuilderAnchor>
            <blockquote className="pullquote"><SiteCopy scope={"about"} id={"about-us-pullquote"}>
              “Two patients can both come into the office with headaches, however each person’s root cause will be different thereby making the treatment plan different for each.”
              </SiteCopy><cite>— Mordechai</cite>
            </blockquote>
          </div>
        </div>
      </section></NativeSection>


      <NativeSection id="mission" label="Our mission"><section className="statement" aria-label="Our mission">
        <div className="container statement-inner clinic-reveal">
          <div className="ornament" aria-hidden="true">
            <span className="ornament-line"></span>
            <svg className="ornament-mark" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.5 6 6.5 10 6.5 13.5C6.5 17 8.8 19.5 12 21.5C15.2 19.5 17.5 17 17.5 13.5C17.5 10 15.5 6 12 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M12 5V21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
            <span className="ornament-line flip"></span>
          </div>
          <BuilderAnchor page={"about"} section={"mission"} id={"about-us-after-p-3"}><p><SiteCopy scope={"about"} id={"about-us-p-3"}>New City Acupuncture &amp; Wellness Center utilizes a variety of traditional Chinese medicine modalities to help you achieve your goal of maintaining a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.</SiteCopy></p></BuilderAnchor>
        </div>
      </section></NativeSection>


      <NativeSection id="approach" label="Our approach"><section className="block block--paper" aria-labelledby="approach-title">
        <div className="container split">
          <figure className="frame split-media about-full-photo clinic-reveal from-left">
            <img src={about.photos[1].src} alt="Inside New City Acupuncture &amp; Wellness Center" loading="lazy" width={640} height={640} decoding="async" />
          </figure>
          <div className="split-copy copy clinic-reveal from-right">
            <span className="eyebrow"><SiteCopy scope={"about"} id={"about-us-eyebrow-2"}>Our Approach</SiteCopy></span>
            <BuilderAnchor page={"about"} section={"approach"} id={"about-us-after-approach-title"}><h2 className="section-title" id="approach-title"><SiteCopy scope={"about"} id={"about-us-approach-title"}>Holistic Treatment, Tailored to You</SiteCopy></h2></BuilderAnchor>
            <div className="gold-rule"></div>
            <BuilderAnchor page={"about"} section={"approach"} id={"about-us-after-p-4"}><p><SiteCopy scope={"about"} id={"about-us-p-4"}>Our wellness center offers holistic treatment plans specifically tailored to your needs. We focus on balancing the emotional health, physical well-being, and the lifestyle of each person in order to achieve optimal results. Our treatment rooms are equipped with comfortable massage tables and relaxing background music in a peaceful atmosphere.</SiteCopy></p></BuilderAnchor>
            <div className="pillars">
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.6A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 9.2 4.3c-1.7 5-9.2 9.6-9.2 9.6Z" /></svg>
                <span><SiteCopy scope={"about"} id={"about-us-span-5"}>Emotional Health</SiteCopy></span>
              </div>
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h4l2.5-7 5 14 2.5-7H21" /></svg>
                <span><SiteCopy scope={"about"} id={"about-us-span-6"}>Physical Well-Being</SiteCopy></span>
              </div>
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19c0-8.5 5-14 14-14 0 9-5.5 14-14 14Z" /><path d="M5 19c2-4.5 5-7.5 9-9.5" /></svg>
                <span><SiteCopy scope={"about"} id={"about-us-span-7"}>Lifestyle</SiteCopy></span>
              </div>
            </div>
          </div>
        </div>
      </section></NativeSection>


      <NativeSection id="facility" label="Our facility"><section className="block block--cream" aria-labelledby="facility-title">
        <div className="container split split--reverse">
          <figure className="frame frame--right split-media clinic-reveal from-right">
            <picture>
              <source media="(min-width: 700px)" type="image/avif" srcSet={about.photos[2].largeAvif} />
              <img src={about.photos[2].src} alt="Treatment space at New City Acupuncture &amp; Wellness Center" loading="lazy" width={about.photos[2].width} height={about.photos[2].height} decoding="async" />
            </picture>
          </figure>
          <div className="split-copy copy clinic-reveal from-left">
            <span className="eyebrow"><SiteCopy scope={"about"} id={"about-us-eyebrow-3"}>About</SiteCopy></span>
            <BuilderAnchor page={"about"} section={"facility"} id={"about-us-after-facility-title"}><h2 className="section-title" id="facility-title"><SiteCopy scope={"about"} id={"about-us-facility-title"}>Our Facility</SiteCopy></h2></BuilderAnchor>
            <div className="gold-rule"></div>
            <BuilderAnchor page={"about"} section={"facility"} id={"about-us-after-p-5"}><p><SiteCopy scope={"about"} id={"about-us-p-5"}>New City Acupuncture &amp; Wellness Center is conveniently located in the heart of New City, NY and services all of Rockland County and the surrounding areas.</SiteCopy></p></BuilderAnchor>
            <BuilderAnchor page={"about"} section={"facility"} id={"about-us-after-chip-label"}><p className="chip-label"><SiteCopy scope={"about"} id={"about-us-chip-label"}>We specialize in treating</SiteCopy></p></BuilderAnchor>
            <ul className="chips">
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip"}>Sports injury medicine</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-2"}>Pain relief</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-3"}>Chronic illnesses</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-4"}>Gynecological conditions</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-5"}>Stress/anxiety management</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-6"}>Nutritional support</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-7"}>Weight loss therapy</SiteCopy></li>
            </ul>
            <BuilderAnchor page={"about"} section={"facility"} id={"about-us-after-chip-label-2"}><p className="chip-label"><SiteCopy scope={"about"} id={"about-us-chip-label-2"}>Common modalities</SiteCopy></p></BuilderAnchor>
            <ul className="chips">
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-8"}>Acupuncture</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-9"}>Acupressure</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-10"}>Cupping</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-11"}>Herbal remedies</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-12"}>Chinese medical massage</SiteCopy></li>
              <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-13"}>And more</SiteCopy></li>
            </ul>
          </div>
        </div>
      </section></NativeSection>


      <NativeSection id="sessions" label="Weekly Group Sessions"><section className="sessions-wrap" aria-labelledby="sessions-title">
        <div className="container">
          <div className="sessions clinic-reveal">
            <figure className="sessions-media about-full-photo">
              <img src={about.photos[3].src} alt="Hands-on treatment at New City Acupuncture &amp; Wellness Center" loading="lazy" width={640} height={640} decoding="async" />
            </figure>
            <div className="sessions-copy">
              <span className="session-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg><SiteCopy scope={"about"} id={"about-us-session-badge"}>
                Mondays · 9:30 am
              </SiteCopy></span>
              <h2 id="sessions-title" data-editor-field="session-heading"><FieldText page={"about"} id={"session-heading"}>{editorValue("about", "session-heading", "Weekly Group Sessions")}</FieldText></h2>
              <div className="gold-rule"></div>
              <p data-editor-field="session-copy"><FieldText page={"about"} id={"session-copy"}>{editorValue("about", "session-copy", "To help you start the week in a relaxed, focused and calm manner, we offer affordable weekly group sessions in Qigong, breathing, meditation, and relaxation. These sessions help improve posture, strengthen muscles, release stiffness in the joints, and enhance calmness. Join us Monday’s at 9:30 am right here in our wellness center.")}</FieldText></p>
              <ul className="chips">
                <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-14"}>Qigong</SiteCopy></li>
                <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-15"}>Breathing</SiteCopy></li>
                <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-16"}>Meditation</SiteCopy></li>
                <li className="chip"><SiteCopy scope={"about"} id={"about-us-chip-17"}>Relaxation</SiteCopy></li>
              </ul>
            </div>
          </div>
        </div>
      </section></NativeSection>


      <NativeSection id="contact" label="Get in touch"><section className="cta-band" aria-labelledby="cta-title">
        <div className="container cta-inner">
          <span className="eyebrow"><SiteCopy scope={"about"} id={"about-us-eyebrow-4"}>Get In Touch</SiteCopy></span>
          <h2 id="cta-title" data-editor-field="closing-heading"><FieldText page={"about"} id={"closing-heading"}>{editorValue("about", "closing-heading", "Let’s Talk About Your First Visit")}</FieldText></h2>
          <p data-editor-field="closing-copy"><FieldText page={"about"} id={"closing-copy"}>{editorValue("about", "closing-copy", "Have questions about the clinic or what to expect? Call us to talk through your first visit, or book an appointment online.")}</FieldText></p>
          <div className="cta-actions">
            <a className="btn btn-gold" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener noreferrer"><SiteCopy scope={"about"} id={"about-us-btn"}>Book Appointment </SiteCopy><span className="arrow" aria-hidden="true">→</span></a>
            <a className="cta-phone" href="tel:+18455792428"><SiteCopy scope={"about"} id={"about-us-cta-phone"}>845-579-2428</SiteCopy></a>
          </div>
        </div>
      </section></NativeSection>
      <EditorBlocks page={"about"} />
    </BuilderMain>
      <SiteFooter />
    </div>
  )
}
