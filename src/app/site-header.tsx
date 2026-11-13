"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { BrandMark } from "./wellness-art"

export function SiteHeader({ current }: { current: "home" | "about" | "services" }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const mobileButton = useRef<HTMLButtonElement>(null)
  const dropdownButton = useRef<HTMLButtonElement>(null)
  const closeMenus = () => { setMenuOpen(false); setDropdownOpen(false) }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".ncw .site-header")) {
        setMenuOpen(false)
        setDropdownOpen(false)
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [])

  return (
      <header className={scrolled ? "site-header is-scrolled" : "site-header"} onKeyDown={(event) => {
      if (event.key === "Escape") {
        if (dropdownOpen) { setDropdownOpen(false); dropdownButton.current?.focus() }
        else if (menuOpen) { setMenuOpen(false); mobileButton.current?.focus() }
      }
    }}>
        <div className="container header-main">
          <Link className="brand" href="/" aria-label="New City Acupuncture and Wellness Center home">
            <BrandMark className="brand-mark" />
            <span className="brand-copy">
              <span className="brand-name">NEW CITY</span>
              <span className="brand-tag">ACUPUNCTURE &amp; WELLNESS CENTER</span>
            </span>
          </Link>

          <div className="header-contact">
            <a className="contact-chip" href="https://www.google.com/maps/search/?api=1&amp;query=125+South+Main+Street+New+City+NY+10956" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" fill="currentColor" /></svg>
              125 South Main Street, New City, NY 10956
            </a>
            <a className="contact-chip" href="tel:8455792428">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 2.8 9.3 2c.7-.2 1.5.2 1.7.9l1.1 3.7c.2.6 0 1.2-.5 1.6l-1.8 1.4a15.4 15.4 0 0 0 4.6 4.6l1.4-1.8c.4-.5 1-.7 1.6-.5l3.7 1.1c.7.2 1.1 1 1 1.7l-.8 2.7c-.2.7-.9 1.2-1.6 1.2C10.1 18.6 5.4 13.9 5.4 4.4c0-.7.5-1.4 1.2-1.6Z" /></svg>
              845-579-2428
            </a>
            <a className="btn header-book" href="https://acusimple.com/bookings/8635" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M7 3v4M17 3v4M3 10h18M12 13v5M9.5 15.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Book Appointment
            </a>
          </div>
          <button className="mobile-toggle" type="button" ref={mobileButton} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => { setMenuOpen(!menuOpen); setDropdownOpen(false) }}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={menuOpen ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <nav className={menuOpen ? "header-nav is-open" : "header-nav"} id="primary-navigation" aria-label="Main navigation">
          <div className="container nav-inner">
            <Link className={current === "home" ? "nav-link active" : "nav-link"} aria-current={current === "home" ? "page" : undefined} href="/" onClick={closeMenus}>Home</Link>
            <Link className={current === "about" ? "nav-link active" : "nav-link"} aria-current={current === "about" ? "page" : undefined} href="/about-us/" onClick={closeMenus}>About</Link>
            <div className={dropdownOpen ? "nav-dropdown open" : "nav-dropdown"}>
              <button className={current === "services" ? "nav-dropdown-toggle active" : "nav-dropdown-toggle"} type="button" ref={dropdownButton} aria-expanded={dropdownOpen} aria-controls="services-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>Services <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <div className="dropdown-menu" id="services-menu">
                <Link href="/services/" aria-current={current === "services" ? "page" : undefined} onClick={closeMenus}>All Services</Link>
                <a href="https://newcitywellness.com/services/acupuncture/">Acupuncture</a>
                <a href="https://newcitywellness.com/services/chinese-medical-massage-tui-na/">Chinese Medical Massage (Tui-Na)</a>
                <a href="https://newcitywellness.com/services/cupping/">Cupping</a>
                <a href="https://newcitywellness.com/services/moxibustion/">Moxibustion</a>
                <a href="https://newcitywellness.com/services/chinese-herbal-medicine/">Chinese Herbal Medicine</a>
                <a href="https://newcitywellness.com/services/gua-sha/">Gua-Sha</a>
                <a href="https://newcitywellness.com/services/qi-gong/">Qi-Gong</a>
              </div>
            </div>
            <a className="nav-link" href="https://newcitywellness.com/faqs/">FAQs</a>
            <a className="nav-link" href="https://newcitywellness.com/conditions-treated/">Conditions</a>
            <a className="nav-link" href="https://newcitywellness.com/testimonials/">Testimonials</a>
            <a className="nav-link" href="https://newcitywellness.com/insurance/">Insurance</a>
            <a className="nav-link" href="https://newcitywellness.com/contact-us/">Contact</a>
          </div>
        </nav>
      </header>
  )
}
