const base = process.env.BASE_PATH || ""

export const faqPhotos = [
  { src: `${base}/images/faqs/acupuncture-800.webp`, width: 800, height: 532 },
  { src: `${base}/images/faqs/answer-2.webp`, width: 720, height: 545 },
  { src: `${base}/images/faqs/answer-3.webp`, width: 720, height: 480 },
  { src: `${base}/images/faqs/answer-4.webp`, width: 720, height: 403 },
  { src: `${base}/images/faqs/answer-5.webp`, width: 720, height: 480 },
  { src: `${base}/images/faqs/answer-6.webp`, width: 720, height: 479 },
] as const
