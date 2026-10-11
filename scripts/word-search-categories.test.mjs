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
let failure = '';
const ctx = vm.createContext({
  state: { triviaGameType: 'word-search', wordSearchMode: 'categories', wordSearchCategory: 'prophets', wordSearchTestament: 'all', puzzlePassageSource: 'custom', puzzleCustomReference: 'invalid', triviaDifficulty: 'Medium' },
  triviaRandomSource: () => { seed = seed * 48271 % 2147483647; return seed / 2147483647; },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  wordSearchBestStorageKey: 'lw_word_search_bests',
  wordSearchVersion: () => 'BSB',
  orderedWordSearchPassages() { throw Error('Category mode must not load passages'); },
  recordWordSearchPassage() { throw Error('Category mode must not change passage history'); },
  reportPuzzleStartFailure: message => { failure = message; },
  renderPreservingReaderScroll() {}, scheduleCloudSync() {}, primeWordSearchAudio() {},
  resetPuzzleCustomWordChoices() {}, persistPuzzleCreatorPreferences() {}, requestGameMusicRestart() {},
  formatGameTime: ms => `${ms}ms`, formatCountdownTime: ms => `${ms}ms`, icons: {},
  escapeHtml: value => String(value).replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`),
  triviaExitControl: () => '', puzzleRestartDialog: () => '',
  wordSearchPassageMarkup() { throw Error('Category mode must not show a passage'); },
});
vm.runInContext(source.slice(source.indexOf('const bookDefinitions'), source.indexOf('const oldTestamentBooks')), ctx);
vm.runInContext(source.slice(source.indexOf('const wordSearchCategoryCatalog'), source.indexOf('function wordSearchCategories')), ctx);
for (const name of ['wordSearchCategories', 'normalizedWordSearchCategory', 'wordSearchCategoryLabel', 'wordSearchCategoryEntries', 'wordSearchCategoryConfig', 'wordSearchBestKey', 'wordSearchCategoryReviewMarkup', 'normalizeWordSearchWord', 'wordSearchDifficultyConfig', 'wordSearchDifficultyDescription', 'wordSearchDifficulties', 'wordSearchDirections', 'wordSearchDiagonalTarget', 'createWordSearchGrid', 'shuffleItems', 'puzzleBestKey', 'puzzleCreatorEvaluation', 'startWordSearchGame', 'savedWordSearchBests', 'savedWordSearchBest', 'recordWordSearchBest', 'wordSearchElapsedMs', 'wordSearchCellKey', 'wordSearchFoundCellKeys', 'wordSearchFoundOutlines', 'wordSearchGameView', 'restartPuzzleAtDifficulty']) vm.runInContext(extract(name), ctx);
const bibleCtx = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL('../assets/bibles/BSB.js', import.meta.url), 'utf8'), bibleCtx);
const chapters = bibleCtx.window.BIGSCREEN_BIBLE_BSB.chapters;
assert.equal(ctx.wordSearchCategories().length, 9);
assert.equal(ctx.normalizedWordSearchCategory('obsolete'), 'prophets');
let maximumMs = 0;
for (const { value: category } of ctx.wordSearchCategories().filter(c => c.value !== "random")) {
  for (const testament of category === 'books' ? ['all', 'ot', 'nt'] : ['all']) {
    const entries = ctx.wordSearchCategoryEntries(category, testament);
    assert.ok(entries.length >= 12);
    assert.equal(new Set(entries.map(e => e.word)).size, entries.length, 'Unique grid words');
    for (const entry of entries) {
      assert.match(entry.word, /^[A-Z]{3,20}$/);
      assert.ok(entry.fact.length > 15);
      const [, chapter, first, last] = entry.reference.match(/^(.+ \d+):(\d+)(?:-(\d+))?$/) || [];
      assert.ok(chapters[chapter], `${entry.label}: ${entry.reference}`);
      assert.ok(chapters[chapter].verses.some(v => v.n === Number(first)));
      assert.ok(chapters[chapter].verses.some(v => v.n === Number(last || first)));
    }
    for (const difficulty of ctx.wordSearchDifficulties()) {
      const sets = new Set();
      for (let run = 1; run <= 20; run++) {
        seed = run * 103;
        Object.assign(ctx.state, { wordSearchMode: 'categories', wordSearchCategory: category, wordSearchTestament: testament, triviaDifficulty: difficulty });
        const start = performance.now();
        ctx.startWordSearchGame({ render: false });
        maximumMs = Math.max(maximumMs, performance.now() - start);
        assert.equal(failure, '');
        const game = ctx.state.triviaGame;
        assert.equal(game.customPassage, false, 'Invalid saved custom passage does not block categories');
        assert.equal(game.reference, '');
        assert.equal(game.words.length, ctx.wordSearchDifficultyConfig(difficulty).wordCount);
        assert.equal(game.categoryEntries.length, game.words.length);
        assert.equal(game.size, ctx.wordSearchCategoryConfig(difficulty, category, testament).size);
        sets.add(game.words.join(','));
        for (const placement of game.placements) {
          assert.ok(game.categoryEntries.some(e => e.word === placement.word));
          placement.cells.forEach((cell, i) => assert.equal(game.cells[cell.row][cell.column], placement.word[i]));
        }
      }
      assert.ok(sets.size >= 15, `${category}/${testament}/${difficulty} replay variety`);
    }
  }
}
assert.equal(ctx.wordSearchCategoryEntries('books', 'ot').length, 39);
assert.equal(ctx.wordSearchCategoryEntries('books', 'nt').length, 27);
assert.equal(ctx.wordSearchCategoryEntries('books').find(e => e.label === '1 John').word, 'FIRSTJOHN');
const game = ctx.state.triviaGame;
const playMarkup = ctx.wordSearchGameView(game);
assert.doesNotMatch(playMarkup, /word-search-category-review|data-word-search-reference/);
game.complete = true;
game.foundWords = [...game.words];
game.finishedAt = game.startedAt + 3000;
const completedMarkup = ctx.wordSearchGameView(game);
assert.match(completedMarkup, /word-search-category-review/);
assert.doesNotMatch(completedMarkup, /id="openTriviaReference"|Open passage/);
assert.equal((completedMarkup.match(/data-word-search-reference=/g) || []).length, game.words.length);
for (const entry of game.categoryEntries) assert.ok(completedMarkup.includes(entry.label));
ctx.recordWordSearchBest(game);
assert.equal(ctx.savedWordSearchBest(game.difficulty, game).elapsedMs, 3000);
assert.equal(ctx.savedWordSearchBest(game.difficulty), null, 'Scripture records stay separate');
assert.equal(ctx.savedWordSearchBest(game.difficulty, { ...game, wordSearchTestament: 'ot' }), null);
assert.equal(ctx.savedWordSearchBest(game.difficulty, { ...game, wordSearchCategory: 'prophets' }), null);
assert.equal(ctx.wordSearchBestKey('Easy'), 'Easy');
assert.equal(ctx.wordSearchBestKey('Easy', { customPassage: true, version: 'BSB', reference: 'Psalm 23:1-6' }), 'custom:BSB:Psalm 23:1-6:Easy');
ctx.state.wordSearchMode = 'scripture';
ctx.state.wordSearchCategory = 'prophets';
ctx.restartPuzzleAtDifficulty('Easy');
assert.equal(ctx.state.triviaGame.wordSearchMode, 'categories');
assert.equal(ctx.state.triviaGame.wordSearchCategory, 'books');
assert.equal(ctx.state.triviaGame.wordSearchTestament, 'nt');
assert.equal(ctx.state.triviaGame.difficulty, 'Easy');
console.log(`Word Search category tests passed (800 generated puzzles; maximum ${maximumMs.toFixed(1)}ms)`);

const randomCategories = new Set();
for (let run = 1; run <= 100; run++) {
  seed = run * 3001;
  Object.assign(ctx.state, { wordSearchMode: 'categories', wordSearchCategory: 'random', wordSearchTestament: 'all', triviaDifficulty: 'Medium' });
  ctx.startWordSearchGame({ render: false });
  const randomGame = ctx.state.triviaGame;
  assert.equal(randomGame.wordSearchCategoryChoice, 'random');
  assert.notEqual(randomGame.wordSearchCategory, 'random');
  assert.equal(randomGame.referenceLabel, ctx.wordSearchCategoryLabel(randomGame.wordSearchCategory));
  assert.ok(ctx.wordSearchBestKey('Medium', randomGame).startsWith(`category:${randomGame.wordSearchCategory}:`));
  randomCategories.add(randomGame.wordSearchCategory);
}
assert.equal(randomCategories.size, 8, 'Random chooses every theme');
ctx.restartPuzzleAtDifficulty('Hard');
assert.equal(ctx.state.wordSearchCategory, 'random', 'New puzzle keeps random selection');
assert.equal(ctx.state.triviaGame.wordSearchCategoryChoice, 'random');
console.log('Random categories passed: all eight themes, actual-category records, random restart');

let openedReference = '';
Object.assign(ctx, {
  captureReaderScroll: () => ({ top: 12 }),
  setReferenceFromString: ref => { openedReference = ref; return true; },
  pauseTriviaGameForReference() {}, recordHistory() {}, render() {}, scheduleGameReferenceVerseFocus() {},
  showToast: message => { throw Error(message); },
});
vm.runInContext(extract('openTriviaReference'), ctx);
const retainedGame = ctx.state.triviaGame;
ctx.openTriviaReference('Habakkuk 1:2-4');
assert.equal(openedReference, 'Habakkuk 1:2-4');
assert.equal(ctx.state.mode, 'reader');
assert.equal(ctx.state.gameReferenceReturn.game, retainedGame);
console.log('Category reference navigation preserves the game for return');
