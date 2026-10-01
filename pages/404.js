import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { NAV_ITEMS } from '@/lib/content';

/** 404 — kept in the site's own chrome so it feels like part of the site. */
export default function NotFound() {
  return (
    <Layout>
      <Seo
        title="Page not found"
        description="The page you were looking for does not exist. Try the navigation or the smile check form instead."
        pathname="/404"
        noIndex
      />

      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-7xl text-brand-400">404</p>
        <h1 className="mt-6 text-3xl">We could not find that page</h1>
        <p className="mt-4 max-w-md text-sm text-silver-400">
          The link may be out of date, or the page may have moved. Here is the way back.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <PrimaryButton href="/">Back to home</PrimaryButton>
          <PrimaryButton href="/contact-us" variant="secondary">
            Contact us
          </PrimaryButton>
        </div>

        <nav aria-label="Site sections" className="mt-14 w-full max-w-2xl">
          <h2 className="text-sm font-semibold uppercase tracking-caps text-brand-300">All pages</h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-underline text-sm text-silver-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Layout>
  );
}