import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import AdminShell from '@/components/admin/AdminShell';
import ResourceManager from '@/components/admin/ResourceManager';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Alert from '@/components/ui/Alert';
import { requireAdminPage, parsePagination } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';

const CATEGORY_OPTIONS = [
  { value: 'before', label: 'Before (portfolio)' },
  { value: 'after', label: 'After (portfolio)' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'smile', label: 'Smile case' },
  { value: 'smile-check', label: 'Smile check' },
  { value: 'portfolio', label: 'Portfolio (uncategorised)' },
];

const RESOURCE = {
  name: 'Image',
  endpoint: '/api/admin/gallery',
  listKey: 'images',
  searchable: false,
  empty: {
    title: 'No images yet',
    description: 'Upload a photograph above to add it to the gallery and portfolio.',
  },
  deleteBody: 'The record and the uploaded file are both removed.',
  defaults: { title: '', altText: '', category: 'smile', order: 0, published: true },
  fields: [
    { name: 'title', label: 'Title', colSpan: 2, hint: 'Shown as the image caption.' },
    {
      name: 'altText',
      label: 'Alt text',
      required: true,
      colSpan: 2,
      hint: 'Describe the image for screen readers and image search. Required for every image.',
    },
    { name: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS, required: true },
    { name: 'order', label: 'Order', type: 'number', hint: 'Lower numbers appear first.' },
    {
      name: 'published',
      label: 'Published',
      type: 'checkbox',
      checkboxLabel: 'Show this image on the site',
    },
  ],
  columns: [
    {
      key: 'preview',
      header: '',
      render: (row) => (
        <div className="relative h-14 w-20 overflow-hidden rounded border border-white/10 bg-ink-700">
          <Image src={row.url} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Image',
      render: (row) => (
        <div className="max-w-sm">
          <p className="font-semibold text-silver-100">{row.title || row.url}</p>
          <p className="mt-0.5 text-xs text-silver-500">alt: {row.altText}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-2xs uppercase tracking-caps text-silver-400">
          {row.category}
        </span>
      ),
    },
  ],
};

export default function AdminGalleryPage({ images, total, page, pageCount, query }) {
  const router = useRouter();
  const formRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const upload = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);
    if (!formData.get('file')?.name) {
      setError('Please choose an image file.');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/admin/gallery', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'The upload failed. Please try again.');
        return;
      }

      setSuccess('Image uploaded.');
      formRef.current?.reset();
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminShell
      title="Gallery"
      description="Portfolio, laboratory and smile photography. Alt text is required for every image."
      wide
    >
      <div className="space-y-8">
        <section className="panel">
          <h2 className="text-lg">Upload an image</h2>
          <p className="mt-2 text-sm text-silver-400">
            JPEG, PNG, WebP or AVIF up to 6&nbsp;MB. Files are stored in <code>public/uploads</code>.
          </p>

          <div aria-live="polite">
            {error ? (
              <Alert tone="error" className="mt-6" onDismiss={() => setError('')}>
                {error}
              </Alert>
            ) : null}
            {success ? (
              <Alert tone="success" className="mt-6" onDismiss={() => setSuccess('')}>
                {success}
              </Alert>
            ) : null}
          </div>

          <form method="post" ref={formRef} onSubmit={upload} encType="multipart/form-data" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="gallery-file"
                  className="mb-2 block text-sm font-medium text-brand-200"
                >
                  Image file <span className="text-error-400">*</span>
                </label>
                <input
                  id="gallery-file"
                  name="file"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  aria-describedby="gallery-file-help"
                  className="block w-full rounded-md border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-silver-100 file:mr-4 file:rounded file:border-0 file:bg-brand-400 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-black"
                />
                <p id="gallery-file-help" className="mt-1.5 text-xs text-silver-500">
                  Max 6&nbsp;MB. Portrait close-ups work best on the portfolio.
                </p>
              </div>

              <FormInput label="Title" name="title" placeholder="Smile makeover — six veneers" />

              <FormSelect label="Category" name="category" options={CATEGORY_OPTIONS} defaultValue="smile" />

              <div className="sm:col-span-2">
                <FormInput
                  label="Alt text"
                  name="altText"
                  required
                  placeholder="Patient smile after six ceramic veneers"
                  hint="Required. Describe what is visible, not what it feels like."
                />
              </div>
            </div>

            <div className="mt-6">
              <PrimaryButton type="submit" loading={uploading}>
                {uploading ? 'Uploading…' : 'Upload image'}
              </PrimaryButton>
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-6 text-lg">Existing images</h2>
          <ResourceManager
            resource={RESOURCE}
            items={images}
            total={total}
            page={page}
            pageCount={pageCount}
            query={query}
          />
        </section>
      </div>
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, images: [], total: 0, page: 1, pageCount: 1, query: ctx.query } };
  }

  const { page, pageSize, skip, take } = parsePagination(ctx.query, { defaultSize: 24 });
  const where = ctx.query.category ? { category: String(ctx.query.category) } : {};

  const [total, images] = await Promise.all([
    prisma.galleryImage.count({ where }),
    prisma.galleryImage.findMany({ where, orderBy: { order: 'asc' }, skip, take }),
  ]);

  return {
    props: {
      ...guard.props,
      images,
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      query: ctx.query,
    },
  };
}