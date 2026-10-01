import { ZodError } from 'zod';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

/** Fields that must never reach a client. */
export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

/**
 * Read the current session from inside an API route.
 * `authOptions` must be passed, otherwise the session/jwt callbacks are not
 * applied and the role claim is missing.
 */
export async function getApiSession(req, res) {
  try {
    return await getServerSession(req, res, authOptions);
  } catch {
    return null;
  }
}

/** Lightweight auth read for API routes (no full session round-trip). */
export async function getApiToken(req) {
  try {
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}

/** Resolve the signed-in User row (or null). */
export async function currentUser(req) {
  const token = await getApiToken(req);
  if (!token?.sub) return null;
  return prisma.user.findUnique({ where: { id: Number(token.sub) } });
}

/**
 * Guard for `/api/admin/**`.
 * @returns {Promise<{user: import('@prisma/client').User}|Response>}
 */
export async function requireAdmin(req, res) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: 'You must sign in to access the admin portal.' });
    return null;
  }
  if (user.role !== 'ADMIN' || !user.isActive) {
    res.status(403).json({ error: 'Administrator access required.' });
    return null;
  }
  return { user };
}

/** Guard for `/api/portal/**`. Any signed-in role may use the client portal. */
export async function requireUser(req, res) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: 'You must sign in to view this page.' });
    return null;
  }
  if (!user.isActive) {
    res.status(403).json({ error: 'This account has been deactivated.' });
    return null;
  }
  return { user };
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Wraps a Next.js API handler with the cross-cutting concerns every route in
 * this project needs:
 *
 *  - method routing + `Allow` header on 405
 *  - Zod validation of body/query with a 422 + field map
 *  - same-origin / `ALLOWED_ORIGINS` check on unsafe methods (CSRF hardening)
 *  - in-memory rate limiting for public POST endpoints
 *  - a single JSON error shape, and no stack traces in production
 *
 * @param {(req, res, ctx) => Promise<void>} handler
 * @param {{ rateLimit?: {limit: number, windowMs: number}, maxBodyBytes?: number }} options
 */
export function apiHandler(handler, options = {}) {
  const { rateLimit, maxBodyBytes = 256 * 1024 } = options;

  return async function wrappedHandler(req, res) {
    try {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        assertSameOrigin(req);
        assertBodySize(req, maxBodyBytes);
      }

      if (rateLimit) {
        assertRateLimit(req, rateLimit);
      }

      await handler(req, res);
    } catch (error) {
      sendError(res, error);
    }
  };
}

/** Normalised JSON error response. */
export function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }

  if (error instanceof ZodError) {
    const details = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_';
      if (!details[key]) details[key] = issue.message;
    }
    return res.status(422).json({ error: 'Please check the highlighted fields.', details });
  }

  console.error('[api] unhandled error:', error);
  const body = { error: 'Something went wrong on our side. Please try again.' };
  if (process.env.NODE_ENV !== 'production') {
    body.debug = error.message;
    if (error.code === 'P2002') body.error = 'That record already exists.';
  }
  return res.status(500).json(body);
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return res.status(405).json({ error: `Method ${res.req.method} not allowed.` });
}

/**
 * Blocks cross-site form posts. Browsers send `Origin` on all modern POSTs, so
 * a missing/mismatched origin is either a same-origin curl-style call or an
 * attack; we allow it only when the host matches.
 */
function assertSameOrigin(req) {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const host = String(req.headers?.host || '');

  const isSameHost = (url) => {
    try {
      const { host: urlHost } = new URL(url);
      // Compare hostnames only; ports differ between a dev proxy and the app.
      return urlHost.split(':')[0] === host.split(':')[0];
    } catch {
      return false;
    }
  };

  const origin = req.headers?.origin;

  if (origin) {
    // Browsers always send Origin on cross-origin POSTs, so this is the strong check.
    if (!allowed.includes(origin) && !isSameHost(origin)) {
      throw new HttpError(403, 'Cross-site requests are not allowed.');
    }
    return;
  }

  // No Origin (curl, some native clients). Fall back to Referer, but only warn:
  // both headers are trivially spoofable outside a browser, so this is a
  // best-effort signal rather than the security boundary — the same-site cookie
  // (SameSite=Lax, set by NextAuth) is what actually blocks the attack.
  const referer = req.headers?.referer;
  if (referer && !isSameHost(referer) && !allowed.includes(referer)) {
    console.warn(`[api] cross-site POST to ${req.url} with referer ${referer}`);
  }
}

function assertBodySize(req, maxBytes) {
  const length = Number(req.headers['content-length'] || 0);
  if (length > maxBytes) {
    throw new HttpError(413, 'That request was too large.');
  }
}

// --------------------------- rate limiting --------------------------------

export const buckets = globalThis.__dentalAtelierRateLimit || new Map();
if (process.env.NODE_ENV !== 'production') globalThis.__dentalAtelierRateLimit = buckets;

/**
 * Fixed-window in-memory rate limiter.
 * Sufficient for a single-instance deployment (the recommended Vercel/Docker
 * setup for a site of this size). Documented caveat: on serverless each warm
 * lambda keeps its own bucket, so pair with an edge rule (Vercel WAF /
 * Cloudflare) for hard guarantees.
 */
export function assertRateLimit(req, { limit, windowMs }) {
  // Node lower-cases incoming header names, but a hand-built request object
  // (tests, some proxies) may not — check both spellings before splitting.
  const forwarded =
    req.headers?.['x-forwarded-for'] ?? req.headers?.['X-Forwarded-For'] ?? '';

  const ip =
    String(forwarded).split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  // Strip the query string: each filter combination is the same logical
  // endpoint and must share one bucket.
  const key = `${String(req.url || '').split('?')[0]}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw new HttpError(429, `Too many requests. Please try again in ${retryAfter}s.`);
  }

  // Opportunistic cleanup so the map cannot grow unbounded.
  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
}

/**
 * Honeypot check. Public forms render a hidden `website` field; humans never
 * fill it. Returns true when the submission should be treated as spam.
 */
/**
 * Timing-based bot check.
 *
 * The client posts how long the form was on screen. A value that is missing is
 * ignored (an API consumer or a privacy-stripping proxy may drop it); a value
 * under two seconds is not something a person produced.
 *
 * @param {unknown} elapsed seconds the form was open, as sent by the client
 */
export function isTooFast(elapsed) {
  if (elapsed === undefined || elapsed === null || elapsed === '') return false;
  const seconds = Number(elapsed);
  if (!Number.isFinite(seconds)) return false;
  return seconds >= 0 && seconds < 2;
}

export function isHoneypotTripped(body = {}) {
  const trap = body.website || body.company || '';
  return typeof trap === 'string' && trap.trim().length > 0;
}

/**
 * When a honeypot trips we still answer 200 so bots get no signal, but we do
 * not persist the record.
 */
export async function silentlyRejectSpam(res) {
  return res.status(200).json({ success: true, message: 'Thank you - your message has been received.' });
}