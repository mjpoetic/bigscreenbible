import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

function extractFunction(name) {
  const patterns = [`function ${name}(`, `async function ${name}(`];
  const start = patterns
    .map((pattern) => source.indexOf(pattern))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];
  assert.notEqual(start, undefined, `Missing ${name} in bible-app.js`);
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

const shareCalls = [];
const copiedText = [];
const context = {
  URL,
  document: {
    querySelector(selector) {
      assert.equal(selector, 'link[rel="canonical"]');
      return { href: "https://bigscreenbible.com/" };
    },
  },
  navigator: {
    async share(payload) {
      shareCalls.push(payload);
    },
  },
  state: {
    isVerseOfDayActive: false,
    mode: "reader",
    reference: "John 3",
    selectedVerses: [16, 17],
    verse: 16,
    verseOfDayItem: null,
    versions: ["NASB2020"],
  },
  translationDisplayCode(version) {
    return version === "NASB2020" ? "NASB" : version;
  },
  currentChapter() {
    return {
      verses: [
        { n: 16, text: "For God so loved the world." },
        { n: 17, text: "For God did not send his Son to condemn the world." },
      ],
    };
  },
  getVerseText(verse) {
    return verse.text;
  },
  async copyText(text) {
    copiedText.push(text);
  },
  showToast() {},
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("selectedVerseNumbers")}
  ${extractFunction("passageLines")}
  ${extractFunction("verseRangeParam")}
  ${extractFunction("formatReferenceLabel")}
  ${extractFunction("passageShareUrl")}
  ${extractFunction("passageShareText")}
  ${extractFunction("shareSelectedPassage")}
  globalThis.shareText = passageShareText;
  globalThis.share = shareSelectedPassage;
`, context);

const expected = [
  "“16. For God so loved the world.",
  "17. For God did not send his Son to condemn the world.”",
  "— John 3:16-17 (NASB)",
  "",
  "https://bigscreenbible.com/?ref=John+3%3A16&verses=16-17&mode=reader",
].join("\n");

assert.equal(context.shareText([16, 17]), expected);
await context.share();
assert.equal(shareCalls.length, 1);
assert.deepEqual(Object.keys(shareCalls[0]), ["text"], "Web Share should receive one composed text field");
assert.equal(shareCalls[0].text, expected);
assert.deepEqual(copiedText, [], "Successful native sharing should not copy a fallback payload");

delete context.navigator.share;
await context.share();
assert.deepEqual(copiedText, [expected], "The clipboard fallback should use the same complete payload");

console.log("Passage sharing tests passed");
