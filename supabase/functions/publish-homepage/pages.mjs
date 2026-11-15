export const PAGES = [
  ["home", "Home", ""],
  ["about-us", "About Us", "about-us"],
  ["services", "Services", "services"],
  ["acupuncture", "Acupuncture", "services/acupuncture"],
  ["chinese-herbal-medicine", "Chinese Herbal Medicine", "services/chinese-herbal-medicine"],
  ["chinese-medical-massage-tui-na", "Chinese Medical Massage (Tui Na)", "services/chinese-medical-massage-tui-na"],
  ["cupping", "Cupping", "services/cupping"],
  ["gua-sha", "Gua Sha", "services/gua-sha"],
  ["moxibustion", "Moxibustion", "services/moxibustion"],
  ["qi-gong", "Qi Gong", "services/qi-gong"],
  ["conditions-treated", "Conditions Treated", "conditions-treated"],
  ["contact-us", "Contact Us", "contact-us"],
  ["faqs", "FAQs", "faqs"],
  ["insurance", "Insurance", "insurance"],
  ["testimonials", "Testimonials", "testimonials"]
];

export function pageFiles(key) {
  if (key === 'home') return {source:'src/content/homepage-studio-published.json', draft:'public/homepage-studio/draft.json', identity:'new-city-wellness-homepage'};
  return {source:'src/content/studio-pages/'+key+'.json', draft:'public/homepage-studio/pages/'+key+'/draft.json', identity:'new-city-wellness-'+key};
}

export function pageDependencies(page, names) {
  if (!page[2]) return [];
  const folder='src/app/'+page[2].split('/')[0]+'/';
  return [...names].filter(n=>n==='src/app/'+page[2]+'/page.tsx'||
    n.startsWith(folder)&&!n.slice(folder.length).includes('/')&&/\.(tsx?|css)$/.test(n));
}

// Keep the original clinic integrations, with no arbitrary iframe URLs.
export const EMBEDS = {
  "contact-us": "https://maps.google.com/maps?q=125%20South%20Main%20Street%20New%20City%2C%20NY%2010956&t=m&z=15&output=embed&iwloc=near",
  "insurance": "https://acusimple.com/access2/8635/#/portal/public_form/1020736/"
};
