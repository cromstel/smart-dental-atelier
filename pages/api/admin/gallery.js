import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import formidable from 'formidable';
import sharp from 'sharp';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, requireAdmin, HttpError } from '@/lib/api';
import { gallerySchema } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { parsePagination } from '@/lib/guards';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Next's built-in body parser consumes the request stream before the handler
 * runs, which leaves formidable with an already-drained socket — `form.parse`
 * then never fires its callback and the request hangs forever. Multipart
 * uploads must own the raw stream themselves.
 */
export const config = { api: { bodyParser: false } };

/** Matches scripts/optimize-images.mjs so uploaded assets match bundled ones. */
const WEBP_QUALITY = 82;
const WEBP_EFFORT = 6;

/** Where formidable stages the raw upload before it is transcoded. */
const TEMP_DIR = path.join(process.cwd(), '.tmp-uploads');

/**
 * /api/admin/gallery
 *   GET  list images (filterable by category)
 *   POST upload a new image (multipart/form-data, `file` + `altText` + `title`)
 *
 * Uploads land in `public/uploads` and are served by Next's static handler.
 * For a multi-instance/serverless deployment swap `persistUpload` for an S3 or
 * Vercel Blob call — the DB record shape does not change.
 */
async function persistUpload(file, name) {
  if (!ALLOWED.has(file.mimetype)) {
    throw new HttpError(415, 'Only JPEG, PNG, WebP or AVIF images are allowed.');
  }

  // Everything is stored as WebP regardless of what was uploaded, then the
  // source file is discarded. `.rotate()` applies the EXIF orientation so
  // portrait photos are not served sideways.
  const pipeline = sharp(file.filepath, { failOn: 'none' })
    .rotate()
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT, smartSubsample: true });

  const { data: webp, info } = await pipeline.toBuffer({ resolveWithObject: true });

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), webp);

  // `info` is post-rotation, so these are the real displayed dimensions.
  return { width: info.width, height: info.height };
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
    // Each request gets its own staging directory. A shared one would let two
    // concurrent uploads delete each other's temp files, since the cleanup
    // below removes the whole directory.
    const stagingDir = path.join(TEMP_DIR, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`);

    try {
      // formidable 3 defaults `createDirsFromUploads` to false, so without this
      // the write stream fails on ENOENT and the upload silently vanishes.
      await fs.mkdir(stagingDir, { recursive: true });
    } catch (error) {
      throw new HttpError(500, `Upload directory unavailable: ${error.message}`);
    }

    const form = formidable({
      maxFileSize: MAX_FILE_BYTES,
      maxTotalFileSize: MAX_FILE_BYTES,
      multiples: false,
      uploadDir: stagingDir,
      createDirsFromUploads: true,
      keepExtensions: true,
    });

    /** @type {{fields: Record<string, string[]>, files: Record<string, unknown>}} */
    let parsed;

    try {
      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, parsedFields, parsedFiles) => {
          if (err) return reject(err);
          resolve([parsedFields, parsedFiles]);
        });
      });
      parsed = { fields, files };
    } catch (error) {
      throw new HttpError(
        error.httpCode || 400,
        error.message || 'The upload could not be read. Please try again.',
      );
    }

    // The name is fixed up front so validation can run against the final URL
    // before anything is written: a rejected form must not leave a file behind.
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
    const url = `/uploads/${name}`;

    try {
      const file = Array.isArray(parsed.files.file) ? parsed.files.file[0] : parsed.files.file;
      if (!file) throw new HttpError(422, 'Please choose an image to upload.');

      // formidable returns every field as an array of strings.
      const flat = {};
      for (const [key, value] of Object.entries(parsed.fields)) {
        flat[key] = Array.isArray(value) ? value[0] : value;
      }

      const data = gallerySchema.parse({ ...flat, url });

      const { width, height } = await persistUpload(file, name);

      const image = await prisma.galleryImage.create({
        data: {
          title: data.title ?? null,
          url,
          altText: data.altText,
          category: data.category,
          width,
          height,
          order: data.order,
          published: data.published,
        },
      });

      await audit({ userId: guard.user.id, action: 'upload', entity: 'GalleryImage', entityId: image.id });

      return res.status(201).json(image);
    } finally {
      // Remove formidable's staged copy; only the transcoded WebP is kept, so
      // the uploaded original never lingers on disk.
      await fs.rm(stagingDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
  },
  // The shared 256 KB body cap is far too small for a photograph; allow the
  // file limit plus headroom for the text fields and multipart boundaries.
  { maxBodyBytes: MAX_FILE_BYTES + 64 * 1024 },
);