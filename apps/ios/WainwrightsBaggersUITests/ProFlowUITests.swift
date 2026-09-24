import XCTest

/// Walks the Pro journey in the Simulator and keeps a screenshot of each screen (test attachments,
/// and SCREENSHOT_DIR when set): free and locked states, the paywall, a purchase, the photo
/// journal, albums and the PDF, map layers, stats, restore, the account, and dark mode.
///
/// Purchases go through RevenueCat's Test Store: pass its public key as REVENUECAT_TEST_STORE_KEY
/// (Debug builds only use it). StoreKit test sessions do not reach the app from `xcodebuild test`,
/// so the local StoreKit file is for running from Xcode by hand.
///
/// It needs a free, signed-in walker with bagged, dated fells. Signed out, it signs in with
/// QA_EMAIL and QA_PASSWORD, and for a new-device code waits for a file at CODE_FILE.
final class ProFlowUITests: XCTestCase {
    private let app = XCUIApplication()
    private let env = ProcessInfo.processInfo.environment

    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.appearance = .light
        app.launchEnvironment["REVENUECAT_TEST_STORE_KEY"] = try XCTUnwrap(env["REVENUECAT_TEST_STORE_KEY"], "Set TEST_RUNNER_REVENUECAT_TEST_STORE_KEY")
        app.launchArguments = ["-lightPreset", env["LIGHT_PRESET"] ?? "day"]
    }

    func testProJourney() throws {
        app.launch()
        signInIfNeeded()
        waitForSync()
        let prefix = env["SHOT_PREFIX"] ?? ""

        // Free: locked shortcuts and the locked journal row on a bagged fell.
        XCTAssertTrue(app.buttons["Journal, Pro"].waitForExistence(timeout: 20), "Expected a free walker")
        shot("\(prefix)01-browse-free")
        openFell("Helvellyn")
        expandSheet()
        let locked = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Add a note and photos'")).firstMatch
        XCTAssertTrue(locked.waitForExistence(timeout: 10))
        shot("\(prefix)02-locked-journal-row")

        // Paywall from the locked row, then a trial purchase.
        locked.tap()
        let subscribe = app.buttons.matching(NSPredicate(format: "label IN {'Start free trial', 'Subscribe'} AND isEnabled == true")).firstMatch
        XCTAssertTrue(subscribe.waitForExistence(timeout: 30), "Paywall prices did not load")
        sleep(1)
        shot("\(prefix)03-paywall")
        XCUIDevice.shared.appearance = .dark
        sleep(2)
        shot("\(prefix)03c-paywall-dark")
        XCUIDevice.shared.appearance = .light
        sleep(1)
        app.swipeUp()
        shot("\(prefix)03b-paywall-terms")
        subscribe.tap()
        // RevenueCat's Test Store asks how the purchase should end.
        let succeed = app.buttons["Test valid purchase"]
        if succeed.waitForExistence(timeout: 15) {
            sleep(1)
            shot("\(prefix)03d-test-store-sheet")
            succeed.tap()
        }
        XCTAssertTrue(app.staticTexts["Welcome to Pro"].waitForExistence(timeout: 60), "Purchase did not unlock Pro")
        shot("\(prefix)04-welcome-to-pro")

        // Photo journal on the card.
        let photo = app.buttons["Photo of Helvellyn"].firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 15), "Journal did not unlock on the card")
        sleep(3)
        shot("\(prefix)05-journal-on-card")
        photo.tap()
        sleep(2)
        shot("\(prefix)06-photo-viewer")
        app.buttons["viewer.close"].tap()
        XCTAssertTrue(app.buttons["viewer.close"].waitForNonExistence(timeout: 5))

        // Add a note and a photo to a fell with neither.
        openFell("Skiddaw")
        expandSheet()
        app.buttons["Add note"].tap()
        let note = app.textViews.firstMatch.exists ? app.textViews.firstMatch : app.textFields.firstMatch
        XCTAssertTrue(note.waitForExistence(timeout: 5))
        note.typeText("Up the tourist path from Latrigg. Clear all the way to Scotland.")
        shot("\(prefix)07-note-editor")
        app.buttons["Save"].tap()
        let saved = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Up the tourist path from Latrigg. Clear all the way to Scotland.")).firstMatch
        XCTAssertTrue(saved.waitForExistence(timeout: 15), "Note did not save")
        app.buttons["Add up to two photos"].tap()
        pickFirstPhoto()
        XCTAssertTrue(app.buttons["Photo of Skiddaw"].waitForExistence(timeout: 60), "Photo upload did not finish")
        sleep(3)
        shot("\(prefix)08-photo-added")
        // And remove it again from the viewer.
        app.buttons["Photo of Skiddaw"].firstMatch.tap()
        XCTAssertTrue(app.buttons["Remove photo"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["Remove photo"].firstMatch.tap()
        let confirm = app.buttons.matching(NSPredicate(format: "label == 'Remove photo'")).element(boundBy: 1)
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        confirm.tap()
        XCTAssertTrue(app.buttons["Photo of Skiddaw"].waitForNonExistence(timeout: 20), "Photo was not removed")
        XCTAssertTrue(app.buttons["Add up to two photos"].waitForExistence(timeout: 10))
        closeCard()

        // Albums and the PDF.
        app.buttons["Journal"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["2026"].waitForExistence(timeout: 10))
        sleep(3)
        shot("\(prefix)09-journal-albums")
        app.swipeUp()
        sleep(2)
        shot("\(prefix)09b-journal-albums-2025")
        app.buttons["Make a printable album of 2025"].firstMatch.tap()
        sleep(8)
        shot("\(prefix)10-album-pdf")
        app.swipeUp()
        sleep(2)
        shot("\(prefix)10b-album-pdf-pages")
        dismissQuickLook()
        tapHittable("Done")

        // Stats.
        app.buttons["Stats"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["Fells per year"].waitForExistence(timeout: 10))
        sleep(1)
        shot("\(prefix)11-stats")
        app.swipeUp()
        sleep(1)
        shot("\(prefix)11b-stats-records")
        tapHittable("Done")

        // Map layers, over Helvellyn.
        openFell("Helvellyn")
        sleep(3)
        closeCard()
        app.buttons["Map layers"].tap()
        sleep(1)
        shot("\(prefix)12-layers-panel")
        app.buttons["Satellite"].tap()
        sleep(6)
        shot("\(prefix)13-satellite")
        app.buttons["Contours"].tap()
        sleep(6)
        shot("\(prefix)14-contours")
        app.buttons["Standard"].tap()
        app.buttons["Map layers"].tap()

        // Account with Pro, then restore.
        app.buttons["Account"].firstMatch.tap()
        XCTAssertTrue(app.navigationBars["Account"].waitForExistence(timeout: 10))
        app.navigationBars["Account"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.05)))
        XCTAssertTrue(app.buttons["Manage Subscription"].waitForExistence(timeout: 10))
        sleep(1)
        shot("\(prefix)15-account-pro")
        app.buttons["Restore Purchases"].tap()
        XCTAssertTrue(app.staticTexts["Pro is active on this account."].waitForExistence(timeout: 30), "Restore did not find Pro")
        shot("\(prefix)16-restore")
        app.alerts.buttons["OK"].tap()
        tapHittable("Done")

        // Dark mode.
        XCUIDevice.shared.appearance = .dark
        sleep(2)
        app.buttons["Journal"].firstMatch.tap()
        sleep(3)
        shot("\(prefix)17-journal-dark")
        tapHittable("Done")
        app.buttons["Stats"].firstMatch.tap()
        sleep(2)
        shot("\(prefix)18-stats-dark")
        tapHittable("Done")
        openFell("Helvellyn")
        expandSheet()
        sleep(2)
        shot("\(prefix)19-card-dark")
        XCUIDevice.shared.appearance = .light
    }

    // MARK: - Helpers

    private func signInIfNeeded() {
        let signIn = app.buttons["Sign in"]
        guard signIn.waitForExistence(timeout: 8) else { return }
        signIn.tap()
        let email = app.descendants(matching: .any)["clerk.auth.start.identifier"].firstMatch
        XCTAssertTrue(email.waitForExistence(timeout: 15), app.debugDescription)
        email.tap()
        app.typeText(env["QA_EMAIL"] ?? "")
        app.buttons["clerk.auth.start.continue"].firstMatch.tap()
        let password = app.descendants(matching: .any).matching(NSPredicate(format: "identifier CONTAINS[c] 'password' AND elementType != %d", XCUIElement.ElementType.button.rawValue)).firstMatch
        XCTAssertTrue(password.waitForExistence(timeout: 15), app.debugDescription)
        password.tap()
        app.typeText(env["QA_PASSWORD"] ?? "")
        let next = app.buttons.matching(NSPredicate(format: "label == 'Continue' AND isEnabled == true")).firstMatch
        XCTAssertTrue(next.waitForExistence(timeout: 5), app.debugDescription)
        next.tap()
        // A new device gets an emailed code.
        if app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'code'")).firstMatch.waitForExistence(timeout: 10),
           let path = env["CODE_FILE"] {
            FileManager.default.createFile(atPath: path + ".needed", contents: Data())
            var code = ""
            for _ in 0..<180 {
                if let text = try? String(contentsOfFile: path, encoding: .utf8), text.count >= 6 {
                    code = text.trimmingCharacters(in: .whitespacesAndNewlines)
                    break
                }
                sleep(1)
            }
            app.typeText(code)
        }
        XCTAssertTrue(app.buttons["Account"].waitForExistence(timeout: 45), app.debugDescription)
    }

    private func waitForSync() {
        let synced = app.staticTexts.matching(NSPredicate(format: "label MATCHES '[0-9]+ of 214'")).firstMatch
        XCTAssertTrue(synced.waitForExistence(timeout: 30))
        sleep(2)
    }

    /// The system photo picker runs in its own process, so it is driven by position: the newest
    /// photo (top left of the grid), then the confirm tick at the top right.
    private func pickFirstPhoto() {
        sleep(4)
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.16, dy: 0.47)).tap()
        sleep(1)
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.904, dy: 0.165)).tap()
    }

    /// Closes whatever fell card is open, until the search field is back.
    private func closeCard() {
        let search = app.textFields["Search 214 fells"]
        for _ in 0..<4 where !search.waitForExistence(timeout: 1) {
            let close = app.buttons["card.close"]
            if close.exists { close.tap() }
            sleep(1)
        }
    }

    private func openFell(_ name: String) {
        closeCard()
        let search = app.textFields["Search 214 fells"]
        XCTAssertTrue(search.waitForExistence(timeout: 10))
        search.tap()
        search.typeText(name)
        let row = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "\(name),")).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        row.tap()
        sleep(2)
    }

    private func expandSheet() {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.62))
        start.press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.08)))
        sleep(1)
    }

    private func dismissQuickLook() {
        if !tapHittable("Close") && !tapHittable("Done") {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.905, dy: 0.096)).tap()
        }
        sleep(1)
    }

    /// Taps the first button with this label that is on screen and not covered.
    @discardableResult
    private func tapHittable(_ label: String) -> Bool {
        let buttons = app.buttons.matching(NSPredicate(format: "label == %@", label))
        for index in 0..<buttons.count where buttons.element(boundBy: index).isHittable {
            buttons.element(boundBy: index).tap()
            return true
        }
        return false
    }

    private func tapFirst(_ labels: [String]) {
        for label in labels {
            let button = app.buttons[label].firstMatch
            if button.waitForExistence(timeout: 5) {
                button.tap()
                return
            }
        }
    }

    private func shot(_ name: String) {
        let png = XCUIScreen.main.screenshot().pngRepresentation
        let attachment = XCTAttachment(data: png, uniformTypeIdentifier: "public.png")
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        if let dir = env["SCREENSHOT_DIR"] {
            try? png.write(to: URL(fileURLWithPath: dir).appendingPathComponent("\(name).png"))
        }
    }
}
