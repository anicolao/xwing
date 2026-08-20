# X-Wing implementation plan

## Objective

Deliver the fixed Second Edition Core Set teaching duel defined in
[VISION.md](VISION.md) as a realtime two-browser game. The first ruleset is
`ffg-second-edition-1.3.2`; later Atomic Mass Games formats are separate,
versioned products rather than silent amendments.

This plan follows the tracer-bullet model used by the sibling `jaipur` and
`roborally` projects: every gameplay increment begins with a real browser
action, crosses the production event, reducer, geometry, persistence, and
rendering paths, and ends in an observable result verified by Playwright. The
browser contract is enumerated in [E2E_GUIDE.md](E2E_GUIDE.md).

## Definition of a complete change

After the application-shell milestone, each user-facing gameplay commit must
include the smallest coherent vertical slice of:

1. stable schema and manifest changes;
2. deterministic reducer and geometry behavior;
3. immutable event-stream and Firestore Rules coverage;
4. accessible controls, status, and explanations;
5. a real browser scenario through the Firebase emulators;
6. semantic assertions and deterministic screenshots;
7. pure tests for combinatorial or boundary cases; and
8. documentation updates for changed protocols, sources, or invariants.

A rules-only simulation, a board driven by mock state, or multiplayer behavior
without two-browser proof is not a complete slice. Refactors preserve the
entire E2E suite.

Run all project commands through the Nix development shell:

```sh
nix develop --command bun install --frozen-lockfile
nix develop --command bun run verify:change
```

## Fixed technical decisions

- SvelteKit, TypeScript, Bun, and `@sveltejs/adapter-static`.
- Nix pins the development and CI entry point.
- Static GitHub Pages builds use `PUBLIC_BASE_PATH`; pull requests deploy to
  `/xwing/pr<NUMBER>/` without overwriting other previews.
- Firebase anonymous Authentication and Cloud Firestore begin with the room
  slice, tested against local emulators.
- Canonical multiplayer history lives at
  `games/{gameId}/events/{eventId}` as immutable events.
- Canonical state is a pure projection of a totally ordered, versioned event
  stream. Animation, camera state, hover previews, and sound are derived.
- Rules geometry uses deterministic fixed-point coordinates and angle units.
  DOM rectangles and sprite pixels never decide a rule.
- Every randomized result uses a committed seed and a versioned PRNG.
- Original artwork decorates semantic objects; it never carries the only copy
  of a value, direction, identity, or legal choice.

The initial trustworthy-client architecture preserves hidden information in
the ordinary UI but is not a cryptographic referee. A modified client may be
able to inspect both players' events. Server-authoritative or cryptographically
sealed planning is a separate future design.

## Repository layers

```text
src/lib/manifests/   reviewed ruleset, scenario, squad, dial, and deck data
src/lib/geometry/    fixed-point shapes, transforms, range, arc, and collision
src/lib/game/        event types, validation, reducer, PRNG, and diagnostics
src/lib/repository/  authentication, append-only Firestore access, replay/cache
src/lib/components/  accessible controls and rules-visible presentation
src/routes/          lobby, player game view, replay, and later tabletop view
tests/e2e/            numbered browser-visible product stories
tests/fixtures/       explicitly non-authoritative development fixtures
```

Dependencies point inward: presentation and persistence call the pure game
layer; the game layer may call reviewed manifests and geometry; neither pure
layer imports browser or Firebase code.

## Versioned source-data gates

The fixed teaching duel cannot become playable until these manifests are
reviewed against the cited FFG sources:

| Manifest | Completion gate |
| --- | --- |
| Ruleset | Rules Reference 1.3.2, Core Rulebook interactions, errata boundary, timing policy, and stable ruleset ID recorded. |
| Scenario | Play area, player edges, six obstacle instances, fixed setup procedure, fixed squads, and victory condition independently reviewed. |
| Ships and pilots | Exact base, initiative, attack, agility, hull, shields, action bar, ship ability, pilot ability, and charges for each enabled ship. |
| Maneuver dials | Every enabled speed, bearing, difficulty, reverse flag, and stop entry checked by two passes. |
| Damage deck | Every card instance, standard/ship damage type, count, faceup effect, repair action, and discard behavior reviewed. |
| Dice and tokens | Face distribution, token rules, modification timing, and stable instance IDs checked. |
| Geometry | Published base, template, ruler, play-area, and obstacle measurements normalized into one documented unit system. |

Every manifest records `sourceRuleset`, `manifestVersion`, provenance, review
status, and stable IDs. Unreviewed transcriptions remain development fixtures
and are visibly labelled non-authoritative.

## Canonical model

### Game configuration

`GameConfig` commits the ruleset, reducer, geometry, PRNG, scenario, squad,
dial, damage-deck, and card-manifest versions. It also records the initial
seed, both seats, and empty expansion/house-rule lists.

Loading or replaying must stop with an explicit incompatibility diagnostic if
any referenced version is absent. It must never substitute the newest data.

### Geometry

Use integer microunits (or another documented fixed-point scale) for points
and a fixed integer turn for angles. Each ship has one canonical base polygon,
pose, front guides, firing arcs, bullseye, and optional turret directions.

Pure geometry operations include:

- rigid transforms and template placement from front guides;
- complete and partial maneuver placement;
- base-to-base and base-to-obstacle intersection;
- overlap rollback to the furthest legal template position;
- range from closest points, including exact band boundaries;
- firing-arc and bullseye inclusion;
- obstruction by obstacle polygons;
- play-area containment and fleeing; and
- stable tie and tolerance handling at touching boundaries.

Rendering consumes the same shapes. Visual golden fixtures must label the
inputs and expected ruling so reviewers can inspect boundary behavior.

### Ship state

Each ship instance records stable IDs for its player, squad, pilot, ship type,
base, dial, and cards, plus:

- canonical pose and initiative;
- attack arcs and agility;
- current hull and shields;
- assigned maneuver and reveal/execute state;
- action bar, charges, Force, and turret direction where enabled;
- focus, evade, lock, stress, ion, disarm, and critical state required by the
  fixed scenario;
- damage-card instances;
- destroyed, fled, reserve, and activation/engagement status; and
- skipped-action and overlap explanations.

### Phase state machine

```text
setup
  -> planning barrier
  -> system phase, ascending initiative
  -> activation phase, ascending initiative
       reveal dial -> execute maneuver -> check difficulty -> perform action
  -> engagement phase, descending initiative
       choose weapon/target -> attack dice -> modify -> defense dice -> modify
       -> neutralize -> apply damage -> after-attack windows
  -> end phase -> cleanup -> victory check
  -> next planning phase or finished
```

The reducer advances automatically through mechanical steps until it reaches a
real choice, simultaneous barrier, committed random result, or game end. A
pending choice records its ID, timing window, authorized actor, source, legal
choices, and published default if one exists. Only a matching response resumes
resolution.

### Event vocabulary

Keep the initial protocol intentionally small:

| Event | Purpose |
| --- | --- |
| `game/created` | Commit room, host, protocol versions, and game ID. |
| `player/joined` | Claim the opposing seat. |
| `player/ready` | Confirm the current fixed configuration. |
| `setup/placed` | Commit one legal obstacle or ship placement. |
| `planning/assigned` | Save or replace one private maneuver before commitment. |
| `planning/committed` | Cross the simultaneous Planning barrier. |
| `choice/made` | Answer a reducer-projected action, target, dice, repair, or ability choice. |
| `random/committed` | Commit seed material for a reducer-requested random result. |
| `game/rematched` | Begin a fresh epoch with the same room members. |

Movement, overlap, token gain/spend, dice faces, damage, destruction, and
victory are derived outcomes rather than redundant result events.

Every event includes `type`, `payload`, `actorUid`, `clientSeq`, `createdAt`,
`schemaVersion`, and `reducerVersion`. IDs use actor identity plus a padded
sequence for idempotent retry. Timestamp and ID define a deterministic total
order. Invalid, stale, duplicate, unauthorized, or incompatible events produce
diagnostics and never partially update state.

## Milestone sequence

### M0 — Foundation and deployment

- [x] Establish rules boundary, vision, rules summary, and original assets.
- [x] Add the SvelteKit/Bun/Nix scaffold and accessible application shell.
- [x] Add phone and desktop Playwright smoke coverage.
- [x] Deploy verified main and retained PR-specific static builds.
- [ ] Add formatting, unit-test, and Firestore emulator harnesses with one
  repository-managed verification command.

Exit: a fresh clone can enter Nix, install locked dependencies, verify, build,
and load the same shell locally and under a nested GitHub Pages path.

### M1 — Geometry tracer

- Version the fixed-point coordinate and tolerance policy.
- Model small bases, guides, play-area edges, range ruler, straight/bank/turn
  templates, and the six obstacle paths.
- Render one canonical board from the geometry model.
- Provide keyboard, pointer, and touch pan/zoom without changing rules scale.
- Add golden boundary fixtures for contact, ranges, arcs, obstruction, and
  leaving the play area.

Exit: the UI can select two bases and explain their range, arc, overlap, and
obstruction results from the same geometry used by tests.

### M2 — Immutable rooms and fixed setup

- Add Firebase configuration, anonymous authentication, local emulators, and
  Firestore Security Rules.
- Create and join private rooms with an immutable versioned event stream.
- Implement idempotent append, live subscription, cache prefix, reconnect,
  conflict diagnostics, and reducer replay.
- Commit the fixed teaching scenario and alternate legal obstacle/ship setup.

Exit: two ordinary browsers create a room, complete legal fixed setup, reload,
and reproduce the identical canonical board.

### M3 — Private Planning and activation

- Commit reviewed ship and maneuver-dial manifests for the fixed squads.
- Assign and revise each dial privately, expose opponent readiness only, and
  close a simultaneous commitment barrier.
- Resolve initiative and player-order ties.
- Execute straight, bank, turn, and Koiogran maneuvers with exact templates.
- Resolve stress, difficulty, partial maneuvers, ship overlaps, obstacle
  effects, and action eligibility.
- Implement the fixed squads' focus, evade, lock, and barrel-roll actions.

Exit: both browsers complete Planning and Activation with matching positions,
tokens, explanations, and replay.

### M4 — Engagement, damage, and victory

- Commit dice, weapon, shield, hull, and damage-deck manifests.
- Declare legal weapons and targets using range, arc, and obstruction.
- Resolve attack/defense dice and every enabled modification window.
- Spend tokens, neutralize results, lose shields, deal facedown/faceup damage,
  execute critical effects, and repair where allowed.
- Resolve initiative-matched simultaneous fire, destruction, fleeing, end
  cleanup, win, loss, and draw.

Exit: an attack is explainable step by step and replays to the same dice,
damage instances, and winner in both browsers.

### M5 — Complete teaching duel

- Exercise every enabled ship, pilot, maneuver, action, obstacle, damage, and
  end condition through a production-size event history.
- Finish reconnect, replay navigation, conflict, and incompatible-version UX.
- Verify phone portrait/landscape, tablet, desktop, keyboard, touch, screen
  reader announcements, reduced motion, high contrast, and zoom.
- Review every source-data gate and generated walkthrough.

Exit: two players can complete the fixed duel without physical bookkeeping or
manual correction, and the verifier proves the result from a clean clone.

### M6+ — Explicitly versioned expansion

Only after the teaching duel is complete:

1. reviewed squad construction and saved squads;
2. additional FFG ships, pilots, upgrades, devices, conditions, and Force;
3. medium/large bases, turrets, docking, remotes, and alternate fixed
   scenarios;
4. Epic and huge ships; and
5. AMG scenarios, points, errata, and formats behind a separate ruleset ID.

## Quality gates

The complete verifier will grow toward:

```sh
nix develop --command bun run check
nix develop --command bun run check:workflow
nix develop --command bun run test:unit
nix develop --command bun run test:rules
nix develop --command bun run test:e2e
nix develop --command bun run build
nix develop --command git diff --check
```

CI must never deploy a failing build. A pull-request preview uses the exact PR
commit hash and nested production base path. Screenshot updates are a separate,
reviewable operation; tests do not silently rewrite baselines.

## Completion criteria

The first product milestone is complete only when scenarios 001–013 in
[E2E_GUIDE.md](E2E_GUIDE.md) pass against reviewed manifests and the normal
client path. At that point every canonical outcome is reconstructable from the
immutable stream, every spatial ruling comes from deterministic geometry, and
both players receive an accessible explanation without hidden manual state.
