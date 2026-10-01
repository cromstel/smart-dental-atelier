import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { apiHandler, methodNotAllowed, HttpError } from '@/lib/api';
import { getFaqs } from '@/lib/cms';

/**
 * GET /api/faqs  (public)
 * Supports `?category=VENEERS` and `?q=needle` for search.
 */
export default apiHandler(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!isDatabaseConfigured) throw new HttpError(503, 'Content store is unavailable.');

  const category = req.query.category ? String(req.query.category).toUpperCase() : undefined;
  const query = req.query.q ? String(req.query.q).trim().toLowerCase() : '';

  let faqs = await getFaqs();
  if (category) faqs = faqs.filter((faq) => faq.category === category);
  if (query) {
    faqs = faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query),
    );
  }

  return res.status(200).json({
    count: faqs.length,
    faqs: faqs.map(({ id, question, answer, category: faqCategory, order }) => ({
      id,
      question,
      answer,
      category: faqCategory,
      order,
    })),
  });
});