import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const patterns = [`function ${name}(`, `async function ${name}(`];
  const start = patterns
    .map((pattern) => source.indexOf(pattern))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];
  assert.notEqual(start, undefined, `Missing ${name} in bible-app.js`);
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

const context = {};
// Exercise the search-to-reference route with the real navigation functions.
const navigation = {
  passageSearchInput: value => ({ reference: value, version: null }),
  state: {},
  searchRequestId: 0,
  bibleData: { "John 3": { verses: [{ n: 16 }, { n: 17 }] } },
  parseReference: () => true,
  parsePassageReference: (value) => ({
    key: "John 3", verse: 16, verses: value.includes("-17") ? [16, 17] : [16],
  }),
  normalizedSearchSource: () => "scripture",
  canFindInChapter: () => false,
  focusSearchPortrait: { matches: false },
  captureReaderReturnTarget: () => null,
  clearInlineChapterSearchState() {},
  recordHistory() {},
  updateShareUrl() {},
  render() {},
  document: { querySelector: () => null },
};
vm.createContext(navigation);
vm.runInContext(`
  ${extractFunction("setReferenceFromString")}
  ${extractFunction("gotoReference")}
  ${extractFunction("runReferenceOrPhraseSearch")}
  ${extractFunction("submitFocusReference")}
`, navigation);
for (const mode of ["big", "reader"]) {
  for (const origin of ["verse-of-day", "shared-passage", "ordinary"]) {
    for (const reference of ["John 3:16", "John 3:16-17"]) {
      navigation.state = {
        mode,
        isVerseOfDayActive: origin === "verse-of-day",
        sharedPassage: origin === "shared-passage" ? { verses: [4] } : null,
        presentationPart: 2,
        presentationSearchResultsOpen: true,
      };
      await navigation.runReferenceOrPhraseSearch(reference);
      assert.equal(navigation.state.mode, mode, `${origin} search must retain ${mode} mode`);
      assert.equal(navigation.state.isVerseOfDayActive, false);
      assert.equal(navigation.state.reference, "John 3");
      assert.equal(navigation.state.verse, 16);
      assert.equal(navigation.state.presentationPart, 0);
      assert.equal(navigation.state.presentationSearchResultsOpen, false);
      assert.equal(Boolean(navigation.state.sharedPassage), (mode === "reader" && origin !== "ordinary") || (mode === "big" && reference.includes("-17")));
      assert.deepEqual(Array.from(navigation.state.selectedVerses), reference.includes("-17") && (mode === "big" || origin === "ordinary") ? [16, 17] : []);
    }
  }
}
for (const mode of ["reader", "parallel"]) {
  for (const reference of ["John 3:16", "John 3:16-17", "John 3"]) {
    navigation.state = { mode, selectedVerses: [], sharedPassage: null };
    await navigation.runReferenceOrPhraseSearch(reference);
    assert.equal(navigation.state.mode, mode);
    assert.equal(navigation.state.pendingVerseHalo, reference.includes(":"), "Only specific verse searches spotlight the passage");
    assert.equal(navigation.state.pendingVerseFocus, true);
  }
}
for (const mode of ["reader", "parallel"]) {
  for (const reference of ["John 3:16", "John 3:16-17", "John 3"]) {
    navigation.state = { mode, focusMode: true, focusReferenceOpen: true, selectedVerses: [], sharedPassage: null };
    navigation.submitFocusReference(reference, { sourceInputId: "mobileFocusPassageInput" });
    assert.equal(navigation.state.focusMode, true, "Floating search retains Focus Mode");
    assert.equal(navigation.state.focusReferenceOpen, false);
    assert.equal(navigation.state.pendingVerseHalo, reference.includes(":"), "Floating Focus search spotlights specific verses and ranges");
    assert.equal(navigation.state.pendingVerseFocus, true);
  }
}
vm.createContext(context);
vm.runInContext(`
  const searchScopeDefinitions = [
    { code: "all", label: "All Bible", shortLabel: "All" },
    { code: "book", label: "Current book", shortLabel: "Bk" },
    { code: "chapter", label: "Current chapter", shortLabel: "Ch" },
    { code: "ot", label: "Old Testament", shortLabel: "OT" },
    { code: "nt", label: "New Testament", shortLabel: "NT" },
    { code: "law", label: "Law", shortLabel: "Law" },
    { code: "history", label: "History", shortLabel: "His" },
    { code: "psalms", label: "Psalms", shortLabel: "Psa" },
    { code: "wisdom", label: "Wisdom", shortLabel: "Wis" },
    { code: "prophets", label: "Prophets", shortLabel: "Pro" },
    { code: "gospels", label: "Gospels", shortLabel: "Gos" },
    { code: "acts", label: "Acts", shortLabel: "Act" },
    { code: "epistles", label: "Epistles", shortLabel: "Epi" },
    { code: "revelation", label: "Revelation", shortLabel: "Rev" },
  ];
  const searchScopeCodes = searchScopeDefinitions.map(({ code }) => code);
  const searchSourceCodes = ["scripture", "notes"];
  const oldTestamentBooks = ["Genesis", "Joshua", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Songs", "Isaiah", "Malachi"];
  const newTestamentBooks = ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Jude", "Revelation"];
  const books = [...oldTestamentBooks, ...newTestamentBooks];
  const searchScopeBookGroups = {
    law: ["Genesis"],
    history: ["Joshua"],
    psalms: ["Psalm"],
    wisdom: ["Job", "Proverbs", "Ecclesiastes", "Song of Songs"],
    prophets: ["Isaiah", "Malachi"],
    gospels: ["Matthew", "Mark", "Luke", "John"],
    acts: ["Acts"],
    epistles: ["Romans", "Jude"],
    revelation: ["Revelation"],
  };
  function parsePassageReference(value) {
    const match = String(value || "").match(/^(.+?)\\s+(\\d+)/);
    return match ? { key: match[1] + " " + match[2] } : null;
  }
  ${extractFunction("bookFromChapterKey")}
  ${extractFunction("normalizedSearchScope")}
  ${extractFunction("normalizedSearchChapter")}
  ${extractFunction("searchScopeLabel")}
  ${extractFunction("searchScopeShortLabel")}
  ${extractFunction("chapterMatchesSearchScope")}
  globalThis.scope = {
    normalize: normalizedSearchScope,
    label: searchScopeLabel,
    shortLabel: searchScopeShortLabel,
    matches: chapterMatchesSearchScope,
  };
`, context);

assert.equal(context.scope.normalize("ot"), "ot");
assert.equal(context.scope.normalize("NT"), "nt");
assert.equal(context.scope.normalize("unexpected"), "all");
assert.equal(context.scope.label("all"), "All Bible");
assert.equal(context.scope.label("ot"), "Old Testament");
assert.equal(context.scope.label("book", "Matthew 11:30"), "Current book (Matthew)");
assert.equal(context.scope.label("chapter", "Matthew 11:30"), "Current chapter (Matthew 11)");
assert.equal(context.scope.shortLabel("nt"), "NT");
assert.equal(context.scope.shortLabel("epistles"), "Epi");
assert.equal(context.scope.matches("Genesis 1", "ot"), true);
assert.equal(context.scope.matches("Genesis 1", "nt"), false);
assert.equal(context.scope.matches("Matthew 1", "nt"), true);
assert.equal(context.scope.matches("Matthew 1", "ot"), false);
assert.equal(context.scope.matches("Revelation 22", "all"), true);
assert.equal(context.scope.matches("Matthew 11", "chapter", "Matthew 11:30"), true);
assert.equal(context.scope.matches("Matthew 12", "chapter", "Matthew 11:30"), false);
assert.equal(context.scope.matches("Matthew 12", "book", "Matthew 11:30"), true);
assert.equal(context.scope.matches("Mark 1", "book", "Matthew 11:30"), false);
assert.equal(context.scope.matches("Genesis 1", "law"), true);
assert.equal(context.scope.matches("Joshua 1", "history"), true);
assert.equal(context.scope.matches("Psalm 23", "psalms"), true);
assert.equal(context.scope.matches("Proverbs 3", "wisdom"), true);
assert.equal(context.scope.matches("Isaiah 53", "prophets"), true);
assert.equal(context.scope.matches("John 3", "gospels"), true);
assert.equal(context.scope.matches("Acts 2", "acts"), true);
assert.equal(context.scope.matches("Romans 8", "epistles"), true);
assert.equal(context.scope.matches("Revelation 21", "revelation"), true);
assert.equal(context.scope.matches("Psalm 23", "wisdom"), false);

const scopeTriggers = ["topbarSearchScope", "studySearchScope", "mobileFocusSearchScope"].map((id) => ({
  id,
  dataset: {},
  label: "",
  setAttribute(name, value) {
    if (name === "aria-label") this.label = value;
  },
}));
const shortLabels = [{ textContent: "All" }, { textContent: "All" }, { textContent: "All" }];
const titledControls = [{ title: "Search scope: All Bible" }, { title: "Search scope: All Bible" }, { title: "Search scope: All Bible" }];
const searchButton = {
  label: "Search All Bible",
  setAttribute(name, value) {
    assert.equal(name, "aria-label");
    this.label = value;
  },
};
context.state = { searchSource: "scripture", searchScope: "all", reference: "Matthew 11", inlineSearchQuery: "" };
context.localStorage = { setItem(key, value) { context.savedScope = [key, value]; } };
context.renderPreservingReaderScroll = () => {};
context.updateInlineSearchProgress = () => {};
context.updateChapterFindDraft = () => {};
context.currentSearchInputDraft = () => "";
context.document = {
  querySelectorAll(selector) {
    if (selector === "[data-search-scope-trigger]") return scopeTriggers;
    if (selector === "[data-search-scope-short]") return shortLabels;
    if (selector === "[data-search-scope-control]") return titledControls;
    return [];
  },
  getElementById(id) {
    return id === "studySearchButton" ? searchButton : null;
  },
};
vm.runInContext(`
  ${extractFunction("normalizedSearchSource")}
  ${extractFunction("activeSearchSourceLabel")}
  ${extractFunction("activeSearchSourceShortLabel")}
  ${extractFunction("searchScopeTriggerLabel")}
  ${extractFunction("updateSearchSourceControls")}
  ${extractFunction("setSearchScope")}
  globalThis.setScope = setSearchScope;
`, context);
context.setScope("nt");
assert.equal(context.state.searchScope, "nt");
assert.equal(context.state.searchSource, "scripture");
assert.deepEqual([...context.savedScope], ["lw_search_scope", "nt"]);
assert.deepEqual(scopeTriggers.map((trigger) => trigger.dataset.searchScope), ["nt", "nt", "nt"]);
assert.deepEqual(scopeTriggers.map((trigger) => trigger.label), [
  "Choose top search source, current New Testament",
  "Choose search source, current New Testament",
  "Choose Focus search source, current New Testament",
]);
assert.deepEqual(shortLabels.map((label) => label.textContent), ["NT", "NT", "NT"]);
assert.deepEqual(titledControls.map((control) => control.title), ["Search in: New Testament", "Search in: New Testament", "Search in: New Testament"]);
assert.equal(searchButton.label, "Search New Testament");
context.setScope("chapter");
assert.deepEqual(shortLabels.map((label) => label.textContent), ["Ch", "Ch", "Ch"]);
assert.equal(searchButton.label, "Search Current chapter (Matthew 11)");

const searchTranslation = extractFunction("searchScriptureTranslation");
const searchVersion = extractFunction("searchVersion");
const searchRemoteVersion = extractFunction("searchRemoteVersion");
const searchSemanticBible = extractFunction("searchSemanticBible");
assert.match(extractFunction("searchScopeControls"), /data-search-scope-trigger/);
assert.doesNotMatch(extractFunction("searchPanel"), /<input|studySearchForm/);
assert.match(source, /id="topbarSearchScope" type="button" data-search-scope-trigger/);
assert.match(source, /id="mobileFocusSearchScope" type="button" data-search-scope-trigger/);
assert.match(source, /class="topbar-search-scope-code" data-search-scope-short/);
assert.match(source, /class="mobile-focus-search-scope-code" data-search-scope-short/);
assert.match(source, /data-search-scope-option="\$\{code\}"/);
assert.ok(source.indexOf('{ code: "nt"') > source.indexOf('{ code: "ot"'));
assert.ok(source.indexOf('{ code: "nt"') < source.indexOf('{ code: "law"'));
assert.match(source, /law: books\.slice\(0, books\.indexOf\("Joshua"\)\)/);
assert.match(source, /history: books\.slice\(books\.indexOf\("Joshua"\), books\.indexOf\("Job"\)\)/);
assert.match(source, /prophets: books\.slice\(books\.indexOf\("Isaiah"\), books\.indexOf\("Matthew"\)\)/);
assert.match(source, /epistles: books\.slice\(books\.indexOf\("Romans"\), books\.indexOf\("Revelation"\)\)/);
assert.match(source, /localStorage\.setItem\("lw_search_scope", scope\)/);
assert.match(extractFunction("runPhraseSearch"), /searchResultsChapter = searchChapter/);
assert.match(extractFunction("runPhraseSearch"), /searchScriptureTranslation\(search.version, search\)/);
assert.match(extractFunction("runPhraseSearch"), /scope === "chapter"/);
assert.match(extractFunction("runReferenceOrPhraseSearch"), /presentationResults: state\.mode === "big"/);
assert.match(extractFunction("runPhraseSearch"), /presentationResults = Boolean\(options\.presentationResults && state\.mode === "big"\)/);
assert.match(extractFunction("runPhraseSearch"), /scope === "chapter" && !presentationResults/);
assert.match(extractFunction("runPhraseSearch"), /else if \(presentationResults\)[\s\S]*?presentationSearchResultsOpen = true/);
assert.doesNotMatch(
  extractFunction("runPhraseSearch").match(/else if \(presentationResults\)([\s\S]*?)\n  \} else \{/)[1],
  /state\.mode\s*=/,
);
assert.match(extractFunction("runPhraseSearch"), /advanceInlineChapterSearch\(query, searchChapter\)/);
assert.match(extractFunction("runPhraseSearch"), /runInlineChapterSearch\(query, searchChapter\)/);
assert.match(extractFunction("presentation"), /presentationSearchResults\(\)/);
assert.match(extractFunction("presentationSearchResults"), /aria-label="Big Screen search results"/);
assert.match(extractFunction("gotoReference"), /presentationSearchResultsOpen = false/);
assert.match(extractFunction("searchClearControl"), /data-clear-search/);
assert.match(extractFunction("topbar"), /searchClearControl/);
assert.match(extractFunction("bindEvents"), /referenceInput[\s\S]*?addEventListener\("keydown"[\s\S]*?sourceInputId: "referenceInput"/);
assert.match(searchTranslation, /searchVersion\(version, criteria, scope, chapter\)/);
assert.match(searchTranslation, /searchRemoteVersion\(version, query, criteria, scope, chapter\)/);
assert.match(extractFunction("expandScriptureSearch"), /searchRemoteVersions\(query, criteria, scope, chapter, versions\)/);
assert.match(extractFunction("loadScriptureMeaningMatches"), /searchSemanticBible\(query, criteria, scope, chapter\)/);
assert.match(extractFunction("rankScriptureMatches"), /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, chapter\)/);
assert.match(searchVersion, /chapterMatchesSearchScope\(chapterKey, scope, currentChapter\)/);
assert.match(searchRemoteVersion, /referenceMatchesSearchScope\(ref, scope, currentChapter\)/);
assert.match(searchSemanticBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, currentChapter\)/);
assert.match(extractFunction("searchResultsMarkup"), /referenceMatchesSearchScope\(question\?\.reference, scope, searchChapter\)/);
assert.match(styles, /\.search-submit-control \{/);
assert.match(styles, /\.topbar-search-scope \{[\s\S]*?flex: 0 0 42px/);
assert.match(styles, /\.search-scope-popover \{[\s\S]*?position: fixed/);
assert.match(styles, /\.search-scope-option \{/);
assert.match(styles, /\.scripture mark\.inline-search-hit \{/);
assert.match(styles, /\.topbar-search-clear \{/);
assert.match(styles, /\.mobile-focus-inline-search-clear \{/);
assert.match(styles, /\.inline-search-clear-control \{/);
assert.match(styles, /#presentation \.presentation-search-results \{[\s\S]*?display: grid;/);
assert.match(styles, /\.mobile-focus-search-results \.empty-state \{[\s\S]*?color: var\(--muted\);/);
assert.match(styles, /#searchSection \.study-search \{[\s\S]*?position: sticky;[\s\S]*?top: 0;/);
assert.match(styles, /\.library #searchSection \{[\s\S]*?overflow: visible;/);
assert.match(styles, /#searchSection \.study-search::before \{[\s\S]*?background:/);

const inlineContext = {
  state: { inlineSearchQuery: "rest", inlineSearchHitIndex: 1, inlineSearchMatchCount: 2, reference: "Acts 14" },
  activeInlineSearchQuery: () => inlineContext.state.inlineSearchQuery,
  normalizedSearchChapter: (value) => value,
  scrollInlineSearchHitIntoView: (index) => { inlineContext.state.inlineSearchHitIndex = index; },
};
vm.createContext(inlineContext);
vm.runInContext(`
  ${extractFunction("escapeRegExp")}
  ${extractFunction("chapterFindRanges")}
  ${extractFunction("advanceInlineChapterSearch")}
  ${extractFunction("moveChapterFind")}
`, inlineContext);
const nltVerse = "But the apostles stayed there a long time, preaching boldly about the grace of the Lord.";
const phraseRanges = inlineContext.chapterFindRanges(nltVerse, "but the apostles");
assert.equal(phraseRanges.length, 1);
assert.equal(nltVerse.slice(phraseRanges[0].start, phraseRanges[0].end), "But the apostles");
assert.equal(inlineContext.chapterFindRanges("Rest, rest, and rested.", "rest").length, 3);
assert.equal(inlineContext.chapterFindRanges("But the apostles", "the apos").length, 1);
assert.equal(inlineContext.chapterFindRanges("But the apostles", "but.and").length, 0);
assert.equal(inlineContext.advanceInlineChapterSearch("rest", "Acts 14"), true);
assert.equal(inlineContext.state.inlineSearchHitIndex, 0, "Forward navigation wraps to the first match");
inlineContext.moveChapterFind(-1);
assert.equal(inlineContext.state.inlineSearchHitIndex, 1, "Backward navigation wraps to the last match");
assert.equal(inlineContext.advanceInlineChapterSearch("rest", "Acts 15"), false);

const onlineChapterContext = {
  window: {},
  isBundledTranslation: () => false,
  isRemoteTranslation: () => true,
  translationProvider: () => ({}),
  ensureRemoteBibleVersion: (version, chapter) => {
    assert.equal(version, "NLT");
    assert.equal(chapter, "Acts 14");
    return { verses: [{ n: 2, text: "Some of the Jews" }, { n: 3, text: nltVerse }] };
  },
  scoreSearchText: (text) => text === nltVerse ? { score: 100, matchType: "Phrase" } : null,
  searchRemoteVersion: () => { throw new Error("Chapter search must not use the whole-Bible endpoint"); },
};
vm.createContext(onlineChapterContext);
vm.runInContext(searchTranslation, onlineChapterContext);
const nltMatches = await onlineChapterContext.searchScriptureTranslation("NLT", {
  query: "but the apostles", criteria: {}, scope: "chapter", chapter: "Acts 14",
});
assert.equal(nltMatches.length, 1);
assert.equal(nltMatches[0].ref, "Acts 14:3");

const rankingContext = {
  state: { versions: ["ESV"] },
  translationCodes: ["BSB", "ESV", "KJV"],
};
vm.createContext(rankingContext);
vm.runInContext(`
  function uniqueList(values) { return [...new Set(values)]; }
  function isRemoteTranslation() { return false; }
  ${extractFunction("balanceResultGroup")}
  ${extractFunction("balancedSearchResults")}
  globalThis.balance = balancedSearchResults;
`, rankingContext);
const exactRanked = rankingContext.balance([
  { ref: "John 3:16", version: "BSB", matchType: "Phrase" },
  { ref: "John 3:16", version: "ESV", matchType: "Phrase" },
], "ESV");
assert.deepEqual([...exactRanked].map((result) => result.version), ["ESV", "BSB"]);
const nonExactRanked = rankingContext.balance([
  { ref: "John 3:16", version: "ESV", matchType: "Words" },
  { ref: "John 3:16", version: "BSB", matchType: "Words" },
], "ESV");
assert.deepEqual([...nonExactRanked].map((result) => result.version), ["BSB", "ESV"]);

vm.runInContext(`
  ${extractFunction("searchReferenceParts")}
  ${extractFunction("groupSearchResults")}
`, rankingContext);
const grouped = rankingContext.groupSearchResults([
  { ref: "John 3:16", version: "BSB", score: 120 },
  { ref: "John 3:16", version: "ESV", score: 100 },
  { ref: "John 3:16", version: "ESV", score: 90 },
  { ref: "John 3:17", version: "KJV", score: 110 },
  { ref: "John 3:17", version: "BSB", score: 80 },
  { ref: "John 3:18–19", version: "KJV", score: 70 },
  { ref: "John 3:18-19", version: "BSB", score: 60 },
], "ESV");
assert.equal(grouped.length, 3, "One result per unique verse or passage");
assert.equal(grouped[0].version, "ESV", "Prefer the selected version when it matches");
assert.equal(grouped[0].matches.length, 2, "Keep one match per translation");
assert.equal(grouped[0].score, 100, "Retain the best evidence per translation");
assert.equal(grouped[1].version, "KJV", "Fall back to the closest scored match");
assert.equal(grouped[2].matches.length, 2, "Normalize passage range separators");
const many = Array.from({ length: 45 }, (_, index) => ["ESV", "BSB", "KJV"].map((version) => ({
  ref: `Psalm 119:${index + 1}`, version, score: 100 - index,
}))).flat();
const limited = rankingContext.groupSearchResults(many, "ESV").slice(0, 40);
assert.equal(limited.length, 40, "Limit unique verses rather than translation rows");
assert.ok(limited.every((result) => result.matches.length === 3));

console.log("Search scope tests passed");

navigation.translations = [{ code: "KJV", name: "King James Version" }];
navigation.setPrimaryVersion = version => { navigation.state.versions = [version]; };
vm.runInContext(`${extractFunction("escapeRegExp")}\n${extractFunction("passageSearchInput")}`, navigation);
for (const mode of ["reader", "parallel", "big", "focus"]) {
  navigation.state = { mode: mode === "focus" ? "reader" : mode, focusMode: mode === "focus", versions: ["BSB"] };
  await navigation.runReferenceOrPhraseSearch("John 3:16 KJV");
  assert.equal(navigation.state.versions[0], "KJV");
  assert.equal(navigation.state.reference, "John 3");
  assert.equal(navigation.state.verse, 16);
  assert.equal(navigation.state.mode, mode === "focus" ? "reader" : mode);
}
console.log("Version-and-passage navigation passed across all reading modes");

// Opening Search must focus synchronously after rendering, including compact screens.
for (const compact of [false, true]) {
  const calls = [];
  const workspace = vm.createContext({
    state: { libraryOpen: false, searchQuery: "", searchResultsQuery: "love" },
    isCompactScreen: () => compact, isShortLandscapeScreen: () => compact,
    savedLibraryScroll: () => null, localStorage: { setItem() {} },
    scheduleCloudSync() {}, renderPreservingReaderScroll() { calls.push("render"); },
    focusWorkspaceTarget(target) { calls.push(`focus:${target}`); },
  });
  vm.runInContext(extractFunction("activateWorkspace"), workspace);
  workspace.activateWorkspace("Search");
  assert.deepEqual(calls, ["render", "focus:Search"]);
  assert.equal(workspace.state.pendingPanelFocus, null);
  assert.equal(workspace.state.portraitSearchCollapsed, false);
  assert.equal(workspace.state.searchQuery, "love");
}
console.log("Search button focuses the field synchronously across screen sizes");

const translationCalls = [];
let finishMeaningSearch;
const progressiveSearch = vm.createContext({
  searchRequestId: 0,
  state: { versions: ["BSB"], mode: "reader" },
  translationCodes: ["BSB", "KJV", "ESV"],
  normalizedSearchSource: () => "scripture",
  normalizedSearchScope: (scope) => scope,
  normalizedSearchChapter: (chapter) => chapter,
  parseSearchQuery: (query) => ({ tokens: [query], questionAnalysis: { isTopical: query.endsWith("?") } }),
  clearInlineChapterSearchState() {},
  localStorage: { setItem() {} },
  render() {},
  renderScriptureSearch() {},
  rankScriptureMatches: (matches) => matches,
  isBundledTranslation: (version) => version !== "ESV",
  loadBibleVersion: async (version) => { translationCalls.push(version); },
  searchVersion: (version, { tokens }, scope, chapter) => [{ version, query: tokens[0], scope, chapter }],
  searchRemoteVersions: async (query, criteria, scope, chapter, candidates) => {
    return candidates.filter((version) => version === "ESV").map((version) => {
      translationCalls.push(version);
      return { version, query, scope, chapter };
    });
  },
  searchSemanticBible: () => new Promise((resolve) => { finishMeaningSearch = resolve; }),
});
vm.runInContext([
  "runPhraseSearch", "searchScriptureTranslation", "loadScriptureMeaningMatches", "expandScriptureSearch",
].map(extractFunction).join("\n"), progressiveSearch);
await progressiveSearch.runPhraseSearch("What about wisdom?", { scope: "book", chapter: "Proverbs 1" });
assert.deepEqual(translationCalls, ["BSB"]);
assert.equal(progressiveSearch.state.searchPending, false);
assert.equal(progressiveSearch.state.scriptureSearch.meaningPending, true);
assert.equal(progressiveSearch.state.searchResults[0].version, "BSB");

await progressiveSearch.expandScriptureSearch();
assert.deepEqual(translationCalls, ["BSB", "KJV", "ESV"]);
assert.equal(progressiveSearch.state.scriptureSearch.expanded, true);
assert.ok(progressiveSearch.state.searchResults.every(({ query, scope, chapter }) =>
  query === "What about wisdom?" && scope === "book" && chapter === "Proverbs 1"));
const textResults = progressiveSearch.state.searchResults;
finishMeaningSearch([{ version: "WEB", matchType: "Meaning match" }]);
await new Promise(setImmediate);
assert.equal(progressiveSearch.state.scriptureSearch.meaningResults.length, 1);
assert.equal(progressiveSearch.state.searchResults, textResults);

await progressiveSearch.runPhraseSearch("love one another", { scope: "all", chapter: "John 13" });
assert.equal(progressiveSearch.state.scriptureSearch.meaningPending, false);
assert.deepEqual(translationCalls, ["BSB", "KJV", "ESV", "BSB"]);
console.log("Current-translation results, independent meaning matches, and scoped expansion passed");
