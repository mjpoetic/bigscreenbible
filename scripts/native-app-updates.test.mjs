import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const names = ['isLocalNativeAppBuild', 'localNativeAppUpdateMessage', 'appUpdateControls',
  'appUpdateMetadataUrl', 'isPublishedAppVersionNewer', 'checkForAppUpdate', 'applyAppUpdate'];
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
