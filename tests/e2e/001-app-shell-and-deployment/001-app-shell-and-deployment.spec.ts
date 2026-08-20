import { expect, test } from '@playwright/test';

test('application shell loads, hydrates, and serves its original assets', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
  });

  await page.goto('/');

  await expect(page).toHaveTitle('X-Wing — Choose your maneuver');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your maneuver.Own the outcome.'
  );
  await expect(page.getByRole('status')).toHaveText('Flight console ready');
  await expect(page.getByText('Foundation preview')).toBeVisible();
  await expect(page.getByText('GPL-3.0-only')).toBeVisible();
  await expect(page.getByTestId('build-marker')).toHaveText('Build e2e-test');
  await expect(page.getByRole('navigation', { name: 'Project documentation' }).getByRole('link')).toHaveCount(3);

  const artwork = page.locator('.tableau img');
  await expect(artwork).toHaveCount(4);
  await expect
    .poll(async () => artwork.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0)))
    .toBe(true);

  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(browserErrors).toEqual([]);
  expect(failedRequests).toEqual([]);

  await testInfo.attach(`application-shell-${testInfo.project.name}`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  });
});
