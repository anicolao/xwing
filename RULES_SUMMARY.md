# X-Wing Second Edition rules summary

This is an implementation-oriented summary of Fantasy Flight Games' *Star
Wars: X-Wing Second Edition* rules, not a replacement for the published
documents. The initial target is the final FFG
[Rules Reference v1.3.2](https://images-cdn.fantasyflightgames.com/filer_public/47/f0/47f07217-1f06-4110-8823-3f4badda1acd/01_swzrulesreference_v132_updated-compressed.pdf),
effective October 12, 2021, together with the
[Core Rulebook](https://images-cdn.fantasyflightgames.com/filer_public/6c/ed/6ced3492-42fb-43c9-b542-0528cd19cff9/swz01_rulebookweb.pdf).

Later Atomic Mass Games squad-building, scenario, points, errata, and
tournament documents are not part of this ruleset.

## Rules precedence

When sources conflict, apply them in this order:

1. an absolute effect using “cannot”;
2. card abilities over the general Rules Reference;
3. the Rules Reference over the Core Rulebook; and
4. the most recent English printing or official erratum over older printings
   and translations.

An implementation must record which errata and card manifest it uses. It must
not look up mutable current text while replaying an older game.

## Objective

Two players each control a squad of ships in a 3-by-3-foot (91-by-91-cm) play
area. A standard untimed game ends at the end of a round when a player has no
ships remaining. That player loses. If both players' last ships are destroyed
in the same round, the game is a draw.

Tournament time limits, scoring, concessions, scenario objectives, and
matchmaking come from format documents rather than the core victory rule and
must be enabled only by a versioned format manifest.

## Canonical game objects

Each physical or logical instance needs a stable ID, even when several copies
have the same printed name:

- players, squads, ships, pilots, bases, dials, and turret indicators;
- ship, upgrade, condition, quick-build, and damage cards;
- maneuver templates and the range ruler;
- obstacles, devices, remotes, and markers;
- attack and defense dice; and
- focus, evade, lock, stress, strain, deplete, ion, tractor, jam, disarm,
  reinforce, cloak, charge, Force, shield, and other tokens.

The miniature is decorative. The base and its semantic geometry determine
position, overlap, arcs, range, and whether a ship has fled.

Each ship state includes at least its base size and pose, initiative, primary
and special weapons, agility, hull, active shields, dial assignment, action
bar, turret direction, charges, Force, tokens, damage cards, upgrades,
conditions, reserve state, and destroyed or removed state.

## Setup

Resolve standard setup in order:

1. **Gather forces.** Each player places their squad's ship and upgrade cards,
   assigns ship IDs, and initializes shields, standard charges, and Force.
2. **Determine player order.** The player with the lower squad-point total
   chooses the first player. If totals are tied, determine first player
   randomly.
3. **Establish the play area.** Use a 3-by-3-foot square and choose opposite
   player edges.
4. **Place obstacles.** In player order, alternate choosing and placing until
   six obstacles are present. Each must be beyond range 1 of every other
   obstacle and beyond range 2 of every play-area edge.
5. **Place forces.** Place ships from lowest initiative to highest, breaking
   cross-player initiative ties by player order. A ship must be within range 1
   of its player's edge. Set each turret indicator when its ship is placed.
6. **Prepare other components.** Shuffle the damage deck or each player's
   damage deck and make dice, rulers, templates, and tokens available.

Resolve abilities with a `Setup:` timing in their specified setup step. A
scenario or environment manifest may alter setup only when that content is
explicitly enabled.

## Round sequence

Every round has five phases:

```text
Planning -> System -> Activation -> Engagement -> End
```

### 1. Planning phase

Each player secretly selects one maneuver on the matching dial for each of
their non-ionized ships and assigns it facedown. Dials may be set and revised
in any order until the phase ends. Planning ends only when all required dials
are assigned and both players commit to proceed.

The digital game must keep the selected maneuver private from the opponent
while showing which ships still need assignments and whether the opponent has
committed. After committing, a player cannot revise their dials unless a rule
explicitly permits it.

### 2. System phase

Ships receive opportunities from lowest initiative to highest to resolve
abilities explicitly timed to the System phase. This includes relevant device,
docking, deployment, decloak, and card effects when those modules are enabled.
Player order breaks equal-initiative ties.

The phase is not skippable merely because the initial Core Set has few System
phase choices; the timing window is part of the canonical state machine.

### 3. Activation phase

Ships activate one at a time from lowest initiative to highest. A player orders
their own ships that share an initiative; player order breaks ties between
players. Each activation resolves:

1. reveal the assigned dial;
2. execute its maneuver; and
3. optionally perform one action.

A stressed ship cannot execute a red maneuver or perform actions. If it tries
to execute a red maneuver, it executes the white speed-2 straight stress
maneuver instead. An ionized ship follows the separate ion rules: it normally
has no assigned dial, executes the prescribed blue speed-1 straight maneuver,
is limited to its permitted focus action, and then removes its ion tokens.

### 4. Engagement phase

Ships engage one at a time from highest initiative to lowest. When a ship
engages, it may perform one standard attack. A player orders their own ships at
the same initiative; player order breaks equal-initiative ties between
players.

A ship destroyed during Engagement remains until every ship at the current
initiative has engaged. It can therefore still engage if its initiative step
has been reached. Remove all destroyed ships at that initiative before
continuing downward. This is simultaneous fire.

### 5. End phase

Resolve in order:

1. abilities at the start of the End phase;
2. abilities during the End phase;
3. remove circular tokens from every ship, green tokens before orange tokens;
4. recover or lose recurring charges as shown by recurring-charge icons; and
5. check the victory condition.

If the game did not end, begin the next Planning phase.

## Maneuvers and movement

A maneuver has a speed, bearing, and difficulty. Standard bearings include
straight, bank, turn, and stationary or reverse maneuvers where printed on a
dial. Advanced bearings include Koiogran turns, Segnor's loops, Tallon rolls,
and sideslips for ships that have them.

To execute a normal maneuver, place the matching template flush between the
ship's front guides, move the base to the far end, and align its rear guides.
Then check difficulty:

- a red maneuver gives the ship one stress token;
- a white maneuver has no inherent token effect; and
- a blue maneuver removes one stress token, one strain token, and one deplete
  token, if present.

Advanced bearings alter the base's final facing or template alignment exactly
as defined by the reference. The engine must model the full swept template and
the base's precise starting and ending pose; an animation path cannot stand in
for collision geometry.

### Overlap and partial execution

If the final base position would overlap another ship, move the ship backward
along the template until it no longer overlaps any ship, place it touching the
last ship it backed over, and skip its Perform Action step. The maneuver still
has its printed speed, bearing, and difficulty and still receives its
difficulty effects.

A ship that merely moves through another ship without ending on it does not
overlap that ship. Moving through or overlapping obstacles uses the obstacle
rules below.

If any part of a ship's base is outside the play area after it executes a
maneuver, that ship flees and is removed from the game. A miniature overhanging
the edge is irrelevant if its base remains inside.

## Actions and tokens

During its Perform Action step, an unstressed ship may perform one action from
its action bar or an available `Action:` ability. Common actions include:

- **Focus:** gain a focus token, normally spent during attack or defense to
  change all focus results to hits or evades respectively.
- **Evade:** gain an evade token, normally spent while defending to change an
  eligible defense result to an evade.
- **Lock:** acquire a lock on an object in the allowed range; a lock on the
  defender can normally be spent to reroll any number of attack dice.
- **Barrel roll:** use the speed-1 straight template to reposition laterally,
  subject to base-size and placement rules.
- **Boost:** use an allowed speed-1 template to reposition forward.
- **Rotate:** point a turret indicator toward another standard arc.

Coordinate, reinforce, jam, reload, cloak, SLAM, linked actions, red and purple
actions, and card-provided actions are enabled only with content that uses
them.

A ship cannot perform actions while stressed. It cannot perform the same
action more than once in a round, and a failed action also counts against that
limit. Red actions cost a stress token; purple actions cost a Force charge.
Actions must pass exact placement and range requirements and can fail only
where the rules allow failure.

Circular green and orange tokens are removed during the End phase. Square
tokens generally persist until a rule removes them. Locks are paired semantic
relationships, not just matching pictures.

## Attacks

An attack resolves these major steps in order.

### 1. Declare target

Measure potential targets, choose a primary or special weapon, choose an enemy
defender that satisfies that weapon's arc and range requirements, and pay all
attack costs. Primary weapons normally attack at range 1–3. A ship normally
cannot attack a ship at range 0.

Range is measured from the closest point of the attacker's base to the closest
point of the defender inside the chosen attack arc. A ship is in an arc if any
part of its base is inside that arc. The bullseye lies inside the front arc and
has no inherent effect unless an ability refers to it.

### 2. Roll and modify attack dice

Start with the weapon's attack value and apply all dice-number modifiers,
minimums, and maximums. Roll red attack dice. The defending player modifies
the attack dice first, then the attacking player. Common attacker
modifications spend focus or a lock.

### 3. Roll and modify defense dice

Start with the defender's agility and apply all dice-number modifiers,
minimums, and maximums. Roll green defense dice. The attacking player modifies
the defense dice first, then the defending player. Common defender
modifications spend focus or evade.

Each die can be rerolled at most once in an attack. Adding, changing,
rerolling, and spending results are dice modifications; rolling extra dice and
canceling results are not.

### 4. Neutralize results

Cancel one evade result against one normal hit result until no such pair
remains, then cancel evade results against critical-hit results. The attack
hits if at least one normal or critical hit remains.

### 5. Deal damage

Resolve every uncanceled normal hit before every uncanceled critical hit.
For each damage:

- remove one active shield if the defender has one;
- otherwise deal a facedown damage card for a normal hit; or
- otherwise deal a faceup damage card for a critical hit and resolve its text.

A ship is destroyed when the number of its damage cards equals or exceeds its
hull value. Excess damage is still dealt. Faceup and facedown cards remain
distinct instances so exposing, repairing, discarding, and random selection
can replay exactly.

### Range and obstruction bonuses

- At attack range 1, the attacker normally rolls one additional attack die.
- At attack range 3, the defender normally rolls one additional defense die.
- If the measured attack line crosses at least one obstacle, the attack is
  obstructed and the defender normally rolls one additional defense die.

Special weapons marked to ignore range bonuses do not receive those bonuses.
The v1.3.2 reference describes the attack bonus as range 0–1, but the normal
range-0 attack prohibition still applies unless another effect permits that
attack.

## Obstacles

Standard setup uses six obstacles. The exact effect depends on obstacle type.
For the initial asteroid-and-debris implementation:

- after a ship moves through or overlaps an asteroid, it rolls one attack die;
  a normal hit deals one normal damage and a critical hit deals one critical
  damage; after executing the maneuver it skips its Perform Action step; while
  at range 0 of the asteroid it cannot attack;
- after a ship moves through or overlaps a debris cloud, it gains one stress
  token, rolls one attack die, and suffers one critical damage on a critical
  result; it does not inherently skip its Perform Action step, but the gained
  stress normally prevents it from performing an action unless that stress is
  removed first; and
- an obstacle obstructing an attack grants the defender one additional defense
  die, regardless of how many obstacles obstruct it.

Gas clouds, electro-chaff clouds, environment cards, devices, and remotes need
their own reviewed semantic manifests before use.

## Ability timing and choices

An ability without “may” and without an `Action:` or `Attack:` header is
mandatory. “May” creates a player choice. Costs can be paid only if the effect
can resolve.

When multiple abilities trigger from the same event, use the ability queue:

1. game effects at the timing window resolve before player abilities;
2. players add their triggered abilities in player order;
3. each player chooses the order of their own simultaneous abilities; and
4. abilities triggered while resolving the queue are added according to the
   reference's queue rules.

Requirements are checked when adding an ability to the queue. Replacement
effects resolve at the timing of the effect they replace, and the replaced
effect is treated as not having occurred. Only one replacement can replace a
given effect.

Every optional timing window must become an explicit use-or-pass choice. The
engine cannot infer a preferred ability order from card display order.

## Digital information boundaries

| Information | Owner | Opponent |
| --- | --- | --- |
| Assigned maneuver before reveal | Exact maneuver | Assignment/commit state only |
| Ship position, facing, initiative, stats, and turret | Full | Full |
| Tokens, shields, charges, Force, upgrades, and conditions | Full | Full |
| Faceup damage | Full | Full |
| Facedown damage | Count and instance backs | Count and instance backs |
| Randomized damage-deck order | Hidden | Hidden |
| Dice and resolved choices | Full after resolution | Full after resolution |

This is a UI boundary in the proposed trusted-client architecture. It is not
cryptographic secrecy.

## Initial exclusions

The first playable slice does not silently implement:

- Atomic Mass Games' scenario play, road-style player order, current points,
  current ban list, or current tournament regulations;
- huge ships, Epic Battles, energy, wings, or range 4–5;
- environment cards, alternate play areas, multiplayer variants, or solo play;
- the full pilot and upgrade catalog; or
- tournament time limits, scoring, concessions, or intentional draws.

Each exclusion requires a named, sourced, versioned rules or content manifest
before it becomes playable.
