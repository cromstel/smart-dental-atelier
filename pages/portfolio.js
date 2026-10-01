import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import BeforeAfter from '@/components/marketing/BeforeAfter';
import ImageGallery from '@/components/marketing/ImageGallery';
import ContactForm from '@/components/forms/ContactForm';
import { PORTFOLIO_BEFORE_AFTER } from '@/lib/content';
import { getGallery } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Portfolio' },
];

export default function PortfolioPage({ before = [], after = [], gallery = [] }) {
  const smileGallery = gallery.filter((image) => image.category === 'smile');

  return (
    <Layout>
      <Seo
        title="Portfolio"
        description="Before and after smile transformations produced by Dental Atelier: a wide array of products of superb quality and prime aesthetic value."
        pathname="/portfolio"
        image="/images/after.webp"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Portfolio"
        subtitle={PORTFOLIO_BEFORE_AFTER.intro}
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="mx-auto max-w-5xl">
          <BeforeAfter before={before[0]} after={after[0]} />
          <p className="mt-6 text-center text-sm text-silver-500">
            {PORTFOLIO_BEFORE_AFTER.secondary}
          </p>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <SectionHeading
            eyebrow="More cases"
            title="Smile transformations"
            lede="A selection of ceramic cases finished in the atelier. Ask us for the full portfolio, including the material list of every case."
          />
          <div className="mt-10">
            <ImageGallery images={smileGallery} columns={3} heading="Portfolio of ceramic cases" />
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
          <div>
            <SectionHeading
              level={2}
              title={PORTFOLIO_BEFORE_AFTER.downloadNote}
              lede="We send the extended portfolio as a PDF, together with a list of the materials used in each case."
            />
            <p className="mt-6 text-sm text-silver-400">
              Prefer to talk it through first?{' '}
              <Link href="/faqs" className="link-underline text-brand-300">
                Read the FAQs
              </Link>{' '}
              or call us on{' '}
              <a href="tel:+3223764326" className="link-underline text-brand-300">
                +32 2 376 43 26
              </a>
              .
            </p>
          </div>

          <div className="panel">
            <ContactForm
              endpoint="/api/request-info"
              topic="portfolio"
              submitLabel="Request full portfolio"
              title=""
              description="Please contact us using the form below to receive the full portfolio of our products."
              showMessage={false}
              requirePhone={false}
              successMessage="Thank you. We will send you the full portfolio shortly."
            />
          </div>
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const [before, after, gallery] = await Promise.all([
    getGallery({ category: 'before' }),
    getGallery({ category: 'after' }),
    getGallery(),
  ]);

  return { props: serializeDates({ before, after, gallery }), revalidate: 300 };
}