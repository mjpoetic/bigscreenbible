import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");

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
const mobileControlsTapSource = extractFunction("handleMobileControlsToggle");
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
pointerDownOn({ id: "mobileFloatingSettings" });
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
assert.match(bindEventsSource, /mobileControlsToggle"\)\?\.addEventListener\("click", handleMobileControlsToggle\)/);
assert.match(source, /double-tap for Settings/);

const mobileControlsTapContext = {
  toggleCalls: 0,
  openSettingsCalls: 0,
};
vm.createContext(mobileControlsTapContext);
vm.runInContext(`
  let lastMobileControlsTapAt = 0;
  const mobileControlsDoubleTapWindowMs = 350;
  function toggleMobileControls() { globalThis.toggleCalls += 1; }
  function openSettingsFromMobileControls() { globalThis.openSettingsCalls += 1; }
  ${mobileControlsTapSource}
  globalThis.handleMobileControlsTap = handleMobileControlsToggle;
`, mobileControlsTapContext);

mobileControlsTapContext.handleMobileControlsTap({ timeStamp: 1000 });
assert.equal(mobileControlsTapContext.toggleCalls, 1, "A single More tap keeps its original toggle action");
assert.equal(mobileControlsTapContext.openSettingsCalls, 0);
mobileControlsTapContext.handleMobileControlsTap({ timeStamp: 1200 });
assert.equal(mobileControlsTapContext.toggleCalls, 1, "The second tap does not toggle More again");
assert.equal(mobileControlsTapContext.openSettingsCalls, 1, "Two quick taps open Settings");
mobileControlsTapContext.handleMobileControlsTap({ timeStamp: 1600 });
assert.equal(mobileControlsTapContext.toggleCalls, 2, "A later tap starts a new single-tap sequence");

const directSettingsContext = {
  state: {
    focusReferenceOpen: true,
    focusSearchResultsOpen: true,
    focusToolsOpen: true,
    focusWorkspacePanel: "History",
    settingsOpen: false,
    settingsAnchor: "floating",
    accountOpen: true,
  },
  renderCalls: 0,
  positionAnchor: "",
  resetFocusToolSurfaces() {
    directSettingsContext.state.focusToolsOpen = false;
    directSettingsContext.state.focusWorkspacePanel = "";
  },
  renderPreservingReaderScroll() {
    directSettingsContext.renderCalls += 1;
  },
  requestAnimationFrame(callback) {
    callback();
  },
  positionSettingsPopover(anchor) {
    directSettingsContext.positionAnchor = anchor;
  },
};
vm.createContext(directSettingsContext);
vm.runInContext(`${openSettingsFromMobileControlsSource}; globalThis.openDirectSettings = openSettingsFromMobileControls;`, directSettingsContext);
directSettingsContext.openDirectSettings();
assert.equal(directSettingsContext.state.settingsOpen, true);
assert.equal(directSettingsContext.state.settingsAnchor, "header");
assert.equal(directSettingsContext.state.accountOpen, false);
assert.equal(directSettingsContext.state.focusReferenceOpen, false);
assert.equal(directSettingsContext.state.focusSearchResultsOpen, false);
assert.equal(directSettingsContext.state.focusToolsOpen, false);
assert.equal(directSettingsContext.state.focusWorkspacePanel, "");
assert.equal(directSettingsContext.renderCalls, 1);
assert.equal(directSettingsContext.positionAnchor, "header");

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
