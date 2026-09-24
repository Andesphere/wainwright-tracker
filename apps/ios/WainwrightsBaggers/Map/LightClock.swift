import Foundation
import MapboxMaps

/// Picks the Mapbox Standard light preset from where the sun is over the Lake District right now.
///
/// Sun above 6 degrees is day, between -6 and 6 is dawn (morning) or dusk (evening),
/// below -6 (civil twilight ends) is night. Uses the NOAA low-precision solar position formulas.
enum LightClock {
    private static let latitude = 54.5
    private static let longitude = -3.1

    static func preset(at date: Date = .now) -> StandardLightPreset {
        if let forced = UserDefaults.standard.string(forKey: "lightPreset") {
            return StandardLightPreset(rawValue: forced)
        }
        let (elevation, isMorning) = sun(at: date)
        switch elevation {
        case ..<(-6): return .night
        case ..<6: return isMorning ? .dawn : .dusk
        default: return .day
        }
    }

    private static func sun(at date: Date) -> (elevation: Double, isMorning: Bool) {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC")!
        let dayOfYear = Double(calendar.ordinality(of: .day, in: .year, for: date) ?? 1)
        let parts = calendar.dateComponents([.hour, .minute], from: date)
        let hours = Double(parts.hour ?? 0) + Double(parts.minute ?? 0) / 60

        let gamma = 2 * Double.pi / 365 * (dayOfYear - 1 + (hours - 12) / 24)
        let equationOfTime = 229.18 * (0.000075 + 0.001868 * cos(gamma) - 0.032077 * sin(gamma)
            - 0.014615 * cos(2 * gamma) - 0.040849 * sin(2 * gamma))
        let declination = 0.006918 - 0.399912 * cos(gamma) + 0.070257 * sin(gamma)
            - 0.006758 * cos(2 * gamma) + 0.000907 * sin(2 * gamma)
            - 0.002697 * cos(3 * gamma) + 0.00148 * sin(3 * gamma)
        let solarMinutes = hours * 60 + equationOfTime + 4 * longitude
        let hourAngle = (solarMinutes / 4 - 180) * .pi / 180

        let phi = latitude * .pi / 180
        let cosZenith = sin(phi) * sin(declination) + cos(phi) * cos(declination) * cos(hourAngle)
        let elevation = 90 - acos(max(-1, min(1, cosZenith))) * 180 / .pi
        return (elevation, hourAngle < 0)
    }
}
