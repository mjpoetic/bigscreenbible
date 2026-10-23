import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../404.html', import.meta.url), 'utf8');
let redirected;
const context = { URL, window: { location: { href: 'https://bigscreenbible.com/Pro3:5-6', replace: value => {redirected=value;} } }, document: { documentElement: { classList: { add: value => { context.redirectClass = value; } } } } };
vm.createContext(context);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
assert.equal(context.redirectClass, 'passage-redirecting');
assert.ok(html.indexOf('window.location.replace') < html.indexOf('<body>'), 'Redirect before body content is parsed');
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

for (const [path, mode] of [['reader', 'reader'], ['parallel', 'parallel'], ['Parallel/', 'parallel'], ['games', 'trivia'], ['memorization', 'memorize'], ['games/', 'trivia'], ['Memorization/', 'memorize']]) {
  const result = new URL(context.areaPathDestination(`https://bigscreenbible.com/${path}?mode=reader&view=big&ref=John3:16&reference=Psalm23&verses=1&version=KJV#example`));
  assert.equal(result.origin, 'https://bigscreenbible.com');
  assert.equal(result.pathname, '/');
  assert.equal(result.searchParams.get('mode'), mode);
  assert.equal(result.searchParams.get('version'), 'KJV');
  assert.equal(result.hash, '#example');
  for (const key of ['view', 'ref', 'reference', 'verses']) assert.equal(result.searchParams.has(key), false);
  context.window.location.href = `https://bigscreenbible.com/${path}`;
  redirected = null;
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('const passageDestination =', 'var passageDestination ='), vm.createContext({ URL, window: context.window, document: context.document }));
  assert.equal(new URL(redirected).searchParams.get('mode'), mode);
}
for (const path of ['games/missing', 'memorization/missing', 'unknown', 'toString', '__proto__']) {
  assert.equal(context.areaPathDestination(`https://bigscreenbible.com/${path}`), null);
}
console.log('Direct area path tests passed');

for (const mode of ['reader', 'parallel']) {
  for (const path of [`Pro3:5-6/${mode}`, `${mode}/Pro3:5-6`, `Pro3:5-6/KJV/${mode}/`, `${mode}/Pro3:5-6/KJV`]) {
    const result = new URL(context.passagePathDestination(`https://bigscreenbible.com/${path}?mode=big&view=games`));
    assert.equal(result.searchParams.get('ref'), 'Pro 3:5-6');
    assert.equal(result.searchParams.get('mode'), mode);
    assert.equal(result.searchParams.has('view'), false);
    assert.equal(result.searchParams.get('version'), path.includes('KJV') ? 'KJV' : null);
  }
}
console.log('Reader and parallel passage paths passed');
