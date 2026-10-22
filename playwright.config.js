import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
import nextConfig from './next.config.js';

/**
 * Playwright end-to-end configuration.
 *
 * Run against a production build (`npm run build && npm run start`) rather than
 * the dev server: the E2E suite is meant to catch the issues that only appear
 * after optimisation and static generation.
 *
 * The port comes from `PORT` in the environment (or `.env`), the same value the
 * server binds to, so the two cannot drift apart.
 *
 * The suite needs a reachable database for the admin and portal flows; set
 * `DATABASE_URL` in `.env`. The tests create and clean up their own records.
 */
/**
 * The port under test.
 *
 * `PORT` comes from the environment, then `.env.local`, then `.env`; the
 * fallback is Next.js' own default, so the number is never duplicated in the
 * repository.
 */
const PORT =
  Number(process.env.PORT || readEnvFile('PORT') || nextConfig[Symbol.for('dental-atelier.port')]) ||
  3000;

/**
 * NextAuth sets its CSRF cookie for `NEXTAUTH_URL`'s host. If the suite browses
 * a different origin, sign-in fails with a CSRF mismatch and the login tests
 * bounce back to `/auth/login`. The origin comes from `NEXTAUTH_URL`, with
 * the env files read here because Playwright does not load them for us.
 *
 * The environment wins over the file, matching how dotenv and Next themselves
 * resolve it — an exported `NEXTAUTH_URL` has to be able to override the file,
 * which is what CI relies on.
 */
function nextAuthOrigin() {
  return process.env.NEXTAUTH_URL || readEnvFile('NEXTAUTH_URL') || null;
}

/**
 * Minimal environment-file reader — the keys this config needs.
 *
 * `.env.local` is read before `.env`, the same order the launcher
 * (`scripts/run-next.mjs`) uses, so the suite and the server can never end
 * up on different ports.
 */
function readEnvFile(key) {
  for (const file of ['.env.local', '.env']) {
    try {
      const line = fs
        .readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .find((entry) => entry.trim().startsWith(`${key}=`));
      if (line) {
        return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      // No such file: try the next one.
    }
  }
  return null;
}

const origin = nextAuthOrigin();
const BASE_URL = process.env.E2E_BASE_URL || origin || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  // Generous on purpose. Several assertions wait on a server round-trip rather
  // than a DOM change — signing in verifies a bcrypt hash, which is deliberately
  // CPU-expensive, and the suite runs two browsers plus the Next server against
  // one database. On a slow or loaded machine the old 10 s default produced
  // timeouts that had nothing to do with the code under test. Waiting longer
  // cannot mask a wrong result; it only stops slow-but-correct being read as
  // broken.
  expect: { timeout: 30_000 },
  // Fail fast rather than retrying: a flake here is usually a real problem.
  retries: process.env.CI ? 1 : 0,
  // Pinned rather than left to "half the cores". Every portal test signs in,
  // and each sign-in is a bcrypt verification against one database; letting the
  // worker count float with the host made the suite's runtime swing by an order
  // of magnitude and turned a loaded machine into spurious timeouts.
  workers: process.env.CI ? 1 : 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    // `npm start` already binds PORT via the package script.
    command: 'npm run start',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { NODE_ENV: 'production' },
  },
});