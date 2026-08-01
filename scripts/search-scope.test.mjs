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
context.state = { searchScope: "all", reference: "Matthew 11", inlineSearchQuery: "" };
context.localStorage = { setItem(key, value) { context.savedScope = [key, value]; } };
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
  ${extractFunction("searchScopeTriggerLabel")}
  ${extractFunction("setSearchScope")}
  globalThis.setScope = setSearchScope;
`, context);
context.setScope("nt");
assert.equal(context.state.searchScope, "nt");
assert.deepEqual([...context.savedScope], ["lw_search_scope", "nt"]);
assert.deepEqual(scopeTriggers.map((trigger) => trigger.dataset.searchScope), ["nt", "nt", "nt"]);
assert.deepEqual(scopeTriggers.map((trigger) => trigger.label), [
  "Choose top search scope, current New Testament",
  "Choose search scope, current New Testament",
  "Choose Focus search scope, current New Testament",
]);
assert.deepEqual(shortLabels.map((label) => label.textContent), ["NT", "NT", "NT"]);
assert.deepEqual(titledControls.map((control) => control.title), ["Search scope: New Testament", "Search scope: New Testament", "Search scope: New Testament"]);
assert.equal(searchButton.label, "Search New Testament");
context.setScope("chapter");
assert.deepEqual(shortLabels.map((label) => label.textContent), ["Ch", "Ch", "Ch"]);
assert.equal(searchButton.label, "Search Current chapter (Matthew 11)");

const searchBible = extractFunction("searchBible");
const searchVersion = extractFunction("searchVersion");
const searchRemoteVersion = extractFunction("searchRemoteVersion");
const searchSemanticBible = extractFunction("searchSemanticBible");
assert.match(source, /id="studySearchScope" type="button" data-search-scope-trigger/);
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
assert.match(extractFunction("runPhraseSearch"), /searchBible\(query, scope, searchChapter\)/);
assert.match(extractFunction("runPhraseSearch"), /scope === "chapter"/);
assert.match(extractFunction("runPhraseSearch"), /advanceInlineChapterSearch\(query, searchChapter\)/);
assert.match(extractFunction("runPhraseSearch"), /runInlineChapterSearch\(query, searchChapter\)/);
assert.match(extractFunction("advanceInlineChapterSearch"), /No more matches in \$\{searchChapter\}/);
assert.match(searchBible, /searchVersion\(version, criteria, scope, searchChapter\)/);
assert.match(searchBible, /searchRemoteVersions\(query, criteria, scope, searchChapter\)/);
assert.match(searchBible, /searchSemanticBible\(query, criteria, scope, searchChapter\)/);
assert.match(searchBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, searchChapter\)/);
assert.match(searchVersion, /chapterMatchesSearchScope\(chapterKey, scope, currentChapter\)/);
assert.match(searchRemoteVersion, /referenceMatchesSearchScope\(ref, scope, currentChapter\)/);
assert.match(searchSemanticBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, currentChapter\)/);
assert.match(extractFunction("searchResultsMarkup"), /referenceMatchesSearchScope\(question\?\.reference, scope, searchChapter\)/);
assert.match(styles, /\.search-submit-control \{/);
assert.match(styles, /\.topbar-search-scope \{[\s\S]*?flex: 0 0 42px/);
assert.match(styles, /\.search-scope-popover \{[\s\S]*?position: fixed/);
assert.match(styles, /\.search-scope-option \{/);
assert.match(styles, /\.scripture mark\.inline-search-hit \{/);

const inlineContext = { window: {} };
vm.createContext(inlineContext);
vm.runInContext(`
  function uniqueList(values) { return [...new Set(values)]; }
  ${extractFunction("escapeRegExp")}
  ${extractFunction("normalizeSearchText")}
  ${extractFunction("searchTokens")}
  ${extractFunction("levenshteinDistance")}
  ${extractFunction("wordsCloseEnough")}
  ${extractFunction("parseSearchQuery")}
  ${extractFunction("inlineSearchRangesForText")}
  globalThis.inlineRanges = inlineSearchRangesForText;
`, inlineContext);
const phraseText = "Come to Me, all you who are weary and burdened.";
const phraseRanges = inlineContext.inlineRanges(phraseText, "come to me");
assert.equal(phraseRanges.length, 1);
assert.equal(phraseText.slice(phraseRanges[0].start, phraseRanges[0].end), "Come to Me");
const wordRanges = inlineContext.inlineRanges(phraseText, "weary burden");
assert.deepEqual([...wordRanges].map((range) => phraseText.slice(range.start, range.end)), ["weary", "burdened"]);
assert.deepEqual([...inlineContext.inlineRanges(phraseText, "missing phrase", true)], []);

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

console.log("Search scope tests passed");
