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
  assert.equal(evaluate(`translationProvider('${version}').supportsSearch`), false);
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
