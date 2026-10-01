import { isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { getTestimonials } from '@/lib/cms';

/**
 * GET /api/testimonials  (public)
 * Only published testimonials are ever exposed.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const testimonials = await getTestimonials();

  return res.status(200).json({
    count: testimonials.length,
    testimonials: testimonials.map(({ id, author, treatment, quote, image }) => ({
      id,
      author,
      treatment,
      quote,
      image,
    })),
  });
});