import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1);
  const bodyStart = source.indexOf(") {", start) + 2;
  let depth = 0;
  for (let index = bodyStart; index < source.length; index++) {
    if (source[index] === "{") depth++;
    if (source[index] === "}") depth--;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Cannot extract ${name}`);
}
const storage = new Map();
const context = vm.createContext({
  state: { triviaGameType: "crossword", triviaDifficulty: "Expert" },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
});
vm.runInContext(["wordSearchDifficulties", "crosswordDifficulties", "hiddenWordDifficulties", "triviaDifficulties",
  "normalizedGameDifficulty", "savedGameDifficulties", "rememberGameDifficulty", "switchGameDifficulty"].map(extractFunction).join("\n"), context);
context.switchGameDifficulty("reference-rush");
assert.equal(context.state.triviaDifficulty, "Easy");
context.state.triviaDifficulty = "All"; // Progressive
context.rememberGameDifficulty();
context.switchGameDifficulty("hidden-word");
assert.equal(context.state.triviaDifficulty, "Medium");
context.state.triviaDifficulty = "Hard";
context.switchGameDifficulty("crossword");
assert.equal(context.state.triviaDifficulty, "Expert");
context.switchGameDifficulty("reference-rush");
assert.equal(context.state.triviaDifficulty, "All");
context.switchGameDifficulty("hidden-word");
assert.equal(context.state.triviaDifficulty, "Hard");
// Reload retains the active legacy value and all other games' saved values.
context.state = { triviaGameType: "hidden-word", triviaDifficulty: storage.get("lw_trivia_difficulty") };
context.switchGameDifficulty("crossword");
assert.equal(context.state.triviaDifficulty, "Expert");
context.switchGameDifficulty("trivia");
assert.equal(context.state.triviaDifficulty, "All");
context.state.triviaDifficulty = "Easy";
context.switchGameDifficulty("word-search");
assert.equal(context.state.triviaDifficulty, "Medium");
context.switchGameDifficulty("trivia");
assert.equal(context.state.triviaDifficulty, "Easy");
for (const invalid of ["broken", "null", "[]", '{"crossword":"invalid"}']) {
  storage.set("lw_game_difficulties_v1", invalid);
  context.switchGameDifficulty("crossword");
  assert.equal(context.state.triviaDifficulty, "Medium");
  context.state.triviaGameType = "trivia";
}
assert.match(source, /switchGameDifficulty\(button.dataset.triviaMode/);
assert.doesNotMatch(source, /if \(state.triviaGameType === "reference-rush"\) state.triviaDifficulty = "Easy"/);
console.log("Per-game difficulty memory passed");
