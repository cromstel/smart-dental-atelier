import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import InfoCard from '@/components/marketing/InfoCard';
import RequestInfoForm from '@/components/forms/RequestInfoForm';
import { MATERIALS } from '@/lib/content';
import { getServices } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Products & Materials' },
];

export default function ProductsAndMaterialsPage({ products = [] }) {
  return (
    <Layout>
      <Seo
        title="Products & Materials"
        description="Facial analysis, diagnostic wax up, provisional crowns, crowns and bridges, implant solutions, inlays/onlays and veneers — all made with certified materials from leading manufacturers."
        pathname="/products-and-materials"
        image="/images/lab-5.jpg"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Products & Materials"
        subtitle="Everything we fabricate, and what we fabricate it from."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <SectionHeading
          eyebrow="Catalogue"
          title="What we make for your dentist"
          lede="Each product is described in the words we use when we talk to a patient about it."
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <InfoCard
              key={product.slug || product.id}
              title={product.title}
              description={product.summary}
              href="/book-appointment"
              ctaLabel="Ask about this"
            />
          ))}
        </div>
      </Section>

      <Section tone="gold">
        <div className="mx-auto max-w-3xl">
          <SectionHeading level={2} title={MATERIALS.title} />
          <p className="mt-6 text-sm leading-relaxed text-silver-300 md:text-base">{MATERIALS.body}</p>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <RequestInfoForm
            topic="materials"
            title="Request more information"
            description="Tell us which product you are interested in and we will send you the specification sheet."
            successMessage="Thank you. We will send you the requested information shortly."
          />
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const products = await getServices('product');
  return { props: serializeDates({ products }), revalidate: 300 };
}