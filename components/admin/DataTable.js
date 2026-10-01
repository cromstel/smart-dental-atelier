import { EmptyState } from '@/components/ui/Spinner';

/**
 * Generic admin table.
 *
 * @param {Array} columns  [{ key, header, render?(row), className?, align? }]
 * @param {Array} rows
 *
 * Wrapped in a scrollable region with a caption for screen readers, and the
 * caption is what makes the table navigable when it overflows horizontally.
 */
export default function DataTable({
  columns = [],
  rows = [],
  caption,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  rowKey = (row, index) => row.id ?? index,
}) {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}

        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-caps text-silver-500 ${
                  column.align === 'right' ? 'text-right' : ''
                } ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-b border-white/5 align-top transition hover:bg-white/[0.03]">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-silver-300 ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.cellClassName || ''}`}
                >
                  {column.render ? column.render(row, index) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}