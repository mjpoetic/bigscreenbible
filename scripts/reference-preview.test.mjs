import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const patterns = [`function ${name}(`, `async function ${name}(`];
  const start = patterns
    .map((pattern) => source.indexOf(pattern))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];
  assert.notEqual(start, undefined, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const context = {
  bibleData: {
    "Ezekiel 36": {
      verses: [
        { n: 16, BSB: "The word of the Lord came to me." },
        { n: 17, BSB: "Son of man, when the house of Israel lived in their land..." },
        { n: 18, BSB: "So I poured out My wrath upon them." },
      ],
    },
  },
  parsePassageReference: () => ({ key: "Ezekiel 36", verses: [16, 17] }),
  translationDisplayCode: (version) => version,
  escapeHtml: (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;"),
  apiBibleAttributionMarkup: (versions, className, chapterKey) => (
    `<aside data-version="${versions[0]}" data-class="${className}" data-chapter="${chapterKey}"></aside>`
  ),
  referencePreviewHref: () => "/?ref=Ezekiel%2036%3A16-17",
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("referencePreviewPassageMarkup")}
  ${extractFunction("crossReferencePopupMarkup")}
  globalThis.previewMarkup = referencePreviewPassageMarkup;
  globalThis.crossReferenceMarkup = crossReferencePopupMarkup;
`, context);

const fallbackMarkup = context.previewMarkup("Ezekiel 36:16-17", "AMP");
assert.match(fallbackMarkup, /Ezekiel 36:16-17/);
assert.match(fallbackMarkup, /AMP could not be loaded/);
assert.match(fallbackMarkup, />BSB</);
assert.match(fallbackMarkup, /<sup>16<\/sup>/);
assert.match(fallbackMarkup, /<sup>17<\/sup>/);
assert.doesNotMatch(fallbackMarkup, /<sup>18<\/sup>/);
assert.match(fallbackMarkup, /class="reference-preview-text" tabindex="0"/);
assert.match(fallbackMarkup, /data-popup-goto="Ezekiel 36:16-17"/);
assert.match(fallbackMarkup, />Go to Passage /);
assert.doesNotMatch(fallbackMarkup, /data-reference-preview-back/);

const crossReferencePreviewMarkup = context.previewMarkup(
  "Ezekiel 36:16-17",
  "BSB",
  { returnToCrossReferences: true },
);
assert.match(crossReferencePreviewMarkup, /data-reference-preview-back/);
assert.match(crossReferencePreviewMarkup, />←<\/span> Cross references/);

const crossReferenceListMarkup = context.crossReferenceMarkup("Romans 8:1", [{
  goto: "John 3:18",
  label: "John 3:18",
  preview: "Whoever believes in Him is not condemned.",
}]);
assert.match(crossReferenceListMarkup, /data-popup-preview="John 3:18"/);
assert.match(crossReferenceListMarkup, /aria-label="Preview John 3:18"/);
assert.doesNotMatch(crossReferenceListMarkup, /data-popup-goto/);

context.bibleData["Ezekiel 36"].verses[0].AMP = "Then the word of the Lord came to me, saying,";
context.bibleData["Ezekiel 36"].verses[1].AMP = "Son of man, when the house of Israel lived in their own land...";
const ampMarkup = context.previewMarkup("Ezekiel 36:16-17", "AMP");
assert.doesNotMatch(ampMarkup, /could not be loaded/);
assert.match(ampMarkup, />AMP</);
assert.match(ampMarkup, /data-version="AMP"/);
assert.match(ampMarkup, /data-chapter="Ezekiel 36"/);

assert.match(source, /data-heading-reference="[^\n]+aria-haspopup="dialog" aria-expanded="false"/);
assert.match(source, /data-scripture-reference="[^\n]+aria-haspopup="dialog" aria-expanded="false"/);
assert.match(extractFunction("bindEvents"), /openReferencePreviewPopup\(button, button\.dataset\.headingReference/);
assert.match(extractFunction("bindEvents"), /openReferencePreviewPopup\(button, button\.dataset\.scriptureReference/);
assert.match(extractFunction("openReferencePreviewPopup"), /ensureRemoteBibleVersion\(version, parsed\.key, \{ rerender: false \}\)/);
assert.match(extractFunction("openReferencePreviewPopup"), /requestId !== referencePreviewRequestId/);
assert.match(extractFunction("openReferencePreviewPopup"), /options\.popup \|\| showStudyPopup/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /returnToCrossReferences: true/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /openReferencePreviewPopup/);
assert.match(extractFunction("restoreCrossReferencePopup"), /setStudyPopupContent/);
assert.match(extractFunction("restoreCrossReferencePopup"), /bindCrossReferencePreviewLinks/);
assert.doesNotMatch(extractFunction("verseTextAtReference"), /getVerseText/);
assert.match(extractFunction("verseTextAtReference"), /verse\[version\] \|\| verse\.BSB/);
assert.match(extractFunction("setStudyPopupContent"), /options\.className/);
assert.match(extractFunction("showStudyPopup"), /aria-expanded", "true"/);
assert.match(extractFunction("showStudyPopup"), /studyPopupAnchorRect/);
assert.match(extractFunction("closeStudyPopup"), /aria-expanded", "false"/);
assert.match(extractFunction("positionStudyPopup"), /anchorConnected/);
assert.match(extractFunction("positionStudyPopup"), /referencePreview \? 440 : 360/);
assert.match(extractFunction("positionStudyPopup"), /--reference-preview-text-max-height/);
assert.match(extractFunction("ensureRemoteBibleVersion"), /remoteVersionRequests\.has\(loadKey\)/);
assert.match(extractFunction("ensureRemoteBibleVersion"), /options\.rerender !== false/);

assert.match(styles, /\.reference-preview-popup::before \{/);
assert.match(styles, /\.reference-preview-popup \{[\s\S]*?max-height: none/);
assert.match(styles, /\.reference-preview-text \{[\s\S]*?--reference-preview-text-max-height[\s\S]*?overflow-y: auto/);
assert.match(styles, /\.reference-preview-text \{[\s\S]*?overscroll-behavior: contain/);
assert.match(styles, /\.reference-preview-go \{[\s\S]*?min-height: 42px/);
assert.match(styles, /\.reference-preview-actions\.has-back \{/);
assert.match(styles, /\.reference-preview-back \{[\s\S]*?min-height: 42px/);
assert.match(styles, /@media \(max-width: 520px\) \{[\s\S]*?\.reference-preview-go \{[\s\S]*?min-height: 44px/);
assert.match(styles, /@media \(max-width: 520px\) \{[\s\S]*?\.reference-preview-back \{[\s\S]*?min-height: 44px/);

console.log("Reference preview tests passed");
