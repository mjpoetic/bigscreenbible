import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

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

const context = {};
vm.createContext(context);
vm.runInContext(`
  const state = { redLetters: false };
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  ${extractFunction("groupSectionHeadings")}
  ${extractFunction("lineBreaksForVerse")}
  ${extractFunction("renderRedLetterText")}
  globalThis.group = groupSectionHeadings;
  globalThis.breaks = lineBreaksForVerse;
  globalThis.renderText = renderRedLetterText;
`, context);

const group = (headings) => [...context.group(headings)].map((items) => [...items]);
const heading = (text, level) => ({ text, level });

assert.deepEqual(
  group([
    heading("Thirty Sayings of the Wise", 1),
    heading("Saying 1", 2),
  ]),
  [
    [heading("Thirty Sayings of the Wise", 1)],
    [heading("Saying 1", 2)],
  ],
);

assert.deepEqual(
  group([
    heading("True Riches", 1),
    heading("(1 Timothy 6:17–19; James 5:1–6)", 2),
    heading("Saying 7", 2),
  ]),
  [
    [
      heading("True Riches", 1),
      heading("(1 Timothy 6:17–19; James 5:1–6)", 2),
    ],
    [heading("Saying 7", 2)],
  ],
);

assert.deepEqual(
  group([
    heading("Do Not Envy", 1),
    heading("Saying 20", 2),
  ]),
  [
    [heading("Do Not Envy", 1)],
    [heading("Saying 20", 2)],
  ],
);

assert.deepEqual(
  group([heading("Saying 21", 2)]),
  [[heading("Saying 21", 2)]],
);

assert.deepEqual(
  group([
    heading("The Beginning of Knowledge", 1),
    heading("(Proverbs 9:1–12)", 2),
  ]),
  [[
    heading("The Beginning of Knowledge", 1),
    heading("(Proverbs 9:1–12)", 2),
  ]],
);

const nirvText = "A deer longs for streams of water. God, I long for you in the same way.";
const nirvBreak = nirvText.indexOf("God,");
assert.deepEqual(
  [...context.breaks({ lineBreaks: { NIRV: [nirvBreak, nirvBreak, -1, 2.5] } }, "NIRV")],
  [nirvBreak],
);
assert.equal(
  context.renderText(nirvText, [], 0, [], [nirvBreak]),
  'A deer longs for streams of water. <br class="scripture-line-break" />God, I long for you in the same way.',
);
assert.match(
  extractFunction("mergeRemoteVersionChapter"),
  /verse\.lineBreaks\[version\] = lineBreaks/,
);
assert.match(
  extractFunction("presentation"),
  /lineBreaksForVerse\(verse, version\)/,
);

console.log("Section heading grouping tests passed");
