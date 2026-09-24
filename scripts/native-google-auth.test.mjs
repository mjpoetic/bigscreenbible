import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('function nativeGoogleAuthPlugin()');
const end = source.indexOf('\nasync function activateRememberedAccount', start);
const code = source.slice(start, end);
function harness({ native = true, available = true, callback = 'com.bigscreenbible.app://auth/callback?code=test-code', failure, exchangeFailure, signedIn = false, hold = false } = {}) {
  const calls = [];
  let release;
  const gate = hold ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  const context = vm.createContext({
    URL, console, clearTimeout, cloudSyncTimer: 0,
    state: { authUser: signedIn ? { id: 'existing-user' } : null },
    window: { location: { origin: 'https://bigscreenbible.com' }, Capacitor: {
      isNativePlatform: () => native, isPluginAvailable: () => available,
      registerPlugin: () => ({ open: async args => { calls.push(['open', args]); await gate; if (failure) throw failure; return { url: callback }; } }),
    } },
    createSupabaseClient: () => ({ auth: {
      signInWithOAuth: async args => { calls.push(['oauth', args]); return { data: { url: 'https://yyldnatfhzobyeqnvqjv.supabase.co/auth/v1/authorize?provider=google' } }; },
      exchangeCodeForSession: async value => { calls.push(['exchange', value]); return { error: exchangeFailure }; },
    } }),
    renderPreservingReaderScroll() {}, showToast() {},
    rememberedAccounts: () => [], pendingAccountSwitch: () => signedIn,
    setPendingAccountSwitch: value => calls.push(['pending', value]),
    captureCloudSnapshot: () => ({ owner: 'existing-user' }),
    rememberCurrentAccountSession: async () => {}, saveSnapshotForOwner: () => {},
    upsertCloudSnapshot: async () => {}, unlinkPushSubscriptionFromCurrentAccount: async () => calls.push(["unlink"]),
  });
  vm.runInContext(code, context);
  return { context, calls, release, run: () => context.signInWithGoogle() };
}
for (const signedIn of [false, true]) {
  const h = harness({ signedIn }); await h.run();
  assert.equal(h.calls.find(x => x[0] === 'oauth')[1].options.skipBrowserRedirect, true);
  assert.equal(h.calls.find(x => x[0] === 'oauth')[1].options.redirectTo, 'com.bigscreenbible.app://auth/callback');
  assert.equal(h.calls.find(x => x[0] === 'exchange')[1], 'test-code');
  assert.equal(h.context.state.authMessage, 'Signed in.');
  assert.equal(h.context.state.authBusy, false);
}
for (const callback of ['https://bigscreenbible.com/?code=bad', 'com.bigscreenbible.app://evil/callback?code=bad', 'com.bigscreenbible.app://auth/other?code=bad', 'com.bigscreenbible.app://auth/callback', 'com.bigscreenbible.app://auth/callback?error=access_denied', 'com.bigscreenbible.app://auth/callback#access_token=bad']) {
  const h = harness({ callback }); await h.run();
  assert.ok(!h.calls.some(x => x[0] === 'exchange'));
  assert.equal(h.context.state.authBusy, false);
}
const canceled = harness({ failure: { code: 'CANCELED' }, signedIn: true }); await canceled.run();
assert.equal(canceled.context.state.authMessage, 'Google sign in canceled.');
assert.equal(canceled.context.state.authUser.id, 'existing-user');
assert.ok(!canceled.calls.some(x => x[0] === 'unlink'), 'Cancel keeps the original account push subscription');
assert.ok(canceled.calls.some(x => x[0] === 'pending' && x[1] === false));
const failed = harness({ exchangeFailure: { message: 'Code expired' } }); await failed.run();
assert.equal(failed.context.state.authMessage, 'Code expired');
const oldApp = harness({ available: false }); await oldApp.run();
assert.ok(!oldApp.calls.some(x => x[0] === 'oauth'));
assert.match(oldApp.context.state.authMessage, /Update/);
const web = harness({ native: false }); await web.run();
assert.equal(web.calls[0][1].options.redirectTo, 'https://bigscreenbible.com');
assert.equal(web.calls[0][1].options.skipBrowserRedirect, undefined);
assert.ok(!web.calls.some(x => x[0] === 'open'));
const duplicate = harness({ hold: true });
const first = duplicate.run(); await duplicate.run();
duplicate.release(); await first;
assert.equal(duplicate.calls.filter(x => x[0] === 'oauth').length, 1);
const clientFactory = source.slice(source.indexOf('function createSupabaseClient()'), source.indexOf('async function authenticatedSupabaseSession'));
for (const native of [true, false]) {
  let options;
  const context = vm.createContext({
    state: { authConfigured: true },
    supabaseCredentials: () => ({ url: 'https://example.supabase.co', anonKey: 'public-test-key' }),
    window: { Capacitor: { isNativePlatform: () => native }, supabase: { createClient: (url, key, config) => { options = config; return {}; } } },
  });
  vm.runInContext(clientFactory, context);
  context.createSupabaseClient();
  assert.equal(options.auth.flowType, native ? 'pkce' : undefined);
  assert.equal(options.auth.persistSession, true);
}
assert.match(source, /isNativePlatform\?\.\(\) \? \{ flowType: "pkce" \}/);
console.log('Native Google auth passed: callback validation, PKCE routing, cancellation, errors, account preservation, old apps, web flow, duplicate taps.');
