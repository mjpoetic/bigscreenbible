import Foundation

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
    func checked(_ date: Date) -> Bool { lastVisit == WidgetStore.dayKey(date) || days.contains(WidgetStore.dayKey(date)) }
    func streak(_ date: Date) -> Int {
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: date)!
        return checked(date) || lastVisit == WidgetStore.dayKey(yesterday) ? current : 0
    }
}
