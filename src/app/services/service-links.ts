const publishedServices = ["acupuncture", "chinese-medical-massage-tui-na", "cupping", "moxibustion", "chinese-herbal-medicine", "gua-sha"] as const
export type PublishedService = (typeof publishedServices)[number]

export function serviceDetailHref(id: string) {
  const path = `/services/${id}/`
  return publishedServices.some((service) => service === id) ? path : `https://newcitywellness.com${path}`
}

export const serviceLinks = [
  { title: "Acupuncture", id: "acupuncture", copy: "Fine needles placed at selected points." },
  { title: "Chinese Herbal Medicine", id: "chinese-herbal-medicine", copy: "Individualized herbal formulas." },
  { title: "Cupping", id: "cupping", copy: "A traditional technique that uses suction cups." },
  { title: "Gua-Sha", id: "gua-sha", copy: "Gentle strokes with a smooth tool." },
  { title: "Chinese Medical Massage (Tui-Na)", id: "chinese-medical-massage-tui-na", copy: "Hands-on massage with rhythmic pressure." },
  { title: "Moxibustion", id: "moxibustion", copy: "A traditional technique that applies warmth near selected points." },
  { title: "Qi-Gong", id: "qi-gong", copy: "Gentle movement, breathing, and meditation." },
] as const
