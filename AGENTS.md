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




## Mobile App State

The iOS Expo app has shipped its first working TestFlight build.

- App: `Wainwrights Baggers`
- Package: `apps/mobile`
- Expo owner: `aljorgevi`
- Expo project: `@aljorgevi/wainwrightsbaggers-mobile`
- Expo project ID: `c6c22670-bf5b-4143-acf6-2fc6303ea30e`
- iOS bundle ID: `com.wainwrightsbaggers.mobile`
- App Store Connect app ID: `6771147426`
- Current app version: `0.1.0`
- Latest shipped TestFlight build number: `12`
- Latest EAS build ID: `4971650b-4c8b-4d01-ae74-cd45457ccfe0`
- Latest EAS submission ID: `81f47216-3d40-4de1-a576-baafd8ec37f9`
- TestFlight state at shipment: Apple processing `VALID`, internal build state `IN_BETA_TESTING`.

Do not change the Expo project ID, Expo owner, app slug, App Store Connect app, or iOS bundle identifier unless the user explicitly asks for a new app/listing.

## Mobile Functionality

`apps/mobile/app/index.tsx` is the first usable mobile version. It provides:

- Clerk sign-in/sign-up via `@clerk/expo`.
- Convex sync using the same backend and Clerk auth project as the web app.
- A Wainwrights checklist sourced from `@wainwrights/catalog/wainwrights`.
- Area, status, and search filters.
- On-device progress cache/migration using `expo-secure-store`.

Progress now syncs to Convex:

- SecureStore key: `wainwrightsbaggers:completed:v1`
- Mobile reads and writes `api.progress.get`, `api.progress.replace`, and `api.progress.setBagged`.
- On first signed-in load, mobile merges existing local SecureStore progress into Convex so the first TestFlight users do not lose phone-only progress.
- Future storage changes still need a migration plan if users already have local progress.

## Auth And Env

Mobile auth requires:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CONVEX_URL`

These values are listed in `.env.example` and should exist in local `.env.local` for local development. They are also configured in EAS environment variables for `development`, `preview`, and `production`.

The app hard-fails in `apps/mobile/app/_layout.tsx` if `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` or `EXPO_PUBLIC_CONVEX_URL` is missing. That is deliberate, because a broken auth/sync build should fail early.

Do not commit:

- Apple ID credentials.
- Expo access tokens.
- App Store Connect API key material.
- Clerk secret keys.

## Apple And Expo Access

EAS uses remote iOS credentials.

Known Apple state at first shipment:

- Apple Developer team: `Jorge Mena (29388BLCGA)`
- App Store Connect provider: `Jorge Mena (128928648)`
- Apple Developer Program membership is active.
- Identity verification was completed before the successful build/submission.
- EAS created and stored an App Store Connect API key on Expo servers during submission.
- Internal TestFlight group: `Team (Expo)`
- Internal tester email used: `jormencar@gmail.com`

If future EAS builds/submissions prompt for Apple login or two-factor authentication, the user must provide the current Apple 2FA code. Do not assume old codes are reusable.

## Commands

From the repo root:

```sh
bun install
bun run format --filter=@wainwrights/mobile
bun run check --filter=@wainwrights/mobile
```

From `apps/mobile`:

```sh
bunx expo-doctor
bunx eas-cli build --platform ios --profile production
bunx eas-cli submit --platform ios --profile production --latest
```

Use `bunx eas-cli`, not global `eas`, unless the user has intentionally installed and selected a global EAS CLI.

## EAS Configuration

`apps/mobile/eas.json` uses:

- `cli.appVersionSource`: `remote`
- `production.autoIncrement`: `true`
- `production.ios.simulator`: `false`
- `submit.production.ios`: remote/default EAS submit settings

`apps/mobile/app.config.ts` sets:

- `owner: "aljorgevi"`
- `slug: "wainwrightsbaggers-mobile"`
- `scheme: "wainwrightsbaggers"` by default
- `ios.bundleIdentifier: "com.wainwrightsbaggers.mobile"`
- `ios.infoPlist.ITSAppUsesNonExemptEncryption: false`
- `extra.eas.projectId: "c6c22670-bf5b-4143-acf6-2fc6303ea30e"`

## Dependency Notes

The mobile app is Expo SDK 54 and React Native `0.81.5`.

React and React DOM are pinned to `19.1.0` across the workspace because Expo SDK 54 expects that React line. The root `package.json` has overrides for both packages, and `apps/web/package.json` is pinned to match. Do not casually bump React for the web app without checking Expo compatibility.

`bunfig.toml` uses a hoisted linker because Expo tooling and `expo-doctor` expect dependency resolution patterns that work better with hoisting in this monorepo.

## Verification Baseline

Before the first TestFlight shipment, these passed:

- `bun run format --filter=@wainwrights/mobile`
- `bun run check --filter=@wainwrights/mobile`
- `bunx expo-doctor` from `apps/mobile`, with `17/17 checks passed`

The user confirmed the TestFlight app installed and worked on their iPhone after accepting the invite.

## SEO / growth

Repo-local `.seo/` per `/Users/jorge/SEO_GROWTH_WORKSPACE_PLAYBOOK.md`.

- Entry: `.seo/README.md`
- **Backlog (start here):** `.seo/backlog.md`
- Context: `.seo/strategy.md`, `.seo/audit.md`
- Backlinks: `.seo/backlinks/work-log.md`, `.seo/backlinks/summary.md`
- Positioning: `.agents/product-marketing.md`
- Skills: `.agents/skills/` (`bunx skills add coreyhaines31/marketingskills` from repo root)

Live site: `https://wainwrightsbaggers.com`. Market: UK English, Wainwright baggers. Bun + Vercel git deploy. Do not print secrets. Update `.seo/backlog.md` after each ticket; touch strategy/audit only if context changed.
