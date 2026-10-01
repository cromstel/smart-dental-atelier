import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { userSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';

/**
 * /api/admin/users/[id] — PUT (profile / role / password) / DELETE.
 *
 * Two deliberate safeguards:
 *  1. an admin cannot delete or demote themselves, which is the usual way a
 *     portal ends up with zero administrators
 *  2. deactivating is offered instead of deleting, because appointments and
 *     inquiries reference the user
 */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid user id.');

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'User not found.');

  if (req.method === 'PUT') {
    const data = userSchema.parse(req.body ?? {});
    const isSelf = existing.id === guard.user.id;

    if (isSelf && data.role && data.role !== 'ADMIN') {
      throw new HttpError(422, 'You cannot remove your own administrator role.');
    }
    if (isSelf && data.isActive === false) {
      throw new HttpError(422, 'You cannot deactivate your own account.');
    }

    const otherAdmins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: id } } });
    if (existing.role === 'ADMIN' && data.role && data.role !== 'ADMIN' && otherAdmins === 0) {
      throw new HttpError(422, 'This is the last active administrator — promote someone else first.');
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name ?? null } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone ?? null } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.password ? { password: await hashPassword(data.password) } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    });

    await audit({
      userId: guard.user.id,
      action: data.password ? 'reset-password' : 'update',
      entity: 'User',
      entityId: id,
      payload: { role: user.role, isActive: user.isActive },
    });

    return res.status(200).json(user);
  }

  if (req.method === 'DELETE') {
    if (existing.id === guard.user.id) throw new HttpError(422, 'You cannot delete your own account.');

    if (existing.role === 'ADMIN') {
      const otherAdmins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: id } } });
      if (otherAdmins === 0) throw new HttpError(422, 'This is the last active administrator.');
    }

    await prisma.user.delete({ where: { id } });
    await audit({ userId: guard.user.id, action: 'delete', entity: 'User', entityId: id });

    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});