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

    private(set) var selectedFellId: String?
    var detent: PresentationDetent = .peek
    var searchText = ""
    var statusFilter: StatusFilter = .all
    var bookFilter: Book?
    var cameraRequest: CameraRequest?
    var notice: Notice?
    var showsAuth = false
    var showsProfile = false

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
