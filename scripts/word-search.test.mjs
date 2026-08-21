import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

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

let randomState = 94721;
const context = {
  triviaRandomSource: () => {
    randomState = (randomState * 48271) % 2147483647;
    return randomState / 2147483647;
  },
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("normalizeWordSearchWord")}
  ${extractFunction("wordSearchDirections")}
  ${extractFunction("createWordSearchGrid")}
  ${extractFunction("wordSearchSelectionCells")}
  ${extractFunction("wordSearchSnappedEnd")}
  globalThis.wordSearchApi = {
    normalizeWordSearchWord,
    wordSearchDirections,
    createWordSearchGrid,
    wordSearchSelectionCells,
    wordSearchSnappedEnd,
  };
`, context);

const api = context.wordSearchApi;
assert.equal(api.normalizeWordSearchWord("faithfulness!"), "FAITHFULNESS");
assert.equal(api.normalizeWordSearchWord("God's"), "GODS");
assert.equal(api.wordSearchDirections("Easy").length, 2);
assert.equal(api.wordSearchDirections("Medium").length, 4);
assert.equal(api.wordSearchDirections("Hard").length, 8);

for (const example of [
  { difficulty: "Easy", size: 8, words: ["LIGHT", "EARTH", "WATER", "SPIRIT", "NIGHT", "CREATED"] },
  { difficulty: "Medium", size: 9, words: ["SHEPHERD", "WATERS", "VALLEY", "COMFORT", "GOODNESS", "MERCY", "HOUSE", "PATHS"] },
  { difficulty: "Hard", size: 10, words: ["PEACEMAKER", "KINGDOM", "BLESSED", "COMFORTED", "MERCY", "MEEK", "PURE", "HUNGER", "MOURN", "HEAVEN"] },
]) {
  const puzzle = api.createWordSearchGrid(example.words, example.size, example.difficulty);
  assert.ok(puzzle, `${example.difficulty} puzzle should generate`);
  assert.equal(puzzle.cells.length, example.size);
  assert.ok(puzzle.cells.every((row) => row.length === example.size && row.every((letter) => /^[A-Z]$/.test(letter))));
  assert.deepEqual(new Set(puzzle.placements.map((placement) => placement.word)), new Set(example.words));
  puzzle.placements.forEach((placement) => {
    const letters = placement.cells.map(({ row, column }) => puzzle.cells[row][column]).join("");
    assert.equal(letters, placement.word);
    const forward = api.wordSearchSelectionCells(
      placement.cells[0].row,
      placement.cells[0].column,
      placement.cells.at(-1).row,
      placement.cells.at(-1).column,
    );
    assert.equal(forward.length, placement.word.length);
    assert.equal(
      JSON.stringify(Array.from(forward, ({ row, column }) => `${row}:${column}`)),
      JSON.stringify(placement.cells.map(({ row, column }) => `${row}:${column}`)),
    );
  });
}

assert.equal(api.wordSearchSelectionCells(0, 0, 2, 1).length, 0, "Bent selections must be rejected");
assert.deepEqual({ ...api.wordSearchSnappedEnd(4, 4, 6, 5, 9) }, { row: 6, column: 4 });
assert.deepEqual({ ...api.wordSearchSnappedEnd(4, 4, 6, 6, 9) }, { row: 6, column: 6 });

assert.match(source, /data-trivia-mode="word-search"[\s\S]*?game-new-badge/);
assert.match(source, /aria-label="Word Search, new"/);
assert.match(extractFunction("startTriviaGame"), /startWordSearchGame/);
assert.match(extractFunction("wordSearchGameView"), /role="grid"/);
assert.match(extractFunction("wordSearchGameView"), /id="openTriviaReference"/);
assert.match(extractFunction("bindWordSearchGrid"), /pointerdown/);
assert.match(extractFunction("bindWordSearchGrid"), /keydown/);
assert.match(extractFunction("handleWordSearchGridKeydown"), /ArrowUp/);
assert.match(extractFunction("handleWordSearchGridKeydown"), /Enter/);
assert.match(extractFunction("commitWordSearchSelection"), /recordWordSearchBest/);
assert.match(extractFunction("scheduleWordSearchTimer"), /setInterval/);
assert.match(extractFunction("mountMobileGameControls"), /word-search-actions/);
assert.match(extractFunction("openTriviaReference"), /game\?\.type === "word-search"[\s\S]*?game\.reference/);

assert.match(styles, /\.game-new-badge \{/);
assert.match(styles, /\.word-search-grid \{[\s\S]*?touch-action: none;/);
assert.match(styles, /\.word-search-cell \{[\s\S]*?font-family: "Atkinson Hyperlegible Next"/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.word-search-list \{[\s\S]*?grid-template-columns: repeat\(3/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\) \{[\s\S]*?\.word-search-layout \{[\s\S]*?grid-template-columns:/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\) \{[\s\S]*?\.word-search-grid \{[\s\S]*?height: 100%;/);

console.log("Word Search tests passed");
