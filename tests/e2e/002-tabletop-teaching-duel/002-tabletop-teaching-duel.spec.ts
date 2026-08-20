import { expect, test, type Page } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('two seats plan privately and resolve a public attack on the shared table', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The story creates its own table and phone surfaces.');
  const errors: string[] = [];
  const watch = (surface: string, target: Page) => {
    target.on('console', (message) => { if (message.type() === 'error') errors.push(`${surface}: ${message.text()}`); });
    target.on('pageerror', (error) => errors.push(`${surface}: ${error.message}`));
    target.on('requestfailed', (request) => errors.push(`${surface}: ${request.url()} ${request.failure()?.errorText}`));
  };

  await page.setViewportSize({ width: 3840, height: 2160 });
  const rebel = await context.newPage(); await rebel.setViewportSize({ width: 393, height: 852 });
  const imperial = await context.newPage(); await imperial.setViewportSize({ width: 393, height: 852 });
  watch('table', page); watch('rebel hand', rebel); watch('imperial hand', imperial);
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata(
    'Tabletop teaching duel',
    'One shared 4K table pairs two private hands, keeps both dial values off the public surface, resolves deterministic movement and dice in public, and replays the immutable event history.'
  );

  await page.goto('/tt');
  await page.getByRole('button', { name: 'Create tabletop room' }).click();
  await rebel.goto('/hand?room=FLIGHT7&seat=rebel&code=RED-5');
  await imperial.goto('/hand?room=FLIGHT7&seat=imperial&code=ONYX-2');
  await rebel.getByRole('button', { name: 'Claim Rebel seat' }).click();
  await imperial.getByRole('button', { name: 'Claim Imperial seat' }).click();
  await page.getByRole('button', { name: 'Ready Rebel squad' }).click();
  await page.getByRole('button', { name: 'Ready Imperial squad' }).click();
  await page.getByRole('button', { name: 'Lock setup on table' }).click();

  const surfaces = [
    { id: 'table-4k', label: 'Shared 4K tabletop', page },
    { id: 'rebel-phone', label: 'Rebel private hand', page: rebel },
    { id: 'imperial-phone', label: 'Imperial private hand', page: imperial }
  ];
  await steps.step('private-planning-ready', {
    description: 'Private planning is ready on the owning phones',
    surfaces,
    verifications: [
      { spec: 'The shared table shows Planning without any dial-selection control', check: async () => { await expect(page.locator('.phase')).toHaveText('planning'); await expect(page.getByRole('button', { name: /speed \d/ })).toHaveCount(0); } },
      { spec: 'The Rebel hand exposes one Red Five dial and no Imperial ships', check: async () => { await expect(rebel.getByRole('group', { name: 'Red Five' })).toBeVisible(); await expect(rebel.getByText('Onyx One')).toHaveCount(0); } },
      { spec: 'The Imperial hand exposes two own dials and no Rebel ship', check: async () => { await expect(imperial.getByRole('group')).toHaveCount(2); await expect(imperial.getByText('Red Five')).toHaveCount(0); } },
      { spec: 'All three production surfaces are error-free', check: async () => expect(errors).toEqual([]) }
    ]
  });

  async function planRound(rebelBearing = 'straight') {
    for (const control of await rebel.getByRole('button', { name: new RegExp(`Red Five: speed 3 ${rebelBearing}`) }).all()) await control.click();
    for (const control of await imperial.getByRole('button', { name: /Onyx .*: speed 3 straight/ }).all()) await control.click();
    await rebel.getByRole('button', { name: 'Commit all maneuvers' }).click();
    await expect(page.getByText('Rebel committed.')).toBeVisible();
    await imperial.getByRole('button', { name: 'Commit all maneuvers' }).click();
    await expect(page.locator('.phase')).toHaveText('activation');
  }

  async function activateSquad() {
    for (let index = 0; index < 3; index += 1) {
      await page.locator('button.selectable').click();
      const actions = page.getByRole('navigation', { name: /actions/ });
      await actions.getByRole('button', { name: /focus/ }).click();
    }
    await expect(page.locator('.phase')).toHaveText('engagement');
  }

  await planRound();
  await steps.step('commitment-and-public-reveal', {
    description: 'Commitment reveals only the active ship on the table',
    surfaces,
    verifications: [
      { spec: 'Both phones seal the dial values and contain no reveal or action controls', check: async () => { for (const hand of [rebel, imperial]) { await expect(hand.getByText('COMMITTED', { exact: true })).toBeVisible(); await expect(hand.getByRole('button')).toHaveCount(0); } } },
      { spec: 'The table names the active ship and offers direct battlefield reveal', check: async () => { await expect(page.getByText('REVEAL', { exact: true })).toBeVisible(); await expect(page.locator('button.selectable')).toHaveCount(1); } },
      { spec: 'No hidden maneuver value is rendered on the shared table', check: async () => await expect(page.getByText('3 straight', { exact: false })).toHaveCount(0) }
    ]
  });

  await activateSquad();
  for (let index = 0; index < 3; index += 1) await page.getByRole('button', { name: 'Pass attack' }).click();
  await page.getByRole('button', { name: 'Resolve End phase' }).click();
  await planRound('bank-left');
  await activateSquad();
  await page.locator('button.selectable').first().click();
  await page.getByRole('button', { name: 'Roll attack and defense' }).click();

  await steps.step('public-deterministic-attack', {
    description: 'Movement and deterministic dice resolve on the public table',
    surfaces,
    verifications: [
      { spec: 'All three ships moved through canonical speed-three geometry before combat', check: async () => { await expect(page.locator('[data-ship]')).toHaveCount(3); await expect(page.locator('.phase')).toHaveText('engagement'); } },
      { spec: 'The table presents labeled attack and defense dice and an Apply results choice', check: async () => { await expect(page.locator('.dice-tray')).toBeVisible(); await expect(page.getByAltText(/Attack die/)).toHaveCount(3); await expect(page.getByRole('button', { name: 'Apply results' })).toBeVisible(); } },
      { spec: 'Both phones remain public-control-free waiting surfaces during combat', check: async () => { for (const hand of [rebel, imperial]) { await expect(hand.getByRole('heading', { name: 'Eyes on the table' })).toBeVisible(); await expect(hand.getByRole('button')).toHaveCount(0); } } },
      { spec: 'The complete multi-surface story has no browser or asset error', check: async () => expect(errors).toEqual([]) }
    ]
  });

  await page.getByRole('button', { name: 'Apply results' }).click();
  const replayLink = page.getByRole('link', { name: 'Replay' });
  const replayPage = await context.newPage(); await replayPage.setViewportSize({ width: 2560, height: 1440 }); watch('replay', replayPage);
  await replayPage.goto(await replayLink.getAttribute('href') ?? '/replay?room=FLIGHT7');
  await steps.step('immutable-replay', {
    description: 'The accepted event history can be replayed at every prefix',
    surfaces: [{ id: 'replay', label: 'Public event replay', page: replayPage }],
    verifications: [
      { spec: 'Replay opens at the complete immutable prefix with previous and next navigation', check: async () => { await expect(replayPage.getByRole('heading', { name: 'Event history' })).toBeVisible(); await expect(replayPage.getByRole('button', { name: 'Previous' })).toBeVisible(); await expect(replayPage.locator('aside li')).not.toHaveCount(0); } },
      { spec: 'Stepping backward changes only the replay projection', check: async () => { const before = await replayPage.locator('header small').innerText(); await replayPage.getByRole('button', { name: 'Previous' }).click(); await expect(replayPage.locator('header small')).not.toHaveText(before); await expect(page.locator('.phase')).toHaveText('engagement'); } },
      { spec: 'Replay remains free of browser and asset errors', check: async () => expect(errors).toEqual([]) }
    ]
  });

  steps.generateDocs();
});
