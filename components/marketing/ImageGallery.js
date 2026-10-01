import { useState } from 'react';
import Image from 'next/image';

/**
 * Responsive image grid with a lightbox.
 *
 * Every image requires `alt` (enforced by the schema/validation) — the legacy
 * site shipped images with `alt=""` or no attribute at all, which is a WCAG
 * 1.1.1 failure and bad for image search.
 */
export default function ImageGallery({
  images = [],
  columns = 3,
  showLightbox = true,
  heading,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const columnClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'sm:grid-cols-2 lg:grid-cols-3';

  const active = activeIndex === null ? null : images[activeIndex];

  const onKeyDown = (event) => {
    if (activeIndex === null) return;
    if (event.key === 'Escape') setActiveIndex(null);
    if (event.key === 'ArrowRight') setActiveIndex((index) => (index + 1) % images.length);
    if (event.key === 'ArrowLeft') setActiveIndex((index) => (index - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div>
      <ul className={`grid grid-cols-1 gap-4 ${columnClass}`}>
        {images.map((image, index) => {
          const tile = (
            <figure className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-ink-700">
              <Image
                src={image.url}
                alt={image.altText || image.title || ''}
                fill
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition-transform duration-250 group-hover:scale-105"
              />
              {image.title ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 py-3 text-xs font-medium text-silver-100">
                  {image.title}
                </figcaption>
              ) : null}
            </figure>
          );

          return (
            <li key={`${image.url}-${index}`}>
              {showLightbox ? (
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className="block w-full rounded-lg"
                  aria-label={`View larger: ${image.title || image.altText}`}
                >
                  {tile}
                </button>
              ) : (
                tile
              )}
            </li>
          );
        })}
      </ul>

      {heading ? <h2 className="sr-only">{heading}</h2> : null}

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title || 'Image viewer'}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            autoFocus
            className="absolute right-4 top-4 rounded-full border border-white/20 p-2 text-silver-200 hover:bg-white/10"
            aria-label="Close image viewer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="relative max-h-[80vh] w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={active.url}
              alt={active.altText || active.title || ''}
              width={1600}
              height={1200}
              className="mx-auto max-h-[75vh] w-auto rounded-lg object-contain"
            />
            {active.title ? (
              <p className="mt-4 text-center text-sm text-silver-300">{active.title}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}