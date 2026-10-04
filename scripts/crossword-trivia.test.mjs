import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end < 0 ? source.length : end);
}
const storage = new Map();
let seed = 1;
const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
const ctx = vm.createContext({
  state: { triviaGameType: 'crossword', crosswordMode: 'trivia', triviaDifficulty: 'Medium', puzzlePassageSource: 'custom' },
  triviaRandomSource: random,
  shuffleItems(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  crosswordBestStorageKey: 'lw_crossword_bests', crosswordHintLimit: 3,
  wordSearchVersion: () => 'BSB',
  // Trivia must not depend on the saved custom passage or loaded translations.
  puzzleCreatorEvaluation: () => ({ custom: false, valid: true }),
  orderedWordSearchPassages() { throw new Error('Trivia must not load Scripture passage candidates'); },
  reportPuzzleStartFailure(message) { throw new Error(message); },
  recordWordSearchPassage() { throw new Error('Trivia must not change passage history'); },
  persistPuzzleCreatorPreferences() {}, resetPuzzleCustomWordChoices() {}, scheduleCloudSync() {}, requestGameMusicRestart() {},
  renderPreservingReaderScroll() {}, updateCrosswordDom() {},
  completeTriviaGame: game => { game.complete = true; },
  formatGameTime: ms => `${ms}ms`,
  escapeHtml: text => String(text),
  icons: {},
  wordSearchPassageMarkup() { throw new Error('Trivia completion must not show a single passage'); },
});
const catalogStart = source.indexOf('const crosswordTriviaCatalog = [');
const catalogEnd = source.indexOf('\n];', catalogStart) + 3;
vm.runInContext(source.slice(catalogStart, catalogEnd) + '\nglobalThis.catalog = crosswordTriviaCatalog;', ctx);
for (const name of ['escapeRegExp', 'normalizeWordSearchWord', 'wordSearchCellKey', 'crosswordCanPlaceWord', 'crosswordPlaceWord', 'crosswordPlacementCandidates', 'finalizeCrosswordGrid', 'crosswordVersesForWord', 'crosswordVerseCapacity', 'createCrosswordGrid', 'crosswordDifficultyConfig', 'crosswordTriviaDifficultyConfig', 'crosswordDifficulties', 'crosswordDifficultyDescription', 'crosswordTriviaGrid', 'puzzleBestKey', 'crosswordBestKey', 'crosswordElapsedMs', 'savedCrosswordBests', 'savedCrosswordBest', 'recordCrosswordBest', 'startCrosswordGame', 'restartPuzzleAtDifficulty', 'crosswordEntryById', 'crosswordEntryLabel', 'crosswordHintsRemaining', 'formatCrosswordBestTime', 'puzzleRestartDialog', 'crosswordGameView', 'completeCrosswordEntry']) vm.runInContext(extract(name), ctx);
assert.ok(ctx.catalog.length >= 80);
assert.equal(new Set(ctx.catalog.map(item => item.answer)).size, ctx.catalog.length);
for (const item of ctx.catalog) {
  assert.match(item.answer, /^[A-Z]{3,13}$/);
  assert.ok(item.clue.length >= 12 && item.reference);
  assert.doesNotMatch(item.clue, new RegExp(`\\b${item.answer}\\b`, 'i'));
}
assert.equal(ctx.catalog.find(item => item.answer === 'EVE').clue, 'The first woman.');
let maximumMs = 0;
for (const difficulty of ['Easy', 'Medium', 'Hard', 'Expert']) {
  const sets = new Set();
  for (let run = 1; run <= 30; run++) {
    seed = run * 103;
    ctx.state.triviaDifficulty = difficulty;
    const start = performance.now();
    ctx.startCrosswordGame({ render: false });
    maximumMs = Math.max(maximumMs, performance.now() - start);
    const game = ctx.state.triviaGame;
    assert.equal(game.crosswordMode, 'trivia');
    assert.equal(game.reference, '');
    assert.equal(game.customPassage, false);
    assert.equal(game.entries.length, ctx.crosswordTriviaDifficultyConfig(difficulty).entryCount);
    sets.add(game.entries.map(entry => entry.word).sort().join(','));
    for (const entry of game.entries) {
      assert.ok(entry.reference && entry.clue);
      assert.equal(entry.cells.length, entry.word.length);
      entry.cells.forEach((cell, i) => assert.equal(game.cells[cell.row][cell.column], entry.word[i]));
      for (const other of game.entries) assert.doesNotMatch(entry.clue, new RegExp(`\\b${other.word}\\b`, 'i'), `${entry.word} clue exposes ${other.word}`);
    }
    const reached = new Set([game.entries[0].id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const entry of game.entries) {
        if (reached.has(entry.id)) continue;
        if (game.entries.some(other => reached.has(other.id) && other.cells.some(a => entry.cells.some(b => a.row === b.row && a.column === b.column)))) { reached.add(entry.id); changed = true; }
      }
    }
    assert.equal(reached.size, game.entries.length, 'All answers must connect through crossings');
  }
  assert.ok(sets.size >= 25, `${difficulty} needs varied answer sets`);
}
// Restart derives mode from the active round, not a subsequently changed preference.
ctx.state.crosswordMode = 'scripture';
ctx.restartPuzzleAtDifficulty('Hard');
assert.equal(ctx.state.crosswordMode, 'trivia');
assert.equal(ctx.state.triviaGame.entries.length, 21);
// Solve the actual generated board through the normal completion path.
const game = ctx.state.triviaGame;
for (const entry of game.entries) entry.cells.forEach((cell, i) => { game.answers[`${cell.row}:${cell.column}`] = entry.word[i]; });
for (const entry of game.entries) ctx.completeCrosswordEntry(game, entry);
assert.equal(game.complete, true);
assert.equal(game.score, 21);
const records = JSON.parse(storage.get('lw_crossword_bests'));
assert.ok(records['trivia:Hard']);
assert.equal(ctx.savedCrosswordBest('Hard'), null);
assert.equal(ctx.savedCrosswordBest('Hard', { crosswordMode: 'trivia' }).difficulty, 'Hard');
assert.equal(ctx.crosswordBestKey('Medium'), 'Medium');
assert.equal(ctx.crosswordBestKey('Medium', { customPassage: true, reference: 'Psalm 23:1-6', version: 'BSB' }), 'custom:BSB:Psalm 23:1-6:Medium');
const completedMarkup = ctx.crosswordGameView(game);
assert.match(completedMarkup, /Answers and references/);
assert.match(completedMarkup, /crossword-trivia-review/);
assert.doesNotMatch(completedMarkup, /id="openTriviaReference"/);
for (const entry of game.entries) assert.ok(completedMarkup.includes(entry.reference));
game.complete = false;
const playMarkup = ctx.crosswordGameView(game);
assert.doesNotMatch(playMarkup, /crossword-trivia-review/);
for (const entry of game.entries) assert.ok(!playMarkup.includes(entry.reference));
assert.doesNotMatch(extract('startWordSearchGame'), /triviaMode/);
console.log(`Bible Trivia Crossword passed: 120 seeded puzzles, connected crossings, no clue leaks, restart, completion, isolated records. Slowest generation ${Math.round(maximumMs)} ms.`);

// Record merging retains old Scripture buckets and the new trivia bucket.
vm.runInContext(extract('gameRecordStorageKeys'), ctx);
vm.runInContext(extract('mergeGameRecords'), ctx);
const merged = ctx.mergeGameRecords(
  { lw_crossword_bests: { Medium: { elapsedMs: 2000 }, 'trivia:Medium': { elapsedMs: 4000 } } },
  { lw_crossword_bests: { 'trivia:Medium': { elapsedMs: 3000 } } },
);
assert.equal(merged.lw_crossword_bests.Medium.elapsedMs, 2000);
assert.equal(merged.lw_crossword_bests['trivia:Medium'].elapsedMs, 3000);
vm.runInContext(extract('puzzleCreatorEvaluation'), ctx);
ctx.state.crosswordMode = 'trivia';
ctx.state.puzzlePassageSource = 'custom';
const evaluation = ctx.puzzleCreatorEvaluation('crossword', 'Expert');
assert.equal(evaluation.valid, true);
assert.equal(evaluation.custom, false, 'Saved Scripture passage never blocks trivia');
console.log(`Standalone clue catalog: ${ctx.catalog.length} entries; synced records retain both modes.`);
