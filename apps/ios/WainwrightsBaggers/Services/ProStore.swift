@preconcurrency import ConvexMobile
import Foundation
import Observation
@preconcurrency import RevenueCat

/// Wainwrights Baggers Pro.
///
/// RevenueCat is the purchase authority. Its app user ID is the Clerk user ID, set on sign-in,
/// so a subscription follows the walker to the web. Convex keeps its own copy (`billing:mine`),
/// fed by RevenueCat webhooks; after a purchase or restore the app asks Convex to refresh at once.
/// The app unlocks Pro when either side says so, and nudges Convex if it lags behind.
@Observable
final class ProStore {
    static let entitlementId = "pro"

    struct ServerState: Decodable, Equatable, Sendable {
        let pro: Bool
        let expiresAt: Double?
        let productId: String?
        let willRenew: Bool?
        let periodType: String?
    }

    enum OfferingState: Equatable {
        case loading, loaded, failed
    }

    enum PurchaseResult {
        case purchased, cancelled, pending
    }

    private(set) var customerInfo: CustomerInfo?
    private(set) var server: ServerState?
    private(set) var offering: Offering?
    private(set) var offeringState: OfferingState = .loading
    /// Whether the walker's Apple ID can still take the yearly plan's free trial.
    private(set) var isTrialEligible = false

    var entitlement: EntitlementInfo? { customerInfo?.entitlements[Self.entitlementId] }
    var isPro: Bool { entitlement?.isActive == true || server?.pro == true }

    @ObservationIgnored private let client: ConvexClientWithAuth<String>
    @ObservationIgnored private var infoTask: Task<Void, Never>?
    @ObservationIgnored private var authTask: Task<Void, Never>?
    @ObservationIgnored private var serverTask: Task<Void, Never>?
    @ObservationIgnored private var nudgedServer = false

    init(client: ConvexClientWithAuth<String>, apiKey: String) {
        self.client = client
        Purchases.configure(with: Configuration.Builder(withAPIKey: apiKey).build())
        infoTask = Task { [weak self] in
            for await info in Purchases.shared.customerInfoStream {
                self?.received(info)
            }
        }
        authTask = Task { [weak self, client] in
            for await state in client.authState.values {
                self?.handle(state)
            }
        }
    }

    /// Call whenever Clerk's signed-in user changes (including on launch).
    func sessionChanged(userId: String?) async {
        nudgedServer = false
        if let userId {
            guard Purchases.shared.appUserID != userId else { return }
            _ = try? await Purchases.shared.logIn(userId)
        } else if !Purchases.shared.isAnonymous {
            _ = try? await Purchases.shared.logOut()
        }
    }

    func loadOffering() async {
        guard offering == nil else { return }
        offeringState = .loading
        do {
            let current = try await Purchases.shared.offerings().current
            offering = current
            if let annual = current?.annual, annual.storeProduct.introductoryDiscount != nil {
                let eligibility = await Purchases.shared.checkTrialOrIntroDiscountEligibility(packages: [annual])
                isTrialEligible = eligibility[annual]?.status == .eligible
            }
            offeringState = current == nil ? .failed : .loaded
        } catch {
            Telemetry.report(error, flow: .purchase)
            offeringState = .failed
        }
    }

    /// Buys `package` for the signed-in walker. Throws for real failures only.
    func purchase(_ package: Package, userId: String) async throws -> PurchaseResult {
        if Purchases.shared.appUserID != userId {
            _ = try await Purchases.shared.logIn(userId)
        }
        do {
            let result = try await Purchases.shared.purchase(package: package)
            if result.userCancelled { return .cancelled }
            customerInfo = result.customerInfo
            await refreshServer()
            return .purchased
        } catch ErrorCode.purchaseCancelledError {
            return .cancelled
        } catch ErrorCode.paymentPendingError {
            return .pending
        }
    }

    /// Returns whether Pro is active after restoring.
    func restore() async throws -> Bool {
        let info = try await Purchases.shared.restorePurchases()
        customerInfo = info
        await refreshServer()
        return info.entitlements[Self.entitlementId]?.isActive == true
    }

    func showManageSubscriptions() async {
        try? await Purchases.shared.showManageSubscriptions()
    }

    /// Asks Convex to recompute Pro from RevenueCat now instead of waiting for the webhook.
    func refreshServer() async {
        nudgedServer = true
        guard let state: ServerState = try? await client.action("billing:refresh") else { return }
        server = state
    }

    private func received(_ info: CustomerInfo) {
        customerInfo = info
        nudgeServerIfBehind()
    }

    private func nudgeServerIfBehind() {
        guard entitlement?.isActive == true, let server, !server.pro, !nudgedServer else { return }
        Task { await refreshServer() }
    }

    private func handle(_ state: AuthState<String>) {
        switch state {
        case .authenticated:
            serverTask?.cancel()
            serverTask = Task { [weak self, client] in
                do {
                    for try await state in client.subscribe(to: "billing:mine", yielding: ServerState?.self).values {
                        self?.server = state
                        self?.nudgeServerIfBehind()
                    }
                } catch {}
            }
        case .unauthenticated:
            serverTask?.cancel()
            serverTask = nil
            server = nil
        case .loading:
            break
        }
    }
}

extension ProStore {
    /// "Yearly", "Monthly" or nil, from the active entitlement or the server copy.
    var planName: String? {
        let product = entitlement?.productIdentifier ?? server?.productId
        switch product {
        case "com.wainwrightsbaggers.pro.yearly": return "Yearly"
        case "com.wainwrightsbaggers.pro.monthly": return "Monthly"
        default: return nil
        }
    }

    /// "Renews 24 Sept 2027", "Free trial until 1 Oct", "Ends 12 Oct 2026".
    var renewalLine: String? {
        let expiry = entitlement?.expirationDate ?? server?.expiresAt.map { Date(timeIntervalSince1970: $0 / 1000) }
        guard let expiry else { return nil }
        let day = expiry.formatted(date: .abbreviated, time: .omitted)
        let isTrial = entitlement.map { $0.periodType == .trial } ?? (server?.periodType == "trial")
        let willRenew = entitlement?.willRenew ?? server?.willRenew ?? true
        if isTrial { return willRenew ? "Free trial until \(day)" : "Free trial ends \(day)" }
        return willRenew ? "Renews \(day)" : "Ends \(day)"
    }
}
