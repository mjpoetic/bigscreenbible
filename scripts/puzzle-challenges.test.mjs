import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/bible-app.js',import.meta.url),'utf8');
function extract(name) {
 const start=source.indexOf(`function ${name}(`);
 assert.ok(start>=0,name);
 const body=source.indexOf(') {',start)+2;
 let depth=0;
 for(let i=body;i<source.length;i++) {
  if(source[i]==='{') depth++;
  if(source[i]==='}' && --depth===0) return source.slice(start,i+1);
 }
 throw Error(name);
}
const state={triviaGame:null};
const ctx=vm.createContext({state,Date,showToast(){},wordSearchCellKey:({row,column})=>`${row}:${column}`,activeGameChallenge:()=>state.gameChallenges[0],gameChallengePlayer:()=>state.player,renderPreservingReaderScroll(){},startTriviaGame(){throw Error('Must load the saved puzzle, not generate another');}});
for(const name of ['isPuzzleChallenge','isTimedGameChallenge','puzzleChallengeSnapshot','puzzleChallengeProgressState','triviaRoundLength','restoreChallengeGameProgress','startLoadedGameChallenge','challengeCurrentRoundAnswered','challengeGameProgress','gameChallengePlayerComparison']) vm.runInContext(extract(name),ctx);
for(const type of ['word-search','crossword','hidden-word']) {
 const game={type,version:'BSB',difficulty:'Medium',words:['FAITH'],cells:[['F']],entries:[{id:'1',word:'FAITH',cells:[{row:0,column:0}]}],rounds:[{word:'FAITH',complete:false,guessedLetters:[]}],wordSearchTarget:{elapsedMs:10},startedAt:1,score:0};
 const puzzle=ctx.puzzleChallengeSnapshot(game);
 assert.equal(puzzle.startedAt,undefined);
 assert.equal(puzzle.wordSearchTarget,undefined);
 const challenge={id:type,gameType:type,puzzle,status:'accepted',startedAt:'2026-10-24T12:00:00Z'};
 state.gameChallenges=[challenge]; state.player=null;
 ctx.startLoadedGameChallenge(challenge,{render:false});
 assert.equal(state.triviaGame.challengeId,type);
 assert.equal(state.triviaGame.startedAt,Date.parse(challenge.startedAt));
 state.triviaGame.score=1;
 state.triviaGame.foundWords=['FAITH'];
 state.triviaGame.answers={'0:0':'F'};
 state.triviaGame.points=-200;
 const saved=ctx.puzzleChallengeProgressState(state.triviaGame);
 state.player={puzzleState:saved};
 ctx.startLoadedGameChallenge(challenge,{render:false});
 assert.equal(state.triviaGame.score,1);
 assert.equal(state.triviaGame.answers['0:0'],'F');
 assert.equal(state.triviaGame.points,-200);
 assert.equal(puzzle.rounds[0].startedAt,undefined,'Loading a challenge must not mutate its saved puzzle');
 state.player={puzzleState:saved,completedAt:'2026-10-24T12:00:12Z'};
 ctx.startLoadedGameChallenge(challenge,{render:false});
 assert.equal(state.triviaGame.complete,true);
 assert.equal(state.triviaGame.finishedAt,Date.parse(state.player.completedAt));
}
for(const gameType of ['word-search','crossword','book-sprint']) {
 assert.ok(ctx.gameChallengePlayerComparison({gameType},{completedAt:'done',elapsedMs:9000},{completedAt:'done',elapsedMs:12000})<0);
 assert.ok(ctx.gameChallengePlayerComparison({gameType},{completedAt:'done',elapsedMs:12000},{completedAt:null,progress:9})<0);
 assert.equal(ctx.gameChallengePlayerComparison({gameType},{completedAt:'done',elapsedMs:12000},{completedAt:'done',elapsedMs:12000}),0);
}
assert.equal(ctx.challengeGameProgress({type:'word-search',words:['A','B'],foundWords:['A'],score:1}),1);
assert.equal(ctx.challengeGameProgress({type:'hidden-word',index:0,rounds:[{complete:true},{}]}),1);
assert.ok(ctx.gameChallengePlayerComparison({gameType:'hidden-word'},{puzzleState:{points:-100}},{puzzleState:{points:-500}})<0);
console.log('Puzzle challenge identity, resume, completion, progress and time-ranking tests passed');

// Standings disclosure updates in place so a live puzzle never gets rebuilt.
let click;
const attributes={};
let expanded=false;
const gameBefore=state.triviaGame;
const button={
 addEventListener(event, handler) { assert.equal(event,'click'); click=handler; },
 setAttribute(key,value) { attributes[key]=value; },
 closest() { return {classList:{toggle(name,value) { assert.equal(name,'is-open'); expanded=value; }}}; },
};
vm.runInContext(extract('bindGameStandingsToggle'),ctx);
ctx.bindGameStandingsToggle({querySelectorAll:()=>[button]});
state.gameStandingsOpen=false;
click();
assert.equal(expanded,true);
assert.equal(attributes['aria-expanded'],'true');
click();
assert.equal(expanded,false);
assert.equal(attributes['aria-expanded'],'false');
assert.equal(state.triviaGame,gameBefore);
const styles=readFileSync(new URL('../assets/bible-app.css',import.meta.url),'utf8');
assert.match(styles,/\.is-expanded-play \.live-challenge-scoreboard:not\(\.is-open\) \.live-challenge-details \{ display: none; \}/);
assert.match(styles,/\.is-expanded-play \.is-live-challenge \.word-search-sidebar \{[^}]*overflow-y: auto;/);
assert.match(extract('refreshLiveGameChallengeScoreboard'),/bindGameStandingsToggle\(replacement\)/);
console.log('Compact standings toggle, stable puzzle and mobile word-bank checks passed');
