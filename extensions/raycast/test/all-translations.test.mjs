import test from 'node:test';
import assert from 'node:assert/strict';
import {collectTranslations} from '../src/all-translations.mjs';
test('all translation search retains matching verses in each version, copyright, and partial failures',async()=>{
 const data=await collectTranslations(['BSB','NLT','NIV'],async(version)=>{
  if(version==='NIV') throw new Error('Offline');
  return {results:[{ref:'John 3:16',text:version+' text'}],copyright:version+' rights'};
 });
 assert.deepEqual(data.results.map(hit=>hit.version),['BSB','NLT']);
 assert.equal(data.results[1].copyright,'NLT rights');
 assert.deepEqual(data.failures,[{version:'NIV',message:'Offline'}]);
});
test('requests are bounded and result ordering remains stable',async()=>{
 let active=0,peak=0;
 const data=await collectTranslations(['A','B','C','D'],async(version)=>{
  peak=Math.max(peak,++active);
  await new Promise(resolve=>setTimeout(resolve,5));active--;
  return {results:[{ref:version,text:version}]};
 },2);
 assert.equal(peak,2);assert.deepEqual(data.results.map(hit=>hit.version),['A','B','C','D']);
});
