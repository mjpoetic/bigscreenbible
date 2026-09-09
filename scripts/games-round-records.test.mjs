import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const storage = new Map();
let exits = 0;
const context = vm.createContext({ scheduleCloudSync() {},
  state: {mode: 'trivia'}, exitTriviaGame() { exits++; },
  localStorage: {getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)},
});
for (const name of ['referenceRushBestKey','savedReferenceRushBests','savedReferenceRushBest','recordReferenceRushBest','handleGamesEscapeKeydown']) {
  const start = source.indexOf('function ' + name + '(');
  vm.runInContext(source.slice(start, source.indexOf('\nfunction ', start + 1)), context);
}
const round = (elapsedMs, extra = {}) => ({
  type: 'reference-rush', difficulty: 'Easy', timed: true,
  puzzles: [{},{},{},{}], score: 4, startedAt: 1000, finishedAt: elapsedMs + 1000, ...extra,
});
const first = round(20000);
context.recordReferenceRushBest(first);
assert.equal(first.referenceRushIsNewBest, true);
context.recordReferenceRushBest(round(25000));
assert.equal(context.savedReferenceRushBest('Easy', 4, true).elapsedMs, 20000);
const faster = round(15000);
context.recordReferenceRushBest(faster);
assert.equal(faster.referenceRushIsNewBest, true);
context.recordReferenceRushBest(round(10000, {score: 3}));
context.recordReferenceRushBest(round(10000, {timedOut: true}));
assert.equal(context.savedReferenceRushBest('Easy', 4, true).elapsedMs, 15000);
assert.equal(context.savedReferenceRushBest('Hard', 4, true), null);
assert.equal(context.savedReferenceRushBest('Easy', 8, true), null);
assert.equal(context.savedReferenceRushBest('Easy', 4, false), null);
context.recordReferenceRushBest(round(30000, {timed: false}));
assert.equal(context.savedReferenceRushBest('Easy', 4, false).elapsedMs, 30000);
const event = {key: 'Escape', preventDefault() {}, stopImmediatePropagation() {}};
context.handleGamesEscapeKeydown(event);
assert.equal(exits, 1);
context.handleGamesEscapeKeydown({...event, repeat: true});
context.handleGamesEscapeKeydown({...event, ctrlKey: true});
context.state.mode = 'reader';
context.handleGamesEscapeKeydown(event);
assert.equal(exits, 1);
console.log('Reference Rush record eligibility, persistence, settings isolation and Games Escape passed.');

let now = 1000;
context.Date = class extends Date { static now() { return now; } };
context.renderPreservingReaderScroll = () => {};
context.renderTriviaAnswerAndScroll = () => {};
context.isVerseOrderSelectionCorrect = () => true;
context.completeTriviaGame = game => { context.recordVerseOrderBest(game); game.complete = true; };
for (const name of ['verseOrderElapsedMs', 'savedVerseOrderBests', 'verseOrderBestKey', 'recordVerseOrderBest', 'currentVerseOrderPuzzle', 'checkVerseOrder', 'nextVerseOrderPuzzle']) {
  const start = source.indexOf('function ' + name + '(');
  vm.runInContext(source.slice(start, source.indexOf('\nfunction ', start + 1)), context);
}
const verseRound = elapsedMs => ({type: 'verse-order', version: 'BSB', elapsedMs, score: 2,
  puzzles: Array.from({length: 2}, () => ({answered: true, correct: true})), complete: false});
const verseFirst = verseRound(10000);
context.recordVerseOrderBest(verseFirst);
assert.equal(verseFirst.verseOrderIsNewBest, true);
const tie = verseRound(10000);
context.recordVerseOrderBest(tie);
assert.equal(tie.verseOrderIsNewBest, false);
context.recordVerseOrderBest({...verseRound(5000), score: 1});
context.recordVerseOrderBest({...verseRound(5000), puzzles: [{answered:false},{answered:false}]});
assert.equal(context.savedVerseOrderBests()['BSB:2'].elapsedMs, 10000);
context.recordVerseOrderBest({...verseRound(5000), version: 'KJV'});
assert.equal(context.savedVerseOrderBests()['KJV:2'].elapsedMs, 5000);
assert.equal(context.savedVerseOrderBests()['BSB:2'].elapsedMs, 10000);
const game = {type: 'verse-order', version: 'BSB', elapsedMs: 0, puzzleStartedAt: now,
  index: 0, score: 0, puzzles: Array.from({length: 2}, () => ({selectedIds: ['a'], segments: [{id:'a'}]}))};
context.state.triviaGame = game;
now = 4000;
context.checkVerseOrder();
assert.equal(game.elapsedMs, 3000);
now = 64000;
assert.equal(context.verseOrderElapsedMs(game), 3000, 'Answer reading must not count');
context.checkVerseOrder();
assert.equal(game.score, 1, 'Duplicate checking must not add points or time');
context.nextVerseOrderPuzzle();
now = 66000;
context.checkVerseOrder();
assert.equal(game.elapsedMs, 5000);
context.nextVerseOrderPuzzle();
assert.equal(game.complete, true);
assert.equal(game.verseOrderIsNewBest, true);
assert.equal(context.savedVerseOrderBests()['BSB:2'].elapsedMs, 5000);
now = 99000;
assert.equal(context.verseOrderElapsedMs(game), 5000);
console.log('Verse Order timing, answer pauses, eligibility, ties and translation isolation passed.');
