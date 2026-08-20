# Tabletop teaching duel

One shared 4K table pairs two private hands, keeps both dial values off the public surface, resolves deterministic movement and dice in public, and replays the immutable event history.

## Private planning is ready on the owning phones

### Shared 4K tabletop

![Private planning is ready on the owning phones - Shared 4K tabletop - macOS development baseline](./screenshots/000-private-planning-ready-table-4k.png)

[Open full-size macOS development baseline](./screenshots/000-private-planning-ready-table-4k.png)

![Private planning is ready on the owning phones - Shared 4K tabletop - Linux CI baseline](./screenshots/000-private-planning-ready-table-4k-linux.png)

[Open full-size Linux CI baseline](./screenshots/000-private-planning-ready-table-4k-linux.png)

### Rebel private hand

![Private planning is ready on the owning phones - Rebel private hand - macOS development baseline](./screenshots/000-private-planning-ready-rebel-phone.png)

[Open full-size macOS development baseline](./screenshots/000-private-planning-ready-rebel-phone.png)

![Private planning is ready on the owning phones - Rebel private hand - Linux CI baseline](./screenshots/000-private-planning-ready-rebel-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/000-private-planning-ready-rebel-phone-linux.png)

### Imperial private hand

![Private planning is ready on the owning phones - Imperial private hand - macOS development baseline](./screenshots/000-private-planning-ready-imperial-phone.png)

[Open full-size macOS development baseline](./screenshots/000-private-planning-ready-imperial-phone.png)

![Private planning is ready on the owning phones - Imperial private hand - Linux CI baseline](./screenshots/000-private-planning-ready-imperial-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/000-private-planning-ready-imperial-phone-linux.png)

**Verifications:**

- [x] The shared table shows Planning without any dial-selection control
- [x] The Rebel hand exposes one Red Five dial and no Imperial ships
- [x] The Imperial hand exposes two own dials and no Rebel ship
- [x] All three production surfaces are error-free

## Commitment reveals only the active ship on the table

### Shared 4K tabletop

![Commitment reveals only the active ship on the table - Shared 4K tabletop - macOS development baseline](./screenshots/001-commitment-and-public-reveal-table-4k.png)

[Open full-size macOS development baseline](./screenshots/001-commitment-and-public-reveal-table-4k.png)

![Commitment reveals only the active ship on the table - Shared 4K tabletop - Linux CI baseline](./screenshots/001-commitment-and-public-reveal-table-4k-linux.png)

[Open full-size Linux CI baseline](./screenshots/001-commitment-and-public-reveal-table-4k-linux.png)

### Rebel private hand

![Commitment reveals only the active ship on the table - Rebel private hand - macOS development baseline](./screenshots/001-commitment-and-public-reveal-rebel-phone.png)

[Open full-size macOS development baseline](./screenshots/001-commitment-and-public-reveal-rebel-phone.png)

![Commitment reveals only the active ship on the table - Rebel private hand - Linux CI baseline](./screenshots/001-commitment-and-public-reveal-rebel-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/001-commitment-and-public-reveal-rebel-phone-linux.png)

### Imperial private hand

![Commitment reveals only the active ship on the table - Imperial private hand - macOS development baseline](./screenshots/001-commitment-and-public-reveal-imperial-phone.png)

[Open full-size macOS development baseline](./screenshots/001-commitment-and-public-reveal-imperial-phone.png)

![Commitment reveals only the active ship on the table - Imperial private hand - Linux CI baseline](./screenshots/001-commitment-and-public-reveal-imperial-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/001-commitment-and-public-reveal-imperial-phone-linux.png)

**Verifications:**

- [x] Both phones seal the dial values and contain no reveal or action controls
- [x] The table names the active ship and offers direct battlefield reveal
- [x] No hidden maneuver value is rendered on the shared table

## Movement and deterministic dice resolve on the public table

### Shared 4K tabletop

![Movement and deterministic dice resolve on the public table - Shared 4K tabletop - macOS development baseline](./screenshots/002-public-deterministic-attack-table-4k.png)

[Open full-size macOS development baseline](./screenshots/002-public-deterministic-attack-table-4k.png)

![Movement and deterministic dice resolve on the public table - Shared 4K tabletop - Linux CI baseline](./screenshots/002-public-deterministic-attack-table-4k-linux.png)

[Open full-size Linux CI baseline](./screenshots/002-public-deterministic-attack-table-4k-linux.png)

### Rebel private hand

![Movement and deterministic dice resolve on the public table - Rebel private hand - macOS development baseline](./screenshots/002-public-deterministic-attack-rebel-phone.png)

[Open full-size macOS development baseline](./screenshots/002-public-deterministic-attack-rebel-phone.png)

![Movement and deterministic dice resolve on the public table - Rebel private hand - Linux CI baseline](./screenshots/002-public-deterministic-attack-rebel-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/002-public-deterministic-attack-rebel-phone-linux.png)

### Imperial private hand

![Movement and deterministic dice resolve on the public table - Imperial private hand - macOS development baseline](./screenshots/002-public-deterministic-attack-imperial-phone.png)

[Open full-size macOS development baseline](./screenshots/002-public-deterministic-attack-imperial-phone.png)

![Movement and deterministic dice resolve on the public table - Imperial private hand - Linux CI baseline](./screenshots/002-public-deterministic-attack-imperial-phone-linux.png)

[Open full-size Linux CI baseline](./screenshots/002-public-deterministic-attack-imperial-phone-linux.png)

**Verifications:**

- [x] All three ships moved through canonical speed-three geometry before combat
- [x] The table applies the range-one bonus and presents labeled attack and defense dice
- [x] Both phones remain public-control-free waiting surfaces during combat
- [x] The complete multi-surface story has no browser or asset error

## The accepted event history can be replayed at every prefix

### Public event replay

![The accepted event history can be replayed at every prefix - Public event replay - macOS development baseline](./screenshots/003-immutable-replay-replay.png)

[Open full-size macOS development baseline](./screenshots/003-immutable-replay-replay.png)

![The accepted event history can be replayed at every prefix - Public event replay - Linux CI baseline](./screenshots/003-immutable-replay-replay-linux.png)

[Open full-size Linux CI baseline](./screenshots/003-immutable-replay-replay-linux.png)

**Verifications:**

- [x] Replay opens at the complete immutable prefix with previous and next navigation
- [x] Stepping backward changes only the replay projection
- [x] Replay remains free of browser and asset errors
