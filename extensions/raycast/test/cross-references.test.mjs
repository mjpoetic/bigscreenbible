import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {relatedReferences} from '../src/cross-references.mjs';
const catalog=JSON.parse(gunzipSync(readFileSync(new URL('../assets/crossrefs.json.gz',import.meta.url))));
test('real John 3:16 references and chapters resolve from bundled catalog',()=>{
 const refs=relatedReferences(catalog,'John 3:16');
 assert.ok(refs.length>0);assert.ok(refs.every(r=>r.sources.includes('John 3:16')));
 assert.ok(relatedReferences(catalog,'John 3').length>=refs.length);
 assert.deepEqual(relatedReferences(catalog,'Psalms 23:1'),relatedReferences(catalog,'Psalm 23:1'));
});
test('range targets retain full range, shared hits deduplicate, and cross-chapter targets fall back',()=>{
 const fixture={refs:{'John 3:16':[['Romans 5:8-9','Romans 5:8'],['John 1:50-2:2','John 1:50']],'John 3:17':['Romans 5:8-9']}};
 const hits=relatedReferences(fixture,'John 3:16–17');
 assert.equal(hits.length,2);assert.equal(hits[0].reference,'Romans 5:8-9');assert.equal(hits[0].sources.length,2);
 assert.equal(hits[1].reference,'John 1:50');assert.equal(hits[1].label,'John 1:50-2:2');
 assert.deepEqual(relatedReferences(fixture,'John 3:17-16'),[]);
 assert.deepEqual(relatedReferences(fixture,'Unknown 1:1'),[]);
});
