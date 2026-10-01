import { PRIVATE_ROUTE_PREFIXES } from '@/lib/seo';

/**
 * GET /robots.txt
 * The portal, admin, login and API surfaces are disallowed — the legacy site had
 * no robots.txt at all, so its (unprotected-by-design) pages were all crawlable.
 */
export default function Robots() {
  return null;
}

export async function getServerSideProps({ res }) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dentalatelier.co').replace(/\/$/, '');

  const body = `User-agent: *
Allow: /
${PRIVATE_ROUTE_PREFIXES.map((prefix) => `Disallow: ${prefix}`).join('\n')}

Sitemap: ${base}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.write(body);
  res.end();

  return { props: {} };
}