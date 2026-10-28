import Foundation

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
        print("Widget data: local dates, check-ins, streak expiry, Codable snapshot and passage links passed.")
    }
}
