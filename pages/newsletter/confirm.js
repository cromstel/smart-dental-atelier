import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Seo from '@/components/Seo';
import Alert from '@/components/ui/Alert';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { isValidNewsletterToken } from '@/lib/newsletter';

/**
 * Confirmation landing page. The e-mail links here rather than straight to
 * the API: a GET to the API could be prefetched by a mail scanner and confirm
 * without the recipient's action. Nothing is activated until the visitor
 * presses the button, which POSTs to /api/newsletter/confirm.
 */
export default function ConfirmNewsletter({ token }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const valid = isValidNewsletterToken(token);

  async function confirm() {
    setStatus('busy');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'We could not confirm your subscription. Please try again.');
      }

      setStatus('success');
      setMessage(data.message || 'Thank you — your subscription is confirmed.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'We could not confirm your subscription. Please try again.');
    }
  }

  return (
    <Layout>
      <Seo
        title="Confirm your newsletter subscription"
        description="Confirm your e-mail address to finish subscribing to the Dental Atelier newsletter."
        pathname="/newsletter/confirm"
        noIndex
      />

      <div className="container-page py-20">
        <div className="mx-auto max-w-xl">
          <h1 className="font-display text-3xl text-brand-300">Confirm your subscription</h1>
          <p className="mt-4 text-silver-300">
            Please press the button below to finish subscribing. Your address is not active until
            you do.
          </p>

          <div className="mt-6" aria-live="polite">
            {status === 'success' ? <Alert tone="success">{message}</Alert> : null}
            {status === 'error' ? <Alert tone="error">{message}</Alert> : null}
          </div>

          {!valid ? (
            <Alert tone="error" className="mt-6">
              This confirmation link is not valid. Use the link from the e-mail we sent you.
            </Alert>
          ) : status === 'success' ? null : (
            <PrimaryButton
              type="button"
              onClick={confirm}
              loading={status === 'busy'}
              disabled={status === 'busy'}
              className="mt-6"
            >
              Confirm subscription
            </PrimaryButton>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ query }) {
  return {
    props: { token: typeof query.token === 'string' ? query.token : '' },
  };
}
