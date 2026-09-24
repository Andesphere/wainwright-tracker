@_spi(Experimental) import MapboxMaps
import SwiftUI

/// The full-bleed 3D Lake District: Mapbox Standard with terrain, relief, the 214 fells,
/// the walker's location, and the floating controls.
struct FellMapView: View {
    @Environment(AppModel.self) private var model
    @Environment(ProgressStore.self) private var progress
    @Environment(\.scenePhase) private var scenePhase

    @State private var viewport = Self.launchViewport
    @State private var lightPreset = LightClock.preset()
    @State private var heading = CameraHeading()
    @State private var location = LocationPermission()
    @State private var featureCache = FellFeatureCache()
    @State private var hasSettled = false
    @State private var followsHeading = false

    private static let lakeDistrict = CLLocationCoordinate2D(latitude: 54.49, longitude: -3.08)
    private static let launchViewport = Viewport.camera(
        center: CLLocationCoordinate2D(latitude: 54.46, longitude: -3.06), zoom: 7.4, bearing: 0, pitch: 10)
    private static let homeViewport = Viewport.camera(center: lakeDistrict, zoom: 9.55, bearing: -14, pitch: 55)
    /// Keeps the Mapbox logo and attribution just above the sheet's smallest detent.
    private static let ornamentLift = AppModel.peekHeight - 2

    var body: some View {
        let isDark = lightPreset == .night || lightPreset == .dusk
        let selected = model.selectedFell

        GeometryReader { geometry in
            MapReader { proxy in
                ZStack(alignment: .topTrailing) {
                    Map(viewport: $viewport) {
                        ReliefLayers(isDark: isDark)
                        FellLayers(
                            features: featureCache.collection(bagged: progress.baggedIds),
                            selectedId: selected?.id,
                            book: model.bookFilter,
                            isDark: isDark
                        )

                        if location.isAuthorized {
                            Puck2D(bearing: .heading)
                                .showsAccuracyRing(true)
                        }

                        if let selected {
                            MapViewAnnotation(coordinate: selected.coordinate) {
                                SelectedFellPin(isBagged: progress.isBagged(selected))
                                    .id(selected.id)
                            }
                            .allowOverlap(true)
                            .allowOverlapWithPuck(true)
                            .allowHitTesting(false)
                            .enableSymbolLayerCollision(true)
                            .variableAnchors([ViewAnnotationAnchorConfig(anchor: .bottom)])
                        }

                        TapInteraction(.layer(MapIds.fellMarkers), radius: 14) { feature, _ in
                            select(feature)
                        }
                        TapInteraction(.layer(MapIds.fellLabels)) { feature, _ in
                            select(feature)
                        }
                        TapInteraction { _ in
                            model.clearSelection()
                            return false
                        }
                    }
                    .mapStyle(.standard(
                        theme: .faded,
                        lightPreset: lightPreset,
                        showPointOfInterestLabels: false,
                        showTransitLabels: false,
                        showRoadLabels: false,
                        showAdminBoundaries: false
                    ))
                    .ornamentOptions(OrnamentOptions(
                        scaleBar: ScaleBarViewOptions(visibility: .hidden),
                        compass: CompassViewOptions(visibility: .hidden),
                        logo: LogoViewOptions(position: .bottomLeading, margins: CGPoint(x: 14, y: 6)),
                        attributionButton: AttributionButtonOptions(position: .bottomTrailing, margins: CGPoint(x: 10, y: 2))
                    ))
                    .additionalSafeAreaInsets(.bottom, Self.ornamentLift)
                    .frameRate(range: 60...120, preferred: 120)
                    .onMapLoaded { _ in settle() }
                    .onCameraChanged { heading.update($0.cameraState) }
                    .ignoresSafeArea()

                    // A soft wash under the status bar keeps the time and battery legible over busy map.
                    LinearGradient(
                        colors: [Color(uiColor: .systemBackground).opacity(0.55), .clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: geometry.safeAreaInsets.top + 12)
                    .ignoresSafeArea(edges: .top)
                    .allowsHitTesting(false)

                    MapControls(
                        heading: heading,
                        locateSymbol: locateSymbol,
                        toggle3D: { toggle3D(proxy) },
                        locate: { locate(proxy) },
                        resetNorth: { move(.camera(bearing: 0)) }
                    )
                    .padding(.trailing, 12)
                    .padding(.top, 4)
                }
                .onChange(of: model.cameraRequest) { _, request in
                    guard let request else { return }
                    handle(request, proxy: proxy, mediumHeight: geometry.size.height / 2)
                }
            }
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(300))
                lightPreset = LightClock.preset()
            }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { lightPreset = LightClock.preset() }
        }
    }

    // MARK: - Camera

    private var locateSymbol: String {
        guard viewport.followPuck != nil else { return "location" }
        return followsHeading ? "location.north.line.fill" : "location.fill"
    }

    /// Bottom camera padding so targets land in the map area the sheet leaves visible.
    private var sheetPadding: CGFloat {
        model.selectedFellId == nil ? 0 : AppModel.cardHeight - AppModel.peekHeight
    }

    private func settle() {
        guard !hasSettled else { return }
        hasSettled = true
        withViewportAnimation(.fly(duration: 3.2)) {
            viewport = Self.homeViewport
        }
    }

    private func move(_ target: Viewport, animation: ViewportAnimation = .easeInOut(duration: 0.6)) {
        withViewportAnimation(animation) {
            viewport = target.padding(.bottom, sheetPadding)
        }
    }

    private func select(_ feature: FeaturesetFeature) -> Bool {
        guard let id = feature.id?.id, let fell = FellCatalog.byId[id] else { return false }
        model.select(fell)
        return true
    }

    private func handle(_ request: AppModel.CameraRequest, proxy: MapProxy, mediumHeight: CGFloat) {
        let bearing = proxy.map?.cameraState.bearing ?? -14
        switch request.target {
        case .fell(let id):
            guard let fell = FellCatalog.byId[id] else { return }
            followsHeading = false
            move(.camera(center: fell.coordinate, zoom: 13.2, bearing: bearing, pitch: 60), animation: .fly(duration: 1.6))
        case .book(let book):
            let points = (FellCatalog.byBook[book] ?? []).map(\.coordinate)
            withViewportAnimation(.fly(duration: 1.4)) {
                viewport = .overview(
                    geometry: MultiPoint(points),
                    bearing: bearing,
                    pitch: 45,
                    geometryPadding: SwiftUI.EdgeInsets(top: 70, leading: 40, bottom: 30, trailing: 80)
                )
                .padding(.bottom, mediumHeight - AppModel.peekHeight)
            }
        }
    }

    private func toggle3D(_ proxy: MapProxy) {
        let pitched = (proxy.map?.cameraState.pitch ?? 0) > 20
        move(.camera(pitch: pitched ? 0 : 60), animation: .easeInOut(duration: 0.8))
    }

    private func locate(_ proxy: MapProxy) {
        if location.isDenied {
            model.show("Location is off for Wainwrights. Turn it on in Settings to see where you are.", opensSettings: true)
            return
        }
        guard location.isAuthorized else {
            location.request { granted in
                if granted {
                    follow(proxy)
                } else {
                    model.show("Without location the map still works. You can turn it on in Settings.", opensSettings: true)
                }
            }
            return
        }
        follow(proxy)
    }

    private func follow(_ proxy: MapProxy) {
        followsHeading = viewport.followPuck != nil && !followsHeading
        let bearing = proxy.map?.cameraState.bearing ?? 0
        withViewportAnimation(.default(maxDuration: 1.6)) {
            viewport = .followPuck(
                zoom: 13.5,
                bearing: followsHeading ? .heading : .constant(bearing),
                pitch: 50
            )
            .padding(.bottom, sheetPadding)
        }
    }
}
