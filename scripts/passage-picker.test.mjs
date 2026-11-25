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

vm.runInContext(extract('centerSelectedMenuOption'), context);
const selectedOption = { getBoundingClientRect: () => ({ top: 780, height: 40 }) };
const menu = {
  clientHeight: 240, clientTop: 2, scrollTop: 0,
  querySelector: () => selectedOption,
  getBoundingClientRect: () => ({ top: 100 }),
};
context.centerSelectedMenuOption(menu);
assert.equal(menu.scrollTop, 578, 'A distant selection is centered within the list');
selectedOption.getBoundingClientRect = () => ({ top: 102, height: 40 });
context.centerSelectedMenuOption(menu);
assert.equal(menu.scrollTop, 478, 'Reopening can center a selection above the current list position');
menu.clientHeight = 0;
context.centerSelectedMenuOption(menu);
assert.equal(menu.scrollTop, 478, 'Hidden menus are left alone');
assert.match(extract('openSettingsChoiceMenu'), /centerSelectedMenuOption\(menu\)/);
assert.match(extract('centerOpenBibleMenus'), /parallel-version-menu/);
console.log('Selected picker option scroll checks passed');

context.document = { querySelectorAll: selector => {
  assert.ok(selector.includes('.focus-brand-version-menu'), 'The logo hold version menu must be included');
  return [menu];
} };
menu.clientHeight = 240;
context.positionPresentationBibleMenus = () => {};
context.centerOpenBibleMenus = undefined;
vm.runInContext(extract('centerOpenBibleMenus'), context);
context.centerOpenBibleMenus();
assert.equal(menu.scrollTop, 378, 'The logo version menu also centers its current selection');

// The library verse trigger is only about 60px wide. The floating menu needs
// extra room for padding, its label, and the selection checkmark.
vm.runInContext(extract('positionSettingsChoiceMenu'), context);
context.window = { innerWidth: 396, innerHeight: 800 };
const narrowTrigger = {
  getBoundingClientRect: () => ({ width: 60, left: 311, top: 54, bottom: 90 }),
  closest: () => null,
};
const narrowMenu = {
  style: {},
  getBoundingClientRect: () => ({ height: 300 }),
  classList: { toggle() {} },
};
context.positionSettingsChoiceMenu(narrowTrigger, narrowMenu);
assert.equal(narrowMenu.style.width, '112px', 'Narrow verse dropdowns reserve space for visible numbers');
assert.equal(narrowMenu.style.left, '276px', 'Expanded dropdown stays inside the viewport');
context.window.innerWidth = 100;
context.positionSettingsChoiceMenu(narrowTrigger, narrowMenu);
assert.equal(narrowMenu.style.width, '84px', 'Minimum width still respects the viewport');
console.log('Narrow verse dropdown sizing checks passed');

context.window = { innerWidth: 396, innerHeight: 400 };
const bookTrigger = {
  getBoundingClientRect: () => ({ width: 110, left: 80, top: 260, bottom: 300 }),
};
let bookMenuHeight = 240;
const bookMenuClasses = new Set();
const bookMenu = {
  style: {},
  getBoundingClientRect: () => ({ height: bookMenuHeight }),
  classList: {
    contains: name => bookMenuClasses.has(name),
    toggle: (name, enabled) => enabled ? bookMenuClasses.add(name) : bookMenuClasses.delete(name),
  },
};
context.positionSettingsChoiceMenu(bookTrigger, bookMenu, true);
assert.equal(bookMenu.style.width, '310px');
assert.ok(bookMenuClasses.has('opens-above'));
bookMenuHeight = 58;
context.positionSettingsChoiceMenu(bookTrigger, bookMenu, true, true);
assert.equal(bookMenu.style.width, '310px', 'Filtering keeps the book menu wide');
assert.equal(bookMenu.style.top, '194px', 'Filtered results stay anchored above the field');
context.window.innerWidth = 280;
context.positionSettingsChoiceMenu(bookTrigger, bookMenu, true);
assert.equal(bookMenu.style.width, '264px', 'The wide book menu still fits a narrow viewport');

vm.runInContext(extract('passageChoiceMatches'), context);
const choices = ['Job', 'Joel', 'John', 'Jonah', 'Jeremiah', '1 John', '2 John', '3 John', '1 Chronicles', '2 Chronicles', '1 Corinthians', '2 Corinthians'].map(label => ({ label, value: label }));
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, 'jo'), o => o.value), ['Job', 'Joel', 'John', 'Jonah', '1 John', '2 John', '3 John']);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, 'John'), o => o.value), ['John', '1 John', '2 John', '3 John']);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, 'chr'), o => o.value), ['1 Chronicles', '2 Chronicles']);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, 'cor'), o => o.value), ['1 Corinthians', '2 Corinthians']);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, '2 co'), o => o.value), ['2 Corinthians']);
assert.equal(context.passageChoiceMatches([{ label: '3 John', disabled: true }], 'John').length, 0);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, ' JE '), o => o.value), ['Jeremiah']);
assert.deepEqual(Array.from(context.passageChoiceMatches(choices, '1j'), o => o.value), ['1 John']);
assert.equal(context.passageChoiceMatches(choices, 'xyz').length, 0);
assert.equal(context.passageChoiceMatches(choices, '').length, choices.length);
const numbers = ['1', '2', '10', '11', '12'].map(label => ({ label, value: label }));
assert.deepEqual(Array.from(context.passageChoiceMatches(numbers, '1'), o => o.value), ['1', '10', '11', '12']);
assert.equal(context.passageChoiceMatches(numbers, '99').length, 0);
console.log('Editable passage choice filtering checks passed');

for (const name of ['focusPickerBookLabel', 'resolvePassageChoice', 'settingsChoiceMarkup']) {
  vm.runInContext(extract(name), context);
}
context.escapeHtml = String;
const bookChoices = ['Colossians', 'John', '1 John', '2 Thessalonians', 'Judges', 'Jude', 'Song of Songs'].map(value => ({
  value, label: value, nativeLabel: context.focusPickerBookLabel(value),
}));
const bookMarkup = context.settingsChoiceMarkup('focusMiniBookSelect', 'Colossians', bookChoices, { ariaLabel: 'Book', editable: true });
assert.match(bookMarkup, /<input[^>]*value="Col"/);
assert.match(bookMarkup, /<option value="Colossians" selected/);
const bookOptions = bookChoices.map(({ value, nativeLabel: label }) => ({ value, label }));
for (const [query, book] of [
  ['Colossians', 'Colossians'], ['Coloss.', 'Colossians'], ['Col', 'Colossians'], ['John', 'John'],
  ['2 Thessalonians', '2 Thessalonians'], ['2 Thess.', '2 Thessalonians'], ['2 Thess', '2 Thessalonians'],
  ['Song of Songs', 'Song of Songs'], ['Song of S.', 'Song of Songs'], ['SoS', 'Song of Songs'],
]) {
  const matches = context.passageChoiceMatches(bookOptions, query);
  assert.equal(context.resolvePassageChoice(matches, query)?.value, book);
}
assert.equal(context.resolvePassageChoice(context.passageChoiceMatches(bookOptions, 'Jud'), 'Jud'), null);

vm.runInContext(extract('passagePickerViewport'), context);
for (const name of ['focusPickerLongBookLabel', 'fitFocusPickerBookLabel', 'refreshFocusPickerBookLabel']) {
  vm.runInContext(extract(name), context);
}
const bookInput = { value: 'Col', defaultValue: 'Col', clientWidth: 56 };
const bookSelect = { selectedOptions: [bookOptions[0]] };
const bookPanel = { querySelector: selector => selector.endsWith('Input') ? bookInput : bookSelect };
context.getComputedStyle = () => ({ fontWeight: '900', fontSize: '16px', fontFamily: 'sans-serif' });
context.document = { createElement: () => ({ getContext: () => ({ measureText: name => ({ width: name.length * 8 }) }) }) };
const song = bookOptions.find(option => option.value === 'Song of Songs');
assert.equal(context.fitFocusPickerBookLabel({ clientWidth: 88 }, song), 'Song of S.');
assert.equal(context.fitFocusPickerBookLabel({ clientWidth: 56 }, song), 'SoS');
context.refreshFocusPickerBookLabel(bookPanel);
assert.equal(bookInput.value, 'Col', 'The shortest abbreviation fits a tight field');
bookInput.clientWidth = 80;
context.refreshFocusPickerBookLabel(bookPanel);
assert.equal(bookInput.value, 'Coloss.', 'The longer abbreviation uses the available space');
bookInput.clientWidth = 96;
context.refreshFocusPickerBookLabel(bookPanel);
assert.equal(bookInput.value, 'Colossians', 'The full name returns when the field has room');
bookInput.value = '2 Thessal';
bookInput.clientWidth = 80;
context.refreshFocusPickerBookLabel(bookPanel);
assert.equal(bookInput.value, '2 Thessal', 'A resize preserves the query being edited');

vm.runInContext(extract('positionFocusWorkspacePanel'), context);
context.window = {
  innerWidth: 956, innerHeight: 440,
  visualViewport: { offsetLeft: 0, offsetTop: 55, width: 956, height: 178 },
  matchMedia: () => ({ matches: true }),
};
const safeAreas = { '--passage-picker-safe-left': '62px', '--passage-picker-safe-right': '62px', '--passage-picker-safe-bottom': '21px' };
context.getComputedStyle = () => ({ getPropertyValue: name => safeAreas[name] });
const styles = {};
const classes = new Set();
const panel = {
  querySelector: () => null,
  style: Object.assign(styles, { removeProperty: name => delete styles[name] }),
  classList: { toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name) },
};
context.document = {
  documentElement: {},
  getElementById: () => panel,
  querySelector: () => ({ getBoundingClientRect: () => ({ left: 910, bottom: 100 }) }),
};
context.state.focusWorkspacePanel = 'Verse';
context.updateFocusPassageNotch = () => {};
context.positionFocusWorkspacePanel();
assert.equal(styles.top, '63px', 'Landscape picker follows the panned viewport above the keyboard');
assert.equal(styles.maxHeight, '162px', 'The panel ends above the keyboard with no layout viewport height floor');
assert.equal(styles.left, '446px', 'The picker stays inside the landscape safe area');
assert.ok(classes.has('passage-picker-compact'));

Object.assign(context.window, {
  innerWidth: 440, innerHeight: 956,
  visualViewport: { offsetLeft: 0, offsetTop: 0, width: 440, height: 600 },
});
delete safeAreas['--passage-picker-safe-left'];
delete safeAreas['--passage-picker-safe-right'];
context.positionFocusWorkspacePanel();
assert.equal(styles.top, '108px');
assert.equal(styles.maxHeight, '484px', 'Portrait picker can keep its normal anchor and use the space above the keyboard');
assert.equal(styles.width, '424px');
assert.ok(!classes.has('passage-picker-compact'));
context.state.focusMode = true;
const notch = { getBoundingClientRect: () => ({ left: 155, width: 130, bottom: 100 }) };
context.document.getElementById = id => id === 'focusPassageNotch' ? notch : panel;
context.window.visualViewport.height = 360;
context.positionFocusWorkspacePanel();
assert.ok(classes.has('passage-picker-over-notch'), 'The keyboard can move the picker in front of the notch');
context.window.visualViewport.height = 600;
context.positionFocusWorkspacePanel();
assert.ok(!classes.has('passage-picker-over-notch'), 'The notch is available again once the picker fits below it');
console.log('Touch passage picker keyboard viewport checks passed');

const controls = Object.fromEntries(
  ['ChapterSelect', 'ChapterSelectInput', 'VerseSelect', 'VerseSelectInput', 'PickerGo']
    .map(suffix => {
      const id = `focusMini${suffix}`;
      return [id, { id, replaceChildren(...options) { this.options = options; } }];
    }),
);
context.document.getElementById = id => controls[id];
context.Option = function (label, value) { Object.assign(this, { label, value }); };
context.books.push('Acts');
context.bibleData['Acts 1'] = { verses: [{ n: 1 }, { n: 2 }] };
context.bibleData['Acts 2'] = { verses: [{ n: 1 }] };
Object.assign(context.state, {
  focusVersePickerBook: 'Acts',
  focusVersePickerChapter: 1,
  focusVersePickerVerse: 1,
});
vm.runInContext(extract('updateFocusVersePickerChoices'), context);
context.updateFocusVersePickerChoices();
assert.deepEqual(controls.focusMiniChapterSelect.options.map(option => option.value), ['1', '2']);
assert.equal(controls.focusMiniVerseSelectInput.value, '1');
assert.equal(controls.focusMiniPickerGo.textContent, 'Go to Acts 1:1');
context.state.focusVersePickerChapter = 2;
context.updateFocusVersePickerChoices();
assert.deepEqual(controls.focusMiniVerseSelect.options.map(option => option.value), ['1']);
assert.equal(controls.focusMiniChapterSelectInput.value, '2');
assert.equal(controls.focusMiniPickerGo.textContent, 'Go to Acts 2:1');

console.log('Passage picker in-place updates passed');
