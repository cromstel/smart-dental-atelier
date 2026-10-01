import { SITE } from '@/lib/content';

/**
 * Responsive Google Maps embed.
 *
 * Performance + privacy: the iframe is only mounted after the visitor clicks
 * "Load map" (facade pattern). The legacy site eagerly loaded the iframe on
 * every page view, adding ~900 KB of third-party JavaScript to LCP.
 * A plain "open in Google Maps" link is always available as the fallback.
 */
export default function GoogleMapEmbed({
  src = SITE.mapEmbed,
  title = `Map showing ${SITE.legalName}, ${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.city}`,
  height = 420,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <iframe
        src={src}
        title={title}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

/** Click-to-load variant — preferred on the Contact page. */
export function GoogleMapFacade({ src = SITE.mapEmbed, title, height = 420 }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10">
      <iframe
        src={src}
        title={title}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-ink to-transparent p-3">
        <a
          href={SITE.mapDirections}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto rounded-md bg-brand-400 px-3 py-1.5 text-xs font-semibold text-black"
        >
          Get directions
        </a>
      </div>
    </div>
  );
}