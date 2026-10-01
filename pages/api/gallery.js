import { isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { getGallery } from '@/lib/cms';

/**
 * GET /api/gallery  (public)
 * `?category=before|after|lab|smile`
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const category = req.query.category ? String(req.query.category) : undefined;
  const images = await getGallery({ category });

  return res.status(200).json({
    count: images.length,
    images: images.map(({ id, title, url, altText, category: imageCategory, width, height }) => ({
      id,
      title,
      url,
      altText,
      category: imageCategory,
      width,
      height,
    })),
  });
});