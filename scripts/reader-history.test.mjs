import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const extract = name => source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`))[0];
const state = {mode:'reader',reference:'John 3',verse:1,selectedVerses:[],readerReturnStack:[],readerForwardStack:[]};
const context = vm.createContext({state,bibleData:{'John 3':{},'John 4':{},'John 5':{}},activePassageLabel:()=>state.reference, captureReaderScroll:()=>({scriptureTop:123}),render(){},updateShareUrl(){},stageSmoothReturnScroll(){},restoreReaderScroll(){},updateReaderTopButton(){},requestAnimationFrame:fn=>fn()});
vm.runInContext(`let pendingLibraryEnter=false; ${['currentReaderReturnTarget','captureReaderReturnTarget','pushReaderReturnTarget','pushCurrentReturnTargetForNavigation','restoreReaderReturnTarget','clearReaderReturnStack'].map(extract).join('\n')}`,context);
const run=code=>vm.runInContext(code,context);
for(const mode of ['reader','parallel']) {
 state.mode=mode; state.reference='John 3'; run('clearReaderReturnStack(); pushCurrentReturnTargetForNavigation("John 4", 1)'); state.reference='John 4';
 run('restoreReaderReturnTarget()'); assert.equal(state.reference,'John 3'); assert.equal(state.readerForwardStack.at(-1).reference,'John 4');
 run('restoreReaderReturnTarget(true)'); assert.equal(state.reference,'John 4'); assert.equal(state.mode,mode);
 run('restoreReaderReturnTarget(); pushCurrentReturnTargetForNavigation("John 5", 1)'); assert.equal(state.readerForwardStack.length,0);
 run('clearReaderReturnStack()'); assert.equal(state.readerReturnStack.length,0);
}
console.log('Reader/Parallel history: back, forward, branching and clearing passed.');
