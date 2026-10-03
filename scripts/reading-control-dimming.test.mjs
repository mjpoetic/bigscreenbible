import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('let readingControlDimmingFrame ='), source.indexOf('function normalizedFocusControlsHideSeconds('));
const rect = (left, top, right, bottom) => ({ left, top, right, bottom, width: right - left, height: bottom - top });
let lines = [rect(16, 100, 350, 240)];
let enabled = false;
let surfaceRect = rect(8, 650, 50, 692);
const text = { getBoundingClientRect: () => rect(16, 100, 350, 900) };
const scripture = { getBoundingClientRect: () => rect(0, 60, 390, 844), querySelectorAll: () => [text] };
let idle = false;
let arrow = false;
let unavailable = false;
const mist = { style: {}, setAttribute() {}, classList: { toggle() {} }, remove() {} };
const shell = { append() {} };
const surface = { isConnected: true, matches: selector => selector.startsWith(".focus-control-faded") ? idle : selector === ".reader-page-button, .reader-auto-scroll-button" ? arrow : selector === ".reader-page-button:not(.available)" ? unavailable : false, getBoundingClientRect: () => surfaceRect, classList: { toggle: (name, value) => { enabled = value; } } };
const context = vm.createContext({
  window: { innerWidth: 390, innerHeight: 844 },
  document: {
    querySelector: selector => selector === ".app-shell" ? shell : scripture,
    createElement: () => mist,
    querySelectorAll: () => [surface],
    createRange: () => ({ selectNodeContents() {}, getClientRects: () => lines }),
  },
  requestAnimationFrame: () => 1,
});
vm.runInContext(code, context);
context.updateReadingControlDimming();
assert.equal(enabled, false, 'A tall reading container with short text leaves empty-space controls undimmed');
arrow = true;
context.updateReadingControlDimming();
assert.equal(mist.style.opacity, '1', 'A revealed arrow keeps its mist even over empty space');
lines = [rect(16, 640, 350, 700)];
context.updateReadingControlDimming();
assert.equal(mist.style.opacity, '1', 'An arrow over text has the same mist strength');
unavailable = true;
context.updateReadingControlDimming();
assert.equal(mist.style.opacity, '0', 'Unavailable arrows have no mist');
unavailable = false;
idle = true;
context.updateReadingControlDimming();
assert.equal(mist.style.opacity, '0', 'Idle arrows fade their mist');
idle = false;
arrow = false;
lines = [rect(16, 640, 350, 700)];
context.updateReadingControlDimming();
assert.equal(enabled, true, 'Text beneath a revealed control enables dimming');
assert.equal(mist.style.opacity, '1', 'Separate mist layer appears with overlapping controls');
assert.equal(mist.style.left, '-40px', 'Feather extends past the control without following its border');
idle = true;
context.updateReadingControlDimming();
assert.equal(mist.style.opacity, '0', 'Mist fades fully away when controls become idle');
idle = false;
surfaceRect = rect(60, 650, 320, 700);
context.updateReadingControlDimming();
assert.equal(enabled, true, 'Expanded controls use their full visible bounds');
lines = [rect(400, 640, 750, 700)];
context.updateReadingControlDimming();
assert.equal(enabled, false, 'Offscreen text in a horizontally scrolled layout does not enable dimming');
lines = [rect(16, 850, 350, 900)];
surfaceRect = rect(8, 820, 50, 862);
context.updateReadingControlDimming();
assert.equal(enabled, false, 'Text clipped below the viewport does not enable dimming');
surfaceRect = rect(0, 0, 0, 0);
lines = [rect(0, 60, 350, 100)];
context.updateReadingControlDimming();
assert.equal(enabled, false, 'Hidden controls stay undimmed');
console.log('Reading control dimming: empty space, overlap, expanded bounds, and clipped text passed.');
