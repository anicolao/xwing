# Original artwork

The files in `static/assets/` were generated specifically for this project with
OpenAI's built-in image-generation tool on August 19, 2026. They do not reuse
published *Star Wars: X-Wing* illustrations, logos, faction emblems, miniature
renders, card frames, or trade dress.

Rules values, names, directions, states, and accessible labels must remain
semantic HTML or game data. Artwork is never the sole carrier of information.

## Inventory

| File | Dimensions | Intended use |
| --- | ---: | --- |
| `static/assets/starfield.webp` | 1536×1024 | Full-bleed battlefield and application background |
| `static/assets/maneuver-card-back.webp` | 768×1152 | Hidden maneuver/dial or generic hidden-information texture |
| `static/assets/damage-card-back.webp` | 768×1096 | Facedown damage-card texture |

The generated PNG sources were visually reviewed, resized where appropriate,
and converted to WebP at quality 84 for the browser. All three deliverables are
opaque. Consumers should crop them with CSS rather than assume transparent
padding. The two portrait images are textures, not complete card layouts;
borders, labels, state, and interaction affordances belong in accessible UI
code.

## Shared art direction

- Restrained, tactile science-fiction game art.
- Near-black graphite and midnight navy foundations.
- Muted cyan and warm amber for navigational information.
- Muted crimson and burnt orange for damage.
- No text, numerals, watermarks, logos, emblems, recognizable ships, or
  franchise-specific symbols.

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

### `maneuver-card-back.webp`

```text
Use case: stylized-concept
Asset type: browser tabletop game ship-card back texture
Primary request: an original full-bleed card-back illustration for hidden starfighter maneuver information
Scene/backdrop: dark navy technical star chart with fine orbital curves, subtle grid ticks, and abstract instrument markings
Subject: centered abstract four-point navigation reticle made only from simple geometric lines, not a logo or faction emblem
Style/medium: refined screen-printed science-fiction game graphic, tactile ink and paper grain
Composition/framing: portrait card ratio, perfectly centered, symmetrical, strong edge-to-edge design with a safe inner margin
Lighting/mood: quiet, tactical, precise
Color palette: midnight navy, muted cyan, small warm amber accents
Constraints: no text; no numerals; no logos; no recognizable franchise iconography; no official card layout; no ships; no watermark
Avoid: Star Wars title typography, Rebel or Imperial symbols, bright white border, mockup photography
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

## Review notes

The built-in generator was also asked for transparent asteroid and debris
cutouts. The returned PNGs had an opaque checkerboard rather than a real alpha
channel, so those outputs were rejected and are not part of this repository.
Obstacle silhouettes should remain semantic vector geometry until suitable
original transparent artwork is generated and independently alpha-checked.

Before shipping these assets, review them in the actual UI at phone, tablet,
and desktop sizes. Dark textures need a tested contrast overlay beneath text,
focus rings, arcs, rulers, and status markers.
