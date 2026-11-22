import crypto from 'node:crypto';

/**
 * Capability token for a newsletter subscription.
 *
 * The token is random rather than derived from the address: it carries no
 * personal data and is unguessable. Every state change (subscribe again,
 * unsubscribe) rotates it, so a link from an earlier state can no longer act
 * on the row. That is what makes replay and read/write races safe without a
 * schema migration — a stale token simply matches no row.
 */
export function newNewsletterToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Shape check for tokens arriving in a URL. */
export function isValidNewsletterToken(token) {
  return /^[a-f0-9]{64}$/.test(String(token || ''));
}
