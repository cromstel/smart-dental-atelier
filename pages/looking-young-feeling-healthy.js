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
  { label: 'Looking young, feeling healthy' },
];

const GALLERY = [
  { url: '/images/smile-young-1.webp', altText: 'Ceramic crowns restoring worn teeth', title: 'Crowns and bridges' },
  { url: '/images/smile-young-2.webp', altText: 'Complete smile makeover result', title: 'Smile makeover' },
  { url: '/images/smile-young-3.webp', altText: 'Patient looking younger after ceramic restoration', title: 'Younger looking smile' },
];

export default function LookingYoungFeelingHealthyPage() {
  return (
    <Layout>
      <Seo
        title="Looking young, feeling healthy"
        description="Teeth get more translucent, discoloured and worn with age. Veneers, crowns, bridges and implants reverse most of it — and support the jaw bone."
        pathname="/looking-young-feeling-healthy"
        image="/images/hero-young.webp"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Looking young, feeling healthy"
        subtitle="It is only natural that as we get older our “body parts” are wearing down. The same happens with our teeth."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="prose-atelier">
            <p>
              The teeth are changing day by day. It is not only the body of the teeth but also their
              translucency and glow. This has a significant impact on your appearance and well-being.
            </p>
            <p>
              The teeth get more translucent with age and that is why they appear greyish. Yellowish
              discolouration also appears. Big deep stained crack lines develop. Losing a tooth or two for
              various reasons is quite common. Those unable to chew the food properly because of missing
              teeth can easily develop illnesses to their digestive system. Missing teeth can also cause
              disappearance of the jaw bone structure. The jaw is shrinking and this reflects in an older
              expression of your face.
            </p>

            <h2>The good news</h2>
            <p>
              Is that thanks to the newest technologies we can correct a large part these imperfections
              that are so bothersome to many of us. A decision to remake your smile gives you the
              possibility to make a full use of our extensive selection of various types of veneers and
              crowns. They can make a substantial difference to how you feel and how you look.
            </p>
            <p>
              In case you are missing one or more teeth it is also possible to construct an implant crown
              or a common bridge. The bridge will save you from wearing a removable denture which is less
              comfortable to wear, and frankly, more than often less aesthetic. By using dental implants we
              are able to support the jaw bone and thus make you look younger and healthier.
            </p>

            <p>
              Please{' '}
              <Link href="/book-appointment" className="font-semibold text-brand-300">
                contact us to make an appointment for a free consultation
              </Link>
              .
            </p>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10">
              <Image
                src="/images/hero-young.webp"
                alt="Patient with a restored, younger looking smile"
                fill
                sizes="(min-width:1024px) 35vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="panel mt-6">
              <h2 className="text-lg">Missing one or more teeth?</h2>
              <p className="mt-3 text-sm text-silver-400">
                An implant crown keeps the jaw bone alive and looks entirely natural.
              </p>
              <PrimaryButton href="/products-and-materials" variant="secondary" className="mt-5">
                See implant solutions
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading eyebrow="Cases" title="Looking younger" />
        <div className="mt-10">
          <ImageGallery images={GALLERY} columns={3} heading="Crown, bridge and makeover cases" />
        </div>
      </Section>

      <Section>
        <CtaBanner />
      </Section>
    </Layout>
  );
}