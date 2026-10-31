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

vm.runInContext(readFileSync(new URL("../assets/search-answers.js", import.meta.url), "utf8"), context);
const answers = context.window.bibleSearchAnswers;
assert.equal(search.matchVerifiedAnswer("Tell me who built the ark", answers).answer, "Noah");
assert.equal(search.matchVerifiedAnswer("Please help me find where Jesus was born", answers).answer, "Bethlehem");
assert.match(search.matchVerifiedAnswer("How did David defeat Goliath?", answers).answer, /sling/);
assert.match(search.matchVerifiedAnswer("Why did Noah build the ark?", answers).answer, /commanded/);
assert.equal(search.matchVerifiedAnswer("Where built the ark?", answers), null);
assert.equal(search.matchVerifiedAnswer("Who built the ark of the covenant?", answers), null);
assert.equal(search.matchVerifiedAnswer("Why is faith?", answers), null);
assert.equal(search.matchVerifiedAnswer("What is faith?", answers).reference, "Hebrews 11:1");
assert.equal(search.matchVerifiedAnswer("What does the Bible say about anxiety?", answers).reference, "Philippians 4:6-7");
assert.equal(search.matchVerifiedAnswer("Who constructed the boat?", answers).answer, "Noah");
assert.equal(search.matchVerifiedAnswer("Who won the World Series?", answers), null);
for (const entry of answers) {
  assert.ok(entry.question && entry.answer && entry.reference);
}
console.log("Independent Scripture answer library and intent checks passed");

const appSource = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const semanticStart = appSource.indexOf("async function searchSemanticBible(");
const semanticEnd = appSource.indexOf("\nasync function searchRemoteVersion(", semanticStart);
let requests = 0;
const semanticContext = vm.createContext({
  window: { BigScreenBibleSupabase: { anonKey: "test-public-key" } },
  supabaseFunctionUrl: () => "https://example.test/semantic-bible-search",
  AbortController, setTimeout, clearTimeout,
  referenceMatchesSearchScope: () => true,
  fetch: async () => { requests++; return { ok: true, json: async () => ({ results: [{ ref: "Philippians 4:6-7", text: "Do not be anxious", score: 0.8 }] }) }; },
});
vm.runInContext(appSource.slice(semanticStart, semanticEnd), semanticContext);
assert.equal((await semanticContext.searchSemanticBible("anxiety", {})).length, 1);
assert.equal((await semanticContext.searchSemanticBible("Tell me about faith", {})).length, 1);
assert.equal((await semanticContext.searchSemanticBible('"love one another"', { exactRequested: true })).length, 0);
semanticContext.window.bsbOffline = { active: true };
assert.equal((await semanticContext.searchSemanticBible("anxiety", {})).length, 0);
assert.equal(requests, 2);
console.log("Topic retrieval, exact phrase, and offline checks passed");

const wisdom = search.analyze("What does the Bible say about wisdom?");
assert.equal(wisdom.isTopical, true);
assert.deepEqual([...wisdom.coreTokens], ["wisdom"]);
assert.ok(search.scoreText("The LORD gives wisdom and understanding.", wisdom));
assert.equal(search.analyze("Who built the ark?").isTopical, false);
assert.deepEqual([...search.analyze("What did Jesus say on the cross?").coreTokens], ["jesus", "say", "cross"]);
assert.equal(search.analyze("Tell me about wisdom").isTopical, true);
assert.equal(search.analyze("What does Scripture teach about forgiveness?").isTopical, true);
const rankingStart = appSource.indexOf("function compareSearchResults(");
const rankingEnd = appSource.indexOf("\nfunction searchVersion(", rankingStart);
const rankingContext = vm.createContext({
  state: { versions: ["BSB"] }, translationCodes: ["BSB", "WEB"],
  uniqueList: (items) => [...new Set(items)],
});
vm.runInContext(appSource.slice(rankingStart, rankingEnd), rankingContext);
const keyword = { ref: "Proverbs 2:5-7", version: "BSB", score: 210, matchType: "Question match" };
const meaning = { ref: "Proverbs 2:6", version: "WEB", score: 186, matchType: "Meaning match" };
const criteria = { questionAnalysis: wisdom };
const rank = (items, c = criteria) => [...items].sort((a, b) => rankingContext.compareSearchResults(a, b, c));
assert.equal(rank([keyword, meaning])[0], meaning);
assert.equal(rank([keyword, meaning], { questionAnalysis: search.analyze("Who built the ark?") })[0], keyword);
assert.equal(rank([keyword, meaning], { exactRequested: true, questionAnalysis: wisdom })[0], keyword);
assert.equal(rankingContext.removeRedundantSemanticResults(rank([keyword, meaning])).length, 2);
const sameVersionKeyword = { ...keyword, version: "WEB" };
const deduped = rankingContext.removeRedundantSemanticResults(rank([sameVersionKeyword, meaning]));
assert.equal(deduped.length, 1);
assert.equal(deduped[0], meaning);
const grouped = rankingContext.groupSearchResults([keyword, { ...meaning, ref: keyword.ref }], "BSB");
assert.equal(grouped[0].version, "BSB");
assert.equal(grouped[0].hasMeaningMatch, true);
assert.equal(grouped[0].matches.length, 2);
assert.equal(rank([keyword, grouped[0]])[0], grouped[0]);
console.log("Topical wisdom ranking, factual fallback, exact phrases, overlap, and translation grouping passed");
