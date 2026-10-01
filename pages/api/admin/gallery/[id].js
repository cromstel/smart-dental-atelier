import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { gallerySchema } from '@/lib/validation';
import { audit } from '@/lib/audit';

/** /api/admin/gallery/[id] — PUT (metadata only) / DELETE (record + file). */
export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid image id.');

  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Image not found.');

  if (req.method === 'PUT') {
    const data = gallerySchema.parse(req.body ?? {});

    const image = await prisma.galleryImage.update({
      where: { id },
      data: {
        title: data.title ?? null,
        // The URL itself is not editable here; re-upload to replace the file.
        altText: data.altText,
        category: data.category,
        order: data.order,
        published: data.published,
      },
    });

    await audit({ userId: guard.user.id, action: 'update', entity: 'GalleryImage', entityId: id });

    return res.status(200).json(image);
  }

  if (req.method === 'DELETE') {
    await prisma.galleryImage.delete({ where: { id } });

    // Only remove the file when we uploaded it (never touch the bundled set).
    if (existing.url.startsWith('/uploads/')) {
      const target = path.join(process.cwd(), 'public', existing.url.replace(/^\//, ''));
      // Guard against path traversal via a crafted url.
      if (target.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
        await fs.rm(target, { force: true }).catch(() => {});
      }
    }

    await audit({ userId: guard.user.id, action: 'delete', entity: 'GalleryImage', entityId: id });

    return res.status(200).json({ success: true, deleted: id });
  }

  return methodNotAllowed(res, ['PUT', 'DELETE']);
});