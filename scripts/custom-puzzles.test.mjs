import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf(") {", start) + 2;
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const context = {
  bibleData: {
    "Psalm 23": {
      verses: [
        { n: 1, text: "The Lord is my shepherd; I shall not want." },
        { n: 2, text: "He makes me lie down in green pastures. He leads me beside still waters." },
        { n: 3, text: "He restores my soul. He guides me in the paths of righteousness." },
        { n: 4, text: "Even though I walk through the valley, I will fear no evil." },
        { n: 5, text: "You prepare a table before me and anoint my head with oil." },
        { n: 6, text: "Surely goodness and mercy will follow me all the days of my life." },
      ],
    },
  },
  customPuzzleStopWords: new Set(["the", "and", "will", "through"]),
  normalizeBookName: (value) => String(value).trim() === "Psalm" ? "Psalm" : "",
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("normalizeWordSearchWord")}
  ${extractFunction("normalizedPuzzleCustomReference")}
  ${extractFunction("puzzlePassageReference")}
  ${extractFunction("puzzlePassageLabel")}
  ${extractFunction("parsePuzzlePassageReference")}
  ${extractFunction("customPuzzleCandidateWords")}
  ${extractFunction("puzzleBestKey")}
  globalThis.customPuzzleApi = {
    parsePuzzlePassageReference,
    puzzlePassageReference,
    puzzlePassageLabel,
    customPuzzleCandidateWords,
    puzzleBestKey,
  };
`, context);

const api = context.customPuzzleApi;
const wholeChapter = api.parsePuzzlePassageReference("Psalm 23");
assert.deepEqual(
  JSON.parse(JSON.stringify(wholeChapter)),
  { chapterKey: "Psalm 23", start: 1, end: 6, wholeChapter: true, words: [], label: "Psalm 23" },
);
const range = api.parsePuzzlePassageReference("Psalm 23:6-1");
assert.equal(api.puzzlePassageReference(range), "Psalm 23:1-6");
assert.equal(api.puzzlePassageLabel(range), "Psalm 23:1–6");
assert.equal(api.parsePuzzlePassageReference("Psalm 23:9"), null);
assert.equal(api.parsePuzzlePassageReference("not a passage"), null);

const candidates = Array.from(api.customPuzzleCandidateWords(wholeChapter
  ? context.bibleData[wholeChapter.chapterKey].verses
  : [], 12));
assert.ok(candidates.includes("SHEPHERD"));
assert.ok(candidates.includes("GOODNESS"));
assert.ok(candidates.includes("PASTURES"));
assert.ok(!candidates.includes("RIGHTEOUSNESS"), "Words longer than the grid must be excluded");
assert.ok(!candidates.includes("THE"));
assert.ok(!candidates.includes("AND"));

assert.equal(api.puzzleBestKey("Medium"), "Medium");
assert.equal(
  api.puzzleBestKey("Medium", { customPassage: true, reference: "Psalm 23:1-6", version: "BSB" }),
  "custom:BSB:Psalm 23:1-6:Medium",
);

const triviaViewSource = extractFunction("triviaView");
assert.match(triviaViewSource, /puzzleCreatorMarkup/);
assert.match(source, /data-puzzle-passage-source="random"/);
assert.match(source, /data-puzzle-passage-source="custom"/);
assert.match(source, /id="puzzleCustomReferenceInput"/);
assert.match(source, /id="useCurrentPuzzlePassage"/);
assert.match(source, /id="puzzleCustomVersionSelect"/);
assert.match(source, /data-puzzle-custom-word/);
assert.match(extractFunction("startWordSearchGame"), /customPassage/);
assert.match(extractFunction("startCrosswordGame"), /customPassage/);
assert.match(extractFunction("startHiddenWordGame"), /customPassage/);
assert.match(extractFunction("restartPuzzleAtDifficulty"), /currentGame\.customPassage/);
assert.match(extractFunction("captureCloudSnapshot"), /puzzleCustomReference/);
assert.match(triviaViewSource, /data-trivia-mode="hidden-word"[\s\S]*game-new-badge/);
assert.doesNotMatch(triviaViewSource, /data-trivia-mode="(?:word-search|crossword)"[^\n]*game-new-badge/);

assert.match(styles, /\.puzzle-creator \{/);
assert.match(styles, /\.puzzle-source-options button \{/);
assert.match(styles, /\.puzzle-reference-field input,/);
assert.match(styles, /\.puzzle-word-choices \{[\s\S]*?overflow-y: auto;/);
assert.match(styles, /\.puzzle-word-choice:has\(input:focus-visible\)/);

console.log("Custom puzzle creator tests passed");
