# X-Wing product vision

## Objective

Build a faithful, understandable browser version of Fantasy Flight Games'
*Star Wars: X-Wing Second Edition* for two people seated opposite each other at
one landscape 4K tabletop display. Players plan hidden maneuvers on their own
phones, then resolve the public game together on the table without needing the
physical templates, tokens, dice, or damage deck.

The product should preserve the source game's central tension: maneuver choices
are private, movement is spatial and committal, initiative changes who must
move with incomplete information, and a well-flown squad can outperform a
nominally stronger one.

The first ruleset ID is `ffg-second-edition-1.3.2`. It refers to Fantasy Flight
Games' Rules Reference v1.3.2, effective October 12, 2021. Current Atomic Mass
Games play is not a patch applied on top; it is a later compatibility target
with separate scenario, squad-building, points, errata, and tournament
manifests.

## Product principles

### Flying is the interface

The play area is the primary surface. A player should be able to inspect a
ship, resolve its maneuver, and choose public actions directly on the shared
table without translating the board into a separate control panel or reaching
for a phone. A phone is used only when a choice must be hidden from the player
across the table.

Movement previews must clearly distinguish a hypothetical path from a
committed maneuver. They may teach template placement and collisions, but they
must not reveal hidden enemy dials or promise a final position whose legality
depends on unresolved earlier ships.

### The table belongs to both players

The shared table is the authoritative public interface, not a passive display.
Room setup, placement, reveals, movement, actions, attacks, dice, damage,
timing choices, explanations, and results all happen there. Phones are
seat-specific hands for private information, not general-purpose controllers.

The battlefield has one canonical orientation, but its presentation must work
from any edge. With players seated on opposing long edges, each receives
near-edge controls and readable text; the far edge is rotated 180 degrees.
Central information is orientation-neutral or repeated toward both seats. A
quarter-turn viewing rotation may change presentation but never coordinates,
arcs, ranges, templates, collision results, or event history.

### Geometry is rules state

Base size, position, rotation, guides, maneuver templates, firing arcs,
bullseye, turret direction, obstacle outlines, and range bands are canonical
data. Rendering and rules queries use the same geometry. Approximate sprites,
eyeballed distance, and DOM rectangles cannot decide gameplay.

Coordinates and angles use a documented deterministic representation. Every
intersection and boundary decision has a tolerance policy and golden tests,
including touching at range 0, arc-edge contact, range-band boundaries,
obstruction, partial maneuvers, and a base leaving the play area.

### Hidden choices stay legible

Each player sees their own dials and may revise them until committing the
Planning phase. The opponent sees assignment and readiness state, never the
selected maneuvers. When all players commit, the same event history resolves
the same activation sequence on every client.

This is a presentation guarantee in the first architecture, not a security
guarantee. A trustworthy client may store private choices in a room stream
that both authenticated members can read. The product must state that boundary
plainly.

### Explain the ruling

When the engine refuses a target, action, die modification, or upgrade choice,
the interface explains the failed requirement. The event log records both the
action and its visible consequences. A replay can pause at every timing window
and show the ability queue, dice pool, tokens spent, damage dealt, and geometry
measurements that produced the result.

### Accessibility is part of fidelity

Color and artwork never carry rules alone. Every ship, token, dial maneuver,
arc, range, die result, and damage state has a text equivalent. All actions are
keyboard operable, focus order follows play order, motion respects reduced
motion, touch targets are at least 44 CSS pixels, and screen readers receive
concise phase and turn announcements.

Zoom, high contrast, and non-color status patterns must not change canonical
geometry. On the shared table the battlefield may pan and zoom while edge
controls remain reachable from either seat without covering the position being
judged. The phone view stays focused on its rare private choice and does not
shrink the public battlefield into a handset layout.

### Original presentation, reviewed source data

No published art, logo, miniature render, faction insignia, card frame, or
trade dress is needed to implement the rules. Repository art is original or
appropriately licensed and is listed in an asset manifest.

Rules data is different from artwork: pilot and upgrade effects, maneuver
dials, squad costs, slots, restrictions, damage cards, and errata need exact
reviewed manifests. Each manifest records source ruleset, version, provenance,
review status, and stable IDs. Text transcriptions must be reviewed for both
accuracy and permission before public deployment.

## First playable slice

The first complete vertical slice is a fixed, two-player Core Set teaching
duel on a 3-by-3-foot-equivalent play area. It includes only the ships, dials,
actions, obstacles, dice, damage behavior, and abilities needed by that fixed
scenario.

It is complete only when one shared-table browser and two isolated seat-phone
browsers can:

1. create a private room on the table and pair one phone to each seat;
2. claim opposite seats and reach a fixed setup;
3. place the required obstacles and ships legally on the table;
4. choose every maneuver privately on its owning phone and commit Planning;
5. resolve System, Activation, Engagement, and End phases on the table;
6. execute templates, overlaps, actions, arcs, ranges, attacks, dice
   modifications, shields, damage, destruction, and fleeing;
7. finish with an unambiguous winner or draw;
8. disconnect, reconnect, and reproduce the same state from the immutable
   event stream; and
9. pass semantic, geometry, reducer, Firestore Rules, three-surface,
   screenshot, accessibility, and production-build checks.

No mock-state board or rules-only simulator counts as this slice. A gameplay
commit starts with an action on the surface that owns it and ends with a visible
result on the table and each permitted seat projection.

## Scope sequence

### Milestone 0: foundation

- Documentation, original art, edition boundary, and rules summary.
- SvelteKit/Bun/Nix project scaffold and a single verification command.
- Static deployment and distinct shared-table and private-hand application
  shells.
- A 3840x2160 landscape table layout, two opposing seat zones, quarter-turn
  display rotation, and pairing for two 393x852 phones.
- Versioned fixed-point geometry library with visual golden fixtures.
- Firebase emulator harness, authentication, room membership, and immutable
  event schema.

### Milestone 1: fixed teaching duel

- Fixed squads and deterministic setup on the shared table.
- Private dials and simultaneous phase commitment on seat phones.
- Core maneuvers, actions, attacks, dice, damage, obstacles, and victory on the
  shared table.
- Reconnect, replay, conflict diagnostics, and complete E2E walkthrough.

### Milestone 2: squad configuration

- Reviewed faction, ship, pilot, dial, upgrade, slot, restriction, and points
  manifests for an explicitly named content set.
- Squad validation and saved squad lists.
- Card timing engine, costs, optional choices, replacement effects, and ability
  queue coverage.

### Milestone 3: broader Second Edition

- Remaining standard ships and upgrades in reviewed batches.
- Devices, remotes, docking, configurations, Force, charges, turrets, and the
  complete status-token family.
- Alternative fixed scenarios that still use the FFG v1.3.2 rules boundary.

### Later compatibility targets

- Epic Battles and huge ships.
- Environment cards and nonstandard play areas.
- AMG scenario play, current squad construction, current points, ban lists,
  errata, and tournament regulations as a separate ruleset.
- Spectators, asynchronous analysis, bots, and cryptographically hidden or
  server-authoritative play.

## Technical model

### Immutable events and deterministic projection

The canonical multiplayer record is one append-only Firestore event stream at
`games/{gameId}/events/{eventId}`. Events contain at least `type`, `payload`,
`actorUid`, `clientSeq`, `createdAt`, `schemaVersion`, and `reducerVersion`.
Event IDs make retries idempotent, and a deterministic total ordering is
defined for events with equal or unresolved timestamps.

Canonical state is a pure projection of the ordered stream. Invalid, stale,
duplicate, unauthorized, or incompatible events produce diagnostics and never
partially mutate state. Animation frames, sound, hover previews, and camera
position are derived presentation rather than events.

The room has one table-controller identity and two seat identities. The table
may submit setup and public choices for the seat named by the current timing
window; each phone may submit private Planning choices only for its own seat.
Pure selectors derive one public table projection and two seat-private phone
projections. Display rotation and seat-edge placement are absent from canonical
state and cannot affect reducer authorization or geometry.

Every random outcome uses committed, versioned inputs: player order when
required, obstacle selection when randomized, attack and defense dice, damage
deck order, and any card effect that instructs a random choice. Replaying the
same compatible stream must produce identical results.

### State machine

The reducer exposes one exact phase and, when needed, one exact timing window:

```text
setup
  -> planning commitments
  -> system abilities, ascending initiative
  -> activations, ascending initiative
       reveal dial -> maneuver -> action
  -> engagements, descending initiative
       declare -> attack dice -> defense dice -> neutralize -> damage
  -> end abilities -> token cleanup -> recurring charges -> victory check
  -> next planning phase or finished
```

The engine automatically advances through mechanical steps until it reaches a
real player choice, a simultaneous barrier, a required random result, or game
end. Optional abilities are never guessed; they create explicit pass-or-use
choices with a deterministic timeout policy if timed play is later introduced.

### Versioned manifests

Each game stores exact versions for:

- rules and reducer;
- geometry and tolerance policy;
- dice and random-number generator;
- scenario and play-area setup;
- squad points and construction rules;
- ship, pilot, dial, upgrade, condition, device, and obstacle data; and
- standard and huge-ship damage decks, when enabled.

The application refuses to replay when a referenced manifest is missing. It
never loads a similarly named current card or point value as a replacement.

## Quality contract

Every user-facing gameplay change includes the smallest coherent vertical
slice of:

- schema and deterministic reducer behavior;
- pure geometry and rules tests for edge cases;
- immutable-stream and Firestore Rules coverage;
- accessible controls and explanations;
- a real shared-table-and-two-phone Playwright scenario through Firebase
  emulators;
- semantic assertions, deterministic screenshots, and a generated
  walkthrough; and
- documentation updates for any changed rule, protocol, source, or invariant.

The complete verifier runs type and static checks, unit tests, Firestore Rules
tests, all browser scenarios, the production build, and whitespace checks.
Repository hooks and CI use the same command.

## Success criteria

The project succeeds when two players seated opposite each other can finish a
match on one 4K landscape table, using their phones only for private choices,
without manually correcting geometry or bookkeeping and without any surface
disagreeing after a reload.

For maintainers, every outcome must be reproducible from a small fixture and
explainable from versioned source data. For players, the interface should make
the consequences of flying choices clearer without removing the uncertainty
that makes those choices interesting.
