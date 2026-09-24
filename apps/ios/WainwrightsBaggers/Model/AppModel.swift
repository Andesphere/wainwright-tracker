import Observation
import SwiftUI

extension PresentationDetent {
    /// Search field and progress. Also the floor the map keeps its logo above.
    static let peek = PresentationDetent.height(AppModel.peekHeight)
    /// A selected fell's card.
    static let card = PresentationDetent.height(AppModel.cardHeight)
}

/// Screen state shared by the map and the bottom sheet.
@Observable
final class AppModel {
    static let peekHeight: CGFloat = 112
    static let cardHeight: CGFloat = 350

    enum StatusFilter: String, CaseIterable, Identifiable {
        case all = "All"
        case toGo = "To go"
        case bagged = "Bagged"
        var id: String { rawValue }
    }

    /// A one-shot instruction for the map camera.
    struct CameraRequest: Equatable {
        enum Target: Equatable {
            case fell(String)
            case book(Book)
        }

        let target: Target
        let id = UUID()
    }

    struct Notice: Equatable {
        let message: String
        var opensSettings = false
        let id = UUID()
    }

    /// Full-screen Pro screens opened from the sheet.
    enum Screen: String, Identifiable {
        case journal, stats
        var id: String { rawValue }
    }

    private(set) var selectedFellId: String?
    var detent: PresentationDetent = .peek
    var searchText = ""
    var statusFilter: StatusFilter = .all
    var bookFilter: Book?
    var cameraRequest: CameraRequest?
    var notice: Notice?
    var showsAuth = false
    var showsProfile = false
    /// The paywall, open on the feature that led there.
    var paywall: ProFeature?
    var screen: Screen?
    var showsLayers = false
    /// The walker's chosen map layer. Pro layers fall back to Standard without Pro.
    var mapLayer: MapLayer = MapLayer(rawValue: UserDefaults.standard.string(forKey: "mapLayer") ?? "") ?? .standard {
        didSet { UserDefaults.standard.set(mapLayer.rawValue, forKey: "mapLayer") }
    }

    var selectedFell: Fell? { selectedFellId.flatMap { FellCatalog.byId[$0] } }

    var detents: Set<PresentationDetent> {
        selectedFellId == nil ? [.peek, .medium, .large] : [.peek, .card, .large]
    }

    func select(_ fell: Fell, flyTo: Bool = true) {
        selectedFellId = fell.id
        detent = .card
        if flyTo { cameraRequest = CameraRequest(target: .fell(fell.id)) }
    }

    func clearSelection() {
        guard selectedFellId != nil else { return }
        detent = .peek
        selectedFellId = nil
    }

    func toggleBookFilter(_ book: Book) {
        if bookFilter == book {
            bookFilter = nil
        } else {
            bookFilter = book
            cameraRequest = CameraRequest(target: .book(book))
        }
    }

    func show(_ message: String, opensSettings: Bool = false) {
        notice = Notice(message: message, opensSettings: opensSettings)
    }
}

/// What Pro unlocks. The paywall highlights the one the walker tapped.
enum ProFeature: String, CaseIterable, Identifiable {
    case journal, albums, layers, stats

    var id: String { rawValue }

    var title: String {
        switch self {
        case .journal: "Photo journal"
        case .albums: "Yearly albums"
        case .layers: "Satellite and contours"
        case .stats: "Your stats"
        }
    }

    /// One line for the paywall.
    var pitch: String {
        switch self {
        case .journal: "Notes and two photos for every fell."
        case .albums: "Each year as an album you can print."
        case .layers: "Satellite imagery and detailed contours."
        case .stats: "Years, books, highest and lowest."
        }
    }

    var symbol: String {
        switch self {
        case .journal: "photo.on.rectangle.angled"
        case .albums: "book.closed"
        case .layers: "square.3.layers.3d"
        case .stats: "chart.bar.xaxis"
        }
    }
}

enum MapLayer: String, CaseIterable, Identifiable {
    case standard, satellite, contours

    var id: String { rawValue }

    var title: String {
        switch self {
        case .standard: "Standard"
        case .satellite: "Satellite"
        case .contours: "Contours"
        }
    }

    var needsPro: Bool { self != .standard }
}
