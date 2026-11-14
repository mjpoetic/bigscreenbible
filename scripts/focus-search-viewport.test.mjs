import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const fn = source.match(/function positionMobileFocusSearch\([^]*?\n\}/)[0];
const panel = { style: {} };
let portrait = false;
let normalBottom = 66, layoutHeight = 844, visible = true;
const viewport = { height: 844, offsetTop: 0 };
const control = { style: { bottom: '', removeProperty() { this.bottom = ''; } } };
const popover = {
  closest(selector) { return selector === ".focus-portrait-search" ? (portrait ? panel : null) : control; },
  getClientRects() { return visible ? [{}] : []; },
  getBoundingClientRect() { return { bottom: layoutHeight - (parseFloat(control.style.bottom) || normalBottom) }; },
};
const state = { focusMode: true, focusReferenceOpen: true };
const context = vm.createContext({ state, document: { getElementById() { return popover; } }, fixedPopoverViewport: () => viewport, passagePickerViewport: () => ({ top: viewport.offsetTop + 8, height: viewport.height - 16 }), getComputedStyle: () => ({ bottom: `${normalBottom}px` }) });
vm.runInContext(fn, context);
const position = () => context.positionMobileFocusSearch();
position(); assert.equal(control.style.bottom, '', 'Keep normal placement without keyboard');
viewport.height = 500;
position(); assert.equal(popover.getBoundingClientRect().bottom, 488, 'Keep input above keyboard');
position(); assert.equal(popover.getBoundingClientRect().bottom, 488, 'Repeated resize does not accumulate displacement');
viewport.offsetTop = 50;
position(); assert.equal(popover.getBoundingClientRect().bottom, 538, 'Account for iOS viewport panning');
viewport.height = 844; viewport.offsetTop = 0;
position(); assert.equal(control.style.bottom, '', 'Restore footer position on keyboard dismissal');
layoutHeight = 390; viewport.height = 200; normalBottom = 30;
position(); assert.equal(popover.getBoundingClientRect().bottom, 188, 'Short landscape stays visible');
visible = false;
position(); assert.equal(control.style.bottom, '', 'Do not move hidden desktop controls');
visible = true; state.focusReferenceOpen = false;
position(); assert.equal(control.style.bottom, '', 'Closed search leaves normal placement');
portrait = true;
viewport.height = 400;
viewport.offsetTop = 20;
position();
assert.equal(panel.style.top, '51.04px', 'Place the portrait panel inside the visible viewport');
assert.equal(Number.parseFloat(panel.style.top) + Number.parseFloat(panel.style.maxHeight), 412, 'Keep portrait results above the keyboard');
console.log('Focus search viewport: keyboard, panning, dismissal, landscape, and hidden controls passed.');
