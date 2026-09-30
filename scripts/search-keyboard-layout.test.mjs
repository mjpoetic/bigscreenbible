import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('const scriptureSearchInputSelector');
const end = source.indexOf('const scriptureFontLoaders', start);
const listeners = new Map();
const props = {};
let height = 844;
let blurCallback;
let focusCalls = 0;
let scrollCalls = 0;
let controlPositions = 0;
const root = { dataset: {}, style: {
  setProperty: (key, value) => { props[key] = value; },
  removeProperty: (key) => { delete props[key]; },
} };
const win = {
  innerWidth: 390, scrollX: 0, scrollY: 0,
  visualViewport: { height: 844, offsetTop: 0 },
  scrollTo({left, top, behavior}) {
    assert.equal(behavior, 'instant');
    this.scrollX = left; this.scrollY = top; scrollCalls++;
  },
};
const doc = {
  documentElement: root, activeElement: null,
  querySelector(selector) {
    assert.ok(['.app-shell', '.presentation.open'].includes(selector), 'Search must not measure or transform the inner passage');
    return { getBoundingClientRect: () => ({ height }) };
  },
  addEventListener(name, callback, options) { listeners.set(name, {callback, options}); },
};
const input = {
  matches: (selector) => selector.includes('#mobileFocusPassageInput'),
  focus(options) {
    assert.equal(options.preventScroll, true, 'Touch focus must opt out of native page revealing');
    doc.activeElement = input; focusCalls++;
    listeners.get('focusin').callback({target: input});
  },
};
const context = vm.createContext({
  state: { mode: 'reader' }, window: win, document: doc,
  clearTimeout() { blurCallback = null; },
  setTimeout(callback) { blurCallback = callback; return 1; },
  positionMobileFocusSearch() { controlPositions++; },
  resumeViewportRefreshAfterInput() {},
  readerScrollRestoreGeneration: 0, readerViewportRestoreTimer: 1, presentationResizeTimer: 2,
});
vm.runInContext(source.slice(start, end), context);
const fire = (name, event) => listeners.get(name).callback(event);
function tap({move = 0, target = input, touches = 1} = {}) {
  fire('touchstart', {target, touches: Array.from({length: touches}, () => ({clientX: 100, clientY: 720}))});
  let prevented = false;
  fire('touchend', {target, cancelable: true, touches: [], changedTouches: [{clientX: 100, clientY: 720 + move}], preventDefault() { prevented = true; }});
  return prevented;
}
assert.equal(listeners.get('touchend').options.passive, false, 'The native tap must be cancellable');
assert.equal(listeners.get('touchend').options.capture, true);
for (const mode of ['reader', 'parallel', 'big']) {
  context.state.mode = mode;
  doc.activeElement = null;
  height = 844;
  assert.equal(tap(), true, 'Cancel native tap scrolling and open search through controlled focus');
  assert.equal(props['--search-scripture-height'], '844px');
  height = 500;
  win.visualViewport.height = 500;
  context.beginScriptureSearchViewport({target: input});
  assert.equal(props['--search-scripture-height'], '844px', 'Keyboard opening must not capture a smaller canvas');
  win.scrollY = 230;
  context.restoreScriptureSearchWindowScroll();
  assert.equal(win.scrollY, 0, 'Restore document movement without changing scripture scroll or layout');
  const count = scrollCalls;
  context.restoreScriptureSearchWindowScroll();
  assert.equal(scrollCalls, count, 'No repeated scroll when the document is already anchored');
  assert.equal(tap(), false, 'A second tap keeps native caret and text-selection behavior');
  doc.activeElement = null;
  fire('focusout', {target: input});
  assert.equal(root.dataset.scriptureSearch, 'true', 'Keep the canvas during keyboard dismissal');
  height = 844; win.visualViewport.height = 844;
  blurCallback();
  assert.equal(root.dataset.scriptureSearch, undefined);
  assert.deepEqual(props, {});
}
const focusedBefore = focusCalls;
assert.equal(tap({move: 40}), false, 'Dragging over an input must not focus it');
assert.equal(tap({touches: 2}), false, 'Do not intercept pinch gestures');
assert.equal(tap({target: {matches: () => false}}), false, 'Do not intercept other inputs');
assert.equal(focusCalls, focusedBefore);
assert.equal(tap(), true);
win.innerWidth = 844;
assert.equal(context.scriptureSearchOwnsViewport(), false, 'A real rotation releases the old canvas');
assert.equal(root.dataset.scriptureSearch, undefined);
assert.ok(controlPositions > 0);
assert.doesNotMatch(source.slice(start, end), /\.style\.setProperty\("translate"|screenTop|--search-passage-height/, 'Never compensate keyboard scrolling by moving the scripture');
console.log('Search keyboard interaction: native tap prevention, focus, selection, dragging, pinch, document scroll, dismissal, and rotation passed.');
