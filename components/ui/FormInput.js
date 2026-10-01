import { useId } from 'react';

/**
 * Labelled text input.
 *
 * Accessibility notes (the legacy forms had floating labels with no `for`
 * attribute and relied on colour alone for errors):
 *  - `<label htmlFor>` is always rendered and linked via `useId`
 *  - the error message is wired with `aria-describedby` + `role="alert"`
 *  - `aria-invalid` is set when there is an error
 *  - `required` sets both the HTML attribute and `aria-required`
 */
export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  error,
  hint,
  value,
  onChange,
  defaultValue,
  autoComplete,
  inputMode,
  maxLength,
  disabled = false,
  className = '',
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  const inputClasses = [
    'block w-full rounded-md border bg-white/[0.06] px-4 py-3 text-sm text-silver-50 placeholder:text-silver-600',
    'transition-colors duration-250 disabled:opacity-60',
    error
      ? 'border-error-400 focus:border-error-400'
      : 'border-white/15 hover:border-brand-400/40 focus:border-brand-400',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const Control = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-brand-200">
        {label}
        {required ? (
          <span className="ml-1 text-error-400" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1 text-xs font-normal text-silver-600">(optional)</span>
        )}
      </label>

      <Control
        id={id}
        name={name}
        type={Control === 'input' ? type : undefined}
        rows={type === 'textarea' ? 4 : undefined}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        className={inputClasses}
        {...rest}
      />

      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-silver-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-error-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}