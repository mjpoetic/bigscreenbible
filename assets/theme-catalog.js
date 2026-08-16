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
    { code: "midnight", name: "Midnight", mode: "dark" },
    { code: "chapel", name: "Chapel", mode: "dark" },
    { code: "aurora", name: "Aurora", mode: "dark" },
    { code: "rose-night", name: "Rose Night", mode: "dark" },
    { code: "violet-night", name: "Violet Night", mode: "dark" },
    { code: "nocturne", name: "Nocturne", mode: "dark" },
    { code: "contrast", name: "Contrast", mode: "dark" },
  ].map(Object.freeze));

  const themePresetLookup = Object.freeze(Object.fromEntries(
    themePresets.map((preset) => [preset.code, preset]),
  ));
  const defaultThemePresets = Object.freeze({ light: "sapphire", dark: "aurora" });

  const presentationThemes = Object.freeze([
    { code: "deep", name: "Deep" },
    { code: "warm", name: "Warm" },
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

  const presentationThemeColors = Object.freeze({
    deep: "#004f54",
    warm: "#4b3021",
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
    midnight: "#111827",
    chapel: "#12100d",
    aurora: "#111d37",
    "rose-night": "#281323",
    "violet-night": "#1d1735",
    nocturne: "#07111f",
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

  function themeChromeColor(preset, theme = "light") {
    const resolvedPreset = resolveThemePreset(theme, preset);
    return themeChromeColors[resolvedPreset] || themeChromeColors[defaultThemePresets[theme === "dark" ? "dark" : "light"]];
  }

  function presentationThemeColor(theme) {
    return presentationThemeColors[resolvePresentationTheme(theme)] || presentationThemeColors[defaultPresentationTheme];
  }

  function storedThemeAppearance(options = {}) {
    const storage = options.storage || global.localStorage;
    const prefersDark = typeof options.prefersDark === "boolean"
      ? options.prefersDark
      : Boolean(global.matchMedia?.("(prefers-color-scheme: dark)").matches);
    const savedMode = storage?.getItem?.("lw_theme");
    const theme = resolveThemeMode(savedMode, prefersDark);
    const savedPreset = storage?.getItem?.(`lw_theme_preset_${theme}`);
    const preset = resolveThemePreset(theme, savedPreset);
    return Object.freeze({
      followsSystem: savedMode !== "light" && savedMode !== "dark",
      theme,
      preset,
      chromeColor: themeChromeColor(preset, theme),
    });
  }

  function applyStoredTheme(options = {}) {
    const documentRef = options.document || global.document;
    const appearance = storedThemeAppearance(options);
    if (!documentRef?.documentElement) return appearance;
    documentRef.documentElement.dataset.theme = appearance.theme;
    documentRef.documentElement.dataset.themePreset = appearance.preset;
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
      if (!storage?.getItem?.("lw_theme")) apply();
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
    presentationThemes,
    presentationThemeCodes,
    defaultPresentationTheme,
    presentationThemeColors,
    themeChromeColors,
    resolveThemeMode,
    resolveThemePreset,
    resolvePresentationTheme,
    themeChromeColor,
    presentationThemeColor,
    storedThemeAppearance,
    applyStoredTheme,
    watchStoredTheme,
  });
})(globalThis);
