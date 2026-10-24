import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync('assets/bible-app.js', 'utf8');
const controls = new Map();
for (const id of ['gameMusicToggle', 'mobileGameMusicToggle', 'gameMusicDrawerToggle', 'wordSearchSoundsToggle', 'mobileWordSearchSoundsToggle', 'gameFeedbackSoundsToggle']) {
  controls.set(id, { tagName: id.includes('Drawer') || id === 'gameFeedbackSoundsToggle' ? 'BUTTON' : 'INPUT', attributes: {}, label: {}, setAttribute(key, value) { this.attributes[key] = value; }, querySelector() { return this.label; } });
}
const stored = new Map();
let previews = 0;
let playbackUpdates = 0;
const context = vm.createContext({
  state: {}, document: { getElementById: id => controls.get(id) },
  localStorage: { setItem: (key, value) => stored.set(key, value) },
  scheduleCloudSync() {}, playWordSearchFeedbackSound() { previews++; },
  syncGameMusicPlayback() { playbackUpdates++; },
  renderPreservingReaderScroll() { assert.fail('Audio toggles must preserve the live drawer DOM'); },
});
vm.runInContext(source.slice(source.indexOf('function setWordSearchSounds('), source.indexOf('function gameMusicTrackForGame(')), context);
vm.runInContext(source.slice(source.indexOf('function setGameMusicEnabled('), source.indexOf('function syncActiveGameAudioVolume(')), context);
for (const enabled of [true, false, true, false]) {
  context.setGameMusicEnabled(enabled);
  context.setWordSearchSounds(enabled);
  assert.equal(stored.get('lw_game_music_enabled'), String(enabled));
  assert.equal(stored.get('lw_word_search_sounds'), String(enabled));
  for (const [id, control] of controls) {
    if (control.tagName === 'INPUT') assert.equal(control.checked, enabled, id);
    else {
      assert.equal(control.attributes['aria-pressed'], String(enabled), id);
      assert.equal(control.label.textContent, enabled ? 'On' : 'Off', id);
    }
  }
  assert.equal(controls.get('gameMusicDrawerToggle').attributes['aria-label'], `Turn game music ${enabled ? 'off' : 'on'}`);
}
assert.equal(previews, 2);
assert.equal(playbackUpdates, 4, 'Music playback updates immediately for every toggle');
controls.clear();
context.setWordSearchSounds(true, { preview: false });
context.setGameMusicEnabled(true);
assert.equal(previews, 2, 'Silent preference updates work with no controls mounted');
console.log('Game audio controls preserve DOM, synchronize preferences, and apply audio immediately');
