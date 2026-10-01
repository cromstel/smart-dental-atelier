import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import ConfirmButton from '@/components/admin/ConfirmButton';
import Pagination from '@/components/admin/Pagination';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormSelect from '@/components/ui/FormSelect';
import FormTextArea from '@/components/ui/FormTextArea';
import Alert from '@/components/ui/Alert';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate, formatDateTime, appointmentTypeLabel, APPOINTMENT_TYPES } from '@/lib/format';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

/**
 * Appointments screen.
 *
 * Filtering, pagination and the status transitions all run server-side through
 * `getServerSideProps`; the row actions PATCH `/api/admin/appointments` and then
 * refresh the current query so the table never drifts from the database.
 */
export default function AdminAppointmentsPage({ appointments = [], total, page, pageCount, counts = {}, query }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});

  /**
   * Re-run `getServerSideProps`. Any unsaved note text is dropped at the same
   * time, in the same event that fetches the new rows — previously this was an
   * effect keyed on `appointments`, which set state synchronously during the
   * commit phase and cost an extra render pass on every list refresh.
   */
  const refresh = useCallback(() => {
    setNotesDraft({});
    router.replace(router.asPath, undefined, { scroll: false });
  }, [router]);

  const update = async (id, changes) => {
    setBusyId(id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'We could not update that appointment.');
        return;
      }
      refresh();
    } catch {
      setMessage('We could not reach the server. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    setMessage('');
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'We could not delete that appointment.');
        return;
      }
      refresh();
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
      key: 'name',
      header: 'Patient',
      render: (row) => (
        <div>
          <p className="font-semibold text-silver-100">
            {row.firstName} {row.lastName}
          </p>
          <p className="mt-0.5 text-xs text-silver-500">
            <a href={`mailto:${row.email}`} className="link-underline">
              {row.email}
            </a>
          </p>
          <p className="mt-0.5 text-xs text-silver-500">
            <a href={`tel:${String(row.phone || '').replace(/[^\d+]/g, '')}`} className="link-underline">
              {row.phone || 'no phone'}
            </a>
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <div>
          <p className="text-silver-300">{appointmentTypeLabel(row.type)}</p>
          {row.service ? <p className="mt-0.5 text-xs text-silver-500">{row.service.title}</p> : null}
        </div>
      ),
    },
    {
      key: 'preferredDate',
      header: 'Preferred / scheduled',
      render: (row) => (
        <div className="text-xs">
          <p className="text-silver-300">{formatDate(row.preferredDate)}</p>
          <p className="mt-0.5 text-silver-500">
            {row.scheduledAt ? formatDateTime(row.scheduledAt) : 'no slot set'}
          </p>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) =>
        row.notes ? (
          <p className="max-w-xs text-xs text-silver-400">{row.notes}</p>
        ) : (
          <span className="text-xs text-silver-600">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="space-y-2">
          <StatusBadge status={row.status} />
          <label className="sr-only" htmlFor={`status-${row.id}`}>
            Change status for {row.firstName} {row.lastName}
          </label>
          <select
            id={`status-${row.id}`}
            value={row.status}
            disabled={busyId === row.id}
            onChange={(event) => update(row.id, { status: event.target.value })}
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
      key: '_actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <a
            href={`tel:${String(row.phone || '').replace(/[^\d+]/g, '')}`}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50"
          >
            Call
          </a>
          <ConfirmButton
            label="Delete"
            dialogTitle="Delete this appointment request?"
            dialogBody="The request and its notes will be removed permanently."
            onConfirm={() => remove(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      title="Appointments"
      description="Requests from the website, the client portal and phone bookings taken at the bench."
      wide
    >
      <div className="space-y-6">
        {message ? (
          <Alert tone="error" onDismiss={() => setMessage('')}>
            {message}
          </Alert>
        ) : null}

        {/* Filters */}
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
              const search = params.toString();
              router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, {
                scroll: false,
              });
            }}
          />

          <div className="sm:col-span-2">
            <label htmlFor="appointment-search" className="mb-2 block text-sm font-medium text-brand-200">
              Search
            </label>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const params = new URLSearchParams();
                if (query.status) params.set('status', query.status);
                const value = new FormData(event.currentTarget).get('q');
                if (value) params.set('q', String(value));
                const search = params.toString();
                router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, {
                  scroll: false,
                });
              }}
              className="flex gap-3"
            >
              <input
                id="appointment-search"
                name="q"
                type="search"
                defaultValue={query.q || ''}
                placeholder="Name, e-mail or phone"
                className="flex-1 rounded-md border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-silver-50 placeholder:text-silver-600 focus:border-brand-400"
              />
              <PrimaryButton type="submit" variant="secondary">
                Search
              </PrimaryButton>
            </form>
          </div>
        </div>

        {/* Counters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/15 px-3 py-1 text-silver-400">
            {total} result{total === 1 ? '' : 's'}
          </span>
          {Object.entries(counts).map(([status, value]) => (
            <span
              key={status}
              className="rounded-full border border-brand-400/30 px-3 py-1 text-brand-300"
            >
              {status.toLowerCase()}: {value}
            </span>
          ))}
        </div>

        <DataTable
          columns={columns}
          rows={appointments}
          caption="Appointment requests"
          emptyTitle="No appointment requests match"
          emptyDescription="Try clearing the filters, or wait for the first request to come in."
        />

        <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />

        {/* Internal notes */}
        {appointments.length > 0 ? (
          <section className="panel">
            <h2 className="text-lg">Internal notes</h2>
            <p className="mt-2 text-sm text-silver-400">
              Only visible to staff. Use them for anything you want to remember about a case.
            </p>

            <ul className="mt-6 space-y-4">
              {appointments.map((appointment) => (
                <li key={`notes-${appointment.id}`} className="rounded border border-white/10 p-4">
                  <p className="text-sm font-semibold text-silver-100">
                    {appointment.firstName} {appointment.lastName}{' '}
                    <span className="ml-2 text-xs font-normal text-silver-600">#{appointment.id}</span>
                  </p>

                  <div className="mt-3">
                    <label className="sr-only" htmlFor={`internal-${appointment.id}`}>
                      Internal note for {appointment.firstName} {appointment.lastName}
                    </label>
                    <FormTextArea
                      name={`internal-${appointment.id}`}
                      rows={2}
                      label=""
                      value={notesDraft[appointment.id] ?? appointment.internalNotes ?? ''}
                      onChange={(event) =>
                        setNotesDraft((current) => ({ ...current, [appointment.id]: event.target.value }))
                      }
                      maxLength={2000}
                    />
                    <div className="mt-2">
                      <PrimaryButton
                        size="sm"
                        variant="secondary"
                        loading={busyId === appointment.id}
                        onClick={() =>
                          update(appointment.id, {
                            internalNotes: notesDraft[appointment.id] ?? appointment.internalNotes ?? '',
                          })
                        }
                      >
                        Save note
                      </PrimaryButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
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
        appointments: [],
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
      { phone: { contains: needle } },
    ];
  }

  const [total, appointments, counts] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
      include: { service: { select: { title: true } } },
    }),
    prisma.appointment.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  return {
    props: {
      ...guard.props,
      appointments,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(counts.map((entry) => [entry.status, entry._count._all])),
      query: ctx.query,
    },
  };
}