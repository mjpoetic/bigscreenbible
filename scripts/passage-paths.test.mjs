import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
let redirected;
const context = { URL, window: { location: { href: 'https://bigscreenbible.com/Pro3:5-6', replace: value => {redirected=value;} } }, document: { getElementById: () => ({textContent:''}) } };
vm.createContext(context);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
assert.equal(new URL(redirected).searchParams.get('ref'),'Pro 3:5-6');
for (const [path, reference, version] of [
  ['Pro3:5-6','Pro 3:5-6',null],
  ['Proverbs3:5-6','Proverbs 3:5-6',null],
  ['Proverbs 3:5-6','Proverbs 3:5-6',null],
  ['Proverbs 3 verses 5-6','Proverbs 3:5-6',null],
  ['Proverbs 3 verse 5','Proverbs 3:5',null],
  ['Proverbs 3 verses 5 to 6','Proverbs 3:5-6',null],
  ['Proverbs3:5–6/KJV','Proverbs 3:5-6','KJV'],
  ['Proverbs3:5-6 (NIV)','Proverbs 3:5-6','NIV'],
  ['Pro3:5-6 NASB2020','Pro 3:5-6','NASB2020'],
  ['1John3:16','1John 3:16',null],
  ['1 Cor13:4-7/BSB','1 Cor 13:4-7','BSB'],
  ['Song of Songs2:1','Song of Songs 2:1',null],
  ['Psalm23','Psalm 23',null],
  ['John3:16,18','John 3:16,18',null],
]) {
  const result = new URL(context.passagePathDestination(`https://bigscreenbible.com/${path}`));
  assert.equal(result.origin,'https://bigscreenbible.com');
  assert.equal(result.pathname,'/');
  assert.equal(result.searchParams.get('ref'),reference,path);
  assert.equal(result.searchParams.get('version'),version,path);
}
for (const path of ['assets/missing.js','privacy/missing','%E0%A4%A','//evil.example/test','John0:1','<script>3:5']) {
  assert.equal(context.passagePathDestination(`https://bigscreenbible.com/${path}`),null,path);
}
const explicit = new URL(context.passagePathDestination('https://bigscreenbible.com/Pro3:5-6/KJV?version=BSB&verses=10'));
assert.equal(explicit.searchParams.get('version'),'BSB');
assert.equal(explicit.searchParams.has('verses'),false);
console.log('Readable passage path tests passed');
