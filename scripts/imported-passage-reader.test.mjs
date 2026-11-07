import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const writes = new Map(), events = {};
let syncs = 0, renders = 0, failStorage = false;
const chapters = {
  'Luke 1': { verses: [{ n: 37, BSB: 'Nothing is impossible with God.' }] },
  'John 3': { verses: [{ n: 16, BSB: 'God so loved the world.' }, { n: 17, BSB: 'To save the world.' }] },
};
const ctx = {
  window: {}, state: { mode: 'reader', versions: ['BSB'], reference: 'Luke 1', verse: 37, sharedPassage: null, isVerseOfDayActive: false, selectedVerses: [], bookmarks: ['Psalm 23:1'], highlights: { 'Psalm 23:1': 'pink' }, notes: {} },
  bibleData: chapters, bookAliases: { luke: 'Luke', john: 'John' },
  escapeHtml: text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  document: { addEventListener(name, handler) { events[name] = handler; }, getElementById() { return null; }, querySelector() { return { scrollTo() {} }; } },
  localStorage: { setItem(key, value) { if (failStorage) throw Error('Full'); writes.set(key, value); } },
  requestAnimationFrame(fn) { fn(); },
  render() { renders++; }, renderPreservingReaderScroll() { renders++; }, scheduleCloudSync() { syncs++; }, showToast() {},
  gotoReference(ref) { const match = ref.match(/^(.+ \d+):(\d+)/); ctx.state.mode = 'reader'; ctx.state.reference = match[1]; ctx.state.verse = +match[2]; ctx.state.sharedPassage = { verses: [+match[2]] }; return true; },
  isRemoteTranslation: version => version === 'ESV', async loadBibleVersion() {}, rebuildBibleData() {},
  async ensureRemoteBibleVersion(version, key) { for (const verse of chapters[key].verses) { verse[version] = `Translated ${verse.n}`; verse.footnotes = { [version]: [{ text: 'Snapshot footnote' }] }; } },
  translationDisplayCode: version => version, uniqueVersionVerses: verses => verses,
  renderStrongText(verse, version, chapter) { return `${chapter}: ${verse[version]}`; },
  publisherFootnoteButtonMarkup: (verse, version) => verse.footnotes?.[version]?.[0]?.text || '', apiBibleAttributionMarkup: () => '',
  versionVerseLabel: verse => verse.n, highlightClassForColor: color => color ? `highlight-${color}` : '', highlightStyleForColor: () => '',
  highlightColors: ['yellow', 'blue'], icons: { book: '', note: '', bookmark: '', highlighter: '', clear: '' },
};
vm.createContext(ctx);
vm.runInContext(read('assets/passage-import.js'), ctx);
vm.runInContext(read('assets/imported-passage-reader.js'), ctx);
const reader = ctx.window.BSBImportedReader;
assert.equal(reader.open({ title: '<Devotional>', refs: ['Luke 1:37', 'John 3:16-17', 'John 3:17', 'Luke 1:37'] }), true);
await reader.afterRender();
let html = reader.markup();
assert.ok(html.includes('&lt;Devotional>'));
assert.ok(html.includes('Luke 1: Nothing is impossible'));
assert.ok(html.includes('John 3: God so loved'));
assert.ok(html.includes('John 3: To save'));
assert.ok(html.indexOf('data-import-bookmark-all') > html.lastIndexOf('data-import-context'));
assert.ok(!html.includes('data-cross-ref-verse='), 'Multi-chapter rows must not use current-chapter handlers');
assert.deepEqual([...reader.verseReferences()], ['Luke 1:37', 'John 3:16', 'John 3:17']);
const beforeLocation = [ctx.state.reference, ctx.state.verse];
reader.bookmarkAll();
assert.deepEqual([...ctx.state.bookmarks], ['Luke 1:37', 'John 3:16-17', 'John 3:17', 'Psalm 23:1']);
const synced = syncs;
reader.bookmarkAll(); assert.equal(syncs, synced, 'Bookmark all is additive and idempotent');
reader.highlightReferences(reader.verseReferences(), 'yellow');
assert.equal(ctx.state.highlights['Luke 1:37'], 'yellow');
assert.equal(ctx.state.highlights['John 3:16'], 'yellow');
assert.equal(ctx.state.highlights['John 3:17'], 'yellow');
assert.equal(ctx.state.highlights['Psalm 23:1'], 'pink');
assert.deepEqual([ctx.state.reference, ctx.state.verse], beforeLocation);
assert.ok(reader.markup().includes('All bookmarked'));
assert.ok(reader.markup().includes('paragraph-verse highlight-yellow'));
failStorage = true;
reader.highlightReferences(['John 3:16'], 'blue');
assert.equal(ctx.state.highlights['John 3:16'], 'yellow', 'Failed persistence must not mutate annotations');
failStorage = false;
ctx.state.versions = ['ESV']; await reader.afterRender();
assert.ok(reader.markup().includes('Translated 16'));
for (const chapter of Object.values(chapters)) for (const verse of chapter.verses) { delete verse.ESV; delete verse.footnotes?.ESV; }
assert.ok(reader.markup().includes('Snapshot footnote'), 'Displayed chapters retain footnotes after remote cache eviction');
ctx.state.versions = ['WEB']; await reader.afterRender();
assert.ok(reader.markup().includes('WEB is unavailable for this passage. Showing BSB.'));
reader.leave(); assert.equal(reader.isActive(), false); assert.equal(reader.markup(), '');
const app = read('assets/bible-app.js');
assert.ok(app.indexOf('id="panelBookmarkToggle"') < app.indexOf('data-open-passage-import'));
assert.ok(!app.includes('Imported passages · Import from text'));
assert.ok(read('index.html').indexOf('imported-passage-reader.js') < read('index.html').indexOf('passage-import-ui.js'));
console.log('Imported Reader: multiple chapters, full text, version changes/fallback, escaped titles, bulk annotation persistence, overlap deduplication, failure rollback, and navigation passed.');

// Scripture rendering must use each imported chapter, rather than the current one.
const strongStart = app.indexOf('function renderStrongText(');
const strongEnd = app.indexOf('\nfunction versionVerseLabel(', strongStart);
let textChapter, searchedQuery;
Object.assign(ctx, {
  getVerseText(verse, version, key) { textChapter = key; return verse[version]; },
  wordsOfJesusRanges: () => [], lineBreaksForVerse: () => [],
  inlineSearchRangesForText(text, query) { searchedQuery = query; return []; },
  activeInlineSearchQuery: () => 'first chapter only',
  renderScriptureText: text => text,
  renderTextWithStrongNumbers: (...args) => args.at(-1),
  getStrongEntries: () => [],
});
vm.runInContext(app.slice(strongStart, strongEnd), ctx);
ctx.state.strongNumbers = false;
assert.equal(ctx.renderStrongText(chapters['John 3'].verses[0], 'BSB', 'John 3'), 'God so loved the world.');
assert.equal(textChapter, 'John 3');
assert.equal(searchedQuery, '');
ctx.state.strongNumbers = true;
const strongVerse = { ...chapters['John 3'].verses[0], strong: [] };
assert.equal(ctx.renderStrongText(strongVerse, 'BSB', 'John 3'), 'John 3:16');
console.log('Imported Scripture rendering preserves chapter-specific text, search ranges, and Strong\'s references.');

reader.open({ title: 'Keep my list', refs: ['Luke 1:37'] });
const switchStart = app.indexOf('function switchMode(');
const switchEnd = app.indexOf('\nfunction ', switchStart + 1);
vm.runInContext(app.slice(switchStart, switchEnd), ctx);
ctx.switchMode('reader');
assert.equal(reader.isActive(), true, 'Choosing the already active Reader mode must keep list actions working');
const setStart = app.indexOf('function setReferenceFromString(');
const setEnd = app.indexOf('\nfunction ', setStart + 1);
ctx.parsePassageReference = () => null;
vm.runInContext(app.slice(setStart, setEnd), ctx);
assert.equal(ctx.setReferenceFromString('invalid'), false);
assert.equal(reader.isActive(), true, 'Invalid navigation must leave the imported list and actions intact');
