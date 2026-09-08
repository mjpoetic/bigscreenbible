import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const context = vm.createContext({ window: {}, loadedVersionData: new Map(), loadingVersions: new Set(), remoteVersionData: new Map(), state: { reference: "John 3", versions: ["YLT"] } });
for (const code of ["index", "YLT", "KJV"]) vm.runInContext(read(`assets/bibles/${code}.js`), context);
const index = context.window.BIGSCREEN_BIBLE_INDEX;
const ylt = context.window.BIGSCREEN_BIBLE_YLT;
const kjv = context.window.BIGSCREEN_BIBLE_KJV;
const keys = index.books.flatMap(({ name, chapters }) => Array.from({ length: chapters }, (_, i) => `${name} ${i + 1}`));
assert.equal(index.books.length, 66);
assert.deepEqual(Object.keys(ylt.chapters), Array.from(keys));
let verseCount = 0;
for (const key of keys) {
  const verses = ylt.chapters[key].verses;
  assert.equal(verses.length, kjv.chapters[key].verses.length, key);
  for (const [i, verse] of verses.entries()) {
    assert.equal(verse.n, i + 1, key);
    assert.ok(verse.text.trim(), `${key}:${verse.n}`);
    assert.doesNotMatch(verse.text, /<\/?(?:v|ve|p|book)\b/);
  }
  verseCount += verses.length;
}
assert.equal(verseCount, 31102);
assert.equal(index.versions.YLT.verses, verseCount);
assert.equal(ylt.chapters["Genesis 1"].verses[0].text, "In the beginning of God's preparing the heavens and the earth —");
assert.equal(ylt.chapters["John 3"].verses[15].text, "for God did so love the world, that His Son — the only begotten — He gave, that every one who is believing in him may not perish, but may have life age-during.");
assert.match(ylt.chapters["Revelation 22"].verses[20].text, /grace of our Lord Jesus Christ/);

const source = read("assets/bible-app.js");
vm.runInContext(source.slice(source.indexOf("const bibleProviders ="), source.indexOf("function translationOptionDetailsMarkup")), context);
const evaluate = (expression) => vm.runInContext(expression, context);
assert.equal(evaluate('isBundledTranslation("YLT")'), true);
assert.notEqual(evaluate('translationProvider("YLT").supportsSearch'), false);
assert.equal(evaluate('translationLookup.YLT.name'), ylt.name);

function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("\n}", start) + 2;
  return source.slice(start, end);
}
Object.assign(context, { bibleIndex: index, bibleParagraphs: {}, bibleSectionHeadings: {}, bibleRedLetters: {} });
context.loadedVersionData.set("YLT", ylt);
context.loadedVersionData.set("KJV", kjv);
vm.runInContext(["chapterKeys", "rebuildBibleData", "applyParagraphMetadata", "applySectionHeadingMetadata", "applyRedLetterMetadata", "getVerseText", "normalizedPuzzleCustomVersion", "bundledPuzzleVersions"].map(extract).join("\n"), context);
evaluate("rebuildBibleData()");
assert.equal(evaluate('getVerseText(bibleData["John 3"].verses[15], "YLT")'), ylt.chapters["John 3"].verses[15].text);
assert.equal(evaluate('getVerseText(bibleData["John 3"].verses[15], "KJV")'), kjv.chapters["John 3"].verses[15].text);
assert.equal(evaluate('bibleData["Genesis 1"].verses[0].paragraphStart.YLT'), true);
assert.equal(evaluate('normalizedPuzzleCustomVersion("ylt")'), "YLT");
assert.equal(evaluate('bundledPuzzleVersions().includes("YLT")'), true);
console.log("YLT corpus, provider, parallel-text merge, paragraph, and puzzle eligibility checks passed");
