import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import CredentialsSignIn from '@/components/auth/CredentialsSignIn';
import PrimaryButton from '@/components/ui/PrimaryButton';

/**
 * Client sign-in: `/auth/login`, the whole `/auth/*` family's entry point.
 *
 * Administrators are deliberately not finished here — a staff session is handed
 * to `/auth/admin/login`, which forwards it to `/admin`. That is what keeps
 * "admin authentication lives under `/auth/admin/*`" true end to end while the
 * two pages still share one form.
 *
 * The form itself lives in `components/auth/CredentialsSignIn.js`, which the
 * admin page renders with its own variant.
 */
export default function LoginPage() {
  return (
    <Layout>
      <Seo
        title="Sign in"
        description="Sign in to the Dental Atelier client portal."
        pathname="/auth/login"
        noIndex
      />

      <div className="container mx-auto flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <CredentialsSignIn variant="client">
            <div className="panel mt-6">
              <h2 className="text-lg">No account yet?</h2>
              <p className="mt-3 text-sm text-silver-400">
                You do not need one to book: the appointment form works for guests. Accounts are
                created by the studio, or automatically when you sign in with Google.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <PrimaryButton href="/book-appointment" variant="secondary" size="sm">
                  Book as a guest
                </PrimaryButton>
                <PrimaryButton href="/contact-us" variant="ghost" size="sm">
                  Contact us
                </PrimaryButton>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-silver-600">
              Staff account?{' '}
              <Link href="/auth/admin/login" className="link-underline">
                Sign in to the admin portal
              </Link>
              .
            </p>
          </CredentialsSignIn>
        </div>
      </div>
    </Layout>
  );
}
