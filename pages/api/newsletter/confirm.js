import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { newNewsletterToken, isValidNewsletterToken } from '@/lib/newsletter';

/**
 * POST /api/newsletter/confirm — activate a subscriber after double opt-in.
 *
 * This is deliberately a POST, reached from a page the visitor opened by
 * following the e-mail link. A GET would let a mail provider's link scanner
 * prefetch the URL and confirm on the recipient's behalf, which defeats
 * explicit consent.
 *
 * Activation is an atomic conditional update keyed on the current token and
 * an unconfirmed state. If an unsubscribe or a re-subscribe happened between
 * reading the row and writing it, the token no longer matches and the update
 * affects zero rows — the stale link cannot reactivate an opted-out address.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const token = String(req.body?.token || '');
  if (!isValidNewsletterToken(token)) {
    throw new HttpError(400, 'That confirmation link is not valid.');
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) throw new HttpError(404, 'That confirmation link is no longer valid.');

  // Ever confirmed, including after an unsubscribe: keep the stored state and
  // the original confirmation time. Rotation means an old token would not
  // reach this branch anyway, but the explicit check keeps the intent clear.
  if (subscriber.confirmedAt) {
    return res.status(200).json({
      success: true,
      message: 'Your subscription is already confirmed.',
    });
  }

  // Activation and rotation happen in one conditional write: the link is
  // single-use, and an unsubscribe/re-subscribe that rotated the token after
  // the read makes this update affect zero rows instead of reactivating an
  // address that opted out.
  const result = await prisma.newsletterSubscriber.updateMany({
    where: { id: subscriber.id, unsubscribeToken: token, confirmedAt: null },
    data: {
      active: true,
      confirmedAt: new Date(),
      unsubscribeToken: newNewsletterToken(),
    },
  });

  if (result.count === 0) {
    // Lost a race with unsubscribe/re-subscribe, or the link was used twice.
    return res.status(200).json({
      success: true,
      message: 'This confirmation link was already used or replaced.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Thank you — your subscription is confirmed.',
  });
});
