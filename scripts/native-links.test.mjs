import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
const handler = source.match(/function handleNativeSharedLink\([^]*?\n\}/)[0];
for (const platform of ['ios', 'android', 'web']) {
  const pending = [], opened = [];
  const context = vm.createContext({URL, window: {
    Capacitor: {getPlatform: () => platform},
    setTimeout: callback => pending.push(callback),
    location: {assign: href => opened.push(href)},
  }});
  vm.runInContext(handler, context);
  for (const value of ['https://bigscreenbible.com/?ref=John+3%3A16&version=KJV&mode=parallel',
    'https://bigscreenbible.com/Proverbs3:5-6/KJV?mode=reader#verse',
    'https://bigscreenbible.com/?ref=John3:16&text=%27%22%5C']) {
    assert.equal(context.handleNativeSharedLink(value), platform !== 'web');
    assert.equal(opened.length, 0, 'Acknowledges before navigating');
    pending.splice(0).forEach(callback => callback());
    assert.deepEqual(opened.splice(0), platform === 'web' ? [] : [new URL(value).href]);
  }
  for (const value of ['https://evil.test', 'https://bigscreenbible.com.evil.test',
    'http://bigscreenbible.com', 'https://user@bigscreenbible.com',
    'https://bigscreenbible.com:444', 'javascript:alert(1)', '/relative', 'broken']) {
    context.handleNativeSharedLink(value);
    assert.equal(pending.length, 0, 'Rejects untrusted URL: ' + value);
  }
}
const apple = JSON.parse(readFileSync('.well-known/apple-app-site-association'));
assert.deepEqual(apple.applinks.details[0].appIDs, ['8QY8QS9TH2.com.bigscreenbible.app']);
const android = JSON.parse(readFileSync('.well-known/assetlinks.json'));
assert.equal(android[0].target.package_name, 'com.bigscreenbible.app');
for (const fingerprint of android[0].target.sha256_cert_fingerprints) {
  assert.match(fingerprint, /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/);
}
console.log('Native shared links: platform guards, URL validation, deferred navigation and associations passed.');
