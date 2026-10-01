import { test, expect } from '@playwright/test';

/**
 * Public site behaviour: navigation, SEO output and the contact form.
 * These are the flows a visitor actually performs.
 */

/**
 * Waits until the Pages Router has hydrated.
 *
 * A form is only submitted by React once the client bundle has run; clicking
 * earlier falls through to the browser's native submit, which just reloads the
 * page. Every test that fills and submits a form waits for this first.
 */
async function waitForHydration(page) {
  await page.waitForFunction(() => Boolean(window.next?.router));
}

test.describe('public site', () => {
  test('renders the home page with the brand palette and a single H1', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Dental Atelier/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Dental Atelier');

    // The legacy brand colour is preserved.
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(2, 2, 2)');
  });

  test('has a working skip link and a labelled main region', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to main content/i });
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('exposes SEO metadata on every page in the primary navigation', async ({ page }) => {
    const pages = [
      { path: '/', title: /Dental Atelier/ },
      { path: '/about-us', title: /About/ },
      { path: '/products-and-materials', title: /Products & Materials/ },
      { path: '/services', title: /Services/ },
      { path: '/portfolio', title: /Portfolio/ },
      { path: '/faqs', title: /FAQs/ },
      { path: '/contact-us', title: /Contact Us/ },
    ];

    for (const { path, title } of pages) {
      await page.goto(path);

      await expect(page).toHaveTitle(title);

      // Every page needs its own description (the legacy site shared one).
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute('content');
      expect(description, `missing description on ${path}`).toBeTruthy();
      expect(description.length, `description too short on ${path}`).toBeGreaterThan(50);

      // Open Graph for link previews.
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('serves a sitemap that excludes the portals', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();

    const xml = await response.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/about-us');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/auth');
  });

  test('serves a robots.txt that blocks the portals', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /portal');
  });

  test('opens the mobile navigation with the keyboard', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForHydration(page);

    const toggle = page.getByRole('button', { name: /open menu/i });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(page.getByRole('button', { name: /close menu/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // Escape closes it and returns focus to the toggle.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('expands and collapses an FAQ', async ({ page }) => {
    await page.goto('/faqs');
    await waitForHydration(page);

    const question = page.getByRole('button', { name: /What is a crown/ });
    await expect(question).toHaveAttribute('aria-expanded', 'false');

    await question.click();
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/cap \(made of different materials/)).toBeVisible();
  });

  test('searches the FAQ list', async ({ page }) => {
    await page.goto('/faqs');
    await waitForHydration(page);

    await page.getByLabel(/search the frequently asked questions/i).fill('implant');
    await expect(page.getByText(/What is an implant crown\?/)).toBeVisible();
    await expect(page.getByRole('button', { name: /What is a provisional crown\?/ })).toBeHidden();
  });

  test('shows all four contact fields and a real submit control', async ({ page }) => {
    await page.goto('/contact-us');

    await expect(page.getByLabel(/Firstname/)).toBeVisible();
    await expect(page.getByLabel(/Surname/)).toBeVisible();
    await expect(page.getByLabel(/E-mail/)).toBeVisible();
    await expect(page.getByLabel(/Phone/)).toBeVisible();
    await expect(page.getByLabel(/Your enquiry/)).toBeVisible();

    const submit = page.getByRole('button', { name: 'Submit' });
    await expect(submit).toBeEnabled();
    await expect(submit).toHaveAttribute('type', 'submit');
  });

  test('rejects an empty contact form without calling the API', async ({ page }) => {
    await page.goto('/contact-us');
    await waitForHydration(page);

    let apiCalled = false;
    await page.route('**/api/contact', (route) => {
      apiCalled = true;
      return route.abort();
    });

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('First name is required.')).toBeVisible();
    await expect(page.getByText('Your enquiry is required.')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('sends the contact form and confirms receipt', async ({ page }) => {
    await page.goto('/contact-us');
    await waitForHydration(page);

    // Stub the API so the suite does not depend on a writable database.
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Thank you. Your message has been received.' }),
      }),
    );

    await page.getByLabel(/Firstname/).fill('E2E');
    await page.getByLabel(/Surname/).fill('Tester');
    await page.getByLabel(/E-mail/).fill('e2e@example.com');
    await page.getByLabel(/Your enquiry/).fill('This is an automated end-to-end test message.');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText(/Message received/)).toBeVisible();
    await expect(page.getByText(/has been received/)).toBeVisible();
  });

  test('ticks smile-check questions and submits', async ({ page }) => {
    await page.goto('/smile-check-form');
    await waitForHydration(page);

    // The questions are checkboxes, not buttons — assert on the label.
    await expect(page.getByLabel(/Are your teeth crooked/)).toBeVisible();

    await page.route('**/api/smile-check', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Thank you. We received your smile check.' }),
      }),
    );

    await page.getByLabel(/Are your teeth chipped/).check();
    await page.getByLabel(/too much gum visible/).check();
    await expect(page.getByText('2 concerns selected.')).toBeVisible();

    await page.getByLabel(/Firstname/).fill('E2E');
    await page.getByLabel(/Surname/).fill('Tester');
    await page.getByLabel(/E-mail/).fill('e2e@example.com');
    await page.getByRole('button', { name: /submit smile check/i }).click();

    // The mocked response's message, not a bare /smile check/ — that also matches
// the H1, the legend and the submit button, so it is not a usable locator.
await expect(page.getByText('Thank you. We received your smile check.')).toBeVisible();
  });

  test('every image has an alt attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const missing = await page.evaluate(() =>
      [...document.images]
        .filter((img) => img.getAttribute('alt') === null)
        .map((img) => img.currentSrc || img.src),
    );

    expect(missing, 'images without an alt attribute').toEqual([]);
  });

  test('returns a styled 404 for an unknown URL', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /could not find that page/i })).toBeVisible();
    // The 404 must not be indexed.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});