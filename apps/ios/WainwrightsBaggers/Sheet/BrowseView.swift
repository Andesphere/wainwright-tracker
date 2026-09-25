import ClerkKit
import SwiftUI

/// The sheet when no fell is selected: search, overall progress, the seven books, and the fell list.
struct BrowseView: View {
    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress
    @FocusState private var searchFocused: Bool

    var body: some View {
        @Bindable var model = model

        VStack(spacing: 0) {
            HStack(spacing: 10) {
                SearchField(text: $model.searchText, focused: $searchFocused)
                AccountButton()
            }
            .padding(.horizontal, 16)
            .padding(.top, 18)

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    if model.searchText.isEmpty {
                        ProgressSummary()
                            .padding(.horizontal, 16)
                            .padding(.top, 14)

                        ProShortcuts()
                            .padding(.horizontal, 16)
                            .padding(.top, 14)

                        SectionTitle("The seven books")
                        BookStrip()

                        Picker("Show", selection: $model.statusFilter) {
                            ForEach(AppModel.StatusFilter.allCases) { Text($0.rawValue).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal, 16)
                        .padding(.top, 22)

                        SectionTitle(listTitle)
                    }

                    if results.isEmpty {
                        emptyState
                    } else {
                        LazyVStack(spacing: 0) {
                            ForEach(results) { fell in
                                FellRow(fell: fell, isBagged: progress.baggedIds.contains(fell.id)) {
                                    searchFocused = false
                                    model.searchText = ""
                                    model.select(fell)
                                }
                            }
                        }
                        .padding(.top, model.searchText.isEmpty ? 0 : 10)
                    }
                }
                .padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.immediately)
            .scrollIndicators(.hidden)
        }
        .onChange(of: searchFocused) { _, focused in
            if focused { model.detent = .large }
        }
        .onChange(of: model.detent) { _, detent in
            if detent != .large { searchFocused = false }
        }
    }

    private var results: [Fell] {
        let query = model.searchText.trimmingCharacters(in: .whitespaces)
        let bagged = progress.baggedIds
        return FellCatalog.alphabetical.filter { fell in
            if !query.isEmpty { return fell.name.localizedStandardContains(query) }
            if let book = model.bookFilter, fell.book != book { return false }
            switch model.statusFilter {
            case .all: return true
            case .toGo: return !bagged.contains(fell.id)
            case .bagged: return bagged.contains(fell.id)
            }
        }
    }

    private var listTitle: String {
        let scope = model.bookFilter.map { "\($0.name) fells" } ?? "All fells"
        return "\(scope) · \(results.count)"
    }

    @ViewBuilder
    private var emptyState: some View {
        if !model.searchText.isEmpty {
            ContentUnavailableView.search(text: model.searchText)
                .padding(.top, 20)
        } else {
            Text(model.statusFilter == .bagged ? "Nothing bagged here yet." : "Every fell here is bagged.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 28)
        }
    }
}

private struct SectionTitle: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
            .padding(.horizontal, 16)
            .padding(.top, 24)
            .padding(.bottom, 8)
            .accessibilityAddTraits(.isHeader)
    }
}

private struct SearchField: View {
    @Binding var text: String
    var focused: FocusState<Bool>.Binding

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            TextField("Search 214 fells", text: $text)
                .focused(focused)
                .submitLabel(.search)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.words)
            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.tertiary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, 14)
        .frame(minHeight: 44)
        .background(Color.primary.opacity(0.07), in: Capsule())
    }
}

private struct AccountButton: View {
    @Environment(Clerk.self) private var clerk
    @Environment(AppModel.self) private var model

    var body: some View {
        Button {
            if clerk.user == nil { model.showsAuth = true } else { model.showsProfile = true }
        } label: {
            Group {
                if let user = clerk.user, let url = URL(string: user.imageUrl) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        Circle().fill(Color.brand.opacity(0.25))
                    }
                } else {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 30, weight: .regular))
                        .foregroundStyle(Color.brand)
                }
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(clerk.user == nil ? "Sign in" : "Account")
    }
}

/// "12 of 214" with a ring, and what to do next.
private struct ProgressSummary: View {
    @Environment(ProgressStore.self) private var progress
    @Environment(AppModel.self) private var model

    var body: some View {
        let count = progress.baggedCount
        let total = FellCatalog.all.count

        HStack(spacing: 14) {
            ProgressRing(fraction: Double(count) / Double(total), lineWidth: 5.5)
                .frame(width: 46, height: 46)
                .overlay {
                    Image(systemName: "mountain.2.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.brand)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(count) of \(total)")
                    .font(.system(.title3, design: .serif).weight(.semibold))
                    .contentTransition(.numericText(value: Double(count)))
                    .animation(.snappy, value: count)
                subtitle
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if progress.sync == .connecting {
                ProgressView()
                    .accessibilityLabel("Syncing")
            }
        }
        .accessibilityElement(children: .combine)
    }

    @ViewBuilder
    private var subtitle: some View {
        switch progress.sync {
        case .signedOut:
            Button("Sign in to bag fells") { model.showsAuth = true }
                .foregroundStyle(Color.brand)
        case .connecting:
            Text("Syncing your fells")
        case .failed:
            Text("Offline. Showing the map only.")
        case .live:
            let left = FellCatalog.all.count - progress.baggedCount
            Text(progress.baggedCount == 0 ? "Tap a fell to bag your first" : left == 0 ? "All 214 bagged" : "\(left) to go")
        }
    }
}

/// Journal and Stats, one tap from the sheet. Free walkers see them locked; a tap opens the paywall.
private struct ProShortcuts: View {
    @Environment(AppModel.self) private var model
    @Environment(ProStore.self) private var pro
    @Environment(ProgressStore.self) private var progress

    var body: some View {
        HStack(spacing: 10) {
            shortcut(title: "Journal", subtitle: journalSubtitle, symbol: "book.closed", feature: .albums, screen: .journal)
            shortcut(title: "Stats", subtitle: "Years, books, records", symbol: "chart.bar.xaxis", feature: .stats, screen: .stats)
        }
    }

    private var journalSubtitle: String {
        guard pro.isPro else { return "Notes, photos, albums" }
        let photos = progress.entries.values.reduce(0) { $0 + $1.photoList.count }
        return photos == 0 ? "Albums by year" : "\(photos) \(photos == 1 ? "photo" : "photos")"
    }

    private func shortcut(title: String, subtitle: String, symbol: String, feature: ProFeature, screen: AppModel.Screen) -> some View {
        Button {
            if pro.isPro { model.screen = screen } else { model.paywall = feature }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: symbol)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.brand)
                    .frame(width: 34, height: 34)
                    .background(Color.brand.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                VStack(alignment: .leading, spacing: 1) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                Spacer(minLength: 0)
                if !pro.isPro {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity)
            .background(Color.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(pro.isPro ? title : "\(title), Pro")
    }
}

/// The seven Pictorial Guides as a horizontal strip. Tap to filter the list and frame the book on the map.
private struct BookStrip: View {
    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress

    var body: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 10) {
                ForEach(Book.allCases) { book in
                    let fells = FellCatalog.byBook[book] ?? []
                    let done = fells.filter { progress.baggedIds.contains($0.id) }.count
                    let selected = model.bookFilter == book
                    Button {
                        model.toggleBookFilter(book)
                    } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                ProgressRing(fraction: Double(done) / Double(max(fells.count, 1)), lineWidth: 3.5)
                                    .frame(width: 22, height: 22)
                                Spacer(minLength: 4)
                                Text("\(done)/\(fells.count)")
                                    .font(.caption.monospacedDigit().weight(.medium))
                                    .foregroundStyle(.secondary)
                            }
                            VStack(alignment: .leading, spacing: 1) {
                                Text(book.name)
                                    .font(.subheadline.weight(.semibold))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.8)
                                Text("Book \(book.ordinal)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(12)
                        .frame(width: 124, alignment: .leading)
                        .background(
                            selected ? Color.brand.opacity(0.2) : Color.primary.opacity(0.06),
                            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
                        )
                        .overlay {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .strokeBorder(selected ? Color.brand : .clear, lineWidth: 1.5)
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(book.title), \(done) of \(fells.count) bagged")
                    .accessibilityAddTraits(selected ? .isSelected : [])
                    .accessibilityHint(selected ? "Shows all books" : "Shows only this book")
                }
            }
            .padding(.horizontal, 16)
        }
        .scrollIndicators(.hidden)
    }
}

private struct FellRow: View {
    let fell: Fell
    let isBagged: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                FellDot(isBagged: isBagged)
                VStack(alignment: .leading, spacing: 2) {
                    Text(fell.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                    Text("\(fell.book.name) · \(fell.heightLabel)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .overlay(alignment: .bottom) {
            Divider().padding(.leading, 52)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(fell.name), \(fell.heightLabel.dropLast(2)) metres, \(fell.book.title)\(isBagged ? ", bagged" : "")")
        .accessibilityHint("Shows the fell on the map")
        .accessibilityAddTraits(.isButton)
    }
}

/// The map marker, at list size.
struct FellDot: View {
    let isBagged: Bool

    var body: some View {
        ZStack {
            Circle().fill(isBagged ? Color.bagged : Color.cream)
            Circle().strokeBorder(Color.pine, lineWidth: 1.8)
            if isBagged {
                Image(systemName: "checkmark")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(Color.pine)
            }
        }
        .frame(width: 22, height: 22)
        .accessibilityHidden(true)
    }
}

struct ProgressRing: View {
    let fraction: Double
    var lineWidth: CGFloat = 5

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.brand.opacity(0.2), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: fraction)
                .stroke(Color.bagged, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
        .animation(.spring(duration: 0.7), value: fraction)
    }
}
