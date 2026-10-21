import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { notifyAppointment } from '@/lib/mailer';
import { appointmentUpdateSchema } from '@/lib/validation';

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
    // Validated before it reaches the database: an unknown status or a
    // malformed date used to fail as a driver error (a 500), which told the
    // caller nothing about which field was wrong.
    const data = appointmentUpdateSchema.parse(req.body ?? {});

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes || null } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
        ...(data.preferredDate !== undefined ? { preferredDate: data.preferredDate } : {}),
        ...(data.serviceId !== undefined ? { serviceId: data.serviceId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });

    // Only bother the client when the slot actually moved.
    const slotChanged =
      (data.scheduledAt !== undefined && String(data.scheduledAt) !== String(existing.scheduledAt)) ||
      (data.status !== undefined && data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED');

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
      payload: { status: data.status, scheduledAt: data.scheduledAt },
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