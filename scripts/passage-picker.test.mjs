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
  state: { focusVersePickerBook: 'John', focusVersePickerChapter: 3, focusVersePickerVerse: 16, focusVersePickerEndVerse: 18 },
  books: ['John'], bibleData: { 'John 3': { verses: [16,17,18,19].map(n => ({ n })) } },
  currentBookName: () => 'John', normalizeBookName: name => name === 'John' ? name : '',
};
vm.createContext(context);
for (const name of ['focusVersePickerChapterNumbers', 'focusVersePickerData', 'parsePassageReference', 'parseVerseList']) {
  vm.runInContext(extract(name), context);
}
const picker = context.focusVersePickerData();
assert.equal(picker.endVerse, 18);
assert.deepEqual(Array.from(context.parsePassageReference(`${picker.chapterKey}:${picker.verse}-${picker.endVerse}`).verses), [16,17,18]);
context.state.focusVersePickerVerse = 19;
assert.equal(context.focusVersePickerData().endVerse, '', 'An ending verse before the start becomes a single verse');
context.state.focusVersePickerEndVerse = 99;
assert.equal(context.focusVersePickerData().endVerse, '', 'Unavailable endings are rejected');
context.state.focusVersePickerChapter = 99;
assert.equal(context.focusVersePickerData().chapter, 3, 'Unavailable chapters fall back to available data');
console.log('Passage picker range and availability checks passed');
