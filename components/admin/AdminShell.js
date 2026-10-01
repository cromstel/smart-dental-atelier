import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { SITE } from '@/lib/content';
import { initials } from '@/lib/format';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/appointments', label: 'Appointments' },
  { href: '/admin/messages', label: 'Inquiries' },
  { href: '/admin/testimonials', label: 'Testimonials' },
  { href: '/admin/faqs', label: 'FAQs' },
  { href: '/admin/services', label: 'Products & Services' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/content', label: 'Page content' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

/**
 * Chrome for every `/admin/*` page: skip link, labelled sidebar, a header with
 * the signed-in admin, and a "view site" link.
 *
 * Authorisation itself is enforced server-side in `getServerSideProps`
 * (`requireAdminPage`) and again on every `/api/admin/**` route — this shell
 * only hides links that the signed-in role cannot use.
 */
export default function AdminShell({ title, description, actions, children, wide = false }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  const isActive = (item) => (item.exact ? router.pathname === item.href : router.pathname.startsWith(item.href));

  return (
    <div className="min-h-screen bg-ink">
      <Head>
        <title>{`${title} · Admin · Dental Atelier`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <a href="#admin-main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-white/10 bg-ink-900">
        <div className="container mx-auto flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setNavOpen((value) => !value)}
              aria-expanded={navOpen}
              aria-controls="admin-nav"
              className="rounded-md border border-white/15 p-2 text-silver-300 lg:hidden"
            >
              <span className="sr-only">{navOpen ? 'Close admin menu' : 'Open admin menu'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <Link href="/admin" className="flex items-center gap-3">
              <Image src="/images/logo-white.webp" alt="" width={225} height={65} className="h-9 w-auto" />
              <span className="rounded border border-brand-400/40 px-2 py-0.5 text-2xs font-semibold uppercase tracking-caps text-brand-300">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-xs text-silver-400 transition hover:text-brand-200 sm:inline">
              View site ↗
            </Link>

            {session?.user ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/40 bg-brand-400/10 text-xs font-semibold text-brand-200"
                >
                  {initials(session.user.name || session.user.email)}
                </span>
                <span className="hidden text-xs text-silver-400 sm:inline">{session.user.email}</span>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50 hover:text-brand-200"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-8 py-8 lg:flex-row">
        <nav
          id="admin-nav"
          aria-label="Admin sections"
          hidden={!navOpen}
          className="lg:hidden lg:block lg:w-60 lg:shrink-0"
        >
          <ul className="panel sticky top-6 space-y-1 p-3">
            {NAV.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setNavOpen(false)}
                    className={[
                      'block rounded px-3 py-2 text-sm transition',
                      active
                        ? 'bg-brand-400/15 font-semibold text-brand-200'
                        : 'text-silver-400 hover:bg-white/5 hover:text-silver-100',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main id="admin-main" tabIndex={-1} className={`min-w-0 flex-1 focus:outline-none ${wide ? '' : 'max-w-5xl'}`}>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl">{title}</h1>
              {description ? <p className="mt-2 max-w-2xl text-sm text-silver-400">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          {children}
        </main>
      </div>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-silver-600">
        {SITE.name} admin portal — all actions are recorded in the audit log.
      </footer>
    </div>
  );
}