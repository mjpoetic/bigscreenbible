import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const label = {};
const notch = { style: {}, offsetHeight: 44, querySelector: () => label, setAttribute(key, value) { this[key] = value; } };
const scripture = { scrollTop: 0, getBoundingClientRect: () => ({ top: 72 }), querySelectorAll: () => [
  { dataset: { verse: '1' }, getBoundingClientRect: () => ({ bottom: 90 }) },
  { dataset: { verse: '2' }, getBoundingClientRect: () => ({ bottom: 180 }) },
] };
const context = vm.createContext({
  state: { reference: 'John 3', focusWorkspacePanel: '' },
  document: { getElementById: () => notch, querySelector: s => s === '.scripture' ? scripture : { getBoundingClientRect: () => ({ bottom: 72 }) } },
  activePassageLabel: () => 'John 3:1',
});
vm.runInContext(`let focusPassageNotchFrame = 0; ${source.slice(source.indexOf('function updateFocusPassageNotch()'), source.indexOf('function scheduleFocusPassageNotch()'))}`, context);
context.updateFocusPassageNotch();
assert.equal(notch.hidden, true, 'The chapter top needs no floating notch');
scripture.scrollTop = 100;
context.updateFocusPassageNotch();
assert.equal(notch.hidden, false);
assert.equal(notch.style.top, '72px');
assert.equal(label.textContent, 'John 3:2', 'The reference follows the first unobscured verse');
assert.equal(notch['aria-label'], 'Choose passage, currently John 3:2');
scripture.scrollTop = 0;
context.state.focusWorkspacePanel = 'Verse';
context.updateFocusPassageNotch();
assert.equal(notch.hidden, false, 'An open picker keeps its anchor visible');
console.log('Focus passage notch visibility, placement, and reference checks passed.');

// Keep the notch-centered picker below its anchor even on short landscape screens.
const panel = { style: { removeProperty(key) { delete this[key]; } }, scrollHeight: 360 };
context.updateFocusPassageNotch = () => {};
context.isCompactScreen = () => false;
context.state.focusMode = true;
context.state.focusVersePickerAnchor = '#focusPassageNotch';
let viewportWidth = 1024;
notch.getBoundingClientRect = () => ({ left: viewportWidth / 2 - 100, width: 200, top: 72, bottom: 116 });
context.document.getElementById = id => id === 'mobileFocusWorkspace' ? panel : notch;
context.document.documentElement = { clientWidth: viewportWidth, clientHeight: 768 };
context.window = {};
vm.runInContext(source.slice(source.indexOf('function positionFocusWorkspacePanel()'), source.indexOf('function pushReminderSettings(')), context);
for (const [width, height] of [[1024, 768], [390, 844], [844, 390], [667, 320]]) {
  viewportWidth = width;
  context.document.documentElement.clientWidth = width;
  context.document.documentElement.clientHeight = height;
  context.positionFocusWorkspacePanel();
  const pickerWidth = parseFloat(panel.style.width);
  assert.ok(Math.abs(parseFloat(panel.style.left) + pickerWidth / 2 - width / 2) <= 1, 'Picker is centered under the notch');
  assert.equal(panel.style.top, '124px', 'Picker stays below the notch in every orientation');
  assert.ok(parseFloat(panel.style.maxHeight) <= height - 124, 'Dialog fits the remaining viewport');
}
console.log('Focus picker portrait, landscape, and desktop positioning checks passed.');
