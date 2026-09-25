# Wainwrights Baggers 1.0 release

Last updated 2026-09-24. Owner: Matias for Jorge. Plan of record: [matias#597](https://github.com/JorgeMenaDev/matias/issues/597). Every task below is a sub-issue there. Tick boxes here when a task ships, and close its issue.

## The release

- iPhone app on the App Store (iOS only, no Android) and the web app at wainwrightsbaggers.com.
- Free forever: the full 3D map, all 214 fells, bagging with a date, sync between iPhone and web, search, filters and progress by book.
- Pro subscription: photo journal (notes and photos per fell), yearly albums and print export, extra map layers (satellite, detailed contours), stats. Offline map downloads join Pro later.
- Price: £1.99 a month or £14.99 a year, 7-day free trial on the yearly plan, every App Store storefront, priced from the UK.

Jorge approved all of this on 2026-09-24 ([#601](https://github.com/JorgeMenaDev/matias/issues/601), [#602](https://github.com/JorgeMenaDev/matias/issues/602)). He tried TestFlight 1.0 (15) the same day and approved the iOS map as it is for the first release.

## Where things stand

| Area | State |
| --- | --- |
| iOS app | Native SwiftUI + Mapbox, TestFlight 1.0 (18). Map, location, bagging, live sync, account deletion, Pro through RevenueCat (paywall, photo journal, albums with PDF, map layers, stats). Real purchases wait for the Paid Apps agreement. |
| Web app | Live on the old MapLibre map. The iOS-style tracker (Mapbox, sheet, fell card, Pro gating) is ready in [wainwright-tracker#7](https://github.com/Andesphere/wainwright-tracker/pull/7). No web payments. |
| Backend | Convex prod `tame-avocet-977` (EU), recreated 2026-09-24. Server-side merge, account deletion, photo cleanup, Convex tests. Pro entitlements from RevenueCat webhooks; Clerk `user.deleted` cleanup. |
| Sign-in | Clerk production on web, iOS and Convex prod. Email and password, Google, Sign in with Apple (in the iOS build since 16). |
| App Store Connect | App `6771147426`, version 1.0. Listing, categories, age rating 4+, review details and demo account set; 3 of 7 6.9" screenshots uploaded (the map screens wait on Mapbox). Both plans READY_TO_SUBMIT. Paid Apps agreement accepted, tax forms signed, bank in review (2026-09-24). |
| Landing | New Fable design live since 2026-09-25 (#4). App Store links read "coming soon" until `APP_STORE_LIVE` in `apps/web/lib/appStore.ts` is set to true on launch day. Previews use Clerk Development and Convex dev. |

## Done on 2026-09-24

- [x] Backend rebuilt after the 2026-09-23 Convex cleanup deleted it; web repointed and working again.
- [x] Catalogue: every fell under its Pictorial Guide book; 17 names cleaned ([#726](https://github.com/JorgeMenaDev/matias/issues/726)).
- [x] Progress can no longer be erased by a stale device; photo files cleaned up; Convex tests ([#730](https://github.com/JorgeMenaDev/matias/issues/730)).
- [x] Privacy policy at `/privacy`; account deletion on web and iOS ([#728](https://github.com/JorgeMenaDev/matias/issues/728)).
- [x] No offline claims on the site ([#729](https://github.com/JorgeMenaDev/matias/issues/729)).
- [x] Clerk production switched on for web and Convex prod; Native API; Sign in with Apple credentials; app renamed ([#727](https://github.com/JorgeMenaDev/matias/issues/727)).
- [x] Native iOS app with the 3D fell map on TestFlight 1.0 (15), approved by Jorge ([#725](https://github.com/JorgeMenaDev/matias/issues/725), [#600](https://github.com/JorgeMenaDev/matias/issues/600)).
- [x] App Store subscription group and both plans with prices and trial in all 175 storefronts.
- [x] Mapbox account `andesphere` (admin@andesphere.com).
- [x] Apple Developer Program License Agreement accepted.
- [x] Legacy Expo app removed.

## Launch checklist

### 1. Payments and Pro ([#731](https://github.com/JorgeMenaDev/matias/issues/731)), blocks launch

- [x] RevenueCat: Andesphere account, project, iOS app `com.wainwrightsbaggers.mobile`, entitlement `pro`, offering with both products.
- [x] App Store Connect In-App Purchase key for RevenueCat, and App Store Server Notifications (V2) pointed at RevenueCat.
- [ ] Check the Paid Apps agreement, tax and banking are active in App Store Connect > Business. Accepted, EU trader status Active, W-8BEN-E and certificate signed on 2026-09-24; bank account in Apple's review (up to 24 hours).
- [x] iOS: RevenueCat SDK with the Clerk user ID as app user ID, paywall, restore purchases, manage-subscription link.
- [x] Convex: RevenueCat webhook into an `entitlements` table, recomputed from RevenueCat API v2; `billing.mine`, `billing.refresh`. Proven on prod with a dashboard test event and a Test Store purchase.
- [ ] Convex: Pro-only operations checked on the server. Wired and on Convex dev in [wainwright-tracker#7](https://github.com/Andesphere/wainwright-tracker/pull/7); deploy to prod together with that web merge ([#733](https://github.com/JorgeMenaDev/matias/issues/733)).
- [x] Pro features on iOS: photo journal, albums with PDF print export, extra map layers, stats.
- [ ] Sandbox and TestFlight tests: buy, trial, restore, cancel, expiry, refund, switch account. Simulator runs pass on RevenueCat's Test Store (`ProFlowUITests`); real sandbox purchases wait for the Paid Apps agreement.
- [x] Review screenshot of the paywall and review notes on both plans (READY_TO_SUBMIT).
- [ ] Jorge: consider enrolling in the Apple Small Business Program (15% commission instead of 30%).

### 2. iOS before submission

- [x] Sign in with Apple in the app: entitlement plus native flow (Clerk's sign-in sheet shows Continue with Apple; still to try on a real iPhone, below).
- [x] Real app icon: trig pillar, from 1.0 (18). The web favicon and Apple touch icon match.
- [ ] On a real iPhone: smooth panning, Google sign-in, Apple sign-in, location.
- [x] App privacy manifest (`PrivacyInfo.xcprivacy`) for the app's own API use.
- [ ] Crash reporting (Sentry for iOS).
- [x] Mapbox card: added by Jorge on 2026-09-25 (pay as you go with the free monthly tiers; the default public token was kept). Without a card the account had demo limits and was paused on 2026-09-24.
- [ ] Mapbox: a dedicated token for the iOS app, and a URL-restricted one for the web.

### 3. Web

- [x] New landing: the Fable design, live on 2026-09-25 ([wainwright-tracker#4](https://github.com/Andesphere/wainwright-tracker/pull/4), [#736](https://github.com/JorgeMenaDev/matias/issues/736)), with App Store links as "coming soon" until launch.
- [ ] Web tracker matches the iOS experience: Mapbox GL JS with the same style, 3D terrain, contours and lighting, the same sheet, book progress and fell card ([#733](https://github.com/JorgeMenaDev/matias/issues/733)). Built in [wainwright-tracker#7](https://github.com/Andesphere/wainwright-tracker/pull/7) and checked on its preview on 2026-09-25 with the live map (desktop and phone, all three layers, dusk and night, free and Pro). Done when #7 merges.
- [ ] Pro on the web through RevenueCat Web Billing on Stripe, the same entitlement as iOS ([#733](https://github.com/JorgeMenaDev/matias/issues/733)).
- [ ] AI bulk import: set `AI_GATEWAY_API_KEY` on Convex prod, or remove the feature and its blog mention.
- [x] Fix the two typecheck errors in `apps/web/components/ui/badge.tsx` and `button.tsx` (no longer reproduce; `tsc` is clean on both configs, checked 2026-09-24).

### 4. Sign-in and data hygiene

- [x] Clerk `user.deleted` webhook to Convex, so deletions made outside the apps still clean up.
- [ ] Register Clerk's sending domain with Apple's private email relay, so codes reach "Hide My Email" users.
- [x] App Review demo account: `admin+appreview@andesphere.com` with Clerk's per-user `bypass_client_trust`, so it signs in without the new-device email code (credentials in the Matias credentials store).
- [x] Convex backups for production: daily at 03:00 UTC, kept 7 days, file storage included.

### 5. App Store submission ([#732](https://github.com/JorgeMenaDev/matias/issues/732))

- [ ] Listing: subtitle, description, keywords, category set. Screenshots: 3 of 7 for 6.9" (`APP_IPHONE_67`, 1320×2868); the four map screens wait on Mapbox. 6.5" is optional when 6.9" is provided.
- [x] Privacy labels published 2026-09-25: linked Contact Info, User Content, Identifiers, Purchases; not linked Location (Mapbox telemetry); no tracking.
- [x] Age rating, support URL (contact page), privacy URL (`/privacy`), marketing URL.
- [x] Review notes and demo account.
- [ ] Submit 1.0 with both subscriptions attached; answer review.
- [ ] On approval: release, set `APP_STORE_LIVE = true` in `apps/web/lib/appStore.ts`, tag the GitHub release (andes-release skill), update this file.

### After launch

- Offline map downloads (Pro), home-screen widgets, Apple Watch.

## Resume in a new session

1. Read this file, then [matias#597](https://github.com/JorgeMenaDev/matias/issues/597) and its open sub-issues.
2. Product repo rules and IDs: `AGENTS.md`. iOS build and upload: `apps/ios/README.md`.
3. Credentials and account access are in the Matias credentials store and its `STACK.md` row `wainwright-tracker`; the vault page is `companies/Andesphere/Wainwrights Baggers.md`.
