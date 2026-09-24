import SwiftUI
import UIKit

/// The web app's journal palette (apps/web/styles/slope.css), plus one warm accent for bagged fells.
enum Palette {
    static let moss = UIColor(hex: 0x3E6E54)
    static let leaf = UIColor(hex: 0x5C946F)
    static let pine = UIColor(hex: 0x1F4232)
    static let ink = UIColor(hex: 0x112318)
    static let cream = UIColor(hex: 0xFAFAE8)
    static let bracken = UIColor(hex: 0xE3A23B)
    static let contour = UIColor(hex: 0x8A6E4B)
}

extension Color {
    /// Moss in light mode, leaf in dark mode.
    static let brand = Color(UIColor { $0.userInterfaceStyle == .dark ? Palette.leaf : Palette.moss })
    static let bagged = Color(Palette.bracken)
    static let pine = Color(Palette.pine)
    static let cream = Color(Palette.cream)
}

extension UIColor {
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: alpha
        )
    }
}

extension View {
    /// Liquid Glass on iOS 26, a thick material before that.
    @ViewBuilder
    func glassBackground<S: Shape>(in shape: S, interactive: Bool = false) -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(interactive ? .regular.interactive() : .regular, in: shape)
        } else {
            self.background(.regularMaterial, in: shape)
                .overlay(shape.stroke(.primary.opacity(0.08), lineWidth: 0.5))
                .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
        }
    }

    /// The prominent call to action style: glass prominent on iOS 26, bordered prominent before.
    @ViewBuilder
    func prominentActionStyle() -> some View {
        if #available(iOS 26, *) {
            self.buttonStyle(.glassProminent)
        } else {
            self.buttonStyle(.borderedProminent)
        }
    }
}
