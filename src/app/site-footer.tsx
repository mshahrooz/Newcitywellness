import Link from "next/link"
import { BrandMark } from "./wellness-art"

export function SiteFooter({ expanded = false }: { expanded?: boolean }) {
  return (
      <footer className="site-footer">
        <div className="container footer-inner">
          <Link className="footer-brand" href="/" aria-label="New City Acupuncture and Wellness Center home">
            <BrandMark className="brand-mark" />
            <span className="brand-copy"><span className="brand-name">NEW CITY</span><span className="brand-tag">ACUPUNCTURE &amp; WELLNESS CENTER</span></span>
          </Link>
          <div className="footer-links">
            {expanded && <>
              <h3>Quick Links</h3>
              <div className="quick-nav about-footer-nav">
                <Link href="/">Home</Link>
                <Link href="/about-us/" aria-current="page">About Us</Link>
                <a href="https://newcitywellness.com/services/">Services</a>
                <a href="https://newcitywellness.com/faqs/">FAQs</a>
                <a href="https://newcitywellness.com/conditions-treated/">Conditions Treated</a>
                <a href="https://newcitywellness.com/testimonials/">Testimonials</a>
                <a href="https://newcitywellness.com/insurance/">Insurance</a>
                <a href="https://newcitywellness.com/contact-us/">Contact Us</a>
              </div>
            </>}
            <h3>{expanded ? "Our Services" : "Quick Links"}</h3>
            <div className="quick-nav">
              <a href="https://newcitywellness.com/services/acupuncture/">Acupuncture</a>
              <a href="https://newcitywellness.com/services/chinese-medical-massage-tui-na/">Tui-Na</a>
              <a href="https://newcitywellness.com/services/cupping/">Cupping</a>
              <a href="https://newcitywellness.com/services/moxibustion/">Moxibustion</a>
              <a href="https://newcitywellness.com/services/chinese-herbal-medicine/">Herbal Medicine</a>
              <a href="https://newcitywellness.com/services/gua-sha/">Gua-Sha</a>
              <a href="https://newcitywellness.com/services/qi-gong/">Qi-Gong</a>
            </div>
          </div>
          <div className="copyright">Copyright © 2022 New City Acupuncture &amp; Wellness Center. All Rights Reserved.</div>
        </div>
      </footer>
  )
}
