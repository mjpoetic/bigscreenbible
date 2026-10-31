import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const start = source.indexOf('const bibleProviders =');
const end = source.indexOf('function translationOptionDetailsMarkup', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({});
vm.runInContext(source.slice(start, end), context);
const evaluate = (expression) => vm.runInContext(expression, context);
for (const version of ['NIV', 'NASB2020']) {
  assert.equal(evaluate(`translationProvider('${version}').edgeFunction`), 'youversion-passage');
  assert.equal(evaluate(`translationProvider('${version}').supportsSearch`), true);
  assert.equal(evaluate(`translationProvider('${version}').tracksFums`), undefined);
  // Exercise the documented rollback without changing stored translation codes.
  evaluate(`translationLookup['${version}'].provider = 'apiBible'`);
  assert.equal(evaluate(`translationProvider('${version}').edgeFunction`), 'api-bible-passage');
  assert.equal(evaluate(`translationProvider('${version}').tracksFums`), true);
  assert.notEqual(evaluate(`translationProvider('${version}').supportsSearch`), false);
}
assert.equal(evaluate("translationDisplayCode('NASB2020')"), 'NASB');
assert.equal(evaluate("translationProvider('NLT').edgeFunction"), 'api-bible-passage');
assert.equal(evaluate("translationProvider('AMP').edgeFunction"), 'youversion-passage');
assert.equal(evaluate("translationProvider('NIRV').edgeFunction"), 'youversion-passage');
for (const version of ['CEV', 'NKJV']) {
  assert.equal(evaluate(`translationProvider('${version}').edgeFunction`), 'api-bible-passage');
  assert.equal(evaluate(`translationProvider('${version}').tracksFums`), true);
  assert.notEqual(evaluate(`translationProvider('${version}').supportsSearch`), false);
  assert.equal(evaluate(`isRemoteTranslation('${version}')`), true);
  assert.equal(evaluate(`isBundledTranslation('${version}')`), false);
}
console.log('Provider cutover and independent rollback tests passed');

function extractProviderFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0);
  const next = source.indexOf('\nfunction ', start + 1);
  const nextAsync = source.indexOf('\nasync function ', start + 1);
  const end = Math.min(...[next, nextAsync, source.length].filter(n=>n>start));
  return source.slice(start,end);
}
const bridgeContext = vm.createContext({
  bibleData: {'John 3': {verses: [{n:23, NKJV:'Separate verse 23.'},{n:24, NKJV:'Separate verse 24.'}]}},
  normalizeRemoteProviderText: (_version,text)=>text,
});
vm.runInContext(['mergeRemoteVersionChapter','uniqueVersionVerses','versionVerseLabel','expandedVersionVerseNumbers'].map(extractProviderFunction).join('\n'), bridgeContext);
vm.runInContext(`mergeRemoteVersionChapter('CEV', 'John 3', [{n:23,verseEnd:24,text:'Combined passage.',paragraphStart:true}]);`,bridgeContext);
const bridged = bridgeContext.bibleData['John 3'].verses;
assert.equal(bridged[0].CEV,'Combined passage.');
assert.equal(bridged[1].CEV,'Combined passage.');
assert.equal(bridged[1].NKJV,'Separate verse 24.');
assert.equal(vm.runInContext("uniqueVersionVerses(bibleData['John 3'].verses,'CEV').length",bridgeContext),1);
assert.equal(vm.runInContext("uniqueVersionVerses(bibleData['John 3'].verses,'NKJV').length",bridgeContext),2);
assert.equal(vm.runInContext("versionVerseLabel(bibleData['John 3'].verses[1],'CEV')",bridgeContext),'23–24');
assert.equal(vm.runInContext("expandedVersionVerseNumbers('John 3',[24],'CEV').join(',')",bridgeContext),'23,24');
console.log('Combined-verse merge and cross-translation isolation tests passed');

const attributionContext = vm.createContext({
  state: {reference: 'John 3'},
  remoteVersionData: new Map([
    ['NIV', {copyright: '<script>unsafe</script>'}],
    ['AMP', {copyright: '<script>unsafe</script>'}],
  ]),
  remoteVersionLoadKey: version => version,
  translationProvider: version => ({showsAttribution: version !== 'WEB', tracksFums: version === 'NLT'}),
  escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
});
vm.runInContext(extractProviderFunction('apiBibleAttributionMarkup'), attributionContext);
const attribution = versions => vm.runInContext(`apiBibleAttributionMarkup(${JSON.stringify(versions)})`, attributionContext);
const mixedAttribution = attribution(['NIV', 'NIRV', 'AMP', 'NLT']);
assert.ok(mixedAttribution.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
assert.ok(!mixedAttribution.includes('<script>'));
assert.equal((mixedAttribution.match(/unsafe/g) || []).length, 1);
assert.equal((mixedAttribution.match(/href="https:\/\/www.biblica.com\/"/g) || []).length, 1);
assert.ok(mixedAttribution.includes('href="https://www.lockman.org/"'));
assert.ok(mixedAttribution.includes('href="https://api.bible/"'));
assert.ok(attribution(['ESV']).includes('ESV® Bible © 2001 by Crossway'));
assert.ok(attribution(['ESV']).includes('/terms/#bible-rights'));
assert.equal(attribution(['WEB']), '');
for (const version of ['CEV', 'NKJV', 'NASB2020']) {
  assert.ok(attribution([version]).includes('rel="noopener noreferrer"'));
}
console.log('Safe publisher attribution and independent link deduplication tests passed');

const cacheContext = vm.createContext({
  state: {reference: 'John 3'},
  remoteVersionData: new Map(),
  remoteVersionCacheMaxAgeMs: 86400000,
  bibleData: Object.fromEntries(['John 1', 'John 2', 'John 3', 'John 4'].map(key => [key, {verses: [{n: 1, WEB: 'Keep this text', footnotes: {WEB: [{text: 'Keep note'}]}}]}])),
  normalizeRemoteProviderText: (_version, text) => text,
});
vm.runInContext(['remoteVersionLoadKey', 'removeRemoteVersionChapter', 'pruneExpiredRemoteVersionData', 'cacheRemoteVersionChapter', 'mergeRemoteVersionChapter'].map(extractProviderFunction).join('\n'), cacheContext);
const cacheEval = expression => vm.runInContext(expression, cacheContext);
const addChapter = (version, chapter, count = 1) => cacheEval(`cacheRemoteVersionChapter('${version}', '${chapter}', {verses: Array.from({length:${count}}, (_,i) => ({n:i+1,text:'Remote text',footnotes:[{text:'Remote note'}],lineBreaks:[3],wordsOfJesus:[{start:0,end:4}]}))})`);
addChapter('NLT', 'John 1');
addChapter('NLT', 'John 3');
addChapter('NLT', 'John 2');
assert.equal(cacheEval('remoteVersionData.size'), 2);
assert.equal(cacheEval("bibleData['John 1'].verses[0].NLT"), undefined);
assert.equal(cacheEval("bibleData['John 1'].verses[0].footnotes.NLT"), undefined);
assert.equal(cacheEval("bibleData['John 1'].verses[0].wordsOfJesus.NLT"), undefined);
assert.equal(cacheEval("bibleData['John 1'].verses[0].lineBreaks.NLT"), undefined);
assert.equal(cacheEval("bibleData['John 1'].verses[0].WEB"), 'Keep this text');
assert.equal(cacheEval("bibleData['John 1'].verses[0].footnotes.WEB[0].text"), 'Keep note');
assert.ok(cacheEval("remoteVersionData.has('NLT:John 3')"));
addChapter('NIV', 'John 4');
assert.ok(cacheEval("remoteVersionData.has('NLT:John 3')"));
cacheEval("pruneExpiredRemoteVersionData(Date.now() + remoteVersionCacheMaxAgeMs + 1)");
assert.equal(cacheEval('remoteVersionData.size'), 0);
assert.equal(cacheEval("bibleData['John 3'].verses[0].NLT"), undefined);
addChapter('ESV', 'John 1', 300);
addChapter('ESV', 'John 3', 300);
assert.equal(cacheEval('remoteVersionData.size'), 1);
assert.ok(cacheEval("remoteVersionData.has('ESV:John 3')"));
assert.throws(() => addChapter('ESV', 'John 2', 501), /permitted cache size/);
assert.equal(cacheEval('remoteVersionData.size'), 1);
// Refreshing a chapter removes verses and metadata absent in its replacement.
addChapter('ESV', 'John 3', 1);
assert.equal(cacheEval("bibleData['John 3'].verses.length"), 1);

console.log('Remote cache bounds, expiry, replacement, and translation isolation passed');

// Exercise the fetch path with duplicate callers and out-of-order completion.
const pendingFetches = [];
Object.assign(cacheContext, {
  window: {BigScreenBibleSupabase: {anonKey: 'public-test-key'}},
  isRemoteTranslation: () => true,
  remoteVersionErrors: new Map(), remoteVersionRequests: new Map(),
  remoteVersionRerenders: new Set(), loadingVersions: new Set(),
  translationProvider: () => ({}), remoteFunctionUrl: (_version, chapter) => chapter,
  trackApiBibleView: () => {}, renderPreservingReaderScroll: () => {}, console,
  fetch: url => new Promise(resolve => pendingFetches.push({url, resolve})),
});
vm.runInContext(extractProviderFunction('ensureRemoteBibleVersion'), cacheContext);
cacheEval('remoteVersionData.clear()');
const first = cacheEval("ensureRemoteBibleVersion('NLT', 'John 1')");
const duplicate = cacheEval("ensureRemoteBibleVersion('NLT', 'John 1')");
const main = cacheEval("ensureRemoteBibleVersion('NLT', 'John 3')");
const preview = cacheEval("ensureRemoteBibleVersion('NLT', 'John 2', {rerender:false})");
assert.equal(pendingFetches.length, 3);
const finish = chapter => pendingFetches.find(item => item.url === chapter).resolve({ok:true,json: async () => ({verses:[{n:1,text:'Fetched text'}]})});
finish('John 3'); await main;
finish('John 2'); await preview;
finish('John 1'); await Promise.all([first, duplicate]);
assert.equal(cacheEval('remoteVersionData.size'), 2);
assert.ok(cacheEval("remoteVersionData.has('NLT:John 3')"));
assert.equal(cacheEval('remoteVersionRequests.size'), 0);
assert.equal(cacheEval('loadingVersions.size'), 0);
assert.ok(cacheEval("pruneExpiredRemoteVersionData(Date.now() + remoteVersionCacheMaxAgeMs + 1)"));
const reload = cacheEval("ensureRemoteBibleVersion('NLT', 'John 3')");
assert.equal(pendingFetches.length, 4);
pendingFetches[3].resolve({ok:true,json: async () => ({verses:[{n:1,text:'Fresh text'}]})});
await reload;
assert.equal(cacheEval("bibleData['John 3'].verses[0].NLT"), 'Fresh text');
console.log('Concurrent remote loads, active-chapter retention, and expired refetch passed');

// Exercise the actual browser request path: all four YouVersion translations
// must be searched even when the reader currently displays a bundled Bible.
const searchContext = vm.createContext({
  window: {BigScreenBibleSupabase: {anonKey: 'test'}},
  state: {versions: ['BSB']},
  remoteSearchErrors: new Map(),
  uniqueList: values => [...new Set(values)],
  referenceMatchesSearchScope: () => true,
  scoreSearchText: text => text.includes('alive and active') ? {score: 100, matchType: 'Phrase'} : null,
  supabaseFunctionUrl: (name, params) => ({name, params}),
  fetch: async ({name, params}) => {
    assert.equal(name, 'youversion-passage');
    assert.ok(['NIV', 'NIRV', 'NASB2020', 'AMP'].includes(params.version));
    assert.equal(params.query, 'alive and active');
    return {ok: true, json: async () => ({results: [{ref: 'Hebrews 4:12', text: 'The word of God is alive and active.'}]})};
  },
});
vm.runInContext(source.slice(start, end), searchContext);
vm.runInContext("translationCodes.splice(0, translationCodes.length, 'BSB', 'NIV', 'NIRV', 'NASB2020', 'AMP')", searchContext);
vm.runInContext(['searchRemoteVersions', 'searchRemoteVersion'].map(name => 'async ' + extractProviderFunction(name)).join('\n'), searchContext);
const searchResults = await vm.runInContext("searchRemoteVersions('alive and active', {exactRequested: false})", searchContext);
assert.deepEqual(Array.from(searchResults, result => result.version).sort(), ['AMP', 'NASB2020', 'NIRV', 'NIV']);
assert.ok(searchResults.every(result => result.ref === 'Hebrews 4:12'));
console.log('All-version remote search and YouVersion request routing passed');
