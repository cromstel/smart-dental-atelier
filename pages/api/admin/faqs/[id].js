import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { faqSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

/** /api/admin/faqs/[id] — PUT / DELETE. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid FAQ id.');

  const existing = await prisma.faq.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'FAQ not found.');

  if (req.method === 'PUT') {
    const data = faqSchema.parse(req.body ?? {});

    const faq = await prisma.faq.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        order: data.order,
        published: data.published,
      },
    });

    await audit({ userId: guard.user.id, action: 'replace', entity: 'Faq', entityId: id });

    return res.status(200).json(faq);
  }

  if (req.method === 'DELETE') {
    await prisma.faq.delete({ where: { id } });
    await audit({ userId: guard.user.id, action: 'delete', entity: 'Faq', entityId: id });
    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});