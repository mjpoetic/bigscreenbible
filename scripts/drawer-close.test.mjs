import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\n}\n', start) + 2;
  return source.slice(start, end);
}
const listeners = new Map();
const classes = new Set();
const frames = [];
const timers = new Map();
let removed = false;
let focused = false;
let reducedMotion = false;
const drawer = {
  getClientRects: () => [1],
  classList: { contains: (name) => classes.has(name), add: (name) => classes.add(name) },
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener: (name) => listeners.delete(name),
  contains: () => true,
  remove: () => { removed = true; },
};
const gridClasses = new Set();
const context = {
  document: {
    activeElement: {},
    querySelectorAll: () => [drawer],
    querySelector: (selector) => selector === '.library-drawer' ? drawer
      : selector === '.main-grid' ? { classList: { add: (name) => gridClasses.add(name) } }
      : { focus: () => { focused = true; } },
  },
  window: {
    matchMedia: () => ({ matches: reducedMotion }),
    setTimeout: (fn) => { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
  },
  requestAnimationFrame: (fn) => frames.push(fn),
  state: { libraryOpen: true },
  localStorage: { setItem() {} },
  rememberOpenLibraryState() {},
  persistLibraryScrollByRail() {},
  scheduleCloudSync() {},
  // Any full render would replace Scripture and fail this regression check.
  render: () => assert.fail('Closing a drawer must preserve the mounted reader'),
};
vm.createContext(context);
vm.runInContext(`let pendingLibraryEnter = false; ${extract('animateBeforeRemoval')} ${extract('closeLibrary')}`, context);
vm.runInContext('closeLibrary()', context);
assert.equal(removed, false);
const end = listeners.get('animationend');
end({ target: {}, currentTarget: drawer });
assert.equal(frames.length, 0, 'Descendant animations must not close the drawer');
end({ target: drawer, currentTarget: drawer });
assert.equal(removed, false, 'Allow the final animation frame to paint');
assert.equal(timers.size, 0, 'Animation completion clears its fallback');
frames.shift()();
assert.equal(removed, true);
assert.equal(context.state.libraryOpen, false);
assert.ok(gridClasses.has('library-closed'));
assert.equal(focused, true);
assert.equal(listeners.size, 0);

let calls = 0;
context.done = () => { calls += 1; };
classes.clear();
vm.runInContext('animateBeforeRemoval(".library-drawer", done, { waitForAnimation: true })', context);
[...timers.values()][0]();
assert.equal(calls, 1, 'Fallback handles a missing animationend event');
assert.equal(listeners.size, 0);
classes.clear();
reducedMotion = true;
vm.runInContext('animateBeforeRemoval(".library-drawer", done, { waitForAnimation: true })', context);
assert.equal(calls, 2, 'Reduced motion closes immediately');
console.log('Drawer close: animation completion, fallback, focus, and reader preservation passed.');
