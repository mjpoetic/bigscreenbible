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
  ${extractFunction("groupSectionHeadings")}
  globalThis.group = groupSectionHeadings;
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

console.log("Section heading grouping tests passed");
