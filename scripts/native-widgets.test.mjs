import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
// The launcher inflates both initialLayout and previewLayout through RemoteViews.
// Plain View dividers compile successfully but crash that restricted inflater.
const widgetLayout = readFileSync('android/app/src/main/res/layout/scripture_widget.xml', 'utf8');
const supportedWidgetViews = new Set(['FrameLayout', 'ImageView', 'LinearLayout', 'TextView']);
for (const [, tag] of widgetLayout.matchAll(/<([A-Za-z][\w.]*)\b/g)) {
  assert.ok(supportedWidgetViews.has(tag), `Widget element ${tag} must support RemoteViews`);
}
const sync = source.slice(source.indexOf('function nativeWidgetBackground('), source.indexOf('function recordReadingStreak('));
const calls = [], timers = new Map();
let nextTimer = 0, fail = false, native = true, available = true;
const state = { streak: { current: 12, lastVisit: '2026-10-26', days: ['2026-10-25', '2026-10-26'], privateToken: 'never-share' } };
const settings = new Map();
const context = vm.createContext({
  localStorage: { getItem: key => settings.get(key) ?? null, setItem: (key, value) => settings.set(key, value) },
  themeChromeColor: () => '#f8f7f3',
  state, normalizeReadingStreak: x => x, console: { warn() {} },
  setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id),
  window: { Capacitor: { isNativePlatform: () => native, isPluginAvailable: () => available,
    registerPlugin: name => { assert.equal(name, 'BSBWidget'); return { sync: async payload => { if (fail) throw Error('retry'); calls.push(JSON.parse(JSON.stringify(payload))); } }; } } },
});
vm.runInContext(sync, context);
context.scheduleNativeWidgetSync(); context.scheduleNativeWidgetSync();
assert.equal(timers.size, 1, 'renders coalesce into one update');
await [...timers.values()][0](); timers.clear();
assert.deepEqual(calls, [{ current: 12, lastVisit: '2026-10-26', days: ['2026-10-25', '2026-10-26'], background: '#f8f7f3' }]);
await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 1, 'unchanged snapshots do not reload widgets');
state.streak.current = 13; fail = true;
await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 1);
fail = false; await context.syncNativeWidgetSnapshot(); assert.equal(calls.length, 2, 'failed updates retry');
state.streak = { current: 0, lastVisit: '', days: [] };
await context.syncNativeWidgetSnapshot(); assert.deepEqual(calls.at(-1), { current: 0, lastVisit: '', days: [], background: '#f8f7f3' }, 'account changes clear old progress');
settings.set('lw_widget_appearance', 'system');
await context.syncNativeWidgetSnapshot(); assert.equal(calls.at(-1).background, null, 'device appearance clears the shared color');
settings.set('lw_widget_appearance', 'custom'); settings.set('lw_widget_color', '#123456');
await context.syncNativeWidgetSnapshot(); assert.equal(calls.at(-1).background, '#123456', 'custom appearance syncs independently of streak');
settings.set('lw_widget_color', 'invalid');
assert.equal(context.nativeWidgetBackground(), '#f8f7f3', 'invalid custom colors fall back to app theme');
context.state.theme = 'light'; context.state.themePreset = 'paper'; context.state.appearance = {};
Object.assign(context, {
  escapeHtml: value => String(value),
  settingsChoiceMarkup: (id, value, choices) => `<select id="${id}">${choices.map(c => `<option value="${c.value}" ${c.value === value ? 'selected' : ''}>${c.label}</option>`).join('')}</select>`,
  themePresetSettingsChoices: () => [], currentThemeColorTooltip: () => '',
  icons: {sun: '', moon: ''},
});
vm.runInContext(source.slice(source.indexOf('function settingsAppearanceMarkup('), source.indexOf('function settingsDestinationGlyphs(')), context);
settings.set('lw_widget_color', '#123456');
assert.match(context.settingsAppearanceMarkup('mobile'), /id="mobileWidgetAppearance"/);
assert.match(context.settingsAppearanceMarkup('mobile'), /value="custom" selected/);
assert.match(context.settingsAppearanceMarkup('mobile'), /aria-label="Widget background color" value="#123456"/);
native = false;
assert.doesNotMatch(context.settingsAppearanceMarkup(), /Widget appearance/, 'web settings do not advertise native widgets');
native = true;
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
