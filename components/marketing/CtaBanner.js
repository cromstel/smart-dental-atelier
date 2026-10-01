import Link from 'next/link';
import PrimaryButton from '@/components/ui/PrimaryButton';

/**
 * Reusable call-to-action band. Used at the bottom of every thematic subpage
 * and on the portfolio / FAQ pages, mirroring the "Request more information"
 * and "Please ask for consultation" prompts of the original site.
 */
export default function CtaBanner({
  title = 'Ready for your smile check?',
  description = 'Look in the mirror, give yourself a big smile and tell us what you would change if possible. Find out what bothers you.',
  primary = { label: 'Use our smile check form as a help', href: '/smile-check-form' },
  secondary = { label: 'Book a free consultation', href: '/book-appointment' },
  className = '',
}) {
  return (
    <aside
      className={`rounded-xl border border-brand-400/30 bg-gradient-to-br from-brand-900/50 via-ink-800 to-ink p-8 md:p-12 ${className}`}
    >
      <h2 className="max-w-2xl text-2xl md:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-silver-300 md:text-base">{description}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {primary ? (
          <PrimaryButton href={primary.href} variant="primary" size="lg">
            {primary.label}
          </PrimaryButton>
        ) : null}
        {secondary ? (
          <PrimaryButton href={secondary.href} variant="secondary" size="lg">
            {secondary.label}
          </PrimaryButton>
        ) : null}
      </div>
    </aside>
  );
}

/** Compact inline prompt used inside long-form copy. */
export function InlineCta({ label, href, description }) {
  return (
    <p className="mt-6">
      <Link href={href} className="font-semibold text-brand-300 underline decoration-dotted underline-offset-4 transition hover:text-brand-200">
        {label}
      </Link>
      {description ? <span className="text-silver-400"> {description}</span> : null}
    </p>
  );
}