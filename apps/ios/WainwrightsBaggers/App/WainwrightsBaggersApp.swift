import ClerkKit
import ClerkKitUI
import SwiftUI

@main
struct WainwrightsBaggersApp: App {
    @State private var model = AppModel()
    @State private var progress: ProgressStore
    @State private var clerkTheme = ClerkTheme(colors: .init(primary: .brand))

    init() {
        Clerk.configure(publishableKey: AppConfig.string("ClerkPublishableKey"))
        _progress = State(initialValue: ProgressStore(deploymentURL: AppConfig.string("ConvexDeploymentURL")))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(progress)
                .environment(\.clerkTheme, clerkTheme)
                .tint(.brand)
                .prefetchClerkImages()
                .environment(Clerk.shared)
        }
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
