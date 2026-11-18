import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
for (const code of ['BSB', 'KJV', 'WEB', 'ASV', 'BBE', 'YLT']) {
  const scope = { window: {} };
  vm.runInNewContext(readFileSync(new URL(`../../../assets/bibles/${code}.js`, import.meta.url), 'utf8'), scope);
  const bible = scope.window[`BIGSCREEN_BIBLE_${code}`];
  const chapters = Object.fromEntries(Object.entries(bible.chapters).map(([key, chapter]) => [key, chapter.verses.map(({ n, text }) => ({ n, text }))]));
  writeFileSync(new URL(`../assets/${code}.json.gz`, import.meta.url), gzipSync(JSON.stringify({ code, name: bible.name, source: bible.source, chapters })));
}
console.log('Bundled six text-only Scripture translations.');
