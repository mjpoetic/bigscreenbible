import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const manifest = app.match(/const gameMusicTracks = Object.freeze\(\{[^]*?\n\}\);/)[0];
const tracks = vm.runInNewContext(`${manifest}; gameMusicTracks`);
for (const track of Object.values(tracks)) {
  assert.match(track.src, /\.wav\?/, 'Repeating soundtracks use lossless PCM, with a fresh asset revision');
  const wav = readFileSync(new URL(`../${track.src.split('?')[0]}`, import.meta.url));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt16LE(20), 1, 'Loop assets contain uncompressed PCM');
  assert.equal(wav.readUInt16LE(22), 2);
  assert.equal(wav.readUInt16LE(34), 16);
  const rate = wav.readUInt32LE(24), frames = wav.readUInt32LE(40) / 4;
  assert.ok(Math.abs(frames - Math.round(track.loopSeconds * rate)) <= 1, `${track.key}: no encoder delay or trailing padding`);
  const sample = (frame, channel) => wav.readInt16LE(44 + frame * 4 + channel * 2) / 32768;
  for (let channel = 0; channel < 2; channel++) {
    let bodyPower = 0;
    for (let i = 0; i < frames; i++) bodyPower += sample(i, channel) ** 2;
    bodyPower /= frames;
    const window = Math.round(rate * 0.02);
    let seamPower = 0;
    for (let i = 0; i < window; i++) seamPower += sample(i, channel) ** 2 + sample(frames - 1 - i, channel) ** 2;
    seamPower /= window * 2;
    assert.ok(seamPower > bodyPower / 100, `${track.key}: the actual audio must not fade into silence at its repeat boundary`);
  }
}
console.log('All nine PCM loops have exact musical lengths and audible signal across their joins');
