/**
 * The URL contract between the two sign-in pages.
 *
 * Staff authenticate under `/auth/admin/*`, clients under `/auth/*`. Guards,
 * the shells and the sign-in pages import these paths instead of spelling them
 * out, so every redirect in the app follows the same split and a future move
 * is a one-line change here.
 */

/** The two sign-in entry points. */
export const AUTH_ROUTES = {
  admin: '/auth/admin/login',
  client: '/auth/login',
};

/**
 * Keeps a `callbackUrl` on this site.
 *
 * The value comes from the query string and ends up in
 * `window.location.assign()` / a `Location` header, so an absolute URL or a
 * `//host` pair would be an open redirect. Authentication and API targets are
 * rejected too: sending a freshly signed-in administrator back to a sign-in
 * page (or into the API) is never what a guard meant.
 *
 * @param {unknown} value Raw query value.
 * @param {string | null} [fallback] Returned when the value is missing or unsafe.
 * @returns {string | null}
 */
export function safeCallbackUrl(value, fallback = null) {
  if (typeof value !== 'string') return fallback;

  const target = value.trim();
  if (!target.startsWith('/') || target.startsWith('//')) return fallback;
  if (target.startsWith('/auth/') || target.startsWith('/api/')) return fallback;

  return target;
}

/**
 * Appends `callbackUrl` to an authentication route, but only when it survived
 * `safeCallbackUrl`; otherwise the bare route is returned.
 *
 * @param {string} route One of `AUTH_ROUTES`.
 * @param {unknown} value Raw query value.
 * @returns {string}
 */
export function withCallback(route, value) {
  const target = safeCallbackUrl(value, null);
  return target ? `${route}?callbackUrl=${encodeURIComponent(target)}` : route;
}

export default AUTH_ROUTES;
