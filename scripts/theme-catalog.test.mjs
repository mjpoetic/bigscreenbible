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
  "paper", "parchment", "clarity", "dawn", "meadow", "blush", "lavender", "sapphire", "opal", "clementine",
]);
assert.deepEqual(Array.from(darkCodes), [
  "midnight", "chapel", "aurora", "dusk", "forest-night", "rose-night", "violet-night", "nocturne", "ember-night", "contrast",
]);
assert.deepEqual(presentationCodes, [
  "deep", "warm", "ember", "paper", "dawn", "aurora", "meadow", "blush", "lavender", "sapphire",
  "rose-night", "violet-night", "nocturne", "midnight", "contrast",
]);
assert.equal(lightCodes.length, 10);
assert.equal(darkCodes.length, 10);
assert.equal(presentationCodes.length, 15);
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
assert.equal(catalog.resolveThemeFamilyPreset("sunrise", "dark"), "dusk");
assert.equal(catalog.resolveThemeFamilyPreset("meadow", "dark"), "forest-night");
assert.equal(catalog.themeFamilyLookup.celestial.name, "Nocturne");
assert.equal(catalog.resolveThemeFamilyPreset("celestial", "light"), "sapphire");
assert.equal(catalog.resolveThemeFamilyPreset("celestial", "dark"), "nocturne");
assert.equal(catalog.resolveThemeFamilyPresentation("celestial", "light"), "nocturne");
assert.equal(catalog.resolveThemeFamilyPresentation("celestial", "dark"), "nocturne");
assert.equal(catalog.resolveThemeFamilyPreset("ember", "light"), "clementine");
assert.equal(catalog.resolveThemeFamilyPreset("ember", "dark"), "ember-night");
assert.equal(catalog.resolveThemeFamilyPresentation("ember", "light"), "ember");
assert.equal(catalog.resolveThemeFamilyPresentation("ember", "dark"), "ember");

function relativeLuminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

for (const [name, foreground, background, minimum] of [
  ["Clementine text", "#2b180f", "#fffaf4", 7],
  ["Clementine muted text", "#765e50", "#fffaf4", 4.5],
  ["Clementine accent", "#ffffff", "#b64f16", 4.5],
  ["Dusk text", "#fff4e9", "#21151f", 7],
  ["Dusk muted text", "#d1b6b2", "#21151f", 4.5],
  ["Dusk accent", "#32150d", "#f0a06f", 4.5],
  ["Forest Night text", "#eef9f0", "#102319", 7],
  ["Forest Night muted text", "#afcbb8", "#102319", 4.5],
  ["Forest Night accent", "#062316", "#71d59a", 4.5],
  ["Ember Night text", "#fff4ec", "#2a120d", 7],
  ["Ember Night muted text", "#d4b5a6", "#2a120d", 4.5],
  ["Ember Night accent", "#361309", "#ff9b5a", 4.5],
  ["Ember Big Screen text", "#fff8f2", "#5a210f", 7],
]) {
  assert.ok(contrastRatio(foreground, background) >= minimum, `${name} should meet its contrast target`);
}

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
const nocturneLight = catalog.resolveAppearance({ colorScheme: "light", themeFamily: "celestial" });
assert.equal(nocturneLight.preset, "sapphire");
assert.equal(nocturneLight.presentationTheme, "nocturne");
assert.equal(nocturneLight.customized, false);
const nocturneDark = catalog.resolveAppearance({ colorScheme: "dark", themeFamily: "celestial" });
assert.equal(nocturneDark.preset, "nocturne");
assert.equal(nocturneDark.presentationTheme, "nocturne");
assert.equal(nocturneDark.customized, false);
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

function cssDeclarationBlock(marker) {
  const start = styles.indexOf(marker);
  assert.notEqual(start, -1, `Missing CSS block for ${marker}`);
  const bodyStart = styles.indexOf("{", start) + 1;
  const bodyEnd = styles.indexOf("}", bodyStart);
  return styles.slice(bodyStart, bodyEnd);
}

for (const [theme, marker] of [
  ["deep", ".presentation {"],
  ["warm", '.presentation[data-presentation-theme="warm"] {'],
  ["paper", '.presentation[data-presentation-theme="paper"] {'],
  ["midnight", '.presentation[data-presentation-theme="midnight"] {'],
  ["contrast", '.presentation[data-presentation-theme="contrast"] {'],
]) {
  const block = cssDeclarationBlock(marker);
  const background = block.slice(block.indexOf("background:"), block.indexOf("background-color:"));
  assert.ok((background.match(/radial-gradient\(/g) || []).length >= 2, `${theme} should have layered gradient highlights`);
  assert.equal((background.match(/linear-gradient\(/g) || []).length, 1, `${theme} should have one gradient base`);
  assert.ok(background.lastIndexOf("linear-gradient(") > background.lastIndexOf("radial-gradient("), `${theme} highlights should remain visible above its base gradient`);
}

function storageFrom(values = {}) {
  const entries = new Map(Object.entries(values));
  const writes = [];
  return {
    writes,
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
      writes.push([key, String(value)]);
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
assert.equal(explicitAppearance.migrated, true);
assert.equal(explicitAppearance.appearance.themeFamily, "sapphire");
assert.equal(explicitAppearance.appearance.overrides.dark, "nocturne");
assert.equal(documentRef.documentElement.dataset.theme, "dark");
assert.equal(documentRef.documentElement.dataset.themePreset, "nocturne");
assert.equal(documentRef.documentElement.dataset.themeFamily, "sapphire");
assert.equal(documentRef.documentElement.dataset.themeCustomized, "true");
assert.equal(meta.content, "#07111f");

const migratedLegacyStorage = storageFrom({
  lw_theme: "dark",
  lw_theme_preset_light: "opal",
  lw_theme_preset_dark: "nocturne",
  lw_presentation_theme: "warm",
});
const firstMigration = catalog.migrateStoredAppearance({ storage: migratedLegacyStorage });
assert.equal(firstMigration.source, "legacy");
assert.equal(firstMigration.migrated, true);
assert.equal(firstMigration.appearance.colorScheme, "dark");
assert.equal(firstMigration.appearance.overrides.light, "opal");
assert.equal(firstMigration.appearance.overrides.dark, "nocturne");
assert.equal(firstMigration.appearance.overrides.bigScreen, "warm");
assert.equal(firstMigration.appearance.updatedAt, "", "Migration should not impersonate a user edit");
assert.equal(migratedLegacyStorage.writes.length, 1);
const secondMigration = catalog.migrateStoredAppearance({ storage: migratedLegacyStorage });
assert.equal(secondMigration.source, "v2");
assert.equal(secondMigration.migrated, false);
assert.equal(migratedLegacyStorage.writes.length, 1, "Migration should be idempotent");
assert.deepEqual(
  JSON.parse(migratedLegacyStorage.getItem("lw_appearance_v2")),
  JSON.parse(JSON.stringify(firstMigration.appearance)),
);
assert.equal(migratedLegacyStorage.getItem("lw_theme"), "dark");
assert.equal(migratedLegacyStorage.getItem("lw_theme_preset_light"), "opal");
assert.equal(migratedLegacyStorage.getItem("lw_theme_preset_dark"), "nocturne");
assert.equal(migratedLegacyStorage.getItem("lw_presentation_theme"), "warm");

for (const colorScheme of [null, "light", "dark"]) {
  for (const prefersDark of [false, true]) {
    const legacyValues = {
      colorScheme,
      light: "parchment",
      dark: "contrast",
      bigScreen: "rose-night",
    };
    const beforeMigration = catalog.resolveAppearance(
      catalog.appearanceFromLegacyValues(legacyValues),
      prefersDark,
    );
    const equivalenceStorage = storageFrom({
      ...(colorScheme ? { lw_theme: colorScheme } : {}),
      lw_theme_preset_light: legacyValues.light,
      lw_theme_preset_dark: legacyValues.dark,
      lw_presentation_theme: legacyValues.bigScreen,
    });
    const migrated = catalog.resolveAppearance(
      catalog.migrateStoredAppearance({ storage: equivalenceStorage }).appearance,
      prefersDark,
    );
    assert.deepEqual(
      [migrated.theme, migrated.preset, migrated.presentationTheme, migrated.chromeColor],
      [beforeMigration.theme, beforeMigration.preset, beforeMigration.presentationTheme, beforeMigration.chromeColor],
      `Migration should preserve ${colorScheme || "system"} appearance when prefersDark=${prefersDark}`,
    );
  }
}

const corruptAppearanceStorage = storageFrom({
  lw_appearance_v2: "{not-json",
  lw_theme: "light",
  lw_theme_preset_light: "parchment",
});
const repairedAppearance = catalog.migrateStoredAppearance({ storage: corruptAppearanceStorage });
assert.equal(repairedAppearance.migrated, true);
assert.equal(repairedAppearance.appearance.overrides.light, "parchment");
assert.doesNotThrow(() => JSON.parse(corruptAppearanceStorage.getItem("lw_appearance_v2")));

const futureAppearanceStorage = storageFrom({
  lw_appearance_v2: JSON.stringify({
    schemaVersion: 3,
    colorScheme: "dark",
    themeFamily: "rose",
    overrides: { dark: "rose-night" },
  }),
});
const futureAppearance = catalog.migrateStoredAppearance({ storage: futureAppearanceStorage });
assert.equal(futureAppearance.source, "v2");
assert.equal(futureAppearance.migrated, false);
assert.equal(futureAppearanceStorage.writes.length, 0, "An older client should not overwrite a future schema");

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
assert.equal(v2Appearance.migrated, false);
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
assert.match(appSource, /const initialAppearance = migrateStoredAppearance\(\)\.appearance/);
assert.match(extractFunction("captureCloudSnapshot"), /\.\.\.appearanceSnapshotSettings\(state\.appearance\)/);
assert.match(extractFunction("normalizeCloudRow"), /migrateAppearanceSettings\(row\.settings\)/);
assert.match(extractFunction("mergeCloudSnapshots"), /latestAppearanceSettings/);
assert.match(extractFunction("latestAppearanceSettings"), /updatedAt/);
assert.match(extractFunction("latestAppearanceSettings"), /appearanceSettingsRecord/);
assert.match(extractFunction("applyCloudSnapshot"), /applyResolvedAppearance\(appearanceFromSnapshotSettings\(settings\)\)/);
assert.match(extractFunction("applyCloudSnapshot"), /migrateAppearanceSettings\(snapshot\.settings\)/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /writeStoredAppearance\(settings\.appearance\)/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /mirrorAppearanceToLegacyStorage/);
assert.match(extractFunction("setThemePreset"), /overrides: \{ \[state\.theme\]/);
assert.match(extractFunction("setThemeMode"), /colorScheme: mode/);
assert.match(extractFunction("setThemeFamily"), /themeFamily: resolvedFamily/);
assert.match(extractFunction("setThemeFamily"), /light: null, dark: null, bigScreen: null/);
assert.match(extractFunction("setPresentationTheme"), /overrides: \{ bigScreen:/);
assert.match(extractFunction("themeFamilySettingsChoices"), /Custom mix/);
assert.match(extractFunction("themeFamilySettingsChoices"), /themeFamilies\.map/);
assert.match(extractFunction("themeFamilyPreviewColors"), /themeChromeColor\(lightPreset, "light"\)/);
assert.match(extractFunction("themeFamilyPreviewColors"), /themeChromeColor\(darkPreset, "dark"\)/);
assert.doesNotMatch(extractFunction("themeFamilyPreviewColors"), /presentationThemeColor/);
assert.match(extractFunction("themePresetSettingsChoices"), /previewColors: \[themeChromeColor/);
assert.match(extractFunction("presentationThemeSettingsChoices"), /previewColors: \[presentationThemeColor/);
assert.match(appSource, /settingsChoiceMarkup\("themeFamilySelect"/);
assert.match(appSource, /settingsChoiceMarkup\("mobileThemeFamilySelect"/);
assert.match(appSource, /settingsChoiceMarkup\("presentationThemeFamilySelect"/);
assert.match(appSource, /Links Light, Dark, and Big Screen colors/);
assert.match(appSource, /getElementById\("themeFamilySelect"\).*setThemeFamily/s);
assert.match(appSource, /getElementById\("mobileThemeFamilySelect"\).*setThemeFamily/s);
assert.match(appSource, /getElementById\("presentationThemeFamilySelect"\).*setThemeFamily/s);

const appearanceMergeContext = {
  normalizeAppearance: catalog.normalizeAppearance,
  appearanceFromLegacyValues: catalog.appearanceFromLegacyValues,
  resolveAppearance: catalog.resolveAppearance,
  window: { matchMedia: () => ({ matches: false }) },
  normalizedVersionsUpdatedAt(value) {
    const timestamp = Date.parse(value || "");
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  },
};
vm.createContext(appearanceMergeContext);
vm.runInContext(`
  ${extractFunction("appearanceFromSnapshotSettings")}
  ${extractFunction("hasLegacyAppearanceSettings")}
  ${extractFunction("appearanceSettingsRecord")}
  ${extractFunction("migrateAppearanceSettings")}
  ${extractFunction("resolvedAppearanceForScheme")}
  ${extractFunction("appearanceSnapshotSettings")}
  ${extractFunction("latestAppearanceSettings")}
  globalThis.latestAppearance = latestAppearanceSettings;
  globalThis.migrateSettings = migrateAppearanceSettings;
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

const legacyCloudSettings = {
  themeMode: "dark",
  themePresetLight: "opal",
  themePresetDark: "nocturne",
  presentationTheme: "warm",
  scriptureFont: "lora",
};
const migratedCloudSettings = appearanceMergeContext.migrateSettings(legacyCloudSettings);
assert.equal(migratedCloudSettings.scriptureFont, "lora", "Migration should preserve unrelated settings");
assert.equal(migratedCloudSettings.appearance.colorScheme, "dark");
assert.equal(migratedCloudSettings.appearance.overrides.light, "opal");
assert.equal(migratedCloudSettings.appearance.overrides.dark, "nocturne");
assert.equal(migratedCloudSettings.appearance.overrides.bigScreen, "warm");
assert.equal(migratedCloudSettings.appearance.updatedAt, "");
assert.equal(
  appearanceMergeContext.latestAppearance(
    legacyCloudSettings,
    { appearance: catalog.appearanceFromLegacyValues({}) },
  ).appearance.overrides.dark,
  "nocturne",
  "Legacy cloud appearance should retain existing precedence over an unchanged local migration",
);
assert.equal(
  appearanceMergeContext.latestAppearance(
    legacyCloudSettings,
    {
      appearance: catalog.updateAppearance(
        catalog.appearanceFromLegacyValues({}),
        { themeFamily: "violet" },
        "2026-08-21T15:00:00.000Z",
      ),
    },
  ).appearance.themeFamily,
  "violet",
  "A real local edit should beat an untimestamped legacy cloud migration",
);
const editedLocalSelection = appearanceMergeContext.latestAppearance(
  legacyCloudSettings,
  {
    appearance: catalog.updateAppearance(
      catalog.appearanceFromLegacyValues({}),
      { themeFamily: "violet" },
      "2026-08-21T15:00:00.000Z",
    ),
  },
);
assert.equal(editedLocalSelection.themePresetLight, "lavender");
assert.equal(editedLocalSelection.themePresetDark, "violet-night");
assert.equal(
  editedLocalSelection.presentationTheme,
  "lavender",
  "Legacy cloud mirrors should be regenerated from the selected appearance",
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
