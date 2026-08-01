import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

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

const context = {};
vm.createContext(context);
vm.runInContext(`
  const readerChapterPullStartPx = 7;
  const readerChapterPullThresholdPx = 76;
  const readerChapterPullMaxPx = 112;
  const readerChapterPullDominance = 1.15;
  ${extractFunction("readerChapterPullProgress")}
  ${extractFunction("readerChapterPullIntent")}
  globalThis.intent = readerChapterPullIntent;
`, context);

const atBothEdges = {
  startX: 100,
  startY: 100,
  previousReference: "John 2",
  nextReference: "John 4",
};

assert.equal(context.intent(atBothEdges, { clientX: 101, clientY: 104 }), null);
assert.equal(context.intent(atBothEdges, { clientX: 180, clientY: 130 }), null);

const previousReady = context.intent(atBothEdges, { clientX: 102, clientY: 180 });
assert.equal(previousReady.direction, -1);
assert.equal(previousReady.reference, "John 2");
assert.equal(previousReady.armed, true);
assert.equal(previousReady.progress, 1);

const nextPending = context.intent(atBothEdges, { clientX: 98, clientY: 50 });
assert.equal(nextPending.direction, 1);
assert.equal(nextPending.reference, "John 4");
assert.equal(nextPending.armed, false);
assert.ok(nextPending.progress > 0 && nextPending.progress < 1);

assert.equal(context.intent({ ...atBothEdges, previousReference: "" }, { clientX: 100, clientY: 190 }), null);
assert.equal(context.intent({ ...atBothEdges, nextReference: "" }, { clientX: 100, clientY: 10 }), null);

assert.match(source, /readerChapterPullIndicator\(-1, adjacentChapterReference\(-1\)\)/);
assert.match(source, /readerChapterPullIndicator\(1, adjacentChapterReference\(1\)\)/);
assert.match(source, /Release to open \$\{intent\.reference\}/);
assert.match(source, /touchmove", handleReaderChapterPullMove, \{ passive: false \}/);
assert.match(source, /touchend", handleReaderChapterPullEnd, \{ passive: false \}/);
assert.match(extractFunction("handleReaderChapterPullMove"), /readerSurfaceAtPullBoundary/);
assert.match(extractFunction("handleReaderChapterPullMove"), /event\.preventDefault\(\)/);
assert.match(extractFunction("handleReaderChapterPullEnd"), /pull\.active && pull\.armed/);
assert.match(extractFunction("handleReaderChapterPullEnd"), /moveChapter\(direction\)/);
assert.match(extractFunction("moveChapter"), /adjacentChapterReference\(direction\)/);
assert.match(source, /pull past the top or bottom edge and release when the chapter indicator is ready/);

assert.match(styles, /\.reader-chapter-pull-indicator \{/);
assert.match(styles, /\.reader-chapter-pull-indicator\.armed/);
assert.match(styles, /\.scripture\.reader-chapter-pulling/);
assert.match(styles, /\.scripture\.reader-chapter-pull-settling/);
assert.match(styles, /conic-gradient\(/);

console.log("Chapter pull tests passed");
