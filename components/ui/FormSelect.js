import { useId } from 'react';

/** Labelled `<select>` used for appointment types and admin filters. */
export default function FormSelect({
  label,
  name,
  options = [],
  required = false,
  error,
  hint,
  value,
  onChange,
  defaultValue,
  placeholder,
  disabled = false,
  className = '',
  ...rest
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-brand-200">
        {label}
        {required ? (
          <span className="ml-1 text-error-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <select
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        defaultValue={defaultValue}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={[
          'block w-full appearance-none rounded-md border bg-ink-700 px-4 py-3 text-sm text-silver-50',
          'transition-colors duration-250 disabled:opacity-60',
          error ? 'border-error-400' : 'border-white/15 hover:border-brand-400/40 focus:border-brand-400',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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