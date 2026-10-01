import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import FormInput from '@/components/ui/FormInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import { SITE } from '@/lib/content';

/**
 * Credentials sign-in for both portals.
 *
 * NextAuth returns an error code rather than a message, so the copy for each
 * known code is translated here ("CredentialsSignin" deliberately does not
 * reveal whether the e-mail exists).
 */
const ERROR_COPY = {
  CredentialsSignin: 'That e-mail and password combination is not correct.',
  Configuration: 'Sign-in is not configured yet. Please contact the studio.',
  AccessDenied: 'You do not have access to that area.',
  Verification: 'Please verify your account and try again.',
  Default: 'We could not sign you in. Please try again.',
};

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : '/portal';

  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (router.query.error) {
      setError(ERROR_COPY[String(router.query.error)] || ERROR_COPY.Default);
    }
    if (router.query.error === 'inactive') {
      setError('This account has been deactivated. Please contact the studio.');
    }
  }, [router.query.error]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!values.email || !values.password) {
      setError('Please enter your e-mail address and password.');
      return;
    }

    setSubmitting(true);
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl,
    });
    setSubmitting(false);

    if (result?.error) {
      setError(ERROR_COPY[result.error] || ERROR_COPY.Default);
      return;
    }

    // Admins land in the admin portal, clients in their own.
    const destination =
      callbackUrl && callbackUrl !== '/portal' ? callbackUrl : result?.url || '/portal';
    router.push(destination);
  };

  return (
    <Layout>
      <Seo
        title="Sign in"
        description="Sign in to the Dental Atelier client portal or admin area."
        pathname="/login"
        noIndex
      />

      <div className="container mx-auto flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="panel-gold">
            <h1 className="text-3xl">Sign in</h1>
            <p className="mt-3 text-sm text-silver-400">
              Client accounts see their appointments and inquiries. Staff accounts get the full admin
              portal.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
              {error ? (
                <Alert tone="error" title="Sign-in failed" onDismiss={() => setError('')}>
                  {error}
                </Alert>
              ) : null}

              <FormInput
                label="E-mail"
                name="email"
                type="email"
                required
                autoComplete="username"
                value={values.email}
                onChange={handleChange}
              />

              <FormInput
                label="Password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange}
              />

              <PrimaryButton type="submit" size="lg" loading={submitting} className="w-full">
                {submitting ? 'Signing in…' : 'Sign in'}
              </PrimaryButton>
            </form>
          </div>

          <div className="panel mt-6">
            <h2 className="text-lg">No account yet?</h2>
            <p className="mt-3 text-sm text-silver-400">
              You do not need one to book: the appointment form works for guests. Accounts are created
              by the studio, or automatically when you sign in with Google.
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
            Lost your password? Call{' '}
            <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="link-underline">
              {SITE.phoneDisplay}
            </a>{' '}
            and we will reset it.
          </p>
        </div>
      </div>
    </Layout>
  );
}