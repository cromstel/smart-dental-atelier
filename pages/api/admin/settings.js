import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { settingSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { SETTINGS, ENV_OWNED_SETTINGS } from '@/lib/content';

/**
 * /api/admin/settings
 *   GET all settings (admin view — includes values that are not public)
 *   PUT upsert one or many settings
 *
 * Only keys that already exist in the registry can be written, so an admin
 * cannot inject arbitrary config keys through this endpoint.
 *
 * The deployment's own values — the name, the legal name, the canonical URL
 * and the contact address — are refused: they belong to the environment, and
 * a stored row from an earlier deployment would otherwise override them.
 */
const KNOWN_KEYS = new Set(SETTINGS.map((setting) => setting.key));

export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const rows = await prisma.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
    return res.status(200).json({ settings: rows });
  }

  if (req.method === 'PUT') {
    const incoming = Array.isArray(req.body?.settings) ? req.body.settings : [req.body];

    const entries = incoming
      .filter(Boolean)
      .map((entry) => {
        const parsed = settingSchema.parse(entry);
        if (!KNOWN_KEYS.has(parsed.key)) {
          throw new HttpError(422, `Unknown setting key: ${parsed.key}`);
        }
        if (ENV_OWNED_SETTINGS.has(parsed.key)) {
          throw new HttpError(
            422,
            `${parsed.key} comes from the environment (APP_NAME, NEXT_PUBLIC_SITE_URL, CONTACT_EMAIL) and cannot be edited here.`,
          );
        }
        return { ...parsed, group: SETTINGS.find((s) => s.key === parsed.key)?.group || parsed.group };
      });

    if (entries.length === 0) throw new HttpError(422, 'No settings supplied.');

    const saved = [];
    for (const entry of entries) {
      // Sequential so `updatedAt` reflects the write order and MySQL is happy.
      saved.push(
        await prisma.setting.upsert({
          where: { key: entry.key },
          update: { value: entry.value, group: entry.group },
          create: { key: entry.key, value: entry.value, group: entry.group },
        }),
      );
    }

    await audit({
      userId: guard.user.id,
      action: 'update',
      entity: 'Setting',
      payload: { keys: entries.map((entry) => entry.key) },
    });

    return res.status(200).json({ settings: saved });
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
});