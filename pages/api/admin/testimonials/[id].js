import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { testimonialSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

/** /api/admin/testimonials/[id] — PUT / DELETE. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid testimonial id.');

  const existing = await prisma.testimonial.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Testimonial not found.');

  if (req.method === 'PUT') {
    const data = testimonialSchema.parse(req.body ?? {});

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        author: data.author,
        treatment: data.treatment ?? null,
        quote: data.quote,
        image: data.image ?? null,
        order: data.order,
        published: data.published,
      },
    });

    await audit({ userId: guard.user.id, action: 'replace', entity: 'Testimonial', entityId: id });

    return res.status(200).json(testimonial);
  }

  if (req.method === 'DELETE') {
    await prisma.testimonial.delete({ where: { id } });
    await audit({ userId: guard.user.id, action: 'delete', entity: 'Testimonial', entityId: id });
    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});