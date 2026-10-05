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
assert.match(extractFunction("scrollSelectedVerseIntoView"), /options\.halo \? spotlightReaderPassage/);

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
    style: { properties: {}, setProperty(name, value) { this.properties[name] = value; }, removeProperty(name) { delete this.properties[name]; } },
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
  window: { getComputedStyle: (element) => ({ opacity: element === chrome ? "0" : "1" }) },
  document: { getElementById: () => root },
  setTimeout: (callback) => { spotlightCleanup = callback; return 1; },
  clearTimeout() {},
};
vm.createContext(spotlightContext);
vm.runInContext(`${extractFunction("spotlightReaderPassage")}; globalThis.spotlight = spotlightReaderPassage;`, spotlightContext);
spotlightContext.spotlight(scripture, rows[1]);
assert.equal(chrome.style.properties["--arrival-base-opacity"], "0", "Hidden feedback keeps its zero opacity during spotlight");
for (const element of [chrome, rows[0], rows[3]]) assert.ok(element.classes.has("verse-arrival-dimmed"));
for (const element of [scripture, paragraph, rows[1], rows[2]]) assert.ok(!element.classes.has("verse-arrival-dimmed"));
for (const row of [rows[1], rows[2]]) assert.ok(row.classes.has("verse-arrival-halo"));
spotlightCleanup();
for (const element of [chrome, ...rows]) assert.equal(element.classes.size, 0, "Spotlight restores every affected element");
assert.equal(scripture.clearArrivalSpotlight, undefined);
assert.deepEqual(chrome.style.properties, {}, "Cleanup restores original opacity styles");
console.log("Passage spotlight and cleanup tests passed");

const spotlightAnimation = styles.match(/@keyframes verse-arrival-dim \{([\s\S]*?)\n\}/)?.[1];
assert.ok(spotlightAnimation, "Spotlight dim animation exists");
assert.match(spotlightAnimation, /opacity: calc\(var\(--arrival-base-opacity, 1\) \* 0\.22\)/);
assert.doesNotMatch(spotlightAnimation, /filter\s*:/, "Dimming must preserve fixed control containing blocks");

// Returning from a later Big Screen range page still reveals the whole range.
switchModeContext.state.mode = "big";
switchModeContext.state.sharedPassage = { verses: [16, 17] };
switchModeContext.state.verse = 17;
switchModeContext.changeMode("reader");
assert.equal(switchModeContext.state.verse, 16);
assert.deepEqual(Array.from(switchModeContext.state.selectedVerses), [16, 17]);

let scrolled;
scripture.scrollTop = 100;
scripture.clientHeight = 400;
scripture.scrollHeight = 2000;
scripture.getBoundingClientRect = () => ({ top: 100 });
scripture.querySelector = (selector) => selector === ".selection-bar" ? null : rows[1];
scripture.scrollTo = (options) => { scrolled = options; };
rows[1].getBoundingClientRect = () => ({ top: 500, bottom: 560, height: 60 });
rows[2].getBoundingClientRect = () => ({ top: 560, bottom: 640, height: 80 });
const scrollContext = {
  state: { verse: 16 }, document: { querySelector: () => scripture },
  window: { matchMedia: () => ({ matches: false }) },
  spotlightReaderPassage: () => [rows[1], rows[2]],
};
vm.createContext(scrollContext);
vm.runInContext(`${extractFunction("scrollSelectedVerseIntoView")}; globalThis.scroll = scrollSelectedVerseIntoView;`, scrollContext);
scrollContext.scroll({ halo: true });
assert.equal(scrolled.top, 370, "A short passage is centered as a whole");
rows[2].getBoundingClientRect = () => ({ top: 560, bottom: 1100, height: 540 });
scrollContext.scroll({ halo: true });
assert.equal(scrolled.top, 476, "A long passage starts at the top with a reading margin");
scrollContext.scroll({ halo: true, behavior: "auto" });
assert.equal(scrolled.behavior, "auto");
console.log("Short and overflowing passage positioning tests passed");

const toolbar = { getBoundingClientRect: () => ({ height: 100 }) };
scripture.querySelector = (selector) => selector === ".selection-bar" ? toolbar : rows[1];
scrollContext.window.getComputedStyle = () => ({ position: "sticky" });
scrollContext.scroll({ halo: true });
assert.equal(scrolled.top, 364, "Long passage clears the portrait toolbar and reading margin");
rows[2].getBoundingClientRect = () => ({ top: 560, bottom: 640, height: 80 });
scrollContext.scroll({ halo: true });
assert.equal(scrolled.top, 314, "Short passage centers in the area below the toolbar");
