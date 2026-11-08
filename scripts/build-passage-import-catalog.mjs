// Compact BSB text and reference metadata; the extension uses the website's exact extractor.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('assets/bible-app.js', root), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL('assets/bibles/BSB.js', root), 'utf8'), context);
vm.runInContext(source.slice(source.indexOf('const bookDefinitions'), source.indexOf('const oldTestamentBooks'))
  + source.slice(source.indexOf('function buildBookAliases()'), source.indexOf('async function initializeBibleData()'))
  + '\nglobalThis.aliases = buildBookAliases();', context);
const catalog = {
  aliases: context.aliases,
  chapters: Object.fromEntries(Object.entries(context.window.BIGSCREEN_BIBLE_BSB.chapters)
    .map(([key, chapter]) => [key, { verses: chapter.verses.map(({ n, text }) => ({ n, text })) }])),
};
writeFileSync(new URL('ios/App/PassageShare/passage-import-catalog.json', root), JSON.stringify(catalog) + '\n');
console.log('Bundled passage reference metadata for the iOS share extension.');
