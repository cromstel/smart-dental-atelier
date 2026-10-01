import Image from 'next/image';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import Timeline from '@/components/marketing/Timeline';
import ImageGallery from '@/components/marketing/ImageGallery';
import CtaBanner, { InlineCta } from '@/components/marketing/CtaBanner';
import { COURSES, SITE } from '@/lib/content';
import { getMilestones, getGallery } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd, organisationJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'About Us' },
];

export default function AboutPage({ milestones = [], labGallery = [] }) {
  return (
    <Layout>
      <Seo
        title="About – Dental Atelier"
        description="Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind. Meet Michal Siakel, our director, and read about our latest courses and mission."
        pathname="/about-us"
        image="/images/lab-3.webp"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="About Dental Atelier"
        subtitle="Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind."
        breadcrumbs={BREADCRUMBS}
      >
        <PrimaryButton href="/book-appointment">Please ask for consultation</PrimaryButton>
        <PrimaryButton href="/contact-us" variant="secondary">
          Contact us
        </PrimaryButton>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="prose-atelier">
            <p>
              Just like a fingerprint, each smile is unique and that is why we offer each customer an
              individual approach.
            </p>
            <p>
              Using modern methods and the latest equipment we provide our customers with a smile that
              not only fits but is also functional.
            </p>

            <h2>Communication is the key to reach such results</h2>
            <p>
              With the dentist on one side and with the customer on the other. This allows to set an
              appropriate direction of the treatment and to reach the optimal result. Every step of the
              way is set in advance so there is no unwanted surprise at the end of your treatment.
            </p>
            <p>
              We consider it crucial to mimic all the life-like features of the natural tooth to arrive
              at the best aesthetic look.
            </p>

            <h2>Michal Siakel</h2>
            <div className="not-prose my-8 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-56 w-48 shrink-0 overflow-hidden rounded-lg border border-brand-400/30">
                <Image
                  src="/images/portrait.webp"
                  alt="Portrait of Michal Siakel, director of Dental Atelier"
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <Timeline milestones={milestones} />
            </div>

            <p className="text-sm text-silver-500">
              Continuous education in field of dental technologies, attending regularly various courses
              and lectures.
            </p>

            <h2>The latest courses</h2>
            <ul className="space-y-2 text-sm">
              {COURSES.map((course) => (
                <li key={course} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  <span>{course}</span>
                </li>
              ))}
            </ul>

            <h2>Mission and goal</h2>
            <p>
              We care that everyone gets an exceptional service from us. We are here to create a smile
              that lasts.
            </p>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <div className="panel">
              <h2 className="text-lg">At a glance</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <dt className="text-silver-500">Founded</dt>
                  <dd className="text-silver-200">2013, Brussels</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <dt className="text-silver-500">Director</dt>
                  <dd className="text-silver-200">Michal Siakel</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
                  <dt className="text-silver-500">Delivery</dt>
                  <dd className="text-silver-200">Free pick-up &amp; delivery</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-silver-500">Languages</dt>
                  <dd className="text-silver-200">English</dd>
                </div>
              </dl>
              <PrimaryButton href="/contact-us" className="mt-6 w-full">
                Get in touch
              </PrimaryButton>
            </div>

            <div className="panel-gold">
              <h2 className="text-lg">Do not have to change your dentist</h2>
              <p className="mt-3 text-sm text-silver-400">
                We work with the dental practice you already trust. Just send us the case details and we
                will take care of the laboratory side.
              </p>
              <InlineCta label="Read the FAQs" href="/faqs" />
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading
          eyebrow="The atelier"
          title="Inside the laboratory"
          lede="Ceramic work happens on the bench, not in a black box. Here is where your crown is made."
        />
        <div className="mt-10">
          <ImageGallery images={labGallery} columns={3} heading="Inside the Dental Atelier laboratory" />
        </div>
      </Section>

      <Section>
        <CtaBanner
          title="We care that everyone gets an exceptional service from us"
          description="We are here to create a smile that lasts. Request a free consultation and we will analyse your case with you."
          primary={{ label: 'Please ask for consultation', href: '/book-appointment' }}
          secondary={{ label: 'Contact us', href: '/contact-us' }}
        />
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd(SITE)) }}
      />
    </Layout>
  );
}

export async function getStaticProps() {
  const [milestones, labGallery] = await Promise.all([
    getMilestones(),
    getGallery({ category: 'lab' }),
  ]);
  return { props: serializeDates({ milestones, labGallery }), revalidate: 600 };
}