const TONES = {
  info: 'border-accent-400/40 bg-accent-400/10 text-accent-300',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  error: 'border-error-400/40 bg-error-400/10 text-error-300',
  brand: 'border-brand-400/40 bg-brand-400/10 text-brand-200',
};

/**
 * Status / callout box.
 *
 * `error` and `success` are announced to screen readers via `role="alert"` /
 * `role="status"`; forms use this to report server responses.
 */
export default function Alert({ tone = 'info', title, children, onDismiss, className = '' }) {
  const live = tone === 'error' ? 'alert' : 'status';

  return (
    <div
      role={live}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={[
        'flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
        TONES[tone] || TONES.info,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" className="mt-0.5 text-base leading-none">
        {tone === 'error' ? '!' : tone === 'success' ? '✓' : tone === 'warning' ? '▲' : 'i'}
      </span>

      <div className="flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1 text-lg leading-none opacity-70 transition hover:opacity-100"
          aria-label="Dismiss message"
        >
          &times;
        </button>
      ) : null}
    </div>
  );
}