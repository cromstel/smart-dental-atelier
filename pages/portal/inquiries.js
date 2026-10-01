import { useState } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import FormTextArea from '@/components/ui/FormTextArea';
import FormInput from '@/components/ui/FormInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import StatusBadge from '@/components/admin/StatusBadge';
import Alert from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/Spinner';
import { requireClientPage } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { formatDate } from '@/lib/format';

const SOURCE_LABELS = {
  PORTAL: 'Message',
  CONTACT: 'Contact form',
  SMILE_CHECK: 'Smile check',
  REQUEST_INFO: 'Information request',
  PORTFOLIO_REQUEST: 'Portfolio request',
  FAQ_QUESTION: 'FAQ question',
};

/** Client portal — inquiries sent to the atelier, plus a new message form. */
export default function PortalInquiriesPage({ user, messages = [] }) {
  const [values, setValues] = useState({ message: '', phone: user?.phone || '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'We could not send that. Please try again.');
        return;
      }

      setStatus('success');
      setMessage('Thank you — your message has been sent to the atelier.');
      setValues({ message: '', phone: user?.phone || '' });
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please try again.');
    }
  };

  return (
    <PortalShell
      title="My inquiries"
      description="Everything you have sent us, and the status of each item."
    >
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section>
          <h2 className="text-lg">History</h2>

          {messages.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No inquiries yet"
                description="Run the smile check or send us a question using the form."
                icon="—"
              />
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {messages.map((inquiry) => (
                <li key={inquiry.id} className="rounded-lg border border-white/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-caps text-brand-400">
                      {SOURCE_LABELS[inquiry.source] || inquiry.source}
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={inquiry.status} />
                      <span className="text-xs text-silver-600">{formatDate(inquiry.createdAt)}</span>
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-silver-300">
                    {inquiry.message}
                  </p>

                  {inquiry.smileCheckAnswers ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-semibold text-brand-300">
                        Smile check answers
                      </summary>
                      <p className="mt-2 text-xs text-silver-500">
                        Question numbers: {inquiry.smileCheckAnswers}
                      </p>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="text-lg">Send a message</h2>

          <div aria-live="polite">
            {status === 'success' ? (
              <Alert tone="success" className="mt-4">
                {message}
              </Alert>
            ) : null}
            {status === 'error' ? (
              <Alert tone="error" className="mt-4">
                {message}
              </Alert>
            ) : null}
          </div>

          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <FormTextArea
              label="Your message"
              name="message"
              required
              rows={6}
              value={values.message}
              onChange={(event) => setValues((c) => ({ ...c, message: event.target.value }))}
            />

            <FormInput
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+32 478 54 74 75"
              value={values.phone}
              onChange={(event) => setValues((c) => ({ ...c, phone: event.target.value }))}
            />

            <PrimaryButton type="submit" loading={status === 'submitting'} disabled={status === 'success'}>
              {status === 'submitting' ? 'Sending…' : 'Send message'}
            </PrimaryButton>
          </form>
        </section>
      </div>
    </PortalShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireClientPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, messages: [] } };
  }

  const messages = await prisma.contactMessage.findMany({
    where: { userId: guard.props.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return { props: { ...guard.props, messages } };
}