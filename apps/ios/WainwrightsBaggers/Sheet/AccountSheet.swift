import ClerkKit
import SwiftUI

/// Who is signed in, Pro, sign out, and delete account.
///
/// Deleting clears the walker's data in Convex first (`account:deleteMyData`), then the
/// Clerk user, the same order as the web: once the Clerk user is gone the app can no longer
/// authenticate to remove the data. Clerk's prebuilt profile view is not used because its
/// delete button would skip that cleanup.
struct AccountSheet: View {
    @Environment(Clerk.self) private var clerk
    @Environment(ProgressStore.self) private var progress
    @Environment(ProStore.self) private var pro
    @Environment(\.dismiss) private var dismiss

    @State private var confirmingDelete = false
    @State private var working = false
    @State private var restoring = false
    @State private var showsPaywall = false
    @State private var failure: String?
    @State private var restoreMessage: String?

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

                proSection

                Section {
                    Button("Sign out") {
                        Task { await run { try await clerk.auth.signOut() } }
                    }
                    .foregroundStyle(Color.brand)
                }

                Section {
                    Button("Delete account", role: .destructive) { confirmingDelete = true }
                } footer: {
                    Text(deleteFooter)
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
                Text(pro.isPro ? "This cannot be undone. Your App Store subscription keeps running until you cancel it." : "This cannot be undone.")
            }
            .alert("Something went wrong", isPresented: .constant(failure != nil)) {
                Button("OK") { failure = nil }
            } message: {
                Text(failure ?? "")
            }
            .alert("Restore Purchases", isPresented: .constant(restoreMessage != nil)) {
                Button("OK") { restoreMessage = nil }
            } message: {
                Text(restoreMessage ?? "")
            }
            .sheet(isPresented: $showsPaywall) {
                PaywallView(highlight: nil)
                    .environment(clerk)
                    .environment(pro)
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private var proSection: some View {
        Section {
            if pro.isPro {
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title2)
                        .foregroundStyle(Color.bagged)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(pro.planName.map { "Pro · \($0)" } ?? "Pro")
                            .font(.headline)
                        if let renewal = pro.renewalLine {
                            Text(renewal)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.vertical, 2)
                .accessibilityElement(children: .combine)

                NavigationLink {
                    JournalView()
                } label: {
                    Label("Journal", systemImage: "book.closed")
                }
                NavigationLink {
                    StatsView()
                } label: {
                    Label("Stats", systemImage: "chart.bar.xaxis")
                }
                Button("Manage Subscription") {
                    Task { await pro.showManageSubscriptions() }
                }
                .foregroundStyle(Color.brand)
            } else {
                Button {
                    showsPaywall = true
                } label: {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Upgrade to Pro")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text("Photo journal, albums, map layers and stats")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 8)
                        ProBadge()
                    }
                    .padding(.vertical, 2)
                }
            }

            Button {
                restore()
            } label: {
                HStack {
                    Text("Restore Purchases")
                    Spacer()
                    if restoring { ProgressView() }
                }
            }
            .foregroundStyle(Color.brand)
            .disabled(restoring)
        } header: {
            Text("Wainwrights Baggers Pro")
        }
    }

    private var deleteFooter: String {
        let base = "Removes your fells, notes, photos and profile everywhere, then your sign-in."
        return pro.isPro
            ? base + " It does not cancel your App Store subscription: cancel it in Manage Subscription first."
            : base
    }

    private var name: String {
        let parts = [clerk.user?.firstName, clerk.user?.lastName].compactMap { $0 }.filter { !$0.isEmpty }
        return parts.isEmpty ? "Signed in" : parts.joined(separator: " ")
    }

    private func restore() {
        restoring = true
        Task {
            defer { restoring = false }
            do {
                restoreMessage = try await pro.restore()
                    ? "Pro is active on this account."
                    : "This Apple ID has no active Wainwrights Baggers Pro subscription."
            } catch {
                restoreMessage = error.localizedDescription
            }
        }
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
