import { statusStyle } from '@/lib/format';

/** Small pill used for statuses, categories and counts. */
export default function Badge({ children, tone, status, className = '' }) {
  if (status) {
    const { label, className: statusClass } = statusStyle(status);
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-caps ${statusClass} ${className}`}
      >
        {label}
      </span>
    );
  }

  const tones = {
    brand: 'border-brand-400/40 bg-brand-400/10 text-brand-200',
    neutral: 'border-white/15 bg-white/5 text-silver-400',
    gold: 'bg-brand-400 text-black',
    outline: 'border-brand-400/50 text-brand-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-caps ${
        tones[tone] || tones.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}