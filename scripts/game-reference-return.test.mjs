import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

assert.equal(source.match(/id="openTriviaReference"/g)?.length, 4);
assert.match(source, /gameReferenceReturn: null/);

const openReference = extractFunction("openTriviaReference");
assert.match(openReference, /const gameScrollState = captureReaderScroll\(\)/);
assert.match(openReference, /pauseTriviaGameForReference\(game\)/);
assert.match(openReference, /state\.gameReferenceReturn = \{[\s\S]*?game,[\s\S]*?scrollState: gameScrollState/);
assert.match(openReference, /state\.mode = "reader"/);

const pauseTimer = extractFunction("pauseTriviaGameForReference");
assert.match(pauseTimer, /game\.type === "reference-rush"[\s\S]*?game\.timed[\s\S]*?game\.deadlineAt/);
assert.match(pauseTimer, /game\.type === "book-sprint" && game\.startedAt/);
assert.match(pauseTimer, /game\.referencePausedAt = pausedAt/);
assert.match(pauseTimer, /game\.referencePausedRemainingMs = Math\.max\(0, game\.deadlineAt - pausedAt\)/);

const resumeTimer = extractFunction("resumeTriviaGameAfterReference");
assert.match(resumeTimer, /game\.deadlineAt = Number\.isFinite\(pausedRemainingMs\)/);
assert.match(resumeTimer, /resumedAt \+ Math\.max\(0, pausedRemainingMs\)/);
assert.match(resumeTimer, /game\.startedAt \+= pausedDuration/);
assert.match(resumeTimer, /game\.referencePausedAt = null/);

const pauseTriviaGameForReference = Function(`return (${pauseTimer})`)();
const resumeTriviaGameAfterReference = Function(`return (${resumeTimer})`)();
const countdownGame = {
  type: "reference-rush",
  timed: true,
  deadlineAt: 10_000,
  complete: false,
  finishedAt: null,
};
assert.equal(pauseTriviaGameForReference(countdownGame, 4_000), true);
assert.equal(countdownGame.referencePausedRemainingMs, 6_000);
assert.equal(resumeTriviaGameAfterReference(countdownGame, 9_000), 5_000);
assert.equal(countdownGame.deadlineAt, 15_000);

const elapsedGame = {
  type: "book-sprint",
  startedAt: 1_000,
  complete: false,
  finishedAt: null,
};
assert.equal(pauseTriviaGameForReference(elapsedGame, 3_000), true);
assert.equal(resumeTriviaGameAfterReference(elapsedGame, 8_000), 5_000);
assert.equal(elapsedGame.startedAt, 6_000);

assert.match(extractFunction("bookSprintElapsedMs"), /game\.finishedAt \|\| game\.referencePausedAt \|\| Date\.now\(\)/);
assert.match(extractFunction("referenceRushRemainingMs"), /game\.finishedAt \|\| game\.referencePausedAt \|\| Date\.now\(\)/);
assert.match(extractFunction("scheduleBookSprintTimer"), /game\.referencePausedAt/);
assert.match(extractFunction("scheduleReferenceRushTimer"), /game\.referencePausedAt/);

const returnToGame = extractFunction("returnToTriviaGame");
assert.match(returnToGame, /resumeTriviaGameAfterReference\(target\.game\)/);
assert.match(returnToGame, /state\.gameReferenceReturn = null/);
assert.match(returnToGame, /state\.mode = "trivia"/);
assert.match(returnToGame, /restoreModeScrollAfterRender\(target\.scrollState\)/);

assert.match(extractFunction("switchMode"), /nextMode === "trivia" && currentGameReferenceReturn\(\)[\s\S]*?returnToTriviaGame\(\)/);
assert.match(extractFunction("bindReaderReturnButton"), /currentGameReferenceReturn\(\)[\s\S]*?returnToTriviaGame/);
assert.match(extractFunction("readerReturnButton"), /game-return-button[\s\S]*?Return to game/);
assert.match(extractFunction("presentationReturnButton"), /game-return-button[\s\S]*?Return to game/);
assert.doesNotMatch(extractFunction("scrollTriviaAnswerActionsIntoView"), /\bboundary\b/);

assert.match(styles, /\.reader-return-button\.game-return-button \{[\s\S]*?width: auto;[\s\S]*?font-weight: 850;/);
assert.match(styles, /@media \(max-width: 840px\) \{[\s\S]*?\.reader-return-button\.game-return-button \{[\s\S]*?min-width: 42px;/);

console.log("Game reference return tests passed");
