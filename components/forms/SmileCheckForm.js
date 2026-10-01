import { useMemo, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import Honeypot from './Honeypot';
import useFormSubmit, { collectErrors, emailRule } from './useFormSubmit';
import { SITE } from '@/lib/content';

/**
 * The "smile check" form: eleven checklist questions plus contact details.
 *
 * The tick list is a real `<fieldset>`/`<legend>` with grouped checkboxes so
 * screen-reader users know what the questions are about, and the ticked
 * question ids are stored with the inquiry so the studio can see what brought
 * each visitor in.
 */
export default function SmileCheckForm({ questions = [], endpoint = '/api/smile-check', className = '' }) {
  const [answers, setAnswers] = useState([]);

  const initialValues = useMemo(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
      website: '',
      answers: [],
    }),
    [],
  );

  const validate = (values) =>
    collectErrors(
      {
        firstName: (value) => (String(value).trim() ? undefined : 'First name is required.'),
        lastName: (value) => (String(value).trim() ? undefined : 'Surname is required.'),
        email: emailRule,
      },
      values,
    );

  const form = useFormSubmit(endpoint, initialValues, validate);

  const toggleAnswer = (id) => {
    setAnswers((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
    form.setValue('answers', answers.includes(id) ? answers.filter((v) => v !== id) : [...answers, id]);
  };

  const anyChecked = answers.length > 0;

  return (
    <form method="post" onSubmit={form.submit} noValidate className={className}>
      <div aria-live="polite">
        {form.isSuccess ? (
          <Alert tone="success" className="mb-8" title="Thank you">
            {form.message ||
              `We have received your smile check${anyChecked ? ` with ${answers.length} concern(s) noted` : ''}. A laboratory technician will get in touch to arrange your free consultation.`}
          </Alert>
        ) : null}
        {form.status === 'error' && form.message && Object.keys(form.errors).length === 0 ? (
          <Alert tone="error" className="mb-8">
            {form.message} You can also call us on{' '}
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="underline">
              {SITE.phoneDisplay}
            </a>
            .
          </Alert>
        ) : null}
      </div>

      <fieldset className="border-0 p-0">
        <legend className="text-lg font-medium text-silver-100">
          Ready for your smile check?
          <span className="mt-2 block text-sm font-normal text-silver-400">
            Tick everything that applies to you. If you answered yes on one or more of these questions
            please contact us to schedule a free consultation.
          </span>
        </legend>

        <ul className="mt-6 grid gap-3">
          {questions.map((question, index) => {
            const id = question.id ?? index;
            const checked = answers.includes(id);

            return (
              <li key={`${id}-${index}`}>
                <label
                  htmlFor={`smile-check-${id}`}
                  className={`flex cursor-pointer items-start gap-4 rounded-md border p-4 text-sm transition ${
                    checked
                      ? 'border-brand-400 bg-brand-400/10 text-silver-100'
                      : 'border-white/10 text-silver-300 hover:border-brand-400/40'
                  }`}
                >
                  <input
                    id={`smile-check-${id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAnswer(id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-400"
                  />
                  <span>{question.question}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-silver-500" aria-live="polite">
          {answers.length === 0
            ? 'No concerns selected yet — that is fine too, just contact us if you would like a consultation.'
            : `${answers.length} concern${answers.length === 1 ? '' : 's'} selected.`}
        </p>
      </fieldset>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
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
          autoComplete="tel"
          placeholder="+32 478 54 74 75"
          value={form.values.phone}
          onChange={form.handleChange}
          error={form.errors.phone}
        />
      </div>

      <div className="mt-5">
        <FormTextArea
          label="Your enquiry"
          name="message"
          rows={5}
          placeholder="Tell us what bothers you about your smile, or which treatment you are considering."
          value={form.values.message}
          onChange={form.handleChange}
          error={form.errors.message}
        />
      </div>

      <Honeypot value={form.values.website} onChange={form.handleChange} />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <PrimaryButton type="submit" size="lg" loading={form.isSubmitting} disabled={form.isSuccess}>
          {form.isSubmitting ? 'Sending…' : 'Submit smile check'}
        </PrimaryButton>
        <p className="text-xs text-silver-500">
          Prefer to talk?{' '}
          <a href={`tel:${SITE.mobile.replace(/[^\d+]/g, '')}`} className="link-underline">
            {SITE.mobileDisplay}
          </a>
        </p>
      </div>
    </form>
  );
}