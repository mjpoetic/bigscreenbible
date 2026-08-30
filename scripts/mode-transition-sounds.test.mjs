import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const durationContext = {};
vm.createContext(durationContext);
vm.runInContext(`
  ${extractFunction("modeTransitionSoundDuration")}
  globalThis.durationFor = modeTransitionSoundDuration;
`, durationContext);

for (const mode of ["reader", "parallel", "big", "trivia"]) {
  const duration = durationContext.durationFor(mode);
  assert.ok(duration > 0 && duration <= 0.3, `${mode} cue must stay at or below 300 ms`);
}
assert.equal(durationContext.durationFor("reader"), 0.2);
assert.equal(durationContext.durationFor("parallel"), 0.24);
assert.equal(durationContext.durationFor("big"), 0.28);
assert.equal(durationContext.durationFor("trivia"), 0.18);

const volumeContext = {};
vm.createContext(volumeContext);
vm.runInContext(`
  ${extractFunction("normalizedSoundVolume")}
  ${extractFunction("soundVolumeScalar")}
  ${extractFunction("modeTransitionVolumeScalar")}
  globalThis.normalizeVolume = normalizedSoundVolume;
  globalThis.volumeScalar = soundVolumeScalar;
  globalThis.modeVolumeScalar = modeTransitionVolumeScalar;
`, volumeContext);
assert.equal(volumeContext.normalizeVolume(null), 100);
assert.equal(volumeContext.normalizeVolume(""), 100);
assert.equal(volumeContext.normalizeVolume(-20), 0);
assert.equal(volumeContext.normalizeVolume(55), 55);
assert.equal(volumeContext.normalizeVolume(150), 100);
assert.equal(volumeContext.volumeScalar(25), 0.25);
assert.equal(volumeContext.modeVolumeScalar(100), 20);
assert.equal(volumeContext.modeVolumeScalar(50), 10);

const switchModeSource = extractFunction("switchMode");
const setSoundsSource = extractFunction("setModeTransitionSounds");
const readySoundSource = extractFunction("playReadyModeTransitionSound");
const soundsSource = extractFunction("soundsSettings");
const presentationSource = extractFunction("presentation");
const bindEventsSource = extractFunction("bindEvents");
const captureSource = extractFunction("captureCloudSnapshot");
const applySource = extractFunction("applyCloudSnapshot");
const persistSource = extractFunction("persistCloudSnapshotLocally");

assert.match(source, /modeTransitionSounds: localStorage\.getItem\("lw_mode_transition_sounds"\) === "true"/);
assert.match(source, /modeTransitionVolume: normalizedSoundVolume\(localStorage\.getItem\("lw_mode_transition_volume"\)\)/);
assert.match(switchModeSource, /options\.audible && state\.modeTransitionSounds/);
assert.match(switchModeSource, /if \(audible\) primeModeTransitionAudio\(\)/);
assert.match(switchModeSource, /if \(audible\) playModeTransitionSound\(nextMode\)/);
assert.match(bindEventsSource, /switchMode\(button\.dataset\.mode, \{ audible: true \}\)/);
assert.match(setSoundsSource, /lw_mode_transition_sounds/);
assert.match(setSoundsSource, /scheduleCloudSync\(\)/);
assert.match(setSoundsSource, /playModeTransitionSound\(state\.mode\)/);

assert.match(readySoundSource, /mode === "reader"/);
assert.match(readySoundSource, /mode === "parallel"/);
assert.match(readySoundSource, /mode === "big"/);
assert.match(readySoundSource, /mode === "trivia"/);
assert.match(readySoundSource, /playModePaperSweep/);
assert.match(readySoundSource, /type: "triangle"/);
assert.match(extractFunction("playModePaperSweep"), /context\.createBuffer/);
assert.match(extractFunction("playModePaperSweep"), /modeTransitionVolumeScalar\(state\.modeTransitionVolume\)/);
assert.match(extractFunction("playModeTone"), /options\.peakGain \* \(options\.volume \?\? 1\)/);
assert.match(readySoundSource, /volume: modeTransitionVolumeScalar\(state\.modeTransitionVolume\)/);
assert.doesNotMatch(source, /mode-transition[^\n]+\.(?:mp3|m4a|ogg|wav)/i);

assert.match(soundsSource, /settingsDisclosure\("sounds", "Sounds"/);
assert.match(soundsSource, /ModeTransitionSoundsToggle/);
assert.match(soundsSource, /Mode transition sounds/);
assert.match(soundsSource, /soundVolumeControlMarkup\("mode", prefix\)/);
assert.match(presentationSource, /presentationSettingsDisclosure\("sound", "Sound"/);
assert.match(presentationSource, /presentationModeTransitionSoundsToggle/);
for (const id of [
  "modeTransitionSoundsToggle",
  "mobileModeTransitionSoundsToggle",
  "presentationModeTransitionSoundsToggle",
]) {
  assert.match(bindEventsSource, new RegExp(id));
}

assert.match(captureSource, /modeTransitionSounds: state\.modeTransitionSounds/);
assert.match(captureSource, /modeTransitionVolume: state\.modeTransitionVolume/);
assert.match(applySource, /state\.modeTransitionSounds = typeof settings\.modeTransitionSounds === "boolean"/);
assert.match(applySource, /state\.modeTransitionVolume = normalizedSoundVolume/);
assert.match(persistSource, /lw_mode_transition_sounds/);
assert.match(persistSource, /lw_mode_transition_volume/);
assert.match(styles, /\.presentation-settings-popover \.presentation-setting-checkbox \{/);
assert.match(styles, /accent-color: var\(--presentation-accent\)/);

console.log("Mode transition sound tests passed");
