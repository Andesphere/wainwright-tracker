@preconcurrency import ConvexMobile
import Foundation

/// One bagged fell's journal: the day, a note and up to two photos. From `progress:getEntries`.
struct JournalEntry: Decodable, Hashable, Identifiable, Sendable {
    let id: String
    let completedAt: String?
    let note: String?
    let photos: [JournalPhoto]?

    static let maxPhotos = 2

    var fell: Fell? { FellCatalog.byId[id] }
    var date: Date? { completedAt.flatMap(JournalDate.parse) }
    var year: Int? { date.map { JournalDate.calendar.component(.year, from: $0) } }
    var photoList: [JournalPhoto] { photos ?? [] }
    var hasNote: Bool { !(note ?? "").isEmpty }
}

struct JournalPhoto: Decodable, Hashable, Identifiable, Sendable {
    let storageId: String
    let url: String?
    let mimeType: String?
    let originalName: String?
    let sizeBytes: Double?
    let uploadedAt: String

    var id: String { storageId }
    var imageURL: URL? { url.flatMap(URL.init(string:)) }

    /// The stored metadata `progress:setBagged` takes back: everything but the URL.
    /// Convex optionals reject null, so absent values are left out.
    var argument: [String: ConvexEncodable?] {
        var fields: [String: ConvexEncodable?] = ["storageId": storageId, "uploadedAt": uploadedAt]
        if let mimeType { fields["mimeType"] = mimeType }
        if let originalName { fields["originalName"] = originalName }
        if let sizeBytes { fields["sizeBytes"] = sizeBytes }
        return fields
    }
}

/// Bag dates are calendar days ("2026-09-24"); the web may also send a full ISO timestamp.
enum JournalDate {
    static let calendar = Calendar(identifier: .gregorian)

    private static let dayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static func parse(_ value: String) -> Date? {
        dayFormatter.date(from: String(value.prefix(10)))
    }

    static func string(from date: Date) -> String {
        dayFormatter.string(from: date)
    }
}
