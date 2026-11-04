import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
const saved = new Map();
const context = vm.createContext({
  books: ['Genesis', 'John', '1 John'],
  normalizeBookName: value => ({john: 'John', jn: 'John'}[value.toLowerCase()] || null),
  bookNameFromChapterKey: key => key.replace(/ \d+$/, ''),
  bibleData: {'John 3': {verses: Array.from({length: 36}, (_, i) => ({n: i + 1, KJV: `Verse ${i + 1}`}))}},
  state: {versions: ['KJV'], reference: 'Genesis 1'},
  parsePassageReference: value => ({key: value.startsWith('Jn ') ? 'John 3' : value.split(':')[0]}),
  isRemoteTranslation: () => false, loadBibleVersion: async () => {}, rebuildBibleData() {},
  uniqueVersionVerses: verses => verses, translationDisplayCode: value => value,
  formatReferenceLabel: (key, numbers) => `${key}:${numbers.join(',')}`,
  localStorage: {setItem: (key, value) => saved.set(key, value)}, scheduleNativeWidgetSync() {},
});
vm.runInContext(source.slice(source.indexOf('function widgetPassageSuggestions('), source.indexOf('function bindWidgetPassageForms(')), context);
assert.deepEqual([...context.widgetPassageSuggestions('Jo')], ['John']);
assert.deepEqual([...context.widgetPassageSuggestions('John 3')], ['John 3:']);
assert.deepEqual([...context.widgetPassageSuggestions('John 3:16-1')], ['John 3:16-16', 'John 3:16-17', 'John 3:16-18', 'John 3:16-19']);
await context.saveWidgetPassageReference('Jn 3:16–17');
const favorite = JSON.parse(saved.get('lw_widget_favorite'));
assert.equal(favorite.text, 'Verse 16 Verse 17');
assert.equal(favorite.source, 'KJV');
assert.equal(saved.get('lw_widget_content'), 'favorite');
assert.equal(context.state.reference, 'Genesis 1', 'saving does not navigate Reader');
for (const value of ['John 3', 'John 3:0', 'John 3:17-16', 'John 3:36-37', 'John 3:1-999999']) {
  await assert.rejects(context.saveWidgetPassageReference(value));
  assert.equal(saved.get('lw_widget_favorite'), JSON.stringify(favorite), 'invalid input preserves saved passage');
}
assert.doesNotMatch(source, /id="useSelectionInWidget"/);
assert.match(source, /data-menu-widget/);
console.log('Widget passage suggestions, saving, validation, and Reader preservation passed.');
