import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const extract = (name) => source.match(new RegExp(`(?:async )?function ${name}\\([^]*?\\n\\}`))[0];
const manifest = source.match(/const gameMusicTracks = Object.freeze\(\{[^]*?\n\}\);/)[0];
const tracks = vm.runInNewContext(`${manifest}; gameMusicTracks`);
assert.equal(Object.keys(tracks).length, 9, "All eight games and timed Reference Rush have musical loop boundaries");
for (const track of Object.values(tracks)) {
  assert.ok(Number.isFinite(track.loopSeconds) && track.loopSeconds > 20, `${track.key} has a valid musical boundary`);
}
const starts = [], stops = [];
let resolveFetch;
let fallbackPlays = 0;
const samples = [new Float32Array(1100).fill(0.3), new Float32Array(1100).fill(-0.2)];
samples[0][0] = 0.8;
samples[0][999] = -0.6;
const buffer = { length: 1100, sampleRate: 1000, numberOfChannels: 2, getChannelData: (c) => samples[c] };
const audioContext = {
  currentTime: 0,
  decodeAudioData: async () => buffer,
  createGain: () => ({ gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
  createBufferSource: () => ({ connect() {}, disconnect() {}, start(time, offset) { starts.push({ time, offset, end: this.loopEnd, loop: this.loop }); }, stop(time) { stops.push(time); } }),
};
const context = vm.createContext({
  fetch: () => new Promise((resolve) => { resolveFetch = resolve; }),
  audioContext, buffer,
});
vm.runInContext(`
 let gameMusicLoop = null, gameMusicLoopRequest = 0, gameMusicLoopLoad = null;
 let gameMusicAudioContext = audioContext, gameMusicGain = {};
 let gameMusicAudio = { play() { fallback(); return Promise.resolve(); } };
 const track = { key: "test", src: "test.mp3", loopSeconds: 1 };
 ${["prepareGameMusicLoopBuffer", "stopGameMusicLoop", "startGameMusicLoop"].map(extract).join("\n")}
`, context);
context.fallback = () => { fallbackPlays++; };
const run = (code) => vm.runInContext(code, context);
const first = run("startGameMusicLoop(track, true)");
resolveFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
await first;
assert.deepEqual(starts[0], { time: 0, offset: 0, end: 1, loop: true }, "Audio clock loops only the musical samples, excluding padding");
assert.equal(samples[0][0], samples[0][999], "Boundary smoothing removes the sample discontinuity");
assert.equal(samples[0][500], Math.fround(0.3), "Smoothing preserves the body of the music");
audioContext.currentTime = 2.35;
run("stopGameMusicLoop({ fade: true })");
assert.equal(stops[0], 2.59, "Audio clock schedules the pause fade independently of animation frames");
await run("startGameMusicLoop(track, false)");
assert.ok(Math.abs(starts[1].offset - 0.35) < 1e-9, "Resume preserves musical position across multiple loops");
run("stopGameMusicLoop({ reset: true })");
await run("startGameMusicLoop(track, true)");
assert.equal(starts[2].offset, 0, "A new round starts from the beginning");
run("stopGameMusicLoop({ reset: true }); gameMusicLoopLoad = null");
const cancelled = run("startGameMusicLoop(track, true)");
run("stopGameMusicLoop({ reset: true })");
resolveFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
await cancelled;
assert.equal(starts.length, 3, "Late decoding cannot restart music after a stop or result cue");
run("gameMusicLoopLoad = null");
const failed = run("startGameMusicLoop(track, true)");
resolveFetch({ ok: false });
await failed;
assert.equal(fallbackPlays, 1, "A failed load retains native audio fallback");
console.log("Sample-timed game music loop tests passed");
