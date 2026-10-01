import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton.
 *
 * `next dev` hot-reloads modules on every change, which would otherwise open a
 * new connection pool on each reload until MySQL refuses new connections.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__dentalAtelierPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__dentalAtelierPrisma = prisma;
}

/**
 * True when a MySQL connection string is configured at all.
 * Used by the content layer to fall back to bundled seed content so that the
 * marketing site still builds and renders on a fresh clone / CI runner.
 */
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

/**
 * Query helper that never throws: on a missing/unreachable database we return
 * the supplied fallback. Keeps `getStaticProps` buildable without MySQL.
 *
 * @template T
 * @param {() => Promise<T>} run
 * @param {T} fallback
 * @returns {Promise<{ data: T, source: 'database' | 'fallback' }>}
 */
export async function safeQuery(run, fallback) {
  if (!isDatabaseConfigured) {
    return { data: fallback, source: 'fallback' };
  }
  try {
    const data = await run();
    return { data, source: 'database' };
  } catch (error) {
    console.error('[prisma] query failed, using bundled content:', error.message);
    return { data: fallback, source: 'fallback' };
  }
}