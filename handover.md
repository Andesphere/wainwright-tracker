# Mobile App Handover Runbook

Use this document when creating or shipping an Expo iOS mobile app in another monorepo using Jorge's existing Expo and Apple Developer setup.

This is a workflow and environment handover, not a secrets file. Do not paste Apple passwords, Expo access tokens, Clerk secret keys, App Store Connect API private keys, or two-factor codes into this document or into commits.

## How Jorge Works

- Speak English.
- Use Bun for TypeScript projects. Do not use npm, pnpm, or yarn.
- Prefer repo scripts over one-off package invocations.
- Run `format` and `check` after code changes. If the repo lacks those scripts, add sensible equivalents for that project.
- Use `@Chrome` when the work needs logged-in browser state, account setup, provider dashboards, Expo, Apple Developer, App Store Connect, Gmail, or TestFlight verification.
- Ask Jorge for transient credentials only when needed: Apple password, Apple two-factor authentication codes, Expo tokens, Clerk dashboard access, or payment/identity steps.
- Do not make destructive cleanup decisions to free disk space. Clearing caches can be acceptable, but ask first if the deletion is not obviously disposable.

## Stable Accounts And Identifiers

Use these as known account context when setting up future apps:

- Expo account/owner: `aljorgevi`
- Apple ID email: `jormencar@gmail.com`
- Apple Developer team: `Jorge Mena (29388BLCGA)`
- App Store Connect provider: `Jorge Mena (128928648)`
- Existing internal TestFlight tester email: `jormencar@gmail.com`

Known good precedent app:

- App name: `Wainwrights Baggers`
- Expo project: `@aljorgevi/wainwrightsbaggers-mobile`
- Expo project ID: `c6c22670-bf5b-4143-acf6-2fc6303ea30e`
- Bundle ID: `com.wainwrightsbaggers.mobile`
- App Store Connect app ID: `6771147426`
- First working TestFlight build: `0.1.0 (11)`
- Current sync-enabled TestFlight build: `0.1.0 (12)`
- Current EAS build ID: `4971650b-4c8b-4d01-ae74-cd45457ccfe0`
- Current EAS submission ID: `81f47216-3d40-4de1-a576-baafd8ec37f9`

Do not reuse the Wainwrights Expo project ID, bundle ID, or App Store Connect app ID for a new app. Create a new Expo project and a new unique iOS bundle identifier for each app.

## What Is Already Solved

Jorge's Apple Developer Program membership is active. The Apple account has previously passed identity verification and successfully shipped an Expo app to internal TestFlight.

EAS remote iOS credentials worked for the precedent app:

- Bundle identifier registration succeeded.
- Apple distribution certificate creation succeeded.
- Provisioning profile creation succeeded.
- EAS Submit created/stored an App Store Connect API key on Expo servers.
- App Store Connect app creation succeeded.
- Internal TestFlight group creation succeeded.
- Internal tester invitation succeeded.

This means future blockers are likely app-specific configuration, expired sessions, two-factor authentication, missing environment variables, naming conflicts, or Apple processing delays rather than a missing Apple Developer subscription.

## Secrets And Access Policy

Never commit or document live secrets:

- Apple ID password.
- Apple two-factor authentication codes.
- Expo access tokens.
- App Store Connect API private key material.
- Clerk secret keys.
- `.env.local`.

Future agents should ask Jorge directly for current credentials if a CLI or website prompts for them. Two-factor codes expire quickly; old codes from prior work are not reusable.

If EAS says the Apple session expired, rerun the command and let it restore from the local Apple session/keychain if possible. If it prompts for two-factor authentication, ask Jorge for the current code.

## Recommended Mobile Stack

For a first iOS version, prefer:

- Expo SDK 54 or the current Expo stable SDK supported by the repo.
- Expo Router.
- EAS Build and EAS Submit.
- Remote EAS iOS credentials.
- Clerk Expo auth if the app needs sign-in.
- `expo-secure-store` for token cache and small local private data.
- A simple first usable product surface rather than a landing page.

For Expo SDK 54 specifically:

- React: `19.1.0`
- React DOM: `19.1.0`
- React Native: `0.81.5`
- TypeScript: `~5.9.2` in the mobile package is safer than TypeScript 6 for Expo tooling.
- In Bun monorepos, a hoisted linker can be needed for Expo tooling:

```toml
[install]
linker = "hoisted"
```

## New App Setup Checklist

1. Inspect the monorepo and package manager.
2. Confirm the mobile package location, usually `apps/mobile`.
3. Use Bun for dependency installation.
4. Add or verify Expo app config.
5. Add Clerk Expo auth only if the app requires user accounts.
6. Add `.env.example` entries for public mobile env vars.
7. Configure EAS with a new Expo project under owner `aljorgevi`.
8. Choose a unique iOS bundle identifier.
9. Set EAS environment variables for every build environment used.
10. Run format, checks, and `expo-doctor`.
11. Build with EAS for iOS production.
12. Submit the latest successful build to App Store Connect/TestFlight.
13. Verify the EAS submission page and App Store Connect/TestFlight state.
14. Ask Jorge to accept/install the TestFlight invite on the iPhone.
15. Commit and push only after the app is confirmed working or the user asks to snapshot the current state.

## Expo And EAS Commands

Use local commands through Bun:

```sh
bun install
bunx expo-doctor
bunx eas-cli init
bunx eas-cli env:list
bunx eas-cli env:create
bunx eas-cli build --platform ios --profile production
bunx eas-cli submit --platform ios --profile production --latest
```

Use `bunx eas-cli`, not a global `eas`, unless Jorge explicitly wants the global CLI.

A typical `apps/mobile/eas.json` for first TestFlight delivery:

```json
{
  "cli": {
    "version": ">= 18.13.1",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
```

## Expo App Config Pattern

Each app needs its own app name, slug, scheme, bundle identifier, and project ID.

Use this pattern, replacing values per app:

```ts
import type { ExpoConfig } from "expo/config";

const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? "yourapp";

const config: ExpoConfig = {
  name: "Your App",
  slug: "your-app-mobile",
  owner: "aljorgevi",
  scheme: appScheme,
  version: "0.1.0",
  platforms: ["ios"],
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "com.yourcompany.yourapp",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    supportsTablet: true,
  },
  extra: {
    eas: {
      projectId: "replace-with-new-eas-project-id",
    },
  },
  plugins: ["expo-router", "expo-secure-store", "expo-web-browser"],
};

export default config;
```

Only set `ITSAppUsesNonExemptEncryption: false` when the app does not use non-exempt encryption. Standard HTTPS/auth usage generally fits this for the precedent app, but reassess if the new app adds custom cryptography, VPN, encrypted messaging, or similar features.

## Clerk Expo Auth Pattern

For Clerk in Expo, install and configure:

```sh
bun add @clerk/expo expo-auth-session expo-secure-store expo-web-browser
```

Required public env var:

```sh
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_CONVEX_URL=
```

Set these env vars locally and in EAS for every relevant environment:

- `development`
- `preview`
- `production`

Use Clerk's Expo provider and token cache:

```tsx
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
```

Use `@clerk/expo/native` for simple native auth surfaces when speed matters.

## Chrome Workflow

When the user asks to use `@Chrome`, use the Chrome plugin rather than trying to scrape browser profiles or cookies. The intended pattern is:

1. Connect to the existing Chrome session.
2. Claim the relevant open tab if the user already has Expo, Apple, Gmail, Clerk, or App Store Connect open.
3. Use the visible website flow for account setup, identity/payment steps, and dashboard configuration.
4. Ask Jorge for two-factor codes or manual identity/payment actions when Apple requires them.
5. Do not inspect cookies, local storage, browser passwords, or raw session stores.
6. Keep final evidence concise: URLs, build IDs, submission IDs, App Store Connect states, and TestFlight tester state.

Useful URLs:

- Expo dashboard: `https://expo.dev/accounts/aljorgevi`
- Apple Developer: `https://developer.apple.com/account`
- App Store Connect: `https://appstoreconnect.apple.com`
- TestFlight app page pattern: `https://appstoreconnect.apple.com/apps/{ASC_APP_ID}/testflight/ios`

## Apple And TestFlight Verification

A successful EAS build is not enough. Verify these layers:

1. EAS build status is `FINISHED`.
2. EAS submission status is `Success`.
3. App Store Connect build processing state is `VALID`.
4. TestFlight internal build state is `IN_BETA_TESTING`.
5. The internal group has access to the build.
6. Jorge's tester email is invited or accepted.
7. Jorge confirms install and launch on the iPhone.

Common states:

- `PROCESSING`: Apple has the upload but TestFlight may not be downloadable yet.
- `VALID`: Apple finished processing the build.
- `BETA_INTERNAL_TESTING`: Build is available for internal TestFlight.
- Tester `INVITED`: Jorge still needs to accept the email/TestFlight invite.

If the app is uploaded but not visible on the iPhone, wait for Apple processing and check whether the tester invitation has been accepted.

## Known Failure Modes

- Apple says there is no team: Apple Developer membership may not be active yet, identity verification may still be pending, or the session is stale.
- Apple asks for identity verification: Jorge must complete that personally with government ID upload.
- Apple asks for payment or enrollment completion: Jorge must complete it personally.
- EAS cannot validate credentials: rerun with Apple login and current two-factor code.
- Build succeeds but submit fails: inspect the EAS submission logs first, then App Store Connect agreements/export compliance.
- TestFlight does not show the build: check Apple processing state and internal group build access.
- Expo Doctor fails in a Bun monorepo: check React version pins, hoisted linker, missing peer dependencies, and TypeScript version.

## Evidence To Capture In Future Handoffs

For each shipped app, record:

- Repo and package path.
- Expo owner, slug, and project ID.
- iOS bundle identifier.
- App Store Connect app ID.
- EAS build ID and URL.
- EAS submission ID and URL.
- Version and build number.
- Apple processing state.
- TestFlight internal/external state.
- Tester group and tester email state.
- Commands run for validation.
- Whether Jorge confirmed install and launch on iPhone.

## Precedent Validation

For the Wainwrights app, the final validation baseline was:

```sh
bun run format --filter=@wainwrights/mobile
bun run check --filter=@wainwrights/mobile
cd apps/mobile && bunx expo-doctor
```

The user confirmed the TestFlight app installed and worked on their iPhone.
