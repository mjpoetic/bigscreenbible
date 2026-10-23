import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const storage = new Map();
const notices = [];
const chapter = { verses: [{ n: 16, BSB: 'For God so loved the world.', KJV: 'For God so loved the world,' }, { n: 17, BSB: 'For God did not send His Son.' }] };
const context = {
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  state: { versions: ['BSB'], mode: 'memorize', memoryPractice: null },
  showToast: text => notices.push(text), render() {}, switchMode() {},
  bibleData: { 'John 3': chapter },
  parsePassageReference: reference => reference.startsWith('John 3:') ? { key: 'John 3' } : null,
  formatReferenceLabel: (key, numbers) => `${key}:${numbers.join(',')}`,
  translationDisplayCode: code => code,
  isRemoteTranslation: code => code === 'NIV',
  async loadBibleVersion() {}, async ensureRemoteBibleVersion() {}, rebuildBibleData() {},
  remoteVersionData: new Map(), remoteVersionLoadKey: (version, key) => `${version}:${key}`,
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function memoryPassages()'), source.indexOf('function reader(chapterChange')), context);
await context.addMemoryPassage('John 3:16-17');
assert.equal(context.memoryPassages().length, 1);
assert.equal(context.memoryPassages()[0].text, 'For God so loved the world. For God did not send His Son.');
await context.addMemoryPassage('John 3:16-17');
assert.equal(context.memoryPassages().length, 1, 'Repeated additions retain one progress record');
await context.addMemoryPassage('John 3:16', 'KJV');
assert.equal(context.memoryPassages().length, 2, 'Translations have independent records');
await context.addMemoryPassage('John 3:16-18');
assert.equal(context.memoryPassages().length, 2, 'Missing verses never save a partial passage');
await context.addMemoryPassage('John 3:16', 'NIV');
assert.equal(context.memoryPassages().length, 2, 'Unavailable translation never falls back to another wording');
const id = context.memoryPassages()[0].id;
context.startMemoryPractice(id, 'order');
assert.equal(new Set(context.state.memoryPractice.order).size, 13, 'Word bank retains every token including duplicates');
assert.equal(context.memoryWordHint('world,', 1, 'letters'), 'w＿＿＿＿,');
assert.equal(context.memoryWordHint('God', 0, 'hide'), 'God');
assert.equal(context.memoryWordHint('God', 1, 'hide'), '＿＿＿');
for (let i = 0; i < 8; i++) context.reviewMemoryPassage(id, true);
assert.equal(context.memoryPassages()[0].interval, 30);
assert.ok(context.memoryPassages()[0].due > Date.now());
context.reviewMemoryPassage(id, false);
assert.equal(context.memoryPassages()[0].interval, 1);
assert.equal(context.state.memoryPractice, null);
context.startMemoryPractice(id, 'hide');
let practice = context.state.memoryPractice;
assert.equal(context.memoryWordNeedsAnswer('God', 1, 'hide'), true);
assert.equal(context.memoryWordNeedsAnswer('For', 0, 'hide'), false);
assert.equal(context.memoryWordNeedsAnswer('—', 1, 'letters'), false);
assert.equal(context.normalizeMemoryAnswer('  GOD! '), 'god');
assert.equal(context.normalizeMemoryAnswer('age-during'), 'ageduring');
assert.equal(context.normalizeMemoryAnswer('Ｆｏｒ'), 'for');
practice.answers = { 1: 'god!', 3: 'wrong' };
context.checkMemoryAnswers();
assert.equal(practice.results[1], true);
assert.equal(practice.results[3], false);
assert.match(practice.feedback, /^1 of 6 missing words correct/);
assert.equal(practice.answers[3], 'wrong', 'Checking retains drafts for correction');
const words = context.memoryPassages()[0].text.split(/\s+/);
words.forEach((word, index) => { if (context.memoryWordNeedsAnswer(word, index, 'hide')) practice.answers[index] = word.toUpperCase(); });
context.checkMemoryAnswers();
assert.match(practice.feedback, /all 6 missing words correctly/);
context.startMemoryPractice(id, 'letters');
practice = context.state.memoryPractice;
context.checkMemoryAnswers();
assert.match(practice.feedback, /^0 of 13/);
words.forEach((word, index) => practice.answers[index] = word);
context.checkMemoryAnswers();
assert.match(practice.feedback, /all 13 missing words correctly/);
assert.equal(context.memoryPassages()[0].reviews, 9, 'Checking words does not automatically award a review');
storage.set('lw_memory_passages', '{invalid');
assert.equal(context.memoryPassages().length, 0);
context.localStorage.setItem = () => { throw new Error('Quota'); };
assert.equal(context.saveMemoryPassages([]), false);
assert.match(notices.at(-1), /Could not save/);
console.log('Memorization passage, translation, hints, review scheduling, and storage tests passed');
