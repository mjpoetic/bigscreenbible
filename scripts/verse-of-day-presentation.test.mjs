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
  state: { verseOfDayItem: null, selectedVerses: [], versions: ["BSB"] },
  bibleData: {
    "Romans 12": {
      verses: [
        { n: 4, BSB: "For just as each of us has one body with many members, and not all members have the same function," },
        { n: 6, BSB: "We have different gifts according to the grace given to each of us." },
      ],
    },
  },
  uniqueVersionVerses: (verses) => verses,
  versionVerseLabel: (verse) => String(verse.n),
  getVerseText: (verse, version) => verse[version] || "",
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
assert.equal(pages[0].text, context.bibleData["Romans 12"].verses[0].BSB);
assert.deepEqual(Array.from(pages, (page) => page.reference), ["Romans 12:4", "Romans 12:6"]);
assert.match(pages[0].text, /same function,$/);
assert.match(pages[1].text, /^We have different gifts/);
context.bibleData["Romans 12"].verses[0].KJV = "Selected KJV verse four";
context.bibleData["Romans 12"].verses[1].KJV = "Selected KJV verse six";
context.state.versions = ["KJV"];
assert.deepEqual(Array.from(context.pagesFor(item), (page) => page.text), ["Selected KJV verse four", "Selected KJV verse six"]);
assert.deepEqual(Array.from(pages, (page) => page.verse), [4, 6]);
assert.deepEqual(Array.from(pages, (page) => page.verseIndex), [0, 1]);
assert.deepEqual(Array.from(pages, (page) => page.verseCount), [2, 2]);

assert.equal(context.selectReference(item.reference), true);
assert.deepEqual(Array.from(context.state.selectedVerses), [4, 6]);

assert.match(extractFunction("currentPresentationParts"), /verseOfDayPresentationPages\(\)\.map/);
assert.match(extractFunction("moveVerse"), /if \(state\.isVerseOfDayActive\) return;/);
assert.match(extractFunction("openVerseOfDayInReader"), /selectVerseOfDayReference\(reference\)/);
assert.match(extractFunction("verseOfDayReaderView"), /data-passage-picker/);
for (const type of ["book", "chapter", "verse"]) {
  assert.match(extractFunction("presentation"), new RegExp(`presentationReferencePicker\\("${type}"`));
}
assert.doesNotMatch(extractFunction("presentation"), /presentation-verse-of-day-reference/);
assert.match(extractFunction("presentation"), /Verse \$\{part\.verseIndex \+ 1\} of \$\{part\.verseCount\}/);

// The shared selectors must leave the daily verse sequence and navigate in place.
const selectionHandlers = {};
const navigationContext = {
  state: {},
  bibleData: {
    "Romans 12": { verses: [{ n: 4 }, { n: 6 }, { n: 7 }] },
    "Romans 13": { verses: [{ n: 1 }] },
    "John 1": { verses: [{ n: 1 }] },
  },
  document: {
    querySelectorAll(selector) {
      const type = selector.match(/data-presentation-(\w+)-option/)[1];
      const values = { book: "John", chapter: "13", verse: "7" };
      return [{
        dataset: { [`presentation${type[0].toUpperCase()}${type.slice(1)}Option`]: values[type] },
        addEventListener(event, handler) { selectionHandlers[type] = handler; },
      }];
    },
  },
  focusVersePickerChapterNumbers: () => [1],
  currentBookName: () => "Romans",
  currentChapter: () => navigationContext.bibleData[navigationContext.state.reference],
  pushCurrentReturnTargetForNavigation() {},
  recordHistory() {},
  render() {},
};
vm.createContext(navigationContext);
const handlersStart = source.indexOf('  document.querySelectorAll("[data-presentation-book-option]")');
const handlersEnd = source.indexOf('  document.getElementById("presentationBackgroundMotionSelect")', handlersStart);
vm.runInContext(source.slice(handlersStart, handlersEnd), navigationContext);
for (const [type, expectedReference, expectedVerse] of [
  ["book", "John 1", 1],
  ["chapter", "Romans 13", 1],
  ["verse", "Romans 12", 7],
]) {
  navigationContext.state = {
    mode: "big", reference: "Romans 12", verse: 6,
    isVerseOfDayActive: true, verseOfDayItem: item, presentationPart: 1,
    presentationReferenceMenuOpen: type,
  };
  selectionHandlers[type]();
  assert.equal(navigationContext.state.reference, expectedReference);
  assert.equal(navigationContext.state.verse, expectedVerse);
  assert.equal(navigationContext.state.isVerseOfDayActive, false);
  assert.equal(navigationContext.state.presentationPart, 0);
  assert.equal(navigationContext.state.presentationReferenceMenuOpen, "");
  assert.equal(navigationContext.state.mode, "big");
}

console.log("Verse of the Day presentation tests passed");

const readContext = {
  state: { verseOfDayItem: { reference: "John 3:16-17" }, mode: "parallel" },
  captureReaderReturnTarget: () => null,
  selectVerseOfDayReference: () => true,
  recordHistory() {}, updateShareUrl() {}, render() {},
};
vm.createContext(readContext);
vm.runInContext(`${extractFunction("openVerseOfDayInReader")}; openVerseOfDayInReader();`, readContext);
assert.equal(readContext.state.mode, "reader");
assert.equal(readContext.state.pendingVerseFocus, true);
assert.equal(readContext.state.pendingVerseHalo, true, "Read in Bible spotlights the Verse of the Day passage");
