import Link from "next/link"
import "./clinic-footer.css"

export function SiteFooter() {
  const logo = `${process.env.BASE_PATH || ""}/images/new-city-logo.webp`
  return (
    <footer className="site-footer clinic-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="clinic-footer-brand">
            <Link className="footer-brand-logo" href="/" aria-label="New City Acupuncture and Wellness Center home">
              <img className="footer-logo-mark" src={logo} width={280} height={56} alt="" loading="lazy" decoding="async" />
              <img className="footer-logo-lettering" src={logo} width={280} height={56} alt="" loading="lazy" decoding="async" />
            </Link>
            <p>Traditional Chinese medicine in the heart of New City, NY, serving all of Rockland County and the surrounding areas.</p>
          </div>

          <nav className="footer-col" aria-label="Quick links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about-us/">About Us</Link></li>
              <li><Link href="/services/">Services</Link></li>
              <li><Link href="/faqs/">FAQs</Link></li>
              <li><Link href="/conditions-treated/">Conditions Treated</Link></li>
              <li><Link href="/testimonials/">Testimonials</Link></li>
              <li><Link href="/insurance/">Insurance</Link></li>
              <li><Link href="/contact-us/">Contact Us</Link></li>
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Our services">
            <h3>Our Services</h3>
            <ul>
              <li><Link href="/services/acupuncture/">Acupuncture</Link></li>
              <li><Link href="/services/chinese-medical-massage-tui-na/">Tui-Na</Link></li>
              <li><Link href="/services/cupping/">Cupping</Link></li>
              <li><Link href="/services/moxibustion/">Moxibustion</Link></li>
              <li><Link href="/services/chinese-herbal-medicine/">Chinese Herbal Medicine</Link></li>
              <li><Link href="/services/gua-sha/">Gua-Sha</Link></li>
              <li><Link href="/services/qi-gong/">Qi-Gong</Link></li>
            </ul>
          </nav>

          <div className="footer-col">
            <h3>Get In Touch</h3>
            <ul className="footer-contact">
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg>
                <a href="tel:+18455792428">845-579-2428</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <a href="mailto:newcitywellness@gmail.com">newcitywellness@gmail.com</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <a href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener">125 South Main Street<br />New City, NY 10956</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                <span>Sunday–Thursday: 9:00 am – 9:00 pm<br />Friday: 9:00 am – 2:00 pm<br />Saturday: Closed</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Copyright © 2022 New City Acupuncture &amp; Wellness Center. All Rights Reserved.</span>
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
        </div>
      </div>
    </footer>
  )
}
