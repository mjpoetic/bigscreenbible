import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const functions = source.slice(source.indexOf('function normalizedFocusControlsHideSeconds('), source.indexOf('function resetFocusToolSurfaces('));
let timers = new Map(), nextId = 0;
const controls = ['mobileFloatingSettings', 'readerAutoScrollButton', 'desktopFocusToolsToggle', 'pageDown'].map(id => ({
  id, focused: false, classes: new Set(),
  classList: { add(...names) { names.forEach(n => this.owner.classes.add(n)); }, remove(...names) { names.forEach(n => this.owner.classes.delete(n)); } },
  matches() { return this.focused; },
}));
controls.forEach(b => b.classList.owner = b);
const context = vm.createContext({
  state: { focusMode: true, focusControlsFade: true, focusControlsHide: false, focusControlsHideSeconds: 10, mode: 'reader' },
  document: { querySelectorAll: selector => selector === ".reader-page-button.available, #readerAutoScrollButton" ? controls.filter(b => ["readerAutoScrollButton", "pageDown"].includes(b.id)) : controls, getElementById: id => controls.find(b => b.id === id) },
  setTimeout: (fn, delay) => { timers.set(++nextId, { fn, delay }); return nextId; },
  clearTimeout: id => timers.delete(id),
  isCompactScreen: () => false,
});
vm.runInContext(`let mobileSettingsIdleTimer = 0, focusControlsHideTimer = 0; ${functions}`, context);
const wake = () => context.revealMobileSettingsButton();
const run = delay => [...timers.values()].filter(t => t.delay === delay).forEach(t => t.fn());
wake(); run(3200);
assert.ok(controls.every(b => b.classes.has('focus-control-faded')), 'All controls fade on desktop, including auto-scroll');
assert.equal(timers.size, 1, 'Default never schedules hiding');
wake(); assert.ok(controls.every(b => b.classes.size === 0), 'Interaction restores visibility');
context.state.focusControlsHide = true;
wake(); run(10000);
assert.ok(controls.every(b => b.classes.has('focus-control-hidden')));
context.state.settingsOpen = true;
wake(); assert.equal(timers.size, 0, 'Open settings suppress idle timers');
context.state.settingsOpen = false;
controls[1].focused = true;
wake(); run(3200); run(10000);
assert.equal(controls[1].classes.size, 0, 'Keyboard-focused auto-scroll stays visible');
controls[1].focused = false;
context.state.autoScrollActive = true;
const oldTimer = nextId;
context.revealMobileSettingsButton({ type: 'scroll' });
assert.equal(nextId, oldTimer, 'Automatic scroll does not restart idle timing');
context.state.autoScrollActive = false;
context.state.focusControlsFade = false;
wake(); assert.equal(timers.size, 0, 'Original desktop behavior stays visible');
assert.equal(context.normalizedFocusControlsHideSeconds(null), 10);
assert.equal(context.normalizedFocusControlsHideSeconds('bad'), 10);
assert.equal(context.normalizedFocusControlsHideSeconds(1), 5);
assert.equal(context.normalizedFocusControlsHideSeconds(1000), 300);
context.state.focusMode = false;
context.state.focusControlsFade = true;
for (const mode of ['reader', 'parallel']) {
  context.state.mode = mode;
  wake(); run(3200);
  assert.ok(controls[1].classes.has('focus-control-faded'), `${mode}: auto-scroll fades outside Focus`);
  assert.ok(controls[3].classes.has('focus-control-faded'), `${mode}: page navigation fades outside Focus`);
  assert.equal(controls[0].classes.size, 0, `${mode}: other controls stay unchanged`);
  run(10000);
  assert.ok(controls[1].classes.has('focus-control-hidden'), `${mode}: optional hiding works`);
  wake();
  assert.ok(controls.every(b => b.classes.size === 0), `${mode}: interaction restores controls`);
  context.state.autoScrollActive = true;
  const timerBeforeScroll = nextId;
  context.revealMobileSettingsButton({ type: 'scroll' });
  assert.equal(nextId, timerBeforeScroll, `${mode}: automatic scrolling does not wake controls`);
  context.state.autoScrollActive = false;
}
context.state.mode = 'big';
assert.equal(context.floatingControlsFadeEnabled(), false);
console.log('Focus and reading control inactivity tests passed.');
