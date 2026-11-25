import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const extract = name => source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`))[0];
let platform = "ios", available = true, calls = 0, now = 100;
const storage = new Map();
const context = vm.createContext({
  window: { Capacitor: { getPlatform: () => platform, isPluginAvailable: name => available && name === "Haptics",
    Plugins: { Haptics: { impact: options => { assert.equal(options.style, "LIGHT"); calls++; return Promise.resolve(); } } } } },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  document: { hidden: false, querySelectorAll: () => [] }, performance: { now: () => now },
});
vm.runInContext(`let androidHapticStrengthAvailable = false; let lastControlHapticAt = -Infinity; let suppressMobileControlsClickUntil = 0, suppressFocusBrandClickUntil = 0, suppressCrossReferenceVerseClickUntil = 0; ${["nativeHapticsPlugin", "nativeHapticStrengthPlugin", "canAdjustHapticStrength", "loadAndroidHapticCapabilities", "hapticStrength", "hapticsSettingsMarkup", "playNativeHaptic", "playControlHaptic", "playPinchHaptic", "syncHapticSettings", "handleHapticStrengthInput", "handleControlHaptic"].map(extract).join("\n")}`, context);
const run = code => vm.runInContext(code, context);
function event({ type = "click", input = false, disabled = false, trusted = true, toggle = false, checked = true, label = false } = {}) {
  const control = {
    checked,
    matches: selector => selector === ':disabled' ? disabled : selector === '[data-haptics-toggle]' ? toggle : selector.includes('input') ? input : false,
    closest: () => null,
  };
  context.event = { type, isTrusted: trusted, target: { closest: selector => selector === 'label' ? (label ? {} : null) : control } };
  now += 100;
  run('handleControlHaptic(event)');
}
event(); assert.equal(calls, 1);
run('playControlHaptic()'); assert.equal(calls, 1, 'Duplicate events are throttled');
event({ disabled: true }); event({ trusted: false }); event({ input: true }); event({ label: true });
assert.equal(calls, 1, 'Disabled, synthetic, input clicks and labels are silent');
event({ type: 'change', input: true }); assert.equal(calls, 2);
event({ type: 'change', input: true, toggle: true, checked: false });
event(); assert.equal(calls, 2, 'Turning off immediately silences feedback');
event({ type: 'change', input: true, toggle: true }); assert.equal(calls, 3, 'Turning on previews feedback');
platform = 'web'; event(); assert.equal(calls, 3); assert.equal(run('hapticsSettingsMarkup()'), '');
platform = 'ios'; available = false; event(); assert.equal(calls, 3);
available = true; assert.match(run('hapticsSettingsMarkup("mobile")'), /checked/);
run('document.hidden = true'); event(); assert.equal(calls, 3);
run('document.hidden = false; window.Capacitor.Plugins.Haptics.impact = () => { throw new Error("Unavailable"); }');
event();
run('window.Capacitor.Plugins.Haptics.impact = () => Promise.reject(new Error("Unavailable"))');
event();
await new Promise(resolve => setImmediate(resolve));
console.log('Haptics: activation, preference, platform guards, deduplication and failures passed.');

vm.runInContext(["passageScrollPosition", "passageScrollHaptic"].map(extract).join("\n"), context);
context.menu = {
  firstElementChild: { offsetTop: 6, nextElementSibling: { offsetTop: 52 } },
  scrollHeight: 470,
  clientHeight: 240,
};
run("let previousScroll = passageScrollPosition({ ...menu, scrollTop: 0 });");
for (const [offset, expected] of [
  [-20, null], [22, null], [24, "picker-tick"], [48, null], [116, "picker-tick"],
  [69, "picker-tick"], [220, "picker-tick"], [229.5, "milestone"], [270, null],
  [230, null], [20, "picker-tick"], [0, "milestone"],
]) {
  context.menu.scrollTop = offset;
  assert.equal(run(`{
    const current = passageScrollPosition(menu);
    const kind = passageScrollHaptic(previousScroll, current);
    previousScroll = current;
    kind;
  }`), expected);
}
assert.equal(run("passageScrollPosition({ scrollTop: 0, scrollHeight: 240, clientHeight: 240 }).edge"), null);

const feedback = [];
const scrollListeners = new Map();
const scrollContext = vm.createContext({
  localStorage: { getItem: key => storage.get(key) },
  document: { hidden: false },
  window: { AudioContext: class { state = "running"; currentTime = 0; } },
  playNativeHaptic: kind => feedback.push(kind),
  playModeTone: (_context, options) => feedback.push(options.peakGain),
  scroller: {
    ...context.menu, scrollTop: 0, isConnected: true,
    addEventListener: (type, handler) => scrollListeners.set(type, handler),
  },
});
const runScroll = code => vm.runInContext(code, scrollContext);
runScroll(`let passageScrollAudioContext;
${["passageScrollPosition", "passageScrollHaptic", "passageScrollSoundsEnabled", "primePassageScrollAudio", "playPassageScrollTick", "bindPassageScrollFeedback"].map(extract).join("\n")}
const reset = bindPassageScrollFeedback(scroller);`);
const scrollTo = top => {
  scrollContext.scroller.scrollTop = top;
  scrollListeners.get("scroll")();
};
scrollTo(52);
assert.deepEqual(feedback.splice(0), ["picker-tick"], "Sound defaults off while haptics still play");
storage.set("lw_passage_scroll_sounds", "true");
scrollListeners.get("click")();
scrollTo(102);
assert.deepEqual(feedback.splice(0), ["picker-tick", 0.045]);
runScroll("scroller.scrollTop = 150; reset();");
scrollTo(150);
assert.deepEqual(feedback, [], "Programmatic repositioning is silent");
scrollTo(230);
assert.deepEqual(feedback.splice(0), ["milestone", 0.065]);
storage.set("lw_passage_scroll_sounds", "false");
scrollTo(10);
assert.deepEqual(feedback.splice(0), ["picker-tick"], "Turning sound off takes effect on the next scroll");
storage.delete("lw_passage_scroll_sounds");

// Exercise the actual native-intensity path and real Scripture gesture handlers.
const pulses = [];
context.window.Capacitor.isPluginAvailable = name => available && (name === "Haptics" || platform === "ios");
context.window.Capacitor.Plugins.BSBHaptics = { impact: options => { pulses.push(options); } };
run('playNativeHaptic("picker-tick"); playNativeHaptic("milestone");');
assert.deepEqual(pulses.splice(0).map(({ intensity, soft }) => [Math.round(intensity * 100), soft]), [[45, true], [60, false]]);
console.log("Verse picker haptics: row crossings, overscroll, and stronger edge feedback passed.");
Object.assign(context, {
  state: { textScale: 1, presentationTextScale: 1 },
  readerBlankTapStart: null, readerPinchStartPx: 7,
  touchDistance: (a, b) => Math.abs(b.clientX - a.clientX),
  updateReaderGestureMovement() {}, pauseReaderAutoScroll() {},
  applyTextScaleVars() {}, showReaderTextScaleFeedback() {},
  fitPresentationText() { return context.presentationFitLimit; },
  presentationFitLimit: 1.6,
  applyPresentationTextScale() {},
  showPresentationTextScaleFeedback(options) { context.presentationFeedback = options; },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
});
vm.runInContext(["handleReaderGestureMove", "handlePresentationPinchMove"].map(extract).join("\n"), context);
for (const [gestureName, handler, minimum] of [["readerTouchGesture", "handleReaderGestureMove", 80], ["presentationPinchGesture", "handlePresentationPinchMove", 60]]) {
  context[gestureName] = { startDistance: 100, startScale: 1 };
  pulses.length = 0;
  const move = distance => {
    now += 16; // Real animation-frame cadence must not suppress 1% steps.
    context.moveEvent = { touches: [{ clientX: 0 }, { clientX: distance }], cancelable: true, preventDefault() {} };
    run(`${handler}(moveEvent)`);
  };
  move(103); assert.equal(pulses.length, 0, 'Inactive pinch is silent');
  move(107); assert.equal(pulses.at(-1).soft, true);
  for (const percent of [108, 109, 110, 111]) move(percent);
  assert.equal(pulses.length, 5, 'Each displayed percent gets feedback at frame cadence');
  assert.equal(pulses[3].soft, false, '110% has a stronger tick');
  assert.ok(pulses[3].intensity > pulses[2].intensity);
  move(111.1); assert.equal(pulses.length, 5, 'Unchanged displayed percent is silent');
  move(110); assert.equal(pulses.at(-1).soft, false, 'Descending arrival at 110% is accented');
  move(109); assert.equal(pulses.at(-1).soft, true, 'Leaving 110% is soft');
  move(101); move(99); assert.equal(pulses.at(-1).soft, false, 'Skipped 100% is still accented');
  move(121); assert.equal(pulses.at(-1).soft, false, 'Fast movement across decades emits one accent');
  move(200); const maxCount = pulses.length;
  move(250); assert.equal(pulses.length, maxCount, 'No ticks beyond maximum');
  move(10); assert.equal(context.state[gestureName === 'readerTouchGesture' ? 'textScale' : 'presentationTextScale'], minimum / 100);
  const minCount = pulses.length; move(5); assert.equal(pulses.length, minCount);
  storage.set('lw_haptics_enabled', 'false'); move(140); assert.equal(pulses.length, minCount);
  storage.delete('lw_haptics_enabled');
  platform = 'web'; move(130); assert.equal(pulses.length, minCount);
  platform = 'ios';
}
context.presentationFitLimit = 1.23;
context.state.presentationTextScale = 1;
context.presentationPinchGesture = { startDistance: 100, startScale: 1 };
const movePresentationPinch = distance => {
  context.moveEvent.touches[1].clientX = distance;
  run("handlePresentationPinchMove(moveEvent)");
};
movePresentationPinch(150);
assert.equal(context.state.presentationTextScale, 1.23);
assert.equal(context.presentationFeedback.atMaximum, true);
const cappedPulseCount = pulses.length;
movePresentationPinch(180);
assert.equal(context.state.presentationTextScale, 1.23);
assert.equal(pulses.length, cappedPulseCount, "The passage fit limit stops haptics");
movePresentationPinch(175);
assert.ok(context.state.presentationTextScale < 1.23, "Reversing at the fit limit shrinks text immediately");
assert.equal(context.presentationFeedback.atMaximum, false);

// Strength persists, previews, clamps corrupt storage, and appears on supported devices.
assert.match(run('hapticsSettingsMarkup()'), /data-haptics-strength/);
const slider = { value: '30', matches: selector => selector === '[data-haptics-strength]' };
context.sliderEvent = { isTrusted: true, target: slider };
now += 100;
run('handleHapticStrengthInput(sliderEvent)');
assert.equal(storage.get('lw_haptics_strength'), '30');
assert.equal(pulses.at(-1).intensity, 0.3);
run('playNativeHaptic("tick")'); assert.equal(pulses.at(-1).intensity, 0.09);
run('playNativeHaptic("milestone")'); assert.equal(pulses.at(-1).intensity, 0.3);
slider.value = '100'; now += 100; run('handleHapticStrengthInput(sliderEvent)');
assert.equal(pulses.at(-1).intensity, 1);
storage.set('lw_haptics_strength', 'bad'); assert.equal(run('hapticStrength()'), 60);
storage.set('lw_haptics_strength', '200'); assert.equal(run('hapticStrength()'), 100);
storage.set('lw_haptics_strength', '-5'); assert.equal(run('hapticStrength()'), 20);
platform = 'web'; assert.equal(run('hapticsSettingsMarkup()'), '');
platform = 'android';
assert.match(run('hapticsSettingsMarkup()'), /Haptic feedback/);
assert.doesNotMatch(run('hapticsSettingsMarkup()'), /data-haptics-strength|iPhone/);
const androidPulses = [];
context.window.Capacitor.Plugins.Haptics.impact = options => androidPulses.push(options.style);
run('playNativeHaptic(); playNativeHaptic("tick"); playNativeHaptic("milestone")');
assert.deepEqual(androidPulses, ['LIGHT', 'LIGHT', 'MEDIUM']);
storage.set('lw_haptics_enabled', 'false'); run('playNativeHaptic()');
assert.equal(androidPulses.length, 3, 'Android respects the device opt-out');
storage.delete('lw_haptics_enabled');
available = false; run('playNativeHaptic()');
assert.equal(androidPulses.length, 3, 'Missing Android hardware/plugin does not interrupt controls');
available = true;
context.window.Capacitor.isPluginAvailable = name => ["Haptics", "BSBHaptics"].includes(name);
let adjustable = false;
context.window.Capacitor.Plugins.BSBHaptics.getCapabilities = async () => ({ adjustable });
const renderedControls = [{}, {}];
context.document.querySelectorAll = selector => selector === "[data-haptics-strength]" ? renderedControls : [];
await run("loadAndroidHapticCapabilities()");
assert.match(run("hapticsSettingsMarkup()"), /data-haptics-strength hidden/);
assert.ok(renderedControls.every(control => control.hidden));
const beforeFallback = pulses.length;
run('playNativeHaptic("tick"); playNativeHaptic("milestone")');
assert.equal(pulses.length, beforeFallback, "Phones without amplitude control skip the strength bridge");
assert.deepEqual(androidPulses.slice(-2), ["LIGHT", "MEDIUM"]);

context.window.Capacitor.Plugins.BSBHaptics.getCapabilities = async () => { throw new Error("Unavailable"); };
await run("loadAndroidHapticCapabilities()");
run("playNativeHaptic()");
assert.equal(pulses.length, beforeFallback);
assert.equal(androidPulses.at(-1), "LIGHT", "A failed capability check keeps standard Android haptics");

adjustable = true;
context.window.Capacitor.Plugins.BSBHaptics.getCapabilities = async () => ({ adjustable });
await run("loadAndroidHapticCapabilities()");
assert.doesNotMatch(run("hapticsSettingsMarkup()"), /data-haptics-strength hidden/);
assert.ok(renderedControls.every(control => !control.hidden));
slider.value = "40"; now += 100;
run("handleHapticStrengthInput(sliderEvent)");
assert.equal(pulses.at(-1).intensity, 0.4);
run('playNativeHaptic("tick")');
assert.equal(pulses.at(-1).intensity, 0.12);
storage.set("lw_haptics_enabled", "false");
const beforeOptOut = pulses.length;
run("playNativeHaptic()");
assert.equal(pulses.length, beforeOptOut, "Android bridge respects the app opt-out");
console.log('Haptic strength and pinch: percent ticks, decade accents, reversals, skipped frames, limits and platform guards passed.');

// Only accepted chapter gestures pulse; boundary and busy gestures stay silent.
let swipePulses = 0, chapterAvailable = true;
const swipeContext = vm.createContext({
  playNativeHaptic: () => swipePulses++,
  adjacentChapterReference: () => chapterAvailable ? 'John 4' : null,
  canUseReaderChapterSwipe: () => false,
  applyChapterMove() {}, moveVerse() {},
  document: { getElementById: () => null },
  window: { matchMedia: () => ({ matches: true }) },
});
vm.runInContext(`let chapterNavigationInProgress=false, readerChapterWheelPull=null, presentationEnterDirection=0; ${extract('moveChapter')} ${extract('commitPresentationSwipe')}`, swipeContext);
vm.runInContext('moveChapter(1, {fromSwipe:true}); moveChapter(-1, {fromPull:true}); commitPresentationSwipe(1)', swipeContext);
assert.equal(swipePulses, 3);
vm.runInContext('moveChapter(1)', swipeContext);
chapterAvailable = false;
vm.runInContext('moveChapter(1, {fromSwipe:true})', swipeContext);
chapterAvailable = true;
vm.runInContext('chapterNavigationInProgress=true; moveChapter(1, {fromPull:true})', swipeContext);
assert.equal(swipePulses, 3);
console.log('Swipe haptics: accepted gestures, boundaries and busy guards passed.');
