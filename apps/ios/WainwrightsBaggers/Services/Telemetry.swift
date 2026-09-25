import Foundation
import PostHog
import Sentry

/// Crash and error reports (Sentry) and anonymous product events (PostHog).
///
/// Neither knows who the walker is: no user ID, name or email is ever set, Sentry sends no
/// default PII, and PostHog never identifies, so it keeps no person profiles. The funnel events
/// are `app_opened`, `fell_bagged`, `paywall_shown`, `purchase_started`, `trial_started` and
/// `subscribed`. No screen views, no autocapture, no session replay.
enum Telemetry {
    #if DEBUG
    static let environment = "debug"
    #else
    static let environment = "production"
    #endif

    /// Call once, first thing at launch.
    static func start() {
        SentrySDK.start { options in
            options.dsn = AppConfig.string("SentryDSN")
            options.environment = environment
            // Release defaults to com.wainwrightsbaggers.mobile@<version>+<build>.
            options.sendDefaultPii = false
            // Request URLs can carry upload tokens; failures we care about are reported below.
            options.enableNetworkBreadcrumbs = false
            options.enableCaptureFailedRequests = false
        }

        let config = PostHogConfig(apiKey: AppConfig.string("PostHogProjectToken"), host: "https://us.i.posthog.com")
        config.captureApplicationLifecycleEvents = false
        config.captureScreenViews = false
        config.personProfiles = .identifiedOnly
        PostHogSDK.shared.setup(config)
        PostHogSDK.shared.register(["app": "ios", "environment": environment])
    }

    static func capture(_ event: String, _ properties: [String: Any] = [:]) {
        PostHogSDK.shared.capture(event, properties: properties)
    }

    /// A non-fatal error worth fixing. `flow` is `sync`, `photo_upload` or `purchase`.
    static func report(_ error: Error, flow: String) {
        SentrySDK.capture(error: error) { scope in
            scope.setTag(value: flow, key: "flow")
        }
    }
}
