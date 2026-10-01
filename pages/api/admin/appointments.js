import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { audit } from '@/lib/audit';
import { withWriteRetry } from '@/lib/auth';
import { parsePagination } from '@/lib/guards';

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
      const needle = String(req.query.q).trim();
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
    const { firstName, lastName, email, phone, preferredDate, scheduledAt, type, notes, internalNotes, serviceId } =
      req.body || {};

    if (!firstName || !lastName || !email) {
      throw new HttpError(422, 'First name, surname and e-mail are required.');
    }
    if (type && !TYPES.includes(type)) throw new HttpError(422, 'Unknown appointment type.');

    const appointment = await prisma.appointment.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        type: type || 'CONSULTATION',
        notes: notes ? String(notes) : null,
        internalNotes: internalNotes ? String(internalNotes) : null,
        serviceId: serviceId ? Number(serviceId) : null,
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
    const { id, ...changes } = req.body || {};
    if (!id) throw new HttpError(422, 'An appointment id is required.');

    // A stale table row (deleted by another admin, or an id from an old page)
    // otherwise surfaces as Prisma P2025 and a generic 500. Confirm the record
    // exists so the caller gets a 404 with a usable message.
    const existing = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, 'Appointment not found.');

    const data = {};
    if (changes.status) {
      if (!STATUSES.includes(changes.status)) throw new HttpError(422, 'Unknown status.');
      data.status = changes.status;
    }
    if ('scheduledAt' in changes) {
      data.scheduledAt = changes.scheduledAt ? new Date(changes.scheduledAt) : null;
    }
    if ('internalNotes' in changes) data.internalNotes = changes.internalNotes || null;
    if ('notes' in changes) data.notes = changes.notes || null;
    if ('preferredDate' in changes) {
      data.preferredDate = changes.preferredDate ? new Date(changes.preferredDate) : null;
    }
    if ('phone' in changes) data.phone = changes.phone || null;
    if ('serviceId' in changes) data.serviceId = changes.serviceId ? Number(changes.serviceId) : null;

    if (Object.keys(data).length === 0) throw new HttpError(422, 'Nothing to update.');

    const appointment = await withWriteRetry(() =>
      prisma.appointment.update({ where: { id: Number(id) }, data }),
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