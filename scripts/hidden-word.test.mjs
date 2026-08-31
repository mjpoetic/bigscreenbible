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

const context = {};
vm.createContext(context);
vm.runInContext(`
  const state = { triviaDifficulty: "Medium", triviaGame: null };
  const hiddenWordHintTypes = ["context", "letter"];
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${"$"}{}()|[\\]\\\\]/g, "\\\\$&");
  ${extractFunction("hiddenWordDifficultyConfig")}
  ${extractFunction("hiddenWordDifficulties")}
  ${extractFunction("hiddenWordDifficultyDescription")}
  ${extractFunction("hiddenWordMaskedVerse")}
  ${extractFunction("hiddenWordIsSolved")}
  ${extractFunction("hiddenWordHintsRemaining")}
  globalThis.hiddenWordApi = {
    hiddenWordDifficultyConfig,
    hiddenWordDifficulties,
    hiddenWordDifficultyDescription,
    hiddenWordMaskedVerse,
    hiddenWordIsSolved,
    hiddenWordHintsRemaining,
  };
`, context);

const api = context.hiddenWordApi;
assert.deepEqual([...api.hiddenWordDifficulties()], ["Easy", "Medium", "Hard"]);
assert.deepEqual({ ...api.hiddenWordDifficultyConfig("Easy") }, { size: 8, minLength: 4, maxLength: 7, attempts: 8 });
assert.deepEqual({ ...api.hiddenWordDifficultyConfig("Hard") }, { size: 15, minLength: 6, maxLength: 15, attempts: 6 });
assert.match(api.hiddenWordDifficultyDescription("Medium"), /7 attempts/);
assert.equal(api.hiddenWordMaskedVerse({ text: "The Lord is my shepherd; the Lord leads me." }, "LORD"), "The _____ is my shepherd; the _____ leads me.");
assert.equal(api.hiddenWordIsSolved({ word: "FAITH", guessedLetters: ["F", "A", "I", "T", "H"] }), true);
assert.equal(api.hiddenWordIsSolved({ word: "FAITH", guessedLetters: ["F", "A", "I"] }), false);
assert.equal(api.hiddenWordHintsRemaining({ usedHintTypes: [] }), 2);
assert.equal(api.hiddenWordHintsRemaining({ usedHintTypes: ["context"] }), 1);

assert.match(source, /data-trivia-mode="hidden-word"[\s\S]*Hidden Word[\s\S]*game-new-badge/, "Hidden Word must appear in the Games rail with a New badge");
assert.match(source, /"hidden-word": \{ key: "hidden-word", name: "Unfolding Mystery"/, "Hidden Word must have a dedicated soundtrack");
assert.match(source, /function startHiddenWordGame\([\s\S]*puzzleCreatorEvaluation\("hidden-word"/, "Hidden Word must support the shared passage creator");
assert.match(source, /data-hidden-word-hint="\$\{hint\.type\}"/, "Hidden Word must render selectable hint types");
assert.match(source, /type: "context"[\s\S]*type: "letter"/, "Hidden Word must offer context and letter hints");
assert.doesNotMatch(source, /type: "category"/, "The visible category must not consume a hint");
assert.match(source, /class="hidden-word-source"[\s\S]*Category[\s\S]*round\.passageReference/, "Every word must show its category and source passage before guessing");
assert.match(source, /id="hiddenWordNativeInput"[\s\S]*inputmode="text"/, "Hidden Word must expose a mobile software-keyboard input");
assert.match(source, /state\.triviaGame\?\.type\)[\s\S]*guessHiddenWordLetter\(event\.key\)/, "Hidden Word must own physical keyboard letters before global shortcuts");
assert.match(source, /hiddenWordMaskedVerse\(round\.verse, round\.word\)/, "The context hint must mask the answer");
assert.doesNotMatch(source.slice(source.indexOf("function hiddenWordGameView"), source.indexOf("function verseOrderGameView")), /gallows|hangman/i, "Hidden Word must not use gallows or Hangman imagery");
assert.match(styles, /\.hidden-word-scroll\s*\{/, "Hidden Word must use the Scripture scroll visual");
assert.match(styles, /\.hidden-word-letter\s*\{[\s\S]*width: clamp\(54px,[\s\S]*font-size: clamp\(44px,/, "Desktop answer blanks must dominate the play surface");
assert.match(styles, /\.hidden-word-keyboard button\s*\{[\s\S]*min-height: 48px/, "Desktop letter controls must retain large touch targets");
assert.match(styles, /@media \(max-width: 840px\)[\s\S]*\.hidden-word-layout\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/, "Hidden Word must stack for mobile portrait widths");
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\)[\s\S]*\.hidden-word-layout/, "Hidden Word must have a short-landscape layout");

console.log("Hidden Word checks passed");
