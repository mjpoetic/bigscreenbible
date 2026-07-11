import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = { globalThis: {} };
vm.createContext(context);
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

console.log("Question-aware search tests passed");
