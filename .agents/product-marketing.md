# Product marketing context — Wainwrights Baggers

Last updated: 2026-05-22

## Product overview

**Wainwrights Baggers** (consumer brand also described as **Fells Journal** in `companybrief.md`) is a map-first web and mobile app for tracking progress across Alfred Wainwright’s **214 fells** in England’s Lake District. It turns a paper tick-list or spreadsheet into a synced field journal: map, checklist, completion dates, notes, photos, albums, optional social follows, and offline-friendly use on the hill.

## Category

Specialist **Wainwright / fell-bagging** tracker — not a generic fitness or navigation app.

## ICP and personas

1. **Active Wainwright bagger** — working through or finishing the 214; wants book order, areas, grid refs, and a durable record.
2. **Casual Lakeland walker** — wants a beautiful Lake District map and a simple done/not-done list.
3. **Social walker** — optional public profile, follow friends’ progress (defaults private).

## Jobs to be done

- See all 214 on one map; filter by area and completion.
- Log a summit with date, note, and photos; sync across phone and desktop.
- Import existing progress (CSV-like paste, AI-assisted name matching).
- Plan gentle or next walks using blog/guides; compare tools without losing journal context.
- Use offline on the fells (PWA / mobile app).

## Pain points

- Spreadsheets and paper lists don’t connect to the map or photos.
- Generic apps (Strava, OS Maps alone) don’t encode Wainwright book order, areas, or “the round.”
- Progress scattered across devices before sign-in.

## Competitive alternatives

- Paper Wainwright guides + tick list
- Spreadsheets / Notion
- **wainwrights.info**, hill lists, OS Maps
- Strava, Komoot, AllTrails (activity-first, not Wainwright-native)
- Other Wainwright checklist apps (content targets this in `/blog/best-wainwright-app`)

## Differentiation

- **Wainwright-native**: fixed 214, seven areas, book numbering, bagger-focused journal semantics (albums, import, print export).
- **Map-first** with OpenFreeMap + optional OpenTopoMap; quiet editorial UX (“slow journal”), not gamified fitness.
- **Cross-device sync** via Clerk + Convex; iOS TestFlight app shipping.
- **Free** — no paywall in product today.

## Objections

- “I already use a spreadsheet.” → Import + map + photos + sync.
- “I use OS Maps for navigation.” → Complement, not replace; tracker for the round.
- “Another account?” → Free; local progress can migrate on first sign-in.
- “Is this official Wainwright / NT?” → Independent product; uses open hill data (CC BY); not affiliated with Ordnance Survey or the National Trust unless stated.

## Customer language (UK)

Use vocabulary baggers actually search:

- Wainwright, Wainwrights, **214**, fell, fells, **bagging**, round, **Pictorial Guide**, area (Western, Northern, etc.)
- Lake District, Cumbria, **grid reference**, OS map, **Scafell**, **Helvellyn**
- checklist, tracker, app, journal, map, offline, photos, album

Avoid: generic “hiking app” framing without Wainwright specificity; US spellings on marketing pages (use **en-GB**).

## Brand voice

Quiet, editorial, journal-like — “walking quietly through every fell.” Not loud SaaS hype or Strava-style competition. Proof through product screenshots and practical walking advice.

## Proof points

- All 214 peaks with height, GR, area
- PWA installable; offline topo option
- iOS app on TestFlight (`Wainwrights Baggers`)
- Open data attribution (DB of British and Irish Hills lineage)
- Blog guides aligned to search intent (easy walks, beginners, app comparison)

## Pricing / packaging

**Free** today. No subscriptions or ads in codebase. Future monetisation TBD — do not invent pricing in schema or copy.

## Primary conversion

**Sign up and open the tracker** (`/app`) — Clerk sign-up modal from marketing CTAs, or direct link when signed in.

## Secondary conversion

- Read blog → internal links to sign-up or `/app`
- Install PWA / download iOS app (when public App Store link exists)
- Optional: follow other baggers after onboarding (in-app, not cold landing priority)

## Markets and regions

- **Primary:** United Kingdom, Lake District / England walkers
- **Language:** English (`en-GB`)
- **No Chile/LATAM localisation** for this product

## SEO content pillars

1. Wainwright tracker / app / checklist
2. Easy and beginner Wainwright walks + map planning
3. Lake District fell walking practical guides
4. Tool comparison (honest, journal-first positioning)
