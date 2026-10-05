import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
let restores = 0;
class Element {
  constructor(navigation = false) { this.navigation = navigation; }
  closest(selector) { return this.navigation && selector === '[data-goto]' ? this : null; }
}
const state = { selectedVerses: [24, 25, 26], pendingVerseFocus: true };
const context = vm.createContext({ state, Element,
  renderPreservingReaderScroll() { restores++; },
});
vm.runInContext(extract('dismissSelectionBarOnOutsideClick'), context);
context.event = { target: new Element(true) };
vm.runInContext('dismissSelectionBarOnOutsideClick(event)', context);
assert.deepEqual(state.selectedVerses, [24, 25, 26], 'Bubbling annotation navigation keeps the selected range');
assert.equal(restores, 0, 'Navigation must not restore the previous scroll position before arrival');
assert.equal(state.pendingVerseFocus, true);
context.event = { target: new Element() };
vm.runInContext('dismissSelectionBarOnOutsideClick(event)', context);
assert.equal(state.selectedVerses.length, 0, 'Ordinary outside clicks still dismiss selection');
assert.equal(restores, 1);
state.selectedVerses = [];
context.event = { target: new Element(true) };
vm.runInContext('dismissSelectionBarOnOutsideClick(event)', context);
assert.equal(restores, 1, 'Single-verse navigation remains unaffected');
console.log('Annotation navigation: range arrival and outside-click dismissal passed.');
