import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import RequestInfoForm from '@/components/forms/RequestInfoForm';
import ImageGallery from '@/components/marketing/ImageGallery';
import CtaBanner from '@/components/marketing/CtaBanner';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Facial analysis and Digital Smile Design' },
];

const PROCESS_GALLERY = [
  { url: '/images/lab-4.webp', altText: 'Shade matching session at the atelier', title: 'Shade matching' },
  { url: '/images/lab-1.webp', altText: 'Dental Atelier laboratory bench', title: 'The bench' },
  { url: '/images/smile-sexy-2.webp', altText: 'Digital smile design preview on a portrait photograph', title: 'Digital preview' },
];

export default function FacialAnalysisPage() {
  return (
    <Layout>
      <Seo
        title="Facial analysis and Digital Smile Design"
        description="We measure the biometrical features of your face, analyse it digitally and show you on your portrait photograph what your new smile will look like before treatment starts."
        pathname="/facial-analysis-and-digital-smile-design"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Facial analysis and Digital Smile Design"
        subtitle="An ideal smile is linked to certain biometrical features of your face."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="prose-atelier">
            <p>
              By measuring these features and transferring the relevant information in the computer we can
              analyse your face digitally and use the outcome of the analysis to improve your smile or
              create a new smile that fits your face better.
            </p>
            <p>
              Then we proceed with digital imaging on the basis of your portrait photograph to show you
              exactly what changes should be done to end up with a harmonic result.
            </p>
            <p>
              Here is the good news: digital imaging allows you to see the result on your portrait
              photograph before your teeth are even touched by the dentist!
            </p>

            <h2>Diagnostic case planning</h2>
            <p>
              In order to end up with a satisfying aesthetic and functional prosthesis, it is very important
              to plan each case by using photographs, study casts and afterwards creating a wax up. The wax
              up shows clearly how we could improve the existing situation and what are our limitations.
            </p>
            <p>
              Afterwards, the wax up can be used for creating provisional crowns. In this stage,
              modifications to the work are always possible. However, by skipping this step in the process
              we might end up with a prosthesis that patients would not accept.
            </p>
            <p>
              For the final outcome, we copy the shape and the length of the provisional work. This
              procedure guarantees that there is no stress regarding the outcome for the patient, dentist
              as well as the dental technician.
            </p>

            <h2>Dental Digital Photography</h2>
            <p>
              Digital photographs allow us to show you exactly how your new ceramic teeth can improve your
              appearance. You can see and take home your new smile before the treatment begins.
            </p>
            <p>
              A photograph of your teeth before the treatment also helps the technician to mimic your unique
              natural characterisation in your ceramic teeth.
            </p>
            <p>
              The new modern technologies involved into this service maximize the level of communication
              between the patient, dentist and the technician.
            </p>

            <p>
              Please{' '}
              <Link href="/contact-us" className="font-semibold text-brand-300">
                contact us for more details
              </Link>
              .
            </p>
          </div>

          <aside className="panel-gold lg:sticky lg:top-6">
            <SectionHeading level={2} title="The three steps" />
            <ol className="mt-6 space-y-5 text-sm">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-400/50 text-xs font-semibold text-brand-300">
                  1
                </span>
                <span className="text-silver-300">
                  <strong className="block text-silver-100">Photographs</strong>
                  A portrait plus detailed shots of your teeth, in natural light.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-400/50 text-xs font-semibold text-brand-300">
                  2
                </span>
                <span className="text-silver-300">
                  <strong className="block text-silver-100">Digital analysis</strong>
                  We measure the biometrical features of your face and mock up the result on your own
                  photograph.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-400/50 text-xs font-semibold text-brand-300">
                  3
                </span>
                <span className="text-silver-300">
                  <strong className="block text-silver-100">Wax up &amp; provisionals</strong>
                  The approved design is built in wax and then in provisional ceramics you can wear and
                  react to.
                </span>
              </li>
            </ol>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading eyebrow="Process" title="From photograph to provisional" />
        <div className="mt-10">
          <ImageGallery images={PROCESS_GALLERY} columns={3} heading="The digital smile design process" />
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <RequestInfoForm
            topic="facial_analysis"
            title="Request more information"
            description="Ask us how the digital analysis works for your case, or what it would take to preview your new smile."
          />
        </div>
      </Section>

      <Section tone="gold">
        <CtaBanner
          title="Come and get a photo of your new smile"
          description="It is free, it takes one appointment, and you can take the preview home with you."
          primary={{ label: 'Book a free consultation', href: '/book-appointment' }}
          secondary={{ label: 'Use the smile check form', href: '/smile-check-form' }}
        />
      </Section>
    </Layout>
  );
}