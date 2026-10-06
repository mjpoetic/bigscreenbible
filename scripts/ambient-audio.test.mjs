import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
const script = readFileSync(new URL("../assets/ambient-audio.js", import.meta.url), "utf8");
const listeners = {}, starts = [], stops = [], gains = [], timers = new Map();
let now = 0, nextTimer = 0, resolveLoad, failLoad = false;
let pendingFetch = false;
const storage = new Map();
const status = { textContent: "" };
const document = {
  hidden: false,
  querySelectorAll: selector => selector === "[data-ambient-status]" ? [status] : [],
  addEventListener: (name, fn) => { listeners[name] = fn; },
  dispatchEvent() {},
};
const gain = () => {
  const calls = [];
  const result = { gain: { value: 1, cancelScheduledValues(t) { calls.push(["cancel", t]); }, setValueAtTime(v, t) { this.value = v; calls.push(["set", v, t]); }, linearRampToValueAtTime(v, t) { calls.push(["ramp", v, t]); }, setTargetAtTime(v) { this.value = v; } }, connect() {}, disconnect() {}, calls };
  gains.push(result);
  return result;
};
const audioContext = {
  state: "running", currentTime: 0, sampleRate: 1000, destination: {},
  addEventListener(name, fn) { this.onStateChange = fn; },
  async resume() { this.state = "running"; },
  createGain: gain,
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { length, sampleRate, numberOfChannels: channels, duration: length / sampleRate, getChannelData: i => data[i] };
  },
  async decodeAudioData() { return this.createBuffer(2, 100000, 1000); },
  createBufferSource() {
    return { connect() {}, disconnect() {}, start() { starts.push(this); }, stop(at) { stops.push(at); } };
  },
};
const sandbox = vm.createContext({
  window: { AudioContext: function () { return audioContext; }, addEventListener() {} }, document,
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (k, v) => storage.set(k, v) },
  CustomEvent: function (name) { this.type = name; },
  Date: { now: () => now },
  setInterval(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
  clearInterval: id => timers.delete(id),
  fetch: async () => {
    if (pendingFetch) await new Promise(resolve => { resolveLoad = resolve; });
    return { ok: !failLoad, arrayBuffer: async () => new ArrayBuffer(8) };
  },
});
vm.runInContext(script, sandbox);
const player = sandbox.window.bsbAmbient;
const change = (attribute, value, type = "change") => listeners[type]({ target: { value, matches: selector => selector === `[data-ambient-${attribute}]` } });
assert.equal(player.active(), false, "Preferences never autoplay");
assert.equal(starts.length, 0);
pendingFetch = true;
const cancelled = player.play();
await new Promise(resolve => setImmediate(resolve));
assert.equal(player.active(), true, "Pending playback can be cancelled");
player.pause();
resolveLoad();
await cancelled;
assert.equal(starts.length, 0, "A late download cannot restart paused audio");
pendingFetch = false;
await player.play();
assert.equal(starts[0].loop, true);
assert.equal(starts[0].loopEnd, 23, "Rain loop excludes MP3 padding");
change("volume", 65, "input");
assert.equal(gains[0].gain.value, 0.65, "Volume uses Web Audio gain, including iOS");
change("timer", 15);
const master = gains[0];
assert.ok(master.calls.some(call => call[0] === "ramp" && call[1] === 0 && call[2] === 900), "Sleep fade runs on the audio clock");
now = 895000;
audioContext.currentTime = 895;
change("volume", 80, "input");
const sets = master.calls.filter(call => call[0] === "set");
assert.equal(sets.at(-1)[1], 0.4, "Volume changes preserve a partially completed sleep fade");
change("sound", "piano");
await new Promise(resolve => setImmediate(resolve));
assert.equal(starts.at(-2).loopEnd, 96);
assert.equal(starts.at(-1).loopEnd, 23, "Music includes a separately adjustable rain layer");
assert.ok(status.textContent.includes("1 min left"), "Switching sounds preserves the current timer");
change("rain", 30, "input");
assert.equal(gains.at(-1).gain.value, 0.3);
now = 900001;
for (const tick of timers.values()) tick();
assert.equal(player.active(), false);
assert.equal(status.textContent, "Sleep timer finished");
assert.equal(timers.size, 0);
change("sound", "brown");
await player.play();
assert.equal(starts.at(-1).buffer.numberOfChannels, 1);
assert.ok(starts.at(-1).buffer.getChannelData(0).some(v => v !== 0));
document.hidden = true;
listeners.visibilitychange();
assert.equal(player.active(), false, "Leaving the app pauses audio without autoplay on return");
document.hidden = false;
change("sound", "ocean");
failLoad = true;
await player.play();
assert.equal(player.active(), false);
assert.match(status.textContent, /Unable to play/);
failLoad = false;
await player.play();
assert.equal(starts.at(-1).loopEnd, 56, "Failed loads can be retried");
audioContext.state = "interrupted";
audioContext.onStateChange();
assert.equal(player.active(), false, "Native audio interruption stops the player cleanly");
const settings = JSON.parse(storage.get("bsb_ambient_preferences_v1"));
assert.equal(settings.volume, 80);
assert.equal(settings.rain, 30);
assert.equal(settings.sound, "ocean");
assert.equal(settings.playing, undefined, "Playback is never persisted");
for (const sound of player.catalog.filter(s => s.src)) assert.ok(existsSync(new URL(`../${sound.src}`, import.meta.url)), `${sound.name} is bundled`);
const app = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
assert.match(app, /state\.gameMusicEnabled\s*&& !window\.bsbAmbient\?\.active\(\)/, "Game music yields to ambient audio");
assert.ok(stops.length >= 5);
console.log("Ambient audio cancellation, mixing, sleep fade, interruption, and persistence tests passed");
