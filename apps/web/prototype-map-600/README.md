# Map prototype for issue 600 (throwaway, branch `prototype/map-600` only)

Three structurally different map ideas for the Wayfinder decision
“Choose the web and iPhone map experience for the focused launch”.
No accounts, no network, no persistence — all state lives in memory.

- **A — Split explorer:** checklist beside the map (tabs on narrow screens).
- **B — Full map + sheet:** full-bleed map with a resizable bottom sheet.
- **C — Queue journal:** journal-first with an “up next” queue and a map rail.

## Run (Bun only, no install)

```sh
bun ./apps/web/prototype-map-600/server.ts
```

Then open:

- http://localhost:4627/?variant=A
- http://localhost:4627/?variant=B
- http://localhost:4627/?variant=C

Or double-click `index.html` (needs `fells.js` beside it).

## Try

Desktop and iPhone widths (responsive at 720px). Search, area and
bagged/not-bagged filters drive both list and map. Click pins and rows
to see map/checklist transitions. “◎ Locate” uses a simulated Ambleside
fix — switch the location dropdown to preview denied/unavailable.
“Simulate lost connection” shows the offline banner; Reconnect clears it.
The dark state strip shows live prototype state; Reset restores the seed.

Terrain is hand-drawn schematic SVG and GPS is simulated — neither is a
supplier decision. Catalogue is the real 214-fell dataset with real
coordinates (`fells.js`, generated from `packages/catalog`).
