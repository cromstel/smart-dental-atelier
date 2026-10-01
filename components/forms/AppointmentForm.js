import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import FormSelect from '@/components/ui/FormSelect';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import Honeypot from './Honeypot';
import useFormSubmit, { collectErrors, emailRule, phoneRule } from './useFormSubmit';
import { APPOINTMENT_TYPES, toDateInputValue } from '@/lib/format';
import { SITE } from '@/lib/content';

/**
 * Appointment request form.
 *
 * Guests submit freely (no account needed — the studio confirms by phone).
 * Signed-in clients get their name/e-mail prefilled and the request is linked
 * to their account so it shows up in the client portal.
 */
export default function AppointmentForm({
  endpoint = '/api/appointments',
  services = [],
  submitLabel = 'Request appointment',
  showType = true,
  defaultType = 'CONSULTATION',
  title = 'Request an appointment',
  description,
  className = '',
}) {
  const { data: session, status: sessionStatus } = useSession();

  const initialValues = useMemo(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      preferredDate: '',
      type: defaultType,
      serviceId: '',
      notes: '',
      website: '',
    }),
    [defaultType],
  );

  const validate = (values) => {
    const errors = collectErrors(
      {
        firstName: (value) => (String(value).trim() ? undefined : 'First name is required.'),
        lastName: (value) => (String(value).trim() ? undefined : 'Surname is required.'),
        email: emailRule,
        phone: (value) => (String(value).trim() ? phoneRule(value) : 'Phone is required.'),
        preferredDate: (value) =>
          value ? undefined : 'Please choose a preferred date so we can confirm a slot.',
      },
      values,
    );

    // Booking in the past is always a mistake.
    if (values.preferredDate) {
      const chosen = new Date(values.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(chosen.getTime()) && chosen < today) {
        errors.preferredDate = 'Please choose a date in the future.';
      }
    }

    return errors;
  };

  const form = useFormSubmit(endpoint, initialValues, validate);

  // Prefill from the signed-in portal account (never overwrite user input).
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;
    const { name, email } = session.user;
    if (!name && !email) return;

    const parts = String(name || '').trim().split(/\s+/);
    form.setValues((current) => ({
      ...current,
      firstName: current.firstName || parts[0] || '',
      lastName: current.lastName || parts.slice(1).join(' ') || '',
      email: current.email || email || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  return (
    <form onSubmit={form.submit} noValidate className={className}>
      {title ? <h2 className="mb-2 text-2xl">{title}</h2> : null}
      {description ? <p className="mb-6 text-sm text-silver-400">{description}</p> : null}

      <div aria-live="polite">
        {form.isSuccess ? (
          <Alert tone="success" className="mb-6" title="Appointment requested">
            {form.message ||
              `Thank you. We will call you on the number provided to confirm the exact time.` +
                (sessionStatus === 'authenticated' ? ' The request is also visible in your portal.' : '')}
          </Alert>
        ) : null}
        {form.status === 'error' && form.message && Object.keys(form.errors).length === 0 ? (
          <Alert tone="error" className="mb-6">
            {form.message}
          </Alert>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          label="Firstname"
          name="firstName"
          required
          autoComplete="given-name"
          value={form.values.firstName}
          onChange={form.handleChange}
          error={form.errors.firstName}
        />
        <FormInput
          label="Surname"
          name="lastName"
          required
          autoComplete="family-name"
          value={form.values.lastName}
          onChange={form.handleChange}
          error={form.errors.lastName}
        />
        <FormInput
          label="E-mail"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={form.values.email}
          onChange={form.handleChange}
          error={form.errors.email}
        />
        <FormInput
          label="Phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+32 478 54 74 75"
          hint="We confirm the exact time by phone."
          value={form.values.phone}
          onChange={form.handleChange}
          error={form.errors.phone}
        />

        {showType ? (
          <FormSelect
            label="Type of appointment"
            name="type"
            value={form.values.type}
            onChange={form.handleChange}
            options={APPOINTMENT_TYPES}
          />
        ) : null}

        {services.length > 0 ? (
          <FormSelect
            label="What is it about?"
            name="serviceId"
            value={form.values.serviceId}
            onChange={form.handleChange}
            placeholder="Not sure yet"
            options={services.map((service) => ({ value: String(service.id ?? service.slug), label: service.title }))}
          />
        ) : null}

        <div className="sm:col-span-2">
          <FormInput
            label="Preferred date"
            name="preferredDate"
            type="date"
            required
            min={toDateInputValue()}
            hint="Pick a day you are available; we will agree the exact slot with you."
            value={form.values.preferredDate}
            onChange={form.handleChange}
            error={form.errors.preferredDate}
          />
        </div>
      </div>

      <div className="mt-5">
        <FormTextArea
          label="Anything we should know?"
          name="notes"
          rows={4}
          placeholder="Optional — e.g. which teeth bother you, or the name of your dentist."
          value={form.values.notes}
          onChange={form.handleChange}
          error={form.errors.notes}
        />
      </div>

      <Honeypot value={form.values.website} onChange={form.handleChange} />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <PrimaryButton type="submit" size="lg" loading={form.isSubmitting} disabled={form.isSuccess}>
          {form.isSubmitting ? 'Sending…' : submitLabel}
        </PrimaryButton>
        <p className="text-xs text-silver-500">
          Or call us directly on{' '}
          <a href={`tel:${SITE.mobile.replace(/[^\d+]/g, '')}`} className="link-underline">
            {SITE.mobileDisplay}
          </a>
        </p>
      </div>
    </form>
  );
}