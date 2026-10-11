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
  const ctx = { window: {}, clearTimeout() {}, state, gameCountdownActive: false, Date: { now: () => now }, document: { querySelector() { return this.body; }, createElement: () => overlay, body: { append() {} }, getElementById() { return null; } }, startTriviaGame() { state.triviaGame = { type: 'trivia', questionStartedAt: now }; }, requestGameMusicRestart() {}, pauseTriviaGameForReference() {}, resumeTriviaGameAfterReference() {}, renderPreservingReaderScroll() { ctx.syncGameMusicPlayback(); }, playGameCountdownTone() {}, primeGameMusicAudio() { primed = true; }, ensureGameAudioContext() { return { resume: () => Promise.resolve() }; }, syncGameMusicPlayback() { playback = !!state.triviaGame; }, setTimeout(f, delay) { assert.equal(primed, true, 'Music must be unlocked before leaving the Start gesture with effects disabled'); now += delay; assert.ok(state.triviaGame.countdownStartedAt); assert.equal(playback, true, 'Music must play throughout the countdown'); if (cancelled) events['[data-countdown-cancel]'](); if (skip) events['[data-countdown-start]'](); f(); } };
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

const css = fs.readFileSync('assets/bible-app.css', 'utf8');
const countdownCss = css.slice(css.indexOf('.game-start-countdown {'));
assert.doesNotMatch(countdownCss, /var\(--bg\)/, 'Countdown color stops must not consume gradient theme backgrounds');
assert.match(countdownCss, /var\(--paper\)/);
const returnSource = source.slice(source.indexOf('function returnToTriviaGame()'), source.indexOf('function scheduleGameReferenceVerseFocus'));
assert.ok(returnSource.indexOf('requestGameMusicRestart();') < returnSource.indexOf('render();'), 'Returning from a reference must restart music before render');
