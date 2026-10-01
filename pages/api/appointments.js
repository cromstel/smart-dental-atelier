import { getToken } from 'next-auth/jwt';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, isHoneypotTripped, isTooFast, silentlyRejectSpam } from '@/lib/api';
import { appointmentSchema } from '@/lib/validation';
import { notifyAppointment } from '@/lib/mailer';

/**
 * POST /api/appointments
 * Appointment requests, used by /book-appointment and the client portal.
 *
 * Public by design (most visitors are not signed in), but when a session
 * cookie is present the request is linked to the client account so it appears
 * in their portal. Duplicate submissions within the same hour are rejected so
 * a double-clicked button does not create two slots.
 */
export default apiHandler(
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const body = appointmentSchema.parse(req.body ?? {});
    const { serviceId, ...clean } = body;

    if (isHoneypotTripped(req.body) || isTooFast(req.body?._t)) {
      return silentlyRejectSpam(res);
    }

    // Link to the signed-in client when we can, but never require a session.
    let userId = null;
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token?.sub) userId = Number(token.sub);
    } catch {
      /* anonymous */
    }

    if (!isDatabaseConfigured) {
      console.info('[appointments] no DATABASE_URL configured, request not persisted:', clean);
      return res.status(200).json({
        success: true,
        persisted: false,
        message: 'Thank you. We will call you to confirm the exact time.',
      });
    }

    // One request per email per hour.
    const recent = await prisma.appointment.findFirst({
      where: {
        email: clean.email,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: { id: true },
    });

    if (recent) {
      return res.status(409).json({
        error: 'We already received an appointment request from this e-mail address in the last hour. We will call you shortly.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        firstName: clean.firstName,
        lastName: clean.lastName,
        email: clean.email,
        phone: clean.phone ?? null,
        preferredDate: clean.preferredDate,
        type: clean.type,
        notes: clean.notes ?? null,
        serviceId: serviceId ? Number(serviceId) : null,
        userId,
        status: 'PENDING',
        source: userId ? 'portal' : 'website',
      },
    });

    notifyAppointment(appointment).catch((error) =>
      console.error('[appointments] notify failed:', error.message),
    );

    return res.status(201).json({
      success: true,
      id: appointment.id,
      message: userId
        ? 'Thank you. We will call you to confirm the exact time — the request is also listed in your portal.'
        : 'Thank you. We will call you to confirm the exact time.',
    });
  },
  { rateLimit: { limit: 4, windowMs: 10 * 60 * 1000 } },
);