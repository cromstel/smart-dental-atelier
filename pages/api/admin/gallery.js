import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import formidable from 'formidable';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { gallerySchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/avif', '.avif'],
]);

/**
 * /api/admin/gallery
 *   GET  list images (filterable by category)
 *   POST upload a new image (multipart/form-data, `file` + `altText` + `title`)
 *
 * Uploads land in `public/uploads` and are served by Next's static handler.
 * For a multi-instance/serverless deployment swap `persistUpload` for an S3 or
 * Vercel Blob call — the DB record shape does not change.
 */
async function persistUpload(file) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const extension = ALLOWED.get(file.mimetype);
  if (!extension) throw new HttpError(415, 'Only JPEG, PNG, WebP or AVIF images are allowed.');

  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const destination = path.join(UPLOAD_DIR, name);

  // `newFilename` makes formidable write the (safe) name we generated.
  await fs.writeFile(destination, file.filepath);
  return `/uploads/${name}`;
}

export default apiHandler(async (req, res) => {
  const guard = await requireAdmin(req, res);
  if (!guard) return undefined;
  if (!isDatabaseConfigured) throw new HttpError(503, 'Database is not configured.');

  if (req.method === 'GET') {
    const { page, pageSize, skip, take } = parsePagination(req.query, { defaultSize: 24 });
    const where = req.query.category ? { category: String(req.query.category) } : {};

    const [total, images] = await Promise.all([
      prisma.galleryImage.count({ where }),
      prisma.galleryImage.findMany({ where, orderBy: { order: 'asc' }, skip, take }),
    ]);

    return res.status(200).json({
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      images,
    });
  }

  if (req.method === 'POST') {
    let form;
    try {
      form = formidable({
        maxFileSize: MAX_FILE_BYTES,
        multiples: false,
        uploadDir: path.join(process.cwd(), '.tmp-uploads'),
        keepExtensions: true,
      });
    } catch (error) {
      throw new HttpError(500, `Upload configuration failed: ${error.message}`);
    }

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => {
        if (err) return reject(err);
        resolve([parsedFields, parsedFiles]);
      });
    });

    try {
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) throw new HttpError(422, 'Please choose an image to upload.');

      const url = await persistUpload(file);
      const data = gallerySchema.parse({ ...fields, url });

      const image = await prisma.galleryImage.create({
        data: {
          title: data.title ?? null,
          url,
          altText: data.altText,
          category: data.category,
          order: data.order,
          published: data.published,
        },
      });

      await audit({ userId: guard.user.id, action: 'upload', entity: 'GalleryImage', entityId: image.id });

      return res.status(201).json(image);
    } finally {
      // Remove formidable's temp copy; the file was already moved to public/uploads.
      const tmp = form.uploadDir;
      if (tmp) {
        await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
});