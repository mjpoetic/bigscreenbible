import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
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

const scaleContext = {};
vm.createContext(scaleContext);
vm.runInContext(`
  const defaultPresentationTextScale = 1;
  ${extractFunction("clampPresentationTextScale")}
  globalThis.clampScale = clampPresentationTextScale;
`, scaleContext);

assert.equal(scaleContext.clampScale(0.2), 0.6);
assert.equal(scaleContext.clampScale(0.85), 0.9);
assert.equal(scaleContext.clampScale(1.24), 1.2);
assert.equal(scaleContext.clampScale(2), 1.6);
assert.equal(scaleContext.clampScale(null), 1);

assert.match(source, /presentationTextScale: Number\(localStorage\.getItem\("lw_presentation_text_scale"\)/);
assert.match(extractFunction("captureCloudSnapshot"), /presentationTextScale: state\.presentationTextScale/);
assert.match(extractFunction("applyCloudSnapshot"), /state\.presentationTextScale = clampPresentationTextScale/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /lw_presentation_text_scale/);
assert.match(extractFunction("persistPresentationTextScale"), /scheduleCloudSync\(\)/);

const searchDismissContext = {
  state: {
    presentationSearchOpen: true,
    presentationSearchResultsOpen: false,
  },
  renderCalls: 0,
};
searchDismissContext.render = () => {
  searchDismissContext.renderCalls += 1;
};
vm.createContext(searchDismissContext);
vm.runInContext(`
  ${extractFunction("closePresentationSearchOnOutsideClick")}
  globalThis.dismissSearch = closePresentationSearchOnOutsideClick;
`, searchDismissContext);

const clickPresentationSearch = (closestMatch) => searchDismissContext.dismissSearch({
  target: {
    closest: () => closestMatch,
  },
});

clickPresentationSearch({ className: "presentation-search-slot" });
assert.equal(searchDismissContext.state.presentationSearchOpen, true, "Big Screen search stays open for clicks inside its controls");
assert.equal(searchDismissContext.renderCalls, 0);

clickPresentationSearch(null);
assert.equal(searchDismissContext.state.presentationSearchOpen, false, "An outside click closes the Big Screen search controls");
assert.equal(searchDismissContext.state.presentationSearchResultsOpen, false);
assert.equal(searchDismissContext.renderCalls, 1);

searchDismissContext.state.presentationSearchResultsOpen = true;
clickPresentationSearch({ className: "presentation-search-results" });
assert.equal(searchDismissContext.state.presentationSearchResultsOpen, true, "Big Screen results stay open for clicks inside the results panel");
assert.equal(searchDismissContext.renderCalls, 1);

clickPresentationSearch(null);
assert.equal(searchDismissContext.state.presentationSearchResultsOpen, false, "An outside click closes Big Screen search results");
assert.equal(searchDismissContext.renderCalls, 2);

clickPresentationSearch(null);
assert.equal(searchDismissContext.renderCalls, 2, "Outside clicks do nothing when Big Screen search is already closed");
assert.match(source, /document\.addEventListener\("click", closePresentationSearchOnOutsideClick\)/);

assert.match(source, /id="presentationDecreaseText"/);
assert.match(source, /id="presentationResetText"/);
assert.match(source, /id="presentationIncreaseText"/);
assert.match(source, /Big Screen text size controls/);
assert.match(source, /id="presentationAccountButton"/);
assert.match(source, /id="presentationAccountPopover"/);
assert.match(extractFunction("presentationReferencePicker"), /type\.charAt\(0\)\.toUpperCase\(\) \+ type\.slice\(1\)/);
assert.match(extractFunction("presentationReferencePicker"), /presentation-reference-toggle/);
assert.match(source, /settingsChoiceMarkup\("presentationVersionSelect"/);
assert.match(source, /presentationVersionPicker\("title", version\)/);
assert.match(extractFunction("presentation"), /presentation-version-label">\(\$\{verseOfDayTranslationCode\}\)<\/span>/);
assert.match(extractFunction("verseOfDayReaderView"), /verseOfDayReferenceLabel\(item\)/);
assert.match(extractFunction("verseOfDayReferenceLabel"), /\$\{reference\} \(\$\{verseOfDayTranslationCode\}\)/);
const presentationSettingsPanelSource = extractFunction("presentationSettingsPanelMarkup");
assert.match(presentationSettingsPanelSource, /appUpdateControls\("presentation"\)/);
assert.match(presentationSettingsPanelSource, /<h3>Keyboard<\/h3>/);
assert.match(presentationSettingsPanelSource, /Help & Tour/);
assert.match(presentationSettingsPanelSource, /About & Legal/);
assert.match(extractFunction("presentationSettingsDestinationRow"), /data-presentation-settings-page/);
assert.match(presentationSettingsPanelSource, /data-presentation-settings-back/);
assert.match(extractFunction("presentation"), /presentationSettingsPanelMarkup\(version, customFontField\)/);
assert.match(extractFunction("aboutMenuOverlay"), /About &amp; Legal/);
assert.doesNotMatch(extractFunction("presentation"), /id="presentationFullscreenButton"/);
assert.doesNotMatch(extractFunction("bindEvents"), /presentationFullscreenButton/);
assert.match(extractFunction("bindEvents"), /presentationFullscreenQuick/);
assert.match(extractFunction("bindEvents"), /presentationAppUpdateButton/);
assert.doesNotMatch(extractFunction("presentation"), /presentation-version-note/);
assert.match(extractFunction("bindEvents"), /data-presentation-version-option/);
assert.match(extractFunction("bindEvents"), /data-presentation-book-option/);
assert.match(extractFunction("bindEvents"), /data-presentation-chapter-option/);
assert.match(extractFunction("bindEvents"), /data-presentation-verse-option/);
assert.match(extractFunction("presentation"), /presentationReferencePicker\("book", availableBooks, presentationBook\)/);
assert.match(extractFunction("presentation"), /presentationReferencePicker\("chapter", chapters, presentationChapter\)/);
assert.match(source, /presentation-bottom-settings-menu/);
assert.match(source, /presentation-about-settings-btn/);
assert.doesNotMatch(extractFunction("presentation"), /class="presentation-about-link"/);
assert.match(extractFunction("bindEvents"), /presentationAccountButton/);
assert.match(extractFunction("toggleAccountMenu"), /state\.mode === "big"/);
assert.match(extractFunction("handleGlobalShortcuts"), /state\.mode === "big"\) return adjustPresentationTextScale\(0\.1/);
assert.match(extractFunction("handleGlobalShortcuts"), /state\.mode === "big"\) return resetPresentationTextScale/);

assert.match(source, /touchmove", handlePresentationTouchMove, \{ passive: false \}/);
assert.match(source, /touchend", handlePresentationTouchEnd, \{ passive: false \}/);
assert.match(source, /touchcancel", cancelPresentationTouch/);
assert.match(source, /pointerdown", handlePresentationPointerDown/);
assert.match(extractFunction("handlePresentationTouchMove"), /event\.preventDefault\(\)/);
assert.match(extractFunction("handlePresentationTouchMove"), /updatePresentationSwipeDrag/);
assert.match(extractFunction("handlePresentationPointerMove"), /updatePresentationSwipeDrag/);
assert.match(extractFunction("updatePresentationSwipeDrag"), /presentation-swipe-ready/);
assert.match(extractFunction("isPresentationPointerDragTarget"), /\.presentation-passage, \.bible-version-loading-indicator/);
assert.match(extractFunction("handlePresentationPointerDown"), /event\.pointerType === "mouse"/);
assert.match(extractFunction("handlePresentationPointerDown"), /event\.button === 0/);
assert.match(extractFunction("handlePresentationPointerDown"), /setPointerCapture/);
assert.match(extractFunction("handlePresentationPointerUp"), /commitPresentationSwipe\(direction\)/);
assert.match(extractFunction("cancelPresentationPointerDrag"), /resetPresentationDrag\(\)/);
assert.match(extractFunction("handlePresentationPinchMove"), /state\.presentationTextScale = clamp/);
assert.match(extractFunction("commitPresentationSwipe"), /prefers-reduced-motion: reduce/);
assert.match(extractFunction("commitPresentationSwipe"), /presentationEnterDirection = direction/);
assert.match(extractFunction("handlePresentationTouchStart"), /presentation-enter-next/);
assert.match(source, /presentation-swipe-preview-previous/);
assert.match(source, /presentation-swipe-preview-next/);

assert.match(extractFunction("fitPresentationText"), /naturalFontSize \* clamp\(state\.presentationTextScale, 0\.6, 1\.6\)/);
assert.match(styles, /width: min\(100%, 3400px\)/);
assert.match(styles, /clamp\(34px, 5\.8vw, 240px\)/);
assert.match(styles, /\.presentation-swipe-preview \{/);
assert.match(styles, /@media \(hover: hover\) and \(pointer: fine\) \{[\s\S]*?\.presentation-text \{[\s\S]*?cursor: grab;/);
assert.match(styles, /\.presentation\.presentation-pointer-dragging \.presentation-text \{[\s\S]*?cursor: grabbing;/);
assert.match(styles, /\.presentation\.presentation-pointer-dragging \{[\s\S]*?user-select: none;/);
assert.match(styles, /\.presentation\.presentation-enter-next \.presentation-passage/);
assert.match(styles, /@keyframes presentation-slide-in-next/);
assert.doesNotMatch(styles, /presentation-slide-in-next 300ms[^;]* both/);
assert.match(styles, /\.presentation-scale-feedback\.show/);
assert.match(styles, /\.presentation-settings-popover \{[\s\S]*?max-height: calc\(100dvh - 165px - env\(safe-area-inset-top, 0px\) - env\(safe-area-inset-bottom, 0px\)\)/);
assert.match(styles, /\.presentation-settings-popover \{[\s\S]*?overflow-y: auto/);
assert.match(styles, /\.presentation-bottom-settings-menu \.presentation-settings-popover \{[\s\S]*?bottom: calc\(100% \+ 10px\)/);
assert.match(styles, /\.presentation-account-popover \{[\s\S]*?background: var\(--panel\)/);
assert.match(styles, /\.presentation-account-toggle/);
assert.match(styles, /\.presentation-reference-controls \{/);
assert.match(styles, /\.presentation-reference-space \{/);
assert.match(styles, /\.presentation \.presentation-reference-toggle \{/);
assert.match(styles, /\.presentation-reference-picker\.open \.presentation-reference-menu/);
assert.match(styles, /\.presentation \.presentation-reference-option \{[^}]*color: var\(--ink\) !important;/);
assert.match(styles, /\.presentation:is\([\s\S]*?\) :is\(\.presentation-version-menu, \.presentation-reference-menu\) \{[\s\S]*?--panel: rgba\(255, 255, 255, 0\.98\);/);
assert.match(styles, /\.presentation-version-control\.open \.presentation-version-menu/);
assert.match(styles, /\.presentation \.presentation-version-menu \.primary-version-option \{[\s\S]*?border: 0/);
assert.match(styles, /\.presentation-title-version-control \.presentation-version-picker-toggle/);
assert.match(styles, /\.presentation-settings-popover \.scripture-font-select,[\s\S]*?\.presentation-settings-popover \.custom-font-input \{[^}]*color: #fff;/);
assert.match(styles, /\.presentation-settings-disclosure > summary \{[^}]*color: #fff;/);
assert.match(styles, /\.presentation-settings-disclosure \.app-update-version \{[^}]*color: #fff;/);
assert.match(styles, /\.presentation-settings-popover \.presentation-text-size-reset span,[^}]*color: inherit;/);
for (const [theme, color] of [
  ["paper", "#201810"],
  ["dawn", "#201810"],
  ["meadow", "#142119"],
  ["blush", "#261722"],
  ["lavender", "#201a2c"],
  ["sapphire", "#07111f"],
]) {
  assert.match(styles, new RegExp(`\\.presentation\\[data-presentation-theme="${theme}"\\] \\.presentation-copy,[^}]*\\.presentation-settings-popover \\.scripture-font-select,[^}]*\\{[^}]*color: ${color};`));
}
assert.match(styles, /\.presentation:is\([\s\S]*?\.presentation-settings-disclosure > summary,[\s\S]*?\.presentation-settings-disclosure \.app-update-version[\s\S]*?\) \{[^}]*color: var\(--presentation-muted\);/);
assert.match(styles, /\.presentation-title-version-control \.presentation-version-picker-toggle \{[\s\S]*?min-height: 28px;[\s\S]*?font-size: 14px;/);
assert.match(styles, /\.presentation button:not\(:disabled\):hover,[\s\S]*?box-shadow: 0 0 16px color-mix\(in srgb, var\(--presentation-accent\) 28%, transparent\)/);
assert.match(styles, /\.presentation \.presentation-account-popover \.primary-btn:not\(:disabled\):hover/);
assert.match(styles, /button\.account-secondary-action:hover,[\s\S]*?color: var\(--presentation-accent\);/);
assert.match(styles, /\.presentation-brand:hover,[\s\S]*?drop-shadow/);
assert.match(styles, /\.presentation-settings-disclosure > summary/);
assert.match(styles, /\.presentation-top \{[\s\S]*?position: relative;[\s\S]*?z-index: 70;/);
assert.match(styles, /@media \(min-width: 841px\) \{[\s\S]*?\.presentation-settings-popover :is\([\s\S]*?\.presentation-theme-select,[\s\S]*?min-height: 36px;[\s\S]*?font-size: 12px;/);
assert.match(styles, /\.presentation-ref \{[\s\S]*?font-size: 20px;[\s\S]*?transform: translateY\(6px\);/);
assert.match(styles, /\.presentation-ref\.paginated \{[\s\S]*?transform: translateY\(13px\);/);

console.log("Presentation display tests passed");
