import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError, isHoneypotTripped } from '@/lib/api';
import { sendNewsletterConfirmation } from '@/lib/mailer';
import { newNewsletterToken } from '@/lib/newsletter';
import { SITE } from '@/lib/content';

/**
 * POST /api/newsletter — mailing-list signup (double opt-in).
 * GET  /api/newsletter/unsubscribe?token=… — one-click unsubscribe.
 *
 * The capability token is random and rotated on every state change, so no
 * address (or derivation of one) appears in a URL or a log line, and links
 * from an earlier state stop working.
 */

const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'E-mail is required.')
    .email('Please enter a valid e-mail address.')
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().max(120).optional(),
  source: z.string().trim().max(40).optional(),
  website: z.string().optional(),
});

export default apiHandler(
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    if (isHoneypotTripped(req.body)) {
      return res.status(200).json({ success: true, message: 'Almost done — please confirm via e-mail.' });
    }

    const data = subscribeSchema.parse(req.body ?? {});

    if (!isDatabaseConfigured) {
      console.info('[newsletter] no DATABASE_URL configured, subscription not persisted:', data.email);
      return res.status(200).json({ success: true, persisted: false });
    }

    // A new subscriber starts inactive. Rotating the token on re-subscribe
    // invalidates every earlier confirmation and unsubscribe link, and
    // clearing confirmedAt makes the address pending again so a deliberate
    // confirmation is required. An unsubscribed row stays inactive until
    // that confirmation arrives.
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: data.email },
      update: {
        name: data.name ?? undefined,
        source: data.source ?? 'footer',
        unsubscribeToken: newNewsletterToken(),
        confirmedAt: null,
      },
      create: {
        email: data.email,
        name: data.name ?? null,
        source: data.source ?? 'footer',
        unsubscribeToken: newNewsletterToken(),
        active: false,
        confirmedAt: null,
      },
    });

    // Use the stored token: an existing row keeps the value written above, so
    // the link always matches the row the confirm endpoint looks up.
    const confirmUrl = `${SITE.url}/newsletter/confirm?token=${subscriber.unsubscribeToken}`;
    const delivery = await sendNewsletterConfirmation({ email: data.email, confirmUrl });

    // Never claim a confirmation e-mail was sent when delivery did not happen.
    // The row stays pending, so a later successful signup can retry cleanly.
    if (!delivery.sent) {
      throw new HttpError(503, 'We could not send the confirmation e-mail. Please try again later.');
    }

    return res.status(201).json({
      success: true,
      message: 'Almost done — please confirm your subscription via the e-mail we just sent you.',
    });
  },
  { rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 } },
);
