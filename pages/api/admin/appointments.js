import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError, escapeLike } from '@/lib/api';
import { audit } from '@/lib/audit';
import { withWriteRetry } from '@/lib/auth';
import { parsePagination } from '@/lib/guards';
import { appointmentCreateSchema, appointmentPatchSchema } from '@/lib/validation';

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const TYPES = ['CONSULTATION', 'CUSTOM_SHADING', 'FACIAL_ANALYSIS', 'SMILE_DESIGN', 'TREATMENT', 'OTHER'];

/**
 * /api/admin/appointments
 *   GET    list, filterable by ?status=&type=&q=&from=&to=&page=
 *   POST   create on behalf of a client (phone bookings taken by the studio)
 *   PATCH  partial update (status, scheduledAt, internalNotes, ...)
 *
 * Full replacement (PUT/DELETE) lives in /api/admin/appointments/[id].js
 */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;

  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 25 });
    const where = {};

    if (req.query.status && STATUSES.includes(String(req.query.status))) {
      where.status = String(req.query.status);
    }
    if (req.query.type && TYPES.includes(String(req.query.type))) {
      where.type = String(req.query.type);
    }
    if (req.query.q) {
      // Escaped: `%` and `_` are LIKE wildcards, so an unescaped needle
      // would match rows the admin did not ask for.
      const needle = escapeLike(String(req.query.q).trim());
      where.OR = [
        { firstName: { contains: needle } },
        { lastName: { contains: needle } },
        { email: { contains: needle } },
        { phone: { contains: needle } },
      ];
    }
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(String(req.query.from));
      if (req.query.to) where.createdAt.lte = new Date(String(req.query.to));
    }

    const [total, appointments, counts] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: { service: { select: { id: true, title: true, slug: true } } },
      }),
      prisma.appointment.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(counts.map((entry) => [entry.status, entry._count._all])),
      appointments,
    });
  }

  if (req.method === 'POST') {
    // Validated before it reaches the database: an unknown type or a malformed
    // date used to fail as a driver error (a 500).
    const data = appointmentCreateSchema.parse(req.body ?? {});

    const appointment = await prisma.appointment.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone ?? null,
        preferredDate: data.preferredDate ?? null,
        scheduledAt: data.scheduledAt ?? null,
        type: data.type || 'CONSULTATION',
        notes: data.notes ?? null,
        internalNotes: data.internalNotes ?? null,
        serviceId: data.serviceId ?? null,
        status: 'CONFIRMED',
        source: 'admin',
      },
    });

    await audit({
      userId: guard.user.id,
      action: 'create',
      entity: 'Appointment',
      entityId: appointment.id,
      payload: { source: 'admin' },
    });

    return res.status(201).json(appointment);
  }

  if (req.method === 'PATCH') {
    // The id and every field are validated together: a malformed date or an
    // unknown status used to reach the driver and answer 500.
    const { id, ...changes } = appointmentPatchSchema.parse(req.body ?? {});

    // A stale table row (deleted by another admin, or an id from an old page)
    // otherwise surfaces as Prisma P2025 and a generic 500. Confirm the record
    // exists so the caller gets a 404 with a usable message.
    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, 'Appointment not found.');

    const data = {};
    if (changes.status !== undefined) data.status = changes.status;
    if (changes.scheduledAt !== undefined) data.scheduledAt = changes.scheduledAt;
    if (changes.internalNotes !== undefined) data.internalNotes = changes.internalNotes || null;
    if (changes.notes !== undefined) data.notes = changes.notes || null;
    if (changes.preferredDate !== undefined) data.preferredDate = changes.preferredDate;
    if (changes.phone !== undefined) data.phone = changes.phone || null;
    if (changes.serviceId !== undefined) data.serviceId = changes.serviceId;

    if (Object.keys(data).length === 0) throw new HttpError(422, 'Nothing to update.');

    const appointment = await withWriteRetry(() =>
      prisma.appointment.update({ where: { id }, data }),
    );

    await audit({
      userId: guard.user.id,
      action: 'update',
      entity: 'Appointment',
      entityId: appointment.id,
      payload: data,
    });

    return res.status(200).json(appointment);
  }

  return methodNotAllowed(res, ['GET', 'POST', 'PATCH']);
});