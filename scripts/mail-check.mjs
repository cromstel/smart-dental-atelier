#!/usr/bin/env node
/**
 * Diagnoses the SMTP path, stage by stage.
 *
 * "The mail is not arriving" has four very different causes, and the error
 * message alone rarely says which one it is:
 *
 *   1. the host is unreachable  (firewall / egress policy / DNS)
 *   2. the port is wrong         (587 = STARTTLS, 465 = implicit TLS)
 *   3. the credentials are wrong (Gmail wants an *app* password)
 *   4. the sender is not allowed (Gmail only sends as the account or an alias)
 *
 * This script walks the real conversation and reports the last stage that
 * succeeded, so the failure is unambiguous. It sends nothing: it stops after
 * the recipient is accepted.
 *
 *   npm run mail:check
 */
import fs from 'node:fs';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns/promises';

const projectRoot = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function readEnvFile(file, key) {
  try {
    const line = fs
      .readFileSync(`${projectRoot}${file}`, 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

function setting(key) {
  return process.env[key] || readEnvFile('.env.local', key) || readEnvFile('.env', key);
}

const host = setting('SMTP_HOST') || '';
const port = String(setting('SMTP_PORT') || '');
const user = setting('SMTP_USER') || '';
const password = setting('SMTP_PASSWORD') || '';
const from = setting('SMTP_FROM') || user;
const to = setting('NOTIFY_EMAIL') || '';

const ok = (message) => console.log(`  \x1b[32mOK\x1b[0m    ${message}`);
const info = (message) => console.log(`  \x1b[36m--\x1b[0m    ${message}`);
const bad = (message) => console.log(`  \x1b[31mFAIL\x1b[0m  ${message}`);

console.log('\nSMTP check');
console.log(`  host=${host || '(unset)'} port=${port || '(unset)'}`);
console.log(`  user=${user || '(unset)'} password=${password ? `<set, ${password.length} chars>` : '(unset)'}`);
console.log(`  from=${from || '(unset)'} to=${to || '(unset)'}\n`);

if (!host || !port) {
  bad('SMTP_HOST and SMTP_PORT must be set (see .env.example).');
  process.exit(1);
}
if (!user || !password) {
  bad('SMTP_USER and SMTP_PASSWORD must be set.');
  process.exit(1);
}

// --- 1. DNS -------------------------------------------------------------
let addresses = [];
try {
  const resolved = await dns.lookup(host, { all: true });
  addresses = resolved.map((entry) => entry.address);
  ok(`DNS resolved: ${addresses.join(', ')}`);
} catch (error) {
  bad(`DNS lookup failed: ${error.code || error.message}`);
  process.exit(1);
}

// --- 2. TCP -------------------------------------------------------------
const result = await new Promise((resolve) => {
  const implicitTls = port === '465' || String(setting('SMTP_SECURE') || '').toLowerCase() === 'true';
  const useStartTls = String(setting('SMTP_STARTTLS') || '').toLowerCase() !== 'false' && !implicitTls;

  const state = { stage: 'connect', buffer: '', done: false, greeting: null, capabilities: '' };

  const finish = (outcome) => {
    if (state.done) return;
    state.done = true;
    clearTimeout(timer);
    socket.destroy();
    resolve({ ...outcome, stage: state.stage, capabilities: state.capabilities });
  };

  const timer = setTimeout(() => finish({ ok: false, reason: 'timed out' }), 15000);

  const write = (line) => {
    if (socket && !socket.destroyed) socket.write(`${line}\r\n`);
  };

  const onData = (chunk) => {
    state.buffer += chunk.toString();
    const lines = state.buffer.split('\r\n');
    state.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!/^\d{3} /.test(line)) {
        if (state.stage === 'connect') state.capabilities += `${line}\n`;
        continue;
      }
      const code = line.slice(0, 3);
      const reply = line.slice(4);

      if (state.stage === 'connect') {
        if (code === '220') {
          state.stage = 'ehlo';
          write(`EHLO ${host}`);
        } else {
          finish({ ok: false, reason: `greeting rejected: ${reply}` });
          return;
        }
      } else if (state.stage === 'ehlo') {
        if (code !== '250') {
          finish({ ok: false, reason: `EHLO rejected: ${reply}` });
          return;
        }
        if (implicitTls || !useStartTls) {
          state.stage = 'auth';
          write('AUTH PLAIN ' + Buffer.from(`\0${user}\0${password}`).toString('base64'));
        } else {
          state.stage = 'starttls';
          write('STARTTLS');
        }
      } else if (state.stage === 'starttls') {
        if (code !== '220') {
          finish({ ok: false, reason: `STARTTLS rejected: ${reply}` });
          return;
        }
        state.stage = 'ehlo-secure';
        socket = tls.connect({ socket, servername: host }, () => write(`EHLO ${host}`));
        socket.on('data', onData);
        socket.on('error', (error) => finish({ ok: false, reason: error.message }));
      } else if (state.stage === 'ehlo-secure') {
        if (code !== '250') {
          finish({ ok: false, reason: `EHLO after STARTTLS rejected: ${reply}` });
          return;
        }
        state.stage = 'auth';
        write('AUTH PLAIN ' + Buffer.from(`\0${user}\0${password}`).toString('base64'));
      } else if (state.stage === 'auth') {
        if (code !== '235') {
          finish({
            ok: false,
            reason: `authentication failed: ${reply} — for Gmail this is usually the account password instead of an app password`,
          });
          return;
        }
        state.stage = 'mail-from';
        write(`MAIL FROM:<${from}>`);
      } else if (state.stage === 'mail-from') {
        if (code !== '250') {
          finish({ ok: false, reason: `MAIL FROM rejected: ${reply} — the sender may not be allowed` });
          return;
        }
        state.stage = 'rcpt-to';
        write(`RCPT TO:<${to}>`);
      } else if (state.stage === 'rcpt-to') {
        if (code !== '250' && code !== '251') {
          finish({ ok: false, reason: `recipient rejected: ${reply}` });
          return;
        }
        finish({ ok: true, reason: 'the envelope was accepted' });
        return;
      }
    }
  };

  let socket = implicitTls
    ? tls.connect({ host, port: Number(port), servername: host })
    : net.connect({ host, port: Number(port) });

  socket.on('data', onData);
  socket.on('error', (error) => finish({ ok: false, reason: `${error.code || ''} ${error.message}`.trim() }));
  socket.on('close', () => finish({ ok: false, reason: 'the connection closed' }));
});

if (result.ok) {
  ok(`SMTP conversation complete (stage: ${result.stage}) — ${result.reason}`);
  console.log('        Notifications will be delivered. No message was sent by this check.');
  process.exit(0);
}

// --- 3. Diagnose the failure ---------------------------------------------
const reason = result.reason || 'unknown failure';
console.log('');
if (/timed out|timeout|ENETUNREACH|EHOSTUNREACH|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN/.test(reason)) {
  bad(`${reason}`);
  console.log('');
  console.log('        The host resolved but the connection never completed. Either the');
  console.log('        port is blocked by a firewall, or the egress policy of this network');
  console.log('        does not allow it. Check with:');
  console.log(`          Test-NetConnection ${host} -Port ${port}`);
  console.log('        Port 587 is the submission port (STARTTLS), 465 is implicit TLS.');
  console.log('        If both are blocked, no code change will help — the network has to');
  console.log('        allow the port, or a local relay has to forward the mail.');
} else if (/authentication failed/.test(reason)) {
  bad(reason);
} else if (/MAIL FROM rejected/.test(reason)) {
  bad(reason);
  console.log('');
  console.log('        Gmail only sends as the authenticated account or an alias of it.');
  console.log(`        Set SMTP_FROM to ${user} (or add it as an alias in the account).`);
} else {
  bad(reason);
}
console.log('');
process.exit(1);
