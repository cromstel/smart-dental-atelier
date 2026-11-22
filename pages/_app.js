import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';

/**
 * Root wrapper.
 *
 * `SessionProvider` is required for `useSession()` in the Navbar, the booking
 * form prefills and both portals. Per-page metadata is handled by
 * `components/Seo.js`, which renders the canonical link, OG and Twitter tags
 * and any JSON-LD payload the page passes to it.
 *
 * The site header is global: it is rendered here once for every public page
 * instead of being repeated by each page's Layout. The admin and client portal
 * have their own dedicated shells/headers, and the sign-in pages have no site
 * chrome, so those routes are excluded. The skip link lives here too, ahead
 * of the global header, so keyboard users can bypass it. `Layout` renders the
 * main landmark, footer and scroll-to-top for the pages that use it.
 */
const SHELL_PREFIXES = ['/admin', '/portal', '/auth'];

function usesSiteHeader(pathname) {
  return !SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const { pathname } = useRouter();

  return (
    <SessionProvider session={session}>
      {usesSiteHeader(pathname) ? (
        <>
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          <Navbar contact={pageProps.settings || pageProps.contact} />
        </>
      ) : null}
      <Component {...pageProps} />
    </SessionProvider>
  );
}
