import MapboxMaps
import Observation
import SwiftUI

/// Camera facts the floating controls need. Written on every camera frame, but each
/// property only changes when its rounded value does, so only the compass redraws while rotating.
@Observable
final class CameraHeading {
    private(set) var bearing: Double = 0
    private(set) var isRotated = false
    private(set) var isPitched = false

    func update(_ camera: CameraState) {
        let rounded = camera.bearing.rounded()
        if rounded != bearing { bearing = rounded }
        let rotated = abs(remainder(camera.bearing, 360)) > 0.5
        if rotated != isRotated { isRotated = rotated }
        let pitched = camera.pitch > 20
        if pitched != isPitched { isPitched = pitched }
    }
}

/// Floating glass controls, top right: 2D/3D, locate, and a compass while the map is rotated.
struct MapControls: View {
    let heading: CameraHeading
    let locateSymbol: String
    let toggle3D: () -> Void
    let locate: () -> Void
    let resetNorth: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            VStack(spacing: 0) {
                Button(action: toggle3D) {
                    Text(heading.isPitched ? "2D" : "3D")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .frame(width: 48, height: 46)
                        .contentShape(Rectangle())
                }
                .accessibilityLabel(heading.isPitched ? "Switch to flat 2D map" : "Switch to 3D terrain")

                Divider().frame(width: 30)

                Button(action: locate) {
                    Image(systemName: locateSymbol)
                        .font(.system(size: 17, weight: .medium))
                        .contentTransition(.symbolEffect(.replace))
                        .frame(width: 48, height: 46)
                        .contentShape(Rectangle())
                }
                .accessibilityLabel("Show my location")
            }
            .buttonStyle(.plain)
            .foregroundStyle(.primary)
            .glassBackground(in: RoundedRectangle(cornerRadius: 24, style: .continuous), interactive: true)

            if heading.isRotated {
                Button(action: resetNorth) {
                    Compass(heading: heading)
                        .frame(width: 48, height: 48)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .glassBackground(in: Circle(), interactive: true)
                .transition(.scale(scale: 0.6).combined(with: .opacity))
                .accessibilityLabel("Compass")
                .accessibilityHint("Turns the map to face north")
            }
        }
        .animation(.spring(duration: 0.35, bounce: 0.25), value: heading.isRotated)
    }
}

/// Needle and N, turned against the map bearing so N points north.
private struct Compass: View {
    let heading: CameraHeading

    var body: some View {
        ZStack {
            VStack(spacing: 1) {
                Text("N")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.86, green: 0.24, blue: 0.2))
                Needle()
                    .frame(width: 8, height: 26)
            }
            .offset(y: -3)
        }
        .rotationEffect(.degrees(-heading.bearing))
        .accessibilityValue("\(Int(heading.bearing)) degrees")
    }
}

private struct Needle: View {
    var body: some View {
        VStack(spacing: 0) {
            Triangle().fill(Color(red: 0.86, green: 0.24, blue: 0.2))
            Triangle().fill(.secondary).rotationEffect(.degrees(180))
        }
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        Path { path in
            path.move(to: CGPoint(x: rect.midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            path.closeSubpath()
        }
    }
}
