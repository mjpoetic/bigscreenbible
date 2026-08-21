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

const context = {
  state: {
    notes: {
      "John 3:16": "The heart of the Gospel and God's love.",
      "Psalm 23:1": "Use this passage for the comfort service.",
      "Romans 8:28": "A reminder about purpose in difficulty.",
    },
  },
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("normalizeSearchText")}
  function savedNoteItems() {
    return Object.entries(state.notes).map(([ref, note]) => ({ ref, note }));
  }
  ${extractFunction("normalizedNoteSearchQuery")}
  ${extractFunction("noteMatchesSearchQuery")}
  ${extractFunction("filteredSavedNoteItems")}
  ${extractFunction("searchSavedNotes")}
  globalThis.noteSearch = searchSavedNotes;
  globalThis.filterNotes = filteredSavedNoteItems;
`, context);

assert.deepEqual(
  [...context.noteSearch("gospel love")].map(({ ref }) => ref),
  ["John 3:16"],
  "Note search should match all content tokens",
);
assert.deepEqual(
  [...context.noteSearch("psalm 23")].map(({ ref }) => ref),
  ["Psalm 23:1"],
  "Note search should match Scripture references, including one-digit chapters",
);
assert.deepEqual(
  [...context.noteSearch("service comfort")].map(({ ref }) => ref),
  ["Psalm 23:1"],
  "Note search should not depend on token order",
);
assert.equal(context.noteSearch("missing").length, 0);
assert.equal(context.filterNotes("").length, 3);

const runPhraseSearch = extractFunction("runPhraseSearch");
assert.match(source, /id="notesFilterInput"[^>]*placeholder="Search saved notes"/);
assert.match(source, /id="clearNotesFilter"/);
assert.match(source, /data-search-source-option="notes"/);
assert.match(source, /<span>My Notes<\/span>/);
assert.match(source, /function noteSearchAvailable\(\)[\s\S]*?\["reader", "parallel"\]/);
assert.match(runPhraseSearch, /if \(source === "notes"\)/);
assert.match(runPhraseSearch, /state\.searchResults = searchSavedNotes\(query\)/);
assert.match(runPhraseSearch, /state\.searchResultsSource = "notes"/);
assert.match(extractFunction("runReferenceOrPhraseSearch"), /if \(parseReference\(cleaned\)\)[\s\S]*?gotoReference\(cleaned\)/);
assert.match(extractFunction("searchResultsMarkup"), /noteSearchResultsMarkup\(query\)/);
assert.match(extractFunction("noteSearchResultsMarkup"), /data-edit-note=/);
assert.match(extractFunction("noteSearchResultsMarkup"), /data-goto=/);
assert.match(extractFunction("updateNotesFilterDom"), /item\.hidden = active && !matchingRefs\.has/);
assert.match(extractFunction("updateNotesFilterDom"), /details\.dataset\.notesFilterManaged = "true"/);
assert.match(extractFunction("updateNotesFilterDom"), /notesShelf\.open = true/);
assert.match(extractFunction("updateNotesFilterDom"), /highlightsShelf\.open = false/);
const noteFilterInputBinding = source.match(/document\.getElementById\("notesFilterInput"\)\?\.addEventListener\("input",[\s\S]*?\n  \}\);/)?.[0] || "";
assert.match(noteFilterInputBinding, /updateNotesFilterDom\(event\.currentTarget\.value\)/);
assert.doesNotMatch(noteFilterInputBinding, /render/);
assert.doesNotMatch(source, /pendingNoteFilterFocus/);
assert.match(styles, /\.notes-filter-control \{/);
assert.match(styles, /\.note-search-result \{/);
assert.match(styles, /\.search-scope-divider \{/);

console.log("Note search tests passed");
