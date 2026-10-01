import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { serviceSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

/** /api/admin/services/[id] — PUT / DELETE. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid service id.');

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Service not found.');

  if (req.method === 'PUT') {
    const data = serviceSchema.parse(req.body ?? {});

    try {
      const service = await prisma.service.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          summary: data.summary,
          description: data.description,
          category: data.category,
          image: data.image ?? null,
          priceFrom: data.priceFrom ?? null,
          order: data.order,
          published: data.published,
        },
      });

      await audit({ userId: guard.user.id, action: 'replace', entity: 'Service', entityId: id });

      return res.status(200).json(service);
    } catch (error) {
      if (error.code === 'P2002') throw new HttpError(409, 'That slug is already in use.');
      throw error;
    }
  }

  if (req.method === 'DELETE') {
    // Appointments keep a soft link, so refuse while history exists.
    const linkedAppointments = await prisma.appointment.count({ where: { serviceId: id } });
    if (linkedAppointments > 0) {
      throw new HttpError(
        409,
        `This service is linked to ${linkedAppointments} appointment request(s). Unpublish it instead of deleting.`,
      );
    }

    await prisma.service.delete({ where: { id } });
    await audit({ userId: guard.user.id, action: 'delete', entity: 'Service', entityId: id });
    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});