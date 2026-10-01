import { defineConfig, devices } from '@playwright/test';
import nextConfig from './next.config.js';

/**
 * Playwright end-to-end configuration.
 *
 * Run against a production build (`npm run build && npm run start`) rather than
 * the dev server: the E2E suite is meant to catch the issues that only appear
 * after optimisation and static generation.
 *
 * The port comes from `next.config.js`, which is the same value the `dev` and
 * `start` scripts use, so the three cannot drift apart.
 *
 * The suite needs a reachable database for the admin and portal flows; set
 * `DATABASE_URL` in `.env`. The tests create and clean up their own records.
 */
const PORT = nextConfig.PORT || 3031;
const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Fail fast rather than retrying: a flake here is usually a real problem.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
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