import Navbar from './Navbar';
import Footer from './Footer';
import { SITE } from '@/lib/content';

/**
 * Public site chrome. Every marketing page renders inside this layout, which
 * also provides the skip-link and the single `<h1>`-free landmark structure
 * needed for screen-reader navigation.
 *
 * `main` gets `id="main"` so the skip link has a real target.
 */
export default function Layout({ children, navbarVariant = 'light', className = '' }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <Navbar variant={navbarVariant} />

      <main id="main" tabIndex={-1} className={`flex-1 focus:outline-none ${className}`}>
        {children}
      </main>

      <Footer />

      <noscript>
        <div className="border-t border-brand-400/30 bg-ink-800 p-4 text-center text-sm text-silver-300">
          JavaScript is only required for the interactive forms. You can still reach us on{' '}
          <a className="link-underline" href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`}>
            {SITE.phoneDisplay}
          </a>{' '}
          or by email at{' '}
          <a className="link-underline" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </div>
      </noscript>
    </div>
  );
}