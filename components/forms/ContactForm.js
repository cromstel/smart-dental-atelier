import { useMemo } from 'react';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import Honeypot from './Honeypot';
import useFormSubmit, { collectErrors, emailRule, phoneRule } from './useFormSubmit';
import { SITE } from '@/lib/content';

/**
 * Contact / inquiry form.
 *
 * Used by:
 *  - Contact Us          -> POST /api/contact
 *  - FAQs ("Ask a question") -> POST /api/contact
 *  - Portfolio ("Request full portfolio") -> POST /api/request-info
 *  - subpages            -> POST /api/request-info
 *
 * Behaviour: client-side validation, server-side validation errors mapped onto
 * individual fields, a honeypot, and a polite live region for the result.
 */
export default function ContactForm({
  endpoint = '/api/contact',
  source = 'contact',
  submitLabel = 'Submit',
  title,
  description,
  showMessage = true,
  showPhone = true,
  requirePhone = false,
  phoneLabel = 'Phone',
  successMessage = 'Thank you. Your message has reached our laboratory — we usually reply within one working day.',
  compact = false,
  className = '',
}) {
  const initialValues = useMemo(
    () => ({ firstName: '', lastName: '', email: '', phone: '', message: '', website: '' }),
    [],
  );

  const validate = (values) =>
    collectErrors({
      // `collectErrors` passes the field's own value, so shared rules can be listed
      // directly and only cross-field rules need the full object.
      firstName: (value) => (String(value).trim() ? undefined : 'First name is required.'),
      lastName: (value) => (String(value).trim() ? undefined : 'Surname is required.'),
      email: emailRule,
      phone: requirePhone
        ? (value) => (String(value).trim() ? phoneRule(value) : 'Phone is required.')
        : phoneRule,
      message: (value) =>
        showMessage && !String(value).trim() ? 'Your enquiry is required.' : undefined,
    }, values);

  const form = useFormSubmit(endpoint, initialValues, validate);

  return (
    <form method="post" onSubmit={form.submit} noValidate className={className} aria-describedby="contact-form-status">
      {title ? <h2 className="mb-2 text-2xl">{title}</h2> : null}
      {description ? <p className="mb-6 text-sm text-silver-400">{description}</p> : null}

      {/* Result / error summary */}
      <div id="contact-form-status" aria-live="polite">
        {form.isSuccess ? (
          <Alert tone="success" className="mb-6" title="Message received">
            {form.message || successMessage}
          </Alert>
        ) : null}

        {/*
          The summary is shown for every failure, including one with field
          errors: a screen-reader user needs to be told that something failed
          before being left to hunt for the red text on each input. The
          "call us" fallback only appears when the failure is not something the
          visitor can fix by editing the form.
        */}
        {form.status === 'error' && form.message ? (
          <Alert tone="error" className="mb-6" title="We could not send that">
            {form.message}
            {Object.keys(form.errors).length === 0 ? (
              <>
                {' '}
                You can also call us on{' '}
                <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="underline">
                  {SITE.phoneDisplay}
                </a>
                .
              </>
            ) : null}
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
          inputMode="email"
          value={form.values.email}
          onChange={form.handleChange}
          error={form.errors.email}
        />
        {showPhone ? (
          <FormInput
            label={phoneLabel}
            name="phone"
            type="tel"
            required={requirePhone}
            autoComplete="tel"
            inputMode="tel"
            placeholder="+32 478 54 74 75"
            value={form.values.phone}
            onChange={form.handleChange}
            error={form.errors.phone}
          />
        ) : null}
      </div>

      {showMessage ? (
        <div className={compact ? 'mt-5' : 'mt-5'}>
          <FormTextArea
            label="Your enquiry"
            name="message"
            required
            rows={compact ? 4 : 6}
            value={form.values.message}
            onChange={form.handleChange}
            error={form.errors.message}
          />
        </div>
      ) : null}

      <Honeypot value={form.values.website} onChange={form.handleChange} />

      {/* Carries the origin of the submission for the admin inbox. */}
      <input type="hidden" name="source" value={source} />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <PrimaryButton type="submit" loading={form.isSubmitting} disabled={form.isSuccess}>
          {form.isSubmitting ? 'Sending…' : submitLabel}
        </PrimaryButton>

        <p className="text-xs text-silver-500">
          Fields marked <span className="text-error-400">*</span> are required. We never share your
          details.
        </p>
      </div>
    </form>
  );
}