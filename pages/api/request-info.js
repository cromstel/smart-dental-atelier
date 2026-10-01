import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, isHoneypotTripped, isTooFast, silentlyRejectSpam } from '@/lib/api';
import { requestInfoSchema } from '@/lib/validation';
import { notifyMessage } from '@/lib/mailer';

/**
 * POST /api/request-info
 * The four-field "Request more information" form that appears on
 * Products & Materials, Portfolio and the Facial-analysis subpage.
 *
 * `topic` selects which ContactMessage.source the record is filed under, so the
 * admin inbox can filter "who asked for the full portfolio?".
 */
const TOPIC_TO_SOURCE = {
  portfolio: 'PORTFOLIO_REQUEST',
  portfolio_request: 'PORTFOLIO_REQUEST',
  materials: 'REQUEST_INFO',
  facial_analysis: 'REQUEST_INFO',
  'facial-analysis': 'REQUEST_INFO',
  info: 'REQUEST_INFO',
  faq: 'FAQ_QUESTION',
};

export default apiHandler(
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const body = requestInfoSchema.parse(req.body ?? {});
    const { referrer, topic, ...clean } = body;

    if (isHoneypotTripped(req.body) || isTooFast(req.body?._t)) {
      return silentlyRejectSpam(res);
    }

    const source = TOPIC_TO_SOURCE[String(topic || '').toLowerCase()] || 'REQUEST_INFO';

    if (!isDatabaseConfigured) {
      console.info('[request-info] no DATABASE_URL configured, submission not persisted:', clean);
      return res.status(200).json({ success: true, persisted: false });
    }

    const message = await prisma.contactMessage.create({
      data: {
        firstName: clean.firstName,
        lastName: clean.lastName,
        email: clean.email,
        phone: clean.phone ?? null,
        message:
          clean.message ||
          `Information requested via "${topic || 'general'}" form. No additional message.`,
        source,
        // `topic` doubles as a fallback label so the inbox shows what was asked for.
        referrer: referrer ?? topic ?? null,
      },
    });

    notifyMessage(message).catch((error) => console.error('[request-info] notify failed:', error.message));

    return res.status(201).json({
      success: true,
      id: message.id,
      message: 'Thank you. We will send you the requested information shortly.',
    });
  },
  { rateLimit: { limit: 6, windowMs: 10 * 60 * 1000 } },
);