## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.




## Where things stand

Release status, what is done and the launch checklist live in `docs/RELEASE.md`. Read it first. The owning plan is the Wayfinder map https://github.com/JorgeMenaDev/matias/issues/597; each launch task is a sub-issue there.

## Apps

- `apps/web`: Next.js 16 site and web tracker at https://wainwrightsbaggers.com (Vercel team `andesphere`, project `wainwright-tracker`, git deploy from `main`). The tracker at `/app` (`apps/web/tracker/`) follows the iOS app: Mapbox GL JS v3 (Standard, faded theme, 3D terrain, sun-driven light preset, our hillshade, contours and fell layers), a glass side panel on desktop and a bottom sheet with detents on phones. It needs `NEXT_PUBLIC_MAPBOX_TOKEN` (the public Andesphere Mapbox token; set on Vercel for production and preview). `?light=dawn|day|dusk|night` forces the lighting.
- `apps/ios`: native SwiftUI app, Mapbox Maps SDK v11, Clerk iOS, Convex Swift. Setup, build and TestFlight upload: `apps/ios/README.md`. It replaced the Expo app, which was removed on 2026-09-24.
- `packages/backend`: Convex functions, schema and tests. Its `AGENTS.md` points at Convex's managed guidelines (`npx convex ai-files update` refreshes them and the Convex skills in `packages/backend/.agents/skills`).
- `packages/catalog`: the 214 fells. `area` is the Pictorial Guide book, derived from `bookNumber`. After a change, regenerate the iOS copy with `bun run ios-native:catalog`.

## iOS identity

Do not change these unless Jorge asks for a new app or listing.

- App name `Wainwrights Baggers`, bundle ID `com.wainwrightsbaggers.mobile`, App Store Connect app `6771147426`.
- Apple team ANDESPHERE LTD `29388BLCGA`. Builds are archived and uploaded with the App Store Connect API key (Admin); key paths live in the Matias credentials store, never in this repo.
- TestFlight internal group `Team (Expo)` sees every build automatically. Latest: 1.0 (18), the first with the real app icon.
- Subscription group `Wainwrights Baggers Pro`: `com.wainwrightsbaggers.pro.yearly` (£14.99, 7-day trial) and `com.wainwrightsbaggers.pro.monthly` (£1.99).

## Backend and auth

The Convex project was deleted on 2026-09-23 and recreated on 2026-09-24. All earlier user progress is gone.

- Convex team `jorge-mena`, project `wainwright-tracker`. Production `tame-avocet-977` (`https://tame-avocet-977.eu-west-1.convex.cloud`, EU); dev `nautical-hedgehog-970`.
- Clerk app `Wainwrights Baggers` (Arketix Clerk workspace). Production `clerk.wainwrightsbaggers.com` serves web, iOS and Convex prod: email and password, Google, Apple, Native API on. Development `settling-anchovy-85.clerk.accounts.dev` serves Convex dev only.
- Convex env `CLERK_FRONTEND_API_URL`: production `https://clerk.wainwrightsbaggers.com`, dev the development instance. `AI_GATEWAY_API_KEY` is unset, so AI bulk import is off.
- Progress writes: `progress.setBagged` for one fell, `progress.addBagged` merges many on the server, `progress.reset` clears. There is no whole-list replace; a stale client must never drop data. `account.deleteMyData` removes everything a user owns; clients call it before deleting the Clerk user.
- Pro: RevenueCat is the purchase authority; app user ID = Clerk user ID; entitlement `pro`. `convex/http.ts` takes the RevenueCat webhook at `/revenuecat` (bearer `REVENUECAT_WEBHOOK_AUTH`) and recomputes the `entitlements` row from RevenueCat API v2 (`REVENUECAT_PROJECT_ID`, `REVENUECAT_SECRET_KEY`), so repeated or late events are harmless. Clients read `billing.mine` and call `billing.refresh` after a purchase or restore. `requirePro` guards journal writes: `progress.setBagged` needs Pro only when it writes a new note or attaches a photo the fell does not hold yet (bagging with a date, unbagging, reset and removing a note or photo stay free); `progress.generatePhotoUploadUrl` and `progress.attachPhoto` need Pro. The web shows Pro features locked with a link to the iPhone app; notes and photos saved while Pro stay visible, read-only. The Clerk `user.deleted` webhook at `/clerk-webhook` (Svix, `CLERK_WEBHOOK_SECRET`) removes the user's data.
- Deploy functions from `packages/backend`: `bunx --bun convex deploy -y --typecheck=disable`. Vercel does not deploy Convex. Deploy Convex before merging web code that calls new functions.
- QA: production accounts are created through the Clerk Backend API and need an emailed code on each new device. The Matias credentials store holds the standing QA account and the recipe.
- Never run `convex dev` against a local deployment on this Mac without pinning ports; other projects own 3214, 3215 and 8081.

## Commands

From the repo root:

```sh
bun install
bun run test          # web unit tests + Convex tests (convex-test)
bun run check         # typecheck, lint and build; apps/web lint has one known error (app/privacy/page.tsx)
bun run format
```

iOS: see `apps/ios/README.md`.

## Dependency notes

React and React DOM are pinned to `19.1.0` and `bunfig.toml` uses the hoisted linker. Both were for the removed Expo app; lifting them is optional cleanup, test the web build if you do.

`convex-test` is pinned to 0.0.54, the last release that supports convex 1.39. Newer releases need convex 1.43 or later.

## SEO / growth

SEO strategy, backlog, and history live in the Matias hub (repo `JorgeMenaDev/matias`) at `/Users/jorge/.hermes/profiles/matias/.seo/sites/wainwrightsbaggers/` (seo-growth-workspace v3 hub mode; registry: `/Users/jorge/.hermes/profiles/matias/.seo/registry.md`).

- Entry: that workspace's `README.md`; **backlog (start here):** its `backlog.md`
- Positioning stays repo-local: `.agents/product-marketing.md`
- Skills: `.agents/skills/` (`bunx skills add coreyhaines31/marketingskills` from repo root)
- Do not recreate a repo-local `.seo/`; this repo is the implementation surface.

Live site: `https://wainwrightsbaggers.com`. Market: UK English, Wainwright baggers. Bun + Vercel git deploy. Do not print secrets. Update the hub workspace's `backlog.md` after each ticket; touch strategy/audit only if context changed.
