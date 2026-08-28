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

const shareCalls = [];
const copiedText = [];
const context = {
  URL,
  document: {
    querySelector(selector) {
      assert.equal(selector, 'link[rel="canonical"]');
      return { href: "https://bigscreenbible.com/" };
    },
  },
  navigator: {
    async share(payload) {
      shareCalls.push(payload);
    },
  },
  state: {
    isVerseOfDayActive: false,
    mode: "reader",
    passageShareFormat: "quotation",
    reference: "John 3",
    selectedVerses: [16, 17],
    verse: 16,
    verseOfDayItem: null,
    versions: ["NASB2020"],
  },
  verseOfDayTranslationCode: "NIV",
  translationDisplayCode(version) {
    return version === "NASB2020" ? "NASB" : version;
  },
  currentChapter() {
    return {
      verses: [
        { n: 16, text: "For God so loved the world." },
        { n: 17, text: "For God did not send his Son to condemn the world." },
      ],
    };
  },
  getVerseText(verse) {
    return verse.text;
  },
  async copyText(text) {
    copiedText.push(text);
  },
  showToast() {},
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("selectedVerseNumbers")}
  ${extractFunction("passageLines")}
  ${extractFunction("verseRangeParam")}
  ${extractFunction("formatReferenceLabel")}
  ${extractFunction("passageShareUrl")}
  ${extractFunction("passageVersion")}
  ${extractFunction("formattedPassageText")}
  ${extractFunction("passageText")}
  ${extractFunction("passageShareText")}
  ${extractFunction("sharePassage")}
  ${extractFunction("shareSelectedPassage")}
  ${extractFunction("sharePresentationPassage")}
  globalThis.copyTextValue = passageText;
  globalThis.shareText = passageShareText;
  globalThis.share = shareSelectedPassage;
  globalThis.sharePresentation = sharePresentationPassage;
`, context);

const expected = [
  "“16. For God so loved the world.",
  "17. For God did not send his Son to condemn the world.”",
  "— John 3:16-17 (NASB)",
  "",
  "https://bigscreenbible.com/?ref=John+3%3A16&verses=16-17&mode=reader&version=NASB2020",
].join("\n");

assert.equal(context.shareText([16, 17]), expected);
assert.equal(
  context.copyTextValue([16, 17]),
  expected.split("\n\n")[0],
  "Copied Bible text should end with its reference instead of starting with it",
);
await context.share();
assert.equal(shareCalls.length, 1);
assert.deepEqual(Object.keys(shareCalls[0]), ["text"], "Web Share should receive one composed text field");
assert.equal(shareCalls[0].text, expected);
assert.deepEqual(copiedText, [], "Successful native sharing should not copy a fallback payload");

delete context.navigator.share;
await context.share();
assert.deepEqual(copiedText, [expected], "The clipboard fallback should use the same complete payload");

context.state.passageShareFormat = "plain";
assert.equal(
  context.copyTextValue([16]),
  ["For God so loved the world.", "John 3:16 (NASB)"].join("\n"),
);

context.state.passageShareFormat = "compact";
assert.equal(
  context.copyTextValue([16, 17]),
  "“16. For God so loved the world. 17. For God did not send his Son to condemn the world.” — John 3:16-17 (NASB)",
);

context.state.passageShareFormat = "quotation";
context.state.selectedVerses = [16];
context.state.verse = 17;
context.state.mode = "big";
await context.sharePresentation();
assert.equal(
  copiedText.at(-1),
  [
    "“For God did not send his Son to condemn the world.”",
    "— John 3:17 (NASB)",
    "",
    "https://bigscreenbible.com/?ref=John+3%3A17&mode=big&version=NASB2020",
  ].join("\n"),
  "Big Screen sharing should use the currently displayed verse rather than a stale Reader selection",
);

assert.match(source, /id="presentationShare"/);
assert.match(source, /presentation-reference-share-glyph/);
assert.match(source, /M12\.5 8\.25C8\.8 8\.8 6\.55 11 5\.75 15/);
assert.match(source, /data-return-shared-version/);
assert.match(source, /url\.searchParams\.set\("version"/);
assert.match(source, /await applySharedVersionFromUrl\(\)/);
assert.match(source, /passageShareFormat: state\.passageShareFormat/);
assert.match(extractFunction("clearSharedVersionOverride"), /url\.searchParams\.delete\("version"\)/);
assert.match(extractFunction("persistentVersions"), /sharedVersionOverride\?\.returnVersions/);
assert.match(styles, /\.presentation \.presentation-reference-share \{[\s\S]*?opacity: 0;/);
assert.match(styles, /\.presentation-reference-share-glyph \{[\s\S]*?width: 24px;[\s\S]*?height: 24px;/);
assert.match(styles, /\.presentation\.controls-visible \.presentation-reference-share,[\s\S]*?opacity: 1;/);

const versionUrlContext = {
  URLSearchParams,
  window: { location: { search: "?version=NASB" } },
};
vm.createContext(versionUrlContext);
vm.runInContext(`
  const translations = [
    { code: "BSB", name: "Berean Standard Bible" },
    { code: "NASB2020", displayCode: "NASB", name: "New American Standard Bible 2020" },
  ];
  ${extractFunction("requestedVersionFromUrl")}
  globalThis.requestedVersion = requestedVersionFromUrl;
`, versionUrlContext);
assert.equal(versionUrlContext.requestedVersion(), "NASB2020", "Shared links should accept public display codes");

console.log("Passage sharing tests passed");
