import Link from 'next/link';

/** Server-agnostic pagination control for the admin list screens. */
export default function Pagination({ page = 1, pageCount = 1, total, onPageChange, buildHref }) {
  if (pageCount <= 1) {
    return total ? <p className="mt-4 text-xs text-silver-500">{total} record(s)</p> : null;
  }

  const href = buildHref || ((nextPage) => (nextPage <= 1 ? null : `?page=${nextPage}`));

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const windowed = pages.filter(
    (candidate) => candidate === 1 || candidate === pageCount || Math.abs(candidate - page) <= 1,
  );

  const items = [];
  let previous = 0;
  for (const candidate of windowed) {
    if (previous && candidate - previous > 1) items.push('gap');
    items.push(candidate);
    previous = candidate;
  }

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center gap-2">
      {onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50 disabled:opacity-40"
        >
          Previous
        </button>
      ) : (
        <Link
          href={href(page - 1) || '#'}
          aria-disabled={page <= 1}
          className={`rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50 ${
            page <= 1 ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          Previous
        </Link>
      )}

      {items.map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-xs text-silver-600" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item) || '#'}
            aria-current={item === page ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-xs transition ${
              item === page
                ? 'bg-brand-400 font-semibold text-black'
                : 'border border-white/15 text-silver-300 hover:border-brand-400/50'
            }`}
          >
            {item}
          </Link>
        ),
      )}

      {onPageChange ? (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50 disabled:opacity-40"
        >
          Next
        </button>
      ) : (
        <Link
          href={href(page + 1) || '#'}
          aria-disabled={page >= pageCount}
          className={`rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50 ${
            page >= pageCount ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          Next
        </Link>
      )}

      {total ? <span className="ml-2 text-xs text-silver-500">{total} record(s)</span> : null}
    </nav>
  );
}