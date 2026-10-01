import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import PrimaryButton from '@/components/ui/PrimaryButton';
import StatusBadge from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/Spinner';
import { requireClientPage } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate, formatDateTime, appointmentTypeLabel, statusStyle } from '@/lib/format';

/** Client portal overview: next appointment, recent requests, recent inquiries. */
export default function PortalOverviewPage({ user, appointments = [], messages = [] }) {
  const upcoming = appointments.filter((appointment) =>
    ['PENDING', 'CONFIRMED'].includes(appointment.status),
  );
  const next = upcoming[0] || null;
  const label = next ? statusStyle(next.status).label : null;

  return (
    <PortalShell
      title={`Welcome${user?.name ? `, ${user.name.split(/\s+/)[0]}` : ''}`}
      description="Your appointments and inquiries with the atelier, all in one place."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <h2 className="text-lg">Next appointment</h2>

          {!next ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing booked yet"
                description="Request a free consultation and we will call you to confirm the exact time."
                icon="—"
                action={
                  <PrimaryButton href="/book-appointment" size="sm">
                    Book an appointment
                  </PrimaryButton>
                }
              />
            </div>
          ) : (
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-silver-500">Status</dt>
                <dd className="mt-2">
                  <StatusBadge status={next.status} />
                  {label ? <span className="ml-2 text-xs text-silver-500">{label}</span> : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-silver-500">Type</dt>
                <dd className="mt-2 text-sm text-silver-200">{appointmentTypeLabel(next.type)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-silver-500">
                  Preferred day
                </dt>
                <dd className="mt-2 text-sm text-silver-200">{formatDate(next.preferredDate)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-silver-500">
                  Confirmed slot
                </dt>
                <dd className="mt-2 text-sm text-silver-200">
                  {next.scheduledAt ? formatDateTime(next.scheduledAt) : 'To be confirmed by phone'}
                </dd>
              </div>
              {next.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-caps text-silver-500">Your notes</dt>
                  <dd className="mt-2 text-sm text-silver-300">{next.notes}</dd>
                </div>
              ) : null}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/portal/appointments"
              className="text-sm font-semibold text-brand-300 underline decoration-dotted underline-offset-4"
            >
              See all my appointments
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <h2 className="text-lg">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <PrimaryButton href="/book-appointment" size="sm" className="w-full">
                Book an appointment
              </PrimaryButton>
              <PrimaryButton href="/smile-check-form" variant="secondary" size="sm" className="w-full">
                Smile check form
              </PrimaryButton>
              <PrimaryButton href="/portal/profile" variant="ghost" size="sm" className="w-full">
                My profile
              </PrimaryButton>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-lg">Opening hours</h2>
            <p className="mt-3 text-sm text-silver-400">Monday to Friday, 09:00 – 17:00</p>
            <p className="mt-2 text-sm text-silver-500">
              Something urgent? Call{' '}
              <a href="tel:+32478547475" className="link-underline">
                +32 478 54 74 75
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <h2 className="text-lg">Recent inquiries</h2>
          {messages.length === 0 ? (
            <p className="mt-4 text-sm text-silver-500">
              You have not sent us any inquiries yet.{' '}
              <Link href="/smile-check-form" className="link-underline text-brand-300">
                Run the smile check
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {messages.slice(0, 5).map((message) => (
                <li key={message.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-caps text-brand-400">
                      {String(message.source).replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-silver-400">{message.message}</p>
                  <p className="mt-1 text-xs text-silver-600">{formatDate(message.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="text-lg">Past appointments</h2>
          {appointments.length === 0 ? (
            <p className="mt-4 text-sm text-silver-500">Nothing here yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {appointments.slice(0, 6).map((appointment) => (
                <li key={appointment.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-silver-300">
                    {appointmentTypeLabel(appointment.type)} ·{' '}
                    <span className="text-silver-500">
                      {formatDate(appointment.scheduledAt || appointment.preferredDate)}
                    </span>
                  </span>
                  <StatusBadge status={appointment.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireClientPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, appointments: [], messages: [] } };
  }

  const [appointments, messages] = await Promise.all([
    prisma.appointment.findMany({
      where: { userId: guard.props.user.id },
      orderBy: [{ createdAt: 'desc' }],
      take: 20,
    }),
    prisma.contactMessage.findMany({
      where: { userId: guard.props.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return { props: { ...guard.props, appointments, messages } };
}