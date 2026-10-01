/**
 * Prisma seed.
 *
 * Idempotent: every write is an upsert keyed on a natural identifier, so
 * running the seed twice will not duplicate content. Existing rows are only
 * updated when a field is still empty, which protects copy an admin has since
 * edited in the portal.
 *
 * Run with:  npm run db:seed
 *
 * Written as ESM (`.mjs`) so it can import `lib/content.js` directly — that
 * file is the single canonical copy of the site's text, shared with the pages
 * and with the fallback content layer.
 */
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {
  SITE,
  SERVICES,
  FAQS,
  TESTIMONIALS,
  GALLERY,
  SMILE_CHECK_QUESTIONS,
  DIRECTOR_MILESTONES,
  COURSES,
  PAGES,
  SETTINGS,
  MATERIALS,
  DIRECTIONS,
} from '../lib/content.js';

/**
 * Prisma 7 requires a driver adapter. The adapter takes a `mariadb.PoolConfig`
 * or a connection string — NOT `{ connectionString }`, which the driver ignores
 * and then fails to connect with a pool timeout.
 */
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: new URL(process.env.DATABASE_URL).hostname,
    port: Number(new URL(process.env.DATABASE_URL).port || 3306),
    user: decodeURIComponent(new URL(process.env.DATABASE_URL).username),
    password: decodeURIComponent(new URL(process.env.DATABASE_URL).password),
    database: new URL(process.env.DATABASE_URL).pathname.replace(/^\//, ''),
    connectionLimit: 5,
    connectTimeout: 5000,
  }),
});

/** Create, or fill in a field that is currently empty. */
async function upsertEmpty(model, where, create, patch) {
  const existing = await prisma[model].findFirst({ where });
  if (!existing) return prisma[model].create({ data: create });

  const emptyPatch = Object.fromEntries(
    Object.entries(patch).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      return existing[key] === null || existing[key] === '';
    }),
  );

  if (Object.keys(emptyPatch).length === 0) return existing;
  return prisma[model].update({ where: { id: existing.id }, data: emptyPatch });
}

async function main() {
  console.log('Seeding Dental Atelier…');

  // ---------------------------------------------------------------- Admin
  const adminEmail = (process.env.ADMIN_EMAIL || 'michal@dentalatelier.co').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn(
      'ADMIN_PASSWORD is not set — skipping the admin account.\n' +
        '         Create one later with: npm run create-admin',
    );
  } else {
    const password = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', isActive: true, password },
      create: {
        email: adminEmail,
        name: 'Michal Siakel',
        password,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`  ✓ admin ${admin.email}`);
  }

  // ------------------------------------------------------------- Settings
  for (const setting of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`  ✓ ${SETTINGS.length} settings`);

  // -------------------------------------------------------------- Services
  for (const service of SERVICES) {
    await upsertEmpty(
      'service',
      { slug: service.slug },
      {
        slug: service.slug,
        title: service.title,
        summary: service.summary,
        description: service.description,
        category: service.category,
        order: service.order,
        published: true,
      },
      {
        title: service.title,
        summary: service.summary,
        description: service.description,
      },
    );
  }
  console.log(`  ✓ ${SERVICES.length} products & services`);

  // "Materials" is a content block, stored as a service-less page note.
  await upsertEmpty(
    'service',
    { slug: 'materials' },
    {
      slug: 'materials',
      title: MATERIALS.title,
      summary: MATERIALS.body,
      description: MATERIALS.body,
      category: 'product',
      order: 99,
      published: false, // rendered by the page, not listed in the catalogue
    },
    { summary: MATERIALS.body },
  );

  // ------------------------------------------------------------------ FAQ
  // `question` is the natural key here (the schema only has an autoincrement id).
  for (const [index, faq] of FAQS.entries()) {
    await upsertEmpty(
      'faq',
      { question: faq.question },
      {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: index + 1,
        published: true,
      },
      { answer: faq.answer, category: faq.category },
    );
  }
  console.log(`  ✓ ${FAQS.length} FAQs`);

  // --------------------------------------------------------- Testimonials
  for (const [index, testimonial] of TESTIMONIALS.entries()) {
    await upsertEmpty(
      'testimonial',
      { author: testimonial.author, treatment: testimonial.treatment },
      {
        author: testimonial.author,
        treatment: testimonial.treatment,
        quote: testimonial.quote,
        order: index + 1,
        published: true,
      },
      { quote: testimonial.quote },
    );
  }
  console.log(`  ✓ ${TESTIMONIALS.length} testimonials`);

  // -------------------------------------------------------------- Gallery
  for (const image of GALLERY) {
    await upsertEmpty(
      'galleryImage',
      { url: image.url },
      { ...image, published: true },
      { altText: image.altText },
    );
  }
  console.log(`  ✓ ${GALLERY.length} gallery images`);

  // ---------------------------------------------------- Smile check + CV
  for (const [index, question] of SMILE_CHECK_QUESTIONS.entries()) {
    const existing = await prisma.smileCheckQuestion.findFirst({ where: { question } });
    if (!existing) {
      await prisma.smileCheckQuestion.create({ data: { question, order: index + 1, published: true } });
    }
  }
  console.log(`  ✓ ${SMILE_CHECK_QUESTIONS.length} smile-check questions`);

  for (const [index, milestone] of DIRECTOR_MILESTONES.entries()) {
    const existing = await prisma.directorMilestone.findFirst({ where: { period: milestone.period } });
    if (!existing) {
      await prisma.directorMilestone.create({ data: { ...milestone, order: index + 1, published: true } });
    }
  }
  console.log(`  ✓ ${DIRECTOR_MILESTONES.length} career milestones`);

  // ---------------------------------------------------------------- Pages
  for (const page of PAGES) {
    await prisma.page.upsert({
      where: { slug: page.key },
      update: {},
      create: {
        slug: page.key,
        title: page.title,
        description: page.description,
        heading: page.heading,
        published: true,
      },
    });
  }
  console.log(`  ✓ ${PAGES.length} pages`);

  // -------------------------------------------------------------- Contact
  // Directions are kept as settings so they can be edited without a deploy.
  for (const direction of DIRECTIONS) {
    const key = `contact.directions.${direction.id}`;
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value: direction.body || `${direction.title} ${direction.link?.label || ''}`.trim(),
        group: 'contact',
      },
    });
  }

  // Courses are content too, but they belong with the About page body copy.
  await prisma.setting.upsert({
    where: { key: 'about.courses' },
    update: {},
    create: { key: 'about.courses', value: COURSES.join('\n'), group: 'general' },
  });

  console.log(`\nDone. Site: ${SITE.url}`);
  console.log('Next: npm run dev');
}

main()
  .catch((error) => {
    console.error('\nSeed failed:', error.message);
    if (error.code === 'P1001' || error.code === 'ECONNREFUSED') {
      console.error('Could not reach MySQL. Check DATABASE_URL in .env');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });