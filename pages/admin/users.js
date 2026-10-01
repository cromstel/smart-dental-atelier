import AdminShell from '@/components/admin/AdminShell';
import ResourceManager from '@/components/admin/ResourceManager';
import Alert from '@/components/ui/Alert';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'ADMIN', label: 'Administrator' },
];

const RESOURCE = {
  name: 'User',
  endpoint: '/api/admin/users',
  listKey: 'users',
  searchable: true,
  searchPlaceholder: 'Name or e-mail…',
  withStatus: false,
  empty: {
    title: 'No accounts yet',
    description: 'Client accounts appear automatically when they sign in with Google or are invited here.',
  },
  deleteBody:
    'Deleting a user also removes their session history. Consider deactivating the account instead.',
  defaults: { name: '', email: '', phone: '', role: 'CLIENT', isActive: true, password: '' },
  fields: [
    { name: 'name', label: 'Full name' },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'role', label: 'Role', type: 'select', options: ROLE_OPTIONS, required: true },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      hint: 'Required when creating an account. Leave empty when editing to keep the current password.',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
      checkboxLabel: 'This account can sign in',
    },
  ],
  columns: [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-semibold text-silver-100">{row.name || '—'}</p>
          <p className="mt-0.5 text-xs text-silver-500">{row.email}</p>
          {row.phone ? <p className="mt-0.5 text-xs text-silver-500">{row.phone}</p> : null}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span
          className={`rounded-full border px-2.5 py-0.5 text-2xs uppercase tracking-caps ${
            row.role === 'ADMIN'
              ? 'border-brand-400/40 bg-brand-400/10 text-brand-300'
              : 'border-white/15 text-silver-400'
          }`}
        >
          {row.role === 'ADMIN' ? 'Administrator' : 'Client'}
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (row) => (
        <span className="text-xs text-silver-500">
          {row._count?.appointments ?? 0} appointment(s) · {row._count?.messages ?? 0} inquiry(ies)
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last sign-in',
      render: (row) => <span className="text-xs text-silver-500">{row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString('en-GB') : 'never'}</span>,
    },
    {
      key: 'isActive',
      header: 'Account',
      render: (row) => (
        <span className="text-xs text-silver-400">{row.isActive ? 'Active' : 'Deactivated'}</span>
      ),
    },
  ],
};

/** Users screen. Deactivate is done in the edit dialog (the `isActive` checkbox). */
export default function AdminUsersPage({ users, total, page, pageCount, query }) {
  return (
    <AdminShell
      title="Users"
      description="Everyone with an account: clients of the portal and your own staff accounts."
      wide
    >
      <div className="mb-6">
        <Alert tone="info" title="A note on accounts">
          You cannot delete or demote your own account, and the last active administrator cannot be
          removed — those rules are enforced by the API, not just hidden in this UI.
        </Alert>
      </div>

      <ResourceManager
        resource={RESOURCE}
        items={users}
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
    return { props: { ...guard.props, users: [], total: 0, page: 1, pageCount: 1, query: ctx.query } };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 25 });
  const where = {};
  if (ctx.query.role) where.role = String(ctx.query.role).toUpperCase();
  if (ctx.query.q) {
    const needle = String(ctx.query.q).trim();
    where.OR = [{ name: { contains: needle } }, { email: { contains: needle } }];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { appointments: true, messages: true } },
      },
    }),
  ]);

  return {
    props: {
      ...guard.props,
      users,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      query: ctx.query,
    },
  };
}