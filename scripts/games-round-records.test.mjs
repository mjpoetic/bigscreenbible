import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const storage = new Map();
let exits = 0;
const context = vm.createContext({
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
