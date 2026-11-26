import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const names = ['bindReaderVerseHold', 'beginReaderVerseHold', 'startReaderVerseHoldSelection', 'interruptReaderVerseHold', 'updateReaderVerseHold', 'moveReaderVerseHold', 'hitTestReaderVerseHold', 'scrollReaderVerseHold', 'endReaderVerseHold', 'finishReaderVerseHold'];
let timer, renders = 0, haptics = [], hit = null, lookups = [];
const taggedWord = { isConnected: true };
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
  selectionBarIsVisible: () => false, animateSelectionBarReveal() {},
  renderPreservingReaderScroll: () => renders++, openStrongPopup: word => lookups.push(word), surface,
});
vm.runInContext(`let readerVerseHold = null, suppressReaderVerseClickUntil = 0; const readerVerseHoldRowSelector = "[data-verse], [data-focused-reader-verse]"; ${names.map(extract).join('\n')}`, context);
const run = code => vm.runInContext(code, context);
function start(n = 3, word = null) {
  context.event = { currentTarget: surface, target: { closest: selector => selector === '[data-verse], [data-focused-reader-verse]' ? rows[n - 1] : selector === '[data-strong]' ? word : null },
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

const release = 'endReaderVerseHold({type:"touchend", cancelable:true, preventDefault(){}, stopImmediatePropagation(){}})';
context.state.selectedVerses = [];
start(3, taggedWord); timer();
assert.deepEqual(context.state.selectedVerses, [], 'Holding a tagged word waits for release or drag');
move(103, 203); run(release);
assert.deepEqual(lookups, [taggedWord], 'Holding and releasing opens the lookup despite minor finger drift');
start(3, taggedWord); timer(); hit = rows[4]; move(100, 250); run(release);
assert.equal(lookups.length, 1, 'A drag never opens Strong’s');
assert.deepEqual(Array.from(context.state.selectedVerses), [3, 4, 5]);
start(3, taggedWord); timer(); run('endReaderVerseHold({type:"touchcancel"})');
assert.equal(lookups.length, 1, 'Cancellation never opens Strong’s');

// Both native platforms bind the gesture; browsers bind it when the passage has tags.
let bindings = 0;
const bindingSurface = { classList: classes(), querySelector: () => null, addEventListener() { bindings++; } };
context.bindingSurface = bindingSurface;
for (const platform of ['ios', 'android', 'web']) {
  context.window.Capacitor = { getPlatform: () => platform, isNativePlatform: () => platform !== 'web' };
  bindings = 0; run('bindReaderVerseHold(bindingSurface)');
  assert.equal(bindings, 3, platform);
}
context.window.Capacitor = { getPlatform: () => 'android', isNativePlatform: () => false };
bindings = 0; run('bindReaderVerseHold(bindingSurface)');
assert.equal(bindings, 3, 'Touch web binds both word drag and verse hold');
console.log('Verse hold binding and tagged touch lookup passed.');
