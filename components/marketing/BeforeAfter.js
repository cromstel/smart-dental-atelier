import Image from 'next/image';

/** Side-by-side "before / after" comparison block for the Portfolio page. */
export default function BeforeAfter({ before, after, labels = { before: 'Before', after: 'After' } }) {
  if (!before || !after) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[before, after].map((image, index) => (
        <figure key={image.url} className="overflow-hidden rounded-lg border border-white/10 bg-ink-700">
          <div className="relative aspect-[4/3]">
            <Image
              src={image.url}
              alt={image.altText || `${labels[index]} — patient smile`}
              fill
              sizes="(min-width:768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="bg-white/[0.04] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-caps text-brand-300">
              {labels[index]}
            </span>
            {image.title ? (
              <span className="ml-2 text-sm text-silver-400">{image.title}</span>
            ) : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}