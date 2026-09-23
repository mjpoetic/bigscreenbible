import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bridgeSource = read("assets/native-offline-bridge.js");
const app = read("assets/bible-app.js");
function boot({ url = "capacitor://localhost/offline.html", seed = null, initial = {} } = {}) {
  const context = vm.createContext({ URL, Event, seed, initial, url });
  vm.runInContext(`
    class Storage {
      getItem(key) { return Object.hasOwn(this, key) ? this[key] : null; }
      setItem(key, value) { if (value === '__quota__') throw new Error('Quota exceeded'); this[String(key)] = String(value); }
      removeItem(key) { delete this[key]; }
      clear() { for (const key of Object.keys(this)) delete this[key]; }
    }
    const messages = [], tasks = [], listeners = {};
    const location = new URL(url);
    const localStorage = Object.assign(new Storage(), initial);
    const sessionStorage = new Storage();
    const window = { location, localStorage, webkit: { messageHandlers: { bsbOffline: {
      postMessage(message) { messages.push(JSON.parse(JSON.stringify(message))); }
    } } }, addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
      dispatchEvent(event) { for (const fn of listeners[event.type] || []) fn(event); } };
    window.top = window;
    const queueMicrotask = fn => tasks.push(fn);
    function flush() { while (tasks.length) tasks.shift()(); }
  `, context);
  vm.runInContext(bridgeSource.replace("__BSB_OFFLINE_MANIFEST__", '{"versions":[]}')
    .replace("__BSB_OFFLINE_SEED__", () => JSON.stringify(seed)), context);
  return { run: code => vm.runInContext(code, context) };
}

// Upgrade: adopt live app data without migrating tokens or unrelated origin data.
let page = boot({ url: "https://bigscreenbible.com/", initial: {
  lw_account_data_owner: "alice", lw_notes: '{"John 3:16":"Alice note"}',
  "lw_account_session:alice": "SECRET", "sb-auth-token": "SECRET", other: "unrelated",
} });
page.run("flush()");
const seed = JSON.parse(page.run("JSON.stringify(messages.at(-1).values)"));
assert.equal(seed.lw_account_data_owner, "alice");
assert.equal(Object.keys(seed).length, 2);
assert.equal(page.run("window.bsbOffline.active"), false);

// Live -> offline: overwrite stale local-origin account data, including deletions.
page = boot({ seed, initial: { lw_account_data_owner: "bob", lw_notes: "Bob notes", lw_stale: "old" } });
assert.equal(page.run("localStorage.getItem('lw_account_data_owner')"), "alice");
assert.equal(page.run("localStorage.getItem('lw_stale')"), null);
assert.match(page.run("localStorage.getItem('lw_notes')"), /Alice note/);
assert.equal(page.run("window.bsbOffline.active"), true);
page.run("flush(); localStorage.setItem('lw_notes', 'Offline edit'); localStorage.removeItem('lw_account_data_owner'); flush()");
const edited = JSON.parse(page.run("JSON.stringify(messages.at(-1).values)"));
assert.equal(edited.lw_notes, "Offline edit");
assert.equal(edited.lw_account_data_owner, undefined);
page.run("sessionStorage.setItem('lw_notes', 'Not shared'); flush()");
assert.equal(page.run("messages.at(-1).values.lw_notes"), "Offline edit");
page.run("window.bsbOffline.reconnect()");
assert.equal(page.run("messages.at(-2).action"), "snapshot", "Save precedes navigation");
assert.equal(page.run("messages.at(-1).action"), "reconnect");

// Offline -> live keeps the website's existing authentication; clears stale data.
page = boot({ url: "https://bigscreenbible.com/", seed: edited, initial: { "sb-auth-token": "existing", lw_notes: "old", lw_stale: "old" } });
assert.equal(page.run("localStorage.getItem('sb-auth-token')"), "existing");
assert.equal(page.run("localStorage.getItem('lw_notes')"), "Offline edit");
page.run("flush(); localStorage.clear(); flush()");
assert.equal(page.run("Object.keys(messages.at(-1).values).length"), 0);
page = boot({ url: "https://untrusted.example/", seed });
assert.equal(page.run("window.bsbOffline"), undefined);
page = boot({ seed: { lw_notes: "__quota__" }, initial: { lw_account_data_owner: "alice", lw_notes: "saved" } });
assert.equal(page.run("window.bsbOfflineStorageFailed"), true);
assert.equal(page.run("localStorage.getItem('lw_notes')"), "saved", "Roll back a failed restore");
assert.equal(page.run("localStorage.getItem('lw_account_data_owner')"), "alice");
assert.equal(page.run("messages.length"), 0, "Never overwrite the native snapshot with a partial restore");
page = boot({ seed: { lw_notes: "__BSB_OFFLINE_MANIFEST__ $&" } });
assert.equal(page.run("localStorage.getItem('lw_notes')"), "__BSB_OFFLINE_MANIFEST__ $&", "Restore notes literally");

function extract(name) {
  const start = app.search(new RegExp(`(?:async )?function ${name}\\(`));
  assert.ok(start >= 0, name);
  return app.slice(start, app.indexOf("\n}", start) + 2);
}
const context = vm.createContext({
  window: { bsbOffline: { active: true } },
  localStorage: { getItem: () => null, setItem() {} },
  state: {},
  accountDataOwner: () => "alice", guestDataOwner: "guest",
  captureCloudSnapshot: () => ({ notes: { "John 3:16": "offline edit" } }),
  saveSnapshotForOwner: (owner, snapshot) => { assert.equal(owner, "alice"); assert.equal(snapshot.notes["John 3:16"], "offline edit"); },
  translationDisplayCode: code => code,
  isRemoteTranslation: code => code === "NIV",
});
vm.runInContext(["createSupabaseClient", "initializeSupabaseAuth", "scheduleCloudSync", "getVerseText", "ensureRemoteBibleVersion", "searchRemoteVersions", "searchRemoteVersion", "searchSemanticBible", "fetchVerseOfDayItem", "applyOfflineChanges"].map(extract).join("\n"), context);
assert.equal(vm.runInContext("createSupabaseClient()", context), null);
await vm.runInContext("initializeSupabaseAuth()", context);
vm.runInContext("scheduleCloudSync()", context);
assert.match(vm.runInContext("getVerseText({BSB: 'text'}, 'NIV')", context), /NIV requires internet/);
assert.equal(vm.runInContext("getVerseText({BSB: 'text'}, 'BSB')", context), "text");
await vm.runInContext("ensureRemoteBibleVersion('NIV', 'John 3')", context);
await vm.runInContext("searchRemoteVersions('love', {})", context);
await vm.runInContext("searchRemoteVersion('NIV', 'love', {})", context);
await vm.runInContext("searchSemanticBible('what is love', {})", context);
assert.equal(await vm.runInContext("fetchVerseOfDayItem()", context), null);
const merged = vm.runInContext(`applyOfflineChanges(
  {settings:{textScale:1,gameRecords:{remote:true}},notes:{removed:'old',edited:'old',remote:'new'},highlights:{removed:'yellow'},bookmarks:['removed','remote']},
  {settings:{textScale:1,gameRecords:{}},notes:{removed:'old',edited:'old'},highlights:{removed:'yellow'},bookmarks:['removed']},
  {settings:{textScale:1.4,gameRecords:{local:true}},notes:{edited:'offline'},highlights:{},bookmarks:[]}
)`, context);
assert.equal(merged.settings.textScale, 1.4);
assert.equal(merged.settings.gameRecords.remote, true, "Keep the normal game-record merge");
assert.equal(merged.notes.removed, undefined, "Do not resurrect offline deletions");
assert.equal(merged.notes.edited, "offline");
assert.equal(merged.notes.remote, "new", "Retain unrelated cloud edits");
assert.equal(merged.highlights.removed, undefined);
assert.deepEqual(Array.from(merged.bookmarks), ["remote"]);

// Validate the actual generated artifact, not only the build implementation.
const html = read("www/offline.html");
assert.doesNotMatch(html, /<script[^>]+src="https:/);
assert.doesNotMatch(html, /href="https:\/\/fonts\./);
assert.match(html, /assets\/fonts\/offline.css/);
const manifest = JSON.parse(read("www/offline-bibles.json"));
assert.deepEqual(manifest.versions.map(item => item.code), ["BSB", "KJV", "WEB", "ASV", "BBE", "YLT"]);
assert.equal(manifest.version, JSON.parse(read("app-version.json")).version);
for (const { code, bytes, sha256 } of manifest.versions) {
  const file = read(`www/assets/bibles/${code}.js`);
  assert.equal(Buffer.byteLength(file), bytes, code);
  assert.equal(createHash("sha256").update(file).digest("hex"), sha256, code);
}
for (const [, file] of read("www/assets/fonts/offline.css").matchAll(/url\(\.\/([^)]*)\)/g)) {
  assert.ok(existsSync(new URL(`../www/assets/fonts/${file}`, import.meta.url)), file);
}
console.log("Native offline tests passed: origin isolation, account data, token exclusion, edits/deletions, reconnect ordering, network guards, packaged Bibles and fonts.");
