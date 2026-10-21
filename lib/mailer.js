import { SITE } from './content';

const TRANSPORTS = [];

/**
 * SMTP settings, entirely from the environment.
 *
 * `SMTP_PROVIDER` selects the defaults for the well-known providers; anything
 * it does not know about must supply `SMTP_HOST` (and usually `SMTP_PORT`)
 * explicitly. Nothing about the mail setup is hardcoded here, so the same
 * build can talk to Gmail, a transactional provider or a local relay.
 */
const SMTP_PROVIDERS = {
  gmail: { port: '587' },
  smtp: { port: '587' },
  sendgrid: { port: '587' },
  mailgun: { port: '587' },
  local: { port: '1025' },
};

function smtpSettings() {
  const provider = (process.env.SMTP_PROVIDER || '').toLowerCase();
  const defaults = SMTP_PROVIDERS[provider] || {};

  return {
    host: process.env.SMTP_HOST || '',
    port: String(process.env.SMTP_PORT || defaults.port || ''),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    // Port 465 is implicit TLS (SMTPS); 587 is the submission port and
    // negotiates TLS with STARTTLS. `SMTP_SECURE=true` forces implicit TLS.
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    // `SMTP_STARTTLS=false` keeps the conversation in plaintext. Only for a
    // trusted local relay (a dev mailbox on 127.0.0.1); never for a public
    // server, because the credentials would cross the wire in the clear.
    starttls: String(process.env.SMTP_STARTTLS || '').toLowerCase() !== 'false',
  };
}

function isConfigured() {
  const { host, user, password } = smtpSettings();
  return Boolean(host && user && password);
}

/**
 * Runs one SMTP conversation.
 *
 * SMTP is a request/response protocol: every command waits for the server's
 * reply before the next one is sent. The message body in particular may only
 * be written after the server has answered `354` to `DATA` — writing it
 * earlier puts the body into the server's error text and the message never
 * arrives.
 *
 * The transport is chosen by the port:
 *  - 465 (or `SMTP_SECURE=true`): implicit TLS, the handshake starts at once.
 *  - everything else (587): plaintext, then `STARTTLS` upgrades the socket.
 *    Handshaking immediately on 587 fails, because that port greets in
 *    plaintext and expects the client to ask for TLS.
 *
 * @param {object} settings
 * @param {{from: string, to: string, payload: string}} message
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
async function runSmtpConversation(settings, { from, to, payload }) {
  const net = await import('node:net');
  const tls = await import('node:tls');

  const { host, port, user, password } = settings;
  const implicitTls = settings.secure || port === '465';
  // STARTTLS is the default; a plaintext relay opts out explicitly.
  const useStartTls = settings.starttls && !implicitTls;
  const authLine =
    'AUTH PLAIN ' + Buffer.from(`\0${user}\0${password}`).toString('base64');

  // Dot-stuffing: a line consisting of a single dot would end the message.
  const body = payload.replace(/^\./gm, '..');

  return new Promise((resolve, reject) => {
    let socket;
    let buffer = '';
    let stage = 'greeting';
    let settled = false;

    const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 20000);
    const timer = setTimeout(() => {
      fail(new Error('SMTP timeout'));
    }, timeoutMs);

    const write = (line) => {
      if (socket && !socket.destroyed) socket.write(`${line}\r\n`);
    };

    const ok = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ sent: true });
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (socket && !socket.destroyed) socket.destroy();
      reject(error);
    };

    const onData = (chunk) => {
      buffer += chunk.toString();

      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Continuation lines of a multi-line reply use `250-`; only the final
        // line of a reply has a space in the fourth position.
        if (!/^\d{3} /.test(line)) continue;

        const code = line.slice(0, 3);
        const reply = line.slice(4);

        switch (stage) {
          case 'greeting':
            if (code === '220') {
              stage = 'ehlo';
              write(`EHLO ${host}`);
            } else {
              fail(new Error(`SMTP greeting rejected: ${reply}`));
            }
            break;

          case 'ehlo':
            if (code !== '250') {
              fail(new Error(`SMTP EHLO rejected: ${reply}`));
              break;
            }
            if (implicitTls || !useStartTls) {
              stage = 'auth';
              write(authLine);
            } else {
              stage = 'starttls';
              write('STARTTLS');
            }
            break;

          case 'starttls':
            if (code !== '220') {
              fail(new Error(`SMTP STARTTLS rejected: ${reply}`));
              break;
            }
            // Upgrade the open socket: the handshake happens over the same
            // TCP connection, and the session continues from there.
            stage = 'ehlo-secure';
            socket = tls.connect(
              { socket, servername: host },
              () => write(`EHLO ${host}`),
            );
            socket.on('data', onData);
            socket.on('error', fail);
            socket.on('close', () => {
              if (!settled) fail(new Error('SMTP connection closed unexpectedly'));
            });
            break;

          case 'ehlo-secure':
            if (code !== '250') {
              fail(new Error(`SMTP EHLO after STARTTLS rejected: ${reply}`));
              break;
            }
            stage = 'auth';
            write(authLine);
            break;

          case 'auth':
            if (code !== '235') {
              fail(new Error(`SMTP authentication failed: ${reply}`));
              break;
            }
            stage = 'mail-from';
            write(`MAIL FROM:<${from}>`);
            break;

          case 'mail-from':
            if (code !== '250') {
              fail(new Error(`SMTP MAIL FROM rejected: ${reply}`));
              break;
            }
            stage = 'rcpt-to';
            write(`RCPT TO:<${to}>`);
            break;

          case 'rcpt-to':
            if (code !== '250' && code !== '251') {
              fail(new Error(`SMTP recipient rejected: ${reply}`));
              break;
            }
            stage = 'data';
            write('DATA');
            break;

          case 'data':
            if (code !== '354') {
              fail(new Error(`SMTP DATA rejected: ${reply}`));
              break;
            }
            // Only now may the body be written.
            stage = 'body';
            if (socket && !socket.destroyed) socket.write(`${body}\r\n.\r\n`);
            break;

          case 'body':
            if (code !== '250') {
              fail(new Error(`SMTP message rejected: ${reply}`));
              break;
            }
            stage = 'quit';
            write('QUIT');
            break;

          case 'quit':
            // 221 is the normal goodbye; anything else still means the
            // message was accepted, so the send succeeded.
            ok();
            break;

          default:
            break;
        }
      }
    };

    const onError = (error) => fail(error);

    socket = implicitTls
      ? tls.connect({ host, port: Number(port), servername: host })
      : net.connect({ host, port: Number(port) });

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', () => {
      if (!settled) fail(new Error('SMTP connection closed unexpectedly'));
    });
  });
}

async function deliver({ to, subject, text, html }) {
  const toAddress = to || process.env.NOTIFY_EMAIL || SITE.email;

  if (!isConfigured()) {
    console.info(
      `[mail:preview] to=${toAddress} subject="${subject}"\n${text.split('\n').map((l) => `  ${l}`).join('\n')}`,
    );
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const settings = smtpSettings();
  const fromAddress = process.env.SMTP_FROM || settings.user;

  const payload = [
    `From: ${fromAddress}`,
    `To: ${toAddress}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n');

  try {
    await runSmtpConversation(settings, { from: fromAddress, to: toAddress, payload });
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
  const siteUrl = SITE.url;
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
  const siteUrl = SITE.url;
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
