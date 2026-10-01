import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const BCRYPT_ROUNDS = 12;

/** Hash a plaintext password with bcrypt. */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Constant-time-ish comparison of a plaintext password against a stored hash. */
export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Concurrent-write guard for MariaDB / MySQL.
 *
 * MariaDB rejects a write whose row was modified by another connection since
 * this transaction read it — error 1020, "Record has changed since last read".
 * It is a transient, retryable condition (the same class as deadlock 1213),
 * not a data problem: the row still holds a valid value, our read was just
 * stale.
 *
 * Prisma 7 routes every query through the driver adapter, so this now surfaces
 * on writes the previous Rust engine handled. Retry with jittered backoff so
 * contenders do not re-collide in lockstep.
 *
 * `SELECT ... FOR UPDATE` would also serialise the writers, but it cannot be
 * applied to a single-statement `update`, so retrying is the correct tool.
 */

/** MariaDB/MySQL error codes that are safe to retry. */
const TRANSIENT_DB_CODES = new Set([
  1020, // Record has changed since last read
  1213, // Deadlock found
  1205, // Lock wait timeout
]);

function transientDbCode(error) {
  const cause = error?.meta?.driverAdapterError?.cause;
  return typeof cause?.originalCode === 'number' ? cause.originalCode : null;
}

export function isTransientDbError(error) {
  const code = transientDbCode(error);
  return code !== null && TRANSIENT_DB_CODES.has(code);
}

/**
 * Runs a Prisma write, retrying transient concurrency failures.
 *
 * @template T
 * @param {() => Promise<T>} operation
 * @param {{attempts?: number, baseDelayMs?: number}} [options]
 * @returns {Promise<T>}
 */
export async function withWriteRetry(operation, { attempts = 4, baseDelayMs = 20 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientDbError(error) || attempt === attempts) throw error;

      // Jittered exponential backoff: without the random factor, simultaneous
      // retries re-collide and the whole batch fails together.
      const delay = baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random());
       
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable: the loop either returns or throws.
  throw new Error('withWriteRetry exhausted without a result');
}

/**
 * NextAuth `authorize` implementation for the Credentials provider.
 * Returns a minimal user object or `null` (NextAuth shows "Invalid credentials").
 *
 * Passwords are never compared unless a hash exists, so OAuth-only accounts
 * cannot be logged into with a blank password.
 */
export async function authorizeCredentials({ email, password }) {
  if (!email || !password) return null;
  if (!isDatabaseConfigured) return null;

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });

  if (!user || !user.password || !user.isActive) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  // Best-effort; a failure here must not block the login. The same row is
  // written by the `signIn` event, so the retry guard matters here.
  withWriteRetry(() =>
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ).catch(() => {});

  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}