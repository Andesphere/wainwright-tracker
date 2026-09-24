import SwiftUI
import UIKit

/// A year's album as an A4 PDF: a cover, an index of every fell, then two fells a page with
/// their photos and notes. Text stays vector; photos are embedded at print resolution.
enum AlbumPDF {
    static let pageSize = CGSize(width: 595.28, height: 841.89)

    static func make(year: Int, entries: [JournalEntry]) async throws -> URL {
        let items = entries.compactMap { entry in entry.fell.map { (entry: entry, fell: $0) } }
        var images: [String: UIImage] = [:]
        for photo in items.flatMap({ $0.entry.photoList }) {
            guard let image = await ImageCache.shared.image(for: photo) else { throw URLError(.cannotLoadFromNetwork) }
            images[photo.storageId] = await printable(image)
        }

        var pages: [AnyView] = [AnyView(CoverPage(year: year, items: items))]
        let indexRows = 30
        for (number, chunk) in items.chunked(indexRows).enumerated() {
            pages.append(AnyView(IndexPage(year: year, items: chunk, continued: number > 0)))
        }
        for pair in items.chunked(2) {
            pages.append(AnyView(EntriesPage(items: pair, images: images)))
        }

        let url = FileManager.default.temporaryDirectory.appendingPathComponent("Wainwrights \(year).pdf")
        var box = CGRect(origin: .zero, size: pageSize)
        guard let pdf = CGContext(url as CFURL, mediaBox: &box, nil) else { throw CocoaError(.fileWriteUnknown) }
        for (index, page) in pages.enumerated() {
            let content = PageFrame(year: year, number: index + 1, showsFooter: index > 0) { page }
                .environment(\.colorScheme, .light)
            let renderer = ImageRenderer(content: content)
            renderer.proposedSize = ProposedViewSize(pageSize)
            renderer.render { _, draw in
                pdf.beginPDFPage(nil)
                draw(pdf)
                pdf.endPDFPage()
            }
        }
        pdf.closePDF()
        return url
    }

    /// Up to 1600 px on the long side: sharp in print, and the file stays shareable.
    nonisolated private static func printable(_ image: UIImage) async -> UIImage {
        let longest = max(image.size.width, image.size.height) * image.scale
        guard longest > 1600 else { return image }
        let factor = 1600 / longest
        let size = CGSize(width: image.size.width * image.scale * factor, height: image.size.height * image.scale * factor)
        return await image.byPreparingThumbnail(ofSize: size) ?? image
    }
}

private let ink = Color(Palette.ink)
private let moss = Color(Palette.moss)

private struct PageFrame<Content: View>: View {
    let year: Int
    let number: Int
    let showsFooter: Bool
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: 0) {
            content
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            if showsFooter {
                HStack {
                    Text("Wainwrights Baggers · \(String(year))")
                    Spacer()
                    Text("\(number)")
                }
                .font(.system(size: 8.5, weight: .medium))
                .foregroundStyle(ink.opacity(0.45))
                .padding(.top, 12)
            }
        }
        .padding(.horizontal, 48)
        .padding(.top, 48)
        .padding(.bottom, 32)
        .frame(width: AlbumPDF.pageSize.width, height: AlbumPDF.pageSize.height)
        .background(Color.white)
    }
}

private struct CoverPage: View {
    let year: Int
    let items: [(entry: JournalEntry, fell: Fell)]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("WAINWRIGHTS BAGGERS")
                .font(.system(size: 10, weight: .semibold))
                .tracking(3)
                .foregroundStyle(moss)
            Text(String(year))
                .font(.system(size: 96, weight: .semibold, design: .serif))
                .foregroundStyle(Color.pine)
                .padding(.top, 36)
            Text("on the fells")
                .font(.system(size: 34, design: .serif).italic())
                .foregroundStyle(moss)
                .padding(.top, -8)

            ContourArtwork(color: Color.pine, opacity: 1.6, summit: UnitPoint(x: 0.62, y: 0.5), rings: 14, spacing: 16)
                .frame(height: 330)
                .padding(.horizontal, -48)
                .padding(.top, 20)

            HStack(alignment: .top, spacing: 28) {
                fact(value: "\(items.count)", label: items.count == 1 ? "Wainwright" : "Wainwrights")
                if let range = dateRange { fact(value: range, label: "First to last") }
                if let highest = items.map(\.fell).max(by: { $0.heightMetres < $1.heightMetres }) {
                    fact(value: highest.name, label: "Highest, \(highest.heightLabel)")
                }
            }
            .padding(.top, 20)
            Spacer()
        }
    }

    private var dateRange: String? {
        let dates = items.compactMap(\.entry.date)
        guard let first = dates.min(), let last = dates.max() else { return nil }
        let style = Date.FormatStyle.dateTime.day().month(.abbreviated)
        return first == last ? first.formatted(style) : "\(first.formatted(style)) – \(last.formatted(style))"
    }

    private func fact(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(value)
                .font(.system(size: 20, weight: .semibold, design: .serif))
                .foregroundStyle(ink)
            Text(label)
                .font(.system(size: 9.5, weight: .medium))
                .foregroundStyle(ink.opacity(0.55))
                .textCase(.uppercase)
        }
    }
}

private struct IndexPage: View {
    let year: Int
    let items: [(entry: JournalEntry, fell: Fell)]
    let continued: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(continued ? "The fells, continued" : "The fells")
                .font(.system(size: 26, weight: .semibold, design: .serif))
                .foregroundStyle(Color.pine)
                .padding(.bottom, 18)
            ForEach(items, id: \.entry.id) { item in
                HStack(spacing: 12) {
                    Text(item.entry.date?.formatted(.dateTime.day().month(.abbreviated)) ?? "")
                        .frame(width: 58, alignment: .leading)
                        .foregroundStyle(ink.opacity(0.55))
                    Text(item.fell.name)
                        .font(.system(size: 11.5, weight: .medium, design: .serif))
                        .foregroundStyle(ink)
                    Spacer()
                    Text(item.fell.heightLabel)
                        .foregroundStyle(ink.opacity(0.7))
                    Text(item.fell.book.name)
                        .frame(width: 84, alignment: .trailing)
                        .foregroundStyle(ink.opacity(0.55))
                }
                .font(.system(size: 10))
                .padding(.vertical, 6.5)
                .overlay(alignment: .bottom) { Rectangle().fill(ink.opacity(0.08)).frame(height: 0.5) }
            }
        }
    }
}

private struct EntriesPage: View {
    let items: [(entry: JournalEntry, fell: Fell)]
    let images: [String: UIImage]

    var body: some View {
        VStack(alignment: .leading, spacing: 30) {
            ForEach(items, id: \.entry.id) { item in
                EntryBlock(entry: item.entry, fell: item.fell, images: item.entry.photoList.compactMap { images[$0.storageId] })
                    .frame(maxHeight: .infinity, alignment: .top)
            }
            if items.count == 1 { Spacer() }
        }
    }
}

private struct EntryBlock: View {
    let entry: JournalEntry
    let fell: Fell
    let images: [UIImage]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                if images.isEmpty {
                    FellArtwork(fell: fell)
                } else {
                    ForEach(Array(images.enumerated()), id: \.offset) { _, image in
                        Color.clear
                            .overlay {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                            }
                            .clipped()
                    }
                }
            }
            .frame(height: 215)
            .clipShape(RoundedRectangle(cornerRadius: 6))

            Text(fell.name)
                .font(.system(size: 22, weight: .semibold, design: .serif))
                .foregroundStyle(ink)
                .padding(.top, 14)
            Text(details)
                .font(.system(size: 9.5, weight: .medium))
                .foregroundStyle(moss)
                .textCase(.uppercase)
                .tracking(0.6)
                .padding(.top, 3)
            if let note = entry.note, !note.isEmpty {
                Text(note)
                    .font(.system(size: 11.5, design: .serif))
                    .foregroundStyle(ink.opacity(0.85))
                    .lineSpacing(3)
                    .lineLimit(7)
                    .padding(.top, 10)
            }
        }
    }

    private var details: String {
        [entry.date?.formatted(date: .long, time: .omitted), fell.heightLabel, fell.book.title]
            .compactMap { $0 }
            .joined(separator: "  ·  ")
    }
}

private extension Array {
    func chunked(_ size: Int) -> [[Element]] {
        stride(from: 0, to: count, by: size).map { Array(self[$0..<Swift.min($0 + size, count)]) }
    }
}
