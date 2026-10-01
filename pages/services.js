import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import InfoCard from '@/components/marketing/InfoCard';
import CtaBanner from '@/components/marketing/CtaBanner';
import { getServices } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';
import { toParagraphs } from '@/lib/format';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Services' },
];

export default function ServicesPage({ services = [] }) {
  return (
    <Layout>
      <Seo
        title="Services"
        description="Price estimation, free consultation, custom colour shading, digital smile design, pick-up and delivery and diagnostic case planning at Dental Atelier, Brussels."
        pathname="/services"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Services"
        subtitle="Price estimation, free consultation, custom colour shading, digital smile design, pick-up and delivery, consultation and diagnostic case planning."
        breadcrumbs={BREADCRUMBS}
      >
        <PrimaryButton href="/book-appointment">Book a free consultation</PrimaryButton>
      </PageHeader>

      <Section>
        <SectionHeading
          eyebrow="How we work with you"
          title="Every service, in plain language"
          lede="The collaboration between patient, dentist and technician is very important to achieve the final result we are aiming to."
        />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <InfoCard
              key={service.slug || service.id}
              title={service.title}
              description={service.summary}
            />
          ))}
        </div>
      </Section>

      <Section tone="sunken">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <div className="panel">
            <h2 className="text-xl">More information for dentists</h2>
            <p className="mt-3 text-sm text-silver-400">
              Diagnostic case planning, digital imaging and shade matching — the technical detail behind
              a predictable result.
            </p>
            <PrimaryButton href="/facial-analysis-and-digital-smile-design" className="mt-6">
              Read the technical page
            </PrimaryButton>
          </div>

          <div className="panel">
            <h2 className="text-xl">Please contact us</h2>
            <p className="mt-3 text-sm text-silver-400">
              Want a price estimation for your case? Send us the details and we will come back to you
              within one working day.
            </p>
            <PrimaryButton href="/contact-us" variant="secondary" className="mt-6">
              Get a price estimation
            </PrimaryButton>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="In detail"
            title="What each service involves"
            lede={null}
          />
          <div className="mt-8 space-y-8">
            {services.map((service) => (
              <article key={`detail-${service.slug || service.id}`} className="border-b border-white/10 pb-8 last:border-0">
                <h3 className="text-xl text-brand-200">{service.title}</h3>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-silver-400">
                  {toParagraphs(service.description).map((paragraph, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-8 text-sm text-silver-400">
            Looking for definitions instead?{' '}
            <Link href="/faqs" className="link-underline text-brand-300">
              Read the frequently asked questions
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section tone="gold">
        <CtaBanner
          title="Please make an appointment for a free consultation on individual cases"
          description="We will look at your case with you, explain the options and give you a price estimation."
          primary={{ label: 'Book an appointment', href: '/book-appointment' }}
          secondary={{ label: 'Use the smile check form', href: '/smile-check-form' }}
        />
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const services = await getServices('service');
  return { props: serializeDates({ services }), revalidate: 300 };
}