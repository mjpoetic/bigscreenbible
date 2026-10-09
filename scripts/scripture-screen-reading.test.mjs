import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const functions = code.slice(code.indexOf('function scriptureReadingSource()'), code.indexOf('function accessibilitySettings('));
const state = { scriptureScreenReading: true, mode: 'reader', verse: 3, reference: 'John 1', versions: ['BSB', 'KJV'] };
const row = n => ({ dataset: { verse: String(n) } });
const node = (n, text, version = '') => ({ textContent: text, dataset: { version }, cloneNode: () => ({ textContent: text, querySelectorAll: () => [] }), matches: () => false, closest: () => n === null ? null : row(n) });
let nodes = [node(1, ' In the beginning '), node(2, 'He was with God.'), node(3, '<All things>'), node(4, 'In Him was life.')];
let rows = [1, 2, 3, 4].map(row);
const source = { querySelectorAll: selector => selector === '[data-verse]' ? rows : selector.includes('attribution') ? [] : nodes, querySelector: selector => selector === 'h1' ? { textContent: 'John 1' } : row(1) };
let focused = false, modal = false, removed = false, returned = false;
let closeCallback;
const savedPreferences = new Map();
let renders = 0;
const dialog = { setAttribute() {}, querySelector: () => ({ focus() { focused = true; } }), addEventListener(type, callback) { if (type === 'close') closeCallback = callback; }, showModal() { modal = true; }, remove() { removed = true; } };
const context = vm.createContext({ state, localStorage: { getItem: key => savedPreferences.get(key) || null, setItem: (key, value) => savedPreferences.set(key, value) }, renderPreservingReaderScroll() { renders++; }, document: { documentElement: { classList: { add() {}, remove() {} } }, querySelector: selector => selector === ".scripture-reading-dialog[open]" ? null : source, getElementById: () => null, createElement: () => dialog, body: { append() {} } }, escapeHtml: s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'), activePassageLabel: () => 'John 1', activeVersions: () => state.versions, translationDisplayCode: s => s, pauseReaderAutoScroll() {}, finishReaderVerseHold() {}, showToast() { throw new Error('Unexpected empty passage'); } });
vm.runInContext(functions, context);
const bindWorkspace = context.bindImmersiveScriptureReader;
context.bindImmersiveScriptureReader = () => {};
const entries = from => JSON.parse(JSON.stringify(context.scriptureReadingEntries(source, from)));
assert.equal(entries(false).length, 4);
assert.deepEqual(entries(true).map(e => e.text), ['<All things>', 'In Him was life.']);
// A combined verse beginning at 2 must remain when the current verse is 3.
rows = [1, 2, 4].map(row); nodes = [node(1, 'One'), node(2, 'Combined two and three'), node(4, 'Four')];
assert.deepEqual(entries(true).map(e => e.text), ['Combined two and three', 'Four']);
// Parallel translations stay in rendered verse order with their version labels.
nodes = [node(2, 'BSB text', 'BSB'), node(2, 'KJV text', 'KJV'), node(4, 'Next verse', 'BSB')];
assert.deepEqual(entries(true).map(e => e.version), ['BSB', 'KJV', 'BSB']);
// Enabled section headings retain their semantic role and follow verse filtering.
const heading = { cloneNode: () => ({ textContent: 'Section', querySelectorAll: () => [] }), textContent: 'Section', dataset: {}, matches: () => true, closest: () => ({ dataset: { headingVerse: '1' } }) };
nodes = [heading, node(2, 'Text')];
assert.equal(entries(false)[0].heading, true);
assert.equal(entries(true).some(e => e.heading), false);
// Verse of the Day and Big Screen have no per-verse rows.
nodes = [node(null, '<Plain Scripture>')]; rows = [];
assert.equal(entries(true)[0].text, '<Plain Scripture>');
context.openScriptureReadingView(false, { isConnected: true, focus() { returned = true; } });
assert.ok(modal && focused, 'Native modal opens with heading focused');
assert.ok(dialog.innerHTML.includes('&lt;Plain Scripture&gt;'), 'Scripture is escaped rather than inserted as markup');
assert.ok(dialog.innerHTML.includes('>BSB</p>'), 'Reader labels only its displayed translation');
assert.ok(!dialog.innerHTML.includes('BSB / KJV'));
assert.ok(!dialog.innerHTML.includes('data-verse='), 'Plain reading view cannot trigger verse-hold actions');
closeCallback(); assert.ok(removed && returned, 'Closing removes dialog and restores its trigger');
assert.equal(context.scriptureReadingEntries(null).length, 0);
// Off means no dialog can be opened, and the device preference survives reload.
context.setScriptureScreenReading(false);
assert.equal(state.scriptureScreenReading, false);
assert.equal(savedPreferences.get('lw_scripture_screen_reading'), 'false');
modal = false;
context.openScriptureReadingView();
assert.equal(modal, false, 'Disabled feature does not open a dialog');
assert.ok(!context.scriptureScreenReadingSettings().includes('data-scripture-reading-view='));
context.setScriptureScreenReading(true);
assert.equal(savedPreferences.get('lw_scripture_screen_reading'), 'true');
assert.equal(renders, 2);
assert.ok(context.scriptureScreenReadingSettings().includes('data-scripture-reading-view="passage"'));
assert.ok(context.scriptureScreenReadingSettings('presentation').includes('id="presentationScriptureScreenReadingToggle"'));
// Preferences are bounded, validated, and resilient to malformed saved data.
const defaults = JSON.parse(JSON.stringify(context.normalizedScriptureReaderPreferences()));
assert.equal(defaults.size, 26);
assert.equal(context.normalizedScriptureReaderPreferences({ size: 100, rate: 0.1, theme: 'unknown' }).size, 48);
assert.equal(context.normalizedScriptureReaderPreferences({ rate: 0.1 }).rate, 0.5);
assert.equal(context.normalizedScriptureReaderPreferences(null).theme, 'light');
assert.ok(dialog.innerHTML.includes('Text preferences'));
assert.ok(dialog.innerHTML.includes('data-reading-play'));

// Exercise the workspace's real event handlers with a device speech engine double.
class Element {
  constructor(text = '') { this.textContent = text; this.dataset = {}; this.handlers = {}; this.classes = new Set(); this.classList = { toggle: (key, on) => on ? this.classes.add(key) : this.classes.delete(key) }; }
  addEventListener(type, callback) { (this.handlers[type] ||= []).push(callback); }
  removeEventListener(type, callback) { this.handlers[type] = (this.handlers[type] || []).filter(item => item !== callback); }
  fire(type) { for (const callback of this.handlers[type] || []) callback({ stopPropagation() {} }); }
  setAttribute(key, value) { this[key] = value; }
  focus() { this.focused = true; }
  scrollIntoView() { this.scrolled = true; }
}
const controls = new Map();
const control = selector => { if (!controls.has(selector)) controls.set(selector, new Element()); return controls.get(selector); };
const passages = [new Element('First verse'), new Element('Second verse'), new Element('Third verse')];
const preferencesInput = new Element(); preferencesInput.type = 'select-one'; preferencesInput.dataset.readingPreference = 'theme';
const workspace = new Element(); workspace.style = { setProperty() {} };
workspace.querySelector = control;
workspace.querySelectorAll = selector => selector === '[data-reading-passage]' ? passages : selector === '[data-reading-preference]' ? [preferencesInput] : [];
workspace.close = () => workspace.fire('close');
control('article').querySelector = control;
let spoken = [], cancellations = 0, paused = 0, resumed = 0;
const engine = new Element();
Object.assign(engine, { getVoices: () => [], speak: utterance => spoken.push(utterance), cancel: () => cancellations++, pause: () => paused++, resume: () => resumed++ });
const fakeWindow = new Element(); fakeWindow.speechSynthesis = engine;
fakeWindow.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
context.window = fakeWindow;
context.document.addEventListener = () => {};
context.document.removeEventListener = () => {};
context.document.documentElement = { lang: 'en' };
bindWorkspace(workspace, { ...defaults, focus: 'one' });
assert.ok(passages[0].classes.has('reading-in-focus'));
control('[data-reading-play]').fire('click');
assert.equal(spoken[0].text, 'First verse');
spoken[0].onstart();
assert.ok(passages[0].scrolled);
control('[data-reading-play]').fire('click'); assert.equal(paused, 1);
control('[data-reading-play]').fire('click'); assert.equal(resumed, 2);
spoken[0].onend(); assert.equal(spoken[1].text, 'Second verse');
control('[data-reading-next]').fire('click'); assert.equal(spoken[2].text, 'Third verse');
assert.ok(passages[2].classes.has('reading-in-focus'));
control('[data-reading-hide]').fire('click'); assert.equal(control('header').hidden, true);
assert.equal(control('footer').hidden, true);
control('[data-reading-show]').fire('click'); assert.equal(control('header').hidden, false);
preferencesInput.value = 'dark'; preferencesInput.fire('change'); assert.equal(workspace.dataset.theme, 'dark');
assert.equal(JSON.parse(savedPreferences.get('lw_scripture_reader_preferences')).theme, 'dark');
workspace.close();
assert.ok(cancellations >= 2);
const count = spoken.length;
spoken.at(-1).onend(); assert.equal(spoken.length, count, 'Closing cannot queue another verse');
assert.equal(engine.handlers.voiceschanged.length, 0, 'Voice listener is removed on close');
// Missing speech support keeps the visual/accessibility workspace usable.
context.window = new Element();
const fallbackControls = new Map();
const fallbackControl = selector => { if (!fallbackControls.has(selector)) fallbackControls.set(selector, new Element()); return fallbackControls.get(selector); };
const fallback = new Element();
fallback.style = { setProperty() {} };
fallback.querySelector = fallbackControl;
fallback.querySelectorAll = selector => selector === '[data-reading-passage]' ? passages : [];
fallbackControl('article').querySelector = fallbackControl;
bindWorkspace(fallback, defaults);
assert.equal(fallbackControl('[data-reading-play]').disabled, true);
assert.equal(fallbackControl('[data-reading-voice-controls]').hidden, true);
assert.match(fallbackControl('[data-reading-status]').textContent, /device’s screen-reading tools/);
console.log('Scripture screen-reading and immersive workspace checks passed');

// Quick access follows the opt-in setting and does not intercept editing or OS keys.
context.icons = { scriptureReader: '<svg data-reader-icon></svg>' };
state.mode = 'reader'; state.scriptureScreenReading = false;
assert.equal(context.scriptureReaderQuickButton(), '');
state.scriptureScreenReading = true;
assert.match(context.scriptureReaderQuickButton(), /aria-keyshortcuts="Shift\+I"/);
assert.match(context.scriptureReaderQuickButton(), /data-reader-icon/);
state.mode = 'trivia';
assert.equal(context.scriptureReaderQuickButton(), '');
state.mode = 'reader';
let opened = 0, enabled = 0, closedByShortcut = 0, prevented = 0;
let openDialog = null;
context.document.getElementById = id => id === 'scriptureReadingDialog' ? openDialog : null;
context.document.querySelector = () => null;
context.isTypingTarget = target => target === 'input';
context.openScriptureReadingView = () => opened++;
context.setScriptureScreenReading = () => { enabled++; state.scriptureScreenReading = true; };
const shortcut = overrides => context.handleScriptureReaderShortcut({ key: 'I', shiftKey: true, target: null, preventDefault() { prevented++; }, ...overrides });
state.scriptureScreenReading = false;
assert.equal(shortcut(), true);
assert.equal(opened, 1); assert.equal(enabled, 1);
assert.equal(shortcut({ repeat: true }), true); assert.equal(opened, 1);
for (const guard of [{target:'input'}, {ctrlKey:true}, {metaKey:true}, {altKey:true}, {isComposing:true}, {shiftKey:false}]) assert.equal(shortcut(guard), false);
state.mode = 'trivia'; assert.equal(shortcut(), false);
state.mode = 'big'; state.presentationNoButtons = true;
assert.equal(shortcut(), true); assert.equal(opened, 2); assert.equal(enabled, 1);
context.document.querySelector = () => ({ open: true });
assert.equal(shortcut(), false, 'Other modal dialogs retain their keyboard input');
openDialog = { open: true, close() { closedByShortcut++; } };
assert.equal(shortcut(), true); assert.equal(closedByShortcut, 1);
assert.equal(shortcut({ repeat: true }), true); assert.equal(closedByShortcut, 1);
assert.ok(prevented > 0);
console.log('Scripture reader quick access and keyboard guards passed');

// Native availability arrives asynchronously and must not revive a closed reader.
const nativeWorkspace = () => {
  const controls = new Map();
  const get = selector => { if (!controls.has(selector)) controls.set(selector, new Element()); return controls.get(selector); };
  const view = new Element(); view.style = { setProperty() {} }; view.querySelector = get;
  view.querySelectorAll = selector => selector === '[data-reading-passage]' ? passages : [];
  get('article').querySelector = get;
  return { view, get };
};
let initializeNative, disposedNative = 0;
context.scriptureReaderSpeechEngine = () => ({ synth: engine, Utterance: fakeWindow.SpeechSynthesisUtterance,
  ready: new Promise(resolve => { initializeNative = resolve; }), dispose() { disposedNative++; } });
const nativeView = nativeWorkspace(); bindWorkspace(nativeView.view, defaults);
assert.equal(nativeView.get('[data-reading-play]').disabled, true);
assert.match(nativeView.get('[data-reading-status]').textContent, /Preparing/);
initializeNative(); await Promise.resolve(); await Promise.resolve();
assert.equal(nativeView.get('[data-reading-play]').disabled, false);
assert.equal(nativeView.get('[data-reading-voice-controls]').hidden, false);
assert.match(nativeView.get('[data-reading-status]').textContent, /Ready/);
nativeView.view.fire('close'); assert.equal(disposedNative, 1);
const closedNativeView = nativeWorkspace(); bindWorkspace(closedNativeView.view, defaults);
closedNativeView.view.fire('close'); initializeNative(); await Promise.resolve(); await Promise.resolve();
assert.equal(closedNativeView.get('[data-reading-play]').disabled, true);
console.log('Native speech initialization and close-during-initialization passed');
