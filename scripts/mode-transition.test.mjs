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

for (const mode of ["reader", "parallel"]) {
  switchModeContext.state.mode = "big";
  switchModeContext.state.isVerseOfDayActive = false;
  switchModeContext.state.verse = 16;
  switchModeContext.changeMode(mode);
  assert.equal(switchModeContext.state.pendingVerseFocus, true, "Every Bible exit centers the displayed verse");
  assert.equal(switchModeContext.state.pendingVerseHalo, true, "Every Bible exit requests a temporary halo");
  assert.equal(switchModeContext.restoredScrollState, null, "Old Reader position cannot override Big Screen verse");
  assert.equal(switchModeContext.state.verse, 16);
}
assert.match(extractFunction("scrollSelectedVerseIntoView"), /options\.halo\) spotlightReaderPassage/);

assert.match(styles, /html\[data-mode-transition="enter-big"\]::view-transition-old\(root\)/);
assert.match(styles, /html\[data-mode-transition="enter-big"\]::view-transition-new\(root\)/);
assert.match(styles, /html\[data-mode-transition="exit-big"\]::view-transition-old\(root\)/);
assert.match(styles, /html\[data-mode-transition="exit-big"\]::view-transition-new\(root\)/);
assert.match(styles, /@keyframes mode-presentation-reveal/);
assert.match(styles, /@keyframes mode-presentation-dismiss/);

console.log("Mode transition tests passed");

// Verify that spotlighting never dims an ancestor of a passage verse.
function spotlightElement(verse) {
  const classes = new Set();
  return {
    dataset: { verse: String(verse) }, children: [], parentElement: null, classes,
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    contains(target) { return this.children.some((child) => child === target || child.contains(target)); },
  };
}
function appendSpotlight(parent, ...children) {
  parent.children.push(...children);
  for (const child of children) child.parentElement = parent;
}
const root = spotlightElement();
const chrome = spotlightElement();
const scripture = spotlightElement();
const paragraph = spotlightElement();
const rows = [15, 16, 17, 18].map(spotlightElement);
appendSpotlight(root, chrome, scripture);
appendSpotlight(scripture, paragraph);
appendSpotlight(paragraph, ...rows);
scripture.querySelectorAll = () => rows;
let spotlightCleanup;
const spotlightContext = {
  state: { verse: 16, selectedVerses: [16, 17] },
  document: { getElementById: () => root },
  setTimeout: (callback) => { spotlightCleanup = callback; return 1; },
  clearTimeout() {},
};
vm.createContext(spotlightContext);
vm.runInContext(`${extractFunction("spotlightReaderPassage")}; globalThis.spotlight = spotlightReaderPassage;`, spotlightContext);
spotlightContext.spotlight(scripture, rows[1]);
for (const element of [chrome, rows[0], rows[3]]) assert.ok(element.classes.has("verse-arrival-dimmed"));
for (const element of [scripture, paragraph, rows[1], rows[2]]) assert.ok(!element.classes.has("verse-arrival-dimmed"));
for (const row of [rows[1], rows[2]]) assert.ok(row.classes.has("verse-arrival-halo"));
spotlightCleanup();
for (const element of [chrome, ...rows]) assert.equal(element.classes.size, 0, "Spotlight restores every affected element");
assert.equal(scripture.clearArrivalSpotlight, undefined);
console.log("Passage spotlight and cleanup tests passed");
