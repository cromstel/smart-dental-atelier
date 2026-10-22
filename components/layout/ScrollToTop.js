import { useState, useEffect } from 'react';

/**
 * Scroll-to-top button shown when the user scrolls past a threshold.
 * Responsive: visible on all screen sizes; fixed bottom-right position.
 * Uses the site's existing smooth-scroll behavior (`data-scroll-behavior` on html).
 */
export default function ScrollToTop({ threshold = 300 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={[
        'fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300 ease-out',
        'bg-brand-400 text-black hover:bg-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/60',
        'p-3 md:p-4',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {/* Inline SVG arrow — no external dependency */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
