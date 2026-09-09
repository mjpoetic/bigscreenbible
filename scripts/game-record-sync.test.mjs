import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
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
  let operation = 'read', payload, filters = {};
  return {
    select() { return this; },
    eq(key, value) { filters[key] = value; return this; },
    update(value) { operation = 'update'; payload = clone(value); return this; },
    insert(value) { operation = 'insert'; payload = clone(value); return this; },
    async maybeSingle() {
      if (failReads) return { error: new Error('offline') };
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
    console, state: { authUser: {id: 'a'}, versions: ['BSB'] }, cloudSyncTable: 'bsb_user_sync',
    localStorage: { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v) },
    createSupabaseClient: () => client,
    authenticatedSupabaseSession: async () => ({user: {id: 'a'}}),
    accountDataOwner: () => 'a', saveSnapshotForOwner() {},
    persistentVersions: () => ['BSB'], appearanceSnapshotSettings: () => ({}),
    puzzleCreatorVersion: () => 'BSB', normalizeReadingStreak: value => value || {},
    migrateAppearanceSettings: value => value || {}, latestVersionSettings: () => ({}),
    latestSettingsSectionSettings: () => ({}), latestAppearanceSettings: () => ({}),
    mergeWordSearchRecentPassages: () => [], mergeHistory: () => [], mergeStreaks: () => ({}),
  });
  for (const name of ['gameRecordStorageKeys','compareGamePoints','mergeGameRecords',
    'captureGameRecords','applyGameRecords','captureCloudSnapshot','normalizeCloudRow',
    'mergeCloudSnapshots','uniqueList','blankLocalSnapshot','upsertCloudSnapshot']) vm.runInContext(extract(name), ctx);
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
const beforeSwitch = clone(row);
mac.authenticatedSupabaseSession = async () => { mac.state.authUser = {id: 'b'}; return {user: {id: 'b'}}; };
await mac.upsertCloudSnapshot();
assert.deepEqual(row, beforeSwitch, 'session change during save cannot write to another account');
for (const name of ['recordBookSprintBest','recordWordSearchBest','recordCrosswordBest','recordVerseOrderBest','recordReferenceRushBest','recordHiddenWordBest','recordQuizScore']) {
  assert.match(extract(name), /scheduleCloudSync\(\)/, `${name} schedules upload`);
}
assert.match(extract('persistCloudSnapshotLocally'), /applyGameRecords\(settings.gameRecords\)/);
console.log('Game record sync passed: all games, legacy import, two devices, bests, score deduplication, concurrent saves, offline retention, and account isolation.');
