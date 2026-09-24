import SwiftUI

/// The selected fell's marker: a pin that springs up from the summit, and turns
/// bracken with a tick (and a ripple) the moment the fell is bagged.
struct SelectedFellPin: View {
    let isBagged: Bool

    @State private var appeared = false
    @State private var ripple = false

    var body: some View {
        VStack(spacing: -2) {
            ZStack {
                Circle()
                    .stroke(Color.bagged, lineWidth: 3)
                    .scaleEffect(ripple ? 2.1 : 1)
                    .opacity(ripple ? 0 : 0.9)
                    .opacity(isBagged ? 1 : 0)
                Circle()
                    .fill(isBagged ? Color.bagged : Color.cream)
                Circle()
                    .strokeBorder(Color.pine, lineWidth: 2.5)
                Image(systemName: isBagged ? "checkmark" : "mountain.2.fill")
                    .font(.system(size: isBagged ? 18 : 15, weight: .bold))
                    .foregroundStyle(Color.pine)
                    .contentTransition(.symbolEffect(.replace))
            }
            .frame(width: 44, height: 44)
            PinTail()
                .fill(Color.pine)
                .frame(width: 14, height: 10)
        }
        .shadow(color: .black.opacity(0.3), radius: 4, y: 2)
        .scaleEffect(appeared ? 1 : 0.2, anchor: .bottom)
        .padding(.horizontal, 26)
        .padding(.top, 26)
        .animation(.spring(duration: 0.35, bounce: 0.35), value: isBagged)
        .onAppear {
            withAnimation(.spring(duration: 0.45, bounce: 0.4)) { appeared = true }
        }
        .onChange(of: isBagged) { _, bagged in
            guard bagged else { return }
            ripple = false
            withAnimation(.easeOut(duration: 0.9)) { ripple = true }
        }
        .accessibilityHidden(true)
    }
}

private struct PinTail: Shape {
    func path(in rect: CGRect) -> Path {
        Path { path in
            path.move(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.closeSubpath()
        }
    }
}
