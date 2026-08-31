import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");
const bsbSource = readFileSync(new URL("../assets/bibles/BSB.js", import.meta.url), "utf8");

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

const catalogStart = source.indexOf("const hiddenWordCategories = [");
const catalogEnd = source.indexOf("const hiddenWordPeople", catalogStart);
assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, "Hidden Word catalog must be present");
const catalogSource = source.slice(catalogStart, catalogEnd);

const context = {};
vm.createContext(context);
vm.runInContext(`
  const state = { triviaDifficulty: "Medium", triviaGame: null };
  const hiddenWordHintTypes = ["context", "letter"];
  const shuffleItems = (items) => items.slice();
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${"$"}{}()|[\\]\\\\]/g, "\\\\$&");
  ${catalogSource}
  ${extractFunction("hiddenWordDifficultyConfig")}
  ${extractFunction("hiddenWordDifficulties")}
  ${extractFunction("hiddenWordDifficultyDescription")}
  ${extractFunction("hiddenWordAnswerLetters")}
  ${extractFunction("hiddenWordCatalogCandidates")}
  ${extractFunction("hiddenWordSelectCatalogPuzzles")}
  ${extractFunction("hiddenWordMaskedVerse")}
  ${extractFunction("hiddenWordIsSolved")}
  ${extractFunction("hiddenWordHintsRemaining")}
  globalThis.hiddenWordApi = {
    hiddenWordCategories,
    hiddenWordPuzzleCatalog,
    hiddenWordDifficultyConfig,
    hiddenWordDifficulties,
    hiddenWordDifficultyDescription,
    hiddenWordAnswerLetters,
    hiddenWordCatalogCandidates,
    hiddenWordSelectCatalogPuzzles,
    hiddenWordMaskedVerse,
    hiddenWordIsSolved,
    hiddenWordHintsRemaining,
  };
`, context);

const api = context.hiddenWordApi;
const expectedCategories = [
  "People", "Places", "Books of the Bible", "Bible Vocabulary", "Famous Phrases", "Bible Events",
  "Objects & Things", "Miracles", "Bible Quotes", "Parables", "Titles of Jesus", "Food & Animals",
];

assert.deepEqual([...api.hiddenWordCategories], expectedCategories);
assert.equal(api.hiddenWordPuzzleCatalog.length, 120, "Catalog should provide ten curated puzzles per category");
expectedCategories.forEach((category) => {
  assert.equal(api.hiddenWordPuzzleCatalog.filter((puzzle) => puzzle.category === category).length, 10, `${category} should have ten puzzles`);
});

const normalizedAnswers = api.hiddenWordPuzzleCatalog.map((puzzle) => puzzle.answer.replace(/[^A-Z]/g, ""));
assert.equal(new Set(normalizedAnswers).size, normalizedAnswers.length, "Catalog answers must not contain duplicates");
api.hiddenWordPuzzleCatalog.forEach((puzzle) => {
  assert.match(puzzle.answer, /^[A-Z '&]+$/, `${puzzle.answer} should use display-safe uppercase spelling`);
  assert.match(puzzle.reference, /^(?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)* \d+:\d+$/, `${puzzle.answer} needs a Bible reference`);
  assert.ok(puzzle.clue.length >= 24, `${puzzle.answer} needs a useful Bible clue`);
});
const bsbContext = { window: {} };
vm.runInNewContext(bsbSource, bsbContext);
const bsbChapters = bsbContext.window.BIGSCREEN_BIBLE_BSB?.chapters || {};
api.hiddenWordPuzzleCatalog.forEach((puzzle) => {
  const match = puzzle.reference.match(/^(.+) (\d+):(\d+)$/);
  const chapter = bsbChapters[`${match?.[1]} ${match?.[2]}`];
  assert.ok(chapter?.verses?.some((verse) => verse.n === Number(match?.[3])), `${puzzle.answer} must point to an existing BSB verse`);
});

[
  "SALT OF THE EARTH", "WRITING ON THE WALL", "A HOUSE DIVIDED", "SKIN OF YOUR TEETH",
  "ARK OF THE COVENANT", "BURNING BUSH", "BRONZE SERPENT", "TEN COMMANDMENTS", "JACOB'S LADDER",
  "LAMB OF GOD", "SON OF MAN", "PRINCE OF PEACE", "GOOD SHEPHERD", "BREAD OF LIFE",
].forEach((answer) => assert.ok(api.hiddenWordPuzzleCatalog.some((puzzle) => puzzle.answer === answer), `Missing requested puzzle ${answer}`));

api.hiddenWordPuzzleCatalog.filter((puzzle) => puzzle.category === "Bible Quotes").forEach((puzzle) => {
  assert.ok(api.hiddenWordAnswerLetters(puzzle.answer).length <= 25, `${puzzle.answer} should remain a short Bible quote`);
});
assert.equal(api.hiddenWordCatalogCandidates().length, 120);
const balancedRound = api.hiddenWordSelectCatalogPuzzles(10);
assert.equal(balancedRound.length, 10);
assert.equal(new Set(balancedRound.map((puzzle) => puzzle.category)).size, 10, "A short curated round should rotate through distinct categories");
assert.equal(new Set(api.hiddenWordSelectCatalogPuzzles(20).map((puzzle) => puzzle.answer)).size, 20, "A long round should not repeat answers");

assert.deepEqual([...api.hiddenWordDifficulties()], ["Easy", "Medium", "Hard"]);
assert.deepEqual({ ...api.hiddenWordDifficultyConfig("Easy") }, { size: 8, minLength: 4, maxLength: 7, attempts: 8 });
assert.deepEqual({ ...api.hiddenWordDifficultyConfig("Hard") }, { size: 15, minLength: 6, maxLength: 15, attempts: 6 });
assert.match(api.hiddenWordDifficultyDescription("Medium"), /7 attempts/);
assert.equal(api.hiddenWordMaskedVerse({ text: "The Lord is my shepherd; the Lord leads me." }, "LORD"), "The _____ is my shepherd; the _____ leads me.");
assert.equal(api.hiddenWordIsSolved({ word: "FAITH", guessedLetters: ["F", "A", "I", "T", "H"] }), true);
assert.equal(api.hiddenWordIsSolved({ word: "FAITH", guessedLetters: ["F", "A", "I"] }), false);
assert.equal(api.hiddenWordIsSolved({ word: "LAMB OF GOD", guessedLetters: ["L", "A", "M", "B", "O", "F", "G", "D"] }), true);
assert.equal(api.hiddenWordIsSolved({ word: "JACOB'S LADDER", guessedLetters: ["J", "A", "C", "O", "B", "S", "L", "D", "E", "R"] }), true);
assert.equal(api.hiddenWordHintsRemaining({ usedHintTypes: [] }), 2);
assert.equal(api.hiddenWordHintsRemaining({ usedHintTypes: ["context"] }), 1);

assert.match(source, /data-trivia-mode="hidden-word"[\s\S]*Hidden Word[\s\S]*game-new-badge/, "Hidden Word must appear in the Games rail with a New badge");
assert.match(source, /"hidden-word": \{ key: "hidden-word", name: "Unfolding Mystery"/, "Hidden Word must have a dedicated soundtrack");
assert.match(source, /function startHiddenWordGame\([\s\S]*puzzleCreatorEvaluation\("hidden-word"/, "Hidden Word must support the shared passage creator");
assert.match(source, /data-hidden-word-hint="\$\{hint\.type\}"/, "Hidden Word must render selectable hint types");
assert.match(source, /type: "context"[\s\S]*type: "letter"/, "Hidden Word must offer context and letter hints");
assert.doesNotMatch(source, /type: "category"/, "The visible category must not consume a hint");
assert.match(source, /class="hidden-word-source"[\s\S]*Category[\s\S]*round\.passageReference/, "Every puzzle must show its category and source passage before guessing");
assert.match(source, /id="hiddenWordNativeInput"[\s\S]*inputmode="text"/, "Hidden Word must expose a mobile software-keyboard input");
assert.match(source, /state\.triviaGame\?\.type\)[\s\S]*guessHiddenWordLetter\(event\.key\)/, "Hidden Word must own physical keyboard letters before global shortcuts");
assert.match(source, /function hiddenWordContextText\([\s\S]*round\?\.clue \|\| hiddenWordMaskedVerse/, "The Bible clue hint must support curated and passage puzzles");
assert.match(source, /class="hidden-word-term"/, "Multi-word answers must keep each word grouped on the board");
assert.doesNotMatch(source.slice(source.indexOf("function hiddenWordGameView"), source.indexOf("function verseOrderGameView")), /gallows|hangman/i, "Hidden Word must not use gallows or Hangman imagery");
assert.match(styles, /\.hidden-word-scroll\s*\{/, "Hidden Word must use the Scripture scroll visual");
assert.match(styles, /\.hidden-word-letter\s*\{[\s\S]*width: clamp\(54px,[\s\S]*font-size: clamp\(44px,/, "Desktop answer blanks must dominate the play surface");
assert.match(styles, /\.hidden-word-keyboard button\s*\{[\s\S]*min-height: 48px/, "Desktop letter controls must retain large touch targets");
assert.match(styles, /@media \(max-width: 840px\)[\s\S]*\.hidden-word-layout\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Hidden Word must stack for mobile portrait widths");
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\)[\s\S]*\.hidden-word-layout/, "Hidden Word must have a short-landscape layout");

console.log("Hidden Word checks passed");
