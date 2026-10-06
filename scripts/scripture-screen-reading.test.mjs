import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const functions = code.slice(code.indexOf('function scriptureReadingSource()'), code.indexOf('function accessibilitySettings('));
const state = { mode: 'reader', verse: 3, reference: 'John 1', versions: ['BSB', 'KJV'] };
const row = n => ({ dataset: { verse: String(n) } });
const node = (n, text, version = '') => ({ textContent: text, dataset: { version }, matches: () => false, closest: () => n === null ? null : row(n) });
let nodes = [node(1, ' In the beginning '), node(2, 'He was with God.'), node(3, '<All things>'), node(4, 'In Him was life.')];
let rows = [1, 2, 3, 4].map(row);
const source = { querySelectorAll: selector => selector === '[data-verse]' ? rows : selector.includes('attribution') ? [] : nodes, querySelector: selector => selector === 'h1' ? { textContent: 'John 1' } : row(1) };
let focused = false, modal = false, removed = false, returned = false;
let closeCallback;
const dialog = { setAttribute() {}, querySelector: () => ({ focus() { focused = true; } }), addEventListener(type, callback) { if (type === 'close') closeCallback = callback; }, showModal() { modal = true; }, remove() { removed = true; } };
const context = vm.createContext({ state, document: { querySelector: () => source, getElementById: () => null, createElement: () => dialog, body: { append() {} } }, escapeHtml: s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'), activePassageLabel: () => 'John 1', activeVersions: () => state.versions, translationDisplayCode: s => s, pauseReaderAutoScroll() {}, finishReaderVerseHold() {}, showToast() { throw new Error('Unexpected empty passage'); } });
vm.runInContext(functions, context);
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
const heading = { textContent: 'Section', dataset: {}, matches: () => true, closest: () => ({ dataset: { headingVerse: '1' } }) };
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
console.log('Scripture screen-reading checks passed');
