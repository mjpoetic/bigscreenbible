import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { lookupPassage, translations, escapeMarkdown } from '../src/scripture.mjs';
import { passageUrl } from '../src/passage.mjs';
for (const code of translations) {
  const bible = JSON.parse(gunzipSync(readFileSync(new URL(`../assets/${code}.json.gz`, import.meta.url))));
  test(`${code}: exact range, text, source, and website handoff`, () => {
    const result = lookupPassage(bible, '  John 3:16–18 ');
    assert.equal(result.reference, 'John 3:16-18');
    assert.deepEqual(result.verses.map(v => v.n), [16,17,18]);
    assert.ok(result.verses.every(v => v.text.length > 20));
    assert.equal(new URL(result.source).protocol, 'https:');
    assert.equal(new URL(passageUrl(result.reference, result.version)).searchParams.get('version'), code);
    assert.ok(result.text.includes(`John 3:16-18 (${code})`));
  });
  test(`${code}: chapter, numbered book, and invalid inputs`, () => {
    assert.equal(lookupPassage(bible, 'Psalms 23').verses.length, 6);
    assert.equal(lookupPassage(bible, '1 Corinthians 13:4-7').verses.length, 4);
    for (const ref of ['', 'Notabook 1', 'John 999', 'John 3:0', 'John 3:18-16', 'John 3:999', 'John 3:16-999', 'John 3:16-4:2']) assert.throws(() => lookupPassage(bible, ref), undefined, ref);
  });
}
test('escapes scripture punctuation for literal markdown display', () => {
  assert.equal(escapeMarkdown('[word] *text*'), '\\[word\\] \\*text\\*');
});
