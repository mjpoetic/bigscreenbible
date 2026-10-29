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
        WidgetFontCache.refresh(WidgetStore.snapshot().fontFamily) {
            WidgetStore.refreshVerse {
                let now = Date()
                // Include local midnights even when the system delays the next reload.
                let midnight = Calendar.current.startOfDay(for: now)
                let dates = [now] + (1...7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: midnight) }
                completion(Timeline(entries: dates.map { entry($0) }, policy: .after(now.addingTimeInterval(3600))))
            }
        }
    }
}
struct ScriptureView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    let entry: ScriptureEntry
    private var displayedVerse: WidgetVerse { family == .accessoryRectangular ? entry.verse : (entry.streak.favorite.flatMap { $0.isValidFavorite ? $0 : nil } ?? entry.verse) }
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
                    Label(displayedVerse.reference, systemImage: "book").font(.caption.bold()).lineLimit(1)
                    Text(displayedVerse.text).font(.caption2).lineLimit(2)
                    Text(entry.streak.checked(entry.date) ? "Read today ✓" : "A moment in Scripture").font(.caption2)
                }
            } else {
                VStack(alignment: .leading, spacing: family == .systemSmall ? 6 : 9) {
                    Label("BIG SCREEN BIBLE", systemImage: "book")
                        .font(.system(size: 10, weight: .medium)).tracking(family == .systemSmall ? 0.5 : 1).foregroundStyle(ink.opacity(0.7)).lineLimit(1).minimumScaleFactor(0.75)
                    if family == .systemSmall || family == .systemMedium {
                        FittingWidgetVerse(text: displayedVerse.text, maximumSize: family == .systemSmall ? 18 : 22,
                            minimumSize: family == .systemSmall ? 11 : 12, fontName: WidgetFontCache.fontName(entry.streak.fontFamily))
                    } else {
                        Text(displayedVerse.text)
                            .font(.custom(WidgetFontCache.fontName(entry.streak.fontFamily), fixedSize: family == .systemExtraLarge ? 26 : 22))
                            .minimumScaleFactor(0.8).lineLimit(nil).truncationMode(.tail)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    }
                    Text(displayedVerse.widgetCitation)
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
        }.widgetURL(displayedVerse.url)
        .modifier(WidgetBackground(color: background, accessory: family == .accessoryRectangular))
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
// Measure the complete passage at each size before allowing truncation. Keeping
// the candidates vertically fixed prevents a truncated candidate from "fitting".
private struct FittingWidgetVerse: View {
    let text: String
    let maximumSize: CGFloat
    let minimumSize: CGFloat
    let fontName: String
    private var sizes: [CGFloat] { Array(stride(from: maximumSize, through: minimumSize, by: -0.5)) }
    var body: some View {
        GeometryReader { geometry in
            ViewThatFits(in: .vertical) {
                ForEach(sizes, id: \.self) { size in
                    Text(text).font(.custom(fontName, fixedSize: size))
                        .fixedSize(horizontal: false, vertical: true)
                }
                // At the legibility floor, use every available line and let
                // SwiftUI append an ellipsis only if the passage still exceeds it.
                Text(text).font(.custom(fontName, fixedSize: minimumSize))
                    .lineLimit(nil).truncationMode(.tail)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            }
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .topLeading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
private struct WidgetBackground: ViewModifier {
    var color: Color
    var accessory: Bool = false
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) { content.containerBackground(color, for: .widget) }
        else if accessory { content }
        else { content.padding(14).background(color) }
    }
}
struct ScriptureWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WidgetStore.kind, provider: ScriptureProvider()) { ScriptureView(entry: $0) }
            .configurationDisplayName("Scripture + Streak")
            .description("A daily verse and a little encouragement to keep opening your Bible.")
            .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge, .accessoryRectangular])
    }
}

struct ReadingStreakView: View {
    @Environment(\.widgetFamily) private var family
    let entry: ScriptureEntry
    var body: some View {
        Group {
            if family == .accessoryCircular {
                VStack(spacing: 1) {
                    Image(systemName: entry.streak.checked(entry.date) ? "checkmark.circle.fill" : "flame.fill").font(.caption)
                    Text("\(entry.streak.streak(entry.date))").font(.title3.bold())
                }.accessibilityLabel("\(entry.streak.streak(entry.date)) day reading streak. \(entry.streak.checked(entry.date) ? "Read today" : "Open your Bible")")
            } else {
                VStack(alignment: .leading, spacing: 3) {
                    Label("\(entry.streak.streak(entry.date)) day streak", systemImage: "book").font(.headline)
                    Text(entry.streak.checked(entry.date) ? "Read today ✓" : "A moment in Scripture").font(.caption)
                }
            }
        }.widgetURL(entry.verse.url).modifier(WidgetBackground(color: .clear, accessory: true))
    }
}
struct ReadingStreakWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "ReadingStreak", provider: ScriptureProvider()) { ReadingStreakView(entry: $0) }
            .configurationDisplayName("Reading Streak")
            .description("Your reading streak and today's check-in at a glance.")
            .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
@main
struct BibleWidgets: WidgetBundle {
    var body: some Widget { ScriptureWidget(); ReadingStreakWidget() }
}
