import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminShell from '@/components/admin/AdminShell';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { requireAdminPage } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { PAGES } from '@/lib/content';

/**
 * Page content editor — the SEO layer of every marketing page.
 *
 * The long-form copy still lives in `lib/content.js` and the page components;
 * what is editable here is the part that varies most and that search engines
 * read on every crawl: the `<title>`, the meta description, the H1 and the OG
 * image. That is deliberately a small surface with an obvious effect, rather
 * than a WYSIWYG editor nobody can safely trust.
 */
export default function AdminContentPage({ pages = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const startEdit = (page) => {
    setEditing(page.slug);
    setValues({
      title: page.title || '',
      description: page.description || '',
      heading: page.heading || '',
      image: page.image || '',
      noIndex: Boolean(page.noIndex),
      published: page.published !== false,
    });
    setErrors({});
    setStatus('idle');
    setMessage('');
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setErrors({});
    setMessage('');

    try {
      const response = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: editing, ...values }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'We could not save that page.');
        if (data.details) setErrors(data.details);
        return;
      }

      setStatus('success');
      setMessage('Saved. The change appears after the page is revalidated (usually within a minute).');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please try again.');
    }
  };

  return (
    <AdminShell
      title="Page content"
      description="Titles, descriptions and headings — the parts search engines and link previews read."
      wide
    >
      <div className="mb-6">
        <Alert tone="info" title="What is editable here">
          Body copy is version-controlled in <code>lib/content.js</code> and edited by a developer. This
          screen covers the per-page SEO fields, which change often and are safe to change in the browser.
        </Alert>
      </div>

      {message ? (
        <div className="mb-6">
          <Alert tone={status === 'error' ? 'error' : 'success'} onDismiss={() => setMessage('')}>
            {message}
          </Alert>
        </div>
      ) : null}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Marketing pages and their SEO metadata</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-4 py-3 text-xs uppercase tracking-caps text-silver-500">
                Page
              </th>
              <th scope="col" className="px-4 py-3 text-xs uppercase tracking-caps text-silver-500">
                Title
              </th>
              <th scope="col" className="px-4 py-3 text-xs uppercase tracking-caps text-silver-500">
                Description length
              </th>
              <th scope="col" className="px-4 py-3 text-xs uppercase tracking-caps text-silver-500">
                State
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs uppercase tracking-caps text-silver-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {pages.map((page) => {
              const length = (page.description || '').length;
              const good = length >= 70 && length <= 160;

              return (
                <tr key={page.slug} className="border-b border-white/5 align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-silver-100">{page.heading || page.title}</p>
                    <p className="mt-0.5 text-xs text-silver-500">/{page.slug}</p>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-silver-400">{page.title}</td>
                  <td className="px-4 py-3">
                    <span className={good ? 'text-success' : 'text-warning'}>{length}</span>
                    <span className="ml-1 text-xs text-silver-600">chars</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={page.published === false ? 'neutral' : 'brand'}>
                        {page.published === false ? 'Unpublished' : 'Published'}
                      </Badge>
                      {page.noIndex ? <Badge tone="neutral">noindex</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PrimaryButton size="sm" variant="ghost" onClick={() => startEdit(page)}>
                      Edit
                    </PrimaryButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-10">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-dialog-title"
            className="w-full max-w-2xl rounded-lg border border-white/15 bg-ink-800 p-6"
          >
            <h2 id="content-dialog-title" className="text-2xl">
              Edit /{editing}
            </h2>

            <form onSubmit={save} noValidate className="mt-8 space-y-5">
              <FormInput
                label="Page title"
                name="title"
                required
                maxLength={191}
                value={values.title}
                onChange={(event) => setValues((c) => ({ ...c, title: event.target.value }))}
                error={errors.title}
                hint="Shown in the browser tab and as the search result headline."
              />

              <FormTextArea
                label="Meta description"
                name="description"
                required
                rows={3}
                maxLength={500}
                value={values.description}
                onChange={(event) => setValues((c) => ({ ...c, description: event.target.value }))}
                error={errors.description}
                hint={`${(values.description || '').length} characters — aim for 70-160.`}
              />

              <FormInput
                label="On-page heading (H1)"
                name="heading"
                value={values.heading}
                onChange={(event) => setValues((c) => ({ ...c, heading: event.target.value }))}
                error={errors.heading}
              />

              <FormInput
                label="Social share image"
                name="image"
                placeholder="/images/hero-sexy.jpg"
                value={values.image}
                onChange={(event) => setValues((c) => ({ ...c, image: event.target.value }))}
                error={errors.image}
                hint="1200×630 works best for Facebook and LinkedIn previews."
              />

              <label className="flex items-center gap-3 text-sm text-silver-200">
                <input
                  type="checkbox"
                  checked={values.noIndex}
                  onChange={(event) => setValues((c) => ({ ...c, noIndex: event.target.checked }))}
                  className="h-4 w-4 accent-brand-400"
                />
                Keep this page out of search engines (noindex)
              </label>

              <label className="flex items-center gap-3 text-sm text-silver-200">
                <input
                  type="checkbox"
                  checked={values.published}
                  onChange={(event) => setValues((c) => ({ ...c, published: event.target.checked }))}
                  className="h-4 w-4 accent-brand-400"
                />
                Published
              </label>

              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <PrimaryButton variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </PrimaryButton>
                <PrimaryButton type="submit" loading={status === 'submitting'}>
                  {status === 'submitting' ? 'Saving…' : 'Save changes'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return {
      props: {
        ...guard.props,
        pages: PAGES.map((page) => ({ ...page, published: true, noIndex: false })),
      },
    };
  }

  const stored = await prisma.page.findMany({
    select: { slug: true, title: true, description: true, heading: true, image: true, noIndex: true, published: true, updatedAt: true },
  });
  const bySlug = new Map(stored.map((page) => [page.slug, page]));

  // Merge DB rows over the bundled defaults so a page that was never touched
  // still shows its real title.
  const pages = PAGES.map((page) => {
    const row = bySlug.get(page.key);
    if (!row) return { ...page, published: true, noIndex: false };
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      heading: row.heading || page.heading,
      image: row.image,
      noIndex: row.noIndex,
      published: row.published,
      updatedAt: row.updatedAt,
    };
  });

  return { props: { ...guard.props, pages } };
}