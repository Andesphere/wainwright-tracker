import CoreLocation
import Observation

/// When-in-use location permission. The map only asks when the walker taps Locate.
@Observable
final class LocationPermission: NSObject, CLLocationManagerDelegate {
    private(set) var status: CLAuthorizationStatus
    @ObservationIgnored private let manager = CLLocationManager()
    @ObservationIgnored private var onDecision: ((Bool) -> Void)?

    override init() {
        status = manager.authorizationStatus
        super.init()
        manager.delegate = self
    }

    var isAuthorized: Bool {
        status == .authorizedWhenInUse || status == .authorizedAlways
    }

    var isDenied: Bool {
        status == .denied || status == .restricted
    }

    /// Asks once; `decided` runs with the outcome.
    func request(_ decided: @escaping (Bool) -> Void) {
        onDecision = decided
        manager.requestWhenInUseAuthorization()
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            self.status = status
            guard status != .notDetermined, let decided = self.onDecision else { return }
            self.onDecision = nil
            decided(self.isAuthorized)
        }
    }
}
