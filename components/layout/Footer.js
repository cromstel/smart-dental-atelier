import Link from 'next/link';
import Image from 'next/image';
import { SITE, NAV_ITEMS } from '@/lib/content';
import { telHref } from '@/lib/format';

/** Site footer with contact details, navigation and legal links. */
export default function Footer({ address, phone, email, copyright }) {
  const lines = address || SITE.address.lines;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-brand-400/20 bg-gradient-to-b from-brand-900/60 to-ink">
      <div className="container mx-auto grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/images/logo-white.webp"
            alt="Dental Atelier"
            width={225}
            height={65}
            className="h-10 w-auto"
          />
          <p className="mt-4 text-sm leading-relaxed text-silver-400">{SITE.tagline}</p>
          <p className="mt-4 text-sm text-silver-500">VAT {SITE.vat}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-caps text-brand-300">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-silver-400">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <a href={telHref(phone || SITE.mobile)} className="link-underline block pt-2">
              Mobile: {phone || SITE.mobileDisplay}
            </a>
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="link-underline block">
              Phone: {SITE.phoneDisplay}
            </a>
            <a href={`mailto:${email || SITE.email}`} className="link-underline block">
              {email || SITE.email}
            </a>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" className="link-underline block">
              Follow us on Facebook
            </a>
          </address>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-caps text-brand-300">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm text-silver-400">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/testimonials" className="link-underline">
                Testimonials
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-caps text-brand-300">Portals</h2>
          <ul className="mt-4 space-y-2 text-sm text-silver-400">
            <li>
              <Link href="/book-appointment" className="link-underline">
                Book an appointment
              </Link>
            </li>
            <li>
              <Link href="/smile-check-form" className="link-underline">
                Smile check form
              </Link>
            </li>
            <li>
              <Link href="/portal" className="link-underline">
                Client portal
              </Link>
            </li>
            <li>
              <Link href="/login" className="link-underline">
                Sign in
              </Link>
            </li>
          </ul>
          <Link
            href="/book-appointment"
            className="mt-6 inline-block rounded-md border border-brand-400/60 px-4 py-2 text-sm font-semibold text-brand-200 transition hover:bg-brand-400 hover:text-black"
          >
            Request a free consultation
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container mx-auto flex flex-col gap-2 py-6 text-xs text-silver-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright || `© ${year} ${SITE.legalName}`}</p>
          <p>
            Re-implemented from the original Dental Atelier site · Images © their respective authors
          </p>
        </div>
      </div>
    </footer>
  );
}