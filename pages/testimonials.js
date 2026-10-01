import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import TestimonialCard from '@/components/marketing/TestimonialCard';
import CtaBanner from '@/components/marketing/CtaBanner';
import { getTestimonials } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Testimonials' },
];

export default function TestimonialsPage({ testimonials = [] }) {
  return (
    <Layout>
      <Seo
        title="Testimonials"
        description="Unedited feedback from patients of Dental Atelier about crowns, veneers, implant bridges and full smile makeovers."
        pathname="/testimonials"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="What our patients say"
        subtitle="Feedback about crowns, veneers, implant bridges and complete smile makeovers."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <SectionHeading
          eyebrow={`${testimonials.length} review${testimonials.length === 1 ? '' : 's'}`}
          title="In their own words"
        />

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <li key={`${testimonial.author}-${index}`} className="h-full">
              <TestimonialCard
                quote={testimonial.quote}
                author={testimonial.author}
                treatment={testimonial.treatment}
                avatarSrc={testimonial.image}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <CtaBanner
            title="Ready for your smile check?"
            description="Look in the mirror, give yourself a big smile and tell us what you would change if possible. Find out what bothers you."
            primary={{ label: 'Use our smile check form as a help', href: '/smile-check-form' }}
            secondary={{ label: 'Book a free consultation', href: '/book-appointment' }}
          />
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-silver-400">
            Had treatment with us and would like to add your experience?{' '}
            <PrimaryButton href="/contact-us" variant="ghost" size="sm">
              Send us your feedback
            </PrimaryButton>
          </p>
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const testimonials = await getTestimonials();
  return { props: serializeDates({ testimonials }), revalidate: 300 };
}