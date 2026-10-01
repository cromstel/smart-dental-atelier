import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, isHoneypotTripped, isTooFast, silentlyRejectSpam } from '@/lib/api';
import { contactSchema } from '@/lib/validation';
import { notifyMessage } from '@/lib/mailer';

/**
 * POST /api/contact
 * Public contact form (Contact Us page, FAQ "Ask a question", subpages).
 * Body: { firstName, lastName, email, phone?, message, website?, referrer?, _t? }
 */
export default apiHandler(
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const body = contactSchema.parse(req.body ?? {});
    // `website` and `_t` are anti-bot fields, not content. Zod strips keys it
    // does not know about, so they are read from the raw body, not from `body`.
    const { referrer, ...clean } = body;

    if (isHoneypotTripped(req.body) || isTooFast(req.body?._t)) {
      return silentlyRejectSpam(res);
    }

    if (!isDatabaseConfigured) {
      // Keeps local development usable without a MySQL server.
      console.info('[contact] no DATABASE_URL configured, message not persisted:', clean);
      return res.status(200).json({
        success: true,
        message: 'Thank you - your message has been received.',
        persisted: false,
      });
    }

    const message = await prisma.contactMessage.create({
      data: {
        firstName: clean.firstName,
        lastName: clean.lastName,
        email: clean.email,
        phone: clean.phone ?? null,
        message: clean.message,
        source: 'CONTACT',
        referrer: referrer ?? null,
        isSpam: false,
      },
    });

    // Notification is best-effort and never delays the response.
    notifyMessage(message).catch((error) => console.error('[contact] notify failed:', error.message));

    return res.status(201).json({
      success: true,
      id: message.id,
      message: 'Thank you. Your message has reached our laboratory — we usually reply within one working day.',
    });
  },
  {
    // 5 submissions per 10 minutes per IP.
    rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 },
  },
);