import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const handler = source.match(/function handleNativeQuickAction\([^]*?\n\}/)[0];
const nativePlatform = process.env.BSB_QUICK_ACTION_PLATFORM || 'ios';
let platform = nativePlatform, renders = 0, popupOpens = 0, searched;
const state = { startupApplied: false, mode: 'big', focusMode: false, settingsOpen: true, accountOpen: true };
const context = vm.createContext({
  state, window: { Capacitor: { getPlatform: () => platform } },
  document: { getElementById() { return null; } },
  openQuickActionSearch() { popupOpens++; return true; },
  resetFocusToolSurfaces() {}, resetSearchForSource() {},
  switchMode(mode, options) { assert.equal(options.immediate, true); state.mode = mode; },
  renderPreservingReaderScroll() { renders++; },
  runReferenceOrPhraseSearch(query, options) { searched = { query, ...options }; },
});
const submit = source.match(/function submitQuickActionSearch\([^]*?\n\}/)[0];
vm.runInContext(`let dataLoading = true, dataError = null; ${handler} ${submit}`, context);
const run = code => vm.runInContext(code, context);
assert.equal(run('handleNativeQuickAction("search")'), false);
run('dataLoading = false');
assert.equal(run('handleNativeQuickAction("search")'), false);
state.startupApplied = true;
for (const [action, mode] of [['reader','reader'], ['parallel','parallel'], ['games','trivia']]) {
  assert.equal(run(`handleNativeQuickAction('${action}')`), true);
  assert.equal(state.mode, mode);
}
assert.equal(renders, 3);
for (const mode of ['reader', 'parallel', 'big', 'trivia']) {
  for (const focusMode of [false, true]) {
    state.mode = mode; state.focusMode = focusMode;
    assert.equal(run('handleNativeQuickAction("search")'), true);
    assert.equal(state.mode, mode, 'Opening the popup preserves the underlying mode');
    assert.equal(state.focusMode, focusMode);
    assert.equal(renders, 3, 'No input-destroying app render when opening search');
    run('submitQuickActionSearch("love")');
    assert.equal(state.mode, mode === 'trivia' ? 'reader' : mode);
    assert.equal(searched.query, 'love');
    assert.equal(searched.source, 'scripture');
    assert.equal(searched.scope, 'all');
  }
}
assert.equal(popupOpens, 8);
assert.equal(run('handleNativeQuickAction("constructor")'), false);
platform = 'web'; assert.equal(run('handleNativeQuickAction("search")'), false);
platform = nativePlatform; run('dataError = "offline"'); assert.equal(run('handleNativeQuickAction("search")'), false);
// Exercise the real dialog lifecycle, including duplicate actions and cleanup.
const openPopup = source.match(/function openQuickActionSearch\([^]*?\n\}/)[0];
let mounted = null, focusedInput = null, searchSubmission = null;
const listeners = new Map();
const viewportListeners = new Map();
const input = { value: '', focus() { focusedInput = this; } };
const form = { addEventListener(type, fn) { listeners.set(type, fn); } };
const closeButton = { addEventListener(type, fn) { listeners.set('closeButton', fn); } };
const dialog = {
  style: {}, open: false, setAttribute() {},
  querySelector(selector) { return selector === 'input' ? input : selector === 'form' ? form : closeButton; },
  addEventListener(type, fn) { listeners.set(type, fn); },
  showModal() { assert.equal(mounted, this); this.open = true; },
  close() { this.open = false; listeners.get('close')(); },
  remove() { mounted = null; },
};
const events = { addEventListener(type, fn) { viewportListeners.set(type, fn); }, removeEventListener(type) { viewportListeners.delete(type); } };
const popupContext = vm.createContext({
  icons: { search: '<svg></svg>' },
  document: { getElementById() { return mounted; }, createElement() { return dialog; }, body: { append(node) { mounted = node; } } },
  window: { ...events, visualViewport: events },
  fixedPopoverViewport() { return { offsetTop: 0, height: 844 }; },
  submitQuickActionSearch(query) { searchSubmission = query; },
});
vm.runInContext(openPopup, popupContext);
assert.equal(popupContext.openQuickActionSearch(), true);
assert.equal(focusedInput, input, 'The real popup focuses immediately');
input.value = 'John 3:16';
popupContext.openQuickActionSearch();
assert.equal(input.value, 'John 3:16', 'Repeated native actions retain typed text');
let prevented = false;
listeners.get('submit')({ preventDefault() { prevented = true; } });
assert.ok(prevented);
assert.equal(searchSubmission, 'John 3:16');
assert.equal(mounted, null);
assert.equal(viewportListeners.size, 0, 'Closing removes viewport listeners');
const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
assert.equal((plist.match(/<key>UIApplicationShortcutItemType<\/key>/g) || []).length, 4);
for (const [action, glyph] of [['reader','book'], ['parallel','parallel'], ['games','games'], ['search','search']]) {
  assert.ok(plist.includes(`com.bigscreenbible.app.${action}`));
  const name = `QuickAction${action[0].toUpperCase()}${action.slice(1)}`;
  assert.ok(plist.includes(`<string>${name}</string>`));
  const svg = readFileSync(new URL(`../ios/App/App/Assets.xcassets/${name}.imageset/icon.svg`, import.meta.url), 'utf8');
  const original = source.match(new RegExp(`^  ${glyph}: '([^']+)'`, 'm'))[1];
  assert.equal(svg.trim().replace(' xmlns="http://www.w3.org/2000/svg" width="35" height="35"', '').replaceAll('#000000', 'currentColor'), original);
}
console.log(`${nativePlatform} quick actions: startup gating, all routes, search focus, platform guards, four menu items and matching glyphs passed.`);

if (nativePlatform === 'android') {
  const read = path => readFileSync(new URL(`../android/app/src/main/${path}`, import.meta.url), 'utf8');
  const shortcuts = read('res/xml/shortcuts.xml');
  assert.ok(read('AndroidManifest.xml').includes('android:resource="@xml/shortcuts"'));
  assert.equal((shortcuts.match(/<shortcut /g) || []).length, 4);
  for (const action of ['reader', 'parallel', 'games', 'search']) {
    assert.ok(shortcuts.includes(`android:action="com.bigscreenbible.app.shortcut.${action}"`));
    assert.ok(shortcuts.includes(`android:icon="@drawable/shortcut_${action}"`));
    assert.ok(read('res/values/strings.xml').includes(`name="shortcut_${action}"`));
    assert.ok(read(`res/drawable/shortcut_${action}.xml`).includes('<vector'));
  }
  console.log('Android launcher metadata: four explicit intents, labels and vector icons passed.');
}
