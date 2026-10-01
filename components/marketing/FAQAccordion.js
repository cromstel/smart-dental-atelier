import Link from 'next/link';
import { useMemo, useState } from 'react';
import FAQItem from './FAQItem';

/**
 * FAQ list with an optional live filter.
 *
 * Emits `FAQPage` JSON-LD from the same data, which is what makes the answers
 * eligible for rich results — the legacy page had the Q&A markup but no
 * structured data at all.
 */
export default function FAQAccordion({
  faqs = [],
  categories = [],
  showFilter = true,
  searchPlaceholder = 'Search a question…',
  headingId = 'faq-list',
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory = category === 'all' || faq.category === category;
      const matchesQuery =
        !needle ||
        faq.question.toLowerCase().includes(needle) ||
        faq.answer.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [faqs, query, category]);

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    }),
    [faqs],
  );

  return (
    <div>
      {showFilter && (categories.length > 0 || faqs.length > 6) ? (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="faq-search" className="sr-only">
              Search the frequently asked questions
            </label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-silver-100 placeholder:text-silver-600 focus:border-brand-400"
            />
          </div>

          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('all')}
                aria-pressed={category === 'all'}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-caps transition ${
                  category === 'all'
                    ? 'border-brand-400 bg-brand-400 text-black'
                    : 'border-white/15 text-silver-400 hover:border-brand-400/50 hover:text-brand-200'
                }`}
              >
                All
              </button>
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  aria-pressed={category === item.value}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-caps transition ${
                    category === item.value
                      ? 'border-brand-400 bg-brand-400 text-black'
                      : 'border-white/15 text-silver-400 hover:border-brand-400/50 hover:text-brand-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div id={headingId} className="border-t border-white/10">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-silver-500">
            No question matches “{query}”.{' '}
            <Link href="/contact-us" className="link-underline text-brand-300">
              Ask us directly
            </Link>
            .
          </p>
        ) : (
          filtered.map((faq, index) => (
            <FAQItem key={`${faq.question}-${index}`} question={faq.question} answer={faq.answer} defaultOpen={index === 0 && !query} />
          ))
        )}
      </div>

      {faqs.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </div>
  );
}