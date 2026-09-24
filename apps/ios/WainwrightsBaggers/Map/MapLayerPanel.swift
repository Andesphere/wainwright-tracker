import SwiftUI

/// The layers card beside the map controls: Standard, and the two Pro layers.
/// Inline rather than a popover, because the bottom sheet is already a presentation.
struct MapLayerPanel: View {
    @Environment(AppModel.self) private var model
    @Environment(ProStore.self) private var pro

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Map")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.leading, 2)
            HStack(spacing: 10) {
                ForEach(MapLayer.allCases) { layer in
                    option(layer)
                }
            }
        }
        .padding(12)
        .glassBackground(in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var current: MapLayer { pro.isPro ? model.mapLayer : .standard }

    private func option(_ layer: MapLayer) -> some View {
        let selected = current == layer
        let locked = layer.needsPro && !pro.isPro
        return Button {
            if locked {
                model.showsLayers = false
                model.paywall = .layers
            } else {
                model.mapLayer = layer
            }
        } label: {
            VStack(spacing: 6) {
                LayerPreview(layer: layer)
                    .frame(width: 66, height: 66)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(selected ? Color.brand : Color.primary.opacity(0.12), lineWidth: selected ? 2.5 : 1)
                    }
                    .overlay(alignment: .topTrailing) {
                        if locked {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(Color.pine)
                                .frame(width: 20, height: 20)
                                .background(Color.bagged, in: Circle())
                                .padding(4)
                        }
                    }
                Text(layer.title)
                    .font(.caption.weight(selected ? .semibold : .regular))
                    .foregroundStyle(selected ? Color.brand : .primary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: selected)
        .accessibilityLabel(locked ? "\(layer.title), Pro" : layer.title)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

/// A small drawn swatch of each layer, so the choice reads at a glance.
private struct LayerPreview: View {
    let layer: MapLayer

    var body: some View {
        Canvas { context, size in
            let rect = CGRect(origin: .zero, size: size)
            switch layer {
            case .standard:
                context.fill(Path(rect), with: .color(Color(UIColor(hex: 0xE9EDD9))))
                context.fill(blob(in: size, x: 0.22, y: 0.72, r: 0.2), with: .color(Color(UIColor(hex: 0xB3CFDC))))
                contours(context, size: size, rings: 5, color: Color(Palette.contour).opacity(0.35), width: 0.8)
                var road = Path()
                road.move(to: CGPoint(x: 0, y: size.height * 0.3))
                road.addCurve(to: CGPoint(x: size.width, y: size.height * 0.52),
                              control1: CGPoint(x: size.width * 0.4, y: size.height * 0.15),
                              control2: CGPoint(x: size.width * 0.6, y: size.height * 0.62))
                context.stroke(road, with: .color(.white), lineWidth: 2.4)
            case .satellite:
                context.fill(Path(rect), with: .color(Color(UIColor(hex: 0x3F4B30))))
                let patches: [(Double, Double, Double, UInt32)] = [
                    (0.2, 0.25, 0.3, 0x5A6440), (0.75, 0.3, 0.26, 0x6E6A4A), (0.6, 0.8, 0.3, 0x2F3B26),
                    (0.1, 0.9, 0.2, 0x4E5A39), (0.9, 0.95, 0.22, 0x7A7456),
                ]
                for (x, y, r, hex) in patches {
                    context.fill(blob(in: size, x: x, y: y, r: r), with: .color(Color(UIColor(hex: hex))))
                }
                context.fill(blob(in: size, x: 0.25, y: 0.7, r: 0.16), with: .color(Color(UIColor(hex: 0x23394A))))
                contours(context, size: size, rings: 3, color: .white.opacity(0.18), width: 0.8)
            case .contours:
                context.fill(Path(rect), with: .color(Color(UIColor(hex: 0xF4F0E1))))
                contours(context, size: size, rings: 11, color: Color(Palette.contour).opacity(0.75), width: 0.9, indexEvery: 5)
            }
        }
        .accessibilityHidden(true)
    }

    private func blob(in size: CGSize, x: Double, y: Double, r: Double) -> Path {
        let center = CGPoint(x: size.width * x, y: size.height * y)
        let radius = size.width * r
        return Path(ellipseIn: CGRect(x: center.x - radius * 1.2, y: center.y - radius, width: radius * 2.4, height: radius * 2))
    }

    private func contours(_ context: GraphicsContext, size: CGSize, rings: Int, color: Color, width: CGFloat, indexEvery: Int = 0) {
        let center = CGPoint(x: size.width * 0.66, y: size.height * 0.38)
        for ring in 1...rings {
            let radius = CGFloat(ring) * size.width * (rings > 6 ? 0.06 : 0.11)
            var path = Path()
            for step in 0...48 {
                let angle = Double(step) / 48 * 2 * .pi
                let wobble = 1 + 0.14 * sin(3 * angle + Double(ring) * 0.4)
                let point = CGPoint(x: center.x + cos(angle) * radius * wobble * 1.2, y: center.y + sin(angle) * radius * wobble)
                step == 0 ? path.move(to: point) : path.addLine(to: point)
            }
            let isIndex = indexEvery > 0 && ring % indexEvery == 0
            context.stroke(path, with: .color(color), lineWidth: isIndex ? width * 1.9 : width)
        }
    }
}
