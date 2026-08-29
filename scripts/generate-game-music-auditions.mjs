import { spawnSync } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionMode = process.argv.includes("--production");
const outputDir = productionMode
  ? path.join(rootDir, "assets", "audio", "game-music")
  : path.join(rootDir, "prototypes", "game-music", "audio");
const sampleRate = 44_100;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

function midiFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function clamp(value, minimum = -1, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function waveform(type, phase, pulseWidth = 0.5) {
  const sine = Math.sin(phase);
  if (type === "triangle") return (2 / Math.PI) * Math.asin(sine);
  if (type === "square") return sine >= 0 ? 1 : -1;
  if (type === "pulse") return (phase % (Math.PI * 2)) / (Math.PI * 2) < pulseWidth ? 1 : -1;
  if (type === "saw") return 2 * ((phase / (Math.PI * 2)) - Math.floor(phase / (Math.PI * 2) + 0.5));
  return sine;
}

class LoopSynth {
  constructor({ bpm, beats, seed }) {
    this.bpm = bpm;
    this.beatSeconds = 60 / bpm;
    this.duration = beats * this.beatSeconds;
    this.length = Math.round(this.duration * sampleRate);
    this.left = new Float64Array(this.length);
    this.right = new Float64Array(this.length);
    this.random = seededRandom(seed);
  }

  beatTime(beat) {
    return beat * this.beatSeconds;
  }

  mixSample(index, value, pan = 0) {
    const target = ((index % this.length) + this.length) % this.length;
    const angle = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
    this.left[target] += value * Math.cos(angle);
    this.right[target] += value * Math.sin(angle);
  }

  addTone({
    beat,
    beats,
    note,
    type = "triangle",
    amplitude = 0.1,
    pan = 0,
    attack = 0.01,
    release = 0.08,
    sustain = 0.72,
    vibratoDepth = 0,
    vibratoRate = 5,
    pulseWidth = 0.5,
    octaveLayer = 0,
  }) {
    const start = Math.round(this.beatTime(beat) * sampleRate);
    const durationSeconds = Math.max(0.02, this.beatTime(beats));
    const samples = Math.round(durationSeconds * sampleRate);
    const frequency = midiFrequency(note);
    const attackSamples = Math.max(1, Math.round(attack * sampleRate));
    const releaseSamples = Math.max(1, Math.min(samples, Math.round(release * sampleRate)));
    let phase = 0;
    let octavePhase = 0;

    for (let offset = 0; offset < samples; offset += 1) {
      const time = offset / sampleRate;
      const vibrato = 1 + vibratoDepth * Math.sin(Math.PI * 2 * vibratoRate * time);
      phase += (Math.PI * 2 * frequency * vibrato) / sampleRate;
      let voice = waveform(type, phase, pulseWidth);
      if (octaveLayer) {
        octavePhase += (Math.PI * 4 * frequency * vibrato) / sampleRate;
        voice = (voice + waveform(type, octavePhase, pulseWidth) * octaveLayer) / (1 + octaveLayer);
      }
      const attackEnvelope = Math.min(1, offset / attackSamples);
      const releaseEnvelope = Math.min(1, (samples - offset) / releaseSamples);
      const decayEnvelope = sustain + (1 - sustain) * Math.exp(-time * 7);
      const envelope = attackEnvelope * releaseEnvelope * decayEnvelope;
      this.mixSample(start + offset, voice * amplitude * envelope, pan);
    }
  }

  addKick(beat, amplitude = 0.28, pan = 0) {
    const start = Math.round(this.beatTime(beat) * sampleRate);
    const samples = Math.round(0.24 * sampleRate);
    let phase = 0;
    for (let offset = 0; offset < samples; offset += 1) {
      const time = offset / sampleRate;
      const frequency = 42 + 105 * Math.exp(-time * 24);
      phase += (Math.PI * 2 * frequency) / sampleRate;
      const envelope = Math.exp(-time * 17);
      const click = offset < sampleRate * 0.008 ? (this.random() * 2 - 1) * 0.16 : 0;
      this.mixSample(start + offset, (Math.sin(phase) + click) * amplitude * envelope, pan);
    }
  }

  addSnare(beat, amplitude = 0.16, pan = 0) {
    const start = Math.round(this.beatTime(beat) * sampleRate);
    const samples = Math.round(0.19 * sampleRate);
    let phase = 0;
    let smoothedNoise = 0;
    for (let offset = 0; offset < samples; offset += 1) {
      const time = offset / sampleRate;
      const noise = this.random() * 2 - 1;
      smoothedNoise += (noise - smoothedNoise) * 0.36;
      phase += (Math.PI * 2 * 176) / sampleRate;
      const envelope = Math.exp(-time * 20);
      const body = Math.sin(phase) * 0.26;
      this.mixSample(start + offset, (smoothedNoise * 0.78 + body) * amplitude * envelope, pan);
    }
  }

  addHat(beat, amplitude = 0.045, pan = 0, open = false) {
    const start = Math.round(this.beatTime(beat) * sampleRate);
    const duration = open ? 0.16 : 0.055;
    const samples = Math.round(duration * sampleRate);
    let previousNoise = 0;
    for (let offset = 0; offset < samples; offset += 1) {
      const time = offset / sampleRate;
      const noise = this.random() * 2 - 1;
      const highPassed = noise - previousNoise * 0.82;
      previousNoise = noise;
      const envelope = Math.exp(-time * (open ? 24 : 64));
      this.mixSample(start + offset, highPassed * amplitude * envelope, pan);
    }
  }

  addNoiseBed(amplitude = 0.0015) {
    let smoothed = 0;
    for (let index = 0; index < this.length; index += 1) {
      const noise = this.random() * 2 - 1;
      smoothed += (noise - smoothed) * 0.025;
      const dust = this.random() > 0.99975 ? (this.random() * 2 - 1) * 0.16 : 0;
      this.mixSample(index, (smoothed + dust) * amplitude, Math.sin(index / 38_000) * 0.2);
    }
  }

  addCircularDelay(delaySeconds, amount, crossFeed = 0.16) {
    const delay = Math.round(delaySeconds * sampleRate);
    const dryLeft = this.left.slice();
    const dryRight = this.right.slice();
    for (let index = 0; index < this.length; index += 1) {
      const source = (index - delay + this.length) % this.length;
      this.left[index] += (dryLeft[source] * (1 - crossFeed) + dryRight[source] * crossFeed) * amount;
      this.right[index] += (dryRight[source] * (1 - crossFeed) + dryLeft[source] * crossFeed) * amount;
    }
  }

  master({ peak = 0.88, bitDepth = 14, sampleHold = 1 } = {}) {
    let maximum = 0;
    const quantization = 2 ** (bitDepth - 1);
    for (let index = 0; index < this.length; index += 1) {
      if (sampleHold > 1 && index % sampleHold) {
        this.left[index] = this.left[index - 1];
        this.right[index] = this.right[index - 1];
      }
      this.left[index] = Math.tanh(this.left[index] * 1.12);
      this.right[index] = Math.tanh(this.right[index] * 1.12);
      this.left[index] = Math.round(this.left[index] * quantization) / quantization;
      this.right[index] = Math.round(this.right[index] * quantization) / quantization;
      maximum = Math.max(maximum, Math.abs(this.left[index]), Math.abs(this.right[index]));
    }
    const scale = maximum ? peak / maximum : 1;
    for (let index = 0; index < this.length; index += 1) {
      this.left[index] *= scale;
      this.right[index] *= scale;
    }
  }

  wavBuffer() {
    const bytesPerSample = 2;
    const dataSize = this.length * 2 * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(2, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2 * bytesPerSample, 28);
    buffer.writeUInt16LE(2 * bytesPerSample, 32);
    buffer.writeUInt16LE(bytesPerSample * 8, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);
    let position = 44;
    for (let index = 0; index < this.length; index += 1) {
      buffer.writeInt16LE(Math.round(clamp(this.left[index]) * 32_767), position);
      buffer.writeInt16LE(Math.round(clamp(this.right[index]) * 32_767), position + 2);
      position += 4;
    }
    return buffer;
  }
}

function addChord(synth, beat, notes, options = {}) {
  const spread = options.spread ?? 0.72;
  notes.forEach((note, index) => synth.addTone({
    beat: beat + index * 0.012,
    beats: options.beats ?? 4,
    note,
    type: options.type ?? "triangle",
    amplitude: (options.amplitude ?? 0.035) / Math.max(1, notes.length * spread),
    pan: (index / Math.max(1, notes.length - 1) - 0.5) * (options.width ?? 1.15),
    attack: options.attack ?? 0.12,
    release: options.release ?? 0.32,
    sustain: options.sustain ?? 0.8,
    vibratoDepth: options.vibratoDepth ?? 0.0015,
    vibratoRate: options.vibratoRate ?? 4.2,
  }));
}

function createGameTheme({
  bpm,
  beats = 48,
  seed,
  chords,
  melody,
  energy = 0.55,
  leadType = "triangle",
  chordType = "triangle",
  brightness = 0,
  noiseBed = 0,
  peak = 0.78,
  bitDepth = 13,
}) {
  const synth = new LoopSynth({ bpm, beats, seed });
  const bars = beats / 4;
  for (let bar = 0; bar < bars; bar += 1) {
    const beat = bar * 4;
    const chord = chords[bar % chords.length];
    const laterPass = bar >= bars / 2;
    addChord(synth, beat, chord.notes, {
      amplitude: 0.1 + energy * 0.055,
      type: chordType,
      attack: energy > 0.72 ? 0.025 : 0.14,
      release: energy > 0.72 ? 0.15 : 0.34,
      width: 1.05,
    });

    const bassSteps = energy > 0.7 ? 8 : 4;
    for (let step = 0; step < bassSteps; step += 1) {
      synth.addTone({
        beat: beat + step * (4 / bassSteps),
        beats: energy > 0.7 ? 0.42 : 0.8,
        note: chord.bass + (step === bassSteps - 1 ? 7 : 0),
        amplitude: 0.06 + energy * 0.045,
        type: energy > 0.7 ? "square" : "triangle",
        release: energy > 0.7 ? 0.05 : 0.15,
        pan: -0.08,
      });
    }

    const arpNotes = [...chord.notes, chord.notes[1] + 12];
    const arpSteps = energy > 0.68 ? 16 : 8;
    for (let step = 0; step < arpSteps; step += 1) {
      synth.addTone({
        beat: beat + step * (4 / arpSteps),
        beats: energy > 0.68 ? 0.2 : 0.38,
        note: arpNotes[step % arpNotes.length] + 12,
        amplitude: 0.018 + energy * 0.026 + (laterPass ? brightness * 0.008 : 0),
        type: "pulse",
        pulseWidth: step % 2 ? 0.32 : 0.42,
        release: 0.045,
        pan: step % 2 ? 0.48 : -0.48,
      });
    }

    if (bar >= 1) {
      melody.forEach((note, step) => {
        if (!Number.isFinite(note)) return;
        synth.addTone({
          beat: beat + step * 0.5,
          beats: step % 4 === 3 ? 0.66 : 0.4,
          note: note + (bar % 4 === 2 ? 2 : 0),
          amplitude: 0.04 + energy * 0.035,
          type: leadType,
          attack: leadType === "triangle" ? 0.018 : 0.006,
          release: leadType === "triangle" ? 0.14 : 0.065,
          vibratoDepth: leadType === "triangle" ? 0.0018 : 0,
          pan: step % 2 ? 0.16 : -0.16,
          octaveLayer: laterPass ? brightness * 0.2 : 0,
        });
      });
    }

    synth.addKick(beat, 0.17 + energy * 0.16);
    synth.addKick(beat + 2, 0.14 + energy * 0.14);
    if (energy > 0.68) {
      synth.addKick(beat + 1.5, 0.1 + energy * 0.1);
      synth.addKick(beat + 3.5, 0.11 + energy * 0.1);
    }
    synth.addSnare(beat + 1, 0.08 + energy * 0.12, 0.08);
    synth.addSnare(beat + 3, 0.09 + energy * 0.13, -0.08);
    const hatSteps = energy > 0.78 && laterPass ? 16 : 8;
    for (let step = 0; step < hatSteps; step += 1) {
      synth.addHat(
        beat + step * (4 / hatSteps),
        0.014 + energy * (step % 2 ? 0.027 : 0.038),
        step % 2 ? 0.32 : -0.32,
        step === hatSteps - 1,
      );
    }
  }
  if (noiseBed) synth.addNoiseBed(noiseBed);
  synth.addCircularDelay(synth.beatSeconds * (energy > 0.7 ? 0.5 : 0.75), energy > 0.7 ? 0.085 : 0.12, 0.28);
  synth.master({ peak, bitDepth, sampleHold: 1 });
  return synth;
}

function createWordGarden() {
  return createGameTheme({
    bpm: 88,
    seed: 0x70a6d,
    chords: [
      { notes: [50, 57, 61, 66], bass: 38 },
      { notes: [47, 54, 57, 62], bass: 35 },
      { notes: [43, 50, 54, 59], bass: 31 },
      { notes: [45, 52, 54, 61], bass: 33 },
    ],
    melody: [74, null, 76, 78, 81, 78, 76, null],
    energy: 0.42,
    leadType: "triangle",
    noiseBed: 0.0032,
    peak: 0.7,
  });
}

function createBrightAnswers() {
  return createGameTheme({
    bpm: 132,
    beats: 64,
    seed: 0xb2168,
    chords: [
      { notes: [43, 50, 55, 59], bass: 31 },
      { notes: [48, 55, 60, 64], bass: 36 },
      { notes: [40, 47, 52, 55], bass: 28 },
      { notes: [50, 57, 62, 66], bass: 38 },
    ],
    melody: [79, 83, 86, 83, 81, 79, 74, 76],
    energy: 0.76,
    leadType: "square",
    chordType: "pulse",
    brightness: 0.55,
    peak: 0.82,
    bitDepth: 12,
  });
}

function createOrderedLight() {
  return createGameTheme({
    bpm: 80,
    seed: 0x0d3e2,
    chords: [
      { notes: [41, 48, 53, 57], bass: 29 },
      { notes: [38, 45, 50, 53], bass: 26 },
      { notes: [46, 53, 58, 62], bass: 34 },
      { notes: [48, 55, 60, 64], bass: 36 },
    ],
    melody: [72, null, 77, 76, 74, null, 72, 69],
    energy: 0.34,
    leadType: "triangle",
    noiseBed: 0.0022,
    peak: 0.68,
    bitDepth: 14,
  });
}

function createQuietClues() {
  return createGameTheme({
    bpm: 96,
    seed: 0xc1ae5,
    chords: [
      { notes: [50, 53, 57, 60], bass: 38 },
      { notes: [46, 50, 53, 57], bass: 34 },
      { notes: [41, 48, 53, 57], bass: 29 },
      { notes: [48, 52, 55, 60], bass: 36 },
    ],
    melody: [74, 77, null, 81, 79, 77, 72, null],
    energy: 0.48,
    leadType: "triangle",
    chordType: "triangle",
    noiseBed: 0.0026,
    peak: 0.72,
  });
}

function createCanonRun() {
  return createGameTheme({
    bpm: 142,
    beats: 64,
    seed: 0xca909,
    chords: [
      { notes: [48, 55, 60, 64], bass: 36 },
      { notes: [53, 57, 60, 65], bass: 41 },
      { notes: [45, 52, 57, 60], bass: 33 },
      { notes: [43, 50, 55, 59], bass: 31 },
    ],
    melody: [84, 79, 81, 84, 86, 84, 81, 79],
    energy: 0.86,
    leadType: "square",
    chordType: "pulse",
    brightness: 0.62,
    peak: 0.84,
    bitDepth: 12,
  });
}

function createHiddenVoice() {
  return createGameTheme({
    bpm: 104,
    seed: 0x41dd3,
    chords: [
      { notes: [45, 52, 57, 60], bass: 33 },
      { notes: [41, 48, 53, 57], bass: 29 },
      { notes: [38, 45, 50, 53], bass: 26 },
      { notes: [40, 47, 52, 56], bass: 28 },
    ],
    melody: [69, 72, 76, null, 74, 72, 68, null],
    energy: 0.54,
    leadType: "pulse",
    chordType: "triangle",
    brightness: 0.2,
    noiseBed: 0.0028,
    peak: 0.74,
  });
}

function createStillWaters() {
  const synth = new LoopSynth({ bpm: 90, beats: 48, seed: 0x16b17 });
  const chords = [
    { notes: [48, 55, 59, 64], bass: 36 },
    { notes: [45, 52, 55, 60], bass: 33 },
    { notes: [41, 48, 52, 57], bass: 29 },
    { notes: [43, 50, 52, 59], bass: 31 },
  ];
  const leadPhrases = [
    [[0.5, 76, 0.75], [1.5, 79, 0.5], [2.25, 83, 0.75], [3.25, 79, 0.5]],
    [[0.25, 76, 0.5], [1, 72, 0.75], [2, 74, 0.5], [2.75, 76, 1]],
    [[0.5, 69, 0.75], [1.5, 72, 0.5], [2.25, 76, 0.75], [3.25, 72, 0.5]],
    [[0.25, 71, 0.5], [1, 74, 0.75], [2, 76, 0.5], [2.75, 74, 0.5], [3.5, 71, 0.4]],
  ];

  for (let bar = 0; bar < 12; bar += 1) {
    const beat = bar * 4;
    const chord = chords[bar % chords.length];
    addChord(synth, beat, chord.notes, { amplitude: 0.15, attack: 0.18, release: 0.42 });
    synth.addTone({ beat, beats: 1.85, note: chord.bass, amplitude: 0.105, type: "triangle", release: 0.2, pan: -0.08 });
    synth.addTone({ beat: beat + 2, beats: 1.65, note: chord.bass + 7, amplitude: 0.072, type: "triangle", release: 0.18, pan: 0.06 });

    chord.notes.slice(1).forEach((note, index) => {
      synth.addTone({
        beat: beat + index * 0.5 + 0.5,
        beats: 0.42,
        note: note + 12,
        amplitude: 0.033,
        type: "pulse",
        pulseWidth: 0.36,
        release: 0.09,
        pan: index % 2 ? 0.4 : -0.4,
      });
    });

    if (bar >= 2) {
      leadPhrases[bar % leadPhrases.length].forEach(([offset, note, length], noteIndex) => synth.addTone({
        beat: beat + offset,
        beats: length,
        note: note + (bar >= 8 && noteIndex === 2 ? 12 : 0),
        amplitude: bar >= 8 ? 0.061 : 0.052,
        type: "triangle",
        attack: 0.02,
        release: 0.16,
        vibratoDepth: 0.002,
        pan: noteIndex % 2 ? 0.18 : -0.18,
      }));
    }

    synth.addKick(beat, 0.2);
    synth.addKick(beat + 2, 0.16);
    synth.addSnare(beat + 1, 0.105, 0.08);
    synth.addSnare(beat + 3, 0.12, -0.08);
    for (let step = 0; step < 8; step += 1) {
      synth.addHat(beat + step * 0.5, step % 2 ? 0.022 : 0.032, step % 2 ? 0.32 : -0.28, step === 7);
    }
  }
  synth.addNoiseBed(0.0038);
  synth.addCircularDelay(synth.beatSeconds * 0.75, 0.13, 0.32);
  synth.master({ peak: 0.72, bitDepth: 13, sampleHold: 1 });
  return synth;
}

function createFinalRun() {
  const synth = new LoopSynth({ bpm: 150, beats: 64, seed: 0xf1a1e });
  const chords = [
    { notes: [50, 53, 57], bass: 38 },
    { notes: [46, 50, 53], bass: 34 },
    { notes: [48, 52, 55], bass: 36 },
    { notes: [45, 49, 52], bass: 33 },
  ];
  const motif = [74, 77, 81, 77, 76, 79, 84, 79];

  for (let bar = 0; bar < 16; bar += 1) {
    const beat = bar * 4;
    const chord = chords[bar % chords.length];
    const pressure = bar >= 8 ? 1 : 0;
    addChord(synth, beat, chord.notes, {
      amplitude: pressure ? 0.11 : 0.085,
      type: "pulse",
      attack: 0.02,
      release: 0.16,
      width: 0.9,
    });

    for (let step = 0; step < 8; step += 1) {
      const bassNote = chord.bass + (step % 4 === 3 ? 12 : 0);
      synth.addTone({
        beat: beat + step * 0.5,
        beats: 0.43,
        note: bassNote,
        amplitude: pressure ? 0.092 : 0.078,
        type: "square",
        release: 0.055,
        pan: -0.12,
      });
    }

    const arp = [...chord.notes, chord.notes[1] + 12];
    for (let step = 0; step < 16; step += 1) {
      synth.addTone({
        beat: beat + step * 0.25,
        beats: 0.2,
        note: arp[step % arp.length] + 12,
        amplitude: pressure ? 0.042 : 0.029,
        type: "pulse",
        pulseWidth: step % 2 ? 0.28 : 0.42,
        release: 0.035,
        pan: step % 2 ? 0.56 : -0.56,
      });
    }

    if (bar >= 4) {
      motif.forEach((note, index) => synth.addTone({
        beat: beat + index * 0.5,
        beats: index % 4 === 3 ? 0.46 : 0.36,
        note: note + (bar % 4 === 1 ? -2 : bar % 4 === 2 ? 2 : 0),
        amplitude: pressure ? 0.085 : 0.063,
        type: "square",
        release: 0.065,
        pan: 0.08,
        octaveLayer: pressure && bar >= 12 ? 0.22 : 0,
      }));
    }

    synth.addKick(beat, pressure ? 0.34 : 0.29);
    synth.addKick(beat + 1.5, pressure ? 0.24 : 0.18);
    synth.addKick(beat + 2, pressure ? 0.32 : 0.27);
    synth.addKick(beat + 3.5, pressure ? 0.27 : 0.2);
    synth.addSnare(beat + 1, pressure ? 0.21 : 0.17, 0.1);
    synth.addSnare(beat + 3, pressure ? 0.23 : 0.18, -0.1);
    const hatSteps = pressure ? 16 : 8;
    for (let step = 0; step < hatSteps; step += 1) {
      synth.addHat(
        beat + step * (4 / hatSteps),
        pressure ? (step % 4 === 0 ? 0.065 : 0.04) : (step % 2 ? 0.03 : 0.044),
        step % 2 ? 0.36 : -0.36,
        step === hatSteps - 1,
      );
    }
  }
  synth.addCircularDelay(synth.beatSeconds * 0.5, 0.095, 0.26);
  synth.master({ peak: 0.86, bitDepth: 12, sampleHold: 1 });
  return synth;
}

function encodeTrack(name, synth) {
  const wavPath = path.join(outputDir, `${name}.wav`);
  const mp3Path = path.join(outputDir, `${name}.mp3`);
  writeFileSync(wavPath, synth.wavBuffer());

  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", wavPath,
    "-codec:a", "libmp3lame", "-b:a", "128k", "-write_xing", "1", mp3Path,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `ffmpeg failed for ${name}`);
  unlinkSync(wavPath);
  return { name, duration: synth.duration, mp3Path };
}

mkdirSync(outputDir, { recursive: true });
const tracks = productionMode
  ? [
      encodeTrack("word-garden", createWordGarden()),
      encodeTrack("still-waters-16bit", createStillWaters()),
      encodeTrack("bright-answers", createBrightAnswers()),
      encodeTrack("ordered-light", createOrderedLight()),
      encodeTrack("quiet-clues", createQuietClues()),
      encodeTrack("reference-rush-final-run", createFinalRun()),
      encodeTrack("canon-run", createCanonRun()),
      encodeTrack("hidden-voice", createHiddenVoice()),
    ]
  : [
      encodeTrack("still-waters-16bit", createStillWaters()),
      encodeTrack("reference-rush-final-run", createFinalRun()),
    ];

for (const track of tracks) {
  console.log(`${track.name}: ${track.duration.toFixed(2)} seconds`);
}
