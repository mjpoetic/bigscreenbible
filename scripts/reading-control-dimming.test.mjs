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
const surface = { getBoundingClientRect: () => surfaceRect, classList: { toggle: (name, value) => { enabled = value; } } };
const context = vm.createContext({
  window: { innerWidth: 390, innerHeight: 844 },
  document: {
    querySelector: () => scripture,
    querySelectorAll: () => [surface],
    createRange: () => ({ selectNodeContents() {}, getClientRects: () => lines }),
  },
  requestAnimationFrame: () => 1,
});
vm.runInContext(code, context);
context.updateReadingControlDimming();
assert.equal(enabled, false, 'A tall reading container with short text leaves empty-space controls undimmed');
lines = [rect(16, 640, 350, 700)];
context.updateReadingControlDimming();
assert.equal(enabled, true, 'Text beneath a revealed control enables dimming');
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
