import { useState } from 'react';
import PortalShell from '@/components/portal/PortalShell';
import FormInput from '@/components/ui/FormInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import { requireClientPage } from '@/lib/guards';
import { formatDate } from '@/lib/format';

/** Client portal — profile and password. */
export default function PortalProfilePage({ user }) {
  const [values, setValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('idle');
    setMessage('');
    setDetails({});

    if (values.password && values.password !== values.confirmPassword) {
      setStatus('error');
      setMessage('The two passwords do not match.');
      setDetails({ confirmPassword: 'The two passwords do not match.' });
      return;
    }

    setStatus('submitting');
    try {
      const payload = { name: values.name, email: values.email, phone: values.phone };
      if (values.password) payload.password = values.password;

      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'We could not save your profile.');
        if (data.details) setDetails(data.details);
        return;
      }

      setStatus('success');
      setMessage('Your profile has been updated.');
      setValues((current) => ({ ...current, password: '', confirmPassword: '' }));
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please try again.');
    }
  };

  return (
    <PortalShell title="My profile" description="Your contact details, as we hold them.">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="panel">
          <form method="post" onSubmit={submit} noValidate>
            <div aria-live="polite">
              {status === 'success' ? (
                <Alert tone="success" className="mb-6">
                  {message}
                </Alert>
              ) : null}
              {status === 'error' ? (
                <Alert tone="error" className="mb-6">
                  {message}
                </Alert>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Full name"
                name="name"
                required
                autoComplete="name"
                value={values.name}
                onChange={handleChange}
                error={details.name}
              />
              <FormInput
                label="E-mail"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={values.email}
                onChange={handleChange}
                error={details.email}
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+32 478 54 74 75"
                  value={values.phone}
                  onChange={handleChange}
                  error={details.phone}
                />
              </div>
            </div>

            <fieldset className="mt-10 border-0 p-0">
              <legend className="text-lg text-silver-100">Change password</legend>
              <p className="mt-2 text-sm text-silver-500">
                Leave both fields empty to keep your current password.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="New password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  hint="At least 10 characters."
                  value={values.password}
                  onChange={handleChange}
                  error={details.password}
                />
                <FormInput
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  error={details.confirmPassword}
                />
              </div>
            </fieldset>

            <div className="mt-8">
              <PrimaryButton type="submit" loading={status === 'submitting'}>
                {status === 'submitting' ? 'Saving…' : 'Save changes'}
              </PrimaryButton>
            </div>
          </form>
        </section>

        <aside className="panel">
          <h2 className="text-lg">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
              <dt className="text-silver-500">Role</dt>
              <dd className="text-silver-200">{user?.role === 'ADMIN' ? 'Administrator' : 'Client'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-silver-500">Member since</dt>
              <dd className="text-silver-200">{formatDate(user?.createdAt)}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs text-silver-600">
            We only use your details to answer you. We never share them, and you can ask us to delete your
            account at any time.
          </p>
        </aside>
      </div>
    </PortalShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireClientPage(ctx);
  if (guard.redirect) return guard;

  const { prisma, isDatabaseConfigured } = await import('@/lib/prisma');
  let createdAt = null;

  if (isDatabaseConfigured) {
    const record = await prisma.user.findUnique({
      where: { id: guard.props.user.id },
      select: { createdAt: true },
    });
    createdAt = record?.createdAt || null;
  }

  return { props: { ...guard.props, user: { ...guard.props.user, createdAt } } };
}