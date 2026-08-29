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

const speedContext = {};
vm.createContext(speedContext);
vm.runInContext(`
  const defaultReaderPageScrollSpeed = "smooth";
  const readerPageScrollSpeedCodes = ["quick", "smooth", "relaxed"];
  ${extractFunction("normalizedReaderPageScrollSpeed")}
  globalThis.normalize = normalizedReaderPageScrollSpeed;
`, speedContext);

assert.equal(speedContext.normalize("quick"), "quick");
assert.equal(speedContext.normalize("smooth"), "smooth");
assert.equal(speedContext.normalize("relaxed"), "relaxed");
assert.equal(speedContext.normalize("unexpected"), "smooth");

const durationMatches = [...source.matchAll(/\{ code: "(quick|smooth|relaxed)", name: "[^"]+", durationMs: (\d+) \}/g)];
const durations = Object.fromEntries(durationMatches.map((match) => [match[1], Number(match[2])]));
assert.deepEqual(durations, { quick: 320, smooth: 520, relaxed: 720 });
assert.ok(Object.values(durations).every((duration) => duration < 800));

const animationContext = {};
vm.createContext(animationContext);
vm.runInContext(`
  const window = {};
  const performance = { now: () => 0 };
  let nextFrame = null;
  const requestAnimationFrame = (callback) => { nextFrame = callback; };
  const target = { scrollLeft: 0, scrollTop: 0 };
  ${extractFunction("scrollPosition")}
  ${extractFunction("applyScrollPosition")}
  ${extractFunction("easeOutCubic")}
  ${extractFunction("easeInOutCubic")}
  ${extractFunction("animateScrollPosition")}
  animateScrollPosition(target, 0, 1000, { duration: 520, easing: easeInOutCubic });
  nextFrame(260);
  globalThis.midpoint = target.scrollTop;
  nextFrame(520);
  globalThis.finish = target.scrollTop;
`, animationContext);

assert.equal(animationContext.midpoint, 500);
assert.equal(animationContext.finish, 1000);

assert.match(source, /class="reader-page-controls" aria-label="Page navigation"/);
assert.match(source, /id="readerTopButton"[\s\S]*?Page up; press twice for top/);
assert.match(source, /id="readerPageDownButton"[\s\S]*?Page down; press twice for bottom/);
assert.match(extractFunction("updateReaderTopButton"), /maxScrollTop - scrollTop > 160/);
assert.match(extractFunction("scrollReaderPage"), /pauseReaderAutoScroll\(\)/);
assert.match(extractFunction("scrollReaderPage"), /animateReaderPageScroll\(scripture, targetTop\)/);
assert.match(extractFunction("scrollReaderPage"), /animateReaderPageScroll\(window, targetTop\)/);
assert.match(extractFunction("animateReaderPageScroll"), /prefers-reduced-motion: reduce/);
assert.match(extractFunction("animateReaderPageScroll"), /activeReaderPageScrollSpeed\(\)\.durationMs/);
assert.match(extractFunction("animateReaderPageScroll"), /easing: easeInOutCubic/);
assert.match(extractFunction("noteReaderScrollIntent"), /cancelScrollPositionAnimation/);
assert.match(extractFunction("bindReaderTopButton"), /activateReaderPageControl\(direction\)/);
assert.match(extractFunction("bindReaderTopButton"), /addEventListener\("dblclick"[\s\S]*?boundary: true/);
assert.match(extractFunction("readingSettings"), /Page navigation speed/);
assert.match(extractFunction("readingSettings"), /data-page-scroll-speed/);
assert.match(extractFunction("setReaderPageScrollSpeed"), /lw_page_scroll_speed/);
assert.match(extractFunction("captureCloudSnapshot"), /readerPageScrollSpeed/);
assert.match(extractFunction("applyCloudSnapshot"), /readerPageScrollSpeed/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /lw_page_scroll_speed/);
assert.match(extractFunction("bindEvents"), /setReaderPageScrollSpeed/);
assert.match(styles, /\.reader-page-controls \{[\s\S]*?flex-direction: column/);
assert.match(styles, /\.reader-page-controls \.reader-page-button \{[\s\S]*?position: relative !important/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.reader-page-controls/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.reader-return-button \{[\s\S]*?right: max\(7px, env\(safe-area-inset-right, 0px\)\) !important;/);
assert.match(styles, /@media \(max-width: 840px\) and \(orientation: portrait\) \{[\s\S]*?\.reader-selection-tools-button \{[\s\S]*?right: max\(7px, env\(safe-area-inset-right, 0px\)\) !important;/);
assert.match(styles, /@media \(min-width: 841px\) \{[\s\S]*?\.selection-bar \{[\s\S]*?width: min\(1040px, calc\(100vw - 32px\)\);[\s\S]*?flex-wrap: nowrap;/);
assert.match(styles, /@media \(min-width: 841px\) \{[\s\S]*?\.selection-bar-summary \{[\s\S]*?min-width: 0;[\s\S]*?text-overflow: ellipsis;[\s\S]*?white-space: nowrap;/);

console.log("Page navigation tests passed");
