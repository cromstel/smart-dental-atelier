import { PUBLIC_ROUTES } from '@/lib/seo';
import { getPageSeo } from '@/lib/cms';

/**
 * GET /sitemap.xml — generated from the public route list plus every published
 * service and FAQ-driven page. Regenerated on request (cheap: one settings
 * read) so a newly published page appears without a redeploy.
 */
export default function Sitemap() {
  return null; // all output comes from getServerSideProps
}

export async function getServerSideProps({ res }) {
  const settings = await getPageSeo('/');
  const base = (settings.site?.url || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dentalatelier.co').replace(
    /\/$/,
    '',
  );

  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url>
    <loc>${base}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();

  return { props: {} };
}