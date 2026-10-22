import Link from 'next/link';
import Image from 'next/image';
import { SITE, NAV_ITEMS } from '@/lib/content';
import { telHref } from '@/lib/format';

/**
 * Site footer with contact details, navigation and legal links.
 *
 * The contact block follows the studio's saved settings, so editing
 * "contact.phone" in the admin portal changes the footer on every page and
 * not only the contact page. `contact` is the merged settings object the
 * pages load; anything it does not carry falls back to the bundled values.
 */
export default function Footer({ contact = {}, copyright }) {
  const lines = contact.address?.lines || SITE.address.lines;
  const mobile = contact.mobile || SITE.mobile;
  const mobileDisplay = contact.mobileDisplay || mobile;
  const phone = contact.phone || SITE.phone;
  const phoneDisplay = contact.phoneDisplay || phone;
  const email = contact.email || SITE.email;
  const vat = contact.vat || SITE.vat;
  const facebook = contact.facebook || SITE.facebook;
  const tagline = contact.tagline || SITE.tagline;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-brand-400/20 bg-gradient-to-b from-brand-900/60 to-ink">
      <div className="container mx-auto grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/images/logo-white.webp"
            alt={SITE.name}
            width={225}
            height={65}
            className="h-10 w-auto"
          />
          <p className="mt-4 text-sm leading-relaxed text-silver-400">{tagline}</p>
          <p className="mt-4 text-sm text-silver-500">VAT {vat}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-caps text-brand-300">Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic text-silver-400">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            <a href={telHref(mobile)} className="link-underline block pt-2">
              Mobile: {mobileDisplay}
            </a>
            <a href={telHref(phone)} className="link-underline block">
              Phone: {phoneDisplay}
            </a>
            <a href={`mailto:${email}`} className="link-underline block">
              {email}
            </a>
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="link-underline block">
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
              <Link href="/auth/login" className="link-underline">
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