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
assert.equal(documentRef.documentElement.dataset.theme, "dark");
assert.equal(documentRef.documentElement.dataset.themePreset, "nocturne");
assert.equal(meta.content, "#07111f");

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
