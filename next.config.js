/**
 * Next.js configuration.
 *
 * The Executive Summary specifies the Pages Router (`/pages`, `/pages/api`,
 * `getStaticProps`), which is what this app uses so that the NextAuth
 * `/api/auth/[...nextauth]` handler and REST-style API routes from the report
 * work exactly as sketched.
 */

/**
 * The app listens on 3031 (see the `dev` / `start` scripts in package.json).
 * Exported so the Playwright config cannot drift from it.
 */
const PORT = 3031;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Emits .next/standalone with a pruned server and only the traced
  // dependencies, which is what the Dockerfile's runner stage copies.
  // Required for the `output: 'standalone'` runtime image.
  output: process.env.NEXT_OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined,

  images: {
    // next/image optimisation for the portfolio / gallery / lab photography.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Remote originals are only used by the migration script, never at runtime.
    remotePatterns: [],
  },

  eslint: {
    dirs: ['pages', 'components', 'lib', 'utils'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // The admin portal must never be indexed, and neither must auth pages.
        source: '/:path(portal|admin|login|api)/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

module.exports = nextConfig;
module.exports.PORT = PORT;