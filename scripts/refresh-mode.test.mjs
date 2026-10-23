import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('function rememberRefreshMode()'), source.indexOf('function requestedVersionFromUrl()'));
for (const mode of ['reader', 'parallel', 'big', 'trivia']) {
  let saved;
  const context = {
    state: { mode, triviaGameType: 'crossword', reference: 'John 3', verse: 16 },
    URLSearchParams,
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
  context.window.location = { search: '?ref=Psalm+23%3A1&nativeLink=1' };
  context.window.performance.getEntriesByType = () => [{ type: 'reload' }];
  assert.equal(context.refreshModeFromSession(), null, 'Incoming native passage must override a saved session on reload');
  context.state = { mode: 'big', startupApplied: false };
  context.setReferenceFromString = ref => { context.state.reference = ref; return true; };
  context.sharedVersesFromUrl = () => [];
  context.parsePassageReference = () => ({ verses: [1] });
  context.applySharedVersionFromUrl = async () => {};
  await context.applyStartupExperience();
  assert.equal(context.state.reference, 'Psalm 23:1');
  assert.equal(context.state.mode, mode === 'parallel' ? 'parallel' : 'reader');
  if (mode === 'parallel') {
    assert.equal(context.state.sharedPassage, null);
    assert.deepEqual([...context.state.selectedVerses], [1]);
    assert.equal(context.state.pendingVerseFocus, true);
  } else {
    assert.deepEqual([...context.state.sharedPassage.verses], [1]);
  }
  context.window.location.search = '';
  saved = '{bad';
  context.window.performance.getEntriesByType = () => [{ type: 'reload' }];
  assert.equal(context.refreshModeFromSession(), null);
}
console.log('Refresh mode tests passed');

// Direct mode links override startup preferences, including restored focused views.
const modeParser = source.slice(source.indexOf('function requestedModeFromUrl()'), source.indexOf('\nfunction gameChallengeNotificationDestination('));
for (const mode of ['reader', 'parallel', 'trivia', 'memorize', 'vod', 'verseoftheday', '']) {
  for (const navigation of ['navigate', 'reload', 'update']) {
    let vodFetches = 0;
    const context = {
      URLSearchParams,
      state: {
        mode: 'big', reference: 'John 3', verse: 16, versions: ['BSB', 'KJV'],
        startVerseOfDay: true, startBigScreen: true, isVerseOfDayActive: true,
        sharedPassage: { verses: [16] }, tutorialIntroVisible: true,
      },
      window: {
        location: { search: mode ? `?mode=${mode}` : '' },
        performance: { getEntriesByType: () => [{ type: navigation }] },
      },
      sessionStorage: { getItem: () => JSON.stringify({ mode: mode || 'big', reference: 'John 3', verse: 16 }) },
      bibleData: { 'John 3': {} }, currentChapter: () => ({ verses: [{ n: 16 }] }),
      sharedReferenceFromUrl: () => '', sharedVersesFromUrl: () => [],
      isCompactScreen: () => false,
      resolvedVerseOfDay: async () => { vodFetches++; return { reference: 'Psalm 23:1', item: { reference: 'Psalm 23:1' } }; },
      setReferenceFromString: ref => { context.state.reference = ref; context.state.isVerseOfDayActive = false; return true; },
    };
    vm.createContext(context);
    vm.runInContext(`${helpers}\n${modeParser}`, context);
    await context.applyStartupExperience({ updateReload: navigation === 'update' });
    if (['vod', 'verseoftheday'].includes(mode)) {
      assert.equal(vodFetches, 1, `${mode} loads VOD on ${navigation}`);
      assert.equal(context.state.mode, 'reader');
      assert.equal(context.state.reference, 'Psalm 23:1');
      assert.equal(context.state.isVerseOfDayActive, true);
      assert.equal(context.state.sharedPassage, null);
    } else if (mode) {
      assert.equal(vodFetches, 0, `${mode} bypasses VOD on ${navigation}`);
      assert.equal(context.state.mode, mode);
      assert.equal(context.state.isVerseOfDayActive, false);
      assert.equal(context.state.sharedPassage, null);
      assert.equal(context.state.reference, 'John 3');
    } else if (navigation === 'navigate') {
      assert.equal(vodFetches, 1, 'Ordinary startup keeps the VOD preference');
      assert.equal(context.state.isVerseOfDayActive, true);
    }
  }
}
console.log('Direct modes override VOD startup; explicit VOD links open the daily verse');
