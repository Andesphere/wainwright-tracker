import SwiftUI

/// The sheet when a fell is selected: name, height, book, and Bag it.
struct FellCard: View {
    let fell: Fell

    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress
    @State private var date = Date.now

    private static let heightRank: [String: Int] = Dictionary(
        uniqueKeysWithValues: FellCatalog.all
            .sorted { $0.heightMetres > $1.heightMetres }
            .enumerated()
            .map { ($1.id, $0 + 1) }
    )

    var body: some View {
        let bagged = progress.isBagged(fell)

        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(fell.name)
                            .font(.system(.title, design: .serif).weight(.semibold))
                            .fixedSize(horizontal: false, vertical: true)
                        Text("\(fell.book.title) · Book \(fell.book.ordinal)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 0)
                    Button {
                        model.clearSelection()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.secondary)
                            .frame(width: 34, height: 34)
                            .background(Color.primary.opacity(0.08), in: Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close")
                }

                HStack(spacing: 10) {
                    Stat(title: "Height", value: fell.heightLabel, detail: "\(fell.heightFt.formatted()) ft")
                    Stat(title: "Book", value: fell.book.ordinal, detail: fell.book.name)
                    Stat(title: "Rank", value: "#\(Self.heightRank[fell.id] ?? 0)", detail: "by height")
                }

                if bagged {
                    baggedSection
                } else {
                    bagSection
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 24)
        }
        .scrollBounceBehavior(.basedOnSize)
        .sensoryFeedback(trigger: bagged) { old, new in
            new && !old ? .success : (old && !new ? .impact(weight: .light) : nil)
        }
    }

    private var bagSection: some View {
        VStack(spacing: 12) {
            DatePicker("Date walked", selection: $date, in: ...Date.now, displayedComponents: .date)
                .font(.subheadline)
                .tint(Color.brand)

            Button(action: bag) {
                Label("Bag it", systemImage: "checkmark.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .prominentActionStyle()
            .tint(Color.brand)
            .controlSize(.large)
            .disabled(progress.isSignedIn && progress.sync == .connecting)

            if !progress.isSignedIn {
                Text("You'll sign in first. Your fells sync with wainwrightsbaggers.com.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
        }
    }

    private var baggedSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.title2)
                    .foregroundStyle(Color.bagged)
                    .symbolEffect(.bounce, value: progress.isBagged(fell))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Bagged")
                        .font(.headline)
                    Text("\(progress.baggedCount) of 214 done")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.bagged.opacity(0.16), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .accessibilityElement(children: .combine)

            Button("Mark as not bagged") {
                Task { await progress.setBagged(fell, false) }
            }
            .font(.footnote)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity)
        }
    }

    private func bag() {
        guard progress.isSignedIn else {
            progress.bagAfterSignIn = .init(fellId: fell.id, date: date)
            model.showsAuth = true
            return
        }
        guard progress.sync == .live else {
            model.show("Not connected yet. Try again in a moment.")
            return
        }
        Task { await progress.setBagged(fell, true, on: date) }
    }
}

private struct Stat: View {
    let title: String
    let value: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}
