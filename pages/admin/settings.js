import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminShell from '@/components/admin/AdminShell';
import PrimaryButton from '@/components/ui/PrimaryButton';
import FormInput from '@/components/ui/FormInput';
import FormTextArea from '@/components/ui/FormTextArea';
import Alert from '@/components/ui/Alert';
import { requireAdminPage } from '@/lib/guards';
import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import { SETTINGS } from '@/lib/content';

const GROUPS = [
  { id: 'general', title: 'General', blurb: 'Site name, tagline and the description used as the default meta description.' },
  { id: 'contact', title: 'Contact', blurb: 'Shown in the footer, on /contact-us and in every e-mail notification.' },
  { id: 'social', title: 'Social', blurb: 'External profiles linked from the header and footer.' },
  { id: 'booking', title: 'Booking', blurb: 'Opening hours and notice periods used by the appointment flow.' },
];

const FIELD_OVERRIDES = {
  'contact.address': { type: 'textarea', rows: 4, hint: 'One line per row.' },
  'site.description': { type: 'textarea', rows: 3 },
  'booking.cancellationNotice': { type: 'number' },
  'booking.leadTimeHours': { type: 'number' },
};

/**
 * Site settings.
 *
 * Writes go to `/api/admin/settings`, which only accepts keys that already
 * exist in the `SETTINGS` registry in `lib/content.js` — an admin cannot
 * invent new config keys through the API.
 */
export default function AdminSettingsPage({ settings = [] }) {
  const router = useRouter();
  const [values, setValues] = useState(() =>
    Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  );
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const dirty = SETTINGS.filter((setting) => (values[setting.key] ?? '') !== (setting.value ?? ''));

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus('idle');
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: SETTINGS.map((setting) => ({
            key: setting.key,
            value: values[setting.key] ?? '',
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'We could not save the settings.');
        return;
      }

      setStatus('success');
      setMessage('Settings saved.');
      router.replace(router.asPath, undefined, { scroll: false });
    } catch {
      setStatus('error');
      setMessage('We could not reach the server. Please try again.');
    }
  };

  return (
    <AdminShell
      title="Settings"
      description="Site-wide values used across the marketing site, the portals and the notification e-mails."
      actions={
        <PrimaryButton type="submit" form="settings-form" loading={status === 'submitting'} disabled={dirty.length === 0}>
          {dirty.length === 0 ? 'No changes' : `Save ${dirty.length} change${dirty.length === 1 ? '' : 's'}`}
        </PrimaryButton>
      }
    >
      <form method="post" id="settings-form" onSubmit={save}>
        <div aria-live="polite">
          {message ? (
            <Alert
              tone={status === 'error' ? 'error' : 'success'}
              className="mb-8"
              onDismiss={() => setMessage('')}
            >
              {message}
            </Alert>
          ) : null}
        </div>

        <div className="space-y-8">
          {GROUPS.map((group) => {
            const groupSettings = SETTINGS.filter((setting) => setting.group === group.id);
            if (groupSettings.length === 0) return null;

            return (
              <section key={group.id} className="panel">
                <h2 className="text-lg">{group.title}</h2>
                <p className="mt-2 text-sm text-silver-400">{group.blurb}</p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {groupSettings.map((setting) => {
                    const override = FIELD_OVERRIDES[setting.key] || {};
                    const value = values[setting.key] ?? '';
                    const changed = value !== (setting.value ?? '');

                    const common = {
                      key: setting.key,
                      label: setting.key,
                      name: setting.key,
                      required: true,
                      hint: override.hint,
                      value,
                      onChange: (event) => setValue(setting.key, event.target.value),
                    };

                    return (
                      <div key={setting.key} className={override.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <div className="mb-1 flex items-center gap-2">
                          {changed ? (
                            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-2xs uppercase tracking-caps text-warning">
                              edited
                            </span>
                          ) : null}
                        </div>

                        {override.type === 'textarea' ? (
                          <FormTextArea {...common} rows={override.rows || 4} />
                        ) : (
                          <FormInput {...common} type={override.type || 'text'} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <PrimaryButton
            variant="ghost"
            onClick={() => setValues(Object.fromEntries(SETTINGS.map((s) => [s.key, s.value])))}
            disabled={dirty.length === 0}
          >
            Discard changes
          </PrimaryButton>
          <PrimaryButton type="submit" loading={status === 'submitting'} disabled={dirty.length === 0}>
            Save settings
          </PrimaryButton>
        </div>
      </form>
    </AdminShell>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireAdminPage(ctx);
  if (guard.redirect) return guard;

  if (!isDatabaseConfigured) {
    return { props: { ...guard.props, settings: SETTINGS } };
  }

  const rows = await prisma.setting.findMany();
  const byKey = new Map(rows.map((row) => [row.key, row]));

  const settings = SETTINGS.map((setting) => byKey.get(setting.key) ?? setting);

  return { props: { ...guard.props, settings } };
}