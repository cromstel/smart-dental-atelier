import AdminShell from '@/components/admin/AdminShell';
import ResourceManager from '@/components/admin/ResourceManager';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'VENEERS', label: 'Veneers' },
  { value: 'CROWNS_BRIDGES', label: 'Crowns & bridges' },
  { value: 'IMPLANTS', label: 'Implants' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'COST', label: 'Cost' },
];

const RESOURCE = {
  name: 'FAQ',
  endpoint: '/api/admin/faqs',
  listKey: 'faqs',
  searchable: true,
  searchPlaceholder: 'Question or answer…',
  empty: {
    title: 'No FAQs yet',
    description: 'Published FAQs appear on /faqs as an accordion and as FAQPage structured data.',
  },
  deleteBody: 'The question will be removed from the FAQ page.',
  defaults: { question: '', answer: '', category: 'GENERAL', order: 0, published: true },
  fields: [
    { name: 'question', label: 'Question', required: true, colSpan: 2 },
    { name: 'answer', label: 'Answer', type: 'textarea', required: true, colSpan: 2, rows: 6 },
    { name: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS },
    { name: 'order', label: 'Order', type: 'number', hint: 'Lower numbers appear first.' },
    {
      name: 'published',
      label: 'Published',
      type: 'checkbox',
      checkboxLabel: 'Show this FAQ on the site',
    },
  ],
  columns: [
    { key: 'question', header: 'Question', render: (row) => <p className="font-semibold text-silver-100">{row.question}</p> },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-2xs uppercase tracking-caps text-silver-400">
          {String(row.category).replace(/_/g, ' ').toLowerCase()}
        </span>
      ),
    },
    {
      key: 'answer',
      header: 'Answer',
      render: (row) => <p className="max-w-md text-sm text-silver-400">{row.answer}</p>,
    },
    {
      key: 'createdAt',
      header: 'Updated',
      render: (row) => <span className="text-xs text-silver-500">{formatDate(row.updatedAt)}</span>,
    },
  ],
};

export default function AdminFaqsPage({ faqs, total, page, pageCount, query }) {
  return (
    <AdminShell title="FAQs" description="Every question on the /faqs page, plus its search category." wide>
      <ResourceManager
        resource={RESOURCE}
        items={faqs}
        total={total}
        page={page}
        pageCount={pageCount}
        query={query}
      />
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, faqs: [], total: 0, page: 1, pageCount: 1, query: ctx.query } };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 50 });
  const where = ctx.query.q
    ? {
        OR: [
          { question: { contains: String(ctx.query.q).trim() } },
          { answer: { contains: String(ctx.query.q).trim() } },
        ],
      }
    : {};

  const [total, faqs] = await Promise.all([
    prisma.faq.count({ where }),
    prisma.faq.findMany({ where, orderBy: [{ category: 'asc' }, { order: 'asc' }], skip, take }),
  ]);

  return {
    props: {
      ...guard.props,
      faqs,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      query: ctx.query,
    },
  };
}