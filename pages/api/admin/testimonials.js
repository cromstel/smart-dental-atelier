import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { testimonialSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

/** /api/admin/testimonials — GET (list) / POST (create). */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 25 });

    const [total, testimonials] = await Promise.all([
      prisma.testimonial.count(),
      prisma.testimonial.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }], skip, take }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      testimonials,
    });
  }

  if (req.method === 'POST') {
    const data = testimonialSchema.parse(req.body ?? {});

    const testimonial = await prisma.testimonial.create({
      data: {
        author: data.author,
        treatment: data.treatment ?? null,
        quote: data.quote,
        image: data.image ?? null,
        order: data.order,
        published: data.published,
      },
    });

    await audit({
      userId: guard.user.id,
      action: 'create',
      entity: 'Testimonial',
      entityId: testimonial.id,
    });

    return res.status(201).json(testimonial);
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});