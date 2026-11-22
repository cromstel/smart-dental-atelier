import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';

/**
 * GET /api/newsletter/confirm?token=<sha256>
 *
 * The second half of the double opt-in. The token is the same capability the
 * unsubscribe link carries: it is a hash of the address plus a server-only
 * pepper, so it cannot be guessed and no plain e-mail appears in logs or
 * referrers. Only this endpoint is allowed to activate a subscriber.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const token = String(req.query.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new HttpError(400, 'That confirmation link is not valid.');
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) throw new HttpError(404, 'That confirmation link is not valid.');

  // Idempotent: following the link twice keeps the original confirmation time
  // and does not resurrect an address that was unsubscribed in between.
  if (subscriber.active && subscriber.confirmedAt) {
    return res.status(200).json({
      success: true,
      message: 'Your subscription is already confirmed.',
    });
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { active: true, confirmedAt: new Date() },
  });

  return res.status(200).json({
    success: true,
    message: 'Thank you — your subscription is confirmed.',
  });
});
