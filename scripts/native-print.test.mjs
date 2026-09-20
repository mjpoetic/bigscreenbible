import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const handler = source.match(/async function printSelectedPassage\([^]*?\n\}/)[0];
let browserPrints = 0, nativePrints = 0;
const messages = [];
const window = { print() { browserPrints++; } };
const context = vm.createContext({ window, requestAnimationFrame: fn => fn(), showToast: text => messages.push(text) });
vm.runInContext(handler, context);
const print = () => vm.runInContext('printSelectedPassage()', context);

await print();
assert.equal(browserPrints, 1, 'Ordinary browsers retain browser printing');
window.Capacitor = { getPlatform: () => 'android' };
await print();
assert.equal(browserPrints, 2, 'Other platforms retain their existing path');
window.Capacitor = { getPlatform: () => 'ios', isPluginAvailable: () => false };
await print();
assert.match(messages.pop(), /Update the iOS app/, 'Older native builds explain how to enable printing');
assert.equal(browserPrints, 2, 'Never silently fall back to window.print in native iOS');
window.Capacitor.isPluginAvailable = name => name === 'BSBPrint';
window.Capacitor.Plugins = { BSBPrint: { async print() { nativePrints++; return { completed: false }; } } };
await print();
assert.equal(nativePrints, 1);
assert.equal(messages.length, 0, 'Cancelling the system print sheet is not an error');
window.Capacitor.Plugins.BSBPrint.print = async () => { throw new Error('unavailable'); };
await print();
assert.match(messages.pop(), /Could not open printing/);
delete window.Capacitor.Plugins;
window.Capacitor.registerPlugin = name => {
  assert.equal(name, 'BSBPrint');
  return { async print() { nativePrints++; } };
};
await print();
assert.equal(nativePrints, 2, 'Supports explicit Capacitor plugin registration');
console.log('Native print routing, browser fallback, cancellation, older builds, and errors passed.');
