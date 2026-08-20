# End-to-end test guide

Every X-Wing feature is delivered as a browser-visible tracer bullet. An E2E
scenario is executable product documentation: it drives the ordinary client,
uses the real persistence path once that path exists, asserts semantic state,
captures deterministic screenshots, and records the player-visible story.

A gameplay change without a matching browser scenario is incomplete. Pure
reducer and geometry tests cover exhaustive combinations, but they do not
replace proof that a player can reach and understand the behavior.

## Mandatory tool entry point

Use the locked Nix environment for installation, development, tests, and
builds:

```sh
nix develop --command bun install --frozen-lockfile
nix develop --command bunx playwright install chromium
nix develop --command bun run test:e2e
```

The application server is started automatically by Playwright. The smoke
scenario needs no external service. Starting with scenario 002, the E2E command
will wrap Playwright in Firebase Authentication and Firestore emulators.

## What a gameplay scenario proves

A gameplay scenario starts with a user action and ends with a visible result:

```text
interaction on its owning surface
  -> Svelte component
  -> production event creation
  -> Firestore emulator
  -> event subscription and deterministic reducer
  -> geometry/rules projection
  -> public-table or seat-private selector
  -> accessible rendering on the table and permitted phone projections
```

Do not inject reducer state into the page, call reducers from a spec, append
handwritten result events, mock repositories, or add test-only controls. A
helper may remove repetitive clicks, but it must operate through accessible
roles, labels, stable test IDs, and public application behavior.

Private-information scenarios must assert all three surfaces: an owner sees the
value on their phone, the opposing phone does not, and the table shows only the
allowed readiness or hidden-state indicator. Public scenarios interact through
the table and assert that neither phone exposes a duplicate gameplay control.
The first architecture provides UI secrecy, not cryptographic secrecy, so E2E
tests must not describe Firestore as a secure hidden-information store.

## Scenario organization

Use a three-digit sequence and one coherent kebab-case capability:

```text
tests/e2e/
  001-app-shell-and-deployment/
    001-app-shell-and-deployment.spec.ts
    README.md
    screenshots/
      000-shell-desktop.png
      000-shell-phone.png
  helpers/
    test-step-helper.ts
```

The scenario README is generated from the spec's title, purpose, steps,
verification labels, and screenshots. It must embed and directly link every
checked-in baseline for every surface exercised, for both the macOS development
and Linux CI renderers. Scenario 001 retains its phone and desktop shell
baselines; gameplay scenarios use table and, when private state is involved,
seat-phone baselines. Commit reviewed walkthroughs and baselines with the
feature. Do not combine unrelated rules to avoid adding a scenario, or split a
vertical feature into backend-only and frontend-only E2E tests.

## Required structure

Each scenario must:

1. use Playwright's `test` and `expect`;
2. describe a player-visible story rather than an implementation detail;
3. interact through roles, labels, and stable test IDs;
4. verify semantic behavior before capturing a screenshot;
5. wait on application status rather than arbitrary sleeps;
6. assert table, owner-phone, and opponent-phone projections for private or
   multiplayer state;
7. prove the relevant production base path or replay boundary;
8. fail on browser console errors, uncaught exceptions, missing assets, or
   unintended page overflow;
9. use committed seeds, identities, clocks, and content versions; and
10. leave no `.only`, retries, or silently updated snapshots in CI.

Screenshots are evidence after semantic assertions, not the assertion itself.
Every comparison uses `maxDiffPixels: 0`; baseline changes require explicit
visual review. Animations and carets are disabled; fonts, locale, timezone,
device scale, viewport, and rendering flags are fixed in
`playwright.config.ts`.

## Browser contexts and viewports

- `table-4k`: 3840×2160 at device scale factor 1 is required for every gameplay
  scenario. It represents the one public display between the players.
- `table-development`: 2560×1440 proves the supported development fallback in
  the complete-surface scenario.
- `seat-a-phone` and `seat-b-phone`: isolated 393×852 contexts are present in
  every multiplayer scenario starting with 002. Outside private Planning they
  contain only seat, connection, and waiting status—no public game controls.
- `phone-shell` at 393×852 and `desktop-shell` at 1280×1000 remain only for the
  implemented scenario 001 foundation test.
- The table and both phones use separate browser contexts. Never switch role or
  identity by changing local storage inside one context.

The complete-surface scenario checks both players' 0/180-degree reading
orientations, table viewing rotations of 0, 90, 180, and 270 degrees, 200%
zoom, reduced motion, keyboard-only play, multi-touch-sized controls, non-color
state, focus management, live announcements, and board pan/zoom without
changing canonical geometry. Phone checks cover private Planning only; a
responsive phone version of the public battlefield is not an MVP requirement.

## Required scenarios

The sequence is the delivery order. A scenario remains planned until its
production path exists; pure fixtures may be written earlier but cannot mark
it complete.

### 001 — Application shell and deployment — implemented

- Load the hydrated SvelteKit client at phone and desktop sizes.
- Verify the stable title, primary heading, readiness status, scope message,
  documentation links, GPL marker, and deterministic build hash.
- Verify the dial and both ship asset classes load with nonzero dimensions.
- Assert no missing-resource or uncaught browser errors.
- Build separately with `/xwing/pr1` and prove asset URLs honor the nested base
  path.
- Treat these viewports as foundation-shell coverage only; this scenario does
  not establish the MVP gameplay surface contract.

### 002 — Create, join, and replay a room

- The table creates one private room and displays distinct, short-lived pairing
  codes for the two opposing seats.
- Two anonymous phone contexts pair to one seat each; the table shows stable
  seats, ruleset/manifests, readiness, and connection state through the real
  Firebase emulators.
- A code cannot claim both seats, a claimed seat cannot be stolen, and explicit
  re-pairing invalidates the old seat session.
- Duplicate append is idempotent; reload replays the same immutable prefix.
- A nonmember cannot read or append, and neither member can mutate or delete an
  accepted event.

### 003 — Fixed setup and legal placement

- The fixed teaching duel is selected and both players ready on the table.
- Players alternate placing all six obstacles on the table with range-to-edge
  and range-to-obstacle constraints visibly explained at the active seat edge.
- Ships deploy in initiative/player order inside the correct setup areas.
- Illegal overlap, range, rotation, and out-of-area attempts are refused with
  semantic explanations; the table finishes on the canonical poses.
- Both phones show seat and connection status, with no setup or placement
  controls.

### 004 — Private maneuver planning

- Each owner opens every required dial on their phone, selects and revises a
  legal maneuver, and commits Planning there.
- The opposing phone and table see assignment/commitment state but never
  selected bearings, speeds, or difficulties before reveal.
- One commitment cannot close the barrier; both commitments advance exactly
  once and freeze the selected maneuvers.
- Reload before and after the barrier preserves the appropriate table, owner,
  and opponent projections.
- The table contains no dial-selection control and neither phone can inspect or
  operate the other seat's dials.

### 005 — Activation order and maneuver geometry

- Ships activate by ascending initiative with deterministic player-order ties.
- The authorized player reveals each dial on the table, which places the
  correct template at the front guides, moves along it, and lands at the exact
  transformed pose.
- Straight, bank, turn, and Koiogran examples show speed/difficulty and final
  orientation, including stress consequences.
- Both seated orientations show the same staged playback and final geometry;
  phones show waiting state without reveal or movement controls.

Pure geometry fixtures exhaust every enabled maneuver at cardinal and awkward
angles; browser coverage proves representative user-visible paths.

### 006 — Overlaps, obstacles, stress, and actions

- On the table, a maneuver that would overlap another ship backs up to the
  furthest legal position and skips its action with an explanation.
- Asteroid and debris intersections use semantic masks, not texture pixels,
  and resolve the correct effects.
- Stress prevents red maneuvers/actions where required and clears on a blue
  maneuver.
- Focus, evade, lock, and barrel roll expose only legal choices, produce the
  correct tokens/pose, and are visible to both players on the table.
- Action controls appear at the authorized player's edge; both phones remain
  read-only connection/waiting surfaces.

### 007 — Targets, arcs, range, and obstruction

- The attacker inspects candidate targets on the table and sees legal/illegal
  reasons from their seated orientation.
- Front arc, bullseye, range-band boundaries, closest-point measurement, and
  obstacle obstruction use canonical geometry.
- Weapon range and attack-die effects are reflected in the declared attack.
- Target and weapon controls exist only on the table and cannot be invoked from
  either phone.
- Arc-edge contact, range 0, exact range boundaries, multiple obstacles, and
  touching polygons are exhaustive pure fixtures.

### 008 — Attack and defense dice

- The active ship declares one legal weapon/target and rolls from a committed
  seed using the table.
- Attacker and defender modification windows occur in rules order with legal
  focus, evade, and lock choices and explicit pass controls.
- Rerolls preserve prohibited-reroll state, results neutralize in the correct
  order, and both seated table orientations show identical pools and spent
  tokens.
- Reduced motion skips animation without skipping timing windows or results.

### 009 — Shields, damage, and critical effects

- On the table, uncancelled hits remove shields before dealing damage-card
  instances.
- Critical results deal faceup cards at the correct time and their enabled
  persistent effects alter later legal choices or values.
- Repair/flip/discard actions use stable card IDs and exact allowed timing.
- Damage-deck conservation, exhaustion policy, every enabled card count, and
  interaction edge cases are pure fixtures backed by reviewed manifests.

### 010 — Destruction, fleeing, victory, and draw

- A ship reaching hull damage is destroyed at the correct timing point.
- A base leaving the play area flees based on semantic geometry.
- Initiative-matched ships complete simultaneous-fire behavior where the
  rules permit it.
- End phase produces win, loss, or simultaneous-destruction draw on the table,
  freezes gameplay controls, and offers replay/rematch without changing the
  old epoch.

### 011 — Reconnect, replay, conflicts, and versioning

- Disconnect each phone during Planning and the table during Activation
  playback and a dice choice; reconnect from cached prefix/cursor and catch up
  without duplicated effects.
- A phone that disconnects after committing cannot block public table play.
- Reload every surface at every major phase and project the same canonical
  state with the correct public/private visibility immediately.
- Stale, duplicate, unauthorized, and incompatible events yield stable
  diagnostics and never partially mutate state.
- Replay can step through decisions and derived resolution while exposing the
  exact ruleset, reducer, geometry, PRNG, and manifest versions.

### 012 — Complete fixed teaching duel

- One 4K table and two seat phones play a production-size duel from room
  creation through setup, multiple rounds, damage, destruction, final summary,
  and rematch.
- Every public action occurs on the table; each phone is touched only to pair
  and to make its seat's hidden maneuver choices.
- The history exercises every ship, maneuver family, action, token, obstacle,
  attack step, and end condition enabled in the fixed scenario.
- A golden event-log oracle and all three rendered surfaces agree at every
  round boundary; no direct state setup shortcuts are allowed.

### 013 — Tabletop orientation and accessible complete duel

- Repeat the complete story at 3840x2160 with players at opposing long edges;
  repeat representative public interactions at the 2560x1440 fallback.
- Verify near- and far-edge controls are readable at 0/180 degrees and rotate
  the table presentation through 0, 90, 180, and 270 degrees without changing
  canonical positions or rulings.
- Complete public play using keyboard controls and repeat spatial interactions
  with pointer and multi-touch behavior from each seat edge.
- Verify focus placement, readable labels, phase/live announcements, generous
  touch targets, non-color ownership, high contrast, 200% zoom, reduced motion,
  reachability, and no inaccessible or obscured controls.
- Verify the 393x852 phone flow remains usable for private Planning and exposes
  no public gameplay controls.
- Pan and zoom the board without altering any measured range, arc, overlap, or
  final pose.

### Later scenarios

New numbered scenarios are required for squad construction, every reviewed
content batch, medium/large bases, turrets, devices/remotes, docking, Force and
charges, alternate scenarios, Epic play, spectators, bots, alternative private
companion devices, and each separately versioned AMG format. “All cards” or
“all ships” coverage is valid only against an explicit reviewed manifest.

## Pure-test boundary

Playwright proves reachable product stories. Vitest must exhaust cases that
would make E2E slow or opaque:

- geometry transformations, intersections, tolerances, and range boundaries;
- every dial entry and template/base combination;
- reducer phase/timing transitions and event validation;
- dice distributions, modification ordering, and PRNG golden vectors;
- damage-deck conservation and every enabled critical interaction;
- replay prefixes, duplicates, conflicts, and incompatible versions; and
- Firestore membership, attribution, create-only events, and immutable fields.

Every pure fixture must name the same stable manifest IDs used by the browser.
Test-only content remains visibly non-authoritative.

## Deployment checks

CI verifies the source before deployment. Main builds with base `/xwing`; PR
`N` builds with `/xwing/prN` and publishes to retained directory `prN` on the
`gh-pages` branch. An internal PR receives a comment linking its preview.

The smoke scenario runs against the development root. CI also performs the
nested production build, which fails if SvelteKit detects invalid base-path
usage. Asset references in application code must use `$app/paths`; literal
root-relative application URLs are forbidden.
