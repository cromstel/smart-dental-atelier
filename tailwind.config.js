/**
 * Tailwind design tokens for Dental Atelier.
 *
 * NOTE ON THE PALETTE
 * -------------------
 * The Executive Summary proposed Navy `#0B3D91` / Coral-Gold `#DAA520` / Sky
 * `#79B4F9` on off-white, on the assumption that the original stylesheet was
 * unavailable. The original stylesheet (`_css/bootstrap_custom.css`) was in fact
 * recoverable and the real brand is gold on near-black:
 *
 *   body background  #020202   headings / primary  #D7AE15
 *   body text        #C9CBCB   primary hover       #3A300C
 *   error            #D82424   footer gradient     #2E270A
 *
 * We therefore keep the token *structure* from the report (brand / accent /
 * navy / neutral scales) but map it onto the client's real identity so the
 * existing gold logo and photography stay consistent. `#0B3D91` and `#79B4F9`
 * are still available as `navy` and `accent` for informational surfaces and
 * focus treatment.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
    './utils/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1320px' },
    },
    extend: {
      colors: {
        // Primary brand ramp — gold. brand.DEFAULT is the exact legacy #D7AE15.
        brand: {
          50: '#FBF6E3',
          100: '#F6ECBF',
          200: '#EBD78A',
          300: '#DFC255',
          400: '#D7AE15',
          500: '#BE9A12',
          600: '#9C7D0F',
          700: '#6F590A',
          800: '#3A300C',
          900: '#201C07',
          DEFAULT: '#D7AE15',
          contrast: '#000000',
        },
        // Deep surface ramp — near-black, the legacy #020202 page background.
        ink: {
          DEFAULT: '#020202',
          900: '#050505',
          800: '#0B0B0C',
          700: '#131315',
          600: '#1C1C1F',
          500: '#26262A',
          400: '#333338',
        },
        // Text ramp — legacy body colour #C9CBCB at 400.
        silver: {
          50: '#F6F7F7',
          100: '#E6E7E7',
          200: '#D6D7D7',
          300: '#C9CBCB',
          400: '#C9CBCB',
          500: '#AEB0B0',
          600: '#8A8C8C',
          700: '#6B6D6D',
          DEFAULT: '#C9CBCB',
        },
        // Secondary blue (report: "Accent") used for focus rings and links.
        accent: {
          300: '#9FCBFB',
          400: '#79B4F9',
          500: '#3D93EC',
          600: '#0B63C4',
          DEFAULT: '#79B4F9',
        },
        // Tertiary blue (report: "Primary") reserved for admin/informational UI.
        navy: {
          700: '#072A66',
          800: '#0B3D91',
          900: '#062A66',
          DEFAULT: '#0B3D91',
        },
        error: {
          300: '#FF9C9C',
          400: '#FF6B6B',
          500: '#D82424',
          600: '#A81B1B',
          DEFAULT: '#FF6B6B',
        },
        success: {
          400: '#4ADE80',
          500: '#16A34A',
          DEFAULT: '#4ADE80',
        },
        warning: {
          400: '#FBBF24',
          500: '#D97706',
          DEFAULT: '#FBBF24',
        },
      },
      fontFamily: {
        // Zero build-time network dependency. To self-host Inter/Playfair via
        // next/font/google, swap these for the generated font variables.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        caps: '0.14em',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 0 0 1px rgb(215 174 21 / 0.12)',
        'card-hover': '0 12px 32px -12px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(215 174 21 / 0.35)',
        glow: '0 0 0 3px rgb(215 174 21 / 0.25)',
      },
      maxWidth: {
        prose: '68ch',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out both',
        'fade-in-slow': 'fade-in-slow 1.2s ease-out both',
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [],
};