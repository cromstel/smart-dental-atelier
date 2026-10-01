/**
 * PostCSS configuration.
 *
 * In Tailwind v4 the PostCSS plugin moved out of the `tailwindcss` package into
 * `@tailwindcss/postcss`, and it now handles vendor prefixing itself — so
 * `autoprefixer` is no longer needed here and is not listed.
 */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};