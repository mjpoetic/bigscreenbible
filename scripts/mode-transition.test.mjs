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

const directionContext = {};
vm.createContext(directionContext);
vm.runInContext(`
  ${extractFunction("modeViewTransitionDirection")}
  globalThis.direction = modeViewTransitionDirection;
`, directionContext);

assert.equal(directionContext.direction("reader", "big"), "enter-big");
assert.equal(directionContext.direction("parallel", "big"), "enter-big");
assert.equal(directionContext.direction("big", "reader"), "exit-big");
assert.equal(directionContext.direction("big", "parallel"), "exit-big");
assert.equal(directionContext.direction("reader", "parallel"), "");
assert.equal(directionContext.direction("trivia", "big"), "");

const availabilityContext = {
  document: {
    startViewTransition() {},
    visibilityState: "visible",
  },
  window: {
    matchMedia: () => ({ matches: false }),
  },
};
vm.createContext(availabilityContext);
vm.runInContext(`
  ${extractFunction("modeViewTransitionAvailable")}
  globalThis.available = modeViewTransitionAvailable;
`, availabilityContext);

assert.equal(availabilityContext.available(), true);
availabilityContext.window.matchMedia = () => ({ matches: true });
assert.equal(availabilityContext.available(), false);
availabilityContext.window.matchMedia = () => ({ matches: false });
availabilityContext.document.visibilityState = "hidden";
assert.equal(availabilityContext.available(), false);
availabilityContext.document.visibilityState = "visible";
availabilityContext.document.startViewTransition = undefined;
assert.equal(availabilityContext.available(), false);

assert.match(extractFunction("runModeViewTransition"), /root\.dataset\.modeTransition = direction/);
assert.match(extractFunction("runModeViewTransition"), /document\.startViewTransition/);
assert.match(extractFunction("runModeViewTransition"), /transition\.finished\.then\(finish, finish\)/);
assert.match(extractFunction("switchMode"), /runModeViewTransition\(previousMode, nextMode, applyModeChange\)/);
assert.match(extractFunction("returnFromPresentationToBible"), /switchMode\("reader"\)/);

const switchModeContext = {
  state: {
    mode: "big",
    modeTransitionSounds: false,
    isVerseOfDayActive: true,
    verseOfDayItem: { reference: "Psalm 116:1-2" },
  },
  currentGameReferenceReturn: () => null,
  returnToTriviaGame() {},
  cleanupTriviaCelebration() {},
  primeModeTransitionAudio() {},
  playModeTransitionSound() {},
  rememberModeScrollState: () => null,
  modeScrollStateForTarget: () => ({ shouldNotRestore: true }),
  selectVerseOfDayReference(reference) {
    assert.equal(reference, "Psalm 116:1-2");
    switchModeContext.state.isVerseOfDayActive = false;
    switchModeContext.state.verse = 1;
    switchModeContext.state.selectedVerses = [1, 2];
  },
  resetFocusToolSurfaces() {},
  clearTimeout() {},
  presentationControlsTimer: 0,
  render() {},
  restoreModeScrollAfterRender(scrollState) {
    switchModeContext.restoredScrollState = scrollState;
  },
  runModeViewTransition(previousMode, nextMode, updateMode) {
    updateMode();
  },
};
vm.createContext(switchModeContext);
vm.runInContext(`${extractFunction("switchMode")}; globalThis.changeMode = switchMode;`, switchModeContext);
switchModeContext.changeMode("reader");
assert.equal(switchModeContext.state.mode, "reader");
assert.equal(switchModeContext.state.isVerseOfDayActive, false, "Leaving Verse of the Day in Big Screen opens its Bible passage");
assert.deepEqual(switchModeContext.state.selectedVerses, [1, 2], "Back to Bible preselects the full Verse of the Day passage");
assert.equal(switchModeContext.state.pendingVerseFocus, true, "The cited verse is centered after leaving Big Screen");
assert.equal(switchModeContext.restoredScrollState, null, "A stale Reader scroll position cannot override the Verse of the Day reference");

assert.match(styles, /html\[data-mode-transition="enter-big"\]::view-transition-old\(root\)/);
assert.match(styles, /html\[data-mode-transition="enter-big"\]::view-transition-new\(root\)/);
assert.match(styles, /html\[data-mode-transition="exit-big"\]::view-transition-old\(root\)/);
assert.match(styles, /html\[data-mode-transition="exit-big"\]::view-transition-new\(root\)/);
assert.match(styles, /@keyframes mode-presentation-reveal/);
assert.match(styles, /@keyframes mode-presentation-dismiss/);

console.log("Mode transition tests passed");
