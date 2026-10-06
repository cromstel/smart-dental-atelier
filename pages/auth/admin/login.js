import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import CredentialsSignIn from '@/components/auth/CredentialsSignIn';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { getSessionUser } from '@/lib/guards';
import { AUTH_ROUTES, safeCallbackUrl } from '@/lib/authRoutes';

/**
 * Staff sign-in: `/auth/admin/login`.
 *
 * Every administrator authentication goes through this URL — the guard for
 * `/admin/*` sends anonymous visitors here, signing out of the admin portal
 * returns here, and a staff session started anywhere else is handed back here
 * before it reaches `/admin`.
 *
 * An administrator who is *already* signed in (the usual case after
 * `signOut()` on a different tab, or after the client page forwarded a staff
 * session) is forwarded straight to their destination instead of being shown a
 * password form they do not need. The check reads the account from the
 * database rather than trusting the token, so a deactivated account still gets
 * the form — and cannot sign in at all.
 */
export default function AdminLoginPage() {
  return (
    <Layout>
      <Seo
        title="Admin sign in"
        description="Sign in to the Dental Atelier admin portal."
        pathname={AUTH_ROUTES.admin}
        noIndex
      />

      <div className="container mx-auto flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <CredentialsSignIn variant="admin">
            <div className="panel mt-6">
              <h2 className="text-lg">Staff accounts only</h2>
              <p className="mt-3 text-sm text-silver-400">
                Accounts are created and activated by the studio administrator under Users. Clients
                keep their own appointments and inquiries in the client portal.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <PrimaryButton href={AUTH_ROUTES.client} variant="secondary" size="sm">
                  Client sign in
                </PrimaryButton>
                <PrimaryButton href="/" variant="ghost" size="sm">
                  Back to the site
                </PrimaryButton>
              </div>
            </div>
          </CredentialsSignIn>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res, query }) {
  const { user } = await getSessionUser(req, res);

  if (user?.role === 'ADMIN') {
    // Temporary (307), never 308: where this lands depends on the session and
    // on `callbackUrl`, so it must not be cached as a permanent move. Same
    // rules as every other hop — a relative, non-auth target or `/admin`.
    const destination = safeCallbackUrl(query.callbackUrl, '/admin');

    res.writeHead(307, { Location: destination });
    res.end();

    return { props: {} };
  }

  return { props: {} };
}
