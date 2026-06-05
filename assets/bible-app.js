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
  { code: "ASV", name: "American Standard Version", status: "bundled" },
  { code: "BBE", name: "Bible in Basic English", status: "bundled" },
  { code: "BSB", name: "Berean Standard Bible", status: "bundled" },
  { code: "KJV", name: "King James Version", status: "bundled" },
  { code: "WEB", name: "World English Bible", status: "bundled" },
];

const translationCodes = translations.map((translation) => translation.code).sort((a, b) => a.localeCompare(b));
const translationLookup = Object.fromEntries(translations.map((translation) => [translation.code, translation]));

const themePresets = [
  { code: "paper", name: "Paper", mode: "light" },
  { code: "parchment", name: "Parchment", mode: "light" },
  { code: "clarity", name: "Clarity", mode: "light" },
  { code: "dawn", name: "Dawn", mode: "light" },
  { code: "meadow", name: "Meadow", mode: "light" },
  { code: "blush", name: "Blush", mode: "light" },
  { code: "lavender", name: "Lavender", mode: "light" },
  { code: "sapphire", name: "Sapphire", mode: "light" },
  { code: "midnight", name: "Midnight", mode: "dark" },
  { code: "chapel", name: "Chapel", mode: "dark" },
  { code: "aurora", name: "Aurora", mode: "dark" },
  { code: "rose-night", name: "Rose Night", mode: "dark" },
  { code: "violet-night", name: "Violet Night", mode: "dark" },
  { code: "nocturne", name: "Nocturne", mode: "dark" },
  { code: "contrast", name: "Contrast", mode: "dark" },
];
const themePresetLookup = Object.fromEntries(themePresets.map((preset) => [preset.code, preset]));
const defaultThemePresets = { light: "paper", dark: "midnight" };
const presentationThemes = [
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
];
const presentationThemeCodes = presentationThemes.map((theme) => theme.code);
const presentationThemeColors = {
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
};
const scriptureFonts = [
  { code: "libre", name: "Libre Baskerville" },
  { code: "lora", name: "Lora" },
  { code: "merriweather", name: "Merriweather" },
  { code: "crimson", name: "Crimson Text" },
  { code: "noto-sans", name: "Noto Sans" },
  { code: "ibm-plex-sans", name: "IBM Plex Sans" },
  { code: "custom", name: "Custom device font" },
];
const scriptureFontCodes = scriptureFonts.map((font) => font.code);

let bibleData = {};
let bibleIndex = null;
let dataLoading = true;
let dataError = "";
let strongLexicon = {};
let strongLexiconStatus = "idle";
let strongLexiconPromise = null;
let presentationControlsTimer = 0;
let presentationTouchStart = null;
let streakPopupTimer = 0;
const streakStorageKey = "lw_reading_streak";

const loadedVersionData = new Map();
const loadingVersions = new Set();
let verseOfDayPool = null;
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
  versions: JSON.parse(localStorage.getItem("lw_versions") || '["BSB","KJV"]'),
  theme: savedTheme(),
  themePreset: "",
  scriptureFont: localStorage.getItem("lw_scripture_font") || "libre",
  customScriptureFont: localStorage.getItem("lw_custom_scripture_font") || "",
  textScale: Number(localStorage.getItem("lw_text_scale") || 1),
  focusMode: savedFocusMode(),
  libraryOpen: localStorage.getItem("lw_library_open") !== "false",
  activeRail: "Verse",
  selectedStrong: "G2316",
  selectedStrongWord: "God",
  mobileControlsOpen: false,
  presentationSearchOpen: false,
  presentationSettingsOpen: false,
  presentationControlsVisible: !isCompactScreen(),
  presentationTheme: localStorage.getItem("lw_presentation_theme") || "deep",
  startBigScreen: localStorage.getItem("lw_start_big_screen") !== "false",
  startVerseOfDay: localStorage.getItem("lw_start_verse_of_day") !== "false",
  startupApplied: false,
  settingsOpen: false,
  shortcutsOpen: false,
  searchQuery: "",
  searchResults: [],
  pendingPanelFocus: null,
  pendingVerseFocus: false,
  selectedVerses: [],
  highlights: JSON.parse(localStorage.getItem("lw_highlights") || "{}"),
  bookmarks: JSON.parse(localStorage.getItem("lw_bookmarks") || '["John 3:16","Psalm 23:1"]'),
  notes: JSON.parse(localStorage.getItem("lw_notes") || '{"John 3:16":"This verse is the heart of the Gospel. Mark for Sabbath worship display."}'),
  history: JSON.parse(localStorage.getItem("lw_history") || "[]"),
  streak: savedReadingStreak(),
  streakPopupVisible: false,
  triviaCategory: localStorage.getItem("lw_trivia_category") || "Mixed",
  triviaDifficulty: localStorage.getItem("lw_trivia_difficulty") || "All",
  triviaCount: Number(localStorage.getItem("lw_trivia_count") || 10),
  triviaGame: null,
};

const highlightColors = ["yellow", "blue", "pink", "green", "orange"];

state.versions = state.versions.filter((version) => translationCodes.includes(version));
if (state.versions.length === 0) state.versions = ["BSB", "KJV"];
if (!state.versions.some((version) => translationLookup[version]?.status === "bundled")) state.versions.unshift("BSB");
state.themePreset = savedThemePreset(state.theme);
if (!presentationThemeCodes.includes(state.presentationTheme)) state.presentationTheme = "deep";
if (!scriptureFontCodes.includes(state.scriptureFont)) state.scriptureFont = "libre";

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

function savedReadingStreak() {
  try {
    return normalizeReadingStreak(JSON.parse(localStorage.getItem(streakStorageKey) || "{}"));
  } catch {
    return normalizeReadingStreak({});
  }
}

function normalizeReadingStreak(value) {
  return {
    current: Math.max(0, Number(value?.current) || 0),
    best: Math.max(0, Number(value?.best) || 0),
    totalDays: Math.max(0, Number(value?.totalDays) || 0),
    lastVisit: typeof value?.lastVisit === "string" ? value.lastVisit : "",
  };
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetweenDateKeys(fromKey, toKey) {
  const parseDateKey = (key) => {
    const [year, month, day] = String(key).split("-").map(Number);
    if (!year || !month || !day) return NaN;
    return Date.UTC(year, month - 1, day);
  };
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round((to - from) / 86400000);
}

function recordReadingStreak(date = new Date()) {
  const today = localDateKey(date);
  const streak = normalizeReadingStreak(state.streak);
  if (streak.lastVisit === today) return false;
  const gap = streak.lastVisit ? daysBetweenDateKeys(streak.lastVisit, today) : 0;
  const current = gap === 1 ? streak.current + 1 : 1;
  state.streak = {
    current,
    best: Math.max(streak.best, current),
    totalDays: streak.totalDays + 1,
    lastVisit: today,
  };
  localStorage.setItem(streakStorageKey, JSON.stringify(state.streak));
  return true;
}

const icons = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 16v5"/></svg>',
  trivia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0z"/><path d="M6 4H4v2a4 4 0 0 0 4 4"/><path d="M18 4h2v2a4 4 0 0 1-4 4"/><path d="M12 11v4"/><path d="M9 21h6"/><path d="M10 15h4v6h-4z"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c3.6 0 6.5-2.7 6.5-6.2 0-2.6-1.4-4.7-3.5-6.7-.6 2-1.9 3.2-3.1 3.7.6-2.7-.4-5.2-3-8.1C8.5 8 5.5 10.8 5.5 15.8 5.5 19.3 8.4 22 12 22z"/><path d="M12 18.5c1.2 0 2.2-.9 2.2-2.1 0-1-.6-1.8-1.4-2.5-.2.7-.7 1.1-1.1 1.3.2-.9-.1-1.8-1-2.8-.1 1.2-.9 2.2-.9 4 0 1.2 1 2.1 2.2 2.1z"/></svg>',
  fullscreenEnter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 5H5v3.5"/><path d="M5 5l5.5 5.5"/><path d="M15.5 5H19v3.5"/><path d="M19 5l-5.5 5.5"/><path d="M8.5 19H5v-3.5"/><path d="M5 19l5.5-5.5"/><path d="M15.5 19H19v-3.5"/><path d="M19 19l-5.5-5.5"/></svg>',
  fullscreenExit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5v5H5"/><path d="M5 5l5 5"/><path d="M14 5v5h5"/><path d="M19 5l-5 5"/><path d="M10 19v-5H5"/><path d="M5 19l5-5"/><path d="M14 19v-5h5"/><path d="M19 19l-5-5"/></svg>',
  parallel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h7v14H4zM13 5h7v14h-7z"/><path d="M7 9h1M16 9h1M7 13h1M16 13h1"/></svg>',
  focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4"/><path d="M9 12h6"/></svg>',
  panels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M8 4v16M16 4v16"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.2-1.2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="11" height="13" rx="1.5"/><path d="M5 16H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 3h9.5A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/><path d="M17 12h.01"/></svg>',
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
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

function activePassageLabel() {
  return formatReferenceLabel(state.reference, selectedVerseNumbers());
}

function mainGridClass() {
  if (state.mode === "trivia") return "main-grid focus-mode trivia-grid";
  if (state.focusMode) return "main-grid focus-mode";
  return [
    "main-grid",
    !state.libraryOpen ? "library-closed" : "",
  ].filter(Boolean).join(" ");
}

function versionLimit() {
  return isCompactScreen() ? 2 : 3;
}

function isCompactScreen() {
  return window.matchMedia?.("(max-width: 840px)")?.matches || false;
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
  syncPresentationShell();
  if (dataLoading || dataError) {
    app.innerHTML = loadingScreen();
    return;
  }
  enforceVersionLimit();
  if (state.mode !== "big") state.presentationControlsVisible = true;
  app.innerHTML = `
    <main class="app-shell ${state.focusMode && state.mode !== "trivia" ? "focus-shell" : ""} ${state.mobileControlsOpen ? "mobile-controls-open" : ""}" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}" style="--text-scale: ${state.textScale}">
      ${topbar()}
      <section class="${mainGridClass()}" style="${textFontVars()}">
        ${state.focusMode || state.mode === "trivia" ? "" : rail()}
        ${state.focusMode || state.mode === "trivia" || !state.libraryOpen ? "" : library()}
        ${reader()}
      </section>
      ${bottombar()}
      ${mobileFloatingSettings()}
      ${mobileSettingsPanel()}
      ${presentation()}
      ${shortcutOverlay()}
      ${printSheet()}
      ${streakPopup()}
      <div class="status-toast" id="toast"></div>
    </main>
  `;
  bindEvents();
  applyCustomScriptureFont();
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
  scheduleStreakPopupDismiss();
}

function syncPresentationShell() {
  const isPresentationMode = state.mode === "big";
  const themeColor = isPresentationMode ? presentationThemeColors[state.presentationTheme] || "#004f54" : (state.theme === "dark" ? "#101413" : "#f8f7f3");
  document.documentElement.dataset.presentationMode = isPresentationMode ? "big" : "";
  document.body.dataset.presentationMode = isPresentationMode ? "big" : "";
  document.documentElement.dataset.presentationTheme = state.presentationTheme;
  document.body.dataset.presentationTheme = state.presentationTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
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
    <main class="app-shell focus-shell" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}">
      <section class="reader loading-reader">
        <div class="loading-card">
          <img class="loading-logo-mark" src="./assets/brand-mark.png" alt="" />
          <h1>Big Screen Bible</h1>
          <p>${message}</p>
          ${dataError ? '<button class="primary-btn" onclick="location.reload()">Retry</button>' : ""}
        </div>
      </section>
    </main>
  `;
}

function mobileFloatingSettings() {
  if (state.mode === "big") return "";
  return `
    <button class="mobile-floating-settings ${state.settingsOpen ? "active" : ""}" id="mobileFloatingSettings" aria-label="Settings" data-tooltip="Settings">
      ${icons.settings}
    </button>
  `;
}

function mobileSettingsPanel() {
  if (state.mode === "big" || !state.settingsOpen) return "";
  const primaryVersion = state.versions[0] || "BSB";
  const primaryVersionOptions = translationCodes
    .map((version) => `<option value="${version}" ${version === primaryVersion ? "selected" : ""}>${version} · ${translationLookup[version]?.name || version}</option>`)
    .join("");
  const followsSystemTheme = !localStorage.getItem("lw_theme");
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Fullscreen";
  const themeLabel = state.theme === "dark" ? "Light mode" : "Dark mode";
  const themePresetOptions = themePresets
    .filter((preset) => preset.mode === state.theme)
    .map((preset) => `<option value="${preset.code}" ${preset.code === state.themePreset ? "selected" : ""}>${preset.name}</option>`)
    .join("");
  const scriptureFontOptions = scriptureFonts
    .map((font) => `<option value="${font.code}" ${font.code === state.scriptureFont ? "selected" : ""}>${font.name}</option>`)
    .join("");
  const customFontField = state.scriptureFont === "custom"
    ? `<input class="custom-font-input" id="mobileCustomScriptureFontInput" value="${escapeHtml(state.customScriptureFont)}" placeholder="Georgia, Charter, Avenir..." aria-label="Custom scripture font" />`
    : "";
  return `
    <div class="mobile-settings-popover" id="mobileSettingsPopover" role="dialog" aria-label="Settings">
      <button class="settings-popover-close" id="mobileSettingsClose" type="button" aria-label="Close settings">${icons.clear}</button>
      ${streakCard()}
      <div class="setting-group">
        <label class="setting-label" for="mobileThemePresetSelect">Color theme</label>
        <select class="theme-preset-select" id="mobileThemePresetSelect" aria-label="Color theme">
          ${themePresetOptions}
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label" for="mobileSettingsPrimaryVersionSelect">Bible version</label>
        <select class="primary-version-select" id="mobileSettingsPrimaryVersionSelect" aria-label="Bible version">
          ${primaryVersionOptions}
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label" for="mobileScriptureFontSelect">Scripture font</label>
        <select class="scripture-font-select" id="mobileScriptureFontSelect" aria-label="Scripture font">
          ${scriptureFontOptions}
        </select>
        ${customFontField}
      </div>
      <div class="setting-row">
        <span class="setting-label">Mode</span>
        <button class="ghost-btn theme-toggle" id="mobileThemeToggle" aria-label="${themeLabel}">${state.theme === "dark" ? icons.sun : icons.moon}<span>${themeLabel}</span></button>
      </div>
      <div class="setting-row">
        <span class="setting-label">System</span>
        <button class="ghost-btn system-theme-btn" id="mobileSystemThemeButton" ${followsSystemTheme ? "disabled" : ""} aria-label="Follow system theme">${followsSystemTheme ? "Following system" : "Follow system"}</button>
      </div>
      <div class="setting-row">
        <span class="setting-label">Display</span>
        <button class="ghost-btn fullscreen-btn" id="mobileFullscreenButton" aria-label="${fullscreenLabel}">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
      </div>
      <div class="setting-group">
        <span class="setting-label">Startup</span>
        <label class="setting-checkbox">
          <input type="checkbox" id="mobileStartBigScreenToggle" ${state.startBigScreen ? "checked" : ""} />
          <span>Start in Big Screen Mode</span>
        </label>
        <label class="setting-checkbox">
          <input type="checkbox" id="mobileStartVerseOfDayToggle" ${state.startVerseOfDay ? "checked" : ""} />
          <span>Start with Verse of the Day</span>
        </label>
      </div>
      <div class="setting-group">
        <span class="setting-label">Text size</span>
        <div class="text-size-control" aria-label="Text size controls">
          <button class="icon-btn" id="mobileDecreaseText" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
          <button class="text-size-reset" id="mobileResetText" aria-label="Reset text size to 100%" data-tooltip="Reset text size">Aa ${Math.round(state.textScale * 100)}%</button>
          <button class="icon-btn" id="mobileIncreaseText" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
        </div>
      </div>
    </div>
  `;
}

function topbar() {
  const selectedVersions = activeVersions();
  const maxVersions = versionLimit();
  const versionSelectLabel = selectedVersions.length >= maxVersions ? `Max ${maxVersions}` : "Add";
  const primaryVersion = state.versions[0] || "BSB";
  const primaryVersionOptions = translationCodes
    .map((version) => `<option value="${version}" ${version === primaryVersion ? "selected" : ""}>${version} · ${translationLookup[version]?.name || version}</option>`)
    .join("");
  const versionControls = state.mode === "parallel"
    ? `
      <div class="versions version-manager" aria-label="Selected Bible versions">
        ${selectedVersions.map((version) => `<span class="version-pill">${version}<button data-remove-version="${version}" aria-label="Remove ${version}" data-tooltip="Remove ${version}">x</button></span>`).join("")}
        <select id="versionSelect" aria-label="Add Bible version" ${selectedVersions.length >= maxVersions ? "disabled" : ""}>
          <option>${versionSelectLabel}</option>
          ${translationCodes.filter((version) => !selectedVersions.includes(version)).map((version) => `<option value="${version}">${version}</option>`).join("")}
        </select>
      </div>`
    : `
      <div class="versions primary-version-control" aria-label="Bible version">
        <select id="versionSelect" aria-label="Bible version">
          ${primaryVersionOptions}
        </select>
      </div>`;
  const followsSystemTheme = !localStorage.getItem("lw_theme");
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Fullscreen";
  const modeOptions = [
    ["reader", "Reader", icons.book],
    ["parallel", "Parallel Study", icons.parallel],
    ["big", "Big Screen", icons.screen],
    ["trivia", "Trivia", icons.trivia],
  ];
  const focusLabel = state.focusMode ? "Show panels" : "Focus reading";
  const themeLabel = state.theme === "dark" ? "Light mode" : "Dark mode";
  const themePresetOptions = themePresets
    .filter((preset) => preset.mode === state.theme)
    .map((preset) => `<option value="${preset.code}" ${preset.code === state.themePreset ? "selected" : ""}>${preset.name}</option>`)
    .join("");
  const scriptureFontOptions = scriptureFonts
    .map((font) => `<option value="${font.code}" ${font.code === state.scriptureFont ? "selected" : ""}>${font.name}</option>`)
    .join("");
  const customFontField = state.scriptureFont === "custom"
    ? `<input class="custom-font-input" id="customScriptureFontInput" value="${escapeHtml(state.customScriptureFont)}" placeholder="Georgia, Charter, Avenir..." aria-label="Custom scripture font" />`
    : "";
  return `
    <header class="topbar">
      <button class="brand" id="brandVerseOfDay" type="button" aria-label="Open verse of the day">
        <img class="brand-mark-image" src="./assets/brand-mark.png" alt="" />
        <span class="brand-divider" aria-hidden="true"></span>
        <div>
          <div class="brand-title">Big Screen</div>
          <div class="brand-subtitle">Bible</div>
        </div>
      </button>
      ${streakChip()}
      <label class="search">${icons.search}<input id="referenceInput" value="${escapeHtml(state.searchQuery || referenceLabel())}" aria-label="Search Bible reference or phrase" placeholder="John 3:16 or love one another" /></label>
      <button class="icon-btn mobile-controls-toggle ${state.mobileControlsOpen ? "active" : ""}" id="mobileControlsToggle" aria-label="${state.mobileControlsOpen ? "Hide extra controls" : "Show extra controls"}" data-tooltip="${state.mobileControlsOpen ? "Hide controls" : "More controls"}">${icons.plus}<span>More</span></button>
      ${versionControls}
      <nav class="mode-tabs" aria-label="View mode">
        ${modeOptions.map(([mode, label, icon]) => `<button class="${state.mode === mode ? "active" : ""}" data-mode="${mode}" aria-label="${label}" data-tooltip="${label}">${icon}<span class="mode-label">${label}</span></button>`).join("")}
      </nav>
      <button class="icon-btn" id="shortcutsButton" aria-label="Keyboard shortcuts" data-tooltip="Keyboard shortcuts">?</button>
      <button class="icon-btn focus-toggle ${state.focusMode ? "active" : ""}" id="focusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}</button>
      <div class="settings-menu">
        <button class="icon-btn settings-toggle ${state.settingsOpen ? "active" : ""}" id="settingsToggle" aria-label="Settings" data-tooltip="Settings">${icons.settings}</button>
        <div class="settings-popover ${state.settingsOpen ? "open" : ""}" aria-hidden="${state.settingsOpen ? "false" : "true"}">
          <button class="settings-popover-close" id="settingsClose" type="button" aria-label="Close settings">${icons.clear}</button>
          ${streakCard()}
          <div class="setting-group">
            <label class="setting-label" for="themePresetSelect">Color theme</label>
            <select class="theme-preset-select" id="themePresetSelect" aria-label="Color theme">
              ${themePresetOptions}
            </select>
          </div>
          <div class="setting-group">
            <label class="setting-label" for="settingsPrimaryVersionSelect">Bible version</label>
            <select class="primary-version-select" id="settingsPrimaryVersionSelect" aria-label="Bible version">
              ${primaryVersionOptions}
            </select>
          </div>
          <div class="setting-group">
            <label class="setting-label" for="scriptureFontSelect">Scripture font</label>
            <select class="scripture-font-select" id="scriptureFontSelect" aria-label="Scripture font">
              ${scriptureFontOptions}
            </select>
            ${customFontField}
          </div>
          <div class="setting-row">
            <span class="setting-label">Mode</span>
            <button class="ghost-btn theme-toggle" id="themeToggle" aria-label="${themeLabel}">${state.theme === "dark" ? icons.sun : icons.moon}<span>${themeLabel}</span></button>
          </div>
          <div class="setting-row">
            <span class="setting-label">System</span>
            <button class="ghost-btn system-theme-btn" id="systemThemeButton" ${followsSystemTheme ? "disabled" : ""} aria-label="Follow system theme">${followsSystemTheme ? "Following system" : "Follow system"}</button>
          </div>
          <div class="setting-row">
            <span class="setting-label">Display</span>
            <button class="ghost-btn fullscreen-btn" id="fullscreenButton" aria-label="${fullscreenLabel}">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
          </div>
          <div class="setting-group">
            <span class="setting-label">Startup</span>
            <label class="setting-checkbox">
              <input type="checkbox" id="startBigScreenToggle" ${state.startBigScreen ? "checked" : ""} />
              <span>Start in Big Screen Mode</span>
            </label>
            <label class="setting-checkbox">
              <input type="checkbox" id="startVerseOfDayToggle" ${state.startVerseOfDay ? "checked" : ""} />
              <span>Start with Verse of the Day</span>
            </label>
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

function streakChip() {
  const streak = normalizeReadingStreak(state.streak);
  return `
    <div class="streak-chip" aria-label="Reading streak">
      ${icons.flame}
      <span>
        <strong>${streak.current}</strong>
        <span>day streak</span>
      </span>
    </div>
  `;
}

function streakCard() {
  const streak = normalizeReadingStreak(state.streak);
  const lastVisitLabel = streak.lastVisit ? "Checked in today" : "Start today";
  return `
    <section class="streak-card" aria-label="Reading streak">
      <div class="streak-card-head">
        ${icons.flame}
        <div>
          <span class="setting-label">Daily streak</span>
          <strong>${streak.current} ${streak.current === 1 ? "day" : "days"}</strong>
        </div>
      </div>
      <div class="streak-stats">
        <span><strong>${streak.best}</strong><small>Best</small></span>
        <span><strong>${streak.totalDays}</strong><small>Total days</small></span>
      </div>
      <p>${lastVisitLabel}. This stays private to this browser until account sync is added.</p>
    </section>
  `;
}

function streakPopup() {
  if (!state.streakPopupVisible) return "";
  const streak = normalizeReadingStreak(state.streak);
  const title = streak.current > 1 ? `${streak.current}-day streak` : "You started a streak";
  const message = streak.current > 1
    ? "Welcome back. A little daily rhythm is taking shape."
    : "Welcome. Come back tomorrow to keep it going.";
  return `
    <aside class="streak-popup" role="status" aria-live="polite">
      <div class="streak-popup-icon">${icons.flame}</div>
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    </aside>
  `;
}

function scheduleStreakPopupDismiss() {
  if (!state.streakPopupVisible) return;
  clearTimeout(streakPopupTimer);
  streakPopupTimer = setTimeout(() => {
    state.streakPopupVisible = false;
    render();
  }, 4200);
}

function rail() {
  const items = [
    ["Verse", icons.book],
    ["Bookmarks", icons.bookmark],
    ["Notes", icons.note],
    ["Cross-Refs", icons.link],
    ["History", icons.history],
    ["Search", icons.search],
  ];
  return `<aside class="rail">${items.map(([label, icon]) => `<button class="${state.activeRail === label ? "active" : ""}" data-rail="${label}" aria-label="${label}" data-tooltip="${label}">${icon}</button>`).join("")}</aside>`;
}

function library() {
  const titleMap = {
    Verse: "Verse",
    Bookmarks: "Bookmarks",
    Notes: "Notes",
    "Cross-Refs": "Cross References",
    History: "History",
    Search: "Search",
  };
  const title = titleMap[state.activeRail] || "Verse";
  const closeLabel = `Hide ${title.toLowerCase()}`;
  return `
    <aside class="library">
      <div class="panel-minihead">
        <span>${title}</span>
        <button class="icon-btn" id="closeLibrary" aria-label="${escapeHtml(closeLabel)}" data-tooltip="${escapeHtml(closeLabel)}">×</button>
      </div>
      ${libraryContent()}
    </aside>
  `;
}

function libraryContent() {
  if (state.activeRail === "Bookmarks") return bookmarksPanel();
  if (state.activeRail === "Notes") return notesPanel();
  if (state.activeRail === "Cross-Refs") return crossReferencesPanel();
  if (state.activeRail === "History") return historyPanel();
  if (state.activeRail === "Search") return searchPanel();
  return versePickerPanel();
}

function versePickerPanel() {
  const chapterKeys = currentBookChapterKeys();
  return `
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
      <span>Verse of the Day uses a local Big Screen Bible curated schedule with no borrowed daily calendar.</span>
    </div>
  `;
}

function crossReferencesPanel() {
  const refs = crossReferenceItems();
  return `
    <section class="study-section panel-section" id="crossRefsSection">
      <div class="study-heading">${icons.link} ${escapeHtml(referenceLabel())}</div>
      <div class="ref-list">
        ${refs.length
          ? refs.map((ref) => `<button class="ref-item" data-goto="${escapeHtml(ref.goto)}"><div class="ref-title">${escapeHtml(ref.label)}</div><div class="ref-copy">${escapeHtml(ref.preview)}</div></button>`).join("")
          : `<div class="empty-state">No cross references are bundled for ${escapeHtml(referenceLabel())}.</div>`}
      </div>
      <div class="source-note">
        Cross references from <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noopener">OpenBible.info</a>, CC-BY.
      </div>
    </section>
  `;
}

function searchPanel() {
  return `
    <section class="study-section panel-section" id="searchSection">
      <form class="study-search" id="studySearchForm">
        <input id="studySearchInput" value="${escapeHtml(state.searchQuery)}" placeholder="Search words or phrases" aria-label="Search Bible words or phrases" />
        <button class="ghost-btn" type="submit">Search</button>
      </form>
      <div class="search-results">
        ${searchResultsMarkup()}
      </div>
    </section>
  `;
}

function notesPanel() {
  const activeRef = activePassageLabel();
  return `
    <section class="study-section panel-section" id="notesSection">
      <div class="study-heading">${icons.note} ${escapeHtml(activeRef)}</div>
      <textarea class="note-box" id="noteBox" aria-label="Note for ${activeRef}">${state.notes[activeRef] || ""}</textarea>
      <button class="text-btn" id="saveNote">Save note</button>
      <div class="panel-subheading">Highlighted verses</div>
      <div class="highlight-list saved-list">
        ${highlightItemsMarkup()}
      </div>
      <div class="panel-subheading">Saved notes</div>
      <div class="note-list saved-list">
        ${noteItemsMarkup()}
      </div>
    </section>
  `;
}

function bookmarksPanel() {
  const ref = activePassageLabel();
  const isBookmarked = state.bookmarks.includes(ref);
  return `
    <section class="study-section panel-section" id="bookmarksSection">
      <button class="ghost-btn panel-action" id="panelBookmarkToggle">${isBookmarked ? "Remove" : "Add"} ${escapeHtml(ref)}</button>
      <div class="bookmark-list">
        ${bookmarkItemsMarkup()}
      </div>
    </section>
  `;
}

function historyPanel() {
  return `
    <section class="study-section panel-section" id="historySection">
      <div class="history-list">
        ${historyItemsMarkup()}
      </div>
      ${state.history.length ? `<button class="text-btn danger-text" id="clearHistory">Clear history</button>` : ""}
    </section>
  `;
}

function reader() {
  if (state.mode === "trivia") return triviaView();
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
  const version = state.versions[0] || "BSB";
  return `
    <h1 class="section-title">${currentChapter().title}</h1>
    ${selectionBar()}
    ${currentChapter().verses.map((verse) => `
      <p class="verse ${verseStateClasses(verse.n)}" data-verse="${verse.n}">
        <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
        <span class="verse-text">${renderStrongText(verse, version)}</span>
        <button class="verse-copy" data-copy-verse="${verse.n}" aria-label="Copy ${state.reference}:${verse.n}" data-tooltip="Copy verse">Copy</button>
      </p>
    `).join("")}
  `;
}

function triviaView() {
  const questions = triviaQuestions();
  const categories = triviaCategories(questions);
  const categoryOptions = categories.map((category) => `<option value="${escapeHtml(category)}" ${category === state.triviaCategory ? "selected" : ""}>${escapeHtml(category)}</option>`).join("");
  const difficultyOptions = triviaDifficulties().map((difficulty) => `<option value="${escapeHtml(difficulty)}" ${difficulty === state.triviaDifficulty ? "selected" : ""}>${escapeHtml(difficulty)}</option>`).join("");
  const countOptions = [5, 10, 15, 20, 25].map((count) => `<option value="${count}" ${count === state.triviaCount ? "selected" : ""}>${count} questions</option>`).join("");
  return `
    <section class="reader trivia-reader">
      <article class="trivia-panel">
        <div class="trivia-header">
          <div>
            <div class="trivia-eyebrow">Scripture knowledge</div>
            <h1>Bible Trivia</h1>
          </div>
          <div class="trivia-score-chip">${triviaScoreLabel()}</div>
        </div>
        ${state.triviaGame ? triviaGameView() : `
          <div class="trivia-setup">
            <p>Choose a category, then answer multiple-choice questions with a reference reveal after each answer.</p>
            <div class="trivia-setup-controls">
              <label>
                <span>Category</span>
                <select id="triviaCategorySelect">${categoryOptions}</select>
              </label>
              <label>
                <span>Difficulty</span>
                <select id="triviaDifficultySelect">${difficultyOptions}</select>
              </label>
              <label>
                <span>Round length</span>
                <select id="triviaCountSelect">${countOptions}</select>
              </label>
            </div>
            <button class="primary-btn trivia-start" id="startTriviaGame">${icons.trivia}<span>Start Trivia</span></button>
          </div>
        `}
      </article>
    </section>
  `;
}

function triviaGameView() {
  const game = state.triviaGame;
  if (game.complete) return triviaResultsView(game);
  const question = game.questions[game.index];
  const answered = game.selectedAnswer !== null;
  const correct = game.selectedAnswer === question.answer;
  const finalPerfectAnswer = answered && correct && game.index === game.questions.length - 1 && game.score === game.questions.length;
  return `
    <div class="trivia-game ${finalPerfectAnswer ? "perfect" : ""}">
      ${finalPerfectAnswer ? triviaCelebration() : ""}
      <div class="trivia-progress">
        <span>${escapeHtml(game.category)} · ${escapeHtml(game.difficulty)}</span>
        <strong>${game.index + 1} / ${game.questions.length}</strong>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="trivia-choices">
        ${question.choices.map((choice) => triviaChoiceButton(question, choice, answered)).join("")}
      </div>
      ${answered ? `
        <div class="trivia-feedback ${correct ? "correct" : "incorrect"}">
          <strong>${correct ? "Correct" : "Not quite"}</strong>
          <p>${escapeHtml(question.explanation)}</p>
          <div class="trivia-reference">
            <span>${escapeHtml(question.reference)}</span>
            <button class="text-btn" id="openTriviaReference">Open reference</button>
          </div>
        </div>
        <div class="trivia-actions">
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.questions.length - 1 ? "Finish round" : "Next question"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
        </div>
      `}
    </div>
  `;
}

function triviaChoiceButton(question, choice, answered) {
  const selected = choice === state.triviaGame.selectedAnswer;
  const isCorrect = choice === question.answer;
  const classes = [
    "trivia-choice",
    answered && isCorrect ? "correct" : "",
    answered && selected && !isCorrect ? "incorrect" : "",
  ].filter(Boolean).join(" ");
  return `<button class="${classes}" data-trivia-answer="${escapeHtml(choice)}" ${answered ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
}

function triviaResultsView(game) {
  const percent = Math.round((game.score / game.questions.length) * 100);
  return `
    <div class="trivia-results ${percent === 100 ? "perfect" : ""}">
      ${percent === 100 ? triviaCelebration() : ""}
      <div class="trivia-result-ring">${percent}%</div>
      <h2>${triviaResultTitle(percent)}</h2>
      <p>You answered ${game.score} of ${game.questions.length} correctly in ${escapeHtml(game.category)} at ${escapeHtml(game.difficulty)} difficulty.</p>
      <div class="trivia-actions">
        <button class="ghost-btn" id="restartTriviaGame">Try again</button>
        <button class="primary-btn" id="newTriviaGame">New category</button>
      </div>
    </div>
  `;
}

function triviaCelebration() {
  return `<div class="trivia-confetti" aria-hidden="true">${Array.from({ length: 72 }, (_, index) => `<span style="--i:${index};--x:${(index * 37) % 100}"></span>`).join("")}</div>`;
}

function triviaResultTitle(percent) {
  if (percent >= 90) return "Excellent round";
  if (percent >= 70) return "Strong work";
  if (percent >= 50) return "Good start";
  return "Keep going";
}

function triviaScoreLabel() {
  if (!state.triviaGame) return `${triviaPool().length} questions`;
  if (state.triviaGame.complete) return `${state.triviaGame.score} / ${state.triviaGame.questions.length}`;
  return `${state.triviaGame.score} correct`;
}

function parallelView() {
  const versions = activeVersions();
  return `
    ${selectionBar()}
    <div class="parallel-table" style="--version-count: ${versions.length}">
      <div class="parallel-head"><div>V</div>${versions.map((version) => `<div>${version}</div>`).join("")}</div>
      ${currentChapter().verses.map((verse) => `
        <div class="parallel-row ${verseStateClasses(verse.n)}" data-verse="${verse.n}">
          <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
          ${versions.map((version) => `<div class="parallel-copy" data-version="${escapeHtml(version)}">${renderStrongText(verse, version)}</div>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function verseStateClasses(verseNumber) {
  return [
    verseNumber === state.verse ? "selected" : "",
    state.selectedVerses.includes(verseNumber) ? "passage-selected" : "",
    highlightClassForVerse(verseNumber),
  ].filter(Boolean).join(" ");
}

function highlightClassForVerse(verseNumber) {
  const color = state.highlights[`${state.reference}:${verseNumber}`];
  return highlightColors.includes(color) ? `highlight-${color}` : "";
}

function crossReferenceItems(reference = referenceLabel()) {
  const sourceRefs = window.BIGSCREEN_CROSS_REFS?.refs?.[reference] || [];
  return sourceRefs.map(normalizeCrossReference).filter(Boolean);
}

function bookmarkItemsMarkup() {
  if (!state.bookmarks.length) return `<div class="empty-state">No bookmarks saved yet.</div>`;
  return state.bookmarks.slice().sort(compareReferenceStrings).map((ref) => `
    <div class="saved-item">
      <button class="bookmark-item" data-goto="${escapeHtml(ref)}">
        <div class="bookmark-title">${escapeHtml(ref)}</div>
        <div class="muted">Open bookmarked passage</div>
      </button>
      <div class="saved-actions">
        <button class="text-btn" data-edit-bookmark="${escapeHtml(ref)}">Edit</button>
        <button class="text-btn danger-text" data-delete-bookmark="${escapeHtml(ref)}">Delete</button>
      </div>
    </div>
  `).join("");
}

function noteItemsMarkup() {
  const entries = Object.entries(state.notes).filter(([, note]) => String(note || "").trim());
  if (!entries.length) return `<div class="empty-state">No saved notes yet.</div>`;
  return entries.sort(([a], [b]) => compareReferenceStrings(a, b)).map(([ref, note]) => `
    <div class="saved-item">
      <button class="note-item" data-goto="${escapeHtml(ref)}">
        <div class="note-title">${escapeHtml(ref)}</div>
        <div class="note-copy">${escapeHtml(truncatePreview(note))}</div>
      </button>
      <div class="saved-actions">
        <button class="text-btn" data-edit-note="${escapeHtml(ref)}">Edit</button>
        <button class="text-btn danger-text" data-delete-note="${escapeHtml(ref)}">Delete</button>
      </div>
    </div>
  `).join("");
}

function highlightItemsMarkup() {
  const groups = groupedHighlightItems();
  if (!groups.length) return `<div class="empty-state">No highlighted verses yet.</div>`;
  return groups.map(({ ref, color }) => {
    const preview = passagePreviewForReference(ref);
    const hasNote = Boolean(String(state.notes[ref] || "").trim());
    return `
      <div class="saved-item">
        <button class="highlight-item" data-goto="${escapeHtml(ref)}">
          <div class="highlight-title">
            <span class="highlight-dot highlight-${escapeHtml(color)}" aria-hidden="true"></span>
            <span>${escapeHtml(ref)}</span>
          </div>
          <div class="note-copy">${escapeHtml(truncatePreview(preview || "Open highlighted verse"))}</div>
        </button>
        <div class="saved-actions">
          <button class="text-btn" data-note-highlight="${escapeHtml(ref)}">${hasNote ? "Edit note" : "Add note"}</button>
          <button class="text-btn danger-text" data-delete-highlight="${escapeHtml(ref)}">Remove</button>
        </div>
      </div>
    `;
  }).join("");
}

function historyItemsMarkup() {
  if (!state.history.length) return `<div class="empty-state">No reading history yet.</div>`;
  return state.history.map((item) => {
    const ref = typeof item === "string" ? item : item.ref;
    const when = typeof item === "string" ? "" : formatHistoryTime(item.at);
    return `
      <div class="saved-item">
        <button class="history-item" data-goto="${escapeHtml(ref)}">
          <div class="bookmark-title">${escapeHtml(ref)}</div>
          <div class="muted">${when || "Open recent passage"}</div>
        </button>
        <div class="saved-actions">
          <button class="text-btn danger-text" data-delete-history="${escapeHtml(ref)}">Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

function formatHistoryTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function groupedHighlightItems() {
  const parsed = Object.entries(state.highlights)
    .map(([ref, color]) => ({ ...parsePassageReference(ref), color }))
    .filter((item) => item.key && item.verses.length === 1 && highlightColors.includes(item.color))
    .sort((a, b) => compareReferenceParts(a, b));
  const groups = [];
  parsed.forEach((item) => {
    const verse = item.verses[0];
    const last = groups[groups.length - 1];
    if (last && last.key === item.key && last.color === item.color && verse === last.verses[last.verses.length - 1] + 1) {
      last.verses.push(verse);
    } else {
      groups.push({ key: item.key, color: item.color, verses: [verse] });
    }
  });
  return groups.map((group) => ({
    ref: formatReferenceLabel(group.key, group.verses),
    color: group.color,
  }));
}

function passagePreviewForReference(ref) {
  const parsed = parsePassageReference(ref);
  if (!parsed) return "";
  const selected = new Set(parsed.verses);
  const lines = (bibleData[parsed.key]?.verses || [])
    .filter((verse) => selected.has(verse.n))
    .map((verse) => getVerseText(verse, state.versions[0] || "BSB"));
  return lines.join(" ");
}

function compareReferenceStrings(a, b) {
  const left = referenceSortKey(a);
  const right = referenceSortKey(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1;
    if (left[index] > right[index]) return 1;
  }
  return 0;
}

function referenceSortKey(ref) {
  const parsed = parsePassageReference(ref);
  if (!parsed) return [999, 0, 0, String(ref || "")];
  const match = parsed.key.match(/^(.+)\s(\d+)$/);
  if (!match) return [999, 0, parsed.verse || 0, String(ref || "")];
  const [, book, chapterNumber] = match;
  const bookIndex = books.indexOf(book);
  return [bookIndex === -1 ? 999 : bookIndex, Number(chapterNumber), parsed.verses[0] || parsed.verse || 0, ref];
}

function compareReferenceParts(a, b) {
  return compareReferenceStrings(formatReferenceLabel(a.key, a.verses), formatReferenceLabel(b.key, b.verses));
}

function openStrongPopup(anchor) {
  const code = anchor.dataset.strong;
  const word = anchor.dataset.strongWord || "";
  const lookup = strongEntry(code);
  state.selectedStrong = code;
  state.selectedStrongWord = word;
  const status = strongLexiconStatus === "loading"
    ? "Open Scriptures lexicon is still loading. Try this word again in a moment."
    : "No dictionary entry was found for this word yet.";
  const content = lookup
    ? strongLookupCard(lookup, word ? `${word} · ` : "")
    : `<div class="ref-title">${escapeHtml(word || code)}</div><div class="ref-copy">${escapeHtml(status)}</div>`;
  showStudyPopup(anchor, content, "Strong's");
}

function openCrossReferencePopup(anchor) {
  const verseNumber = Number(anchor.dataset.crossRefVerse);
  const reference = `${state.reference}:${verseNumber}`;
  const refs = crossReferenceItems(reference);
  state.verse = verseNumber;
  const content = `
    <div class="ref-title">${escapeHtml(reference)} cross references</div>
    <div class="popup-ref-list">
      ${refs.length
        ? refs.map((ref) => `<button class="ref-item" data-popup-goto="${escapeHtml(ref.goto)}"><div class="ref-title">${escapeHtml(ref.label)}</div><div class="ref-copy">${escapeHtml(ref.preview)}</div></button>`).join("")
        : `<div class="empty-state">No cross references are bundled for ${escapeHtml(reference)}.</div>`}
    </div>
    <div class="source-note">Cross references from OpenBible.info, CC-BY.</div>
  `;
  showStudyPopup(anchor, content, "Cross references");
}

function showStudyPopup(anchor, content, label) {
  closeStudyPopup();
  const popup = document.createElement("div");
  popup.className = "study-popup";
  popup.id = "studyPopup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", label);
  popup.innerHTML = `
    <div class="study-popup-head">
      <div class="study-popup-title">${escapeHtml(label)}</div>
      <button class="study-popup-close" type="button" aria-label="Close popup">×</button>
    </div>
    ${content}
  `;
  (document.querySelector(".app-shell") || document.body).appendChild(popup);
  positionStudyPopup(anchor, popup);
  popup.querySelector(".study-popup-close")?.addEventListener("click", closeStudyPopup);
  popup.querySelectorAll("[data-popup-goto]").forEach((button) => {
    button.addEventListener("click", () => {
      closeStudyPopup();
      gotoReference(button.dataset.popupGoto);
    });
  });
  requestAnimationFrame(() => {
    document.addEventListener("click", closeStudyPopupOnOutside, true);
    window.addEventListener("resize", closeStudyPopup, { once: true });
  });
}

function positionStudyPopup(anchor, popup) {
  const rect = anchor.getBoundingClientRect();
  const gap = 10;
  const maxWidth = Math.min(360, window.innerWidth - 24);
  popup.style.maxWidth = `${maxWidth}px`;
  const popupRect = popup.getBoundingClientRect();
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - popupRect.width / 2), window.innerWidth - popupRect.width - 12);
  const canFitBelow = rect.bottom + gap + popupRect.height <= window.innerHeight - 12;
  const top = canFitBelow ? rect.bottom + gap : Math.max(12, rect.top - popupRect.height - gap);
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function closeStudyPopupOnOutside(event) {
  const popup = document.getElementById("studyPopup");
  if (!popup) return;
  if (popup.contains(event.target) || event.target.closest?.("[data-strong], [data-cross-ref-verse]")) return;
  closeStudyPopup();
}

function closeStudyPopup() {
  document.getElementById("studyPopup")?.remove();
  document.removeEventListener("click", closeStudyPopupOnOutside, true);
}

function searchResultsMarkup() {
  if (!state.searchQuery) {
    return `<div class="empty-state">Search by phrase, word, or reference. Try “love one another” or “still small voice.”</div>`;
  }
  if (!state.searchResults.length) {
    return `<div class="empty-state">No matches found for ${escapeHtml(state.searchQuery)} in the bundled translations.</div>`;
  }
  return state.searchResults.map((result) => `
    <button class="search-result" data-goto="${escapeHtml(result.ref)}">
      <div class="ref-title">${escapeHtml(result.ref)} · ${escapeHtml(result.version)}${result.matchType ? ` · ${escapeHtml(result.matchType)}` : ""}</div>
      <div class="ref-copy">${highlightSearchTerms(result.text, state.searchQuery)}</div>
    </button>
  `).join("");
}

function highlightSearchTerms(text, query) {
  const safeText = escapeHtml(text);
  const terms = searchTokens(query);
  if (!terms.length) return safeText;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return safeText.replace(pattern, "<mark>$1</mark>");
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
  return getVerseText(verse, state.versions[0] || "BSB");
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
      <button class="nav-button chapter-nav chapter-nav-prev" id="prevChapter" aria-label="Previous chapter">
        <span class="chapter-nav-icon" aria-hidden="true">‹</span>
        <span class="chapter-nav-label">Previous Chapter</span>
      </button>
      <div class="fineprint">${activeVersions().join(" / ")} · ${referenceLabel()}</div>
      <div class="bottom-actions">
        <button class="ghost-btn bottom-action" id="copyVerse" aria-label="Copy verse">
          <span class="bottom-action-icon" aria-hidden="true">${icons.copy}</span>
          <span class="bottom-action-label">Copy Verse</span>
        </button>
        <button class="ghost-btn bottom-action" id="printPage" aria-label="Print">
          <span class="bottom-action-icon" aria-hidden="true">${icons.print}</span>
          <span class="bottom-action-label">Print</span>
        </button>
      </div>
      <button class="nav-button chapter-nav chapter-nav-next" id="nextChapter" aria-label="Next chapter">
        <span class="chapter-nav-label">Next Chapter</span>
        <span class="chapter-nav-icon" aria-hidden="true">›</span>
      </button>
    </footer>
  `;
}

function selectionBar() {
  const count = state.selectedVerses.length;
  if (!count) return "";
  const label = printReferenceLabel(state.selectedVerses);
  return `
    <div class="selection-bar" role="status">
      <span>${count} selected · ${label}</span>
      <div class="highlight-palette" aria-label="Highlight selected verses">
        ${highlightColors.map((color) => `<button class="highlight-swatch highlight-${color}" data-highlight-color="${color}" aria-label="Highlight ${color}"></button>`).join("")}
        <button class="highlight-swatch highlight-remove" data-highlight-color="none" aria-label="Remove highlight">${icons.clear}</button>
      </div>
      <button class="text-btn selection-action" id="copySelection" aria-label="Copy passage"><span class="selection-action-icon">${icons.copy}</span><span class="selection-action-label">Copy passage</span></button>
      <button class="text-btn selection-action" id="shareSelection" aria-label="Share passage"><span class="selection-action-icon">${icons.share}</span><span class="selection-action-label">Share</span></button>
      <button class="text-btn selection-action" id="copySelectionLink" aria-label="Copy passage link"><span class="selection-action-icon">${icons.link}</span><span class="selection-action-label">Copy link</span></button>
      <button class="text-btn selection-action" id="printSelection" aria-label="Print passage"><span class="selection-action-icon">${icons.print}</span><span class="selection-action-label">Print</span></button>
      <button class="text-btn selection-action" id="clearSelection" aria-label="Clear selected verses"><span class="selection-action-icon">${icons.clear}</span><span class="selection-action-label">Clear</span></button>
    </div>
  `;
}

function presentation() {
  const verse = currentVerse();
  const version = state.versions[0] || "BSB";
  const text = getVerseText(verse, version);
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Enter fullscreen";
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
  const scriptureFontOptions = scriptureFonts
    .map((font) => `<option value="${font.code}" ${font.code === state.scriptureFont ? "selected" : ""}>${font.name}</option>`)
    .join("");
  const customFontField = state.scriptureFont === "custom"
    ? `<input class="custom-font-input" id="presentationCustomScriptureFontInput" value="${escapeHtml(state.customScriptureFont)}" placeholder="Georgia, Charter, Avenir..." aria-label="Custom scripture font" />`
    : "";
  return `
    <section class="presentation ${state.mode === "big" ? "open" : ""} ${state.presentationControlsVisible || state.presentationSearchOpen ? "controls-visible" : ""} ${state.presentationSearchOpen ? "search-active" : ""}" id="presentation" data-presentation-theme="${state.presentationTheme}">
      <div class="presentation-top">
        <div class="presentation-search-slot">
          <form class="presentation-search ${state.presentationSearchOpen ? "search-open" : ""}" id="presentationSearchForm">
            <button class="ghost-btn presentation-search-toggle" type="button" id="presentationSearchToggle" aria-label="Search passage" data-tooltip="Search passage">${icons.search}</button>
            <input id="presentationSearchInput" value="" aria-label="Search passage in presentation" placeholder="John 3:16" />
            <button class="ghost-btn presentation-search-go" type="submit">Go</button>
          </form>
        </div>
        <div class="presentation-ref">
          <span class="presentation-reference-label">${referenceLabel()}</span>
          <span class="presentation-version-label">${version}</span>
        </div>
        <div class="presentation-actions">
          <button class="ghost-btn presentation-fullscreen-toggle" id="presentationFullscreenQuick" type="button" aria-label="${fullscreenLabel}" data-tooltip="${fullscreenLabel}">${fullscreenIcon}</button>
          <div class="presentation-settings-menu">
            <button class="ghost-btn presentation-settings-toggle ${state.presentationSettingsOpen ? "active" : ""}" type="button" id="presentationSettingsToggle" aria-label="Big Screen settings" data-tooltip="Big Screen settings">${icons.settings}</button>
            <div class="presentation-settings-popover ${state.presentationSettingsOpen ? "open" : ""}" aria-hidden="${state.presentationSettingsOpen ? "false" : "true"}">
              <button class="presentation-popover-close" id="presentationSettingsClose" type="button" aria-label="Close Big Screen settings">${icons.clear}</button>
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
              <label>
                <span>Scripture font</span>
                <select id="presentationScriptureFontSelect" class="scripture-font-select" aria-label="Change scripture font">
                  ${scriptureFontOptions}
                </select>
                ${customFontField}
              </label>
              <button class="ghost-btn presentation-fullscreen-btn" id="presentationFullscreenButton" type="button">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
              <div class="presentation-help">
                <span>Keyboard</span>
                <div><kbd>←</kbd><kbd>→</kbd> Move verse by verse</div>
                <div><kbd>Esc</kbd> Back to Bible</div>
              </div>
            </div>
          </div>
          <button class="ghost-btn presentation-bible-toggle" id="closePresentation" aria-label="Back to Bible" data-tooltip="Back to Bible">${icons.book}</button>
        </div>
      </div>
      <div class="presentation-text"><span class="presentation-copy">${text}</span></div>
      <div class="presentation-bottom">
        <div class="presentation-brand" aria-label="Big Screen Bible">
          <img class="presentation-brand-mark" src="./assets/brand-mark.png" alt="" />
          <span class="presentation-brand-copy"><span>Big Screen</span><strong>Bible</strong></span>
        </div>
        <div class="presentation-controls">
          <button class="ghost-btn" id="presentationPrev" data-tooltip="Previous verse" ${canGoBack ? "" : "disabled"}>Previous</button>
          <button class="ghost-btn" id="presentationNext" data-tooltip="Next verse" ${canGoForward ? "" : "disabled"}>Next</button>
        </div>
        <span class="presentation-bottom-spacer" aria-hidden="true"></span>
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
    ["S", "Open search"],
    ["T", "Open trivia"],
    ["V", "Open verse picker"],
    ["N", "Open notes"],
    ["B", "Open bookmarks"],
    ["C", "Open cross references"],
    ["← / →", "Move verse by verse"],
    ["Esc", "Close overlay or go back to Bible"],
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
  document.getElementById("versionSelect")?.addEventListener("change", async (event) => {
    const version = event.target.value;
    if (!translationCodes.includes(version)) return;
    if (state.mode !== "parallel") {
      await setPrimaryVersion(version, { preserveScroll: true, keepPresentationSettings: true });
      return;
    }
    if (state.versions.length >= versionLimit()) {
      event.target.value = event.target.options[0]?.value || "Add";
      return showToast(`Use up to ${versionLimit()} versions on this screen`);
    }
    state.versions.push(version);
    await loadBibleVersion(version);
    rebuildBibleData();
    localStorage.setItem("lw_versions", JSON.stringify(state.versions));
    renderPreservingReaderScroll();
  });
  document.getElementById("settingsPrimaryVersionSelect")?.addEventListener("change", async (event) => {
    await setPrimaryVersion(event.target.value, { preserveScroll: true, keepPresentationSettings: true });
  });
  document.getElementById("mobileSettingsPrimaryVersionSelect")?.addEventListener("change", async (event) => {
    await setPrimaryVersion(event.target.value, { preserveScroll: true, keepPresentationSettings: true });
  });
  document.getElementById("settingsToggle")?.addEventListener("click", () => {
    state.settingsOpen = !state.settingsOpen;
    renderPreservingReaderScroll();
  });
  document.getElementById("settingsClose")?.addEventListener("click", () => {
    state.settingsOpen = false;
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileFloatingSettings")?.addEventListener("click", () => {
    state.settingsOpen = !state.settingsOpen;
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileSettingsClose")?.addEventListener("click", () => {
    state.settingsOpen = false;
    renderPreservingReaderScroll();
  });
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    state.themePreset = savedThemePreset(state.theme);
    localStorage.setItem("lw_theme", state.theme);
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileThemeToggle")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    state.themePreset = savedThemePreset(state.theme);
    localStorage.setItem("lw_theme", state.theme);
    renderPreservingReaderScroll();
  });
  document.getElementById("systemThemeButton")?.addEventListener("click", resetThemeToSystem);
  document.getElementById("mobileSystemThemeButton")?.addEventListener("click", resetThemeToSystem);
  document.getElementById("themePresetSelect")?.addEventListener("change", (event) => {
    setThemePreset(event.target.value);
  });
  document.getElementById("mobileThemePresetSelect")?.addEventListener("change", (event) => {
    setThemePreset(event.target.value);
  });
  document.getElementById("scriptureFontSelect")?.addEventListener("change", (event) => {
    setScriptureFont(event.target.value);
  });
  document.getElementById("mobileScriptureFontSelect")?.addEventListener("change", (event) => {
    setScriptureFont(event.target.value);
  });
  document.getElementById("customScriptureFontInput")?.addEventListener("change", (event) => {
    setCustomScriptureFont(event.target.value);
  });
  document.getElementById("mobileCustomScriptureFontInput")?.addEventListener("change", (event) => {
    setCustomScriptureFont(event.target.value);
  });
  document.getElementById("customScriptureFontInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setCustomScriptureFont(event.currentTarget.value);
  });
  document.getElementById("mobileCustomScriptureFontInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setCustomScriptureFont(event.currentTarget.value);
  });
  document.getElementById("fullscreenButton")?.addEventListener("click", toggleFullscreen);
  document.getElementById("mobileFullscreenButton")?.addEventListener("click", toggleFullscreen);
  document.getElementById("startBigScreenToggle")?.addEventListener("change", (event) => {
    state.startBigScreen = event.target.checked;
    localStorage.setItem("lw_start_big_screen", state.startBigScreen ? "true" : "false");
  });
  document.getElementById("mobileStartBigScreenToggle")?.addEventListener("change", (event) => {
    state.startBigScreen = event.target.checked;
    localStorage.setItem("lw_start_big_screen", state.startBigScreen ? "true" : "false");
  });
  document.getElementById("startVerseOfDayToggle")?.addEventListener("change", (event) => {
    state.startVerseOfDay = event.target.checked;
    localStorage.setItem("lw_start_verse_of_day", state.startVerseOfDay ? "true" : "false");
  });
  document.getElementById("mobileStartVerseOfDayToggle")?.addEventListener("change", (event) => {
    state.startVerseOfDay = event.target.checked;
    localStorage.setItem("lw_start_verse_of_day", state.startVerseOfDay ? "true" : "false");
  });
  document.getElementById("decreaseText")?.addEventListener("click", () => adjustTextScale(-0.1));
  document.getElementById("increaseText")?.addEventListener("click", () => adjustTextScale(0.1));
  document.getElementById("resetText")?.addEventListener("click", resetTextScale);
  document.getElementById("mobileDecreaseText")?.addEventListener("click", () => adjustTextScale(-0.1));
  document.getElementById("mobileIncreaseText")?.addEventListener("click", () => adjustTextScale(0.1));
  document.getElementById("mobileResetText")?.addEventListener("click", resetTextScale);
  document.getElementById("shortcutsButton")?.addEventListener("click", () => toggleShortcuts(true));
  document.getElementById("closeShortcuts")?.addEventListener("click", () => toggleShortcuts(false));
  document.querySelector(".shortcut-overlay")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("shortcut-overlay")) toggleShortcuts(false);
  });
  document.getElementById("focusToggle")?.addEventListener("click", toggleFocusMode);
  document.getElementById("mobileControlsToggle")?.addEventListener("click", toggleMobileControls);
  document.getElementById("brandVerseOfDay")?.addEventListener("click", openVerseOfDay);
  document.getElementById("exitFocusInline")?.addEventListener("click", toggleFocusMode);
  document.getElementById("closeLibrary")?.addEventListener("click", closeLibrary);
  document.getElementById("triviaCategorySelect")?.addEventListener("change", (event) => {
    state.triviaCategory = event.target.value;
    localStorage.setItem("lw_trivia_category", state.triviaCategory);
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaDifficultySelect")?.addEventListener("change", (event) => {
    state.triviaDifficulty = event.target.value;
    localStorage.setItem("lw_trivia_difficulty", state.triviaDifficulty);
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaCountSelect")?.addEventListener("change", (event) => {
    state.triviaCount = Number(event.target.value) || 10;
    localStorage.setItem("lw_trivia_count", String(state.triviaCount));
    renderPreservingReaderScroll();
  });
  document.getElementById("startTriviaGame")?.addEventListener("click", startTriviaGame);
  document.getElementById("restartTriviaGame")?.addEventListener("click", startTriviaGame);
  document.getElementById("newTriviaGame")?.addEventListener("click", () => {
    state.triviaGame = null;
    renderPreservingReaderScroll();
  });
  document.getElementById("nextTriviaQuestion")?.addEventListener("click", nextTriviaQuestion);
  document.getElementById("openTriviaReference")?.addEventListener("click", openTriviaReference);
  document.querySelectorAll("[data-trivia-answer]").forEach((button) => {
    button.addEventListener("click", () => answerTriviaQuestion(button.dataset.triviaAnswer));
  });
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
      openStrongPopup(button);
    });
  });
  document.querySelectorAll("[data-cross-ref-verse]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openCrossReferencePopup(button);
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
  document.querySelectorAll("[data-edit-bookmark]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      editBookmark(button.dataset.editBookmark);
    });
  });
  document.querySelectorAll("[data-delete-bookmark]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteBookmark(button.dataset.deleteBookmark);
    });
  });
  document.querySelectorAll("[data-edit-note]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      editNote(button.dataset.editNote);
    });
  });
  document.querySelectorAll("[data-delete-note]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteNote(button.dataset.deleteNote);
    });
  });
  document.querySelectorAll("[data-note-highlight]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openHighlightNote(button.dataset.noteHighlight);
    });
  });
  document.querySelectorAll("[data-delete-highlight]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeHighlight(button.dataset.deleteHighlight);
    });
  });
  document.querySelectorAll("[data-delete-history]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteHistoryItem(button.dataset.deleteHistory);
    });
  });
  document.getElementById("clearHistory")?.addEventListener("click", clearHistory);
  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => openBook(button.dataset.book));
  });
  document.querySelectorAll("[data-rail]").forEach((button) => {
    button.addEventListener("click", () => activateWorkspace(button.dataset.rail));
  });
  document.getElementById("referenceInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") runReferenceOrPhraseSearch(event.currentTarget.value);
  });
  document.getElementById("studySearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runReferenceOrPhraseSearch(document.getElementById("studySearchInput")?.value || "");
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
  document.getElementById("presentationScriptureFontSelect")?.addEventListener("change", (event) => {
    setScriptureFont(event.target.value);
  });
  document.getElementById("presentationCustomScriptureFontInput")?.addEventListener("change", (event) => {
    setCustomScriptureFont(event.target.value);
  });
  document.getElementById("presentationCustomScriptureFontInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setCustomScriptureFont(event.currentTarget.value);
  });
  document.getElementById("presentationFullscreenButton")?.addEventListener("click", toggleFullscreen);
  document.getElementById("presentationFullscreenQuick")?.addEventListener("click", toggleFullscreen);
  document.getElementById("presentationSettingsToggle")?.addEventListener("click", () => {
    state.presentationSettingsOpen = !state.presentationSettingsOpen;
    render();
  });
  document.getElementById("presentationSettingsClose")?.addEventListener("click", () => {
    state.presentationSettingsOpen = false;
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
    runReferenceOrPhraseSearch(document.getElementById("presentationSearchInput")?.value || "");
  });
  document.getElementById("presentation")?.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse") revealPresentationControls();
  });
  document.getElementById("presentation")?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "touch") revealPresentationControls();
  });
  document.getElementById("presentation")?.addEventListener("touchstart", (event) => {
    revealPresentationControls();
    if (state.mode !== "big" || isPresentationSwipeIgnored(event.target) || !event.touches?.[0]) {
      presentationTouchStart = null;
      return;
    }
    presentationTouchStart = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      time: Date.now(),
    };
  }, { passive: true });
  document.getElementById("presentation")?.addEventListener("touchend", handlePresentationSwipe, { passive: true });
  document.getElementById("prevChapter")?.addEventListener("click", () => moveChapter(-1));
  document.getElementById("nextChapter")?.addEventListener("click", () => moveChapter(1));
  document.getElementById("bookmarkBtn")?.addEventListener("click", toggleBookmark);
  document.getElementById("panelBookmarkToggle")?.addEventListener("click", toggleBookmark);
  document.getElementById("noteBtn")?.addEventListener("click", () => activateWorkspace("Notes"));
  document.getElementById("openStudy")?.addEventListener("click", () => {
    state.libraryOpen = true;
    state.activeRail = "Cross-Refs";
    localStorage.setItem("lw_library_open", "true");
    state.pendingPanelFocus = "Cross-Refs";
    renderPreservingReaderScroll();
  });
  document.getElementById("saveNote")?.addEventListener("click", saveNote);
  document.getElementById("copyVerse")?.addEventListener("click", copyVerse);
  document.getElementById("copySelection")?.addEventListener("click", copySelectedPassage);
  document.getElementById("shareSelection")?.addEventListener("click", shareSelectedPassage);
  document.getElementById("copySelectionLink")?.addEventListener("click", copySelectedPassageLink);
  document.getElementById("printSelection")?.addEventListener("click", printSelectedPassage);
  document.getElementById("clearSelection")?.addEventListener("click", clearSelection);
  document.querySelectorAll("[data-highlight-color]").forEach((button) => {
    button.addEventListener("click", () => applyHighlight(button.dataset.highlightColor));
  });
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

async function setPrimaryVersion(version, options = {}) {
  if (!translationCodes.includes(version)) return;
  state.versions = [version, ...state.versions.filter((item) => item !== version)];
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
  if (translationLookup[version]?.status === "bundled") {
    await loadBibleVersion(version);
    rebuildBibleData();
  }
  if (!options.keepPresentationSettings) state.presentationSettingsOpen = false;
  if (options.preserveScroll) renderPreservingReaderScroll();
  else render();
}

function setThemePreset(preset) {
  if (themePresetLookup[preset]?.mode !== state.theme) return;
  state.themePreset = preset;
  localStorage.setItem(`lw_theme_preset_${state.theme}`, preset);
  renderPreservingReaderScroll();
}

function resetThemeToSystem() {
  localStorage.removeItem("lw_theme");
  state.theme = savedTheme();
  state.themePreset = savedThemePreset(state.theme);
  showToast("Following system theme");
  renderPreservingReaderScroll();
}

function setPresentationTheme(theme) {
  if (!presentationThemeCodes.includes(theme)) return;
  state.presentationTheme = theme;
  localStorage.setItem("lw_presentation_theme", theme);
  state.presentationSettingsOpen = false;
  render();
}

function triviaQuestions() {
  return Array.isArray(window.bibleTriviaQuestions) ? window.bibleTriviaQuestions : [];
}

function triviaCategories(questions = triviaQuestions()) {
  return ["Mixed", ...Array.from(new Set(questions.map((question) => question.category).filter(Boolean))).sort((a, b) => a.localeCompare(b))];
}

function triviaDifficulties() {
  return ["All", "Easy", "Medium", "Hard"];
}

function triviaPool() {
  return triviaQuestions().filter((question) => {
    const categoryMatches = state.triviaCategory === "Mixed" || question.category === state.triviaCategory;
    const difficultyMatches = state.triviaDifficulty === "All" || question.difficulty === state.triviaDifficulty.toLowerCase();
    return categoryMatches && difficultyMatches;
  });
}

function startTriviaGame() {
  const pool = shuffleItems(triviaPool());
  if (!pool.length) {
    showToast("No trivia questions available for that category yet");
    return;
  }
  const questionCount = Math.min(state.triviaCount || 10, pool.length);
  state.triviaGame = {
    category: state.triviaCategory,
    difficulty: state.triviaDifficulty,
    questions: pool.slice(0, questionCount),
    index: 0,
    score: 0,
    selectedAnswer: null,
    complete: false,
  };
  renderPreservingReaderScroll();
}

function answerTriviaQuestion(answer) {
  const game = state.triviaGame;
  if (!game || game.complete || game.selectedAnswer !== null) return;
  const question = game.questions[game.index];
  game.selectedAnswer = answer;
  if (answer === question.answer) game.score += 1;
  renderPreservingReaderScroll();
}

function nextTriviaQuestion() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.index >= game.questions.length - 1) {
    game.complete = true;
  } else {
    game.index += 1;
    game.selectedAnswer = null;
  }
  renderPreservingReaderScroll();
}

function openTriviaReference() {
  const question = state.triviaGame?.questions?.[state.triviaGame.index];
  if (!question?.reference || !setReferenceFromString(question.reference)) return showToast("Reference is not available");
  state.mode = "reader";
  state.focusMode = false;
  state.libraryOpen = false;
  state.pendingVerseFocus = true;
  recordHistory();
  render();
}

function shuffleItems(items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function setScriptureFont(font) {
  if (!scriptureFontCodes.includes(font)) return;
  state.scriptureFont = font;
  localStorage.setItem("lw_scripture_font", font);
  renderPreservingReaderScroll();
}

function setCustomScriptureFont(font) {
  state.customScriptureFont = sanitizeFontName(font);
  localStorage.setItem("lw_custom_scripture_font", state.customScriptureFont);
  applyCustomScriptureFont();
  renderPreservingReaderScroll();
}

function sanitizeFontName(font) {
  return String(font || "")
    .split(",")
    .map((name) => name.trim().replace(/[^A-Za-z0-9 -]/g, ""))
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

function customScriptureFontStack() {
  const custom = state.customScriptureFont || "Georgia";
  return `${custom}, Georgia, serif`;
}

function applyCustomScriptureFont() {
  document.querySelector(".app-shell")?.style.setProperty("--custom-scripture-font", customScriptureFontStack());
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

async function toggleFullscreen() {
  if (isFullscreenActive()) {
    await exitFullscreen();
    return;
  }
  await enterFullscreen();
}

async function enterFullscreen() {
  const target = document.documentElement;
  const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
  try {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && requestFullscreen) {
      await requestFullscreen.call(target);
    } else if (!requestFullscreen) {
      showToast("Fullscreen is not available in this browser");
    }
  } catch (error) {
    console.warn("Fullscreen request failed", error);
    showToast("Fullscreen is not available in this browser");
  }
}

async function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  try {
    if (exit) {
      await exit.call(document);
    } else {
      showToast("Fullscreen is not available in this browser");
    }
  } catch (error) {
    console.warn("Fullscreen exit failed", error);
    showToast("Fullscreen is not available in this browser");
  }
}

function gotoReference(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (setReferenceFromString(cleaned)) {
    state.searchQuery = "";
    state.pendingVerseFocus = true;
    recordHistory();
    updateShareUrl();
    render();
  }
}

async function runReferenceOrPhraseSearch(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  if (parseReference(cleaned)) {
    gotoReference(cleaned);
    return;
  }
  await runPhraseSearch(cleaned);
}

async function runPhraseSearch(value) {
  const query = value.trim().replace(/\s+/g, " ");
  if (!query) return;
  state.searchQuery = query;
  await ensureAllSearchVersionsLoaded();
  state.searchResults = searchBible(query);
  state.mode = state.mode === "big" ? "reader" : state.mode;
  if (state.focusMode) {
    state.focusMode = false;
    localStorage.setItem("lw_focus_mode", "false");
  }
  state.libraryOpen = true;
  state.activeRail = "Search";
  state.pendingPanelFocus = "Search";
  localStorage.setItem("lw_library_open", "true");
  render();
}

async function ensureAllSearchVersionsLoaded() {
  const bundled = translationCodes.filter((version) => translationLookup[version]?.status === "bundled");
  await Promise.all(bundled.map(loadBibleVersion));
}

function searchBible(query) {
  const primaryVersion = state.versions[0] || "BSB";
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const phrase = normalizeSearchText(query);
  const primaryExact = searchVersion(primaryVersion, phrase, tokens, { exactOnly: true });
  if (primaryExact.length) return primaryExact.slice(0, 40);

  const versionOrder = [primaryVersion, ...translationCodes.filter((version) => version !== primaryVersion)];
  const results = versionOrder.flatMap((version) => searchVersion(version, phrase, tokens));
  const seen = new Set();
  return results
    .sort((a, b) => b.score - a.score)
    .filter((result) => {
      const key = `${result.ref}-${result.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

function searchVersion(version, phrase, tokens, options = {}) {
  const versionData = loadedVersionData.get(version);
  if (!versionData?.chapters) return [];
  const results = [];
  Object.entries(versionData.chapters).some(([chapterKey, chapter]) => {
    chapter.verses.some((verse) => {
      const text = verse.text || "";
      const normalizedText = normalizeSearchText(text);
      const hasPhrase = phrase.length > 2 && normalizedText.includes(phrase);
      if (options.exactOnly && !hasPhrase) return false;
      const verseWords = normalizedText.split(" ").filter(Boolean);
      const exactTokenCount = tokens.filter((token) => verseWords.includes(token) || normalizedText.includes(token)).length;
      const fuzzyTokenCount = tokens.filter((token) => verseWords.some((word) => wordsCloseEnough(token, word))).length;
      const hasTokens = exactTokenCount === tokens.length;
      const hasFuzzyTokens = tokens.length > 1 && fuzzyTokenCount === tokens.length;
      if (hasPhrase || hasTokens || hasFuzzyTokens) {
        results.push({
          ref: `${chapterKey}:${verse.n}`,
          version,
          text,
          score: (hasPhrase ? 100 : 0) + exactTokenCount * 10 + fuzzyTokenCount + (version === (state.versions[0] || "BSB") ? 4 : 0),
          matchType: hasPhrase ? "Phrase" : hasTokens ? "Words" : "Close match",
        });
      }
      return results.length >= 80;
    });
    return results.length >= 80;
  });
  return results;
}

function searchTokens(query) {
  return normalizeSearchText(query)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsCloseEnough(queryWord, verseWord) {
  if (queryWord === verseWord) return true;
  if (queryWord.length < 4 || verseWord.length < 4) return false;
  if (verseWord.includes(queryWord) || queryWord.includes(verseWord)) return true;
  const limit = queryWord.length > 7 ? 2 : 1;
  return levenshteinDistance(queryWord, verseWord, limit) <= limit;
}

function levenshteinDistance(a, b, limit = 2) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    previous = current;
  }
  return previous[b.length];
}

function applyStartupExperience() {
  if (state.startupApplied) return;
  state.startupApplied = true;
  const sharedRef = sharedReferenceFromUrl();
  if (sharedRef && setReferenceFromString(sharedRef)) {
    const selected = sharedVersesFromUrl();
    if (selected.length) state.selectedVerses = selected;
    return;
  }
  if (state.startVerseOfDay) {
    const verseOfDay = verseOfDayReference();
    if (verseOfDay) setReferenceFromString(verseOfDay);
  }
  if (state.startBigScreen) {
    state.mode = "big";
    state.presentationControlsVisible = !isCompactScreen();
  }
}

function openVerseOfDay() {
  const ref = verseOfDayReference();
  if (!ref) return showToast("Verse of the day is not available yet");
  if (!setReferenceFromString(ref)) return;
  state.mode = "reader";
  state.searchQuery = "";
  state.pendingVerseFocus = true;
  recordHistory();
  updateShareUrl();
  render();
}

function sharedReferenceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("ref") || params.get("reference") || "";
}

function sharedVersesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const verseParam = params.get("verses");
  if (!verseParam) return [];
  const available = new Set(currentChapter().verses.map((verse) => verse.n));
  return verseParam
    .split(",")
    .flatMap((part) => {
      const [start, end] = part.split("-").map(Number);
      if (!start) return [];
      if (!end) return [start];
      const [from, to] = [start, end].sort((a, b) => a - b);
      return Array.from({ length: to - from + 1 }, (_, index) => from + index);
    })
    .filter((verse, index, list) => available.has(verse) && list.indexOf(verse) === index)
    .sort((a, b) => a - b);
}

function verseOfDayReference(date = new Date()) {
  const config = window.BIGSCREEN_VERSE_OF_DAY || {};
  const key = monthDayKey(date);
  if (config.seasonal?.[key] && referenceExists(config.seasonal[key])) return config.seasonal[key];

  const pool = buildVerseOfDayPool();
  if (!pool.length) return "John 3:16";

  const seasonalRefs = new Set(Object.values(config.seasonal || {}));
  const usablePool = pool.filter((ref) => !seasonalRefs.has(ref));
  const dayNumber = dayOfYear(date);
  const seasonalBeforeToday = Object.keys(config.seasonal || {})
    .map((seasonalKey) => dayOfYearFromMonthDay(seasonalKey, date.getFullYear()))
    .filter((seasonalDay) => seasonalDay && seasonalDay < dayNumber).length;
  const index = Math.max(0, dayNumber - seasonalBeforeToday - 1);
  return usablePool[index % usablePool.length] || pool[index % pool.length] || "John 3:16";
}

function buildVerseOfDayPool() {
  if (verseOfDayPool) return verseOfDayPool;
  const config = window.BIGSCREEN_VERSE_OF_DAY || {};
  const refs = [];
  const seen = new Set();
  const addRef = (ref) => {
    if (seen.has(ref) || !referenceExists(ref)) return;
    seen.add(ref);
    refs.push(ref);
  };

  (config.anchors || []).forEach(addRef);

  const keywords = config.keywords?.length ? config.keywords : ["hope", "peace", "love", "strength", "wisdom"];
  const keywordPattern = new RegExp(`\\b(${keywords.map(escapeRegExp).join("|")})\\b`, "i");
  const preferredBooks = new Set([
    "Psalm", "Proverbs", "Isaiah", "Jeremiah", "Lamentations", "Matthew", "Mark", "Luke", "John",
    "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
    "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
    "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude"
  ]);
  Object.entries(bibleData).forEach(([chapterKey, chapter]) => {
    if (!preferredBooks.has(bookNameFromChapterKey(chapterKey))) return;
    chapter.verses.forEach((verse) => {
      const ref = `${chapterKey}:${verse.n}`;
      if (seen.has(ref)) return;
      const text = getVerseText(verse, "BSB") || getVerseText(verse, state.versions[0] || "BSB");
      const normalized = text.replace(/\s+/g, " ").trim();
      if (normalized.length < 34 || normalized.length > 240) return;
      if (!keywordPattern.test(normalized)) return;
      seen.add(ref);
      refs.push(ref);
    });
  });

  verseOfDayPool = refs;
  return refs;
}

function referenceExists(ref) {
  const parsed = parsePassageReference(ref);
  if (!parsed) return false;
  const available = new Set((bibleData[parsed.key]?.verses || []).map((verse) => verse.n));
  return parsed.verses.every((verse) => available.has(verse));
}

function parseReference(value) {
  const parsed = parsePassageReference(value);
  return parsed ? { key: parsed.key, verse: parsed.verse } : null;
}

function parsePassageReference(value) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^((?:[1-3]\s*)?[A-Za-z. ]+?)\s+(\d+)(?::([0-9,\-\s]+))?$/);
  if (!match) return null;
  const book = normalizeBookName(match[1]);
  if (!book) return null;
  const key = `${book} ${match[2]}`;
  const available = bibleData[key]?.verses.map((verse) => verse.n) || [];
  if (!available.length) return { key, verse: Number(match[3] || 1), verses: [Number(match[3] || 1)] };
  const verses = match[3] ? parseVerseList(match[3], available) : [available[0]];
  if (!verses.length) return null;
  return { key, verse: verses[0], verses };
}

function parseVerseList(value, availableVerses) {
  const available = new Set(availableVerses);
  const verses = [];
  String(value).split(",").forEach((part) => {
    const token = part.trim();
    if (!token) return;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const [start, end] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
      for (let verse = start; verse <= end; verse += 1) {
        if (available.has(verse)) verses.push(verse);
      }
      return;
    }
    const verse = Number(token);
    if (available.has(verse)) verses.push(verse);
  });
  return [...new Set(verses)].sort((a, b) => a - b);
}

function monthDayKey(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayOfYear(date) {
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
}

function dayOfYearFromMonthDay(key, year) {
  const [month, day] = key.split("-").map(Number);
  if (!month || !day) return 0;
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return 0;
  return dayOfYear(date);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bookNameFromChapterKey(key) {
  return String(key).replace(/\s+\d+$/, "");
}

function setReferenceFromString(value) {
  const parsed = parsePassageReference(value);
  if (!parsed) {
    showToast("Try a reference like John 3:16");
    return false;
  }
  if (!bibleData[parsed.key]) {
    showToast(`${parsed.key} is not available in the bundled Bible data`);
    return false;
  }
  state.reference = parsed.key;
  state.verse = parsed.verse;
  state.selectedVerses = parsed.verses.length > 1 ? parsed.verses : [];
  if (!bibleData[parsed.key].verses.some((verse) => verse.n === state.verse)) state.verse = bibleData[parsed.key].verses[0].n;
  return true;
}

function recordHistory(ref = referenceLabel()) {
  if (!referenceExists(ref)) return;
  const history = state.history
    .map((item) => typeof item === "string" ? { ref: item, at: "" } : item)
    .filter((item) => item.ref !== ref);
  history.unshift({ ref, at: new Date().toISOString() });
  state.history = history.slice(0, 80);
  localStorage.setItem("lw_history", JSON.stringify(state.history));
}

function activateWorkspace(target) {
  state.activeRail = target;
  state.libraryOpen = true;
  localStorage.setItem("lw_library_open", "true");
  state.pendingPanelFocus = target;
  renderPreservingReaderScroll();
}

function closeLibrary() {
  state.libraryOpen = false;
  localStorage.setItem("lw_library_open", "false");
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

function isPresentationSwipeIgnored(target) {
  return Boolean(target?.closest?.("button, input, select, textarea, a, .presentation-settings-popover"));
}

function handlePresentationSwipe(event) {
  if (state.mode !== "big" || !presentationTouchStart || state.presentationSearchOpen || state.presentationSettingsOpen) return;
  if (isPresentationSwipeIgnored(event.target)) {
    presentationTouchStart = null;
    return;
  }
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const deltaX = touch.clientX - presentationTouchStart.x;
  const deltaY = touch.clientY - presentationTouchStart.y;
  const elapsed = Date.now() - presentationTouchStart.time;
  presentationTouchStart = null;
  if (elapsed > 850 || Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
  moveVerse(deltaX < 0 ? 1 : -1);
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
    if (document.getElementById("studyPopup")) {
      event.preventDefault();
      return closeStudyPopup();
    }
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
  }

  if (typing || state.shortcutsOpen) return;

  if (event.key === "ArrowLeft" && state.mode !== "trivia") {
    event.preventDefault();
    return moveVerse(-1);
  }
  if (event.key === "ArrowRight" && state.mode !== "trivia") {
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
  if (key === "t") {
    event.preventDefault();
    state.mode = "trivia";
    return render();
  }
  if (event.key === "/") {
    event.preventDefault();
    return shortcutWorkspace("Search");
  }

  const railShortcuts = {
    l: "Verse",
    v: "Verse",
    s: "Search",
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
  if (state.focusMode) {
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
  } else if (state.focusMode || !state.libraryOpen) {
    verse = scaled(26, 1.86, 58);
  } else {
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
    Search: "#studySearchInput",
    Notes: "#notesSection",
    Bookmarks: "#bookmarksSection",
    History: "#historySection",
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
  recordHistory();
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
  recordHistory();
  render();
}

function moveChapter(direction) {
  const keys = Object.keys(bibleData);
  const index = keys.indexOf(state.reference);
  state.reference = keys[Math.max(0, Math.min(keys.length - 1, index + direction))];
  state.verse = currentChapter().verses[0].n;
  state.selectedVerses = [];
  recordHistory();
  render();
}

function toggleBookmark() {
  const ref = activePassageLabel();
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
  const note = document.getElementById("noteBox").value.trim();
  const ref = activePassageLabel();
  if (note) state.notes[ref] = note;
  else delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  showToast(note ? "Note saved" : "Note deleted");
  render();
}

function editBookmark(ref) {
  const nextRef = window.prompt("Edit bookmark reference", ref);
  if (nextRef === null) return;
  const cleaned = nextRef.trim().replace(/\s+/g, " ");
  if (!referenceExists(cleaned)) return showToast("Try a bundled reference like John 3:16");
  state.bookmarks = state.bookmarks.map((item) => item === ref ? cleaned : item);
  state.bookmarks = [...new Set(state.bookmarks)];
  localStorage.setItem("lw_bookmarks", JSON.stringify(state.bookmarks));
  showToast("Bookmark updated");
  render();
}

function deleteBookmark(ref) {
  state.bookmarks = state.bookmarks.filter((item) => item !== ref);
  localStorage.setItem("lw_bookmarks", JSON.stringify(state.bookmarks));
  showToast("Bookmark deleted");
  render();
}

function editNote(ref) {
  const nextNote = window.prompt(`Edit note for ${ref}`, state.notes[ref] || "");
  if (nextNote === null) return;
  const note = nextNote.trim();
  if (note) state.notes[ref] = note;
  else delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  showToast(note ? "Note updated" : "Note deleted");
  render();
}

function deleteNote(ref) {
  delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  showToast("Note deleted");
  render();
}

function openHighlightNote(ref) {
  if (!setReferenceFromString(ref)) return;
  state.activeRail = "Notes";
  state.libraryOpen = true;
  state.pendingPanelFocus = "Notes";
  state.pendingVerseFocus = true;
  localStorage.setItem("lw_library_open", "true");
  recordHistory();
  updateShareUrl();
  render();
}

function removeHighlight(ref) {
  const parsed = parsePassageReference(ref);
  if (parsed) parsed.verses.forEach((verse) => delete state.highlights[`${parsed.key}:${verse}`]);
  else delete state.highlights[ref];
  localStorage.setItem("lw_highlights", JSON.stringify(state.highlights));
  showToast("Highlight removed");
  renderPreservingReaderScroll();
}

function deleteHistoryItem(ref) {
  state.history = state.history.filter((item) => (typeof item === "string" ? item : item.ref) !== ref);
  localStorage.setItem("lw_history", JSON.stringify(state.history));
  showToast("History item deleted");
  render();
}

function clearHistory() {
  state.history = [];
  localStorage.setItem("lw_history", JSON.stringify(state.history));
  showToast("History cleared");
  render();
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

async function shareSelectedPassage() {
  const verseNumbers = selectedVerseNumbers();
  const text = passageText(verseNumbers);
  const url = passageShareUrl(verseNumbers);
  if (navigator.share) {
    try {
      await navigator.share({
        title: printReferenceLabel(verseNumbers),
        text,
        url,
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(`${text}\n\n${url}`);
  showToast("Share text copied");
}

async function copySelectedPassageLink() {
  await copyText(passageShareUrl(selectedVerseNumbers()));
  showToast("Passage link copied");
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      copyTextFallback(text);
    }
  } catch (_error) {
    copyTextFallback(text);
  }
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

function applyHighlight(color) {
  const verses = selectedVerseNumbers();
  if (!verses.length) return;
  verses.forEach((verseNumber) => {
    const ref = `${state.reference}:${verseNumber}`;
    if (highlightColors.includes(color)) state.highlights[ref] = color;
    else delete state.highlights[ref];
  });
  localStorage.setItem("lw_highlights", JSON.stringify(state.highlights));
  showToast(highlightColors.includes(color) ? "Highlight added" : "Highlight removed");
  renderPreservingReaderScroll();
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
  const reference = formatReferenceLabel(state.reference, verseNumbers);
  return `${reference} ${state.versions[0]}\n${lines.map(({ n, text }) => `${n}. ${text}`).join("\n")}`;
}

function passageShareUrl(verseNumbers = selectedVerseNumbers()) {
  const url = new URL(window.location.href);
  url.searchParams.set("ref", `${state.reference}:${verseNumbers[0]}`);
  if (verseNumbers.length > 1) url.searchParams.set("verses", verseRangeParam(verseNumbers));
  else url.searchParams.delete("verses");
  return url.toString();
}

function updateShareUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("ref", referenceLabel());
  url.searchParams.delete("verses");
  window.history.replaceState(null, "", url);
}

function verseRangeParam(verseNumbers = selectedVerseNumbers()) {
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  const groups = sorted.reduce((ranges, verse) => {
    const last = ranges[ranges.length - 1];
    if (last && verse === last.end + 1) last.end = verse;
    else ranges.push({ start: verse, end: verse });
    return ranges;
  }, []);
  return groups.map(({ start, end }) => start === end ? `${start}` : `${start}-${end}`).join(",");
}

function printReferenceLabel(verseNumbers = selectedVerseNumbers()) {
  return formatReferenceLabel(state.reference, verseNumbers);
}

function formatReferenceLabel(chapterKey, verseNumbers = selectedVerseNumbers()) {
  const sorted = [...verseNumbers].sort((a, b) => a - b);
  if (sorted.length === 1) return `${chapterKey}:${sorted[0]}`;
  const groups = sorted.reduce((ranges, verse) => {
    const last = ranges[ranges.length - 1];
    if (last && verse === last.end + 1) {
      last.end = verse;
    } else {
      ranges.push({ start: verse, end: verse });
    }
    return ranges;
  }, []);
  const suffix = groups.map(({ start, end }) => start === end ? `${start}` : `${start}-${end}`).join(", ");
  return `${chapterKey}:${suffix}`;
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
  presentation.style.removeProperty("--presentation-line-height");
  const baseFontSize = Number.parseFloat(getComputedStyle(copy).fontSize) || 64;
  const copyLength = copy.textContent.trim().replace(/\s+/g, " ").length;
  const compactLineHeight = copyLength > 220 ? 1.06 : copyLength > 150 ? 1.09 : 1.12;
  const readableMinimum = viewport.clientWidth < 720 ? 0.46 : 0.52;
  const lengthScale = Math.max(0.62, 1 - Math.max(0, copyLength - 150) / 420);
  const maxScale = Math.min(
    1,
    lengthScale,
    copyLength > 340 ? 0.64 : 1,
    copyLength > 260 ? 0.74 : 1,
    copyLength > 200 ? 0.84 : 1,
  );

  presentation.style.setProperty("--presentation-line-height", compactLineHeight);
  if (maxScale < 1) {
    presentation.style.setProperty("--presentation-font-size", `${baseFontSize * maxScale}px`);
  }

  const fits = () => copy.scrollHeight <= viewport.clientHeight * 0.92 && copy.scrollWidth <= viewport.clientWidth * 0.98;
  if (fits()) return;

  let low = readableMinimum;
  let high = maxScale;
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
    applyStartupExperience();
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
document.addEventListener("fullscreenchange", render);
document.addEventListener("webkitfullscreenchange", render);
state.streakPopupVisible = recordReadingStreak();
watchSystemTheme();
initializeBibleData();
