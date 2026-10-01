import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Prisma client singleton.
 *
 * Prisma 7 imports the generated client from `generated/prisma` (the generator
 * no longer writes into node_modules) and requires a driver adapter, so the
 * connection is created through `PrismaMariaDb`.
 *
 * `next dev` hot-reloads modules on every change; without caching the instance
 * on `globalThis`, each reload would open a new connection pool until MySQL
 * refuses new connections.
 */
const globalForPrisma = globalThis;

/**
 * Builds the driver adapter.
 *
 * `PrismaMariaDb` accepts a `mariadb.PoolConfig` or a connection string — it
 * does *not* accept `{ connectionString }`, and passing that object makes the
 * driver silently fall back to its defaults, which then fail with a pool
 * timeout rather than a configuration error. Pool sizing is set explicitly
 * because driver adapters take it from the driver, and the mariadb driver
 * defaults to unlimited connections.
 *
 * @param {{connectionLimit?: number}} [options]
 */
export function createMariaDbAdapter({ connectionLimit = 5 } = {}) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const parsed = new URL(url);

  return new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    // Percent-encoded credentials in the URL must be decoded before use.
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectionLimit,
    connectTimeout: 5000,
  });
}

function createClient() {
  return new PrismaClient({
    adapter: createMariaDbAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.__dentalAtelierPrisma ?? createClient();

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