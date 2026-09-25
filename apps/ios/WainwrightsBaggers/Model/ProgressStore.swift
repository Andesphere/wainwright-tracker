@preconcurrency import ConvexMobile
import Foundation
import ImageIO
import Observation
import UIKit

/// The signed-in walker's bagged fells, live from Convex.
///
/// Clerk owns the session; this store follows it. While signed in it keeps one
/// subscription to `progress:get` open, so a fell bagged on the web appears here
/// within a second. Bagging is optimistic: the map changes at once and rolls back
/// if the mutation fails. A second subscription, `progress:getEntries`, carries the
/// journal: dates, notes and photos.
@Observable
final class ProgressStore {
    enum Sync: Equatable {
        case signedOut
        case connecting
        case live
        case failed
    }

    struct PendingBag: Equatable {
        let fellId: String
        let date: Date
    }

    /// A photo on its way up, shown from the local copy until the server lists it.
    struct PendingPhoto: Identifiable, Equatable {
        let id = UUID()
        let image: UIImage
    }

    private(set) var sync: Sync = .signedOut
    private(set) var isSignedIn = false
    /// Last server truth.
    private var syncedIds: Set<String> = []
    /// Local writes the server has not confirmed yet: fell id to bagged.
    private var optimistic: [String: Bool] = [:]
    /// A bag the walker asked for while signed out; completed after sign-in.
    var bagAfterSignIn: PendingBag?
    /// Short, human message for the map notice.
    var errorMessage: String?
    /// Journal entries by fell id.
    private(set) var entries: [String: JournalEntry] = [:]
    /// Uploads in flight by fell id.
    private(set) var pendingPhotos: [String: [PendingPhoto]] = [:]

    var baggedIds: Set<String> {
        var ids = syncedIds
        for (id, bagged) in optimistic {
            if bagged { ids.insert(id) } else { ids.remove(id) }
        }
        return ids
    }

    var baggedCount: Int { baggedIds.count }

    func isBagged(_ fell: Fell) -> Bool { baggedIds.contains(fell.id) }

    func entry(for fell: Fell) -> JournalEntry? { entries[fell.id] }

    /// Journal entries of fells that are bagged right now.
    var baggedEntries: [JournalEntry] {
        let bagged = baggedIds
        return bagged.map { entries[$0] ?? JournalEntry(id: $0, completedAt: nil, note: nil, photos: nil) }
    }

    /// Shared with `ProStore`, so both follow the same Convex session.
    @ObservationIgnored let client: ConvexClientWithAuth<String>
    @ObservationIgnored private var authTask: Task<Void, Never>?
    @ObservationIgnored private var subscriptionTask: Task<Void, Never>?
    @ObservationIgnored private var entriesTask: Task<Void, Never>?

    init(deploymentURL: String) {
        client = ConvexClientWithAuth(deploymentUrl: deploymentURL, authProvider: ClerkConvexAuthProvider())
        authTask = Task { [weak self, client] in
            for await state in client.authState.values {
                self?.handle(state)
            }
        }
    }

    /// Call whenever Clerk's active session changes (including on launch).
    func sessionChanged(active: Bool) async {
        isSignedIn = active
        if active {
            sync = .connecting
            _ = await client.loginFromCache()
        } else {
            await client.logout()
        }
    }

    /// Retry after a failed connection, for example when the app returns to the foreground.
    func reconnectIfNeeded() async {
        guard isSignedIn, sync == .failed else { return }
        sync = .connecting
        _ = await client.loginFromCache()
    }

    func setBagged(_ fell: Fell, _ bagged: Bool, on date: Date = .now) async {
        guard sync == .live else { return }
        optimistic[fell.id] = bagged
        var args: [String: ConvexEncodable?] = ["id": fell.id, "bagged": bagged]
        if bagged { args["completedAt"] = JournalDate.string(from: date) }
        do {
            try await client.mutation("progress:setBagged", with: args)
            if bagged {
                syncedIds.insert(fell.id)
                Telemetry.capture("fell_bagged")
            } else {
                syncedIds.remove(fell.id)
            }
        } catch {
            Telemetry.report(error, flow: .sync)
            errorMessage = "Could not save \(fell.name). Check your connection and try again."
        }
        optimistic[fell.id] = nil
    }

    /// Saves the day and note of a bagged fell. Photos are left as they are: the server keeps
    /// stored photos when the argument is omitted.
    func saveJournal(_ fell: Fell, date: Date, note: String) async throws {
        var args: [String: ConvexEncodable?] = [
            "id": fell.id,
            "bagged": true,
            "completedAt": JournalDate.string(from: date),
        ]
        let trimmed = note.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { args["note"] = trimmed }
        do {
            try await client.mutation("progress:setBagged", with: args)
        } catch {
            Telemetry.report(error, flow: .sync)
            throw error
        }
    }

    /// Downscales, uploads to Convex storage and attaches a photo to a bagged fell.
    func addPhoto(_ fell: Fell, imageData: Data) async {
        let stored = entries[fell.id]?.photoList.count ?? 0
        guard stored + (pendingPhotos[fell.id]?.count ?? 0) < JournalEntry.maxPhotos else { return }
        guard let jpeg = await Self.journalJPEG(from: imageData), let preview = UIImage(data: jpeg) else {
            errorMessage = "That photo could not be read. Try another."
            return
        }
        let pending = PendingPhoto(image: preview)
        pendingPhotos[fell.id, default: []].append(pending)
        defer { pendingPhotos[fell.id]?.removeAll { $0.id == pending.id } }

        do {
            let uploadURL: String = try await client.mutation("progress:generatePhotoUploadUrl")
            guard let url = URL(string: uploadURL) else { throw URLError(.badURL) }
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("image/jpeg", forHTTPHeaderField: "Content-Type")
            let (body, response) = try await URLSession.shared.upload(for: request, from: jpeg)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
            let storageId = try JSONDecoder().decode(StorageUpload.self, from: body).storageId
            try await client.mutation("progress:attachPhoto", with: [
                "id": fell.id,
                "storageId": storageId,
                "mimeType": "image/jpeg",
                "sizeBytes": Double(jpeg.count),
            ])
            ImageCache.shared.remember(preview, forStorageId: storageId)
        } catch {
            Telemetry.report(error, flow: .photoUpload)
            errorMessage = "Could not upload the photo. Check your connection and try again."
        }
    }

    /// Removes one photo; the server deletes the file once nothing refers to it.
    func removePhoto(_ photo: JournalPhoto, from fell: Fell) async {
        guard let entry = entries[fell.id] else { return }
        var args: [String: ConvexEncodable?] = [
            "id": fell.id,
            "bagged": true,
            "photos": entry.photoList.filter { $0.id != photo.id }.map { $0.argument as ConvexEncodable? },
        ]
        if let completedAt = entry.completedAt { args["completedAt"] = completedAt }
        if let note = entry.note { args["note"] = note }
        do {
            try await client.mutation("progress:setBagged", with: args)
        } catch {
            Telemetry.report(error, flow: .sync)
            errorMessage = "Could not remove the photo. Check your connection and try again."
        }
    }

    /// Removes the walker's progress, photos, profile and follows from Convex.
    func deleteMyData() async throws {
        try await client.mutation("account:deleteMyData", with: [:])
    }

    private func handle(_ state: AuthState<String>) {
        switch state {
        case .loading:
            sync = .connecting
        case .authenticated:
            // Stay "connecting" until the first result arrives: a token Convex rejects
            // must not look like a live account with nothing bagged.
            subscribe()
        case .unauthenticated:
            subscriptionTask?.cancel()
            subscriptionTask = nil
            entriesTask?.cancel()
            entriesTask = nil
            syncedIds = []
            optimistic = [:]
            entries = [:]
            sync = isSignedIn ? .failed : .signedOut
        }
    }

    private func subscribe() {
        subscriptionTask?.cancel()
        subscriptionTask = Task { [weak self, client] in
            do {
                for try await ids in client.subscribe(to: "progress:get", yielding: [String].self).values {
                    self?.received(ids)
                }
            } catch {
                guard !Task.isCancelled else { return }
                Telemetry.report(error, flow: .sync)
                self?.sync = .failed
            }
        }
        entriesTask?.cancel()
        entriesTask = Task { [weak self, client] in
            // The journal is extra: if this fails, bagging still works and the next reconnect retries.
            do {
                for try await list in client.subscribe(to: "progress:getEntries", yielding: [JournalEntry].self).values {
                    self?.entries = Dictionary(list.map { ($0.id, $0) }, uniquingKeysWith: { _, last in last })
                }
            } catch {}
        }
    }

    private func received(_ ids: [String]) {
        syncedIds = Set(ids)
        guard sync != .live else { return }
        sync = .live
        if let pending = bagAfterSignIn, let fell = FellCatalog.byId[pending.fellId] {
            bagAfterSignIn = nil
            Task { await setBagged(fell, true, on: pending.date) }
        }
    }

    private struct StorageUpload: Decodable {
        let storageId: String
    }

    /// At most 2048 px on the long side, upright, JPEG. Keeps uploads near 500 KB.
    nonisolated private static func journalJPEG(from data: Data) async -> Data? {
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: 2048,
        ]
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
        else { return nil }
        return UIImage(cgImage: image).jpegData(compressionQuality: 0.8)
    }
}
