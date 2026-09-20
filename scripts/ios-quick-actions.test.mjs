import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const handler = source.match(/function handleNativeQuickAction\([^]*?\n\}/)[0];
const focusHandler = source.match(/function focusFocusModeSearch\([^]*?\n\}/)[0];
let platform = 'ios', renders = 0, focused = '', selected = '', workspace = '', resetSource = '', desktopVisible = false;
const animationFrames = [];
let versionLoading = false, loadOnRender = false;
const state = { startupApplied: false, mode: 'big', focusMode: false, settingsOpen: true, accountOpen: true, libraryOpen: true };
const context = vm.createContext({
  state, window: { Capacitor: { getPlatform: () => platform } },
  resetFocusToolSurfaces() {},
  switchMode(mode, options) { assert.equal(options.immediate, true); state.mode = mode; },
  renderPreservingReaderScroll() { renders++; if (loadOnRender) versionLoading = true; },
  activeBibleVersionLoadingState() { return versionLoading ? { versions: ['CEV'] } : null; },
  resetSearchForSource(source) { resetSource = source; },
  shortcutWorkspace(target) { workspace = target; if (state.focusMode) vm.runInContext('focusFocusModeSearch()', context); },
  requestAnimationFrame(callback) { animationFrames.push(callback); },
  document: { getElementById(id) { return { getClientRects() { return desktopVisible ? [{}] : []; }, focus() { focused = id; }, select() { selected = id; } }; } },
});
vm.runInContext(`let dataLoading = true, dataError = null; ${handler} ${focusHandler}`, context);
const run = code => vm.runInContext(code, context);
assert.equal(run('handleNativeQuickAction("reader")'), false, 'Cold launch waits for data');
run('dataLoading = false');
assert.equal(run('handleNativeQuickAction("reader")'), false, 'Startup preference restoration must finish first');
state.startupApplied = true;
for (const [action, mode] of [['reader','reader'], ['parallel','parallel'], ['games','trivia'], ['search','reader']]) {
  assert.equal(run(`handleNativeQuickAction('${action}')`), true);
  assert.equal(state.mode, mode);
}
assert.equal(state.settingsOpen, false); assert.equal(state.accountOpen, false);
assert.equal(workspace, 'Search'); assert.equal(resetSource, 'scripture');
assert.equal(focused, 'studySearchInput', 'Search focuses synchronously before the native call returns, without waiting for an animation frame'); assert.equal(selected, focused);
state.focusMode = true;
run('handleNativeQuickAction("search")'); assert.equal(focused, 'mobileFocusPassageInput');
assert.equal(state.focusReferenceOpen, true, 'Mobile search popover is open');
desktopVisible = true;
run('handleNativeQuickAction("search")'); assert.equal(focused, 'referenceInput');
assert.equal(state.focusReferenceOpen, false);
assert.equal(run('handleNativeQuickAction("constructor")'), false);
assert.equal(run('handleNativeQuickAction("big")'), false);
platform = 'web'; assert.equal(run('handleNativeQuickAction("reader")'), false);
platform = 'ios'; run('dataError = "offline"'); assert.equal(run('handleNativeQuickAction("reader")'), false);
assert.equal(renders, 8);
run('dataError = null');
for (const focusMode of [false, true]) {
  state.focusMode = focusMode;
  desktopVisible = false;
  state.selectedVerses = [23];
  state.keyboardSelectionAnchor = 23;
  focused = ''; workspace = '';
  loadOnRender = true;
  assert.equal(run('handleNativeQuickAction("search")'), false, 'A translation load started by rendering keeps the native action queued');
  assert.equal(focused, '', 'Do not open a keyboard that the translation completion will dismiss');
  assert.equal(workspace, '', 'Wait before opening and focusing Search');
  assert.equal(state.selectedVerses.length, 0, 'Restored selection toolbar must not cover Search');
  assert.equal(state.keyboardSelectionAnchor, null);
  assert.equal(run('handleNativeQuickAction("search")'), false, 'Native retries continue while CEV loads');
  loadOnRender = false;
  versionLoading = false;
  assert.equal(run('handleNativeQuickAction("search")'), true, 'Acknowledge the native action after the translation completion render');
  assert.equal(focused, focusMode ? 'mobileFocusPassageInput' : 'studySearchInput', 'Focus synchronously from the native retry in both layouts');
}
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
console.log('iOS quick actions: startup gating, all routes, search focus, platform guards, four menu items and matching glyphs passed.');
