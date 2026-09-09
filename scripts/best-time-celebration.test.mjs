import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const section = source.slice(source.indexOf('let bestTimeCelebrationCleanup'), source.indexOf('function runPendingTriviaCelebration'));
let removed = false, retry = 0, menu = 0;
const buttons = [{ disabled: false, focus() {} }, { disabled: false }];
const events = {};
const status = {};
const dialog = { setAttribute() {}, addEventListener(name, fn) { events[name] = fn; }, showModal() {}, close() {}, remove() { removed = true; }, querySelectorAll() { return buttons; }, querySelector(selector) { return selector === 'button' ? buttons[0] : status; } };
const context = vm.createContext({ document: { createElement: () => dialog, body: { append() {} } }, window: { setInterval() { assert.fail("Record actions must not wait for a timer"); } }, icons: { timer: '' }, formatGameTime: () => '1:05', crosswordHintLimit: 3, playGameOutcomeSound() {}, gameMusicTrackKey: 'outcome:perfect', gameMusicAudio: { paused: false, ended: false }, state: {}, cleanupTriviaCelebration() { vm.runInContext('bestTimeCelebrationCleanup()', context); }, exitTriviaGame() { menu++; }, restartPuzzleAtDifficulty() { retry++; }, requestGameMusicRestart() {}, startTriviaGame() { retry++; } });
vm.runInContext(source.slice(source.indexOf("function isQuizPointsGame("), source.indexOf("function quizScoreKey(")), context);
vm.runInContext(source.slice(source.indexOf("function triviaRoundLength("), source.indexOf("function completeTriviaGame(")), context);
vm.runInContext(section, context);
for (const [type, flag, field] of [['reference-rush', 'referenceRushIsNewBest', 'referenceRushBest'], ['word-search', 'wordSearchIsNewBest', 'wordSearchBest'], ['crossword', 'crosswordIsNewBest', 'crosswordBest'], ['book-sprint', 'bookSprintNewBest', 'bookSprintBest'], ['hidden-word', 'hiddenWordIsNewBest', 'hiddenWordBest'], ['trivia', 'quizIsNewBest', 'quizBest'], ['who-said-it', 'quizIsNewBest', 'quizBest']]) {
  const best = { elapsedMs: 65000 };
  const game = { type, complete: true, [flag]: true, [field]: best };
  assert.equal(context.newBestTimeResult(game), best);
  assert.equal(context.newBestTimeResult({ ...game, [flag]: false }), null);
  assert.equal(context.newBestTimeResult({ ...game, complete: false }), null);
  assert.equal(context.newBestTimeResult({ ...game, timedOut: true }), null);
}
assert.equal(context.newBestTimeResult({ type: 'hidden-word', complete: true, hiddenWordIsNewBest: true }), null);
const game = { type: 'crossword', difficulty: 'Medium' };
context.showBestTimeCelebration(game, { elapsedMs: 65000, hintCount: 2 });
assert.match(dialog.innerHTML, /Assisted with 2 of 3/);
let prevented = false; events.cancel({ preventDefault() { prevented = true; } }); assert(prevented);
assert.doesNotMatch(dialog.innerHTML, /data-best-time-action="(?:retry|menu)" disabled/);
assert.equal(removed, false, 'The popup remains until user input');
assert.equal(context.gameMusicAudio.ended, false, 'Exercise dismissal while audio is still playing');
events.click({ target: { closest: () => ({ disabled: false, dataset: { bestTimeAction: 'retry' } }) } });
assert.equal(retry, 1); assert(removed);
context.showBestTimeCelebration({ type: 'book-sprint' }, { elapsedMs: 65000 });
events.click({ target: { closest: () => ({ disabled: false, dataset: { bestTimeAction: 'menu' } }) } });
assert.equal(menu, 1);
console.log('Best time celebration checks passed');

context.showBestTimeCelebration({ type: 'hidden-word', difficulty: 'Hard' }, { points: 8500 });
assert.match(dialog.innerHTML, /New High Score!/);
assert.match(dialog.innerHTML, /8,500 pts/);
assert.doesNotMatch(dialog.innerHTML, /New Best Time!/);
events.click({ target: { closest: () => ({ disabled: false, dataset: { bestTimeAction: 'retry' } }) } });
assert.equal(retry, 2);

vm.runInContext(source.slice(source.indexOf('function triviaRoundLength('), source.indexOf('function completeTriviaGame(')), context);
for (const type of ['trivia', 'who-said-it', 'book-sprint', 'reference-rush']) {
  const round = { type, difficulty: 'Easy', category: 'Gospels', timed: false };
  round[type === 'trivia' || type === 'who-said-it' ? 'questions' : 'puzzles'] = [{}, {}, {}, {}];
  context.showBestTimeCelebration(round, { points: 7000, elapsedMs: 65000 });
  const before = retry;
  events.click({ target: { closest: () => ({ dataset: { bestTimeAction: 'retry' } }) } });
  assert.equal(retry, before + 1);
  assert.equal(context.state.triviaCount, 4);
  assert.equal(context.state.triviaDifficulty, 'Easy');
  assert.equal(context.state.triviaGameType, type);
}

for (const [score, tier] of [[5,'perfect'], [4,'strong'], [3,'steady'], [2,'retry'], [0,'retry']]) {
  const round = {type:'who-said-it', complete:true, score, points:score * 1000, questions:Array(5).fill({})};
  context.showBestTimeCelebration(round, null);
  assert.equal(dialog.className, `best-time-celebration result-${tier}`);
  assert.match(dialog.innerHTML, /data-best-time-action="retry"/);
  assert.match(dialog.innerHTML, new RegExp(`${score * 20}% accuracy`));
  if (score === 5) assert.match(dialog.innerHTML, /result-confetti/);
}
for (const type of ['trivia','who-said-it','hidden-word','verse-order','reference-rush','book-sprint','word-search','crossword']) {
  const round = {type, complete:true, score:1, questions:[{}], words:[{}], entries:[{}]};
  context.showBestTimeCelebration(round, null);
  assert.match(dialog.innerHTML, /Games menu/);
}
