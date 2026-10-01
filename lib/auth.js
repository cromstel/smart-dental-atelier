import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from './prisma';

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

  // Best-effort; a failure here must not block the login.
  prisma.user
    .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    .catch(() => {});

  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  };
}