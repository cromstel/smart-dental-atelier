import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import { SITE } from '@/lib/content';

/** Chrome for the client portal (`/portal/*`). */
export default function PortalShell({ title, description, children }) {
  const { data: session } = useSession();
  const router = useRouter();

  const items = [
    { href: '/portal', label: 'Overview', exact: true },
    { href: '/portal/appointments', label: 'My appointments' },
    { href: '/portal/inquiries', label: 'My inquiries' },
    { href: '/portal/profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <Head>
        <title>{`${title} · ${SITE.name}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <a href="#portal-main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-white/10 bg-ink-900">
        <div className="container mx-auto flex items-center justify-between gap-4 py-4">
          <Link href="/portal" className="flex items-center gap-3">
            <Image src="/images/logo-white.png" alt="" width={225} height={65} className="h-9 w-auto" />
            <span className="rounded border border-accent-400/40 px-2 py-0.5 text-2xs font-semibold uppercase tracking-caps text-accent-300">
              Client portal
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-silver-400 transition hover:text-brand-200">
              View site ↗
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-silver-300 transition hover:border-brand-400/50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-8 py-8 lg:flex-row">
        <nav aria-label="Portal sections" className="lg:w-60 lg:shrink-0">
          <ul className="panel sticky top-6 space-y-1 p-3">
            {items.map((item) => {
              const active = item.exact ? router.pathname === item.href : router.pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
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

            {session?.user?.role === 'ADMIN' ? (
              <li className="mt-2 border-t border-white/10 pt-2">
                <Link href="/admin" className="block rounded px-3 py-2 text-sm text-brand-300 transition hover:bg-white/5">
                  Admin portal →
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <main id="portal-main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
          <h1 className="text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-silver-400">{description}</p> : null}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}