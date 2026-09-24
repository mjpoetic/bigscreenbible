import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const names = ['bindReaderVerseHold', 'beginReaderVerseHold', 'interruptReaderVerseHold', 'updateReaderVerseHold', 'moveReaderVerseHold', 'hitTestReaderVerseHold', 'scrollReaderVerseHold', 'endReaderVerseHold', 'finishReaderVerseHold'];
let timer, renders = 0, haptics = [], hit = null;
const classes = () => ({ add() {}, remove() {}, toggle() {} });
const rows = [1, 2, 3, 4, 5].map(n => ({ dataset: { verse: String(n) }, classList: classes() }));
const surface = { isConnected: true, classList: classes(), contains: row => rows.includes(row), querySelectorAll: () => rows,
  closest: () => ({ classList: classes() }), querySelector: () => null, insertAdjacentHTML() {}, scrollTop: 100,
  getBoundingClientRect: () => ({ top: 0, bottom: 600 }), addEventListener() {} };
const context = vm.createContext({ state: { mode: 'reader', reference: 'John 1', selectedVerses: [] },
  window: { innerHeight: 600, addEventListener() {}, removeEventListener() {} },
  document: { hidden: false, addEventListener() {}, removeEventListener() {}, elementFromPoint: () => ({ closest: () => hit }) },
  setTimeout: fn => { timer = fn; return 1; }, clearTimeout: () => { timer = null; }, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  canUseReaderChapterSwipe: () => true, pauseReaderAutoScroll() {}, cancelReaderChapterSwipe() {}, cancelReaderTouchGesture() {},
  highlightClassForVerse: () => '', selectionBar: () => '<div></div>', playNativeHaptic: kind => haptics.push(kind),
  renderPreservingReaderScroll: () => renders++, surface,
});
vm.runInContext(`let readerVerseHold = null, suppressReaderVerseClickUntil = 0; ${names.map(extract).join('\n')}`, context);
const run = code => vm.runInContext(code, context);
function start(n = 3) {
  context.event = { currentTarget: surface, target: { closest: selector => selector === '[data-verse]' ? rows[n - 1] : null },
    touches: [{ identifier: 7, clientX: 100, clientY: 200 }] };
  run('beginReaderVerseHold(event)');
}
function move(x, y) {
  context.event = { touches: [{ identifier: 7, clientX: x, clientY: y }], cancelable: true, preventDefault() { this.prevented = true; }, stopImmediatePropagation() {} };
  run('moveReaderVerseHold(event)');
}
start(); move(100, 220); assert.equal(timer, null); assert.equal(run('readerVerseHold'), null, 'Scrolling cancels the pending hold');
start(); run('endReaderVerseHold({type:"touchend"})'); assert.equal(renders, 0, 'Quick taps retain normal behavior');
start(); timer(); assert.deepEqual(Array.from(context.state.selectedVerses), [3]); assert.equal(haptics.length, 1);
hit = rows[4]; move(100, 250); assert.deepEqual(Array.from(context.state.selectedVerses), [3,4,5]);
hit = rows[3]; move(100, 230); assert.deepEqual(Array.from(context.state.selectedVerses), [3,4], 'Dragging back shrinks selection');
hit = rows[0]; move(100, 100); assert.deepEqual(Array.from(context.state.selectedVerses), [1,2,3], 'Reverse selection crosses anchor');
run('readerVerseHold.y = 595; scrollReaderVerseHold(16)'); assert.ok(surface.scrollTop > 100, 'Edge holding scrolls');
run('endReaderVerseHold({type:"touchend", cancelable:true, preventDefault(){}, stopImmediatePropagation(){}})');
assert.equal(renders, 1); assert.deepEqual(Array.from(context.state.selectedVerses), [1,2,3]);
assert.ok(run('suppressReaderVerseClickUntil > Date.now()'), 'Compatibility click cannot deselect');
start(); timer(); run('interruptReaderVerseHold({touches:[{},{}]})'); assert.equal(run('readerVerseHold.suspended'), true);
run('beginReaderVerseHold({touches:[{},{}]})'); assert.equal(run('readerVerseHold.suspended'), true, 'Surface bubbling preserves pinch handoff');
run('endReaderVerseHold({type:"touchend",touches:[{}]})'); assert.ok(run('readerVerseHold'), 'Wait for pinch to finish');
run('endReaderVerseHold({type:"touchend",touches:[]})'); timer(); assert.equal(renders, 2);
context.state.mode = 'parallel'; start(); timer(); hit = rows[4]; move(100, 250);
assert.deepEqual(Array.from(context.state.selectedVerses), [3,4,5]);
run('endReaderVerseHold({type:"touchcancel"})'); assert.equal(run('readerVerseHold'), null);
console.log('Verse hold: scroll cancellation, taps, ranges, reversal, edge scroll, release, pinch handoff and Parallel passed.');

// Both native platforms bind the same gesture; browsers retain ordinary selection.
let bindings = 0;
const bindingSurface = { classList: classes(), addEventListener() { bindings++; } };
context.bindingSurface = bindingSurface;
for (const platform of ['ios', 'android', 'web']) {
  context.window.Capacitor = { getPlatform: () => platform, isNativePlatform: () => platform !== 'web' };
  bindings = 0; run('bindReaderVerseHold(bindingSurface)');
  assert.equal(bindings, platform === 'web' ? 0 : 3, platform);
}
context.window.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => false };
bindings = 0; run('bindReaderVerseHold(bindingSurface)');
assert.equal(bindings, 0, 'A non-native Android browser must not bind native selection');
console.log('Verse hold platform binding: iOS, Android, and browser isolation passed.');
