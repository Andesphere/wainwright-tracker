import SwiftUI

/// Wobbly closed contour lines around a summit, every fifth one heavier, optionally with a
/// bagged marker on top. The app's one piece of decoration: paywall, album tiles and the PDF.
struct ContourArtwork: View {
    var color: Color = .cream
    var opacity: Double = 1
    /// Summit position as a fraction of the frame.
    var summit = UnitPoint(x: 0.76, y: 0.36)
    var rings = 13
    var spacing: CGFloat = 17
    var showsMarker = true
    /// A second, smaller hill so the picture reads as ground rather than a target.
    var showsNeighbour = true

    var body: some View {
        Canvas { context, size in
            let main = CGPoint(x: size.width * summit.x, y: size.height * summit.y)
            draw(&context, center: main, rings: rings, spacing: spacing, phase: 0.4)
            if showsNeighbour {
                let neighbour = CGPoint(x: size.width * (1 - summit.x) * 0.75, y: size.height * summit.y * 0.3)
                draw(&context, center: neighbour, rings: max(3, rings / 2), spacing: spacing * 0.9, phase: 2.1)
            }
            guard showsMarker else { return }
            let disc = CGRect(x: main.x - 13, y: main.y - 13, width: 26, height: 26)
            context.fill(Path(ellipseIn: disc.insetBy(dx: -6, dy: -6)), with: .color(Color.bagged.opacity(0.25)))
            context.fill(Path(ellipseIn: disc), with: .color(Color.pine))
            context.fill(Path(ellipseIn: disc.insetBy(dx: 2.2, dy: 2.2)), with: .color(Color.bagged))
            var tick = Path()
            tick.move(to: CGPoint(x: main.x - 5.5, y: main.y + 0.5))
            tick.addLine(to: CGPoint(x: main.x - 1.5, y: main.y + 4.5))
            tick.addLine(to: CGPoint(x: main.x + 6, y: main.y - 4))
            context.stroke(tick, with: .color(Color.pine), style: StrokeStyle(lineWidth: 2.6, lineCap: .round, lineJoin: .round))
        }
        .accessibilityHidden(true)
    }

    private func draw(_ context: inout GraphicsContext, center: CGPoint, rings: Int, spacing: CGFloat, phase: Double) {
        for ring in 1...rings {
            let radius = CGFloat(ring) * spacing
            var path = Path()
            let steps = 96
            for step in 0...steps {
                let angle = Double(step) / Double(steps) * 2 * .pi
                let wobble = 1 + 0.13 * sin(3 * angle + phase + Double(ring) * 0.35)
                    + 0.07 * cos(5 * angle - Double(ring) * 0.22)
                let point = CGPoint(
                    x: center.x + cos(angle) * radius * wobble * 1.25,
                    y: center.y + sin(angle) * radius * wobble
                )
                step == 0 ? path.move(to: point) : path.addLine(to: point)
            }
            let isIndex = ring % 5 == 0
            context.stroke(
                path,
                with: .color(color.opacity((isIndex ? 0.3 : 0.14) * opacity)),
                lineWidth: isIndex ? 1.4 : 0.8
            )
        }
    }
}

/// Stands in for a photo: the fell's height on a small contour picture.
struct FellArtwork: View {
    let fell: Fell

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(colors: [Color(Palette.moss), Color.pine], startPoint: .topLeading, endPoint: .bottomTrailing)
            ContourArtwork(summit: UnitPoint(x: 0.7, y: 0.4), rings: 9, spacing: 11, showsMarker: false)
            VStack(alignment: .leading, spacing: 0) {
                Image(systemName: "mountain.2.fill")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.bagged)
                Text(fell.heightLabel)
                    .font(.system(.subheadline, design: .serif).weight(.semibold))
                    .foregroundStyle(Color.cream)
            }
            .padding(10)
        }
        .accessibilityHidden(true)
    }
}
