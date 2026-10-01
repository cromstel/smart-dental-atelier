import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { userSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

/**
 * /api/admin/users
 *   GET  list portal users
 *   POST invite/create a user with an initial password
 *
 * Role changes and deletions live in /api/admin/users/[id].js.
 */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 25 });
    const where = {};
    if (req.query.role) where.role = String(req.query.role).toUpperCase();
    if (req.query.q) {
      const needle = String(req.query.q).trim();
      where.OR = [{ name: { contains: needle } }, { email: { contains: needle } }];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        // `password` is never selected.
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { appointments: true, messages: true } },
        },
      }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      users,
    });
  }

  if (req.method === 'POST') {
    const data = userSchema.parse(req.body ?? {});
    if (!data.password) throw new HttpError(422, 'An initial password is required.');

    const user = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email: data.email,
        phone: data.phone ?? null,
        role: data.role,
        isActive: data.isActive,
        password: await hashPassword(data.password),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    });

    await audit({ userId: guard.user.id, action: 'create', entity: 'User', entityId: user.id, payload: { role: user.role } });

    return res.status(201).json(user);
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});