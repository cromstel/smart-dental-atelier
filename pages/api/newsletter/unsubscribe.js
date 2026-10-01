import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';

/** GET /api/newsletter/unsubscribe?token=<sha256> */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const token = String(req.query.token || '');
  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new HttpError(400, 'That unsubscribe link is not valid.');
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) throw new HttpError(404, 'That unsubscribe link is not valid.');

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { active: false },
  });

  return res.status(200).json({
    success: true,
    message: 'You have been unsubscribed. Sorry to see you go!',
  });
});