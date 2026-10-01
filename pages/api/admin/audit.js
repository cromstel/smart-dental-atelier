import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

/**
 * /api/admin/audit — recent admin activity, for the dashboard footer.
 */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  if (!isDatabaseConfigured) {
    return res.status(200).json({ entries: [], available: false });
  }

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(100, Math.max(1, Number(req.query.take) || 25)),
  });

  return res.status(200).json({
    available: true,
    entries: entries.map((entry) => ({
      ...entry,
      createdAt: formatDateTime(entry.createdAt),
    })),
  });
});