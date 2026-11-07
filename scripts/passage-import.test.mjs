import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('assets/bible-app.js');
const scope = { window: {} };
vm.createContext(scope);
vm.runInContext(read('assets/bibles/BSB.js'), scope);
vm.runInContext(source.slice(source.indexOf('const bookDefinitions'), source.indexOf('const oldTestamentBooks')) + source.slice(source.indexOf('function buildBookAliases()'), source.indexOf('async function initializeBibleData()')) + '\nglobalThis.aliases = buildBookAliases();', scope);
vm.runInContext(read('assets/passage-import.js'), scope);
const extract = text => JSON.parse(JSON.stringify(scope.BSBPassageImport.extract(text, scope.aliases, scope.window.BIGSCREEN_BIBLE_BSB.chapters)));
const sample = `God Over the Seemingly Impossible
“For nothing will be impossible with God.”\n‭‭Luke‬ ‭1:37‬ ‭ESV}}
Jesus’ life: (Isaiah 9:7), (Isaiah 7:14) (Micah 5:2). (Isaiah 35:5-6). (Isaiah 61:1).
Jesus’ death: (Isaiah 53:9), (Psalm 41:9) (Zechariah 11:12). (Isaiah 53:3), (Isaiah 50:6), (Psalm 22:16), (Daniel 9:26).
Jesus’ resurrection: (Psalm 16:10-11) (Jeremiah 31:31-34). (Isaiah 53:12), (Isaiah 53:11) (Isaiah 11:10).`;
const catalog = JSON.parse(read('ios/App/PassageShare/passage-import-catalog.json'));
assert.deepEqual(catalog.aliases, JSON.parse(JSON.stringify(scope.aliases)), 'Extension aliases match the app');
const extensionResults = JSON.parse(JSON.stringify(scope.BSBPassageImport.extract(sample, catalog.aliases, catalog.chapters)));
const results = extract(sample);
assert.deepEqual(extensionResults, results, 'iOS extension recognizes the same sample passages as the site');
assert.equal(results.length, 18);
assert.equal(results.reduce((sum, item) => sum + item.verses.length, 0), 23);
assert.equal(results[0].ref, 'Luke 1:37');
assert.equal(results.at(-1).ref, 'Isaiah 11:10');
assert.ok(results.every(item => !item.error));
assert.deepEqual(extract('1 Jn. 2:1; Psalms 16:10–11; Song of Solomon 2:1').map(item => item.ref), ['1 John 2:1', 'Psalm 16:10-11', 'Song of Songs 2:1']);
assert.equal(extract('John 3:16; JOHN 3:16').length, 1);
assert.deepEqual(extract('John 3:16, 18-20')[0].verses, [16, 18, 19, 20]);
for (const ref of ['John 99:1', 'John 3:0', 'John 3:16-99', 'John 3:20-16', 'John 3:16-4:2']) assert.ok(extract(ref)[0].error, ref);
assert.deepEqual(extract('https://example.com/devotional'), []);
assert.deepEqual(extract('I have 3:16 appointments. NotJohn 3:16.'), []);
assert.throws(() => extract('a'.repeat(100001)), /100,000/);
assert.throws(() => extract(Array.from({length:101}, (_, n) => `Psalm ${n+1}:1`).join(' ')), /100 passages/);
// Native handlers consume only after the shared web receiver acknowledges receipt.
const android = read('android/app/src/main/java/com/bigscreenbible/app/MainActivity.java');
assert.match(android, /Intent.ACTION_SEND/);
assert.match(android, /bsbReceiveSharedText/);
const ios = read('ios/App/App/SceneDelegate.swift');
assert.match(ios, /bsbReceiveSharedText/);
assert.match(ios, /result as\? Bool == true/);
assert.match(read('ios/App/PassageShare/Info.plist'), /com.apple.share-services/);
const manifest = JSON.parse(read('site.webmanifest'));
assert.equal(manifest.share_target.method, 'POST');
assert.equal(manifest.share_target.params.text, 'text');
console.log('Passage import: devotional, formatting, aliases, ranges, invalid references, duplicates, limits, and native wiring passed.');
