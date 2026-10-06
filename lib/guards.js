/**
 * Server-side guards for the two portals.
 *
 * Every protected page calls `requireAdminPage` / `requireClientPage` from
 * `getServerSideProps`, so authorisation happens on the server before any
 * private data is serialised into the page props. Client-side checks in the
 * shell are cosmetic only.
 */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { AUTH_ROUTES } from '@/lib/authRoutes';

/**
 * The signed-in account as it is *stored*, not as the token claims it.
 *
 * Exported because the sign-in pages need the same answer as the guards: a
 * session whose account was deactivated, or whose role no longer matches, must
 * not be treated as valid anywhere. Returns `{ session, user: null }` for
 * anonymous visitors and for sessions that no longer resolve to an active row.
 *
 * @param {import('next').NextApiRequest | import('http').IncomingMessage} req
 * @param {import('next').NextApiResponse | import('http').ServerResponse} res
 */
export async function getSessionUser(req, res) {
  // The shared options are mandatory here: without them NextAuth skips the
  // `session` callback and `session.user.id` would be undefined.
  const session = await getServerSession(req, res, authOptions);
  const id = Number(session?.user?.id);
  if (!id) return { session, user: null };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, phone: true, createdAt: true },
  });

  return { session, user: user && user.isActive ? user : null };
}

/** `getSessionUser` for Next's page-context shape. */
async function sessionUser(ctx) {
  return getSessionUser(ctx.req, ctx.res);
}

/**
 * Protects `/admin/*`. Returns a redirect object for Next, or `{ props }`.
 *
 * Anonymous visitors and staff alike go to the *admin* sign-in page — an
 * administrator never authenticates through `/auth/login`.
 * @returns {Promise<{props: object} | {redirect: object}>}
 */
export async function requireAdminPage(ctx, extraProps = {}) {
  const { session, user } = await sessionUser(ctx);

  if (!session) {
    return { redirect: { destination: `${AUTH_ROUTES.admin}?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  }
  if (!user) {
    // The account was deactivated (or deleted) while the cookie was still
    // valid; signing in again is the only fix, so say which one it is.
    return { redirect: { destination: `${AUTH_ROUTES.admin}?error=inactive`, permanent: false } };
  }
  if (user.role !== 'ADMIN') {
    // A client session is not an authentication problem — hand them the staff
    // sign-in page with the destination preserved, so signing in with the
    // right account lands them where they were going.
    return {
      redirect: {
        destination: `${AUTH_ROUTES.admin}?error=AccessDenied&callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...extraProps,
    },
  };
}

/**
 * Protects `/portal/*`. Admins are allowed through (they often need to check
 * what a client sees) but the page renders client-scoped data either way.
 *
 * Everyone without a usable session goes to the *client* sign-in page.
 */
export async function requireClientPage(ctx, extraProps = {}) {
  const { session, user } = await sessionUser(ctx);

  if (!session) {
    return { redirect: { destination: `${AUTH_ROUTES.client}?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  }
  if (!user) {
    return { redirect: { destination: `${AUTH_ROUTES.client}?error=inactive`, permanent: false } };
  }

  return {
    props: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
      ...extraProps,
    },
  };
}

/** Standard pagination parsing for the admin list screens. */
export function parsePagination(query, { defaultSize = 20, maxSize = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, Number.parseInt(query.pageSize, 10) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}