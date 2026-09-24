import PhotosUI
import SwiftUI

/// The journal on a bagged fell's card: the note and up to two photos. Free walkers see
/// what it would hold, and a tap opens the paywall.
struct JournalSection: View {
    let fell: Fell

    @Environment(ProgressStore.self) private var progress
    @Environment(ProStore.self) private var pro
    @Environment(AppModel.self) private var model

    @State private var editing = false
    @State private var picked: [PhotosPickerItem] = []
    @State private var pickingPhotos = false
    @State private var viewing: JournalPhoto?
    @State private var removing: JournalPhoto?

    var body: some View {
        if pro.isPro {
            journal
        } else {
            LockedFeatureRow(
                symbol: "photo.on.rectangle.angled",
                title: "Add a note and photos",
                subtitle: "Keep the day with the fell"
            ) { model.paywall = .journal }
        }
    }

    private var entry: JournalEntry? { progress.entry(for: fell) }
    private var photos: [JournalPhoto] { entry?.photoList ?? [] }
    private var pending: [ProgressStore.PendingPhoto] { progress.pendingPhotos[fell.id] ?? [] }
    private var freeSlots: Int { max(0, JournalEntry.maxPhotos - photos.count - pending.count) }

    private var journal: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Journal")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Button(entry?.hasNote == true ? "Edit" : "Add note") { editing = true }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.brand)
            }

            if let note = entry?.note, !note.isEmpty {
                Text(note)
                    .font(.system(.body, design: .serif))
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color.primary.opacity(0.05), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .onTapGesture { editing = true }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityHint("Edits the note")
            }

            photoRow
        }
        .sheet(isPresented: $editing) {
            JournalEditor(fell: fell, entry: entry)
                .environment(progress)
        }
        .fullScreenCover(item: $viewing) { photo in
            PhotoViewer(fell: fell, photos: photos, start: photo) { viewing = nil }
                .environment(progress)
        }
        .confirmationDialog("Remove this photo?", isPresented: .constant(removing != nil), titleVisibility: .visible, presenting: removing) { photo in
            Button("Remove photo", role: .destructive) {
                removing = nil
                Task { await progress.removePhoto(photo, from: fell) }
            }
            Button("Cancel", role: .cancel) { removing = nil }
        }
        .photosPicker(isPresented: $pickingPhotos, selection: $picked, maxSelectionCount: max(1, freeSlots), matching: .images)
        .onChange(of: picked) { _, items in
            guard !items.isEmpty else { return }
            picked = []
            Task {
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        await progress.addPhoto(fell, imageData: data)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var photoRow: some View {
        if photos.isEmpty && pending.isEmpty {
            Button { pickingPhotos = true } label: {
                HStack(spacing: 10) {
                    Image(systemName: "photo.badge.plus")
                        .font(.title3)
                    Text("Add up to two photos")
                        .font(.subheadline.weight(.medium))
                }
                .foregroundStyle(Color.brand)
                .frame(maxWidth: .infinity)
                .frame(height: 76)
                .background(Color.brand.opacity(0.07), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .strokeBorder(Color.brand.opacity(0.35), style: StrokeStyle(lineWidth: 1.2, dash: [5, 4]))
                }
            }
            .buttonStyle(.plain)
        } else {
            HStack(spacing: 10) {
                ForEach(photos) { photo in
                    Button { viewing = photo } label: {
                        tile { JournalPhotoView(photo: photo) }
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button("Remove photo", systemImage: "trash", role: .destructive) { removing = photo }
                    }
                    .accessibilityLabel("Photo of \(fell.name)")
                    .accessibilityHint("Opens the photo")
                }
                ForEach(pending) { upload in
                    tile {
                        Image(uiImage: upload.image)
                            .resizable()
                            .scaledToFill()
                            .overlay { Color.black.opacity(0.3) }
                            .overlay { ProgressView().tint(.white) }
                    }
                    .accessibilityLabel("Uploading photo")
                }
                if freeSlots > 0 {
                    Button { pickingPhotos = true } label: {
                        tile {
                            VStack(spacing: 6) {
                                Image(systemName: "plus")
                                    .font(.title3.weight(.semibold))
                                Text("Add photo")
                                    .font(.caption.weight(.medium))
                            }
                            .foregroundStyle(Color.brand)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(Color.brand.opacity(0.07))
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Add photo")
                }
            }
        }
    }

    private func tile<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        Color.clear
            .aspectRatio(4 / 3, contentMode: .fit)
            .overlay { content() }
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

/// A Pro feature shown to a free walker: what it is, a Pro badge, and a tap to the paywall.
struct LockedFeatureRow: View {
    let symbol: String
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: symbol)
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(Color.brand)
                    .frame(width: 40, height: 40)
                    .background(Color.brand.opacity(0.12), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 8)
                ProBadge()
            }
            .padding(12)
            .background(Color.primary.opacity(0.05), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityHint("Shows Wainwrights Baggers Pro")
    }
}

/// "PRO" on a bracken capsule, with a small lock.
struct ProBadge: View {
    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: "lock.fill")
                .font(.system(size: 8, weight: .bold))
            Text("PRO")
                .font(.system(size: 11, weight: .heavy))
                .tracking(0.8)
        }
        .foregroundStyle(Color.pine)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.bagged, in: Capsule())
        .accessibilityLabel("Pro")
    }
}

/// Date and note for a bagged fell.
struct JournalEditor: View {
    let fell: Fell
    let entry: JournalEntry?

    @Environment(ProgressStore.self) private var progress
    @Environment(\.dismiss) private var dismiss

    @State private var date = Date.now
    @State private var note = ""
    @State private var saving = false
    @State private var failed = false
    @FocusState private var noteFocused: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Date walked", selection: $date, in: ...Date.now, displayedComponents: .date)
                        .tint(Color.brand)
                }
                Section {
                    TextField("How was the day? Weather, route, company…", text: $note, axis: .vertical)
                        .font(.system(.body, design: .serif))
                        .lineLimit(6...14)
                        .focused($noteFocused)
                } header: {
                    Text("Note")
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.paper)
            .navigationTitle(fell.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if saving {
                        ProgressView()
                    } else {
                        Button("Save", action: save)
                            .fontWeight(.semibold)
                    }
                }
            }
            .alert("Could not save", isPresented: $failed) {
                Button("OK") {}
            } message: {
                Text("Check your connection and try again.")
            }
            .onAppear {
                date = entry?.date ?? .now
                note = entry?.note ?? ""
                if note.isEmpty { noteFocused = true }
            }
        }
        .presentationDetents([.large])
        .interactiveDismissDisabled(saving)
    }

    private func save() {
        saving = true
        Task {
            do {
                try await progress.saveJournal(fell, date: date, note: note)
                dismiss()
            } catch {
                failed = true
            }
            saving = false
        }
    }
}

/// Full-screen photos of one fell: swipe between them, pinch or double-tap to zoom.
struct PhotoViewer: View {
    let fell: Fell
    let photos: [JournalPhoto]
    let start: JournalPhoto
    let close: () -> Void

    @Environment(ProgressStore.self) private var progress
    @State private var current: String = ""
    @State private var confirmingRemove = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            TabView(selection: $current) {
                ForEach(photos) { photo in
                    ZoomablePhoto(photo: photo)
                        .tag(photo.id)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: photos.count > 1 ? .always : .never))
            .ignoresSafeArea()
        }
        .overlay(alignment: .top) {
            HStack {
                Button(action: close) {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .bold))
                        .frame(width: 44, height: 44)
                        .glassBackground(in: Circle())
                        .contentShape(Circle())
                }
                .accessibilityLabel("Close")
                .accessibilityIdentifier("viewer.close")
                Spacer()
                VStack(spacing: 1) {
                    Text(fell.name)
                        .font(.system(.headline, design: .serif))
                    if let date = progress.entry(for: fell)?.date {
                        Text(date.formatted(date: .long, time: .omitted))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Button { confirmingRemove = true } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 15, weight: .semibold))
                        .frame(width: 44, height: 44)
                        .glassBackground(in: Circle())
                        .contentShape(Circle())
                }
                .accessibilityLabel("Remove photo")
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
        .environment(\.colorScheme, .dark)
        .onAppear { current = start.id }
        .confirmationDialog("Remove this photo?", isPresented: $confirmingRemove, titleVisibility: .visible) {
            Button("Remove photo", role: .destructive) {
                guard let photo = photos.first(where: { $0.id == current }) else { return }
                close()
                Task { await progress.removePhoto(photo, from: fell) }
            }
        }
    }
}

private struct ZoomablePhoto: View {
    let photo: JournalPhoto

    @State private var scale: CGFloat = 1
    @GestureState private var pinch: CGFloat = 1

    var body: some View {
        JournalPhotoView(photo: photo, contentMode: .fit)
            .scaleEffect(scale * pinch)
            .gesture(
                MagnifyGesture()
                    .updating($pinch) { value, state, _ in state = value.magnification }
                    .onEnded { value in
                        withAnimation(.spring(duration: 0.3)) {
                            scale = min(max(scale * value.magnification, 1), 4)
                        }
                    }
            )
            .onTapGesture(count: 2) {
                withAnimation(.spring(duration: 0.3)) { scale = scale > 1 ? 1 : 2.5 }
            }
    }
}
