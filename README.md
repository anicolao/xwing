# X-Wing

This repository is the starting point for an unofficial, realtime,
browser-based implementation of *Star Wars: X-Wing Second Edition*, the
two-player tactical miniatures game published by Fantasy Flight Games.

The initial rules target is Fantasy Flight Games' final Second Edition
[Rules Reference v1.3.2](https://images-cdn.fantasyflightgames.com/filer_public/47/f0/47f07217-1f06-4110-8823-3f4badda1acd/01_swzrulesreference_v132_updated-compressed.pdf),
effective October 12, 2021. Later Atomic Mass Games points, scenarios, errata,
and tournament rules are a different, explicitly versioned compatibility
target; they must not be mixed silently into the FFG ruleset.

This first milestone contains product documentation and original art. There is
not yet a playable application.

## Project documents

- [VISION.md](VISION.md) defines the intended experience, first playable
  slice, architecture, edition policy, and completion criteria.
- [RULES_SUMMARY.md](RULES_SUMMARY.md) is an implementation-oriented summary
  of the targeted rules.
- [ASSETS.md](ASSETS.md) records the original generated artwork, prompts,
  constraints, dimensions, and intended uses.

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
- Keyboard-, pointer-, touch-, phone-, tablet-, and desktop-friendly controls,
  with a shared-table mode considered after the normal two-device experience.
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
- Playwright against Firebase emulators for real two-browser scenarios;
- semantic assertions, screenshot baselines, and generated walkthroughs; and
- accessible UI proven at phone, tablet, tabletop, and desktop viewports.

The proposed multiplayer model is a trustworthy client, not a secure referee.
Firestore Security Rules can enforce membership, attribution, and immutable
history, but a modified client could inspect private maneuver selections or
future randomized state. The ordinary client must preserve the physical
game's information boundaries; cryptographic secrecy or server-authoritative
validation is a separate future project.

No package manifest, toolchain, Firebase project, or deployment target has
been selected in this documentation-only milestone. Those should be
established together in the first implementation slice rather than copied
without review.

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

*Star Wars*, *X-Wing*, Fantasy Flight Games, Atomic Mass Games, and related
names and marks belong to their respective owners. This independent fan
project is not endorsed by or affiliated with Lucasfilm, Fantasy Flight Games,
Asmodee, or Atomic Mass Games.

## License

The implementation, documentation, and original repository assets are
licensed under the [GNU General Public License version 3](LICENSE), SPDX
identifier `GPL-3.0-only`. Third-party game names, rules references, and
trademarks remain the property of their respective owners.
