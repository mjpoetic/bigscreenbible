import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const handlers = new Map();
const timers = new Map();
let timerId = 0, toggles = 0, haptics = 0;
const button = { isConnected: true, addEventListener(name, handler) { handlers.set(name, handler); } };
const context = vm.createContext({
  setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
  clearTimeout(id) { timers.delete(id); },
  toggleReaderControlsFade() { toggles++; },
  playControlHaptic() { haptics++; },
});
vm.runInContext(source.slice(source.indexOf('function bindReaderControlsFadeHold('), source.indexOf('function bindReaderControlsFadeToggle(')), context);
context.bindReaderControlsFadeHold(button);
function fire(name, overrides = {}) {
  const event = { pointerId: 1, button: 0, clientX: 0, clientY: 0, detail: 1,
    prevented: false, stopped: false, preventDefault() { this.prevented = true; },
    stopImmediatePropagation() { this.stopped = true; }, ...overrides };
  handlers.get(name)(event);
  return event;
}
function hold() { for (const fn of [...timers.values()]) fn(); }
fire('pointerdown'); fire('pointerup'); hold();
assert.equal(toggles, 0, 'A short tap leaves the native popover action intact');
assert.equal(fire('click').prevented, false);
fire('pointerdown'); hold(); hold(); fire('pointerup');
assert.equal(toggles, 1, 'A hold toggles once');
assert.equal(haptics, 1);
assert.equal(fire('click').prevented, true, 'Release does not open the popover after holding');
assert.equal(fire('click').prevented, false, 'Following clicks work normally');
for (const name of ['pointercancel', 'pointerleave', 'lostpointercapture']) {
  fire('pointerdown'); fire(name); hold();
}
fire('pointerdown'); fire('pointermove', { clientX: 13 }); hold();
assert.equal(toggles, 1, 'Cancelled or dragged gestures do not toggle');
fire('pointerdown', { button: 2 }); hold();
assert.equal(toggles, 1, 'Secondary clicks do not toggle');
fire('pointerdown'); hold(); fire('pointerup');
assert.equal(fire('click', { detail: 0 }).prevented, false, 'Keyboard activation still opens the popover');
console.log('Reading controls hold: tap, hold, click suppression, cancellation, drag, and keyboard passed.');
