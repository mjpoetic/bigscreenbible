import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const section = (start, end) => source.slice(source.indexOf(`function ${start}(`), source.indexOf(`function ${end}(`));
const requests = [];
const context = vm.createContext({
  state: { reference: 'John 3', versions: ['NLT'] },
  window: {},
  bibleData: Object.fromEntries(Array.from({ length: 1026 }, (_, index) => [`Psalm ${index + 1}`, { verses: [{ n: 1, BSB: 'Bundled preview.' }] }])),
  parsePassageReference: ref => {
    const match = ref.match(/^(.+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    return { key: match[1], verses: Array.from({ length: Number(match[3] || match[2]) - Number(match[2]) + 1 }, (_, index) => Number(match[2]) + index) };
  },
  isRemoteTranslation: version => ['NLT', 'ESV'].includes(version),
  ensureRemoteBibleVersion: (version, chapter) => { requests.push(`${version}:${chapter}`); },
  remoteVersionLoadKey: (version, chapter) => `${version}:${chapter}`,
  translationDisplayCode: version => version,
  loadingVersions: new Set(),
  remoteVersionErrors: new Map(),
});
vm.runInContext([
  section('uniqueVersionVerses', 'expandedVersionVerseNumbers'),
  section('getVerseText', 'activeInlineSearchQuery'),
  section('passagePreviewForReference', 'compareReferenceStrings'),
].join('\n'), context);

// Annotations must never initiate chapter requests, even after cache eviction
// and repeated full renders of a large saved collection.
for (let render = 0; render < 3; render += 1) {
  for (let chapter = 1; chapter <= 1026; chapter += 1) {
    assert.equal(context.passagePreviewForReference(`Psalm ${chapter}:1`), '');
  }
}
assert.equal(requests.length, 0, 'Uncached annotation previews must not start a fetch/rerender loop');
context.bibleData['John 3'] = { verses: [{ n: 16, NLT: 'Resident text.', BSB: 'Bundled text.' }] };
assert.equal(context.passagePreviewForReference('John 3:16'), 'Resident text.');
delete context.bibleData['John 3'].verses[0].NLT;
assert.equal(context.passagePreviewForReference('John 3:16'), '');
assert.equal(requests.length, 0, 'Evicted text must not be automatically reloaded by previews');
context.remoteVersionErrors.set('NLT:John 3', 'Unavailable');
assert.equal(context.passagePreviewForReference('John 3:16'), '');
context.window.bsbOffline = { active: true };
assert.equal(context.passagePreviewForReference('John 3:16'), '');
context.window.bsbOffline.active = false;
context.state.versions = ['BSB'];
assert.equal(context.passagePreviewForReference('John 3:16'), 'Bundled text.');
context.bibleData['John 3'].verses = [{ n: 16, NLT: 'Combined text.', verseRanges: { NLT: { start: 16 } } }, { n: 17, NLT: 'Combined text.', verseRanges: { NLT: { start: 16 } } }];
context.state.versions = ['NLT'];
assert.equal(context.passagePreviewForReference('John 3:16-17'), 'Combined text.');
assert.equal(context.passagePreviewForReference('invalid'), '');
// Actual reader navigation still requests a missing remote chapter.
context.getVerseText({ n: 1 }, 'NLT', 'John 4');
assert.deepEqual(requests, ['NLT:John 4']);
console.log('Annotation previews: large collections, cached/evicted text, offline, bundled text, ranges and reader loading passed.');
