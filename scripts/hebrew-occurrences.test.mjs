import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, root), "utf8");
const json = (file) => JSON.parse(read(file));
const manifest = json("assets/oshb/manifest.json");
const source = read("assets/bible-app.js");
const moduleSource = read("assets/hebrew-occurrences.js");
const book = (name) => json(`assets/oshb/${name}.json`);
const calls = [];
let fail = false;
const context = {
  window: {}, AbortController, setTimeout, clearTimeout,
  fetch: async (url) => {
    calls.push(url);
    if (fail) throw new Error("offline");
    return { ok: true, json: async () => json(url.slice(2).split("?")[0]) };
  },
};
vm.createContext(context);
vm.runInContext(moduleSource, context);
const hebrew = context.window.BigScreenBibleHebrew;
const plain = (value) => JSON.parse(JSON.stringify(value));
const deuteronomy = book("Deut");
const verse4 = deuteronomy.verses["6:4"];
const verse5 = deuteronomy.verses["6:5"];
const bsbContext = { window: {} };
vm.createContext(bsbContext);
vm.runInContext(read("assets/bibles/BSB.js"), bsbContext);
const bsb = bsbContext.window.BIGSCREEN_BIBLE_BSB;
const bsbVerse = (ref, n) => bsb.chapters[ref].verses.find((v) => v.n === n);

function uniqueCodes(verse) {
  const counts = new Map();
  for (const [, raw] of verse.strong || []) {
    for (const code of Array.isArray(raw) ? raw : [raw]) counts.set(code, (counts.get(code) || 0) + 1);
  }
  return [...counts].filter(([, n]) => n === 1).map(([code]) => code);
}
function match(verse, code, n = 5, version = "BSB") {
  return hebrew.matchOccurrences(verse, code, { version, uniqueCodes: uniqueCodes(bsbVerse("Deuteronomy 6", n)) });
}

// Source forms, rather than dictionary headwords; Unicode ordering can differ.
for (const [n, code, expected, grammar] of [
  [4, "H8085", "שְׁמַע", "Qal imperative, second person, masculine, singular"],
  [5, "H3068", "יְהוָה", "Proper noun"],
  [5, "H157", "וְאָהַבְתָּ", "Conjunction + Qal sequential perfect, second person, masculine, singular"],
  [5, "H3824", "לְבָבְךָ", "Common noun, masculine, singular, construct + Pronominal suffix, second person, masculine, singular"],
  [5, "H5315", "נַפְשְׁךָ", "Common noun, common gender, singular, construct + Pronominal suffix, second person, masculine, singular"],
  [5, "H3966", "מְאֹדֶךָ", "Common noun, masculine, singular, construct + Pronominal suffix, second person, masculine, singular"],
]) {
  const result = match(n === 4 ? verse4 : verse5, code, n);
  assert.equal(result.kind, "unique", code);
  assert.equal(hebrew.displaySurface(result.words[0][1]).normalize("NFD"), expected.normalize("NFD"), code);
  assert.equal(hebrew.decodeMorphology(result.words[0][4]), grammar, code);
}
const repeated = match(verse4, "H3068", 4);
assert.equal(repeated.kind, "verse");
assert.equal(repeated.words.length, 2);
assert.notEqual(repeated.words[0][0], repeated.words[1][0]);
assert.equal(match(verse5, "H157", 5, "WEB").kind, "verse");
assert.equal(hebrew.matchOccurrences(verse5, "H157", { version: "BSB", uniqueCodes: [] }).kind, "verse");
assert.equal(match(null, "H157").kind, "none");
assert.equal(match(verse5, "G26").kind, "none");

const gen = book("Gen");
const compound = bsbVerse("Genesis 1", 11).strong.find(([phrase]) => phrase === "seed-bearing");
assert.deepEqual(plain(compound[1]), ["H2232", "H2233"]);
for (const code of compound[1]) {
  const result = hebrew.matchOccurrences(gen.verses["1:11"], code, { version: "BSB", uniqueCodes: uniqueCodes(bsbVerse("Genesis 1", 11)) });
  assert.ok(result.words.length, `Multi-code phrase must find ${code}`);
}
const variants = hebrew.matchOccurrences(gen.verses["8:17"], "H3318", { version: "BSB", uniqueCodes: ["H3318"] });
assert.equal(variants.kind, "verse");
assert.deepEqual(plain(variants.words.map((w) => w[5])), ["ketiv", "qere"]);
assert.equal(gen.verses["31:55"].ref, "Gen.32.1");
assert.equal(gen.verses["32:1"].ref, "Gen.32.2");
assert.equal(book("Ps").verses["3:1"].ref, "Ps.3.2");
assert.equal(book("Isa").verses["64:1"], undefined);
assert.equal(book("Ps").verses["51:1"], undefined);
assert.equal(book("1Kgs").verses["18:33"], undefined);
assert.equal(hebrew.decodeMorphology("Hgarbage"), "Grammar unavailable");
assert.equal(hebrew.decodeMorphology("AVqp3ms"), "Grammar unavailable");

// Audit every shipped occurrence, including rare grammar, for loss/corruption.
const ids = new Set(), morphs = new Set();
let words = 0;
for (const [name, meta] of Object.entries(manifest.books)) {
  const data = json(`assets/oshb/${meta.file}`);
  assert.equal(data.book, name);
  assert.equal(data.revision, hebrew.revision);
  assert.equal(Object.keys(data.verses).length, meta.verses);
  let count = 0;
  for (const [key, verse] of Object.entries(data.verses)) {
    assert.match(key, /^\d+:\d+$/);
    for (const [id, surface, codes, lemma, morph] of verse.words) {
      assert.ok(!ids.has(id), `Duplicate ID ${id}`);
      ids.add(id);
      assert.ok(surface && lemma);
      assert.ok(codes.length && codes.every((code) => /^H\d+$/.test(code)));
      assert.ok(morph.startsWith("H"));
      assert.doesNotMatch(hebrew.decodeMorphology(morph), /unavailable/, morph);
      morphs.add(morph);
      count++;
    }
  }
  assert.equal(count, meta.words);
  words += count;
}
assert.equal(Object.keys(manifest.books).length, 39);
assert.equal(words, 295379);
assert.match(manifest.attribution, /Original work of the Open Scriptures Hebrew Bible/);
assert.equal(readdirSync(new URL("assets/oshb", root)).filter((f) => f.endsWith(".json")).length, 40);

// Lazy per-book loading, shared concurrent requests, invalid references, retry.
await Promise.all([hebrew.loadVerse("Deuteronomy 6:4", "test"), hebrew.loadVerse("Deuteronomy 6:5", "test")]);
assert.equal(calls.length, 1);
assert.match(calls[0], /Deut\.json\?v=3d15126.*-test$/);
assert.equal(await hebrew.loadVerse("John 3:16"), null);
assert.equal(await hebrew.loadVerse("../Deut 6:4"), null);
assert.equal(calls.length, 1);
fail = true;
assert.equal(await hebrew.loadVerse("Genesis 1:1"), null);
fail = false;
assert.ok(await hebrew.loadVerse("Genesis 1:1"));
assert.equal(calls.length, 3);

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf("\n}\n", start) + 2;
  return source.slice(start, end);
}
Object.assign(context, {
  state: { reference: "Deuteronomy 6", verse: 1 }, referencePreviewRequestId: 0,
  appVersion: "test", strongLexiconStatus: "ready", sampleStrongRefs: {},
  hasStrongEntry: () => true,
  renderScriptureText: (text) => text,
});
for (const name of ["escapeHtml", "normalizeStrongCode", "normalizeStrongCodes", "normalizeStrongEntry", "getStrongEntries", "renderTextWithStrongNumbers", "hebrewOccurrenceMarkup", "strongLookupCard", "openStrongPopup"]) {
  vm.runInContext(extractFunction(name), context);
}
const entries = context.getStrongEntries(bsbVerse("Deuteronomy 6", 4), "BSB");
const rendered = context.renderTextWithStrongNumbers(bsbVerse("Deuteronomy 6", 4).text, entries, [], "BSB", [], [], "Deuteronomy 6:4");
assert.match(rendered, /data-strong-reference="Deuteronomy 6:4"/);
assert.match(rendered, /data-strong-unique-codes="H8085"/);
assert.match(rendered, /data-strong="H3068"[^>]*data-strong-unique-codes=""/);

const dictionary = {
  H8085: { code: "H8085", lemma: "שָׁמַע", transliteration: "shâmaʻ", pronunciation: "shaw-mah'", derivation: "a primitive root", definition: "to hear intelligently", kjv: "hear, obey", source: "Open Scriptures Strong's" },
  H157: { code: "H157", lemma: "אָהַב", transliteration: "ʼâhab", definition: "to have affection for", source: "Open Scriptures Strong's" },
  G26: { code: "G26", lemma: "ἀγάπη", transliteration: "agápē", definition: "love", source: "Open Scriptures Strong's" },
};
const card = context.strongLookupCard(dictionary.H8085, "Hear · ", true, { reference: "Deuteronomy 6:4", match: match(verse4, "H8085", 4) });
assert.match(card, /Hebrew in this verse/);
assert.match(card, /Dictionary form/);
assert.match(card, /Traditional Strong’s transliteration: shâmaʻ/);
assert.match(card, /lang="he" dir="rtl"/);
assert.match(card, /שָׁמַע/);
assert.match(card, /Pronunciation: shaw-mah&#39;/);
assert.match(card, /Derivation:|Definition:|KJV usage:/);
assert.doesNotMatch(card, /HVqv2ms|Transliteration: shema/);
const ambiguous = context.hebrewOccurrenceMarkup({ reference: "Deuteronomy 6:4", match: repeated });
assert.match(ambiguous, /exact link.*not established/);
assert.equal((ambiguous.match(/data-oshb-id=/g) || []).length, 2);
const greekCard = context.strongLookupCard(dictionary.G26, "love · ", true);
assert.match(greekCard, /Transliteration: agápē/);
assert.doesNotMatch(greekCard, /Hebrew|Dictionary form|Traditional/);

// Exercise actual popup async code: immediate dictionary, correct clicked verse,
// stale/dismissed protection, Greek no-fetch, failure keeps the dictionary.
let currentPopup, pending, loadCalls = 0;
context.window.BigScreenBibleHebrew = {
  ...hebrew, loadVerse(reference) {
    assert.equal(reference, "Deuteronomy 6:4");
    loadCalls++;
    return new Promise((resolve) => { pending = resolve; });
  },
};
context.strongEntry = (code) => dictionary[code];
context.document = { activeElement: null, getElementById: () => currentPopup };
context.showStudyPopup = (anchor, html) => {
  context.referencePreviewRequestId++;
  return currentPopup = { html, isConnected: true, contains: () => false };
};
context.setStudyPopupContent = (popup, html) => { popup.html = html; };
context.positionStudyPopup = () => {};
const anchor = { isConnected: true, dataset: { strong: "H8085", strongWord: "Hear", strongReference: "Deuteronomy 6:4", strongVersion: "BSB", strongUniqueCodes: "H8085" } };
context.openStrongPopup(anchor);
assert.doesNotMatch(currentPopup.html, /Hebrew in this verse/);
pending(verse4);
await new Promise((resolve) => setImmediate(resolve));
assert.match(currentPopup.html, /Hebrew in this verse/);
assert.match(currentPopup.html, /Deuteronomy 6:4/);
context.openStrongPopup(anchor);
const stale = currentPopup;
const finishStale = pending;
context.openStrongPopup({ isConnected: true, dataset: { strong: "G26", strongWord: "love" } });
const greek = currentPopup;
finishStale(verse4);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(currentPopup, greek);
assert.doesNotMatch(stale.html, /Hebrew in this verse/);
assert.doesNotMatch(greek.html, /Hebrew/);
assert.equal(loadCalls, 2);
context.openStrongPopup(anchor);
const dismissed = currentPopup;
context.referencePreviewRequestId++;
pending(verse4);
await new Promise((resolve) => setImmediate(resolve));
assert.doesNotMatch(dismissed.html, /Hebrew in this verse/);
context.openStrongPopup(anchor);
const fallback = currentPopup.html;
pending(null);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(currentPopup.html, fallback);

console.log(`Hebrew occurrence tests passed: ${words} words, ${morphs.size} morphology codes, source forms, ambiguous/variant/multi-code matches, versification, lazy loading, and popup lifecycle.`);
