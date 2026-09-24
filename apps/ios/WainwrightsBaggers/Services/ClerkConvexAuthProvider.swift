import ClerkKit
@preconcurrency import ConvexMobile

/// Hands Convex a Clerk token from the `convex` JWT template.
///
/// The official ClerkConvex bridge sends the default session token, which has no
/// `aud` claim on this Clerk instance, so Convex rejects it. The web app falls back
/// to the `convex` template in the same situation; this does the same.
/// Convex pulls a fresh token through `loginFromCache` whenever the old one expires.
nonisolated final class ClerkConvexAuthProvider: AuthProvider, Sendable {
    typealias T = String

    enum TokenError: Error {
        case noActiveSession
    }

    func login(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> String {
        try await Self.token()
    }

    func loginFromCache(onIdToken: @Sendable @escaping (String?) -> Void) async throws -> String {
        try await Self.token()
    }

    /// Signing out happens in Clerk's own UI; Convex only needs to drop the token.
    func logout() async throws {}

    func extractIdToken(from authResult: String) -> String { authResult }

    @MainActor
    private static func token() async throws -> String {
        guard let session = Clerk.shared.session, session.status == .active,
              let token = try await session.getToken(.init(template: "convex"))
        else { throw TokenError.noActiveSession }
        return token
    }
}
