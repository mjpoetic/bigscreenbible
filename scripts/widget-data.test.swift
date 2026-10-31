import Foundation
import CoreText

@main
struct WidgetDataTests {
    static func main() throws {
        let formatter = ISO8601DateFormatter()
        let today = formatter.date(from: "2026-10-26T12:00:00Z")!
        let key = WidgetStore.dayKey(today)
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: today)!
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: today)!
        let afterGap = Calendar.current.date(byAdding: .day, value: 2, to: today)!
        let prior = WidgetSnapshot(current: 12, lastVisit: WidgetStore.dayKey(yesterday), days: [WidgetStore.dayKey(yesterday)])
        precondition(!prior.checked(today))
        precondition(prior.streak(today) == 12, "Yesterday's streak stays available today")
        precondition(prior.streak(tomorrow) == 0, "Missed days must expire without opening the app")
        let checked = WidgetSnapshot(current: 13, lastVisit: key, days: [key])
        precondition(checked.checked(today))
        precondition(checked.streak(tomorrow) == 13)
        precondition(checked.streak(afterGap) == 0)
        precondition(WidgetSnapshot().streak(today) == 0)
        let verse = WidgetVerse(reference: "2 Timothy 3:16-17", text: "Scripture", source: "KJV", day: key)
        let params = URLComponents(url: verse.url, resolvingAgainstBaseURL: false)!.queryItems!
        precondition(params.first(where: {$0.name == "ref"})?.value == "2 Timothy 3:16-17")
        precondition(params.first(where: {$0.name == "version"})?.value == "KJV")
        let decoded = try JSONDecoder().decode(WidgetSnapshot.self, from: JSONEncoder().encode(checked))
        precondition(decoded.checked(today) && decoded.current == 13)
        let legacy = try JSONDecoder().decode(WidgetSnapshot.self, from: Data("{\"current\":3,\"lastVisit\":\"\",\"days\":[]}".utf8))
        precondition(legacy.background == nil, "Older caches retain system appearance")
        var colored = checked
        colored.background = "#123456"
        let roundTrip = try JSONDecoder().decode(WidgetSnapshot.self, from: JSONEncoder().encode(colored))
        precondition(roundTrip.background == "#123456")
        let favorite = WidgetVerse(reference: "John 3:16,18", text: "Favorite wording", source: "KJV", day: "", version: "KJV", verses: "16,18", linkReference: "John 3:16")
        precondition(favorite.isValidFavorite)
        precondition(favorite.widgetCitation == "John 3:16,18 · KJV")
        precondition(WidgetVerse(reference: "John 3:16", text: "Text", source: "Heartlight", day: "").widgetCitation == "John 3:16")
        let favoriteURL = URLComponents(url: favorite.url, resolvingAgainstBaseURL: false)!.queryItems!
        precondition(favoriteURL.first(where: {$0.name == "ref"})?.value == "John 3:16")
        precondition(favoriteURL.first(where: {$0.name == "verses"})?.value == "16,18")
        colored.favorite = favorite
        let savedFavorite = try JSONDecoder().decode(WidgetSnapshot.self, from: JSONEncoder().encode(colored))
        precondition(savedFavorite.favorite?.text == "Favorite wording")
        precondition(legacy.favorite == nil)
        precondition(legacy.fontFamily == nil)
        precondition(Set(WidgetFontCache.files.keys) == Set(["Literata", "Lora", "Inter", "Source Sans 3"]))
        precondition(WidgetFontCache.fontName("Unknown font") == WidgetFontCache.fontName(nil), "Old selections use the safe default")
        let fontFolder = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
            .appendingPathComponent("ios/App/ScriptureWidget/Fonts")
        let info = try PropertyListSerialization.propertyList(from: Data(contentsOf: fontFolder.deletingLastPathComponent().appendingPathComponent("Info.plist")), format: nil) as! [String: Any]
        let declared = Set(info["UIAppFonts"] as! [String])
        for (family, file) in WidgetFontCache.files {
            precondition(declared.contains("Fonts/\(file).ttf"), "Widget must declare each bundled font")
            let url = fontFolder.appendingPathComponent(file + ".ttf")
            precondition(CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil))
            let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as! [CTFontDescriptor]
            let font = CTFontCreateWithFontDescriptor(descriptors[0], 14, nil)
            precondition(CTFontCopyFamilyName(font) as String == family, "Bundled font family must match the setting")
        }
        print("Widget data: local dates, check-ins, streak expiry, Codable snapshot and passage links passed.")
    }
}
