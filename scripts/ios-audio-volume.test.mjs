import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
function extract(name) {
  const match = source.match(new RegExp(`function ${name}\\([^]*?\\n\\}`));
  assert.ok(match, `Missing ${name}`);
  return match[0];
}

let connections = 0;
let resumes = 0;
let frame;
class AudioContext {
  state = "interrupted";
  destination = {};
  createGain() { return { gain: { value: 1 }, connect() {} }; }
  createMediaElementSource() {
    connections += 1;
    return { connect() {} };
  }
  resume() { resumes += 1; this.state = "running"; return Promise.resolve(); }
}
// Reproduce iOS: assigning media volume has no effect.
const audio = {
  get volume() { return 1; },
  set volume(value) {},
  paused: false,
  pause() { this.paused = true; },
};
const context = vm.createContext({
  window: { AudioContext }, audio, document: { hidden: false },
  performance: { now: () => 0 },
  requestAnimationFrame: (callback) => { frame = callback; return 1; },
  cancelAnimationFrame() {},
});
vm.runInContext(`
  let gameMusicAudio = audio;
  let gameMusicAudioContext = null;
  let gameMusicGain = null;
  let gameMusicFadeFrame = 0;
  let gameMusicTrackKey = "track";
  const state = { gameVolume: 100, modeTransitionSounds: true };
  const gameOutcomeSounds = { complete: { volume: 0.8 } };
  const gameMusicTrackForGame = () => ({ volume: 0.6 });
  const ensureGameMusicAudio = () => audio;
  const soundVolumeScalar = (value) => value / 100;
  let modeTransitionAudioContext = null;
  let modeTransitionAudioResumePromise = null;
  ${["primeGameMusicAudio", "setGameMusicOutputVolume", "syncActiveGameAudioVolume", "pauseGameMusic", "cancelGameMusicFade", "primeModeTransitionAudio"].map(extract).join("\n")}
`, context);
const run = (code) => vm.runInContext(code, context);
run("primeGameMusicAudio(); syncActiveGameAudioVolume()");
assert.equal(resumes, 1, "Interrupted music context resumes");
assert.equal(run("gameMusicGain.gain.value"), 0.6);
run("state.gameVolume = 25; syncActiveGameAudioVolume()");
assert.equal(run("gameMusicGain.gain.value"), 0.15, "Slider changes gain even when native volume ignores writes");
assert.equal(audio.volume, 1);
run("state.gameVolume = 0; syncActiveGameAudioVolume()");
assert.equal(run("gameMusicGain.gain.value"), 0, "Zero fully mutes music");
run('gameMusicTrackKey = "outcome:complete"; state.gameVolume = 50; primeGameMusicAudio(); syncActiveGameAudioVolume()');
assert.equal(run("gameMusicGain.gain.value"), 0.4, "Outcome cues use the same volume control");
assert.equal(connections, 1, "Reusing the element must not create a second media source");
run("pauseGameMusic()");
frame(120);
assert.equal(run("gameMusicGain.gain.value"), 0.2, "Fade uses Web Audio gain");
frame(240);
assert.equal(run("gameMusicGain.gain.value"), 0);
assert.equal(audio.paused, true);
await run("primeModeTransitionAudio()");
assert.equal(resumes, 2, "Interrupted transition context resumes");
assert.equal(run("modeTransitionAudioContext.state"), "running");
// A browser without Web Audio retains native volume and explicit mute.
run("gameMusicGain = null; window.AudioContext = undefined; setGameMusicOutputVolume(0)");
assert.equal(audio.muted, true);
run("setGameMusicOutputVolume(0.5)");
assert.equal(audio.muted, false);
console.log("iOS audio volume regression tests passed");
