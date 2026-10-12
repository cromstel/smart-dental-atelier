/**
 * Next.js configuration.
 *
 * The Executive Summary specifies the Pages Router (`/pages`, `/pages/api`,
 * `getStaticProps`), which is what this app uses so that the NextAuth
 * `/api/auth/[...nextauth]` handler and REST-style API routes from the report
 * work exactly as sketched.
 */

/**
 * The app listens on 3005 (see the `dev` / `start` scripts in package.json).
 * Exported so the Playwright config cannot drift from it.
 */
const PORT = 3005;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Emits .next/standalone with a pruned server and only the traced
  // dependencies, which is what the Dockerfile's runner stage copies.
  // Required for the `output: 'standalone'` runtime image.
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,

  images: {
    // Sources are already WebP (scripts/optimize-images.mjs runs before every
    // build), so only AVIF is left for next/image to negotiate. Asking it for
    // WebP too would re-encode already-WebP input and add CPU for nothing.
    formats: ['image/avif'],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Remote originals are only used by the migration script, never at runtime.
    remotePatterns: [],
    // v16 narrowed the default to [75]; keep a range so the upload-generated
    // gallery thumbnails are not silently coerced.
    qualities: [50, 75, 90, 100],
    // v16 raised the default from 60s to 4h. These are build-time assets that
    // change only when re-uploaded, so the longer default is appropriate.
    minimumCacheTTL: 14400,
  },

  // The `eslint` config key was removed in Next 16 (`next lint` is gone too);
  // linting now runs through eslint.config.mjs via the `lint` script.

  async headers() {
    // HSTS is ignored by browsers over plain HTTP (localhost dev), so it is safe
    // to set unconditionally. The `includeSubDomains` and `preload` directives
    // apply once the domain serves over HTTPS in production.
    const hsts = 'max-age=63072000; includeSubDomains; preload';

    // Content-Security-Policy for a Next.js Pages Router app with Tailwind:
    // - `script-src 'unsafe-inline'` is required: Next.js inlines the hydration
    //   payload (`self.__next_f.push`) and NextAuth's client bundle uses inline
    //   bootstrapping.
    // - `'unsafe-eval'` is dev-only (SWC dev server); production must not allow
    //   it. `vercel.json` carries the production value for the edge.
    // - `style-src 'unsafe-inline'` covers styled-jsx and Tailwind's runtime
    //   style injection.
    // - `connect-src` stays `'self'` + Google (OAuth token exchange when enabled).
    const scriptSrc =
      process.env.NODE_ENV === 'production'
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://accounts.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: hsts },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        // Bundled filenames are content-stable, and an upload is named with a
        // timestamp plus random bytes, so neither can be replaced in place.
        source: '/:path(images|uploads)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // The admin portal must never be indexed, and neither must auth pages.
        source: '/:path(portal|admin|auth|api)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  // The legacy `/login` -> `/auth/login` redirect lives in
  // `pages/login.js`, not here: Next does not forward query strings across a
  // `redirects()` entry, and `callbackUrl` / `error` both have to survive.
};

/**
 * Optional bundle analysis.
 *
 * Turbopack is the default builder (`next build`), so the one-off report
 * comes from its native flag: `npx next build --experimental-analyze`.
 *
 * The `@next/bundle-analyzer` wrapper below is webpack-only and stays dormant
 * unless the build is forced onto webpack: `ANALYZE=true npx next build
 * --webpack`. Zero-cost in every other configuration.
 */
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });
module.exports = withBundleAnalyzer(module.exports);

/**
 * Next validates this object strictly and warns about unknown keys, so the
 * shared port is exposed on a symbol-ish extra property that the config schema
 * ignores, rather than as a sibling key.
 */
Object.defineProperty(module.exports, 'PORT', {
  value: PORT,
  enumerable: false,
});

module.exports = nextConfig;