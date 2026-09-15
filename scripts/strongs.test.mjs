import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appSource = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const bundleSource = readFileSync(new URL("../assets/bibles/BSB.js", import.meta.url), "utf8");

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = appSource.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const renderContext = {
  sampleStrongRefs: {},
  state: { reference: "Genesis 1" },
  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]));
  },
  hasStrongEntry() {
    return true;
  },
  renderScriptureText(value) {
    return renderContext.escapeHtml(value);
  },
};
vm.createContext(renderContext);
vm.runInContext(`
  ${extractFunction("normalizeStrongCode")}
  ${extractFunction("normalizeStrongCodes")}
  ${extractFunction("normalizeStrongEntry")}
  ${extractFunction("getStrongEntries")}
  ${extractFunction("renderTextWithStrongNumbers")}
  globalThis.entriesFor = getStrongEntries;
  globalThis.renderStrong = renderTextWithStrongNumbers;
`, renderContext);

const normalizedEntries = renderContext.entriesFor({
  n: 11,
  strong: {
    BSB: [
      ["seed-bearing", ["H02232", "H2233", "H2233"]],
      { word: "plants", code: "H6212" },
    ],
  },
}, "BSB");
assert.deepEqual(
  normalizedEntries.map(({ word, codes }) => ({ word, codes: [...codes] })),
  [
    { word: "seed-bearing", codes: ["H2232", "H2233"] },
    { word: "plants", codes: ["H6212"] },
  ],
);

const rendered = renderContext.renderStrong(
  "seed-bearing plants",
  normalizedEntries,
);
assert.match(rendered, /data-strong="H2232"/);
assert.match(rendered, /data-strong-codes="H2232,H2233"/);
assert.match(rendered, /aria-label="Open Strong's H2232, H2233 for seed-bearing"/);
assert.match(rendered, />seed-bearing<\/button> <button[^>]+>plants<\/button>/);

const bundleContext = { window: {} };
vm.createContext(bundleContext);
vm.runInContext(bundleSource, bundleContext);
const bible = bundleContext.window.BIGSCREEN_BIBLE_BSB;
assert.equal(bible.strongSource, "https://bereanbible.com/bsb_tables.tsv");
assert.equal(bible.strongSourceFormat, "Official BSB Translation Tables TSV");

let taggedVerses = 0;
let entryCount = 0;
let multiCodeEntries = 0;
Object.entries(bible.chapters).forEach(([chapterKey, chapter]) => {
  chapter.verses.forEach((verse) => {
    if (!Array.isArray(verse.strong)) return;
    taggedVerses += 1;
    let cursor = 0;
    verse.strong.forEach(([phrase, rawCodes]) => {
      assert.ok(phrase, `${chapterKey}:${verse.n} has an empty Strong's phrase`);
      const index = verse.text.indexOf(phrase, cursor);
      assert.notEqual(
        index,
        -1,
        `${chapterKey}:${verse.n} cannot find Strong's phrase after offset ${cursor}: ${phrase}`,
      );
      cursor = index + phrase.length;
      const codes = Array.isArray(rawCodes) ? rawCodes : [rawCodes];
      assert.ok(codes.length, `${chapterKey}:${verse.n} ${phrase} has no Strong's code`);
      assert.equal(new Set(codes).size, codes.length, `${chapterKey}:${verse.n} ${phrase} repeats a Strong's code`);
      codes.forEach((code) => {
        assert.match(code, /^[HG]\d+$/, `${chapterKey}:${verse.n} ${phrase} has invalid code ${code}`);
      });
      entryCount += 1;
      if (codes.length > 1) multiCodeEntries += 1;
    });
  });
});

assert.ok(taggedVerses >= 31_085, `Expected broad BSB verse coverage, received ${taggedVerses}`);
assert.ok(entryCount >= 380_000, `Expected broad BSB phrase coverage, received ${entryCount}`);
assert.ok(multiCodeEntries >= 19_000, `Expected multi-number phrase coverage, received ${multiCodeEntries}`);

function verse(chapterKey, number) {
  return bible.chapters[chapterKey].verses.find(({ n }) => n === number);
}

function codesFor(chapterKey, number, phrase) {
  const entry = verse(chapterKey, number).strong.find(([word]) => word === phrase);
  assert.ok(entry, `Missing ${chapterKey}:${number} ${phrase}`);
  return Array.isArray(entry[1]) ? [...entry[1]] : [entry[1]];
}

assert.deepEqual(codesFor("Genesis 1", 1, "God"), ["H430"]);
assert.deepEqual(codesFor("Genesis 1", 1, "the heavens"), ["H8064"]);
assert.deepEqual(codesFor("Genesis 1", 11, "seed-bearing"), ["H2232", "H2233"]);
assert.deepEqual(codesFor("Genesis 2", 11, "of Havilah"), ["H2341"]);
assert.deepEqual(codesFor("Daniel 1", 7, "Abednego"), ["H5664"]);
assert.deepEqual(codesFor("Song of Songs 1", 1, "Solomon’s"), ["H8010"]);
assert.ok(
  !verse("Genesis 1", 1).strong.some(([phrase, rawCodes]) =>
    phrase === "God" && (Array.isArray(rawCodes) ? rawCodes : [rawCodes]).includes("H8064")
  ),
  "Genesis 1:1 must not map God to the Hebrew word for heavens",
);

console.log("Strong's metadata and rendering tests passed");

const searchContext = {
  strongLexicon: {
    G26: { lemma: "ἀγάπη", translit: "agápē", strongs_def: "love, affection", kjv_def: "charity, love" },
    H430: { lemma: "אֱלֹהִים", xlit: "ʼĕlôhîym", strongs_def: "God; gods", kjv_def: "God" },
    G99: { lemma: "example", strongs_def: "beloved" },
    G100: { lemma: "another", strongs_def: "an example of love" },
  },
  strongs: { H1: ["אָב", "father"] },
  state: { searchResults: [], searchPending: false },
  strongLexiconStatus: "ready",
};
vm.createContext(searchContext);
vm.runInContext([
  "normalizeStrongCode", "cleanStrongCopy", "formatOpenScripturesStrongEntry", "strongEntry",
  "normalizeStrongSearchText", "searchStrongLexicon", "escapeHtml", "strongLookupCard", "strongSearchResultsMarkup",
].map((name) => {
  const start = appSource.indexOf(`function ${name}(`);
  return appSource.slice(start, appSource.indexOf("\n}\n", start) + 2);
}).join("\n"), searchContext);
const codes = (query) => [...searchContext.searchStrongLexicon(query)].map((entry) => entry.code);
assert.deepEqual(codes("love"), ["G26", "G100"]);
assert.deepEqual(codes("love affection"), ["G26"]);
assert.deepEqual(codes("agape"), ["G26"]);
assert.deepEqual(codes("αγαπη"), ["G26"]);
assert.deepEqual(codes("אלהים"), ["H430"]);
assert.deepEqual(codes("G00026"), ["G26"]);
assert.deepEqual(codes("Strong’s H 0430"), ["H430"]);
assert.deepEqual(codes("father"), ["H1"]);
assert.deepEqual(codes("G999999"), []);
assert.deepEqual(codes(" !!! "), []);
assert.match(searchContext.strongSearchResultsMarkup("<missing>"), /&lt;missing&gt;/);
searchContext.strongLexiconStatus = "partial";
assert.match(searchContext.strongSearchResultsMarkup("missing"), /available entries only/);
searchContext.state.searchPending = true;
assert.match(searchContext.strongSearchResultsMarkup("love"), /Searching Strong’s/);
console.log("Strong's word, transliteration, original-language, and number search tests passed");

let finishLexiconLoad;
Object.assign(searchContext, {
  searchSourceCodes: ["scripture", "notes", "strongs"], searchRequestId: 0,
  localStorage: { setItem() {} },
  normalizedSearchScope: (value) => value || "chapter",
  normalizedSearchChapter: (value) => value,
  clearInlineChapterSearchState() {}, render() {}, renderPreservingReaderScroll() {}, resetFocusToolSurfaces() {},
  loadStrongLexicon: () => new Promise((resolve) => { finishLexiconLoad = resolve; }),
  ensureAllSearchVersionsLoaded() { throw new Error("Strong's search must not load Bible versions"); },
  runInlineChapterSearch() { throw new Error("Strong's search must bypass chapter highlighting"); },
});
for (const name of ["normalizedSearchSource", "noteSearchAvailable", "runPhraseSearch"]) {
  const start = appSource.indexOf(`${name === "runPhraseSearch" ? "async " : ""}function ${name}(`);
  vm.runInContext(appSource.slice(start, appSource.indexOf("\n}\n", start) + 2), searchContext);
}
Object.assign(searchContext.state, { searchSource: "strongs", searchScope: "chapter", reference: "John 3", mode: "reader" });
let pendingSearch = searchContext.runPhraseSearch("agape");
assert.equal(searchContext.state.searchPending, true);
finishLexiconLoad();
await pendingSearch;
assert.equal(searchContext.state.searchResultsSource, "strongs");
assert.equal(searchContext.state.searchResults[0].code, "G26");
assert.equal(searchContext.state.searchPending, false);
pendingSearch = searchContext.runPhraseSearch("father");
searchContext.searchRequestId += 1;
searchContext.state.searchResults = [{ code: "newer-result" }];
finishLexiconLoad();
await pendingSearch;
assert.equal(searchContext.state.searchResults[0].code, "newer-result");
searchContext.state.mode = "big";
pendingSearch = searchContext.runPhraseSearch("H430", { presentationResults: true });
finishLexiconLoad();
await pendingSearch;
assert.equal(searchContext.state.mode, "big");
assert.equal(searchContext.state.presentationSearchResultsOpen, true);
assert.equal(searchContext.state.searchResults[0].code, "H430");
console.log("Strong's search routing and stale-request tests passed");
