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
  bibleData: {},
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
  ${extractFunction("uniqueVersionVerses")}
  ${extractFunction("versionVerseLabel")}
  ${extractFunction("expandedVersionVerseNumbers")}
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
assert.match(source, /id="presentationShareMobile"/);
assert.match(source, /querySelectorAll\("\[data-presentation-share\]"\)/);
assert.match(source, /presentation-reference-share-glyph/);
assert.match(source, /M12\.5 8\.25C8\.8 8\.8 6\.55 11 5\.75 15/);
assert.match(source, /data-return-shared-version/);
assert.match(source, /url\.searchParams\.set\("version"/);
assert.match(source, /await applySharedVersionFromUrl\(verses\)/);
assert.match(source, /passageShareFormat: state\.passageShareFormat/);
assert.match(extractFunction("clearSharedVersionOverride"), /url\.searchParams\.delete\("version"\)/);
assert.match(extractFunction("persistentVersions"), /sharedVersionOverride\?\.returnVersions/);
assert.match(styles, /\.presentation \.presentation-reference-share \{[\s\S]*?opacity: 0;/);
assert.match(styles, /\.presentation-reference-share-glyph \{[\s\S]*?width: 24px;[\s\S]*?height: 24px;/);
assert.match(styles, /\.presentation\.controls-visible \.presentation-reference-share,[\s\S]*?opacity: 1;/);
assert.match(styles, /@media \(max-width: 560px\) and \(orientation: portrait\) \{[\s\S]*?\.presentation \.presentation-reference-share-inline \{[\s\S]*?display: none;[\s\S]*?\.presentation-reference-mobile-share \{[\s\S]*?display: flex;/);

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

// A provider-combined passage must be copied once, with its full source range,
// even when a user selects only the final verse in that range.
context.state.isVerseOfDayActive = false;
context.state.verseOfDayItem = null;
context.state.versions = ['CEV'];
context.state.reference = 'John 3';
context.state.passageShareFormat = 'plain';
const combined = [23, 24].map(n => ({n, text: 'Combined source passage.', verseRanges: {CEV: {start: 23, end: 24}}}));
context.bibleData['John 3'] = {verses: combined};
context.currentChapter = () => context.bibleData['John 3'];
assert.equal(context.copyTextValue([24]), 'Combined source passage.\nJohn 3:23-24 (CEV)');
assert.equal((context.copyTextValue([23,24]).match(/Combined source passage\./g)||[]).length, 1);

const landing = {
  console,
  state: { versions: ['KJV'], mode: 'big', startupApplied: false },
  sharedReferenceFromUrl: () => 'John 3:16-17',
  requestedModeFromUrl: () => 'big',
  requestedVersionFromUrl: () => 'NASB2020',
  setReferenceFromString: () => true,
  sharedVersesFromUrl: () => [],
  parsePassageReference: () => ({verses: [16, 17]}),
  currentChapter: () => ({ verses: [16,17,18].map(n => ({ n, BSB: 'BSB text', NASB2020: 'Requested text' })) }),
  loadBibleVersion: async () => {},
  rebuildBibleData: () => {},
  translationDisplayCode: v => v,
  showToast: () => {},
  recordHistory: () => {}, updateShareUrl: () => {}, render: () => {},
};
vm.createContext(landing);
vm.runInContext(`${extractFunction('applySharedVersionFromUrl')}\n${extractFunction('applyStartupExperience')}\n${extractFunction('openSharedPassageChapter')}`, landing);
await landing.applyStartupExperience();
assert.equal(landing.state.mode, 'reader', 'Shared links must start in Reader even when shared from Big Screen');
assert.deepEqual([...landing.state.sharedPassage.verses], [16,17]);
assert.equal(landing.state.versions[0], 'NASB2020');
assert.equal(landing.state.sharedVersionOverride.returnVersions[0], 'KJV');
landing.openSharedPassageChapter();
assert.equal(landing.state.sharedPassage, null);
assert.equal(landing.state.verse, 16);
assert.equal(landing.state.pendingVerseFocus, true);
assert.equal(landing.state.versions[0], 'NASB2020', 'Full context keeps the requested version');
landing.currentChapter = () => ({ verses: [{n:16, BSB:'Fallback'}, {n:17, BSB:'Fallback', NASB2020:'Partial'}] });
await landing.applySharedVersionFromUrl([16,17]);
assert.equal(landing.state.versions[0], 'BSB', 'Incomplete provider text must fall back to BSB');
landing.loadBibleVersion = async v => { if (v !== 'BSB') throw new Error('Offline'); };
await landing.applySharedVersionFromUrl([16]);
assert.equal(landing.state.versions[0], 'BSB');
landing.requestedVersionFromUrl = () => '';
await landing.applySharedVersionFromUrl([16]);
assert.equal(landing.state.versions[0], 'BSB', 'Unknown versions use BSB');
console.log('Shared passage landing tests passed');
