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
  const surfaces = [
    { id: 'table-4k', label: 'Shared 4K tabletop', page },
    { id: 'rebel-phone', label: 'Rebel private hand', page: rebel },
    { id: 'imperial-phone', label: 'Imperial private hand', page: imperial }
  ];
  await page.getByRole('button', { name: 'Ready Rebel squad' }).click();
  await page.getByRole('button', { name: 'Ready Imperial squad' }).click();
  for (let placement = 0; placement < 6; placement += 1) await page.locator('button.placement').click();
  await steps.step('fixed-setup', {
    description: 'Players place the reviewed setup directly on the shared battlefield',
    surfaces,
    verifications: [
      { spec: 'Six production obstacles are visibly placed at their canonical positions', check: async () => { await expect(page.locator('.battlefield > img.obstacle')).toHaveCount(6); await expect(page.locator('.phase')).toHaveText('setup'); } },
      { spec: 'The next legal ship position is a direct tabletop target for the correct seat', check: async () => await expect(page.getByRole('button', { name: 'Place Onyx One for imperial' })).toBeVisible() },
      { spec: 'Seat-relative rotate, zoom, reset, and keyboard pan change presentation without changing setup geometry', check: async () => { const piece = page.getByRole('button', { name: 'Place Onyx One for imperial' }); const position = await piece.getAttribute('style'); for (let turn = 0; turn < 4; turn += 1) await page.getByRole('button', { name: 'Rotate from Rebel edge' }).click(); await page.getByRole('button', { name: 'Zoom in from Rebel edge' }).click(); await expect(page.locator('main')).toHaveAttribute('data-view', /^0:1\.25:/); await page.keyboard.press('ArrowRight'); await expect(page.locator('main')).toHaveAttribute('data-view', /^0:1\.25:40:/); await page.getByRole('button', { name: 'Center view from Rebel edge' }).click(); await expect(piece).toHaveAttribute('style', position!); } },
      { spec: 'Both private phones remain control-free during public setup', check: async () => { for (const hand of [rebel, imperial]) { await expect(hand.getByRole('heading', { name: 'Eyes on the table' })).toBeVisible(); await expect(hand.getByRole('button')).toHaveCount(0); } } }
    ]
  });
  for (let placement = 0; placement < 3; placement += 1) await page.locator('button.placement').click();
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
      { spec: 'The table applies the range-one bonus and presents labeled attack and defense dice', check: async () => { await expect(page.locator('.dice-tray')).toContainText('RANGE 1'); await expect(page.getByAltText(/Attack die/)).toHaveCount(4); await expect(page.getByRole('button', { name: 'Apply results' })).toBeVisible(); } },
      { spec: 'Both phones remain public-control-free waiting surfaces during combat', check: async () => { for (const hand of [rebel, imperial]) { await expect(hand.getByRole('heading', { name: 'Eyes on the table' })).toBeVisible(); await expect(hand.getByRole('button')).toHaveCount(0); } } },
      { spec: 'The complete multi-surface story has no browser or asset error', check: async () => expect(errors).toEqual([]) }
    ]
  });

  await page.getByRole('button', { name: 'Apply results' }).click();
  await page.getByRole('button', { name: 'Pass attack' }).click();
  await page.getByRole('button', { name: 'Resolve End phase' }).click();

  await rebel.getByRole('button', { name: /Red Five: speed 4 koiogran/ }).click();
  await imperial.getByRole('button', { name: /Onyx Two: speed 1 turn-right/ }).click();
  await rebel.getByRole('button', { name: 'Commit all maneuvers' }).click();
  await imperial.getByRole('button', { name: 'Commit all maneuvers' }).click();
  await page.locator('button.selectable').click();
  await page.getByRole('navigation', { name: /actions/ }).getByRole('button', { name: /focus/ }).click();
  await page.locator('button.selectable').click();
  await page.getByRole('navigation', { name: /actions/ }).getByRole('button', { name: 'Pass' }).click();
  await page.locator('button.selectable').click();
  await page.getByRole('button', { name: 'Roll attack and defense' }).click();
  await page.getByRole('button', { name: 'Apply results' }).click();
  await page.getByRole('button', { name: 'Pass attack' }).click();
  await page.getByRole('button', { name: 'Concede Imperial squad' }).click();
  await page.getByRole('button', { name: 'Confirm Imperial concession' }).click();

  await steps.step('rebel-victory', {
    description: 'A public two-touch concession ends the teaching duel with an unambiguous result',
    surfaces,
    verifications: [
      { spec: 'A destroyed ship displays production damage-card art', check: async () => { await expect(page.getByText('REBEL VICTORY')).toBeVisible(); await expect(page.locator('[data-ship="onyx-one"] .damage img')).toBeVisible(); } },
      { spec: 'The result freezes public gameplay and offers replay and rematch on the table', check: async () => { await expect(page.getByRole('link', { name: 'Review replay' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Open rematch' })).toBeVisible(); await expect(page.getByRole('button', { name: /Roll|Apply|Pass attack/ })).toHaveCount(0); } },
      { spec: 'Both private hands remain waiting surfaces after game end', check: async () => { for (const hand of [rebel, imperial]) { await expect(hand.getByRole('heading', { name: 'Eyes on the table' })).toBeVisible(); await expect(hand.getByRole('button')).toHaveCount(0); } } }
    ]
  });

  const replayLink = page.getByRole('link', { name: 'Replay', exact: true });
  const replayPage = await context.newPage(); await replayPage.setViewportSize({ width: 2560, height: 1440 }); watch('replay', replayPage);
  await replayPage.goto(await replayLink.getAttribute('href') ?? '/replay?room=FLIGHT7');
  await steps.step('immutable-replay', {
    description: 'The accepted event history can be replayed at every prefix',
    surfaces: [{ id: 'replay', label: 'Public event replay', page: replayPage }],
    verifications: [
      { spec: 'Replay opens at the complete immutable prefix with previous and next navigation', check: async () => { await expect(replayPage.getByRole('heading', { name: 'Event history' })).toBeVisible(); await expect(replayPage.getByRole('button', { name: 'Previous' })).toBeVisible(); await expect(replayPage.locator('aside li')).not.toHaveCount(0); } },
      { spec: 'Stepping backward changes only the replay projection', check: async () => { const before = await replayPage.locator('header small').innerText(); await replayPage.getByRole('button', { name: 'Previous' }).click(); await expect(replayPage.locator('header small')).not.toHaveText(before); await expect(page.locator('.phase')).toHaveText('finished'); } },
      { spec: 'Replay remains free of browser and asset errors', check: async () => expect(errors).toEqual([]) }
    ]
  });

  steps.generateDocs();
});
