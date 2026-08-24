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
  bibleData: {
    "Ezekiel 36": {
      verses: [
        { n: 16, BSB: "The word of the Lord came to me." },
        { n: 17, BSB: "Son of man, when the house of Israel lived in their land..." },
        { n: 18, BSB: "So I poured out My wrath upon them." },
      ],
    },
  },
  parsePassageReference: () => ({ key: "Ezekiel 36", verses: [16, 17] }),
  translationDisplayCode: (version) => version,
  escapeHtml: (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;"),
  apiBibleAttributionMarkup: (versions, className, chapterKey) => (
    `<aside data-version="${versions[0]}" data-class="${className}" data-chapter="${chapterKey}"></aside>`
  ),
  referencePreviewHref: () => "/?ref=Ezekiel%2036%3A16-17",
};
vm.createContext(context);
vm.runInContext(`
  ${extractFunction("referencePreviewPassageMarkup")}
  ${extractFunction("crossReferencePopupMarkup")}
  globalThis.previewMarkup = referencePreviewPassageMarkup;
  globalThis.crossReferenceMarkup = crossReferencePopupMarkup;
`, context);

const fallbackMarkup = context.previewMarkup("Ezekiel 36:16-17", "AMP");
assert.match(fallbackMarkup, /Ezekiel 36:16-17/);
assert.match(fallbackMarkup, /AMP could not be loaded/);
assert.match(fallbackMarkup, />BSB</);
assert.match(fallbackMarkup, /<sup>16<\/sup>/);
assert.match(fallbackMarkup, /<sup>17<\/sup>/);
assert.doesNotMatch(fallbackMarkup, /<sup>18<\/sup>/);
assert.match(fallbackMarkup, /class="reference-preview-text" tabindex="0"/);
assert.match(fallbackMarkup, /data-popup-goto="Ezekiel 36:16-17"/);
assert.match(fallbackMarkup, />Go to Passage /);
assert.doesNotMatch(fallbackMarkup, /data-reference-preview-back/);

const crossReferencePreviewMarkup = context.previewMarkup(
  "Ezekiel 36:16-17",
  "BSB",
  { returnToCrossReferences: true, goToReference: "Ezekiel 36:16" },
);
assert.match(crossReferencePreviewMarkup, /data-reference-preview-back/);
assert.match(crossReferencePreviewMarkup, />←<\/span> Cross references/);
assert.match(crossReferencePreviewMarkup, /data-popup-goto="Ezekiel 36:16"/);
assert.match(crossReferencePreviewMarkup, /<sup>16<\/sup>/);
assert.match(crossReferencePreviewMarkup, /<sup>17<\/sup>/);

const crossReferenceListMarkup = context.crossReferenceMarkup("Romans 8:1", [{
  goto: "John 3:18",
  label: "John 3:18-19",
  preview: "Whoever believes in Him is not condemned.",
}]);
assert.match(crossReferenceListMarkup, /data-popup-preview="John 3:18-19"/);
assert.match(crossReferenceListMarkup, /data-popup-navigation="John 3:18"/);
assert.match(crossReferenceListMarkup, /aria-label="Preview John 3:18-19"/);
assert.doesNotMatch(crossReferenceListMarkup, /data-popup-goto/);

context.bibleData["Ezekiel 36"].verses[0].AMP = "Then the word of the Lord came to me, saying,";
context.bibleData["Ezekiel 36"].verses[1].AMP = "Son of man, when the house of Israel lived in their own land...";
const ampMarkup = context.previewMarkup("Ezekiel 36:16-17", "AMP");
assert.doesNotMatch(ampMarkup, /could not be loaded/);
assert.match(ampMarkup, />AMP</);
assert.match(ampMarkup, /data-version="AMP"/);
assert.match(ampMarkup, /data-chapter="Ezekiel 36"/);

assert.match(source, /data-heading-reference="[^\n]+aria-haspopup="dialog" aria-expanded="false"/);
assert.match(source, /data-scripture-reference="[^\n]+aria-haspopup="dialog" aria-expanded="false"/);
assert.match(extractFunction("paragraphReaderView"), /data-cross-ref-hold="\$\{verse\.n\}"/);
assert.match(extractFunction("openCrossReferencePopup"), /anchor\.dataset\.crossRefVerse \|\| anchor\.dataset\.crossRefHold/);
assert.match(extractFunction("bindCrossReferenceVerseNumber"), /pointerdown", beginCrossReferenceHold/);
assert.match(extractFunction("bindCrossReferenceVerseNumber"), /pointercancel", endCrossReferenceHold/);
assert.match(extractFunction("bindCrossReferenceVerseNumber"), /contextmenu", suppressCrossReferenceContextMenu/);
assert.match(extractFunction("bindEvents"), /\.verse-num\[data-cross-ref-verse\]/);
assert.match(extractFunction("bindEvents"), /\.verse-num\[data-cross-ref-hold\]/);
assert.match(extractFunction("beginCrossReferenceHold"), /crossReferenceHoldMs/);
assert.match(extractFunction("updateCrossReferenceHold"), /crossReferenceHoldMoveTolerancePx/);
assert.match(styles, /\.verse-num\.cross-ref-hold-pending::after/);
assert.match(styles, /animation:\s*mobileSettingsHoldProgress 350ms linear forwards/);
assert.match(extractFunction("bindEvents"), /openReferencePreviewPopup\(button, button\.dataset\.headingReference/);
assert.match(extractFunction("bindEvents"), /openReferencePreviewPopup\(button, button\.dataset\.scriptureReference/);
assert.match(extractFunction("openReferencePreviewPopup"), /ensureRemoteBibleVersion\(version, parsed\.key, \{ rerender: false \}\)/);
assert.match(extractFunction("openReferencePreviewPopup"), /requestId !== referencePreviewRequestId/);
assert.match(extractFunction("openReferencePreviewPopup"), /options\.popup \|\| showStudyPopup/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /returnToCrossReferences: true/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /openReferencePreviewPopup/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /button\.dataset\.popupNavigation/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /crossReferenceReturnState/);
assert.match(extractFunction("bindCrossReferencePreviewLinks"), /scrollTop: popup\.scrollTop/);
assert.match(extractFunction("restoreCrossReferencePopup"), /setStudyPopupContent/);
assert.match(extractFunction("restoreCrossReferencePopup"), /bindCrossReferencePreviewLinks/);
assert.match(extractFunction("restoreCrossReferencePopup"), /returnState\?\.previewReference/);
assert.match(extractFunction("restoreCrossReferencePopup"), /focusTarget\?\.focus\(\{ preventScroll: true \}\)/);
assert.match(extractFunction("restoreCrossReferencePopup"), /popup\.scrollTop = returnState\.scrollTop/);
assert.match(extractFunction("bindReferencePreviewBack"), /event\.preventDefault\(\)/);
assert.match(extractFunction("bindReferencePreviewBack"), /event\.stopPropagation\(\)/);
assert.match(extractFunction("dismissSelectionBarOnOutsideClick"), /\.study-popup/);
assert.doesNotMatch(extractFunction("verseTextAtReference"), /getVerseText/);
assert.match(extractFunction("verseTextAtReference"), /verse\[version\] \|\| verse\.BSB/);
assert.match(extractFunction("setStudyPopupContent"), /options\.className/);
assert.match(extractFunction("showStudyPopup"), /aria-expanded", "true"/);
assert.match(extractFunction("showStudyPopup"), /studyPopupAnchorRect/);
assert.match(extractFunction("closeStudyPopup"), /aria-expanded", "false"/);
assert.match(extractFunction("positionStudyPopup"), /anchorConnected/);
assert.match(extractFunction("positionStudyPopup"), /referencePreview \? 440 : 360/);
assert.match(extractFunction("positionStudyPopup"), /--reference-preview-text-max-height/);
assert.match(extractFunction("ensureRemoteBibleVersion"), /remoteVersionRequests\.has\(loadKey\)/);
assert.match(extractFunction("ensureRemoteBibleVersion"), /options\.rerender !== false/);

assert.match(styles, /\.reference-preview-popup::before \{/);
assert.match(styles, /\.reference-preview-popup \{[\s\S]*?max-height: none/);
assert.match(styles, /\.study-popup \{[\s\S]*?overflow-y: auto[\s\S]*?overscroll-behavior: contain/);
assert.match(styles, /\.study-popup \{[\s\S]*?pointer-events: auto[\s\S]*?touch-action: pan-y/);
assert.match(styles, /\.study-popup \{[\s\S]*?-webkit-overflow-scrolling: touch/);
assert.match(styles, /\.reference-preview-text \{[\s\S]*?--reference-preview-text-max-height[\s\S]*?overflow-y: auto/);
assert.match(styles, /\.reference-preview-text \{[\s\S]*?overscroll-behavior: contain/);
assert.match(styles, /\.reference-preview-text \{[\s\S]*?touch-action: pan-y/);
assert.match(styles, /\.reference-preview-go \{[\s\S]*?min-height: 42px/);
assert.match(styles, /\.reference-preview-actions\.has-back \{/);
assert.match(styles, /\.reference-preview-back \{[\s\S]*?min-height: 42px/);
assert.match(styles, /@media \(max-width: 520px\) \{[\s\S]*?\.reference-preview-go \{[\s\S]*?min-height: 44px/);
assert.match(styles, /@media \(max-width: 520px\) \{[\s\S]*?\.reference-preview-back \{[\s\S]*?min-height: 44px/);

let scheduledHold = null;
let holdNow = 1000;
let crossReferenceOpens = 0;
let verseMenuCloses = 0;
const holdContext = {
  Date: { now: () => holdNow },
  setTimeout(callback, delay) {
    scheduledHold = { callback, delay };
    return 7;
  },
  clearTimeout() {
    scheduledHold = null;
  },
  closeVerseActionMenu(immediate) {
    assert.equal(immediate, true);
    verseMenuCloses += 1;
  },
  openCrossReferencePopup() {
    crossReferenceOpens += 1;
  },
};
vm.createContext(holdContext);
vm.runInContext(`
  let crossReferenceHoldTimer = 0;
  let crossReferenceHoldGesture = null;
  let suppressCrossReferenceVerseClickUntil = 0;
  const crossReferenceHoldMs = 350;
  const crossReferenceHoldMoveTolerancePx = 12;
  ${extractFunction("suppressCrossReferenceVerseClick")}
  ${extractFunction("handleCrossReferenceVerseClick")}
  ${extractFunction("beginCrossReferenceHold")}
  ${extractFunction("updateCrossReferenceHold")}
  ${extractFunction("endCrossReferenceHold")}
  ${extractFunction("cancelCrossReferenceHold")}
  ${extractFunction("suppressCrossReferenceContextMenu")}
  globalThis.handleClick = handleCrossReferenceVerseClick;
  globalThis.beginHold = beginCrossReferenceHold;
  globalThis.moveHold = updateCrossReferenceHold;
  globalThis.endHold = endCrossReferenceHold;
  globalThis.suppressContextMenu = suppressCrossReferenceContextMenu;
`, holdContext);

const holdClasses = new Set();
const holdButton = {
  isConnected: true,
  classList: {
    add: (name) => holdClasses.add(name),
    remove: (name) => holdClasses.delete(name),
  },
};
const holdPointerEvent = (overrides = {}) => ({
  currentTarget: holdButton,
  isPrimary: true,
  pointerType: "touch",
  pointerId: 4,
  clientX: 40,
  clientY: 20,
  ...overrides,
});

holdContext.beginHold(holdPointerEvent());
assert.equal(scheduledHold.delay, 350, "Cross references use the established mobile hold timing");
assert.equal(holdClasses.has("cross-ref-hold-pending"), true, "The verse number shows hold progress");
holdContext.moveHold(holdPointerEvent({ clientX: 53 }));
assert.equal(scheduledHold, null, "Moving beyond the tolerance cancels the cross-reference hold");
assert.equal(holdClasses.has("cross-ref-hold-pending"), false);

holdNow = 2000;
holdContext.beginHold(holdPointerEvent());
scheduledHold.callback();
assert.equal(crossReferenceOpens, 1, "A completed hold opens the verse cross references");
assert.equal(verseMenuCloses, 1, "A completed hold replaces any paragraph verse menu");
assert.equal(holdClasses.has("cross-ref-hold-pending"), false);

let clickPrevented = 0;
let clickStopped = 0;
const clickEvent = {
  currentTarget: holdButton,
  preventDefault: () => { clickPrevented += 1; },
  stopPropagation: () => { clickStopped += 1; },
};
holdContext.handleClick(clickEvent);
assert.equal(clickPrevented, 1, "The click generated after a completed hold is suppressed");
assert.equal(crossReferenceOpens, 1, "The completed hold does not reopen the popup on click");

holdNow = 3000;
holdContext.handleClick(clickEvent);
assert.equal(crossReferenceOpens, 2, "A normal short click keeps the existing direct cross-reference behavior");
assert.equal(clickStopped, 2);

holdContext.beginHold(holdPointerEvent());
holdContext.endHold(holdPointerEvent());
assert.equal(scheduledHold, null, "Releasing before the threshold cancels the hold");
let contextMenuPrevented = false;
holdContext.suppressContextMenu({ preventDefault: () => { contextMenuPrevented = true; } });
assert.equal(contextMenuPrevented, true, "Native long-press menus are suppressed on verse numbers");

console.log("Reference preview tests passed");
