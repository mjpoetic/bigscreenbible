import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
function extract(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const next = source.indexOf('\nfunction ', start + 1);
  const asyncNext = source.indexOf('\nasync function ', start + 1);
  const end = Math.min(...[next, asyncNext].filter(n => n >= 0));
  return source.slice(start, end);
}
const ctx = {
  state: { mode: 'reader', reference: 'Luke 4' }, window: {},
  bibleData: { 'Luke 4': { verses: [{ n: 33, BSB: 'Other version.', footnotes: { BSB: [{text:'Preserved.'}] } }] } },
  normalizeRemoteProviderText: (_, text) => text,
  isRemoteTranslation: v => !['BSB','WEB'].includes(v),
  translationDisplayCode: v => v,
  translationLookup: { NLT: { name: 'New Living Translation' } },
  icons: { footnote: '<svg></svg>' },
  escapeHtml: value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),
  apiBibleAttributionMarkup: (versions, cls, chapter) => `<aside>${versions[0]} ${chapter}</aside>`,
};
vm.createContext(ctx);
vm.runInContext(['versionVerseLabel', 'publisherFootnotesForVerse', 'publisherFootnoteButtonMarkup', 'publisherFootnotePopupMarkup', 'mergeRemoteVersionChapter'].map(extract).join('\n'), ctx);
const remote = [{n:33,text:'Scripture.',footnotes:[{id:'n1',reference:'4:33',text:'Greek unclean; also in 4:36.'}]}];
ctx.mergeRemoteVersionChapter('NLT','Luke 4',remote);
const verse = ctx.bibleData['Luke 4'].verses[0];
assert.equal(verse.NLT,'Scripture.');
assert.equal(verse.footnotes.NLT[0].text,remote[0].footnotes[0].text);
assert.match(ctx.publisherFootnoteButtonMarkup(verse,'NLT'),/Footnote for Luke 4:33 \(NLT\)/);
assert.match(ctx.publisherFootnoteButtonMarkup(verse,'NLT','Luke 5'),/data-footnote-chapter="Luke 5"/);
assert.match(ctx.publisherFootnoteButtonMarkup(verse,'BSB'), /Footnote for Luke 4:33 \(BSB\)/);
assert.equal(ctx.publisherFootnoteButtonMarkup({n:1},'NLT'),'');
ctx.state.mode='big'; assert.equal(ctx.publisherFootnoteButtonMarkup(verse,'NLT'),'');
ctx.state.mode='reader'; ctx.window.bsbOffline={active:true}; assert.equal(ctx.publisherFootnoteButtonMarkup(verse,'NLT'),'');
assert.match(ctx.publisherFootnoteButtonMarkup(verse,'BSB'), /data-publisher-footnote/);
ctx.window.bsbOffline=null;
verse.footnotes.NLT[0].text='<img src=x onerror=alert(1)>';
const popup = ctx.publisherFootnotePopupMarkup(verse,'NLT','Luke 4');
assert.match(popup,/&lt;img/); assert.doesNotMatch(popup,/<img/); assert.doesNotMatch(popup,/Publisher footnotes|publisher-footnote-source/);
ctx.mergeRemoteVersionChapter('NLT','Luke 4',[{n:33,text:'Refreshed.'}]);
assert.equal(verse.footnotes.NLT,undefined);
assert.equal(verse.footnotes.BSB[0].text,'Preserved.');
ctx.mergeRemoteVersionChapter('NLT','Luke 4',[{n:33,verseEnd:34,text:'Combined.',footnotes:remote[0].footnotes}]);
assert.equal(ctx.bibleData['Luke 4'].verses[0].footnotes.NLT.length,1);
assert.equal(ctx.publisherFootnotesForVerse(ctx.bibleData['Luke 4'].verses[1],'NLT').length,0);
for (const version of ['ESV', 'NIV', 'NASB2020', 'AMP']) {
  ctx.mergeRemoteVersionChapter(version, 'Luke 4', remote);
  assert.equal(verse[version], 'Scripture.');
  assert.equal(verse.footnotes[version][0].text, remote[0].footnotes[0].text);
  assert.match(ctx.publisherFootnoteButtonMarkup(verse, version), new RegExp(`data-footnote-version="${version}"`));
  ctx.mergeRemoteVersionChapter(version, 'Luke 4', [{ n:33, text:'Refreshed.' }]);
  assert.equal(verse.footnotes[version], undefined);
  assert.equal(verse.footnotes.BSB[0].text, 'Preserved.');
}
vm.runInContext(extract('applyFootnoteMetadata'), ctx);
ctx.window.BIGSCREEN_BIBLE_FOOTNOTES = { versions: { BSB: { 'Luke 4': { 33: [{ text:'Bundled.' }] } }, WEB: { 'Luke 4': { 33: [{text:'WEB note.'}] } } } };
ctx.applyFootnoteMetadata(ctx.bibleData);
assert.equal(verse.footnotes.BSB[0].text, 'Bundled.');
assert.equal(verse.footnotes.WEB, undefined); // Do not attach to an unloaded Bible.
verse.WEB = 'WEB Scripture.';
ctx.applyFootnoteMetadata(ctx.bibleData);
assert.equal(verse.footnotes.WEB[0].text, 'WEB note.');
console.log('Publisher footnote data and markup tests passed');
