import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import FormInput from '@/components/ui/FormInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Alert from '@/components/ui/Alert';
import { SITE } from '@/lib/content';
import { AUTH_ROUTES, safeCallbackUrl, withCallback } from '@/lib/authRoutes';

/**
 * The credentials form, shared by `/auth/login` (clients) and
 * `/auth/admin/login` (staff).
 *
 * Both portals live behind the same NextAuth provider, so the page is what
 * tells the two apart: the admin variant only ever hands a session to an
 * administrator, and the client variant hands a staff session straight to the
 * admin sign-in page instead of completing the sign-in here. That keeps every
 * administrator authentication on `/auth/admin/*` without duplicating the
 * form, the validation, or the error copy.
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

/** Copy and defaults that differ between the two portals. */
const VARIANTS = {
  client: {
    heading: 'Sign in',
    intro: 'Client accounts see their appointments and inquiries. Staff accounts sign in through the admin portal.',
    defaultCallback: '/portal',
  },
  admin: {
    heading: 'Admin sign in',
    intro: 'Staff accounts only. Clients sign in through the client portal.',
    defaultCallback: '/admin',
  },
};

/**
 * @param {{ variant?: 'client' | 'admin', children?: import('react').ReactNode }} props
 *   `variant` decides where a successful sign-in may go; `children` is rendered
 *   under the sign-in panel for page-specific notes.
 */
export default function CredentialsSignIn({ variant = 'client', children }) {
  const config = VARIANTS[variant] || VARIANTS.client;
  const router = useRouter();

  // Raw, as supplied by the caller: the client variant needs to know whether a
  // target was given at all, so it can pass it on to `/auth/admin/login`.
  const rawCallback = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : null;
  const callbackUrl = safeCallbackUrl(rawCallback, config.defaultCallback);

  const [values, setValues] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  /**
   * The error coming from the URL is derived state, so it is computed during
   * render rather than stored and synced by an effect. NextAuth redirects back
   * to `?error=...`, and deriving it means there is no intermediate render with
   * a stale message — and no setState-in-effect.
   */
  const urlError = router.query.error ? String(router.query.error) : null;
  const error =
    urlError === 'inactive'
      ? 'This account has been deactivated. Please contact the studio.'
      : urlError
        ? ERROR_COPY[urlError] || ERROR_COPY.Default
        : '';

  // Submit-time failures are local state and must not be overwritten by the
  // derived value above, so they are kept separately.
  const [submitError, setSubmitError] = useState('');
  const displayedError = submitError || error;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    if (!values.email || !values.password) {
      setSubmitError('Please enter your e-mail address and password.');
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
      setSubmitError(ERROR_COPY[result.error] || ERROR_COPY.Default);
      return;
    }

    // Which portal the account belongs to comes from the freshly created
    // session: `result.url` is only the callbackUrl we just sent, so it cannot
    // express "admins go to /admin, clients go to /portal".
    const session = await getSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    if (variant === 'admin') {
      if (!isAdmin) {
        setSubmitError('That is not a staff account. Clients sign in through the client portal.');
        return;
      }

      // A full navigation, not `router.push`: the destination is guarded in
      // `getServerSideProps` and the session cookie is only visible to the
      // server on a fresh document load.
      window.location.assign(callbackUrl);
      return;
    }

    if (isAdmin) {
      // Staff must authenticate under `/auth/admin/*`. The session already
      // exists, so the admin sign-in page forwards it to the portal rather
      // than asking for the password again. `/portal` is this page's own
      // default rather than a real target, so it is not carried over — an
      // administrator who signed in without a target belongs in `/admin`.
      const forward = rawCallback && rawCallback !== config.defaultCallback ? rawCallback : null;
      window.location.assign(withCallback(AUTH_ROUTES.admin, forward));
      return;
    }

    window.location.assign(callbackUrl);
  };

  return (
    <>
      <div className="panel-gold">
        <h1 className="text-3xl">{config.heading}</h1>
        <p className="mt-3 text-sm text-silver-400">{config.intro}</p>

        <form method="post" onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          {displayedError ? (
            <Alert tone="error" title="Sign-in failed" onDismiss={() => setSubmitError('')}>
              {displayedError}
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

      {children}

      <p className="mt-6 text-center text-xs text-silver-600">
        Lost your password? Call{' '}
        <a href={`tel:${SITE.phone.replace(/[^\d+]/g, '')}`} className="link-underline">
          {SITE.phoneDisplay}
        </a>{' '}
        and we will reset it.
      </p>
    </>
  );
}
