import MapboxMaps
import UIKit

enum MapIds {
    static let fellSource = "wb-fells"
    static let fellMarkers = "wb-fell-markers"
    static let fellLabels = "wb-fell-labels"
}

/// Relief on top of Mapbox Standard: 3D terrain, a soft hillshade and contour lines.
///
/// Hillshade and contours sit in the `bottom` slot, above land and water but under
/// roads and labels, so they read as part of the base map.
struct ReliefLayers: MapStyleContent {
    let isDark: Bool

    /// 514 px tiles carry a one-pixel border, which avoids seams in the 3D mesh.
    private static let terrainSource: RasterDemSource = {
        var source = RasterDemSource(id: "wb-terrain-dem")
        source.url = "mapbox://mapbox.mapbox-terrain-dem-v1"
        source.tileSize = 514
        source.maxzoom = 14
        return source
    }()

    var body: some MapStyleContent {
        Self.terrainSource
        Terrain(sourceId: "wb-terrain-dem")
            .exaggeration(1.3)

        RasterDemSource(id: "wb-hillshade-dem")
            .url("mapbox://mapbox.mapbox-terrain-dem-v1")
            .maxzoom(14)
        HillshadeLayer(id: "wb-hillshade", source: "wb-hillshade-dem")
            .slot(.bottom)
            .hillshadeExaggeration(isDark ? 0.3 : 0.55)
            .hillshadeIlluminationDirection(315)
            .hillshadeShadowColor(UIColor(hex: 0x1F3A2B, alpha: 0.5))
            .hillshadeHighlightColor(UIColor(white: 1, alpha: isDark ? 0.04 : 0.18))
            .hillshadeAccentColor(UIColor(hex: 0x2B4535, alpha: 0.18))

        VectorSource(id: "wb-contours")
            .url("mapbox://mapbox.mapbox-terrain-v2")
        LineLayer(id: "wb-contour-lines", source: "wb-contours")
            .sourceLayer("contour")
            .slot(.bottom)
            .minZoom(11)
            .lineColor(isDark ? UIColor(hex: 0xC9B48F) : Palette.contour)
            .lineWidth(Exp(.switchCase) {
                Exp(.eq) { Exp(.get) { "index" }; 10 }
                1.1
                Exp(.eq) { Exp(.get) { "index" }; 5 }
                0.75
                0.45
            })
            .lineOpacity(Exp(.interpolate) {
                Exp(.linear)
                Exp(.zoom)
                11
                0
                12
                isDark ? 0.22 : 0.3
                15
                isDark ? 0.32 : 0.45
            })
        SymbolLayer(id: "wb-contour-labels", source: "wb-contours")
            .sourceLayer("contour")
            .slot(.bottom)
            .minZoom(13.5)
            .filter(Exp(.eq) { Exp(.get) { "index" }; 10 })
            .symbolPlacement(.line)
            .textField(Exp(.concat) { Exp(.toString) { Exp(.get) { "ele" } }; " m" })
            .textFont(["DIN Pro Medium", "Arial Unicode MS Regular"])
            .textSize(10)
            .textColor(isDark ? UIColor(hex: 0xC9B48F) : Palette.contour)
            .textHaloColor(isDark ? UIColor(white: 0, alpha: 0.4) : UIColor(white: 1, alpha: 0.6))
            .textHaloWidth(1)
    }
}

/// The 214 fells as one GeoJSON source with two symbol layers: markers that never hide,
/// and name labels that give way to each other, so zooming in reveals more (bagged, then higher, fells win).
struct FellLayers: MapStyleContent {
    let features: FeatureCollection
    let selectedId: String?
    /// When set, fells from other books fade back.
    let book: Book?
    let isDark: Bool

    var body: some MapStyleContent {
        StyleImage(id: "fell-to-go", image: MarkerImages.toGo)
        StyleImage(id: "fell-bagged", image: MarkerImages.bagged)

        GeoJSONSource(id: MapIds.fellSource)
            .data(.featureCollection(features))

        SymbolLayer(id: MapIds.fellMarkers, source: MapIds.fellSource)
            .iconImage(Exp(.switchCase) {
                Exp(.boolean) { Exp(.get) { "bagged" }; false }
                "fell-bagged"
                "fell-to-go"
            })
            .iconSize(Exp(.interpolate) {
                Exp(.linear)
                Exp(.zoom)
                8
                0.45
                10
                0.62
                12
                0.85
                14
                1.05
            })
            // Markers always show, and labels (ours and the basemap's) keep clear of them.
            .iconAllowOverlap(true)
            .iconIgnorePlacement(false)
            .symbolSortKey(Exp(.get) { "sortKey" })
            .iconEmissiveStrength(1)
            .iconOcclusionOpacity(0.35)
            // The selected fell is drawn by its pin; its invisible marker still keeps basemap labels away.
            .iconOpacity(Exp(.switchCase) {
                Exp(.eq) { Exp(.get) { "id" }; selectedId ?? "" }
                0
                inBook
                1
                0.3
            })

        // Above the markers, so labels are placed first and only compete with each other.
        // The markers then keep the basemap's own labels (towns, peaks) clear of the fells.
        SymbolLayer(id: MapIds.fellLabels, source: MapIds.fellSource)
            .minZoom(8.4)
            // Zoomed out, only the big summits are named; more appear as you zoom in.
            .textField(Exp(.step) {
                Exp(.zoom)
                Self.label(minHeight: 870)
                10
                Self.label(minHeight: 700)
                11
                Self.label(minHeight: 450)
                12
                Self.label(minHeight: 0)
            })
            .textFont(["DIN Pro Medium", "Arial Unicode MS Regular"])
            .textSize(Exp(.interpolate) {
                Exp(.linear)
                Exp(.zoom)
                9
                10.5
                14
                13.5
            })
            .textVariableAnchor([.top, .bottom, .left, .right])
            .textRadialOffset(1.05)
            .textJustify(.auto)
            .textLineHeight(1.1)
            .textMaxWidth(8)
            .symbolSortKey(Exp(.get) { "sortKey" })
            .textColor(isDark ? UIColor(hex: 0xF3F1E4) : Palette.ink)
            .textHaloColor(isDark ? UIColor(hex: 0x0B1A12, alpha: 0.85) : UIColor(hex: 0xFAFAE8, alpha: 0.92))
            .textHaloWidth(1.4)
            .textHaloBlur(0.4)
            .textOpacity(Exp(.interpolate) {
                Exp(.linear)
                Exp(.zoom)
                8.4
                0
                9
                1
            })
            .textPadding(4)
            .filter(inBook)
            .textEmissiveStrength(1)
            .textOcclusionOpacity(0.3)
    }

    private var inBook: Exp {
        guard let book else { return Exp(.literal) { true } }
        return Exp(.eq) { Exp(.get) { "book" }; Double(book.rawValue) }
    }

    /// "Helvellyn" over "950 m", or no label for fells below `minHeight`.
    private static func label(minHeight: Double) -> Exp {
        Exp(.switchCase) {
            Exp(.gte) { Exp(.get) { "heightMetres" }; minHeight }
            Exp(.format) {
                Exp(.get) { "name" }
                FormatOptions()
                "\n"
                FormatOptions()
                Exp(.get) { "height" }
                FormatOptions(fontScale: .constant(0.82), textFont: .constant(["DIN Pro Regular", "Arial Unicode MS Regular"]))
            }
            ""
        }
    }

}

/// Builds the fell feature collection, rebuilt only when the bagged set changes.
@MainActor
final class FellFeatureCache {
    private var lastBagged: Set<String>?
    private var lastCollection = FeatureCollection(features: [])

    func collection(bagged: Set<String>) -> FeatureCollection {
        if bagged == lastBagged { return lastCollection }
        lastBagged = bagged
        lastCollection = FeatureCollection(features: FellCatalog.all.map { fell in
            var feature = Feature(geometry: .point(Point(fell.coordinate)))
            feature.identifier = .string(fell.id)
            feature.properties = [
                "id": .string(fell.id),
                "name": .string(fell.name),
                "height": .string(fell.heightLabel),
                "heightMetres": .number(fell.heightMetres),
                "book": .number(Double(fell.book.rawValue)),
                "bagged": .boolean(bagged.contains(fell.id)),
                // Lower sort keys are placed first: bagged fells, then higher fells, win label space.
                "sortKey": .number(-fell.heightMetres - (bagged.contains(fell.id) ? 2000 : 0)),
            ]
            return feature
        })
        return lastCollection
    }
}
