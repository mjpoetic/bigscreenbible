import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
// The launcher inflates both initialLayout and previewLayout through RemoteViews.
// Plain View dividers compile successfully but crash that restricted inflater.
const widgetLayout = readFileSync('android/app/src/main/res/layout/scripture_widget.xml', 'utf8');
const supportedWidgetViews = new Set(['LinearLayout', 'TextView']);
for (const [, tag] of widgetLayout.matchAll(/<([A-Za-z][\w.]*)\b/g)) {
  assert.ok(supportedWidgetViews.has(tag), `Widget element ${tag} must support RemoteViews`);
}
const sync = source.slice(source.indexOf('let nativeWidgetSyncTimer ='), source.indexOf('function recordReadingStreak('));
const calls = [], timers = new Map();
let nextTimer = 0, fail = false, native = true, available = true;
const state = { streak: { current: 12, lastVisit: '2026-10-26', days: ['2026-10-25', '2026-10-26'], privateToken: 'never-share' } };
const context = vm.createContext({
  state, normalizeReadingStreak: x => x, console: { warn() {} },
  setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
  window: { Capacitor: { isNativePlatform: () => native, isPluginAvailable: () => available,
    registerPlugin: name => { assert.equal(name, 'BSBWidget'); return { sync: async payload => { if (fail) throw Error('retry'); calls.push(JSON.parse(JSON.stringify(payload))); } }; } } },
});
vm.runInContext(sync, context);
context.scheduleNativeWidgetSync(); context.scheduleNativeWidgetSync();
assert.equal(timers.size, 1, 'renders coalesce into one update');
await [...timers.values()][0](); timers.clear();
assert.deepEqual(calls, [{ current: 12, lastVisit: '2026-10-26', days: ['2026-10-25', '2026-10-26'] }]);
await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 1, 'unchanged snapshots do not reload widgets');
state.streak.current = 13; fail = true;
await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 1);
fail = false; await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 2, 'failed updates retry');
state.streak = { current: 0, lastVisit: '', days: [] };
await context.syncNativeWidgetSnapshot(); assert.deepEqual(calls.at(-1), { current: 0, lastVisit: '', days: [] }, 'account changes clear old progress');
native = false; context.scheduleNativeWidgetSync(); await context.syncNativeWidgetSnapshot(); assert.equal(timers.size, 0);
native = true; available = false; context.scheduleNativeWidgetSync(); assert.equal(timers.size, 0, 'older native builds and browsers remain compatible');
const scope = { window: {} }; vm.createContext(scope);
for (const file of ['assets/verse-of-day.js', 'assets/bibles/KJV.js']) vm.runInContext(readFileSync(file, 'utf8'), scope);
const ios = readFileSync('ios/App/WidgetShared/widget-catalog.json', 'utf8');
assert.equal(ios, readFileSync('android/app/src/main/res/raw/widget_catalog.json', 'utf8'), 'platform offline content is identical');
const catalog = JSON.parse(ios);
assert.deepEqual(catalog.anchors.map(e => e.reference), [...new Set(scope.window.BIGSCREEN_VERSE_OF_DAY.anchors)]);
for (const { reference, text } of [...catalog.anchors, ...Object.values(catalog.seasonal)]) {
  const [, book, chapter, start, end = start] = reference.match(/^(.+) (\d+):(\d+)(?:-(\d+))?$/);
  const expected = scope.window.BIGSCREEN_BIBLE_KJV.chapters[`${book} ${chapter}`].verses.filter(v => v.n >= +start && v.n <= +end).map(v => v.text).join(' ');
  assert.equal(text, expected, reference);
  const url = new URL('https://bigscreenbible.com/');
  url.search = new URLSearchParams({ref: reference, mode: 'reader', version: 'KJV'});
  assert.equal(url.searchParams.get('ref'), reference, 'multi-verse deep links round trip');
}
assert.ok(catalog.seasonal['02-29'], 'leap day has bundled content');
assert.ok(!/service_role|sb_secret_/.test(ios), 'only public API configuration is bundled');
const scene = readFileSync('ios/App/App/SceneDelegate.swift', 'utf8');
assert.equal((scene.match(/queueSharedURL\(context.url\)/g) || []).length, 2, 'widget URLs are queued for cold and warm launches');
console.log('Native widgets: bridge sync, deduplication, retries, account changes, privacy, KJV content, leap day and widget link delivery passed.');

assert.match(scene, /captureWidgetProgress\(\)/, 'iOS captures progress from the deployed live site');
const activity = readFileSync('android/app/src/main/java/com/bigscreenbible/app/MainActivity.java', 'utf8');
assert.match(activity, /public void onPause\(\) \{\s*captureWidgetProgress\(\)/, 'Android captures progress before backgrounding');
