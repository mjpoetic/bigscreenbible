import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const fn = source.match(/function primeGameAudioPlayback\([^]*?\n\}/)[0];
let gesture = true, starts = 0, resumes = 0;
const audio = {
  state: 'suspended', sampleRate: 48000, destination: {},
  createBuffer(channels, length) { assert.equal(channels, 1); assert.equal(length, 1); return {}; },
  createBufferSource() { return { connect() {}, disconnect() {}, start() { assert.equal(gesture, true, 'Mobile buffer playback must unlock before the Start gesture ends'); starts++; } }; },
  resume() { resumes++; this.state = 'running'; return Promise.resolve(); },
};
const context = vm.createContext({ audio, ensureGameAudioContext: () => audio });
vm.runInContext(`let gameAudioUnlockedContext = null; ${fn}`, context);
vm.runInContext('primeGameAudioPlayback()', context);
assert.equal(starts, 1);
assert.equal(resumes, 1);
gesture = false;
vm.runInContext('primeGameAudioPlayback()', context);
assert.equal(starts, 1, 'Later countdown renders must not create additional unlock sources');
audio.state = 'interrupted';
vm.runInContext('primeGameAudioPlayback()', context);
assert.equal(resumes, 2, 'An interrupted context resumes without restarting music');
console.log('Game audio gesture unlock checks passed');
