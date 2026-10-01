import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireUser, HttpError } from '@/lib/api';
import { profileSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';

/**
 * GET/PUT /api/portal/profile — the client updates their own details.
 *
 * The body is validated with `profileSchema`, which has no `role` field, so a
 * client cannot promote themselves through their own portal even if they post
 * one: Zod strips unknown keys and the update payload is built explicitly.
 */
export default apiHandler(async (req, res) => {
  const guard = await requireUser(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: guard.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    const data = profileSchema.parse(req.body ?? {});

    // Only include keys the client actually sent, so a partial update never
    // clears a field that was simply omitted.
    const payload = {};
    if (data.name !== undefined && data.name !== null) payload.name = data.name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.phone !== undefined) payload.phone = data.phone || null;
    if (data.password) payload.password = await hashPassword(data.password);

    if (payload.email && payload.email !== guard.user.email) {
      const taken = await prisma.user.findUnique({ where: { email: payload.email }, select: { id: true } });
      if (taken && taken.id !== guard.user.id) {
        throw new HttpError(409, 'That e-mail address is already in use.');
      }
    }

    if (Object.keys(payload).length === 0) throw new HttpError(422, 'Nothing to update.');

    const user = await prisma.user.update({
      where: { id: guard.user.id },
      data: payload,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return res.status(200).json(user);
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
});