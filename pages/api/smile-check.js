import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, isHoneypotTripped, isTooFast, silentlyRejectSpam } from '@/lib/api';
import { smileCheckSchema } from '@/lib/validation';
import { notifyMessage } from '@/lib/mailer';

/**
 * POST /api/smile-check
 * Smile-check submissions. Stores the ticked question ids alongside the
 * inquiry so the studio can see what brought the visitor in.
 */
export default apiHandler(
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const body = smileCheckSchema.parse(req.body ?? {});
    // Anti-bot fields are read from the raw body: Zod drops unknown keys, so
    // `_t` would no longer be on the parsed object.
    const { referrer, answers, ...clean } = body;

    if (isHoneypotTripped(req.body) || isTooFast(req.body?._t)) {
      return silentlyRejectSpam(res);
    }

    const answerText = Array.isArray(answers) && answers.length > 0
      ? answers.join(',')
      : null;

    if (!isDatabaseConfigured) {
      console.info('[smile-check] no DATABASE_URL configured, submission not persisted:', clean);
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
          'Smile check submitted from the website without additional notes.',
        source: 'SMILE_CHECK',
        smileCheckAnswers: answerText,
        referrer: referrer ?? null,
      },
    });

    notifyMessage(message).catch((error) => console.error('[smile-check] notify failed:', error.message));

    const count = answers?.length ?? 0;

    return res.status(201).json({
      success: true,
      id: message.id,
      message: `Thank you. We have received your smile check${
        count > 0 ? ` with ${count} concern${count === 1 ? '' : 's'} noted` : ''
      }. A laboratory technician will contact you to arrange your free consultation.`,
    });
  },
  { rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 } },
);