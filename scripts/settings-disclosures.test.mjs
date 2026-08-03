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

console.log("Settings disclosure tests passed");
