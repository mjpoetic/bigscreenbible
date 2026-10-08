import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseUsfmFootnotes } from './build-footnote-metadata.mjs';

const parsed = parseUsfmFootnotes(String.raw`\id JHN
\c 1
\v 5 Scripture.\f + \fr 1:5 \ft First \fq quoted\fq* note.\f*
\x + \xo 1:5 \xt GEN 1:1\x*
\f + \fr 1:5 \ft A \+wh word|lemma="ignored"\+wh* here.\f*
\v 6 Next.
\c 2
\v 1 Last.\f + \fr 2:1 \ft Last note.\f*`, { JHN: 'John' });
assert.deepEqual(parsed['John 1'][5].map(note => note.text), ['First quoted note.', 'A word here.']);
assert.equal(parsed['John 1'][6], undefined);
assert.equal(parsed['John 2'][1][0].reference, '2:1');

const context = { window: {} };
vm.runInNewContext(readFileSync(new URL('../assets/bibles/footnotes.js', import.meta.url), 'utf8'), context);
const data = context.window.BIGSCREEN_BIBLE_FOOTNOTES;
for (const [version, chapters] of Object.entries(data.versions)) {
  vm.runInNewContext(readFileSync(new URL(`../assets/bibles/${version}.js`, import.meta.url), 'utf8'), context);
  const bible = context.window[`BIGSCREEN_BIBLE_${version}`];
  let count = 0;
  for (const [key, verses] of Object.entries(chapters)) {
    for (const [number, notes] of Object.entries(verses)) {
      assert.ok(bible.chapters[key]?.verses.some(verse => verse.n === Number(number)), `${version} ${key}:${number}`);
      assert.ok(notes.every(note => note.text && !/\\(?:fr|ft|fqa|wh)\b|strong=|lemma=/.test(note.text)));
      count += notes.length;
    }
  }
  assert.equal(count, data.sources[version].notes);
}
assert.ok(data.versions.BSB['John 1'][5].some(note => /comprehended/.test(note.text)));
assert.ok(data.versions.WEB['John 1'][5].some(note => /comprehended/.test(note.text)));
assert.equal(data.versions.WEB['Acts 8'][36].at(-1).reference, '8:37');
console.log('Bundled footnote extraction and verse placement tests passed');
