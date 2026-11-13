export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 84 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M42 68C41 48 41 25 42 7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M42 65C28 53 17 37 11 21C27 22 39 34 42 51C45 34 57 22 73 21C67 37 56 53 42 65Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M42 59C30 45 29 25 42 7C55 25 54 45 42 59Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      <path d="M8 43C18 55 29 63 42 68C55 63 66 55 76 43" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M42 68C34 62 25 57 17 54" stroke="#b8924f" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M42 68C50 62 59 57 67 54" stroke="#b8924f" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function OrnamentMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.5 6 6.5 10 6.5 13.5C6.5 17 8.8 19.5 12 21.5C15.2 19.5 17.5 17 17.5 13.5C17.5 10 15.5 6 12 2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M12 5V21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

export function Ornament() {
  return (
    <div className="ornament" aria-hidden="true">
      <span className="ornament-line" />
      <OrnamentMark className="ornament-mark" />
      <span className="ornament-line flip" />
    </div>
  )
}

/* Branch watermark used in practitioner + contact sections */
export function BranchWatermark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 360" fill="none" aria-hidden="true">
      <path d="M118 350C112 260 130 170 194 47M115 275C73 235 49 194 46 143M126 218C164 188 187 158 193 119M109 313C75 296 46 266 27 227M142 173C145 128 136 91 113 51" stroke="currentColor" strokeWidth="2" />
      <path d="M52 145C25 127 12 98 20 73c29 6 49 28 52 58M192 121c-1-29 18-54 45-65 6 29-7 55-39 72M31 230c-23-4-40-25-42-51 25-1 45 12 55 37M114 54c-20-14-26-37-18-58 25 13 36 32 29 54M196 50c1-22 17-40 40-47 4 23-7 43-30 56" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

