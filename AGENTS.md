# Agent Notes

Always speak in English in this repository.

## Project Rules

- Use Bun for TypeScript work. Do not use npm, pnpm, or yarn.
- Prefer the existing monorepo scripts over one-off commands.
- After code changes, run the relevant `format` and `check` commands.
- Keep secrets out of commits. `.env.local`, Expo tokens, Apple passwords, and App Store Connect API keys must stay local or in provider-managed storage.

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
- Latest shipped TestFlight build number: `11`
- Latest EAS build ID: `2c1a4bd6-9122-41f8-929e-ef2711660211`
- Latest EAS submission ID: `812d046e-b547-4613-af97-cc361f9acc43`
- TestFlight state at shipment: Apple processing `VALID`, internal build state `IN_BETA_TESTING`.

Do not change the Expo project ID, Expo owner, app slug, App Store Connect app, or iOS bundle identifier unless the user explicitly asks for a new app/listing.

## Mobile Functionality

`apps/mobile/app/index.tsx` is the first usable mobile version. It provides:

- Clerk sign-in/sign-up via `@clerk/expo`.
- A Wainwrights checklist sourced from `@wainwrights/catalog/wainwrights`.
- Area, status, and search filters.
- On-device progress persistence using `expo-secure-store`.

The current progress store is intentionally local to the iPhone:

- SecureStore key: `wainwrightsbaggers:completed:v1`
- Progress is not yet synced to Convex or any backend.
- Changing the storage model needs a migration plan if users already have local progress.

## Auth And Env

Mobile auth requires:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

This key is listed in `.env.example` and should exist in local `.env.local` for local development. It is also configured in EAS environment variables for `development`, `preview`, and `production`.

The app hard-fails in `apps/mobile/app/_layout.tsx` if `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing. That is deliberate, because a broken auth build should fail early.

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
