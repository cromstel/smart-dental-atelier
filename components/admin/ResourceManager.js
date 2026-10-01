import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DataTable from './DataTable';
import StatusBadge from './StatusBadge';
import ConfirmButton from './ConfirmButton';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import FormSelect from '@/components/ui/FormSelect';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Pagination from './Pagination';

/**
 * Schema-driven CRUD screen for the admin portal.
 *
 * Every simple resource (FAQs, testimonials, products/services, users) is
 * described by a small config object, so all of them share one create/edit
 * form, one delete flow, one pagination control and one error surface instead
 * of four near-identical pages. Bespoke screens (appointments, messages,
 * gallery upload, page content, settings) are written by hand where the
 * interaction is genuinely different.
 *
 * resource = {
 *   name: 'FAQ',
 *   endpoint: '/api/admin/faqs',
 *   listKey: 'faqs',          // response key for the list
 *   itemKey: 'faq',           // response key for a single item
 *   empty: { title, description },
 *   searchPlaceholder,
 *   fields: [{ name, label, type, required, options, hint, colSpan, rows, help }],
 *   columns: [{ key, header, render(row), align }],
 *   defaults: { ... },
 *   searchable: true,
 * }
 */
export default function ResourceManager({ resource, items = [], total = 0, page = 1, pageCount = 1, query = {} }) {
  const router = useRouter();

  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [values, setValues] = useState(resource.defaults || {});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [queryText, setQueryText] = useState(query.q || '');

  const fields = resource.fields || [];
  const isNew = editing === 'new';

  const openNew = () => {
    setValues({ ...(resource.defaults || {}) });
    setErrors({});
    setStatus('idle');
    setMessage('');
    setEditing('new');
  };

  const openEdit = (row) => {
    const initial = {};
    for (const field of fields) {
      const raw = row[field.name];
      initial[field.name] =
        field.type === 'checkbox'
          ? Boolean(raw)
          : field.type === 'number'
            ? raw ?? field.default ?? ''
            : raw ?? '';
    }
    setValues(initial);
    setErrors({});
    setStatus('idle');
    setMessage('');
    setEditing(row);
  };

  const close = () => {
    setEditing(null);
    setErrors({});
    setStatus('idle');
    setMessage('');
  };

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setErrors({});
    setMessage('');

    // Client-side required check first, so the obvious mistakes never round-trip.
    const localErrors = {};
    for (const field of fields) {
      if (field.required && !String(values[field.name] ?? '').trim()) {
        localErrors[field.name] = `${field.label} is required.`;
      }
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      setStatus('error');
      setMessage('Please check the highlighted fields.');
      return;
    }

    const id = editing?.id;
    const url = isNew ? resource.endpoint : `${resource.endpoint}/${id}`;

    try {
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'We could not save that.');
        if (data.details) setErrors(data.details);
        return;
      }

      close();
      // Re-run getServerSideProps so the table reflects the change server-side.
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please try again.');
    }
  };

  const remove = async (row) => {
    try {
      const response = await fetch(`${resource.endpoint}/${row.id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'We could not delete that.');
        setStatus('error');
        return;
      }

      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setMessage('We could not reach the server. Please try again.');
      setStatus('error');
    }
  };

  const columns = useMemo(
    () => [
      ...(resource.columns || []),
      ...(resource.withStatus === false
        ? []
        : [
            {
              key: '_status',
              header: 'Status',
              render: (row) => <StatusBadge status={row.published ? 'PUBLISHED' : 'DRAFT'} />,
            },
          ]),
      {
        key: '_actions',
        header: '',
        align: 'right',
        render: (row) => (
          <div className="flex justify-end gap-2">
            <PrimaryButton variant="ghost" size="sm" onClick={() => openEdit(row)}>
              Edit
            </PrimaryButton>
            <ConfirmButton
              label="Delete"
              size="sm"
              dialogTitle={`Delete this ${resource.name.toLowerCase()}?`}
              dialogBody={resource.deleteBody || 'This cannot be undone.'}
              onConfirm={() => remove(row)}
            />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resource],
  );

  const buildHref = (nextPage) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set('page', String(nextPage));
    if (query.q) params.set('q', query.q);
    if (query.status) params.set('status', query.status);
    const search = params.toString();
    return search ? `?${search}` : null;
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (queryText.trim()) params.set('q', queryText.trim());
    router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-6">
      {message && status === 'error' ? (
        <Alert tone="error" onDismiss={() => setMessage('')}>
          {message}
        </Alert>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {resource.searchable ? (
          <form onSubmit={submitSearch} className="flex flex-1 items-end gap-3 sm:max-w-md">
            <div className="flex-1">
              <FormInput
                label="Search"
                name="q"
                type="search"
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
                placeholder={resource.searchPlaceholder || 'Search…'}
              />
            </div>
            <PrimaryButton type="submit" variant="secondary" size="md">
              Search
            </PrimaryButton>
          </form>
        ) : (
          <span />
        )}

        <PrimaryButton onClick={openNew}>Add {resource.name.toLowerCase()}</PrimaryButton>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={items}
        caption={`${resource.name} list`}
        emptyTitle={resource.empty?.title || `No ${resource.name.toLowerCase()}s yet`}
        emptyDescription={resource.empty?.description}
        emptyAction={
          <PrimaryButton onClick={openNew} size="sm">
            Add {resource.name.toLowerCase()}
          </PrimaryButton>
        }
        rowKey={(row, index) => row.id ?? index}
      />

      <Pagination page={page} pageCount={pageCount} total={total} buildHref={buildHref} />

      {/* Create / edit panel */}
      {editing ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-dialog-title"
            className="w-full max-w-2xl rounded-lg border border-white/15 bg-ink-800 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="resource-dialog-title" className="text-2xl">
                {isNew ? `Add ${resource.name.toLowerCase()}` : `Edit ${resource.name.toLowerCase()}`}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded p-1 text-silver-400 hover:text-silver-100"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {message && status === 'error' ? (
              <Alert tone="error" className="mt-6">
                {message}
              </Alert>
            ) : null}

            <form onSubmit={save} noValidate className="mt-8">
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                  const common = {
                    key: field.name,
                    label: field.label,
                    name: field.name,
                    required: field.required,
                    hint: field.hint,
                    error: errors[field.name],
                    value: values[field.name],
                    onChange: (event) =>
                      setValue(
                        field.name,
                        field.type === 'checkbox' ? event.target.checked : event.target.value,
                      ),
                  };

                  const wrapper = field.colSpan === 2 ? 'sm:col-span-2' : '';

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.name} className={wrapper}>
                        <FormTextArea {...common} rows={field.rows || 6} />
                      </div>
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.name} className={wrapper}>
                        <FormSelect {...common} options={field.options || []} placeholder={field.placeholder} />
                      </div>
                    );
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <div key={field.name} className={`${wrapper} sm:col-span-2`}>
                        <label className="flex items-center gap-3 text-sm text-silver-200">
                          <input
                            type="checkbox"
                            name={field.name}
                            checked={Boolean(values[field.name])}
                            onChange={(event) => setValue(field.name, event.target.checked)}
                            className="h-4 w-4 accent-brand-400"
                          />
                          {field.checkboxLabel || field.label}
                        </label>
                        {field.hint ? <p className="mt-1.5 text-xs text-silver-500">{field.hint}</p> : null}
                        {errors[field.name] ? (
                          <p role="alert" className="mt-1.5 text-xs text-error-400">
                            {errors[field.name]}
                          </p>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div key={field.name} className={wrapper}>
                      <FormInput {...common} type={field.type || 'text'} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap justify-end gap-3">
                <PrimaryButton variant="ghost" onClick={close}>
                  Cancel
                </PrimaryButton>
                <PrimaryButton type="submit" loading={status === 'submitting'}>
                  {status === 'submitting' ? 'Saving…' : isNew ? `Create ${resource.name.toLowerCase()}` : 'Save changes'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { Badge };