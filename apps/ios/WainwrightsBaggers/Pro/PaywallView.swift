import ClerkKit
import ClerkKitUI
@preconcurrency import RevenueCat
import SwiftUI

/// The Pro paywall, in the app's own look: a contour-map hero, the four things Pro adds,
/// the yearly plan first (with its free trial when the Apple ID can still take it), then monthly.
/// Prices always come from the App Store product, in the walker's own currency.
struct PaywallView: View {
    /// The feature that led here, highlighted in the list.
    let highlight: ProFeature?

    @Environment(ProStore.self) private var pro
    @Environment(Clerk.self) private var clerk
    @Environment(\.dismiss) private var dismiss

    @State private var plan: Plan = .yearly
    @State private var working: Working?
    @State private var showsAuth = false
    @State private var alert: PaywallAlert?
    @State private var succeeded = false

    enum Plan: Hashable { case yearly, monthly }
    private enum Working { case purchasing, restoring }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                PaywallHero()
                benefits
                    .padding(.horizontal, 16)
                    .padding(.top, 14)
                plans
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                legal
                    .padding(.horizontal, 24)
                    .padding(.top, 22)
                    .padding(.bottom, 16)
            }
        }
        .scrollBounceBehavior(.basedOnSize)
        .ignoresSafeArea(edges: .top)
        .background(Color.paper)
        .safeAreaInset(edge: .bottom, spacing: 0) { callToAction }
        .overlay(alignment: .topTrailing) { closeButton }
        .overlay { if succeeded { SuccessView().transition(.opacity) } }
        .animation(.smooth(duration: 0.35), value: succeeded)
        .sensoryFeedback(.success, trigger: succeeded)
        .task { await pro.loadOffering() }
        .onAppear { Telemetry.capture("paywall_shown", ["feature": highlight?.rawValue ?? "none"]) }
        .sheet(isPresented: $showsAuth) {
            AuthView()
                .environment(clerk)
        }
        .alert(item: $alert) { alert in
            Alert(title: Text(alert.title), message: Text(alert.message), dismissButton: .default(Text("OK")))
        }
        .interactiveDismissDisabled(working != nil)
    }

    // MARK: - Benefits

    private var benefits: some View {
        VStack(spacing: 2) {
            ForEach(ProFeature.allCases) { feature in
                HStack(spacing: 12) {
                    Image(systemName: feature.symbol)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Color.cream)
                        .frame(width: 36, height: 36)
                        .background(
                            LinearGradient(colors: [Color(Palette.leaf), Color(Palette.moss)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                        )
                    VStack(alignment: .leading, spacing: 1) {
                        Text(feature.title)
                            .font(.subheadline.weight(.semibold))
                        Text(feature.pitch)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(
                    feature == highlight ? Color.bagged.opacity(0.14) : .clear,
                    in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                )
                .accessibilityElement(children: .combine)
            }
        }
    }

    // MARK: - Plans

    @ViewBuilder
    private var plans: some View {
        VStack(spacing: 10) {
            switch pro.offeringState {
            case .loading:
                PlanCard(title: "Yearly", price: "£00.00 a year", detail: "Loading price", badge: nil, isSelected: true) {}
                    .redacted(reason: .placeholder)
                PlanCard(title: "Monthly", price: "£0.00 a month", detail: nil, badge: nil, isSelected: false) {}
                    .redacted(reason: .placeholder)
            case .failed:
                VStack(spacing: 10) {
                    Text("Prices could not load. Check your connection.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button("Try again") { Task { await pro.loadOffering() } }
                        .font(.subheadline.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            case .loaded:
                if let annual = pro.offering?.annual {
                    PlanCard(
                        title: "Yearly",
                        price: "\(annual.storeProduct.localizedPriceString) a year",
                        detail: yearlyDetail(annual),
                        badge: savings,
                        isSelected: plan == .yearly
                    ) { plan = .yearly }
                }
                if let monthly = pro.offering?.monthly {
                    PlanCard(
                        title: "Monthly",
                        price: "\(monthly.storeProduct.localizedPriceString) a month",
                        detail: "Cancel any time",
                        badge: nil,
                        isSelected: plan == .monthly
                    ) { plan = .monthly }
                }
            }
        }
        .animation(.snappy(duration: 0.2), value: plan)
    }

    private func yearlyDetail(_ annual: Package) -> String {
        let product = annual.storeProduct
        if pro.isTrialEligible, let trial = product.introductoryDiscount, trial.paymentMode == .freeTrial {
            return "\(trial.subscriptionPeriod.trialLabel) free trial, then \(product.localizedPriceString)/year"
        }
        if let perMonth = product.localizedPricePerMonth {
            return "\(perMonth) a month, billed yearly"
        }
        return "Billed once a year"
    }

    /// "Save 37%" against twelve months of the monthly plan, from the store prices.
    private var savings: String? {
        guard let yearly = pro.offering?.annual?.storeProduct.price,
              let monthly = pro.offering?.monthly?.storeProduct.price, monthly > 0
        else { return nil }
        let saving = 1 - (yearly as NSDecimalNumber).doubleValue / ((monthly as NSDecimalNumber).doubleValue * 12)
        guard saving >= 0.05 else { return nil }
        return "Save \(Int((saving * 100).rounded(.down)))%"
    }

    private var selectedPackage: Package? {
        plan == .yearly ? pro.offering?.annual : pro.offering?.monthly
    }

    private var startsTrial: Bool {
        plan == .yearly && pro.isTrialEligible && selectedPackage?.storeProduct.introductoryDiscount?.paymentMode == .freeTrial
    }

    // MARK: - Call to action

    private var callToAction: some View {
        VStack(spacing: 10) {
            Button(action: subscribe) {
                ZStack {
                    Text(buttonTitle)
                        .opacity(working == .purchasing ? 0 : 1)
                    if working == .purchasing {
                        ProgressView().tint(Color.cream)
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
            }
            .prominentActionStyle()
            .tint(Color.brand)
            .controlSize(.large)
            .disabled(working != nil || (clerk.user != nil && selectedPackage == nil))

            Text(billingLine)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .contentTransition(.opacity)

            Button {
                restore()
            } label: {
                if working == .restoring {
                    ProgressView()
                } else {
                    Text("Restore Purchases")
                }
            }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Color.brand)
            .disabled(working != nil)
        }
        .padding(.horizontal, 20)
        .padding(.top, 14)
        .padding(.bottom, 6)
        .background(.bar)
    }

    private var buttonTitle: String {
        if clerk.user == nil { return "Sign in to subscribe" }
        return startsTrial ? "Start free trial" : "Subscribe"
    }

    private var billingLine: String {
        guard let product = selectedPackage?.storeProduct else { return "Cancel any time in Settings." }
        if startsTrial, let trial = product.introductoryDiscount {
            return "\(trial.subscriptionPeriod.trialLabel.capitalized) free trial, then \(product.localizedPriceString) a year. Cancel any time."
        }
        return plan == .yearly
            ? "\(product.localizedPriceString) a year. Cancel any time."
            : "\(product.localizedPriceString) a month. Cancel any time."
    }

    // MARK: - Legal

    private var legal: some View {
        VStack(spacing: 12) {
            Text("Payment is charged to your Apple ID when you confirm, or when the free trial ends. The subscription renews automatically at the same price unless it is cancelled at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the period ends. Manage or cancel it in your App Store account settings. Any unused part of a free trial is lost when you subscribe.")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 18) {
                Link("Terms of Use", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                Link("Privacy Policy", destination: URL(string: "https://wainwrightsbaggers.com/privacy")!)
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(Color.brand)
        }
    }

    private var closeButton: some View {
        Button {
            dismiss()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color.cream)
                .frame(width: 32, height: 32)
                .background(.black.opacity(0.25), in: Circle())
        }
        .buttonStyle(.plain)
        .padding(.top, 16)
        .padding(.trailing, 16)
        .accessibilityLabel("Close")
        .accessibilityIdentifier("paywall.close")
        .disabled(working != nil)
    }

    // MARK: - Actions

    private func subscribe() {
        guard let userId = clerk.user?.id else {
            showsAuth = true
            return
        }
        guard let package = selectedPackage else { return }
        let trial = startsTrial
        let properties: [String: Any] = ["plan": plan == .yearly ? "yearly" : "monthly", "trial": trial]
        Telemetry.capture("purchase_started", properties)
        working = .purchasing
        Task {
            defer { working = nil }
            do {
                switch try await pro.purchase(package, userId: userId) {
                case .purchased:
                    Telemetry.capture(trial ? "trial_started" : "subscribed", properties)
                    celebrate()
                case .cancelled: break
                case .pending: alert = .pending
                }
            } catch {
                Telemetry.report(error, flow: "purchase")
                alert = .failed(error.localizedDescription)
            }
        }
    }

    private func restore() {
        guard clerk.user != nil else {
            showsAuth = true
            return
        }
        working = .restoring
        Task {
            defer { working = nil }
            do {
                if try await pro.restore() {
                    celebrate()
                } else {
                    alert = .nothingToRestore
                }
            } catch {
                Telemetry.report(error, flow: "purchase")
                alert = .failed(error.localizedDescription)
            }
        }
    }

    private func celebrate() {
        succeeded = true
        Task {
            try? await Task.sleep(for: .seconds(1.8))
            dismiss()
        }
    }
}

// MARK: - Pieces

private struct PlanCard: View {
    let title: String
    let price: String
    let detail: String?
    let badge: String?
    let isSelected: Bool
    let select: () -> Void

    var body: some View {
        Button(action: select) {
            HStack(alignment: .top, spacing: 14) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(isSelected ? Color.brand : Color.secondary.opacity(0.5))
                    .contentTransition(.symbolEffect(.replace))
                VStack(alignment: .leading, spacing: 3) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(title)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                        Spacer(minLength: 8)
                        if let badge {
                            Text(badge)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Color.pine)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.bagged, in: Capsule())
                        }
                    }
                    Text(price)
                        .font(.system(.title3, design: .serif).weight(.semibold))
                        .foregroundStyle(.primary)
                    if let detail {
                        Text(detail)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.primary.opacity(isSelected ? 0.07 : 0.04), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(isSelected ? Color.brand : Color.primary.opacity(0.08), lineWidth: isSelected ? 2 : 1)
            }
            .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }
}

/// Pine hero with contour rings around a bagged summit, like a corner of the map.
private struct PaywallHero: View {
    @State private var appeared = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(colors: [Color.pine, Color(Palette.moss)], startPoint: .top, endPoint: .bottom)
            ContourArtwork()
                .opacity(appeared ? 1 : 0)
                .scaleEffect(appeared ? 1 : 0.92, anchor: UnitPoint(x: 0.76, y: 0.42))
            VStack(alignment: .leading, spacing: 6) {
                Text("PRO")
                    .font(.caption.weight(.heavy))
                    .tracking(2)
                    .foregroundStyle(Color.pine)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 4)
                    .background(Color.bagged, in: Capsule())
                Text("Wainwrights\nBaggers Pro")
                    .font(.system(size: 32, weight: .semibold, design: .serif))
                    .foregroundStyle(Color.cream)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Keep the story of every fell you bag.")
                    .font(.body)
                    .foregroundStyle(Color.cream.opacity(0.8))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
        }
        .frame(height: 226)
        .clipped()
        .onAppear {
            withAnimation(.smooth(duration: 1.1)) { appeared = true }
        }
    }
}

private struct SuccessView: View {
    @State private var popped = false

    var body: some View {
        ZStack {
            Color.paper.ignoresSafeArea()
            VStack(spacing: 14) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.bagged)
                    .symbolEffect(.bounce, value: popped)
                Text("Welcome to Pro")
                    .font(.system(.title, design: .serif).weight(.semibold))
                Text("Your journal, albums, map layers and stats are ready.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .onAppear { popped = true }
        .accessibilityElement(children: .combine)
    }
}

private enum PaywallAlert: Identifiable {
    case pending
    case nothingToRestore
    case failed(String)

    var id: String { title }

    var title: String {
        switch self {
        case .pending: "Waiting for approval"
        case .nothingToRestore: "Nothing to restore"
        case .failed: "Something went wrong"
        }
    }

    var message: String {
        switch self {
        case .pending: "Pro unlocks as soon as the purchase is approved."
        case .nothingToRestore: "This Apple ID has no active Wainwrights Baggers Pro subscription."
        case .failed(let reason): reason
        }
    }
}

extension SubscriptionPeriod {
    /// "7-day", "1-month": how a free trial reads on the paywall.
    var trialLabel: String {
        switch unit {
        case .day: "\(value)-day"
        case .week: "\(value * 7)-day"
        case .month: "\(value)-month"
        case .year: "\(value)-year"
        @unknown default: "\(value)-period"
        }
    }
}
