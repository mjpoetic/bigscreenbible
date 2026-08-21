(function initializeThemeCatalog(global) {
  "use strict";

  const themePresets = Object.freeze([
    { code: "paper", name: "Paper", mode: "light" },
    { code: "parchment", name: "Parchment", mode: "light" },
    { code: "clarity", name: "Clarity", mode: "light" },
    { code: "dawn", name: "Dawn", mode: "light" },
    { code: "meadow", name: "Meadow", mode: "light" },
    { code: "blush", name: "Blush", mode: "light" },
    { code: "lavender", name: "Lavender", mode: "light" },
    { code: "sapphire", name: "Sapphire", mode: "light" },
    { code: "opal", name: "Opal", mode: "light" },
    { code: "clementine", name: "Clementine", mode: "light" },
    { code: "midnight", name: "Midnight", mode: "dark" },
    { code: "chapel", name: "Chapel", mode: "dark" },
    { code: "aurora", name: "Aurora", mode: "dark" },
    { code: "dusk", name: "Dusk", mode: "dark" },
    { code: "forest-night", name: "Forest Night", mode: "dark" },
    { code: "rose-night", name: "Rose Night", mode: "dark" },
    { code: "violet-night", name: "Violet Night", mode: "dark" },
    { code: "nocturne", name: "Nocturne", mode: "dark" },
    { code: "ember-night", name: "Ember Night", mode: "dark" },
    { code: "contrast", name: "Contrast", mode: "dark" },
  ].map(Object.freeze));

  const themePresetLookup = Object.freeze(Object.fromEntries(
    themePresets.map((preset) => [preset.code, preset]),
  ));
  const defaultThemePresets = Object.freeze({ light: "sapphire", dark: "aurora" });
  const appearanceSchemaVersion = 2;
  const appearanceStorageKey = "lw_appearance_v2";

  const presentationThemes = Object.freeze([
    { code: "deep", name: "Deep" },
    { code: "warm", name: "Warm" },
    { code: "ember", name: "Ember" },
    { code: "paper", name: "Paper" },
    { code: "dawn", name: "Dawn" },
    { code: "aurora", name: "Aurora" },
    { code: "meadow", name: "Meadow" },
    { code: "blush", name: "Blush" },
    { code: "lavender", name: "Lavender" },
    { code: "sapphire", name: "Sapphire" },
    { code: "rose-night", name: "Rose Night" },
    { code: "violet-night", name: "Violet Night" },
    { code: "nocturne", name: "Nocturne" },
    { code: "midnight", name: "Midnight" },
    { code: "contrast", name: "Contrast" },
  ].map(Object.freeze));
  const presentationThemeCodes = Object.freeze(presentationThemes.map((theme) => theme.code));
  const defaultPresentationTheme = "aurora";

  const themeFamilies = Object.freeze([
    { code: "neutral", name: "Neutral", light: "paper", dark: "midnight", presentation: { light: "paper", dark: "midnight" } },
    { code: "heritage", name: "Heritage", light: "parchment", dark: "chapel", presentation: { light: "warm", dark: "warm" } },
    { code: "clarity", name: "Clarity", light: "clarity", dark: "contrast", presentation: { light: "paper", dark: "contrast" } },
    { code: "sunrise", name: "Sunrise", light: "dawn", dark: "dusk", presentation: { light: "dawn", dark: "warm" } },
    { code: "meadow", name: "Meadow", light: "meadow", dark: "forest-night", presentation: { light: "meadow", dark: "deep" } },
    { code: "rose", name: "Rose", light: "blush", dark: "rose-night", presentation: { light: "blush", dark: "rose-night" } },
    { code: "violet", name: "Violet", light: "lavender", dark: "violet-night", presentation: { light: "lavender", dark: "violet-night" } },
    { code: "sapphire", name: "Sapphire", light: "sapphire", dark: "aurora", presentation: { light: "aurora", dark: "aurora" } },
    { code: "celestial", name: "Celestial", light: "opal", dark: "nocturne", presentation: { light: "aurora", dark: "nocturne" } },
    { code: "ember", name: "Ember", light: "clementine", dark: "ember-night", presentation: { light: "ember", dark: "ember" } },
  ].map((family) => Object.freeze({
    ...family,
    presentation: Object.freeze({ ...family.presentation }),
  })));
  const themeFamilyLookup = Object.freeze(Object.fromEntries(
    themeFamilies.map((family) => [family.code, family]),
  ));
  const defaultThemeFamily = "sapphire";

  const presentationThemeColors = Object.freeze({
    deep: "#004f54",
    warm: "#4b3021",
    ember: "#5a210f",
    paper: "#f9f2e4",
    dawn: "#f7c986",
    aurora: "#102433",
    meadow: "#b8d99e",
    blush: "#f5d7e6",
    lavender: "#e7ddfb",
    sapphire: "#dbeafe",
    "rose-night": "#281121",
    "violet-night": "#1b1534",
    nocturne: "#07111f",
    midnight: "#111827",
    contrast: "#000000",
  });

  const themeChromeColors = Object.freeze({
    paper: "#f8f7f3",
    parchment: "#f3ecdd",
    clarity: "#f5f7f8",
    dawn: "#f7ead2",
    meadow: "#e5f0d8",
    blush: "#f8e5ee",
    lavender: "#eae3fb",
    sapphire: "#dbeafe",
    opal: "#dcecff",
    clementine: "#f4dcc5",
    midnight: "#111827",
    chapel: "#12100d",
    aurora: "#111d37",
    dusk: "#2a1824",
    "forest-night": "#10251b",
    "rose-night": "#281323",
    "violet-night": "#1d1735",
    nocturne: "#07111f",
    "ember-night": "#2a120d",
    contrast: "#000000",
  });

  function resolveThemeMode(savedMode, prefersDark = false) {
    if (savedMode === "light" || savedMode === "dark") return savedMode;
    return prefersDark ? "dark" : "light";
  }

  function resolveThemePreset(theme, savedPreset) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    if (themePresetLookup[savedPreset]?.mode === normalizedTheme) return savedPreset;
    return defaultThemePresets[normalizedTheme];
  }

  function resolvePresentationTheme(savedTheme) {
    return presentationThemeCodes.includes(savedTheme) ? savedTheme : defaultPresentationTheme;
  }

  function resolveThemeFamily(savedFamily) {
    return themeFamilyLookup[savedFamily] ? savedFamily : defaultThemeFamily;
  }

  function resolveThemeFamilyPreset(family, theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    const resolvedFamily = themeFamilyLookup[resolveThemeFamily(family)];
    return resolveThemePreset(normalizedTheme, resolvedFamily?.[normalizedTheme]);
  }

  function resolveThemeFamilyPresentation(family, theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    const resolvedFamily = themeFamilyLookup[resolveThemeFamily(family)];
    return resolvePresentationTheme(resolvedFamily?.presentation?.[normalizedTheme]);
  }

  function normalizeAppearance(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const colorScheme = ["system", "light", "dark"].includes(source.colorScheme)
      ? source.colorScheme
      : "system";
    const themeFamily = resolveThemeFamily(source.themeFamily);
    const sourceOverrides = source.overrides && typeof source.overrides === "object"
      ? source.overrides
      : {};
    const overrides = Object.freeze({
      light: themePresetLookup[sourceOverrides.light]?.mode === "light" ? sourceOverrides.light : null,
      dark: themePresetLookup[sourceOverrides.dark]?.mode === "dark" ? sourceOverrides.dark : null,
      bigScreen: presentationThemeCodes.includes(sourceOverrides.bigScreen) ? sourceOverrides.bigScreen : null,
    });
    return Object.freeze({
      schemaVersion: appearanceSchemaVersion,
      colorScheme,
      themeFamily,
      overrides,
      updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : "",
    });
  }

  function hasAppearanceOverrides(appearance) {
    const normalized = normalizeAppearance(appearance);
    return Boolean(normalized.overrides.light || normalized.overrides.dark || normalized.overrides.bigScreen);
  }

  function resolveAppearance(appearance, prefersDark = false) {
    const normalized = normalizeAppearance(appearance);
    const theme = resolveThemeMode(normalized.colorScheme, prefersDark);
    const preset = normalized.overrides[theme]
      || resolveThemeFamilyPreset(normalized.themeFamily, theme);
    const presentationTheme = normalized.overrides.bigScreen
      || resolveThemeFamilyPresentation(normalized.themeFamily, theme);
    return Object.freeze({
      appearance: normalized,
      followsSystem: normalized.colorScheme === "system",
      customized: hasAppearanceOverrides(normalized),
      theme,
      preset,
      presentationTheme,
      chromeColor: themeChromeColor(preset, theme),
      presentationChromeColor: presentationThemeColor(presentationTheme),
    });
  }

  function updateAppearance(appearance, updates = {}, updatedAt = new Date().toISOString()) {
    const current = normalizeAppearance(appearance);
    const nextOverrides = updates.overrides && typeof updates.overrides === "object"
      ? { ...current.overrides, ...updates.overrides }
      : current.overrides;
    return normalizeAppearance({
      ...current,
      ...updates,
      overrides: nextOverrides,
      updatedAt,
    });
  }

  function appearanceFromLegacyValues(values = {}) {
    const savedMode = values.colorScheme;
    const colorScheme = savedMode === "light" || savedMode === "dark" ? savedMode : "system";
    const themeFamily = defaultThemeFamily;
    const familyLight = resolveThemeFamilyPreset(themeFamily, "light");
    const familyDark = resolveThemeFamilyPreset(themeFamily, "dark");
    const savedLight = resolveThemePreset("light", values.light);
    const savedDark = resolveThemePreset("dark", values.dark);
    const savedPresentation = resolvePresentationTheme(values.bigScreen);
    const familyPresentationLight = resolveThemeFamilyPresentation(themeFamily, "light");
    const familyPresentationDark = resolveThemeFamilyPresentation(themeFamily, "dark");
    return normalizeAppearance({
      colorScheme,
      themeFamily,
      overrides: {
        light: savedLight === familyLight ? null : savedLight,
        dark: savedDark === familyDark ? null : savedDark,
        bigScreen: savedPresentation === familyPresentationLight && savedPresentation === familyPresentationDark
          ? null
          : savedPresentation,
      },
    });
  }

  function appearanceFromLegacy(options = {}) {
    const storage = options.storage || global.localStorage;
    return appearanceFromLegacyValues({
      colorScheme: storage?.getItem?.("lw_theme"),
      light: storage?.getItem?.("lw_theme_preset_light"),
      dark: storage?.getItem?.("lw_theme_preset_dark"),
      bigScreen: storage?.getItem?.("lw_presentation_theme"),
    });
  }

  function readStoredAppearance(options = {}) {
    const storage = options.storage || global.localStorage;
    try {
      const saved = JSON.parse(storage?.getItem?.(appearanceStorageKey) || "null");
      if (
        saved
        && typeof saved === "object"
        && Number(saved.schemaVersion) >= appearanceSchemaVersion
      ) {
        return Object.freeze({ appearance: normalizeAppearance(saved), source: "v2" });
      }
    } catch {
      // Fall through to the non-writing legacy compatibility adapter.
    }
    return Object.freeze({ appearance: appearanceFromLegacy({ storage }), source: "legacy" });
  }

  function writeStoredAppearance(appearance, options = {}) {
    const storage = options.storage || global.localStorage;
    const normalized = normalizeAppearance(appearance);
    storage?.setItem?.(appearanceStorageKey, JSON.stringify(normalized));
    return normalized;
  }

  function migrateStoredAppearance(options = {}) {
    const storage = options.storage || global.localStorage;
    const stored = readStoredAppearance({ storage });
    if (stored.source === "v2") {
      return Object.freeze({ ...stored, migrated: false });
    }
    try {
      const appearance = writeStoredAppearance(stored.appearance, { storage });
      return Object.freeze({ appearance, source: stored.source, migrated: true });
    } catch {
      return Object.freeze({ ...stored, migrated: false });
    }
  }

  function themeChromeColor(preset, theme = "light") {
    const resolvedPreset = resolveThemePreset(theme, preset);
    return themeChromeColors[resolvedPreset] || themeChromeColors[defaultThemePresets[theme === "dark" ? "dark" : "light"]];
  }

  function presentationThemeColor(theme) {
    return presentationThemeColors[resolvePresentationTheme(theme)] || presentationThemeColors[defaultPresentationTheme];
  }

  function storedThemeAppearance(options = {}) {
    const prefersDark = typeof options.prefersDark === "boolean"
      ? options.prefersDark
      : Boolean(global.matchMedia?.("(prefers-color-scheme: dark)").matches);
    const stored = options.migrate === false
      ? readStoredAppearance(options)
      : migrateStoredAppearance(options);
    const resolved = resolveAppearance(stored.appearance, prefersDark);
    return Object.freeze({
      ...resolved,
      source: stored.source,
      migrated: Boolean(stored.migrated),
    });
  }

  function applyStoredTheme(options = {}) {
    const documentRef = options.document || global.document;
    const appearance = storedThemeAppearance(options);
    if (!documentRef?.documentElement) return appearance;
    documentRef.documentElement.dataset.theme = appearance.theme;
    documentRef.documentElement.dataset.themePreset = appearance.preset;
    documentRef.documentElement.dataset.themeFamily = appearance.appearance.themeFamily;
    documentRef.documentElement.dataset.themeCustomized = appearance.customized ? "true" : "false";
    documentRef.querySelector?.('meta[name="theme-color"]')
      ?.setAttribute("content", appearance.chromeColor);
    return appearance;
  }

  function watchStoredTheme(options = {}) {
    const storage = options.storage || global.localStorage;
    const mediaQuery = options.mediaQuery || global.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => applyStoredTheme({
      ...options,
      storage,
      prefersDark: Boolean(mediaQuery?.matches),
    });
    const handleChange = () => {
      if (readStoredAppearance({ storage }).appearance.colorScheme === "system") apply();
    };
    const appearance = apply();
    mediaQuery?.addEventListener?.("change", handleChange);
    return Object.freeze({
      appearance,
      stop() {
        mediaQuery?.removeEventListener?.("change", handleChange);
      },
    });
  }

  global.BigScreenBibleThemeCatalog = Object.freeze({
    themePresets,
    themePresetLookup,
    defaultThemePresets,
    appearanceSchemaVersion,
    appearanceStorageKey,
    presentationThemes,
    presentationThemeCodes,
    defaultPresentationTheme,
    themeFamilies,
    themeFamilyLookup,
    defaultThemeFamily,
    presentationThemeColors,
    themeChromeColors,
    resolveThemeMode,
    resolveThemePreset,
    resolvePresentationTheme,
    resolveThemeFamily,
    resolveThemeFamilyPreset,
    resolveThemeFamilyPresentation,
    normalizeAppearance,
    hasAppearanceOverrides,
    resolveAppearance,
    updateAppearance,
    appearanceFromLegacyValues,
    appearanceFromLegacy,
    readStoredAppearance,
    writeStoredAppearance,
    migrateStoredAppearance,
    themeChromeColor,
    presentationThemeColor,
    storedThemeAppearance,
    applyStoredTheme,
    watchStoredTheme,
  });
})(globalThis);
