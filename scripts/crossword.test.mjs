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

let randomState = 73129;
const context = {
  triviaRandomSource: () => {
    randomState = (randomState * 48271) % 2147483647;
    return randomState / 2147483647;
  },
};
vm.createContext(context);
vm.runInContext(`
  const state = { triviaDifficulty: "Medium" };
  const crosswordHintLimit = 3;
  const formatGameTime = (milliseconds) => String(milliseconds) + "ms";
  const normalizeWordSearchWord = (value) => String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
  const shuffleItems = (items) => {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(triviaRandomSource() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  };
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${"$"}{}()|[\\]\\\\]/g, "\\\\$&");
  ${extractFunction("crosswordDifficultyConfig")}
  ${extractFunction("crosswordDifficulties")}
  ${extractFunction("crosswordDifficultyDescription")}
  ${extractFunction("crosswordCanPlaceWord")}
  ${extractFunction("crosswordPlaceWord")}
  ${extractFunction("crosswordPlacementCandidates")}
  ${extractFunction("finalizeCrosswordGrid")}
  ${extractFunction("crosswordVersesForWord")}
  ${extractFunction("crosswordVerseCapacity")}
  ${extractFunction("createCrosswordGrid")}
  ${extractFunction("crosswordClueForWord")}
  ${extractFunction("wordSearchCellKey")}
  ${extractFunction("crosswordEntryById")}
  ${extractFunction("crosswordHintsRemaining")}
  ${extractFunction("crosswordRevealCandidate")}
  ${extractFunction("formatCrosswordBestTime")}
  ${extractFunction("crosswordEntryIsCorrect")}
  ${extractFunction("crosswordEntryIsFilled")}
  ${extractFunction("reconcileCrosswordCompletedEntries")}
  globalThis.crosswordApi = {
    crosswordDifficultyConfig,
    crosswordDifficulties,
    crosswordDifficultyDescription,
    createCrosswordGrid,
    crosswordClueForWord,
    crosswordVerseCapacity,
    crosswordEntryIsCorrect,
    crosswordEntryIsFilled,
    reconcileCrosswordCompletedEntries,
    crosswordHintsRemaining,
    crosswordRevealCandidate,
    formatCrosswordBestTime,
  };
`, context);

const api = context.crosswordApi;
assert.equal(api.crosswordHintsRemaining({ hintCount: 0 }), 3);
assert.equal(api.crosswordHintsRemaining({ hintCount: 2 }), 1);
assert.equal(api.crosswordHintsRemaining({ hintCount: 3 }), 0);
assert.equal(api.formatCrosswordBestTime({ elapsedMs: 42000, hintCount: 0 }), "42000ms");
assert.equal(api.formatCrosswordBestTime({ elapsedMs: 42000, hintCount: 2 }), "42000ms*");
assert.deepEqual([...api.crosswordDifficulties()], ["Easy", "Medium", "Hard", "Expert"]);
assert.deepEqual({ ...api.crosswordDifficultyConfig("Easy") }, { size: 9, entryCount: 5 });
assert.deepEqual({ ...api.crosswordDifficultyConfig("Expert") }, { size: 15, entryCount: 11 });
assert.match(api.crosswordDifficultyDescription("Hard"), /9 passage words/);

const wordSets = [
  { size: 9, count: 5, words: ["FAITH", "EARTH", "HEART", "TRUTH", "HOPE", "PATH", "FATHER", "SPIRIT"] },
  { size: 11, count: 7, words: ["SHEPHERD", "WATERS", "VALLEY", "COMFORT", "GOODNESS", "MERCY", "HOUSE", "PATHS", "RESTORES", "RIGHT"] },
  { size: 13, count: 9, words: ["BLESSED", "KINGDOM", "COMFORTED", "MERCY", "MEEK", "PURE", "HUNGER", "MOURN", "HEAVEN", "RIGHTEOUS", "PEACEMAKER", "EARTH"] },
  { size: 15, count: 11, words: ["COMPASSION", "KINDNESS", "HUMILITY", "GENTLENESS", "PATIENCE", "FORGIVE", "LOVE", "PEACE", "THANKFUL", "WISDOM", "GRATITUDE", "CHOSEN", "HOLY", "BELOVED"] },
];

for (const example of wordSets) {
  const puzzle = api.createCrosswordGrid(example.words, example.size, example.count);
  assert.ok(puzzle, `${example.count}-entry crossword should generate`);
  assert.equal(puzzle.entries.length, example.count);
  assert.ok(puzzle.rows <= example.size && puzzle.columns <= example.size);
  assert.ok(puzzle.entries.some((entry) => entry.direction === "across"));
  assert.ok(puzzle.entries.some((entry) => entry.direction === "down"));
  puzzle.entries.forEach((entry) => {
    const letters = entry.cells.map(({ row, column }) => puzzle.cells[row][column]).join("");
    assert.equal(letters, entry.word);
    assert.equal(entry.id, `${entry.number}-${entry.direction}`);
  });
  const occupiedCounts = new Map();
  puzzle.entries.forEach((entry) => entry.cells.forEach((cell) => {
    const key = `${cell.row}:${cell.column}`;
    occupiedCounts.set(key, (occupiedCounts.get(key) || 0) + 1);
  }));
  assert.ok([...occupiedCounts.values()].some((count) => count > 1), "Crossword entries must intersect");
}

const clue = api.crosswordClueForWord([
  { n: 4, text: "Even though I walk through the valley, no other valley will make me fear evil." },
], "VALLEY");
assert.match(clue, /^Verse 4:/);
assert.match(clue, /_____/);
assert.doesNotMatch(clue, /valley/i);

const distinctVerseWords = ["FAITH", "EARTH", "HEART", "TRUTH", "HOPE", "PATH", "FATHER", "SPIRIT"];
const distinctVersePuzzle = api.createCrosswordGrid(
  distinctVerseWords,
  9,
  5,
  distinctVerseWords.map((word, index) => ({ n: index + 1, text: `A clue for ${word.toLowerCase()} appears here.` })),
);
assert.ok(distinctVersePuzzle, "Verse-aware crossword should generate");
assert.equal(
  new Set(distinctVersePuzzle.entries.map((entry) => entry.verse?.n)).size,
  distinctVersePuzzle.entries.length,
  "Each clue should use a different verse when enough verses are available",
);

const limitedVersePuzzle = api.createCrosswordGrid(
  distinctVerseWords,
  9,
  5,
  [
    { n: 1, text: "Faith, earth, heart, and truth are in this verse." },
    { n: 2, text: "Hope, path, father, and spirit are in this verse." },
  ],
);
assert.ok(limitedVersePuzzle, "Crossword should still generate when distinct verses are limited");
assert.equal(
  new Set(limitedVersePuzzle.entries.map((entry) => entry.verse?.n)).size,
  2,
  "Fallback should use every available source verse before repeating one",
);

const sharedVerse = {
  n: 26,
  text: "Look at the birds of the air: They do not sow or reap or gather into barns, and yet your heavenly Father feeds them.",
};
const birdsClue = api.crosswordClueForWord([sharedVerse], "BIRDS", ["REAP"]);
const reapClue = api.crosswordClueForWord([sharedVerse], "REAP", ["BIRDS"]);
assert.doesNotMatch(birdsClue, /\breap\b/i, "Earlier clue must not reveal a later answer from the same verse");
assert.doesNotMatch(reapClue, /\bbirds\b/i, "Later clue must not reveal an earlier answer from the same verse");
assert.match(birdsClue, /_____/);
assert.match(reapClue, /_____/);

const interactionGame = {
  answers: { "0:0": "F", "0:1": "A", "0:2": "I", "0:3": "T", "0:4": "H" },
  entries: [
    { id: "1-across", word: "FAITH", cells: [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 0, column: 2 }, { row: 0, column: 3 }, { row: 0, column: 4 }] },
    { id: "2-down", word: "HOPE", cells: [{ row: 0, column: 4 }, { row: 1, column: 4 }, { row: 2, column: 4 }, { row: 3, column: 4 }] },
  ],
  completedEntryIds: ["1-across"],
  score: 1,
};
assert.equal(api.crosswordEntryIsFilled(interactionGame, interactionGame.entries[0]), true);
assert.equal(api.crosswordEntryIsCorrect(interactionGame, interactionGame.entries[0]), true);
interactionGame.type = "crossword";
interactionGame.activeEntryId = "2-down";
interactionGame.activeCellKey = "1:4";
assert.deepEqual(
  { ...api.crosswordRevealCandidate(interactionGame) },
  {
    entry: interactionGame.entries[1],
    cell: interactionGame.entries[1].cells[1],
    index: 1,
    key: "1:4",
    letter: "O",
  },
  "A hint should reveal the selected unresolved square",
);
interactionGame.answers["1:4"] = "O";
assert.equal(
  api.crosswordRevealCandidate(interactionGame).key,
  "2:4",
  "A correct selected square should advance the hint to the next unresolved letter",
);
interactionGame.answers["0:4"] = "X";
api.reconcileCrosswordCompletedEntries(interactionGame);
assert.deepEqual(Array.from(interactionGame.completedEntryIds), []);
assert.equal(interactionGame.score, 0, "Editing a crossing must invalidate an earlier completed answer");

const bsbContext = { window: {} };
vm.createContext(bsbContext);
vm.runInContext(readFileSync(new URL("../assets/bibles/BSB.js", import.meta.url), "utf8"), bsbContext);
const passageStart = source.indexOf("const wordSearchPassages = [");
const passageEnd = source.indexOf("const wordSearchStopWords", passageStart);
const passageContext = {};
vm.createContext(passageContext);
vm.runInContext(`${source.slice(passageStart, passageEnd)}; globalThis.packs = wordSearchPassages;`, passageContext);
const bsbChapters = bsbContext.window.BIGSCREEN_BIBLE_BSB.chapters;
const exodusPack = passageContext.packs.find((pack) => pack.chapterKey === "Exodus 20");
const exodusVerses = bsbChapters[exodusPack.chapterKey].verses
  .filter((verse) => verse.n >= exodusPack.start && verse.n <= exodusPack.end);
const stopWordSetsStart = source.indexOf("const wordSearchStopWords = new Set(");
const stopWordSetsEnd = source.indexOf("function normalizedPuzzlePassageSource", stopWordSetsStart);
const customCandidateContext = {};
vm.createContext(customCandidateContext);
vm.runInContext(`
  ${source.slice(stopWordSetsStart, stopWordSetsEnd)}
  const normalizeWordSearchWord = (value) => String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
  ${extractFunction("customPuzzleCandidateWords")}
  globalThis.customPuzzleCandidateWords = customPuzzleCandidateWords;
`, customCandidateContext);
const exodusCandidateWords = customCandidateContext.customPuzzleCandidateWords(exodusVerses, 15);
const exodusPuzzle = api.createCrosswordGrid(exodusCandidateWords, 15, 11, exodusVerses);
assert.ok(exodusPuzzle, "Exodus 20:1-17 Expert crossword should generate");
assert.equal(
  new Set(exodusPuzzle.entries.map((entry) => entry.verse?.n)).size,
  exodusPuzzle.entries.length,
  "Exodus 20:1-17 should not repeat a clue verse",
);
const matthewPack = passageContext.packs.find((pack) => pack.chapterKey === "Matthew 6");
const matthewVerses = bsbChapters[matthewPack.chapterKey].verses
  .filter((verse) => verse.n >= matthewPack.start && verse.n <= matthewPack.end);
const matthewCandidateWords = customCandidateContext.customPuzzleCandidateWords(matthewVerses, 15);
assert.equal(matthewVerses.length, 10, "Matthew 6:25-34 fixture should contain ten verses");
const matthewPuzzle = api.createCrosswordGrid(matthewCandidateWords, 15, 11, matthewVerses);
assert.ok(matthewPuzzle, "Matthew 6:25-34 should still generate an 11-clue puzzle");
assert.equal(
  new Set(matthewPuzzle.entries.map((entry) => entry.verse?.n)).size,
  10,
  "Matthew 6:25-34 should use all ten verses before repeating one",
);
for (const entry of matthewPuzzle.entries) {
  const hiddenAnswers = matthewPuzzle.entries
    .filter((candidate) => candidate !== entry && candidate.verse?.n === entry.verse?.n)
    .map((candidate) => candidate.word);
  const clue = api.crosswordClueForWord([entry.verse], entry.word, hiddenAnswers);
  hiddenAnswers.forEach((hiddenAnswer) => {
    assert.doesNotMatch(clue, new RegExp(`\\b${hiddenAnswer}\\b`, "i"), `${entry.word} clue must hide ${hiddenAnswer}`);
  });
}
const stopWords = new Set(["about", "after", "again", "against", "also", "among", "because", "before", "being", "between", "could", "every", "from", "have", "having", "into", "itself", "shall", "should", "their", "there", "these", "they", "thing", "those", "through", "under", "until", "upon", "very", "were", "what", "when", "where", "which", "while", "with", "would", "your", "yours"]);
const passageCandidates = (pack, config) => {
  const verses = (bsbChapters[pack.chapterKey]?.verses || []).filter((verse) => verse.n >= pack.start && verse.n <= pack.end);
  const tokens = verses.flatMap((verse) => verse.text.match(/[A-Za-z]+/g) || []).map((word) => word.toUpperCase());
  const tokenSet = new Set(tokens);
  const curated = pack.words.map((word) => word.toUpperCase().replace(/[^A-Z]/g, "")).filter((word) => word.length >= 3 && word.length <= config.size && tokenSet.has(word));
  const fallback = [...new Set(tokens)].filter((word) => word.length >= 4 && word.length <= config.size && !stopWords.has(word.toLowerCase()) && !curated.includes(word));
  return [...new Set([...curated, ...fallback])].slice(0, Math.max(config.entryCount + 9, 18));
};

for (const difficulty of api.crosswordDifficulties()) {
  const config = api.crosswordDifficultyConfig(difficulty);
  const minimumPassageCount = 6;
  let generatedCount = 0;
  for (const pack of passageContext.packs) {
    const words = passageCandidates(pack, config);
    const verses = (bsbChapters[pack.chapterKey]?.verses || []).filter((verse) => verse.n >= pack.start && verse.n <= pack.end);
    if (words.length < config.entryCount) continue;
    const puzzle = api.createCrosswordGrid(words, config.size, config.entryCount, verses);
    if (puzzle) {
      assert.equal(
        new Set(puzzle.entries.map((entry) => entry.verse?.n)).size,
        Math.min(config.entryCount, api.crosswordVerseCapacity(verses, words)),
        `${difficulty} ${pack.label} should maximize distinct clue verses`,
      );
      generatedCount += 1;
    }
    if (generatedCount >= minimumPassageCount) break;
  }
  assert.ok(
    generatedCount >= minimumPassageCount,
    `${difficulty} generated from ${generatedCount} real passage packs; expected at least ${minimumPassageCount}`,
  );
}

const triviaViewSource = extractFunction("triviaView");
assert.ok(
  triviaViewSource.indexOf('data-trivia-mode="word-search"') < triviaViewSource.indexOf('data-trivia-mode="crossword"'),
  "Crossword should follow Word Search in the Games list",
);
assert.ok(
  triviaViewSource.indexOf('data-trivia-mode="crossword"') < triviaViewSource.indexOf('data-trivia-mode="trivia"'),
  "Crossword should be prominent before Trivia",
);
assert.doesNotMatch(triviaViewSource, /aria-label="Crossword, new"/);
assert.doesNotMatch(source, /game-new-badge/);
assert.match(triviaViewSource, /isCrossword \? crosswordDifficulties\(\)/);
assert.match(extractFunction("startTriviaGame"), /startCrosswordGame/);
assert.match(extractFunction("puzzleCreatorEvaluation"), /const defaultCount = gameType === "crossword"\s*\? candidates\.length/);
assert.match(extractFunction("startCrosswordGame"), /orderedWordSearchPassages\(\)/);
assert.match(extractFunction("startCrosswordGame"), /crosswordClueForWord/);
assert.match(extractFunction("startCrosswordGame"), /createCrosswordGrid\(option\.words, config\.size, config\.entryCount, option\.verses\)/);
assert.match(extractFunction("startCrosswordGame"), /candidate\.verse\?\.n === entry\.verse\?\.n/);
assert.match(extractFunction("startCrosswordGame"), /recordWordSearchPassage/);
assert.match(extractFunction("triviaGameView"), /crosswordGameView/);
assert.match(extractFunction("crosswordGameView"), /role="grid"/);
assert.match(extractFunction("crosswordGameView"), /data-crossword-key/);
assert.match(extractFunction("crosswordGameView"), /id="crosswordNativeInput"/);
assert.match(extractFunction("crosswordGameView"), /inputmode="text"/);
assert.match(extractFunction("crosswordGameView"), /id="crosswordKeyboardToggle"/);
assert.match(extractFunction("crosswordGameView"), /data-crossword-hint="reveal-letter"/);
assert.match(extractFunction("crosswordGameView"), /revealed by hint/);
assert.match(extractFunction("crosswordGameView"), /All 3 hints used/);
assert.match(extractFunction("crosswordGameView"), /formatCrosswordBestTime/);
assert.match(extractFunction("crosswordGameView"), /state\.crosswordKeyboardVisible \? "" : "hidden"/);
assert.match(extractFunction("crosswordGameView"), /Across/);
assert.match(extractFunction("crosswordGameView"), /Down/);
assert.match(extractFunction("crosswordGameView"), /class="ghost-btn games-menu-control crossword-menu-control" id="exitTriviaGame"[\s\S]*?icons\.returnBack/);
assert.match(extractFunction("crosswordGameView"), /puzzleRestartDialog\(game\)/);
assert.match(extractFunction("puzzleRestartDialog"), /crosswordDifficulties\(\)/);
assert.match(extractFunction("puzzleRestartDialog"), /crosswordDifficultyDescription/);
assert.match(extractFunction("restartPuzzleAtDifficulty"), /startCrosswordGame\(\)/);
assert.match(extractFunction("bindCrosswordGrid"), /keydown/);
assert.match(extractFunction("bindCrosswordGrid"), /beforeinput/);
assert.match(extractFunction("bindCrosswordGrid"), /focusCrosswordNativeInput/);
assert.match(extractFunction("bindCrosswordGrid"), /setCrosswordKeyboardVisible/);
assert.match(extractFunction("bindCrosswordGrid"), /revealCrosswordLetterHint/);
assert.match(extractFunction("activeGameHintContext"), /crosswordRevealCandidate/);
assert.match(extractFunction("activeGameHintContext"), /crosswordHintsRemaining/);
assert.match(extractFunction("mountMobileGameControls"), /crossword-hints/);
assert.match(extractFunction("handleCrosswordKeydown"), /Backspace/);
assert.match(extractFunction("handleCrosswordKeydown"), /ArrowRight/);
assert.match(extractFunction("handleCrosswordKeydown"), /stopPropagation/);
assert.match(extractFunction("handleCrosswordNativeInput"), /match\(\/\[a-z\]\/gi\)/);
assert.match(extractFunction("handleCrosswordNativeBeforeInput"), /startsWith\("delete"\)/);
assert.match(extractFunction("setCrosswordKeyboardVisible"), /crosswordKeyboardVisibleStorageKey/);
assert.match(extractFunction("setCrosswordKeyboardVisible"), /scheduleCloudSync\(\)/);
assert.match(extractFunction("captureCloudSnapshot"), /crosswordKeyboardVisible/);
assert.match(extractFunction("applyCloudSnapshot"), /settings\.crosswordKeyboardVisible/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /crosswordKeyboardVisibleStorageKey/);
const globalShortcutsSource = extractFunction("handleGlobalShortcuts");
const crosswordLetterOwnershipIndex = globalShortcutsSource.indexOf('state.triviaGame?.type === "crossword"');
assert.ok(crosswordLetterOwnershipIndex >= 0, "Crossword should own unmodified letter keys");
assert.ok(
  crosswordLetterOwnershipIndex < globalShortcutsSource.indexOf('if (key === "p")'),
  "Crossword letter handling must run before single-letter app shortcuts",
);
assert.match(globalShortcutsSource, /!event\.shiftKey && \/\^\[a-z\]\$\/i\.test\(event\.key\)/);
assert.match(extractFunction("enterCrosswordLetter"), /updateCrosswordDom/);
assert.match(extractFunction("enterCrosswordLetter"), /hintedCellKeys/);
assert.doesNotMatch(extractFunction("enterCrosswordLetter"), /renderPreservingReaderScroll\(\)/);
assert.match(extractFunction("eraseCrosswordLetter"), /hintedCellKeys/);
assert.match(extractFunction("revealCrosswordLetterHint"), /hintedCellKeys/);
assert.match(extractFunction("revealCrosswordLetterHint"), /crosswordHintLimit/);
assert.match(extractFunction("revealCrosswordLetterHint"), /all 3 hints used/);
assert.match(extractFunction("revealCrosswordLetterHint"), /renderPreservingReaderScroll/);
assert.match(extractFunction("checkCrosswordEntry"), /errorCellKeys/);
assert.match(extractFunction("completeCrosswordEntry"), /recordCrosswordBest/);
assert.match(extractFunction("recordCrosswordBest"), /hintCount/);
assert.match(extractFunction("triviaScoreLabel"), /hintCount \? "\*"/);
assert.match(extractFunction("updateCrosswordTimerDisplay"), /assisted \? "\*"/);
assert.match(extractFunction("updatePuzzleCreatorDom"), /formatCrosswordBestTime/);
assert.match(extractFunction("openTriviaReference"), /game\?\.type === "crossword"/);
assert.match(extractFunction("mountMobileGameControls"), /crossword-actions/);
assert.match(styles, /\.crossword-grid \{[\s\S]*?touch-action: manipulation;/);
assert.match(styles, /\.crossword-keyboard button \{[\s\S]*?min-height: 42px;/);
assert.match(styles, /\.crossword-keyboard\[hidden\] \{[\s\S]*?display: none;/);
assert.match(styles, /\.crossword-cell\.is-hint \.crossword-cell-letter \{/);
assert.match(styles, /\.crossword-hint-button \{[\s\S]*?min-height: 44px;/);
assert.match(styles, /\.puzzle-best-score \{/);
assert.match(styles, /\.crossword-assist-note \{/);
assert.match(styles, /\.crossword-native-input \{[\s\S]*?opacity: 0;[\s\S]*?pointer-events: none;/);
assert.match(styles, /\.crossword-sidebar \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\) auto;/);
assert.match(styles, /\.crossword-clue-columns \{[\s\S]*?overflow-y: auto;[\s\S]*?scrollbar-gutter: stable;/);
assert.match(styles, /\.crossword-menu-control \{[\s\S]*?min-height: 44px;/);
assert.match(styles, /@media \(max-width: 840px\) \{[\s\S]*?\.crossword-keyboard button \{[\s\S]*?min-height: 44px;/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1366px\) and \(max-height: 720px\) \{[\s\S]*?\.crossword-layout \{/);

console.log("Crossword tests passed");
