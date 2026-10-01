import { isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { getDashboardStats } from '@/lib/cms';

/** /api/admin/dashboard — the metric tiles and the two "needs attention" lists. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;

  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const stats = await getDashboardStats();
  if (isDatabaseConfigured && !stats.available) {
    throw new HttpError(503, 'Could not read dashboard statistics.');
  }

  return res.status(200).json(stats);
});