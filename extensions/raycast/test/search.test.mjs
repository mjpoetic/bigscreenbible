import test from 'node:test';
import assert from 'node:assert/strict';
import {searchLocal, searchTerms, requestOnline, onlinePassage, isReference} from '../src/search.mjs';
import {passageUrl} from '../src/passage.mjs';
const bible = {code:'BSB', name:'BSB', source:'https://ebible.org/engbsb/', chapters:{'John 3':[{n:16,text:'For God so loved the world'},{n:17,text:'God loves the whole world'}]}};
test('word search matches all terms; quoted search matches a phrase; results are limited', () => {
 assert.equal(searchLocal(bible,'God world').total,2);
 assert.equal(searchLocal(bible,'"so loved"').results.length,1);
 assert.equal(searchLocal(bible,'"loved so"').results.length,0);
 assert.equal(searchLocal(bible,'world',1).results.length,1);
 assert.throws(()=>searchTerms('""'));
 assert.equal(isReference('1 Corinthians 13:4'),true);
 assert.equal(isReference('love one another'),false);
});
test('online requests use correct endpoints, encode query, and report service errors',async()=>{
 const config={url:'https://example.com',key:'public-key'};
 await requestOnline(config,'NIV',{action:'search',query:'love & peace'},async(url,opts)=>{
  assert.equal(url.pathname,'/functions/v1/youversion-passage');
  assert.equal(url.searchParams.get('query'),'love & peace');
  assert.equal(opts.headers.apikey,'public-key');
  return {ok:true,json:async()=>({results:[]})};
 });
 await assert.rejects(()=>requestOnline(config,'ESV',{ref:'John 3'},async()=>({ok:false,status:429,json:async()=>({error:'Rate limit'})})),/Rate limit/);
});
test('online ranges retain exact text and copyright; missing verses fail',()=>{
 const payload={bibleName:'NIV',copyright:'Copyright publisher',verses:bible.chapters['John 3']};
 const p=onlinePassage(payload,'John 3:16','NIV');
 assert.equal(p.verses.length,1);assert.ok(p.text.endsWith('Copyright publisher'));
 assert.throws(()=>onlinePassage(payload,'John 3:16-18','NIV'));
});
test('mode and game URLs preserve reference and translation',()=>{
 for(const mode of ['reader','big','parallel','memorize','trivia']) {
  const url=new URL(passageUrl('John 3:16-18','KJV',mode,mode==='trivia'?'crossword':''));
  assert.equal(url.searchParams.get('mode'),mode);assert.equal(url.searchParams.get('ref'),'John 3:16-18');
  assert.equal(url.searchParams.get('version'),'KJV');
 }
 assert.throws(()=>passageUrl('John 3','BSB','trivia','invalid'));
});
