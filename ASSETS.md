# Original artwork

The files in `static/assets/` were generated specifically for this project with
OpenAI's built-in image-generation tool on August 19, 2026. They do not reuse
published *Star Wars: X-Wing* illustrations, logos, faction emblems, miniature
renders, card frames, or trade dress.

Rules values, names, directions, states, and accessible labels must remain
semantic HTML or game data. Artwork is never the sole carrier of information.

## Required asset inventory

The first playable slice is the fixed Second Edition Core Set teaching duel
defined in [VISION.md](VISION.md). Every visual class required by that slice is
listed below. “Raster” means original generated illustration. “SVG” means an
original deterministic symbol or geometry asset. “Runtime” means rules data
rendered by accessible HTML, CSS, SVG, or canvas and must not be baked into an
image.

### Generated raster artwork

| File | Required instance | Purpose | Size | Status |
| --- | --- | --- | --- | --- |
| `static/assets/starfield.webp` | Play area | Quiet full-bleed battlefield background | 1536×1024 | Complete |
| `static/assets/maneuver-dial-back.webp` | Maneuver dial | Circular hidden-dial texture, cropped to a circle by the UI | 768×768 | Complete |
| `static/assets/damage-card-back.webp` | Damage deck | Shared facedown damage-card texture | 768×1096 | Complete |
| `static/assets/ships/t65-x-wing.webp` | T-65 X-wing | Original top-down ship illustration, clipped inside its semantic base | 768×768 | Complete |
| `static/assets/ships/tie-ln-fighter.webp` | TIE/ln fighter | Original top-down ship illustration, reused with accessible ship IDs | 768×768 | Complete |
| `static/assets/obstacles/asteroid-01.webp` | Asteroid 1 | Rocky surface artwork clipped by obstacle mask 1 | 768×768 | Complete |
| `static/assets/obstacles/asteroid-02.webp` | Asteroid 2 | Rocky surface artwork clipped by obstacle mask 2 | 768×768 | Complete |
| `static/assets/obstacles/asteroid-03.webp` | Asteroid 3 | Rocky surface artwork clipped by obstacle mask 3 | 768×768 | Complete |
| `static/assets/obstacles/debris-cloud-01.webp` | Debris cloud 1 | Wreckage artwork clipped by obstacle mask 1 | 768×768 | Complete |
| `static/assets/obstacles/debris-cloud-02.webp` | Debris cloud 2 | Wreckage artwork clipped by obstacle mask 2 | 768×768 | Complete |
| `static/assets/obstacles/debris-cloud-03.webp` | Debris cloud 3 | Wreckage artwork clipped by obstacle mask 3 | 768×768 | Complete |

Raster files are opaque WebP images. The ship and obstacle illustrations are
decorative fills: their pixels never determine position, collision, range,
arc, obstruction, or identity.

### Deterministic SVG assets

| File | Contents | Status |
| --- | --- | --- |
| `static/assets/game-icons.svg` | Original attack, defense, action, shield, Force, charge, stress, ion, disarm, lock, and first-player symbols | Complete |
| `static/assets/maneuver-symbols.svg` | Straight, bank, turn, Koiogran-turn, and stationary arrows used by the Core Set dials | Complete |
| `static/assets/obstacle-masks.svg` | Three original asteroid and three original debris-cloud silhouettes | Complete |
| `static/assets/ship-bases.svg` | Small-base outline, guides, front arc, bullseye, center line, and ID sockets | Complete |

SVG symbols use original geometry rather than tracing the publisher's glyphs.
Every consuming control still needs an accessible name and visible text or
tooltip.

### Runtime-rendered assets

These are required, but a static image would be the wrong implementation:

| Asset class | Runtime source of truth |
| --- | --- |
| Maneuver-dial faces | Versioned ship-dial data plus `maneuver-symbols.svg`; the hidden side uses `maneuver-dial-back.webp` |
| Maneuver templates and range ruler | Canonical fixed-point geometry with speed, bearing, range, and accessible labels |
| Ship bases, arcs, guides, and firing overlays | Canonical base pose and geometry, decorated by `ship-bases.svg` |
| Ship, pilot, upgrade, quick-build, condition, and damage-card fronts | Reviewed manifests rendered as semantic HTML; no generated pseudo-text |
| Attack and defense dice | Seeded die results rendered with `game-icons.svg` and text equivalents |
| Shields, charges, Force, locks, stress, ion, disarm, focus, evade, and critical markers | Reducer state rendered with `game-icons.svg`, color, shape, and text |
| Ship IDs and first-player marker | Player/ship state rendered as text plus non-color patterns |
| Obstacle collision boundaries | Versioned vector geometry from `obstacle-masks.svg`; raster texture is presentation only |
| Movement, attack, damage, and destruction effects | Derived animation that can be disabled; never canonical state |

### Required after the teaching duel

The broader Second Edition product also needs the following reviewed asset
families. They are deliberately not fabricated before their rules and content
manifests exist:

- original ship artwork for every enabled ship type across all seven factions;
- medium, large, and huge base geometry and corresponding arc treatments;
- turret indicators, reinforce sectors, device templates, bombs, mines,
  remotes, docking markers, wings, energy, and range 4–5 rulers;
- gas clouds, electro-chaff clouds, environment obstacles, and scenario
  objectives;
- every additional action, status, upgrade-slot, restriction, charge, and
  condition symbol actually referenced by enabled content;
- faction-neutral card textures for ship, upgrade, condition, quick-build,
  scenario, environment, and huge-ship damage cards; and
- optional sound effects, reduced-motion-safe combat effects, tutorial
  illustrations, application icons, and social-preview artwork.

Each family becomes required only with an explicitly versioned content or
ruleset manifest. “Complete” never means inventing card text, maneuver data,
points, or official-looking art to fill a visual grid.

## Shared art direction

- Restrained, tactile science-fiction game art.
- Near-black graphite and midnight navy foundations.
- Muted cyan and warm amber for navigational information.
- Muted crimson and burnt orange for damage.
- No baked-in text, numerals, watermarks, logos, faction emblems, copied
  publisher iconography, card frames, or trade dress.
- Recognizable ship types appear only where the manifest calls for that game
  piece, using newly generated overhead artwork rather than published art or
  product photography.

## Generation prompts

### `starfield.webp`

```text
Use case: stylized-concept
Asset type: browser tabletop game play-surface background
Primary request: an original deep-space starfield for a tactical starfighter game
Scene/backdrop: sparse stars over near-black space, with faint dusty blue and muted rust-red nebula wisps kept near the outer edges
Subject: empty playable space, no craft or objects
Style/medium: refined cinematic matte painting, restrained and realistic, subtle grain
Composition/framing: wide landscape; dark quiet center with low contrast so game pieces and UI remain legible; no single focal point
Lighting/mood: cold, tense, expansive
Color palette: charcoal black, midnight blue, restrained cyan and rust accents
Constraints: tile-friendly edges; no text; no logos; no emblems; no recognizable franchise imagery; no planets; no ships; no watermark
Avoid: bright central nebula, lens flare, dense stars, copyrighted trade dress
```

### `maneuver-dial-back.webp`

```text
Use case: stylized-concept
Asset type: browser tabletop game maneuver dial back
Primary request: an original circular mechanical maneuver dial viewed directly from above, designed to conceal a secretly selected starfighter maneuver
Scene/backdrop: square full-bleed midnight-navy field that can be cropped to a circle by CSS
Subject: one large round layered instrument disc filling most of the square, concentric rings, radial tick marks, subtle recessed grip notches, and a small triangular pointer at the top edge
Style/medium: tactile screen-printed science-fiction board-game component, painted metal and paper grain
Composition/framing: perfectly top-down, centered, rotationally balanced, unmistakably circular; generous safe margin outside the disc
Lighting/mood: precise, tactical, subdued
Color palette: midnight navy, gunmetal, muted cyan, tiny warm amber accents
Constraints: no card shape; no rectangular card frame; no text; no numerals; no logos; no faction emblems; no ship silhouettes; no official iconography; no watermark
Avoid: portrait-card composition, playing card, compass rose with letters, readable pseudo-text
```

### `damage-card-back.webp`

```text
Use case: stylized-concept
Asset type: browser tabletop game damage-card back texture
Primary request: an original full-bleed card-back illustration suggesting starship hull damage
Scene/backdrop: dark graphite technical panel with abstract fractured armor plates and hairline circuitry
Subject: centered nonfigurative impact scar made from angular cracks and a restrained ember glow, with no recognizable vehicle
Style/medium: refined screen-printed science-fiction game graphic, tactile ink and paper grain
Composition/framing: portrait card ratio, symmetrical outer frame but organic central damage, edge-to-edge design with a safe inner margin
Lighting/mood: tense, damaged, controlled rather than explosive
Color palette: charcoal, gunmetal, muted crimson, small burnt-orange accents
Constraints: no text; no numerals; no logos; no faction emblems; no recognizable franchise iconography; no official card layout; no ships; no watermark
Avoid: gore, active explosion, bright white border, mockup photography
```

### Ship artwork

Both ships use this shared prompt structure:

```text
Use case: stylized-concept
Asset type: browser tabletop game ship-token illustration
Scene/backdrop: quiet near-black starfield matching a tactical play mat
Style/medium: detailed hand-painted tabletop miniature illustration, realistic materials, original rendering rather than copied product photography
Composition/framing: square canvas, strict orthographic top-down view, centered, complete ship with generous clearance around every edge
Constraints: one ship only; no base; no card frame; no text; no logos; no faction emblem; no watermark
Avoid: cockpit-level camera, cropped wings, battle scene, laser fire, extra ships
```

| File | Subject and art-direction addition |
| --- | --- |
| `ships/t65-x-wing.webp` | One complete T-65 X-wing, directly overhead with its nose pointing up. Four visibly separated S-foils form a clear X silhouette, each ending in a laser cannon; the narrow fuselage, cockpit, and four engine nozzles remain visible. Use a worn off-white hull, muted red panels, graphite mechanics, pale-cyan highlights, and restrained warm engine glow. Preserve the recognizable ship type without copying an official illustration or miniature photograph. |
| `ships/tie-ln-fighter.webp` | One complete TIE/ln fighter seen directly above its dorsal side, nose pointing up; the top hatch is visible, the front viewport is not, and the two hexagonal solar panels run vertically at left and right. Use graphite, gunmetal, and cool gray-blue panels; avoid frontal or three-quarter perspective. |

### Obstacle textures

Each obstacle prompt requested a directly overhead, uniformly lit, full-bleed,
opaque square material texture with no outer silhouette or space background. The
UI clips these textures with `obstacle-masks.svg`; this keeps collision geometry
precise and makes the same artwork usable at different scales.

```text
Use case: stylized-concept
Asset type: seamless source texture for a browser tabletop obstacle
Primary request: an original full-bleed top-down surface texture matching the file-specific material below
Scene/backdrop: the material fills the entire square; no space background and no isolated object
Style/medium: detailed hand-painted tabletop miniature texture, realistic but readable at token scale
Composition/framing: direct orthographic overhead view, even detail distribution, no outer silhouette
Lighting/mood: restrained overhead relief lighting without a cast shadow
Constraints: opaque full-bleed texture; no text; no border; no ships; no logos; no faction insignia; no recognizable franchise parts; no bodies; no watermark
Avoid: transparent background, checkerboard, isolated cutout, explosion, active fire
```

| File | Material addition |
| --- | --- |
| `obstacles/asteroid-01.webp` | Charcoal basalt plates, impact pits, chipped ridges, and restrained iron-rust seams. |
| `obstacles/asteroid-02.webp` | Cool-gray laminated stone, long branching fractures, shelves, craters, and steel-blue mineral bands; avoid a rusty palette. |
| `obstacles/asteroid-03.webp` | Dark porous carbonaceous rock, rounded cavities, dusty regolith, pale inclusions, and warm-gray veins; avoid lava. |
| `obstacles/debris-cloud-01.webp` | Dense generic wreckage made from bent gunmetal hull plates, torn ribs, fasteners, scorch marks, and frost dust. |
| `obstacles/debris-cloud-02.webp` | Snapped spars, twisted cable bundles, broken grilles, pipes, shattered dark panels, and fine particulate in graphite, steel blue, and muted copper. |
| `obstacles/debris-cloud-03.webp` | Hundreds of small angular metal fragments, ceramic shards, rivets, foil insulation, sparse struts, and gray dust in charcoal, dull silver, tiny amber, and faint blue. |

## Processing

The generated PNG sources were visually reviewed, resized to 768×768 where
needed, and encoded as opaque WebP at quality 84. The SVG files were authored
as code-native geometry and XML-validated. Generated pixels are decorative;
game data and deterministic geometry remain the source of truth.

## Review notes

The built-in generator was also asked for transparent asteroid and debris
cutouts. The returned PNGs had an opaque checkerboard rather than a real alpha
channel, so those outputs were rejected and are not part of this repository.
The accepted obstacle art is therefore deliberately full-bleed and opaque; the
six original paths in `obstacle-masks.svg` supply both the visible clipping
shape and the collision boundary.

Before shipping these assets, review them in the actual UI at phone, tablet,
and desktop sizes. Dark textures need a tested contrast overlay beneath text,
focus rings, arcs, rulers, and status markers.
