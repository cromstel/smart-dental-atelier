import { useMemo } from 'react';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import Honeypot from './Honeypot';
import useFormSubmit, { collectErrors, emailRule, phoneRule } from './useFormSubmit';

/**
 * "Request more information" form — the four-field form that appears on
 * Products & Materials, Portfolio and the Facial-analysis subpage in the
 * original site. Phone is mandatory here (the legacy form required it).
 */
export default function RequestInfoForm({
  endpoint = '/api/request-info',
  submitLabel = 'Submit',
  topic,
  title = 'Request more information',
  description = 'Tell us how to reach you and we will send the requested information.',
  showMessage = true,
  successMessage = 'Thank you. We will send you the information shortly.',
  className = '',
}) {
  const initialValues = useMemo(
    () => ({ firstName: '', lastName: '', email: '', phone: '', message: '', website: '', topic: topic || '' }),
    [topic],
  );

  const validate = (values) =>
    collectErrors(
      {
        firstName: (value) => (String(value).trim() ? undefined : 'First name is required.'),
        lastName: (value) => (String(value).trim() ? undefined : 'Surname is required.'),
        email: emailRule,
        // Phone is mandatory on this form (the legacy form required it too).
        phone: (value) => (String(value).trim() ? phoneRule(value) : 'Phone is required.'),
      },
      values,
    );

  const form = useFormSubmit(endpoint, initialValues, validate);

  return (
    <form onSubmit={form.submit} noValidate className={className}>
      {title ? <h2 className="mb-2 text-2xl">{title}</h2> : null}
      {description ? <p className="mb-6 text-sm text-silver-400">{description}</p> : null}

      <div aria-live="polite">
        {form.isSuccess ? (
          <Alert tone="success" className="mb-6">
            {form.message || successMessage}
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
          value={form.values.phone}
          onChange={form.handleChange}
          error={form.errors.phone}
        />
      </div>

      {showMessage ? (
        <div className="mt-5">
          <FormTextArea
            label="Your enquiry"
            name="message"
            rows={4}
            value={form.values.message}
            onChange={form.handleChange}
            error={form.errors.message}
          />
        </div>
      ) : null}

      <Honeypot value={form.values.website} onChange={form.handleChange} />

      <div className="mt-8">
        <PrimaryButton type="submit" loading={form.isSubmitting} disabled={form.isSuccess}>
          {form.isSubmitting ? 'Sending…' : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
}