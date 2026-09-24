import ClerkKit
import ClerkKitUI
import SwiftUI

/// The persistent Apple Maps style sheet. Browse when nothing is selected, the fell card otherwise.
/// Clerk's sign-in and the account sheet are presented from here, on top of it.
struct BottomSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress
    @Environment(ProStore.self) private var pro
    @Environment(Clerk.self) private var clerk

    var body: some View {
        @Bindable var model = model

        ZStack {
            if let fell = model.selectedFell {
                FellCard(fell: fell)
                    .id(fell.id)
                    .transition(.opacity)
            } else {
                BrowseView()
                    .transition(.opacity)
            }
        }
        .frame(maxHeight: .infinity, alignment: .top)
        .animation(.snappy(duration: 0.25), value: model.selectedFellId)
        .sheet(isPresented: $model.showsAuth, onDismiss: {
            if clerk.session == nil { progress.bagAfterSignIn = nil }
        }) {
            AuthView()
                .environment(clerk)
        }
        .sheet(isPresented: $model.showsProfile) {
            AccountSheet()
                .environment(clerk)
                .environment(model)
                .environment(progress)
                .environment(pro)
        }
        .sheet(item: $model.paywall) { feature in
            PaywallView(highlight: feature)
                .environment(clerk)
                .environment(pro)
        }
        .sheet(item: $model.screen) { screen in
            NavigationStack {
                Group {
                    switch screen {
                    case .journal: JournalView()
                    case .stats: StatsView()
                    }
                }
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { model.screen = nil }
                    }
                }
            }
            .environment(model)
            .environment(progress)
            .environment(pro)
        }
    }
}
