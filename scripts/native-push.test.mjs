import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
// Guard the native lifecycle contract: Capacitor replaces the content controller
// between its configuration hook and its web-view creation hook.
const capacitorController = readFileSync(new URL('../node_modules/@capacitor/ios/Capacitor/Capacitor/CAPBridgeViewController.swift', import.meta.url), 'utf8');
const nativeController = readFileSync(new URL('../ios/App/App/SceneDelegate.swift', import.meta.url), 'utf8');
assert.match(capacitorController, /webConfig\.userContentController = delegationHandler\.contentController[\s\S]*?let aWebView = webView\(with:/);
assert.match(nativeController, /override func webView\(with frame: CGRect, configuration: WKWebViewConfiguration\)[\s\S]*?configuration\.userContentController\.addUserScript[\s\S]*?injectionTime: \.atDocumentStart[\s\S]*?return super\.webView\(with: frame, configuration: configuration\)/);
assert.doesNotMatch(nativeController, /override func webViewConfiguration\(/, 'Push configuration must not be injected into the controller that Capacitor discards');
const extract = name => app.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`))[0];
let permission = 'prompt', prompts = 0, registered = 0, unregistered = 0, serverReady = true;
const callbacks = {}, storage = new Map(), requests = [];
const state = { pushEnabled: false, pushBusy: false, pushPermissionDenied: false };
const plugin = {
  async addListener(name, callback) { callbacks[name] = callback; return { remove() {} }; },
  async checkPermissions() { return { receive: permission }; },
  async requestPermissions() { prompts++; return { receive: permission }; },
  async register() { registered++; callbacks.registration({ value: 'ab'.repeat(32) }); },
  async unregister() { unregistered++; },
};
const context = vm.createContext({
  state, console, setTimeout, clearTimeout, URL,
  window: { Capacitor: { getPlatform: () => 'ios', isPluginAvailable: () => true, Plugins: { PushNotifications: plugin } }, bsbAPNSEnvironment: 'development', location: { href: 'capacitor://localhost/' } },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  pushPreferences: () => ({ timezone: 'America/New_York' }), renderPreservingReaderScroll() {}, showToast() {},
  async pushFunctionRequest(method, body) { requests.push({ method, body }); return method === 'GET' ? { nativeEnabled: serverReady } : { deviceToken: 'opaque-device-secret' }; },
});
vm.runInContext(`let nativePushListenersPromise = null, nativePushRegistration = null;
const pushDeviceTokenStorageKey = 'token', pushPromptDismissedStorageKey = 'dismissed';
let dataLoading = false, dataError = null;
${['nativePushPlugin','nativeNotificationDestination','bindNativePushListeners','registerNativePushToken','enableNativePushNotifications','initializeNativePushNotifications','unsubscribePushDevice','clearLocalPushSubscription','pushApiSupported'].map(extract).join('\n')}`, context);
const run = code => vm.runInContext(code, context);
assert.equal(run('pushApiSupported()'), true, 'Native support works without browser PushManager, Notification or service workers');
await run('initializeNativePushNotifications()'); assert.equal(prompts, 0); assert.equal(registered, 0);
permission = 'denied'; await run('enableNativePushNotifications()'); assert.equal(state.pushPermissionDenied, true); assert.match(state.pushStatus, /iPhone Settings/); assert.equal(registered, 0);
permission = 'granted'; await run('enableNativePushNotifications()'); assert.equal(state.pushEnabled, true); assert.equal(storage.get('token'), 'opaque-device-secret');
assert.equal(requests.at(-1).body.action, 'subscribe-native'); assert.equal(requests.at(-1).body.nativeSubscription.environment, 'development');
await run('initializeNativePushNotifications()'); assert.equal(registered, 2, 'Enabled app refreshes APNs token on startup without a permission prompt');
assert.equal(prompts, 2);
serverReady = false; await run('enableNativePushNotifications()'); assert.match(state.pushStatus, /still needs to be configured/); assert.equal(storage.get('token'), 'opaque-device-secret');
await run('unsubscribePushDevice()'); assert.equal(unregistered, 1);
for (const url of ['https://evil.test/', 'javascript:alert(1)', 'https://bigscreenbible.com/other']) assert.equal(run(`nativeNotificationDestination(${JSON.stringify(url)})`), null);
assert.equal(run('nativeNotificationDestination("https://bigscreenbible.com/?mode=reader")'), 'capacitor://localhost/?mode=reader');
run('window.bsbNativePushAvailable = false');
assert.equal(run('pushApiSupported()'), false, 'Personal Team test build cannot advertise unavailable native push');
console.log('Native push: permissions, token registration, renewal, setup errors, unsubscribe and trusted notification links passed.');
