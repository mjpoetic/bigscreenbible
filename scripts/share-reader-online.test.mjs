import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('ios/App/PassageShare/ShareViewController.swift');
const method = source.slice(source.indexOf('    private func applyOnlineChapter('), source.indexOf('    private func publisherLinks(')).replace('private func', 'func');
const temp = mkdtempSync(path.join(tmpdir(), 'bsb-online-reader-test-'));
// Execute the actual native response reducer with Foundation, independent of UIKit.
writeFileSync(path.join(temp, 'test.swift'), `import Foundation
final class Reader {
 var baseline = [(ref: "John 3:16-17", verses: [(ref: "John 3:16", text: "BSB sixteen"), (ref: "John 3:17", text: "BSB seventeen")]), (ref: "John 3:16", verses: [(ref: "John 3:16", text: "BSB sixteen")])]
 var passages: [(ref: String, verses: [(ref: String, text: String)])] = []
 var displayedVersions: [String: String] = [:], notices: [String: String] = [:], copyrights: [String: String] = [:]
 var tokens: [String] = []
 init() { passages = baseline; notices = ["John 3:16-17": "Loading", "John 3:16": "Loading"] }
 func displayCode(_ code: String) -> String { code }
 func renderReader() {}
 func trackView(_ token: String) { tokens.append(token) }
 ${method}
}
func payload(_ version: String, _ verses: [[String: Any]]) -> Data {
 try! JSONSerialization.data(withJSONObject: ["version": version, "verses": verses, "copyright": "Publisher copyright", "fumsToken": "test-token"])
}
let good = Reader()
good.applyOnlineChapter("John 3", data: payload("NLT", [["n":16,"text":"Translated sixteen"],["n":17,"text":"Translated seventeen"]]), code:"NLT", needsTracking:true)
assert(good.passages[0].verses[1].text == "Translated seventeen")
assert(good.passages[0].verses[1].ref == "John 3:17")
assert(good.displayedVersions["John 3:16-17"] == "NLT" && good.notices.isEmpty)
assert(good.copyrights["NLT"] == "Publisher copyright" && good.tokens == ["test-token"])
let partial = Reader()
partial.applyOnlineChapter("John 3", data: payload("NASB2020", [["n":16,"text":"NASB sixteen"]]), code:"NASB2020", needsTracking:false)
assert(partial.passages[0].verses[0].text == "BSB sixteen", "Incomplete range must keep the entire BSB passage")
assert(partial.displayedVersions["John 3:16-17"] == nil && partial.notices["John 3:16-17"] != nil)
assert(partial.passages[1].verses[0].text == "NASB sixteen" && partial.displayedVersions["John 3:16"] == "NASB2020")
assert(partial.tokens.isEmpty)
for data in [Optional<Data>.none, Data("broken".utf8), payload("NIV", [["n":16,"text":"Wrong version"]]), payload("NLT", [["n":16,"text":"   "]])] {
 let failed = Reader()
 failed.applyOnlineChapter("John 3", data:data, code:"NLT", needsTracking:true)
 assert(failed.displayedVersions.isEmpty && failed.tokens.isEmpty && failed.copyrights.isEmpty)
 assert(failed.passages[0].verses[0].text == "BSB sixteen" && failed.notices.count == 2)
}
let other = Reader()
other.applyOnlineChapter("1 John 3", data:payload("NLT", [["n":16,"text":"Other book"]]), code:"NLT", needsTracking:true)
assert(other.displayedVersions.isEmpty && other.tokens.isEmpty)
print("Native share translation reducer: complete ranges, partial fallback, wrong version, malformed/offline, reference stability, attribution and tracking passed.")
`);
execFileSync('xcrun', ['swiftc', '-module-cache-path', path.join(temp, 'module-cache'), path.join(temp, 'test.swift'), '-o', path.join(temp, 'test')], { stdio: 'inherit' });
execFileSync(path.join(temp, 'test'), [], { stdio: 'inherit' });
const catalog = JSON.parse(read('ios/App/PassageShare/passage-import-catalog.json'));
assert.equal(catalog.online.translations.find(item => item.code === 'NLT').endpoint, 'api-bible-passage');
assert.equal(catalog.online.translations.find(item => item.code === 'NASB2020').endpoint, 'youversion-passage');
assert.equal(catalog.online.translations.find(item => item.code === 'NLT').tracksFums, true);
assert.ok(source.includes('self.generation == requestID'));
assert.ok(source.includes('onlineTask?.cancel()'));
assert.ok(source.includes('bsbShareFumsInbox'));
assert.ok(read('ios/App/App/SceneDelegate.swift').includes('deliverShareTracking'));
console.log('Online share wiring: shared providers, preferred-version snapshot, stale-request cancellation and durable reporting present.');

assert.equal(catalog.online.translations.find(item => item.code === 'KJV').endpoint, '');
assert.ok(catalog.bundled.KJV['John 3'].verses.find(v => v.n === 16).text.includes('only begotten Son'));
assert.ok(catalog.validation['Acts 8'].verses.some(v => v.n === 37), 'Validate KJV-only verses');
assert.ok(!catalog.chapters['Acts 8'].verses.some(v => v.n === 37), 'Do not invent a BSB verse');
const css = read('assets/bible-app.css');
assert.deepEqual(catalog.highlights.map(s => s.value), ['yellow', 'blue', 'pink', 'green', 'orange', 'purple']);
for (const swatch of catalog.highlights) {
  assert.ok(css.includes(`.highlight-swatch.highlight-${swatch.value} {\n  background: ${swatch.hex};`), 'Use the actual website swatch');
}
console.log('Bundled KJV, KJV-only verse validation, and all six website swatches passed.');
