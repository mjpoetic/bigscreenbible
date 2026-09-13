import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('function shouldShowAppUpdateNotice()');
const end = source.indexOf('\nfunction syncAppUpdateNotification()', start);
const context = vm.createContext({
  state: { appUpdateAvailable: true, appUpdateVersion: '2026.09.12.6', mode: 'reader' },
  dismissedAppUpdateVersion: '', document: { visibilityState: 'visible' }, dataLoading: false, dataError: null,
});
vm.runInContext(source.slice(start, end), context);
const visible = () => vm.runInContext('shouldShowAppUpdateNotice()', context);
assert.equal(visible(), true);
context.dismissedAppUpdateVersion = context.state.appUpdateVersion;
assert.equal(visible(), false, 'Later suppresses the current release');
context.state.appUpdateVersion = '2026.09.12.7';
assert.equal(visible(), true, 'A subsequent release can announce itself');
context.state.mode = 'big';
assert.equal(visible(), false, 'Presentations defer the notice');
context.state.mode = 'trivia';
for (const type of ['trivia', 'verse-order', 'book-sprint', 'reference-rush', 'word-search', 'crossword', 'hidden-word', 'verse-scramble']) {
  context.state.triviaGame = { type, complete: false };
  assert.equal(visible(), false, `${type} defers while active`);
  context.state.triviaGame.complete = true;
  assert.equal(visible(), true, `${type} allows notification after completion`);
}
context.state.mode = 'reader';
context.document.visibilityState = 'hidden';
assert.equal(visible(), false);
context.document.visibilityState = 'visible';
assert.equal(visible(), true, 'Returning to the page reveals a pending notice');
context.state.tutorialActive = true;
assert.equal(visible(), false);
context.state.tutorialActive = false;
context.state.appUpdateAvailable = false;
assert.equal(visible(), false);
console.log('App update notice lifecycle tests passed');

const timerStart = source.indexOf('function scheduleAppUpdateNoticeCollapse(');
const timerEnd = source.indexOf('\n}', timerStart) + 2;
let callback;
let focused = false;
let hovered = false;
let syncCount = 0;
const timerContext = vm.createContext({
  appUpdateNoticeTimer: 0, appUpdateNoticeCollapsed: false, appUpdateNoticeIdleMs: 90000,
  state: { appUpdateBusy: false },
  window: { setTimeout(fn, delay) { assert.equal(delay, 90000); callback = fn; return 1; }, clearTimeout() {} },
  document: { activeElement: {}, getElementById() { return { contains: () => focused, matches: () => hovered }; } },
  shouldShowAppUpdateNotice: () => true,
  syncAppUpdateNotification() { syncCount++; },
});
vm.runInContext(source.slice(timerStart, timerEnd), timerContext);
vm.runInContext('scheduleAppUpdateNoticeCollapse()', timerContext);
focused = true;
callback();
assert.equal(timerContext.appUpdateNoticeCollapsed, false, 'Do not hide focused controls');
focused = false;
hovered = true;
callback();
assert.equal(timerContext.appUpdateNoticeCollapsed, false, 'Do not hide hovered controls');
hovered = false;
callback();
assert.equal(timerContext.appUpdateNoticeCollapsed, true, 'Idle notice collapses');
assert.equal(syncCount, 1);
console.log('App update notice idle timer tests passed');
