import UIKit

/// Fell marker icons for the map's symbol layer, drawn once at launch.
enum MarkerImages {
    /// A to-go fell: cream disc, pine outline.
    static let toGo = marker(diameter: 15, fill: Palette.cream, check: false)

    /// A bagged fell: warm bracken disc, pine outline, pine tick.
    static let bagged = marker(diameter: 21, fill: Palette.bracken, check: true)

    private static func marker(diameter: CGFloat, fill: UIColor, check: Bool) -> UIImage {
        let shadow: CGFloat = 3
        let side = diameter + shadow * 2
        let format = UIGraphicsImageRendererFormat()
        format.scale = 3
        return UIGraphicsImageRenderer(size: CGSize(width: side, height: side), format: format).image { context in
            let cg = context.cgContext
            let disc = CGRect(x: shadow, y: shadow, width: diameter, height: diameter)

            cg.setShadow(offset: CGSize(width: 0, height: 1), blur: 2.5, color: UIColor.black.withAlphaComponent(0.35).cgColor)
            cg.setFillColor(Palette.pine.cgColor)
            cg.fillEllipse(in: disc)
            cg.setShadow(offset: .zero, blur: 0, color: nil)

            cg.setFillColor(fill.cgColor)
            cg.fillEllipse(in: disc.insetBy(dx: 1.8, dy: 1.8))

            guard check else { return }
            let tick = UIBezierPath()
            let unit = diameter / 21
            tick.move(to: CGPoint(x: disc.minX + 6.2 * unit, y: disc.minY + 10.8 * unit))
            tick.addLine(to: CGPoint(x: disc.minX + 9.2 * unit, y: disc.minY + 13.8 * unit))
            tick.addLine(to: CGPoint(x: disc.minX + 14.8 * unit, y: disc.minY + 7.6 * unit))
            tick.lineWidth = 2.3 * unit
            tick.lineCapStyle = .round
            tick.lineJoinStyle = .round
            Palette.pine.setStroke()
            tick.stroke()
        }
    }
}
