import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('function deferViewportRefreshForActiveInput()');
const end = source.indexOf('function captureReaderScroll(', start);
let queued;
let blurred;
let renders = 0;
const document = { activeElement: null, visibilityState: 'visible', documentElement: { dataset: {} },
  addEventListener(name, callback) { assert.equal(name, 'focusout'); blurred = callback; } };
const context = vm.createContext({ document, state: { mode: 'reader' },
  scriptureSearchOwnsViewport: () => false,
  clearTimeout() { queued = null; }, setTimeout(callback) { queued = callback; return 1; },
  renderPreservingReaderScroll() { renders++; },
  schedulePresentationViewportFit() { renders++; },
});
vm.runInContext('let presentationResizeTimer; let inputViewportRefreshPending = false;\n' + source.slice(start, end), context);
for (const mode of ['reader', 'parallel', 'trivia', 'big']) {
  context.state.mode = mode;
  for (const selector of ['input[type="search"]', 'input[type="email"]', 'input[type="password"]', 'textarea', 'input[type="text"]', 'input:not([type])', 'input[type="number"]', '[contenteditable="true"]']) {
    document.activeElement = null;
    queued = null;
    context.renderAfterViewportChangePreservingReaderScroll();
    const previous = queued;
    const before = renders;
    document.activeElement = { matches: selectors => selectors.split(', ').includes(selector) };
    previous?.();
    for (let i = 0; i < 3; i++) context.renderAfterViewportChangePreservingReaderScroll();
    assert.equal(renders, before, `${mode}/${selector}: opening keyboard preserves the editor`);
    assert.equal(queued, null, 'Cancel refresh queued before focus');
    blurred();
    const transfer = queued;
    document.activeElement = { matches: selectors => selectors.includes('input[type="password"]') };
    transfer();
    assert.equal(renders, before, 'Focus transfer must preserve form and password');
    document.activeElement = null;
    blurred();
    queued();
    if (mode !== 'big') queued();
    assert.equal(renders, before + 1, 'Layout resumes after editing ends');
  }
}
for (const selector of ['input[type="checkbox"]', 'input[type="range"]', 'button']) {
  document.activeElement = { matches: selectors => selectors.split(', ').includes(selector) };
  assert.equal(context.deferViewportRefreshForActiveInput(), false, `${selector} must not defer layout`);
}
console.log('All-editor keyboard insets, queued refreshes, focus transfers, and blur recovery passed.');
