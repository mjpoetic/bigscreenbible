import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('function rememberRefreshMode()'), source.indexOf('function requestedVersionFromUrl()'));
for (const mode of ['reader', 'parallel', 'big', 'trivia']) {
  let saved;
  const context = {
    state: { mode, triviaGameType: 'crossword', reference: 'John 3', verse: 16 },
    sessionStorage: { setItem: (_, value) => { saved = value; }, getItem: () => saved },
    window: { performance: { getEntriesByType: () => [{ type: 'reload' }] } },
    bibleData: { 'John 3': {} }, currentChapter: () => ({ verses: [{ n: 16 }] }),
    sharedReferenceFromUrl: () => 'Psalm 23:1', requestedModeFromUrl: () => mode,
    isCompactScreen: () => false,
  };
  vm.createContext(context);
  vm.runInContext(helpers, context);
  context.rememberRefreshMode();
  context.state = { mode: 'reader', startupApplied: false };
  await context.applyStartupExperience();
  assert.equal(context.state.mode, mode);
  assert.equal(context.state.triviaGameType, 'crossword');
  assert.equal(context.state.reference, 'John 3');
  assert.equal(context.state.verse, 16);
  context.window.performance.getEntriesByType = () => [{ type: 'navigate' }];
  assert.equal(context.refreshModeFromSession(), null);
  saved = '{bad';
  context.window.performance.getEntriesByType = () => [{ type: 'reload' }];
  assert.equal(context.refreshModeFromSession(), null);
}
console.log('Refresh mode tests passed');
