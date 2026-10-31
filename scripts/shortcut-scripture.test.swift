import Foundation

@main
struct ShortcutScriptureTests {
    static func main() throws {
        let source = URL(fileURLWithPath: "assets/bibles/KJV.js")
        let john = try ShortcutScripture.passage("John 3:16", source: source)
        precondition(john.text.contains("For God so loved the world"))
        precondition(john.reference == "John 3:16")
        let corinthians = try ShortcutScripture.passage("  1 Corinthians 13:4–7  ", source: source)
        precondition(corinthians.text.contains("Charity suffereth long"))
        let psalm = try ShortcutScripture.passage("Psalms 23", source: source)
        precondition(psalm.text.contains("The LORD is my shepherd"))
        for invalid in ["John 3:0", "John 3:99", "John 3:17-16", "John 3:16-999", "John 999", "Fake 1", "John 3:16&mode=games", "", "Psalm 119"] {
            do { _ = try ShortcutScripture.passage(invalid, source: source); fatalError("Accepted invalid reference: \(invalid)") }
            catch is ScriptureError { }
        }
        let items = URLComponents(url: john.url, resolvingAgainstBaseURL: false)!.queryItems!
        precondition(items.first(where: { $0.name == "ref" })?.value == "John 3:16")
        precondition(items.first(where: { $0.name == "version" })?.value == "KJV")
        print("Scripture cards: real bundled text, ranges, chapter references, validation and reader links passed.")
    }
}
