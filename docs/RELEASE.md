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
| iOS app | Native SwiftUI + Mapbox, TestFlight 1.0 (15). Map, location, bagging, live sync, account deletion. No payments yet. |
| Web app | Live. Old MapLibre map; not yet the iOS look. No payments. |
| Backend | Convex prod `tame-avocet-977` (EU), recreated 2026-09-24. Server-side merge, account deletion, photo cleanup, Convex tests. |
| Sign-in | Clerk production on web, iOS and Convex prod. Email and password, Google, Apple (configured, not yet in the iOS build). |
| App Store Connect | App `6771147426`; version 1.0 prepared; subscription group and both plans created, missing review metadata. |
| Landing | Old design. Redesign in progress ([#736](https://github.com/JorgeMenaDev/matias/issues/736)). |

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

- [ ] RevenueCat: Andesphere account, project, iOS app `com.wainwrightsbaggers.mobile`, entitlement `pro`, offering with both products.
- [ ] App Store Connect In-App Purchase key for RevenueCat, and App Store Server Notifications (V2) pointed at RevenueCat.
- [ ] Check the Paid Apps agreement, tax and banking are active in App Store Connect > Business.
- [ ] iOS: RevenueCat SDK with the Clerk user ID as app user ID, paywall, restore purchases, manage-subscription link.
- [ ] Convex: RevenueCat webhook into an entitlements table; Pro-only operations checked on the server, not only in the app.
- [ ] Pro features on iOS: photo journal, albums, extra map layers, stats.
- [ ] Sandbox and TestFlight tests: buy, trial, restore, cancel, expiry, refund, switch account.
- [ ] Review screenshot of the paywall and review notes on both plans (both show `MISSING_METADATA` now).
- [ ] Jorge: consider enrolling in the Apple Small Business Program (15% commission instead of 30%).

### 2. iOS before submission

- [ ] Sign in with Apple in the app: entitlement plus native flow (Clerk production already has Apple on).
- [ ] Real app icon (a placeholder ships now).
- [ ] On a real iPhone: smooth panning, Google sign-in, Apple sign-in, location.
- [ ] App privacy manifest (`PrivacyInfo.xcprivacy`) for the app's own API use.
- [ ] Crash reporting (Sentry for iOS).
- [ ] Mapbox: add a card before launch (free tier: 25,000 iPhone users a month), and use a dedicated token for the app.

### 3. Web

- [ ] New landing with the App Store badge and real app screenshots; Jorge picks between the Fable 5.1 and Opus 5.5 designs ([#736](https://github.com/JorgeMenaDev/matias/issues/736)).
- [ ] Web tracker matches the iOS experience: Mapbox GL JS with the same style, 3D terrain, contours and lighting, the same sheet, book progress and fell card ([#733](https://github.com/JorgeMenaDev/matias/issues/733)).
- [ ] Pro on the web through RevenueCat Web Billing on Stripe, the same entitlement as iOS ([#733](https://github.com/JorgeMenaDev/matias/issues/733)).
- [ ] AI bulk import: set `AI_GATEWAY_API_KEY` on Convex prod, or remove the feature and its blog mention.
- [ ] Fix the two typecheck errors in `apps/web/components/ui/badge.tsx` and `button.tsx`.

### 4. Sign-in and data hygiene

- [ ] Clerk `user.deleted` webhook to Convex, so deletions made outside the apps still clean up.
- [ ] Register Clerk's sending domain with Apple's private email relay, so codes reach "Hide My Email" users.
- [ ] App Review demo account: production asks for an emailed code on each new device, which a reviewer cannot receive. Give the reviewer an account that signs in without it.
- [ ] Turn on Convex backups for production.

### 5. App Store submission ([#732](https://github.com/JorgeMenaDev/matias/issues/732))

- [ ] Listing: subtitle, description, keywords, category, screenshots for 6.9" and 6.5" iPhones.
- [ ] Privacy labels: email, name, photos and notes, user ID; location is used on the device only and not collected.
- [ ] Age rating, support URL (contact page), privacy URL (`/privacy`), marketing URL.
- [ ] Review notes and demo account.
- [ ] Submit 1.0 with both subscriptions attached; answer review.
- [ ] On approval: release, merge the new landing, tag the GitHub release (andes-release skill), update this file.

### After launch

- Offline map downloads (Pro), home-screen widgets, Apple Watch.

## Resume in a new session

1. Read this file, then [matias#597](https://github.com/JorgeMenaDev/matias/issues/597) and its open sub-issues.
2. Product repo rules and IDs: `AGENTS.md`. iOS build and upload: `apps/ios/README.md`.
3. Credentials and account access are in the Matias credentials store and its `STACK.md` row `wainwright-tracker`; the vault page is `companies/Andesphere/Wainwrights Baggers.md`.
