import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('assets/passage-import-ui.js');
const receiver = source.slice(source.indexOf('  window.bsbReceiveShareReaderChange ='), source.indexOf('  const params ='));
const storage = new Map();
let failKey = '', syncs = 0;
const context = vm.createContext({
  window: {}, dataLoading: false,
  bibleData: { 'John 3': { verses: [{ n: 16 }, { n: 17 }] } }, bookAliases: { john: 'John' },
  state: { bookmarks: ['Psalm 23:1'], highlights: { 'Psalm 23:1': '#bfdbfe' }, notes: { 'Psalm 23:1': 'Keep me' } },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) { if (key === failKey) throw Error('Full'); storage.set(key, value); },
    removeItem: key => storage.delete(key),
  },
  scheduleCloudSync() { syncs++; }, render() {},
});
vm.runInContext(read('assets/passage-import.js'), context);
vm.runInContext(receiver, context);
const receive = (kind, refs, value = '', id = 'test-' + syncs) => context.window.bsbReceiveShareReaderChange(JSON.stringify({ kind, refs, value }), id);
assert.equal(receive('bookmarks', ['John 3:16-17']), true);
assert.deepEqual([...context.state.bookmarks], ['Psalm 23:1', 'John 3:16-17']);
assert.equal(receive('highlights', ['John 3:16', 'John 3:17'], '#fde68a', 'color'), true);
assert.equal(context.state.highlights['Psalm 23:1'], '#bfdbfe');
assert.equal(context.state.highlights['John 3:16'], '#fde68a');
assert.equal(receive('notes', ['John 3:16'], 'A note\nwith lines', 'note'), true);
assert.equal(context.state.notes['John 3:16'], 'A note\nwith lines');
context.state.notes['John 3:16'] = 'Newer main-app note';
const beforeReplay = syncs;
assert.equal(receive('notes', ['John 3:16'], 'A note\nwith lines', 'note'), true);
assert.equal(context.state.notes['John 3:16'], 'Newer main-app note');
assert.equal(syncs, beforeReplay);
assert.equal(receive('notes', ['John 3:16'], '', 'delete-note'), true);
assert.equal(context.state.notes['John 3:16'], undefined);
assert.equal(context.state.notes['Psalm 23:1'], 'Keep me');
assert.equal(receive('highlights', ['John 3:16'], 'none', 'remove-color'), true);
assert.equal(context.state.highlights['John 3:16'], undefined);
assert.equal(context.state.highlights['John 3:17'], '#fde68a');
for (const [kind, refs, value] of [
  ['highlights', ['John 3:16-17'], '#fde68a'], ['highlights', ['John 3:99'], '#fde68a'],
  ['highlights', ['John 3:16'], 'bad'], ['notes', ['John 3:16', 'John 3:17'], 'bad'],
  ['bookmarks', ['John 3:99'], ''], ['notes', ['John 3:16'], 'x'.repeat(20001)],
  ['unexpected', ['John 3:16'], ''],
]) assert.equal(receive(kind, refs, value, 'invalid'), false);
assert.equal(context.window.bsbReceiveShareReaderChange('{', 'broken'), false);
context.dataLoading = true;
assert.equal(receive('bookmarks', ['John 3:16'], '', 'loading'), false);
context.dataLoading = false;
const previous = storage.get('lw_highlights');
failKey = 'lw_share_reader_receipts';
assert.equal(receive('highlights', ['John 3:16'], '#bbf7d0', 'receipt-failure'), false);
assert.equal(storage.get('lw_highlights'), previous, 'Roll back persisted edit when receipt fails');
assert.equal(context.state.highlights['John 3:16'], undefined);
failKey = 'lw_notes';
assert.equal(receive('notes', ['John 3:16'], 'Failed note', 'note-failure'), false);
assert.equal(context.state.notes['John 3:16'], undefined);
failKey = '';
assert.equal(receive('notes', ['John 3:16'], 'Retry succeeds', 'note-failure'), true);
assert.equal(context.state.notes['John 3:16'], 'Retry succeeds');
console.log('Share Reader annotations: merge, ranges, validation, multiline notes, removal, replay, readiness, storage rollback and retry passed.');
