import Head from 'next/head';
import { buildMeta, pageTitle, jsonLdScript } from '@/lib/seo';
import { SITE } from '@/lib/content';

/**
 * Single `<Head>` wrapper for every page.
 *
 * Closes the SEO gaps of the legacy site, which served no per-page title, no
 * canonical, no Open Graph tags and no structured data.
 */
export default function Seo({
  title,
  description,
  pathname = '/',
  image,
  noIndex = false,
  jsonLd,
  children,
}) {
  const meta = buildMeta({ title, description, pathname, image, noIndex, site: SITE });

  return (
    <Head>
      <title>{pageTitle(meta.title)}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.url} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#020202" />

      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle(meta.title)} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:image" content={`${SITE.url}${meta.image}`} />
      <meta property="og:image:alt" content={`${SITE.name} — ${SITE.tagline}`} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle(meta.title)} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={`${SITE.url}${meta.image}`} />

      {jsonLd ? (
        <script
          type="application/ld+json"
          // Content is JSON.stringify'd in lib/seo, not user input.
          dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
        />
      ) : null}

      {/* Favicons (the legacy site served a single .ico with no sizes) */}
      <link rel="icon" href="/images/favicon.ico" sizes="any" />
      <link rel="icon" href="/images/apple-touch-icon.png" type="image/png" />

      {children}
    </Head>
  );
}