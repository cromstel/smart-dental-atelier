/**
 * Legacy sign-in URL.
 *
 * Authentication moved under `/auth/*`; `/login` is now `pages/auth/login.js`.
 * This file only forwards the old URL, so bookmarks and inbound links that
 * still point at `/login` keep working.
 *
 * The redirect is done here rather than in `next.config.js#redirects` because
 * Next does not carry query strings across a `redirects()` entry, and both
 * parameters matter: `callbackUrl` is where the visitor lands after signing in,
 * and `error` carries NextAuth's error code. Losing either would turn a
 * successful sign-in into a redirect to the wrong page.
 */

/** Only forward these two; anything else is dropped rather than reflected. */
const FORWARDED = ['callbackUrl', 'error'];

export default function LegacyLogin() {
  return null;
}

export async function getServerSideProps({ query, res }) {
  const search = new URLSearchParams();

  for (const key of FORWARDED) {
    const value = typeof query?.[key] === 'string' ? query[key] : null;
    if (value) search.set(key, value);
  }

  const searchString = search.toString();
  const destination = searchString ? `/auth/login?${searchString}` : '/auth/login';

  // 308: the move is permanent, and 308 preserves the method for non-GET
  // requests, which 301 would not.
  res.writeHead(308, { Location: destination });
  res.end();

  return { props: {} };
}