import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
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

const passageReference = {
  key: "Romans 12",
  verse: 4,
  verses: [4, 6],
};
const context = {
  state: { verseOfDayItem: null, selectedVerses: [] },
  bibleData: {
    "Romans 12": {
      verses: [
        { n: 4, BSB: "For just as each of us has one body with many members, and not all members have the same function," },
        { n: 6, BSB: "We have different gifts according to the grace given to each of us." },
      ],
    },
  },
  parsePassageReference: () => passageReference,
  presentationTextPartsWithOffsets: (text) => [{ text, start: 0, end: text.length }],
  setReferenceFromString(reference) {
    assert.equal(reference, "Romans 12:4,6");
    context.state.isVerseOfDayActive = false;
    context.state.reference = passageReference.key;
    context.state.verse = passageReference.verse;
    return true;
  },
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("presentationBreakPriority")}
  ${extractFunction("splitVerseOfDayText")}
  ${extractFunction("verseOfDayVerseEntries")}
  ${extractFunction("verseOfDayPresentationPages")}
  ${extractFunction("selectVerseOfDayReference")}
  globalThis.pagesFor = verseOfDayPresentationPages;
  globalThis.selectReference = selectVerseOfDayReference;
`, context);

const item = {
  reference: "Romans 12:4,6",
  verseText: "Just as each of us has one body with many members, and these members do not all have the same function, We have different gifts according to the grace given to each of us.",
};
const pages = context.pagesFor(item);
assert.deepEqual(Array.from(pages, (page) => page.reference), ["Romans 12:4", "Romans 12:6"]);
assert.match(pages[0].text, /same function,$/);
assert.match(pages[1].text, /^We have different gifts/);
assert.deepEqual(Array.from(pages, (page) => page.verse), [4, 6]);
assert.deepEqual(Array.from(pages, (page) => page.verseIndex), [0, 1]);
assert.deepEqual(Array.from(pages, (page) => page.verseCount), [2, 2]);

assert.equal(context.selectReference(item.reference), true);
assert.deepEqual(Array.from(context.state.selectedVerses), [4, 6]);

assert.match(extractFunction("currentPresentationParts"), /verseOfDayPresentationPages\(\)\.map/);
assert.match(extractFunction("moveVerse"), /if \(state\.isVerseOfDayActive\) return;/);
assert.match(extractFunction("openVerseOfDayInReader"), /selectVerseOfDayReference\(reference\)/);
assert.match(extractFunction("presentation"), /presentation-verse-of-day-reference/);
assert.match(extractFunction("presentation"), /Verse \$\{part\.verseIndex \+ 1\} of \$\{part\.verseCount\}/);

console.log("Verse of the Day presentation tests passed");
