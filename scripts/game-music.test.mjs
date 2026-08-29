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

const manifestStart = appSource.indexOf("const gameMusicTracks");
const manifestEnd = appSource.indexOf("});", manifestStart);
assert.ok(manifestStart >= 0 && manifestEnd > manifestStart, "Game music track manifest must exist");
const manifestSource = appSource.slice(manifestStart, manifestEnd + 3);
assert.doesNotMatch(manifestSource, /https?:\/\//, "Game music must use bundled local assets");

for (const [fileName, trackName] of tracks) {
  const assetPath = path.join(rootDir, "assets", "audio", "game-music", fileName);
  assert.ok(existsSync(assetPath), `${fileName} must be generated`);
  assert.ok(statSync(assetPath).size > 300_000, `${fileName} must contain a complete encoded loop`);
  assert.match(manifestSource, new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be mapped`);
  assert.match(manifestSource, new RegExp(trackName), `${trackName} must be named in controls`);
  assert.match(generatorSource, new RegExp(fileName.replace(/\.mp3$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${fileName} must be reproducible`);
}

assert.match(appSource, /game\.type === "reference-rush" && game\.timed\s*\? "reference-rush-timed"/, "Timed Reference Rush must select Final Run");
assert.match(appSource, /gameMusicEnabled: localStorage\.getItem\("lw_game_music_enabled"\) !== "false"/, "Game music should default on and remember a local opt-out");
assert.match(appSource, /gameMusicEnabled: state\.gameMusicEnabled/, "Game music preference must enter cloud snapshots");
assert.match(appSource, /state\.gameMusicEnabled = typeof settings\.gameMusicEnabled === "boolean"/, "Game music preference must restore from cloud snapshots");
assert.match(appSource, /localStorage\.setItem\("lw_game_music_enabled"/, "Game music preference must persist locally");
assert.doesNotMatch(appSource, /gameMusicInlineToggle/, "Games must not place the music control inline");
assert.match(appSource, /gameMusicToggleMarkup\("gameMusicDrawerToggle"\)/, "Every game must expose the music control in Controls");
assert.match(appSource, /id="gamesControlsDrawer" role="dialog" aria-modal="true"/, "Game controls must remain a hidden drawer at every breakpoint");
assert.match(appSource, /state\.mode === "trivia"[\s\S]*!game\.complete[\s\S]*!document\.hidden/, "Music playback must be limited to a visible active game");
assert.match(appSource, /gameMusicAudio\.loop = true/, "Game music must loop");
assert.match(appSource, /navigator\.audioSession\.type = "ambient"/, "Supported devices must receive an ambient audio-session hint");
assert.match(appSource, /pauseGameMusic\(\{ fade: false \}\)[\s\S]*pauseReaderAutoScroll/, "Backgrounding must stop music immediately");
assert.match(appSource, /resumeTriviaGameAfterReference\(target\.game\)[\s\S]*render\(\)/, "Returning from Scripture must preserve the same game for music resumption");
assert.match(cssSource, /\.game-music-drawer-control\s*\{\s*display: contents;/, "The music control must render inside the Controls drawer");
assert.match(cssSource, /games-drawer-shell:is\(\[data-games-drawer="social"\], \[data-games-drawer="controls"\]\)/, "Desktop Controls must use the hidden drawer shell");
assert.match(generatorSource, /process\.argv\.includes\("--production"\)/, "The generator must have an explicit production mode");

console.log("Game music checks passed");
