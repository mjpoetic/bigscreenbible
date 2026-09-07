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
console.log('Provider cutover and independent rollback tests passed');
