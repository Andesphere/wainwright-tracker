import SwiftUI
import UIKit

/// Journal photos by storage id, so the card, the viewer, albums and the PDF share one download.
final class ImageCache {
    static let shared = ImageCache()

    private let cache = NSCache<NSString, UIImage>()
    private var inFlight: [String: Task<UIImage?, Never>] = [:]

    func remember(_ image: UIImage, forStorageId id: String) {
        cache.setObject(image, forKey: id as NSString)
    }

    func cached(_ photo: JournalPhoto) -> UIImage? {
        cache.object(forKey: photo.storageId as NSString)
    }

    func image(for photo: JournalPhoto) async -> UIImage? {
        if let image = cached(photo) { return image }
        if let task = inFlight[photo.storageId] { return await task.value }
        guard let url = photo.imageURL else { return nil }
        let task = Task<UIImage?, Never> {
            guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
            return await Self.decode(data)
        }
        inFlight[photo.storageId] = task
        let image = await task.value
        inFlight[photo.storageId] = nil
        if let image { remember(image, forStorageId: photo.storageId) }
        return image
    }

    nonisolated private static func decode(_ data: Data) async -> UIImage? {
        await UIImage(data: data)?.byPreparingForDisplay()
    }
}

/// A journal photo that fills its frame, fading in once loaded.
struct JournalPhotoView: View {
    let photo: JournalPhoto
    var contentMode: ContentMode = .fill

    @State private var image: UIImage?

    var body: some View {
        ZStack {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .transition(.opacity)
            } else {
                Rectangle()
                    .fill(Color.brand.opacity(0.12))
                    .overlay { ProgressView() }
            }
        }
        .task(id: photo.storageId) {
            if let cached = ImageCache.shared.cached(photo) {
                image = cached
                return
            }
            let loaded = await ImageCache.shared.image(for: photo)
            withAnimation(.easeOut(duration: 0.25)) { image = loaded }
        }
        .accessibilityLabel("Photo")
    }
}
