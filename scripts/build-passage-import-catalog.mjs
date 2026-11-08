// Compact offline Bible text and reference metadata; the extension uses the website's exact extractor.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('assets/bible-app.js', root), 'utf8');
const context = vm.createContext({ window: {} });
for (const code of ['BSB', 'KJV']) vm.runInContext(readFileSync(new URL(`assets/bibles/${code}.js`, root), 'utf8'), context);
vm.runInContext(source.slice(source.indexOf('const bookDefinitions'), source.indexOf('const oldTestamentBooks'))
  + source.slice(source.indexOf('function buildBookAliases()'), source.indexOf('async function initializeBibleData()'))
  + '\nglobalThis.aliases = buildBookAliases();', context);
vm.runInContext(readFileSync(new URL('assets/supabase-config.js', root), 'utf8'), context);
vm.runInContext(source.slice(source.indexOf('const bibleProviders ='), source.indexOf('const translationCodes =')) + '\nglobalThis.shareTranslations = translations; globalThis.shareProviders = bibleProviders;', context);
const compact = chapters => Object.fromEntries(Object.entries(chapters).map(([key, chapter]) => [key, { verses: chapter.verses.map(({ n, text }) => ({ n, text })) }]));
const bsb = compact(context.window.BIGSCREEN_BIBLE_BSB.chapters);
const kjv = compact(context.window.BIGSCREEN_BIBLE_KJV.chapters);
const css = readFileSync(new URL('assets/bible-app.css', root), 'utf8');
const highlightNames = JSON.parse(source.match(/const highlightColors = (\[[^;]+\]);/)[1]);
const catalog = {
  highlights: highlightNames.map(value => ({ value, name: value[0].toUpperCase() + value.slice(1), hex: css.match(new RegExp('\\.highlight-swatch\\.highlight-' + value + ' \\{\\s*background: (#[a-f0-9]+);'))[1] })),
  bundled: { KJV: kjv },
  validation: Object.fromEntries(Object.keys(bsb).map(key => [key, { verses: [...new Set([...bsb[key].verses, ...(kjv[key]?.verses || [])].map(v => v.n))].sort((a,b) => a-b).map(n => ({ n })) }])),
  online: { ...context.window.BigScreenBibleSupabase,
    translations: context.shareTranslations.filter(item => ['BSB', 'KJV'].includes(item.code) || context.shareProviders[item.provider].type === 'remote')
      .map(item => ({ ...item, endpoint: context.shareProviders[item.provider].edgeFunction || '', tracksFums: !!context.shareProviders[item.provider].tracksFums })),
  },
  aliases: context.aliases,
  chapters: bsb,
};
writeFileSync(new URL('ios/App/PassageShare/passage-import-catalog.json', root), JSON.stringify(catalog) + '\n');
console.log('Bundled passage reference metadata for the iOS share extension.');
