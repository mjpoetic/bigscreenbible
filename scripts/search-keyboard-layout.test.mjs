import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('const scriptureSearchInputSelector');
const end = source.indexOf('document.addEventListener("focusin", beginScriptureSearchViewport)', start);
const props = {};
const root = { dataset: {}, style: {
  setProperty: (key, value) => { props[key] = value; },
  removeProperty: (key) => { delete props[key]; },
} };
let height = 844;
const context = vm.createContext({
  state: { mode: 'reader' }, window: { innerWidth: 390 },
  document: { documentElement: root, querySelector: () => ({ getBoundingClientRect: () => ({ height }) }) },
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
console.log('Search keyboard canvas: Reader, Parallel, Big Screen, focus transfer, dismissal and rotation passed.');
