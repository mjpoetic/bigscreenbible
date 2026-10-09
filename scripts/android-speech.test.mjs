import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('function scriptureReaderSpeechEngine()'), source.indexOf('function bindImmersiveScriptureReader('));
const calls = [];
let receive, removed = 0, failSpeak = false;
const plugin = {
  async addListener(name, callback) { assert.equal(name, 'speechEvent'); receive = callback; return { async remove() { removed++; } }; },
  async getVoices() { return { voices: [{ voiceURI: 'english', name: 'English', lang: 'en-US' }] }; },
  async speak(options) { calls.push(['speak', options]); if (failSpeak) throw new Error('Engine error'); },
  async stop() { calls.push(['stop']); }, async pause() { calls.push(['pause']); }, async resume() { calls.push(['resume']); },
};
const context = vm.createContext({ window: { Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true, isPluginAvailable: () => true, Plugins: { BSBSpeech: plugin } } } });
vm.runInContext(helper, context);
const engine = context.scriptureReaderSpeechEngine();
await engine.ready;
assert.equal(engine.synth.getVoices()[0].voiceURI, 'english');
let starts = 0, ends = 0, errors = 0;
const utterance = new engine.Utterance('One passage');
Object.assign(utterance, { rate: 1.25, lang: 'en', voice: { voiceURI: 'english' }, onstart() { starts++; }, onend() { ends++; }, onerror() { errors++; } });
const flush = async () => { for (let i=0; i<20; i++) await Promise.resolve(); };
engine.synth.speak(utterance); await flush();
const first = calls.at(-1)[1];
assert.ok(first.owner, 'Native commands are scoped to this reader session');
assert.equal(first.text, 'One passage'); assert.equal(first.rate, 1.25); assert.equal(first.voice, 'english');
receive({ id: first.id, type: 'start' }); assert.equal(starts, 1);
engine.synth.pause(); engine.synth.resume(); await flush();
assert.deepEqual(calls.slice(-2).map(c => c[0]), ['pause', 'resume']);
engine.synth.cancel(); receive({ id: first.id, type: 'done' }); assert.equal(ends, 0, 'Stopped events cannot advance Scripture');
engine.synth.speak(utterance); await flush();
const second = calls.at(-1)[1]; assert.notEqual(first.id, second.id);
receive({ id: first.id, type: 'error' }); assert.equal(errors, 0);
receive({ id: second.id, type: 'done' }); assert.equal(ends, 1);
engine.synth.speak(utterance); await flush();
const finishing = calls.at(-1)[1];
engine.synth.pause(); receive({ id: finishing.id, type: 'done' });
assert.equal(ends, 1, 'Completion arriving during pause waits for resume');
engine.synth.resume(); await flush(); assert.equal(ends, 2);
failSpeak = true; engine.synth.speak(utterance); await flush(); assert.equal(errors, 1, 'Bridge errors reach the reader status');
engine.dispose(); await flush(); assert.equal(removed, 1); assert.equal(calls.at(-1)[0], 'stop');
receive({ id: second.id, type: 'start' }); assert.equal(starts, 1, 'Closed readers ignore late events');
context.window.Capacitor.isPluginAvailable = () => false;
assert.equal(context.scriptureReaderSpeechEngine(), null, 'Older installed Android shells fail gracefully');
context.window.Capacitor.getPlatform = () => 'web';
context.window.speechSynthesis = { browser: true }; context.window.SpeechSynthesisUtterance = class {};
assert.equal(context.scriptureReaderSpeechEngine().synth.browser, true, 'Web and iOS retain browser speech');
console.log('Android speech bridge: initialization, voice/rate, events, playback ordering, stale callbacks, cleanup, and fallback passed');
