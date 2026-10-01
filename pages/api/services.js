import { isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { getServices } from '@/lib/cms';

/**
 * GET /api/services  (public)
 * `?category=product|service` — "Products & Materials" vs "Services".
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const category = req.query.category ? String(req.query.category) : undefined;

  if (category && !['product', 'service'].includes(category)) {
    throw new HttpError(422, 'Unknown category. Use "product" or "service".');
  }

  const services = await getServices(category);

  return res.status(200).json({
    count: services.length,
    services: services.map(({ id, slug, title, summary, description, category: svcCategory, priceFrom, image }) => ({
      id,
      slug,
      title,
      summary,
      description,
      category: svcCategory,
      priceFrom,
      image,
    })),
  });
});