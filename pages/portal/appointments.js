import { useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import PrimaryButton from '@/components/ui/PrimaryButton';
import StatusBadge from '@/components/admin/StatusBadge';
import Alert from '@/components/ui/Alert';
import AppointmentForm from '@/components/forms/AppointmentForm';
import { EmptyState } from '@/components/ui/Spinner';
import { requireClientPage } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate, formatDateTime, appointmentTypeLabel } from '@/lib/format';
import { getServices } from '@/lib/cms';

/**
 * Client portal — appointments.
 * A client can book a new request and cancel a pending/confirmed one.
 */
export default function PortalAppointmentsPage({ user, appointments = [], services = [] }) {
  const [rows, setRows] = useState(appointments);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const cancel = async (id) => {
    setError('');
    setCancelling(id);
    try {
      const response = await fetch('/api/portal/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel' }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'We could not cancel that appointment.');
        return;
      }

      setRows((current) =>
        current.map((appointment) =>
          appointment.id === id ? { ...appointment, status: data.status } : appointment,
        ),
      );
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <PortalShell
      title="My appointments"
      description="Every request you have sent us, with its current status."
    >
      <div aria-live="polite">
        {error ? (
          <Alert tone="error" className="mb-6" onDismiss={() => setError('')}>
            {error}
          </Alert>
        ) : null}
      </div>

      <section className="panel">
        <h2 className="text-lg">History</h2>

        {rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No appointments yet"
              description="Use the form below to request your first free consultation."
              icon="—"
            />
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {rows.map((appointment) => {
              const cancellable = ['PENDING', 'CONFIRMED'].includes(appointment.status);

              return (
                <li key={appointment.id} className="rounded-lg border border-white/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-silver-100">
                        {appointmentTypeLabel(appointment.type)}
                      </p>
                      <p className="mt-1 text-xs text-silver-500">
                        Requested {formatDate(appointment.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-caps text-silver-500">Preferred day</dt>
                      <dd className="mt-1 text-silver-300">{formatDate(appointment.preferredDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-caps text-silver-500">Confirmed slot</dt>
                      <dd className="mt-1 text-silver-300">
                        {appointment.scheduledAt ? formatDateTime(appointment.scheduledAt) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-caps text-silver-500">Service</dt>
                      <dd className="mt-1 text-silver-300">{appointment.service?.title || '—'}</dd>
                    </div>
                  </dl>

                  {appointment.notes ? (
                    <p className="mt-4 rounded bg-white/[0.03] p-3 text-xs text-silver-400">
                      {appointment.notes}
                    </p>
                  ) : null}

                  {cancellable ? (
                    <div className="mt-4">
                      <PrimaryButton
                        variant="ghost"
                        size="sm"
                        loading={cancelling === appointment.id}
                        onClick={() => cancel(appointment.id)}
                      >
                        Cancel this request
                      </PrimaryButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel mt-8">
        <AppointmentForm
          services={services}
          title="Request a new appointment"
          description="Pick a day you are available and we will call you to agree the exact time."
          submitLabel="Request appointment"
        />
      </section>

      <p className="mt-6 text-xs text-silver-600">
        Need to change something urgently?{' '}
        <Link href="/contact-us" className="link-underline">
          Contact us
        </Link>
        .
      </p>
    </PortalShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireClientPage(ctx);
  if (guard.redirect) return guard;

  const services = await getServices('product');

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, appointments: [], services } };
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId: guard.props.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { service: { select: { title: true } } },
  });

  return { props: { ...guard.props, appointments, services } };
}