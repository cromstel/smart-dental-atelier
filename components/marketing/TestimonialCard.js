import Image from 'next/image';
import { initials } from '@/lib/format';

/** A single quote + author, used inside the testimonials slider. */
export default function TestimonialCard({ quote, author, treatment, avatarSrc, className = '' }) {
  return (
    <figure
      className={`flex h-full flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-8 ${className}`}
    >
      <div>
        <span aria-hidden="true" className="font-display text-5xl leading-none text-brand-400/60">
          &ldquo;
        </span>
        <blockquote className="mt-2 text-lg leading-relaxed text-silver-200">{quote}</blockquote>
      </div>

      <figcaption className="mt-8 flex items-center gap-3">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={`Portrait of ${author}`}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-400/40 bg-brand-400/10 text-sm font-semibold text-brand-200"
          >
            {initials(author)}
          </span>
        )}

        <span>
          <span className="block text-sm font-semibold text-brand-200">{author}</span>
          {treatment ? <span className="block text-xs text-silver-500">{treatment}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}