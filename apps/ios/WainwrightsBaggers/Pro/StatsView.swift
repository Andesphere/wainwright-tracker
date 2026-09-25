import Charts
import SwiftUI

/// Pro stats from the walker's bagged fells and the dates they walked them.
struct StatsView: View {
    @Environment(ProgressStore.self) private var progress

    var body: some View {
        let stats = Stats(entries: progress.baggedEntries)
        ScrollView {
            if stats.bagged.isEmpty {
                ContentUnavailableView(
                    "No fells bagged yet",
                    systemImage: "chart.bar.xaxis",
                    description: Text("Bag your first fell and your stats start here.")
                )
                .padding(.top, 80)
            } else {
                VStack(spacing: 14) {
                    tiles(stats)
                    if !stats.perYear.isEmpty { perYear(stats) }
                    perBook(stats)
                    records(stats)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .background(Color.paper)
        .navigationTitle("Stats")
    }

    // MARK: - Headline tiles

    private func tiles(_ stats: Stats) -> some View {
        let total = FellCatalog.all.count
        return Grid(horizontalSpacing: 12, verticalSpacing: 12) {
            GridRow {
                StatTile(
                    value: "\(stats.bagged.count)",
                    unit: "of \(total)",
                    label: "Fells bagged",
                    detail: "\((Double(stats.bagged.count) / Double(total)).formatted(.percent.precision(.fractionLength(0)))) of the Wainwrights"
                )
                StatTile(
                    value: stats.booksComplete.formatted(),
                    unit: "of 7",
                    label: "Books complete",
                    detail: "\(total - stats.bagged.count) fells to go"
                )
            }
            GridRow {
                StatTile(
                    value: Int(stats.summitMetres.rounded()).formatted(),
                    unit: "m",
                    label: "Summit heights added up",
                    detail: "The heights of your fells together, not the metres you climbed"
                )
                .gridCellColumns(2)
            }
        }
    }

    // MARK: - Per year

    private func perYear(_ stats: Stats) -> some View {
        StatsCard(title: "Fells per year", footnote: stats.undated > 0 ? "\(stats.undated) \(stats.undated == 1 ? "fell has" : "fells have") no date and \(stats.undated == 1 ? "is" : "are") left out." : nil) {
            Chart(stats.perYear, id: \.year) { item in
                BarMark(
                    x: .value("Year", String(item.year)),
                    y: .value("Fells", item.count),
                    width: .ratio(0.62)
                )
                .foregroundStyle(Color.bagged)
                .clipShape(UnevenRoundedRectangle(topLeadingRadius: 4, topTrailingRadius: 4))
                .annotation(position: .top, spacing: 4) {
                    Text("\(item.count)")
                        .font(.caption.weight(.semibold).monospacedDigit())
                        .foregroundStyle(.primary)
                }
            }
            .chartYAxis(.hidden)
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabel()
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .chartYScale(domain: 0...(Double(stats.perYear.map(\.count).max() ?? 1) * 1.18))
            .frame(height: 170)
            .accessibilityLabel("Fells bagged per year")
        }
    }

    // MARK: - Per book

    private func perBook(_ stats: Stats) -> some View {
        StatsCard(title: "By book", footnote: nil) {
            VStack(spacing: 14) {
                ForEach(Book.allCases) { book in
                    let total = FellCatalog.byBook[book]?.count ?? 0
                    let done = stats.perBook[book] ?? 0
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(book.name)
                                .font(.subheadline.weight(.semibold))
                            Spacer()
                            Text("\(done) of \(total)")
                                .font(.subheadline.monospacedDigit())
                            Text(done == total ? "Complete" : "\(total - done) to go")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .frame(width: 68, alignment: .trailing)
                        }
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.primary.opacity(0.08))
                                Capsule()
                                    .fill(Color.bagged)
                                    .frame(width: done == 0 ? 0 : max(8, geometry.size.width * Double(done) / Double(max(total, 1))))
                            }
                        }
                        .frame(height: 8)
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(book.title): \(done) of \(total) bagged")
                }
            }
        }
    }

    // MARK: - Records

    private func records(_ stats: Stats) -> some View {
        StatsCard(title: "Records", footnote: nil) {
            VStack(spacing: 0) {
                if let highest = stats.highest {
                    RecordRow(symbol: "arrow.up.to.line", title: "Highest bagged", fell: highest.name, detail: highest.heightLabel)
                }
                if let lowest = stats.lowest, lowest.id != stats.highest?.id {
                    RecordRow(symbol: "arrow.down.to.line", title: "Lowest bagged", fell: lowest.name, detail: lowest.heightLabel)
                }
                if let first = stats.first {
                    RecordRow(symbol: "flag", title: "First bag", fell: first.fell.name, detail: first.date.formatted(date: .abbreviated, time: .omitted))
                }
                if let latest = stats.latest, latest.fell.id != stats.first?.fell.id {
                    RecordRow(symbol: "clock", title: "Latest bag", fell: latest.fell.name, detail: latest.date.formatted(date: .abbreviated, time: .omitted))
                }
            }
        }
    }
}

/// Everything the screen shows, computed once per render.
private struct Stats {
    let bagged: [Fell]
    let perYear: [(year: Int, count: Int)]
    let perBook: [Book: Int]
    let booksComplete: Int
    let summitMetres: Double
    let highest: Fell?
    let lowest: Fell?
    let first: (fell: Fell, date: Date)?
    let latest: (fell: Fell, date: Date)?
    let undated: Int

    init(entries: [JournalEntry]) {
        bagged = entries.compactMap(\.fell)
        let dated = entries.compactMap { entry -> (fell: Fell, date: Date)? in
            guard let fell = entry.fell, let date = entry.date else { return nil }
            return (fell, date)
        }
        undated = bagged.count - dated.count
        perYear = Dictionary(grouping: dated) { JournalDate.calendar.component(.year, from: $0.date) }
            .map { (year: $0.key, count: $0.value.count) }
            .sorted { $0.year < $1.year }
        let perBook = Dictionary(grouping: bagged, by: \.book).mapValues(\.count)
        self.perBook = perBook
        booksComplete = Book.allCases.filter { perBook[$0] == FellCatalog.byBook[$0]?.count }.count
        let bagged = bagged
        summitMetres = bagged.reduce(0) { $0 + $1.heightMetres }
        highest = bagged.max { $0.heightMetres < $1.heightMetres }
        lowest = bagged.min { $0.heightMetres < $1.heightMetres }
        first = dated.min { $0.date < $1.date }
        latest = dated.max { $0.date < $1.date }
    }
}

private struct StatTile: View {
    let value: String
    let unit: String
    let label: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.system(.largeTitle, design: .serif).weight(.semibold))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(unit)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}

private struct StatsCard<Content: View>: View {
    let title: String
    let footnote: String?
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title)
                .font(.system(.title3, design: .serif).weight(.semibold))
                .accessibilityAddTraits(.isHeader)
            content
            if let footnote {
                Text(footnote)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct RecordRow: View {
    let symbol: String
    let title: String
    let fell: String
    let detail: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.brand)
                .frame(width: 32, height: 32)
                .background(Color.brand.opacity(0.12), in: Circle())
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(fell)
                    .font(.system(.body, design: .serif).weight(.medium))
            }
            Spacer()
            Text(detail)
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 8)
        .accessibilityElement(children: .combine)
    }
}
