import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const catalogSource = readFileSync(new URL("assets/theme-catalog.js", root), "utf8");
const appSource = readFileSync(new URL("assets/bible-app.js", root), "utf8");
const styles = readFileSync(new URL("assets/bible-app.css", root), "utf8");
const htmlFiles = [
  ["index.html", "./assets/theme-catalog.js", "applyStoredTheme"],
  ["about.html", "./assets/theme-catalog.js", "watchStoredTheme"],
  ["privacy/index.html", "../assets/theme-catalog.js", "watchStoredTheme"],
  ["terms/index.html", "../assets/theme-catalog.js", "watchStoredTheme"],
];

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = appSource.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const context = {};
vm.createContext(context);
vm.runInContext(catalogSource, context);
const catalog = context.BigScreenBibleThemeCatalog;

assert.ok(catalog, "Theme catalog should be exposed globally");
assert.ok(Object.isFrozen(catalog), "Theme catalog should be immutable");

const lightCodes = catalog.themePresets.filter(({ mode }) => mode === "light").map(({ code }) => code);
const darkCodes = catalog.themePresets.filter(({ mode }) => mode === "dark").map(({ code }) => code);
const presentationCodes = Array.from(catalog.presentationThemeCodes);

assert.deepEqual(Array.from(lightCodes), [
  "paper", "parchment", "clarity", "dawn", "meadow", "blush", "lavender", "sapphire", "opal",
]);
assert.deepEqual(Array.from(darkCodes), [
  "midnight", "chapel", "aurora", "rose-night", "violet-night", "nocturne", "contrast",
]);
assert.deepEqual(presentationCodes, [
  "deep", "warm", "paper", "dawn", "aurora", "meadow", "blush", "lavender", "sapphire",
  "rose-night", "violet-night", "nocturne", "midnight", "contrast",
]);
assert.equal(catalog.defaultThemePresets.light, "sapphire");
assert.equal(catalog.defaultThemePresets.dark, "aurora");
assert.equal(catalog.defaultPresentationTheme, "aurora");
assert.equal(catalog.appearanceSchemaVersion, 2);
assert.equal(catalog.appearanceStorageKey, "lw_appearance_v2");
assert.equal(catalog.defaultThemeFamily, "sapphire");
assert.deepEqual(Array.from(catalog.themeFamilies, ({ code }) => code), [
  "neutral", "heritage", "clarity", "sunrise", "meadow", "rose", "violet", "sapphire", "celestial", "ember",
]);

assert.equal(catalog.resolveThemeMode("light", true), "light");
assert.equal(catalog.resolveThemeMode("dark", false), "dark");
assert.equal(catalog.resolveThemeMode("system", true), "dark");
assert.equal(catalog.resolveThemeMode(null, false), "light");
assert.equal(catalog.resolveThemePreset("light", "opal"), "opal");
assert.equal(catalog.resolveThemePreset("light", "aurora"), "sapphire");
assert.equal(catalog.resolveThemePreset("dark", "contrast"), "contrast");
assert.equal(catalog.resolveThemePreset("dark", "paper"), "aurora");
assert.equal(catalog.resolvePresentationTheme("warm"), "warm");
assert.equal(catalog.resolvePresentationTheme("unknown"), "aurora");
assert.equal(catalog.themeChromeColor("opal", "light"), "#dcecff");
assert.equal(catalog.themeChromeColor("unknown", "dark"), "#111d37");
assert.equal(catalog.presentationThemeColor("paper"), "#f9f2e4");
assert.equal(catalog.presentationThemeColor("unknown"), "#102433");
assert.equal(catalog.resolveThemeFamily("rose"), "rose");
assert.equal(catalog.resolveThemeFamily("unknown"), "sapphire");
assert.equal(catalog.resolveThemeFamilyPreset("rose", "light"), "blush");
assert.equal(catalog.resolveThemeFamilyPreset("rose", "dark"), "rose-night");
assert.equal(catalog.resolveThemeFamilyPresentation("violet", "dark"), "violet-night");
assert.equal(catalog.resolveThemeFamilyPreset("ember", "light"), "sapphire", "Future palettes should fall back safely until added");

const normalizedAppearance = catalog.normalizeAppearance({
  colorScheme: "dark",
  themeFamily: "rose",
  overrides: { light: "opal", dark: "paper", bigScreen: "warm" },
  updatedAt: "2026-08-21T12:00:00.000Z",
});
assert.equal(normalizedAppearance.schemaVersion, 2);
assert.equal(normalizedAppearance.colorScheme, "dark");
assert.equal(normalizedAppearance.themeFamily, "rose");
assert.equal(normalizedAppearance.overrides.light, "opal");
assert.equal(normalizedAppearance.overrides.dark, null, "A light preset cannot override the dark surface");
assert.equal(normalizedAppearance.overrides.bigScreen, "warm");
assert.ok(Object.isFrozen(normalizedAppearance));
assert.ok(Object.isFrozen(normalizedAppearance.overrides));

const roseDark = catalog.resolveAppearance({ colorScheme: "system", themeFamily: "rose" }, true);
assert.equal(roseDark.theme, "dark");
assert.equal(roseDark.preset, "rose-night");
assert.equal(roseDark.presentationTheme, "rose-night");
assert.equal(roseDark.customized, false);
const customizedRose = catalog.resolveAppearance({
  colorScheme: "light",
  themeFamily: "rose",
  overrides: { light: "opal", bigScreen: "warm" },
});
assert.equal(customizedRose.preset, "opal");
assert.equal(customizedRose.presentationTheme, "warm");
assert.equal(customizedRose.customized, true);
const updatedAppearance = catalog.updateAppearance(
  customizedRose.appearance,
  { overrides: { light: null, dark: "nocturne" } },
  "2026-08-21T13:00:00.000Z",
);
assert.equal(updatedAppearance.overrides.light, null);
assert.equal(updatedAppearance.overrides.dark, "nocturne");
assert.equal(updatedAppearance.overrides.bigScreen, "warm");
assert.equal(updatedAppearance.updatedAt, "2026-08-21T13:00:00.000Z");

for (const code of [...lightCodes, ...darkCodes]) {
  assert.ok(catalog.themeChromeColors[code], `Missing browser chrome color for ${code}`);
  if (code === "paper") assert.match(styles, /:root\s*\{/);
  else if (code === "midnight") assert.match(styles, /\[data-theme="dark"\]\s*\{/);
  else assert.match(styles, new RegExp(`\\[data-theme-preset="${code}"\\]\\s*\\{`));
}
for (const code of presentationCodes) {
  assert.ok(catalog.presentationThemeColors[code], `Missing Big Screen chrome color for ${code}`);
  if (code !== "deep") {
    assert.match(styles, new RegExp(`\\.presentation\\[data-presentation-theme="${code}"\\]\\s*\\{`));
  }
}

function storageFrom(values = {}) {
  const entries = new Map(Object.entries(values));
  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}

const meta = {
  content: "",
  setAttribute(name, value) {
    if (name === "content") this.content = value;
  },
};
const documentRef = {
  documentElement: { dataset: {} },
  querySelector(selector) {
    return selector === 'meta[name="theme-color"]' ? meta : null;
  },
};
const explicitAppearance = catalog.applyStoredTheme({
  document: documentRef,
  storage: storageFrom({ lw_theme: "dark", lw_theme_preset_dark: "nocturne" }),
  prefersDark: false,
});
assert.equal(explicitAppearance.theme, "dark");
assert.equal(explicitAppearance.preset, "nocturne");
assert.equal(explicitAppearance.followsSystem, false);
assert.equal(explicitAppearance.source, "legacy");
assert.equal(explicitAppearance.appearance.themeFamily, "sapphire");
assert.equal(explicitAppearance.appearance.overrides.dark, "nocturne");
assert.equal(documentRef.documentElement.dataset.theme, "dark");
assert.equal(documentRef.documentElement.dataset.themePreset, "nocturne");
assert.equal(documentRef.documentElement.dataset.themeFamily, "sapphire");
assert.equal(documentRef.documentElement.dataset.themeCustomized, "true");
assert.equal(meta.content, "#07111f");

const v2Storage = storageFrom({
  lw_appearance_v2: JSON.stringify({
    schemaVersion: 2,
    colorScheme: "system",
    themeFamily: "violet",
    overrides: { light: null, dark: null, bigScreen: null },
    updatedAt: "2026-08-21T14:00:00.000Z",
  }),
});
const v2Appearance = catalog.applyStoredTheme({ document: documentRef, storage: v2Storage, prefersDark: true });
assert.equal(v2Appearance.source, "v2");
assert.equal(v2Appearance.theme, "dark");
assert.equal(v2Appearance.preset, "violet-night");
assert.equal(v2Appearance.presentationTheme, "violet-night");
assert.equal(documentRef.documentElement.dataset.themeFamily, "violet");
assert.equal(documentRef.documentElement.dataset.themeCustomized, "false");
const writtenAppearance = catalog.writeStoredAppearance(updatedAppearance, { storage: v2Storage });
assert.deepEqual(
  JSON.parse(v2Storage.getItem("lw_appearance_v2")),
  JSON.parse(JSON.stringify(writtenAppearance)),
);

const systemStorage = storageFrom();
const mediaQuery = {
  matches: false,
  listener: null,
  addEventListener(name, listener) {
    if (name === "change") this.listener = listener;
  },
  removeEventListener(name, listener) {
    if (name === "change" && this.listener === listener) this.listener = null;
  },
};
const watcher = catalog.watchStoredTheme({ document: documentRef, storage: systemStorage, mediaQuery });
assert.equal(documentRef.documentElement.dataset.theme, "light");
assert.equal(documentRef.documentElement.dataset.themePreset, "sapphire");
mediaQuery.matches = true;
mediaQuery.listener();
assert.equal(documentRef.documentElement.dataset.theme, "dark");
assert.equal(documentRef.documentElement.dataset.themePreset, "aurora");
watcher.stop();
assert.equal(mediaQuery.listener, null);

assert.match(appSource, /window\.BigScreenBibleThemeCatalog/);
assert.doesNotMatch(appSource, /const themePresets = \[/);
assert.doesNotMatch(appSource, /const presentationThemes = \[/);
assert.match(appSource, /presentationThemeColor\(state\.presentationTheme\)/);
assert.match(appSource, /themeChromeColor\(state\.themePreset, state\.theme\)/);
assert.match(extractFunction("captureCloudSnapshot"), /appearance: normalizeAppearance\(state\.appearance\)/);
assert.match(extractFunction("mergeCloudSnapshots"), /latestAppearanceSettings/);
assert.match(extractFunction("latestAppearanceSettings"), /updatedAt/);
assert.match(extractFunction("applyCloudSnapshot"), /applyResolvedAppearance\(appearanceFromSnapshotSettings\(settings\)\)/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /writeStoredAppearance\(settings\.appearance\)/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /mirrorAppearanceToLegacyStorage/);
assert.match(extractFunction("setThemePreset"), /overrides: \{ \[state\.theme\]/);
assert.match(extractFunction("setThemeMode"), /colorScheme: mode/);
assert.match(extractFunction("setThemeFamily"), /themeFamily: resolvedFamily/);
assert.match(extractFunction("setPresentationTheme"), /overrides: \{ bigScreen:/);

const appearanceMergeContext = {
  normalizeAppearance: catalog.normalizeAppearance,
  normalizedVersionsUpdatedAt(value) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  },
};
vm.createContext(appearanceMergeContext);
vm.runInContext(`
  ${extractFunction("latestAppearanceSettings")}
  globalThis.latestAppearance = latestAppearanceSettings;
`, appearanceMergeContext);
const olderCloudAppearance = {
  colorScheme: "dark",
  themeFamily: "rose",
  updatedAt: "2026-08-21T10:00:00.000Z",
};
const newerLocalAppearance = {
  colorScheme: "light",
  themeFamily: "violet",
  updatedAt: "2026-08-21T11:00:00.000Z",
};
assert.equal(
  appearanceMergeContext.latestAppearance(
    { appearance: olderCloudAppearance },
    { appearance: newerLocalAppearance },
  ).appearance.themeFamily,
  "violet",
  "A newer local appearance should win over stale cloud state",
);
assert.equal(
  appearanceMergeContext.latestAppearance(
    { appearance: { ...olderCloudAppearance, updatedAt: "2026-08-21T12:00:00.000Z" } },
    { appearance: newerLocalAppearance },
  ).appearance.themeFamily,
  "rose",
  "A newer cloud appearance should apply to the device",
);

for (const [file, sourcePath, method] of htmlFiles) {
  const html = readFileSync(new URL(file, root), "utf8");
  const catalogScript = `<script src="${sourcePath}?v=`;
  assert.ok(html.includes(catalogScript), `${file} should load the shared theme catalog`);
  assert.ok(
    html.indexOf(catalogScript) < html.indexOf(`BigScreenBibleThemeCatalog.${method}`),
    `${file} should load the catalog before applying it`,
  );
  assert.doesNotMatch(html, /const presets = \{/);
  assert.doesNotMatch(html, /const chromeColors = \{/);
}

console.log("Theme catalog tests passed");
