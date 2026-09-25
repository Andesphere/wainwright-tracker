import ClerkKit
import ClerkKitUI
import SwiftUI

@main
struct WainwrightsBaggersApp: App {
    @State private var model = AppModel()
    @State private var progress: ProgressStore
    @State private var pro: ProStore
    @State private var clerkTheme = ClerkTheme(colors: .init(primary: .brand))

    init() {
        Telemetry.start()
        Clerk.configure(publishableKey: AppConfig.string("ClerkPublishableKey"))
        let progress = ProgressStore(deploymentURL: AppConfig.string("ConvexDeploymentURL"))
        _progress = State(initialValue: progress)
        _pro = State(initialValue: ProStore(client: progress.client, apiKey: Self.revenueCatKey))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(progress)
                .environment(pro)
                .environment(\.clerkTheme, clerkTheme)
                .tint(.brand)
                .prefetchClerkImages()
                .environment(Clerk.shared)
        }
    }
}

extension WainwrightsBaggersApp {
    /// The App Store key. Debug builds take RevenueCat's Test Store key from the launch environment
    /// instead, so UI tests can buy Pro in the Simulator without StoreKit (see the UI tests).
    static var revenueCatKey: String {
        #if DEBUG
        if let testStore = ProcessInfo.processInfo.environment["REVENUECAT_TEST_STORE_KEY"], testStore.hasPrefix("test_") {
            return testStore
        }
        #endif
        return AppConfig.string("RevenueCatAPIKey")
    }
}

enum AppConfig {
    /// Values injected into Info.plist from Config/Secrets.xcconfig and project.yml.
    static func string(_ key: String) -> String {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String, !value.isEmpty else {
            fatalError("\(key) is missing from Info.plist. Copy Config/Secrets.example.xcconfig to Config/Secrets.xcconfig.")
        }
        return value
    }
}
