import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { notifyAppointment } from '@/lib/mailer';

/** /api/admin/appointments/[id] — PUT (replace editable fields) and DELETE. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid appointment id.');

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Appointment not found.');

  if (req.method === 'PUT') {
    const { firstName, lastName, email, phone, type, notes, internalNotes, scheduledAt, preferredDate, serviceId, status } =
      req.body || {};

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(firstName !== undefined ? { firstName: String(firstName).trim() } : {}),
        ...(lastName !== undefined ? { lastName: String(lastName).trim() } : {}),
        ...(email !== undefined ? { email: String(email).trim().toLowerCase() } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(internalNotes !== undefined ? { internalNotes: internalNotes || null } : {}),
        ...(scheduledAt !== undefined ? { scheduledAt: scheduledAt ? new Date(scheduledAt) : null } : {}),
        ...(preferredDate !== undefined ? { preferredDate: preferredDate ? new Date(preferredDate) : null } : {}),
        ...(serviceId !== undefined ? { serviceId: serviceId ? Number(serviceId) : null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    // Only bother the client when the slot actually moved.
    const slotChanged =
      (scheduledAt !== undefined && String(scheduledAt) !== String(existing.scheduledAt)) ||
      (status !== undefined && status === 'CONFIRMED' && existing.status !== 'CONFIRMED');

    if (slotChanged) {
      notifyAppointment(appointment).catch((error) =>
        console.error('[admin/appointments] notify failed:', error.message),
      );
    }

    await audit({
      userId: guard.user.id,
      action: 'replace',
      entity: 'Appointment',
      entityId: id,
      payload: { status, scheduledAt },
    });

    return res.status(200).json(appointment);
  }

  if (req.method === 'DELETE') {
    await prisma.appointment.delete({ where: { id } });

    await audit({
      userId: guard.user.id,
      action: 'delete',
      entity: 'Appointment',
      entityId: id,
      payload: { email: existing.email },
    });

    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});