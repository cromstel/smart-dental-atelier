/** Inline loading indicator with an accessible label. */
export default function Spinner({ label = 'Loading', className = '' }) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-sm text-silver-400 ${className}`}>
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-panel empty state for admin tables and the client portal. */
export function EmptyState({ title, description, action, icon = '—' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/15 px-6 py-12 text-center">
      <span className="text-3xl text-brand-400/60" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-lg text-silver-100">{title}</h3>
      {description ? <p className="max-w-md text-sm text-silver-500">{description}</p> : null}
      {action}
    </div>
  );
}