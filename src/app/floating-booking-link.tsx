import "./floating-booking-link.css"

export function FloatingBookingLink() {
  return (
    <a
      className="floating-booking-link"
      href="https://acusimple.com/bookings/8635"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Book an appointment (opens in a new tab)"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M7.5 3.5v4m9-4v4m-13 3h17m-12 5 2 2 4-4" />
      </svg>
      <span className="floating-booking-label" aria-hidden="true">Book appointment</span>
    </a>
  )
}
