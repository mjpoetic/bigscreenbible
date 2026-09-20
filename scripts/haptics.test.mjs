import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
let platform = "ios", available = true, calls = 0, now = 100;
const storage = new Map();
const context = vm.createContext({
  window: { Capacitor: { getPlatform: () => platform, isPluginAvailable: () => available,
    Plugins: { Haptics: { impact: options => { assert.equal(options.style, "LIGHT"); calls++; return Promise.resolve(); } } } } },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  document: { hidden: false }, performance: { now: () => now },
});
vm.runInContext(`let lastControlHapticAt = -Infinity; let suppressMobileControlsClickUntil = 0, suppressFocusBrandClickUntil = 0, suppressCrossReferenceVerseClickUntil = 0; ${["nativeHapticsPlugin", "hapticsSettingsMarkup", "playControlHaptic", "playPinchHaptic", "handleControlHaptic"].map(extract).join("\n")}`, context);
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

// Exercise real pinch handlers: threshold, reversal, bounds and platform guards.
let ticks = 0;
context.window.Capacitor.Plugins.Haptics.impact = () => { ticks++; };
Object.assign(context, {
  state: { textScale: 1, presentationTextScale: 1 },
  readerBlankTapStart: null, readerPinchStartPx: 7,
  touchDistance: (a, b) => Math.abs(b.clientX - a.clientX),
  updateReaderGestureMovement() {}, pauseReaderAutoScroll() {},
  applyTextScaleVars() {}, showReaderTextScaleFeedback() {},
  applyPresentationTextScale() {}, showPresentationTextScaleFeedback() {},
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
});
vm.runInContext(["handleReaderGestureMove", "handlePresentationPinchMove"].map(extract).join("\n"), context);
for (const [gestureName, handler] of [["readerTouchGesture", "handleReaderGestureMove"], ["presentationPinchGesture", "handlePresentationPinchMove"]]) {
  context[gestureName] = { startDistance: 100, startScale: 1 };
  ticks = 0;
  const move = distance => {
    now += 100;
    context.moveEvent = { touches: [{ clientX: 0 }, { clientX: distance }], cancelable: true, preventDefault() {} };
    run(`${handler}(moveEvent)`);
  };
  move(103); assert.equal(ticks, 0, 'Inactive pinch is silent');
  move(110); assert.equal(ticks, 1);
  move(112); assert.equal(ticks, 1, 'Small movements do not buzz');
  move(115); assert.equal(ticks, 2, 'Five percentage points trigger a tick');
  move(110); assert.equal(ticks, 3, 'Zooming out ticks too');
  move(200); assert.equal(ticks, 4);
  move(250); assert.equal(ticks, 4, 'No ticks beyond maximum');
  storage.set('lw_haptics_enabled', 'false'); move(140); assert.equal(ticks, 4);
  storage.delete('lw_haptics_enabled');
  platform = 'web'; move(130); assert.equal(ticks, 4);
  platform = 'ios';
}
console.log('Scripture pinch haptics: increments, jitter, reversal, limits and guards passed.');
