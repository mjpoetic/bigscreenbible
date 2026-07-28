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

const normalizeContext = {};
vm.createContext(normalizeContext);
vm.runInContext(`
  const defaultAutoScrollSpeed = "normal";
  const autoScrollSpeedCodes = ["slow", "normal", "fast"];
  ${extractFunction("normalizedAutoScrollSpeed")}
  globalThis.normalize = normalizedAutoScrollSpeed;
`, normalizeContext);

assert.equal(normalizeContext.normalize("slow"), "slow");
assert.equal(normalizeContext.normalize("normal"), "normal");
assert.equal(normalizeContext.normalize("fast"), "fast");
assert.equal(normalizeContext.normalize("unexpected"), "normal");
assert.equal(normalizeContext.normalize(null), "normal");

const stepContext = {};
vm.createContext(stepContext);
vm.runInContext(`
  const state = { autoScrollActive: true };
  let roundedScrollTop = 100;
  const surface = {
    get scrollTop() { return roundedScrollTop; },
    set scrollTop(value) { roundedScrollTop = Math.floor(value); },
    scrollHeight: 2000,
    clientHeight: 500,
  };
  const document = { visibilityState: "visible" };
  let readerAutoScrollLastTime = 1000;
  let readerAutoScrollPosition = 100;
  let readerAutoScrollFrame = 0;
  let paused = 0;
  let toast = "";
  const readerAutoScrollSurface = () => surface;
  const activeAutoScrollSpeed = () => ({ pixelsPerSecond: 16 });
  const pauseReaderAutoScroll = () => {
    state.autoScrollActive = false;
    paused += 1;
  };
  const showToast = (message) => { toast = message; };
  const requestAnimationFrame = () => 17;
  ${extractFunction("readerAutoScrollStep")}
  for (let timestamp = 1016; timestamp <= 1160; timestamp += 16) {
    readerAutoScrollStep(timestamp);
  }
  globalThis.first = {
    top: surface.scrollTop,
    position: readerAutoScrollPosition,
    frame: readerAutoScrollFrame,
    active: state.autoScrollActive,
  };
  surface.scrollTop = 1500;
  readerAutoScrollPosition = 1500;
  state.autoScrollActive = true;
  readerAutoScrollStep(1200);
  globalThis.end = { paused, toast, active: state.autoScrollActive };
`, stepContext);

assert.equal(stepContext.first.top, 102);
assert.ok(Math.abs(stepContext.first.position - 102.56) < 0.0001);
assert.equal(stepContext.first.frame, 17);
assert.equal(stepContext.first.active, true);
assert.equal(stepContext.end.paused, 1);
assert.equal(stepContext.end.toast, "End of chapter");
assert.equal(stepContext.end.active, false);

assert.match(source, /id="readerAutoScrollButton"/);
assert.match(extractFunction("readerAutoScrollButton"), /if \(!state\.autoScrollEnabled\) return ""/);
assert.match(source, /aria-pressed="\$\{active \? "true" : "false"\}"/);
assert.match(source, /\["A", "Start or pause Reader \/ Parallel auto-scroll"\]/);
assert.match(
  extractFunction("handleGlobalShortcuts"),
  /!event\.shiftKey && key === "a" && canUseReaderKeyboardNavigation\(\)/,
);
assert.match(extractFunction("handleReaderGestureEnd"), /toggleReaderAutoScrollFromGesture\(\)/);
assert.match(extractFunction("finishReaderBlankTap"), /toggleReaderFocusFromGesture\(\)/);
assert.doesNotMatch(extractFunction("readerAutoScrollStep"), /moveChapter/);
assert.match(extractFunction("startReaderAutoScroll"), /if \(!state\.autoScrollEnabled\)/);
assert.match(source, /autoScrollEnabled: state\.autoScrollEnabled/);
assert.match(source, /localStorage\.setItem\("lw_auto_scroll_enabled", String\(state\.autoScrollEnabled\)\)/);
assert.match(source, /autoScrollSpeed: state\.autoScrollSpeed/);
assert.match(source, /localStorage\.setItem\("lw_auto_scroll_speed", state\.autoScrollSpeed\)/);
assert.match(source, /id="\$\{controlId\("AutoScrollEnabledToggle"\)\}"/);
assert.match(source, /data-auto-scroll-speed="\$\{speed\.code\}"/);
assert.match(source, /When auto-scroll is enabled in Settings, two-finger tap starts or pauses it/);
assert.match(source, /<span>Start or pause auto-scroll when enabled<\/span>/);
assert.match(source, /toggleReaderAutoScroll\(\{ announce: false \}\)/);

assert.match(styles, /\.reader-auto-scroll-button \{[\s\S]*?position: fixed/);
assert.match(styles, /\.reader-auto-scroll-button\[data-tooltip\] \{[\s\S]*?position: fixed/);
assert.match(styles, /\.reader-auto-scroll-button \{[\s\S]*?left: 50%/);
assert.match(styles, /\.reader-auto-scroll-button\.active/);
assert.match(styles, /\.app-shell\.toast-visible \.reader-auto-scroll-button\[data-tooltip\]::after/);
assert.match(styles, /\.app-shell\.focus-shell \.reader-auto-scroll-button/);

console.log("Auto-scroll tests passed");
