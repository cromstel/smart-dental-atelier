import { useCallback, useState } from 'react';

/**
 * Shared submission state for every public form.
 *
 * Responsibilities:
 *  - POST JSON to the given endpoint
 *  - map the API's `details` field (Zod field->message) onto local errors
 *  - keep a single `status` ('idle' | 'submitting' | 'success' | 'error') so
 *    buttons, spinners and the live region stay in sync
 *  - read a nonce off the endpoint for double-submit protection (optional)
 *
 * @param {string} endpoint
 * @param {object} initialValues
 * @param {(values:object) => string|null} validate  client-side pre-flight
 */
export default function useFormSubmit(endpoint, initialValues = {}, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  // When the form was first shown, used for the anti-bot timing check.
  // `useState` with a lazy initialiser runs the function exactly once, during
  // the first render — `useRef(Date.now())` would re-evaluate `Date.now()` on
  // every render, which is an impure call in the render phase.
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue],
  );

  // A stable key for the initial values, so `reset` re-creates only when the
  // caller actually passes a different set of defaults. Computed during render
  // (a pure function of props), so it satisfies the hooks lint rules.
  const initialKey = JSON.stringify(initialValues);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setStatus('idle');
    setMessage('');
    setStartedAt(Date.now());
    // initialValues is a literal at the call site; resetting to it is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const submit = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const localErrors = validate ? validate(values) : {};
      if (Object.keys(localErrors).length > 0) {
        setErrors(localErrors);
        setStatus('error');
        setMessage('Please check the highlighted fields.');
        return false;
      }

      setStatus('submitting');
      setErrors({});

      // Anti-bot: a form completed faster than a human can type it is rejected.
      const elapsedMs = Date.now() - startedAt;
      const payload = {
        ...values,
        _t: Math.round(elapsedMs / 1000),
        referrer: typeof window !== 'undefined' ? window.location.pathname : undefined,
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Thank you - your message has been received.');
          // Re-stamp so a second submit is timed from the first, not from
          // when the page was opened.
          setStartedAt(Date.now());
          return true;
        }

        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        if (data.details) setErrors(data.details);
        return false;
      } catch (error) {
        setStatus('error');
        setMessage('We could not reach the server. Please try again, or call us directly.');
        return false;
      }
    },
    // `startedAt` is included so the elapsed-time measurement always reflects
    // the value currently in state (it is re-stamped after a successful send).
    [endpoint, validate, values, startedAt],
  );

  return {
    values,
    errors,
    status,
    message,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    setValue,
    setValues,
    handleChange,
    submit,
    reset,
    startedAt,
  };
}

/**
 * Client-side validation shared by the forms (the server validates again).
 */
export const requiredRule = (label) => (value) =>
  !String(value ?? '').trim() ? `${label} is required.` : undefined;

export const emailRule = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return 'E-mail is required.';
  // A domain needs a label and a TLD, so the shortest valid form is
  // `a@b.co` (3 characters after the dot). Two characters are a country-code
  // TLD; one is not a TLD at all.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) return 'Please enter a valid e-mail address.';
  return undefined;
};

export const phoneRule = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  return /^[+0-9][0-9\s./-]{5,}$/.test(raw) ? undefined : 'Please enter a valid phone number.';
};

/**
 * Collapse a rule map into a `{field: message}` object, dropping empties.
 *
 * Each rule is called as `rule(values[field], values)`, so a shared rule such
 * as `emailRule` can be listed directly (`{ email: emailRule }`) while a rule
 * that depends on another field can still close over the whole object.
 * Messages must be `undefined` to pass.
 *
 * @param {Record<string, (value: unknown, values: object) => string|undefined>} rules
 * @param {object} values
 */
export function collectErrors(rules, values = {}) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}