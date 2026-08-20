# Application shell and deployment

The static X-Wing client loads, hydrates, and serves the original dial and ship
artwork at phone and desktop sizes.

## The flight console is ready

The Playwright report attaches one deterministic screenshot per viewport after
the semantic checks pass.

**Verifications:**

- [x] The page exposes the stable X-Wing title and primary heading.
- [x] Client hydration changes the live status to “Flight console ready.”
- [x] The foundation scope, documentation links, GPL license, and deterministic
  build marker are visible.
- [x] The circular dial, T-65, and TIE artwork load with nonzero dimensions.
- [x] No browser error, failed request, or horizontal overflow is present.
