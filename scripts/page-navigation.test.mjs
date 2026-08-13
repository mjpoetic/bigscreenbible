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

const targetContext = {};
vm.createContext(targetContext);
vm.runInContext(`
  ${extractFunction("readerPageScrollTarget")}
  globalThis.pageDown = readerPageScrollTarget(400, 2400, 1000, 1);
  globalThis.pageUp = readerPageScrollTarget(400, 2400, 1000, -1);
  globalThis.top = readerPageScrollTarget(1600, 2400, 1000, -1, true);
  globalThis.bottom = readerPageScrollTarget(400, 2400, 1000, 1, true);
`, targetContext);

assert.equal(targetContext.pageDown, 1250);
assert.equal(targetContext.pageUp, 0);
assert.equal(targetContext.top, 0);
assert.equal(targetContext.bottom, 2400);

const activationContext = {};
vm.createContext(activationContext);
vm.runInContext(`
  let readerPageControlLastActivation = { direction: 0, at: 0 };
  const readerPageControlDoubleActivationMs = 380;
  const calls = [];
  const scrollReaderPage = (direction, options) => {
    calls.push({ direction, boundary: options.boundary });
    return true;
  };
  ${extractFunction("activateReaderPageControl")}
  activateReaderPageControl(-1, 1000);
  activateReaderPageControl(-1, 1300);
  activateReaderPageControl(1, 2000);
  activateReaderPageControl(1, 2400);
  activateReaderPageControl(1, 2600);
  globalThis.calls = calls;
`, activationContext);

assert.deepEqual(
  JSON.parse(JSON.stringify(activationContext.calls)),
  [
    { direction: -1, boundary: false },
    { direction: -1, boundary: true },
    { direction: 1, boundary: false },
    { direction: 1, boundary: false },
    { direction: 1, boundary: true },
  ],
);

assert.match(source, /class="reader-page-controls" aria-label="Page navigation"/);
assert.match(source, /id="readerTopButton"[\s\S]*?Page up; press twice for top/);
assert.match(source, /id="readerPageDownButton"[\s\S]*?Page down; press twice for bottom/);
assert.match(extractFunction("updateReaderTopButton"), /maxScrollTop - scrollTop > 160/);
assert.match(extractFunction("scrollReaderPage"), /pauseReaderAutoScroll\(\)/);
assert.match(extractFunction("scrollReaderPage"), /scripture\.scrollTo/);
assert.match(extractFunction("scrollReaderPage"), /window\.scrollTo/);
assert.match(extractFunction("bindReaderTopButton"), /activateReaderPageControl\(direction\)/);
assert.match(extractFunction("bindReaderTopButton"), /addEventListener\("dblclick"[\s\S]*?boundary: true/);
assert.match(styles, /\.reader-page-controls \{[\s\S]*?flex-direction: column/);
assert.match(styles, /\.reader-page-controls \.reader-page-button \{[\s\S]*?position: relative !important/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.reader-page-controls/);

console.log("Page navigation tests passed");
