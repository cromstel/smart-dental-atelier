import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Section from '@/components/ui/Section';
import { PageHeader } from '@/components/marketing/HeroSection';
import SectionHeading from '@/components/marketing/SectionHeading';
import { GoogleMapFacade } from '@/components/marketing/GoogleMapEmbed';
import ContactForm from '@/components/forms/ContactForm';
import { DIRECTIONS, SITE } from '@/lib/content';
import { getSettings } from '@/lib/cms';
import { serializeDates } from '@/lib/serialize';
import { telHref } from '@/lib/format';
import { breadcrumbJsonLd, organisationJsonLd } from '@/lib/seo';

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Contact Us' },
];

export default function ContactPage({ settings = SITE }) {
  // Contact details come from the admin Settings screen, falling back to the
  // values bundled in lib/content.js.
  const mobile = settings.mobile || SITE.mobile;
  const mobileDisplay = settings.mobileDisplay || mobile;
  const phone = settings.phone || SITE.phone;
  const phoneDisplay = settings.phoneDisplay || phone;
  const email = settings.email || SITE.email;
  const vat = settings.vat || SITE.vat;
  const addressLines = settings.address?.lines || SITE.address.lines;
  return (
    <Layout>
      <Seo
        title="Contact Us"
        description="Contact Dental Atelier Michal Siakel: Rue du Bourdon 100/8, 1180 Uccle, Brussels. Mobile +32 478 54 74 75, phone +32 2 376 43 26."
        pathname="/contact-us"
        jsonLd={organisationJsonLd(SITE)}
      />

      <PageHeader
        title="Contact us"
        subtitle="We reply to e-mail within one working day, and we answer the phone during opening hours."
        breadcrumbs={BREADCRUMBS}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <SectionHeading level={2} title="Contact details" />

            <dl className="mt-8 space-y-6 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-brand-400">Mobile</dt>
                <dd className="mt-1">
                  <a href={telHref(mobile)} className="link-underline text-base text-silver-100">
                    {mobileDisplay}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-brand-400">Phone</dt>
                <dd className="mt-1">
                  <a href={telHref(phone)} className="link-underline text-base text-silver-100">
                    {phoneDisplay}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-brand-400">E-mail</dt>
                <dd className="mt-1">
                  <a href={`mailto:${email}`} className="link-underline text-base text-silver-100">
                    {email}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-brand-400">VAT</dt>
                <dd className="mt-1 text-base text-silver-100">{vat}</dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-caps text-brand-400">
                  <h3 className="text-base">Address:</h3>
                </dt>
                <dd className="mt-2">
                  <address className="not-italic leading-relaxed text-silver-200">
                    {addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </dd>
              </div>
            </dl>

            <div className="mt-10">
              <SectionHeading level={2} title="How to reach us" />
              <div className="mt-6 space-y-5">
                {DIRECTIONS.map((direction) => (
                  <div key={direction.id} className="border-l-2 border-brand-400/40 pl-4">
                    <h3 className="text-sm font-semibold text-brand-200">{direction.title}</h3>
                    {direction.body ? (
                      <p className="mt-1 text-sm leading-relaxed text-silver-400">{direction.body}</p>
                    ) : null}
                    {direction.link ? (
                      <a
                        href={direction.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline mt-1 inline-block text-sm text-brand-300"
                      >
                        {direction.link.label}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="panel">
              <ContactForm
                submitLabel="Submit"
                title="Send us a message"
                description="Firstname, surname, e-mail and your enquiry. We will get back to you within one working day."
              />
            </div>

            <div>
              <GoogleMapFacade />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl">Not sure what to ask for?</h2>
          <p className="mt-4 text-sm text-silver-400">
            Run the eleven-question smile check first — it tells you (and us) what to talk about.
          </p>
          <Link
            href="/smile-check-form"
            className="mt-6 inline-block rounded-md bg-brand-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-brand-300"
          >
            Use our smile check form as a help
          </Link>
        </div>
      </Section>
    </Layout>
  );
}

export async function getStaticProps() {
  const settings = await getSettings();
  return { props: serializeDates({ settings }), revalidate: 600 };
}