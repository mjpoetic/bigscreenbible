import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const handler = source.match(/function handleNativeQuickAction\([^]*?\n\}/)[0];
let platform = 'ios', renders = 0, focused = '', selected = '', workspace = '', resetSource = '';
const state = { startupApplied: false, mode: 'big', focusMode: false, settingsOpen: true, accountOpen: true, libraryOpen: true };
const context = vm.createContext({
  state, window: { Capacitor: { getPlatform: () => platform } },
  resetFocusToolSurfaces() {},
  switchMode(mode, options) { assert.equal(options.immediate, true); state.mode = mode; },
  renderPreservingReaderScroll() { renders++; },
  resetSearchForSource(source) { resetSource = source; },
  shortcutWorkspace(target) { workspace = target; },
  requestAnimationFrame(callback) { callback(); },
  document: { getElementById(id) { return { focus() { focused = id; }, select() { selected = id; } }; } },
});
vm.runInContext(`let dataLoading = true, dataError = null; ${handler}`, context);
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
assert.equal(focused, 'studySearchInput'); assert.equal(selected, focused);
state.focusMode = true;
run('handleNativeQuickAction("search")'); assert.equal(focused, 'referenceInput');
assert.equal(run('handleNativeQuickAction("constructor")'), false);
assert.equal(run('handleNativeQuickAction("big")'), false);
platform = 'web'; assert.equal(run('handleNativeQuickAction("reader")'), false);
platform = 'ios'; run('dataError = "offline"'); assert.equal(run('handleNativeQuickAction("reader")'), false);
assert.equal(renders, 5);
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
