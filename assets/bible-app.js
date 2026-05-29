const bookDefinitions = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34],
  ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24],
  ["1 Kings", 22], ["2 Kings", 25], ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10],
  ["Nehemiah", 13], ["Esther", 10], ["Job", 42], ["Psalm", 150], ["Proverbs", 31],
  ["Ecclesiastes", 12], ["Song of Songs", 8], ["Isaiah", 66], ["Jeremiah", 52], ["Lamentations", 5],
  ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9],
  ["Obadiah", 1], ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3],
  ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4], ["Matthew", 28],
  ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16],
  ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4],
  ["Colossians", 4], ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6], ["2 Timothy", 4],
  ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5], ["1 Peter", 5],
  ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

const books = bookDefinitions.map(([book]) => book);

const oldTestamentBooks = books.slice(0, books.indexOf("Matthew"));
const newTestamentBooks = books.slice(books.indexOf("Matthew"));
const testamentGroups = [
  ["Old Testament", oldTestamentBooks],
  ["New Testament", newTestamentBooks],
];

const bookAliases = buildBookAliases();

const translations = [
  { code: "KJV", name: "King James Version", status: "bundled" },
  { code: "BSB", name: "Berean Standard Bible", status: "bundled" },
  { code: "WEB", name: "World English Bible", status: "bundled" },
  { code: "ASV", name: "American Standard Version", status: "bundled" },
  { code: "BBE", name: "Bible in Basic English", status: "bundled" },
];

const translationCodes = translations.map((translation) => translation.code);
const translationLookup = Object.fromEntries(translations.map((translation) => [translation.code, translation]));

const themePresets = [
  { code: "paper", name: "Paper", mode: "light" },
  { code: "parchment", name: "Parchment", mode: "light" },
  { code: "clarity", name: "Clarity", mode: "light" },
  { code: "midnight", name: "Midnight", mode: "dark" },
  { code: "chapel", name: "Chapel", mode: "dark" },
  { code: "contrast", name: "Contrast", mode: "dark" },
];
const themePresetLookup = Object.fromEntries(themePresets.map((preset) => [preset.code, preset]));
const defaultThemePresets = { light: "paper", dark: "midnight" };
const presentationThemes = [
  { code: "deep", name: "Deep" },
  { code: "warm", name: "Warm" },
  { code: "paper", name: "Paper" },
  { code: "midnight", name: "Midnight" },
  { code: "contrast", name: "Contrast" },
];
const presentationThemeCodes = presentationThemes.map((theme) => theme.code);

let bibleData = {};
let bibleIndex = null;
let dataLoading = true;
let dataError = "";
let strongLexicon = {};
let strongLexiconStatus = "idle";
let strongLexiconPromise = null;
let presentationControlsTimer = 0;

const loadedVersionData = new Map();
const loadingVersions = new Set();
const strongLexiconSources = [
  {
    name: "Open Scriptures Hebrew Strong's",
    globalName: "strongsHebrewDictionary",
    url: "https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/hebrew/strongs-hebrew-dictionary.js",
  },
  {
    name: "Open Scriptures Greek Strong's",
    globalName: "strongsGreekDictionary",
    url: "https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/greek/strongs-greek-dictionary.js",
  },
];

const sampleStrongRefs = {
  "John 3:1": [{ word: "Nicodemus", code: "G3530" }],
  "John 3:2": [{ word: "Rabbi", code: "G4461" }],
  "John 3:3": [{ word: "again", code: "G509" }],
  "John 3:5": [{ word: "water", code: "G5204" }, { word: "Spirit", code: "G4151" }],
  "John 3:6": [{ word: "flesh", code: "G4561" }],
  "John 3:16": [{ word: "God", code: "G2316" }, { word: "loved", code: "G25" }, { word: "world", code: "G2889" }, { word: "life", code: "G2222" }],
  "John 3:17": [{ word: "saved", code: "G4982" }],
  "Psalm 23:1": [{ word: "shepherd", code: "H7462" }],
  "Psalm 23:2": [{ word: "waters", code: "H4325" }],
  "Psalm 23:3": [{ word: "restoreth", code: "H7725" }],
  "Psalm 23:4": [{ word: "fear", code: "H3372" }],
  "Psalm 23:6": [{ word: "mercy", code: "H2617" }],
  "Romans 8:1": [{ word: "condemnation", code: "G2631" }],
  "Romans 8:28": [{ word: "work", code: "G4903" }, { word: "good", code: "G18" }],
  "Romans 8:39": [{ word: "love", code: "G26" }],
};

const strongs = {
  G2316: ["theos", "God, the Lord; used of the Father, Son, or Holy Spirit."],
  G3530: ["Nikodemos", "Nicodemus; a Pharisee and ruler of the Jews who came to Jesus by night."],
  G4461: ["rhabbi", "Rabbi; an honorary title meaning teacher or master."],
  G509: ["anothen", "From above, from the beginning, anew, or again."],
  G25: ["agapao", "To love dearly, prefer, or welcome with active affection."],
  G2889: ["kosmos", "The world; ordered creation, humanity, or the inhabited earth."],
  G2222: ["zoe", "Life, especially fullness of life from God."],
  G5204: ["hydor", "Water; used literally and figuratively of cleansing and life."],
  G4151: ["pneuma", "Spirit, wind, breath; often the Holy Spirit."],
  G4561: ["sarx", "Flesh; human nature, the physical body, or natural descent."],
  G4982: ["sozo", "To save, rescue, heal, preserve, or make whole."],
  H7462: ["ra'ah", "To shepherd, pasture, feed, or tend a flock."],
  H4325: ["mayim", "Waters; water in literal, poetic, or symbolic uses."],
  H7725: ["shub", "To turn back, restore, return, or bring back."],
  H3372: ["yare", "To fear, revere, honor, or stand in awe."],
  H2617: ["chesed", "Mercy, steadfast love, kindness, covenant loyalty."],
  G2631: ["katakrima", "Condemnation, penalty, or adverse sentence."],
  G4903: ["synergeo", "To work together, cooperate, assist."],
  G18: ["agathos", "Good, beneficial, upright, useful, or intrinsically good."],
  G26: ["agape", "Love, goodwill, affection, benevolence, or self-giving devotion."],
};

const state = {
  mode: "reader",
  reference: "John 3",
  verse: 16,
  versions: JSON.parse(localStorage.getItem("lw_versions") || '["KJV","WEB"]'),
  theme: savedTheme(),
  themePreset: "",
  textScale: Number(localStorage.getItem("lw_text_scale") || 1),
  focusMode: savedFocusMode(),
  libraryOpen: localStorage.getItem("lw_library_open") !== "false",
  studyOpen: localStorage.getItem("lw_study_open") !== "false",
  activeRail: "Verse",
  selectedStrong: "G2316",
  selectedStrongWord: "God",
  panelOpen: false,
  mobileControlsOpen: false,
  presentationSearchOpen: false,
  presentationSettingsOpen: false,
  presentationControlsVisible: true,
  presentationTheme: localStorage.getItem("lw_presentation_theme") || "deep",
  settingsOpen: false,
  shortcutsOpen: false,
  pendingPanelFocus: null,
  pendingVerseFocus: false,
  selectedVerses: [],
  bookmarks: JSON.parse(localStorage.getItem("lw_bookmarks") || '["John 3:16","Psalm 23:1"]'),
  notes: JSON.parse(localStorage.getItem("lw_notes") || '{"John 3:16":"This verse is the heart of the Gospel. Mark for Sabbath worship display."}'),
};

state.versions = state.versions.filter((version) => translationCodes.includes(version));
if (state.versions.length === 0) state.versions = ["KJV", "WEB"];
if (!state.versions.some((version) => translationLookup[version]?.status === "bundled")) state.versions.unshift("KJV");
state.themePreset = savedThemePreset(state.theme);
if (!presentationThemeCodes.includes(state.presentationTheme)) state.presentationTheme = "deep";

function savedTheme() {
  const theme = localStorage.getItem("lw_theme");
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function savedThemePreset(theme) {
  const saved = localStorage.getItem(`lw_theme_preset_${theme}`);
  if (themePresetLookup[saved]?.mode === theme) return saved;
  return defaultThemePresets[theme];
}

function watchSystemTheme() {
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!query) return;
  query.addEventListener("change", (event) => {
    if (localStorage.getItem("lw_theme")) return;
    state.theme = event.matches ? "dark" : "light";
    state.themePreset = savedThemePreset(state.theme);
    render();
  });
}

function savedFocusMode() {
  const saved = localStorage.getItem("lw_focus_mode");
  if (saved === "true") return true;
  if (saved === "false") return false;
  return true;
}

const icons = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 16v5"/></svg>',
  parallel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h7v14H4zM13 5h7v14h-7z"/><path d="M7 9h1M16 9h1M7 13h1M16 13h1"/></svg>',
  focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4"/><path d="M9 12h6"/></svg>',
  panels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M8 4v16M16 4v16"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.2-1.2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.64.8 1.03 1.51 1.03H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg>',
};

state.textScale = clampTextScale(state.textScale);

function currentChapter() {
  return bibleData[state.reference] || bibleData["John 3"] || { title: state.reference, verses: [] };
}

function currentVerse() {
  return currentChapter().verses.find((verse) => verse.n === state.verse) || currentChapter().verses[0] || { n: state.verse };
}

function currentBookName() {
  return books
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((book) => state.reference.startsWith(`${book} `)) || state.reference.replace(/\s+\d+$/, "");
}

function currentBookChapterKeys() {
  const book = currentBookName();
  return Object.keys(bibleData).filter((key) => key.startsWith(`${book} `));
}

function referenceLabel() {
  return `${state.reference}:${state.verse}`;
}

function mainGridClass() {
  if (state.focusMode) return "main-grid focus-mode";
  return [
    "main-grid",
    !state.libraryOpen ? "library-closed" : "",
    !state.studyOpen ? "study-closed" : "",
  ].filter(Boolean).join(" ");
}

function versionLimit() {
  return window.matchMedia?.("(max-width: 840px)")?.matches ? 2 : 3;
}

function enforceVersionLimit() {
  const limit = versionLimit();
  if (state.versions.length <= limit) return;
  state.versions = state.versions.slice(0, limit);
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
}

function activeVersions() {
  return state.versions.slice(0, versionLimit());
}

function render() {
  const app = document.querySelector("#app");
  if (dataLoading || dataError) {
    app.innerHTML = loadingScreen();
    return;
  }
  enforceVersionLimit();
  if (state.mode !== "big") state.presentationControlsVisible = true;
  app.innerHTML = `
    <main class="app-shell ${state.panelOpen ? "panel-open" : ""} ${state.focusMode ? "focus-shell" : ""} ${state.mobileControlsOpen ? "mobile-controls-open" : ""}" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" style="--text-scale: ${state.textScale}">
      ${topbar()}
      <section class="${mainGridClass()}" style="${textFontVars()}">
        ${state.focusMode ? "" : rail()}
        ${state.focusMode || !state.libraryOpen ? "" : library()}
        ${reader()}
        ${state.focusMode || !state.studyOpen ? "" : studyPanel()}
      </section>
      ${bottombar()}
      ${presentation()}
      ${shortcutOverlay()}
      ${printSheet()}
      <div class="status-toast" id="toast"></div>
    </main>
  `;
  bindEvents();
  if (state.pendingVerseFocus) {
    state.pendingVerseFocus = false;
    requestAnimationFrame(scrollSelectedVerseIntoView);
  }
  if (state.pendingPanelFocus) {
    const target = state.pendingPanelFocus;
    state.pendingPanelFocus = null;
    requestAnimationFrame(() => focusWorkspaceTarget(target));
  }
  requestAnimationFrame(fitPresentationText);
  requestAnimationFrame(applyTextScaleVars);
}

function renderPreservingReaderScroll() {
  const scrollState = captureReaderScroll();
  render();
  requestAnimationFrame(() => restoreReaderScroll(scrollState));
}

function captureReaderScroll() {
  const scripture = document.querySelector(".scripture");
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    scriptureTop: scripture?.scrollTop ?? null,
    scriptureLeft: scripture?.scrollLeft ?? null,
  };
}

function restoreReaderScroll(scrollState) {
  if (!scrollState) return;
  const scripture = document.querySelector(".scripture");
  if (scripture && scrollState.scriptureTop !== null) {
    scripture.scrollTop = scrollState.scriptureTop;
    scripture.scrollLeft = scrollState.scriptureLeft || 0;
  }
  window.scrollTo(scrollState.windowX, scrollState.windowY);
}

function loadingScreen() {
  const message = dataError || "Loading full Bible texts...";
  return `
    <main class="app-shell focus-shell" data-theme="${state.theme}" data-theme-preset="${state.themePreset}">
      <section class="reader loading-reader">
        <div class="loading-card">
          <div class="brand-mark">${icons.book}</div>
          <h1>Big Screen Bible</h1>
          <p>${message}</p>
          ${dataError ? '<button class="primary-btn" onclick="location.reload()">Retry</button>' : ""}
        </div>
      </section>
    </main>
  `;
}

function topbar() {
  const selectedVersions = activeVersions();
  const maxVersions = versionLimit();
  const versionSelectLabel = selectedVersions.length >= maxVersions ? `Max ${maxVersions}` : "Add";
  const modeOptions = [
    ["reader", "Reader", icons.book],
    ["parallel", "Parallel Study", icons.parallel],
    ["big", "Big Screen", icons.screen],
  ];
  const focusLabel = state.focusMode ? "Show panels" : "Focus reading";
  const themeLabel = state.theme === "dark" ? "Light mode" : "Dark mode";
  const themePresetOptions = themePresets
    .filter((preset) => preset.mode === state.theme)
    .map((preset) => `<option value="${preset.code}" ${preset.code === state.themePreset ? "selected" : ""}>${preset.name}</option>`)
    .join("");
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">${icons.book}</div>
        <div>
          <div class="brand-title">Big Screen</div>
          <div class="brand-subtitle">Bible</div>
        </div>
      </div>
      <label class="search">${icons.search}<input id="referenceInput" value="${referenceLabel()}" aria-label="Search Bible reference" /></label>
      <button class="icon-btn mobile-controls-toggle ${state.mobileControlsOpen ? "active" : ""}" id="mobileControlsToggle" aria-label="${state.mobileControlsOpen ? "Hide extra controls" : "Show extra controls"}" data-tooltip="${state.mobileControlsOpen ? "Hide controls" : "More controls"}">${icons.plus}<span>More</span></button>
      <div class="versions" aria-label="Selected Bible versions">
        ${selectedVersions.map((version) => `<span class="version-pill">${version}<button data-remove-version="${version}" aria-label="Remove ${version}" data-tooltip="Remove ${version}">x</button></span>`).join("")}
        <select id="versionSelect" aria-label="Add Bible version" ${selectedVersions.length >= maxVersions ? "disabled" : ""}>
          <option>${versionSelectLabel}</option>
          ${translationCodes.filter((version) => !selectedVersions.includes(version)).map((version) => `<option value="${version}">${version}</option>`).join("")}
        </select>
      </div>
      <nav class="mode-tabs" aria-label="View mode">
        ${modeOptions.map(([mode, label, icon]) => `<button class="${state.mode === mode ? "active" : ""}" data-mode="${mode}" aria-label="${label}" data-tooltip="${label}">${icon}<span class="mode-label">${label}</span></button>`).join("")}
      </nav>
      <button class="icon-btn" id="shortcutsButton" aria-label="Keyboard shortcuts" data-tooltip="Keyboard shortcuts">?</button>
      <button class="icon-btn focus-toggle ${state.focusMode ? "active" : ""}" id="focusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}</button>
      <div class="settings-menu">
        <button class="icon-btn settings-toggle ${state.settingsOpen ? "active" : ""}" id="settingsToggle" aria-label="Settings" data-tooltip="Settings">${icons.settings}</button>
        <div class="settings-popover ${state.settingsOpen ? "open" : ""}" aria-hidden="${state.settingsOpen ? "false" : "true"}">
          <div class="setting-group">
            <label class="setting-label" for="themePresetSelect">Color theme</label>
            <select class="theme-preset-select" id="themePresetSelect" aria-label="Color theme">
              ${themePresetOptions}
            </select>
          </div>
          <div class="setting-row">
            <span class="setting-label">Mode</span>
            <button class="ghost-btn theme-toggle" id="themeToggle" aria-label="${themeLabel}">${state.theme === "dark" ? icons.sun : icons.moon}<span>${themeLabel}</span></button>
          </div>
          <div class="setting-group">
            <span class="setting-label">Text size</span>
            <div class="text-size-control" aria-label="Text size controls">
              <button class="icon-btn" id="decreaseText" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
              <button class="text-size-reset" id="resetText" aria-label="Reset text size to 100%" data-tooltip="Reset text size">Aa ${Math.round(state.textScale * 100)}%</button>
              <button class="icon-btn" id="increaseText" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
}

function rail() {
  const items = [
    ["Verse", icons.book],
    ["Bookmarks", icons.bookmark],
    ["Notes", icons.note],
    ["Cross-Refs", icons.link],
    ["Search", icons.search],
  ];
  return `<aside class="rail">${items.map(([label, icon]) => `<button class="${state.activeRail === label ? "active" : ""}" data-rail="${label}" aria-label="${label}" data-tooltip="${label}">${icon}</button>`).join("")}</aside>`;
}

function library() {
  const chapterKeys = currentBookChapterKeys();
  return `
    <aside class="library">
      <div class="panel-minihead">
        <span>Verse</span>
        <button class="icon-btn" id="closeLibrary" aria-label="Hide verse picker" data-tooltip="Hide verse picker">×</button>
      </div>
      <div class="select-row">
        <select id="chapterSelect">
          ${chapterKeys.map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}
        </select>
        <select id="verseSelect">
          ${currentChapter().verses.map((verse) => `<option ${verse.n === state.verse ? "selected" : ""}>${verse.n}</option>`).join("")}
        </select>
      </div>
      <div class="testament-groups">
        ${testamentGroups.map(([label, group]) => `
          <details class="testament-group" ${group.some((book) => state.reference.startsWith(book)) ? "open" : ""}>
            <summary><span>${label}</span><span>${icons.chevron}</span></summary>
            <div class="testament-books">
              ${group.map((book) => `<button class="book-row ${state.reference.startsWith(book) ? "active" : ""}" data-book="${book}">${book}</button>`).join("")}
            </div>
          </details>
        `).join("")}
      </div>
      <div class="library-footer">
        <strong>${activeVersions().join(" + ")}</strong>
        <span>KJV, BSB, WEB, ASV, and BBE are bundled as full texts from public-domain/open Scripture sources.</span>
        <span>Strong's dictionary lookups use the Open Scriptures Strong's dictionaries when the site can load them.</span>
      </div>
    </aside>
  `;
}

function reader() {
  const chapter = currentChapter();
  const chapterKeys = currentBookChapterKeys();
  return `
    <section class="reader">
      <div class="chapter-tools ${state.focusMode ? "compact" : ""}">
        <button class="icon-btn" id="prevVerse" aria-label="Previous verse" data-tooltip="Previous verse">‹</button>
        <button class="icon-btn" id="nextVerse" aria-label="Next verse" data-tooltip="Next verse">›</button>
        <div class="spacer"></div>
        <div class="compact-reference">${referenceLabel()} · ${activeVersions().join(" / ")}</div>
        <select class="full-control" id="chapterSelectInline">${chapterKeys.map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}</select>
        <select class="full-control" id="verseSelectInline">${chapter.verses.map((verse) => `<option ${verse.n === state.verse ? "selected" : ""}>${verse.n}</option>`).join("")}</select>
        <button class="icon-btn" id="bookmarkBtn" aria-label="Bookmark" data-tooltip="Bookmark verse">${icons.bookmark}</button>
        <button class="icon-btn" id="noteBtn" aria-label="Add note" data-tooltip="Add note">${icons.note}</button>
        <button class="ghost-btn" id="openStudy">${icons.link} Study</button>
        <button class="ghost-btn compact-control" id="exitFocusInline">Show Panels</button>
      </div>
      <article class="scripture ${state.mode === "parallel" ? "parallel-mode" : ""}">
        ${state.mode === "parallel" ? parallelView() : readerView()}
      </article>
    </section>
  `;
}

function renderStrongText(verse, version) {
  const text = getVerseText(verse, version);
  return renderTextWithStrongNumbers(text, getStrongEntries(verse, version));
}

function getVerseText(verse, version) {
  if (verse[version]) return verse[version];
  if (loadingVersions.has(version)) return `Loading ${version}...`;
  return verse.KJV || verse.WEB || verse.ASV || verse.BSB || verse.BBE || "";
}

function getStrongEntries(verse, version) {
  if (Array.isArray(verse.strong?.[version])) return verse.strong[version].map(([word, code]) => ({ word, code }));
  if (Array.isArray(verse.strong)) return verse.strong.map((entry) => Array.isArray(entry) ? { word: entry[0], code: entry[1] } : entry);
  return sampleStrongRefs[`${state.reference}:${verse.n}`] || [];
}

function renderTextWithStrongNumbers(text, entries) {
  if (!entries.length) return escapeHtml(text);

  let output = "";
  let cursor = 0;
  entries.forEach(({ word, code }) => {
    if (!word || !code) return;
    const normalizedCode = normalizeStrongCode(code);
    if (!hasStrongEntry(normalizedCode)) return;
    const index = text.indexOf(word, cursor);
    if (index === -1) return;
    output += escapeHtml(text.slice(cursor, index));
    output += `<button class="strong-word" data-strong="${escapeHtml(normalizedCode)}" data-strong-word="${escapeHtml(word)}" aria-label="Open Strong's ${escapeHtml(normalizedCode)} for ${escapeHtml(word)}">${escapeHtml(word)}</button>`;
    cursor = index + word.length;
  });
  output += escapeHtml(text.slice(cursor));
  return output;
}

function normalizeStrongCode(code) {
  const match = String(code).trim().match(/^([HG])0*([0-9]+)$/i);
  if (!match) return String(code).trim().toUpperCase();
  return `${match[1].toUpperCase()}${Number(match[2])}`;
}

function strongEntry(code) {
  const normalizedCode = normalizeStrongCode(code);
  const openScripturesEntry = strongLexicon[normalizedCode];
  if (openScripturesEntry) return formatOpenScripturesStrongEntry(normalizedCode, openScripturesEntry);

  const starterEntry = strongs[normalizedCode];
  if (!starterEntry) return null;
  return {
    code: normalizedCode,
    lemma: starterEntry[0],
    definition: starterEntry[1],
    source: "Local starter entry",
  };
}

function hasStrongEntry(code) {
  if (strongEntry(code)) return true;
  return strongLexiconStatus === "loading";
}

function formatOpenScripturesStrongEntry(code, entry) {
  return {
    code,
    lemma: cleanStrongCopy(entry.lemma || entry.translit || entry.xlit || code),
    transliteration: cleanStrongCopy(entry.translit || entry.xlit || ""),
    pronunciation: cleanStrongCopy(entry.pron || ""),
    derivation: cleanStrongCopy(entry.derivation || ""),
    definition: cleanStrongCopy(entry.strongs_def || ""),
    kjv: cleanStrongCopy(entry.kjv_def || ""),
    source: "Open Scriptures Strong's",
  };
}

function cleanStrongCopy(value) {
  return String(value || "")
    .replace(/\{([^}]+)\}/g, "$1")
    .replace(/\[idiom\]/g, "idiom")
    .replace(/\[phrase\]/g, "phrase")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function readerView() {
  const version = state.versions[0] || "KJV";
  return `
    <h1 class="section-title">${currentChapter().title}</h1>
    ${currentChapter().verses.map((verse) => `
      <p class="verse ${verse.n === state.verse ? "selected" : ""} ${state.selectedVerses.includes(verse.n) ? "passage-selected" : ""}" data-verse="${verse.n}">
        <span class="verse-num">${verse.n}</span>
        <span class="verse-text">${renderStrongText(verse, version)}</span>
        <button class="verse-copy" data-copy-verse="${verse.n}" aria-label="Copy ${state.reference}:${verse.n}" data-tooltip="Copy verse">Copy</button>
      </p>
    `).join("")}
    ${selectionBar()}
  `;
}

function parallelView() {
  const versions = activeVersions();
  return `
    <div class="parallel-table" style="--version-count: ${versions.length}">
      <div class="parallel-head"><div>V</div>${versions.map((version) => `<div>${version}</div>`).join("")}</div>
      ${currentChapter().verses.map((verse) => `
        <div class="parallel-row ${verse.n === state.verse ? "selected" : ""} ${state.selectedVerses.includes(verse.n) ? "passage-selected" : ""}" data-verse="${verse.n}">
          <div class="verse-num">${verse.n}</div>
          ${versions.map((version) => `<div class="parallel-copy">${renderStrongText(verse, version)}</div>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function studyPanel() {
  const refs = crossReferenceItems();
  const strongLookup = strongEntry(state.selectedStrong);
  const strongClass = strongLookup ? "strong-card active-strong-card" : "strong-card";
  const selectedWord = state.selectedStrongWord ? `${state.selectedStrongWord} · ` : "";
  const strongStatus = strongLexiconStatus === "loading"
    ? "Open Scriptures lexicon is loading. Highlighted words will appear as definitions become available."
    : strongLexiconStatus === "unavailable"
      ? "Open Scriptures lexicon could not be loaded in this browser session. The reader still works, and local starter entries remain available."
    : "Select a highlighted word in the text to inspect its Strong's entry.";
  return `
    <aside class="study-panel">
      <div class="panel-tabs">
        <button class="${["Verse", "Cross-Refs", "Search"].includes(state.activeRail) ? "active" : ""}" data-panel-jump="Cross-Refs">Study</button>
        <button class="${state.activeRail === "Notes" ? "active" : ""}" data-panel-jump="Notes">Notes</button>
        <button class="${state.activeRail === "Bookmarks" ? "active" : ""}" data-panel-jump="Bookmarks">Bookmarks</button>
        <button id="togglePanel" aria-label="Hide study panel" data-tooltip="Hide study panel">×</button>
      </div>
      <section class="study-section" id="crossRefsSection">
        <div class="study-heading">${icons.link} Cross References</div>
        <div class="ref-list">
          ${refs.length
            ? refs.map((ref) => `<button class="ref-item" data-goto="${escapeHtml(ref.goto)}"><div class="ref-title">${escapeHtml(ref.label)}</div><div class="ref-copy">${escapeHtml(ref.preview)}</div></button>`).join("")
            : `<div class="empty-state">No cross references are bundled for ${escapeHtml(referenceLabel())}.</div>`}
        </div>
        <div class="source-note">
          Cross references from <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noopener">OpenBible.info</a>, CC-BY.
        </div>
      </section>
      <section class="study-section" id="strongSection">
        <div class="study-heading">${icons.search} Strong's Lookup</div>
        <div class="${strongClass}" id="strongLookup">
          ${strongLookup ? strongLookupCard(strongLookup, selectedWord) : `
            <div class="ref-title">Strong's lexicon</div>
            <div class="ref-copy">${strongStatus}</div>
          `}
        </div>
        <div class="source-note">
          Strong's dictionary data by James Strong with Open Scriptures CC-BY-SA editions.
          <a href="https://github.com/openscriptures/strongs" target="_blank" rel="noopener">Open Scriptures Strong's</a>
        </div>
      </section>
      <section class="study-section" id="notesSection">
        <div class="study-heading">${icons.note} Notes</div>
        <textarea class="note-box" id="noteBox" aria-label="Note for ${referenceLabel()}">${state.notes[referenceLabel()] || ""}</textarea>
        <button class="text-btn" id="saveNote">Save note</button>
      </section>
      <section class="study-section" id="bookmarksSection">
        <div class="study-heading">${icons.bookmark} Bookmarks</div>
        <div class="bookmark-list">
          ${state.bookmarks.map((ref) => `<button class="bookmark-item" data-goto="${ref}"><div class="bookmark-title">${ref}</div><div class="muted">Open bookmarked passage</div></button>`).join("")}
        </div>
      </section>
    </aside>
  `;
}

function crossReferenceItems() {
  const sourceRefs = window.BIGSCREEN_CROSS_REFS?.refs?.[referenceLabel()] || [];
  return sourceRefs.map(normalizeCrossReference).filter(Boolean);
}

function normalizeCrossReference(ref) {
  const label = Array.isArray(ref) ? ref[0] : ref;
  const goto = Array.isArray(ref) ? ref[1] : ref;
  if (!label || !goto) return null;
  return {
    label,
    goto,
    preview: crossReferencePreview(label, goto),
  };
}

function crossReferencePreview(label, goto) {
  const text = verseTextAtReference(goto);
  if (!text) return "Open passage";
  return truncatePreview(label === goto ? text : `${text} ...`);
}

function verseTextAtReference(ref) {
  const match = String(ref).match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return "";
  const key = `${match[1]} ${match[2]}`;
  const verse = bibleData[key]?.verses.find((item) => item.n === Number(match[3]));
  if (!verse) return "";
  return getVerseText(verse, state.versions[0] || "KJV");
}

function truncatePreview(value) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text;
}

function strongLookupCard(entry, selectedWord) {
  return `
    <div class="ref-title">${selectedWord}${entry.code} · ${escapeHtml(entry.lemma)}</div>
    ${entry.transliteration ? `<div class="strong-meta">Transliteration: ${escapeHtml(entry.transliteration)}</div>` : ""}
    ${entry.pronunciation ? `<div class="strong-meta">Pronunciation: ${escapeHtml(entry.pronunciation)}</div>` : ""}
    ${entry.derivation ? `<div class="ref-copy"><strong>Derivation:</strong> ${escapeHtml(entry.derivation)}</div>` : ""}
    ${entry.definition ? `<div class="ref-copy"><strong>Definition:</strong> ${escapeHtml(entry.definition)}</div>` : ""}
    ${entry.kjv ? `<div class="ref-copy"><strong>KJV usage:</strong> ${escapeHtml(entry.kjv)}</div>` : ""}
    <div class="source-note">${escapeHtml(entry.source)}</div>
  `;
}

function bottombar() {
  return `
    <footer class="bottombar">
      <button class="nav-button" id="prevChapter">‹ Previous Chapter</button>
      <div class="fineprint">${activeVersions().join(" / ")} · ${referenceLabel()}</div>
      <div>
        <button class="ghost-btn" id="copyVerse">Copy Verse</button>
        <button class="ghost-btn" id="printPage">Print</button>
      </div>
      <button class="nav-button" id="nextChapter">Next Chapter ›</button>
    </footer>
  `;
}

function selectionBar() {
  const count = state.selectedVerses.length;
  if (!count) return "";
  const label = count === 1 ? `${state.reference}:${state.selectedVerses[0]}` : `${state.reference}:${Math.min(...state.selectedVerses)}-${Math.max(...state.selectedVerses)}`;
  return `
    <div class="selection-bar" role="status">
      <span>${count} selected · ${label}</span>
      <button class="text-btn" id="copySelection">Copy passage</button>
      <button class="text-btn" id="printSelection">Print</button>
      <button class="text-btn" id="clearSelection">Clear</button>
    </div>
  `;
}

function presentation() {
  const verse = currentVerse();
  const version = state.versions[0] || "KJV";
  const text = getVerseText(verse, version);
  const verses = currentChapter().verses.map((item) => item.n);
  const verseIndex = verses.indexOf(state.verse);
  const canGoBack = verseIndex > 0;
  const canGoForward = verseIndex < verses.length - 1;
  const versionOptions = translationCodes
    .map((code) => `<option value="${code}" ${code === version ? "selected" : ""}>${code}</option>`)
    .join("");
  const themeOptions = presentationThemes
    .map((theme) => `<option value="${theme.code}" ${theme.code === state.presentationTheme ? "selected" : ""}>${theme.name}</option>`)
    .join("");
  return `
    <section class="presentation ${state.mode === "big" ? "open" : ""} ${state.presentationControlsVisible || state.presentationSearchOpen ? "controls-visible" : ""}" id="presentation" data-presentation-theme="${state.presentationTheme}">
      <div class="presentation-top">
        <div class="presentation-ref-tools">
          <div class="presentation-ref">
            <span>${referenceLabel()}</span>
          </div>
          <form class="presentation-search ${state.presentationSearchOpen ? "search-open" : ""}" id="presentationSearchForm">
            <button class="ghost-btn presentation-search-toggle" type="button" id="presentationSearchToggle" aria-label="Search passage" data-tooltip="Search passage">${icons.search}</button>
            <input id="presentationSearchInput" value="${referenceLabel()}" aria-label="Search passage in presentation" />
            <button class="ghost-btn presentation-search-go" type="submit">Go</button>
          </form>
        </div>
        <div class="presentation-actions">
          <div class="presentation-settings-menu">
            <button class="ghost-btn presentation-settings-toggle ${state.presentationSettingsOpen ? "active" : ""}" type="button" id="presentationSettingsToggle" aria-label="Big Screen settings" data-tooltip="Big Screen settings">${icons.settings}</button>
            <div class="presentation-settings-popover ${state.presentationSettingsOpen ? "open" : ""}" aria-hidden="${state.presentationSettingsOpen ? "false" : "true"}">
              <label>
                <span>Theme</span>
                <select id="presentationThemeSelect" class="presentation-theme-select" aria-label="Change Big Screen theme">
                  ${themeOptions}
                </select>
              </label>
              <label>
                <span>Bible version</span>
                <select id="presentationVersionSelect" class="presentation-version-select" aria-label="Change Bible version">
                  ${versionOptions}
                </select>
              </label>
              <div class="presentation-help">
                <span>Keyboard</span>
                <div><kbd>←</kbd><kbd>→</kbd> Move verse by verse</div>
                <div><kbd>Esc</kbd> Exit Big Screen</div>
              </div>
            </div>
          </div>
          <button class="ghost-btn" id="closePresentation">Exit</button>
        </div>
      </div>
      <div class="presentation-text"><span class="presentation-copy">${text}</span></div>
      <div class="presentation-bottom">
        <span class="presentation-brand">Big Screen Bible</span>
        <div class="presentation-controls">
          <button class="ghost-btn" id="presentationPrev" ${canGoBack ? "" : "disabled"}>Previous</button>
          <button class="ghost-btn" id="presentationNext" ${canGoForward ? "" : "disabled"}>Next</button>
        </div>
        <span class="presentation-hint">Use arrow controls to move verse by verse</span>
      </div>
    </section>
  `;
}

function printSheet() {
  const lines = passageLines();
  return `
    <section class="print-sheet" aria-hidden="true">
      <div class="print-brand">Big Screen Bible</div>
      <h1>${printReferenceLabel()}</h1>
      <div class="print-version">${state.versions[0]}</div>
      ${lines.map(({ n, text }) => `<p><sup>${n}</sup>${text}</p>`).join("")}
    </section>
  `;
}

function shortcutOverlay() {
  const platformKey = navigator.platform?.toLowerCase().includes("mac") ? "Cmd" : "Ctrl";
  const shortcuts = [
    [`${platformKey} /`, "Show keyboard shortcuts"],
    ["?", "Show keyboard shortcuts"],
    ["P", "Open Big Screen"],
    ["F", "Toggle focus layout"],
    ["/", "Jump to reference search"],
    ["V", "Open verse picker"],
    ["N", "Open notes"],
    ["B", "Open bookmarks"],
    ["C", "Open cross references"],
    ["← / →", "Move verse by verse"],
    ["Esc", "Close overlay or exit Big Screen"],
  ];
  return `
    <section class="shortcut-overlay ${state.shortcutsOpen ? "open" : ""}" aria-hidden="${state.shortcutsOpen ? "false" : "true"}">
      <div class="shortcut-panel" role="dialog" aria-modal="true" aria-labelledby="shortcutTitle">
        <div class="shortcut-head">
          <div>
            <div class="shortcut-eyebrow">Quick navigation</div>
            <h2 id="shortcutTitle">Keyboard Shortcuts</h2>
          </div>
          <button class="icon-btn" id="closeShortcuts" aria-label="Close keyboard shortcuts" data-tooltip="Close">×</button>
        </div>
        <div class="shortcut-list">
          ${shortcuts.map(([keys, label]) => `<div class="shortcut-row"><kbd>${keys}</kbd><span>${label}</span></div>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      if (state.mode === "big") {
        state.presentationControlsVisible = false;
        state.presentationSearchOpen = false;
        state.presentationSettingsOpen = false;
      } else {
        clearTimeout(presentationControlsTimer);
      }
      render();
    });
  });
  document.querySelectorAll("[data-remove-version]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.versions.length === 1) return showToast("Keep at least one version selected");
      state.versions = state.versions.filter((version) => version !== button.dataset.removeVersion);
      localStorage.setItem("lw_versions", JSON.stringify(state.versions));
      render();
    });
  });
  ["versionSelect"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", async (event) => {
      if (event.target.value !== "Add") {
        const version = event.target.value;
        if (state.versions.length >= versionLimit()) {
          event.target.value = event.target.options[0]?.value || "Add";
          return showToast(`Use up to ${versionLimit()} versions on this screen`);
        }
        state.versions.push(version);
        await loadBibleVersion(version);
        rebuildBibleData();
      }
      localStorage.setItem("lw_versions", JSON.stringify(state.versions));
      render();
    });
  });
  document.getElementById("settingsToggle")?.addEventListener("click", () => {
    state.settingsOpen = !state.settingsOpen;
    renderPreservingReaderScroll();
  });
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    state.themePreset = savedThemePreset(state.theme);
    localStorage.setItem("lw_theme", state.theme);
    renderPreservingReaderScroll();
  });
  document.getElementById("themePresetSelect")?.addEventListener("change", (event) => {
    setThemePreset(event.target.value);
  });
  document.getElementById("decreaseText")?.addEventListener("click", () => adjustTextScale(-0.1));
  document.getElementById("increaseText")?.addEventListener("click", () => adjustTextScale(0.1));
  document.getElementById("resetText")?.addEventListener("click", resetTextScale);
  document.getElementById("shortcutsButton")?.addEventListener("click", () => toggleShortcuts(true));
  document.getElementById("closeShortcuts")?.addEventListener("click", () => toggleShortcuts(false));
  document.querySelector(".shortcut-overlay")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("shortcut-overlay")) toggleShortcuts(false);
  });
  document.getElementById("focusToggle")?.addEventListener("click", toggleFocusMode);
  document.getElementById("mobileControlsToggle")?.addEventListener("click", toggleMobileControls);
  document.getElementById("exitFocusInline")?.addEventListener("click", toggleFocusMode);
  document.getElementById("closeLibrary")?.addEventListener("click", closeLibrary);
  ["chapterSelect", "chapterSelectInline"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.reference = event.target.value;
      state.verse = currentChapter().verses[0].n;
      state.selectedVerses = [];
      render();
    });
  });
  ["verseSelect", "verseSelectInline"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.verse = Number(event.target.value);
      render();
    });
  });
  document.querySelectorAll("[data-strong]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedStrong = button.dataset.strong;
      state.selectedStrongWord = button.dataset.strongWord || "";
      if (state.focusMode) {
        state.focusMode = false;
        localStorage.setItem("lw_focus_mode", "false");
      }
      state.libraryOpen = false;
      state.studyOpen = true;
      state.panelOpen = true;
      state.activeRail = "Cross-Refs";
      state.pendingPanelFocus = "Strong";
      localStorage.setItem("lw_library_open", "false");
      localStorage.setItem("lw_study_open", "true");
      render();
      requestAnimationFrame(() => document.getElementById("strongLookup")?.scrollIntoView({ block: "center", behavior: "smooth" }));
    });
  });
  document.querySelectorAll("[data-copy-verse]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      copySpecificVerses([Number(button.dataset.copyVerse)]);
    });
  });
  document.querySelectorAll("[data-verse]").forEach((row) => {
    row.addEventListener("click", (event) => {
      const verseNumber = Number(row.dataset.verse);
      state.verse = verseNumber;
      toggleVerseSelection(verseNumber, event.shiftKey);
      renderPreservingReaderScroll();
    });
  });
  document.querySelectorAll("[data-goto]").forEach((button) => button.addEventListener("click", () => gotoReference(button.dataset.goto)));
  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => openBook(button.dataset.book));
  });
  document.querySelectorAll("[data-panel-jump]").forEach((button) => {
    button.addEventListener("click", () => activateWorkspace(button.dataset.panelJump));
  });
  document.querySelectorAll("[data-rail]").forEach((button) => {
    button.addEventListener("click", () => activateWorkspace(button.dataset.rail));
  });
  document.getElementById("referenceInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") gotoReference(event.currentTarget.value);
  });
  document.getElementById("prevVerse")?.addEventListener("click", () => moveVerse(-1));
  document.getElementById("nextVerse")?.addEventListener("click", () => moveVerse(1));
  document.getElementById("presentationPrev")?.addEventListener("click", () => moveVerse(-1));
  document.getElementById("presentationNext")?.addEventListener("click", () => moveVerse(1));
  document.getElementById("presentationVersionSelect")?.addEventListener("change", (event) => {
    setPrimaryVersion(event.target.value);
  });
  document.getElementById("presentationThemeSelect")?.addEventListener("change", (event) => {
    setPresentationTheme(event.target.value);
  });
  document.getElementById("presentationSettingsToggle")?.addEventListener("click", () => {
    state.presentationSettingsOpen = !state.presentationSettingsOpen;
    render();
  });
  document.getElementById("presentationSearchToggle")?.addEventListener("click", () => {
    state.presentationSearchOpen = !state.presentationSearchOpen;
    render();
    if (state.presentationSearchOpen) requestAnimationFrame(() => document.getElementById("presentationSearchInput")?.focus());
  });
  document.getElementById("presentationSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.mode === "big") state.presentationSearchOpen = false;
    gotoReference(document.getElementById("presentationSearchInput")?.value || "");
  });
  document.getElementById("presentation")?.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") revealPresentationControls();
  });
  document.getElementById("presentation")?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "touch") revealPresentationControls();
  });
  document.getElementById("presentation")?.addEventListener("touchstart", () => revealPresentationControls(), { passive: true });
  document.getElementById("prevChapter")?.addEventListener("click", () => moveChapter(-1));
  document.getElementById("nextChapter")?.addEventListener("click", () => moveChapter(1));
  document.getElementById("bookmarkBtn")?.addEventListener("click", toggleBookmark);
  document.getElementById("noteBtn")?.addEventListener("click", () => activateWorkspace("Notes"));
  document.getElementById("openStudy")?.addEventListener("click", () => {
    state.studyOpen = true;
    state.panelOpen = true;
    localStorage.setItem("lw_study_open", "true");
    state.pendingPanelFocus = "Cross-Refs";
    render();
  });
  document.getElementById("togglePanel")?.addEventListener("click", closeStudyPanel);
  document.getElementById("saveNote")?.addEventListener("click", saveNote);
  document.getElementById("copyVerse")?.addEventListener("click", copyVerse);
  document.getElementById("copySelection")?.addEventListener("click", copySelectedPassage);
  document.getElementById("printSelection")?.addEventListener("click", printSelectedPassage);
  document.getElementById("clearSelection")?.addEventListener("click", clearSelection);
  document.getElementById("printPage")?.addEventListener("click", printSelectedPassage);
  document.getElementById("closePresentation")?.addEventListener("click", () => {
    clearTimeout(presentationControlsTimer);
    state.mode = "reader";
    state.presentationSearchOpen = false;
    state.presentationSettingsOpen = false;
    state.presentationControlsVisible = true;
    render();
  });
  window.onkeydown = handleGlobalShortcuts;
}

async function setPrimaryVersion(version) {
  if (!translationCodes.includes(version)) return;
  state.versions = [version, ...state.versions.filter((item) => item !== version)];
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
  if (translationLookup[version]?.status === "bundled") {
    await loadBibleVersion(version);
    rebuildBibleData();
  }
  state.presentationSettingsOpen = false;
  render();
}

function setThemePreset(preset) {
  if (themePresetLookup[preset]?.mode !== state.theme) return;
  state.themePreset = preset;
  localStorage.setItem(`lw_theme_preset_${state.theme}`, preset);
  renderPreservingReaderScroll();
}

function setPresentationTheme(theme) {
  if (!presentationThemeCodes.includes(theme)) return;
  state.presentationTheme = theme;
  localStorage.setItem("lw_presentation_theme", theme);
  state.presentationSettingsOpen = false;
  render();
}

function gotoReference(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^((?:[1-3]\s*)?[A-Za-z. ]+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return showToast("Try a reference like John 3:16");
  const book = normalizeBookName(match[1]);
  if (!book) return showToast(`I do not recognize ${match[1].trim()} yet`);
  const key = `${book} ${match[2]}`;
  if (!bibleData[key]) return showToast(`${key} is not available in the bundled Bible data`);
  state.reference = key;
  state.verse = Number(match[3] || bibleData[key].verses[0].n);
  state.selectedVerses = [];
  if (!bibleData[key].verses.some((verse) => verse.n === state.verse)) state.verse = bibleData[key].verses[0].n;
  state.pendingVerseFocus = true;
  render();
}

function activateWorkspace(target) {
  state.activeRail = target;
  if (target === "Verse") {
    state.libraryOpen = true;
    state.panelOpen = false;
    localStorage.setItem("lw_library_open", "true");
  } else if (target === "Search") {
    state.panelOpen = false;
  } else {
    state.studyOpen = true;
    state.panelOpen = true;
    localStorage.setItem("lw_study_open", "true");
  }
  state.pendingPanelFocus = target;
  render();
}

function closeLibrary() {
  state.libraryOpen = false;
  localStorage.setItem("lw_library_open", "false");
  render();
}

function closeStudyPanel() {
  state.studyOpen = false;
  state.panelOpen = false;
  localStorage.setItem("lw_study_open", "false");
  render();
}

function adjustTextScale(delta) {
  state.textScale = clampTextScale(state.textScale + delta);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  render();
}

function resetTextScale() {
  state.textScale = 1;
  localStorage.setItem("lw_text_scale", "1");
  render();
}

function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  state.panelOpen = false;
  if (state.focusMode) state.mobileControlsOpen = false;
  localStorage.setItem("lw_focus_mode", String(state.focusMode));
  render();
}

function toggleMobileControls() {
  state.mobileControlsOpen = !state.mobileControlsOpen;
  render();
}

function toggleShortcuts(forceOpen) {
  state.shortcutsOpen = typeof forceOpen === "boolean" ? forceOpen : !state.shortcutsOpen;
  render();
}

function revealPresentationControls(duration = 3200) {
  if (state.mode !== "big") return;
  clearTimeout(presentationControlsTimer);
  if (!state.presentationControlsVisible) {
    state.presentationControlsVisible = true;
    render();
  }
  presentationControlsTimer = setTimeout(() => {
    if (state.mode !== "big" || state.presentationSearchOpen || state.presentationSettingsOpen) return;
    state.presentationControlsVisible = false;
    render();
  }, duration);
}

function handleGlobalShortcuts(event) {
  const key = event.key.toLowerCase();
  const modifiedSlash = (event.metaKey || event.ctrlKey) && event.key === "/";
  const typing = isTypingTarget(event.target);

  if (modifiedSlash || (!typing && event.key === "?")) {
    event.preventDefault();
    toggleShortcuts();
    return;
  }

  if (event.key === "Escape") {
    if (state.shortcutsOpen) {
      event.preventDefault();
      return toggleShortcuts(false);
    }
    if (state.settingsOpen) {
      event.preventDefault();
      state.settingsOpen = false;
      return renderPreservingReaderScroll();
    }
    if (state.presentationSearchOpen) {
      event.preventDefault();
      state.presentationSearchOpen = false;
      return render();
    }
    if (state.presentationSettingsOpen) {
      event.preventDefault();
      state.presentationSettingsOpen = false;
      return render();
    }
    if (state.mode === "big") {
      event.preventDefault();
      clearTimeout(presentationControlsTimer);
      state.mode = "reader";
      state.presentationSettingsOpen = false;
      state.presentationControlsVisible = true;
      return render();
    }
    if (state.panelOpen) {
      event.preventDefault();
      return closeStudyPanel();
    }
  }

  if (typing || state.shortcutsOpen) return;

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    return moveVerse(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    return moveVerse(1);
  }
  if (key === "p") {
    event.preventDefault();
    state.mode = "big";
    state.presentationSearchOpen = false;
    state.presentationSettingsOpen = false;
    state.presentationControlsVisible = false;
    return render();
  }
  if (key === "f") {
    event.preventDefault();
    return toggleFocusMode();
  }
  if (event.key === "/") {
    event.preventDefault();
    return shortcutWorkspace("Search");
  }

  const railShortcuts = {
    l: "Verse",
    v: "Verse",
    n: "Notes",
    b: "Bookmarks",
    c: "Cross-Refs",
  };
  if (railShortcuts[key]) {
    event.preventDefault();
    return shortcutWorkspace(railShortcuts[key]);
  }
}

function shortcutWorkspace(target) {
  if (state.mode === "big") state.mode = "reader";
  if (state.focusMode && target !== "Search") {
    state.focusMode = false;
    localStorage.setItem("lw_focus_mode", "false");
  }
  activateWorkspace(target);
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function clampTextScale(value) {
  return Math.round(Math.min(1.6, Math.max(0.8, Number(value) || 1)) * 10) / 10;
}

function textFontVars() {
  const { verse, parallel } = computedTextFonts();
  return `--verse-font: ${verse}px; --parallel-font: ${parallel}px`;
}

function applyTextScaleVars() {
  const grid = document.querySelector(".main-grid");
  if (!grid) return;
  const { verse, parallel } = computedTextFonts();
  grid.style.setProperty("--verse-font", `${verse}px`);
  grid.style.setProperty("--parallel-font", `${parallel}px`);
}

function computedTextFonts() {
  const width = window.innerWidth || 1280;
  const scaled = (min, vw, max) => clamp(width * (vw / 100), min, max) * state.textScale;
  let verse = scaled(23, 1.35, 38);
  const parallel = width <= 840 ? scaled(16, 4.2, 20) : scaled(16, 0.9, 25);

  if (width <= 840) {
    verse = scaled(20, 5.2, 27);
  } else if (width <= 1320) {
    verse = scaled(22, 1.85, 28);
  } else if (state.focusMode || (!state.libraryOpen && !state.studyOpen)) {
    verse = scaled(26, 1.86, 58);
  } else if (!state.libraryOpen) {
    verse = scaled(24, 1.54, 46);
  } else if (!state.studyOpen) {
    verse = scaled(24, 1.58, 48);
  }

  return {
    verse: Math.round(verse * 10) / 10,
    parallel: Math.round(parallel * 10) / 10,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function focusWorkspaceTarget(target) {
  const focusMap = {
    Verse: "#chapterSelect",
    Search: "#referenceInput",
    Notes: "#notesSection",
    Bookmarks: "#bookmarksSection",
    "Cross-Refs": "#crossRefsSection",
    Strong: "#strongSection",
  };
  const selector = focusMap[target] || "#crossRefsSection";
  const element = document.querySelector(selector);
  if (!element) return;

  if (target === "Verse" || target === "Search") {
    element.focus?.();
    return;
  }

  element.scrollIntoView({ block: "start", behavior: "smooth" });
  if (target === "Notes") document.getElementById("noteBox")?.focus();
}

function availableReferenceForBook(book) {
  return Object.keys(bibleData).find((key) => key.startsWith(`${book} `));
}

function openBook(book) {
  const reference = availableReferenceForBook(book);
  if (!reference) return showToast(`${book} is not available in the bundled Bible data`);
  state.reference = reference;
  state.verse = currentChapter().verses[0].n;
  state.selectedVerses = [];
  state.pendingVerseFocus = true;
  render();
}

function normalizeBookName(value) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
  const compact = cleaned.replace(/\s+/g, "");
  return bookAliases[cleaned] || bookAliases[compact] || books.find((book) => book.toLowerCase() === cleaned) || null;
}

function scrollSelectedVerseIntoView() {
  const selected = document.querySelector(`[data-verse="${state.verse}"]`);
  selected?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function moveVerse(direction) {
  const verses = currentChapter().verses.map((verse) => verse.n);
  const index = verses.indexOf(state.verse);
  state.verse = verses[Math.max(0, Math.min(verses.length - 1, index + direction))];
  render();
}

function moveChapter(direction) {
  const keys = Object.keys(bibleData);
  const index = keys.indexOf(state.reference);
  state.reference = keys[Math.max(0, Math.min(keys.length - 1, index + direction))];
  state.verse = currentChapter().verses[0].n;
  state.selectedVerses = [];
  render();
}

function toggleBookmark() {
  const ref = referenceLabel();
  if (state.bookmarks.includes(ref)) {
    state.bookmarks = state.bookmarks.filter((item) => item !== ref);
    showToast("Bookmark removed");
  } else {
    state.bookmarks.unshift(ref);
    showToast("Bookmark saved");
  }
  localStorage.setItem("lw_bookmarks", JSON.stringify(state.bookmarks));
  render();
}

function saveNote() {
  state.notes[referenceLabel()] = document.getElementById("noteBox").value;
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  showToast("Note saved");
}

async function copyVerse() {
  await copySpecificVerses(state.selectedVerses.length ? state.selectedVerses : [state.verse]);
}

async function copySpecificVerses(verseNumbers) {
  const text = passageText(verseNumbers);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      copyTextFallback(text);
    }
  } catch (_error) {
    copyTextFallback(text);
  }
  showToast(verseNumbers.length === 1 ? "Verse copied" : "Passage copied");
}

function copyTextFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function copySelectedPassage() {
  return copySpecificVerses(selectedVerseNumbers());
}

function printSelectedPassage() {
  requestAnimationFrame(() => window.print());
}

function toggleVerseSelection(verseNumber, extendRange) {
  if (extendRange && state.selectedVerses.length) {
    const start = state.selectedVerses[state.selectedVerses.length - 1];
    const available = currentChapter().verses.map((verse) => verse.n);
    const startIndex = available.indexOf(start);
    const endIndex = available.indexOf(verseNumber);
    if (startIndex !== -1 && endIndex !== -1) {
      const [from, to] = [startIndex, endIndex].sort((a, b) => a - b);
      state.selectedVerses = available.slice(from, to + 1);
      return;
    }
  }
  state.selectedVerses = state.selectedVerses.includes(verseNumber)
    ? state.selectedVerses.filter((item) => item !== verseNumber)
    : [...state.selectedVerses, verseNumber].sort((a, b) => a - b);
}

function clearSelection() {
  state.selectedVerses = [];
  render();
}

function selectedVerseNumbers() {
  return state.selectedVerses.length ? state.selectedVerses : [state.verse];
}

function passageLines(verseNumbers = selectedVerseNumbers()) {
  const selected = new Set(verseNumbers);
  return currentChapter().verses
    .filter((verse) => selected.has(verse.n))
    .map((verse) => ({ n: verse.n, text: getVerseText(verse, state.versions[0]) }));
}

function passageText(verseNumbers = selectedVerseNumbers()) {
  const lines = passageLines(verseNumbers);
  const reference = verseNumbers.length === 1 ? `${state.reference}:${verseNumbers[0]}` : printReferenceLabel(verseNumbers);
  return `${reference} ${state.versions[0]}\n${lines.map(({ n, text }) => `${n}. ${text}`).join("\n")}`;
}

function printReferenceLabel(verseNumbers = selectedVerseNumbers()) {
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  if (sorted.length === 1) return `${state.reference}:${sorted[0]}`;
  return `${state.reference}:${sorted[0]}-${sorted[sorted.length - 1]}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

function fitPresentationText() {
  const presentation = document.getElementById("presentation");
  if (!presentation?.classList.contains("open")) return;

  const viewport = presentation.querySelector(".presentation-text");
  const copy = presentation.querySelector(".presentation-copy");
  if (!viewport || !copy) return;

  presentation.classList.remove("presentation-overflow");
  presentation.style.removeProperty("--presentation-font-size");
  const baseFontSize = Number.parseFloat(getComputedStyle(copy).fontSize) || 64;

  const fits = () => copy.scrollHeight <= viewport.clientHeight && copy.scrollWidth <= viewport.clientWidth;
  if (fits()) return;

  let low = 0.32;
  let high = 1;
  for (let index = 0; index < 12; index += 1) {
    const mid = (low + high) / 2;
    presentation.style.setProperty("--presentation-font-size", `${baseFontSize * mid}px`);
    if (fits()) low = mid;
    else high = mid;
  }

  presentation.style.setProperty("--presentation-font-size", `${baseFontSize * low}px`);
  if (!fits()) presentation.classList.add("presentation-overflow");
}

window.addEventListener("resize", () => {
  applyTextScaleVars();
  fitPresentationText();
});

function buildBookAliases() {
  const aliases = {};
  const add = (book, ...values) => values.forEach((value) => {
    aliases[normalizeAliasKey(value)] = book;
  });

  books.forEach((book) => add(book, book, book.replace(/^\d\s+/, "$&"), book.replace(/\s+/g, "")));
  add("Genesis", "gen", "ge", "gn");
  add("Exodus", "ex", "exo");
  add("Leviticus", "lev", "le");
  add("Numbers", "num", "nu");
  add("Deuteronomy", "deut", "dt", "deu");
  add("Joshua", "jos", "josh");
  add("Judges", "jdg", "judg");
  add("Ruth", "ru");
  add("1 Samuel", "1sam", "1sa", "1 sam", "1 sa");
  add("2 Samuel", "2sam", "2sa", "2 sam", "2 sa");
  add("1 Kings", "1ki", "1kgs", "1 kings");
  add("2 Kings", "2ki", "2kgs", "2 kings");
  add("1 Chronicles", "1chr", "1ch", "1 chron", "1 chronicles");
  add("2 Chronicles", "2chr", "2ch", "2 chron", "2 chronicles");
  add("Ezra", "ezr");
  add("Nehemiah", "neh", "ne");
  add("Esther", "est", "esth");
  add("Psalm", "ps", "psa", "psm", "psalm", "psalms");
  add("Proverbs", "pro", "prov", "proverb");
  add("Ecclesiastes", "ecc", "eccl", "eccles");
  add("Song of Songs", "song", "song of solomon", "sos", "songofsongs", "songofsolomon");
  add("Isaiah", "isa", "is");
  add("Jeremiah", "jer");
  add("Lamentations", "lam");
  add("Ezekiel", "ezek", "ezk");
  add("Daniel", "dan", "dn");
  add("Hosea", "hos");
  add("Joel", "jol");
  add("Amos", "amo");
  add("Obadiah", "oba", "obad");
  add("Jonah", "jon");
  add("Micah", "mic");
  add("Nahum", "nah", "nam");
  add("Habakkuk", "hab");
  add("Zephaniah", "zep", "zeph");
  add("Haggai", "hag");
  add("Zechariah", "zec", "zech");
  add("Malachi", "mal");
  add("Matthew", "matt", "mt", "mat");
  add("Mark", "mrk", "mk");
  add("Luke", "luk", "lk");
  add("John", "jhn", "jn");
  add("Acts", "act");
  add("Romans", "rom", "ro");
  add("1 Corinthians", "1cor", "1co", "1 cor", "1 corinthians");
  add("2 Corinthians", "2cor", "2co", "2 cor", "2 corinthians");
  add("Galatians", "gal");
  add("Ephesians", "eph");
  add("Philippians", "phil", "php");
  add("Colossians", "col");
  add("1 Thessalonians", "1th", "1thess", "1 thess", "1 thessalonians");
  add("2 Thessalonians", "2th", "2thess", "2 thess", "2 thessalonians");
  add("1 Timothy", "1tim", "1ti", "1 tim", "1 timothy");
  add("2 Timothy", "2tim", "2ti", "2 tim", "2 timothy");
  add("Titus", "tit");
  add("Philemon", "phm", "phile");
  add("Hebrews", "heb");
  add("James", "jas", "jm");
  add("1 Peter", "1pet", "1pe", "1 peter");
  add("2 Peter", "2pet", "2pe", "2 peter");
  add("1 John", "1jn", "1 jn", "1john", "1 john");
  add("2 John", "2jn", "2 jn", "2john", "2 john");
  add("3 John", "3jn", "3 jn", "3john", "3 john");
  add("Jude", "jud");
  add("Revelation", "rev", "re");
  return aliases;
}

function normalizeAliasKey(value) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

async function initializeBibleData() {
  render();
  loadStrongLexicon();
  try {
    await loadBibleBundleScript("index");
    bibleIndex = window.BIGSCREEN_BIBLE_INDEX;
    if (!bibleIndex) throw new Error("Bible index script did not initialize");
    await Promise.all(state.versions.filter((version) => translationLookup[version]?.status === "bundled").map(loadBibleVersion));
    rebuildBibleData();
    dataLoading = false;
    render();
  } catch (error) {
    console.error(error);
    dataError = "The full Bible text files could not be loaded.";
    dataLoading = false;
    render();
  }
}

async function loadBibleVersion(version) {
  if (loadedVersionData.has(version) || loadingVersions.has(version)) return;
  loadingVersions.add(version);
  try {
    await loadBibleBundleScript(version);
    const data = window[`BIGSCREEN_BIBLE_${version}`];
    if (!data) throw new Error(`${version} script did not initialize`);
    loadedVersionData.set(version, data);
  } catch (error) {
    console.error(error);
    showToast(`${version} could not be loaded`);
  } finally {
    loadingVersions.delete(version);
  }
}

function loadBibleBundleScript(name) {
  const globalName = name === "index" ? "BIGSCREEN_BIBLE_INDEX" : `BIGSCREEN_BIBLE_${name}`;
  if (window[globalName]) return Promise.resolve();

  const scriptId = `bible-data-${name}`;
  const existing = document.getElementById(scriptId);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`${name} Bible data failed to load`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `./assets/bibles/${name}.js`;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`${name} Bible data failed to load`)), { once: true });
    document.head.appendChild(script);
  });
}

function loadStrongLexicon() {
  if (strongLexiconPromise) return strongLexiconPromise;
  strongLexiconStatus = "loading";
  window.module = window.module || { exports: {} };
  strongLexiconPromise = Promise.allSettled(strongLexiconSources.map((source) => loadExternalScript(source.url, source.globalName)))
    .then((results) => {
      strongLexicon = {};
      results.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          console.warn(`${strongLexiconSources[index].name} could not be loaded`, result.reason);
          return;
        }
        const sourceData = window[strongLexiconSources[index].globalName] || {};
        Object.entries(sourceData).forEach(([code, entry]) => {
          strongLexicon[normalizeStrongCode(code)] = entry;
        });
      });
      strongLexiconStatus = Object.keys(strongLexicon).length ? "ready" : "unavailable";
      render();
      return strongLexicon;
    });
  return strongLexiconPromise;
}

function loadExternalScript(url, globalName) {
  if (window[globalName]) return Promise.resolve();

  const scriptId = `external-${globalName}`;
  const existing = document.getElementById(scriptId);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`${globalName} failed to load`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.referrerPolicy = "no-referrer";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`${globalName} failed to load`)), { once: true });
    document.head.appendChild(script);
  });
}

function rebuildBibleData() {
  const merged = {};
  const referenceKeys = chapterKeys();
  referenceKeys.forEach((key) => {
    merged[key] = { title: key, verses: [] };
  });

  loadedVersionData.forEach((versionData, version) => {
    referenceKeys.forEach((key) => {
      const sourceChapter = versionData.chapters[key];
      if (!sourceChapter) return;
      const targetChapter = merged[key];
      sourceChapter.verses.forEach((sourceVerse) => {
        const { n, text } = sourceVerse;
        let verse = targetChapter.verses.find((item) => item.n === n);
        if (!verse) {
          verse = { n };
          targetChapter.verses.push(verse);
        }
        verse[version] = text;
        if (Array.isArray(sourceVerse.strong)) {
          verse.strong = verse.strong || {};
          verse.strong[version] = sourceVerse.strong;
        }
      });
    });
  });
  Object.values(merged).forEach((chapter) => chapter.verses.sort((a, b) => a.n - b.n));
  bibleData = merged;
}

function chapterKeys() {
  const sourceBooks = bibleIndex?.books?.length ? bibleIndex.books.map(({ name, chapters }) => [name, chapters]) : bookDefinitions;
  return sourceBooks.flatMap(([book, chapters]) => Array.from({ length: chapters }, (_, index) => `${book} ${index + 1}`));
}

const compactWidthQuery = window.matchMedia?.("(max-width: 840px)");
compactWidthQuery?.addEventListener("change", () => {
  state.settingsOpen = false;
  renderPreservingReaderScroll();
});
watchSystemTheme();
initializeBibleData();
