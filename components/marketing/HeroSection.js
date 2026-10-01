import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Large banner section used on the home page and the thematic subpages.
 *
 * Props: title, subtitle, backgroundImage, alt, align (left|center|right),
 * children (usually call-to-action buttons), headingLevel so the page keeps a
 * single H1 (subpages pass 2 because they render their own H1).
 */
export default function HeroSection({
  title,
  subtitle,
  backgroundImage,
  alt = '',
  align = 'center',
  headingLevel = 1,
  eyebrow,
  children,
  className = '',
  priority = false,
}) {
  const Heading = `h${Math.min(Math.max(headingLevel, 1), 6)}`;
  const alignment = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align];

  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      {backgroundImage ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={backgroundImage}
            alt={alt}
            fill
            priority={priority}
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/60"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-900/60 via-ink to-ink"
          aria-hidden="true"
        />
      )}

      <div className={`container mx-auto flex flex-col gap-6 py-24 md:py-32 ${alignment}`}>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-caps text-brand-400">{eyebrow}</p>
        ) : null}

        <Heading className="max-w-3xl text-4xl leading-tight md:text-5xl lg:text-6xl">{title}</Heading>

        {subtitle ? (
          <p className="max-w-2xl text-base leading-relaxed text-silver-300 md:text-lg">{subtitle}</p>
        ) : null}

        {children ? <div className="mt-2 flex flex-wrap gap-4">{children}</div> : null}
      </div>
    </section>
  );
}

/** Thin wrapper used at the top of subpages for breadcrumbs + H1. */
export function PageHeader({ title, subtitle, breadcrumbs = [], children }) {
  return (
    <div className="border-b border-white/5 bg-gradient-to-b from-brand-900/30 to-transparent">
      <div className="container mx-auto py-14 md:py-20">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-silver-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href || crumb.label} className="flex items-center gap-2">
                  {index > 0 ? (
                    <span aria-hidden="true" className="text-silver-700">
                      /
                    </span>
                  ) : null}
                  {crumb.href && index < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="link-underline hover:text-brand-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <h1 className="max-w-3xl text-4xl leading-tight md:text-5xl">{title}</h1>

        {subtitle ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-silver-300 md:text-lg">{subtitle}</p>
        ) : null}

        {children ? <div className="mt-8 flex flex-wrap gap-4">{children}</div> : null}
      </div>
    </div>
  );
}