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

const getVerseTextSource = extractFunction("getVerseText");
assert.doesNotMatch(getVerseTextSource, /return `Loading \$\{/);
assert.match(getVerseTextSource, /loadingVersions\.has\(loadKey\)\) return ""/);
assert.match(getVerseTextSource, /loadingVersions\.has\(version\)\) return ""/);

const readerSource = extractFunction("reader");
assert.match(readerSource, /\["reader", "parallel"\]\.includes\(state\.mode\)[\s\S]*activeBibleVersionLoadingState\(\)/);
assert.match(readerSource, /bibleVersionLoadingIndicator\(versionLoadingState\)/);
assert.match(readerSource, /versionLoadingState \? bibleVersionLoadingIndicator[\s\S]*: chapterChangeIndicator/);

const presentationSource = extractFunction("presentation");
assert.match(presentationSource, /state\.mode === "big"[\s\S]*activeBibleVersionLoadingState\(\[version\]\)/);
assert.match(presentationSource, /bible-version-loading/);
assert.match(presentationSource, /bibleVersionLoadingIndicator\(versionLoadingState\)/);

assert.match(extractFunction("setPrimaryVersion"), /loadBibleVersionInline\(version\)/);
assert.match(extractFunction("setPrimaryVersion"), /state\.presentationSettingsOpen = false[\s\S]*loadBibleVersionInline\(version\)/);
assert.match(extractFunction("setPrimaryVersion"), /remoteVersionErrors\.delete\(remoteVersionLoadKey\(version, state\.reference\)\)/);
assert.match(extractFunction("setParallelVersionAt"), /loadBibleVersionInline\(version\)/);
assert.match(extractFunction("setParallelVersionAt"), /remoteVersionErrors\.delete\(remoteVersionLoadKey\(version, state\.reference\)\)/);
assert.match(extractFunction("loadBibleVersionInline"), /renderPreservingReaderScroll\(\)/);
assert.match(extractFunction("ensureRemoteBibleVersion"), /remoteVersionErrors\.has\(loadKey\)/);

const context = {
  state: { reference: "Revelation 1" },
  loadingVersions: new Set(["NIRV:Revelation 1"]),
  translationLookup: {
    NIRV: { displayCode: "NIrV", name: "New International Reader's Version" },
  },
  activeVersions: () => ["NIRV"],
  uniqueList: (items) => [...new Set(items)],
  isRemoteTranslation: (version) => version === "NIRV",
  remoteVersionLoadKey: (version, reference) => `${version}:${reference}`,
  translationDisplayCode: (version) => context.translationLookup[version]?.displayCode || version,
  escapeHtml: (value) => String(value),
  icons: { book: "<svg></svg>" },
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("activeBibleVersionLoadingState")}
  ${extractFunction("bibleVersionLoadingIndicator")}
  globalThis.loadingState = activeBibleVersionLoadingState();
  globalThis.loadingMarkup = bibleVersionLoadingIndicator(globalThis.loadingState);
`, context);

assert.deepEqual(Array.from(context.loadingState.versions), ["NIRV"]);
assert.deepEqual(Array.from(context.loadingState.displayCodes), ["NIrV"]);
assert.match(context.loadingMarkup, /role="status"/);
assert.match(context.loadingMarkup, /aria-live="polite"/);
assert.match(context.loadingMarkup, /Loading NIrV/);
assert.match(context.loadingMarkup, /Please wait/);
assert.equal((context.loadingMarkup.match(/bible-version-loading-indicator/g) || []).length, 1);

assert.match(styles, /\.bible-version-loading-indicator \{/);
assert.match(styles, /\.bible-version-loading-halo::after \{/);
assert.match(styles, /animation: bible-version-loading-spin 900ms linear infinite/);
assert.match(styles, /\.scripture\.bible-version-loading > \*/);
assert.match(styles, /\.presentation\.bible-version-loading \.presentation-passage/);

console.log("Bible version loading tests passed");
