import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end);
}
const storage = new Map();
const ctx = vm.createContext({ scheduleCloudSync() {}, state: {}, localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v) }, renderTriviaAnswerAndScroll() {}, renderPreservingReaderScroll() {}, shuffleItems: a => a });
for (const name of ['compareGamePoints','perfectTimeBonus','isQuizPointsGame','quizScoreKey','savedQuizScores','awardQuizPoints','recordQuizScore','answerTriviaQuestion','answerWhoSaidIt','triviaHintOptions','availableRoundHintOptions','useTriviaHint']) vm.runInContext(extract(name), ctx);
function game(type = 'trivia', count = 8) {
  return {type, difficulty: 'Medium', category: 'All', index: 0, selectedAnswer: null, score: 0, points: 0, questions: Array.from({length: count}, () => ({answer: 'A', choices: ['A','B','C','D'], selectedAnswer: null, eliminatedChoices: []}))};
}
for (const type of ['trivia','who-said-it']) {
  const g = game(type); ctx.state.triviaGame = g;
  for (let i=0; i<8; i++) {
    g.index = i; g.selectedAnswer = null;
    const answer = type === 'trivia' ? ctx.answerTriviaQuestion : ctx.answerWhoSaidIt;
    answer('invalid'); assert.equal(g.questions[i].points, undefined);
    answer('A'); const before = g.points; answer('A'); assert.equal(g.points, before);
  }
  assert.equal(g.points, 10500); assert.equal(g.bestStreak, 8);
  ctx.recordQuizScore(g); assert.equal(g.points, 11500);
  ctx.recordQuizScore(g); assert.equal(g.points, 11500);
  assert.equal(ctx.savedQuizScores(g).length, 1);
  assert.equal(ctx.savedQuizScores({...g, difficulty:'Hard'}).length, 0);
  assert.equal(ctx.savedQuizScores({...g, questions:[{}]}).length, 0);
}
const g = game('trivia',3); ctx.state.triviaGame = g;
ctx.answerTriviaQuestion('A');
g.index=1; g.selectedAnswer=null; ctx.useTriviaHint('eliminate'); ctx.useTriviaHint('eliminate');
assert.equal(g.points,900); assert.equal(g.streak,0);
ctx.answerTriviaQuestion('A'); assert.equal(g.points,1900);
g.index=2; g.selectedAnswer=null; ctx.answerTriviaQuestion('A'); ctx.recordQuizScore(g);
assert.equal(g.points,2900); assert.equal(g.perfectBonus,0);
const wrong = game('who-said-it',3); ctx.state.triviaGame = wrong;
ctx.answerWhoSaidIt('A'); wrong.index=1; ctx.answerWhoSaidIt('B'); wrong.index=2; ctx.answerWhoSaidIt('A');
assert.equal(wrong.points,2000); assert.equal(wrong.bestStreak,1);
for (let i=0;i<7;i++) { const g=game('trivia',1); g.questions[0].points=i*100; g.points=i*100; ctx.recordQuizScore(g); }
assert.deepEqual(Array.from(ctx.savedQuizScores(game('trivia',1)), e=>e.points), [600,500,400,300,200]);
const tied=game('trivia',1); tied.questions[0].points=600; tied.points=600; ctx.recordQuizScore(tied); assert.equal(tied.quizIsNewBest,false);
assert.equal(ctx.savedQuizScores({...tied,category:'Gospels'}).length,0);
const incomplete=game(); ctx.recordQuizScore(incomplete); assert.equal(incomplete.quizScoreRecorded,undefined);
console.log('Quiz scoring: awards, streaks, hints, perfect bonus, duplicate protection, persistence and settings isolation passed.');

for (const elapsedMs of [30000, 40000, 60000, 60001]) {
  const g = game('who-said-it', 5);
  g.score = 5; g.points = 6000;
  g.questions.forEach(q => { q.points = 1000; q.elapsedMs = elapsedMs / 5; });
  ctx.recordQuizScore(g);
  assert.equal(g.points % 10, 0);
  assert.equal(g.timeBonus, ctx.perfectTimeBonus(elapsedMs, 60000));
  assert.equal(g.elapsedMs, elapsedMs);
}
assert(ctx.compareGamePoints({points: 7500, elapsedMs: 59000}, {points: 7500, elapsedMs: 60000}) < 0);
assert.equal(ctx.perfectTimeBonus(30000, 60000), 660);
assert.equal(ctx.perfectTimeBonus(40000, 60000), 600);
const hinted = game('trivia', 1); hinted.score = 1; hinted.questions[0] = {points:1000, elapsedMs:1000, hintUsed:'letter'};
ctx.recordQuizScore(hinted); assert.equal(hinted.timeBonus, 0);
const timed = game('who-said-it', 1); timed.questionStartedAt = Date.now() - 1000;
ctx.state.triviaGame = timed; ctx.answerWhoSaidIt('A');
const elapsed = timed.questions[0].elapsedMs; assert(elapsed >= 1000);
ctx.recordQuizScore(timed); assert.equal(timed.elapsedMs, elapsed, 'Feedback time is excluded');
