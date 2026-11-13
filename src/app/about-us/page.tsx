import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "../site-header"
import { SiteFooter } from "../site-footer"
import { AboutMotion } from "./about-motion"
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
      <AboutMotion />
      <main id="main-content">

      <section className="page-hero" aria-labelledby="about-title">
        <svg className="page-hero-art" viewBox="0 0 84 74" fill="none" aria-hidden="true">
          <path d="M42 68C41 48 41 25 42 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M42 59C30 45 29 25 42 7C55 25 54 45 42 59Z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M8 43C18 55 29 63 42 68C55 63 66 55 76 43" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
        <div className="container">
          <div className="page-hero-copy">
            <nav aria-label="Breadcrumb"><ol className="crumbs rise">
              <li><Link href="/">Home</Link></li>
              <li aria-current="page">About Us</li>
            </ol>
            </nav>
            <h1 id="about-title" className="rise d1">About Us</h1>
            <div className="gold-rule rise d2"></div>
            <p className="rise d3">Meet the practitioner and the wellness center serving New City, NY and all of Rockland County.</p>
          </div>
        </div>
      </section>


      <section className="bio" aria-labelledby="practitioner-title">
        <div className="container bio-grid">
          <aside className="bio-aside">
            <figure className="bio-photo clinic-reveal from-left">
              <img src="https://newcitywellness.com/wp-content/uploads/2022/12/profile-photo.png" alt="Mordechai Genut, licensed acupuncturist and owner of New City Acupuncture and Wellness Center" width={411} height={410} decoding="async" fetchPriority="high" />
            </figure>
            <div className="creds clinic-reveal delay-1">
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5L2 9Z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /></svg></span>
                <div><strong>Master’s in Oriental Medicine</strong><span>Touro College, 2009</span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg></span>
                <div><strong>NYS Licensed Acupuncturist</strong><span>Holistic health practitioner</span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg></span>
                <div><strong>Clinical Internship</strong><span>Lutheran Medical Center, Brooklyn</span></div>
              </div>
              <div className="cred">
                <span className="cred-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9" /></svg></span>
                <div><strong>3rd Degree Black Belt</strong><span>Master Level Instructor · 20+ years</span></div>
              </div>
            </div>
          </aside>

          <div className="bio-copy copy clinic-reveal from-right">
            <span className="eyebrow">Owner</span>
            <h2 id="practitioner-title">Mordechai Genut, MS, L.Ac.</h2>
            <div className="gold-rule"></div>
            <p className="lead">Mordechai Genut is a NYS licensed acupuncturist and holistic health practitioner. He is the owner of New City Acupuncture &amp; Wellness Center located in New City, NY. He graduated with a Master’s Degree in Oriental Medicine from Touro College in 2009. He gained valuable hands-on experience at Lutheran Medical Center in Brooklyn, NY where he interned in the Oncology Support and in the Neurological and Orthopedic Rehabilitation units. His focus was helping patients rehabilitate from post stroke and paralysis.</p>
            <p>Mordechai has successfully treated hundreds of patients over the years. He is very passionate about helping others heal from pain and illness. When Mordechai was younger, he suffered painful digestive issues throughout his childhood and adolescent years. It was recommended that he see an herbalist and acupuncturist to help manage his debilitating condition. Upon successful treatments, Mordechai became very interested in learning more about Traditional Chinese Medicine. Nowadays Mordechai’s goal is to help others maintain a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.</p>
            <p>Mordechai has a passion for health and wellness and is an avid student of life. He is constantly learning and growing which has helped him to become a more centered, calmer, focused person. Mordechai is trained in the internal Chinese systems of Martial Arts including Tai Chi, Ba Gua, and Xing Yi, which focuses on the importance of maintaining a healthy internal environment to develop strength, maintain inner peace, and preserve health. Mordechai holds a 3rd Degree Black Belt and is a Master Level Instructor with over 20 years’ experience in the martial arts. He has been teaching many karate classes, self-defense seminars, Qi-Gong healing therapy programs, specialized breathing and exercises for the elderly and special needs population, and Tai Chi basic techniques to individuals and groups throughout New York, New Jersey, and surrounding areas.</p>
            <p>Mordechai prides himself on his professional, attentive, caring approach to medicine. With the knowledge and experience Mordechai possesses, his treatments are catered to each individual with focus on a treatment plan that is specialized for each person. No two people are looked at the same and there is no cookie cutter solution to solve a problem. A lot of time is spent with a client and researching the needs of the client.</p>
            <blockquote className="pullquote">
              “Two patients can both come into the office with headaches, however each person’s root cause will be different thereby making the treatment plan different for each.”
              <cite>— Mordechai</cite>
            </blockquote>
          </div>
        </div>
      </section>


      <section className="statement" aria-label="Our mission">
        <div className="container statement-inner clinic-reveal">
          <div className="ornament" aria-hidden="true">
            <span className="ornament-line"></span>
            <svg className="ornament-mark" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.5 6 6.5 10 6.5 13.5C6.5 17 8.8 19.5 12 21.5C15.2 19.5 17.5 17 17.5 13.5C17.5 10 15.5 6 12 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M12 5V21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
            <span className="ornament-line flip"></span>
          </div>
          <p>New City Acupuncture &amp; Wellness Center utilizes a variety of traditional Chinese medicine modalities to help you achieve your goal of maintaining a mindful and well-balanced lifestyle to allow for optimal health, inner peace, and an overall good quality of life.</p>
        </div>
      </section>


      <section className="block block--paper" aria-labelledby="approach-title">
        <div className="container split">
          <figure className="frame split-media about-full-photo clinic-reveal from-left">
            <img src={about.photos[1].src} alt="Inside New City Acupuncture &amp; Wellness Center" loading="lazy" width={640} height={640} decoding="async" />
          </figure>
          <div className="split-copy copy clinic-reveal from-right">
            <span className="eyebrow">Our Approach</span>
            <h2 className="section-title" id="approach-title">Holistic Treatment, Tailored to You</h2>
            <div className="gold-rule"></div>
            <p>Our wellness center offers holistic treatment plans specifically tailored to your needs. We focus on balancing the emotional health, physical well-being, and the lifestyle of each person in order to achieve optimal results. Our treatment rooms are equipped with comfortable massage tables and relaxing background music in a peaceful atmosphere.</p>
            <div className="pillars">
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.2-9.6A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 9.2 4.3c-1.7 5-9.2 9.6-9.2 9.6Z" /></svg>
                <span>Emotional Health</span>
              </div>
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h4l2.5-7 5 14 2.5-7H21" /></svg>
                <span>Physical Well-Being</span>
              </div>
              <div className="pillar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19c0-8.5 5-14 14-14 0 9-5.5 14-14 14Z" /><path d="M5 19c2-4.5 5-7.5 9-9.5" /></svg>
                <span>Lifestyle</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="block block--cream" aria-labelledby="facility-title">
        <div className="container split split--reverse">
          <figure className="frame frame--right split-media clinic-reveal from-right">
            <img src="https://newcitywellness.com/wp-content/uploads/2023/01/20221231_200451-min.jpg" alt="Treatment space at New City Acupuncture &amp; Wellness Center" loading="lazy" width={1868} height={1934} decoding="async" />
          </figure>
          <div className="split-copy copy clinic-reveal from-left">
            <span className="eyebrow">About</span>
            <h2 className="section-title" id="facility-title">Our Facility</h2>
            <div className="gold-rule"></div>
            <p>New City Acupuncture &amp; Wellness Center is conveniently located in the heart of New City, NY and services all of Rockland County and the surrounding areas.</p>
            <p className="chip-label">We specialize in treating</p>
            <ul className="chips">
              <li className="chip">Sports injury medicine</li>
              <li className="chip">Pain relief</li>
              <li className="chip">Chronic illnesses</li>
              <li className="chip">Gynecological conditions</li>
              <li className="chip">Stress/anxiety management</li>
              <li className="chip">Nutritional support</li>
              <li className="chip">Weight loss therapy</li>
            </ul>
            <p className="chip-label">Common modalities</p>
            <ul className="chips">
              <li className="chip">Acupuncture</li>
              <li className="chip">Acupressure</li>
              <li className="chip">Cupping</li>
              <li className="chip">Herbal remedies</li>
              <li className="chip">Chinese medical massage</li>
              <li className="chip">And more</li>
            </ul>
          </div>
        </div>
      </section>


      <section className="sessions-wrap" aria-labelledby="sessions-title">
        <div className="container">
          <div className="sessions clinic-reveal">
            <figure className="sessions-media about-full-photo">
              <img src={about.photos[3].src} alt="Hands-on treatment at New City Acupuncture &amp; Wellness Center" loading="lazy" width={640} height={640} decoding="async" />
            </figure>
            <div className="sessions-copy">
              <span className="session-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
                Mondays · 9:30 am
              </span>
              <h2 id="sessions-title">Weekly Group Sessions</h2>
              <div className="gold-rule"></div>
              <p>To help you start the week in a relaxed, focused and calm manner, we offer affordable weekly group sessions in Qigong, breathing, meditation, and relaxation. These sessions help improve posture, strengthen muscles, release stiffness in the joints, and enhance calmness. Join us Monday’s at 9:30 am right here in our wellness center.</p>
              <ul className="chips">
                <li className="chip">Qigong</li>
                <li className="chip">Breathing</li>
                <li className="chip">Meditation</li>
                <li className="chip">Relaxation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      <section className="cta-band" aria-labelledby="cta-title">
        <div className="container cta-inner clinic-reveal">
          <span className="eyebrow">Get In Touch</span>
          <h2 id="cta-title">Contact Us — We’re Just A Click Away</h2>
          <p>We take your health seriously and offer tips on health and wellness. We believe in educating our patients and provide information on useful home remedies that can be beneficial. Contact us to see how we can help you achieve health and wellness to become the best you.</p>
          <a className="cta-phone" href="tel:+18455792428">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg>
            845-579-2428
          </a>
          <div className="clinic-social-row" aria-label="Social media links">
            <a className="clinic-social-link" href="https://www.facebook.com/Newcityacupuncture/" target="_blank" rel="noopener" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></svg>
            </a>
            <a className="clinic-social-link" href="https://www.instagram.com/newcitywellness/" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" /></svg>
            </a>
            <a className="clinic-social-link" href="https://www.linkedin.com/in/mordechai-genut-ms-l-ac-93977318" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3 0-3-1.85-3s-2.15 1.4-2.15 2.9V21H9V9Z" /></svg>
            </a>
            <a className="clinic-social-link" href="https://www.youtube.com/@NewCityAcuandWellness" target="_blank" rel="noopener" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5 3-5 3Z" /></svg>
            </a>
          </div>
          <Link className="btn btn-gold" href="/#contact">Contact Us <span className="arrow">→</span></Link>
        </div>
      </section>
    </main>
      <SiteFooter />
    </div>
  )
}
