import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = readFileSync(path.join(rootDir, "assets", "bible-app.js"), "utf8");
const cssSource = readFileSync(path.join(rootDir, "assets", "bible-app.css"), "utf8");
const generatorSource = readFileSync(path.join(rootDir, "scripts", "generate-game-music-auditions.mjs"), "utf8");

const tracks = [
  ["word-garden.mp3", "Word Garden"],
  ["still-waters-16bit.mp3", "Still Waters"],
  ["bright-answers.mp3", "Bright Answers"],
  ["ordered-light.mp3", "Ordered Light"],
  ["quiet-clues.mp3", "Quiet Clues"],
  ["reference-rush-final-run.mp3", "Final Run"],
  ["canon-run.mp3", "Canon Run"],
  ["hidden-voice.mp3", "Hidden Voice"],
];

const outcomeSounds = [
  ["joyful-complete.mp3", "perfect"],
  ["level-complete.mp3", "complete"],
  ["whomp-whomp.mp3", "low"],
];

const manifestStart = appSource.indexOf("const gameMusicTracks");
const manifestEnd = appSource.indexOf("});", manifestStart);
assert.ok(manifestStart >= 0 && manifestEnd > manifestStart, "Game music track manifest must exist");
const manifestSource = appSource.slice(manifestStart, manifestEnd + 3);
assert.doesNotMatch(manifestSource, /https?:\/\//, "Game music must use bundled local assets");

const outcomeManifestStart = appSource.indexOf("const gameOutcomeSounds");
const outcomeManifestEnd = appSource.indexOf("});", outcomeManifestStart);
assert.ok(outcomeManifestStart >= 0 && outcomeManifestEnd > outcomeManifestStart, "Game outcome sound manifest must exist");
const outcomeManifestSource = appSource.slice(outcomeManifestStart, outcomeManifestEnd + 3);
assert.doesNotMatch(outcomeManifestSource, /https?:\/\//, "Game outcome sounds must use bundled local assets");
assert.match(outcomeManifestSource, /perfect: \{[^}]*volume: 0\.105 \}/, "The perfect cue must be loudness-matched to the game soundtracks");
assert.match(outcomeManifestSource, /complete: \{[^}]*volume: 0\.13 \}/, "The level-complete cue must be loudness-matched to the game soundtracks");
assert.match(outcomeManifestSource, /low: \{[^}]*volume: 0\.14 \}/, "The low-result cue must be loudness-matched to the game soundtracks");

for (const [fileName, trackName] of tracks) {
  const assetPath = path.join(rootDir, "assets", "audio", "game-music", fileName);
  assert.ok(existsSync(assetPath), `${fileName} must be generated`);
  assert.ok(statSync(assetPath).size > 300_000, `${fileName} must contain a complete encoded loop`);
  assert.match(manifestSource, new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be mapped`);
  assert.match(manifestSource, new RegExp(trackName), `${trackName} must be named in controls`);
  assert.match(generatorSource, new RegExp(fileName.replace(/\.mp3$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be reproducible`);
}

for (const [fileName, outcomeKey] of outcomeSounds) {
  const assetPath = path.join(rootDir, "assets", "audio", "game-music", fileName);
  assert.ok(existsSync(assetPath), `${fileName} must be generated`);
  assert.ok(statSync(assetPath).size > 35_000, `${fileName} must contain a complete encoded outcome cue`);
  assert.match(outcomeManifestSource, new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be mapped`);
  assert.match(outcomeManifestSource, new RegExp(`\\b${outcomeKey}\\b`), `${fileName} must map to the ${outcomeKey} outcome`);
  assert.match(generatorSource, new RegExp(fileName.replace(/\.mp3$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be reproducible`);
}

assert.match(appSource, /game\.type === "reference-rush" && game\.timed\s*\? "reference-rush-timed"/, "Timed Reference Rush must select Final Run");
assert.match(appSource, /gameMusicEnabled: localStorage\.getItem\("lw_game_music_enabled"\) !== "false"/, "Game music should default on and remember a local opt-out");
assert.match(appSource, /gameVolume: normalizedSoundVolume\(localStorage\.getItem\("lw_game_volume"\)\)/, "Game volume should default to the established mix and remember a local level");
assert.match(appSource, /gameMusicEnabled: state\.gameMusicEnabled/, "Game music preference must enter cloud snapshots");
assert.match(appSource, /gameVolume: state\.gameVolume/, "Game volume must enter cloud snapshots");
assert.match(appSource, /state\.gameMusicEnabled = typeof settings\.gameMusicEnabled === "boolean"/, "Game music preference must restore from cloud snapshots");
assert.match(appSource, /localStorage\.setItem\("lw_game_music_enabled"/, "Game music preference must persist locally");
assert.match(appSource, /localStorage\.setItem\("lw_game_volume"/, "Game volume must persist locally");
assert.doesNotMatch(appSource, /gameMusicInlineToggle/, "Games must not place the music control inline");
assert.match(appSource, /gameMusicToggleMarkup\("gameMusicDrawerToggle"\)/, "Every game must expose the music control in Controls");
assert.match(appSource, /soundVolumeControlMarkup\("game", "gameDrawer"/, "Every game must expose the shared game volume in Controls");
assert.match(appSource, /id="gamesControlsDrawer" role="dialog" aria-modal="true"/, "Game controls must remain a hidden drawer at every breakpoint");
assert.match(appSource, /state\.mode === "trivia"[\s\S]*!game\.complete[\s\S]*!document\.hidden/, "Music playback must be limited to a visible active game");
assert.match(appSource, /gameMusicAudio\.loop = true/, "Game music must loop");
assert.match(appSource, /track\.volume \* soundVolumeScalar\(state\.gameVolume\)/, "Game music must honor the shared game volume");
assert.match(appSource, /sound\.volume \* soundVolumeScalar\(state\.gameVolume\)/, "Game result sounds must honor the shared game volume");
assert.match(appSource, /function gameOutcomeSoundKey\(game\)[\s\S]*game\.lost \|\| game\.timedOut[\s\S]*accuracy >= 1[\s\S]*accuracy < 0\.5/, "Completion sounds must distinguish perfect, ordinary, and low or lost results");
assert.match(appSource, /game\.outcomeSoundPending = gameOutcomeSoundKey\(game\)/, "Every completed game must queue its matching outcome sound");
assert.match(appSource, /function playGameOutcomeSound\(key\)[\s\S]*!state\.gameMusicEnabled[\s\S]*audio\.loop = false/, "Outcome sounds must honor the game music switch and play once");
assert.match(appSource, /cleanupTriviaCelebration\(\{ stopAudio: false \}\)/, "Visual celebration cleanup must allow the outcome cue to finish");

const pendingCelebrationSource = appSource.slice(
  appSource.indexOf("function runPendingTriviaCelebration"),
  appSource.indexOf("function revealTriviaMotionSuccess"),
);
const confettiLaunchSource = appSource.slice(
  appSource.indexOf("async function launchTriviaConfetti"),
  appSource.indexOf("function cleanupTriviaCelebration"),
);
assert.match(pendingCelebrationSource, /if \(!game\.celebrationPending\) \{[\s\S]*playGameOutcomeSound\(soundKey\)/, "Non-confetti outcomes must still play immediately");
assert.match(pendingCelebrationSource, /launchTriviaConfetti\(game, soundKey\)/, "Perfect-score audio must travel with the pending confetti launch");
assert.match(confettiLaunchSource, /playGameOutcomeSound\(soundKey\);\s*confetti\(\{ particleCount: 70/, "Perfect-score audio must start beside the first visible confetti burst");
assert.match(confettiLaunchSource, /catch \{[\s\S]*playGameOutcomeSound\(soundKey\)[\s\S]*revealTriviaMotionSuccess/, "The perfect-score cue must survive a blocked confetti import");

const outcomeSelectorSource = appSource.match(/function gameOutcomeSoundKey\(game\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(outcomeSelectorSource, "Outcome selector must remain testable");
const selectOutcomeSound = Function("triviaRoundLength", `return (${outcomeSelectorSource});`)((game) => game.roundLength);
assert.equal(selectOutcomeSound({ complete: true, score: 5, roundLength: 5, type: "trivia" }), "perfect", "A perfect score must receive the joyful cue");
assert.equal(selectOutcomeSound({ complete: true, score: 3, roundLength: 5, type: "trivia" }), "complete", "An ordinary completion must receive the level-complete cue");
assert.equal(selectOutcomeSound({ complete: true, score: 2, roundLength: 5, type: "trivia" }), "low", "A score below 50 percent must receive the playful low cue");
assert.equal(selectOutcomeSound({ complete: true, score: 2.5, roundLength: 5, type: "trivia" }), "complete", "Exactly 50 percent must remain an ordinary completion");
assert.equal(selectOutcomeSound({ complete: true, score: 5, roundLength: 5, type: "reference-rush", timedOut: true }), "low", "A timed-out game must receive the low cue regardless of score");
assert.equal(selectOutcomeSound({ complete: true, score: 5, roundLength: 5, type: "book-sprint", bookSprintBeatBest: false }), "complete", "A completed Book Sprint that does not beat the best time must receive the level-complete cue");
assert.equal(selectOutcomeSound({ complete: true, score: 5, roundLength: 5, type: "book-sprint", bookSprintBeatBest: true }), "perfect", "A record-setting Book Sprint must retain the perfect celebration cue");
const bookSprintTickSource = appSource.slice(
  appSource.indexOf("function playBookSprintTick"),
  appSource.indexOf("function updateBookSprintTimerDisplay"),
);
const referenceRushTickSource = appSource.slice(
  appSource.indexOf("function playReferenceRushTick"),
  appSource.indexOf("function scheduleReferenceRushTimer"),
);
assert.match(bookSprintTickSource, /secondsRemaining <= 3 \? 0\.1 : 0\.065/, "Book Sprint ticking must sit above the game soundtrack");
assert.match(referenceRushTickSource, /secondsRemaining <= 3 \? 0\.1 : 0\.065/, "Reference Rush ticking must sit above the game soundtrack");
assert.match(appSource, /navigator\.audioSession\.type = "ambient"/, "Supported devices must receive an ambient audio-session hint");
assert.match(appSource, /pauseGameMusic\(\{ fade: false \}\)[\s\S]*pauseReaderAutoScroll/, "Backgrounding must stop music immediately");
assert.match(appSource, /resumeTriviaGameAfterReference\(target\.game\)[\s\S]*render\(\)/, "Returning from Scripture must preserve the same game for music resumption");
assert.match(cssSource, /\.game-music-drawer-control\s*\{\s*display: contents;/, "The music control must render inside the Controls drawer");
assert.match(cssSource, /\.game-volume-drawer-control\s*\{/, "The shared game volume must be styled inside the Controls drawer");
assert.match(cssSource, /games-drawer-shell:is\(\[data-games-drawer="social"\], \[data-games-drawer="controls"\]\)/, "Desktop Controls must use the hidden drawer shell");
assert.match(generatorSource, /process\.argv\.includes\("--production"\)/, "The generator must have an explicit production mode");
assert.match(generatorSource, /const starts = \[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13\.5, 14\]/, "Ode to Joy must keep its recognizable quarter-note phrase and closing cadence");
assert.match(generatorSource, /\[0\.35, 1\.75, 3\.25, 5\.1\]\.forEach\(\(beat, index\) => synth\.addFirework/, "Firework transients must stay inside the visible confetti window");

console.log("Game music checks passed");
