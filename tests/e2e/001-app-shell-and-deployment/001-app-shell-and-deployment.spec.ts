import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('application shell loads, hydrates, and serves its original assets', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  const failedRequests: string[] = [];
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata(
    'Application shell and deployment',
    'The static X-Wing client loads, hydrates, and serves the original dial and ship artwork at phone and desktop sizes.'
  );

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
  });

  await page.goto('/');
  await steps.step('flight-console-ready', {
    description: 'The flight console is ready',
    verifications: [
      {
        spec: 'The page exposes the stable X-Wing title and primary heading',
        check: async () => {
          await expect(page).toHaveTitle('X-Wing — Choose your maneuver');
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'Choose your maneuver.Own the outcome.'
          );
        }
      },
      {
        spec: 'Client hydration changes the live status to “Flight console ready”',
        check: async () => expect(page.getByRole('status')).toHaveText('Flight console ready')
      },
      {
        spec: 'The foundation scope, documentation links, GPL license, and deterministic build marker are visible',
        check: async () => {
          await expect(page.getByText('Foundation preview')).toBeVisible();
          await expect(page.getByText('GPL-3.0-only')).toBeVisible();
          await expect(page.getByTestId('build-marker')).toHaveText('Build e2e-test');
          await expect(
            page.getByRole('navigation', { name: 'Project documentation' }).getByRole('link')
          ).toHaveCount(3);
        }
      },
      {
        spec: 'The circular dial, T-65, and TIE artwork load with nonzero dimensions',
        check: async () => {
          const artwork = page.locator('.tableau img');
          await expect(artwork).toHaveCount(4);
          await expect
            .poll(async () =>
              artwork.evaluateAll((images) =>
                images.every((image) => (image as HTMLImageElement).naturalWidth > 0)
              )
            )
            .toBe(true);
        }
      },
      {
        spec: 'No browser error or failed request is present',
        check: async () => {
          expect(browserErrors).toEqual([]);
          expect(failedRequests).toEqual([]);
        }
      }
    ]
  });

  steps.generateDocs();
});
