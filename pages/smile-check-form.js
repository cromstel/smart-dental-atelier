import Image from 'next/image';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import SmileCheckForm from '@/components/forms/SmileCheckForm';
import { getSmileCheckQuestions } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { breadcrumbJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Smile check form' },
];

export default function SmileCheckFormPage({ questions = [] }) {
  return (
    <Layout>
      <Seo
        title="Smile check form"
        description="Answer eleven short questions about your teeth and find out what bothers you about your smile — then request a free consultation."
        pathname="/smile-check-form"
        image="/images/smile-check-1.jpg"
        jsonLd={breadcrumbJsonLd(BREADCRUMBS)}
      />

      <PageHeader
        title="Ready for your smile check?"
        subtitle="Look in the mirror, give yourself a big smile and tell us what you would change if possible. Find out what bothers you."
        breadcrumbs={BREADCRUMBS}
      >
        <div className="flex flex-wrap gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-brand-400/30">
            <Image src="/images/smile-check-1.jpg" alt="" fill sizes="128px" className="object-cover" />
          </div>
          <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-brand-400/30">
            <Image src="/images/smile-check-2.jpg" alt="" fill sizes="128px" className="object-cover" />
          </div>
        </div>
      </PageHeader>

      <Section>
        <div className="mx-auto max-w-3xl">
          {questions.length > 0 ? (
            <SmileCheckForm questions={questions} />
          ) : (
            <div className="panel-gold">
              <h2 className="text-xl">Temporarily unavailable</h2>
              <p className="mt-3 text-sm text-silver-400">
                The smile-check questions could not be loaded. Please contact us on{' '}
                <a href="tel:+3223764326" className="link-underline">
                  +32 2 376 43 26
                </a>{' '}
                or e-mail{' '}
                <a href="mailto:contact@dentalatelier.co" className="link-underline">
                  contact@dentalatelier.co
                </a>{' '}
                and we will reply personally.
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section tone="sunken">
        <div className="mx-auto max-w-3xl">
          <div className="panel">
            <h2 className="text-xl">If you answered yes on one or more of these questions</h2>
            <p className="mt-4 text-sm leading-relaxed text-silver-400">
              Please contact us to schedule a free consultation. Bring (or ask your dentist for) a recent
              photograph of your smile — the digital analysis works far better with one.
            </p>
            <p className="mt-4 text-sm text-silver-400">
              And if you are not sure yet, that is completely fine too: many people only decide once they
              have seen a preview of the result.
            </p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const questions = await getSmileCheckQuestions();
  return { props: serializeDates({ questions }), revalidate: 600 };
}