/**
 * Next.js configuration.
 *
 * The Executive Summary specifies the Pages Router (`/pages`, `/pages/api`,
 * `getStaticProps`), which is what this app uses so that the NextAuth
 * `/api/auth/[...nextauth]` handler and REST-style API routes from the report
 * work exactly as sketched.
 */

/**
 * The port the server listens on.
 *
 * The number lives in the env file, never in the code. Next.js chooses its
 * port before the env files are loaded (its own documentation: "PORT cannot be
 * set in `.env` as booting up the HTTP server happens before any other code is
 * initialized"), so `scripts/run-next.mjs` reads it there and passes `--port`.
 *
 * The value is exported for the Playwright config, which cannot know about
 * the flag. `process.env.PORT` is what the runtime actually binds to; the
 * env-file lookup below is the same fallback the launcher uses.
 */
const PORT = Number(process.env.PORT || readEnvFile('PORT')) || 0;

/** Minimal `.env` reader — the port only, and only when it is not set. */
function readEnvFile(key) {
  try {
    const line = require('node:fs')
      .readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (!line) return null;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return null;
  }
}

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
    // - `style-src 'unsafe-inline'` covers styled-jsx, Tailwind's runtime style
    //   injection and the inline `style="border:0"` on the map iframe.
    // - `connect-src` stays `'self'` + Google (OAuth token exchange when enabled).
    // - `frame-src` must name the Maps host: without an explicit value it falls
    //   back to `default-src 'self'` and the contact-page map silently renders
    //   blank. Verified live and pinned by an e2e assertion.
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
      "frame-src https://www.google.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
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

/**
 * The shared port, exposed under a symbol.
 *
 * Next validates this object strictly and warns about unknown keys, so the
 * port is not a sibling key: it hangs off a symbol, which the schema cannot
 * see. `Symbol.for` gives the same key to every module that asks for it, so
 * the Playwright config and the end-to-end runner read the very same value
 * the launcher passes to Next.
 */
const PORT_KEY = Symbol.for('dental-atelier.port');

const analyzedConfig = withBundleAnalyzer(nextConfig);
analyzedConfig[PORT_KEY] = PORT;
module.exports = analyzedConfig;