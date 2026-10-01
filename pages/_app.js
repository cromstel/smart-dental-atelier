import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';

/**
 * Root wrapper.
 *
 * `SessionProvider` is required for `useSession()` in the Navbar, the booking
 * form prefills and both portals. Per-page metadata is handled by
 * `components/Seo.js`, which renders the canonical link, OG and Twitter tags
 * and any JSON-LD payload the page passes to it.
 */
export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}