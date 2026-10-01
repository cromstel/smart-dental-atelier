import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import FAQAccordion from '@/components/marketing/FAQAccordion';
import ContactForm from '@/components/forms/ContactForm';
import { SITE } from '@/lib/content';
import { getFaqs } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'FAQs' },
];

const CATEGORY_LABELS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'VENEERS', label: 'Veneers' },
  { value: 'CROWNS_BRIDGES', label: 'Crowns & bridges' },
  { value: 'IMPLANTS', label: 'Implants' },
  { value: 'TREATMENT', label: 'Treatment' },
  { value: 'COST', label: 'Cost' },
];

export default function FaqsPage({ faqs = [] }) {
  return (
    <Layout>
      <Seo
        title="FAQs"
        description="Answers about porcelain veneers, crowns, bridges, implant crowns, ceramic inlays, diagnostic wax up, digital smile design and treatment costs."
        pathname="/faqs"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      </Seo>

      <PageHeader
        title="FAQs"
        subtitle="Definitions first, then the practical answers: what things cost, and whether you have to change your dentist."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <FAQAccordion faqs={faqs} categories={CATEGORY_LABELS} />

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="panel-gold">
              <h2 className="text-lg">Please contact us to get price estimation</h2>
              <p className="mt-3 text-sm text-silver-400">
                The price depends on the type of work that needs to be done. Send us the case details and
                we will give you a figure.
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 inline-block text-sm font-semibold text-brand-300 underline decoration-dotted underline-offset-4"
              >
                {SITE.email}
              </a>
            </div>

            <div className="panel">
              <h2 className="text-lg">You do not have to change your dentist</h2>
              <p className="mt-3 text-sm text-silver-400">
                We are the laboratory, not the practice. Your dentist keeps treating you — we make the
                ceramics.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="mx-auto max-w-3xl">
          <ContactForm
            submitLabel="Submit"
            title="Ask a question"
            description="Your question and e-mail are forwarded to the atelier; we reply within one working day."
          />
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const faqs = await getFaqs();
  return { props: serializeDates({ faqs }), revalidate: 300 };
}