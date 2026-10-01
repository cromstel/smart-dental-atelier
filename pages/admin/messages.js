import { useRouter } from 'next/router';
import { useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import ConfirmButton from '@/components/admin/ConfirmButton';
import Pagination from '@/components/admin/Pagination';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormSelect from '@/components/ui/FormSelect';
import Alert from '@/components/ui/Alert';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDateTime, formatRelative } from '@/lib/format';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'READ', label: 'Read' },
  { value: 'ANSWERED', label: 'Answered' },
  { value: 'SPAM', label: 'Spam' },
];

const SOURCE_LABELS = {
  CONTACT: 'Contact form',
  SMILE_CHECK: 'Smile check',
  REQUEST_INFO: 'Information request',
  PORTFOLIO_REQUEST: 'Portfolio request',
  FAQ_QUESTION: 'FAQ question',
  PORTAL: 'Client portal',
};

/** The shared inbox for every public form. */
export default function AdminMessagesPage({ messages = [], total, page, pageCount, counts = {}, query }) {
  const router = useRouter();
  const [openId, setOpenId] = useState(null);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  const setStatus = async (id, status) => {
    setBusyId(id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'We could not update that inquiry.');
        return;
      }
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setMessage('We could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    setMessage('');
    try {
      const response = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'We could not delete that inquiry.');
        return;
      }
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setMessage('We could not reach the server. Please try again.');
    }
  };

  const buildHref = (nextPage) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set('page', String(nextPage));
    if (query.status) params.set('status', query.status);
    if (query.q) params.set('q', query.q);
    const search = params.toString();
    return search ? `?${search}` : null;
  };

  const columns = [
    {
      key: 'from',
      header: 'From',
      render: (row) => (
        <div>
          <p className="font-semibold text-silver-100">
            {row.firstName} {row.lastName}
          </p>
          <p className="mt-0.5 text-xs text-silver-500">
            <a href={`mailto:${row.email}?subject=Re: your inquiry`} className="link-underline">
              {row.email}
            </a>
          </p>
          {row.phone ? (
            <p className="mt-0.5 text-xs text-silver-500">
              <a href={`tel:${String(row.phone).replace(/[^\d+]/g, '')}`} className="link-underline">
                {row.phone}
              </a>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Form',
      render: (row) => (
        <div>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-2xs uppercase tracking-caps text-silver-400">
            {SOURCE_LABELS[row.source] || row.source}
          </span>
          {row.referrer ? <p className="mt-1 text-xs text-silver-600">{row.referrer}</p> : null}
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <div className="max-w-md">
          <p
            className={`text-sm text-silver-400 ${openId === row.id ? 'whitespace-pre-line' : 'line-clamp-2'}`}
          >
            {row.message}
          </p>

          {row.smileCheckAnswers ? (
            <p className="mt-2 text-xs text-brand-300">
              Smile check: questions {row.smileCheckAnswers}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setOpenId(openId === row.id ? null : row.id)}
            className="mt-2 text-xs text-brand-300 underline"
            aria-expanded={openId === row.id}
          >
            {openId === row.id ? 'Show less' : 'Read full message'}
          </button>

          {openId === row.id ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <PrimaryButton
                size="sm"
                variant="secondary"
                href={`mailto:${row.email}?subject=Re:%20your%20inquiry%20to%20Dental%20Atelier`}
                external
              >
                Reply by e-mail
              </PrimaryButton>
              <PrimaryButton
                size="sm"
                variant="ghost"
                loading={busyId === row.id}
                onClick={() => setStatus(row.id, 'ANSWERED')}
              >
                Mark answered
              </PrimaryButton>
              <PrimaryButton
                size="sm"
                variant="ghost"
                loading={busyId === row.id}
                onClick={() => setStatus(row.id, 'SPAM')}
              >
                Mark as spam
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="space-y-2">
          <StatusBadge status={row.status} />
          <label className="sr-only" htmlFor={`msg-status-${row.id}`}>
            Change status for inquiry {row.id}
          </label>
          <select
            id={`msg-status-${row.id}`}
            value={row.status}
            disabled={busyId === row.id}
            onChange={(event) => setStatus(row.id, event.target.value)}
            className="w-full rounded border border-white/15 bg-ink-700 px-2 py-1 text-xs text-silver-100 focus:border-brand-400"
          >
            {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Received',
      render: (row) => (
        <span className="text-xs text-silver-500" title={formatDateTime(row.createdAt)}>
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
    {
      key: '_actions',
      header: '',
      align: 'right',
      render: (row) => (
        <ConfirmButton
          label="Delete"
          dialogTitle="Delete this inquiry?"
          dialogBody="The message will be removed permanently. Consider marking it as spam instead."
          onConfirm={() => remove(row.id)}
        />
      ),
    },
  ];

  return (
    <AdminShell
      title="Inquiries"
      description="Contact form, smile check, information and portfolio requests — all in one inbox."
      wide
    >
      <div className="space-y-6">
        {message ? (
          <Alert tone="error" onDismiss={() => setMessage('')}>
            {message}
          </Alert>
        ) : null}

        <div className="panel grid gap-4 sm:grid-cols-3">
          <FormSelect
            label="Status"
            name="status"
            value={query.status || ''}
            options={STATUS_OPTIONS}
            onChange={(event) => {
              const params = new URLSearchParams();
              if (event.target.value) params.set('status', event.target.value);
              if (query.q) params.set('q', query.q);
              router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, {
                scroll: false,
              });
            }}
          />

          <div className="sm:col-span-2">
            <label htmlFor="message-search" className="mb-2 block text-sm font-medium text-brand-200">
              Search
            </label>
            <form method="post"
              onSubmit={(event) => {
                event.preventDefault();
                const params = new URLSearchParams();
                if (query.status) params.set('status', query.status);
                const value = new FormData(event.currentTarget).get('q');
                if (value) params.set('q', String(value));
                router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, {
                  scroll: false,
                });
              }}
              className="flex gap-3"
            >
              <input
                id="message-search"
                name="q"
                type="search"
                defaultValue={query.q || ''}
                placeholder="Name, e-mail or words in the message"
                className="flex-1 rounded-md border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-silver-50 placeholder:text-silver-600 focus:border-brand-400"
              />
              <PrimaryButton type="submit" variant="secondary">
                Search
              </PrimaryButton>
            </form>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/15 px-3 py-1 text-silver-400">
            {total} result{total === 1 ? '' : 's'}
          </span>
          {Object.entries(counts).map(([status, value]) => (
            <span key={status} className="rounded-full border border-brand-400/30 px-3 py-1 text-brand-300">
              {status.toLowerCase()}: {value}
            </span>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={messages}
          caption="Website inquiries"
          emptyTitle="No inquiries match"
          emptyDescription="Submissions from the contact, smile-check and information forms land here."
        />

        <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />
      </div>
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return {
      props: {
        ...guard.props,
        messages: [],
        total: 0,
        page: 1,
        pageCount: 1,
        counts: {},
        query: ctx.query,
      },
    };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 25 });
  const where = {};
  if (ctx.query.status) where.status = String(ctx.query.status).toUpperCase();
  if (ctx.query.q) {
    const needle = String(ctx.query.q).trim();
    where.OR = [
      { firstName: { contains: needle } },
      { lastName: { contains: needle } },
      { email: { contains: needle } },
      { message: { contains: needle } },
    ];
  }

  const [total, messages, counts] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.contactMessage.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  return {
    props: {
      ...guard.props,
      messages,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(counts.map((entry) => [entry.status, entry._count._all])),
      query: ctx.query,
    },
  };
}