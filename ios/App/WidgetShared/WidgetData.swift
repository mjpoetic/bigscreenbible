import Foundation
import CoreText
import CryptoKit

// Shared only with the widget extension; no credentials or account details.
enum WidgetStore {
    static let group = "group.com.bigscreenbible.app"
    static let kind = "DailyScripture"
    static let defaults = UserDefaults(suiteName: group)
    static func dayKey(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    static func snapshot() -> WidgetSnapshot {
        guard let data = defaults?.data(forKey: "snapshot"),
              let value = try? JSONDecoder().decode(WidgetSnapshot.self, from: data) else { return WidgetSnapshot() }
        return value
    }
    static func verse(for date: Date) -> WidgetVerse {
        if let data = defaults?.data(forKey: "dailyVerse"),
           let cached = try? JSONDecoder().decode(WidgetVerse.self, from: data), cached.day == dayKey(date) { return cached }
        let catalog = catalogData()
        let seasonal = catalog?["seasonal"] as? [String: [String: String]]
        let anchors = catalog?["anchors"] as? [[String: String]] ?? []
        let index = (Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1) - 1
        let entry = seasonal?[String(dayKey(date).suffix(5))] ?? (anchors.isEmpty ? nil : anchors[index % anchors.count])
        return WidgetVerse(reference: entry?["reference"] ?? "Psalm 23:1", text: entry?["text"] ?? "The LORD is my shepherd; I shall not want.", source: "KJV", day: dayKey(date))
    }
    static func catalogData() -> [String: Any]? {
        guard let url = Bundle.main.url(forResource: "widget-catalog", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
    }
    static func refreshVerse(completion: @escaping () -> Void) {
        guard let catalog = catalogData(), let endpoint = catalog["endpoint"] as? String,
              let url = URL(string: endpoint), let key = catalog["publishableKey"] as? String else { completion(); return }
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 8)
        request.setValue(key, forHTTPHeaderField: "apikey")
        let requestedDay = dayKey(Date())
        URLSession.shared.dataTask(with: request) { data, response, _ in
            defer { completion() }
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let data, data.count < 32000,
                  let item = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let reference = item["reference"] as? String, !reference.isEmpty, reference.count < 100,
                  let text = item["verseText"] as? String, !text.isEmpty, text.count <= 2000,
                  requestedDay == dayKey(Date()) else { return }
            let verse = WidgetVerse(reference: reference, text: text, source: "Heartlight", day: requestedDay)
            if let encoded = try? JSONEncoder().encode(verse) { defaults?.set(encoded, forKey: "dailyVerse") }
        }.resume()
    }
}
struct WidgetVerse: Codable {
    var reference: String
    var text: String
    var source: String
    var day: String
    var version: String? = nil
    var verses: String? = nil
    var linkReference: String? = nil
    var isValidFavorite: Bool { !reference.isEmpty && reference.count <= 100 && !text.isEmpty && text.count <= 2000 && source.count <= 40 }
    var widgetCitation: String { source == "Heartlight" ? reference : "\(reference) · \(source)" }
    var url: URL {
        var parts = URLComponents(string: "https://bigscreenbible.com/")!
        parts.queryItems = [URLQueryItem(name: "ref", value: linkReference ?? reference), URLQueryItem(name: "mode", value: "reader"), URLQueryItem(name: "version", value: version ?? (source == "KJV" ? "KJV" : "BSB"))]
        if let verses { parts.queryItems?.append(URLQueryItem(name: "verses", value: verses)) }
        return parts.url!
    }
}
struct WidgetSnapshot: Codable {
    var current: Int = 0
    var lastVisit: String = ""
    var days: [String] = []
    var background: String? = nil
    var favorite: WidgetVerse? = nil
    var fontFamily: String? = nil
    func checked(_ date: Date) -> Bool { lastVisit == WidgetStore.dayKey(date) || days.contains(WidgetStore.dayKey(date)) }
    func streak(_ date: Date) -> Int {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: date)!
        return checked(date) || lastVisit == WidgetStore.dayKey(yesterday) ? current : 0
    }
}

// Web CSS fonts must be registered independently in the widget process. Only
// Google Fonts' HTTPS endpoints are fetched; installed and bundled fonts work offline.
enum WidgetFontCache {
    static func fileName(_ family: String) -> String {
        SHA256.hash(data: Data(family.utf8)).map { String(format: "%02x", $0) }.joined() + ".ttf"
    }
    static func cacheURL(_ family: String) -> URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: WidgetStore.group)?
            .appendingPathComponent("WidgetFonts", isDirectory: true).appendingPathComponent(fileName(family))
    }
    static func bundledURL(_ family: String) -> URL? {
        guard family.lowercased() == "literata" else { return nil }
        var app = Bundle.main.bundleURL
        if app.pathExtension == "appex" { app = app.deletingLastPathComponent().deletingLastPathComponent() }
        let url = app.appendingPathComponent("public/assets/fonts/literata-400.ttf")
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }
    static func systemName(_ family: String) -> String? {
        let font = CTFontCreateWithName(family as CFString, 12, nil)
        let name = CTFontCopyPostScriptName(font) as String
        let actualFamily = CTFontCopyFamilyName(font) as String
        return name.caseInsensitiveCompare(family) == .orderedSame || actualFamily.caseInsensitiveCompare(family) == .orderedSame ? name : nil
    }
    static func register(_ url: URL) -> String? {
        guard let provider = CGDataProvider(url: url as CFURL), let font = CGFont(provider), let name = font.postScriptName else { return nil }
        CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        return name as String
    }
    static func fontName(_ requested: String?) -> String {
        let family = String((requested ?? "").prefix(100)).trimmingCharacters(in: .whitespacesAndNewlines)
        if let url = bundledURL(family), let name = register(url) { return name }
        if let url = cacheURL(family), let name = register(url) { return name }
        return systemName(family) ?? "Georgia"
    }
    static func downloadURL(_ css: String) -> URL? {
        guard let pattern = try? NSRegularExpression(pattern: "https://fonts\\.gstatic\\.com/[^\\s)'\"]+\\.(?:ttf|otf)"),
              let match = pattern.firstMatch(in: css, range: NSRange(css.startIndex..., in: css)),
              let range = Range(match.range, in: css), let url = URL(string: String(css[range])), url.host == "fonts.gstatic.com" else { return nil }
        return url
    }
    static func refresh(_ requested: String?, completion: @escaping () -> Void) {
        let family = String((requested ?? "").prefix(100)).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !family.isEmpty, bundledURL(family) == nil, systemName(family) == nil,
              let target = cacheURL(family), !FileManager.default.fileExists(atPath: target.path) else { completion(); return }
        var parts = URLComponents(string: "https://fonts.googleapis.com/css2")!
        parts.queryItems = [URLQueryItem(name: "family", value: family), URLQueryItem(name: "display", value: "swap")]
        var request = URLRequest(url: parts.url!, timeoutInterval: 5)
        // A simple UA requests a full TrueType font rather than browser-only WOFF2 subsets.
        request.setValue("Mozilla/5.0", forHTTPHeaderField: "User-Agent")
        URLSession.shared.dataTask(with: request) { data, response, _ in
            guard (response as? HTTPURLResponse)?.statusCode == 200, response?.url?.host == "fonts.googleapis.com",
                  let data, data.count < 100000, let css = String(data: data, encoding: .utf8), let url = downloadURL(css) else { completion(); return }
            URLSession.shared.dataTask(with: URLRequest(url: url, timeoutInterval: 5)) { data, response, _ in
                defer { completion() }
                guard (response as? HTTPURLResponse)?.statusCode == 200, response?.url?.host == "fonts.gstatic.com",
                      let data, data.count < 4000000, let provider = CGDataProvider(data: data as CFData), CGFont(provider) != nil else { return }
                try? FileManager.default.createDirectory(at: target.deletingLastPathComponent(), withIntermediateDirectories: true)
                try? data.write(to: target, options: .atomic)
            }.resume()
        }.resume()
    }
}
