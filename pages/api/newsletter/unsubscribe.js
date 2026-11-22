import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { newNewsletterToken, isValidNewsletterToken } from '@/lib/newsletter';

/**
 * GET /api/newsletter/unsubscribe?token=<capability>
 *
 * Rotating the token on opt-out makes every earlier confirmation and
 * unsubscribe link inert. That is what stops an old e-mail from silently
 * reversing an unsubscribed row.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const token = String(req.query.token || '');
  if (!isValidNewsletterToken(token)) {
    throw new HttpError(400, 'That unsubscribe link is not valid.');
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!subscriber) throw new HttpError(404, 'That unsubscribe link is not valid.');

  await prisma.newsletterSubscriber.updateMany({
    where: { id: subscriber.id, unsubscribeToken: token },
    data: { active: false, unsubscribeToken: newNewsletterToken() },
  });

  return res.status(200).json({
    success: true,
    message: 'You have been unsubscribed. Sorry to see you go!',
  });
});
