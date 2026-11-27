import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const coloringSource = readFileSync(new URL('../assets/coloring-book.js', import.meta.url), 'utf8');
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const match = new RegExp(`(?:async )?function ${name}\\(`).exec(source);
  assert.ok(match, name);
  const end = source.slice(match.index + 1).search(/\n(?:async )?function /);
  return source.slice(match.index, match.index + 1 + end);
}
const clone = value => JSON.parse(JSON.stringify(value));
let row = null;
let revision = 0;
let conflicts = 0;
let failReads = false;
// Simulate the existing row API, including conditional writes and concurrent inserts.
const client = { from() {
  let operation = 'read', payload, filters = {}, columns;
  return {
    select(value) { columns = value; return this; },
    eq(key, value) { filters[key] = value; return this; },
    update(value) { operation = 'update'; payload = clone(value); return this; },
    insert(value) { operation = 'insert'; payload = clone(value); return this; },
    async maybeSingle() {
      if (failReads) return { error: new Error('offline') };
      if (columns === 'reading_position:settings->readingPosition') {
        return { data: clone({ reading_position: row?.settings.readingPosition }) };
      }
      if (columns === 'toolbar_layouts:settings->studyToolbarLayouts') {
        return { data: clone({ toolbar_layouts: row?.settings.studyToolbarLayouts }) };
      }
      return { data: clone(row) };
    },
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        if (operation === 'insert' && row) { conflicts++; return { error: { code: '23505' } }; }
        if (operation === 'update' && filters.updated_at !== row?.updated_at) { conflicts++; return { data: [] }; }
        row = { ...payload, user_id: filters.user_id || payload.user_id, updated_at: String(++revision) };
        return { data: [{ user_id: row.user_id }] };
      }).then(resolve, reject);
    },
  };
} };
function device() {
  const storage = new Map();
  const ctx = vm.createContext({
    console, window:{}, requestAnimationFrame() {}, document:{querySelector:()=>null}, state: { authUser: {id: 'a'}, versions: ['BSB'] }, cloudSyncTable: 'bsb_user_sync',
    localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    createSupabaseClient: () => client,
    authenticatedSupabaseSession: async () => ({user: {id: 'a'}}),
    accountDataOwner: () => 'a', saveSnapshotForOwner() {}, scheduleCloudSync() {},
    persistentVersions: () => ['BSB'], appearanceSnapshotSettings: () => ({}),
    puzzleCreatorVersion: () => 'BSB', normalizeReadingStreak: value => value || {},
    migrateAppearanceSettings: value => value || {}, latestVersionSettings: () => ({}),
    latestSettingsSectionSettings: () => ({}), latestAppearanceSettings: () => ({}),
    mergeWordSearchRecentPassages: () => [], mergeHistory: () => [], mergeStreaks: () => ({}),
  });
  vm.runInContext(coloringSource,ctx);
  for (const name of ['gameRecordStorageKeys','compareGamePoints','mergeGameRecords',
    'captureGameRecords','applyGameRecords','captureCloudSnapshot','normalizeCloudRow',
    'captureMemoryPassages','mergeMemoryPassages','applyMemoryPassages','applySyncedMemoryPassages',
    'memoryPassages','syncMemoryOnOpen',
    'latestReadingPosition','localAccountReadingPosition','rememberCloudReadingPosition','maybeOfferReadingResume','refreshCloudReadingPosition','saveAccountReadingPosition','canTrackAccountReading',
    'normalizedVersionsUpdatedAt','normalizeStudyToolbarLayout','readStudyToolbarLayout','captureStudyToolbarLayouts',
    'mergeStudyToolbarLayouts','applyStudyToolbarLayouts','saveStudyToolbarLayout','refreshStudyToolbarLayouts',
    'mergeAnnotationDates','normalizedScriptureFontWeights','mergeScriptureFontWeights','mergeCloudSnapshots','uniqueList','blankLocalSnapshot','upsertCloudSnapshot']) vm.runInContext(extract(name), ctx);
  ctx.state.bookmarks = []; ctx.state.notes = {}; ctx.state.highlights = {}; ctx.state.history = [];
  return ctx;
}
const mac = device(), phone = device();
const timeKeys = mac.gameRecordStorageKeys().filter(k => !k.includes('scores'));
const scoreKeys = mac.gameRecordStorageKeys().filter(k => k.includes('scores'));
for (const key of timeKeys) mac.localStorage.setItem(key, JSON.stringify({ 'Easy:5': {elapsedMs: 12000, hintCount: 2, completedAt: '2026-09-08'} }));
for (const key of scoreKeys) mac.localStorage.setItem(key, JSON.stringify({ matching: [{ points: 500, elapsedMs: 12000, achievedAt: 1 }] }));
assert.equal(Object.keys(mac.captureCloudSnapshot().settings.gameRecords).length, 8);
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.deepEqual(clone(phone.captureGameRecords()), clone(mac.captureGameRecords()), 'fresh device restores every record family');
for (const key of timeKeys) phone.localStorage.setItem(key, JSON.stringify({ 'Easy:5': {elapsedMs: 10000, hintCount: 1, completedAt: '2026-09-09'}, Hard: {elapsedMs: 18000} }));
for (const key of scoreKeys) phone.localStorage.setItem(key, JSON.stringify({ matching: [1,2,3,4,5,6].map(n => ({points: n * 100, elapsedMs: 20000, achievedAt: n})) }));
await phone.upsertCloudSnapshot();
await mac.upsertCloudSnapshot();
for (const key of timeKeys) {
  const records = mac.captureGameRecords()[key];
  assert.equal(records['Easy:5'].elapsedMs, 10000);
  assert.equal(records['Easy:5'].hintCount, 1);
  assert.equal(records.Hard.elapsedMs, 18000);
}
for (const key of scoreKeys) {
  const scores = mac.captureGameRecords()[key].matching;
  assert.equal(scores.length, 5); assert.equal(scores[0].points, 600);
}
const saved = clone(mac.captureGameRecords());
await mac.upsertCloudSnapshot();
assert.deepEqual(clone(mac.captureGameRecords()), saved, 'repeated sync does not duplicate scores');
const normalized = mac.mergeGameRecords({ [timeKeys[0]]: {bad: {elapsedMs: -1}, invalid: []}, [scoreKeys[0]]: {bad: [null, {}]} });
assert.equal(normalized[timeKeys[0]].bad, undefined);
const blank = mac.blankLocalSnapshot();
mac.applyGameRecords(blank.settings.gameRecords);
for (const records of Object.values(mac.captureGameRecords())) assert.equal(Object.keys(records).length, 0, 'new account must not inherit records');
mac.applyGameRecords(saved);
assert.deepEqual(clone(mac.captureGameRecords()), saved, 'restoring account restores its records');
const merged = mac.mergeCloudSnapshots({settings: {}}, mac.captureCloudSnapshot());
assert.deepEqual(clone(merged.settings.gameRecords), saved, 'old cloud snapshot cannot erase legacy browser records');
phone.localStorage.setItem(timeKeys[0], JSON.stringify({ phone: {elapsedMs: 7000} }));
mac.localStorage.setItem(timeKeys[0], JSON.stringify({ mac: {elapsedMs: 8000} }));
await Promise.all([mac.upsertCloudSnapshot(), phone.upsertCloudSnapshot()]);
assert.ok(conflicts > 0, 'exercise conditional-write retry');
assert.equal(row.settings.gameRecords[timeKeys[0]].phone.elapsedMs, 7000);
assert.equal(row.settings.gameRecords[timeKeys[0]].mac.elapsedMs, 8000);
row = null;
await Promise.all([mac.upsertCloudSnapshot(), phone.upsertCloudSnapshot()]);
assert.ok(row.settings.gameRecords[timeKeys[0]].phone);
assert.ok(row.settings.gameRecords[timeKeys[0]].mac);
failReads = true;
await assert.rejects(mac.upsertCloudSnapshot(), /offline/);
assert.ok(mac.captureGameRecords()[timeKeys[0]].mac, 'offline failure retains local records');
failReads = false;

mac.state.scriptureFontWeights = { "font:lora": { weight: 600, updatedAt: 20 } };
phone.state.scriptureFontWeights = {
  "font:lora": { weight: 300, updatedAt: 10 },
  "custom:georgia": { weight: 800, updatedAt: 30 },
};
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.equal(row.settings.scriptureFontWeights["font:lora"].weight, 600);
assert.equal(row.settings.scriptureFontWeights["custom:georgia"].weight, 800);
console.log("Concurrent font preferences merge by font and update time");

const page = 'jesus-children';
const firstDrawing = { [page]: { ink: 'data:image/png;base64,AAAA', updatedAt: 10 } };
const secondDrawing = { [page]: { ink: 'data:image/png;base64,BBBB', updatedAt: 20 } };
mac.window.BSBColoring.applyProgress(firstDrawing);
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.deepEqual(clone(phone.window.BSBColoring.captureProgress()), firstDrawing, 'drawing syncs to a second device');
phone.window.BSBColoring.applyProgress(secondDrawing);
await phone.upsertCloudSnapshot();
await mac.upsertCloudSnapshot();
assert.deepEqual(clone(mac.window.BSBColoring.captureProgress()), secondDrawing, 'a stale device adopts the newer drawing');
const reset = { [page]: { ink: null, updatedAt: 30 } };
mac.window.BSBColoring.applyProgress(reset);
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.deepEqual(clone(phone.window.BSBColoring.captureProgress()), reset, 'reset syncs without resurrecting an older drawing');
assert.deepEqual(clone(mac.blankLocalSnapshot().settings.coloringProgress), {}, 'a different account begins without the current account drawing');

// Import legacy saves, refresh a second device, and reconcile edits after going offline.
const passage = { id: 'BSB:John 3:16', reference: 'John 3:16', version: 'BSB', text: 'For God so loved the world.',
  verseTexts: ['For God so loved the world.'], reviews: 2, interval: 4, due: 500000000 };
const secondPassage = { ...passage, id: 'BSB:John 3:17', reference: 'John 3:17' };
mac.localStorage.setItem('lw_memory_passages', JSON.stringify([passage]));
phone.localStorage.setItem('lw_memory_passages', JSON.stringify([secondPassage]));
await Promise.all([mac.upsertCloudSnapshot(), phone.upsertCloudSnapshot()]);
// The stub serves the same JSON projection used by the Memorize view refresh.
const savedRow = clone(row);
phone.localStorage.setItem('lw_memory_passages', JSON.stringify([secondPassage]));
phone.createSupabaseClient = () => ({ from: () => ({
  select(columns) { assert.equal(columns, 'memory_passages:settings->memoryPassages'); return this; },
  eq(column, id) { assert.equal(column, 'user_id'); assert.equal(id, 'a'); return this; },
  async maybeSingle() { return { data: { memory_passages: savedRow.settings.memoryPassages } }; },
}) });
await phone.syncMemoryOnOpen();
phone.createSupabaseClient = () => client;
assert.equal(phone.memoryPassages().length, 2, 'Concurrent additions survive the account merge');
const oldReview = clone(phone.memoryPassages().find(item => item.id === passage.id));
assert.equal(oldReview.reviews, 2);
assert.deepEqual(oldReview.verseTexts, passage.verseTexts);
mac.applyMemoryPassages([{ ...oldReview, reviews: 3, interval: 8, due: 900000000, updatedAt: 600000000 }, secondPassage]);
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.equal(phone.memoryPassages().find(item => item.id === passage.id).due, 900000000);
mac.applyMemoryPassages([{ id: passage.id, savedAt: 0, updatedAt: 700000000, deleted: true }, secondPassage]);
phone.applyMemoryPassages([{ ...oldReview, updatedAt: 800000000 }, secondPassage]);
await mac.upsertCloudSnapshot();
await phone.upsertCloudSnapshot();
assert.deepEqual(clone(phone.memoryPassages()).map(item => item.id), [secondPassage.id], 'A stale offline review cannot undo a deletion');
phone.applyMemoryPassages([{ ...passage, savedAt: 900000000, updatedAt: 900000000, reviews: 0 }, secondPassage]);
await phone.upsertCloudSnapshot();
await mac.upsertCloudSnapshot();
assert.equal(mac.memoryPassages().find(item => item.id === passage.id).reviews, 0, 'An explicit re-add replaces the tombstone');
assert.equal(mac.blankLocalSnapshot().settings.memoryPassages.length, 0, 'A new owner starts with a clean library');

// Import a legacy layout, then sync independent edits from two devices.
mac.localStorage.setItem('lw_toolbar_verse', JSON.stringify([{ id: 'copy', visible: false }]));
await mac.upsertCloudSnapshot();
await phone.refreshStudyToolbarLayouts();
assert.deepEqual(clone(phone.readStudyToolbarLayout('verse').controls), [{ id: 'copy', visible: false }]);
mac.saveStudyToolbarLayout('verse', [{ id: 'note', visible: true }, { id: 'copy', visible: false }]);
phone.saveStudyToolbarLayout('selection', [{ id: 'widget', visible: true }, { id: 'note', visible: false }]);
await Promise.all([mac.upsertCloudSnapshot(), phone.upsertCloudSnapshot()]);
assert.deepEqual(row.settings.studyToolbarLayouts.verse.controls.map(item => item.id), ['note', 'copy']);
assert.equal(row.settings.studyToolbarLayouts.selection.controls[0].visible, true);
await mac.upsertCloudSnapshot();
mac.saveStudyToolbarLayout('selection', [{ id: 'note', visible: true }]);
assert.equal(mac.readStudyToolbarLayout('selection').controls[0].id, 'widget');
await mac.upsertCloudSnapshot();
mac.saveStudyToolbarLayout('verse', [], true);
await mac.upsertCloudSnapshot();
await phone.refreshStudyToolbarLayouts();
assert.deepEqual(clone(phone.readStudyToolbarLayout('verse').controls), []);
assert.deepEqual(clone(mac.blankLocalSnapshot().settings.studyToolbarLayouts), {});
phone.applyStudyToolbarLayouts(undefined);
assert.equal(phone.readStudyToolbarLayout('verse'), null);
console.log('Toolbar layouts sync independently, including legacy settings, platform-specific controls, and resets.');

const beforeSwitch = clone(row);
mac.authenticatedSupabaseSession = async () => { mac.state.authUser = {id: 'b'}; return {user: {id: 'b'}}; };
await mac.upsertCloudSnapshot();
assert.deepEqual(row, beforeSwitch, 'session change during save cannot write to another account');
for (const name of ['recordBookSprintBest','recordWordSearchBest','recordCrosswordBest','recordVerseOrderBest','recordReferenceRushBest','recordHiddenWordBest','recordQuizScore']) {
  assert.match(extract(name), /scheduleCloudSync\(\)/, `${name} schedules upload`);
}
assert.match(extract('persistCloudSnapshotLocally'), /applyGameRecords\(settings.gameRecords\)/);
console.log('Game record sync passed: all games, legacy import, two devices, bests, score deduplication, concurrent saves, offline retention, and account isolation.');

// A newer position survives writes from an older device and offers an exact-verse resume.
function setupReading(device, id) {
  let dialog;
  const navigations = [];
  const document = {
    visibilityState: 'visible',
    querySelector: () => dialog?.open ? dialog : null,
    createElement: () => ({
      setAttribute() {},
      addEventListener(_, handler) { this.onClose = handler; },
      showModal() { this.open = true; },
      close(value) { this.returnValue = value; this.onClose(); },
      remove() { dialog = null; },
    }),
    body: { append(value) { dialog = value; } },
  };
  Object.assign(device, {
    dataLoading: false, dataError: false, document, crypto: { randomUUID: () => id },
    currentReaderScrollAnchor: () => ({ verse: '1' }),
    referenceExists: reference => /^John 3:\d+$/.test(reference),
    escapeHtml: value => value, cancelReaderAppResumeRestore() {},
    gotoReference: (reference, options) => navigations.push([reference, options.spotlight]),
  });
  Object.assign(device.state, { mode: 'reader', startupApplied: true, reference: 'John 3', verse: 1 });
  return { get dialog() { return dialog; }, navigations };
}
const readingSource = device(), readingDestination = device();
const macReading = setupReading(readingSource, 'mac');
const phoneReading = setupReading(readingDestination, 'phone');
readingSource.saveAccountReadingPosition('John 3', 16);
await readingSource.upsertCloudSnapshot();
const savedReadingPosition = readingSource.localAccountReadingPosition('a');
assert.equal(readingSource.localAccountReadingPosition('another-account'), null);
assert.equal(row.settings.readingPosition.reference, 'John 3:16');
readingSource.maybeOfferReadingResume();
assert.equal(macReading.dialog, undefined, 'A device should never offer its own reading position');

readingDestination.localStorage.setItem('lw_synced_reading_position:a', JSON.stringify({
  reference: 'John 3:2', deviceId: 'phone', savedAt: savedReadingPosition.savedAt - 1,
}));
readingDestination.localStorage.setItem('lw_reading_device', 'phone');
await readingDestination.upsertCloudSnapshot();
await readingDestination.refreshCloudReadingPosition();
assert.equal(row.settings.readingPosition.reference, 'John 3:16');
readingDestination.maybeOfferReadingResume();
assert.match(phoneReading.dialog.innerHTML, /John 3:16/);
phoneReading.dialog.close('dismiss');
readingDestination.maybeOfferReadingResume();
assert.equal(phoneReading.dialog, null, 'Not now suppresses the same position');
assert.deepEqual(phoneReading.navigations, []);

readingSource.saveAccountReadingPosition('John 3', 21);
await readingSource.upsertCloudSnapshot();
await readingDestination.refreshCloudReadingPosition();
readingDestination.maybeOfferReadingResume();
phoneReading.dialog.close('resume');
assert.deepEqual(phoneReading.navigations, [['John 3:21', true]]);
console.log('Cross-device reading position and resume tests passed');
