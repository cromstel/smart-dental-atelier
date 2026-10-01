import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { pageSchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { PAGES } from '@/lib/content';

/**
 * /api/admin/pages — the SEO metadata behind each marketing page.
 *
 * Only `slug`, title/description/heading/image and the two boolean flags are
 * writable. The route is deliberately not a generic CRUD: a route cannot be
 * invented from this endpoint, only an existing page in `lib/content.js` can
 * be re-declared, which prevents an admin from creating orphan pages.
 */
const KNOWN_SLUGS = new Set(PAGES.map((page) => page.key));

export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const rows = await prisma.page.findMany({ orderBy: { slug: 'asc' } });
    return res.status(200).json({ pages: rows });
  }

  if (req.method === 'PUT') {
    const { slug, ...rest } = req.body || {};
    const key = String(slug || '').replace(/^\/+|\/+$/g, '') || 'home';

    if (!KNOWN_SLUGS.has(key)) {
      throw new HttpError(422, `"${key}" is not a page of this site.`);
    }

    const data = pageSchema.parse(rest);

    const page = await prisma.page.upsert({
      where: { slug: key },
      update: {
        title: data.title,
        description: data.description,
        heading: data.heading ?? null,
        image: data.image ?? null,
        noIndex: data.noIndex,
        published: data.published,
      },
      create: {
        slug: key,
        title: data.title,
        description: data.description,
        heading: data.heading ?? null,
        image: data.image ?? null,
        noIndex: data.noIndex,
        published: data.published,
      },
    });

    await audit({
      userId: guard.user.id,
      action: 'update',
      entity: 'Page',
      entityId: page.id,
      payload: { slug: key },
    });

    return res.status(200).json(page);
  }

  return methodNotAllowed(res, ['GET', 'PUT']);
});