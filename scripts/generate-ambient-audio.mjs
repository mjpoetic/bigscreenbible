import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Original synthesized recordings. No sampled instruments or third-party music.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "assets/audio/ambient");
mkdirSync(out, { recursive: true });
const rate = 32000;
function music(name, hymn = false) {
  const beat = hymn ? 60 / 66 : 1;
  const beats = 96;
  const length = Math.round(beats * beat * rate);
  const channels = [new Float32Array(length), new Float32Array(length)];
  function note(at, midi, duration, amplitude, pan = 0, pad = false) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const start = Math.round(at * beat * rate);
    const seconds = duration * beat;
    for (let i = 0; i < seconds * rate; i++) {
      const t = i / rate;
      const env = pad ? Math.sin(Math.PI * Math.min(1, t / seconds)) ** 2
        : Math.min(1, t / 0.012) * Math.exp(-t * 1.7) * Math.min(1, (seconds - t) / 0.4);
      const phase = 2 * Math.PI * frequency * t;
      const value = (Math.sin(phase) + Math.sin(phase * 2) * (pad ? 0.08 : 0.28) * Math.exp(-t * 3)
        + Math.sin(phase * 3) * 0.09 * Math.exp(-t * 5)) * env * amplitude;
      const index = (start + i) % length;
      channels[0][index] += value * Math.sqrt((1 - pan) / 2);
      channels[1][index] += value * Math.sqrt((1 + pan) / 2);
    }
  }
  const chords = hymn ? [[48, 52, 55], [48, 53, 57], [48, 52, 55], [43, 50, 55]]
    : [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 57]];
  const bar = hymn ? 3 : 4;
  for (let b = 0; b < beats; b += bar) {
    const chord = chords[Math.floor(b / (bar * 2)) % chords.length];
    chord.forEach((n, i) => {
      note(b + i * 0.04, n, bar + 1, 0.055, (i - 1) * 0.2);
      note(b, n + 12, bar, 0.023, (i - 1) * 0.25, true);
    });
    if (!hymn) chord.forEach((n, i) => note(b + i * 0.85, n + 12, 3, 0.09, i % 2 ? 0.2 : -0.2));
    if (hymn) {
      // Soft brushed pulse in 3/4, beneath the hymn melody.
      for (let i = 0; i < rate * 0.18; i++) {
        const t = i / rate;
        const kick = Math.sin(2 * Math.PI * (48 * t + 0.9 * (1 - Math.exp(-t * 30)))) * Math.exp(-t * 24) * 0.07;
        channels[0][(Math.round(b * beat * rate) + i) % length] += kick;
        channels[1][(Math.round(b * beat * rate) + i) % length] += kick;
      }
    }
  }
  if (hymn) {
    // Traditional NEW BRITAIN melody, public domain. Each phrase totals 12 beats.
    const phrases = [
      [[67,1],[72,2],[76,0.5],[72,0.5],[76,2],[74,1],[72,2],[69,1],[67,2]],
      [[67,1],[72,2],[76,0.5],[72,0.5],[76,2],[74,1],[79,5]],
      [[76,1],[79,2],[76,0.5],[79,0.5],[76,2],[72,1],[67,2],[69,1],[72,2]],
      [[72,1],[69,2],[67,0.5],[69,0.5],[72,2],[72,1],[72,5]],
    ];
    let at = 0;
    for (let verse = 0; verse < 2; verse++) for (const phrase of phrases) for (const [n, d] of phrase) {
      note(at, n, d + 1.2, 0.13, 0.08);
      at += d;
    }
  }
  // Circular reverb and note tails preserve the musical clock at the loop join.
  for (const [delay, level] of [[0.19, 0.19], [0.37, 0.13], [0.71, 0.08]]) {
    const dry = channels.map(c => c.slice());
    const offset = Math.round(delay * rate);
    for (let c = 0; c < 2; c++) for (let i = 0; i < length; i++) channels[c][i] += dry[1 - c][(i - offset + length) % length] * level;
  }
  const pcm = Buffer.alloc(length * 4);
  for (let i = 0; i < length; i++) for (let c = 0; c < 2; c++) pcm.writeInt16LE(Math.round(Math.tanh(channels[c][i]) * 28000), i * 4 + c * 2);
  const temporary = path.join(out, `${name}.pcm`);
  writeFileSync(temporary, pcm);
  const result = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", String(rate), "-ac", "2", "-i", temporary, "-c:a", "libmp3lame", "-b:a", "128k", path.join(out, `${name}.mp3`)], { encoding: "utf8" });
  unlinkSync(temporary);
  if (result.status !== 0) throw new Error(result.stderr);
  console.log(`${name}: ${length / rate}s`);
}
music("peaceful-piano");
music("grace-lofi", true);

// Optional local inputs retrieved from the exact CC0 URLs in SOURCES.md.
// node scripts/generate-ambient-audio.mjs --rain /path/1.mp3 --ocean /path/ocean.mp3
for (const [key, seconds] of [["rain", 27], ["ocean", 60]]) {
  const argument = process.argv.indexOf(`--${key}`);
  if (argument < 0) continue;
  const decoded = spawnSync("ffmpeg", ["-v", "error", "-i", process.argv[argument + 1], "-t", String(seconds), "-ar", String(rate), "-ac", "2", "-f", "f32le", "pipe:1"], { maxBuffer: 40 * 1024 * 1024 });
  if (decoded.status !== 0) throw new Error(decoded.stderr.toString());
  const samples = new Float32Array(decoded.stdout.buffer, decoded.stdout.byteOffset, decoded.stdout.length / 4);
  const frames = samples.length / 2;
  const overlap = rate * 4;
  const length = frames - overlap;
  if (length < rate * 10) throw new Error("Recording is too short");
  for (let i = 0; i < overlap; i++) {
    const incoming = (1 - Math.cos(Math.PI * i / (overlap - 1))) / 2;
    for (let c = 0; c < 2; c++) samples[i * 2 + c] = samples[(length + i) * 2 + c] * (1 - incoming) + samples[i * 2 + c] * incoming;
  }
  let energy = 0, peak = 0;
  for (let i = 0; i < length * 2; i++) { energy += samples[i] ** 2; peak = Math.max(peak, Math.abs(samples[i])); }
  const level = Math.min(0.13 / Math.sqrt(energy / (length * 2)), 0.75 / peak);
  const pcm = Buffer.alloc(length * 4);
  for (let i = 0; i < length * 2; i++) pcm.writeInt16LE(Math.round(samples[i] * level * 32767), i * 2);
  const temporary = path.join(out, `${key}.pcm`);
  writeFileSync(temporary, pcm);
  const encoded = spawnSync("ffmpeg", ["-y", "-v", "error", "-f", "s16le", "-ar", String(rate), "-ac", "2", "-i", temporary, "-c:a", "libmp3lame", "-b:a", "128k", path.join(out, `${key}.mp3`)]);
  unlinkSync(temporary);
  if (encoded.status !== 0) throw new Error(encoded.stderr.toString());
  console.log(`${key}: ${length / rate}s`);
}
