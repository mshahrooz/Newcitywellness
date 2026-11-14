"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import type { PublishedService } from "./services/service-links"

function HeaderLogo() {
  return <img className="header-logo-image" src={`${process.env.BASE_PATH || ""}/images/new-city-logo.webp`} width={280} height={56} alt="" />
}

export function SiteHeader({ current, currentService }: { current: "home" | "about" | "services" | "faqs" | "conditions" | "testimonials" | "insurance"; currentService?: PublishedService }) {
  const [scrolled, setScrolled] = useState(false)
  const [navPinned, setNavPinned] = useState(false)
  const header = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const mobileButton = useRef<HTMLButtonElement>(null)
  const dropdownButton = useRef<HTMLButtonElement>(null)
  const closeMenus = () => { setMenuOpen(false); setDropdownOpen(false) }

  useEffect(() => {
    const updateScrollState = () => {
      const desktop = window.matchMedia("(min-width: 901px)").matches
      setScrolled(!desktop && window.scrollY > 40)
      setNavPinned(desktop && (header.current?.getBoundingClientRect().bottom ?? 1) <= 0)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(".ncw .site-header, .ncw .header-nav")) {
        setMenuOpen(false)
        setDropdownOpen(false)
      }
    }
    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      if (dropdownOpen) { setDropdownOpen(false); dropdownButton.current?.focus() }
      else if (menuOpen) { setMenuOpen(false); mobileButton.current?.focus() }
    }
  }

  return (
    <>
      <header ref={header} className={scrolled ? "site-header is-scrolled" : "site-header"} onKeyDown={onKeyDown}>
        <div className="container header-main">
          <Link className="brand" href="/" aria-label="New City Acupuncture and Wellness Center home">
            <HeaderLogo />
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
      </header>
      <nav className={`header-nav${menuOpen ? " is-open" : ""}${navPinned ? " is-pinned" : ""}`} id="primary-navigation" aria-label="Main navigation" onKeyDown={onKeyDown}>
          <div className="container nav-inner">
            <Link className="brand nav-brand" href="/" aria-label="New City Acupuncture and Wellness Center home" onClick={closeMenus}>
              <HeaderLogo />
            </Link>
            <Link className={current === "home" ? "nav-link active" : "nav-link"} aria-current={current === "home" ? "page" : undefined} href="/" onClick={closeMenus}>Home</Link>
            <Link className={current === "about" ? "nav-link active" : "nav-link"} aria-current={current === "about" ? "page" : undefined} href="/about-us/" onClick={closeMenus}>About</Link>
            <div className={dropdownOpen ? "nav-dropdown open" : "nav-dropdown"}>
              <button className={current === "services" ? "nav-dropdown-toggle active" : "nav-dropdown-toggle"} type="button" ref={dropdownButton} aria-expanded={dropdownOpen} aria-controls="services-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>Services <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <div className="dropdown-menu" id="services-menu">
                <Link href="/services/" aria-current={current === "services" && !currentService ? "page" : undefined} onClick={closeMenus}>All Services</Link>
                <Link href="/services/acupuncture/" aria-current={currentService === "acupuncture" ? "page" : undefined} onClick={closeMenus}>Acupuncture</Link>
                <Link href="/services/chinese-medical-massage-tui-na/" aria-current={currentService === "chinese-medical-massage-tui-na" ? "page" : undefined} onClick={closeMenus}>Chinese Medical Massage (Tui-Na)</Link>
                <Link href="/services/cupping/" aria-current={currentService === "cupping" ? "page" : undefined} onClick={closeMenus}>Cupping</Link>
                <Link href="/services/moxibustion/" aria-current={currentService === "moxibustion" ? "page" : undefined} onClick={closeMenus}>Moxibustion</Link>
                <Link href="/services/chinese-herbal-medicine/" aria-current={currentService === "chinese-herbal-medicine" ? "page" : undefined} onClick={closeMenus}>Chinese Herbal Medicine</Link>
                <Link href="/services/gua-sha/" aria-current={currentService === "gua-sha" ? "page" : undefined} onClick={closeMenus}>Gua-Sha</Link>
                <Link href="/services/qi-gong/" aria-current={currentService === "qi-gong" ? "page" : undefined} onClick={closeMenus}>Qi-Gong</Link>
              </div>
            </div>
            <Link className={current === "faqs" ? "nav-link active" : "nav-link"} aria-current={current === "faqs" ? "page" : undefined} href="/faqs/" onClick={closeMenus}>FAQs</Link>
            <Link className={current === "conditions" ? "nav-link active" : "nav-link"} aria-current={current === "conditions" ? "page" : undefined} href="/conditions-treated/" onClick={closeMenus}>Conditions</Link>
            <Link className={current === "testimonials" ? "nav-link active" : "nav-link"} aria-current={current === "testimonials" ? "page" : undefined} href="/testimonials/" onClick={closeMenus}>Testimonials</Link>
            <Link className={current === "insurance" ? "nav-link active" : "nav-link"} aria-current={current === "insurance" ? "page" : undefined} href="/insurance/" onClick={closeMenus}>Insurance</Link>
            <a className="nav-link" href="https://newcitywellness.com/contact-us/">Contact</a>
          </div>
      </nav>
    </>
  )
}
