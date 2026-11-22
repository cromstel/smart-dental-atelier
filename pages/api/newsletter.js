import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, isHoneypotTripped } from '@/lib/api';
import { sendNewsletterConfirmation } from '@/lib/mailer';
import { SITE } from '@/lib/content';

/**
 * POST /api/newsletter  — mailing-list signup (double opt-in).
 * GET  /api/newsletter/unsubscribe?token=… — one-click unsubscribe.
 *
 * The unsubscribe token is a SHA-256 of the address plus a server-only pepper,
 * so the URL does not expose plain e-mail addresses in logs or referrers.
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

function unsubscribeToken(email) {
  // The pepper makes the token unguessable; it must be stable across restarts
  // or the links in already-sent e-mails stop working. `NEXTAUTH_SECRET` is
  // required for the app to run, so it doubles as the pepper. The fallback is
  // a per-process random value: dev-only, and it changes on restart rather
  // than being a hardcoded secret in the repository.
  const pepper =
    process.env.NEXTAUTH_SECRET ||
    process.env.UNSUBSCRIBE_PEPPER ||
    crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(`${email}:${pepper}`).digest('hex');
}

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

    const token = unsubscribeToken(data.email);

    // A new subscriber starts inactive. An existing subscriber keeps whatever
    // state they are in: re-subscribing must not silently re-activate an
    // address that was unsubscribed, and an already-confirmed address stays
    // confirmed. Only the confirm endpoint may set `active: true`.
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: data.email },
      update: { name: data.name ?? undefined, source: data.source ?? 'footer' },
      create: {
        email: data.email,
        name: data.name ?? null,
        source: data.source ?? 'footer',
        unsubscribeToken: token,
        active: false,
        confirmedAt: null,
      },
    });

    // Use the *stored* token, not the freshly computed one: an address that
    // subscribed before keeps its original token, and the two differ whenever
    // the pepper was a per-process random value (dev without NEXTAUTH_SECRET).
    // A link built from the new token would not match the row the confirm and
    // unsubscribe endpoints look up.
    const confirmUrl = `${SITE.url}/api/newsletter/confirm?token=${subscriber.unsubscribeToken}`;
    await sendNewsletterConfirmation({ email: data.email, confirmUrl });

    return res.status(201).json({
      success: true,
      message: 'Almost done — please confirm your subscription via the e-mail we just sent you.',
    });
  },
  { rateLimit: { limit: 5, windowMs: 10 * 60 * 1000 } },
);