/**
 * SEO helpers for `_document` / per-page `<Head>`.
 * Also the place where the legacy site's SEO gaps are closed: the old build
 * shipped one shared description and no OG/Twitter tags at all.
 */

export const DEFAULT_OG_IMAGE = '/images/hero-sexy.webp';

/** @returns {{title:string, description:string, url:string, image:string, noIndex:boolean}} */
export function buildMeta({ title, description, pathname = '/', image, noIndex = false, site }) {
  const base = (site?.url || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dentalatelier.co').replace(
    /\/$/,
    '',
  );
  const url = `${base}${pathname === '/' ? '/' : pathname}`;
  const fullTitle = title && title.includes(base) === false && title !== 'Dental Atelier' ? title : title;

  return {
    title: fullTitle || 'Dental Atelier',
    description: description || 'Dental Atelier is here to empower you to live a healthy, happy life.',
    url,
    image: image || DEFAULT_OG_IMAGE,
    noIndex,
  };
}

/**
 * `<title>` strategy: `Page title | Brand` unless the title already mentions
 * the brand (e.g. the home page title is the tagline itself).
 */
export function pageTitle(title) {
  if (!title) return 'Dental Atelier';
  if (/dental atelier/i.test(title)) return title;
  return `${title} | Dental Atelier`;
}

export function organisationJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DentalLab',
    name: site?.name || 'Dental Atelier',
    legalName: site?.legalName || 'Dental Atelier Michal Siakel',
    description: site?.description,
    url: site?.url || 'https://www.dentalatelier.co',
    telephone: [site?.phone, site?.mobile].filter(Boolean),
    email: site?.email,
    vatID: site?.vat,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site?.address?.street,
      postalCode: site?.address?.postalCode,
      addressLocality: site?.address?.city,
      addressCountry: site?.address?.countryCode,
    },
    sameAs: [site?.facebook].filter(Boolean),
  };
}

export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href,
    })),
  };
}

export function jsonLdScript(data) {
  return { __html: JSON.stringify(data) };
}

/** Public routes, used by the sitemap generator. */
export const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about-us', changefreq: 'monthly', priority: 0.8 },
  { path: '/products-and-materials', changefreq: 'monthly', priority: 0.9 },
  { path: '/services', changefreq: 'monthly', priority: 0.9 },
  { path: '/portfolio', changefreq: 'monthly', priority: 0.8 },
  { path: '/faqs', changefreq: 'monthly', priority: 0.8 },
  { path: '/testimonials', changefreq: 'monthly', priority: 0.6 },
  { path: '/contact-us', changefreq: 'yearly', priority: 0.9 },
  { path: '/book-appointment', changefreq: 'monthly', priority: 0.9 },
  { path: '/smile-check-form', changefreq: 'monthly', priority: 0.8 },
  { path: '/sexy-and-powerful-smile', changefreq: 'monthly', priority: 0.7 },
  { path: '/comfort-and-self-confidence', changefreq: 'monthly', priority: 0.7 },
  { path: '/looking-young-feeling-healthy', changefreq: 'monthly', priority: 0.7 },
  { path: '/facial-analysis-and-digital-smile-design', changefreq: 'monthly', priority: 0.7 },
];

/** Routes that must never appear in the sitemap. */
export const PRIVATE_ROUTE_PREFIXES = ['/admin', '/portal', '/api', '/auth'];

/** Human-readable label map for breadcrumbs. */
export const ROUTE_LABELS = {
  '/': 'Home',
  '/about-us': 'About Us',
  '/products-and-materials': 'Products & Materials',
  '/services': 'Services',
  '/portfolio': 'Portfolio',
  '/faqs': 'FAQs',
  '/testimonials': 'Testimonials',
  '/contact-us': 'Contact Us',
  '/book-appointment': 'Book an appointment',
  '/smile-check-form': 'Smile check',
  '/sexy-and-powerful-smile': 'Sexy & powerful smile',
  '/comfort-and-self-confidence': 'Comfort & Self-confidence',
  '/looking-young-feeling-healthy': 'Looking young, feeling healthy',
  '/facial-analysis-and-digital-smile-design': 'Facial analysis and Digital Smile Design',
  '/portal': 'My account',
  '/admin': 'Admin',
};