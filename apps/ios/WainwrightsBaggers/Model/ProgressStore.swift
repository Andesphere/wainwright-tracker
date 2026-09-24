@preconcurrency import ConvexMobile
import Foundation
import Observation

/// The signed-in walker's bagged fells, live from Convex.
///
/// Clerk owns the session; this store follows it. While signed in it keeps one
/// subscription to `progress:get` open, so a fell bagged on the web appears here
/// within a second. Bagging is optimistic: the map changes at once and rolls back
/// if the mutation fails.
@Observable
final class ProgressStore {
    enum Sync: Equatable {
        case signedOut
        case connecting
        case live
        case failed
    }

    struct PendingBag: Equatable {
        let fellId: String
        let date: Date
    }

    private(set) var sync: Sync = .signedOut
    private(set) var isSignedIn = false
    /// Last server truth.
    private var syncedIds: Set<String> = []
    /// Local writes the server has not confirmed yet: fell id to bagged.
    private var optimistic: [String: Bool] = [:]
    /// A bag the walker asked for while signed out; completed after sign-in.
    var bagAfterSignIn: PendingBag?
    /// Short, human message for the map notice.
    var errorMessage: String?

    var baggedIds: Set<String> {
        var ids = syncedIds
        for (id, bagged) in optimistic {
            if bagged { ids.insert(id) } else { ids.remove(id) }
        }
        return ids
    }

    var baggedCount: Int { baggedIds.count }

    func isBagged(_ fell: Fell) -> Bool { baggedIds.contains(fell.id) }

    @ObservationIgnored private let client: ConvexClientWithAuth<String>
    @ObservationIgnored private var authTask: Task<Void, Never>?
    @ObservationIgnored private var subscriptionTask: Task<Void, Never>?

    init(deploymentURL: String) {
        client = ConvexClientWithAuth(deploymentUrl: deploymentURL, authProvider: ClerkConvexAuthProvider())
        authTask = Task { [weak self, client] in
            for await state in client.authState.values {
                self?.handle(state)
            }
        }
    }

    /// Call whenever Clerk's active session changes (including on launch).
    func sessionChanged(active: Bool) async {
        isSignedIn = active
        if active {
            sync = .connecting
            _ = await client.loginFromCache()
        } else {
            await client.logout()
        }
    }

    /// Retry after a failed connection, for example when the app returns to the foreground.
    func reconnectIfNeeded() async {
        guard isSignedIn, sync == .failed else { return }
        sync = .connecting
        _ = await client.loginFromCache()
    }

    func setBagged(_ fell: Fell, _ bagged: Bool, on date: Date = .now) async {
        guard sync == .live else { return }
        optimistic[fell.id] = bagged
        var args: [String: ConvexEncodable?] = ["id": fell.id, "bagged": bagged]
        if bagged { args["completedAt"] = Self.dayFormatter.string(from: date) }
        do {
            try await client.mutation("progress:setBagged", with: args)
            if bagged { syncedIds.insert(fell.id) } else { syncedIds.remove(fell.id) }
        } catch {
            errorMessage = "Could not save \(fell.name). Check your connection and try again."
        }
        optimistic[fell.id] = nil
    }

    /// Removes the walker's progress, photos, profile and follows from Convex.
    func deleteMyData() async throws {
        try await client.mutation("account:deleteMyData", with: [:])
    }

    private func handle(_ state: AuthState<String>) {
        switch state {
        case .loading:
            sync = .connecting
        case .authenticated:
            // Stay "connecting" until the first result arrives: a token Convex rejects
            // must not look like a live account with nothing bagged.
            subscribe()
        case .unauthenticated:
            subscriptionTask?.cancel()
            subscriptionTask = nil
            syncedIds = []
            optimistic = [:]
            sync = isSignedIn ? .failed : .signedOut
        }
    }

    private func subscribe() {
        subscriptionTask?.cancel()
        subscriptionTask = Task { [weak self, client] in
            do {
                for try await ids in client.subscribe(to: "progress:get", yielding: [String].self).values {
                    self?.received(ids)
                }
            } catch {
                guard !Task.isCancelled else { return }
                self?.sync = .failed
            }
        }
    }

    private func received(_ ids: [String]) {
        syncedIds = Set(ids)
        guard sync != .live else { return }
        sync = .live
        if let pending = bagAfterSignIn, let fell = FellCatalog.byId[pending.fellId] {
            bagAfterSignIn = nil
            Task { await setBagged(fell, true, on: pending.date) }
        }
    }

    private static let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
