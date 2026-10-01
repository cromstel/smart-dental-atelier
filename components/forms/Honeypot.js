import { useId } from 'react';

/**
 * Honeypot field.
 *
 * A real person never sees it and never fills it; bots fill every input they
 * find. The API treats a non-empty value as spam and silently discards the
 * submission (returning 200 so bots get no signal).
 *
 * Hidden with CSS + `aria-hidden` + `tabIndex={-1}` + `autoComplete="off"` so
 * it is skipped by screen readers and keyboard users.
 */
export default function Honeypot({ value, onChange, name = 'website' }) {
  const id = useId();

  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input
        id={id}
        type="text"
        name={name}
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}