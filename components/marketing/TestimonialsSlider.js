import { useCallback, useEffect, useRef, useState } from 'react';
import TestimonialCard from './TestimonialCard';

/**
 * Dependency-free, accessible testimonial carousel.
 *
 * Replaces the Bootstrap `.carousel` from the legacy site, which was not
 * keyboard operable and hid its slides from assistive tech. Here:
 *  - the slide region is a labelled `region` with `aria-roledescription`
 *  - previous/next buttons with real labels, plus dot buttons
 *  - arrow-key support when the carousel has focus
 *  - autoplay that pauses on hover/focus and is disabled entirely under
 *    `prefers-reduced-motion`
 */
export default function TestimonialsSlider({
  testimonials = [],
  autoplay = true,
  intervalMs = 7000,
  heading,
  showDots = true,
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef(null);

  const count = testimonials.length;
  const safeIndex = count === 0 ? 0 : index % count;

  const go = useCallback(
    (next) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Autoplay timer.
  useEffect(() => {
    if (!autoplay || paused || count < 2) return undefined;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    const timer = setTimeout(() => go(index + 1), intervalMs);
    return () => clearTimeout(timer);
  }, [autoplay, paused, count, index, intervalMs, go]);

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  };

  if (count === 0) return null;

  const current = testimonials[safeIndex];

  return (
    <div
      ref={regionRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={heading || 'Patient testimonials'}
      // Focusable so the arrow-key handler below is actually reachable: a plain
      // div never receives focus, so keyboard users could not page the carousel.
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      className="relative"
    >
      {heading ? (
        <h2 className="sr-only" id="testimonials-heading">
          {heading}
        </h2>
      ) : null}

      {/* Live region announces slide changes without stealing focus. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Testimonial ${safeIndex + 1} of ${count}, from ${current.author}`}
      </div>

      <TestimonialCard
        quote={current.quote}
        author={current.author}
        treatment={current.treatment}
        avatarSrc={current.image}
      />

      {count > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous testimonial"
            className="rounded-full border border-brand-400/40 p-2 text-brand-200 transition hover:border-brand-400 hover:bg-brand-400/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showDots ? (
            <ul className="flex items-center gap-2">
              {testimonials.map((testimonial, dotIndex) => (
                <li key={`${testimonial.author}-${dotIndex}`}>
                  <button
                    type="button"
                    onClick={() => go(dotIndex)}
                    aria-label={`Show testimonial ${dotIndex + 1} from ${testimonial.author}`}
                    aria-current={dotIndex === safeIndex ? 'true' : undefined}
                    className={[
                      'block h-2.5 w-2.5 rounded-full transition',
                      dotIndex === safeIndex ? 'bg-brand-400' : 'bg-white/20 hover:bg-white/40',
                    ].join(' ')}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next testimonial"
            className="rounded-full border border-brand-400/40 p-2 text-brand-200 transition hover:border-brand-400 hover:bg-brand-400/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}