import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const names = ['isLocalNativeAppBuild', 'localNativeAppUpdateMessage', 'appReleaseNotesMarkup', 'appUpdateControls',
  'appUpdateButtonLabel', 'runAppUpdateAction', 'runSettingsUpdateShortcut', 'appUpdateMetadataUrl', 'isPublishedAppVersionNewer', 'checkForAppUpdate', 'applyAppUpdate'];
const functions = names.map((name) => {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n}', start) + 2);
}).join('\n');

for (const [href, native, local] of [
  ['capacitor://localhost/index.html', true, true],
  ['https://localhost/index.html', true, true],
  ['https://bigscreenbible.com/', true, false],
  ['https://bigscreenbible.com/', false, false],
  ['http://localhost:5173/', false, false],
]) {
  let requests = 0;
  const context = vm.createContext({
    window: { location: new URL(href), Capacitor: { isNativePlatform: () => native },
      setTimeout, clearTimeout },
    URL, Date, AbortController, console,
    state: { appUpdateBusy: false }, appVersion: '2026.09.19.3', lastAppUpdateCheckAt: 0,
    escapeHtml: (value) => String(value || ''), renderAppUpdateStatus() {},
    fetch: async (url, options) => {
      requests++;
      assert.equal(url.origin, new URL(href).origin);
      assert.equal(url.pathname, '/app-version.json');
      assert.equal(options.cache, 'no-store');
      return { ok: true, json: async () => ({ version: '2026.09.19.4' }) };
    },
  });
  vm.runInContext(functions, context);
  assert.equal(vm.runInContext('isLocalNativeAppBuild()', context), local, href);
  await vm.runInContext('checkForAppUpdate({ manual: true })', context);
  assert.equal(requests, local ? 0 : 1, href);
  const markup = vm.runInContext('appUpdateControls()', context);
  if (local) {
    assert.match(markup, /Local test build/);
    assert.doesNotMatch(markup, /<button|latest version/);
    assert.match(context.state.appUpdateStatus, /cannot receive website updates/);
    assert.equal(context.state.appUpdateAvailable, false);
    await vm.runInContext('applyAppUpdate()', context);
    assert.equal(requests, 0, 'Local refresh must not fetch or navigate');
  } else {
    assert.equal(context.state.appUpdateAvailable, true);
    assert.match(markup, /Update now/);
  }
}
console.log('Native local builds and live-site update detection passed');

const messages = [];
const shortcutState = { appUpdateBusy: false };
let checks = 0;
const shortcut = vm.createContext({
  window: { location: new URL('https://bigscreenbible.com/'), setTimeout, clearTimeout },
  URL, Date, AbortController, console,
  state: shortcutState, appVersion: '2026.11.25.35', lastAppUpdateCheckAt: 0,
  renderAppUpdateStatus() {},
  showToast: (message, options) => messages.push({ message, pending: Boolean(options?.pending) }),
  fetch: async () => {
    checks++;
    return { ok: true, json: async () => ({ version: '2026.11.25.35' }) };
  },
});
vm.runInContext(functions, shortcut);
const updateCheck = vm.runInContext('runSettingsUpdateShortcut()', shortcut);
assert.deepEqual(messages, [{ message: 'Checking for updates…', pending: true }]);
await updateCheck;
assert.equal(checks, 1);
assert.equal(shortcutState.appUpdateRefreshOffered, true);
assert.match(messages.at(-1).message, /Hold Settings again to refresh/);
assert.equal(messages.at(-1).pending, false);
await vm.runInContext('checkForAppUpdate()', shortcut);
assert.equal(shortcutState.appUpdateRefreshOffered, true, 'Background checks preserve the refresh option');
let refreshes = 0;
shortcut.applyAppUpdate = () => refreshes++;
await vm.runInContext('runSettingsUpdateShortcut()', shortcut);
assert.equal(refreshes, 1);
assert.equal(checks, 2, 'The second hold refreshes without another update check');
console.log('Settings hold checks and refreshes passed');

const restoreFunctions = ['applyStartupExperience', 'currentAppUpdateRestoreState', 'applyAppUpdateRestoreState']
  .map(name => {
    const start = source.search(new RegExp(`(?:async )?function ${name}\\(`));
    return source.slice(start, source.indexOf('\n}', start) + 2);
  }).join('\n');
for (const mode of ['reader', 'parallel', 'big', 'trivia']) {
  const context = vm.createContext({
    Date, Number, Boolean,
    state: { mode, reference: 'Joel 2', verse: 23, selectedVerses: [], focusMode: true,
      isVerseOfDayActive: true, verseOfDayItem: { reference: 'Joel 2:23' }, sharedPassage: null },
    bibleData: { 'Joel 2': { verses: [{ n: 23 }] } },
    captureReaderScroll: () => ({ scriptureTop: 120 }),
    sharedReferenceFromUrl: () => 'Joel 2:23', requestedModeFromUrl: () => mode,
    sharedVersesFromUrl: () => [], setReferenceFromString: () => true,
    applySharedVersionFromUrl: () => { throw new Error('Update must not apply shared-link versions'); },
    resolvedVerseOfDay: () => { throw new Error('Update must not replace the reading location'); },
  });
  vm.runInContext(restoreFunctions, context);
  const saved = vm.runInContext('currentAppUpdateRestoreState("next")', context);
  context.state.startVerseOfDay = true;
  await vm.runInContext('applyStartupExperience({ updateReload: true })', context);
  assert.equal(context.state.mode, mode);
  assert.equal(context.state.sharedPassage, null, 'Update references are not shared passages');
  // Also recover snapshots written before sharedPassage was included.
  delete saved.sharedPassage;
  context.state.sharedPassage = { verses: [23] };
  context.saved = saved;
  vm.runInContext('applyAppUpdateRestoreState(saved)', context);
  assert.equal(context.state.sharedPassage, null);
  assert.equal(context.state.focusMode, true);
  assert.equal(context.state.isVerseOfDayActive, true);
  assert.equal(context.state.verse, 23);
  context.state.sharedPassage = { verses: [23] };
  context.saved = vm.runInContext('currentAppUpdateRestoreState("next")', context);
  context.state.sharedPassage = null;
  vm.runInContext('applyAppUpdateRestoreState(saved)', context);
  assert.deepEqual([...context.state.sharedPassage.verses], [23], 'Genuine shared passages survive updates');
}
console.log('Update startup and shared-passage restoration passed');
