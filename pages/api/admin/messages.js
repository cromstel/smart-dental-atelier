import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError, escapeLike } from '@/lib/api';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';
import { messageStatusSchema } from '@/lib/validation';

/** /api/admin/messages — the shared inbox for every public form. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 25 });
    const where = {};

    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.source) where.source = String(req.query.source).toUpperCase();
    if (req.query.q) {
      // Escaped: `%` and `_` are LIKE wildcards.
      const needle = escapeLike(String(req.query.q).trim());
      where.OR = [
        { firstName: { contains: needle } },
        { lastName: { contains: needle } },
        { email: { contains: needle } },
        { message: { contains: needle } },
      ];
    }

    const [total, messages, counts] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(counts.map((entry) => [entry.status, entry._count._all])),
      messages,
    });
  }

  if (req.method === 'PATCH') {
    // The id and the date are validated: `Number('abc')` and
    // `new Date('nonsense')` used to reach the driver and answer 500.
    const { id, status, repliedAt } = messageStatusSchema.parse(req.body ?? {});

    const data = {};
    if (status !== undefined) data.status = status;
    if (repliedAt !== undefined) data.repliedAt = repliedAt;
    // Marking as answered implies a reply was sent.
    if (status === 'ANSWERED' && repliedAt === undefined) data.repliedAt = new Date();
    if (Object.keys(data).length === 0) throw new HttpError(422, 'Nothing to update.');

    const message = await prisma.contactMessage.update({ where: { id }, data });

    await audit({ userId: guard.user.id, action: 'update', entity: 'ContactMessage', entityId: id, payload: data });

    return res.status(200).json(message);
  }

  return methodNotAllowed(res, ['GET', 'PATCH']);
});