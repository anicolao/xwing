# X-Wing

This repository contains an unofficial, realtime browser teaching duel based
on _Star Wars: X-Wing Second Edition_, the two-player tactical miniatures game
published by Fantasy Flight Games.

The initial rules target is Fantasy Flight Games' final Second Edition
[Rules Reference v1.3.2](https://images-cdn.fantasyflightgames.com/filer_public/47/f0/47f07217-1f06-4110-8823-3f4badda1acd/01_swzrulesreference_v132_updated-compressed.pdf),
effective October 12, 2021. Later Atomic Mass Games points, scenarios, errata,
and tournament rules are a different, explicitly versioned compatibility
target; they must not be mixed silently into the FFG ruleset.

The playable slice uses one shared landscape table for every public action and
one private phone hand per seat for maneuver planning. It includes a
deterministic event reducer, fixed-point maneuver and combat geometry, seeded
dice, damage, round and victory handling, and prefix-by-prefix replay.
Map-specific controls stay attached to the ship or placement they affect and
face the acting player; shared combat information is mirrored for both table
edges. Non-spatial prompts remain in the gutters, while animated outcomes and
the persistent flight log explain both the chosen action and what it produced.

## Play the teaching duel

Open the [shared tabletop](https://anicolao.github.io/xwing/pr1/tt) on the
landscape display. Loading `/tt` immediately creates a room; scan the Rebel and
Imperial QR codes with the matching phones.

The production repository adapter uses anonymous Authentication and append-only
Firestore rooms. The checked-in E2E story runs the ordinary client against Auth
and Firestore emulators in three isolated browser contexts: one 3840×2160 table
and two 393×852 phones. The deploy workflow reads the three
`PUBLIC_FIREBASE_*` values from GitHub repository variables. Without those
values, client startup fails explicitly: there is no browser-local game mode.
Each QR URL contains only a random room ID and its seat. Possession of that
tabletop-displayed URL allows the first anonymous device to claim the
unoccupied seat.

## Project documents

- [VISION.md](VISION.md) defines the intended experience, first playable
  slice, architecture, edition policy, and completion criteria.
- [RULES_SUMMARY.md](RULES_SUMMARY.md) is an implementation-oriented summary
  of the targeted rules.
- [ASSETS.md](ASSETS.md) records the original generated artwork, prompts,
  constraints, dimensions, and intended uses.
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) defines the architecture,
  data gates, vertical slices, and completion criteria.
- [E2E_GUIDE.md](E2E_GUIDE.md) defines the browser scenarios that make those
  slices executable product documentation.

These documents are not substitutes for the published rulebook or rules
reference.

## Product direction

- Exactly two players in a private room for the initial game mode.
- Simultaneous, private maneuver planning followed by deterministic movement,
  actions, attacks, damage, and end-of-round cleanup.
- Exact base, template, arc, range, obstacle, and overlap geometry.
- Reconnect and replay from a complete immutable event history.
- A rules-visible interface that explains why an action, target, or maneuver
  is legal or illegal.
- One shared 3840x2160 landscape tabletop as the authoritative public control
  surface, readable and operable by players seated at opposing long edges.
- Two seat-specific phones used only for hidden maneuver planning and any later
  choice that can be shown to require genuine privacy.
- Orientation-independent rules geometry, with seat-edge controls and public
  information presented readably from either side of the table.
- Original presentation assets; official art, logos, card layouts, miniature
  renders, faction marks, and trade dress are not repository assets.

The first playable slice is a fixed Core Set teaching duel. General squad
building, the full expansion catalog, Epic and huge ships, environment cards,
organized-play formats, and later AMG scenarios follow only after their data
and rule boundaries are separately reviewed and versioned.

## Technical direction

The sibling `jaipur` and `roborally` projects establish the implementation
model:

- SvelteKit, TypeScript, Bun, and `@sveltejs/adapter-static`;
- Firebase anonymous Authentication and Cloud Firestore rooms;
- one append-only event stream at `games/{gameId}/events/{eventId}`;
- deterministic, versioned reducers, geometry, randomization, and replay;
- Vitest for pure rules and geometry tests;
- Playwright against Firebase emulators with one table and two isolated phone
  contexts;
- semantic assertions, screenshot baselines, and generated walkthroughs; and
- accessible UI proven on the 4K tabletop from opposing orientations and on
  the minimal private phone surface.

The multiplayer model is a trustworthy client, not a secure referee. Firestore
Rules restrict room reads to the table and two claimed seat identities, bind
each event actor to its authenticated member, and make accepted event documents
create-only. A modified room-member client could still inspect the other
player's private maneuver events or future randomized state; the ordinary
client preserves the physical game's UI boundaries.

The repository includes the Nix-pinned client, `/tt` shared table, `/hand`
private companion, `/replay` event inspector, pure tests, multi-surface browser
coverage, and static GitHub Pages deployment. Pull request `N` is retained at
`https://anicolao.github.io/xwing/prN/`; the main branch is published at
`https://anicolao.github.io/xwing/`.

The complete visual walkthrough—including every macOS and Linux zero-pixel
baseline—is in
[the tabletop teaching-duel E2E README](tests/e2e/002-tabletop-teaching-duel/README.md).

## Development

Install and verify through the locked development environment:

```sh
nix develop --command bun install --frozen-lockfile
nix develop --command bunx playwright install chromium
nix develop --command bun run verify:change
```

Start the local application with:

```sh
nix develop --command bun run dev
```

Copy `.env.example` to `.env` and provide a Firebase web application's public
configuration for local development. The application requires either that
production configuration or the explicit emulator setting; it has no offline
or browser-local repository. `verify:change` needs no cloud project: it starts
the Auth and Firestore emulators automatically.

The production Firebase project is `xwing-20260820`; `.firebaserc` selects it
for rules deployment. The Firestore database uses the `nam5` multi-region and
has deletion protection enabled.

## Rules and data policy

Every saved game must identify the exact rules, reducer, geometry, squad,
damage-deck, and card-manifest versions used to create it. Replays fail clearly
when a required version is unavailable; they never substitute current data for
old data.

Rules-critical information is semantic data, not pixels. Ship bases, arcs,
maneuver dials, templates, tokens, obstacles, dice, and cards need stable
instance IDs. Original artwork can decorate those objects, but it cannot be
the only carrier of a value, direction, state, or legal choice.

Pilot and upgrade abilities, squad points, slots, restrictions, dials, damage
cards, and errata require reviewed manifests with provenance before they enter
playable content. Unreviewed transcriptions remain development fixtures and
must not be presented as authoritative.

## Primary rules sources

- Fantasy Flight Games:
  [Second Edition Rules Reference v1.3.2](https://images-cdn.fantasyflightgames.com/filer_public/47/f0/47f07217-1f06-4110-8823-3f4badda1acd/01_swzrulesreference_v132_updated-compressed.pdf)
- Fantasy Flight Games:
  [Second Edition Core Rulebook](https://images-cdn.fantasyflightgames.com/filer_public/6c/ed/6ced3492-42fb-43c9-b542-0528cd19cff9/swz01_rulebookweb.pdf)
- Fantasy Flight Games:
  [X-Wing rules and organized-play archive](https://www.fantasyflightgames.com/en/op/x-wing/)
- Atomic Mass Games:
  [current X-Wing documents](https://www.atomicmassgames.com/xwing-docs/),
  recorded for future compatibility work but not part of the initial ruleset

## Artwork and trademarks

The artwork in `static/assets/` was generated specifically for this project
and deliberately avoids official illustrations, logos, faction emblems, ship
designs, card layouts, and trade dress. See [ASSETS.md](ASSETS.md) for the full
provenance record.

_Star Wars_, _X-Wing_, Fantasy Flight Games, Atomic Mass Games, and related
names and marks belong to their respective owners. This independent fan
project is not endorsed by or affiliated with Lucasfilm, Fantasy Flight Games,
Asmodee, or Atomic Mass Games.

## License

The implementation, documentation, and original repository assets are
licensed under the [GNU General Public License version 3](LICENSE), SPDX
identifier `GPL-3.0-only`. Third-party game names, rules references, and
trademarks remain the property of their respective owners.
