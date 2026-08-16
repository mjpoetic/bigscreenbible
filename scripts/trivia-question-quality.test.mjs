import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const appSource = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = appSource.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const browserGlobal = {};
const triviaContext = { window: browserGlobal };
vm.createContext(triviaContext);
vm.runInContext(readFileSync(new URL("../assets/trivia.js", import.meta.url), "utf8"), triviaContext);

const qualityContext = Function(`
  ${extractFunction("normalizedTriviaText")}
  ${extractFunction("triviaQuestionIsPlayable")}
  return { triviaQuestionIsPlayable };
`)();

const sourceQuestions = browserGlobal.bibleTriviaQuestions;
const referenceChoicePrompt = /^Which reference fits this clue:/i;
const sourceReferenceQuestions = sourceQuestions.filter((question) => referenceChoicePrompt.test(question.question));
const playableQuestions = sourceQuestions.filter(qualityContext.triviaQuestionIsPlayable);

assert.ok(sourceReferenceQuestions.length > 0, "Fixture must include generated reference-choice questions");
assert.equal(playableQuestions.some((question) => referenceChoicePrompt.test(question.question)), false);
assert.equal(qualityContext.triviaQuestionIsPlayable({
  question: "Which reference fits this clue: the Old Testament book count",
  choices: ["Matthew 28:1", "Matthew 1:1", "Genesis 1:1", "Romans 1:1"],
  answer: "Genesis 1:1",
}), false);
assert.ok(playableQuestions.length >= 250, "Conventional trivia pool should remain well populated");
assert.ok(playableQuestions.some((question) => question.question === "Who built the ark before the flood?"));

console.log("Trivia question quality tests passed");
