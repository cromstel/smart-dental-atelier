import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { serviceSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

/** /api/admin/services — the Products & Materials / Services catalogue. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 50 });
    const where = req.query.category ? { category: String(req.query.category) } : {};

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({ where, orderBy: [{ category: 'asc' }, { order: 'asc' }], skip, take }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      services,
    });
  }

  if (req.method === 'POST') {
    const data = serviceSchema.parse(req.body ?? {});

    try {
      const service = await prisma.service.create({
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

      await audit({ userId: guard.user.id, action: 'create', entity: 'Service', entityId: service.id });

      return res.status(201).json(service);
    } catch (error) {
      if (error.code === 'P2002') throw new HttpError(409, 'That slug is already in use.');
      throw error;
    }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});