# Original generated artwork

Every visual file in `static/` is now raster artwork created specifically for
this project with OpenAI's built-in image-generation tool on August 19–20,
2026. The previous authored SVG icon, maneuver, obstacle-mask, ship-base, and
application-icon files have been removed.

Generated pixels are presentation only. Rules values, names, directions,
states, collision outlines, arcs, guides, ranges, and accessible labels remain
semantic HTML or versioned game/geometry data. No generated pixel can decide a
legal move or ruling.

The artwork does not reuse published illustrations, logos, faction emblems,
miniature photographs, card frames, glyphs, or trade dress.

## Review inventory

### Battlefield and component art

| File | Purpose | Size |
| --- | --- | --- |
| [`static/assets/starfield.webp`](static/assets/starfield.webp) | Quiet full-bleed battlefield background | 1536×1024 |
| [`static/assets/maneuver-dial-back.webp`](static/assets/maneuver-dial-back.webp) | Circular hidden maneuver dial | 768×768 |
| [`static/assets/damage-card-back.webp`](static/assets/damage-card-back.webp) | Shared facedown damage-card art | 768×1096 |
| [`static/assets/ships/t65-x-wing.webp`](static/assets/ships/t65-x-wing.webp) | Original overhead T-65 illustration | 768×768 |
| [`static/assets/ships/tie-ln-fighter.webp`](static/assets/ships/tie-ln-fighter.webp) | Original overhead TIE/ln illustration | 768×768 |
| [`static/assets/bases/small-base.png`](static/assets/bases/small-base.png) | Decorative small-base treatment | 768×768 |
| [`static/icon.png`](static/icon.png) | Generated application icon | 512×512 |

### Generated obstacle art

These six complete obstacle illustrations replace the former full-bleed
textures plus SVG clipping masks. Their visible silhouettes are decorative;
canonical collision polygons will live in versioned geometry data.

| Asteroids | Debris clouds |
| --- | --- |
| [`asteroid-01.png`](static/assets/obstacles/asteroid-01.png) | [`debris-cloud-01.png`](static/assets/obstacles/debris-cloud-01.png) |
| [`asteroid-02.png`](static/assets/obstacles/asteroid-02.png) | [`debris-cloud-02.png`](static/assets/obstacles/debris-cloud-02.png) |
| [`asteroid-03.png`](static/assets/obstacles/asteroid-03.png) | [`debris-cloud-03.png`](static/assets/obstacles/debris-cloud-03.png) |

Each obstacle is 418×500.

### Generated maneuver art

The dial manifest supplies bearing, speed, direction, difficulty, and labels.
These files are decorative pictures for those semantic choices:

- [`straight.png`](static/assets/maneuvers/straight.png)
- [`bank-left.png`](static/assets/maneuvers/bank-left.png)
- [`bank-right.png`](static/assets/maneuvers/bank-right.png)
- [`turn-left.png`](static/assets/maneuvers/turn-left.png)
- [`turn-right.png`](static/assets/maneuvers/turn-right.png)
- [`koiogran.png`](static/assets/maneuvers/koiogran.png)
- [`stationary.png`](static/assets/maneuvers/stationary.png)

Each maneuver image is 440×440.

### Generated dice and action art

The reducer supplies the result/action identity and accessible name. Generated
art decorates that state:

| Dice results | Public actions |
| --- | --- |
| [`die-blank.png`](static/assets/icons/die-blank.png) | [`action-focus.png`](static/assets/icons/action-focus.png) |
| [`die-focus.png`](static/assets/icons/die-focus.png) | [`action-evade.png`](static/assets/icons/action-evade.png) |
| [`die-hit.png`](static/assets/icons/die-hit.png) | [`action-lock.png`](static/assets/icons/action-lock.png) |
| [`die-critical.png`](static/assets/icons/die-critical.png) | [`action-barrel-roll.png`](static/assets/icons/action-barrel-roll.png) |
| [`die-evade.png`](static/assets/icons/die-evade.png) | [`action-boost.png`](static/assets/icons/action-boost.png) |

Dice images are 354×354. Action images are 354×400 except the independently
generated barrel-roll image, which is 354×354.

### Generated token art

- [`token-shield.png`](static/assets/icons/token-shield.png)
- [`token-force.png`](static/assets/icons/token-force.png)
- [`token-charge.png`](static/assets/icons/token-charge.png)
- [`token-stress.png`](static/assets/icons/token-stress.png)
- [`token-ion.png`](static/assets/icons/token-ion.png)
- [`token-disarm.png`](static/assets/icons/token-disarm.png)
- [`token-critical.png`](static/assets/icons/token-critical.png)
- [`token-first-player.png`](static/assets/icons/token-first-player.png)

Each token image is 312×312. Focus and evade state reuse their matching action
art with distinct semantic labels where the UI requires a token rather than an
action.

## Runtime-rendered rules layers

Static generated pictures are deliberately not used for these sources of truth:

| Rules layer | Runtime source of truth |
| --- | --- |
| Maneuver-dial faces | Versioned ship-dial entries rendered as accessible controls; generated maneuver art is decorative. |
| Maneuver templates and range ruler | Canonical fixed-point geometry with visible speed, bearing, range, and text labels. |
| Ship bases, guides, arcs, bullseye, and firing overlays | Canonical base pose and geometry; `small-base.png` may decorate the base interior. |
| Ship, pilot, upgrade, condition, and damage-card fronts | Reviewed manifests rendered as semantic HTML; never generated pseudo-text. |
| Attack and defense dice | Seeded die identities plus text; generated dice art is a redundant visual. |
| Status markers | Reducer state plus text/non-color treatment; generated token art is a redundant visual. |
| Obstacle collision boundaries | Versioned deterministic polygons independent of the generated obstacle silhouette. |
| Movement, attack, damage, and destruction effects | Derived animation that can be disabled and never enters canonical state. |

## Shared art direction

- Restrained, tactile science-fiction tabletop art.
- Near-black graphite and midnight-navy foundations.
- Muted cyan and warm amber for navigation and interaction.
- Muted crimson and burnt orange for attacks and damage.
- Strict overhead views for physical components.
- Strong silhouettes that remain readable when reduced.
- No baked-in text, numerals, watermarks, logos, faction emblems, copied
  publisher iconography, card frames, or trade dress.

## Generation prompts

The accepted files were generated with the built-in image tool. Multi-icon
requests produced one source sheet; the accepted sheet was visually reviewed
and mechanically cropped into the individual PNG files listed above.

### Dice results

```text
Use case: stylized-concept
Asset type: browser tabletop game dice-result icon atlas
Primary request: five original science-fiction dice-result icons arranged in one perfectly even horizontal row: empty result, focused eye, impact burst, critical electrical fracture, defensive evade shield
Style/medium: premium painted tabletop UI icons, tactile enamel inlay on dark circular tokens, strong simple silhouettes readable at 48 pixels
Composition/framing: exact 5-column by 1-row atlas, square cells, one centered icon per cell, equal margins and scale, no dividers crossing icons
Color palette: graphite and midnight navy tiles; muted crimson and burnt orange for attack; muted cyan for defense; off-white highlights
Constraints: exactly five icons; no text, letters, numerals, logos, faction emblems, copied game glyphs, extra icons, pseudo-text, or watermark; each icon must be visually distinct
```

### Public actions

```text
Use case: stylized-concept
Asset type: browser tabletop game action icon atlas
Primary request: five original tactical action icons arranged in one perfectly even horizontal row: focused sensor eye, evasive chevrons, target lock reticle, lateral barrel roll, forward boost
Style/medium: premium painted tabletop UI icons, tactile cyan enamel inlay on dark round tokens, strong simple silhouettes readable at 48 pixels
Composition/framing: exact 5-column by 1-row atlas, square cells, one centered icon per cell, equal margins and scale
Color palette: graphite, midnight navy, muted cyan, tiny warm amber active accents
Constraints: exactly five icons; no text, letters, numerals, logos, faction emblems, copied game glyphs, extra icons, pseudo-text, or watermark
```

The sheet's fourth icon did not communicate a barrel roll clearly enough, so
that one file was replaced with this targeted generation:

```text
Use case: stylized-concept
Asset type: browser tabletop game action icon
Primary request: one original lateral barrel-roll action symbol: a small abstract rectangular starfighter-base silhouette in the center, with one bold curved arrow moving left above it and one bold curved arrow moving right below it
Style/medium: premium painted tabletop UI icon, tactile muted-cyan enamel inlay on a dark circular graphite token, strong simple silhouette readable at 48 pixels
Composition/framing: square canvas, one centered round token, balanced horizontal motion, generous margin
Color palette: graphite, midnight navy, muted cyan, tiny warm amber accents
Constraints: exactly one icon; arrows must clearly communicate sideways repositioning rather than turning or forward flight; no text, letters, numerals, logos, emblems, recognizable spacecraft, official game glyphs, pseudo-text, or watermark
```

### Status tokens

```text
Use case: stylized-concept
Asset type: browser tabletop game status-token icon atlas
Primary request: eight original tactical status icons in a perfectly even 4-column by 2-row grid, ordered left-to-right: shield, energy charge, lightning charge, stress pulse; ionized atom, disabled weapon, critical fracture, first-player navigation beacon
Style/medium: premium painted tabletop UI icons, tactile enamel inlay on dark round tokens, strong simple silhouettes readable at 48 pixels
Composition/framing: exact 4-column by 2-row atlas, square cells, one centered icon per cell, equal margins and scale
Color palette: graphite and midnight navy with muted cyan, warm amber, muted crimson and off-white accents
Constraints: exactly eight icons; no text, letters, numerals, logos, faction emblems, copied game glyphs, extra icons, pseudo-text, or watermark
```

### Maneuvers

```text
Use case: stylized-concept
Asset type: browser tabletop game maneuver-symbol atlas
Primary request: seven original luminous flight-path symbols arranged in a perfectly even 4-column by 2-row grid; top row straight, gentle bank left, gentle bank right, hard turn left; bottom row hard turn right, forward path ending in a U-turn, stationary ring, and the final eighth cell intentionally empty
Style/medium: premium painted tabletop UI symbols, bold rounded cyan path with a warm amber arrowhead on dark circular instrument tiles, strong silhouette readable at 48 pixels
Composition/framing: exact 4-column by 2-row atlas, square cells, one centered symbol per occupied cell, equal margins and line weights
Color palette: graphite, midnight navy, muted cyan, warm amber
Constraints: exactly seven symbols and one empty lower-right tile; no text, letters, numerals, logos, faction emblems, copied game glyphs, extra arrows, pseudo-text, or watermark
```

### Obstacles

```text
Use case: stylized-concept
Asset type: browser tabletop game obstacle-silhouette atlas
Primary request: six distinct original space-obstacle silhouettes arranged in a perfectly even 3-column by 2-row grid; top row three irregular asteroid silhouettes, bottom row three dispersed wreckage-cloud silhouettes
Style/medium: premium painted tabletop token silhouettes with tactile graphite edges and restrained internal cyan rim light, seen exactly from above
Composition/framing: exact 3-column by 2-row atlas, square cells, one centered complete silhouette per cell, generous equal margins; asteroid contours rounded and rocky, debris contours spiky and dispersed
Color palette: near-black, graphite, cool gray, faint muted cyan and tiny rust accents
Constraints: exactly six silhouettes; no text, letters, numerals, ships, recognizable franchise parts, logos, faction emblems, copied official obstacle shapes, extra objects, pseudo-text, or watermark; decorative only, not collision geometry
```

### Small base

```text
Use case: stylized-concept
Asset type: browser tabletop game small ship-base artwork
Primary request: one original square small-starfighter tabletop base viewed exactly from above, with a recessed center mount, subtle forward guide notches, fine angular paneling, and restrained decorative arc inlays
Style/medium: premium tactile board-game component, painted graphite metal and screen-printed details
Composition/framing: square canvas, strict orthographic top-down, one complete square base centered with generous dark margin, symmetrical around its forward axis
Color palette: graphite, midnight navy, muted cyan, tiny warm amber accents
Constraints: no ship, text, letters, numerals, logo, faction emblem, copied official base graphics, measurement marks, pseudo-text, or watermark; decorative only, not a rules diagram
```

### Application icon

```text
Use case: logo-brand
Asset type: application icon
Primary request: an original abstract tactical-flight app icon formed from a compact four-point navigation spark inside a circular targeting instrument
Style/medium: richly painted game-app icon, tactile enamel and brushed metal, simple strong silhouette
Composition/framing: centered square icon with softly rounded dark background, generous padding, readable at 32 pixels
Color palette: midnight navy, graphite, muted cyan, warm amber center
Constraints: no text, letters, logos, franchise emblems, recognizable spacecraft, official iconography, mockup device, border outside the square, or watermark
```

### Battlefield background

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

### Hidden maneuver dial

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

### Damage-card back

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

### Ships

Both ship images used this shared prompt with the file-specific subject below:

```text
Use case: stylized-concept
Asset type: browser tabletop game ship-token illustration
Scene/backdrop: quiet near-black starfield matching a tactical play mat
Style/medium: detailed hand-painted tabletop miniature illustration, realistic materials, original rendering rather than copied product photography
Composition/framing: square canvas, strict orthographic top-down view, centered, complete ship with generous clearance around every edge
Constraints: one ship only; no base; no card frame; no text; no logos; no faction emblem; no watermark
Avoid: cockpit-level camera, cropped wings, battle scene, laser fire, extra ships
```

| File | Subject addition |
| --- | --- |
| `ships/t65-x-wing.webp` | One complete T-65 X-wing directly overhead with its nose pointing up, separated S-foils, narrow fuselage, cockpit, four engine nozzles, worn off-white hull, muted red panels, graphite mechanics, and restrained engine glow; recognizable type without copying an official illustration or miniature photograph. |
| `ships/tie-ln-fighter.webp` | One complete TIE/ln fighter directly above its dorsal side, nose pointing up, top hatch visible, front viewport hidden, two vertical hexagonal solar panels, graphite and cool gray-blue materials; no frontal or three-quarter perspective. |

The six obstacle WebP textures were removed when the generated complete
obstacle illustrations replaced their SVG masks.

## Processing and acceptance

- Built-in generated PNG sources were visually inspected before selection.
- Source sheets were center-cropped into named files without repainting or
  tracing them; the application icon and base were resized to their delivery
  dimensions.
- The generated dial attempt that returned a checkerboard painted into opaque
  RGB pixels was rejected. The accepted existing generated dial remains.
- All delivered PNGs are opaque by design. UI backgrounds and canonical
  geometry provide clipping or contrast where required.
- Generated icons must always be accompanied by text or accessible labels.
- Visual review must include the 4K tabletop, both seated orientations, and the
  private phone surface before an asset becomes gameplay-critical decoration.

## Required after the teaching duel

Broader content will need newly generated ship art and decorative treatments
for each explicitly reviewed manifest: additional bases, turrets, devices,
remotes, docking, huge ships, scenario objectives, environment obstacles,
cards, sounds, effects, tutorial illustrations, and social-preview artwork.
No visual family is fabricated before its rules/content boundary exists.
