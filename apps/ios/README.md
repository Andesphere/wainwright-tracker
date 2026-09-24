# Wainwrights Baggers for iOS

Native SwiftUI app. It replaced the Expo app (removed 2026-09-24) on the same bundle ID (`com.wainwrightsbaggers.mobile`) and App Store Connect app (`6771147426`).

- **Map:** Mapbox Maps SDK for iOS 11 (SwiftUI API). Mapbox Standard style, faded theme, 3D terrain (`mapbox.mapbox-terrain-dem-v1`, exaggeration 1.3), a light preset picked from the sun's position over the Lake District, plus our own hillshade and contour lines (`mapbox.mapbox-terrain-v2`) in the `bottom` slot. The 214 fells are one GeoJSON source with two symbol layers.
- **Sign-in:** Clerk iOS SDK (`ClerkKit`, `ClerkKitUI`), production instance. The prebuilt `AuthView` opens as a sheet. The account sheet is our own (`Sheet/AccountSheet.swift`): Clerk's profile view has a delete button that would skip `account.deleteMyData`.
- **Sync:** Convex Swift client against Convex prod. `progress:get` is a live subscription while signed in; bagging calls `progress:setBagged`. Tokens come from the Clerk JWT template `convex`, see `Services/ClerkConvexAuthProvider.swift`. The official `clerk-convex-swift` bridge sends the default session token, which has no `aud` claim here, so Convex rejects it.
- **Targets:** iOS 18.0+, iPhone, portrait. Liquid Glass on iOS 26 with a material fallback.

## Setup

```sh
brew install xcodegen
cd apps/ios
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig   # then fill in both values
xcodegen generate                                             # or: bun run ios-native:generate from the repo root
open WainwrightsBaggers.xcodeproj
```

`WainwrightsBaggers.xcodeproj`, `WainwrightsBaggers/Info.plist` and `Config/Secrets.xcconfig` are generated or local, and gitignored. Edit `project.yml`, not the project.

## Fell data

`WainwrightsBaggers/Resources/wainwrights.json` is generated from `packages/catalog/src/wainwrights.ts`. After a catalogue change, from the repo root:

```sh
bun run ios-native:catalog
```

## Build and run in the simulator

```sh
xcodebuild build -project WainwrightsBaggers.xcodeproj -scheme WainwrightsBaggers \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath build/DerivedData -clonedSourcePackagesDirPath build/SourcePackages
xcrun simctl install booted build/DerivedData/Build/Products/Debug-iphonesimulator/WainwrightsBaggers.app
xcrun simctl launch booted com.wainwrightsbaggers.mobile -lightPreset dusk
```

`-lightPreset dawn|day|dusk|night` forces the map lighting; without it the app follows the sun. Everything under `build/` is disposable.

## Ship to TestFlight

Bump `CURRENT_PROJECT_VERSION` in `project.yml` (and `MARKETING_VERSION` for a new release), regenerate, then archive and upload with the App Store Connect API key (Admin role):

```sh
AUTH="-allowProvisioningUpdates -authenticationKeyPath $ASC_KEY_PATH -authenticationKeyID $ASC_KEY_ID -authenticationKeyIssuerID $ASC_ISSUER_ID"
xcodebuild archive -project WainwrightsBaggers.xcodeproj -scheme WainwrightsBaggers \
  -destination 'generic/platform=iOS' -archivePath build/WainwrightsBaggers.xcarchive \
  -derivedDataPath build/DerivedData -clonedSourcePackagesDirPath build/SourcePackages $=AUTH
xcodebuild -exportArchive -archivePath build/WainwrightsBaggers.xcarchive \
  -exportOptionsPlist Config/ExportOptions.plist -exportPath build/export $=AUTH
```

(`$=AUTH` is zsh word splitting; in bash use `$AUTH`.) Apple processes the build in a few minutes. Then add it to the internal TestFlight group if it is not added automatically.

## App icon

`scripts/make-icon.py` draws the placeholder icon (needs Pillow). Replace `Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png` with the real one when it exists.
