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

async function sessionUser(ctx) {
  // The shared options are mandatory here: without them NextAuth skips the
  // `session` callback and `session.user.id` would be undefined.
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const id = Number(session?.user?.id);
  if (!id) return { session, user: null };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, phone: true, createdAt: true },
  });

  return { session, user: user && user.isActive ? user : null };
}

/**
 * Protects `/admin/*`. Returns a redirect object for Next, or `{ props }`.
 * @returns {Promise<{props: object} | {redirect: object}>}
 */
export async function requireAdminPage(ctx, extraProps = {}) {
  const { session, user } = await sessionUser(ctx);

  if (!session) {
    return { redirect: { destination: `/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  }
  if (!user || user.role !== 'ADMIN') {
    return { redirect: { destination: '/?error=forbidden', permanent: false } };
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
 */
export async function requireClientPage(ctx, extraProps = {}) {
  const { session, user } = await sessionUser(ctx);

  if (!session) {
    return { redirect: { destination: `/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  }
  if (!user) {
    return { redirect: { destination: '/login?error=inactive', permanent: false } };
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