/**
 * SEO helpers for `_document` / per-page `<Head>`.
 * Also the place where the legacy site's SEO gaps are closed: the old build
 * shipped one shared description and no OG/Twitter tags at all.
 */

import { SITE } from '@/lib/content';

export const DEFAULT_OG_IMAGE = '/images/hero-sexy.webp';

/** @returns {{title:string, description:string, url:string, image:string, noIndex:boolean}} */
export function buildMeta({ title, description, pathname = '/', image, noIndex = false, site }) {
  const base = (site?.url || SITE.url).replace(
    /\/$/,
    '',
  );
  const url = `${base}${pathname === '/' ? '/' : pathname}`;
  const fullTitle = title && title.includes(base) === false && title !== SITE.name ? title : title;

  return {
    title: fullTitle || SITE.name,
    description: description || SITE.description,
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
  if (!title) return SITE.name;
  if (new RegExp(SITE.name, 'i').test(title)) return title;
  return `${title} | ${SITE.name}`;
}

export function organisationJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DentalLab',
    name: site?.name || SITE.name,
    legalName: site?.legalName || SITE.legalName,
    description: site?.description,
    url: site?.url || SITE.url,
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

/**
 * Serialises a JSON-LD payload for a `<script type="application/ld+json">`.
 *
 * `JSON.stringify` does not escape `<`, so a value containing `</script>`
 * would close the script element early: the browser then parses the rest of
 * the payload as markup, which is a stored XSS. The content that ends up here
 * is admin-editable (FAQ questions and answers, the settings registry), so it
 * has to be treated as untrusted.
 *
 * `<`, `>` and `&` are replaced with their JSON escapes. They can only occur
 * inside string values — `JSON.stringify` never emits them as structure — so
 * the replacement is safe, and `\u003c` is a valid JSON escape that parses
 * back to the original character.
 */
export function safeJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function jsonLdScript(data) {
  return { __html: safeJson(data) };
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