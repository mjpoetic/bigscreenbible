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
const crossScope = { window: {} };
vm.runInNewContext(readFileSync(new URL('../../../assets/crossrefs.js', import.meta.url), 'utf8'), crossScope);
writeFileSync(new URL('../assets/crossrefs.json.gz', import.meta.url), gzipSync(JSON.stringify(crossScope.window.BIGSCREEN_CROSS_REFS)));
console.log('Bundled OpenBible CC-BY cross-reference catalog.');

const readerSource = readFileSync(new URL('../../../assets/bible-app.js', import.meta.url), 'utf8');
function readerSection(start, end) {
  const from = readerSource.indexOf(start);
  const to = readerSource.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`Could not find ${start} in the reader source.`);
  return readerSource.slice(from, to).trim();
}
const bookDefinitions = readerSection('const bookDefinitions =', 'const oldTestamentBooks =');
const aliasBuilder = readerSection('function buildBookAliases()', 'async function initializeBibleData()');
const normalizeBookName = readerSection('function normalizeBookName(value)', 'function spotlightReaderPassage(');
writeFileSync(new URL('../src/book-aliases.mjs', import.meta.url),
  `// Generated from the website reader by npm run bundle:scripture.
${bookDefinitions}
const bookAliases = buildBookAliases();

${aliasBuilder}

export ${normalizeBookName}
`);
