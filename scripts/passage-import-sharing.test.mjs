import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const handlers = {};
const entries = new Map();
const cache = {
  async keys() { return [...entries.keys()].map(url => new Request(url)); },
  async put(key, response) { entries.set(key.url, response); },
  async match(key) { return entries.get(typeof key === 'string' ? key : key.url); },
  async delete(key) { return entries.delete(typeof key === 'string' ? key : key.url); },
};
const scope = {
  self: { location: { origin: 'https://bigscreenbible.com' }, addEventListener(type, handler) { handlers[type] = handler; } },
  URL, Request, Response, crypto,
  caches: { async open(name) { assert.equal(name, 'bsb-share-inbox'); return cache; } },
};
vm.createContext(scope);
vm.runInContext(read('push-sw.js'), scope);
async function share(text, extra = {}) {
  const form = new FormData();
  form.set('text', text);
  for (const [key, value] of Object.entries(extra)) form.set(key, value);
  let response;
  handlers.fetch({ request: new Request('https://bigscreenbible.com/?import=share', { method: 'POST', body: form }), respondWith(value) { response = value; } });
  return await response;
}
const response = await share('Luke 1:37', { title: 'My devotional' });
assert.equal(response.status, 303);
const destination = new URL(response.headers.get('location'));
assert.equal(destination.origin, 'https://bigscreenbible.com');
assert.equal(destination.searchParams.size, 1);
assert.ok(!destination.href.includes('Luke'));
const inboxId = destination.searchParams.get('import-shared');
assert.equal(await (await cache.match(`https://bigscreenbible.com/__shared_passages/${inboxId}`)).text(), 'My devotional\n\nLuke 1:37');
assert.equal((await share('')).status, 400);
assert.equal((await share('x'.repeat(100001))).status, 400);
for (let n = 0; n < 12; n++) await share(`John 3:${n + 1}`);
assert.equal(entries.size, 10, 'Abandoned shares cannot grow without bounds');
let intercepted = false;
handlers.fetch({ request: new Request('https://other.example/?import=share', {method: 'POST'}), respondWith() { intercepted = true; } });
assert.equal(intercepted, false);
// Exercise the actual native acknowledgement function with recoverable draft storage.
const ui = read('assets/passage-import-ui.js');
const receiver = ui.slice(ui.indexOf('  function saveImportedBookmarks('), ui.indexOf('  const params ='));
const stored = new Map();
let received, receivedAction, bookmarkSyncs = 0;
const app = {
  window: {}, dataLoading: true, bibleData: { 'Luke 1': { verses: [{ n: 37 }] }, 'John 3': { verses: [{ n: 16 }] } }, bookAliases: { luke: 'Luke', john: 'John' }, dialog: null,
  state: { bookmarks: ['Psalm 23:1'] }, scheduleCloudSync() { bookmarkSyncs++; }, renderPreservingReaderScroll() {}, showToast() {},
  localStorage: { getItem(key) { return stored.get(key) || null; }, setItem(key, value) { stored.set(key, value); } },
  compose(text, reviewOnly, editingId, action) { received = text; receivedAction = action; },
};
vm.createContext(app); vm.runInContext(read('assets/passage-import.js'), app); vm.runInContext(receiver, app);
assert.equal(app.window.bsbReceiveSharedText('Luke 1:37'), false);
app.dataLoading = false;
assert.equal(app.window.bsbReceiveSharedText('Luke 1:37'), true);
assert.equal(received, 'Luke 1:37');
assert.equal(receivedAction, 'choose', 'Android and legacy shares offer both actions');
assert.equal(JSON.parse(stored.get('lw_passage_import_draft')).text, 'Luke 1:37');
assert.equal(app.window.bsbReceiveSharedText('John 3:16'), false, 'A second share must not overwrite an unsaved draft');
app.dialog = { open: true };
assert.equal(app.window.bsbReceiveSharedText('Luke 1:37'), false);
app.dialog = null; stored.clear();
assert.equal(app.window.bsbReceiveSharedImport('John 3:16', 'bookmarks'), true);
assert.deepEqual([...app.state.bookmarks], ['John 3:16', 'Psalm 23:1']);
assert.equal(bookmarkSyncs, 1);
assert.equal(app.window.bsbReceiveSharedImport('John 3:16', 'bookmarks'), true);
assert.equal(bookmarkSyncs, 1, 'Native retries never duplicate bookmarks');
assert.equal(received, 'Luke 1:37', 'Saving bookmarks never opens a Reader list');
assert.equal(app.window.bsbReceiveSharedImport('John 3:16', 'unknown'), false);
assert.equal(app.window.bsbReceiveSharedImport('Luke 1:37', 'read'), true);
assert.equal(receivedAction, 'read', 'Explicit iOS reading skips the chooser');
stored.clear();
app.localStorage.setItem = () => { throw Error('Full'); };
assert.equal(app.window.bsbReceiveSharedText('Luke 1:37'), false, 'Native inbox retains text if draft storage fails');
assert.equal(app.window.bsbReceiveSharedImport('Luke 1:37', 'bookmarks'), false);
assert.deepEqual([...app.state.bookmarks], ['John 3:16', 'Psalm 23:1'], 'Bookmark storage failure leaves state unchanged');
const native = read('ios/App/App/SceneDelegate.swift');
assert.ok(native.includes('bsbReceiveSharedImport'));
const extension = read('ios/App/PassageShare/ShareViewController.swift');
assert.ok(extension.includes('Big Screen Bible · Reader'));
assert.ok(extension.includes('Bookmark all'));
assert.ok(extension.includes('Highlight all'));
assert.ok(extension.includes('bsbShareReaderInbox'));
assert.ok(native.includes('bsbReceiveShareReaderChange'));
console.log('Sharing: POST receipt, private redirect, bounded inbox, validation, readiness, acknowledgement, draft preservation, and storage failure passed.');
