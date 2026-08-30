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
  const wordSearchRecentPassageLimit = 12;
  const shuffleItems = (items) => [...items];
  const state = { wordSearchSounds: true, wordSearchRecentPassages: [], gameVolume: 100 };
  const document = { hidden: false };
  const soundEvents = [];
  const soundVolumeScalar = (value) => value / 100;
  const playModeTone = (_context, options) => soundEvents.push(options);
  ${extractFunction("normalizeWordSearchWord")}
  ${extractFunction("normalizedVersionsUpdatedAt")}
  ${extractFunction("normalizeWordSearchRecentPassages")}
  ${extractFunction("mergeWordSearchRecentPassages")}
  ${extractFunction("wordSearchPassageKey")}
  ${extractFunction("orderedWordSearchPassages")}
  ${extractFunction("wordSearchDifficultyConfig")}
  ${extractFunction("wordSearchDifficulties")}
  ${extractFunction("wordSearchDifficultyDescription")}
  ${extractFunction("wordSearchDirections")}
  ${extractFunction("wordSearchDiagonalTarget")}
  ${extractFunction("createWordSearchGrid")}
  ${extractFunction("wordSearchSelectionCells")}
  ${extractFunction("wordSearchSnappedEnd")}
  ${extractFunction("wordSearchFoundOutlines")}
  ${extractFunction("playReadyWordSearchFeedbackSound")}
  ${extractFunction("playReadyWordSearchCountdownTick")}
  globalThis.wordSearchApi = {
    normalizeWordSearchWord,
    normalizeWordSearchRecentPassages,
    mergeWordSearchRecentPassages,
    wordSearchPassageKey,
    orderedWordSearchPassages,
    wordSearchDifficultyConfig,
    wordSearchDifficulties,
    wordSearchDifficultyDescription,
    wordSearchDirections,
    wordSearchDiagonalTarget,
    createWordSearchGrid,
    wordSearchSelectionCells,
    wordSearchSnappedEnd,
    wordSearchFoundOutlines,
    feedbackSound: (result) => {
      soundEvents.length = 0;
      playReadyWordSearchFeedbackSound({ currentTime: 1, state: "running" }, result);
      return soundEvents.map((event) => ({ ...event }));
    },
    countdownTick: (secondsRemaining) => {
      soundEvents.length = 0;
      playReadyWordSearchCountdownTick({ currentTime: 1, state: "running" }, secondsRemaining);
      return soundEvents.map((event) => ({ ...event }));
    },
  };
`, context);

const api = context.wordSearchApi;
assert.equal(api.normalizeWordSearchWord("faithfulness!"), "FAITHFULNESS");
assert.equal(api.normalizeWordSearchWord("God's"), "GODS");
assert.equal(api.wordSearchDirections("Easy").length, 2);
assert.equal(api.wordSearchDirections("Medium").length, 4);
assert.equal(api.wordSearchDirections("Hard").length, 8);
assert.equal(api.wordSearchDirections("Expert").length, 8);
assert.equal(api.wordSearchDiagonalTarget("Easy", 6), 0);
assert.equal(api.wordSearchDiagonalTarget("Medium", 8), 3);
assert.equal(api.wordSearchDiagonalTarget("Hard", 10), 6);
assert.equal(api.wordSearchDiagonalTarget("Expert", 12), 8);
assert.deepEqual([...api.wordSearchDifficulties()], ["Easy", "Medium", "Hard", "Expert"]);
assert.deepEqual({ ...api.wordSearchDifficultyConfig("Expert") }, { size: 12, wordCount: 12 });
assert.match(api.wordSearchDifficultyDescription("Expert"), /mostly diagonal and backward/);
const foundSound = JSON.parse(JSON.stringify(api.feedbackSound("found")));
assert.equal(foundSound.length, 2);
assert.ok(foundSound.every((event) => event.duration <= 0.105 && event.peakGain <= 0.014));
const mistakeSound = JSON.parse(JSON.stringify(api.feedbackSound("mistake")));
assert.equal(mistakeSound.length, 1);
assert.equal(mistakeSound[0].type, "triangle");
assert.ok(mistakeSound[0].endFrequency < mistakeSound[0].startFrequency);
const countdownTick = JSON.parse(JSON.stringify(api.countdownTick(10)));
assert.equal(countdownTick.length, 1);
assert.equal(countdownTick[0].type, "square");
assert.equal(countdownTick[0].startFrequency, 920);
assert.ok(countdownTick[0].duration <= 0.05 && countdownTick[0].peakGain <= 0.018);
const criticalCountdownTick = JSON.parse(JSON.stringify(api.countdownTick(3)));
assert.equal(criticalCountdownTick[0].startFrequency, 1180);
assert.ok(criticalCountdownTick[0].peakGain <= 0.027);

const recentPacks = [
  { chapterKey: "Psalm 1", start: 1, end: 6 },
  { chapterKey: "Psalm 23", start: 1, end: 6 },
  { chapterKey: "Psalm 46", start: 1, end: 10 },
];
const orderedPacks = api.orderedWordSearchPassages(recentPacks, [
  { key: "Psalm 23:1-6", at: "2026-08-21T12:00:00.000Z" },
]);
assert.deepEqual(
  Array.from(orderedPacks, api.wordSearchPassageKey),
  ["Psalm 1:1-6", "Psalm 46:1-10", "Psalm 23:1-6"],
  "Recently played passages must move behind fresh options",
);
assert.equal(api.mergeWordSearchRecentPassages(
  [{ key: "Psalm 23:1-6", at: "2026-08-21T12:00:00.000Z" }],
  [{ key: "Psalm 23:1-6", at: "2026-08-20T12:00:00.000Z" }, { key: "Psalm 1:1-6", at: "2026-08-19T12:00:00.000Z" }],
).length, 2);

for (const example of [
  { difficulty: "Easy", size: 8, words: ["LIGHT", "EARTH", "WATER", "SPIRIT", "NIGHT", "CREATED"] },
  { difficulty: "Medium", size: 9, words: ["SHEPHERD", "WATERS", "VALLEY", "COMFORT", "GOODNESS", "MERCY", "HOUSE", "PATHS"] },
  { difficulty: "Hard", size: 10, words: ["PEACEMAKER", "KINGDOM", "BLESSED", "COMFORTED", "MERCY", "MEEK", "PURE", "HUNGER", "MOURN", "HEAVEN"] },
  { difficulty: "Expert", size: 12, words: ["PEACEMAKER", "COMPASSION", "MOUNTAINS", "RIGHTEOUS", "SALVATION", "SHEPHERD", "DISCIPLES", "STRENGTH", "CREATION", "KINGDOM", "MERCY", "FAITH"] },
]) {
  const puzzle = api.createWordSearchGrid(example.words, example.size, example.difficulty);
  assert.ok(puzzle, `${example.difficulty} puzzle should generate`);
  assert.equal(puzzle.cells.length, example.size);
  assert.ok(puzzle.cells.every((row) => row.length === example.size && row.every((letter) => /^[A-Z]$/.test(letter))));
  assert.deepEqual(new Set(puzzle.placements.map((placement) => placement.word)), new Set(example.words));
  const diagonalCount = puzzle.placements.filter((placement) => {
    const first = placement.cells[0];
    const last = placement.cells.at(-1);
    return first.row !== last.row && first.column !== last.column;
  }).length;
  assert.equal(diagonalCount, api.wordSearchDiagonalTarget(example.difficulty, example.words.length));
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

for (const example of [
  { difficulty: "Easy", size: 8, words: ["LIGHT", "EARTH", "WATER", "SPIRIT", "NIGHT", "CREATED"] },
  { difficulty: "Medium", size: 9, words: ["SHEPHERD", "WATERS", "VALLEY", "COMFORT", "GOODNESS", "MERCY", "HOUSE", "PATHS"] },
  { difficulty: "Hard", size: 10, words: ["PEACEMAKER", "KINGDOM", "BLESSED", "COMFORTED", "MERCY", "MEEK", "PURE", "HUNGER", "MOURN", "HEAVEN"] },
  { difficulty: "Expert", size: 12, words: ["PEACEMAKER", "COMPASSION", "MOUNTAINS", "RIGHTEOUS", "SALVATION", "SHEPHERD", "DISCIPLES", "STRENGTH", "CREATION", "KINGDOM", "MERCY", "FAITH"] },
]) {
  for (let generation = 0; generation < 12; generation += 1) {
    const puzzle = api.createWordSearchGrid(example.words, example.size, example.difficulty);
    assert.ok(puzzle, `${example.difficulty} puzzle generation ${generation + 1} should succeed`);
    const diagonalCount = puzzle.placements.filter((placement) => {
      const first = placement.cells[0];
      const last = placement.cells.at(-1);
      return first.row !== last.row && first.column !== last.column;
    }).length;
    assert.equal(diagonalCount, api.wordSearchDiagonalTarget(example.difficulty, example.words.length));
  }
}

const outlineMarkup = api.wordSearchFoundOutlines({
  size: 9,
  foundWords: ["FAITH", "HOPE"],
  placements: [
    { word: "FAITH", cells: [{ row: 1, column: 1 }, { row: 2, column: 2 }, { row: 3, column: 3 }, { row: 4, column: 4 }, { row: 5, column: 5 }] },
    { word: "HOPE", cells: [{ row: 5, column: 2 }, { row: 5, column: 3 }, { row: 5, column: 4 }, { row: 5, column: 5 }] },
    { word: "UNSEEN", cells: [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }, { row: 0, column: 3 }, { row: 0, column: 4 }, { row: 0, column: 5 }] },
  ],
});
assert.match(outlineMarkup, /data-word-search-outline="FAITH"/);
assert.match(outlineMarkup, /data-word-search-outline="HOPE"/);
assert.doesNotMatch(outlineMarkup, /data-word-search-outline="UNSEEN"/);
assert.equal((outlineMarkup.match(/<rect /g) || []).length, 2);

assert.equal(api.wordSearchSelectionCells(0, 0, 2, 1).length, 0, "Bent selections must be rejected");
assert.deepEqual({ ...api.wordSearchSnappedEnd(4, 4, 6, 5, 9) }, { row: 6, column: 4 });
assert.deepEqual({ ...api.wordSearchSnappedEnd(4, 4, 6, 6, 9) }, { row: 6, column: 6 });

assert.doesNotMatch(source, /game-new-badge/);
assert.doesNotMatch(source, /aria-label="Crossword, new"/);
assert.doesNotMatch(source, /aria-label="Word Search, new"/);
const triviaViewSource = extractFunction("triviaView");
assert.ok(
  triviaViewSource.indexOf('data-trivia-mode="word-search"') < triviaViewSource.indexOf('data-trivia-mode="trivia"'),
  "Word Search must be first in the Games list",
);
assert.match(triviaViewSource, /isWordSearch \? wordSearchDifficulties\(\) : isCrossword \? crosswordDifficulties\(\) : triviaDifficulties\(\)/);
assert.match(extractFunction("startTriviaGame"), /startWordSearchGame/);
const startWordSearchSource = extractFunction("startWordSearchGame");
assert.match(startWordSearchSource, /orderedWordSearchPassages\(\)/);
assert.match(startWordSearchSource, /recordWordSearchPassage\(selected\.pack\)/);
assert.match(startWordSearchSource, /savedWordSearchBest\(difficulty, bestContext\)/);
assert.match(startWordSearchSource, /if \(target\) primeWordSearchAudio\(\)/);
assert.match(startWordSearchSource, /wordSearchTarget: target/);
assert.match(startWordSearchSource, /wordSearchHadPrevious: Boolean\(target\)/);
assert.match(startWordSearchSource, /wordSearchLastTick: null/);
assert.match(extractFunction("wordSearchGameView"), /role="grid"/);
assert.match(extractFunction("wordSearchGameView"), /wordSearchFoundOutlines/);
assert.match(extractFunction("wordSearchGameView"), /id="openTriviaReference"/);
assert.match(extractFunction("wordSearchGameView"), /puzzleRestartDialog\(game\)/);
assert.match(extractFunction("wordSearchGameView"), /Time to beat/);
assert.match(extractFunction("wordSearchGameView"), /Best time passed/);
assert.match(extractFunction("wordSearchGameView"), /Best time set/);
assert.match(extractFunction("puzzleRestartDialog"), /data-puzzle-restart-difficulty/);
assert.match(extractFunction("openPuzzleRestartPrompt"), /state\.puzzleRestartPromptOpen = true/);
assert.match(extractFunction("restartPuzzleAtDifficulty"), /startWordSearchGame\(\)/);
assert.match(source, /\["word-search", "crossword"\]\.includes\(state\.triviaGame\?\.type\)[\s\S]*?openPuzzleRestartPrompt\(\)/);
assert.match(extractFunction("bindWordSearchGrid"), /pointerdown/);
assert.match(extractFunction("bindWordSearchGrid"), /keydown/);
assert.match(extractFunction("handleWordSearchGridKeydown"), /ArrowUp/);
assert.match(extractFunction("handleWordSearchGridKeydown"), /Enter/);
const commitSelectionSource = extractFunction("commitWordSearchSelection");
assert.match(commitSelectionSource, /recordWordSearchBest/);
assert.match(commitSelectionSource, /game\.wordSearchBeatBest = Boolean\(result\?\.beatPrevious\)/);
assert.match(commitSelectionSource, /playWordSearchFeedbackSound\("found"\)/);
assert.match(commitSelectionSource, /playWordSearchFeedbackSound\("mistake"\)/);
assert.match(extractFunction("chooseWordSearchCell"), /playWordSearchFeedbackSound\("mistake"\)/);
assert.match(extractFunction("primeWordSearchAudio"), /wordSearchAudioContext\.resume\(\)/);
const feedbackSoundSource = extractFunction("playReadyWordSearchFeedbackSound");
assert.match(feedbackSoundSource, /result === "found"/);
assert.match(feedbackSoundSource, /peakGain: 0\.014/);
assert.match(feedbackSoundSource, /startFrequency: 220/);
assert.match(feedbackSoundSource, /endFrequency: 174\.61/);
const countdownSoundSource = extractFunction("playReadyWordSearchCountdownTick");
assert.match(countdownSoundSource, /secondsRemaining <= 3 \? 1180 : 920/);
assert.match(countdownSoundSource, /secondsRemaining <= 3 \? 0\.027 : 0\.018/);
assert.match(countdownSoundSource, /type: "square"/);
assert.match(extractFunction("setWordSearchSounds"), /lw_word_search_sounds/);
const timerDisplaySource = extractFunction("updateWordSearchTimerDisplay");
assert.match(timerDisplaySource, /game\.wordSearchTarget\?\.elapsedMs/);
assert.match(timerDisplaySource, /remainingMs > 0 && remainingMs <= 10000/);
assert.match(timerDisplaySource, /secondsRemaining > 0 && secondsRemaining <= 10/);
assert.match(timerDisplaySource, /playWordSearchCountdownTick\(secondsRemaining\)/);
assert.match(timerDisplaySource, /game\.complete \? "Finished" : "Time"/);
assert.match(extractFunction("scheduleWordSearchTimer"), /setInterval/);
assert.match(extractFunction("recordWordSearchBest"), /beatPrevious/);
assert.match(extractFunction("savedWordSearchBest"), /puzzleBestKey\(difficulty, context\)/);
assert.match(extractFunction("mountMobileGameControls"), /word-search-actions/);
assert.match(extractFunction("openTriviaReference"), /game\?\.type === "word-search"[\s\S]*?game\.reference/);

const passageBlock = source.slice(source.indexOf("const wordSearchPassages = ["), source.indexOf("const wordSearchStopWords"));
assert.ok((passageBlock.match(/chapterKey:/g) || []).length >= 40, "Word Search should include at least 40 well-known passage packs");
assert.match(extractFunction("captureCloudSnapshot"), /wordSearchRecentPassages/);
assert.match(extractFunction("applyCloudSnapshot"), /wordSearchRecentPassages/);
assert.match(source, /wordSearchSounds: localStorage\.getItem\("lw_word_search_sounds"\) !== "false"/);
assert.match(extractFunction("soundsSettings"), /WordSearchSoundsToggle/);
assert.match(extractFunction("captureCloudSnapshot"), /wordSearchSounds: state\.wordSearchSounds/);
assert.match(extractFunction("applyCloudSnapshot"), /state\.wordSearchSounds = settings\.wordSearchSounds !== false/);

assert.doesNotMatch(styles, /\.game-new-badge \{/);
assert.match(styles, /\.word-search-grid \{[\s\S]*?touch-action: none;/);
assert.match(styles, /\.word-search-cell \{[\s\S]*?font-family: "Atkinson Hyperlegible Next"/);
assert.match(styles, /\.word-search-found-outlines \{[\s\S]*?pointer-events: none;/);
assert.match(styles, /\.word-search-found-outline \{[\s\S]*?vector-effect: non-scaling-stroke;/);
assert.match(styles, /\.word-search-timer strong\.is-urgent/);
assert.match(styles, /\.word-search-timer strong\.is-critical/);
assert.match(styles, /\.word-search-timer strong\.is-expired/);
assert.match(styles, /\.puzzle-restart-overlay \{[\s\S]*?position: fixed;/);
assert.match(styles, /\.puzzle-restart-option \{[\s\S]*?min-height: 92px;/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.word-search-list \{[\s\S]*?grid-template-columns: repeat\(3/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\) \{[\s\S]*?\.word-search-layout \{[\s\S]*?grid-template-columns:/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\) \{[\s\S]*?\.word-search-grid \{[\s\S]*?height: 100%;/);

console.log("Word Search tests passed");
