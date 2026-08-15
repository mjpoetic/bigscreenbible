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

const context = {};
vm.createContext(context);
vm.runInContext(`
  const settingsSectionKeys = ["accessibility", "display", "reading", "startup", "printing", "updates"];
  const defaultSettingsSectionsOpen = {
    accessibility: false,
    display: true,
    reading: true,
    startup: false,
    printing: false,
    updates: false,
  };
  function normalizedVersionsUpdatedAt(value) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  }
  ${extractFunction("normalizedSettingsSectionsOpen")}
  ${extractFunction("latestSettingsSectionSettings")}
  globalThis.normalize = normalizedSettingsSectionsOpen;
  globalThis.latest = latestSettingsSectionSettings;
`, context);

assert.deepEqual(
  JSON.parse(JSON.stringify(context.normalize())),
  {
    accessibility: false,
    display: true,
    reading: true,
    startup: false,
    printing: false,
    updates: false,
  },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.normalize({ display: false, reading: false, printing: true, unknown: true }))),
  {
    accessibility: false,
    display: false,
    reading: false,
    startup: false,
    printing: true,
    updates: false,
  },
);

const cloudNewer = context.latest(
  { settingsSectionsOpen: { display: false }, settingsSectionsOpenUpdatedAt: "2026-08-03T12:01:00.000Z" },
  { settingsSectionsOpen: { display: true }, settingsSectionsOpenUpdatedAt: "2026-08-03T12:00:00.000Z" },
);
assert.equal(cloudNewer.settingsSectionsOpen.display, false);
assert.equal(cloudNewer.settingsSectionsOpenUpdatedAt, "2026-08-03T12:01:00.000Z");

const localNewer = context.latest(
  { settingsSectionsOpen: { reading: true }, settingsSectionsOpenUpdatedAt: "2026-08-03T12:00:00.000Z" },
  { settingsSectionsOpen: { reading: false }, settingsSectionsOpenUpdatedAt: "2026-08-03T12:02:00.000Z" },
);
assert.equal(localNewer.settingsSectionsOpen.reading, false);
assert.equal(localNewer.settingsSectionsOpenUpdatedAt, "2026-08-03T12:02:00.000Z");

const displaySource = extractFunction("displaySettings");
const readingSource = extractFunction("readingSettings");
const rememberSource = extractFunction("rememberDisclosureState");
const captureSource = extractFunction("captureCloudSnapshot");
const applySource = extractFunction("applyCloudSnapshot");
const persistSource = extractFunction("persistCloudSnapshotLocally");
const outsidePointerDownSource = extractFunction("closeSettingsPopoverOnOutsidePointerDown");
const closeSettingsSource = extractFunction("closeSettingsPopover");
const bindEventsSource = extractFunction("bindEvents");
const topBelowHeaderSource = extractFunction("settingsPopoverTopBelowHeader");
const positionSettingsSource = extractFunction("positionSettingsPopover");
const mobileFocusOverlayControlsSource = extractFunction("mobileFocusOverlayControls");
const revealMobileSettingsSource = extractFunction("revealMobileSettingsButton");
const bindMobileSettingsVisibilitySource = extractFunction("bindMobileSettingsVisibility");
const handleMobileControlsClickSource = extractFunction("handleMobileControlsClick");
const beginMobileControlsHoldSource = extractFunction("beginMobileControlsHold");
const updateMobileControlsHoldSource = extractFunction("updateMobileControlsHold");
const endMobileControlsHoldSource = extractFunction("endMobileControlsHold");
const cancelMobileControlsHoldSource = extractFunction("cancelMobileControlsHold");
const suppressMobileControlsContextMenuSource = extractFunction("suppressMobileControlsContextMenu");
const openSettingsFromMobileControlsSource = extractFunction("openSettingsFromMobileControls");

assert.match(displaySource, /settingsDisclosure\("display", "Display"/);
assert.match(displaySource, /Paragraph layout when available/);
assert.doesNotMatch(displaySource, /Pull or scroll past chapter edges/);
assert.match(readingSource, /settingsDisclosure\("reading", "Reading"/);
assert.match(readingSource, /Pull or scroll past chapter edges/);
assert.match(readingSource, /Enable auto-scroll controls/);
assert.doesNotMatch(readingSource, /Paragraph layout when available/);
assert.match(source, /\$\{displaySettings\("mobile"\)\}[\s\S]*?\$\{readingSettings\("mobile"\)\}/);
assert.match(source, /\$\{displaySettings\(\)\}[\s\S]*?\$\{readingSettings\(\)\}/);

assert.match(rememberSource, /settingsSectionsOpenUpdatedAt = new Date\(\)\.toISOString\(\)/);
assert.match(rememberSource, /settingsSectionsOpenStorageKey/);
assert.match(rememberSource, /settingsSectionsOpenUpdatedAtStorageKey/);
assert.match(rememberSource, /scheduleCloudSync\(\)/);
assert.match(captureSource, /settingsSectionsOpen/);
assert.match(captureSource, /settingsSectionsOpenUpdatedAt/);
assert.match(applySource, /settingsSectionsOpen/);
assert.match(persistSource, /settingsSectionsOpenStorageKey/);

let settingsOpen = true;
let closeCalls = 0;
const outsidePointerDownContext = {
  state: {
    get settingsOpen() {
      return settingsOpen;
    },
  },
  closeSettingsPopover() {
    closeCalls += 1;
  },
};
vm.createContext(outsidePointerDownContext);
vm.runInContext(`${outsidePointerDownSource}; globalThis.handleOutsidePointerDown = closeSettingsPopoverOnOutsidePointerDown;`, outsidePointerDownContext);

const pointerDownOn = (closestMatch) => outsidePointerDownContext.handleOutsidePointerDown({
  target: {
    closest: () => closestMatch,
  },
});

pointerDownOn({ className: "settings-popover open" });
pointerDownOn({ id: "mobileSettingsPopover" });
pointerDownOn({ id: "settingsToggle" });
assert.equal(closeCalls, 0, "Settings stays open for pointer presses inside the popup or on its toggles");

pointerDownOn(null);
assert.equal(closeCalls, 1, "An outside pointer press closes Settings");

settingsOpen = false;
pointerDownOn(null);
assert.equal(closeCalls, 1, "Outside pointer presses do nothing when Settings is closed");

assert.match(source, /document\.addEventListener\("pointerdown", closeSettingsPopoverOnOutsidePointerDown\)/);
assert.doesNotMatch(closeSettingsSource, /settingsPopupPosition/, "Closing Settings preserves a user-moved position");
assert.doesNotMatch(bindEventsSource, /state\.settingsPopupPosition\s*=\s*null/, "Opening or replacing Settings preserves a user-moved position");
assert.match(positionSettingsSource, /settingsPopoverTopBelowHeader\(\)/);
assert.match(positionSettingsSource, /topOverride: top/);
assert.match(bindEventsSource, /mobileControlsToggle\?\.addEventListener\("click", handleMobileControlsClick\)/);
assert.match(bindEventsSource, /mobileControlsToggle\?\.addEventListener\("pointerdown", beginMobileControlsHold\)/);
assert.match(bindEventsSource, /mobileControlsToggle\?\.addEventListener\("pointermove", updateMobileControlsHold\)/);
assert.match(bindEventsSource, /mobileControlsToggle\?\.addEventListener\("pointerup", endMobileControlsHold\)/);
assert.match(bindEventsSource, /mobileControlsToggle\?\.addEventListener\("contextmenu", suppressMobileControlsContextMenu\)/);
assert.doesNotMatch(source, /double-tap for Settings|handleMobileControlsToggle|mobileControlsDoubleTapWindowMs/);
assert.doesNotMatch(mobileFocusOverlayControlsSource, /Open Settings|mobileFloatingSettings/);
assert.doesNotMatch(source, /mobileFloatingSettings|mobile-floating-settings/);
assert.doesNotMatch(revealMobileSettingsSource, /mobileFloatingSettings|mobile-floating-settings/);
assert.match(bindMobileSettingsVisibilitySource, /\.scripture, \.trivia-reader, \.trivia-setup-main/);
assert.match(styles, /\.mobile-controls-toggle\.settings-hold-pending::before/);
assert.match(styles, /animation:\s*mobileSettingsHoldProgress 500ms linear forwards/);
assert.match(styles, /touch-action:\s*manipulation/);

let scheduledHold = null;
let now = 1000;
let toggles = 0;
let renders = 0;
let positioned = 0;
const holdContext = {
  state: {
    focusReferenceOpen: true,
    focusSearchResultsOpen: true,
    focusToolsOpen: true,
    focusWorkspacePanel: "History",
    settingsOpen: false,
    settingsAnchor: "",
    accountOpen: true,
  },
  Date: { now: () => now },
  setTimeout(callback, delay) {
    scheduledHold = { callback, delay };
    return 7;
  },
  clearTimeout() {
    scheduledHold = null;
  },
  toggleMobileControls() {
    toggles += 1;
  },
  resetFocusToolSurfaces() {
    holdContext.state.focusToolsOpen = false;
    holdContext.state.focusWorkspacePanel = "";
  },
  renderPreservingReaderScroll() {
    renders += 1;
  },
  requestAnimationFrame(callback) {
    callback();
  },
  positionSettingsPopover(anchor) {
    assert.equal(anchor, "header");
    positioned += 1;
  },
};
vm.createContext(holdContext);
vm.runInContext(`
  let mobileControlsHoldTimer = 0;
  let mobileControlsHoldGesture = null;
  let suppressMobileControlsClickUntil = 0;
  const mobileControlsHoldMs = 500;
  const mobileControlsHoldMoveTolerancePx = 12;
  ${handleMobileControlsClickSource}
  ${beginMobileControlsHoldSource}
  ${updateMobileControlsHoldSource}
  ${endMobileControlsHoldSource}
  ${cancelMobileControlsHoldSource}
  ${suppressMobileControlsContextMenuSource}
  ${openSettingsFromMobileControlsSource}
  globalThis.handleClick = handleMobileControlsClick;
  globalThis.beginHold = beginMobileControlsHold;
  globalThis.moveHold = updateMobileControlsHold;
  globalThis.endHold = endMobileControlsHold;
  globalThis.suppressContextMenu = suppressMobileControlsContextMenu;
`, holdContext);

const pendingClasses = new Set();
const holdButton = {
  classList: {
    add: (name) => pendingClasses.add(name),
    remove: (name) => pendingClasses.delete(name),
  },
};
const pointerEvent = (overrides = {}) => ({
  currentTarget: holdButton,
  isPrimary: true,
  pointerType: "touch",
  pointerId: 4,
  clientX: 40,
  clientY: 20,
  ...overrides,
});

holdContext.beginHold(pointerEvent());
assert.equal(scheduledHold.delay, 500, "Settings requires a deliberate half-second hold");
assert.equal(pendingClasses.has("settings-hold-pending"), true, "Hold feedback appears while the timer is pending");
holdContext.moveHold(pointerEvent({ clientX: 53 }));
assert.equal(scheduledHold, null, "Moving beyond the gesture tolerance cancels the hold");
assert.equal(pendingClasses.has("settings-hold-pending"), false, "Canceled holds remove their feedback");

holdContext.beginHold(pointerEvent());
scheduledHold.callback();
assert.equal(holdContext.state.settingsOpen, true, "A completed hold opens Settings");
assert.equal(holdContext.state.settingsAnchor, "header");
assert.equal(holdContext.state.accountOpen, false);
assert.equal(renders, 1);
assert.equal(positioned, 1);

let prevented = 0;
const clickEvent = {
  preventDefault: () => { prevented += 1; },
  stopPropagation: () => {},
};
holdContext.handleClick(clickEvent);
assert.equal(prevented, 1, "The click generated by a completed hold is suppressed");
assert.equal(toggles, 0, "A completed hold does not also toggle More");
now = 2000;
holdContext.handleClick(clickEvent);
assert.equal(toggles, 1, "An ordinary click keeps the original More behavior");

holdContext.beginHold(pointerEvent());
holdContext.endHold(pointerEvent());
assert.equal(scheduledHold, null, "Releasing before the threshold cancels the hold timer");
let contextMenuPrevented = false;
holdContext.suppressContextMenu({ preventDefault: () => { contextMenuPrevented = true; } });
assert.equal(contextMenuPrevented, true, "The button suppresses the native long-press context menu");

const topBelowHeaderContext = {
  fixedPopoverViewport: () => ({ offsetTop: 0, width: 390, height: 844 }),
  document: {
    querySelector: () => ({
      getBoundingClientRect: () => ({ bottom: 118 }),
    }),
  },
};
vm.createContext(topBelowHeaderContext);
vm.runInContext(`${topBelowHeaderSource}; globalThis.topBelowHeader = settingsPopoverTopBelowHeader;`, topBelowHeaderContext);
assert.equal(topBelowHeaderContext.topBelowHeader(), 126, "The default Settings top sits eight pixels below the rendered header");

console.log("Settings disclosure tests passed");
