import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/Spinner';
import { requireAdminPage } from '@/lib/guards';
import { getDashboardStats } from '@/lib/cms';
import { formatDateTime, formatRelative, appointmentTypeLabel } from '@/lib/format';

const EMPTY = {
  available: false,
  appointments: { total: 0, pending: 0, confirmed: 0, thisWeek: 0 },
  messages: { total: 0, new: 0, unanswered: 0 },
  clients: { total: 0, activeThisWeek: 0 },
  content: { faqs: 0, services: 0, testimonials: 0, gallery: 0 },
  upcoming: [],
  recentMessages: [],
};

/** Admin dashboard: the numbers that decide what to answer first. */
export default function AdminDashboardPage({ stats = EMPTY }) {
  return (
    <AdminShell
      title="Dashboard"
      description="Appointments, inquiries and content at a glance."
      actions={
        <>
          <PrimaryButton href="/admin/appointments" size="sm">
            Manage appointments
          </PrimaryButton>
          <PrimaryButton href="/" variant="secondary" size="sm" external>
            View site
          </PrimaryButton>
        </>
      }
    >
      {!stats.available ? (
        <Alert tone="warning" className="mb-8" title="Database not connected">
          The dashboard is showing zeros because no <code>DATABASE_URL</code> is configured or the
          database is unreachable. The public site still renders from the bundled content in{' '}
          <code>lib/content.js</code>.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Appointments"
          value={stats.appointments.total}
          hint={`${stats.appointments.thisWeek} in the last 7 days`}
          href="/admin/appointments"
          icon="📅"
        />
        <StatCard
          label="Pending"
          value={stats.appointments.pending}
          hint="Awaiting your confirmation call"
          tone={stats.appointments.pending > 0 ? 'warning' : 'default'}
          href="/admin/appointments?status=PENDING"
          icon="⏳"
        />
        <StatCard
          label="New inquiries"
          value={stats.messages.new}
          hint={`${stats.messages.unanswered} not answered yet`}
          tone={stats.messages.new > 0 ? 'accent' : 'default'}
          href="/admin/messages?status=NEW"
          icon="✉"
        />
        <StatCard
          label="Client accounts"
          value={stats.clients.total}
          hint={`${stats.clients.activeThisWeek} active this week`}
          href="/admin/users"
          icon="👤"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="FAQs published" value={stats.content.faqs} href="/admin/faqs" />
        <StatCard label="Products & services" value={stats.content.services} href="/admin/services" />
        <StatCard label="Testimonials" value={stats.content.testimonials} href="/admin/testimonials" />
        <StatCard label="Gallery images" value={stats.content.gallery} href="/admin/gallery" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Needs your attention</h2>
            <Link href="/admin/appointments" className="text-xs text-brand-300 underline">
              All appointments
            </Link>
          </div>

          {stats.upcoming.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No pending appointments" description="New requests will appear here." icon="—" />
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {stats.upcoming.map((appointment) => (
                <li key={appointment.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-silver-100">
                      {appointment.firstName} {appointment.lastName}
                    </span>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <p className="mt-1 text-xs text-silver-500">
                    {appointmentTypeLabel(appointment.type)} ·{' '}
                    {appointment.scheduledAt
                      ? formatDateTime(appointment.scheduledAt)
                      : `prefers ${formatDateTime(appointment.preferredDate)}`}
                  </p>
                  <p className="mt-1 text-xs text-silver-600">
                    <a href={`tel:${String(appointment.phone || '').replace(/[^\d+]/g, '')}`} className="link-underline">
                      {appointment.phone || 'no phone'}
                    </a>{' '}
                    ·{' '}
                    <a href={`mailto:${appointment.email}`} className="link-underline">
                      {appointment.email}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Latest inquiries</h2>
            <Link href="/admin/messages" className="text-xs text-brand-300 underline">
              Open inbox
            </Link>
          </div>

          {stats.recentMessages.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No inquiries yet" description="Form submissions land here." icon="—" />
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {stats.recentMessages.map((message) => (
                <li key={message.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-silver-100">
                      {message.firstName} {message.lastName}
                    </span>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-silver-500">{message.message}</p>
                  <p className="mt-1 text-xs text-silver-600">
                    {String(message.source).replace(/_/g, ' ').toLowerCase()} ·{' '}
                    {formatRelative(message.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel mt-6">
        <h2 className="text-lg">Content checklist</h2>
        <p className="mt-2 text-sm text-silver-400">
          Everything below is editable from this portal — no code change required.
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {[
            ['/admin/faqs', 'FAQs', stats.content.faqs],
            ['/admin/services', 'Products & Materials + Services', stats.content.services],
            ['/admin/testimonials', 'Testimonials', stats.content.testimonials],
            ['/admin/gallery', 'Gallery / portfolio', stats.content.gallery],
            ['/admin/content', 'Page titles & descriptions', null],
            ['/admin/settings', 'Contact details & opening hours', null],
          ].map(([href, label, value]) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 rounded border border-white/10 px-4 py-3 transition hover:border-brand-400/40 hover:bg-white/[0.03]"
              >
                <span className="text-silver-300">{label}</span>
                <span className="text-xs text-brand-300">{value === null ? 'Manage →' : `${value} live`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  const stats = await getDashboardStats();
  return { props: { ...guard.props, stats } };
}