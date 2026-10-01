import Link from 'next/link';

/**
 * Button / link button.
 *
 * Renders an `<a>` (via next/link) when `href` is set, a `<button>` otherwise,
 * so keyboard and screen-reader behaviour stays correct in both cases.
 *
 * variants: primary | secondary | ghost | danger
 * sizes:    sm | md | lg
 */
const VARIANTS = {
  primary:
    'bg-brand-400 text-black border border-brand-400 hover:bg-brand-300 hover:border-brand-300 active:bg-brand-500',
  secondary:
    'bg-transparent text-brand-200 border border-brand-400/60 hover:bg-brand-400/10 hover:border-brand-400 hover:text-brand-100',
  ghost: 'bg-transparent text-silver-300 border border-transparent hover:bg-white/5 hover:text-brand-200',
  danger: 'bg-error-500 text-white border border-error-500 hover:bg-error-600 hover:border-error-600',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function PrimaryButton({
  label,
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  external = false,
  ariaLabel,
  ...rest
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-250',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {label || children}
    </>
  );

  if (href) {
    const isExternal = external || /^https?:/.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          aria-label={ariaLabel}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} aria-disabled={disabled || undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}