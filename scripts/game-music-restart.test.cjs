const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/bible-app.js', 'utf8');
const fn = source.slice(source.indexOf('function syncGameMusicPlayback()'), source.indexOf('function gameOutcomeSoundKey('));
for (const buffered of [false, true]) {
  const firstGame = {type:'word-search'};
  const calls = [];
  const audio = {paused:true, pause(){this.paused=true}, load(){calls.push('load')}, play(){this.paused=false;calls.push('play');return Promise.resolve()}, set currentTime(value){throw Error('Metadata unavailable')} };
  const ctx = { state:{gameMusicEnabled:true,mode:'trivia',triviaGame:firstGame,gameVolume:100}, document:{hidden:false}, window:{}, gameMusicTrackKey:'word-search', gameMusicRestartPending:false,gameMusicPlaybackGame:firstGame,gameMusicGain:buffered ? {} : null,gameMusicLoopFallbackKey:buffered ? 'word-search' : '',gameMusicAudioContext:{createBufferSource(){}},gameMusicLoop:{key:'word-search',source:{}},gameMusicTrackForGame:()=>({key:'word-search',src:'track.mp3',volume:1}),primeGameMusicAudio:()=>audio,cancelGameMusicFade(){},setGameMusicOutputVolume(){},soundVolumeScalar:()=>1,pauseGameMusic(){},startGameMusicLoop(track,restart){calls.push(restart?'restart':'resume')} };
  vm.createContext(ctx);vm.runInContext(fn,ctx);
  ctx.state.triviaGame={type:'word-search'};
  ctx.syncGameMusicPlayback();
  assert.deepEqual(calls,buffered?['restart']:['load','play'],'A new round of the same game must start the soundtrack over, including when seeking fails');
  calls.length=0;
  ctx.syncGameMusicPlayback();
  assert.deepEqual(calls,[],'Countdown completion and ordinary renders must keep music continuous');
}
console.log('Same-game restart and continuous playback checks passed');
