import path from 'node:path';

/**
 * Where the gallery images live, and the path they are served under.
 *
 * The two have to agree. Next serves the `public` directory statically, so an
 * image is only reachable at a URL that maps into it. A storage directory
 * outside `public` would produce a record whose URL 404s — the upload would
 * "succeed" and the picture would never appear.
 *
 * The contract:
 *   - `GALLERY_STORAGE_DIR` (default `public/uploads`) is where the files
 *     are written. It has to live inside the `public` directory.
 *   - `GALLERY_URL_PREFIX` (default `/uploads`) is the public path they are
 *     served under. It has to match where the files actually are.
 *
 * The bundler cannot statically trace a path that comes from the
 * environment, so the dynamic call is opted out of tracing: without it the
 * whole project would be traced into the deployment, which slows the build
 * and can break the size limits.
 */
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const CONFIGURED_DIR = process.env.GALLERY_STORAGE_DIR;

export const UPLOAD_DIR = CONFIGURED_DIR
  ? path.resolve(/*turbopackIgnore: true*/ CONFIGURED_DIR)
  : path.join(PUBLIC_DIR, 'uploads');

/** The public path the uploads are served under, without a trailing slash. */
export const URL_PREFIX = (process.env.GALLERY_URL_PREFIX || '/uploads').replace(/\/+$/, '');

/** True when `target` is `parent` itself or lives inside it. */
function isInside(parent, target) {
  const relative = path.relative(parent, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Whether the configured storage directory is actually served.
 *
 * A directory outside `public` is a configuration mistake, and the upload
 * route refuses to run rather than storing a picture nobody can see.
 */
export const isStorageServable = isInside(PUBLIC_DIR, UPLOAD_DIR);

/**
 * The file a stored URL points at, or null when the URL is not one of ours.
 *
 * Only URLs under the configured prefix are ours; the bundled images under
 * `/images` are part of the repository and are never deleted.
 */
export function resolveStoredFile(url) {
  const text = String(url || '');
  if (!text.startsWith(`${URL_PREFIX}/`)) return null;

  const name = text.slice(URL_PREFIX.length + 1);
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) return null;

  const target = path.resolve(UPLOAD_DIR, name);
  if (!isInside(UPLOAD_DIR, target)) return null;

  return target;
}
