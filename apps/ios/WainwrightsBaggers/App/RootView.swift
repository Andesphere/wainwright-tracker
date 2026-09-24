import ClerkKit
import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress
    @Environment(Clerk.self) private var clerk
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        @Bindable var model = model

        FellMapView()
            .overlay(alignment: .topLeading) { NoticeBanner() }
            .sheet(isPresented: .constant(true)) {
                BottomSheet()
                    .presentationDetents(model.detents, selection: $model.detent)
                    .presentationBackgroundInteraction(.enabled(upThrough: model.selectedFellId == nil ? .medium : .card))
                    .presentationDragIndicator(.visible)
                    .interactiveDismissDisabled()
                    .environment(model)
                    .environment(progress)
                    .environment(clerk)
            }
            .task(id: sessionKey) {
                guard let sessionKey else { return }
                await progress.sessionChanged(active: sessionKey != "signed-out")
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { Task { await progress.reconnectIfNeeded() } }
            }
            .onChange(of: progress.errorMessage) { _, message in
                guard let message else { return }
                model.show(message)
                progress.errorMessage = nil
            }
    }

    /// Changes when Clerk finishes loading or the active session changes; nil while loading.
    private var sessionKey: String? {
        guard clerk.isLoaded else { return nil }
        guard let session = clerk.session, session.status == .active else { return "signed-out" }
        return session.id
    }
}

/// A small, non-blocking message at the top of the map that fades after a few seconds.
private struct NoticeBanner: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openURL) private var openURL

    var body: some View {
        Group {
            if let notice = model.notice {
                HStack(spacing: 10) {
                    Text(notice.message)
                        .font(.footnote)
                        .fixedSize(horizontal: false, vertical: true)
                    if notice.opensSettings {
                        Button("Settings") {
                            if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) }
                        }
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color.brand)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .glassBackground(in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                .padding(.leading, 12)
                .padding(.trailing, 76)
                .padding(.top, 4)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: notice.id) {
                    try? await Task.sleep(for: .seconds(6))
                    if model.notice?.id == notice.id { model.notice = nil }
                }
                .accessibilityAddTraits(.isStaticText)
            }
        }
        .animation(.spring(duration: 0.4), value: model.notice)
    }
}
