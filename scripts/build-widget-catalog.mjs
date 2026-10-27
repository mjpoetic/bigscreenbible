// Public, bundled widget data. Never copy account tokens into native resources.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const scope = { window: {} };
vm.createContext(scope);
for (const file of ['assets/verse-of-day.js', 'assets/bibles/KJV.js', 'assets/supabase-config.js']) {
  vm.runInContext(readFileSync(file, 'utf8'), scope);
}
const config = scope.window.BIGSCREEN_VERSE_OF_DAY;
const chapters = scope.window.BIGSCREEN_BIBLE_KJV.chapters;
function entry(reference) {
  const match = reference.match(/^(.+) (\d+):(\d+)(?:-(\d+))?$/);
  if (!match) throw new Error(`Unsupported widget reference: ${reference}`);
  const [, book, chapter, start, end = start] = match;
  const key = `${book} ${chapter}`;
  const text = chapters[key]?.verses.filter(v => v.n >= +start && v.n <= +end).map(v => v.text).join(' ');
  if (!text) throw new Error(`Missing widget verse: ${reference}`);
  return { reference, text };
}
const catalog = {
  anchors: [...new Set(config.anchors)].map(entry),
  seasonal: Object.fromEntries(Object.entries(config.seasonal).map(([day, ref]) => [day, entry(ref)])),
  endpoint: `${scope.window.BigScreenBibleSupabase.url}/functions/v1/verse-of-the-day`,
  publishableKey: scope.window.BigScreenBibleSupabase.anonKey,
};
const json = JSON.stringify(catalog);
for (const file of ['ios/App/WidgetShared/widget-catalog.json', 'android/app/src/main/res/raw/widget_catalog.json']) writeFileSync(file, json + '\n');
console.log(`Bundled ${catalog.anchors.length} KJV widget passages for both platforms.`);
