import AdminShell from '@/components/admin/AdminShell';
import ResourceManager from '@/components/admin/ResourceManager';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const CATEGORY_OPTIONS = [
  { value: 'product', label: 'Product (Products & Materials page)' },
  { value: 'service', label: 'Service (Services page)' },
];

const RESOURCE = {
  name: 'Product or service',
  endpoint: '/api/admin/services',
  listKey: 'services',
  searchable: true,
  searchPlaceholder: 'Title or slug…',
  empty: {
    title: 'No products or services yet',
    description: 'These entries drive both /products-and-materials and /services.',
  },
  deleteBody:
    'Entries linked to an appointment cannot be deleted — unpublish them instead so history is preserved.',
  defaults: {
    slug: '',
    title: '',
    summary: '',
    description: '',
    category: 'product',
    image: '',
    priceFrom: '',
    order: 0,
    published: true,
  },
  fields: [
    { name: 'title', label: 'Title', required: true },
    {
      name: 'slug',
      label: 'Slug',
      required: true,
      hint: 'Lowercase words separated by hyphens, e.g. ceramic-veneers.',
    },
    { name: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS, required: true },
    { name: 'order', label: 'Order', type: 'number', hint: 'Lower numbers appear first.' },
    { name: 'summary', label: 'Summary', type: 'textarea', required: true, colSpan: 2, rows: 3 },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      colSpan: 2,
      rows: 8,
      hint: 'Leave a blank line between paragraphs.',
    },
    { name: 'image', label: 'Image URL', colSpan: 2, hint: 'Optional. Paths like /images/lab-1.webp.' },
    { name: 'priceFrom', label: 'Price from', hint: 'Optional, e.g. €290.' },
    {
      name: 'published',
      label: 'Published',
      type: 'checkbox',
      checkboxLabel: 'Show this entry on the site',
    },
  ],
  columns: [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div>
          <p className="font-semibold text-silver-100">{row.title}</p>
          <p className="mt-0.5 text-xs text-silver-500">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-2xs uppercase tracking-caps text-silver-400">
          {row.category}
        </span>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (row) => <p className="max-w-md text-sm text-silver-400">{row.summary}</p>,
    },
    { key: 'order', header: 'Order', render: (row) => <span className="text-xs text-silver-500">{row.order}</span> },
  ],
};

export default function AdminServicesPage({ services, total, page, pageCount, query }) {
  return (
    <AdminShell
      title="Products & Services"
      description="The catalogue behind /products-and-materials and /services."
      wide
    >
      <ResourceManager
        resource={RESOURCE}
        items={services}
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
    return { props: { ...guard.props, services: [], total: 0, page: 1, pageCount: 1, query: ctx.query } };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 50 });
  const where = {};
  if (ctx.query.category) where.category = String(ctx.query.category);
  if (ctx.query.q) {
    const needle = String(ctx.query.q).trim();
    where.OR = [{ title: { contains: needle } }, { slug: { contains: needle } }];
  }

  const [total, services] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({ where, orderBy: [{ category: 'asc' }, { order: 'asc' }], skip, take }),
  ]);

  return {
    props: {
      ...guard.props,
      services,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      query: ctx.query,
    },
  };
}