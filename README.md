# Wainwright Tracker

A polished map-first web app for tracking progress across the 214 classic Wainwright fells in the Lake District.

## Features

- Interactive MapLibre map with OpenFreeMap base style and OpenTopoMap terrain overlay
- All 214 Wainwrights with coordinates, height, grid reference, and map sector
- Click a fell on the map or list to focus it
- Mark fells as done; progress persists in browser local storage
- Search by name, grid reference, or sector
- Filter by sector and completion state
- Export/import progress as JSON
- Installable PWA with cached app shell and map tile runtime cache

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually <http://127.0.0.1:5173/>.

## Verify

```bash
npm run lint
npm run build
```

## Data attribution

Wainwright fell data is from [`thomaswilsonxyz/wainwright-peaks`](https://github.com/thomaswilsonxyz/wainwright-peaks), licensed CC BY 4.0, derived from The Database of British and Irish Hills v17.4, also CC BY 4.0.

Map data/style attribution appears in-app via MapLibre controls: OpenFreeMap, OpenMapTiles, OpenStreetMap, and OpenTopoMap.
