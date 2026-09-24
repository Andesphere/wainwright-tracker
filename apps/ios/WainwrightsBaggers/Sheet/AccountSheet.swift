import ClerkKit
import SwiftUI

/// Who is signed in, sign out, and delete account.
///
/// Deleting clears the walker's data in Convex first (`account:deleteMyData`), then the
/// Clerk user, the same order as the web: once the Clerk user is gone the app can no longer
/// authenticate to remove the data. Clerk's prebuilt profile view is not used because its
/// delete button would skip that cleanup.
struct AccountSheet: View {
    @Environment(Clerk.self) private var clerk
    @Environment(ProgressStore.self) private var progress
    @Environment(\.dismiss) private var dismiss

    @State private var confirmingDelete = false
    @State private var working = false
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 14) {
                        AsyncImage(url: clerk.user.flatMap { URL(string: $0.imageUrl) }) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Circle().fill(Color.brand.opacity(0.25))
                        }
                        .frame(width: 52, height: 52)
                        .clipShape(Circle())
                        .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(name)
                                .font(.headline)
                            if let email = clerk.user?.primaryEmailAddress?.emailAddress {
                                Text(email)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                    .accessibilityElement(children: .combine)

                    LabeledContent("Fells bagged", value: "\(progress.baggedCount) of \(FellCatalog.all.count)")
                }

                Section {
                    Button("Sign out") {
                        Task { await run { try await clerk.auth.signOut() } }
                    }
                    .foregroundStyle(Color.brand)
                }

                Section {
                    Button("Delete account", role: .destructive) { confirmingDelete = true }
                } footer: {
                    Text("Removes your fells, notes, photos and profile everywhere, then your sign-in.")
                }
            }
            .navigationTitle("Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .disabled(working)
            .overlay {
                if working { ProgressView() }
            }
            .confirmationDialog("Delete your account?", isPresented: $confirmingDelete, titleVisibility: .visible) {
                Button("Delete account and data", role: .destructive) {
                    Task {
                        await run {
                            try await progress.deleteMyData()
                            _ = try await clerk.user?.delete()
                        }
                    }
                }
            } message: {
                Text("This cannot be undone.")
            }
            .alert("Something went wrong", isPresented: .constant(failure != nil)) {
                Button("OK") { failure = nil }
            } message: {
                Text(failure ?? "")
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var name: String {
        let parts = [clerk.user?.firstName, clerk.user?.lastName].compactMap { $0 }.filter { !$0.isEmpty }
        return parts.isEmpty ? "Signed in" : parts.joined(separator: " ")
    }

    private func run(_ action: () async throws -> Void) async {
        working = true
        do {
            try await action()
            dismiss()
        } catch {
            failure = "Please check your connection and try again."
        }
        working = false
    }
}
