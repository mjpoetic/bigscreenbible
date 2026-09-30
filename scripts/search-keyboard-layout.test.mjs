import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('const scriptureSearchInputSelector');
const end = source.indexOf('// Capture before the browser performs', start);
const props = {};
const root = { dataset: {}, style: {
  setProperty: (key, value) => { props[key] = value; },
  removeProperty: (key) => { delete props[key]; },
} };
let height = 844;
let passageTop = 80;
let translated = 0;
const viewport = { offsetTop: 0 };
const passage = {
  isConnected: true,
  getBoundingClientRect: () => ({ top: passageTop + translated, height: 764 }),
  style: {
    setProperty: (name, value) => { if (name === 'translate') translated = Number.parseFloat(value.split(' ')[1]); },
    removeProperty: () => { translated = 0; },
  },
};
const context = vm.createContext({
  state: { mode: 'reader' }, window: { innerWidth: 390, visualViewport: viewport },
  document: { documentElement: root, querySelector: (selector) => ['.scripture', '.presentation-text'].includes(selector) ? passage : ({ getBoundingClientRect: () => ({ height }) }) },
  clearTimeout() {}, readerScrollRestoreGeneration: 0,
  readerViewportRestoreTimer: 1, presentationResizeTimer: 2,
});
vm.runInContext(source.slice(start, end), context);
const focus = { target: { matches: () => true } };
for (const mode of ['reader', 'parallel', 'big']) {
  context.state.mode = mode;
  height = 844;
  context.beginScriptureSearchViewport(focus);
  assert.equal(props['--search-scripture-height'], '844px');
  height = 500; // Keyboard shrinks the available browser/native viewport.
  context.beginScriptureSearchViewport(focus);
  assert.equal(props['--search-scripture-height'], '844px', 'Focus transfer must retain the pre-keyboard canvas');
  assert.equal(context.scriptureSearchOwnsViewport(), true);
  assert.equal(root.dataset.scriptureSearch, 'true');
  viewport.offsetTop = 230;
  context.anchorScriptureSearchToScreen();
  assert.equal(passage.getBoundingClientRect().top - viewport.offsetTop, 80, 'iOS viewport panning keeps the passage at its original screen position');
  context.anchorScriptureSearchToScreen();
  assert.equal(translated, 230, 'Repeated viewport events do not accumulate movement');
  passageTop = 50; // Native window pan can also move layout rectangles.
  context.anchorScriptureSearchToScreen();
  assert.equal(passage.getBoundingClientRect().top - viewport.offsetTop, 80, 'Layout and visual viewport movement are both compensated');
  passageTop = 80;
  viewport.offsetTop = 0;
  context.anchorScriptureSearchToScreen();
  assert.equal(translated, 0, 'Keyboard dismissal restores the original geometry');
  context.endScriptureSearchViewport();
  assert.equal(root.dataset.scriptureSearch, undefined);
  assert.equal(props['--search-scripture-height'], undefined);
}
height = 844;
context.beginScriptureSearchViewport(focus);
context.window.innerWidth = 844;
assert.equal(context.scriptureSearchOwnsViewport(), false, 'Rotation releases the pinned portrait canvas');
assert.equal(root.dataset.scriptureSearch, undefined);
assert.equal(context.readerScrollRestoreGeneration, 4, 'Focus invalidates stale queued scroll restores');
console.log('Search keyboard canvas: Reader, Parallel, Big Screen, viewport panning, repeated events, focus transfer, dismissal and rotation passed.');
