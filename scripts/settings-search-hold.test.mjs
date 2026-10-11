import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const binder = source.slice(source.indexOf('function bindSettingsSearchHoldControls()'), source.indexOf('function bindSettingsSearchControls()'));
for (const id of ['settingsToggle', 'railSettingsToggle', 'mobileFloatingSettings']) {
  const handlers = {};
  let timeout;
  const opened = [];
  const button = { isConnected: true, classList: { add() {}, remove() {} }, addEventListener(name, fn) { (handlers[name] ||= []).push(fn); } };
  const context = { document: { getElementById: key => key === id ? button : null }, setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => { timeout = null; }, Date, suppressSettingsSearchHoldClickUntil: 0, playControlHaptic() {}, openSettingsSearchFromHold: anchor => opened.push(anchor) };
  vm.runInNewContext(`${binder}\nbindSettingsSearchHoldControls();`, context);
  const fire = (name, extra = {}) => {
    const event = { pointerId: 1, button: 0, clientX: 0, clientY: 0, detail: 1, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...extra };
    handlers[name]?.forEach(fn => fn(event));
    return event;
  };
  fire('pointerdown'); fire('pointerup');
  assert.equal(opened.length, 0, 'Short tap preserves ordinary settings action');
  fire('pointerdown'); timeout(); fire('pointerup');
  assert.deepEqual(opened, [id === 'mobileFloatingSettings' ? 'floating' : 'header']);
  assert.equal(fire('click').stopped, true, 'Release click must not close settings');
  assert.equal(fire('click', { detail: 0 }).stopped, undefined, 'Keyboard activation remains available');
  for (const cancellation of ['pointercancel', 'pointerleave', 'pointermove']) {
    fire('pointerdown'); timeout(); fire(cancellation, { clientX: 20 }); fire('pointerup');
    assert.equal(opened.length, 1, 'Cancelled holds must not open search');
  }
  fire('pointerdown', { button: 2 });
  assert.equal(timeout, null, 'Right click does not start hold');
}
console.log('Settings search hold gesture tests passed');
