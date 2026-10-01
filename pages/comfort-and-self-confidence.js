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
  { label: 'Comfort & Self-confidence' },
];

const GALLERY = [
  { url: '/images/smile-comfort-1.jpg', altText: 'Custom colour shading appointment at the atelier', title: 'Custom shading' },
  { url: '/images/smile-comfort-2.jpg', altText: 'Ceramic inlays replacing discoloured composite fillings', title: 'Ceramic inlays' },
  { url: '/images/smile-comfort-3.jpg', altText: 'Fully ceramic bridge in the lower jaw', title: 'Ceramic bridge' },
];

export default function ComfortAndSelfConfidencePage() {
  return (
    <Layout>
      <Seo
        title="Comfort & Self-confidence"
        description="Chipping, discoloured fillings, gaps and worn enamel hold people back from smiling. Ceramic inlays, veneers and crowns are the easy solution."
        pathname="/comfort-and-self-confidence"
        image="/images/hero-comfort.jpg"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Comfort and self confidence"
        subtitle="A pleasant sunny smile takes you a further step towards appreciation by everybody around you."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="prose-atelier">
            <p>We are meeting masses of people in our daily professional life.</p>
            <p>
              The key to success is not only professional knowledge but also the image we have in the eyes
              of others.
            </p>

            <h2>A charming smile = a key to success!</h2>
            <p>There are many reasons why people do not want to show their full smile.</p>
            <p>
              Sometimes just a minor change can make your smile look odd, like a chipped corner of your
              tooth.
            </p>
            <p>
              Some people face problems with old discoloured, badly looking composite fillings. Even
              natural defects such as gaps between the teeth may appear disturbing.
            </p>
            <p>
              In such cases the ideal and easy solution is to replace the fillings or close the gaps
              between the teeth with ceramic veneers or crowns. Old silver-black or discoloured composite
              fillings are a nightmare for somebody with a wide smile. Easy help! Ceramic inlays! Strong,
              precisely fitting, and natural looking.
            </p>
            <p>
              It is possible that wrongly designed crowns and bridges create bad breath. You may also
              already have old crowns you do not feel comfortable with and would like to replace them to
              achieve better functionality and a more natural look. Plus replacing your old crowns and
              missing teeth with new functional teeth makes you able to enjoy the taste of your favourite
              food again. What do you think?
            </p>
            <p>
              When the enamel (the visible upper layer of your tooth) is not hard enough your teeth may show
              evident wear-down. With veneers/crowns you can go back in time and achieve the appearance of
              youth in a very short time.
            </p>

            <h2>There is always a solution to your discomfort.</h2>
            <p>
              Remember that ceramic materials are stable, natural looking and faultless. A proper ceramic
              tooth will serve you a lifetime.
            </p>

            <p>
              Do not hesitate to do a check-up of your own smile by filling our{' '}
              <Link href="/smile-check-form" className="font-semibold text-brand-300">
                smile check form
              </Link>{' '}
              to find out how your smile can be improved.
            </p>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10">
              <Image
                src="/images/hero-comfort.jpg"
                alt="Close-up of a relaxed, confident patient smile"
                fill
                sizes="(min-width:1024px) 35vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="panel mt-6">
              <h2 className="text-lg">Chipped, discoloured or worn?</h2>
              <p className="mt-3 text-sm text-silver-400">
                Inlays, veneers and crowns fix most of it without a long treatment plan.
              </p>
              <PrimaryButton href="/book-appointment" className="mt-5">
                Book a free consultation
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading eyebrow="Cases" title="Comfort and confidence" />
        <div className="mt-10">
          <ImageGallery images={GALLERY} columns={3} heading="Ceramic inlay, bridge and shading cases" />
        </div>
      </Section>

      <Section>
        <CtaBanner />
      </Section>
    </Layout>
  );
}