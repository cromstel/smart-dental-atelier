import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { audit } from '@/lib/audit';

/** /api/admin/messages/[id] — DELETE a single inquiry. */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE']);

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid message id.');

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Message not found.');

  await prisma.contactMessage.delete({ where: { id } });
  await audit({ userId: guard.user.id, action: 'delete', entity: 'ContactMessage', entityId: id });

  return res.status(200).json({ success: true, deleted: id });
});