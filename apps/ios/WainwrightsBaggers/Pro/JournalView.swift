import QuickLook
import SwiftUI

/// The walker's albums: bagged fells grouped by the year they were walked, newest year first,
/// each year in walking order, with a printable PDF per year.
struct JournalView: View {
    @Environment(ProgressStore.self) private var progress
    @Environment(AppModel.self) private var model

    @State private var exporting: Int?
    @State private var pdfURL: URL?
    @State private var exportFailed = false

    struct YearGroup: Identifiable {
        let year: Int?
        let entries: [JournalEntry]
        var id: Int { year ?? .min }
        var title: String { year.map { String($0) } ?? "Undated" }
    }

    var body: some View {
        let groups = self.groups
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 34) {
                ForEach(groups) { group in
                    VStack(alignment: .leading, spacing: 14) {
                        header(group)
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12, alignment: .top), GridItem(.flexible(), spacing: 12, alignment: .top)], spacing: 18) {
                            ForEach(group.entries) { entry in
                                if let fell = entry.fell {
                                    AlbumTile(entry: entry, fell: fell) { open(fell) }
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
        .background(Color.paper)
        .overlay {
            if groups.isEmpty {
                ContentUnavailableView(
                    "Your albums start here",
                    systemImage: "book.closed",
                    description: Text("Bag a fell with the date you walked it. Each year becomes an album you can fill with notes and photos, and print.")
                )
            }
        }
        .navigationTitle("Journal")
        .quickLookPreview($pdfURL)
        .alert("Could not make the album", isPresented: $exportFailed) {
            Button("OK") {}
        } message: {
            Text("Check your connection so the photos can load, then try again.")
        }
    }

    private var groups: [YearGroup] {
        let grouped = Dictionary(grouping: progress.baggedEntries.filter { $0.fell != nil }, by: \.year)
        return grouped.keys
            .sorted { ($0 ?? .min) > ($1 ?? .min) }
            .map { year in
                YearGroup(year: year, entries: (grouped[year] ?? []).sorted(by: Self.walkingOrder))
            }
    }

    static func walkingOrder(_ a: JournalEntry, _ b: JournalEntry) -> Bool {
        switch (a.date, b.date) {
        case let (left?, right?) where left != right: left < right
        default: (a.fell?.name ?? "") < (b.fell?.name ?? "")
        }
    }

    private func header(_ group: YearGroup) -> some View {
        let photos = group.entries.reduce(0) { $0 + $1.photoList.count }
        return HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(group.title)
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                Text("\(group.entries.count) \(group.entries.count == 1 ? "fell" : "fells")\(photos > 0 ? " · \(photos) \(photos == 1 ? "photo" : "photos")" : "")")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
            Spacer()
            if let year = group.year {
                Button {
                    export(year: year, entries: group.entries)
                } label: {
                    if exporting == year {
                        ProgressView()
                            .frame(width: 20, height: 20)
                    } else {
                        Label("Print album", systemImage: "printer")
                    }
                }
                .buttonStyle(.bordered)
                .tint(Color.brand)
                .controlSize(.small)
                .disabled(exporting != nil)
                .accessibilityLabel("Make a printable album of \(String(year))")
            }
        }
    }

    private func export(year: Int, entries: [JournalEntry]) {
        exporting = year
        Task {
            defer { exporting = nil }
            do {
                pdfURL = try await AlbumPDF.make(year: year, entries: entries)
            } catch {
                exportFailed = true
            }
        }
    }

    /// Back to the map, on this fell.
    private func open(_ fell: Fell) {
        model.screen = nil
        model.showsProfile = false
        Task {
            try? await Task.sleep(for: .milliseconds(350))
            model.select(fell)
        }
    }
}

private struct AlbumTile: View {
    let entry: JournalEntry
    let fell: Fell
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                Color.clear
                    .aspectRatio(1, contentMode: .fit)
                    .overlay {
                        if let photo = entry.photoList.first {
                            JournalPhotoView(photo: photo)
                        } else {
                            FellArtwork(fell: fell)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(alignment: .topTrailing) {
                        if entry.photoList.count > 1 {
                            Label("\(entry.photoList.count)", systemImage: "photo.on.rectangle")
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 4)
                                .background(.black.opacity(0.35), in: Capsule())
                                .padding(8)
                        }
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text(fell.name)
                        .font(.system(.headline, design: .serif))
                        .lineLimit(1)
                    Text(entry.date?.formatted(.dateTime.day().month(.abbreviated)) ?? fell.book.title)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let note = entry.note, !note.isEmpty {
                        Text(note)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                            .padding(.top, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Shows \(fell.name) on the map")
    }
}
