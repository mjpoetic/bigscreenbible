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
  const searchScopeCodes = ["all", "ot", "nt"];
  const oldTestamentBooks = ["Genesis", "Malachi"];
  const newTestamentBooks = ["Matthew", "Revelation"];
  const books = [...oldTestamentBooks, ...newTestamentBooks];
  ${extractFunction("bookFromChapterKey")}
  ${extractFunction("normalizedSearchScope")}
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
assert.equal(context.scope.shortLabel("nt"), "NT");
assert.equal(context.scope.matches("Genesis 1", "ot"), true);
assert.equal(context.scope.matches("Genesis 1", "nt"), false);
assert.equal(context.scope.matches("Matthew 1", "nt"), true);
assert.equal(context.scope.matches("Matthew 1", "ot"), false);
assert.equal(context.scope.matches("Revelation 22", "all"), true);

const selectControls = [{ value: "all" }, { value: "all" }];
const shortLabels = [{ textContent: "All" }, { textContent: "All" }];
const titledControls = [{ title: "Search scope: All Bible" }, { title: "Search scope: All Bible" }];
const searchButton = {
  label: "Search All Bible",
  setAttribute(name, value) {
    assert.equal(name, "aria-label");
    this.label = value;
  },
};
context.state = { searchScope: "all" };
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
assert.deepEqual(selectControls.map((select) => select.value), ["nt", "nt"]);
assert.deepEqual(shortLabels.map((label) => label.textContent), ["NT", "NT"]);
assert.deepEqual(titledControls.map((control) => control.title), ["Search scope: New Testament", "Search scope: New Testament"]);
assert.equal(searchButton.label, "Search New Testament");

const searchBible = extractFunction("searchBible");
const searchVersion = extractFunction("searchVersion");
const searchRemoteVersion = extractFunction("searchRemoteVersion");
const searchSemanticBible = extractFunction("searchSemanticBible");
assert.match(source, /id="studySearchScope" data-search-scope-select aria-label="Search scope"/);
assert.match(source, /id="topbarSearchScope" data-search-scope-select aria-label="Top search scope"/);
assert.match(source, /class="topbar-search-scope-code" data-search-scope-short/);
assert.match(source, /<option value="\$\{code\}"/);
assert.match(source, /localStorage\.setItem\("lw_search_scope", scope\)/);
assert.match(searchBible, /searchVersion\(version, criteria, scope\)/);
assert.match(searchBible, /searchRemoteVersions\(query, criteria, scope\)/);
assert.match(searchBible, /searchSemanticBible\(query, criteria, scope\)/);
assert.match(searchBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope\)/);
assert.match(searchVersion, /chapterMatchesSearchScope\(chapterKey, scope\)/);
assert.match(searchRemoteVersion, /referenceMatchesSearchScope\(ref, scope\)/);
assert.match(searchSemanticBible, /referenceMatchesSearchScope\(result\.goto \|\| result\.ref, scope\)/);
assert.match(extractFunction("searchResultsMarkup"), /referenceMatchesSearchScope\(question\?\.reference, scope\)/);
assert.match(styles, /\.search-submit-control \{/);
assert.match(styles, /\.search-scope-menu select \{[\s\S]*?opacity: 0/);
assert.match(styles, /\.topbar-search-scope \{[\s\S]*?flex: 0 0 42px/);
assert.match(styles, /\.topbar-search-scope select \{[\s\S]*?opacity: 0/);

console.log("Search scope tests passed");
