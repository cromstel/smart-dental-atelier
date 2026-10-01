import AdminShell from '@/components/admin/AdminShell';
import ResourceManager from '@/components/admin/ResourceManager';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

const RESOURCE = {
  name: 'Testimonial',
  endpoint: '/api/admin/testimonials',
  listKey: 'testimonials',
  searchable: true,
  searchPlaceholder: 'Author or quote…',
  empty: {
    title: 'No testimonials yet',
    description: 'Add the patient quotes that appear on the home page and /testimonials.',
  },
  deleteBody: 'The quote will be removed from the carousel immediately.',
  defaults: { author: '', treatment: '', quote: '', image: '', order: 0, published: true },
  fields: [
    { name: 'author', label: 'Author', required: true, hint: 'e.g. Karl' },
    { name: 'treatment', label: 'Treatment', hint: 'e.g. 6 veneers' },
    { name: 'quote', label: 'Quote', type: 'textarea', required: true, colSpan: 2, rows: 5 },
    { name: 'image', label: 'Portrait URL', hint: 'Optional. Leave empty for initials.', colSpan: 2 },
    { name: 'order', label: 'Order', type: 'number', hint: 'Lower numbers appear first.' },
    {
      name: 'published',
      label: 'Published',
      type: 'checkbox',
      checkboxLabel: 'Show this testimonial on the site',
      hint: 'Unpublished testimonials stay in the admin list but are hidden from visitors.',
    },
  ],
  columns: [
    {
      key: 'author',
      header: 'Author',
      render: (row) => (
        <div>
          <p className="font-semibold text-silver-100">{row.author}</p>
          {row.treatment ? <p className="mt-0.5 text-xs text-silver-500">{row.treatment}</p> : null}
        </div>
      ),
    },
    { key: 'quote', header: 'Quote', render: (row) => <p className="max-w-md text-sm text-silver-400">{row.quote}</p> },
    {
      key: 'createdAt',
      header: 'Added',
      render: (row) => <span className="text-xs text-silver-500">{formatDate(row.createdAt)}</span>,
    },
  ],
};

export default function AdminTestimonialsPage({ testimonials, total, page, pageCount, query }) {
  return (
    <AdminShell
      title="Testimonials"
      description="The quotes in the carousel on the home page and on /testimonials."
      wide
      actions={null}
    >
      <ResourceManager
        resource={RESOURCE}
        items={testimonials}
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
    return {
      props: { ...guard.props, testimonials: [], total: 0, page: 1, pageCount: 1, query: ctx.query },
    };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 50 });
  const where = ctx.query.q
    ? {
        OR: [
          { author: { contains: String(ctx.query.q).trim() } },
          { quote: { contains: String(ctx.query.q).trim() } },
        ],
      }
    : {};

  const [total, testimonials] = await Promise.all([
    prisma.testimonial.count({ where }),
    prisma.testimonial.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
  ]);

  return {
    props: {
      ...guard.props,
      testimonials,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      query: ctx.query,
    },
  };
}