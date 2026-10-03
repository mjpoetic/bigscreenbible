import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end);
}
const context = {
  state: { focusVersePickerBook: 'John', focusVersePickerChapter: 3, focusVersePickerVerse: 16 },
  books: ['John'], bibleData: { 'John 3': { verses: [16,17,18,19].map(n => ({ n })) } },
  currentBookName: () => 'John', normalizeBookName: name => name === 'John' ? name : '',
};
vm.createContext(context);
for (const name of ['focusVersePickerChapterNumbers', 'focusVersePickerData', 'parsePassageReference', 'parseVerseList']) {
  vm.runInContext(extract(name), context);
}
const picker = context.focusVersePickerData();
assert.equal(picker.verse, 16);
assert.deepEqual(Array.from(context.parsePassageReference(`${picker.chapterKey}:${picker.verse}`).verses), [16]);
context.state.focusVersePickerVerse = 99;
assert.equal(context.focusVersePickerData().verse, 16, 'Unavailable verses fall back to available data');
context.state.focusVersePickerChapter = 99;
assert.equal(context.focusVersePickerData().chapter, 3, 'Unavailable chapters fall back to available data');
console.log('Passage picker single verse and availability checks passed');
