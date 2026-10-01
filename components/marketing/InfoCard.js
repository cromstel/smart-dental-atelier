import Image from 'next/image';
import Link from 'next/link';

/**
 * Card with heading + text, used for the service catalogue (Products &
 * Materials, Services) and the FAQ answer grid.
 *
 * imagePosition: top | side | none
 */
export default function InfoCard({
  title,
  description,
  imageSrc,
  imageAlt,
  href,
  ctaLabel,
  eyebrow,
  imagePosition = 'top',
  className = '',
  children,
}) {
  const Wrapper = href ? Link : 'div';
  const wrapperProps = href ? { href } : {};

  const media = imageSrc ? (
    <div className={`relative overflow-hidden bg-ink-700 ${imagePosition === 'side' ? 'md:w-2/5' : ''}`}>
      <Image
        src={imageSrc}
        alt={imageAlt || ''}
        fill
        sizes={imagePosition === 'side' ? '(min-width:768px) 33vw, 100vw' : '(min-width:1024px) 33vw, 100vw'}
        className="object-cover transition-transform duration-250 hover:scale-105"
      />
    </div>
  ) : null;

  const body = (
    <>
      {eyebrow ? <p className="mb-2 text-2xs font-semibold uppercase tracking-caps text-brand-400">{eyebrow}</p> : null}
      <h3 className="text-xl leading-snug text-brand-200">{title}</h3>
      {description ? <p className="mt-3 text-sm leading-relaxed text-silver-400">{description}</p> : null}
      {children}
      {href && ctaLabel ? (
        <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-caps text-brand-300 transition group-hover:translate-x-1">
          {ctaLabel} →
        </span>
      ) : null}
    </>
  );

  return (
    <Wrapper
      {...wrapperProps}
      className={[
        'group block overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]',
        'transition duration-250 hover:border-brand-400/40 hover:bg-white/[0.06]',
        href ? 'h-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {media && imagePosition === 'top' ? <div className="relative aspect-[4/3]">{media}</div> : null}

      <div className={`p-6 ${imagePosition === 'side' ? 'flex gap-6 md:items-center' : ''}`}>
        {imagePosition === 'side' && media ? <div className="relative hidden aspect-square w-full shrink-0 md:block">{media}</div> : null}
        <div className="flex-1">{body}</div>
      </div>
    </Wrapper>
  );
}