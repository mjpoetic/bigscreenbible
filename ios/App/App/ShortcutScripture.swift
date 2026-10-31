import Foundation

struct ShortcutScripture {
    let reference: String
    let text: String
    let version: String
    var credit: String? = nil

    var url: URL {
        var parts = URLComponents(string: "https://bigscreenbible.com/")!
        parts.queryItems = [URLQueryItem(name: "ref", value: reference), URLQueryItem(name: "version", value: version), URLQueryItem(name: "mode", value: "reader")]
        return parts.url!
    }

    static func passage(_ input: String, source: URL) throws -> ShortcutScripture {
        let input = input.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "–", with: "-").replacingOccurrences(of: "—", with: "-")
        let regex = try NSRegularExpression(pattern: "^([1-3]?\\s*[A-Za-z ]+?)\\s*(\\d{1,3})(?::(\\d{1,3})(?:-(\\d{1,3}))?)?$")
        guard input.count <= 200, let match = regex.firstMatch(in: input, range: NSRange(input.startIndex..., in: input)) else { throw ScriptureError.reference }
        func group(_ index: Int) -> String? { Range(match.range(at: index), in: input).map { String(input[$0]) } }
        let book = group(1)!.lowercased().replacingOccurrences(of: " ", with: "")
        let chapter = Int(group(2)!)!
        let raw = try String(contentsOf: source, encoding: .utf8)
        guard raw.hasPrefix("window.BIGSCREEN_BIBLE_KJV="), let start = raw.firstIndex(of: "{"), let end = raw.lastIndex(of: "}") else { throw ScriptureError.unavailable }
        let data = Data(raw[start...end].utf8)
        guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any], let chapters = root["chapters"] as? [String: [String: Any]],
              let key = chapters.keys.first(where: {
                  let normalized = $0.lowercased().replacingOccurrences(of: " ", with: "")
                  return normalized == "\(book == "psalms" ? "psalm" : book)\(chapter)"
              }), let verses = chapters[key]?["verses"] as? [[String: Any]] else { throw ScriptureError.reference }
        let first = group(3).flatMap(Int.init)
        let last = group(4).flatMap(Int.init) ?? first
        let selected = verses.filter { verse in
            guard let number = verse["n"] as? Int else { return false }
            return first == nil || (number >= first! && number <= last!)
        }
        guard !selected.isEmpty, first == nil || (first! > 0 && last! >= first! && selected.count == last! - first! + 1) else { throw ScriptureError.reference }
        guard selected.count <= 40 else { throw ScriptureError.tooLong }
        let reference = first.map { "\(key):\($0)" + (last != first ? "-\(last!)" : "") } ?? key
        let text = selected.compactMap { $0["text"] as? String }.joined(separator: "\n\n")
        return ShortcutScripture(reference: reference, text: text, version: "KJV")
    }
}

enum ScriptureError: LocalizedError {
    case reference, unavailable, tooLong
    var errorDescription: String? {
        switch self {
        case .reference: return "Enter a Bible reference such as John 3:16, Psalm 23, or 1 Corinthians 13:4-7. Use one chapter at a time."
        case .unavailable: return "The bundled Scripture text is unavailable. Open Big Screen Bible and try again."
        case .tooLong: return "Choose a passage of up to 40 verses for the Scripture card."
        }
    }
}
