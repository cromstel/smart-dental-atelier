import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireUser, HttpError } from '@/lib/api';

/**
 * /api/portal/appointments
 *   GET  the signed-in client's own appointment requests
 *   PATCH cancel one (only while it is still PENDING or CONFIRMED)
 *
 * Every query is scoped to `userId` from the session — a client can never read
 * or cancel somebody else's request by guessing an id.
 */
export default apiHandler(async (req, res) => {
  const guard = await requireUser(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const userId = guard.user.id;

  if (req.method === 'GET') {
    const appointments = await prisma.appointment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        preferredDate: true,
        scheduledAt: true,
        notes: true,
        createdAt: true,
        service: { select: { title: true } },
      },
    });

    return res.status(200).json({ appointments });
  }

  if (req.method === 'PATCH') {
    const { id, action } = req.body || {};
    if (!id) throw new HttpError(422, 'An appointment id is required.');
    if (action !== 'cancel') throw new HttpError(422, 'Only the "cancel" action is supported here.');

    const appointment = await prisma.appointment.findFirst({
      where: { id: Number(id), userId },
      select: { id: true, status: true },
    });
    if (!appointment) throw new HttpError(404, 'Appointment request not found.');

    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new HttpError(409, 'This appointment can no longer be cancelled online — please call us.');
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED' },
    });

    return res.status(200).json(updated);
  }

  return methodNotAllowed(res, ['GET', 'PATCH']);
});