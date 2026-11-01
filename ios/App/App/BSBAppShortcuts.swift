import AppIntents
import UIKit
import SwiftUI

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
    static var title: LocalizedStringResource = "Open Verse of the Day"
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

@available(iOS 17.4, *)
struct BSBAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        if #available(iOS 26.0, *) {
            AppShortcut(intent: ShowBiblePassageIntent(), phrases: [
                "Show a passage in \(.applicationName)",
                "Show a Bible passage in \(.applicationName)"
            ], shortTitle: "Show Passage", systemImageName: "text.book.closed")
            AppShortcut(intent: ReadDailyScriptureIntent(), phrases: [
                "Show verse of the day in \(.applicationName)",
                "Show today's verse in \(.applicationName)"
            ], shortTitle: "Today's Verse", systemImageName: "sun.max")
        }
        AppShortcut(intent: OpenBiblePassageIntent(), phrases: [
            "Open a passage in \(.applicationName)",
            "Open a Bible passage in \(.applicationName)"
        ], shortTitle: "Open Passage", systemImageName: "book")
        AppShortcut(intent: ShowVerseOfTheDayIntent(), phrases: [
            "Open verse of the day in \(.applicationName)"
        ], shortTitle: "Verse of the Day", systemImageName: "sun.max")
        AppShortcut(intent: ContinueBibleReadingIntent(), phrases: [
            "Continue reading in \(.applicationName)",
            "Continue my Bible reading in \(.applicationName)"
        ], shortTitle: "Continue Reading", systemImageName: "bookmark")
    }
}

@available(iOS 26.0, *)
enum ScriptureCardVersion: String, AppEnum {
    case bsb = "BSB", kjv = "KJV", web = "WEB", asv = "ASV", bbe = "BBE", ylt = "YLT"
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Bible Translation"
    static var caseDisplayRepresentations: [ScriptureCardVersion: DisplayRepresentation] = [
        .bsb: "Berean Standard Bible (BSB)",
        .kjv: "King James Version (KJV)",
        .web: "World English Bible (WEB)",
        .asv: "American Standard Version (ASV)",
        .bbe: "Bible in Basic English (BBE)",
        .ylt: "Young's Literal Translation (YLT)"
    ]
}

// Card actions run without bringing the app to the foreground. Text is also
// returned to Shortcuts/Siri, which may choose its own presentation on iOS 27.
@available(iOS 26.0, *)
struct ShowBiblePassageIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Bible Passage"
    static var description = IntentDescription("Show a compact Scripture card in your selected translation without opening the app. Use a reference such as John 3:16 or Psalm 23.")
    static var openAppWhenRun = false
    @Parameter(title: "Passage", requestValueDialog: "Which Bible passage?") var passage: String
    @Parameter(title: "Translation", default: .bsb) var translation: ScriptureCardVersion
    static var parameterSummary: some ParameterSummary { Summary("Show \(\.$passage) in \(\.$translation)") }

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog & ShowsSnippetIntent {
        guard let source = Bundle.main.url(forResource: translation.rawValue, withExtension: "js", subdirectory: "public/assets/bibles") else { throw ScriptureError.unavailable }
        let scripture = try ShortcutScripture.passage(passage, source: source, version: translation.rawValue)
        let response = "\(scripture.reference) (\(scripture.version))\n\n\(scripture.text)"
        return .result(value: response, dialog: IntentDialog(stringLiteral: response), snippetIntent: ScriptureCardIntent(scripture: scripture))
    }
}

@available(iOS 26.0, *)
struct ReadDailyScriptureIntent: AppIntent {
    static var title: LocalizedStringResource = "Show Verse of the Day"
    static var description = IntentDescription("Show today's Scripture in a compact card without opening the app. An offline daily selection is used when the daily service cannot be reached.")
    static var openAppWhenRun = false

    func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog & ShowsSnippetIntent {
        await withCheckedContinuation { continuation in
            WidgetStore.refreshVerse { continuation.resume() }
        }
        let verse = WidgetStore.verse(for: Date())
        var scripture = ShortcutScripture(reference: verse.reference, text: verse.text, version: verse.source == "KJV" ? "KJV" : "BSB")
        scripture.credit = verse.source == "KJV" ? "Offline daily selection" : "Verse of the Day"
        let response = "\(scripture.credit!) · \(scripture.reference) (\(scripture.version))\n\n\(scripture.text)"
        return .result(value: response, dialog: IntentDialog(stringLiteral: response), snippetIntent: ScriptureCardIntent(scripture: scripture))
    }
}

@available(iOS 26.0, *)
struct ScriptureCardIntent: SnippetIntent {
    static var title: LocalizedStringResource = "Scripture Card"
    static var isDiscoverable = false
    @Parameter(title: "Reference") var reference: String
    @Parameter(title: "Scripture") var text: String
    @Parameter(title: "Translation") var version: String
    @Parameter(title: "Attribution") var credit: String?
    init() {}
    init(scripture: ShortcutScripture) {
        reference = scripture.reference; text = scripture.text; version = scripture.version; credit = scripture.credit
    }
    @MainActor
    func perform() async throws -> some IntentResult & ShowsSnippetView {
        let scripture = ShortcutScripture(reference: reference, text: text, version: version)
        return .result(view: VStack(alignment: .leading, spacing: 16) {
            Label("Big Screen Bible", systemImage: "book.closed").font(.caption).foregroundStyle(.secondary)
            Text("\(reference) · \(version)").font(.headline)
            if let credit { Text(credit).font(.caption).foregroundStyle(.secondary) }
            Text(text).font(.system(.body, design: .serif)).fixedSize(horizontal: false, vertical: true)
            Button(intent: OpenScriptureCardIntent(destination: scripture.url.absoluteString)) {
                Label("Open in Big Screen Bible", systemImage: "arrow.up.forward.app")
            }.buttonStyle(.borderedProminent)
        }.padding())
    }
}

@available(iOS 26.0, *)
struct OpenScriptureCardIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Scripture Card in App"
    static var isDiscoverable = false
    static var openAppWhenRun = true
    @Parameter(title: "Destination") var destination: String
    init() {}
    init(destination: String) { self.destination = destination }
    @MainActor
    func perform() async throws -> some IntentResult {
        guard let url = URL(string: destination), url.scheme == "https", url.host == "bigscreenbible.com", url.user == nil, url.password == nil, url.port == nil || url.port == 443 else { throw ScriptureError.reference }
        BSBShortcutNavigation.open(destination)
        return .result()
    }
}
