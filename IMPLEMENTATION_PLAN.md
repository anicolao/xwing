# X-Wing implementation plan

## Objective

Deliver the fixed Second Edition Core Set teaching duel defined in
[VISION.md](VISION.md) as a tabletop-first realtime game. The primary interface
is one shared 4K landscape display laid flat between two players seated on
opposite sides. Two seat-specific phones are companion surfaces used only for
the rare choices that must remain private, beginning with maneuver selection.
The first ruleset is `ffg-second-edition-1.3.2`; later Atomic Mass Games formats
are separate, versioned products rather than silent amendments.

This plan follows the tracer-bullet model used by the sibling `jaipur` and
`roborally` projects: every gameplay increment begins on the correct physical
surface, crosses the production event, reducer, geometry, persistence, and
rendering paths, and ends in an observable result verified by Playwright.
Public actions begin and end on the shared table; private choices begin on the
owning phone and become public on the table only when the rules reveal them.
The executable contract is enumerated in [E2E_GUIDE.md](E2E_GUIDE.md).

## Definition of a complete change

After the application-shell milestone, each user-facing gameplay commit must
include the smallest coherent vertical slice of:

1. stable schema and manifest changes;
2. deterministic reducer and geometry behavior;
3. immutable event-stream and Firestore Rules coverage;
4. accessible controls, status, and explanations;
5. a real multi-surface browser scenario through the Firebase emulators;
6. semantic assertions and deterministic screenshots;
7. pure tests for combinatorial or boundary cases; and
8. documentation updates for changed protocols, sources, or invariants.

A rules-only simulation, a board driven by mock state, a phone-only public
action, or multiplayer behavior without shared-table-and-two-phone proof is
not a complete slice. A gameplay slice that has no private choice need not add
a new phone control, but it must prove that both phone projections remain free
of public gameplay controls. Refactors preserve the entire E2E suite.

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
- The shared table is the authoritative public control surface, not a passive
  mirror or spectator view. Phones never become miniature copies of it.
- Rules geometry has one canonical world orientation. Display rotation,
  seat-relative labels, camera state, and control placement are presentation
  state and cannot change a maneuver, arc, range, overlap, or placement ruling.

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
src/routes/tt/       shared-table lobby, setup, public play, and result surface
src/routes/hand/     seat pairing and the minimal private-choice surface
src/routes/replay/   event-history inspection outside the live table flow
tests/e2e/            numbered browser-visible product stories
tests/fixtures/       explicitly non-authoritative development fixtures
```

Dependencies point inward: presentation and persistence call the pure game
layer; the game layer may call reviewed manifests and geometry; neither pure
layer imports browser or Firebase code.

## MVP surface and interaction contract

The physical setup is one landscape 4K display between two players, with one
player at each opposing long edge. Each player may pair one phone to their
seat. A game must remain playable from the table except at a rules-mandated
hidden choice; a phone disconnect must never make an already-public choice
unavailable on the table.

| Activity | Required surface | Phone responsibility |
| --- | --- | --- |
| Create room and choose the fixed scenario | Shared table | Scan a seat QR code and authenticate that seat. |
| Ready state, obstacle placement, and ship placement | Shared table | Show connection state only. |
| Choose, revise, and commit hidden maneuvers | Owning phone | Show only that seat's dials and commitment controls. |
| Reveal and execute maneuvers | Shared table | Show a brief waiting state; do not duplicate controls. |
| Choose actions, targets, weapons, abilities, and passes | Shared table | No gameplay controls. |
| Roll and modify dice; resolve damage and repairs | Shared table | No gameplay controls. |
| Inspect public log, victory, replay, and rematch | Shared table | No gameplay controls. |

The implementation must justify any later phone interaction by identifying the
specific information that would be revealed if it appeared on the table. Mere
convenience, reach, or conventional responsive-web practice is not enough.

### Table orientation and reach

- The default seats are the near and far long edges. Far-edge labels and
  controls rotate 180 degrees so neither player must read an upside-down UI.
- The battlefield keeps one canonical orientation. Ships, templates, ranges,
  and arcs do not flip when control ownership changes.
- Central public state is orientation-neutral, radial, or duplicated toward
  both seats. Prompts appear at the active player's edge and may be mirrored as
  read-only status at the opposite edge.
- A table-level viewing rotation supports 0, 90, 180, and 270 degrees without
  transforming canonical coordinates. The MVP interaction layout is optimized
  for two opposing players at 0 and 180 degrees.
- Controls belong in generous edge interaction zones and must not obscure the
  geometry being judged. The active seat is communicated by text, shape, and
  focus treatment rather than color alone.
- Multi-touch input is accepted at the presentation layer, but canonical
  choices remain serialized by the reducer's authorized actor and timing
  window. Competing touches cannot produce two accepted actions.

The primary visual target is 3840x2160 landscape at device scale factor 1. A
2560x1440 landscape table is the development fallback. Seat phones target
393x852 portrait for private planning. Ordinary desktop layouts may support
development, replay, and accessibility, but are not the MVP play model.

### Surface authority and projections

Room membership distinguishes one `table` controller identity from two
seat-member identities. The table identity may append setup events and public
choices, declaring the `actingSeat` when the reducer is waiting for a specific
player. A seat identity may append private Planning events only for its own
seat. Firestore Rules enforce event-type permissions by identity role; the
reducer independently enforces the current phase, timing window, and acting
seat.

Pairing links contain an unguessable, short-lived capability for exactly one
seat and are invalid after a successful claim or explicit re-pair. They are a
device-enrollment mechanism, not a promise of cryptographic gameplay secrecy.
The table projects public state; each phone projects only connection status,
its own unrevealed dials, and its private pending choices. Projection selectors
are pure functions over the same canonical stream and receive an explicit
surface role and, for phones, seat ID.

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
seed, table-controller identity, both seat identities, pairing epoch, and empty
expansion/house-rule lists.

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

Every event includes `type`, `payload`, `actorUid`, `surfaceRole`, optional
`actingSeat`, `clientSeq`, `createdAt`, `schemaVersion`, and `reducerVersion`.
IDs use actor identity plus a padded sequence for idempotent retry. Timestamp
and ID define a deterministic total order. Invalid, stale, duplicate,
unauthorized, or incompatible events produce diagnostics and never partially
update state.

## Milestone sequence

### M0 — Foundation and deployment

- [x] Establish rules boundary, vision, rules summary, and original assets.
- [x] Add the SvelteKit/Bun/Nix scaffold and accessible application shell.
- [x] Add phone and desktop Playwright smoke coverage.
- [x] Deploy verified main and retained PR-specific static builds.
- [x] Replace the generic shell with distinct `/tt` shared-table and `/hand`
  private-companion routes, while retaining the shell smoke test as foundation
  coverage rather than the intended game UI.
- [x] Define table-created pairing with two seat QR codes, single-seat claims,
  and visible connection state.
- [ ] Add short-lived claims and explicit unpair/re-pair.
- [x] Add a Playwright story with one 3840x2160 table surface and two 393x852
  phone surfaces.
- [x] Move the E2E phones into isolated anonymous-authenticated browser
  contexts through the Firestore adapter and local emulators.
- [x] Add unit tests to the repository-managed verification command.
- [x] Add the Firestore/Auth emulator harness to the repository-managed
  verification command.
- [ ] Add a formatting gate to the repository-managed verification command.

Exit: a fresh clone can enter Nix, install locked dependencies, verify, build,
and load the shared-table and private-hand routes locally and under a nested
GitHub Pages path. The table can pair two isolated seat phones, and the three
surfaces agree on room and seat identity.

### M1 — Geometry tracer

- Version the fixed-point coordinate and tolerance policy.
- Model small bases, guides, play-area edges, range ruler, straight/bank/turn
  templates, and the six obstacle paths.
- Render one canonical board on the 4K shared-table surface.
- Present seat-edge controls at 0 and 180 degrees and rotate the table view in
  quarter turns without changing canonical geometry.
- Provide pointer, multi-touch, and keyboard pan/zoom without changing rules
  scale, while keeping controls reachable from the two opposing long edges.
- Add golden boundary fixtures for contact, ranges, arcs, obstruction, and
  leaving the play area.

Exit: either seated player can use the table to select two bases and understand
their range, arc, overlap, and obstruction results from the same geometry used
by tests. No phone is required for this public interaction.

### M2 — Immutable rooms and fixed setup

- Add Firebase configuration, anonymous authentication, local emulators, and
  Firestore Security Rules.
- Create a private room from the table, pair two seat phones with scoped tokens,
  and record seat claims in the immutable versioned event stream.
- Implement idempotent append, live subscription, cache prefix, reconnect,
  conflict diagnostics, and reducer replay.
- Commit the fixed teaching scenario and alternate legal obstacle/ship setup
  using only the shared table.

Exit: one table and two isolated seat phones create a room, complete legal fixed
setup on the table, reload, and reproduce the identical canonical board. The
phones expose connection status but no setup controls.

### M3 — Private Planning and activation

- Commit reviewed ship and maneuver-dial manifests for the fixed squads.
- Assign, revise, and commit each dial only on its owning phone; expose readiness
  without the maneuver value and close a simultaneous commitment barrier.
- Reveal dials, execute maneuvers, and make all public action and ability
  choices on the shared table, nearest the currently authorized seat.
- Resolve initiative and player-order ties.
- Execute straight, bank, turn, and Koiogran maneuvers with exact templates.
- Resolve stress, difficulty, partial maneuvers, ship overlaps, obstacle
  effects, and action eligibility.
- Implement the fixed squads' focus, evade, lock, and barrel-roll actions.

Exit: both phones complete private Planning; the table completes public reveal
and Activation with matching positions, tokens, explanations, and replay. No
public action is required or duplicated on a phone.

### M4 — Engagement, damage, and victory

- Commit dice, weapon, shield, hull, and damage-deck manifests.
- Declare legal weapons and targets using range, arc, and obstruction.
- Resolve attack/defense dice and every enabled modification window.
- Spend tokens, neutralize results, lose shields, deal facedown/faceup damage,
  execute critical effects, and repair where allowed.
- Resolve initiative-matched simultaneous fire, destruction, fleeing, end
  cleanup, win, loss, and draw.
- Keep weapon, target, dice, modification, damage, repair, and timing-window
  controls on the table, oriented toward the authorized player.

Exit: an attack is explainable step by step and replays to the same dice,
damage instances, and winner on the table and both seat projections.

### M5 — Complete teaching duel

- Exercise every enabled ship, pilot, maneuver, action, obstacle, damage, and
  end condition through a production-size event history.
- Finish reconnect, replay navigation, conflict, and incompatible-version UX.
- Verify the 3840x2160 tabletop from both seated orientations and at all four
  viewing rotations, plus the 2560x1440 development fallback.
- Verify two 393x852 private-planning phones, reach from opposing edges,
  keyboard and multi-touch input, screen-reader announcements, reduced motion,
  high contrast, 200% zoom, and non-color ownership cues.
- Verify a phone can disconnect after commitment without blocking any public
  table action, and that reconnect never exposes the other seat's private view.
- Review every source-data gate and generated walkthrough.

Exit: two players seated opposite each other can complete the fixed duel on one
landscape 4K table, touching their phones only for hidden Planning choices,
without physical bookkeeping or manual correction. The verifier proves the
result from a clean clone.

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
both players receive an accessible explanation on the shared table without
hidden manual state. Each phone contains only its seat's private projection and
the minimal controls needed to submit that information.
