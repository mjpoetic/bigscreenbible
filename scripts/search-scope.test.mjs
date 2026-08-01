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
    { code: "chapter", label: "Current chapter", shortLabel: "Ch" },
    { code: "ot", label: "Old Testament", shortLabel: "OT" },
    { code: "law", label: "Law", shortLabel: "Law" },
    { code: "history", label: "History", shortLabel: "His" },
    { code: "psalms", label: "Psalms", shortLabel: "Psa" },
    { code: "wisdom", label: "Wisdom", shortLabel: "Wis" },
    { code: "prophets", label: "Prophets", shortLabel: "Pro" },
    { code: "nt", label: "New Testament", shortLabel: "NT" },
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

const selectControls = [{ value: "all" }, { value: "all" }, { value: "all" }];
const shortLabels = [{ textContent: "All" }, { textContent: "All" }, { textContent: "All" }];
const titledControls = [{ title: "Search scope: All Bible" }, { title: "Search scope: All Bible" }, { title: "Search scope: All Bible" }];
const searchButton = {
  label: "Search All Bible",
  setAttribute(name, value) {
    assert.equal(name, "aria-label");
    this.label = value;
  },
};
context.state = { searchScope: "all", reference: "Matthew 11" };
context.localStorage = { setItem(key, value) { context.savedScope = [key, value]; } };
context.document = {
  querySelectorAll(selector) {
    if (selector === "[data-search-scope-select]") return selectControls;
    if (selector === "[data-search-scope-short]") return shortLabels;
    if (selector === "[data-search-scope-control]") return titledControls;
    return [];
  },
  getElementById(id) {
    return id === "studySearchButton" ? searchButton : null;
  },
};
vm.runInContext(`
  ${extractFunction("setSearchScope")}
  globalThis.setScope = setSearchScope;
`, context);
context.setScope("nt");
assert.equal(context.state.searchScope, "nt");
assert.deepEqual([...context.savedScope], ["lw_search_scope", "nt"]);
assert.deepEqual(selectControls.map((select) => select.value), ["nt", "nt", "nt"]);
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
assert.match(source, /id="studySearchScope" data-search-scope-select aria-label="Search scope"/);
assert.match(source, /id="topbarSearchScope" data-search-scope-select aria-label="Top search scope"/);
assert.match(source, /id="mobileFocusSearchScope" data-search-scope-select aria-label="Focus search scope"/);
assert.match(source, /class="topbar-search-scope-code" data-search-scope-short/);
assert.match(source, /class="mobile-focus-search-scope-code" data-search-scope-short/);
assert.match(source, /<option value="\$\{code\}"/);
assert.match(source, /law: books\.slice\(0, books\.indexOf\("Joshua"\)\)/);
assert.match(source, /history: books\.slice\(books\.indexOf\("Joshua"\), books\.indexOf\("Job"\)\)/);
assert.match(source, /prophets: books\.slice\(books\.indexOf\("Isaiah"\), books\.indexOf\("Matthew"\)\)/);
assert.match(source, /epistles: books\.slice\(books\.indexOf\("Romans"\), books\.indexOf\("Revelation"\)\)/);
assert.match(source, /localStorage\.setItem\("lw_search_scope", scope\)/);
assert.match(extractFunction("runPhraseSearch"), /searchResultsChapter = searchChapter/);
assert.match(extractFunction("runPhraseSearch"), /searchBible\(query, scope, searchChapter\)/);
assert.match(searchBible, /searchVersion\(version, criteria, scope, searchChapter\)/);
assert.match(searchBible, /searchRemoteVersions\(query, criteria, scope, searchChapter\)/);
assert.match(searchBible, /searchSemanticBible\(query, criteria, scope, searchChapter\)/);
assert.match(searchBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, searchChapter\)/);
assert.match(searchVersion, /chapterMatchesSearchScope\(chapterKey, scope, currentChapter\)/);
assert.match(searchRemoteVersion, /referenceMatchesSearchScope\(ref, scope, currentChapter\)/);
assert.match(searchSemanticBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope, currentChapter\)/);
assert.match(extractFunction("searchResultsMarkup"), /referenceMatchesSearchScope\(question\?\.reference, scope, searchChapter\)/);
assert.match(styles, /\.search-submit-control \{/);
assert.match(styles, /\.search-scope-menu select \{[\s\S]*?opacity: 0/);
assert.match(styles, /\.topbar-search-scope \{[\s\S]*?flex: 0 0 42px/);
assert.match(styles, /\.topbar-search-scope select \{[\s\S]*?opacity: 0/);
assert.match(styles, /\.mobile-focus-search-scope select \{[\s\S]*?opacity: 0/);

console.log("Search scope tests passed");
