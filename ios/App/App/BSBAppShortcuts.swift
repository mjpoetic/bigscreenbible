import AppIntents
import UIKit

// The app opens before perform runs. Keep requests until a scene can receive
// them; SceneDelegate's existing acknowledgement/retry bridge handles WebKit startup.
@MainActor
enum BSBShortcutNavigation {
    static var pending: String?

    static func open(_ destination: String) {
        pending = destination
        for scene in UIApplication.shared.connectedScenes {
            if let delegate = scene.delegate as? SceneDelegate {
                delegate.receiveAppShortcut()
                break
            }
        }
    }
}

@available(iOS 16.0, *)
struct OpenBiblePassageIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Bible Passage"
    static var description = IntentDescription("Open a passage in Big Screen Bible. Enter a reference such as John 3:16 or Psalm 23.")
    static var openAppWhenRun = true

    @Parameter(title: "Passage", requestValueDialog: "Which Bible passage?")
    var passage: String

    static var parameterSummary: some ParameterSummary {
        Summary("Open \(\.$passage) in Big Screen Bible")
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        let reference = passage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !reference.isEmpty, reference.count <= 200 else {
            throw $passage.needsValueError("Enter a Bible reference, such as John 3:16.")
        }
        var url = URLComponents(string: "https://bigscreenbible.com/")!
        url.queryItems = [URLQueryItem(name: "ref", value: reference), URLQueryItem(name: "mode", value: "reader")]
        BSBShortcutNavigation.open(url.url!.absoluteString)
        return .result()
    }
}

@available(iOS 16.0, *)
struct ShowVerseOfTheDayIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Verse of the Day"
    static var description = IntentDescription("Open today's Verse of the Day in Big Screen Bible.")
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        BSBShortcutNavigation.open("https://bigscreenbible.com/?mode=vod")
        return .result()
    }
}

@available(iOS 16.0, *)
struct ContinueBibleReadingIntent: AppIntent {
    static var title: LocalizedStringResource = "Continue Bible Reading"
    static var description = IntentDescription("Open the reader at your saved reading position in Big Screen Bible.")
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        BSBShortcutNavigation.open("continue")
        return .result()
    }
}

@available(iOS 16.0, *)
struct BSBAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(intent: OpenBiblePassageIntent(), phrases: [
            "Open a passage in \(.applicationName)",
            "Open a Bible passage in \(.applicationName)"
        ], shortTitle: "Open Passage", systemImageName: "book")
        AppShortcut(intent: ShowVerseOfTheDayIntent(), phrases: [
            "Show verse of the day in \(.applicationName)",
            "Show today's verse in \(.applicationName)"
        ], shortTitle: "Verse of the Day", systemImageName: "sun.max")
        AppShortcut(intent: ContinueBibleReadingIntent(), phrases: [
            "Continue reading in \(.applicationName)",
            "Continue my Bible reading in \(.applicationName)"
        ], shortTitle: "Continue Reading", systemImageName: "bookmark")
    }
}
