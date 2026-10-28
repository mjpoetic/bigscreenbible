import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('function showBibleReturnHint()'), source.indexOf('function presentation(accountPanelRerender'));
const storage = new Map();
let scrollTop = 0;
const state = { mode: 'big', searchResultsQuery: 'love one another', searchReturnScroll: 240, searchReturnAvailable: true };
const context = vm.createContext({state, icons: {arrowLeft: ''}, localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)}, renderPreservingReaderScroll() {}, requestAnimationFrame: fn => fn(), document: {querySelector: () => ({set scrollTop(value) {scrollTop = value;}})}});
vm.runInContext(functions, context);
assert.equal(context.showBibleReturnHint(), true);
state.tutorialActive = true;
assert.equal(context.showBibleReturnHint(), false);
state.tutorialActive = false;
state.presentationNoButtons = true;
assert.equal(context.showBibleReturnHint(), false);
state.presentationNoButtons = false;
context.dismissBibleReturnHint();
assert.equal(context.showBibleReturnHint(), false);
for (const [mode, focusMode] of [['big', false], ['reader', true], ['reader', false]]) {
  Object.assign(state, {mode, focusMode, libraryOpen: false, focusSearchResultsOpen: false, presentationSearchResultsOpen: false});
  assert.match(context.searchReturnAction(), /Back to search results/);
  context.returnToSearchResults();
  assert.equal(state.searchQuery, 'love one another');
  assert.equal(scrollTop, 240);
  assert.equal(context.searchReturnAction(), '');
  if (mode === 'big') assert.equal(state.presentationSearchResultsOpen, true);
  else if (focusMode) assert.equal(state.focusSearchResultsOpen, true);
  else assert.equal(state.activeRail, 'Search');
}
assert.match(source, /event\.stopPropagation\(\); returnToSearchResults\(\)/);
console.log('Reading discovery: tour exclusion, learned hint, and search return across modes passed.');

// Preview replays a previously dismissed hint and dismisses only for this page load.
state.mode = 'big';
state.tutorialIntroVisible = true;
state.bibleReturnPreview = true;
assert.equal(context.showBibleReturnHint(), true);
state.tutorialActive = true;
assert.equal(context.showBibleReturnHint(), false);
state.tutorialActive = false;
storage.delete('lw_bible_return_learned');
context.dismissBibleReturnHint();
assert.equal(context.showBibleReturnHint(), false);
assert.equal(storage.has('lw_bible_return_learned'), false);
state.bibleReturnPreviewDismissed = false;
assert.equal(context.showBibleReturnHint(), true);
console.log('Bible return preview replays without changing saved dismissal preferences.');
