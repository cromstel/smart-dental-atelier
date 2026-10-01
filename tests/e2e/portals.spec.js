import { test, expect } from '@playwright/test';

/**
 * Authentication and the two portals.
 *
 * The admin account is created by the seed from ADMIN_EMAIL / ADMIN_PASSWORD in
 * `.env`. These specs run against a real database — they are the ones that
 * would catch a broken guard or a broken session cookie.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'michal@dentalatelier.co';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Waits until the Pages Router has hydrated.
 *
 * `onSubmit` only stops the browser's native submit once React has taken over.
 * Filling and clicking a form before that submits it natively, which just
 * reloads the page and looks exactly like a rejected submission.
 */
async function waitForHydration(page) {
  // `window.next.router` only exists once the client bundle has run.
  await page.waitForFunction(() => Boolean(window.next?.router));
}

/**
 * Signs in through the real form.
 *
 * Signing in is not a fast DOM change: it verifies a bcrypt hash and writes
 * `lastLoginAt` twice (once in `authorize`, once in the `signIn` event) before
 * the full-page navigation lands. On a loaded machine that regularly exceeds the
 * suite's 10 s default, so the navigation gets its own, longer budget.
 */
async function signIn(page) {
  await page.goto('/auth/login');
  await waitForHydration(page);

  await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin|\/portal/, { timeout: SIGN_IN_TIMEOUT });
}

const SIGN_IN_TIMEOUT = 30_000;

test.describe('authentication', () => {
  test.skip(!ADMIN_PASSWORD, 'ADMIN_PASSWORD is not set in the environment');

  test('redirects an anonymous visitor from the admin portal to sign in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
  });

  test('redirects an anonymous visitor from the client portal to sign in', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
  });

  test('sends the legacy /login URL to /auth/login, keeping callbackUrl', async ({ page }) => {
    // Bookmarks and inbound links still point at /login.
    await page.goto('/login?callbackUrl=/portal');
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fportal/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('signs in with credentials and lands on the admin dashboard', async ({ page }) => {
    await signIn(page);

    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Needs your attention')).toBeVisible();
  });

  test('reports invalid credentials without revealing whether the account exists', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForHydration(page);

    await page.getByLabel('E-mail').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/e-mail and password combination is not correct/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('validates the login form in the browser before calling the API', async ({ page }) => {
    await page.goto('/auth/login');
    await waitForHydration(page);

    let apiCalled = false;
    await page.route('**/api/auth/**', (route) => {
      apiCalled = true;
      return route.abort();
    });

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText(/enter your e-mail address and password/i)).toBeVisible();
    expect(apiCalled).toBe(false);
  });
});

test.describe('admin portal', () => {
  test.skip(!ADMIN_PASSWORD, 'ADMIN_PASSWORD is not set in the environment');

  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/admin/, { timeout: SIGN_IN_TIMEOUT });
  });

  const ADMIN_SECTIONS = [
    { path: '/admin/appointments', heading: 'Appointments' },
    { path: '/admin/messages', heading: 'Inquiries' },
    { path: '/admin/testimonials', heading: 'Testimonials' },
    { path: '/admin/faqs', heading: 'FAQs' },
    { path: '/admin/services', heading: 'Products & Services' },
    { path: '/admin/gallery', heading: 'Gallery' },
    { path: '/admin/content', heading: 'Page content' },
    { path: '/admin/users', heading: 'Users' },
    { path: '/admin/settings', heading: 'Settings' },
  ];

  for (const { path, heading } of ADMIN_SECTIONS) {
    test(`${path} renders for an administrator`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      // The portal must never be indexed.
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    });
  }

  test('creates, edits and deletes a FAQ', async ({ page }) => {
    await page.goto('/admin/faqs');

    const question = `Is this a Playwright question? ${Date.now()}`;

    // Create
    await page.getByRole('button', { name: 'Add faq' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Question').fill(question);
    await dialog.getByLabel('Answer').fill('A temporary answer created by the end-to-end suite.');
    await dialog.getByRole('button', { name: 'Create faq' }).click();

    await expect(page.getByRole('cell', { name: question })).toBeVisible();

    // Edit
    const row = page.getByRole('row').filter({ hasText: question });
    await row.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Answer').fill('An updated answer from the end-to-end suite.');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('An updated answer from the end-to-end suite.')).toBeVisible();

    // Delete (through the confirmation dialog, not window.confirm)
    await page.getByRole('row').filter({ hasText: question }).getByRole('button', { name: 'Delete' }).click();
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog.getByRole('heading', { name: /delete this faq/i })).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Delete permanently' }).click();

    await expect(page.getByRole('cell', { name: question })).toBeHidden();
  });

  test('creates a testimonial and can unpublish it', async ({ page }) => {
    await page.goto('/admin/testimonials');

    const author = `E2E ${Date.now()}`;

    await page.getByRole('button', { name: 'Add testimonial' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Author').fill(author);
    await dialog.getByLabel('Treatment').fill('Playover');
    await dialog.getByLabel('Quote').fill('A quote created by the end-to-end suite.');
    await dialog.getByRole('button', { name: 'Create testimonial' }).click();

    await expect(page.getByRole('cell', { name: author })).toBeVisible();

    // Unpublish via the edit dialog.
    const row = page.getByRole('row').filter({ hasText: author });
    await row.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel(/Show this testimonial/).uncheck();
    await editDialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(
      page.getByRole('row').filter({ hasText: author }).getByText('Draft'),
    ).toBeVisible();

    // Clean up.
    await page.getByRole('row').filter({ hasText: author }).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete permanently' }).click();
  });

  test('changes an appointment status', async ({ page }) => {
    await page.goto('/book-appointment');
    await waitForHydration(page);

    const marker = `E2E appointment ${Date.now()}`;
    // Unique per run, and the admin search covers the e-mail column (not notes).
    const email = `e2e-${Date.now()}@example.com`;

    await page.getByLabel('Firstname').fill('E2E');
    await page.getByLabel('Surname').fill('Booking');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Phone').fill('+32 478 54 74 75');
    await page.getByLabel('Preferred date').fill('2030-06-15');
    await page.getByLabel(/Anything we should know/).fill(marker);

    // The public API treats a submission made within two seconds of the form
    // appearing as a bot: it answers 200 with the success copy but stores
    // nothing (`isTooFast` in lib/api.js). Playwright can fill the whole form
    // that fast, so wait past the floor or the row never exists.
    await page.waitForTimeout(2_200);

    await page.getByRole('button', { name: /request appointment/i }).click();

    await expect(page.getByText(/Appointment requested/)).toBeVisible();

    await page.goto(`/admin/appointments?q=${encodeURIComponent(email)}`);

    const row = page.getByRole('row').filter({ hasText: marker });
    await expect(row).toBeVisible();

    await row.getByLabel(/Change status/).selectOption('CONFIRMED');
    // Scope to the badge: the select's <option> carries the same text.
    await expect(row.locator('span').filter({ hasText: /^Confirmed$/ })).toBeVisible();

    // Clean up.
    await page.getByRole('row').filter({ hasText: marker }).getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page.getByRole('row').filter({ hasText: marker })).toBeHidden();
  });

  test('refuses to delete the signed-in administrator', async ({ page }) => {
    await page.goto(`/admin/users?q=${encodeURIComponent(ADMIN_EMAIL)}`);

    const row = page.getByRole('row').filter({ hasText: ADMIN_EMAIL });
    await expect(row).toBeVisible();
  });

  test('edits a site setting', async ({ page }) => {
    await page.goto('/admin/settings');

    const hours = page.getByLabel('booking.openingHours');
    await expect(hours).toBeVisible();

    const original = await hours.inputValue();
    const updated = 'Monday to Friday, 09:00 - 16:30';

    await hours.fill(updated);
    await page.getByRole('button', { name: /^Save/ }).first().click();
    await expect(page.getByText('Settings saved.')).toBeVisible();

    // Restore, so the suite does not leave the site with test data.
    await hours.fill(original);
    await page.getByRole('button', { name: /^Save/ }).first().click();
    await expect(page.getByText('Settings saved.')).toBeVisible();
  });

  test('signs out', async ({ page }) => {
    await page.goto('/admin');
    await waitForHydration(page);
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
  });
});

test.describe('client portal', () => {
  test.skip(!ADMIN_PASSWORD, 'ADMIN_PASSWORD is not set in the environment');

  test('an administrator sees the client portal link', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/admin/, { timeout: SIGN_IN_TIMEOUT });

    await page.goto('/portal');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Portal sections' })).toBeVisible();
  });
});
