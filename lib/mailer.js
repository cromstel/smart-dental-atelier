/**
 * Outbound notifications for new inquiries and appointments.
 *
 * Deliberately dependency-free: with no SMTP_* variables configured the mailer
 * logs the notification instead of sending it, so local development and CI do
 * not need a mail server. In production set SMTP_HOST/USER/PASSWORD and the
 * same code path delivers real mail over SMTP.
 */

import { SITE } from './content';

const TRANSPORTS = [];

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

async function deliver({ to, subject, text, html }) {
  const toAddress = to || process.env.NOTIFY_EMAIL || SITE.email;

  if (!isConfigured()) {
    console.info(
      `[mail:preview] to=${toAddress} subject="${subject}"\n${text.split('\n').map((l) => `  ${l}`).join('\n')}`,
    );
    return { sent: false, reason: 'smtp-not-configured' };
  }

  try {
    const net = await import('node:net');
    const tls = await import('node:tls');

    const payload = [
      `From: ${process.env.SMTP_USER}`,
      `To: ${toAddress}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\r\n');

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const socket = tls.connect({ host, port, servername: host }, () => {
      socket.write(
        [
          `EHLO ${host}`,
          'AUTH PLAIN ' +
            Buffer.from(`\0${process.env.SMTP_USER}\0${process.env.SMTP_PASSWORD}`).toString('base64'),
          `MAIL FROM:<${process.env.SMTP_USER}>`,
          `RCPT TO:<${toAddress}>`,
          'DATA',
        ].join('\r\n') + '\r\n',
      );
      socket.write(payload + '\r\n.\r\n');
      socket.write('QUIT\r\n');
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('SMTP timeout')), 15000);
      socket.on('data', () => {});
      socket.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      socket.on('close', () => {
        clearTimeout(timer);
        resolve();
      });
    });

    return { sent: true };
  } catch (error) {
    console.error('[mail] send failed:', error.message);
    return { sent: false, reason: error.message };
  }
}

const escape = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function template({ heading, rows, cta }) {
  const body = rows
    .filter(Boolean)
    .map(([label, value]) => `<tr><td style="padding:6px 12px;color:#888;white-space:nowrap">${escape(label)}</td><td style="padding:6px 0">${escape(value)}</td></tr>`)
    .join('');

  return `<div style="font-family:Helvetica,Arial,sans-serif;background:#020202;color:#C9CBCB;padding:24px;border-radius:8px">
  <h1 style="color:#D7AE15;font-family:Georgia,serif;margin:0 0 16px">${escape(heading)}</h1>
  <table style="font-size:14px;border-collapse:collapse">${body}</table>
  ${
    cta
      ? `<p style="margin-top:20px"><a href="${escape(cta.href)}" style="color:#D7AE15">${escape(cta.label)}</a></p>`
      : ''
  }
  <p style="margin-top:24px;color:#666;font-size:12px">${escape(SITE.name)} &middot; ${escape(SITE.mobileDisplay)}</p>
</div>`;
}

export function notifyAppointment(appointment) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;
  return deliver({
    subject: `New appointment request — ${appointment.firstName} ${appointment.lastName}`,
    text: [
      `New appointment request from ${appointment.firstName} ${appointment.lastName}`,
      appointment.email,
      appointment.phone || 'no phone',
      appointment.preferredDate ? `Preferred date: ${appointment.preferredDate}` : 'No preferred date',
      `Type: ${appointment.type}`,
      appointment.notes ? `Notes: ${appointment.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    html: template({
      heading: 'New appointment request',
      rows: [
        ['Name', `${appointment.firstName} ${appointment.lastName}`],
        ['E-mail', appointment.email],
        ['Phone', appointment.phone],
        ['Preferred date', appointment.preferredDate],
        ['Type', appointment.type],
        ['Notes', appointment.notes],
      ],
      cta: { href: `${siteUrl}/admin/appointments`, label: 'Open the admin portal' },
    }),
  });
}

export function notifyMessage(message) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE.url;
  return deliver({
    subject: `New ${String(message.source).toLowerCase().replace(/_/g, ' ')} inquiry — ${message.firstName} ${message.lastName}`,
    text: [
      `New inquiry (${message.source}) from ${message.firstName} ${message.lastName}`,
      message.email,
      message.phone || 'no phone',
      '',
      message.message,
      message.smileCheckAnswers ? `Smile check answers: ${message.smileCheckAnswers}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    html: template({
      heading: 'New website inquiry',
      rows: [
        ['Type', message.source],
        ['Name', `${message.firstName} ${message.lastName}`],
        ['E-mail', message.email],
        ['Phone', message.phone],
        ['Message', message.message],
        ['Smile check', message.smileCheckAnswers],
        ['Page', message.referrer],
      ],
      cta: { href: `${siteUrl}/admin/messages`, label: 'Open the admin portal' },
    }),
  });
}

export { TRANSPORTS, escape };