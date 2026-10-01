import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom document.
 *
 * Adds `lang="en"`, a `preconnect` for the map tile host, and a static
 * background colour so the dark theme does not flash white on first paint
 * (`color-scheme: dark` is also set in globals.css).
 */
export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://www.google.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://maps.gstatic.com" />
        <style
          dangerouslySetInnerHTML={{
            __html: 'html,body{background:#020202;color-silver-300;}',
          }}
        />
      </Head>
      <body className="bg-ink text-silver">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}