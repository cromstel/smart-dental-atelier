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
import nextConfig from '../next.config.js';

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

// The suite browses the local server, so the origin follows the port the
// launcher binds to: the environment first, then the env files, then the
// port the Next config resolved - the same chain scripts/run-next.mjs uses.
// Next.js' own default (3000) is the last resort, so no port number is
// written into this file.
const configuredPort = nextConfig[Symbol.for('dental-atelier.port')];
const port = env.PORT || configuredPort || 3000;
env.NEXTAUTH_URL = `http://127.0.0.1:${port}`;
env.E2E_BASE_URL = env.NEXTAUTH_URL;

/**
 * The suite is local-only: the sources are not in the repository (see
 * .gitignore), so a fresh clone has nothing to run. Say that plainly instead
 * of letting Playwright fail with "no tests found".
 *
 * The search is recursive: Playwright discovers specs in nested directories
 * too, so a suite that only has `tests/e2e/admin/portal.spec.js` has to be
 * found as well.
 */
function hasSpecs(directory) {
  if (!fs.existsSync(directory)) return false;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (hasSpecs(path.join(directory, entry.name))) return true;
      continue;
    }
    if (entry.name.endsWith('.spec.js') || entry.name.endsWith('.spec.ts')) return true;
  }
  return false;
}

const e2eDir = path.join(projectRoot, 'tests', 'e2e');

if (!hasSpecs(e2eDir)) {
  console.log('[test:e2e] no local end-to-end suite (tests/e2e is empty or absent).');
  console.log('[test:e2e] the suite is not part of the repository; nothing to run.');
  process.exit(0);
}

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
