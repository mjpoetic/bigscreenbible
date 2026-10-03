import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
const code = source.slice(source.indexOf('let appleSignInInProgress'), source.indexOf('\nasync function activateRememberedAccount'));
async function run({ios = true, failure, available = true, signedIn = false, metadataFailure = false} = {}) {
  const calls = [];
  const context = vm.createContext({ console, clearTimeout, cloudSyncTimer: 0,
    state: { authUser: signedIn ? { id: 'old-user' } : null },
    window: { location: { origin: 'https://bigscreenbible.com' }, Capacitor: {
      isNativePlatform: () => ios, getPlatform: () => 'ios', isPluginAvailable: () => available,
      registerPlugin: () => ({signIn: async () => { if (failure) throw failure; return { identityToken: 'test-token', nonce: 'raw-nonce', fullName: 'Test User' }; }})
    } },
    nativeGoogleAuthPlugin: () => ios ? {} : null,
    createSupabaseClient: () => ({auth: {
      signInWithIdToken: async args => {calls.push(['token', args]); return {};},
      signInWithOAuth: async args => {calls.push(['oauth', args]); return {};},
      updateUser: async args => {calls.push(['name', args]); return {error: metadataFailure ? new Error('metadata failed') : null};}
    }}),
    renderPreservingReaderScroll() {}, showToast() {},
    captureCloudSnapshot: () => ({}), rememberCurrentAccountSession: async () => {},
    saveSnapshotForOwner() {}, setPendingAccountSwitch: value => calls.push(['pending', value]),
    upsertCloudSnapshot: async () => {}, unlinkPushSubscriptionFromCurrentAccount: async () => calls.push(['unlink']),
  });
  vm.runInContext(code, context); await context.signInWithApple();
  return {calls, state: context.state};
}
const native = await run();
assert.equal(native.calls[0][1].provider, 'apple');
assert.equal(native.calls[0][1].nonce, 'raw-nonce');
assert.equal(native.calls[0][1].token, 'test-token');
assert.equal(native.calls[1][1].data.full_name, 'Test User');
assert.equal(native.state.authMessage, 'Signed in.');
const canceled = await run({failure: {code: 'CANCELED'}, signedIn: true});
assert.equal(canceled.state.authUser.id, 'old-user');
assert.equal(canceled.state.authMessage, 'Apple sign in canceled.');
assert.ok(!canceled.calls.some(x => x[0] === 'token' || x[0] === 'unlink'));
const old = await run({available: false}); assert.match(old.state.authMessage, /Update/);
assert.equal(old.calls.length, 1); // pending switch reset on error
const web = await run({ios: false});
assert.equal(web.calls[0][1].provider, 'apple');
assert.equal(web.calls[0][1].options.redirectTo, 'https://bigscreenbible.com');
assert.equal(web.calls[0][1].options.queryParams, undefined);
console.log('Apple auth passed: native token/nonce, first name, cancellation/account preservation, old app, website OAuth.');
