import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const definitionsStart = source.indexOf("const bookDefinitions =");
const definitionsEnd = source.indexOf("\n\nconst books", definitionsStart);
assert.notEqual(definitionsStart, -1, "Missing bookDefinitions in bible-app.js");
assert.notEqual(definitionsEnd, -1, "Could not extract bookDefinitions from bible-app.js");

const context = {};
vm.createContext(context);
vm.runInContext(`
  ${source.slice(definitionsStart, definitionsEnd)}
  const books = bookDefinitions.map(([book]) => book);
  ${extractFunction("normalizeAliasKey")}
  ${extractFunction("buildBookAliases")}
  const bookAliases = buildBookAliases();
  ${extractFunction("normalizeBookName")}
  const bibleData = {
    "Philippians 4": { verses: Array.from({ length: 23 }, (_, index) => ({ n: index + 1 })) },
    "Philemon 1": { verses: Array.from({ length: 25 }, (_, index) => ({ n: index + 1 })) },
    "Deuteronomy 6": { verses: Array.from({ length: 25 }, (_, index) => ({ n: index + 1 })) },
    "1 Corinthians 13": { verses: Array.from({ length: 13 }, (_, index) => ({ n: index + 1 })) },
  };
  ${extractFunction("parseVerseList")}
  ${extractFunction("parsePassageReference")}
  globalThis.resolveBook = normalizeBookName;
  globalThis.parsePassage = parsePassageReference;
`, context);

const resolveBook = context.resolveBook;
const parsePassage = context.parsePassage;

assert.equal(resolveBook("Philippians"), "Philippians");
assert.equal(resolveBook("Phil"), "Philippians");
assert.equal(resolveBook("Phi"), "Philippians");
assert.equal(resolveBook("Phile"), "Philemon");
assert.equal(resolveBook("Deuter"), "Deuteronomy");
assert.equal(resolveBook("Zephani"), "Zephaniah");
assert.equal(resolveBook("1 Corin"), "1 Corinthians");
assert.equal(resolveBook("1Corin"), "1 Corinthians");
assert.equal(resolveBook("Jo"), null);
assert.equal(resolveBook("1 C"), null);

assert.equal(parsePassage("Phi 4:13").key, "Philippians 4");
assert.equal(parsePassage("Phi 4:13").verse, 13);
assert.equal(parsePassage("Phile 1:4").key, "Philemon 1");
assert.equal(parsePassage("Deuter 6:4-5").key, "Deuteronomy 6");
assert.equal(parsePassage("Deuter 6:4-5").verses.join(","), "4,5");
assert.equal(parsePassage("1Corin 13:4").key, "1 Corinthians 13");
assert.equal(parsePassage("Jo 3:16"), null);

console.log("Book name resolution tests passed");

for (const phrase of ["Matthew 28 verse 19", "Matthew chapter 28, verse 19", "Matthew chapter twenty-eight verse nineteen"]) {
  assert.equal(parsePassage(phrase).key, "Matthew 28", phrase);
  assert.equal(parsePassage(phrase).verse, 19, phrase);
}
assert.equal(parsePassage("First Timothy").key, "1 Timothy 1");
assert.equal(parsePassage("Second Timothy chapter two verse three").key, "2 Timothy 2");
assert.equal(parsePassage("Third John 1:4").key, "3 John 1");
assert.equal(parsePassage("Psalm one hundred and nineteen verse one hundred and five").verse, 105);
assert.equal(parsePassage("Deuteronomy chapter six verses four through five and seven").verses.join(","), "4,5,7");
assert.equal(parsePassage("Matthew chapter banana verse 19"), null);

// Exercise actual parsing through shortcut/native-link startup, not just parsing alone.
vm.runInContext(source.slice(source.indexOf("async function applyStartupExperience("), source.indexOf("function requestedVersionFromUrl(")), context);
for (const reference of ["Matthew 28:19", "Matthew 28 verse 19", "Matthew chapter 28, verse 19", "Matthew chapter twenty-eight verse nineteen", "Matthew 28", "First Timothy"]) {
  for (const mode of ["reader", "parallel"]) {
    const chapterVerses = Array.from({ length: 20 }, (_, index) => ({ n: index + 1 }));
    Object.assign(context, {
      state: { startupApplied: false },
      sharedReferenceFromUrl: () => reference,
      requestedModeFromUrl: () => mode,
      refreshModeFromSession: () => null,
      setReferenceFromString: () => true,
      sharedVersesFromUrl: () => [],
      currentChapter: () => ({ verses: chapterVerses }),
      applySharedVersionFromUrl: async () => {},
    });
    await context.applyStartupExperience();
    const expected = reference === "Matthew 28" || reference === "First Timothy" ? chapterVerses.map(v => v.n) : [19];
    assert.deepEqual(Array.from(mode === "parallel" ? context.state.selectedVerses : context.state.sharedPassage.verses), expected, `${mode}: ${reference}`);
  }
}
console.log("Spoken shortcut startup preserves verse selection; chapter links retain full chapters");
