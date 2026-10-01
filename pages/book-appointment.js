import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { PageHeader } from '@/components/marketing/HeroSection';
import AppointmentForm from '@/components/forms/AppointmentForm';
import { SITE } from '@/lib/content';
import { getServices } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Book an appointment' },
];

export default function BookAppointmentPage({ services = [] }) {
  return (
    <Layout>
      <Seo
        title="Book an appointment"
        description="Request a free consultation, a custom colour shading appointment or a digital smile design session at Dental Atelier in Uccle, Brussels."
        pathname="/book-appointment"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Book an appointment"
        subtitle="Consultations are free. Pick a preferred day and we will call you to confirm the exact time."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <div className="panel">
            <AppointmentForm
              services={services}
              description="Tell us who you are and when you are available. Fields marked * are required."
            />
          </div>

          <aside className="space-y-6">
            <div className="panel-gold">
              <h2 className="text-lg">What happens next</h2>
              <ol className="mt-4 space-y-3 text-sm text-silver-400">
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-300">1.</span>
                  You submit the form above (it takes about a minute).
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-300">2.</span>
                  We call you on the number you gave us to agree the exact slot.
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-300">3.</span>
                  At the appointment we analyse your face digitally and, if you like, produce a preview
                  of your new smile.
                </li>
              </ol>
            </div>

            <div className="panel">
              <h2 className="text-lg">Prefer to call?</h2>
              <p className="mt-3 text-sm text-silver-400">
                Mobile{' '}
                <a href={`tel:${SITE.mobile.replace(/[^\d+]/g, '')}`} className="link-underline text-silver-100">
                  {SITE.mobileDisplay}
                </a>
                <br />
                Phone{' '}
                <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="link-underline text-silver-100">
                  {SITE.phoneDisplay}
                </a>
                <br />
                E-mail{' '}
                <a href={`mailto:${SITE.email}`} className="link-underline text-silver-100">
                  {SITE.email}
                </a>
              </p>
            </div>

            <div className="panel">
              <h2 className="text-lg">Already a client?</h2>
              <p className="mt-3 text-sm text-silver-400">
                Sign in to see your previous requests and their status.
              </p>
              <PrimaryButton href="/auth/login?callbackUrl=/portal" variant="secondary" className="mt-5">
                Client sign in
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const products = await getServices('product');
  const services = await getServices('service');
  return { props: serializeDates({ services: [...products, ...services] }), revalidate: 600 };
}