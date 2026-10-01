import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import ImageGallery from '@/components/marketing/ImageGallery';
import CtaBanner from '@/components/marketing/CtaBanner';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Sexy & powerful smile' },
];

const GALLERY = [
  { url: '/images/smile-sexy-1.jpg', altText: 'Patient smile after six ceramic veneers', title: 'Six veneers' },
  { url: '/images/smile-sexy-2.jpg', altText: 'Digital smile design preview on a portrait photograph', title: 'Digital preview' },
  { url: '/images/smile-sexy-3.jpg', altText: 'Ceramic implant crown replacing a missing front tooth', title: 'Implant crown' },
];

export default function SexyAndPowerfulSmilePage() {
  return (
    <Layout>
      <Seo
        title="Sexy & powerful smile"
        description="How smile aesthetics affect confidence, what a positive smile line is, and how veneers and crowns can improve crooked, gapped or discoloured teeth in weeks instead of years."
        pathname="/sexy-and-powerful-smile"
        image="/images/hero-sexy.jpg"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Sexy and powerful smile"
        subtitle="Your smile changes the way you look at yourself and the way you are seen by others around you."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="prose-atelier">
            <p>Do you feel like there are not enough people showing interest in you?</p>
            <p>Is it difficult to build self-confidence to approach new people around you?</p>
            <p>
              Your smile can make big difference for the way you look at yourself and the way you are seen
              by others around you. A new smile can give you an enormous boost of confidence and allow the
              freedom from worries about appearance.
            </p>

            <h2>Improve your smile</h2>
            <p>There might be several characteristic of your smile that could be improved.</p>
            <p>
              Very important in terms of appearance is to have the so-called positive smile line. By
              creating such line your face will appear to have a positive quality while smiling.
            </p>

            <p>
              Your teeth might be twisted, have gaps in between, or you can have a “gummy smile” (your gums
              are showing too much). If that is the case you can get a faster solution than an orthodontic
              treatment by reaching for veneers/crowns. The final proper teeth alignment can be achieved in
              weeks instead of years. Moreover, the life-like translucent appearance of the ceramic
              materials used will give your teeth a very natural look.
            </p>

            <h2>We look forward to seeing you in person</h2>
            <p>So that we can discuss your individual needs.</p>

            <p>
              Please fill out our smile check form to find out more about your smile, or{' '}
              <Link href="/book-appointment" className="font-semibold text-brand-300">
                get a free consultation
              </Link>
              !
            </p>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10">
              <Image
                src="/images/hero-sexy.jpg"
                alt="Close-up of a patient smile after ceramic treatment"
                fill
                sizes="(min-width:1024px) 35vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="panel mt-6">
              <h2 className="text-lg">Not sure whether it applies to you?</h2>
              <p className="mt-3 text-sm text-silver-400">
                Eleven questions, two minutes. That is usually enough to know.
              </p>
              <PrimaryButton href="/smile-check-form" className="mt-5">
                Use the smile check form
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading eyebrow="Cases" title="Smile makeovers" />
        <div className="mt-10">
          <ImageGallery images={GALLERY} columns={3} heading="Ceramic smile makeover cases" />
        </div>
      </Section>

      <Section>
        <CtaBanner />
      </Section>
    </Layout>
  );
}