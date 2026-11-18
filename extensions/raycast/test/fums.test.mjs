import test from 'node:test';
import assert from 'node:assert/strict';
import {reportScriptureView} from '../src/fums.mjs';
import {requestOnline,onlinePassage} from '../src/search.mjs';
test('native reporting uses only token and anonymous device/session identifiers',async()=>{
 await reportScriptureView('token&x','random-device','random-session',async(url)=>{
  assert.equal(url.origin,'https://fums.api.bible');assert.equal(url.searchParams.get('t'),'token&x');
  assert.equal(url.searchParams.get('dId'),'random-device');assert.equal(url.searchParams.get('sId'),'random-session');assert.equal(url.searchParams.has('uId'),false);
  return {ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};
 });
 await assert.rejects(()=>reportScriptureView('', 'd','s'),/usage token/);
 await assert.rejects(()=>reportScriptureView('t','d','s',async()=>({ok:false})),/reporting is unavailable/);
});
test('NKJV, NLT, and CEV use the existing API.Bible endpoint',async()=>{
 for(const version of ['NKJV','NLT','CEV']) await requestOnline({url:'https://example.com',key:'public'},version,{action:'search',query:'love'},async(url)=>{
  assert.equal(url.pathname,'/functions/v1/api-bible-passage');assert.equal(url.searchParams.get('version'),version);
  return {ok:true,json:async()=>({results:[]})};
 });
});
test('CEV combined verse text survives a partial selection without duplication',()=>{
 const p=onlinePassage({verses:[{n:16,verseEnd:17,text:'Combined text.'}],copyright:'Publisher'},'John 3:16-17','CEV');
 assert.equal(p.verses.length,1);assert.equal((p.text.match(/Combined text/g)||[]).length,1);assert.ok(p.text.includes('16-17'));
 const last=onlinePassage({verses:[{n:16,verseEnd:17,text:'Combined text.'}],copyright:'Publisher'},'John 3:17','CEV');
 assert.equal(last.verses.length,1);
});
