# Company Brief — Fells Journal (Wainwright Tracker)

## One-line summary

**Fells Journal** is a map-first web app that helps walkers track, remember, and share progress on all **214 Wainwright fells** in England’s Lake District — turning a paper tick-list into a synced field journal with notes, photos, and albums.

---

## What problem it solves

Completing Alfred Wainwright’s 214 fells is a long, personal challenge. Many people still use spreadsheets, paper lists, or generic hiking apps that don’t understand Wainwright-specific context (book order, areas, grid references, the “round” as a whole).

Fells Journal is built for that niche: **one authoritative list, one Lake District map, one journal** — so baggers can plan ridges, log summits with context from the day, and look back at their round as it grows.

---

## Product identity

| | |
|---|---|
| **Consumer brand** | Fells Journal |
| **Technical / PWA name** | Wainwright Tracker |
| **Tagline (marketing)** | *Your Wainwright field journal, on the map* |
| **Domain concept** | Editorial, journal-like UX — not a generic fitness tracker |

The public site (`/`) sells the product; the signed-in experience lives at `/app`.

---

## Target users

- **Wainwright baggers** — anyone working through (or finished) the 214 fells from Wainwright’s Pictorial Guides.
- **Casual Lakeland walkers** who want a beautiful map and a simple way to record which fells they’ve done.
- **Social walkers** who want to follow friends’ progress (optional public profiles).

---

## Core product — the tracker (`/app`)

Authenticated users get a **map-first journal** for all 214 peaks.

### Interactive map

- **MapLibre GL** map centred on the Lake District.
- Base style from **OpenFreeMap**; optional **OpenTopoMap** terrain overlay.
- Every Wainwright plotted with coordinates, height, grid reference, and **area** (one of seven regions, e.g. Western, Northern).
- Click a summit on the map or in the list to focus it; search by name, grid reference, or area.
- Filter by area and completion state (all / todo / done).
- Height display in metres or feet (user preference, persisted locally).

### Completions & journal

- Mark fells as **done** with optional **completion date**, **notes**, and up to **two photos per fell** (client-side compression before upload).
- Progress is stored per user in **Convex** (`userProgress` table) and syncs across devices after sign-in.
- Legacy **localStorage** support for anonymous/offline-first completion IDs (migration path into the cloud journal).
- **Journal** sidebar: sortable list of all fells (e.g. by book number, height, name, completion status).

### Albums & export

- Completions are grouped into **chronological albums** (by completion date) — “chapters” of walking years.
- **Print / export** flow for album chapters (built for sharing or keeping a physical record).

### Bulk import

- Paste or upload existing lists (CSV-like text, spreadsheets via parsing).
- **AI-assisted matching** (Vercel AI Gateway) maps messy peak names to the canonical 214 IDs; user reviews ambiguous rows before applying.
- Convex action caps import size for safety (e.g. 150 lines).

### Social (optional)

- **User profiles** with display name, visibility (`public` / `private`), onboarding.
- **Search** for other baggers (public profiles only).
- **Follow** other users and view their progress summaries (Convex `follows` + `userProfiles`).
- Profiles default to **private** until the user opts in.

### Offline & installable

- **Progressive Web App** (Vite PWA plugin): installable on phone/desktop, `start_url` `/app`.
- **Service worker** caches app shell, map tiles (OpenFreeMap + OpenTopoMap), and fonts.
- Optional **offline topo download** for the Lake District region when signal is poor on the hill.

---

## Marketing site

| Route | Purpose |
|-------|---------|
| `/` | Landing page — hero, features, how it works, CTA to sign up |
| `/blog` | Fells Journal blog index |
| `/blog/:slug` | Individual posts (content in `src/content/blog/posts.ts`) |

Marketing components: shared header/footer, Clerk sign-in/sign-up modals, links into `/app` when authenticated.

---

## Data & attribution

- All **214 Wainwrights** ship as static TypeScript data (`src/data/wainwrights.ts`).
- Source: [thomaswilsonxyz/wainwright-peaks](https://github.com/thomaswilsonxyz/wainwright-peaks) (CC BY 4.0), derived from **The Database of British and Irish Hills** v17.4.
- Book numbering follows **wainwrights.info** ordering by Pictorial Guide volume.
- Map attribution in-app: OpenFreeMap, OpenMapTiles, OpenStreetMap, OpenTopoMap.

---

## Technology stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite 8 |
| Routing | React Router 7 (`/`, `/blog`, `/app`, design previews `/1`–`/5`) |
| UI | Tailwind CSS 4, shadcn-style Radix components, Geist variable font |
| Map | MapLibre GL |
| Auth | Clerk (`@clerk/clerk-react`) |
| Backend / sync | Convex (queries, mutations, file storage for photos) |
| AI | Vercel AI SDK + AI Gateway (bulk import peak matching) |
| PWA | vite-plugin-pwa / Workbox |
| Package manager | pnpm |

Environment variables (required): `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`; Convex backend uses Clerk for auth and optionally `AI_GATEWAY_API_KEY` for imports.

---

## Business model (current state)

The codebase is a **product MVP / polished tracker** — no payments, subscriptions, or ads are implemented. Monetisation, hosting, and go-to-market are **not encoded in the repo**; the brief assumes a freemium or free-with-accounts model is the natural next conversation.

---

## Competitive positioning (informal)

Unlike Strava or OS Maps alone, Fells Journal is **Wainwright-native**: fixed canon of 214, book order, areas, bagger social graph, and journal semantics (albums, import, print). Unlike a spreadsheet, it is **map-first, mobile-installable, and photo-aware**.

---

## Internal / design assets

Routes `/1` through `/5` are **standalone design-system experiments** (Ordnance, Wordsworth, Nightridge, Alpenglow, Bagger) — visual language explorations, not user-facing product flows.

---

## How to run locally

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (typically `http://127.0.0.1:5173/`). Sign in via Clerk to use `/app` with live Convex sync.

---

## Summary for stakeholders

**Fells Journal** is a specialised Lake District walking product: track every Wainwright on an interactive map, enrich each tick with notes and photos, organise your history into albums, optionally follow other baggers, and use it offline on the fells. It combines open hill data, modern web maps, and a synced backend so the Wainwright round feels like a proper journal — not a forgotten spreadsheet.
