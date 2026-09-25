# Wainwrights Baggers for iOS

Native SwiftUI app. It replaced the Expo app (removed 2026-09-24) on the same bundle ID (`com.wainwrightsbaggers.mobile`) and App Store Connect app (`6771147426`).

- **Map:** Mapbox Maps SDK for iOS 11 (SwiftUI API). Mapbox Standard style, faded theme, 3D terrain (`mapbox.mapbox-terrain-dem-v1`, exaggeration 1.3), a light preset picked from the sun's position over the Lake District, plus our own hillshade and contour lines (`mapbox.mapbox-terrain-v2`) in the `bottom` slot. The 214 fells are one GeoJSON source with two symbol layers.
- **Sign-in:** Clerk iOS SDK (`ClerkKit`, `ClerkKitUI`), production instance. The prebuilt `AuthView` opens as a sheet and offers email, Google and native Sign in with Apple (entitlement in `WainwrightsBaggers.entitlements`). The account sheet is our own (`Sheet/AccountSheet.swift`): Clerk's profile view has a delete button that would skip `account.deleteMyData`.
- **Sync:** Convex Swift client against Convex prod. `progress:get` is a live subscription while signed in; bagging calls `progress:setBagged`. Tokens come from the Clerk JWT template `convex`, see `Services/ClerkConvexAuthProvider.swift`. The official `clerk-convex-swift` bridge sends the default session token, which has no `aud` claim here, so Convex rejects it.
- **Pro:** RevenueCat `purchases-ios` 5.x (`Services/ProStore.swift`). The RevenueCat app user ID is the Clerk user ID: `logIn` on sign-in, `logOut` on sign-out. Pro is the `pro` entitlement; the app also watches `billing:mine` in Convex and calls `billing:refresh` after a purchase or restore. The paywall is our own (`Pro/PaywallView.swift`); prices come from the StoreKit product, never hardcoded. Pro screens live in `Pro/`: photo journal on the fell card, Journal albums with a PDF per year, Stats. Map layers (Standard, Satellite, Contours) are in `Map/`.
- **Targets:** iOS 18.0+, iPhone, portrait. Liquid Glass on iOS 26 with a material fallback.

## Setup

```sh
brew install xcodegen
cd apps/ios
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig   # then fill in the five values
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

## Test purchases

- **From Xcode:** the scheme's Run action uses `Config/WainwrightsBaggers.storekit` (both plans, GBP, 7-day trial on yearly), so Product > Run buys locally in the Simulator. RevenueCat validates these because Xcode's StoreKit test certificate is uploaded to the RevenueCat app.
- **UI tests (`WainwrightsBaggersUITests`):** StoreKit test sessions never reach the app from `xcodebuild test`, so the tests buy through RevenueCat's Test Store instead. Debug builds switch to the Test Store when the launch environment has `REVENUECAT_TEST_STORE_KEY` (a `test_` key); Release builds ignore it. The Test Store products `test_pro_yearly` (£14.99) and `test_pro_monthly` (£1.99) sit next to the App Store products in the `pro` entitlement and the default offering. They are not live products. `ProFlowUITests.testProJourney` needs a free, signed-in walker with dated fells and walks every Pro screen, saving screenshots:

```sh
TEST_RUNNER_REVENUECAT_TEST_STORE_KEY=test_... TEST_RUNNER_SCREENSHOT_DIR=/tmp/shots \
xcodebuild test -project WainwrightsBaggers.xcodeproj -scheme WainwrightsBaggers \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build/DerivedData \
  -only-testing:WainwrightsBaggersUITests/ProFlowUITests/testProJourney
```
- **TestFlight and App Review** buy the real products in Apple's sandbox with the tester's own Apple ID.

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

"Trig pillar", chosen on 2026-09-24. `Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png` is the 1024 px master: RGB, no alpha, square corners. The vector is `apps/web/public/icon.svg`; the web's `favicon.svg` is a simplified cut (pillar and gold tick) that reads at 16 px.
