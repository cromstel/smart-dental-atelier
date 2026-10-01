import { useId, useState } from 'react';

/**
 * Single Q&A rendered as an accessible accordion.
 *
 * Uses a real `<button>` with `aria-expanded` / `aria-controls` and a
 * `region` for the answer, which is what the WCAG accordion pattern requires
 * (the legacy page was just a stack of H3s and paragraphs with no toggle at
 * all, so it could not be collapsed on mobile).
 */
export default function FAQItem({ question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className="border-b border-white/10">
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="flex w-full items-center justify-between gap-6 py-5 text-left"
        >
          <span className={`text-base font-medium transition-colors ${open ? 'text-brand-200' : 'text-silver-200'}`}>
            {question}
          </span>
          <span
            aria-hidden="true"
            className={`shrink-0 text-xl text-brand-400 transition-transform duration-250 ${open ? 'rotate-45' : ''}`}
          >
            +
          </span>
        </button>
      </h3>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={undefined}
        hidden={!open}
        className="pb-6 pr-10"
      >
        <p className="text-sm leading-relaxed text-silver-400">{answer}</p>
      </div>
    </div>
  );
}