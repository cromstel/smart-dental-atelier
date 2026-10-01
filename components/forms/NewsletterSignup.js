import { useMemo } from 'react';
import FormInput from '@/components/ui/FormInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import Honeypot from './Honeypot';
import useFormSubmit, { collectErrors, emailRule } from './useFormSubmit';

/**
 * Newsletter / mailing-list signup.
 *
 * Doubles as an RSS-less "keep me posted about new cases" opt-in. The list is
 * double opt-in on the server side: an address is stored inactive until the
 * confirmation link is clicked, so we never mail someone who did not ask.
 */
export default function NewsletterSignup({
  endpoint = '/api/newsletter',
  source = 'footer',
  placeholder = 'Your e-mail address',
  label = 'E-mail',
  submitLabel = 'Subscribe',
  className = '',
}) {
  const initialValues = useMemo(() => ({ email: '', name: '', website: '' }), []);

  const validate = (values) => collectErrors({ email: emailRule }, values);

  const form = useFormSubmit(endpoint, initialValues, validate);

  return (
    <form method="post" onSubmit={form.submit} noValidate className={className}>
      <div aria-live="polite">
        {form.isSuccess ? (
          <Alert tone="success" className="mb-4">
            {form.message || 'Almost done — please confirm via the e-mail we just sent you.'}
          </Alert>
        ) : null}
        {form.status === 'error' && form.message && !form.errors.email ? (
          <Alert tone="error" className="mb-4">
            {form.message}
          </Alert>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <FormInput
            label={label}
            name="email"
            type="email"
            required
            placeholder={placeholder}
            autoComplete="email"
            value={form.values.email}
            onChange={form.handleChange}
            error={form.errors.email}
          />
        </div>

        <div className="sm:pt-7">
          <PrimaryButton type="submit" loading={form.isSubmitting} disabled={form.isSuccess}>
            {submitLabel}
          </PrimaryButton>
        </div>
      </div>

      <input type="hidden" name="source" value={source} />
      <Honeypot value={form.values.website} onChange={form.handleChange} />

      <p className="mt-3 text-xs text-silver-600">
        We e-mail a few times a year about new cases. Unsubscribe with one click, any time.
      </p>
    </form>
  );
}