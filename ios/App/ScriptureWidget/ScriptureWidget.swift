import SwiftUI
import WidgetKit

struct ScriptureEntry: TimelineEntry {
    let date: Date
    let verse: WidgetVerse
    let streak: WidgetSnapshot
}
struct ScriptureProvider: TimelineProvider {
    func placeholder(in context: Context) -> ScriptureEntry { entry(Date()) }
    func getSnapshot(in context: Context, completion: @escaping (ScriptureEntry) -> Void) { completion(entry(Date())) }
    func entry(_ date: Date) -> ScriptureEntry { ScriptureEntry(date: date, verse: WidgetStore.verse(for: date), streak: WidgetStore.snapshot()) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<ScriptureEntry>) -> Void) {
        WidgetStore.refreshVerse {
            let now = Date()
            // Include local midnights even when the system delays the next reload.
            let midnight = Calendar.current.startOfDay(for: now)
            let dates = [now] + (1...7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: midnight) }
            completion(Timeline(entries: dates.map { entry($0) }, policy: .after(now.addingTimeInterval(3600))))
        }
    }
}
struct ScriptureView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    let entry: ScriptureEntry
    private var customRGB: UInt64? {
        guard let hex = entry.streak.background, hex.count == 7, hex.first == "#" else { return nil }
        return UInt64(hex.dropFirst(), radix: 16)
    }
    private var darkBackground: Bool {
        guard let rgb = customRGB else { return scheme == .dark }
        func linear(_ channel: UInt64) -> Double {
            let c = Double(channel) / 255
            return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * linear((rgb >> 16) & 255) + 0.7152 * linear((rgb >> 8) & 255) + 0.0722 * linear(rgb & 255) < 0.179
    }
    private var background: Color {
        if let rgb = customRGB { return Color(red: Double((rgb >> 16) & 255) / 255, green: Double((rgb >> 8) & 255) / 255, blue: Double(rgb & 255) / 255) }
        return scheme == .dark ? Color(red: 0.067, green: 0.114, blue: 0.216) : Color(red: 0.98, green: 0.965, blue: 0.935)
    }
    private var ink: Color { customRGB != nil ? (darkBackground ? .white : .black) : (scheme == .dark ? .white : Color(red: 0.067, green: 0.114, blue: 0.216)) }
    private var accent: Color { customRGB != nil ? ink : (scheme == .dark ? Color(red: 0.44, green: 0.83, blue: 0.8) : Color(red: 0.04, green: 0.40, blue: 0.40)) }
    var body: some View {
        Group {
            if family == .accessoryRectangular {
                VStack(alignment: .leading, spacing: 3) {
                    Label(entry.verse.reference, systemImage: "book") .font(.headline)
                    Text(entry.streak.checked(entry.date) ? "Checked in today" : "A moment in Scripture") .font(.caption)
                    Text("\(entry.streak.streak(entry.date)) day streak").font(.caption2)
                }
            } else {
                VStack(alignment: .leading, spacing: family == .systemSmall ? 6 : 9) {
                    Label("VERSE OF THE DAY", systemImage: "book")
                        .font(.system(size: 10, weight: .medium)).tracking(1).foregroundStyle(ink.opacity(0.7))
                    Text(entry.verse.text)
                        .font(.system(size: family == .systemSmall ? 18 : family == .systemExtraLarge ? 26 : 22, design: .serif))
                        .minimumScaleFactor(0.8).lineLimit(family == .systemSmall ? 4 : family == .systemMedium ? 3 : nil)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    Text("\(entry.verse.reference) · \(entry.verse.source)")
                        .font(.system(size: 11)).foregroundStyle(ink.opacity(0.75)).lineLimit(1).minimumScaleFactor(0.75)
                    Divider().overlay(ink.opacity(0.12))
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill").foregroundStyle(Color.orange)
                        Text("\(entry.streak.streak(entry.date)) day streak").foregroundStyle(ink)
                        Spacer(minLength: 0)
                        if family != .systemSmall { week }
                        Image(systemName: entry.streak.checked(entry.date) ? "checkmark.circle.fill" : "chevron.right").foregroundStyle(accent)
                            .accessibilityLabel(entry.streak.checked(entry.date) ? "Checked in today" : "Open Bible")
                    }.font(.system(size: 11, weight: .medium))
                }.foregroundStyle(ink)
            }
        }.widgetURL(entry.verse.url)
        .modifier(WidgetBackground(color: background))
    }
    private var week: some View {
        HStack(spacing: 4) {
            ForEach(0..<7) { index in
                let today = Calendar.current.startOfDay(for: entry.date)
                let weekday = Calendar.current.component(.weekday, from: today)
                let offset = (weekday - Calendar.current.firstWeekday + 7) % 7
                let date = Calendar.current.date(byAdding: .day, value: index - offset, to: today)!
                Circle().fill(entry.streak.checked(date) ? accent : ink.opacity(0.15)).frame(width: 5, height: 5)
                    .accessibilityLabel("\(date.formatted(date: .abbreviated, time: .omitted)): \(entry.streak.checked(date) ? "checked in" : "no check-in")")
            }
        }.padding(.horizontal, 6)
    }
}
private struct WidgetBackground: ViewModifier {
    var color: Color
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) { content.containerBackground(color, for: .widget) }
        else { content.padding(14).background(color) }
    }
}
@main
struct ScriptureWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WidgetStore.kind, provider: ScriptureProvider()) { ScriptureView(entry: $0) }
            .configurationDisplayName("Scripture + Streak")
            .description("A daily verse and a little encouragement to keep opening your Bible.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge, .accessoryRectangular])
    }
}
