import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SectionHeading from '@/components/marketing/SectionHeading';
import TestimonialsSlider from '@/components/marketing/TestimonialsSlider';
import ImageGallery from '@/components/marketing/ImageGallery';
import CtaBanner from '@/components/marketing/CtaBanner';
import { FEATURE_SECTIONS, SITE } from '@/lib/content';
import { getHomeData, getGallery } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { organisationJsonLd } from '@/lib/seo';

/**
 * Home page.
 *
 * Structure mirrors the live site: three feature banners, the facial-analysis
 * intro panel, and the testimonial carousel — plus SEO/OG tags and real alt
 * text that the original had none of.
 */
export default function HomePage({ testimonials = [], gallery = [] }) {
  const smileGallery = gallery.filter((image) => image.category === 'smile').slice(0, 6);

  return (
    <Layout>
      <Seo
        title="A state-of-the-art laboratory"
        description="Dental Atelier is a state-of-the-art dental laboratory in Brussels. Ceramics, veneers, crowns and bridges designed from facial analysis and digital smile design."
        pathname="/"
        image="/images/hero-sexy.webp"
        jsonLd={organisationJsonLd(SITE)}
      >
        <meta property="og:locale" content="en_GB" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd(SITE)) }}
        />
      </Seo>

      {/* Hero ------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-sexy.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50" aria-hidden="true" />
        </div>

        <div className="container mx-auto flex min-h-[70vh] flex-col justify-center gap-6 py-24">
          <p className="text-xs font-semibold uppercase tracking-caps text-brand-400">{SITE.tagline}</p>
          <h1 className="max-w-4xl text-4xl leading-tight md:text-6xl">
            Dental Atelier is here to empower you to live a healthy, happy life with a peace of mind.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-silver-300 md:text-lg">
            Just like a fingerprint, each smile is unique — so we give every patient an individual
            approach, using modern methods and the latest equipment.
          </p>
          <div className="flex flex-wrap gap-4">
            <PrimaryButton href="/book-appointment" size="lg">
              Make an appointment
            </PrimaryButton>
            <PrimaryButton href="/smile-check-form" variant="secondary" size="lg">
              Use the smile check form
            </PrimaryButton>
          </div>
        </div>
      </section>

      {/* Three feature banners -------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="What a smile can do"
          title="Three ways we change a smile"
          lede="Every case starts with your face, not with a template. Pick the story closest to yours."
        />

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_SECTIONS.map((feature, index) => (
            <li key={feature.slug}>
              <Link
                href={`/${feature.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-lg border border-white/10 transition duration-250 hover:border-brand-400/50"
              >
                <Image
                  src={feature.image}
                  alt={`Close-up of a patient smile illustrating “${feature.title}”`}
                  fill
                  priority={index === 0}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-250 group-hover:scale-105"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="block text-xs font-semibold uppercase tracking-caps text-brand-300">
                    {feature.headingLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                  <span className="mt-3 block text-sm text-silver-300 opacity-0 transition group-hover:opacity-100">
                    {feature.intro}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Facial analysis -------------------------------------------- */}
      <Section tone="gold">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Facial analysis and Digital Smile Design"
              lede="An ideal smile is linked to certain biometrical features of your face."
            />
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-silver-300">
              <p>
                By measuring these features and transferring the relevant information in the computer we
                can analyse your face digitally and use the outcome of the analysis to improve your smile or
                create a new smile that fits your face better.
              </p>
              <p>
                Collaboration between patient, dentist and technician is very important to achieve the
                final result we are aiming to. Every step of the way is set in advance, so there is no
                unwanted surprise at the end of your treatment.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryButton href="/facial-analysis-and-digital-smile-design">
                Facial analysis and Digital Smile Design
              </PrimaryButton>
              <PrimaryButton href="/services" variant="secondary">
                All services
              </PrimaryButton>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-4">
            {smileGallery.slice(0, 4).map((image) => (
              <li key={image.url} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="(min-width:1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Testimonials ---------------------------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Patient stories"
          title="What our patients say"
          lede="Unedited feedback about crowns, veneers, implant bridges and full smile makeovers."
          align="center"
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <TestimonialsSlider testimonials={testimonials} heading="Patient testimonials" />
        </div>
        <p className="mt-8 text-center">
          <Link href="/testimonials" className="link-underline text-sm text-brand-300">
            Read all testimonials
          </Link>
        </p>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <CtaBanner />
        </div>
      </Section>
    </Layout>
  );
}

/**
 * ISR every 5 minutes: the home page is the most-shared surface but its
 * content (testimonials, banners) changes rarely. Reads fall back to the
 * bundled copy when MySQL is unavailable, so this never fails a build.
 */
export async function getStaticProps() {
  const [{ testimonials }, gallery] = await Promise.all([getHomeData(), getGallery()]);
  return { props: serializeDates({ testimonials, gallery }), revalidate: 300 };
}