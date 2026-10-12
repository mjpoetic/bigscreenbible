import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const properties = new Map();
const composer = { style: { setProperty: (key, value) => properties.set(key, value) } };
const viewport = { height: 500, offsetTop: 0 };
const frames = [];
let restores = 0;
const state = { reference: 'John 3', verse: 16, pendingVerseFocus: false };
const context = vm.createContext({
  state, window: { innerHeight: 844 },
  document: { getElementById: () => composer },
  fixedPopoverViewport: () => viewport,
  isCompactScreen: () => true,
  captureReaderScroll: () => ({}), render: () => { state.pendingVerseFocus = false; },
  restoreReaderScroll: () => restores++,
  requestAnimationFrame: callback => frames.push(callback),
});
vm.runInContext(`${extract('positionNoteComposer')}\n${extract('renderPreservingReaderScroll')}`, context);
context.positionNoteComposer();
assert.equal(properties.get('--note-keyboard-inset'), '344px', 'iOS overlay keyboard lifts the editor');
viewport.offsetTop = 60;
context.positionNoteComposer();
assert.equal(properties.get('--note-keyboard-inset'), '284px', 'Viewport panning is included');
viewport.height = 500; viewport.offsetTop = 0; context.window.innerHeight = 500;
context.positionNoteComposer();
assert.equal(properties.get('--note-keyboard-inset'), '0px', 'Android resized viewport is not lifted twice');
context.window.innerHeight = 844; viewport.height = 844;
context.positionNoteComposer();
assert.equal(properties.get('--note-keyboard-inset'), '0px', 'Keyboard dismissal resets positioning');
assert.equal(properties.get('--note-viewport-height'), '844px');

context.renderPreservingReaderScroll();
assert.equal(restores, 1);
state.reference = 'John 4';
while (frames.length) frames.shift()();
assert.equal(restores, 1, 'Earlier queued restores cannot overwrite chapter navigation');
state.pendingVerseFocus = true;
context.renderPreservingReaderScroll();
while (frames.length) frames.shift()();
assert.equal(restores, 1, 'Loaded chapter arrival must not restore the loading-screen scroll');

// Exercise the render gate: loading must keep the request for the next render.
const start = source.indexOf('  if (state.pendingVerseFocus && !document.querySelector(".scripture.bible-version-loading")) {');
const end = source.indexOf('  if (state.pendingInlineSearchFocus', start);
assert.ok(start > 0 && end > start);
let loading = true;
let arrivals = 0;
Object.assign(context, {
  document: { querySelector: () => loading ? {} : null },
  scrollSelectedVerseIntoView: () => arrivals++,
});
state.mode = 'reader'; state.pendingVerseFocus = true; state.pendingVerseHalo = true;
vm.runInContext(source.slice(start, end), context);
assert.equal(state.pendingVerseFocus, true);
assert.equal(frames.length, 0);
loading = false;
vm.runInContext(source.slice(start, end), context);
while (frames.length) frames.shift()();
assert.equal(arrivals, 1);
assert.equal(state.pendingVerseFocus, false);
console.log('Annotation viewport and delayed chapter navigation passed.');
