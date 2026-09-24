import CoreLocation
import Foundation

/// One of the 214 Wainwrights. Source: Resources/wainwrights.json, generated from packages/catalog.
struct Fell: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let bookNumber: Int
    let heightMetres: Double
    let heightFt: Int
    let latitude: Double
    let longitude: Double
    let area: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var book: Book { Book(area: area) }

    /// "950 m", or "481.2 m" where the survey height has a decimal.
    var heightLabel: String {
        "\(heightMetres.formatted(.number.precision(.fractionLength(0...1)).grouping(.never))) m"
    }
}

/// Wainwright's seven Pictorial Guides, in publication order.
enum Book: Int, CaseIterable, Identifiable, Sendable {
    case eastern = 1, farEastern, central, southern, northern, northWestern, western

    var id: Int { rawValue }

    init(area: String) {
        switch area {
        case "Eastern": self = .eastern
        case "Far Eastern": self = .farEastern
        case "Central": self = .central
        case "Southern": self = .southern
        case "Northern": self = .northern
        case "North Western": self = .northWestern
        default: self = .western
        }
    }

    var name: String {
        switch self {
        case .eastern: "Eastern"
        case .farEastern: "Far Eastern"
        case .central: "Central"
        case .southern: "Southern"
        case .northern: "Northern"
        case .northWestern: "North Western"
        case .western: "Western"
        }
    }

    var title: String { "The \(name) Fells" }

    var ordinal: String {
        ["One", "Two", "Three", "Four", "Five", "Six", "Seven"][rawValue - 1]
    }
}

enum FellCatalog {
    static let all: [Fell] = {
        do {
            let url = Bundle.main.url(forResource: "wainwrights", withExtension: "json")!
            return try JSONDecoder().decode([Fell].self, from: Data(contentsOf: url))
        } catch {
            fatalError("wainwrights.json is invalid: \(error)")
        }
    }()

    static let byId: [String: Fell] = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })

    static let byBook: [Book: [Fell]] = Dictionary(grouping: all, by: \.book)

    static let alphabetical: [Fell] = all.sorted {
        $0.name.localizedStandardCompare($1.name) == .orderedAscending
    }
}
