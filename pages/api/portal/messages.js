import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireUser, HttpError } from '@/lib/api';

/**
 * /api/portal/messages
 *   GET  the signed-in client's own inquiries (smile check, contact, ...)
 *   POST submit a new inquiry while signed in (pre-fills name/e-mail)
 *
 * Scoped to the session user. Clients see their own history but never internal
 * notes or the staff's reply status workflow.
 */
export default apiHandler(async (req, res) => {
  const guard = await requireUser(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const userId = guard.user.id;

  if (req.method === 'GET') {
    const messages = await prisma.contactMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        source: true,
        message: true,
        smileCheckAnswers: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ messages });
  }

  if (req.method === 'POST') {
    const { message, phone } = req.body || {};
    const trimmed = String(message || '').trim();
    if (trimmed.length < 5) throw new HttpError(422, 'Please write a little more for us to work with.');

    const record = await prisma.contactMessage.create({
      data: {
        userId,
        firstName: (guard.user.name || 'Client').split(/\s+/)[0],
        lastName: (guard.user.name || 'Client').split(/\s+/).slice(1).join(' ') || '—',
        email: guard.user.email,
        phone: phone || guard.user.phone || null,
        message: trimmed,
        source: 'PORTAL',
      },
    });

    return res.status(201).json({ id: record.id, success: true });
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});