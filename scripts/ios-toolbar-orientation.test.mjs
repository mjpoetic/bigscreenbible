import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.slice(source.indexOf(`function ${name}(`), source.indexOf('\n}', source.indexOf(`function ${name}(`)) + 2);
let renders = 0;
const context = vm.createContext({
  window: { bsbIOSCameraSide: 'left' }, state: { sideToolbarPosition: 'left' },
  isSideToolbarToggleEnabled: () => true,
  currentSafeAreaInsets: () => ({ left: 47, right: 47 }),
  localStorage: { setItem() {} }, scheduleCloudSync() {},
  renderPreservingReaderScroll() { renders++; },
});
vm.runInContext(`let iosToolbarManualCameraSide = null; ${extract('effectiveSideToolbarPosition')} ${extract('setSideToolbarPosition')}`, context);
const effective = () => vm.runInContext('effectiveSideToolbarPosition()', context);
assert.equal(effective(), 'right', 'equal insets must still avoid the left camera edge');
vm.runInContext("setSideToolbarPosition('left')", context);
assert.equal(effective(), 'left', 'manual arrow overrides automatic placement even when saved preference is already left');
assert.equal(renders, 1);
vm.runInContext("window.bsbIOSCameraSide = 'right'; iosToolbarManualCameraSide = null", context);
assert.equal(effective(), 'left');
vm.runInContext("setSideToolbarPosition('right')", context);
assert.equal(effective(), 'right');
vm.runInContext("window.bsbIOSCameraSide = 'none'; iosToolbarManualCameraSide = null", context);
assert.equal(effective(), 'right', 'portrait retains manual preference');
vm.runInContext("window.bsbIOSCameraSide = 'left'", context);
assert.equal(effective(), 'right', 'next rotation resets override');
vm.runInContext("window.bsbIOSCameraSide = undefined", context);
assert.equal(effective(), 'right', 'web retains existing behavior');
console.log('iOS toolbar rotation and manual override checks passed');
