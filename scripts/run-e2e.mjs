#!/usr/bin/env node
/**
 * Runs the end-to-end suite against the local server.
 *
 * Playwright does not load the env files, and the suite needs the account
 * that the *local* database actually holds — which is the one in `.env.local`,
 * not the production one in `.env`. Exporting the wrong pair fails every
 * portal test with a sign-in timeout that looks like an application bug.
 *
 * So the values are read from `.env.local` (falling back to `.env`), and the
 * real environment still wins, which is what CI relies on.
 *
 *   npm run test:e2e
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Reads a key from an env file. Later files win. */
function readEnvFile(file, key) {
  try {
    const line = fs
      .readFileSync(path.join(projectRoot, file), 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (!line) return null;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return null;
  }
}

const KEYS = [
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'NOTIFY_EMAIL',
  'PORT',
  'HOST',
  'APP_NAME',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_SITE_URL',
];

const env = { ...process.env };
for (const key of KEYS) {
  const value = process.env[key] || readEnvFile('.env.local', key) || readEnvFile('.env', key);
  if (value) env[key] = value;
}

// The suite browses the local server, so the origin follows the port.
const port = env.PORT || '4040';
env.NEXTAUTH_URL = `http://127.0.0.1:${port}`;
env.E2E_BASE_URL = env.NEXTAUTH_URL;

if (!env.ADMIN_PASSWORD) {
  console.warn(
    '[test:e2e] ADMIN_PASSWORD is not set in .env.local or .env —\n' +
      '           the portal tests will be skipped.',
  );
}

const cli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
const child = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
