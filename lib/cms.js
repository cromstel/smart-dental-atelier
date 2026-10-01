import { prisma, safeQuery } from './prisma';
import {
  SERVICES,
  FAQS,
  TESTIMONIALS,
  GALLERY,
  SMILE_CHECK_QUESTIONS,
  DIRECTOR_MILESTONES,
  PAGES,
  SETTINGS,
  SITE,
} from './content';

/**
 * Content access layer.
 *
 * Every read goes through `safeQuery`, so a page rendered while MySQL is down
 * still shows the bundled copy from `lib/content.js` instead of a 500. `source`
 * is surfaced in development to make the fallback obvious.
 */

const withIds = (rows, mapper) => rows.map((row, index) => ({ ...mapper(row), index }));

export async function getSettings() {
  const defaults = Object.fromEntries(SETTINGS.map((s) => [s.key, s.value]));
  const { data } = await safeQuery(
    () => prisma.setting.findMany({ where: { key: { in: Object.keys(defaults) } } }),
    [],
  );
  const merged = { ...defaults };
  for (const row of data) merged[row.key] = row.value;
  return { ...SITE, ...merged };
}

export async function getServices(category) {
  const where = category ? { category, published: true } : { published: true };
  const { data } = await safeQuery(
    () => prisma.service.findMany({ where, orderBy: [{ category: 'asc' }, { order: 'asc' }] }),
    null,
  );
  return data || SERVICES.filter((s) => (category ? s.category === category : true));
}

export async function getFaqs(includeUnpublished = false) {
  const { data } = await safeQuery(
    () =>
      prisma.faq.findMany({
        where: includeUnpublished ? undefined : { published: true },
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      }),
    null,
  );
  return data || FAQS;
}

export async function getTestimonials(includeUnpublished = false) {
  const { data } = await safeQuery(
    () =>
      prisma.testimonial.findMany({
        where: includeUnpublished ? undefined : { published: true },
        orderBy: { order: 'asc' },
      }),
    null,
  );
  return data || TESTIMONIALS;
}

export async function getGallery({ category, includeUnpublished = false } = {}) {
  const where = {};
  if (category) where.category = category;
  if (!includeUnpublished) where.published = true;

  const { data } = await safeQuery(
    () => prisma.galleryImage.findMany({ where, orderBy: { order: 'asc' } }),
    null,
  );
  return data || GALLERY.filter((image) => (category ? image.category === category : true));
}

export async function getSmileCheckQuestions() {
  const { data } = await safeQuery(
    () => prisma.smileCheckQuestion.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    null,
  );
  return data || SMILE_CHECK_QUESTIONS.map((question, index) => ({ id: index + 1, question, order: index }));
}

export async function getMilestones() {
  const { data } = await safeQuery(
    () => prisma.directorMilestone.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
    null,
  );
  return data || DIRECTOR_MILESTONES;
}

/** Page record + ordered blocks for the admin content editor. */
export async function getPage(slug) {
  const key = slug.replace(/^\/+|\/+$/g, '') || 'home';
  const { data } = await safeQuery(
    () =>
      prisma.page.findUnique({
        where: { slug: key },
        include: { blocks: { where: { published: true }, orderBy: { position: 'asc' } } },
      }),
    null,
  );
  if (data) return data;

  const bundled = PAGES.find((page) => page.key === key);
  return bundled ? { ...bundled, slug: key, blocks: [] } : null;
}

/** SEO metadata for a route, merged over the bundled defaults. */
export async function getPageSeo(slug) {
  const key = slug.replace(/^\/+|\/+$/g, '') || 'home';
  const bundled = PAGES.find((page) => page.key === key);
  const page = await getPage(key);

  const site = await getSettings();
  return {
    title: page?.title || bundled?.title || site.name,
    description: page?.description || bundled?.description || site.description,
    image: page?.image || site.ogImage,
    noIndex: Boolean(page?.noIndex) || key === 'home' ? Boolean(page?.noIndex) : false,
    canonical: `${site.url}${slug.startsWith('/') ? slug : `/${slug}`}`.replace(/\/$/, '/'),
    site,
  };
}

/** Everything the home page needs, in one round-trip-ish call. */
export async function getHomeData() {
  const [testimonials, services, settings] = await Promise.all([
    getTestimonials(),
    getServices('service'),
    getSettings(),
  ]);
  return { testimonials, services, settings };
}

/** Aggregates for the admin dashboard. */
export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const empty = {
    appointments: { total: 0, pending: 0, confirmed: 0, thisWeek: 0 },
    messages: { total: 0, new: 0, unanswered: 0 },
    clients: { total: 0, activeThisWeek: 0 },
    content: { faqs: 0, services: 0, testimonials: 0, gallery: 0 },
    upcoming: [],
    recentMessages: [],
  };

  if (!process.env.DATABASE_URL) return { ...empty, available: false };

  try {
    const [
      appointmentTotal,
      appointmentPending,
      appointmentConfirmed,
      appointmentWeek,
      messageTotal,
      messageNew,
      messageUnanswered,
      clientTotal,
      clientActive,
      faqs,
      services,
      testimonials,
      gallery,
      upcoming,
      recentMessages,
    ] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'NEW' } }),
      prisma.contactMessage.count({ where: { status: { in: ['NEW', 'READ'] } } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'CLIENT', lastLoginAt: { gte: startOfWeek } } }),
      prisma.faq.count({ where: { published: true } }),
      prisma.service.count({ where: { published: true } }),
      prisma.testimonial.count({ where: { published: true } }),
      prisma.galleryImage.count({ where: { published: true } }),
      prisma.appointment.findMany({
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
        take: 5,
      }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      available: true,
      appointments: {
        total: appointmentTotal,
        pending: appointmentPending,
        confirmed: appointmentConfirmed,
        thisWeek: appointmentWeek,
      },
      messages: { total: messageTotal, new: messageNew, unanswered: messageUnanswered },
      clients: { total: clientTotal, activeThisWeek: clientActive },
      content: { faqs, services, testimonials, gallery },
      upcoming,
      recentMessages,
      generatedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('[cms] dashboard stats failed:', error.message);
    return { ...empty, available: false };
  }
}

export { withIds };