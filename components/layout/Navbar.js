import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useId, useRef, useState } from 'react';
import { NAV_ITEMS, SITE } from '@/lib/content';
import { useSession, signOut } from 'next-auth/react';

/**
 * Responsive top navigation.
 *
 * Replaces the legacy Bootstrap navbar. Improvements over the original:
 *  - a real `<nav aria-label>` with `aria-current="page"` on the active item
 *  - an accessible disclosure for mobile (aria-expanded / aria-controls, Esc
 *    to close, focus moved into the panel)
 *  - visible focus rings (the old CSS removed outlines globally)
 *  - a "Book" call to action instead of a nav item named "Dental Atelier -
 *    Contact Us"
 */
export default function Navbar({ menuItems = NAV_ITEMS, variant = 'light' }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  const isDark = variant === 'dark';

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    router.events.on('routeChangeComplete', close);
    return () => {
      router.events.off('routeChangeStart', close);
      router.events.off('routeChangeComplete', close);
    };
  }, [router.events]);

  // Escape closes the panel and returns focus to the toggle.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Lock body scroll while the mobile panel is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname === href || router.pathname.startsWith(`${href}/`);
  };

  return (
    <header className={isDark ? 'bg-ink-900/95 backdrop-blur' : 'bg-ink-800/80 backdrop-blur'}>
      <div className="border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between gap-4 py-2 text-xs">
          <Link href="/contact-us" className="link-underline hidden text-brand-300 sm:inline">
            {SITE.tagline}
          </Link>
          <span className="hidden sm:inline" aria-hidden="true" />
          <div className="flex items-center gap-4">
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="link-underline">
              {SITE.phoneDisplay}
            </a>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline"
            >
              Facebook
            </a>
            {status === 'authenticated' ? (
              <>
                <Link href={session?.user?.role === 'ADMIN' ? '/admin' : '/portal'} className="link-underline">
                  {session.user.role === 'ADMIN' ? 'Admin' : 'My portal'}
                </Link>
                <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="link-underline">
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="link-underline">
                Client sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="container mx-auto" aria-label="Main">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} home`}>
            <Image
              src="/images/logo-white.webp"
              alt="Dental Atelier"
              width={225}
              height={65}
              className="h-10 w-auto"
            />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'block rounded px-3 py-2 text-xs font-semibold uppercase tracking-caps transition-colors',
                      active
                        ? 'text-brand-300 underline decoration-brand-400 decoration-2 underline-offset-8'
                        : 'text-silver-200 hover:text-brand-200',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/book-appointment"
              className="hidden rounded-md bg-brand-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-300 sm:inline-block"
            >
              Book an appointment
            </Link>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls={panelId}
              className="inline-flex items-center gap-2 rounded-md border border-brand-400/40 px-3 py-2 text-sm text-brand-200 lg:hidden"
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile panel */}
      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        className="border-t border-white/10 bg-ink-900 lg:hidden"
      >
        <ul className="container mx-auto flex flex-col py-2">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'block border-b border-white/5 px-1 py-3 text-sm font-semibold uppercase tracking-caps',
                    active ? 'text-brand-300' : 'text-silver-200',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="py-4">
            <Link
              href="/book-appointment"
              className="block rounded-md bg-brand-400 px-4 py-3 text-center text-sm font-semibold text-black"
            >
              Book an appointment
            </Link>
          </li>
          <li className="pb-4 text-xs text-silver-500">
            <Link href="/login" className="link-underline">
              Client sign in
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}