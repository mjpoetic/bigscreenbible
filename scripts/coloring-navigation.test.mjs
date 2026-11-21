import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/bible-app.js',import.meta.url),'utf8');
const start=source.indexOf('const gamesAreaCodes='),end=source.indexOf('\nfunction triviaView()',start);
const block=source.slice(start,end),local=new Map(),session=new Map();
const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
function context(){const ctx=vm.createContext({localStorage:storage(local),sessionStorage:storage(session),URLSearchParams,window:{location:{search:''}},state:{mode:'reader',triviaGame:null,triviaGameType:'trivia'},icons:{artistPalette:'palette'},activeGameChallenge:()=>null});
vm.runInContext(`function switchGameDifficulty(area){state.triviaGameType=area;}function switchMode(mode){state.mode=mode;}function syncModeUrl(){}function render(){}function gotoReference(ref){state.reference=ref;state.mode='reader';}\n${block}`,ctx);return ctx;}
const ctx=context();
ctx.rememberGamesArea('crossword');assert.equal(local.get('lw_trivia_game_type'),'crossword');ctx.restoreLastGamesArea();assert.equal(ctx.state.triviaGameType,'crossword');
ctx.rememberGamesArea('coloring');ctx.restoreLastGamesArea();assert.equal(vm.runInContext('coloringBookSelected',ctx),true);assert.equal(vm.runInContext('coloringBookOpen',ctx),false,'Games restores the preview, not the coloring canvas');
ctx.openColoringBible('Mark 10:13-16');assert.equal(ctx.state.mode,'reader');assert.equal(session.get('lw_coloring_reader_return'),'true');assert.match(ctx.coloringReaderReturnButton(),/Back to coloring book/);
const reloaded=context();assert.equal(vm.runInContext('coloringReaderReturn',reloaded),true);assert.equal(vm.runInContext('coloringBookSelected',reloaded),true);assert.equal(vm.runInContext('coloringBookOpen',reloaded),false);
ctx.returnToColoringBook();assert.equal(ctx.state.mode,'trivia');assert.equal(vm.runInContext('coloringBookOpen',ctx),true,'Explicit Bible return reopens the canvas');assert.equal(session.has('lw_coloring_reader_return'),false);
ctx.rememberGamesArea('word-search');ctx.restoreLastGamesArea();assert.equal(vm.runInContext('coloringBookOpen',ctx),false);assert.equal(ctx.state.triviaGameType,'word-search');
ctx.rememberGamesArea('invalid');assert.equal(local.get('lw_games_last_area'),'word-search');
ctx.rememberGamesArea('coloring');ctx.window.location.search='?game=crossword';ctx.restoreLastGamesArea(true);assert.equal(ctx.state.triviaGameType,'crossword');assert.equal(vm.runInContext('coloringBookOpen',ctx),false);
ctx.state.triviaGame={type:'trivia'};ctx.restoreLastGamesArea();assert.equal(vm.runInContext('coloringBookOpen',ctx),false,'Active rounds take precedence over the saved activity');
assert.match(ctx.coloringSetupView(),/class="game-preview"/);assert.match(ctx.coloringSetupView(),/preview.webp/);assert.match(ctx.coloringSetupView(),/Open Coloring Book/);assert.doesNotMatch(ctx.coloringSetupView(),/coloring-menu-preview/);
assert.match(source,/if\(wasColoringSelected\)renderPreservingReaderScroll\(\)/);
console.log('Coloring Scripture return, refresh recovery, last game selection, active-round priority, and preview passed');

ctx.openColoringBible();assert.equal(session.has("lw_coloring_reader_return"),false,"Generic Bible navigation does not offer coloring return");
assert.doesNotMatch(source,/previousMode==="trivia"&&coloringBookOpen&&/);
