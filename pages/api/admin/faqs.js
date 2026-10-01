import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { faqSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

/** /api/admin/faqs — GET / POST. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 50 });

    const [total, faqs] = await Promise.all([
      prisma.faq.count(),
      prisma.faq.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }], skip, take }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      faqs,
    });
  }

  if (req.method === 'POST') {
    const data = faqSchema.parse(req.body ?? {});

    const faq = await prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        order: data.order,
        published: data.published,
      },
    });

    await audit({ userId: guard.user.id, action: 'create', entity: 'Faq', entityId: faq.id });

    return res.status(201).json(faq);
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});