const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('assets/bible-app.js', 'utf8');
const fn = source.slice(source.indexOf('async function startGameCountdown()'), source.indexOf('function startTriviaGame('));
async function run(cancelled, skip = false) {
  let now = 10000, removed = false, labels = [], events = {}, primed = false, playback = false;
  const label = { set textContent(value) { labels.push(value); } };
  const overlay = { dataset: {}, setAttribute() {}, querySelector(s) { return s === 'strong' ? label : { addEventListener(n, f) { events[s] = f; } }; }, addEventListener(n, f) { events[n] = f; }, showModal() {}, close() {}, remove() { removed = true; } };
  const state = { mode: 'trivia', wordSearchSounds: false, gameMusicEnabled: true };
  const ctx = { window: {}, clearTimeout() {}, state, gameCountdownActive: false, Date: { now: () => now }, document: { createElement: () => overlay, body: { append() {} }, getElementById() { return null; } }, startTriviaGame() { state.triviaGame = { type: 'trivia', questionStartedAt: now }; }, pauseTriviaGameForReference() {}, resumeTriviaGameAfterReference() {}, renderPreservingReaderScroll() {}, playGameCountdownTone() {}, primeGameMusicAudio() { primed = true; }, ensureGameAudioContext() { return { resume: () => Promise.resolve() }; }, syncGameMusicPlayback() { assert.equal(ctx.gameCountdownActive, false); playback = !!state.triviaGame; }, setTimeout(f, delay) { assert.equal(primed, true, 'Music must be unlocked before leaving the Start gesture with effects disabled'); now += delay; assert.ok(state.triviaGame.countdownStartedAt); if (cancelled) events['[data-countdown-cancel]'](); if (skip) events['[data-countdown-start]'](); f(); } };
  vm.createContext(ctx);
  vm.runInContext(fn, ctx);
  await ctx.startGameCountdown();
  assert.equal(removed, true);
  assert.equal(ctx.gameCountdownActive, false);
  if (cancelled) { assert.equal(state.triviaGame, null); assert.equal(playback, false); }
  else { assert.equal(playback, true, 'Music must synchronize after countdown is released'); assert.deepEqual(labels, skip ? ['3', 'Go!'] : ['3', '2', '1', 'Go!']); assert.equal(state.triviaGame.countdownStartedAt, undefined); assert.equal(state.triviaGame.questionStartedAt, now); }
}
(async () => { await run(false); await run(true); await run(false, true); console.log('Countdown music unlock, playback handoff, timing and cancellation passed'); })();

for (const name of ['wordSearchElapsedMs', 'crosswordElapsedMs', 'bookSprintElapsedMs', 'verseOrderElapsedMs']) {
  const start = source.indexOf('function ' + name + '(');
  const end = source.indexOf('\n}', start) + 2;
  const context = { state: {}, Date: { now: () => 20000 } };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  assert.equal(context[name]({ countdownStartedAt: 10000, startedAt: 10000, puzzleStartedAt: 10000 }), 0, name + ' must stay at zero during countdown');
}
