import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const browserGlobal = {};
const context = { globalThis: browserGlobal, window: browserGlobal };
vm.createContext(context);
vm.runInContext(readFileSync(new URL("../assets/trivia.js", import.meta.url), "utf8"), context);
vm.runInContext(readFileSync(new URL("../assets/search-query.js", import.meta.url), "utf8"), context);
const search = context.globalThis.BigScreenBibleSearchQuery;

const arkQuestion = search.analyze("What's the name of the person who built the ark?");
assert.equal(arkQuestion.isQuestion, true);
assert.deepEqual([...arkQuestion.coreTokens], ["built", "ark"]);
assert.ok(search.scoreText(
  "Then God said to Noah, Make for yourself an ark. This is how you are to build it.",
  arkQuestion,
));
assert.equal(search.scoreText("Paul and Silas prayed and sang hymns.", arkQuestion), null);

const phrase = search.analyze("love one another");
assert.equal(phrase.isQuestion, false);
assert.deepEqual([...phrase.coreTokens], ["love", "one", "another"]);

const locationQuestion = search.analyze("Where was Jesus born?");
assert.equal(locationQuestion.isQuestion, true);
assert.deepEqual([...locationQuestion.coreTokens], ["jesus", "born"]);

const verifiedQuestions = [
  {
    category: "People",
    question: "Who built the ark before the flood?",
    answer: "Noah",
    reference: "Genesis 6:14",
    explanation: "God instructed Noah to build the ark.",
  },
  {
    category: "People",
    question: "Who received the Ten Commandments from God on Mount Sinai?",
    answer: "Moses",
    reference: "Exodus 31:18",
    explanation: "Moses received the tablets of testimony from God.",
  },
  {
    category: "Bible Library",
    question: "How many books are in the Protestant Bible?",
    answer: "66",
    reference: "Genesis 1:1",
    explanation: "The Protestant Bible has 66 books.",
  },
];

const arkAnswer = search.matchVerifiedAnswer("What's the name of the person who built the ark?", verifiedQuestions);
assert.equal(arkAnswer.answer, "Noah");
assert.equal(arkAnswer.reference, "Genesis 6:13-22");
assert.equal(search.matchVerifiedAnswer("Who received the Ten Commandments?", verifiedQuestions).answer, "Moses");
assert.equal(search.matchVerifiedAnswer("What does the Bible say about anxiety?", verifiedQuestions), null);
assert.equal(search.matchVerifiedAnswer("love one another", verifiedQuestions), null);
assert.equal(search.matchVerifiedAnswer("Who built the ark of the covenant?", verifiedQuestions), null);
assert.equal(search.matchVerifiedAnswer("How many books are in the Protestant Bible?", verifiedQuestions), null);

const damascusAnswer = search.matchVerifiedAnswer("What happened on the road to Damascus?", verifiedQuestions);
assert.equal(damascusAnswer.answer, "Jesus appeared to Saul, who was blinded for three days.");
assert.equal(damascusAnswer.reference, "Acts 9:3-9");

const liveArkAnswer = search.matchVerifiedAnswer("Who built the ark?", context.window.bibleTriviaQuestions);
assert.equal(liveArkAnswer.answer, "Noah");
assert.equal(liveArkAnswer.reference, "Genesis 6:13-22");
assert.equal(search.matchVerifiedAnswer("Who defeated Goliath?", context.window.bibleTriviaQuestions).answer, "David");

console.log("Question-aware search tests passed");
