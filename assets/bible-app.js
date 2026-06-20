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

const bibleProviders = {
  local: {
    type: "bundled",
  },
  esv: {
    type: "remote",
    edgeFunction: "esv-passage",
  },
  apiBible: {
    type: "remote",
    edgeFunction: "api-bible-passage",
    tracksFums: true,
  },
};

const translations = [
  { code: "ASV", name: "American Standard Version", provider: "local" },
  { code: "BBE", name: "Bible in Basic English", provider: "local" },
  { code: "BSB", name: "Berean Standard Bible", provider: "local" },
  { code: "ESV", name: "English Standard Version", provider: "esv" },
  { code: "KJV", name: "King James Version", provider: "local" },
  { code: "NASB2020", displayCode: "NASB", name: "New American Standard Bible 2020", provider: "apiBible" },
  { code: "NIV", name: "New International Version", provider: "apiBible" },
  { code: "NLT", name: "New Living Translation", provider: "apiBible" },
  { code: "WEB", name: "World English Bible", provider: "local" },
];

const translationCodes = translations.map((translation) => translation.code).sort((a, b) => a.localeCompare(b));
const translationLookup = Object.fromEntries(translations.map((translation) => [translation.code, translation]));
const translationDisplayCode = (version) => translationLookup[version]?.displayCode || version;
const translationProvider = (version) => bibleProviders[translationLookup[version]?.provider] || bibleProviders.local;
const isRemoteTranslation = (version) => translationProvider(version).type === "remote";
const isBundledTranslation = (version) => translationProvider(version).type === "bundled";

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
const defaultThemePresets = { light: "sapphire", dark: "aurora" };
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
const defaultPresentationTheme = "aurora";
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
let bibleParagraphs = null;
let dataLoading = true;
let dataError = "";
let strongLexicon = {};
let strongLexiconStatus = "idle";
let strongLexiconPromise = null;
let presentationControlsTimer = 0;
let presentationTouchStart = null;
let streakPopupTimer = 0;
let mobileSettingsIdleTimer = 0;
let bookSprintTimer = 0;
let bookSprintAudioContext = null;
let referenceRushTimer = 0;
let referenceRushAudioContext = null;
let orderingDragState = null;
let orderingSuppressClickUntil = 0;
let activeMobileVerseNavMenu = null;
let cloudSyncTimer = 0;
let activeTriviaCelebration = null;
let triviaCelebrationToken = 0;
const streakStorageKey = "lw_reading_streak";
const bookSprintBestStorageKey = "lw_book_sprint_bests";
const triviaRoundLengths = [5, 10, 15, 20];
const bookSprintRoundLengths = [5, 10];
const tutorialStorageKey = "lw_tutorial_seen";
const cloudSyncTable = "bsb_user_sync";
const confettiModuleUrl = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.module.mjs";

const loadedVersionData = new Map();
const loadingVersions = new Set();
const remoteVersionData = new Map();
const remoteVersionErrors = new Map();
const trackedFumsTokens = new Set();
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
  paragraphLayout: savedParagraphLayout(),
  focusMode: savedFocusMode(),
  verseNavCollapsed: localStorage.getItem("lw_verse_nav_collapsed") === "true",
  footerCollapsed: localStorage.getItem("lw_footer_collapsed") === "true",
  libraryOpen: localStorage.getItem("lw_library_open") !== "false",
  activeRail: "Verse",
  selectedStrong: "G2316",
  selectedStrongWord: "God",
  mobileControlsOpen: false,
  presentationSearchOpen: false,
  presentationSettingsOpen: false,
  presentationControlsVisible: !isCompactScreen(),
  presentationTheme: localStorage.getItem("lw_presentation_theme") || defaultPresentationTheme,
  startBigScreen: localStorage.getItem("lw_start_big_screen") !== "false",
  startVerseOfDay: localStorage.getItem("lw_start_verse_of_day") !== "false",
  isVerseOfDayActive: false,
  showStreakPopup: localStorage.getItem("lw_show_streak_popup") !== "false",
  startupApplied: false,
  settingsOpen: false,
  settingsAnchor: "header",
  headerVersionMenuOpen: false,
  shortcutsOpen: false,
  tutorialIntroVisible: localStorage.getItem(tutorialStorageKey) !== "true",
  tutorialActive: false,
  tutorialStep: 0,
  tutorialMode: "app",
  searchQuery: "",
  searchResults: [],
  pendingPanelFocus: null,
  pendingVerseFocus: false,
  openAnnotationShelves: [],
  openAnnotationGroups: [],
  touchedAnnotationGroupCollections: [],
  selectedVerses: [],
  highlights: JSON.parse(localStorage.getItem("lw_highlights") || "{}"),
  customHighlightColor: normalizeHighlightColor(localStorage.getItem("lw_custom_highlight_color")) || "#c084fc",
  bookmarks: JSON.parse(localStorage.getItem("lw_bookmarks") || '["John 3:16","Psalm 23:1"]'),
  notes: JSON.parse(localStorage.getItem("lw_notes") || '{"John 3:16":"This verse is the heart of the Gospel. Mark for Sabbath worship display."}'),
  history: JSON.parse(localStorage.getItem("lw_history") || "[]"),
  streak: savedReadingStreak(),
  streakPopupVisible: false,
  triviaGameType: localStorage.getItem("lw_trivia_game_type") || "trivia",
  triviaCategory: localStorage.getItem("lw_trivia_category") || "Mixed",
  triviaDifficulty: localStorage.getItem("lw_trivia_difficulty") || "All",
  triviaCount: Number(localStorage.getItem("lw_trivia_count") || 10),
  bookSprintSound: localStorage.getItem("lw_book_sprint_sound") !== "false",
  referenceRushTimed: localStorage.getItem("lw_reference_rush_timed") !== "false",
  triviaGame: null,
  authConfigured: isSupabaseConfigured(),
  authClient: null,
  authUser: null,
  authStatus: "idle",
  authMessage: "",
  authBusy: false,
  accountOpen: false,
  passwordChangeOpen: false,
  passwordRecoveryMode: false,
  syncStatus: "local",
  syncMessage: "",
  lastCloudSyncAt: "",
};

if (state.triviaGameType === "reference-rush") state.triviaDifficulty = "Easy";
state.triviaCount = normalizedTriviaCount(state.triviaGameType, state.triviaCount);

const highlightColors = ["yellow", "blue", "pink", "green", "orange", "purple"];

state.versions = state.versions.filter((version) => translationCodes.includes(version));
if (state.versions.length === 0) state.versions = ["BSB", "KJV"];
if (!state.versions.some(isBundledTranslation)) state.versions.unshift("BSB");
state.themePreset = savedThemePreset(state.theme);
if (!presentationThemeCodes.includes(state.presentationTheme)) state.presentationTheme = defaultPresentationTheme;
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

function savedParagraphLayout() {
  const saved = localStorage.getItem("lw_paragraph_layout");
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
  scheduleCloudSync();
  return true;
}

const icons = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
  screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 16v5"/></svg>',
  trivia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0z"/><path d="M6 4H4v2a4 4 0 0 0 4 4"/><path d="M18 4h2v2a4 4 0 0 1-4 4"/><path d="M12 11v4"/><path d="M9 21h6"/><path d="M10 15h4v6h-4z"/></svg>',
  timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4"/><path d="M12 14l3-3"/><path d="M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/><path d="m17.5 6.5 1.5-1.5"/></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4v6c0 4-2 7-5 8"/><path d="M21 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4v6c0 4-2 7-5 8"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c3.6 0 6.5-2.7 6.5-6.2 0-2.6-1.4-4.7-3.5-6.7-.6 2-1.9 3.2-3.1 3.7.6-2.7-.4-5.2-3-8.1C8.5 8 5.5 10.8 5.5 15.8 5.5 19.3 8.4 22 12 22z"/><path d="M12 18.5c1.2 0 2.2-.9 2.2-2.1 0-1-.6-1.8-1.4-2.5-.2.7-.7 1.1-1.1 1.3.2-.9-.1-1.8-1-2.8-.1 1.2-.9 2.2-.9 4 0 1.2 1 2.1 2.2 2.1z"/></svg>',
  fullscreenEnter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 5H5v3.5"/><path d="M5 5l5.5 5.5"/><path d="M15.5 5H19v3.5"/><path d="M19 5l-5.5 5.5"/><path d="M8.5 19H5v-3.5"/><path d="M5 19l5.5-5.5"/><path d="M15.5 19H19v-3.5"/><path d="M19 19l-5.5-5.5"/></svg>',
  fullscreenExit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5v5H5"/><path d="M5 5l5 5"/><path d="M14 5v5h5"/><path d="M19 5l-5 5"/><path d="M10 19v-5H5"/><path d="M5 19l5-5"/><path d="M14 19v-5h5"/><path d="M19 19l-5-5"/></svg>',
  parallel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h7v14H4zM13 5h7v14h-7z"/><path d="M7 9h1M16 9h1M7 13h1M16 13h1"/></svg>',
  focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4"/><path d="M9 12h6"/></svg>',
  panels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M8 4v16M16 4v16"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5-8 4.5-8-4.5z"/><path d="m4 12 8 4.5 8-4.5"/><path d="m4 16.5 8 4.5 8-4.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.2-1.2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="11" height="13" rx="1.5"/><path d="M5 16H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 3h9.5A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/><path d="M17 12h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 10v7"/><path d="M12 7h.01"/></svg>',
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="14.5" r="4.5"/><path d="M11 11l8-8"/><path d="M16 6l2 2"/><path d="M14 8l2 2"/></svg>',
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.2z"/><path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.8A6 6 0 0 1 6 12c0-.6.1-1.2.4-1.8V7.6H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.4l3.3-2.6z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2 10 10 0 0 0 3.1 7.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  chevronDouble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 18 6-6-6-6"/><path d="m13 18 6-6-6-6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.64.8 1.03 1.51 1.03H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6-6 6 6"/><path d="M12 4v16"/></svg>',
};

const tutorialSteps = [
  {
    target: ".brand, .presentation-brand",
    title: "Start with the logo",
    body: "Tap the Big Screen Bible logo any time you want to return to the verse of the day.",
  },
  {
    target: "#referenceInput, #presentationSearchToggle",
    title: "Search by reference or phrase",
    body: "Type a passage like Ecc 9:5, or search a phrase when you remember the words but not the reference.",
  },
  {
    target: ".mode-tabs, .presentation-bible-toggle",
    title: "Switch reading spaces",
    body: "Move between Reader, Parallel Study, Big Screen display, and Games from this mode area.",
  },
  {
    target: ".chapter-tools",
    title: "Move around the Bible",
    body: "Use the chapter and verse controls for precise navigation, or use the arrow buttons to step verse by verse.",
  },
  {
    target: ".side-rail, #openStudy",
    title: "Study tools live on the side",
    body: "Bookmarks, notes, highlights, cross references, history, and search open from the side tools.",
  },
  {
    target: ".selection-bar, .verse-card.selected, .verse-row.selected",
    title: "Select verses to act on them",
    body: "Tap a verse to copy, share, print, link, or highlight a passage without losing your place.",
  },
  {
    target: "#settingsToggle, #mobileFloatingSettings, #presentationSettingsToggle",
    title: "Tune the experience",
    body: "Settings handle themes, fonts, text size, startup behavior, fullscreen, and your private reading streak.",
  },
];

const presentationTutorialSteps = [
  {
    target: ".presentation-ref",
    title: "Big Screen starts with the verse",
    body: "This mode keeps the reference, version, and Scripture clean for worship, teaching, or family reading.",
  },
  {
    target: "#presentationSearchToggle",
    title: "Jump to another passage",
    body: "Open search to type a reference quickly without leaving the display.",
  },
  {
    target: ".presentation-controls",
    title: "Move verse by verse",
    body: "Use Previous and Next, arrow keys, or swipe on touch devices to move through the chapter.",
  },
  {
    target: "#presentationSettingsToggle",
    title: "Change the display",
    body: "Theme, Bible version, font, and fullscreen controls live inside Big Screen settings.",
  },
  {
    target: ".presentation-bible-toggle",
    title: "Return to the Bible workspace",
    body: "Use this button when you want the full reader, study tools, notes, highlights, and games.",
  },
];

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
  return isCompactScreen() || isShortLandscapeScreen() ? 2 : 3;
}

function isCompactScreen() {
  return window.matchMedia?.("(max-width: 840px)")?.matches || false;
}

function isShortLandscapeScreen() {
  return window.matchMedia?.("(orientation: landscape) and (max-width: 1024px) and (max-height: 560px)")?.matches || false;
}

function animateBeforeRemoval(selector, callback, { className = "motion-exit", duration = 240 } = {}) {
  const visibleElements = Array.from(document.querySelectorAll(selector))
    .filter((element) => element.getClientRects().length);
  if (visibleElements.some((element) => element.classList.contains(className))) return;
  const elements = visibleElements.filter((element) => !element.classList.contains(className));
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!elements.length || reducedMotion) {
    callback();
    return;
  }
  elements.forEach((element) => element.classList.add(className));
  window.setTimeout(callback, duration);
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
  closeMobileVerseNavMenu();
  const app = document.querySelector("#app");
  const focusEnterClass = pendingFocusChromeEnter ? "focus-chrome-enter" : "";
  if (state.startupApplied) syncModeUrl();
  syncPresentationShell();
  if (dataLoading || dataError) {
    clearInterval(bookSprintTimer);
    bookSprintTimer = 0;
    clearInterval(referenceRushTimer);
    referenceRushTimer = 0;
    app.innerHTML = loadingScreen();
    return;
  }
  enforceVersionLimit();
  if (state.mode !== "big") state.presentationControlsVisible = true;
  app.innerHTML = `
    <main class="app-shell ${state.focusMode && state.mode !== "trivia" ? "focus-shell" : ""} ${state.footerCollapsed ? "footer-collapsed" : ""} ${state.mobileControlsOpen ? "mobile-controls-open" : ""} ${focusEnterClass}" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}" style="--text-scale: ${state.textScale}">
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
      ${tutorialIntro()}
      ${tutorialOverlay()}
      ${printSheet()}
      ${streakPopup()}
      <div class="status-toast" id="toast"></div>
    </main>
  `;
  pendingFocusChromeEnter = false;
  pendingLibraryEnter = false;
  bindEvents();
  requestAnimationFrame(() => {
    positionAccountPopover();
    positionSettingsPopover();
  });
  applyCustomScriptureFont();
  if (state.pendingVerseFocus) {
    state.pendingVerseFocus = false;
    requestAnimationFrame(() => requestAnimationFrame(scrollSelectedVerseIntoView));
  }
  if (state.pendingPanelFocus) {
    const target = state.pendingPanelFocus;
    state.pendingPanelFocus = null;
    requestAnimationFrame(() => focusWorkspaceTarget(target));
  }
  requestAnimationFrame(fitPresentationText);
  requestAnimationFrame(applyTextScaleVars);
  requestAnimationFrame(bindMobileSettingsVisibility);
  requestAnimationFrame(updateTutorialSpotlight);
  requestAnimationFrame(runPendingTriviaCelebration);
  scheduleStreakPopupDismiss();
  scheduleBookSprintTimer();
  scheduleReferenceRushTimer();
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
  restoreReaderScroll(scrollState);
  requestAnimationFrame(() => {
    restoreReaderScroll(scrollState);
    requestAnimationFrame(() => restoreReaderScroll(scrollState));
  });
}

function renderTriviaAnswerAndScroll() {
  renderPreservingReaderScroll();
  requestAnimationFrame(() => requestAnimationFrame(scrollTriviaAnswerActionsIntoView));
}

function scrollTriviaAnswerActionsIntoView() {
  const triviaReader = document.querySelector(".trivia-reader");
  const actions = document.querySelector(".trivia-game .trivia-actions");
  const answerStart = document.querySelector(".trivia-game .trivia-reference")
    || document.querySelector(".trivia-game .trivia-feedback");
  if (!triviaReader || !actions || !answerStart) return;

  const readerBounds = triviaReader.getBoundingClientRect();
  const answerBounds = answerStart.getBoundingClientRect();
  const actionsBounds = actions.getBoundingClientRect();
  const viewportPadding = 24;
  const visibleTop = readerBounds.top + viewportPadding;
  const visibleBottom = readerBounds.bottom - viewportPadding;
  if (actionsBounds.bottom <= visibleBottom) return;

  const answerRegionHeight = actionsBounds.bottom - answerBounds.top;
  const availableHeight = visibleBottom - visibleTop;
  const offset = answerRegionHeight <= availableHeight
    ? actionsBounds.bottom - visibleBottom
    : answerBounds.top - visibleTop;
  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  triviaReader.scrollTo({
    top: Math.max(0, triviaReader.scrollTop + offset),
    behavior,
  });
}

function captureReaderScroll() {
  const scripture = document.querySelector(".scripture");
  const triviaReader = document.querySelector(".trivia-reader");
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    scriptureTop: scripture?.scrollTop ?? null,
    scriptureLeft: scripture?.scrollLeft ?? null,
    triviaTop: triviaReader?.scrollTop ?? null,
    triviaLeft: triviaReader?.scrollLeft ?? null,
  };
}

function captureLibraryScroll() {
  const libraryPanel = document.querySelector(".library");
  return libraryPanel ? { top: libraryPanel.scrollTop, left: libraryPanel.scrollLeft } : null;
}

function restoreLibraryScroll(scrollState) {
  if (!scrollState) return;
  const libraryPanel = document.querySelector(".library");
  if (!libraryPanel) return;
  libraryPanel.scrollTop = scrollState.top || 0;
  libraryPanel.scrollLeft = scrollState.left || 0;
}

function restoreReaderScroll(scrollState) {
  if (!scrollState) return;
  const scripture = document.querySelector(".scripture");
  const triviaReader = document.querySelector(".trivia-reader");
  if (scripture && scrollState.scriptureTop !== null) {
    scripture.scrollTop = scrollState.scriptureTop;
    scripture.scrollLeft = scrollState.scriptureLeft || 0;
  }
  if (triviaReader && scrollState.triviaTop !== null) {
    triviaReader.scrollTop = scrollState.triviaTop;
    triviaReader.scrollLeft = scrollState.triviaLeft || 0;
  }
  window.scrollTo(scrollState.windowX, scrollState.windowY);
}

function syncOpenStateList(stateKey, value, isOpen) {
  if (!value) return;
  const current = Array.isArray(state[stateKey]) ? state[stateKey] : [];
  if (isOpen) {
    if (!current.includes(value)) state[stateKey] = [...current, value];
    return;
  }
  state[stateKey] = current.filter((item) => item !== value);
}

function markAnnotationGroupCollectionTouched(value) {
  const collectionKey = String(value || "").split(":")[0];
  if (!collectionKey) return;
  if (!state.touchedAnnotationGroupCollections.includes(collectionKey)) {
    state.touchedAnnotationGroupCollections = [...state.touchedAnnotationGroupCollections, collectionKey];
  }
}

function captureAnnotationOpenState() {
  state.openAnnotationShelves = Array.from(document.querySelectorAll("[data-annotation-shelf][open]"))
    .map((details) => details.dataset.annotationShelf)
    .filter(Boolean);
  const annotationGroups = Array.from(document.querySelectorAll("[data-annotation-group]"));
  state.openAnnotationGroups = annotationGroups
    .filter((details) => details.open)
    .map((details) => details.dataset.annotationGroup)
    .filter(Boolean);
  annotationGroups.forEach((details) => markAnnotationGroupCollectionTouched(details.dataset.annotationGroup));
}

function loadingScreen() {
  const message = dataError || "Loading full Bible texts...";
  return `
    <main class="app-shell focus-shell loading-shell" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}">
      <section class="reader loading-reader">
        <div class="loading-card">
          <img class="loading-logo-mark" src="./assets/brand-mark.png" width="420" height="220" alt="" />
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
    .map((version) => `<option value="${version}" ${version === primaryVersion ? "selected" : ""}>${translationDisplayCode(version)} · ${translationLookup[version]?.name || version}</option>`)
    .join("");
  const followsSystemTheme = !localStorage.getItem("lw_theme");
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Fullscreen";
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
      <div class="setting-group">
        <span class="setting-label">Appearance</span>
        <div class="theme-mode-segment" role="group" aria-label="Appearance mode">
          <button class="theme-mode-button ${!followsSystemTheme && state.theme === "light" ? "active" : ""}" type="button" data-theme-choice="light" aria-label="Use light mode">${icons.sun}<span>Light</span></button>
          <button class="theme-mode-button ${!followsSystemTheme && state.theme === "dark" ? "active" : ""}" type="button" data-theme-choice="dark" aria-label="Use dark mode">${icons.moon}<span>Dark</span></button>
          <button class="theme-mode-button ${followsSystemTheme ? "active" : ""}" type="button" data-theme-choice="system" aria-label="Follow system theme"><span>System</span></button>
        </div>
      </div>
      <div class="setting-group">
        <span class="setting-label">Display</span>
        <div class="settings-control-row">
          <div class="text-size-control" aria-label="Text size controls">
            <button class="icon-btn" id="mobileDecreaseText" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
            <button class="text-size-reset" id="mobileResetText" aria-label="Reset text size to 100%" data-tooltip="Reset text size"><span>Aa</span><span>${Math.round(state.textScale * 100)}%</span></button>
            <button class="icon-btn" id="mobileIncreaseText" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
          </div>
          <button class="ghost-btn fullscreen-btn" id="mobileFullscreenButton" aria-label="${fullscreenLabel}">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
        </div>
        <label class="setting-checkbox">
          <input type="checkbox" id="mobileParagraphLayoutToggle" ${state.paragraphLayout ? "checked" : ""} />
          <span>Paragraph layout when available</span>
        </label>
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
        <label class="setting-checkbox">
          <input type="checkbox" id="mobileShowStreakPopupToggle" ${state.showStreakPopup ? "checked" : ""} />
          <span>Show daily streak popup</span>
        </label>
      </div>
    </div>
  `;
}

function topbar() {
  const selectedVersions = activeVersions();
  const maxVersions = versionLimit();
  const primaryVersion = state.versions[0] || "BSB";
  const primaryVersionOptions = translationCodes
    .map((version) => `<option value="${version}" ${version === primaryVersion ? "selected" : ""}>${translationDisplayCode(version)} · ${translationLookup[version]?.name || version}</option>`)
    .join("");
  const primaryVersionHeaderOptions = translationCodes
    .map((version) => `
      <button class="primary-version-option ${version === primaryVersion ? "active" : ""}" type="button" data-primary-version-option="${version}" role="option" aria-selected="${version === primaryVersion ? "true" : "false"}">
        <span>${translationDisplayCode(version)}</span>
        <small>${escapeHtml(translationLookup[version]?.name || version)}</small>
      </button>
    `)
    .join("");
  const parallelVersionOptions = translationCodes
    .map((version) => {
      const selected = selectedVersions.includes(version);
      const addDisabled = !selected && selectedVersions.length >= maxVersions;
      return `
        <button class="primary-version-option parallel-version-option ${selected ? "active" : ""}" type="button" data-toggle-version-option="${version}" role="option" aria-selected="${selected ? "true" : "false"}" ${addDisabled ? "disabled" : ""}>
          <span class="version-option-check" aria-hidden="true">${selected ? "✓" : ""}</span>
          <span>${translationDisplayCode(version)}</span>
          <small>${escapeHtml(translationLookup[version]?.name || version)}</small>
        </button>
      `;
    })
    .join("");
  const versionControls = state.mode === "parallel"
    ? `
      <div class="versions version-manager ${state.headerVersionMenuOpen ? "open" : ""}" aria-label="Selected Bible versions">
        <button class="primary-version-toggle version-add-toggle" id="versionMenuToggle" type="button" aria-label="Choose Bible versions, ${selectedVersions.length} selected" aria-haspopup="listbox" aria-expanded="${state.headerVersionMenuOpen ? "true" : "false"}">
          <span class="version-selected-label">${selectedVersions.length} Selected</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="primary-version-menu" role="listbox" aria-label="Bible version options">
          ${parallelVersionOptions}
        </div>
      </div>`
    : `
      <div class="versions primary-version-control ${state.headerVersionMenuOpen ? "open" : ""}" aria-label="Bible version">
        <button class="primary-version-toggle" id="versionMenuToggle" type="button" aria-label="Bible version ${translationDisplayCode(primaryVersion)}" aria-haspopup="listbox" aria-expanded="${state.headerVersionMenuOpen ? "true" : "false"}">
          <span>${translationDisplayCode(primaryVersion)}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="primary-version-menu" role="listbox" aria-label="Bible version options">
          ${primaryVersionHeaderOptions}
        </div>
      </div>`;
  const followsSystemTheme = !localStorage.getItem("lw_theme");
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Fullscreen";
  const accountLabel = state.authUser ? "Account" : "Sign in";
  const modeOptions = [
    ["reader", "Reader", icons.book],
    ["parallel", "Parallel Study", icons.parallel],
    ["big", "Big Screen", icons.screen],
    ["trivia", "Games", icons.trivia],
  ];
  const focusLabel = state.focusMode ? "Show panels" : "Focus reading";
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
        <img class="brand-mark-image" src="./assets/brand-mark.png" width="420" height="220" alt="" />
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
        <button class="mobile-mode-focus ${state.focusMode ? "active" : ""}" id="mobileFocusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}<span class="mode-label">Focus</span></button>
      </nav>
      <button class="icon-btn" id="shortcutsButton" aria-label="Help" data-tooltip="Help">?</button>
      <button class="icon-btn focus-toggle ${state.focusMode ? "active" : ""}" id="focusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}</button>
      <div class="account-menu ${state.accountOpen ? "open" : ""}">
        <button class="icon-btn account-quick-button ${state.authUser || state.accountOpen ? "active" : ""}" id="accountQuickButton" aria-label="${accountLabel}" data-tooltip="${accountLabel}">${icons.user}</button>
        <div class="account-popover ${state.accountOpen ? "open" : ""}" aria-hidden="${state.accountOpen ? "false" : "true"}">
          <button class="settings-popover-close" id="accountPopoverClose" type="button" aria-label="Close account">${icons.clear}</button>
          ${accountPanel("quick")}
        </div>
      </div>
      <div class="settings-menu">
        <button class="icon-btn settings-toggle ${state.settingsOpen ? "active" : ""}" id="settingsToggle" aria-label="Settings" data-tooltip="Settings">${icons.settings}</button>
        <div class="settings-popover ${state.settingsOpen ? "open" : ""}" aria-hidden="${state.settingsOpen ? "false" : "true"}">
          <button class="settings-popover-close" id="settingsClose" type="button" aria-label="Close settings">${icons.clear}</button>
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
          <div class="setting-group">
            <span class="setting-label">Appearance</span>
            <div class="theme-mode-segment" role="group" aria-label="Appearance mode">
              <button class="theme-mode-button ${!followsSystemTheme && state.theme === "light" ? "active" : ""}" type="button" data-theme-choice="light" aria-label="Use light mode">${icons.sun}<span>Light</span></button>
              <button class="theme-mode-button ${!followsSystemTheme && state.theme === "dark" ? "active" : ""}" type="button" data-theme-choice="dark" aria-label="Use dark mode">${icons.moon}<span>Dark</span></button>
              <button class="theme-mode-button ${followsSystemTheme ? "active" : ""}" type="button" data-theme-choice="system" aria-label="Follow system theme"><span>System</span></button>
            </div>
          </div>
          <div class="setting-group">
            <span class="setting-label">Display</span>
            <div class="settings-control-row">
              <div class="text-size-control" aria-label="Text size controls">
                <button class="icon-btn" id="decreaseText" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
                <button class="text-size-reset" id="resetText" aria-label="Reset text size to 100%" data-tooltip="Reset text size"><span>Aa</span><span>${Math.round(state.textScale * 100)}%</span></button>
                <button class="icon-btn" id="increaseText" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
              </div>
              <button class="ghost-btn fullscreen-btn" id="fullscreenButton" aria-label="${fullscreenLabel}">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
            </div>
            <label class="setting-checkbox">
              <input type="checkbox" id="paragraphLayoutToggle" ${state.paragraphLayout ? "checked" : ""} />
              <span>Paragraph layout when available</span>
            </label>
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
            <label class="setting-checkbox">
              <input type="checkbox" id="showStreakPopupToggle" ${state.showStreakPopup ? "checked" : ""} />
              <span>Show daily streak popup</span>
            </label>
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
  const streakNote = `${lastVisitLabel}. This stays private to this browser until account sync is added.`;
  return `
    <section class="streak-card" aria-label="Reading streak. ${streakNote}" title="${escapeHtml(streakNote)}">
      <div class="streak-card-top">
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
      </div>
    </section>
  `;
}

function accountPanel(prefix = "") {
  const suffix = prefix ? `${prefix}-` : "";
  const email = state.authUser?.email || "";
  const signedOutStatus = "Sign in or create an account to carry your settings, bookmarks, notes, highlights, and streak across devices.";
  const status = state.syncMessage || (state.authUser ? "Signed in and ready to sync." : signedOutStatus);
  if (!state.authConfigured) {
    return `
      ${streakCard()}
      <section class="account-card">
        <div class="account-card-head">
          <span class="setting-label">Account sync</span>
          <strong>Supabase ready</strong>
        </div>
        <p>Add your Supabase project URL and anon key in <code>assets/supabase-config.js</code> to enable sign in.</p>
      </section>
    `;
  }

  if (state.authUser) {
    const recoveryText = state.passwordRecoveryMode
      ? "Choose a new password to finish account recovery."
      : "Change your password whenever you need to.";
    const passwordTools = state.passwordRecoveryMode || state.passwordChangeOpen
      ? `
        <form class="account-form password-update-form" id="${suffix}passwordUpdateForm">
          <label class="account-mini-label" for="${suffix}newPassword">${recoveryText}</label>
          <input id="${suffix}newPassword" type="password" autocomplete="new-password" placeholder="New password" aria-label="New password" minlength="8" required />
          <div class="account-actions">
            <button class="ghost-btn compact-account-btn" type="submit" ${state.authBusy ? "disabled" : ""}>${icons.key}<span>Update password</span></button>
            ${state.passwordRecoveryMode ? "" : `<button class="ghost-btn compact-account-btn" id="${suffix}cancelPasswordUpdateButton" type="button">Cancel</button>`}
          </div>
        </form>
      `
      : `<button class="account-secondary-action" id="${suffix}changePasswordButton" type="button" ${state.authBusy ? "disabled" : ""}>Change Password</button>`;
    return `
      ${streakCard()}
      <section class="account-card account-card-signed-in">
        <div class="account-card-head">
          <span class="setting-label">Account sync</span>
          <strong>${escapeHtml(email)}</strong>
        </div>
        <p>${escapeHtml(status)}</p>
        <div class="account-actions">
          <button class="ghost-btn compact-account-btn" id="${suffix}syncNowButton" type="button" ${state.authBusy ? "disabled" : ""}>Sync now</button>
          <button class="ghost-btn compact-account-btn" id="${suffix}signOutButton" type="button" ${state.authBusy ? "disabled" : ""}>Sign out</button>
        </div>
        ${passwordTools}
      </section>
    `;
  }

  return `
    ${streakCard()}
    <section class="account-card">
      <div class="account-card-head">
        <span class="setting-label">Account sync</span>
        <strong>Sign in or create account</strong>
      </div>
      <p>${escapeHtml(state.authMessage || status)}</p>
      <form class="account-form" id="${suffix}accountForm">
        <input id="${suffix}accountEmail" type="email" autocomplete="email" placeholder="Email" aria-label="Email" required />
        <input id="${suffix}accountPassword" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" required />
        <div class="account-actions">
          <button class="primary-btn compact-account-btn" type="submit" data-auth-action="signin" ${state.authBusy ? "disabled" : ""}>Sign in</button>
          <button class="ghost-btn compact-account-btn" type="submit" data-auth-action="signup" ${state.authBusy ? "disabled" : ""}>Create account</button>
        </div>
      </form>
      <div class="account-divider"><span>or</span></div>
      <button class="ghost-btn google-account-btn" id="${suffix}googleSignInButton" type="button" ${state.authBusy ? "disabled" : ""}>${icons.google}<span>Continue with Google</span></button>
      <p class="google-auth-note">Google may briefly show our Supabase sign-in address while we finish custom auth branding. It is the secure sign-in provider for Big Screen Bible.</p>
      <button class="account-secondary-action" id="${suffix}forgotPasswordButton" type="button" ${state.authBusy ? "disabled" : ""}>Forgot your password?</button>
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
    <aside class="streak-popup" id="streakPopup" role="status" aria-live="polite" tabindex="0" aria-label="Dismiss streak popup">
      <div class="streak-popup-icon">${icons.flame}</div>
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
    </aside>
  `;
}

function dismissStreakPopup() {
  if (!state.streakPopupVisible) return;
  clearTimeout(streakPopupTimer);
  animateBeforeRemoval("#streakPopup", () => {
    state.streakPopupVisible = false;
    render();
  }, { duration: 220 });
}

function scheduleStreakPopupDismiss() {
  if (!state.streakPopupVisible) return;
  clearTimeout(streakPopupTimer);
  streakPopupTimer = setTimeout(() => {
    dismissStreakPopup();
  }, 4200);
}

function revealMobileSettingsButton() {
  const settingsButton = document.getElementById("mobileFloatingSettings");
  const topButton = document.getElementById("readerTopButton");
  if (!settingsButton && !topButton) return;
  settingsButton?.classList.remove("mobile-settings-idle");
  topButton?.classList.remove("reader-top-idle");
  clearTimeout(mobileSettingsIdleTimer);
  if (state.settingsOpen || state.mode === "big" || !isCompactScreen()) return;
  mobileSettingsIdleTimer = setTimeout(() => {
    if (state.settingsOpen) return;
    document.getElementById("mobileFloatingSettings")?.classList.add("mobile-settings-idle");
    const currentTopButton = document.getElementById("readerTopButton");
    if (currentTopButton?.classList.contains("available")) {
      currentTopButton.classList.add("reader-top-idle");
    }
  }, 3200);
}

function bindMobileSettingsVisibility() {
  revealMobileSettingsButton();
  document.querySelector(".scripture")?.addEventListener("scroll", revealMobileSettingsButton, { passive: true });
}

function updateReaderTopButton() {
  const scripture = document.querySelector(".scripture");
  const button = document.getElementById("readerTopButton");
  if (!scripture || !button) return;
  const scriptureScrolls = scripture.scrollHeight > scripture.clientHeight + 1;
  const scrollTop = scriptureScrolls ? scripture.scrollTop : window.scrollY;
  const isAvailable = scrollTop > 160;
  button.classList.toggle("available", isAvailable);
  if (!isCompactScreen() || !isAvailable) {
    button.classList.remove("reader-top-idle");
  }
}

function bindReaderTopButton() {
  const scripture = document.querySelector(".scripture");
  const button = document.getElementById("readerTopButton");
  if (!scripture || !button) return;
  updateReaderTopButton();
  scripture.addEventListener("scroll", updateReaderTopButton, { passive: true });
  button.addEventListener("click", () => {
    button.classList.remove("reader-top-idle");
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
    if (scripture.scrollHeight > scripture.clientHeight + 1) {
      scripture.scrollTo({ top: 0, behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  });
}

function rail() {
  const items = [
    ["Verse", icons.book],
    ["Bookmarks", icons.bookmark],
    ["Annotations", icons.note],
    ["Cross-Refs", icons.layers],
    ["History", icons.history],
    ["Search", icons.search],
  ];
  return `<aside class="rail">${items.map(([label, icon]) => {
    const active = state.activeRail === label || (label === "Annotations" && state.activeRail === "Notes");
    return `<button class="${active ? "active" : ""}" data-rail="${label}" aria-label="${label}" data-tooltip="${label}">${icon}</button>`;
  }).join("")}</aside>`;
}

function library() {
  const titleMap = {
    Verse: "Verse",
    Bookmarks: "Bookmarks",
    Notes: "Annotations",
    Annotations: "Annotations",
    "Cross-Refs": "Cross References",
    History: "History",
    Search: "Search",
  };
  const title = titleMap[state.activeRail] || "Verse";
  const closeLabel = `Hide ${title.toLowerCase()}`;
  return `
    <aside class="library ${pendingLibraryEnter ? "drawer-enter" : ""}">
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
  if (state.activeRail === "Notes" || state.activeRail === "Annotations") return notesPanel();
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
      <strong>${activeVersions().map(translationDisplayCode).join(" + ")}</strong>
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
      <div class="study-heading">${icons.layers} ${escapeHtml(referenceLabel())}</div>
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
  const savedNotesCount = savedNoteItems().length;
  const savedHighlightsCount = groupedHighlightItems().length;
  return `
    <section class="study-section panel-section" id="notesSection">
      <div class="study-heading">${icons.note} ${escapeHtml(activeRef)}</div>
      <textarea class="note-box" id="noteBox" aria-label="Note for ${activeRef}">${state.notes[activeRef] || ""}</textarea>
      <button class="text-btn" id="saveNote">Save note</button>
      <div class="annotation-shelves" aria-label="Saved annotations">
        ${annotationShelfMarkup("Saved notes", savedNotesCount, "note-list", noteItemsMarkup(), "notes")}
        ${annotationShelfMarkup("Highlighted verses", savedHighlightsCount, "highlight-list", highlightItemsMarkup(), "highlights")}
      </div>
    </section>
  `;
}

function annotationShelfMarkup(label, count, listClass, content, shelfKey) {
  const open = state.openAnnotationShelves.includes(shelfKey);
  return `
    <details class="annotation-shelf" data-annotation-shelf="${escapeHtml(shelfKey)}" ${open ? "open" : ""}>
      <summary><span>${escapeHtml(label)}</span><small>${count}</small></summary>
      <div class="${listClass} saved-list annotation-shelf-list">
        ${content}
      </div>
    </details>
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
      <div class="chapter-tools-region ${state.verseNavCollapsed ? "collapsed" : ""}">
        <div class="chapter-tools-clip" id="verseSelectorBar" ${state.verseNavCollapsed ? 'inert aria-hidden="true"' : ""}>
          <div class="chapter-tools ${state.focusMode ? "compact" : ""}">
            <div class="verse-nav-direction verse-nav-direction-before">
              <button class="icon-btn verse-nav-button verse-nav-button-double verse-nav-button-left" id="prevChapterInline" aria-label="Previous chapter" data-tooltip="Previous chapter">${icons.chevronDouble}</button>
              <button class="icon-btn verse-nav-button verse-nav-button-left" id="prevVerse" aria-label="Previous verse" data-tooltip="Previous verse">${icons.chevron}</button>
            </div>
            <div class="compact-reference">${referenceLabel()} · ${activeVersions().map(translationDisplayCode).join(" / ")}</div>
            <div class="mobile-verse-nav-selectors">
              <button class="verse-nav-select mobile-verse-nav-trigger mobile-verse-nav-chapter" id="mobileChapterSelectInline" type="button" aria-label="Choose chapter" aria-haspopup="listbox" aria-expanded="false">
                <span>${escapeHtml(compactChapterLabel(state.reference))}</span>
                <span class="verse-nav-select-chevron" aria-hidden="true">${icons.chevron}</span>
              </button>
              <span class="verse-nav-divider" aria-hidden="true"></span>
              <button class="verse-nav-select mobile-verse-nav-trigger mobile-verse-nav-verse" id="mobileVerseSelectInline" type="button" aria-label="Choose verse" aria-haspopup="listbox" aria-expanded="false">
                <span>${state.verse}</span>
                <span class="verse-nav-select-chevron" aria-hidden="true">${icons.chevron}</span>
              </button>
            </div>
            <div class="verse-nav-selectors">
              <label class="verse-nav-select verse-nav-chapter-select">
                <span class="sr-only">Chapter</span>
                <select class="full-control" id="chapterSelectInline">${chapterKeys.map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}</select>
                <span class="verse-nav-select-chevron" aria-hidden="true">${icons.chevron}</span>
              </label>
              <span class="verse-nav-divider" aria-hidden="true"></span>
              <label class="verse-nav-select verse-nav-verse-select">
                <span class="sr-only">Verse</span>
                <select class="full-control" id="verseSelectInline">${chapter.verses.map((verse) => `<option ${verse.n === state.verse ? "selected" : ""}>${verse.n}</option>`).join("")}</select>
                <span class="verse-nav-select-chevron" aria-hidden="true">${icons.chevron}</span>
              </label>
            </div>
            <div class="verse-nav-direction verse-nav-direction-after">
              <button class="icon-btn verse-nav-button" id="nextVerse" aria-label="Next verse" data-tooltip="Next verse">${icons.chevron}</button>
              <button class="icon-btn verse-nav-button verse-nav-button-double" id="nextChapterInline" aria-label="Next chapter" data-tooltip="Next chapter">${icons.chevronDouble}</button>
            </div>
            <div class="verse-nav-utilities">
              <button class="icon-btn" id="bookmarkBtn" aria-label="Bookmark" data-tooltip="Bookmark verse">${icons.bookmark}</button>
              <button class="icon-btn" id="noteBtn" aria-label="Add note" data-tooltip="Add note">${icons.note}</button>
            </div>
            <button class="ghost-btn" id="openStudy">${icons.layers} Study</button>
            <button class="ghost-btn compact-control" id="exitFocusInline">Show Panels</button>
          </div>
        </div>
        ${state.focusMode ? "" : `
          <button class="bar-collapse-toggle verse-nav-collapse-toggle" id="verseNavCollapseToggle" type="button" aria-label="${state.verseNavCollapsed ? "Show verse selector bar" : "Hide verse selector bar"}" aria-controls="verseSelectorBar" aria-expanded="${state.verseNavCollapsed ? "false" : "true"}" data-tooltip="${state.verseNavCollapsed ? "Show verse selector" : "Hide verse selector"}">
            ${icons.chevron}
          </button>
        `}
      </div>
      <article class="scripture ${state.mode === "parallel" ? "parallel-mode" : ""}">
        ${state.mode === "parallel" ? parallelView() : readerView()}
      </article>
      ${state.mode === "reader" || state.mode === "parallel" ? `
        <button class="reader-top-button" id="readerTopButton" type="button" aria-label="Back to top" title="Back to top">
          ${icons.arrowUp}
        </button>
      ` : ""}
    </section>
  `;
}

function compactChapterLabel(chapterKey) {
  const match = String(chapterKey).match(/^(.+)\s+(\d+)$/);
  if (!match) return chapterKey;
  const [, book, chapter] = match;
  const numberedBook = book.match(/^([1-3])\s+(.+)$/);
  if (numberedBook) return `${numberedBook[1]} ${numberedBook[2].slice(0, 3)} ${chapter}`;
  const shortBook = book === "Song of Solomon" ? "Song" : book.slice(0, 3);
  return `${shortBook} ${chapter}`;
}

function openMobileVerseNavMenu(trigger, type) {
  if (!trigger) return;
  if (activeMobileVerseNavMenu?.trigger === trigger) {
    closeMobileVerseNavMenu();
    return;
  }
  closeMobileVerseNavMenu();

  const chapterMenu = type === "chapter";
  const items = chapterMenu
    ? currentBookChapterKeys().map((value) => ({
      value,
      label: compactChapterLabel(value),
      selected: value === state.reference,
    }))
    : currentChapter().verses.map((verse) => ({
      value: String(verse.n),
      label: String(verse.n),
      selected: verse.n === state.verse,
    }));
  const menu = document.createElement("div");
  menu.className = `mobile-verse-nav-menu mobile-verse-nav-menu-${type}`;
  menu.id = `mobileVerseNavMenu-${type}`;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", chapterMenu ? "Choose chapter" : "Choose verse");
  menu.innerHTML = items.map((item) => `
    <button class="mobile-verse-nav-option ${item.selected ? "active" : ""}" type="button" role="option" aria-selected="${item.selected ? "true" : "false"}" data-mobile-verse-nav-value="${escapeHtml(item.value)}">
      ${escapeHtml(item.label)}
    </button>
  `).join("");
  document.querySelector(".app-shell")?.appendChild(menu);
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-controls", menu.id);
  positionMobileVerseNavMenu(trigger, menu, type);

  const options = Array.from(menu.querySelectorAll(".mobile-verse-nav-option"));
  const activeOption = menu.querySelector(".mobile-verse-nav-option.active") || options[0];
  if (activeOption) {
    menu.scrollTop = Math.max(0, activeOption.offsetTop - (menu.clientHeight - activeOption.offsetHeight) / 2);
    requestAnimationFrame(() => activeOption.focus({ preventScroll: true }));
  }

  const selectOption = (value) => {
    closeMobileVerseNavMenu();
    if (chapterMenu) {
      state.reference = value;
      state.verse = currentChapter().verses[0].n;
      state.selectedVerses = [];
    } else {
      state.verse = Number(value);
      state.pendingVerseFocus = true;
    }
    state.isVerseOfDayActive = false;
    render();
  };
  options.forEach((option) => {
    option.addEventListener("click", () => selectOption(option.dataset.mobileVerseNavValue));
  });
  menu.addEventListener("keydown", (event) => {
    const index = options.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileVerseNavMenu({ restoreFocus: true });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.activeElement?.click();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.min(options.length - 1, Math.max(0, index + direction));
    options[nextIndex]?.focus({ preventScroll: true });
    options[nextIndex]?.scrollIntoView({ block: "nearest" });
  });

  activeMobileVerseNavMenu = { menu, trigger };
  document.addEventListener("pointerdown", closeMobileVerseNavMenuOnOutside, true);
  window.addEventListener("resize", closeMobileVerseNavMenu);
  window.addEventListener("scroll", closeMobileVerseNavMenu, { passive: true });
}

function positionMobileVerseNavMenu(trigger, menu, type) {
  const bounds = trigger.getBoundingClientRect();
  const viewportPadding = 8;
  const menuWidth = type === "chapter"
    ? Math.max(112, bounds.width)
    : Math.max(72, bounds.width);
  const left = Math.min(
    Math.max(viewportPadding, bounds.left),
    window.innerWidth - menuWidth - viewportPadding,
  );
  const spaceBelow = window.innerHeight - bounds.bottom - 12;
  const spaceAbove = bounds.top - 12;
  const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
  const availableHeight = Math.max(120, Math.min(360, opensAbove ? spaceAbove : spaceBelow));
  menu.style.width = `${menuWidth}px`;
  menu.style.maxHeight = `${availableHeight}px`;
  menu.style.left = `${left}px`;
  if (opensAbove) {
    menu.style.top = "auto";
    menu.style.bottom = `${window.innerHeight - bounds.top + 6}px`;
  } else {
    menu.style.top = `${bounds.bottom + 6}px`;
    menu.style.bottom = "auto";
  }
}

function closeMobileVerseNavMenuOnOutside(event) {
  if (!activeMobileVerseNavMenu) return;
  const { menu, trigger } = activeMobileVerseNavMenu;
  if (menu.contains(event.target) || trigger.contains(event.target)) return;
  closeMobileVerseNavMenu();
}

function closeMobileVerseNavMenu(options = {}) {
  if (!activeMobileVerseNavMenu) return;
  const { menu, trigger } = activeMobileVerseNavMenu;
  activeMobileVerseNavMenu = null;
  menu.remove();
  trigger.removeAttribute("aria-controls");
  trigger.setAttribute("aria-expanded", "false");
  document.removeEventListener("pointerdown", closeMobileVerseNavMenuOnOutside, true);
  window.removeEventListener("resize", closeMobileVerseNavMenu);
  window.removeEventListener("scroll", closeMobileVerseNavMenu);
  if (options.restoreFocus && trigger.isConnected) trigger.focus();
}

function renderStrongText(verse, version) {
  const text = getVerseText(verse, version);
  return renderTextWithStrongNumbers(text, getStrongEntries(verse, version));
}

function getVerseText(verse, version, chapterKey = state.reference) {
  if (verse[version]) return verse[version];
  if (isRemoteTranslation(version)) {
    ensureRemoteBibleVersion(version, chapterKey);
    const loadKey = remoteVersionLoadKey(version, chapterKey);
    const displayVersion = translationDisplayCode(version);
    if (loadingVersions.has(loadKey)) return `Loading ${displayVersion}...`;
    if (remoteVersionErrors.has(loadKey)) return `${displayVersion} is unavailable for this passage.`;
    return `Loading ${displayVersion}...`;
  }
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

function normalizeHighlightColor(color) {
  const value = String(color || "").trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "";
}

function isHighlightColor(color) {
  return highlightColors.includes(color) || Boolean(normalizeHighlightColor(color));
}

function supabaseCredentials() {
  const config = window.BigScreenBibleSupabase || {};
  return {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || config.publishableKey || "").trim(),
  };
}

function isSupabaseConfigured() {
  const { url, anonKey } = supabaseCredentials();
  return Boolean(url && anonKey && !url.includes("YOUR_") && !anonKey.includes("YOUR_"));
}

function createSupabaseClient() {
  if (state.authClient) return state.authClient;
  if (!state.authConfigured) return null;
  if (!window.supabase?.createClient) {
    state.authMessage = "Supabase could not load. Check the internet connection and try again.";
    return null;
  }
  const { url, anonKey } = supabaseCredentials();
  state.authClient = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return state.authClient;
}

async function authenticatedSupabaseSession(client = createSupabaseClient()) {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const session = data?.session || null;
  state.authUser = session?.user || null;
  return session;
}

async function initializeSupabaseAuth() {
  state.authConfigured = isSupabaseConfigured();
  if (!state.authConfigured) {
    state.syncStatus = "local";
    state.syncMessage = "Your settings are saved on this device until Supabase is connected.";
    return;
  }
  const client = createSupabaseClient();
  if (!client) return;
  try {
    const session = await authenticatedSupabaseSession(client);
    state.syncStatus = session?.user ? "loading" : "local";
    state.syncMessage = session?.user ? "Loading your saved settings..." : "Sign in to carry your settings across devices.";
    if (session?.user) await loadCloudSync();
    client.auth.onAuthStateChange((event, session) => {
      state.authUser = session?.user || null;
      state.authBusy = false;
      if (event === "PASSWORD_RECOVERY") {
        state.passwordRecoveryMode = true;
        state.passwordChangeOpen = true;
        state.accountOpen = true;
        state.settingsOpen = false;
        state.authMessage = "Choose a new password to finish account recovery.";
      }
      if (state.authUser) {
        state.syncStatus = "loading";
        state.syncMessage = "Loading your saved settings...";
        loadCloudSync().catch((error) => {
          console.warn("Cloud sync load failed", error);
          state.syncStatus = "error";
          state.syncMessage = "Signed in, but sync could not load yet.";
          renderPreservingReaderScroll();
        });
      } else {
        state.syncStatus = "local";
        state.syncMessage = "Signed out. Changes are saved on this device.";
        renderPreservingReaderScroll();
      }
    });
  } catch (error) {
    console.warn("Supabase auth setup failed", error);
    state.authMessage = "Supabase sign in is configured, but the connection failed.";
    state.syncStatus = "error";
  }
}

function authRedirectUrl() {
  const config = window.BigScreenBibleSupabase || {};
  const configuredRedirect = String(config.redirectTo || config.redirectUrl || "").trim();
  if (configuredRedirect) return configuredRedirect;
  if (location.protocol === "http:" || location.protocol === "https:") {
    return `${location.origin}${location.pathname}`;
  }
  return "https://bigscreenbible.com/";
}

function toggleAccountMenu(forceOpen = null) {
  const nextOpen = forceOpen === null ? !state.accountOpen : Boolean(forceOpen);
  if (state.accountOpen && !nextOpen) {
    animateBeforeRemoval(".account-popover.open", () => {
      state.accountOpen = false;
      renderPreservingReaderScroll();
    }, { duration: 190 });
    return;
  }
  state.accountOpen = nextOpen;
  if (state.accountOpen) state.settingsOpen = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(() => {
    if (!state.accountOpen) return;
    positionAccountPopover();
    const accountField = document.getElementById("quick-accountEmail")
      || document.getElementById("quick-newPassword")
      || document.getElementById("accountEmail")
      || document.getElementById("newPassword");
    accountField?.focus?.();
  });
}

function positionAccountPopover() {
  const popover = document.querySelector(".account-popover.open");
  const button = document.getElementById("accountQuickButton");
  if (!popover || !button || !isCompactScreen()) {
    document.documentElement.style.removeProperty("--account-popover-top");
    clearFixedPopoverPosition(popover);
    return;
  }
  const top = positionFixedPopoverBelowButton(popover, button, { coverRail: true });
  document.documentElement.style.setProperty("--account-popover-top", `${top}px`);
}

function positionSettingsPopover(anchorPreference = state.settingsAnchor) {
  const compact = isCompactScreen();
  const mobilePopover = document.querySelector(".mobile-settings-popover");
  const headerPopover = document.querySelector(".settings-popover.open");
  const popover = compact && mobilePopover ? mobilePopover : headerPopover || mobilePopover;
  const headerButton = document.getElementById("settingsToggle");
  const floatingButton = document.getElementById("mobileFloatingSettings");
  const isMobilePopover = popover?.classList.contains("mobile-settings-popover");
  let button = null;
  if (isMobilePopover) {
    if (anchorPreference === "floating" && isElementVisible(floatingButton)) button = floatingButton;
    else if (anchorPreference === "header" && isElementVisible(headerButton)) button = headerButton;
    else button = isElementVisible(floatingButton) ? floatingButton : headerButton;
  } else {
    button = isElementVisible(headerButton) ? headerButton : floatingButton;
  }
  if (!popover || !button || !compact) {
    document.documentElement.style.removeProperty("--settings-popover-top");
    [mobilePopover, headerPopover].forEach(clearFixedPopoverPosition);
    return;
  }
  if (mobilePopover && headerPopover && mobilePopover !== headerPopover) clearFixedPopoverPosition(headerPopover);
  const top = positionFixedPopoverBelowButton(popover, button, {
    coverRail: false,
    preferAbove: isMobilePopover && button === floatingButton,
  });
  document.documentElement.style.setProperty("--settings-popover-top", `${top}px`);
}

function isElementVisible(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function compactRailWidth() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--rail-width");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 56;
}

function fixedPopoverViewport() {
  return window.visualViewport || { width: window.innerWidth, height: window.innerHeight, offsetLeft: 0, offsetTop: 0 };
}

function positionFixedPopoverBelowButton(popover, button, { coverRail = false, preferAbove = false } = {}) {
  const viewport = fixedPopoverViewport();
  const buttonRect = button.getBoundingClientRect();
  const viewportLeft = viewport.offsetLeft || 0;
  const viewportTop = viewport.offsetTop || 0;
  const gutter = 8;
  const left = coverRail
    ? viewportLeft + gutter
    : viewportLeft + compactRailWidth() + gutter;
  const right = gutter;
  const belowTop = Math.max(gutter, Math.round(viewportTop + buttonRect.bottom + gutter));
  let top = belowTop;
  let maxHeight = Math.max(180, Math.round(viewport.height - (top - viewportTop) - gutter));
  if (preferAbove) {
    const buttonTop = viewportTop + buttonRect.top;
    const availableAbove = Math.max(180, Math.round(buttonRect.top - gutter * 2));
    const measuredHeight = Math.min(popover.scrollHeight || popover.offsetHeight || 360, availableAbove);
    top = Math.max(viewportTop + gutter, Math.round(buttonTop - measuredHeight - gutter));
    maxHeight = Math.max(180, Math.round(buttonTop - top - gutter));
  }
  popover.style.position = "fixed";
  popover.style.top = `${top}px`;
  popover.style.right = `${right}px`;
  popover.style.bottom = "auto";
  popover.style.left = `${left}px`;
  popover.style.width = "auto";
  popover.style.maxWidth = "none";
  popover.style.maxHeight = `${maxHeight}px`;
  popover.style.overflow = "auto";
  popover.style.zIndex = "360";
  return top;
}

function clearFixedPopoverPosition(popover) {
  if (!popover) return;
  ["position", "top", "right", "bottom", "left", "width", "maxWidth", "maxHeight", "overflow", "zIndex"].forEach((property) => {
    popover.style[property] = "";
  });
}

async function handleAccountSubmit(event, prefix = "") {
  event.preventDefault();
  const submitter = event.submitter;
  const action = submitter?.dataset.authAction || "signin";
  const suffix = prefix ? `${prefix}-` : "";
  const email = document.getElementById(`${suffix}accountEmail`)?.value.trim();
  const password = document.getElementById(`${suffix}accountPassword`)?.value || "";
  if (!email || !password) return;
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  state.authBusy = true;
  state.authMessage = action === "signup" ? "Creating your account..." : "Signing you in...";
  renderPreservingReaderScroll();
  try {
    const response = action === "signup"
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });
    if (response.error) throw response.error;
    const session = response.data?.session || await authenticatedSupabaseSession(client);
    state.authUser = session?.user || null;
    state.passwordChangeOpen = false;
    state.passwordRecoveryMode = false;
    state.authMessage = action === "signup" && !session
      ? "Account created. Check your email if Supabase asks you to confirm it."
      : "Signed in.";
    if (session?.user) await loadCloudSync();
    else renderPreservingReaderScroll();
  } catch (error) {
    console.warn("Account action failed", error);
    state.authMessage = error?.message || "Account action failed. Please try again.";
    showToast("Account sign in failed");
    renderPreservingReaderScroll();
  } finally {
    state.authBusy = false;
  }
}

async function requestPasswordReset(prefix = "") {
  const suffix = prefix ? `${prefix}-` : "";
  const email = document.getElementById(`${suffix}accountEmail`)?.value.trim();
  if (!email) {
    state.authMessage = "Enter your email first, then choose Forgot your password.";
    renderPreservingReaderScroll();
    return showToast("Enter your email first");
  }
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  state.authBusy = true;
  state.authMessage = "Sending password reset email...";
  renderPreservingReaderScroll();
  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    });
    if (error) throw error;
    state.authMessage = "Password reset email sent. Check your inbox, then return here to choose a new password.";
  } catch (error) {
    console.warn("Password reset failed", error);
    state.authMessage = error?.message || "Password reset could not be sent. Please try again.";
    showToast("Password reset failed");
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

async function signInWithGoogle() {
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  state.authBusy = true;
  state.authMessage = "Opening Google sign in...";
  renderPreservingReaderScroll();
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  } catch (error) {
    console.warn("Google sign in failed", error);
    state.authBusy = false;
    state.authMessage = error?.message || "Google sign in could not start. Please try again.";
    showToast("Google sign in failed");
    renderPreservingReaderScroll();
  }
}

function showPasswordChange() {
  state.passwordChangeOpen = true;
  state.accountOpen = true;
  state.settingsOpen = false;
  renderPreservingReaderScroll();
}

function hidePasswordChange() {
  if (state.passwordRecoveryMode) return;
  state.passwordChangeOpen = false;
  renderPreservingReaderScroll();
}

async function updateAccountPassword(event, prefix = "") {
  event.preventDefault();
  const suffix = prefix ? `${prefix}-` : "";
  const password = document.getElementById(`${suffix}newPassword`)?.value || "";
  if (password.length < 8) {
    state.authMessage = "Use at least 8 characters for the new password.";
    renderPreservingReaderScroll();
    return showToast("Use at least 8 characters");
  }
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  state.authBusy = true;
  state.authMessage = "Updating password...";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    if (!session?.user) throw new Error("Open the reset email link or sign in before changing your password.");
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    state.passwordChangeOpen = false;
    state.passwordRecoveryMode = false;
    state.authMessage = "Password updated.";
    state.syncMessage = "Password updated. Your account is still synced.";
    showToast("Password updated");
  } catch (error) {
    console.warn("Password update failed", error);
    state.authMessage = error?.message || "Password could not be updated. Please try again.";
    showToast("Password update failed");
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

async function signOutAccount() {
  const client = createSupabaseClient();
  if (!client) return;
  state.authBusy = true;
  renderPreservingReaderScroll();
  try {
    await client.auth.signOut();
    state.authUser = null;
    state.accountOpen = false;
    state.passwordChangeOpen = false;
    state.passwordRecoveryMode = false;
    state.authMessage = "";
    state.syncStatus = "local";
    state.syncMessage = "Signed out. Changes are saved on this device.";
  } catch (error) {
    console.warn("Sign out failed", error);
    state.authMessage = "Could not sign out yet. Please try again.";
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

function captureCloudSnapshot() {
  return {
    settings: {
      versions: state.versions,
      themeMode: localStorage.getItem("lw_theme") || "system",
      themePresetLight: localStorage.getItem("lw_theme_preset_light") || defaultThemePresets.light,
      themePresetDark: localStorage.getItem("lw_theme_preset_dark") || defaultThemePresets.dark,
      scriptureFont: state.scriptureFont,
      customScriptureFont: state.customScriptureFont,
      customHighlightColor: state.customHighlightColor,
      textScale: state.textScale,
      paragraphLayout: state.paragraphLayout,
      focusMode: state.focusMode,
      libraryOpen: state.libraryOpen,
      presentationTheme: state.presentationTheme,
      startBigScreen: state.startBigScreen,
      startVerseOfDay: state.startVerseOfDay,
      showStreakPopup: state.showStreakPopup,
      triviaGameType: state.triviaGameType,
      triviaCategory: state.triviaCategory,
      triviaDifficulty: state.triviaDifficulty,
      triviaCount: state.triviaCount,
      bookSprintSound: state.bookSprintSound,
      referenceRushTimed: state.referenceRushTimed,
    },
    bookmarks: state.bookmarks,
    notes: state.notes,
    highlights: state.highlights,
    history: state.history,
    streak: normalizeReadingStreak(state.streak),
  };
}

function normalizeCloudRow(row = {}) {
  return {
    settings: row.settings && typeof row.settings === "object" ? row.settings : {},
    bookmarks: Array.isArray(row.bookmarks) ? row.bookmarks : [],
    notes: row.notes && typeof row.notes === "object" ? row.notes : {},
    highlights: row.highlights && typeof row.highlights === "object" ? row.highlights : {},
    history: Array.isArray(row.history) ? row.history : [],
    streak: normalizeReadingStreak(row.streak || {}),
  };
}

function mergeCloudSnapshots(cloudRow, localSnapshot) {
  const cloud = normalizeCloudRow(cloudRow);
  return {
    settings: {
      ...localSnapshot.settings,
      ...cloud.settings,
      versions: mergeVersions(cloud.settings.versions, localSnapshot.settings.versions),
    },
    bookmarks: uniqueList([...cloud.bookmarks, ...localSnapshot.bookmarks]).slice(0, 200),
    notes: { ...cloud.notes, ...localSnapshot.notes },
    highlights: { ...cloud.highlights, ...localSnapshot.highlights },
    history: mergeHistory(cloud.history, localSnapshot.history),
    streak: mergeStreaks(cloud.streak, localSnapshot.streak),
  };
}

function uniqueList(items) {
  return [...new Set((items || []).filter(Boolean))];
}

function mergeVersions(cloudVersions = [], localVersions = []) {
  const merged = uniqueList([...(cloudVersions || []), ...(localVersions || [])]).filter((version) => translationCodes.includes(version));
  return merged.length ? merged : ["BSB", "KJV"];
}

function mergeHistory(cloudHistory = [], localHistory = []) {
  const normalized = [...cloudHistory, ...localHistory]
    .map((item) => typeof item === "string" ? { ref: item, at: "" } : item)
    .filter((item) => item?.ref);
  const byRef = new Map();
  normalized.forEach((item) => {
    const existing = byRef.get(item.ref);
    if (!existing || String(item.at || "") > String(existing.at || "")) byRef.set(item.ref, item);
  });
  return Array.from(byRef.values())
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, 80);
}

function mergeStreaks(cloudStreak, localStreak) {
  const cloud = normalizeReadingStreak(cloudStreak);
  const local = normalizeReadingStreak(localStreak);
  const lastVisit = [cloud.lastVisit, local.lastVisit].sort().pop() || "";
  return {
    current: Math.max(cloud.current, local.current),
    best: Math.max(cloud.best, local.best),
    totalDays: Math.max(cloud.totalDays, local.totalDays),
    lastVisit,
  };
}

function applyCloudSnapshot(snapshot) {
  const settings = snapshot.settings || {};
  state.versions = mergeVersions(settings.versions, ["BSB", "KJV"]);
  state.theme = settings.themeMode === "dark" || settings.themeMode === "light" ? settings.themeMode : savedTheme();
  state.themePreset = settings[`themePreset${state.theme === "dark" ? "Dark" : "Light"}`] || savedThemePreset(state.theme);
  state.scriptureFont = scriptureFontCodes.includes(settings.scriptureFont) ? settings.scriptureFont : "libre";
  state.customScriptureFont = sanitizeFontName(settings.customScriptureFont || "");
  state.customHighlightColor = normalizeHighlightColor(settings.customHighlightColor) || state.customHighlightColor;
  state.textScale = clampTextScale(Number(settings.textScale) || 1);
  state.paragraphLayout = typeof settings.paragraphLayout === "boolean"
    ? settings.paragraphLayout
    : savedParagraphLayout();
  state.focusMode = Boolean(settings.focusMode);
  state.libraryOpen = settings.libraryOpen !== false;
  state.presentationTheme = presentationThemeCodes.includes(settings.presentationTheme) ? settings.presentationTheme : defaultPresentationTheme;
  state.startBigScreen = settings.startBigScreen !== false;
  state.startVerseOfDay = settings.startVerseOfDay !== false;
  state.showStreakPopup = settings.showStreakPopup !== false;
  state.triviaGameType = settings.triviaGameType || state.triviaGameType;
  state.triviaCategory = settings.triviaCategory || state.triviaCategory;
  state.triviaDifficulty = settings.triviaDifficulty || state.triviaDifficulty;
  state.triviaCount = normalizedTriviaCount(state.triviaGameType, Number(settings.triviaCount) || state.triviaCount);
  state.bookSprintSound = settings.bookSprintSound !== false;
  state.referenceRushTimed = settings.referenceRushTimed !== false;
  state.bookmarks = Array.isArray(snapshot.bookmarks) ? uniqueList(snapshot.bookmarks).slice(0, 200) : [];
  state.notes = snapshot.notes && typeof snapshot.notes === "object" ? snapshot.notes : {};
  state.highlights = snapshot.highlights && typeof snapshot.highlights === "object" ? snapshot.highlights : {};
  state.history = mergeHistory(snapshot.history, []);
  state.streak = normalizeReadingStreak(snapshot.streak);
  persistCloudSnapshotLocally(snapshot);
  applyCustomScriptureFont();
}

function persistCloudSnapshotLocally(snapshot) {
  const settings = snapshot.settings || {};
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
  if (settings.themeMode === "dark" || settings.themeMode === "light") localStorage.setItem("lw_theme", settings.themeMode);
  else localStorage.removeItem("lw_theme");
  localStorage.setItem("lw_theme_preset_light", settings.themePresetLight || defaultThemePresets.light);
  localStorage.setItem("lw_theme_preset_dark", settings.themePresetDark || defaultThemePresets.dark);
  localStorage.setItem("lw_scripture_font", state.scriptureFont);
  localStorage.setItem("lw_custom_scripture_font", state.customScriptureFont);
  localStorage.setItem("lw_custom_highlight_color", state.customHighlightColor);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  localStorage.setItem("lw_paragraph_layout", String(state.paragraphLayout));
  localStorage.setItem("lw_focus_mode", String(state.focusMode));
  localStorage.setItem("lw_library_open", String(state.libraryOpen));
  localStorage.setItem("lw_presentation_theme", state.presentationTheme);
  localStorage.setItem("lw_start_big_screen", String(state.startBigScreen));
  localStorage.setItem("lw_start_verse_of_day", String(state.startVerseOfDay));
  localStorage.setItem("lw_show_streak_popup", String(state.showStreakPopup));
  localStorage.setItem("lw_trivia_game_type", state.triviaGameType);
  localStorage.setItem("lw_trivia_category", state.triviaCategory);
  localStorage.setItem("lw_trivia_difficulty", state.triviaDifficulty);
  localStorage.setItem("lw_trivia_count", String(state.triviaCount));
  localStorage.setItem("lw_book_sprint_sound", state.bookSprintSound ? "true" : "false");
  localStorage.setItem("lw_reference_rush_timed", state.referenceRushTimed ? "true" : "false");
  localStorage.setItem("lw_bookmarks", JSON.stringify(state.bookmarks));
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  localStorage.setItem("lw_highlights", JSON.stringify(state.highlights));
  localStorage.setItem("lw_history", JSON.stringify(state.history));
  localStorage.setItem(streakStorageKey, JSON.stringify(state.streak));
}

async function loadCloudSync() {
  const client = createSupabaseClient();
  if (!client) return;
  state.authBusy = true;
  state.syncStatus = "loading";
  state.syncMessage = "Loading your saved settings...";
  const localSnapshot = captureCloudSnapshot();
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) {
      state.syncStatus = "local";
      state.syncMessage = "Sign in to sync across devices.";
      return;
    }
    const { data, error } = await client
      .from(cloudSyncTable)
      .select("settings, bookmarks, notes, highlights, history, streak, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const nextSnapshot = data ? mergeCloudSnapshots(data, localSnapshot) : localSnapshot;
    applyCloudSnapshot(nextSnapshot);
    await upsertCloudSnapshot(nextSnapshot, { quiet: true });
    state.syncStatus = "synced";
    state.syncMessage = "Synced across your signed-in devices.";
    state.lastCloudSyncAt = new Date().toISOString();
  } catch (error) {
    console.warn("Cloud sync failed", error);
    state.syncStatus = "error";
    state.syncMessage = error?.message || "Sync could not finish yet.";
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

function scheduleCloudSync() {
  if (!state.authClient || !state.authUser) return;
  clearTimeout(cloudSyncTimer);
  state.syncStatus = "pending";
  state.syncMessage = "Sync pending...";
  cloudSyncTimer = window.setTimeout(() => {
    upsertCloudSnapshot(captureCloudSnapshot()).catch((error) => {
      console.warn("Cloud sync save failed", error);
      state.syncStatus = "error";
      state.syncMessage = "Could not sync your latest change yet.";
      renderPreservingReaderScroll();
    });
  }, 900);
}

async function upsertCloudSnapshot(snapshot = captureCloudSnapshot(), options = {}) {
  const client = createSupabaseClient();
  if (!client) return;
  state.syncStatus = "saving";
  const session = await authenticatedSupabaseSession(client);
  const userId = session?.user?.id;
  if (!userId) {
    state.syncStatus = "local";
    state.syncMessage = "Sign in to sync across devices.";
    return;
  }
  const { error } = await client
    .from(cloudSyncTable)
    .upsert({ user_id: userId, ...snapshot }, { onConflict: "user_id" });
  if (error) throw error;
  state.syncStatus = "synced";
  state.syncMessage = "Synced across your signed-in devices.";
  state.lastCloudSyncAt = new Date().toISOString();
}

async function syncNowAccount() {
  state.authBusy = true;
  state.syncMessage = "Syncing now...";
  renderPreservingReaderScroll();
  try {
    await upsertCloudSnapshot(captureCloudSnapshot());
  } catch (error) {
    console.warn("Manual cloud sync failed", error);
    state.syncStatus = "error";
    state.syncMessage = error?.message || "Sync could not finish yet.";
    showToast("Sync failed");
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

function readerView() {
  const version = state.versions[0] || "BSB";
  const chapter = currentChapter();
  const useParagraphs = shouldUseParagraphLayout(version, chapter);
  return `
    <h1 class="section-title">${chapter.title}</h1>
    ${selectionBar()}
    ${useParagraphs ? paragraphReaderView(chapter.verses, version) : chapter.verses.map((verse) => `
      <p class="verse ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
        <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
        <span class="verse-text">${renderStrongText(verse, version)}</span>
        ${verseCopyButton(verse.n)}
      </p>
    `).join("")}
    ${apiBibleAttributionMarkup([version])}
  `;
}

function shouldUseParagraphLayout(version, chapter = currentChapter()) {
  const paragraphStarts = chapter?.verses?.filter((verse) => paragraphStartForVerse(verse, version)) || [];
  return Boolean(
    state.paragraphLayout
      && (paragraphStarts.length > 1 || chapter?.verses?.length <= 1),
  );
}

function paragraphStartForVerse(verse, version) {
  return Boolean(verse?.paragraphStart?.[version]);
}

function verseCopyButton(verseNumber) {
  return `
    <button class="verse-copy verse-action" data-copy-verse="${verseNumber}" aria-label="Copy ${state.reference}:${verseNumber}" data-tooltip="Copy verse">
      <span class="verse-action-icon" aria-hidden="true">${icons.copy}</span>
      <span class="sr-only">Copy verse</span>
    </button>
  `;
}

function paragraphReaderView(verses, version) {
  const groups = [];
  verses.forEach((verse) => {
    if (!groups.length || paragraphStartForVerse(verse, version)) groups.push([]);
    groups[groups.length - 1].push(verse);
  });
  return `
    <div class="scripture-paragraphs" data-paragraph-version="${escapeHtml(version)}">
      ${groups.map((group) => `
        <p class="scripture-paragraph">
          ${group.map((verse) => `
            <span class="paragraph-verse ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
              <button class="verse-num paragraph-verse-num" data-verse-actions="${verse.n}" aria-label="Actions for ${state.reference}:${verse.n}" aria-expanded="false">${verse.n}</button>
              <span class="verse-text">${renderStrongText(verse, version)}</span>
            </span>
          `).join(" ")}
        </p>
      `).join("")}
    </div>
  `;
}

function formatGameTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatCountdownTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizedTriviaCount(gameType = state.triviaGameType, count = state.triviaCount) {
  const values = gameType === "book-sprint" ? bookSprintRoundLengths : triviaRoundLengths;
  const requested = Number(count) || values[0];
  return values.find((value) => requested <= value) || values[values.length - 1];
}

function bookSprintElapsedMs(game = state.triviaGame) {
  if (!game || game.type !== "book-sprint" || !game.startedAt) return 0;
  return Math.max(0, (game.finishedAt || Date.now()) - game.startedAt);
}

function bookSprintBestKey(difficulty = state.triviaDifficulty, rounds = state.triviaCount || 10) {
  return `${difficulty || "All"}:${rounds || 10}`;
}

function savedBookSprintBests() {
  try {
    return JSON.parse(localStorage.getItem(bookSprintBestStorageKey) || "{}");
  } catch {
    return {};
  }
}

function savedBookSprintBest(difficulty = state.triviaDifficulty, rounds = state.triviaCount || 10) {
  return savedBookSprintBests()[bookSprintBestKey(difficulty, rounds)] || null;
}

function bookSprintBestLabel(best) {
  return best ? formatGameTime(best.elapsedMs) : "No best yet";
}

function recordBookSprintBest(game) {
  if (!game || game.type !== "book-sprint") return null;
  const rounds = game.puzzles?.length || 0;
  const result = {
    difficulty: game.difficulty || "All",
    rounds,
    score: game.score || 0,
    elapsedMs: bookSprintElapsedMs(game),
    completedAt: new Date().toISOString(),
  };
  const key = bookSprintBestKey(result.difficulty, result.rounds);
  const bests = savedBookSprintBests();
  const previous = bests[key];
  const beatPrevious = Boolean(previous && result.elapsedMs < previous.elapsedMs);
  const isNewBest = !previous || beatPrevious;
  if (isNewBest) {
    bests[key] = result;
    localStorage.setItem(bookSprintBestStorageKey, JSON.stringify(bests));
  }
  return { best: bests[key] || previous || result, isNewBest, beatPrevious, hadPrevious: Boolean(previous) };
}

function scheduleBookSprintTimer() {
  clearInterval(bookSprintTimer);
  bookSprintTimer = 0;
  updateBookSprintTimerDisplay();
  const game = state.triviaGame;
  if (state.mode !== "trivia" || game?.type !== "book-sprint" || game.complete) return;
  bookSprintTimer = setInterval(updateBookSprintTimerDisplay, 500);
}

function primeBookSprintAudio() {
  if (!state.bookSprintSound) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    if (!bookSprintAudioContext) bookSprintAudioContext = new AudioContext();
  } catch {
    return;
  }
  if (bookSprintAudioContext.state === "suspended") bookSprintAudioContext.resume().catch(() => {});
}

function playBookSprintTick(secondsRemaining) {
  if (!state.bookSprintSound || !bookSprintAudioContext || bookSprintAudioContext.state !== "running") return;
  const now = bookSprintAudioContext.currentTime;
  const oscillator = bookSprintAudioContext.createOscillator();
  const gain = bookSprintAudioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(secondsRemaining <= 3 ? 1180 : 920, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(secondsRemaining <= 3 ? 0.045 : 0.028, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  oscillator.connect(gain);
  gain.connect(bookSprintAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function updateBookSprintTimerDisplay() {
  const game = state.triviaGame;
  const timer = document.getElementById("bookSprintTimer");
  const label = document.getElementById("bookSprintTimerLabel");
  if (!timer || game?.type !== "book-sprint") return;
  const elapsedMs = bookSprintElapsedMs(game);
  const targetMs = Number(game.bookSprintTarget?.elapsedMs) || 0;
  if (!targetMs) {
    timer.textContent = formatGameTime(elapsedMs);
    if (label) label.textContent = "Time";
    timer.classList.remove("is-urgent", "is-critical", "is-expired");
    return;
  }
  const remainingMs = Math.max(0, targetMs - elapsedMs);
  const secondsRemaining = Math.ceil(remainingMs / 1000);
  timer.textContent = formatCountdownTime(remainingMs);
  timer.classList.toggle("is-urgent", remainingMs > 0 && remainingMs <= 10000);
  timer.classList.toggle("is-critical", remainingMs > 0 && remainingMs <= 5000);
  timer.classList.toggle("is-expired", remainingMs <= 0);
  if (secondsRemaining > 0 && secondsRemaining <= 10 && game.bookSprintLastTick !== secondsRemaining) {
    game.bookSprintLastTick = secondsRemaining;
    playBookSprintTick(secondsRemaining);
  }
  if (label) label.textContent = remainingMs > 0 ? "Time to beat" : "Best time passed";
}

function referenceRushDurationMs(difficulty = state.triviaDifficulty, count = state.triviaCount) {
  const baseSeconds = {
    Easy: 30,
    Medium: 45,
    Hard: 60,
    All: 60,
  }[difficulty] || 60;
  const verseCount = normalizedTriviaCount("reference-rush", count);
  return baseSeconds * 1000 * (verseCount / 5);
}

function referenceRushRemainingMs(game = state.triviaGame) {
  if (!game || game.type !== "reference-rush" || !game.timed || !game.deadlineAt) return 0;
  const now = game.finishedAt || Date.now();
  return Math.max(0, game.deadlineAt - now);
}

function primeReferenceRushAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    if (!referenceRushAudioContext) referenceRushAudioContext = new AudioContext();
  } catch {
    return;
  }
  if (referenceRushAudioContext.state === "suspended") referenceRushAudioContext.resume().catch(() => {});
}

function playReferenceRushTick(secondsRemaining) {
  if (!referenceRushAudioContext || referenceRushAudioContext.state !== "running") return;
  const now = referenceRushAudioContext.currentTime;
  const oscillator = referenceRushAudioContext.createOscillator();
  const gain = referenceRushAudioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(secondsRemaining <= 3 ? 1180 : 920, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(secondsRemaining <= 3 ? 0.045 : 0.028, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  oscillator.connect(gain);
  gain.connect(referenceRushAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function scheduleReferenceRushTimer() {
  clearInterval(referenceRushTimer);
  referenceRushTimer = 0;
  updateReferenceRushTimerDisplay();
  const game = state.triviaGame;
  if (state.mode !== "trivia" || game?.type !== "reference-rush" || !game.timed || game.complete || game.finishedAt) return;
  referenceRushTimer = setInterval(updateReferenceRushTimerDisplay, 250);
}

function updateReferenceRushTimerDisplay() {
  const game = state.triviaGame;
  const timer = document.getElementById("referenceRushTimer");
  if (!timer || game?.type !== "reference-rush" || !game.timed) return;
  const remainingMs = referenceRushRemainingMs(game);
  const secondsRemaining = Math.ceil(remainingMs / 1000);
  timer.textContent = formatCountdownTime(remainingMs);
  timer.classList.toggle("is-urgent", remainingMs > 0 && remainingMs <= 10000);
  timer.classList.toggle("is-critical", remainingMs > 0 && remainingMs <= 5000);
  timer.classList.toggle("is-expired", remainingMs <= 0);
  if (secondsRemaining > 0 && secondsRemaining <= 10 && game.referenceRushLastTick !== secondsRemaining) {
    game.referenceRushLastTick = secondsRemaining;
    playReferenceRushTick(secondsRemaining);
  }
  if (remainingMs > 0 || game.complete || game.finishedAt) return;
  game.timedOut = true;
  game.finishedAt = game.deadlineAt;
  completeTriviaGame(game);
  renderPreservingReaderScroll();
}

function triviaView() {
  const questions = triviaQuestions();
  const isVerseOrder = state.triviaGameType === "verse-order";
  const isReferenceRush = state.triviaGameType === "reference-rush";
  const isBookSprint = state.triviaGameType === "book-sprint";
  const isWhoSaidIt = state.triviaGameType === "who-said-it";
  const categories = triviaCategories(questions);
  if (["Old Testament", "New Testament"].includes(state.triviaCategory)) state.triviaCategory = "Bible Survey";
  const categoryOptions = categories.map((category) => `<option value="${escapeHtml(category)}" ${category === state.triviaCategory ? "selected" : ""}>${escapeHtml(category)}</option>`).join("");
  const difficultyOptions = triviaDifficulties().map((difficulty) => {
    const label = isReferenceRush && difficulty === "All" ? "Progressive" : difficulty;
    return `<option value="${escapeHtml(difficulty)}" ${difficulty === state.triviaDifficulty ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
  const countLabel = isBookSprint ? "rounds" : isVerseOrder || isReferenceRush ? "verses" : "questions";
  const countValues = isBookSprint ? bookSprintRoundLengths : triviaRoundLengths;
  const selectedCount = normalizedTriviaCount(state.triviaGameType, state.triviaCount);
  const countOptions = countValues.map((count) => `<option value="${count}" ${count === selectedCount ? "selected" : ""}>${count} ${countLabel}</option>`).join("");
  const gameTitle = isVerseOrder ? "Verse Order" : isReferenceRush ? "Reference Rush" : isBookSprint ? "Book Sprint" : isWhoSaidIt ? "Who Said It?" : "Bible Trivia";
  const bookSprintBest = isBookSprint ? savedBookSprintBest(state.triviaDifficulty, selectedCount) : null;
  const referenceRushTime = isReferenceRush
    ? formatCountdownTime(referenceRushDurationMs(state.triviaDifficulty, selectedCount))
    : "";
  const setupCopy = isVerseOrder
    ? "Tap or drag shuffled verse fragments back into order. Rounds progress from 3 to 7 pieces, then reveal the reference."
    : isReferenceRush
      ? "Read the verse and follow its clues. Easy asks for the book; Medium and Hard move toward the exact reference."
      : isBookSprint
        ? "Put the books in Bible order as quickly as you can. Your first finish sets a best time; later sprints count down toward it."
        : isWhoSaidIt
          ? "Read the quote, then choose who said it before opening the reference."
          : "Choose a category, then answer multiple-choice questions with a reference reveal after each answer.";
  return `
    <section class="reader trivia-reader">
      <article class="trivia-panel">
        <div class="trivia-header">
          <div>
            <div class="trivia-eyebrow">${gameTitle}</div>
            <h1>Games</h1>
          </div>
          <div class="trivia-score-chip">${triviaScoreLabel()}</div>
        </div>
        ${state.triviaGame ? triviaGameView() : `
          <div class="trivia-setup">
            <div class="trivia-mode-tabs" role="tablist" aria-label="Game type">
              <button class="${state.triviaGameType === "trivia" ? "active" : ""}" data-trivia-mode="trivia" type="button">${icons.trivia}<span>Trivia</span></button>
              <button class="${isVerseOrder ? "active" : ""}" data-trivia-mode="verse-order" type="button">${icons.book}<span>Verse Order</span></button>
              <button class="${isReferenceRush ? "active" : ""}" data-trivia-mode="reference-rush" type="button">${icons.search}<span>Reference Rush</span></button>
              <button class="${isBookSprint ? "active" : ""}" data-trivia-mode="book-sprint" type="button">${icons.timer}<span>Book Sprint</span></button>
              <button class="${isWhoSaidIt ? "active" : ""}" data-trivia-mode="who-said-it" type="button">${icons.quote}<span>Who Said It?</span></button>
            </div>
            <p>${setupCopy}</p>
            <div class="trivia-setup-controls ${isVerseOrder ? "single-control" : isReferenceRush || isBookSprint || isWhoSaidIt ? "two-controls" : ""}">
              <label class="${isVerseOrder || isReferenceRush || isBookSprint || isWhoSaidIt ? "is-hidden" : ""}">
                <span>Category</span>
                <select id="triviaCategorySelect">${categoryOptions}</select>
              </label>
              <label class="${isVerseOrder ? "is-hidden" : ""}">
                <span>Difficulty</span>
                <select id="triviaDifficultySelect">${difficultyOptions}</select>
              </label>
              <label>
                <span>Round length</span>
                <select id="triviaCountSelect">${countOptions}</select>
              </label>
            </div>
            ${isReferenceRush ? `<p class="reference-rush-level-note">${escapeHtml(referenceRushDifficultyDescription(state.triviaDifficulty))}</p>` : ""}
            ${isReferenceRush ? `
              <button class="reference-rush-timer-option ${state.referenceRushTimed ? "active" : ""}" id="referenceRushTimerToggle" type="button" aria-pressed="${state.referenceRushTimed}">
                ${icons.timer}
                <span>
                  <strong>Countdown ${state.referenceRushTimed ? "on" : "off"}</strong>
                  <small>${state.referenceRushTimed ? `${referenceRushTime} for this round` : "Play without a timer"}</small>
                </span>
              </button>
            ` : ""}
            ${isBookSprint ? `
              <div class="book-sprint-best-card">
                <span>Best time for this setup</span>
                <strong>${escapeHtml(bookSprintBestLabel(bookSprintBest))}</strong>
              </div>
            ` : ""}
            <button class="primary-btn trivia-start" id="startTriviaGame">${isVerseOrder ? icons.book : isReferenceRush ? icons.search : isBookSprint ? icons.timer : isWhoSaidIt ? icons.quote : icons.trivia}<span>Start ${gameTitle}</span></button>
          </div>
        `}
      </article>
    </section>
  `;
}

function triviaGameView() {
  const game = state.triviaGame;
  if (game?.type === "verse-order") return verseOrderGameView(game);
  if (game?.type === "reference-rush") return referenceRushGameView(game);
  if (game?.type === "book-sprint") return bookSprintGameView(game);
  if (game?.type === "who-said-it") return whoSaidItGameView(game);
  if (game.complete) return triviaResultsView(game);
  const question = game.questions[game.index];
  const answered = game.selectedAnswer !== null;
  const correct = game.selectedAnswer === question.answer;
  const hintOptions = availableRoundHintOptions(triviaHintOptions(question), game);
  return `
    <div class="trivia-game">
      <div class="trivia-progress">
        <span>${escapeHtml(game.category)} · ${escapeHtml(game.difficulty)}</span>
        <strong>${game.index + 1} / ${game.questions.length}</strong>
      </div>
      <h2>${escapeHtml(question.question)}</h2>
      <div class="trivia-choices">
        ${question.choices.map((choice) => triviaChoiceButton(question, choice, answered)).join("")}
      </div>
      ${!answered ? `
        <div class="reference-rush-hints">
          ${question.hintUsed ? `
            <div class="reference-rush-hint-result" role="status">
              <strong>${escapeHtml(referenceRushHintLabel(question.hintUsed))} used</strong>
              <p>${escapeHtml(question.hintMessage)}</p>
            </div>
          ` : question.hintMenuOpen && hintOptions.length ? `
            <div class="reference-rush-hint-menu" role="group" aria-label="Choose one hint">
              <div>
                <strong>Choose one hint</strong>
                <span>Each hint type can be used once per round.</span>
              </div>
              ${hintOptions.map((hint) => `
                <button type="button" data-trivia-hint="${escapeHtml(hint.type)}">
                  <strong>${escapeHtml(hint.label)}</strong>
                  <span>${escapeHtml(hint.description)}</span>
                </button>
              `).join("")}
              <button class="reference-rush-hint-cancel" id="closeTriviaHints" type="button">Cancel</button>
            </div>
          ` : hintOptions.length ? `
            <button class="ghost-btn" id="triviaHint" type="button">Choose a hint</button>
          ` : `
            <div class="reference-rush-hint-result" role="status">
              <strong>All hints used</strong>
              <p>Hint types return when you start a new round.</p>
            </div>
          `}
        </div>
      ` : ""}
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
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.questions.length - 1 ? "Finish round" : "Next question"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
        </div>
      `}
    </div>
  `;
}

function triviaChoiceButton(question, choice, answered) {
  const selected = choice === state.triviaGame.selectedAnswer;
  const isCorrect = choice === question.answer;
  const eliminated = question.eliminatedChoices.includes(choice);
  const classes = [
    "trivia-choice",
    answered && isCorrect ? "correct" : "",
    answered && selected && !isCorrect ? "incorrect" : "",
    eliminated ? "eliminated" : "",
  ].filter(Boolean).join(" ");
  return `<button class="${classes}" data-trivia-answer="${escapeHtml(choice)}" ${answered || eliminated ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
}

function verseOrderGameView(game) {
  if (game.complete) return triviaResultsView(game);
  const puzzle = game.puzzles[game.index];
  const selectedSet = new Set(puzzle.selectedIds);
  const answered = puzzle.answered;
  const correct = answered && puzzle.correct;
  return `
    <div class="trivia-game verse-order-game">
      <div class="trivia-progress">
        <span>Verse Order · ${escapeHtml(game.version)} · ${puzzle.segments.length} pieces</span>
        <strong>${game.index + 1} / ${game.puzzles.length}</strong>
      </div>
      <h2>Put this verse back in order.</h2>
      <p class="book-sprint-instructions" id="verseOrderInstructions">Tap fragments to add them, or drag them into place. Drag placed fragments to reorder them.</p>
      <div class="verse-order-board">
        <div class="verse-order-answer book-sprint-answer" data-order-drop-zone aria-label="Selected verse fragments" aria-describedby="verseOrderInstructions">
          ${puzzle.selectedIds.length ? puzzle.selectedIds.map((id, index) => {
            const segment = puzzle.segments.find((item) => item.id === id);
            return `<button class="verse-fragment selected-fragment book-sprint-draggable" data-order-selected="${escapeHtml(id)}" data-order-drag="${escapeHtml(id)}" data-order-position="${index}" aria-label="Fragment ${index + 1}: ${escapeHtml(segment?.text || "")}. Tap to remove or drag to reorder." ${answered ? "disabled" : ""}><span>${index + 1}</span>${escapeHtml(segment?.text || "")}</button>`;
          }).join("") : `<span class="verse-order-placeholder">Build the verse here.</span>`}
        </div>
        <div class="verse-fragment-bank book-sprint-bank" data-order-bank-drop aria-label="Shuffled verse fragments">
          ${puzzle.shuffledIds.map((id) => {
            const segment = puzzle.segments.find((item) => item.id === id);
            const isSelected = selectedSet.has(id);
            return `<button class="verse-fragment book-sprint-draggable ${isSelected ? "is-used" : ""}" data-order-fragment="${escapeHtml(id)}" data-order-drag="${escapeHtml(id)}" aria-label="${escapeHtml(segment?.text || "")}. Tap or drag to add." ${isSelected || answered ? "disabled" : ""}>${escapeHtml(segment?.text || "")}</button>`;
          }).join("")}
        </div>
      </div>
      ${answered ? `
        <div class="trivia-feedback ${correct ? "correct" : "incorrect"}">
          <strong>${correct ? "Correct" : "Not quite"}</strong>
          <p>${correct ? "You restored the verse in order." : `The original order is: ${puzzle.segments.map((segment) => segment.text).join(" ")}`}</p>
          <div class="trivia-reference">
            <span>${escapeHtml(puzzle.reference)}</span>
            <button class="text-btn" id="openTriviaReference">Open reference</button>
          </div>
        </div>
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish round" : "Next verse"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="resetVerseOrderPuzzle" ${puzzle.selectedIds.length ? "" : "disabled"}>Reset puzzle</button>
          <button class="primary-btn" id="checkVerseOrder" ${puzzle.selectedIds.length === puzzle.segments.length ? "" : "disabled"}>Check order</button>
        </div>
      `}
    </div>
  `;
}

function referenceRushGameView(game) {
  if (game.complete) return triviaResultsView(game);
  const puzzle = game.puzzles[game.index];
  const answered = puzzle.selectedReference !== null;
  const correct = puzzle.selectedReference === puzzle.correctAnswer;
  const levelLabel = game.difficulty === "All" ? `Progressive · ${puzzle.difficulty}` : game.difficulty;
  const hintOptions = availableRoundHintOptions(referenceRushHintOptions(puzzle), game);
  return `
    <div class="trivia-game reference-rush-game">
      <div class="trivia-progress">
        <span>Reference Rush · ${escapeHtml(levelLabel)}</span>
        <strong>${game.index + 1} / ${game.puzzles.length}</strong>
      </div>
      ${game.timed ? `
        <div class="book-sprint-meter reference-rush-timer-meter" aria-label="Reference Rush countdown">
          <div>
            <span>Time left</span>
            <strong id="referenceRushTimer">${formatCountdownTime(referenceRushRemainingMs(game))}</strong>
          </div>
        </div>
      ` : ""}
      <div class="reference-rush-prompt">
        <p>${escapeHtml(puzzle.text)}</p>
        <span>${escapeHtml(game.version)}</span>
      </div>
      <div class="trivia-choices reference-rush-choices">
        ${puzzle.choices.map((choice) => referenceRushChoiceButton(puzzle, choice, answered)).join("")}
      </div>
      ${!answered ? `
        <div class="reference-rush-hints">
          ${puzzle.hintUsed ? `
            <div class="reference-rush-hint-result" role="status">
              <strong>${escapeHtml(referenceRushHintLabel(puzzle.hintUsed))} used</strong>
              <p>${escapeHtml(puzzle.hintMessage)}</p>
            </div>
          ` : puzzle.hintMenuOpen && hintOptions.length ? `
            <div class="reference-rush-hint-menu" role="group" aria-label="Choose one hint">
              <div>
                <strong>Choose one hint</strong>
                <span>Each hint type can be used once per round.</span>
              </div>
              ${hintOptions.map((hint) => `
                <button type="button" data-reference-hint="${escapeHtml(hint.type)}">
                  <strong>${escapeHtml(hint.label)}</strong>
                  <span>${escapeHtml(hint.description)}</span>
                </button>
              `).join("")}
              <button class="reference-rush-hint-cancel" id="closeReferenceRushHints" type="button">Cancel</button>
            </div>
          ` : hintOptions.length ? `
            <button class="ghost-btn" id="referenceRushHint" type="button">Choose a hint</button>
          ` : `
            <div class="reference-rush-hint-result" role="status">
              <strong>All hints used</strong>
              <p>Hint types return when you start a new round.</p>
            </div>
          `}
        </div>
      ` : ""}
      ${answered ? `
        <div class="trivia-feedback ${correct ? "correct" : "incorrect"}">
          <strong>${correct ? "Correct" : "Not quite"}</strong>
          <p>${correct ? "You found the passage." : `The correct answer is ${puzzle.correctAnswer}.`}</p>
          <p class="reference-rush-learning">${escapeHtml(puzzle.learningNote)}</p>
          <div class="trivia-reference">
            <span>${escapeHtml(puzzle.reference)}</span>
            <button class="text-btn" id="openTriviaReference">Open reference</button>
          </div>
        </div>
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish round" : "Next verse"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
        </div>
      `}
    </div>
  `;
}

function referenceRushChoiceButton(puzzle, choice, answered) {
  const selected = choice === puzzle.selectedReference;
  const isCorrect = choice === puzzle.correctAnswer;
  const eliminated = puzzle.eliminatedChoices.includes(choice);
  const classes = [
    "trivia-choice",
    answered && isCorrect ? "correct" : "",
    answered && selected && !isCorrect ? "incorrect" : "",
    eliminated ? "eliminated" : "",
  ].filter(Boolean).join(" ");
  return `<button class="${classes}" data-reference-answer="${escapeHtml(choice)}" ${answered || eliminated ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
}

function bookSprintGameView(game) {
  if (game.complete) return triviaResultsView(game);
  const puzzle = game.puzzles[game.index];
  const selectedSet = new Set(puzzle.selectedBooks);
  const answered = puzzle.answered;
  const correct = answered && puzzle.correct;
  const best = savedBookSprintBest(game.difficulty, game.puzzles.length);
  return `
    <div class="trivia-game book-sprint-game">
      <div class="trivia-progress">
        <span>Book Sprint · ${escapeHtml(game.difficulty)}</span>
        <strong>Round ${game.index + 1} / ${game.puzzles.length}</strong>
      </div>
      <div class="book-sprint-meter" aria-label="Book Sprint timer and best result">
        <div>
          <span id="bookSprintTimerLabel">${game.bookSprintTarget ? "Time to beat" : "Time"}</span>
          <strong id="bookSprintTimer">${game.bookSprintTarget ? formatCountdownTime(game.bookSprintTarget.elapsedMs - bookSprintElapsedMs(game)) : formatGameTime(bookSprintElapsedMs(game))}</strong>
        </div>
        <div>
          <span>Best</span>
          <strong>${escapeHtml(bookSprintBestLabel(best))}</strong>
        </div>
        <button class="book-sprint-sound-toggle" id="bookSprintSoundToggle" type="button" aria-pressed="${state.bookSprintSound}" aria-label="Turn Book Sprint ticking ${state.bookSprintSound ? "off" : "on"}">
          <span>Ticking</span>
          <strong>${state.bookSprintSound ? "On" : "Off"}</strong>
        </button>
      </div>
      <h2>Put these books in Bible order.</h2>
      <p class="book-sprint-instructions" id="bookSprintInstructions">Tap books to add them, or drag them into place. Drag placed books to reorder them.</p>
      <div class="verse-order-board">
        <div class="verse-order-answer book-sprint-answer" data-book-drop-zone aria-label="Selected books" aria-describedby="bookSprintInstructions">
          ${puzzle.selectedBooks.length ? puzzle.selectedBooks.map((book, index) => `<button class="verse-fragment selected-fragment book-sprint-draggable" data-book-selected="${escapeHtml(book)}" data-book-drag="${escapeHtml(book)}" data-book-position="${index}" aria-label="${escapeHtml(book)}, position ${index + 1}. Tap to remove or drag to reorder." ${answered ? "disabled" : ""}><span>${index + 1}</span>${escapeHtml(book)}</button>`).join("") : `<span class="verse-order-placeholder">Build the order here.</span>`}
        </div>
        <div class="verse-fragment-bank book-sprint-bank" data-book-bank-drop aria-label="Book choices">
          ${puzzle.shuffledBooks.map((book) => `<button class="verse-fragment book-sprint-draggable ${selectedSet.has(book) ? "is-used" : ""}" data-book-answer="${escapeHtml(book)}" data-book-drag="${escapeHtml(book)}" aria-label="${escapeHtml(book)}. Tap or drag to add." ${selectedSet.has(book) || answered ? "disabled" : ""}>${escapeHtml(book)}</button>`).join("")}
        </div>
      </div>
      ${!answered && puzzle.lastAttemptIncorrect ? `
        <div class="trivia-feedback incorrect book-sprint-retry">
          <strong>Not quite</strong>
          <p>Try that round again. The timer is still running.</p>
        </div>
      ` : ""}
      ${answered ? `
        <div class="trivia-feedback ${correct ? "correct" : "incorrect"}">
          <strong>${correct ? "Correct" : "Not quite"}</strong>
          <p>The Bible order is: ${escapeHtml(puzzle.books.join(", "))}.</p>
        </div>
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish Book Sprint" : "Next round"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="resetBookSprintPuzzle" ${puzzle.selectedBooks.length ? "" : "disabled"}>Reset puzzle</button>
          <button class="primary-btn" id="checkBookSprint" ${puzzle.selectedBooks.length === puzzle.books.length ? "" : "disabled"}>Check order</button>
        </div>
      `}
    </div>
  `;
}

function whoSaidItGameView(game) {
  if (game.complete) return triviaResultsView(game);
  const question = game.questions[game.index];
  const answered = question.selectedAnswer !== null;
  const correct = question.selectedAnswer === question.answer;
  return `
    <div class="trivia-game who-said-it-game">
      <div class="trivia-progress">
        <span>Who Said It? · ${escapeHtml(game.difficulty)}</span>
        <strong>${game.index + 1} / ${game.questions.length}</strong>
      </div>
      <div class="reference-rush-prompt">
        <p>${escapeHtml(question.quote)}</p>
        <span>Who said it?</span>
      </div>
      <div class="trivia-choices">
        ${question.choices.map((choice) => whoSaidItChoiceButton(question, choice, answered)).join("")}
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
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.questions.length - 1 ? "Finish round" : "Next quote"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
        </div>
      `}
    </div>
  `;
}

function whoSaidItChoiceButton(question, choice, answered) {
  const selected = choice === question.selectedAnswer;
  const isCorrect = choice === question.answer;
  const classes = [
    "trivia-choice",
    answered && isCorrect ? "correct" : "",
    answered && selected && !isCorrect ? "incorrect" : "",
  ].filter(Boolean).join(" ");
  return `<button class="${classes}" data-who-answer="${escapeHtml(choice)}" ${answered ? "disabled" : ""}>${escapeHtml(choice)}</button>`;
}

function triviaResultsView(game) {
  const roundLength = game.questions?.length || game.puzzles?.length || 1;
  const percent = Math.round((game.score / roundLength) * 100);
  const perfect = game.score === roundLength;
  const isBookSprint = game.type === "book-sprint";
  const bookSprintBest = isBookSprint ? (game.bookSprintBest || savedBookSprintBest(game.difficulty, roundLength)) : null;
  if (isBookSprint) {
    const elapsed = formatGameTime(bookSprintElapsedMs(game));
    const resultTitle = game.bookSprintBeatBest
      ? "New fastest time!"
      : game.bookSprintHadPrevious
        ? "Sprint complete"
        : "Best time set";
    const resultText = game.bookSprintBeatBest
      ? `You beat the previous ${formatGameTime(game.bookSprintTarget?.elapsedMs)} benchmark and finished all ${roundLength} rounds in ${elapsed}.`
      : game.bookSprintHadPrevious
        ? `You finished all ${roundLength} rounds in ${elapsed}. Try again to beat ${bookSprintBestLabel(bookSprintBest)}.`
        : `You finished all ${roundLength} rounds in ${elapsed}. The next sprint will count down from this time.`;
    return `
      <div class="trivia-results ${game.bookSprintBeatBest ? "perfect" : ""}">
        <div class="trivia-result-ring book-sprint-time-ring">${elapsed}</div>
        <h2>${resultTitle}</h2>
        <p>${resultText}</p>
        ${game.bookSprintBeatBest ? `<p class="trivia-motion-success ${game.motionSuccessVisible ? "visible" : ""}" id="triviaMotionSuccess" ${game.motionSuccessVisible ? "" : "hidden"} role="status">New Book Sprint record! Wonderful work.</p>` : ""}
        <div class="book-sprint-result-stats">
          <div>
            <span>Your time</span>
            <strong>${elapsed}</strong>
          </div>
          <div>
            <span>${game.bookSprintBeatBest ? "New best" : "Best time"}</span>
            <strong>${escapeHtml(bookSprintBestLabel(bookSprintBest))}</strong>
          </div>
        </div>
        <div class="trivia-actions">
          <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
          <button class="ghost-btn" id="restartTriviaGame">Try again</button>
          <button class="primary-btn" id="newTriviaGame">New round</button>
        </div>
      </div>
    `;
  }
  const resultText = game.type === "verse-order"
    ? `You ordered ${game.score} of ${roundLength} passages correctly.`
    : game.type === "reference-rush"
      ? game.timedOut
        ? `Time ran out. You matched ${game.score} of ${roundLength} references correctly; unanswered verses counted against your accuracy.`
        : `You matched ${game.score} of ${roundLength} references correctly.`
      : game.type === "who-said-it"
          ? `You identified ${game.score} of ${roundLength} speakers correctly.`
          : `You answered ${game.score} of ${roundLength} correctly in ${escapeHtml(game.category)} at ${escapeHtml(game.difficulty)} difficulty.`;
  return `
    <div class="trivia-results ${perfect ? "perfect" : ""}">
      <div class="trivia-result-ring">${percent}%</div>
      <h2>${game.type === "reference-rush" && game.timedOut ? "Time’s up!" : triviaResultTitle(percent)}</h2>
      <p>${resultText}</p>
      ${perfect ? `<p class="trivia-motion-success ${game.motionSuccessVisible ? "visible" : ""}" id="triviaMotionSuccess" ${game.motionSuccessVisible ? "" : "hidden"} role="status">Perfect score! Wonderful work.</p>` : ""}
      <div class="trivia-actions">
        <button class="ghost-btn" id="exitTriviaGame">Games menu</button>
        <button class="ghost-btn" id="restartTriviaGame">Try again</button>
        <button class="primary-btn" id="newTriviaGame">${game.type === "trivia" || !game.type ? "New category" : "New round"}</button>
      </div>
    </div>
  `;
}

function triviaRoundLength(game) {
  return game?.questions?.length || game?.puzzles?.length || 0;
}

function completeTriviaGame(game) {
  if (!game || game.complete) return;
  if (game.type === "reference-rush" && game.timed && !game.finishedAt) game.finishedAt = Date.now();
  game.complete = true;
  const roundLength = triviaRoundLength(game);
  game.celebrationPending = game.type === "book-sprint"
    ? Boolean(game.bookSprintBeatBest)
    : roundLength > 0 && game.score === roundLength;
}

function runPendingTriviaCelebration() {
  const game = state.triviaGame;
  if (state.mode !== "trivia" || !game?.complete || !game.celebrationPending) return;
  game.celebrationPending = false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    revealTriviaMotionSuccess();
    return;
  }
  launchTriviaConfetti(game).catch(() => {
    cleanupTriviaCelebration();
    if (state.triviaGame === game) revealTriviaMotionSuccess(game);
  });
}

function revealTriviaMotionSuccess(game = state.triviaGame) {
  if (game) game.motionSuccessVisible = true;
  const message = document.getElementById("triviaMotionSuccess");
  if (!message) return;
  message.hidden = false;
  requestAnimationFrame(() => message.classList.add("visible"));
}

async function launchTriviaConfetti(game) {
  cleanupTriviaCelebration();
  const token = triviaCelebrationToken;
  let confettiModule;
  try {
    confettiModule = await import(confettiModuleUrl);
  } catch {
    if (token === triviaCelebrationToken && state.triviaGame === game) revealTriviaMotionSuccess(game);
    return;
  }
  if (token !== triviaCelebrationToken || state.triviaGame !== game || state.mode !== "trivia") return;

  const canvas = document.createElement("canvas");
  canvas.className = "trivia-confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);

  const confetti = confettiModule.default.create(canvas, { resize: true, useWorker: true });
  const duration = 2400;
  const end = performance.now() + duration;
  let frameId = 0;
  let cleanupTimer = 0;

  const fire = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 58,
      startVelocity: 42,
      gravity: 0.9,
      scalar: 0.9,
      origin: { x: 0, y: 0.66 },
      colors: ["#0f766e", "#d4a72c", "#f97316", "#ec4899", "#6366f1"],
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 58,
      startVelocity: 42,
      gravity: 0.9,
      scalar: 0.9,
      origin: { x: 1, y: 0.66 },
      colors: ["#0f766e", "#d4a72c", "#f97316", "#ec4899", "#6366f1"],
    });
    if (performance.now() < end) {
      frameId = requestAnimationFrame(fire);
      return;
    }
    cleanupTimer = window.setTimeout(cleanupTriviaCelebration, 700);
  };

  activeTriviaCelebration = {
    canvas,
    confetti,
    cancel: () => {
      cancelAnimationFrame(frameId);
      clearTimeout(cleanupTimer);
    },
  };
  confetti({ particleCount: 70, spread: 82, startVelocity: 48, origin: { y: 0.7 } });
  fire();
}

function cleanupTriviaCelebration() {
  triviaCelebrationToken += 1;
  if (!activeTriviaCelebration) return;
  activeTriviaCelebration.cancel();
  activeTriviaCelebration.confetti.reset();
  activeTriviaCelebration.canvas.remove();
  activeTriviaCelebration = null;
}

function triviaResultTitle(percent) {
  if (percent >= 90) return "Excellent round";
  if (percent >= 70) return "Strong work";
  if (percent >= 50) return "Good start";
  return "Keep going";
}

function triviaScoreLabel() {
  if (!state.triviaGame) {
    if (state.triviaGameType === "verse-order") return `${verseOrderPool().length} verses`;
    if (state.triviaGameType === "reference-rush") return `${referenceRushAvailableCount()} verses`;
    if (state.triviaGameType === "book-sprint") return `${bookSprintBestLabel(savedBookSprintBest(state.triviaDifficulty, normalizedTriviaCount("book-sprint", state.triviaCount)))}`;
    if (state.triviaGameType === "who-said-it") return `${whoSaidItPool().length} quotes`;
    return `${triviaPool().length} questions`;
  }
  const roundLength = state.triviaGame.questions?.length || state.triviaGame.puzzles?.length || 0;
  if (state.triviaGame.complete) {
    if (state.triviaGame.type === "book-sprint") return formatGameTime(bookSprintElapsedMs(state.triviaGame));
    return `${state.triviaGame.score} / ${roundLength}`;
  }
  if (state.triviaGame.type === "verse-order") return `${state.triviaGame.score} ordered`;
  if (state.triviaGame.type === "reference-rush") return `${state.triviaGame.score} matched`;
  if (state.triviaGame.type === "book-sprint") return `Round ${state.triviaGame.index + 1} / ${roundLength}`;
  if (state.triviaGame.type === "who-said-it") return `${state.triviaGame.score} speakers`;
  return `${state.triviaGame.score} correct`;
}

function parallelView() {
  const versions = activeVersions();
  return `
    ${selectionBar()}
    <div class="parallel-table" style="--version-count: ${versions.length}">
      <div class="parallel-head"><div>V</div>${versions.map((version) => `<div>${translationDisplayCode(version)}</div>`).join("")}</div>
      ${currentChapter().verses.map((verse) => `
        <div class="parallel-row ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
          <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
          ${versions.map((version) => `<div class="parallel-copy" data-version="${escapeHtml(version)}">${renderStrongText(verse, version)}</div>`).join("")}
        </div>
      `).join("")}
    </div>
    ${apiBibleAttributionMarkup(versions)}
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
  return highlightClassForColor(color);
}

function highlightClassForColor(color) {
  if (highlightColors.includes(color)) return `highlight-${color}`;
  return normalizeHighlightColor(color) ? "highlight-custom" : "";
}

function highlightStyleForVerse(verseNumber) {
  return highlightStyleForColor(state.highlights[`${state.reference}:${verseNumber}`]);
}

function highlightStyleForColor(color) {
  const customColor = normalizeHighlightColor(color);
  return customColor ? `style="--custom-highlight-color: ${escapeHtml(customColor)}"` : "";
}

function crossReferenceItems(reference = referenceLabel()) {
  const sourceRefs = window.BIGSCREEN_CROSS_REFS?.refs?.[reference] || [];
  return sourceRefs.map(normalizeCrossReference).filter(Boolean);
}

function bookmarkItemsMarkup() {
  if (!state.bookmarks.length) return `<div class="empty-state">No bookmarks saved yet.</div>`;
  const items = state.bookmarks.slice().sort(compareReferenceStrings).map((ref) => ({ ref }));
  return groupedAnnotationItemsMarkup(items, "No bookmarks saved yet.", ({ ref }) => `
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
  `, "bookmarks");
}

function referenceBookName(ref) {
  const parsed = parsePassageReference(ref);
  const key = parsed?.key || String(ref || "");
  const match = key.match(/^(.+)\s\d+$/);
  return match?.[1] || key || "Other";
}

function groupedAnnotationItemsMarkup(items, emptyText, renderItem, collectionKey = "annotations") {
  if (!items.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
  const groups = new Map();
  items.forEach((item) => {
    const book = referenceBookName(item.ref);
    if (!groups.has(book)) groups.set(book, []);
    groups.get(book).push(item);
  });
  const currentBook = referenceBookName(state.reference);
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      const left = books.indexOf(a);
      const right = books.indexOf(b);
      if (left !== -1 && right !== -1) return left - right;
      if (left !== -1) return -1;
      if (right !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([book, group], index) => {
      const groupKey = `${collectionKey}:${book}`;
      const hasTrackedGroups = state.touchedAnnotationGroupCollections.includes(collectionKey);
      const open = hasTrackedGroups
        ? state.openAnnotationGroups.includes(groupKey)
        : book === currentBook || groups.size === 1 || index === 0;
      return `
        <details class="annotation-group" data-annotation-group="${escapeHtml(groupKey)}" ${open ? "open" : ""}>
          <summary><span>${escapeHtml(book)}</span><small>${group.length}</small></summary>
          <div class="annotation-group-list">
            ${group.map(renderItem).join("")}
          </div>
        </details>
      `;
    }).join("");
}

function noteItemsMarkup() {
  const items = savedNoteItems();
  return groupedAnnotationItemsMarkup(items, "No saved notes yet.", ({ ref, note }) => `
    <div class="saved-item">
      <button class="note-item" data-goto="${escapeHtml(ref)}" data-goto-verse="${escapeHtml(firstVerseFromReference(ref))}">
        <div class="note-title">${escapeHtml(ref)}</div>
        <div class="note-copy">${escapeHtml(truncatePreview(note))}</div>
      </button>
      <div class="saved-actions">
        <button class="text-btn" data-edit-note="${escapeHtml(ref)}">Edit</button>
        <button class="text-btn danger-text" data-delete-note="${escapeHtml(ref)}">Delete</button>
      </div>
    </div>
  `, "notes");
}

function savedNoteItems() {
  return Object.entries(state.notes)
    .filter(([, note]) => String(note || "").trim())
    .sort(([a], [b]) => compareReferenceStrings(a, b))
    .map(([ref, note]) => ({ ref, note }));
}

function highlightItemsMarkup() {
  const groups = groupedHighlightItems();
  return groupedAnnotationItemsMarkup(groups, "No highlighted verses yet.", ({ ref, color }) => {
    const preview = passagePreviewForReference(ref);
    const hasNote = Boolean(String(state.notes[ref] || "").trim());
    return `
      <div class="saved-item">
        <button class="highlight-item" data-goto="${escapeHtml(ref)}" data-goto-verse="${escapeHtml(firstVerseFromReference(ref))}">
          <div class="highlight-title">
            <span class="highlight-dot ${highlightClassForColor(color)}" ${highlightStyleForColor(color)} aria-hidden="true"></span>
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
  }, "highlights");
}

function historyItemsMarkup() {
  if (!state.history.length) return `<div class="empty-state">No reading history yet.</div>`;
  const groups = groupedHistoryItems();
  const currentWeekSections = groups.currentWeek
    .map((group) => historySectionMarkup(group.label, group.items, { open: group.isToday }))
    .join("");
  return currentWeekSections + previousWeeksHistoryMarkup(groups.previousWeeks);
}

function historySectionMarkup(label, items, { open = false } = {}) {
  if (!items.length) return "";
  const body = `<div class="history-group-items">${items.map(historyItemMarkup).join("")}</div>`;
  return `
    <details class="history-group" ${open ? "open" : ""}>
      <summary>
        <span>${escapeHtml(label)}</span>
        <small>${items.length} ${items.length === 1 ? "entry" : "entries"}</small>
      </summary>
      ${body}
    </details>
  `;
}

function historyItemMarkup(item) {
  const ref = item.ref;
  const when = formatHistoryTime(item.at);
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
}

function groupedHistoryItems() {
  const todayStart = startOfDay(new Date());
  const weekStart = startOfWeek(new Date());
  const grouped = { currentWeek: [], previousWeeks: [] };
  const currentWeekByDay = new Map();
  const olderByWeek = new Map();
  normalizedHistoryItems().forEach((item) => {
    if (!item.date) {
      addOlderHistoryGroup(olderByWeek, "Older history", item);
      return;
    }
    if (item.date >= weekStart) {
      const day = startOfDay(item.date);
      const label = historyDayLabel(day, todayStart);
      if (!currentWeekByDay.has(label)) currentWeekByDay.set(label, { label, date: day, isToday: day.getTime() === todayStart.getTime(), items: [] });
      currentWeekByDay.get(label).items.push(item);
      return;
    }
    addOlderHistoryGroup(olderByWeek, historyWeekLabel(item.date), item);
  });
  grouped.currentWeek = Array.from(currentWeekByDay.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  grouped.previousWeeks = Array.from(olderByWeek.entries()).map(([label, items]) => ({ label, items }));
  return grouped;
}

function previousWeeksHistoryMarkup(groups) {
  if (!groups.length) return "";
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  return `
    <details class="history-group history-previous-weeks">
      <summary>
        <span>Previous weeks</span>
        <small>${total} ${total === 1 ? "entry" : "entries"}</small>
      </summary>
      <div class="history-week-list">
        ${groups.map(historyWeekItemsMarkup).join("")}
      </div>
    </details>
  `;
}

function historyWeekItemsMarkup(group) {
  return `
    <section class="history-week-subgroup" aria-label="${escapeHtml(group.label)}">
      <div class="history-week-heading">
        <span>${escapeHtml(group.label)}</span>
        <small>${group.items.length} ${group.items.length === 1 ? "entry" : "entries"}</small>
      </div>
      <div class="history-group-items">
        ${group.items.map(historyItemMarkup).join("")}
      </div>
    </section>
  `;
}

function normalizedHistoryItems() {
  return state.history
    .map((item) => {
      const ref = typeof item === "string" ? item : item.ref;
      const at = typeof item === "string" ? "" : item.at;
      const date = parseHistoryDate(at);
      return ref ? { ref, at, date } : null;
    })
    .filter(Boolean);
}

function addOlderHistoryGroup(groupMap, label, item) {
  if (!groupMap.has(label)) groupMap.set(label, []);
  groupMap.get(label).push(item);
}

function parseHistoryDate(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function historyDayLabel(date, todayStart) {
  if (date.getTime() === todayStart.getTime()) return "Today";
  const yesterday = new Date(todayStart);
  yesterday.setDate(todayStart.getDate() - 1);
  if (date.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function historyWeekLabel(date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString([], { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString([], sameMonth ? { day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel}-${endLabel}`;
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
    .filter((item) => item.key && item.verses.length === 1 && isHighlightColor(item.color))
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
  state.isVerseOfDayActive = false;
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

function openVerseActionMenu(anchor) {
  const verseNumber = Number(anchor.dataset.verseActions);
  if (!verseNumber) return;
  const existingMenu = document.getElementById("verseActionMenu");
  if (existingMenu?.dataset.verse === String(verseNumber)) {
    closeVerseActionMenu();
    return;
  }

  closeVerseActionMenu(true);
  const menu = document.createElement("div");
  menu.className = "verse-action-menu";
  menu.id = "verseActionMenu";
  menu.dataset.verse = String(verseNumber);
  menu.setAttribute("role", "toolbar");
  menu.setAttribute("aria-label", `Actions for ${state.reference}:${verseNumber}`);
  menu.innerHTML = `
    <button type="button" data-menu-select aria-label="Select ${state.reference}:${verseNumber}">${icons.plus}</button>
    <button type="button" data-menu-copy aria-label="Copy ${state.reference}:${verseNumber}">${icons.copy}</button>
    <button type="button" data-menu-cross-ref data-cross-ref-verse="${verseNumber}" aria-label="Cross references for ${state.reference}:${verseNumber}">${icons.layers}</button>
  `;
  (document.querySelector(".app-shell") || document.body).appendChild(menu);
  anchor.setAttribute("aria-expanded", "true");
  positionVerseActionMenu(anchor, menu);

  menu.querySelector("[data-menu-select]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.verse = verseNumber;
    state.isVerseOfDayActive = false;
    toggleVerseSelection(verseNumber, event.shiftKey);
    closeVerseActionMenu();
    renderPreservingReaderScroll();
  });
  menu.querySelector("[data-menu-copy]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    copySpecificVerses([verseNumber]);
    closeVerseActionMenu();
  });
  menu.querySelector("[data-menu-cross-ref]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const button = event.currentTarget;
    openCrossReferencePopup(button);
    closeVerseActionMenu();
  });

  requestAnimationFrame(() => {
    document.addEventListener("click", closeVerseActionMenuOnOutside, true);
    document.addEventListener("keydown", closeVerseActionMenuOnEscape);
    window.addEventListener("resize", closeVerseActionMenu, { once: true });
    window.addEventListener("scroll", closeVerseActionMenu, { once: true, passive: true });
    menu.querySelector("button")?.focus();
  });
}

function positionVerseActionMenu(anchor, menu) {
  const rect = anchor.getBoundingClientRect();
  const gap = 7;
  const menuRect = menu.getBoundingClientRect();
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2 - menuRect.width / 2),
    window.innerWidth - menuRect.width - 8,
  );
  const canFitAbove = rect.top - menuRect.height - gap >= 8;
  const top = canFitAbove ? rect.top - menuRect.height - gap : rect.bottom + gap;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function closeVerseActionMenuOnOutside(event) {
  const menu = document.getElementById("verseActionMenu");
  if (!menu) return;
  if (menu.contains(event.target) || event.target.closest?.("[data-verse-actions]")) return;
  closeVerseActionMenu();
}

function closeVerseActionMenuOnEscape(event) {
  if (event.key !== "Escape") return;
  closeVerseActionMenu();
}

function closeVerseActionMenu(immediate = false) {
  const menu = document.getElementById("verseActionMenu");
  const verseNumber = menu?.dataset.verse;
  if (verseNumber) {
    document.querySelector(`[data-verse-actions="${verseNumber}"]`)?.setAttribute("aria-expanded", "false");
  }
  document.removeEventListener("click", closeVerseActionMenuOnOutside, true);
  document.removeEventListener("keydown", closeVerseActionMenuOnEscape);
  window.removeEventListener("resize", closeVerseActionMenu);
  window.removeEventListener("scroll", closeVerseActionMenu);
  if (!menu) return;
  if (immediate) {
    menu.remove();
    return;
  }
  animateBeforeRemoval("#verseActionMenu", () => menu.remove(), { duration: 150 });
}

function showStudyPopup(anchor, content, label) {
  closeStudyPopup(true);
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

function closeStudyPopup(immediate = false) {
  const popup = document.getElementById("studyPopup");
  document.removeEventListener("click", closeStudyPopupOnOutside, true);
  if (!popup) return;
  if (immediate) {
    popup.remove();
    return;
  }
  animateBeforeRemoval("#studyPopup", () => popup.remove(), { duration: 180 });
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
  return getVerseText(verse, state.versions[0] || "BSB", key);
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
    <div class="footer-region ${state.footerCollapsed ? "collapsed" : ""}">
      <footer class="bottombar" id="footerBar" ${state.footerCollapsed ? 'inert aria-hidden="true"' : ""}>
        <button class="nav-button chapter-nav chapter-nav-prev" id="prevChapter" aria-label="Previous chapter">
          <span class="chapter-nav-icon" aria-hidden="true">‹</span>
          <span class="chapter-nav-label">Previous Chapter</span>
        </button>
        <div class="fineprint">${activeVersions().map(translationDisplayCode).join(" / ")} · ${referenceLabel()}</div>
        <div class="bottom-actions">
          <button class="ghost-btn bottom-action" id="copyVerse" aria-label="Copy verse">
            <span class="bottom-action-icon" aria-hidden="true">${icons.copy}</span>
            <span class="bottom-action-label">Copy Verse</span>
          </button>
          <button class="ghost-btn bottom-action" id="printPage" aria-label="Print">
            <span class="bottom-action-icon" aria-hidden="true">${icons.print}</span>
            <span class="bottom-action-label">Print</span>
          </button>
          <a class="ghost-btn bottom-action bottom-about-link" href="./about.html" aria-label="About Big Screen Bible">
            <span class="bottom-action-icon" aria-hidden="true">${icons.info}</span>
            <span class="bottom-action-label">About</span>
          </a>
        </div>
        <button class="nav-button chapter-nav chapter-nav-next" id="nextChapter" aria-label="Next chapter">
          <span class="chapter-nav-label">Next Chapter</span>
          <span class="chapter-nav-icon" aria-hidden="true">›</span>
        </button>
      </footer>
      <button class="bar-collapse-toggle footer-collapse-toggle" id="footerCollapseToggle" type="button" aria-label="${state.footerCollapsed ? "Show footer bar" : "Hide footer bar"}" aria-controls="footerBar" aria-expanded="${state.footerCollapsed ? "false" : "true"}" data-tooltip="${state.footerCollapsed ? "Show footer" : "Hide footer"}">
        ${icons.chevron}
      </button>
    </div>
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
        <label class="highlight-custom-swatch" style="--custom-highlight-color: ${escapeHtml(state.customHighlightColor)}" aria-label="Choose custom highlight color" title="Custom highlight color">
          <input id="customHighlightColor" type="color" value="${escapeHtml(state.customHighlightColor)}" aria-label="Choose custom highlight color">
        </label>
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
    .map((code) => `<option value="${code}" ${code === version ? "selected" : ""}>${translationDisplayCode(code)}</option>`)
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
          <span class="presentation-version-label">${translationDisplayCode(version)}</span>
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
              <button class="ghost-btn presentation-help-btn" id="presentationHelpButton" type="button">?<span>Help & tour</span></button>
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
      <div class="presentation-text">
        <div class="presentation-passage">
          <span class="presentation-copy">${escapeHtml(text)}</span>
          ${state.isVerseOfDayActive ? `<span class="presentation-verse-of-day-label">Verse of the Day</span>` : ""}
          ${apiBibleAttributionMarkup([version], "presentation-attribution")}
        </div>
      </div>
      <div class="presentation-bottom">
        <a class="presentation-brand" id="presentationBrandVerseOfDay" href="#verse-of-the-day" aria-label="Open verse of the day">
          <img class="presentation-brand-mark" src="./assets/brand-mark.png" alt="" />
          <span class="presentation-brand-copy"><span>Big Screen</span><strong>Bible</strong></span>
        </a>
        <div class="presentation-controls">
          <button class="ghost-btn" id="presentationPrev" data-tooltip="Previous verse" ${canGoBack ? "" : "disabled"}>Previous</button>
          <button class="ghost-btn" id="presentationNext" data-tooltip="Next verse" ${canGoForward ? "" : "disabled"}>Next</button>
        </div>
        <a class="presentation-about-link" href="./about.html">About</a>
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
      <div class="print-version">${translationDisplayCode(state.versions[0])}</div>
      ${lines.map(({ n, text }) => `<p><sup>${n}</sup>${escapeHtml(text)}</p>`).join("")}
      ${apiBibleAttributionMarkup([state.versions[0]], "print-attribution")}
    </section>
  `;
}

function shortcutOverlay() {
  const platformKey = navigator.platform?.toLowerCase().includes("mac") ? "Cmd" : "Ctrl";
  const shortcuts = [
    [`${platformKey} /`, "Open Help"],
    ["?", "Open Help"],
    ["P", "Open Big Screen"],
    ["F", "Toggle focus layout"],
    ["/", "Jump to reference search"],
    ["S", "Open search"],
    ["T", "Open games"],
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
            <div class="shortcut-eyebrow">Help center</div>
            <h2 id="shortcutTitle">Big Screen Bible Help</h2>
          </div>
          <button class="icon-btn" id="closeShortcuts" aria-label="Close help" data-tooltip="Close">×</button>
        </div>
        <div class="help-tour-card">
          <div>
            <strong>New here?</strong>
            <p>Take a quick guided tour of the main controls. You can come back here and restart it any time.</p>
          </div>
          <button class="primary-btn" id="startHelpTour" type="button">Take tour</button>
        </div>
        <div class="help-grid">
          <div><strong>Search</strong><span>Find a verse by reference or by remembered words.</span></div>
          <div><strong>Study</strong><span>Use notes, highlights, bookmarks, cross references, and history from the side tools.</span></div>
          <div><strong>Display</strong><span>Big Screen Mode is built for clean, full-screen Scripture display.</span></div>
          <div><strong>Games</strong><span>Practice Bible knowledge with trivia, verse order, and quick-reference games.</span></div>
        </div>
        <a class="help-about-link" href="./about.html">About Big Screen Bible</a>
        <div class="shortcut-section-title">Keyboard shortcuts</div>
        <div class="shortcut-list">
          ${shortcuts.map(([keys, label]) => `<div class="shortcut-row"><kbd>${keys}</kbd><span>${label}</span></div>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function tutorialIntro() {
  if (!state.tutorialIntroVisible || state.tutorialActive || state.shortcutsOpen) return "";
  return `
    <section class="tutorial-welcome-overlay open" role="dialog" aria-modal="true" aria-labelledby="tutorialWelcomeTitle">
      <div class="tutorial-welcome-card">
        <img class="tutorial-welcome-logo" src="./assets/brand-mark.png" alt="" />
        <div class="shortcut-eyebrow">First visit</div>
        <h2 id="tutorialWelcomeTitle">Want a quick tour?</h2>
        <p>Big Screen Bible has a few lovely corners: reading, study tools, display mode, games, themes, sharing, and highlights. The tour takes about a minute.</p>
        <div class="tutorial-actions">
          <button class="primary-btn" id="startTutorialPrompt" type="button">Start tour</button>
          <button class="ghost-btn" id="dismissTutorialPrompt" type="button">Maybe later</button>
        </div>
      </div>
    </section>
  `;
}

function tutorialOverlay() {
  if (!state.tutorialActive) return "";
  const step = currentTutorialStep();
  const steps = activeTutorialSteps();
  const stepNumber = Math.min(state.tutorialStep + 1, steps.length);
  const isLast = state.tutorialStep >= steps.length - 1;
  return `
    <section class="tutorial-overlay open" aria-live="polite">
      <div class="tutorial-spotlight" id="tutorialSpotlight" aria-hidden="true"></div>
      <article class="tutorial-card" id="tutorialCard" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
        <button class="tutorial-close" id="tutorialSkip" type="button" aria-label="Close tour">${icons.clear}</button>
        <div class="shortcut-eyebrow">Tour ${stepNumber} of ${steps.length}</div>
        <h2 id="tutorialTitle">${step.title}</h2>
        <p>${step.body}</p>
        <div class="tutorial-dots" aria-hidden="true">
          ${steps.map((_, index) => `<span class="${index === state.tutorialStep ? "active" : ""}"></span>`).join("")}
        </div>
        <div class="tutorial-actions">
          <button class="ghost-btn" id="tutorialBack" type="button" ${state.tutorialStep === 0 ? "disabled" : ""}>Back</button>
          <button class="primary-btn" id="tutorialNext" type="button">${isLast ? "Finish" : "Next"}</button>
        </div>
      </article>
    </section>
  `;
}

function bindEvents() {
  bindReaderTopButton();
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.mode !== "trivia") cleanupTriviaCelebration();
      state.mode = button.dataset.mode;
      state.headerVersionMenuOpen = false;
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
      scheduleCloudSync();
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
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("versionMenuToggle")?.addEventListener("click", () => {
    if (state.headerVersionMenuOpen) return closeHeaderVersionMenu();
    state.headerVersionMenuOpen = true;
    renderPreservingReaderScroll();
  });
  document.querySelectorAll("[data-primary-version-option]").forEach((button) => {
    button.addEventListener("click", async () => {
      const version = button.dataset.primaryVersionOption;
      if (!translationCodes.includes(version)) return;
      state.headerVersionMenuOpen = false;
      await setPrimaryVersion(version, { preserveScroll: true, keepPresentationSettings: true });
    });
  });
  document.querySelectorAll("[data-toggle-version-option]").forEach((button) => {
    button.addEventListener("click", async () => {
      const version = button.dataset.toggleVersionOption;
      if (!translationCodes.includes(version)) return;
      if (state.versions.includes(version)) {
        if (state.versions.length === 1) return showToast("Keep at least one version selected");
        state.versions = state.versions.filter((item) => item !== version);
      } else {
        if (state.versions.length >= versionLimit()) {
          return showToast(`Use up to ${versionLimit()} versions on this screen`);
        }
        state.versions.push(version);
        await loadBibleVersion(version);
        rebuildBibleData();
      }
      state.headerVersionMenuOpen = true;
      localStorage.setItem("lw_versions", JSON.stringify(state.versions));
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  document.getElementById("settingsPrimaryVersionSelect")?.addEventListener("change", async (event) => {
    await setPrimaryVersion(event.target.value, { preserveScroll: true, keepPresentationSettings: true });
  });
  document.getElementById("mobileSettingsPrimaryVersionSelect")?.addEventListener("change", async (event) => {
    await setPrimaryVersion(event.target.value, { preserveScroll: true, keepPresentationSettings: true });
  });
  document.getElementById("settingsToggle")?.addEventListener("click", () => {
    if (state.settingsOpen) return closeSettingsPopover();
    state.settingsOpen = !state.settingsOpen;
    state.settingsAnchor = "header";
    if (state.settingsOpen) state.accountOpen = false;
    renderPreservingReaderScroll();
    requestAnimationFrame(() => positionSettingsPopover("header"));
  });
  document.getElementById("settingsClose")?.addEventListener("click", closeSettingsPopover);
  document.getElementById("accountQuickButton")?.addEventListener("click", () => toggleAccountMenu());
  document.getElementById("accountPopoverClose")?.addEventListener("click", () => toggleAccountMenu(false));
  document.getElementById("mobileFloatingSettings")?.addEventListener("click", () => {
    if (state.settingsOpen) return closeSettingsPopover();
    state.settingsOpen = !state.settingsOpen;
    state.settingsAnchor = "floating";
    if (state.settingsOpen) state.accountOpen = false;
    renderPreservingReaderScroll();
    requestAnimationFrame(() => positionSettingsPopover("floating"));
  });
  document.getElementById("mobileSettingsClose")?.addEventListener("click", closeSettingsPopover);
  document.getElementById("accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event));
  document.getElementById("mobile-accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event, "mobile"));
  document.getElementById("quick-accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event, "quick"));
  document.getElementById("forgotPasswordButton")?.addEventListener("click", () => requestPasswordReset());
  document.getElementById("mobile-forgotPasswordButton")?.addEventListener("click", () => requestPasswordReset("mobile"));
  document.getElementById("quick-forgotPasswordButton")?.addEventListener("click", () => requestPasswordReset("quick"));
  document.getElementById("googleSignInButton")?.addEventListener("click", signInWithGoogle);
  document.getElementById("mobile-googleSignInButton")?.addEventListener("click", signInWithGoogle);
  document.getElementById("quick-googleSignInButton")?.addEventListener("click", signInWithGoogle);
  document.getElementById("passwordUpdateForm")?.addEventListener("submit", (event) => updateAccountPassword(event));
  document.getElementById("mobile-passwordUpdateForm")?.addEventListener("submit", (event) => updateAccountPassword(event, "mobile"));
  document.getElementById("quick-passwordUpdateForm")?.addEventListener("submit", (event) => updateAccountPassword(event, "quick"));
  document.getElementById("changePasswordButton")?.addEventListener("click", showPasswordChange);
  document.getElementById("mobile-changePasswordButton")?.addEventListener("click", showPasswordChange);
  document.getElementById("quick-changePasswordButton")?.addEventListener("click", showPasswordChange);
  document.getElementById("cancelPasswordUpdateButton")?.addEventListener("click", hidePasswordChange);
  document.getElementById("mobile-cancelPasswordUpdateButton")?.addEventListener("click", hidePasswordChange);
  document.getElementById("quick-cancelPasswordUpdateButton")?.addEventListener("click", hidePasswordChange);
  document.getElementById("syncNowButton")?.addEventListener("click", syncNowAccount);
  document.getElementById("mobile-syncNowButton")?.addEventListener("click", syncNowAccount);
  document.getElementById("quick-syncNowButton")?.addEventListener("click", syncNowAccount);
  document.getElementById("signOutButton")?.addEventListener("click", signOutAccount);
  document.getElementById("mobile-signOutButton")?.addEventListener("click", signOutAccount);
  document.getElementById("quick-signOutButton")?.addEventListener("click", signOutAccount);
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => setThemeMode(button.dataset.themeChoice));
  });
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
  document.getElementById("paragraphLayoutToggle")?.addEventListener("change", (event) => {
    state.paragraphLayout = event.target.checked;
    localStorage.setItem("lw_paragraph_layout", state.paragraphLayout ? "true" : "false");
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileParagraphLayoutToggle")?.addEventListener("change", (event) => {
    state.paragraphLayout = event.target.checked;
    localStorage.setItem("lw_paragraph_layout", state.paragraphLayout ? "true" : "false");
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("startBigScreenToggle")?.addEventListener("change", (event) => {
    state.startBigScreen = event.target.checked;
    localStorage.setItem("lw_start_big_screen", state.startBigScreen ? "true" : "false");
    scheduleCloudSync();
  });
  document.getElementById("mobileStartBigScreenToggle")?.addEventListener("change", (event) => {
    state.startBigScreen = event.target.checked;
    localStorage.setItem("lw_start_big_screen", state.startBigScreen ? "true" : "false");
    scheduleCloudSync();
  });
  document.getElementById("startVerseOfDayToggle")?.addEventListener("change", (event) => {
    state.startVerseOfDay = event.target.checked;
    localStorage.setItem("lw_start_verse_of_day", state.startVerseOfDay ? "true" : "false");
    scheduleCloudSync();
  });
  document.getElementById("mobileStartVerseOfDayToggle")?.addEventListener("change", (event) => {
    state.startVerseOfDay = event.target.checked;
    localStorage.setItem("lw_start_verse_of_day", state.startVerseOfDay ? "true" : "false");
    scheduleCloudSync();
  });
  document.getElementById("showStreakPopupToggle")?.addEventListener("change", (event) => {
    state.showStreakPopup = event.target.checked;
    localStorage.setItem("lw_show_streak_popup", state.showStreakPopup ? "true" : "false");
    scheduleCloudSync();
    if (!state.showStreakPopup) dismissStreakPopup();
  });
  document.getElementById("mobileShowStreakPopupToggle")?.addEventListener("change", (event) => {
    state.showStreakPopup = event.target.checked;
    localStorage.setItem("lw_show_streak_popup", state.showStreakPopup ? "true" : "false");
    scheduleCloudSync();
    if (!state.showStreakPopup) dismissStreakPopup();
  });
  const streakPopupElement = document.getElementById("streakPopup");
  if (streakPopupElement) {
    let streakSwipeStartX = 0;
    let streakSwipeStartY = 0;
    streakPopupElement.addEventListener("pointerdown", (event) => {
      streakSwipeStartX = event.clientX;
      streakSwipeStartY = event.clientY;
    });
    streakPopupElement.addEventListener("pointerup", (event) => {
      const deltaX = event.clientX - streakSwipeStartX;
      const deltaY = event.clientY - streakSwipeStartY;
      if (Math.abs(deltaX) > 42 || Math.abs(deltaY) > 42) dismissStreakPopup();
    });
    streakPopupElement.addEventListener("click", dismissStreakPopup);
    streakPopupElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        dismissStreakPopup();
      }
    });
  }
  document.getElementById("decreaseText")?.addEventListener("click", () => adjustTextScale(-0.1));
  document.getElementById("increaseText")?.addEventListener("click", () => adjustTextScale(0.1));
  document.getElementById("resetText")?.addEventListener("click", resetTextScale);
  document.getElementById("mobileDecreaseText")?.addEventListener("click", () => adjustTextScale(-0.1));
  document.getElementById("mobileIncreaseText")?.addEventListener("click", () => adjustTextScale(0.1));
  document.getElementById("mobileResetText")?.addEventListener("click", resetTextScale);
  document.getElementById("shortcutsButton")?.addEventListener("click", () => toggleShortcuts(true));
  document.getElementById("closeShortcuts")?.addEventListener("click", () => toggleShortcuts(false));
  document.getElementById("startHelpTour")?.addEventListener("click", startTutorial);
  document.querySelector(".shortcut-overlay")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("shortcut-overlay")) toggleShortcuts(false);
  });
  document.getElementById("startTutorialPrompt")?.addEventListener("click", startTutorial);
  document.getElementById("dismissTutorialPrompt")?.addEventListener("click", dismissTutorialIntro);
  document.getElementById("tutorialNext")?.addEventListener("click", advanceTutorial);
  document.getElementById("tutorialBack")?.addEventListener("click", retreatTutorial);
  document.getElementById("tutorialSkip")?.addEventListener("click", finishTutorial);
  document.getElementById("focusToggle")?.addEventListener("click", toggleFocusMode);
  document.getElementById("verseNavCollapseToggle")?.addEventListener("click", toggleVerseNavCollapsed);
  document.getElementById("footerCollapseToggle")?.addEventListener("click", toggleFooterCollapsed);
  document.getElementById("mobileControlsToggle")?.addEventListener("click", toggleMobileControls);
  document.getElementById("mobileFocusToggle")?.addEventListener("click", toggleFocusMode);
  document.getElementById("brandVerseOfDay")?.addEventListener("click", openVerseOfDay);
  document.getElementById("presentationBrandVerseOfDay")?.addEventListener("click", (event) => {
    event.preventDefault();
    openVerseOfDay({ mode: "big" });
  });
  document.getElementById("exitFocusInline")?.addEventListener("click", toggleFocusMode);
  document.getElementById("closeLibrary")?.addEventListener("click", closeLibrary);
  document.querySelectorAll("[data-trivia-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      cleanupTriviaCelebration();
      state.triviaGameType = button.dataset.triviaMode || "trivia";
      state.triviaGame = null;
      if (state.triviaGameType === "reference-rush") {
        state.triviaDifficulty = "Easy";
        localStorage.setItem("lw_trivia_difficulty", state.triviaDifficulty);
      }
      if (state.triviaGameType === "book-sprint") {
        state.triviaCount = 5;
        localStorage.setItem("lw_trivia_count", String(state.triviaCount));
      } else {
        state.triviaCount = normalizedTriviaCount(state.triviaGameType, state.triviaCount);
      }
      localStorage.setItem("lw_trivia_game_type", state.triviaGameType);
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  document.getElementById("triviaCategorySelect")?.addEventListener("change", (event) => {
    state.triviaCategory = event.target.value;
    localStorage.setItem("lw_trivia_category", state.triviaCategory);
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaDifficultySelect")?.addEventListener("change", (event) => {
    state.triviaDifficulty = event.target.value;
    localStorage.setItem("lw_trivia_difficulty", state.triviaDifficulty);
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaCountSelect")?.addEventListener("change", (event) => {
    state.triviaCount = normalizedTriviaCount(state.triviaGameType, Number(event.target.value) || 10);
    localStorage.setItem("lw_trivia_count", String(state.triviaCount));
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("bookSprintSoundToggle")?.addEventListener("click", () => {
    state.bookSprintSound = !state.bookSprintSound;
    localStorage.setItem("lw_book_sprint_sound", state.bookSprintSound ? "true" : "false");
    if (state.bookSprintSound) primeBookSprintAudio();
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("referenceRushTimerToggle")?.addEventListener("click", () => {
    state.referenceRushTimed = !state.referenceRushTimed;
    localStorage.setItem("lw_reference_rush_timed", state.referenceRushTimed ? "true" : "false");
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("startTriviaGame")?.addEventListener("click", startTriviaGame);
  document.getElementById("restartTriviaGame")?.addEventListener("click", startTriviaGame);
  document.getElementById("exitTriviaGame")?.addEventListener("click", exitTriviaGame);
  document.getElementById("newTriviaGame")?.addEventListener("click", () => {
    cleanupTriviaCelebration();
    state.triviaGame = null;
    renderPreservingReaderScroll();
  });
  document.getElementById("nextTriviaQuestion")?.addEventListener("click", nextTriviaQuestion);
  document.getElementById("openTriviaReference")?.addEventListener("click", openTriviaReference);
  document.querySelectorAll("[data-trivia-answer]").forEach((button) => {
    button.addEventListener("click", () => answerTriviaQuestion(button.dataset.triviaAnswer));
  });
  document.getElementById("triviaHint")?.addEventListener("click", toggleTriviaHintMenu);
  document.getElementById("closeTriviaHints")?.addEventListener("click", toggleTriviaHintMenu);
  document.querySelectorAll("[data-trivia-hint]").forEach((button) => {
    button.addEventListener("click", () => useTriviaHint(button.dataset.triviaHint));
  });
  document.querySelectorAll("[data-reference-answer]").forEach((button) => {
    button.addEventListener("click", () => answerReferenceRush(button.dataset.referenceAnswer));
  });
  document.getElementById("referenceRushHint")?.addEventListener("click", toggleReferenceRushHintMenu);
  document.getElementById("closeReferenceRushHints")?.addEventListener("click", toggleReferenceRushHintMenu);
  document.querySelectorAll("[data-reference-hint]").forEach((button) => {
    button.addEventListener("click", () => useReferenceRushHint(button.dataset.referenceHint));
  });
  document.querySelectorAll("[data-book-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (shouldSuppressOrderingClick()) return;
      selectBookSprintBook(button.dataset.bookAnswer);
    });
  });
  document.querySelectorAll("[data-book-selected]").forEach((button) => {
    button.addEventListener("click", () => {
      if (shouldSuppressOrderingClick()) return;
      removeBookSprintBook(button.dataset.bookSelected);
    });
  });
  document.querySelectorAll("[data-book-drag]:not(:disabled)").forEach((button) => {
    button.addEventListener("pointerdown", (event) => beginOrderingDrag(event, button, "book-sprint"));
  });
  document.querySelectorAll("[data-who-answer]").forEach((button) => {
    button.addEventListener("click", () => answerWhoSaidIt(button.dataset.whoAnswer));
  });
  document.querySelectorAll("[data-order-fragment]").forEach((button) => {
    button.addEventListener("click", () => {
      if (shouldSuppressOrderingClick()) return;
      selectVerseOrderFragment(button.dataset.orderFragment);
    });
  });
  document.querySelectorAll("[data-order-selected]").forEach((button) => {
    button.addEventListener("click", () => {
      if (shouldSuppressOrderingClick()) return;
      removeVerseOrderFragment(button.dataset.orderSelected);
    });
  });
  document.querySelectorAll("[data-order-drag]:not(:disabled)").forEach((button) => {
    button.addEventListener("pointerdown", (event) => beginOrderingDrag(event, button, "verse-order"));
  });
  document.getElementById("resetVerseOrderPuzzle")?.addEventListener("click", resetVerseOrderPuzzle);
  document.getElementById("checkVerseOrder")?.addEventListener("click", checkVerseOrder);
  document.getElementById("resetBookSprintPuzzle")?.addEventListener("click", resetBookSprintPuzzle);
  document.getElementById("checkBookSprint")?.addEventListener("click", checkBookSprint);
  ["chapterSelect", "chapterSelectInline"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.reference = event.target.value;
      state.verse = currentChapter().verses[0].n;
      state.selectedVerses = [];
      state.isVerseOfDayActive = false;
      render();
    });
  });
  ["verseSelect", "verseSelectInline"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.verse = Number(event.target.value);
      state.isVerseOfDayActive = false;
      render();
    });
  });
  document.getElementById("mobileChapterSelectInline")?.addEventListener("click", (event) => {
    openMobileVerseNavMenu(event.currentTarget, "chapter");
  });
  document.getElementById("mobileVerseSelectInline")?.addEventListener("click", (event) => {
    openMobileVerseNavMenu(event.currentTarget, "verse");
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
  document.querySelectorAll("[data-verse-actions]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openVerseActionMenu(button);
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
      event.stopPropagation();
      const verseNumber = Number(row.dataset.verse);
      state.verse = verseNumber;
      state.isVerseOfDayActive = false;
      toggleVerseSelection(verseNumber, event.shiftKey);
      renderPreservingReaderScroll();
    });
  });
  document.querySelectorAll("[data-annotation-shelf]").forEach((details) => {
    details.addEventListener("toggle", () => {
      syncOpenStateList("openAnnotationShelves", details.dataset.annotationShelf, details.open);
    });
  });
  document.querySelectorAll("[data-annotation-group]").forEach((details) => {
    details.addEventListener("toggle", () => {
      markAnnotationGroupCollectionTouched(details.dataset.annotationGroup);
      syncOpenStateList("openAnnotationGroups", details.dataset.annotationGroup, details.open);
    });
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => {
      captureAnnotationOpenState();
      const libraryScroll = captureLibraryScroll();
      const focusVerse = button.dataset.gotoVerse ? Number(button.dataset.gotoVerse) : NaN;
      gotoReference(button.dataset.goto, {
        focusVerse,
        libraryScroll,
      });
    });
  });
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
    if (state.presentationSettingsOpen) return closePresentationSettings();
    state.presentationSettingsOpen = true;
    render();
  });
  document.getElementById("presentationSettingsClose")?.addEventListener("click", closePresentationSettings);
  document.getElementById("presentationHelpButton")?.addEventListener("click", () => {
    state.shortcutsOpen = true;
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
  document.getElementById("prevChapterInline")?.addEventListener("click", () => moveChapter(-1));
  document.getElementById("nextChapterInline")?.addEventListener("click", () => moveChapter(1));
  document.getElementById("bookmarkBtn")?.addEventListener("click", toggleBookmark);
  document.getElementById("panelBookmarkToggle")?.addEventListener("click", toggleBookmark);
  document.getElementById("noteBtn")?.addEventListener("click", () => activateWorkspace("Annotations"));
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
  const customHighlightInput = document.getElementById("customHighlightColor");
  customHighlightInput?.addEventListener("input", (event) => {
    const color = normalizeHighlightColor(event.target.value);
    if (!color) return;
    state.customHighlightColor = color;
    localStorage.setItem("lw_custom_highlight_color", color);
    event.target.closest(".highlight-custom-swatch")?.style.setProperty("--custom-highlight-color", color);
  });
  customHighlightInput?.addEventListener("change", (event) => {
    const color = normalizeHighlightColor(event.target.value);
    if (color) applyHighlight(color);
  });
  document.getElementById("printPage")?.addEventListener("click", printSelectedPassage);
  document.getElementById("closePresentation")?.addEventListener("click", () => {
    returnFromPresentationToBible();
  });
  window.onkeydown = handleGlobalShortcuts;
}

function returnFromPresentationToBible() {
  clearTimeout(presentationControlsTimer);
  state.mode = "reader";
  state.presentationSearchOpen = false;
  state.presentationSettingsOpen = false;
  state.presentationControlsVisible = true;
  state.pendingVerseFocus = true;
  render();
}

async function setPrimaryVersion(version, options = {}) {
  if (!translationCodes.includes(version)) return;
  state.versions = [version, ...state.versions.filter((item) => item !== version)];
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
  scheduleCloudSync();
  if (isRemoteTranslation(version)) {
    await loadBibleVersion("BSB");
    rebuildBibleData();
    await loadBibleVersion(version);
  } else {
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
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function setThemeMode(mode) {
  if (mode === "system") return resetThemeToSystem();
  if (!["light", "dark"].includes(mode)) return;
  state.theme = mode;
  state.themePreset = savedThemePreset(state.theme);
  localStorage.setItem("lw_theme", state.theme);
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function resetThemeToSystem() {
  localStorage.removeItem("lw_theme");
  state.theme = savedTheme();
  state.themePreset = savedThemePreset(state.theme);
  scheduleCloudSync();
  showToast("Following system theme");
  renderPreservingReaderScroll();
}

function setPresentationTheme(theme) {
  if (!presentationThemeCodes.includes(theme)) return;
  state.presentationTheme = theme;
  localStorage.setItem("lw_presentation_theme", theme);
  scheduleCloudSync();
  state.presentationSettingsOpen = false;
  render();
}

function normalizedTriviaText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function triviaQuestionIsPlayable(question) {
  if (!question?.question || !question.answer || !Array.isArray(question.choices)) return false;
  if (/^At .+, what answer fits this clue:/i.test(question.question)) return false;
  if (new Set(question.choices.map(normalizedTriviaText)).size < 4) return false;
  const prompt = ` ${normalizedTriviaText(question.question)} `;
  const answer = normalizedTriviaText(question.answer);
  const referenceBook = String(question.answer).match(/^(.+?)\s+\d+:\d/)?.[1];
  if (/^Which reference fits this clue:/i.test(question.question)
    && referenceBook
    && prompt.includes(` ${normalizedTriviaText(referenceBook)} `)) return false;
  return !answer || !prompt.includes(` ${answer} `);
}

function triviaQuestions() {
  const questions = Array.isArray(window.bibleTriviaQuestions) ? window.bibleTriviaQuestions : [];
  return questions.filter(triviaQuestionIsPlayable);
}

function normalizedTriviaCategory(category) {
  return ["Old Testament", "New Testament"].includes(category) ? "Bible Survey" : category;
}

function triviaCategories(questions = triviaQuestions()) {
  return ["Mixed", ...Array.from(new Set(questions.map((question) => normalizedTriviaCategory(question.category)).filter(Boolean))).sort((a, b) => a.localeCompare(b))];
}

function triviaDifficulties() {
  return ["All", "Easy", "Medium", "Hard"];
}

function triviaPool() {
  return triviaQuestions().filter((question) => {
    const categoryMatches = state.triviaCategory === "Mixed" || normalizedTriviaCategory(question.category) === state.triviaCategory;
    const difficultyMatches = state.triviaDifficulty === "All" || question.difficulty === state.triviaDifficulty.toLowerCase();
    return categoryMatches && difficultyMatches;
  });
}

function startTriviaGame() {
  cleanupTriviaCelebration();
  if (state.triviaGameType === "verse-order") return startVerseOrderGame();
  if (state.triviaGameType === "reference-rush") return startReferenceRushGame();
  if (state.triviaGameType === "book-sprint") return startBookSprintGame();
  if (state.triviaGameType === "who-said-it") return startWhoSaidItGame();
  const pool = shuffleItems(triviaPool());
  if (!pool.length) {
    showToast("No trivia questions available for that category yet");
    return;
  }
  const questionCount = Math.min(normalizedTriviaCount("trivia", state.triviaCount), pool.length);
  state.triviaGame = {
    type: "trivia",
    category: state.triviaCategory,
    difficulty: state.triviaDifficulty,
    questions: pool.slice(0, questionCount).map((question) => ({
      ...question,
      choices: shuffleItems(question.choices),
      hintMenuOpen: false,
      hintUsed: "",
      hintMessage: "",
      eliminatedChoices: [],
    })),
    index: 0,
    score: 0,
    selectedAnswer: null,
    usedHintTypes: [],
    complete: false,
  };
  renderPreservingReaderScroll();
}

function startReferenceRushGame() {
  const pools = referenceRushPools();
  const puzzles = referenceRushPuzzles(pools, state.triviaDifficulty, normalizedTriviaCount("reference-rush", state.triviaCount));
  if (puzzles.length < 4) {
    showToast("Not enough verses available for Reference Rush yet");
    return;
  }
  const timed = state.referenceRushTimed;
  const startedAt = Date.now();
  const durationMs = referenceRushDurationMs(state.triviaDifficulty, puzzles.length);
  if (timed) primeReferenceRushAudio();
  state.triviaGame = {
    type: "reference-rush",
    version: referenceRushVersion(),
    difficulty: state.triviaDifficulty,
    puzzles,
    index: 0,
    score: 0,
    usedHintTypes: [],
    timed,
    durationMs,
    startedAt: timed ? startedAt : null,
    deadlineAt: timed ? startedAt + durationMs : null,
    finishedAt: null,
    timedOut: false,
    referenceRushLastTick: null,
    complete: false,
  };
  renderPreservingReaderScroll();
}

const referenceRushEasyRefs = new Set([
  "Genesis 1:1", "Genesis 1:27", "Genesis 9:13", "Exodus 20:3", "Exodus 20:12",
  "Numbers 6:24", "Deuteronomy 6:5", "Joshua 1:9", "Ruth 1:16", "1 Samuel 16:7",
  "Psalm 1:1", "Psalm 23:1", "Psalm 27:1", "Psalm 37:4", "Psalm 46:10", "Psalm 51:10",
  "Psalm 91:1", "Psalm 119:105", "Psalm 121:1", "Proverbs 3:5", "Proverbs 15:1",
  "Ecclesiastes 3:1", "Isaiah 9:6", "Isaiah 40:31", "Isaiah 41:10", "Jeremiah 29:11",
  "Micah 6:8", "Matthew 5:14", "Matthew 6:33", "Matthew 7:12", "Matthew 11:28",
  "Matthew 22:37", "Matthew 28:19", "Luke 2:11", "John 1:1", "John 3:16", "John 8:32",
  "John 10:10", "John 11:25", "John 14:6", "John 14:27", "Acts 1:8", "Romans 3:23",
  "Romans 6:23", "Romans 8:28", "Romans 12:2", "1 Corinthians 13:4", "2 Corinthians 5:17",
  "Galatians 5:22", "Ephesians 2:8", "Ephesians 6:11", "Philippians 4:4", "Philippians 4:13",
  "Philippians 4:19", "Colossians 3:23", "1 Thessalonians 5:16", "2 Timothy 1:7",
  "Hebrews 11:1", "Hebrews 12:2", "James 1:5", "1 Peter 5:7", "1 John 1:9", "1 John 4:7",
  "Revelation 3:20", "Revelation 21:4",
]);

const referenceRushMediumRefs = new Set([
  "Genesis 3:15", "Genesis 4:9", "Genesis 15:5", "Genesis 22:8", "Genesis 50:20",
  "Exodus 3:14", "Exodus 14:14", "Exodus 15:2", "Joshua 24:15", "Judges 6:12",
  "1 Samuel 3:10", "1 Samuel 17:45", "2 Samuel 6:14", "1 Kings 18:21", "Esther 4:14",
  "Job 19:25", "Psalm 8:4", "Psalm 34:18", "Psalm 42:1", "Psalm 90:12",
  "Psalm 103:12", "Psalm 118:24", "Psalm 127:1", "Psalm 133:1", "Psalm 139:14",
  "Proverbs 16:9", "Proverbs 17:17", "Proverbs 27:17", "Ecclesiastes 4:9", "Ecclesiastes 12:13",
  "Isaiah 6:8", "Isaiah 53:5", "Jeremiah 1:5", "Ezekiel 37:5", "Daniel 3:17",
  "Daniel 6:22", "Jonah 2:2", "Matthew 4:19", "Matthew 5:44", "Matthew 6:9",
  "Matthew 16:16", "Matthew 18:20", "Matthew 25:40", "Mark 10:14", "Luke 1:38",
  "Luke 2:14", "Luke 10:27", "Luke 15:20", "Luke 19:10", "John 2:5",
  "John 6:35", "John 13:35", "John 15:5", "Acts 9:4", "Acts 16:31",
  "Acts 17:11", "Romans 5:8", "Romans 10:9", "1 Corinthians 10:13", "2 Corinthians 12:9",
  "Galatians 2:20", "Ephesians 4:32", "Philippians 2:5", "Colossians 3:2", "1 Thessalonians 5:18",
  "1 Timothy 4:12", "2 Timothy 3:16", "Hebrews 4:12", "James 1:22", "James 2:17",
  "1 Peter 3:15", "1 John 4:19", "Revelation 22:13",
]);

function referenceRushDifficultyDescription(difficulty) {
  if (difficulty === "Easy") return "Easy · Choose the Bible book from three options using a familiar verse.";
  if (difficulty === "Medium") return "Medium · Choose the full reference from four clue-friendly passages.";
  if (difficulty === "Hard") return "Hard · Pinpoint the reference among close choices from the same book.";
  return "Progressive · Begin by finding books, then finish with exact-reference challenges.";
}

function referenceRushVersion() {
  return state.versions.find(isBundledTranslation) || "BSB";
}

function referenceRushPools() {
  const version = referenceRushVersion();
  const all = Object.entries(bibleData).flatMap(([chapterKey, chapter]) => {
    const book = bookFromChapterKey(chapterKey);
    const testament = oldTestamentBooks.includes(book) ? "old" : "new";
    const chapterNumber = Number(chapterKey.match(/(\d+)$/)?.[1]) || 0;
    return (chapter.verses || []).map((verse) => {
      const text = cleanVerseOrderText(getVerseText(verse, version));
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return {
        reference: `${chapterKey}:${verse.n}`,
        chapterKey,
        book,
        testament,
        chapterNumber,
        verseNumber: verse.n,
        version,
        text,
        wordCount,
      };
    });
  }).filter((item) => {
    return item.wordCount >= 7 && item.wordCount <= 45 && item.book;
  });
  const easy = all.filter((item) => referenceRushEasyRefs.has(item.reference));
  const medium = all.filter((item) => referenceRushMediumRefs.has(item.reference));
  const hardTriviaRefs = new Set(triviaQuestions()
    .filter((question) => question.difficulty === "hard" && /^[1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)*\s\d+:\d+$/.test(question.reference || ""))
    .map((question) => question.reference));
  let hard = all.filter((item) => {
    return hardTriviaRefs.has(item.reference)
      && !referenceRushEasyRefs.has(item.reference)
      && !referenceRushMediumRefs.has(item.reference);
  });
  if (hard.length < 20) {
    hard = all.filter((item) => !referenceRushEasyRefs.has(item.reference) && !referenceRushMediumRefs.has(item.reference));
  }
  return { all, easy, medium, hard };
}

function referenceRushAvailableCount() {
  const pools = referenceRushPools();
  if (state.triviaDifficulty === "All") return pools.easy.length + pools.medium.length + pools.hard.length;
  return pools[state.triviaDifficulty.toLowerCase()]?.length || 0;
}

function referenceRushPuzzles(pools, difficulty, requestedCount) {
  const count = Math.max(1, requestedCount);
  if (difficulty !== "All") {
    const level = difficulty.toLowerCase();
    const pool = shuffleItems(pools[level]);
    return pool.slice(0, Math.min(count, pool.length)).map((item) => createReferenceRushPuzzle(item, pools, level));
  }
  const easyCount = Math.ceil(count / 3);
  const mediumCount = Math.ceil((count - easyCount) / 2);
  const hardCount = count - easyCount - mediumCount;
  return [
    ...shuffleItems(pools.easy).slice(0, easyCount).map((item) => createReferenceRushPuzzle(item, pools, "easy")),
    ...shuffleItems(pools.medium).slice(0, mediumCount).map((item) => createReferenceRushPuzzle(item, pools, "medium")),
    ...shuffleItems(pools.hard).slice(0, hardCount).map((item) => createReferenceRushPuzzle(item, pools, "hard")),
  ];
}

function createReferenceRushPuzzle(item, pools, difficulty) {
  const distractors = referenceRushDistractors(item, pools, difficulty);
  const correctAnswer = difficulty === "easy" ? item.book : item.reference;
  const choices = difficulty === "easy"
    ? shuffleItems([item.book, ...distractors.map((choice) => choice.book)])
    : shuffleItems([item.reference, ...distractors.map((choice) => choice.reference)]);
  return {
    ...item,
    difficulty: `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`,
    correctAnswer,
    choices,
    selectedReference: null,
    hintMenuOpen: false,
    hintUsed: "",
    hintMessage: "",
    eliminatedChoices: [],
    learningNote: referenceRushLearningNote(item),
    scholarHint: referenceRushScholarHint(item),
    contextPreview: referenceRushContextPreview(item),
    higherLowerHint: referenceRushHigherLowerHint(item, choices),
  };
}

function referenceRushDistractors(item, pools, difficulty) {
  const levelPool = pools[difficulty];
  const otherItems = levelPool.filter((candidate) => candidate.reference !== item.reference);
  let candidates = otherItems.slice();
  if (difficulty === "easy") {
    candidates = uniqueBookChoices(shuffleItems(otherItems.filter((candidate) => candidate.book !== item.book)), 2);
    return candidates;
  } else if (difficulty === "medium") {
    const topics = referenceRushTopics(item.text);
    candidates = otherItems
      .filter((candidate) => candidate.book !== item.book)
      .sort((a, b) => referenceRushTopicScore(b, topics) - referenceRushTopicScore(a, topics));
  } else if (difficulty === "hard") {
    candidates = pools.all
      .filter((candidate) => candidate.book === item.book && candidate.reference !== item.reference)
      .sort((a, b) => referenceRushReferenceDistance(item, a) - referenceRushReferenceDistance(item, b));
  }
  const candidateWindow = difficulty === "medium" ? candidates.slice(0, 18) : candidates.slice(0, 20);
  const picked = uniqueReferenceChoices(shuffleItems(candidateWindow), 3);
  if (picked.length < 3) {
    picked.push(...uniqueReferenceChoices(shuffleItems(otherItems), 3 - picked.length, new Set([item.reference, ...picked.map((choice) => choice.reference)])));
  }
  return picked.slice(0, 3);
}

function uniqueBookChoices(items, limit) {
  const booksSeen = new Set();
  const choices = [];
  items.forEach((item) => {
    if (choices.length >= limit || booksSeen.has(item.book)) return;
    booksSeen.add(item.book);
    choices.push(item);
  });
  return choices;
}

function referenceRushTopics(text) {
  const topicPatterns = {
    love: /\blove|loving|beloved\b/i,
    faith: /\bfaith|believ|trust\b/i,
    prayer: /\bpray|ask|seek\b/i,
    wisdom: /\bwisdom|wise|understand|knowledge\b/i,
    courage: /\bfear|afraid|courage|strong\b/i,
    creation: /\bcreat|heaven|earth|light\b/i,
    salvation: /\bsav|redeem|forgiv|sin|grace\b/i,
    shepherd: /\bshepherd|sheep|flock\b/i,
    spirit: /\bspirit|fruit\b/i,
    life: /\blife|death|resurrection|eternal\b/i,
    word: /\bword|scripture|law|command\b/i,
    peace: /\bpeace|rest|comfort\b/i,
  };
  return Object.entries(topicPatterns).filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic);
}

function referenceRushTopicScore(item, topics) {
  const candidateTopics = referenceRushTopics(item.text);
  return candidateTopics.filter((topic) => topics.includes(topic)).length;
}

function referenceRushReferenceDistance(item, candidate) {
  return Math.abs(item.chapterNumber - candidate.chapterNumber) * 100 + Math.abs(Number(item.verseNumber) - Number(candidate.verseNumber));
}

function referenceRushLearningNote(item) {
  const exactQuestion = triviaQuestions().find((question) => question.reference === item.reference && question.explanation);
  if (exactQuestion) return exactQuestion.explanation;
  const contexts = {
    old: "the Old Testament story, poetry, or prophecy",
    new: "the New Testament account of Jesus and the early church",
  };
  return `This passage comes from ${item.book}, part of ${contexts[item.testament]}.`;
}

function referenceRushHintOptions(puzzle) {
  const options = [];
  if (puzzle.choices.length >= 3) {
    options.push({
      type: "eliminate",
      label: "Eliminate One",
      description: "Remove one incorrect answer.",
    });
  }
  if (puzzle.choices.length >= 4) {
    options.push({
      type: "fifty-fifty",
      label: "50/50",
      description: "Leave the correct answer and one wrong answer.",
    });
  }
  if (puzzle.higherLowerHint) {
    options.push({
      type: "higher-lower",
      label: "Higher or Lower",
      description: "Get a clue about the chapter or verse number.",
    });
  }
  if (puzzle.scholarHint) {
    options.push({
      type: "scholar",
      label: "Bible Scholar",
      description: "Reveal a literary or historical clue.",
    });
  }
  if (puzzle.contextPreview) {
    options.push({
      type: "context",
      label: "Context Preview",
      description: "Read a nearby verse without its reference.",
    });
  }
  return options;
}

function referenceRushHintLabel(type) {
  return {
    eliminate: "Eliminate One",
    "fifty-fifty": "50/50",
    "higher-lower": "Higher or Lower",
    scholar: "Bible Scholar",
    context: "Context Preview",
  }[type] || "Hint";
}

function referenceRushScholarHint(item) {
  const exactQuestion = triviaQuestions().find((question) => {
    return question.reference === item.reference
      && question.explanation
      && question.explanation.trim() !== item.text.trim();
  });
  if (exactQuestion) return exactQuestion.explanation;
  if (["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"].includes(item.book)) {
    return "Look within the Torah—the Bible’s first five books, which introduce creation, covenant, and Israel’s law.";
  }
  if (["Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Songs"].includes(item.book)) {
    return item.book === "Psalm"
      ? "This comes from Israel’s collection of songs and prayers."
      : "This comes from the Bible’s wisdom and poetry writings.";
  }
  if (["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel"].includes(item.book)) {
    return "This comes from one of the Major Prophets.";
  }
  if (verseOfDayCategory(item.book) === "prophet") {
    return "This comes from one of the twelve Minor Prophets.";
  }
  if (["Matthew", "Mark", "Luke", "John"].includes(item.book)) {
    return "This appears in one of the four Gospel accounts of Jesus.";
  }
  if (item.book === "Acts") {
    return "This comes from the history of the earliest Christians after Jesus’ resurrection.";
  }
  if (["1 Timothy", "2 Timothy", "Titus"].includes(item.book)) {
    return "This comes from one of Paul’s pastoral letters to a church leader.";
  }
  if (["Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "Philemon"].includes(item.book)) {
    return "This comes from one of Paul’s letters to an early Christian community or coworker.";
  }
  if (item.book === "Revelation") {
    return "This comes from the New Testament’s apocalyptic vision of Christ’s victory.";
  }
  if (newTestamentBooks.includes(item.book)) {
    return "This comes from one of the New Testament’s general letters.";
  }
  return "This comes from the Old Testament books that tell Israel’s history.";
}

function referenceRushContextPreview(item) {
  const chapter = bibleData[item.chapterKey];
  const verses = chapter?.verses || [];
  const verseIndex = verses.findIndex((verse) => Number(verse.n) === Number(item.verseNumber));
  if (verseIndex < 0) return "";
  const neighbor = verses[verseIndex - 1] || verses[verseIndex + 1];
  if (!neighbor) return "";
  const text = cleanVerseOrderText(getVerseText(neighbor, item.version));
  if (!text) return "";
  const direction = verses[verseIndex - 1] ? "The preceding verse says" : "The following verse says";
  return `${direction}: ${text}`;
}

function referenceRushHigherLowerHint(item, choices) {
  const parsedChoices = choices.map((choice) => {
    const match = String(choice).match(/^(.+)\s(\d+):(\d+)$/);
    return match ? { choice, book: match[1], chapter: Number(match[2]), verse: Number(match[3]) } : null;
  }).filter(Boolean);
  if (parsedChoices.length !== choices.length || new Set(parsedChoices.map((choice) => choice.book)).size !== 1) return "";
  const correct = parsedChoices.find((choice) => choice.choice === item.reference);
  if (!correct) return "";
  const chapterValues = new Set(parsedChoices.map((choice) => choice.chapter));
  if (chapterValues.size > 1) {
    return referenceRushNumberHint(parsedChoices.map((choice) => choice.chapter), correct.chapter, "chapter");
  }
  return referenceRushNumberHint(parsedChoices.map((choice) => choice.verse), correct.verse, "verse");
}

function referenceRushNumberHint(values, correctValue, label) {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
  if (uniqueValues.length < 2) return "";
  const clues = uniqueValues.flatMap((threshold) => {
    const results = [];
    if (correctValue < threshold) {
      results.push({
        text: `The correct ${label} number is lower than ${threshold}.`,
        remaining: values.filter((value) => value < threshold).length,
      });
    }
    if (correctValue > threshold) {
      results.push({
        text: `The correct ${label} number is higher than ${threshold}.`,
        remaining: values.filter((value) => value > threshold).length,
      });
    }
    return results;
  }).filter((clue) => clue.remaining > 0 && clue.remaining < values.length);
  clues.sort((a, b) => Math.abs(a.remaining - values.length / 2) - Math.abs(b.remaining - values.length / 2));
  return clues[0]?.text || "";
}

function uniqueReferenceChoices(items, limit, seen = new Set()) {
  const choices = [];
  items.forEach((item) => {
    if (choices.length >= limit || seen.has(item.reference)) return;
    seen.add(item.reference);
    choices.push(item);
  });
  return choices;
}

function bookFromChapterKey(chapterKey) {
  return books
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((book) => chapterKey.startsWith(`${book} `)) || "";
}

function startBookSprintGame() {
  const puzzleCount = normalizedTriviaCount("book-sprint", state.triviaCount);
  const target = savedBookSprintBest(state.triviaDifficulty, puzzleCount);
  if (target) primeBookSprintAudio();
  state.triviaGame = {
    type: "book-sprint",
    difficulty: state.triviaDifficulty,
    puzzles: Array.from({ length: puzzleCount }, createBookSprintPuzzle),
    index: 0,
    score: 0,
    startedAt: Date.now(),
    finishedAt: null,
    bookSprintBest: null,
    bookSprintNewBest: false,
    bookSprintBeatBest: false,
    bookSprintHadPrevious: Boolean(target),
    bookSprintTarget: target,
    bookSprintLastTick: null,
    bookSprintBestRecorded: false,
    complete: false,
  };
  renderPreservingReaderScroll();
}

function createBookSprintPuzzle() {
  const size = state.triviaDifficulty === "Hard" ? 7 : state.triviaDifficulty === "Medium" ? 6 : 5;
  const start = Math.floor(Math.random() * (books.length - size + 1));
  const bookSet = books.slice(start, start + size);
  return {
    books: bookSet,
    shuffledBooks: shuffleItems(bookSet),
    selectedBooks: [],
    answered: false,
    correct: false,
    lastAttemptIncorrect: false,
  };
}

const whoSaidItQuestions = [
  { difficulty: "easy", quote: "Here I am. Send me!", answer: "Isaiah", choices: ["Isaiah", "Jeremiah", "Samuel", "Moses"], reference: "Isaiah 6:8", explanation: "Isaiah responded to God's call with willingness." },
  { difficulty: "easy", quote: "Your people shall be my people, and your God my God.", answer: "Ruth", choices: ["Ruth", "Naomi", "Esther", "Hannah"], reference: "Ruth 1:16", explanation: "Ruth spoke these words to Naomi." },
  { difficulty: "easy", quote: "I am the way and the truth and the life.", answer: "Jesus", choices: ["Jesus", "Peter", "Paul", "John"], reference: "John 14:6", explanation: "Jesus said this to His disciples." },
  { difficulty: "easy", quote: "You are the Christ, the Son of the living God.", answer: "Peter", choices: ["Peter", "John", "Thomas", "Andrew"], reference: "Matthew 16:16", explanation: "Peter confessed Jesus as the Christ." },
  { difficulty: "easy", quote: "Speak, LORD, for Your servant is listening.", answer: "Samuel", choices: ["Samuel", "Eli", "David", "Solomon"], reference: "1 Samuel 3:9", explanation: "Eli taught Samuel to answer God's call this way." },
  { difficulty: "easy", quote: "My Lord and my God!", answer: "Thomas", choices: ["Thomas", "Peter", "John", "Philip"], reference: "John 20:28", explanation: "Thomas said this after seeing the risen Jesus." },
  { difficulty: "medium", quote: "As for me and my house, we will serve the LORD.", answer: "Joshua", choices: ["Joshua", "Moses", "Caleb", "Gideon"], reference: "Joshua 24:15", explanation: "Joshua called Israel to covenant faithfulness." },
  { difficulty: "medium", quote: "Create in me a clean heart, O God.", answer: "David", choices: ["David", "Solomon", "Asaph", "Moses"], reference: "Psalm 51:10", explanation: "David prayed this after his sin was exposed." },
  { difficulty: "medium", quote: "Vanity of vanities, says the Teacher.", answer: "Solomon", choices: ["Solomon", "Job", "David", "Agur"], reference: "Ecclesiastes 1:2", explanation: "Ecclesiastes is traditionally associated with Solomon's wisdom." },
  { difficulty: "medium", quote: "Let it be to me according to your word.", answer: "Mary", choices: ["Mary", "Elizabeth", "Anna", "Martha"], reference: "Luke 1:38", explanation: "Mary responded faithfully to Gabriel's announcement." },
  { difficulty: "medium", quote: "Lord, to whom shall we go? You have the words of eternal life.", answer: "Peter", choices: ["Peter", "John", "Andrew", "James"], reference: "John 6:68", explanation: "Peter answered when many disciples turned away." },
  { difficulty: "medium", quote: "Believe in the Lord Jesus, and you will be saved.", answer: "Paul and Silas", choices: ["Paul and Silas", "Peter and John", "Barnabas and Mark", "Aquila and Priscilla"], reference: "Acts 16:31", explanation: "Paul and Silas answered the Philippian jailer." },
  { difficulty: "hard", quote: "Am I my brother's keeper?", answer: "Cain", choices: ["Cain", "Esau", "Laban", "Reuben"], reference: "Genesis 4:9", explanation: "Cain spoke this after murdering Abel." },
  { difficulty: "hard", quote: "Who knows if perhaps you have come to the kingdom for such a time as this?", answer: "Mordecai", choices: ["Mordecai", "Haman", "Ezra", "Nehemiah"], reference: "Esther 4:14", explanation: "Mordecai urged Esther to act courageously." },
  { difficulty: "hard", quote: "I know that my Redeemer lives.", answer: "Job", choices: ["Job", "David", "Isaiah", "Daniel"], reference: "Job 19:25", explanation: "Job confessed hope in his Redeemer amid suffering." },
  { difficulty: "hard", quote: "Almost you persuade me to become a Christian.", answer: "Agrippa", choices: ["Agrippa", "Festus", "Felix", "Pilate"], reference: "Acts 26:28", explanation: "Agrippa responded to Paul's testimony." },
  { difficulty: "hard", quote: "Silver and gold I do not have, but what I have I give you.", answer: "Peter", choices: ["Peter", "Paul", "Stephen", "Philip"], reference: "Acts 3:6", explanation: "Peter spoke to the lame man at the temple gate." },
  { difficulty: "hard", quote: "I see the heavens opened and the Son of Man standing at the right hand of God.", answer: "Stephen", choices: ["Stephen", "Paul", "John", "Peter"], reference: "Acts 7:56", explanation: "Stephen saw this vision before his death." },
  { difficulty: "easy", quote: "Let there be light.", answer: "God", choices: ["God", "Moses", "David", "Isaiah"], reference: "Genesis 1:3", explanation: "God spoke light into existence at creation." },
  { difficulty: "easy", quote: "It is not good for the man to be alone.", answer: "God", choices: ["God", "Adam", "Moses", "Solomon"], reference: "Genesis 2:18", explanation: "God said this before making a helper for Adam." },
  { difficulty: "easy", quote: "The woman You gave me, she gave me fruit.", answer: "Adam", choices: ["Adam", "Cain", "Noah", "Abraham"], reference: "Genesis 3:12", explanation: "Adam answered God after eating from the tree." },
  { difficulty: "easy", quote: "I have gotten a man with the help of the LORD.", answer: "Eve", choices: ["Eve", "Sarah", "Rebekah", "Rachel"], reference: "Genesis 4:1", explanation: "Eve said this after Cain was born." },
  { difficulty: "easy", quote: "Come, let us build ourselves a city.", answer: "The people of Babel", choices: ["The people of Babel", "The Israelites", "The Philistines", "The Egyptians"], reference: "Genesis 11:4", explanation: "The people of Babel wanted a city and tower for their own name." },
  { difficulty: "easy", quote: "Look now toward heaven, and count the stars.", answer: "God", choices: ["God", "Abraham", "Isaac", "Jacob"], reference: "Genesis 15:5", explanation: "God used the stars to illustrate His promise to Abraham." },
  { difficulty: "easy", quote: "Please let a little water be brought, that you may wash your feet.", answer: "Abraham", choices: ["Abraham", "Lot", "Isaac", "Jacob"], reference: "Genesis 18:4", explanation: "Abraham welcomed the heavenly visitors with hospitality." },
  { difficulty: "easy", quote: "Do not lay a hand on the boy.", answer: "The angel of the LORD", choices: ["The angel of the LORD", "Abraham", "Isaac", "Sarah"], reference: "Genesis 22:12", explanation: "The angel stopped Abraham from sacrificing Isaac." },
  { difficulty: "easy", quote: "Go to Pharaoh, for I have hardened his heart.", answer: "God", choices: ["God", "Moses", "Aaron", "Jethro"], reference: "Exodus 10:1", explanation: "God sent Moses back to Pharaoh." },
  { difficulty: "easy", quote: "Let my people go.", answer: "God", choices: ["God", "Moses", "Aaron", "Joshua"], reference: "Exodus 8:1", explanation: "God gave Moses this message for Pharaoh." },
  { difficulty: "easy", quote: "Stand still and see the salvation of the LORD.", answer: "Moses", choices: ["Moses", "Joshua", "Caleb", "Aaron"], reference: "Exodus 14:13", explanation: "Moses encouraged Israel at the Red Sea." },
  { difficulty: "easy", quote: "I am the LORD your God.", answer: "God", choices: ["God", "Moses", "Joshua", "David"], reference: "Exodus 20:2", explanation: "God opened the Ten Commandments with this declaration." },
  { difficulty: "easy", quote: "The LORD is my shepherd.", answer: "David", choices: ["David", "Solomon", "Moses", "Asaph"], reference: "Psalm 23:1", explanation: "David's psalm begins with this trust-filled confession." },
  { difficulty: "easy", quote: "The LORD is my light and my salvation.", answer: "David", choices: ["David", "Isaiah", "Jeremiah", "Solomon"], reference: "Psalm 27:1", explanation: "David declared confidence in the LORD." },
  { difficulty: "easy", quote: "For God so loved the world.", answer: "Jesus", choices: ["Jesus", "John", "Paul", "Peter"], reference: "John 3:16", explanation: "Jesus spoke these words to Nicodemus." },
  { difficulty: "easy", quote: "Father, forgive them.", answer: "Jesus", choices: ["Jesus", "Stephen", "Peter", "Paul"], reference: "Luke 23:34", explanation: "Jesus prayed this from the cross." },
  { difficulty: "easy", quote: "He is not here, for He has risen.", answer: "The angel", choices: ["The angel", "Mary Magdalene", "Peter", "John"], reference: "Matthew 28:6", explanation: "The angel announced Jesus' resurrection." },
  { difficulty: "easy", quote: "Follow Me, and I will make you fishers of men.", answer: "Jesus", choices: ["Jesus", "John the Baptist", "Peter", "Paul"], reference: "Matthew 4:19", explanation: "Jesus called His first disciples with these words." },
  { difficulty: "medium", quote: "You meant evil against me, but God meant it for good.", answer: "Joseph", choices: ["Joseph", "Moses", "David", "Daniel"], reference: "Genesis 50:20", explanation: "Joseph spoke graciously to his brothers after their father's death." },
  { difficulty: "medium", quote: "What is this that God has done to us?", answer: "Joseph's brothers", choices: ["Joseph's brothers", "The Israelites", "The disciples", "The elders of Israel"], reference: "Genesis 42:28", explanation: "Joseph's brothers said this when they found money in their sacks." },
  { difficulty: "medium", quote: "Who am I, that I should go to Pharaoh?", answer: "Moses", choices: ["Moses", "Gideon", "Jeremiah", "Isaiah"], reference: "Exodus 3:11", explanation: "Moses questioned God's call at the burning bush." },
  { difficulty: "medium", quote: "Please send someone else.", answer: "Moses", choices: ["Moses", "Jonah", "Jeremiah", "Gideon"], reference: "Exodus 4:13", explanation: "Moses hesitated before accepting his mission." },
  { difficulty: "medium", quote: "The people serve the LORD all the days of Joshua.", answer: "Joshua's generation", choices: ["Joshua's generation", "Moses' generation", "David's army", "The Levites"], reference: "Joshua 24:31", explanation: "Israel remained faithful during Joshua's generation." },
  { difficulty: "medium", quote: "Please, Lord, how can I save Israel?", answer: "Gideon", choices: ["Gideon", "Samson", "Barak", "Jephthah"], reference: "Judges 6:15", explanation: "Gideon felt too weak for the task God gave him." },
  { difficulty: "medium", quote: "If You will save Israel by my hand, as You have said.", answer: "Gideon", choices: ["Gideon", "Saul", "Jonathan", "Elijah"], reference: "Judges 6:36", explanation: "Gideon asked God for confirmation with the fleece." },
  { difficulty: "medium", quote: "Give me a blessing, for you have given me land in the Negev.", answer: "Achsah", choices: ["Achsah", "Deborah", "Jael", "Rahab"], reference: "Judges 1:15", explanation: "Achsah asked Caleb for springs of water." },
  { difficulty: "medium", quote: "If I perish, I perish.", answer: "Esther", choices: ["Esther", "Ruth", "Deborah", "Rahab"], reference: "Esther 4:16", explanation: "Esther resolved to approach the king for her people." },
  { difficulty: "medium", quote: "The LORD gave, and the LORD has taken away.", answer: "Job", choices: ["Job", "David", "Solomon", "Jeremiah"], reference: "Job 1:21", explanation: "Job worshiped after deep loss." },
  { difficulty: "medium", quote: "The LORD is my rock and my fortress.", answer: "David", choices: ["David", "Moses", "Hezekiah", "Isaiah"], reference: "Psalm 18:2", explanation: "David praised God as his deliverer." },
  { difficulty: "medium", quote: "The fear of the LORD is the beginning of knowledge.", answer: "Solomon", choices: ["Solomon", "David", "Moses", "Agur"], reference: "Proverbs 1:7", explanation: "Proverbs opens with this wisdom theme." },
  { difficulty: "medium", quote: "Comfort, comfort My people.", answer: "God", choices: ["God", "Isaiah", "Jeremiah", "Ezekiel"], reference: "Isaiah 40:1", explanation: "God gave Isaiah a message of comfort for His people." },
  { difficulty: "medium", quote: "Before I formed you in the womb, I knew you.", answer: "God", choices: ["God", "Jeremiah", "Isaiah", "David"], reference: "Jeremiah 1:5", explanation: "God spoke these words in Jeremiah's call." },
  { difficulty: "medium", quote: "Ah, Lord GOD, I surely do not know how to speak.", answer: "Jeremiah", choices: ["Jeremiah", "Moses", "Isaiah", "Ezekiel"], reference: "Jeremiah 1:6", explanation: "Jeremiah felt too young and unready to speak." },
  { difficulty: "medium", quote: "Can these bones live?", answer: "God", choices: ["God", "Ezekiel", "Daniel", "Jeremiah"], reference: "Ezekiel 37:3", explanation: "God asked Ezekiel this in the valley of dry bones." },
  { difficulty: "medium", quote: "Salvation belongs to the LORD.", answer: "Jonah", choices: ["Jonah", "David", "Moses", "Daniel"], reference: "Jonah 2:9", explanation: "Jonah prayed this from inside the fish." },
  { difficulty: "medium", quote: "Repent, for the kingdom of heaven is near.", answer: "John the Baptist", choices: ["John the Baptist", "Jesus", "Peter", "Paul"], reference: "Matthew 3:2", explanation: "John preached repentance in the wilderness." },
  { difficulty: "medium", quote: "You must be born again.", answer: "Jesus", choices: ["Jesus", "John", "Peter", "Paul"], reference: "John 3:7", explanation: "Jesus taught Nicodemus about new birth." },
  { difficulty: "medium", quote: "Lord, if You are willing, You can make me clean.", answer: "A leper", choices: ["A leper", "The centurion", "Blind Bartimaeus", "Jairus"], reference: "Matthew 8:2", explanation: "A leper approached Jesus in faith." },
  { difficulty: "medium", quote: "Only say the word, and my servant will be healed.", answer: "The centurion", choices: ["The centurion", "Jairus", "Nicodemus", "Peter"], reference: "Matthew 8:8", explanation: "The centurion trusted Jesus' authority." },
  { difficulty: "medium", quote: "Lord, save us! We are perishing!", answer: "The disciples", choices: ["The disciples", "The Pharisees", "The crowd", "The sailors"], reference: "Matthew 8:25", explanation: "The disciples cried out during the storm." },
  { difficulty: "medium", quote: "Lord, help me!", answer: "The Canaanite woman", choices: ["The Canaanite woman", "Martha", "Mary Magdalene", "The Samaritan woman"], reference: "Matthew 15:25", explanation: "The Canaanite woman persisted in asking Jesus for help." },
  { difficulty: "medium", quote: "Lord, if You had been here, my brother would not have died.", answer: "Martha", choices: ["Martha", "Mary Magdalene", "Elizabeth", "Mary"], reference: "John 11:21", explanation: "Martha said this to Jesus after Lazarus died." },
  { difficulty: "hard", quote: "Give me children, or I shall die!", answer: "Rachel", choices: ["Rachel", "Leah", "Sarah", "Rebekah"], reference: "Genesis 30:1", explanation: "Rachel spoke in distress to Jacob." },
  { difficulty: "hard", quote: "Come, let us kill him and throw him into one of the pits.", answer: "Joseph's brothers", choices: ["Joseph's brothers", "Jacob's sons in Egypt", "Saul's servants", "David's brothers"], reference: "Genesis 37:20", explanation: "Joseph's brothers plotted against him." },
  { difficulty: "hard", quote: "You shall not go down there with us.", answer: "Joseph", choices: ["Joseph", "Judah", "Reuben", "Pharaoh"], reference: "Genesis 42:20", explanation: "Joseph tested his brothers before revealing himself." },
  { difficulty: "hard", quote: "Is the LORD among us or not?", answer: "The Israelites", choices: ["The Israelites", "The Egyptians", "The Philistines", "The disciples"], reference: "Exodus 17:7", explanation: "Israel tested the LORD at Massah and Meribah." },
  { difficulty: "hard", quote: "Who is on the LORD's side?", answer: "Moses", choices: ["Moses", "Joshua", "Aaron", "Phinehas"], reference: "Exodus 32:26", explanation: "Moses called for loyalty after the golden calf." },
  { difficulty: "hard", quote: "Would that all the LORD's people were prophets.", answer: "Moses", choices: ["Moses", "Joshua", "Samuel", "Elijah"], reference: "Numbers 11:29", explanation: "Moses welcomed the Spirit's work beyond himself." },
  { difficulty: "hard", quote: "Let me die with the Philistines.", answer: "Samson", choices: ["Samson", "Saul", "Jonathan", "Abimelech"], reference: "Judges 16:30", explanation: "Samson said this as he pushed down the pillars." },
  { difficulty: "hard", quote: "Do not urge me to leave you.", answer: "Ruth", choices: ["Ruth", "Naomi", "Orpah", "Hannah"], reference: "Ruth 1:16", explanation: "Ruth clung to Naomi and her God." },
  { difficulty: "hard", quote: "Give Your servant an understanding heart.", answer: "Solomon", choices: ["Solomon", "David", "Hezekiah", "Josiah"], reference: "1 Kings 3:9", explanation: "Solomon asked God for wisdom to govern." },
  { difficulty: "hard", quote: "How long will you waver between two opinions?", answer: "Elijah", choices: ["Elijah", "Elisha", "Micaiah", "Isaiah"], reference: "1 Kings 18:21", explanation: "Elijah challenged Israel on Mount Carmel." },
  { difficulty: "hard", quote: "Do not fear, for those who are with us are more.", answer: "Elisha", choices: ["Elisha", "Elijah", "Isaiah", "Daniel"], reference: "2 Kings 6:16", explanation: "Elisha encouraged his servant when surrounded." },
  { difficulty: "hard", quote: "I have found the Book of the Law.", answer: "Hilkiah", choices: ["Hilkiah", "Ezra", "Shaphan", "Josiah"], reference: "2 Kings 22:8", explanation: "Hilkiah found the Book of the Law in the temple." },
  { difficulty: "hard", quote: "The joy of the LORD is your strength.", answer: "Nehemiah", choices: ["Nehemiah", "Ezra", "Haggai", "Zechariah"], reference: "Nehemiah 8:10", explanation: "Nehemiah encouraged the people after the Law was read." },
  { difficulty: "hard", quote: "Though He slay me, I will hope in Him.", answer: "Job", choices: ["Job", "David", "Jeremiah", "Habakkuk"], reference: "Job 13:15", explanation: "Job expressed stubborn hope in God." },
  { difficulty: "hard", quote: "Woe is me, for I am ruined!", answer: "Isaiah", choices: ["Isaiah", "Jeremiah", "Ezekiel", "Daniel"], reference: "Isaiah 6:5", explanation: "Isaiah said this when he saw the LORD's holiness." },
  { difficulty: "hard", quote: "The harvest is past, the summer has ended.", answer: "Jeremiah", choices: ["Jeremiah", "Isaiah", "Hosea", "Amos"], reference: "Jeremiah 8:20", explanation: "Jeremiah lamented Judah's condition." },
  { difficulty: "hard", quote: "Even if He does not, let it be known to you, O king.", answer: "Shadrach, Meshach, and Abednego", choices: ["Shadrach, Meshach, and Abednego", "Daniel", "Mordecai", "The magi"], reference: "Daniel 3:18", explanation: "The three Hebrews refused to worship the image." },
  { difficulty: "hard", quote: "My God sent His angel and shut the mouths of the lions.", answer: "Daniel", choices: ["Daniel", "Darius", "Nebuchadnezzar", "Ezra"], reference: "Daniel 6:22", explanation: "Daniel testified after being delivered from the lions." },
  { difficulty: "hard", quote: "Yet I will rejoice in the LORD.", answer: "Habakkuk", choices: ["Habakkuk", "Haggai", "Zephaniah", "Malachi"], reference: "Habakkuk 3:18", explanation: "Habakkuk chose joy even in hardship." },
  { difficulty: "hard", quote: "Where is He who has been born King of the Jews?", answer: "The magi", choices: ["The magi", "Herod", "The shepherds", "The priests"], reference: "Matthew 2:2", explanation: "The magi asked this when they arrived in Jerusalem." },
  { difficulty: "hard", quote: "I am not worthy to untie the strap of His sandals.", answer: "John the Baptist", choices: ["John the Baptist", "Peter", "Paul", "Andrew"], reference: "John 1:27", explanation: "John humbled himself before Christ." },
  { difficulty: "hard", quote: "We have found the Messiah.", answer: "Andrew", choices: ["Andrew", "Philip", "Peter", "John"], reference: "John 1:41", explanation: "Andrew told his brother Simon about Jesus." },
  { difficulty: "hard", quote: "Can anything good come out of Nazareth?", answer: "Nathanael", choices: ["Nathanael", "Philip", "Thomas", "Peter"], reference: "John 1:46", explanation: "Nathanael was skeptical before meeting Jesus." },
  { difficulty: "hard", quote: "He must increase, but I must decrease.", answer: "John the Baptist", choices: ["John the Baptist", "Peter", "Paul", "Barnabas"], reference: "John 3:30", explanation: "John rejoiced that attention turned to Christ." },
  { difficulty: "hard", quote: "Give me this water so that I will not get thirsty.", answer: "The Samaritan woman", choices: ["The Samaritan woman", "Martha", "Mary Magdalene", "The Canaanite woman"], reference: "John 4:15", explanation: "The Samaritan woman responded to Jesus' offer of living water." },
  { difficulty: "hard", quote: "Rabbi, who sinned, this man or his parents?", answer: "The disciples", choices: ["The disciples", "The Pharisees", "The crowd", "The elders"], reference: "John 9:2", explanation: "The disciples asked about the man born blind." },
  { difficulty: "hard", quote: "I know whom I have believed.", answer: "Paul", choices: ["Paul", "Peter", "John", "James"], reference: "2 Timothy 1:12", explanation: "Paul expressed confidence in Christ while writing to Timothy." },
  { difficulty: "hard", quote: "Come, Lord Jesus!", answer: "John", choices: ["John", "Paul", "Peter", "James"], reference: "Revelation 22:20", explanation: "John closes Revelation with longing for Christ's return." },
];

function startWhoSaidItGame() {
  const pool = shuffleItems(whoSaidItPool());
  if (!pool.length) {
    showToast("No Who Said It questions available for that difficulty yet");
    return;
  }
  const questionCount = Math.min(normalizedTriviaCount("who-said-it", state.triviaCount), pool.length);
  state.triviaGame = {
    type: "who-said-it",
    difficulty: state.triviaDifficulty,
    questions: pool.slice(0, questionCount).map((question) => ({ ...question, choices: shuffleItems(question.choices), selectedAnswer: null })),
    index: 0,
    score: 0,
    complete: false,
  };
  renderPreservingReaderScroll();
}

function whoSaidItPool() {
  return whoSaidItQuestions.filter((question) => state.triviaDifficulty === "All" || question.difficulty === state.triviaDifficulty.toLowerCase());
}

function startVerseOrderGame() {
  const pool = shuffleItems(verseOrderPool());
  if (!pool.length) {
    showToast("No verses available for Verse Order yet");
    return;
  }
  const puzzleCount = Math.min(normalizedTriviaCount("verse-order", state.triviaCount), pool.length);
  const selectedVerses = pool.slice(0, puzzleCount);
  state.triviaGame = {
    type: "verse-order",
    version: state.versions[0] || "BSB",
    puzzles: selectedVerses.map((item, index) => createVerseOrderPuzzle(item, verseOrderPieceCount(index, puzzleCount))),
    index: 0,
    score: 0,
    complete: false,
  };
  renderPreservingReaderScroll();
}

function verseOrderPool() {
  const version = state.versions[0] || "BSB";
  return Object.entries(bibleData).flatMap(([chapterKey, chapter]) => {
    return (chapter.verses || []).map((verse) => {
      const text = cleanVerseOrderText(getVerseText(verse, version));
      return {
        reference: `${chapterKey}:${verse.n}`,
        version,
        text,
      };
    });
  }).filter((item) => {
    const wordCount = item.text.split(/\s+/).filter(Boolean).length;
    return wordCount >= 10 && wordCount <= 34 && !/^\s*$/.test(item.text);
  });
}

function cleanVerseOrderText(text) {
  return String(text || "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function createVerseOrderPuzzle(item, pieceCount = 3) {
  const segments = splitVerseIntoSegments(item.text, pieceCount).map((text, index) => ({
    id: `fragment-${index}`,
    order: index,
    text,
  }));
  let shuffledIds = shuffleItems(segments.map((segment) => segment.id));
  if (segments.length > 1 && shuffledIds.every((id, index) => id === segments[index].id)) {
    shuffledIds = shuffledIds.slice(1).concat(shuffledIds[0]);
  }
  return {
    ...item,
    segments,
    shuffledIds,
    selectedIds: [],
    answered: false,
    correct: false,
  };
}

function verseOrderPieceCount(index, puzzleCount) {
  if (puzzleCount <= 1) return 3;
  return Math.min(7, 3 + Math.round((index * 4) / (puzzleCount - 1)));
}

function splitVerseIntoSegments(text, requestedCount = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const segmentCount = Math.min(7, words.length, Math.max(3, requestedCount));
  const baseSize = Math.floor(words.length / segmentCount);
  const remainder = words.length % segmentCount;
  const segments = [];
  let wordIndex = 0;
  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const size = baseSize + (segmentIndex < remainder ? 1 : 0);
    segments.push(words.slice(wordIndex, wordIndex + size).join(" "));
    wordIndex += size;
  }
  return segments;
}

function answerTriviaQuestion(answer) {
  const game = state.triviaGame;
  if (!game || game.complete || game.selectedAnswer !== null) return;
  const question = game.questions[game.index];
  if (question.eliminatedChoices.includes(answer)) return;
  game.selectedAnswer = answer;
  if (answer === question.answer) game.score += 1;
  renderTriviaAnswerAndScroll();
}

function triviaHintOptions(question) {
  const options = [{
    type: "eliminate",
    label: "Eliminate One",
    description: "Remove one incorrect answer.",
  }];
  if (question.choices.length >= 4) {
    options.push({
      type: "fifty-fifty",
      label: "50/50",
      description: "Leave the correct answer and one wrong answer.",
    });
  }
  return options;
}

function availableRoundHintOptions(options, game = state.triviaGame) {
  const usedHintTypes = new Set(game?.usedHintTypes || []);
  return options.filter((hint) => !usedHintTypes.has(hint.type));
}

function toggleTriviaHintMenu() {
  const game = state.triviaGame;
  if (!game || game.type !== "trivia" || game.complete || game.selectedAnswer !== null) return;
  const question = game.questions[game.index];
  if (!question || question.hintUsed || !availableRoundHintOptions(triviaHintOptions(question), game).length) return;
  question.hintMenuOpen = !question.hintMenuOpen;
  renderPreservingReaderScroll();
}

function useTriviaHint(type) {
  const game = state.triviaGame;
  if (!game || game.type !== "trivia" || game.complete || game.selectedAnswer !== null) return;
  const question = game.questions[game.index];
  if (!question || question.hintUsed) return;
  const availableTypes = new Set(availableRoundHintOptions(triviaHintOptions(question), game).map((hint) => hint.type));
  if (!availableTypes.has(type)) return;
  const removable = question.choices.filter((choice) => choice !== question.answer);
  const removeCount = type === "fifty-fifty" ? Math.max(0, question.choices.length - 2) : 1;
  question.eliminatedChoices = shuffleItems(removable).slice(0, removeCount);
  question.hintMessage = type === "fifty-fifty"
    ? "Two possibilities remain."
    : "One incorrect answer has been removed.";
  question.hintUsed = type;
  question.hintMenuOpen = false;
  game.usedHintTypes = [...new Set([...(game.usedHintTypes || []), type])];
  renderPreservingReaderScroll();
}

function nextTriviaQuestion() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.type === "verse-order") return nextVerseOrderPuzzle();
  if (game.type === "reference-rush") return nextReferenceRushPuzzle();
  if (game.type === "book-sprint") return nextBookSprintPuzzle();
  if (game.type === "who-said-it") return nextWhoSaidItQuestion();
  if (game.index >= game.questions.length - 1) {
    completeTriviaGame(game);
  } else {
    game.index += 1;
    game.selectedAnswer = null;
  }
  renderPreservingReaderScroll();
}

function exitTriviaGame() {
  cleanupTriviaCelebration();
  state.triviaGame = null;
  renderPreservingReaderScroll();
}

function answerReferenceRush(reference) {
  const game = state.triviaGame;
  if (!game || game.type !== "reference-rush" || game.complete) return;
  const puzzle = game.puzzles[game.index];
  if (!puzzle || puzzle.selectedReference !== null) return;
  puzzle.selectedReference = reference;
  if (reference === puzzle.correctAnswer) game.score += 1;
  if (game.timed && game.index === game.puzzles.length - 1) game.finishedAt = Date.now();
  renderTriviaAnswerAndScroll();
}

function toggleReferenceRushHintMenu() {
  const game = state.triviaGame;
  if (!game || game.type !== "reference-rush" || game.complete) return;
  const puzzle = game.puzzles[game.index];
  if (!puzzle || puzzle.selectedReference !== null || puzzle.hintUsed
    || !availableRoundHintOptions(referenceRushHintOptions(puzzle), game).length) return;
  puzzle.hintMenuOpen = !puzzle.hintMenuOpen;
  renderPreservingReaderScroll();
}

function useReferenceRushHint(type) {
  const game = state.triviaGame;
  if (!game || game.type !== "reference-rush" || game.complete) return;
  const puzzle = game.puzzles[game.index];
  if (!puzzle || puzzle.selectedReference !== null || puzzle.hintUsed) return;
  const availableTypes = new Set(availableRoundHintOptions(referenceRushHintOptions(puzzle), game).map((hint) => hint.type));
  if (!availableTypes.has(type)) return;
  const removable = puzzle.choices.filter((choice) => choice !== puzzle.correctAnswer);
  if (type === "eliminate") {
    puzzle.eliminatedChoices = shuffleItems(removable).slice(0, 1);
    puzzle.hintMessage = "One incorrect answer has been removed.";
  } else if (type === "fifty-fifty") {
    puzzle.eliminatedChoices = shuffleItems(removable).slice(0, Math.max(0, puzzle.choices.length - 2));
    puzzle.hintMessage = "Two possibilities remain.";
  } else if (type === "higher-lower") {
    puzzle.hintMessage = puzzle.higherLowerHint;
  } else if (type === "scholar") {
    puzzle.hintMessage = puzzle.scholarHint;
  } else if (type === "context") {
    puzzle.hintMessage = puzzle.contextPreview;
  }
  puzzle.hintUsed = type;
  puzzle.hintMenuOpen = false;
  game.usedHintTypes = [...new Set([...(game.usedHintTypes || []), type])];
  renderPreservingReaderScroll();
}

function nextReferenceRushPuzzle() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.index >= game.puzzles.length - 1) {
    completeTriviaGame(game);
  } else {
    game.index += 1;
  }
  renderPreservingReaderScroll();
}

function selectBookSprintBook(book) {
  const puzzle = currentBookSprintPuzzle();
  if (!puzzle || puzzle.answered || puzzle.selectedBooks.includes(book)) return;
  puzzle.lastAttemptIncorrect = false;
  puzzle.selectedBooks.push(book);
  renderPreservingReaderScroll();
}

function removeBookSprintBook(book) {
  const puzzle = currentBookSprintPuzzle();
  if (!puzzle || puzzle.answered || !puzzle.selectedBooks.includes(book)) return;
  puzzle.lastAttemptIncorrect = false;
  puzzle.selectedBooks = puzzle.selectedBooks.filter((item) => item !== book);
  renderPreservingReaderScroll();
}

function shouldSuppressOrderingClick() {
  return Date.now() < orderingSuppressClickUntil;
}

function beginOrderingDrag(event, button, type) {
  const puzzle = type === "verse-order" ? currentVerseOrderPuzzle() : currentBookSprintPuzzle();
  if (!puzzle || puzzle.answered || event.button !== 0 || orderingDragState) return;
  orderingDragState = {
    pointerId: event.pointerId,
    type,
    item: type === "verse-order" ? button.dataset.orderDrag : button.dataset.bookDrag,
    source: button,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    ghost: null,
    drop: null,
  };
  button.setPointerCapture?.(event.pointerId);
  document.addEventListener("pointermove", moveOrderingDrag, { passive: false });
  document.addEventListener("pointerup", finishOrderingDrag);
  document.addEventListener("pointercancel", cancelOrderingDrag);
}

function moveOrderingDrag(event) {
  const drag = orderingDragState;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
  if (!drag.dragging && distance < 7) return;
  if (!drag.dragging) {
    drag.dragging = true;
    drag.ghost = drag.source.cloneNode(true);
    drag.ghost.className = "book-sprint-drag-ghost";
    drag.ghost.removeAttribute("id");
    drag.ghost.removeAttribute("disabled");
    drag.ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(drag.ghost);
    drag.source.classList.add("is-dragging");
    document.body.classList.add("book-sprint-is-dragging");
  }
  event.preventDefault();
  drag.ghost.style.left = `${event.clientX}px`;
  drag.ghost.style.top = `${event.clientY}px`;
  drag.drop = orderingDropTarget(drag, event.clientX, event.clientY);
  updateOrderingDropIndicator(drag, drag.drop);
}

function orderingDropTarget(drag, x, y) {
  const answerSelector = drag.type === "verse-order" ? "[data-order-drop-zone]" : "[data-book-drop-zone]";
  const bankSelector = drag.type === "verse-order" ? "[data-order-bank-drop]" : "[data-book-bank-drop]";
  const selectedSelector = drag.type === "verse-order" ? "[data-order-selected]" : "[data-book-selected]";
  const answer = document.querySelector(answerSelector);
  const bank = document.querySelector(bankSelector);
  const element = document.elementFromPoint(x, y);
  if (answer && (element?.closest(answerSelector) === answer || pointInsideElement(x, y, answer))) {
    const buttons = [...answer.querySelectorAll(selectedSelector)];
    if (!buttons.length) return { type: "answer", index: 0 };
    const directTarget = element?.closest(selectedSelector);
    if (directTarget && answer.contains(directTarget)) {
      const index = buttons.indexOf(directTarget);
      const rect = directTarget.getBoundingClientRect();
      const singleColumn = buttons.length > 1 && buttons.every((button) => Math.abs(button.getBoundingClientRect().left - buttons[0].getBoundingClientRect().left) < 4);
      const insertAfter = singleColumn ? y >= rect.top + rect.height / 2 : x >= rect.left + rect.width / 2;
      return { type: "answer", index: index + (insertAfter ? 1 : 0), indicator: directTarget, insertAfter };
    }
    const closestIndex = buttons.reduce((best, button, index) => {
      const rect = button.getBoundingClientRect();
      const distance = Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
      return distance < best.distance ? { index, distance, rect } : best;
    }, { index: buttons.length - 1, distance: Infinity, rect: null });
    const insertAfter = y > closestIndex.rect.bottom || x >= closestIndex.rect.left + closestIndex.rect.width / 2;
    return { type: "answer", index: closestIndex.index + (insertAfter ? 1 : 0), indicator: buttons[closestIndex.index], insertAfter };
  }
  if (bank && (element?.closest(bankSelector) === bank || pointInsideElement(x, y, bank))) {
    return { type: "bank" };
  }
  return null;
}

function pointInsideElement(x, y, element) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function updateOrderingDropIndicator(drag, drop) {
  document.querySelectorAll(".book-sprint-drop-active, .book-sprint-insert-before, .book-sprint-insert-after").forEach((element) => {
    element.classList.remove("book-sprint-drop-active", "book-sprint-insert-before", "book-sprint-insert-after");
  });
  if (!drop) return;
  const answerSelector = drag.type === "verse-order" ? "[data-order-drop-zone]" : "[data-book-drop-zone]";
  const bankSelector = drag.type === "verse-order" ? "[data-order-bank-drop]" : "[data-book-bank-drop]";
  const zone = document.querySelector(drop.type === "answer" ? answerSelector : bankSelector);
  zone?.classList.add("book-sprint-drop-active");
  drop.indicator?.classList.add(drop.insertAfter ? "book-sprint-insert-after" : "book-sprint-insert-before");
}

function finishOrderingDrag(event) {
  const drag = orderingDragState;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const drop = drag.dragging ? orderingDropTarget(drag, event.clientX, event.clientY) : null;
  const didDrag = drag.dragging;
  cleanupOrderingDrag();
  if (!didDrag || !drop) return;
  orderingSuppressClickUntil = Date.now() + 500;
  if (drop.type === "answer") {
    if (drag.type === "verse-order") moveVerseOrderFragment(drag.item, drop.index);
    else moveBookSprintBook(drag.item, drop.index);
  } else {
    if (drag.type === "verse-order") removeVerseOrderFragment(drag.item);
    else removeBookSprintBook(drag.item);
  }
}

function cancelOrderingDrag(event) {
  if (!orderingDragState || event.pointerId !== orderingDragState.pointerId) return;
  cleanupOrderingDrag();
}

function cleanupOrderingDrag() {
  const drag = orderingDragState;
  if (!drag) return;
  drag.source.classList.remove("is-dragging");
  drag.ghost?.remove();
  document.body.classList.remove("book-sprint-is-dragging");
  updateOrderingDropIndicator(drag, null);
  document.removeEventListener("pointermove", moveOrderingDrag);
  document.removeEventListener("pointerup", finishOrderingDrag);
  document.removeEventListener("pointercancel", cancelOrderingDrag);
  orderingDragState = null;
}

function moveBookSprintBook(book, targetIndex) {
  const puzzle = currentBookSprintPuzzle();
  if (!puzzle || puzzle.answered) return;
  const currentIndex = puzzle.selectedBooks.indexOf(book);
  const nextBooks = puzzle.selectedBooks.slice();
  if (currentIndex >= 0) {
    nextBooks.splice(currentIndex, 1);
    if (currentIndex < targetIndex) targetIndex -= 1;
  }
  targetIndex = Math.max(0, Math.min(targetIndex, nextBooks.length));
  nextBooks.splice(targetIndex, 0, book);
  if (nextBooks.every((item, index) => item === puzzle.selectedBooks[index])) return;
  puzzle.lastAttemptIncorrect = false;
  puzzle.selectedBooks = nextBooks;
  renderPreservingReaderScroll();
}

function resetBookSprintPuzzle() {
  const puzzle = currentBookSprintPuzzle();
  if (!puzzle || puzzle.answered) return;
  puzzle.selectedBooks = [];
  puzzle.lastAttemptIncorrect = false;
  renderPreservingReaderScroll();
}

function checkBookSprint() {
  const game = state.triviaGame;
  const puzzle = currentBookSprintPuzzle();
  if (!game || !puzzle || puzzle.answered || puzzle.selectedBooks.length !== puzzle.books.length) return;
  puzzle.correct = puzzle.selectedBooks.every((book, index) => book === puzzle.books[index]);
  if (!puzzle.correct) {
    puzzle.lastAttemptIncorrect = true;
    renderPreservingReaderScroll();
    return;
  }
  puzzle.answered = true;
  puzzle.lastAttemptIncorrect = false;
  game.score += 1;
  renderTriviaAnswerAndScroll();
}

function nextBookSprintPuzzle() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.index >= game.puzzles.length - 1) {
    finishBookSprintGame(game);
    completeTriviaGame(game);
  } else {
    game.index += 1;
  }
  renderPreservingReaderScroll();
}

function finishBookSprintGame(game) {
  if (!game || game.type !== "book-sprint") return;
  if (!game.finishedAt) game.finishedAt = Date.now();
  if (game.bookSprintBestRecorded) return;
  const result = recordBookSprintBest(game);
  game.bookSprintBest = result?.best || null;
  game.bookSprintNewBest = Boolean(result?.isNewBest);
  game.bookSprintBeatBest = Boolean(result?.beatPrevious);
  game.bookSprintHadPrevious = Boolean(result?.hadPrevious);
  game.bookSprintBestRecorded = true;
}

function currentBookSprintPuzzle() {
  const game = state.triviaGame;
  if (game?.type !== "book-sprint") return null;
  return game.puzzles[game.index];
}

function answerWhoSaidIt(answer) {
  const game = state.triviaGame;
  if (!game || game.type !== "who-said-it" || game.complete) return;
  const question = game.questions[game.index];
  if (!question || question.selectedAnswer !== null) return;
  question.selectedAnswer = answer;
  if (answer === question.answer) game.score += 1;
  renderTriviaAnswerAndScroll();
}

function nextWhoSaidItQuestion() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.index >= game.questions.length - 1) {
    completeTriviaGame(game);
  } else {
    game.index += 1;
  }
  renderPreservingReaderScroll();
}

function selectVerseOrderFragment(id) {
  const puzzle = currentVerseOrderPuzzle();
  if (!puzzle || puzzle.answered || puzzle.selectedIds.includes(id)) return;
  puzzle.selectedIds.push(id);
  renderPreservingReaderScroll();
}

function removeVerseOrderFragment(id) {
  const puzzle = currentVerseOrderPuzzle();
  if (!puzzle || puzzle.answered || !puzzle.selectedIds.includes(id)) return;
  puzzle.selectedIds = puzzle.selectedIds.filter((item) => item !== id);
  renderPreservingReaderScroll();
}

function moveVerseOrderFragment(id, targetIndex) {
  const puzzle = currentVerseOrderPuzzle();
  if (!puzzle || puzzle.answered) return;
  const currentIndex = puzzle.selectedIds.indexOf(id);
  const nextIds = puzzle.selectedIds.slice();
  if (currentIndex >= 0) {
    nextIds.splice(currentIndex, 1);
    if (currentIndex < targetIndex) targetIndex -= 1;
  }
  targetIndex = Math.max(0, Math.min(targetIndex, nextIds.length));
  nextIds.splice(targetIndex, 0, id);
  if (nextIds.every((item, index) => item === puzzle.selectedIds[index])) return;
  puzzle.selectedIds = nextIds;
  renderPreservingReaderScroll();
}

function resetVerseOrderPuzzle() {
  const puzzle = currentVerseOrderPuzzle();
  if (!puzzle || puzzle.answered) return;
  puzzle.selectedIds = [];
  renderPreservingReaderScroll();
}

function checkVerseOrder() {
  const game = state.triviaGame;
  const puzzle = currentVerseOrderPuzzle();
  if (!game || !puzzle || puzzle.answered || puzzle.selectedIds.length !== puzzle.segments.length) return;
  const correctIds = puzzle.segments.map((segment) => segment.id);
  puzzle.correct = puzzle.selectedIds.every((id, index) => id === correctIds[index]);
  puzzle.answered = true;
  if (puzzle.correct) game.score += 1;
  renderTriviaAnswerAndScroll();
}

function nextVerseOrderPuzzle() {
  const game = state.triviaGame;
  if (!game) return;
  if (game.index >= game.puzzles.length - 1) {
    completeTriviaGame(game);
  } else {
    game.index += 1;
  }
  renderPreservingReaderScroll();
}

function currentVerseOrderPuzzle() {
  const game = state.triviaGame;
  if (game?.type !== "verse-order") return null;
  return game.puzzles[game.index];
}

function openTriviaReference() {
  const game = state.triviaGame;
  const reference = game?.type === "verse-order" || game?.type === "reference-rush"
    ? game.puzzles?.[game.index]?.reference
    : game?.type === "who-said-it"
      ? game.questions?.[game.index]?.reference
    : game?.questions?.[game.index]?.reference;
  if (!reference || !setReferenceFromString(reference)) return showToast("Reference is not available");
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
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function setCustomScriptureFont(font) {
  state.customScriptureFont = sanitizeFontName(font);
  localStorage.setItem("lw_custom_scripture_font", state.customScriptureFont);
  applyCustomScriptureFont();
  scheduleCloudSync();
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

function gotoReference(value, options = {}) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (setReferenceFromString(cleaned)) {
    if (Number.isFinite(options.focusVerse)) state.verse = options.focusVerse;
    state.searchQuery = "";
    state.pendingVerseFocus = true;
    recordHistory();
    updateShareUrl();
    render();
    if (options.libraryScroll) requestAnimationFrame(() => restoreLibraryScroll(options.libraryScroll));
  }
}

async function runReferenceOrPhraseSearch(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  state.isVerseOfDayActive = false;
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
  const bundled = translationCodes.filter(isBundledTranslation);
  await Promise.all(bundled.map(loadBibleVersion));
}

function searchBible(query) {
  const primaryVersion = state.versions[0] || "BSB";
  const tokens = searchTokens(query);
  if (!tokens.length) return [];
  const phrase = normalizeSearchText(query);
  const searchableVersions = translationCodes.filter(isBundledTranslation);
  const primarySearchVersion = searchableVersions.includes(primaryVersion) ? primaryVersion : "BSB";
  const primaryExact = searchVersion(primarySearchVersion, phrase, tokens, { exactOnly: true });
  if (primaryExact.length) return primaryExact.slice(0, 40);

  const versionOrder = [primarySearchVersion, ...searchableVersions.filter((version) => version !== primarySearchVersion)];
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
  const requestedMode = requestedModeFromUrl();
  if (sharedRef && setReferenceFromString(sharedRef)) {
    const selected = sharedVersesFromUrl();
    if (selected.length) state.selectedVerses = selected;
    if (requestedMode) state.mode = requestedMode;
    if (state.mode === "big") state.presentationControlsVisible = !isCompactScreen();
    return;
  }
  if (state.startVerseOfDay) {
    const verseOfDay = verseOfDayReference();
    if (verseOfDay && setReferenceFromString(verseOfDay)) state.isVerseOfDayActive = true;
  }
  if (requestedMode) state.mode = requestedMode;
  else if (state.startBigScreen) state.mode = "big";
  if (state.mode === "big") state.presentationControlsVisible = !isCompactScreen();
}

function openVerseOfDay(options = {}) {
  const ref = verseOfDayReference();
  if (!ref) return showToast("Verse of the day is not available yet");
  if (!setReferenceFromString(ref)) return;
  state.isVerseOfDayActive = true;
  state.mode = options.mode || "reader";
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

function requestedModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedMode = (params.get("mode") || params.get("view") || "").toLowerCase();
  if (["big", "bigscreen", "big-screen", "presentation"].includes(requestedMode)) return "big";
  if (["reader", "read"].includes(requestedMode)) return "reader";
  if (["parallel", "study", "parallel-study"].includes(requestedMode)) return "parallel";
  if (["trivia", "games", "game"].includes(requestedMode)) return "trivia";
  return "";
}

function verseOfDayReference(date = new Date()) {
  const config = window.BIGSCREEN_VERSE_OF_DAY || {};
  const key = monthDayKey(date);
  const seasonalRef = config.seasonal?.[key];
  const anchors = buildVerseOfDayPool();
  const dayIndex = Math.max(0, dayOfYear(date) - 1);
  const selectedRef = seasonalRef && referenceExists(seasonalRef)
    ? seasonalRef
    : anchors[dayIndex % anchors.length];
  const approvedRefs = new Set([...(config.anchors || []), ...Object.values(config.seasonal || {})]);

  if (!approvedRefs.has(selectedRef)) {
    console.warn(`[Verse of the Day] Rejected unapproved reference: ${selectedRef || "(none)"}`);
    return "";
  }
  return selectedRef;
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
  verseOfDayPool = refs;
  return verseOfDayPool;
}

function limitVerseOfDayPool(refs, priorityRefs, targetCount) {
  if (refs.length <= targetCount) return refs;
  const selected = [];
  const selectedSet = new Set();
  priorityRefs.forEach((ref) => {
    if (!selectedSet.has(ref) && refs.includes(ref)) {
      selected.push(ref);
      selectedSet.add(ref);
    }
  });
  refs.forEach((ref) => {
    if (selected.length >= targetCount) return;
    if (!selectedSet.has(ref)) {
      selected.push(ref);
      selectedSet.add(ref);
    }
  });
  return variedVerseOfDayRotation(selected);
}

function verseOfDayTextScore(text) {
  const lower = text.toLowerCase();
  const strongTerms = [
    "do not be afraid", "fear not", "do not fear", "be strong", "take heart", "trust in",
    "the lord is", "i am with you", "peace", "hope", "love", "grace", "mercy", "comfort",
    "refuge", "strength", "salvation", "wisdom", "rejoice", "blessed", "rest", "light"
  ];
  const cautionTerms = [
    "wrath", "anger", "destroy", "destruction", "punish", "curse", "cursed", "wicked",
    "evil", "slaughter", "plague", "idols", "idolatry", "adultery", "harlot", "bloodshed",
    "famine", "sword", "condemn", "judgment"
  ];
  let score = lower.length >= 60 && lower.length <= 180 ? 1 : 0;
  strongTerms.forEach((term) => {
    if (lower.includes(term)) score += term.includes(" ") ? 3 : 2;
  });
  cautionTerms.forEach((term) => {
    if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(lower)) score -= 2;
  });
  if (/[?]/.test(text)) score -= 1;
  if (/^and\b/i.test(text)) score -= 0.5;
  return score;
}

function bookNameFromReference(ref) {
  const parsed = parsePassageReference(ref);
  return parsed ? bookNameFromChapterKey(parsed.key) : String(ref).replace(/\s+\d+(?::\d+)?$/, "");
}

function variedVerseOfDayRotation(refs) {
  const categories = {
    gospel: [],
    poetry: [],
    epistle: [],
    prophet: [],
    history: [],
    apocalyptic: [],
  };
  refs.forEach((ref) => {
    const parsed = parsePassageReference(ref);
    const book = parsed ? bookNameFromChapterKey(parsed.key) : "";
    const category = verseOfDayCategory(book);
    categories[category].push(ref);
  });

  Object.keys(categories).forEach((category) => {
    categories[category] = spreadRefsByBook(categories[category]);
  });

  const order = ["gospel", "poetry", "epistle", "prophet", "history", "epistle", "poetry", "apocalyptic"];
  const rotation = [];
  const used = new Set();
  while (Object.values(categories).some((bucket) => bucket.length)) {
    let progressed = false;
    order.forEach((category) => {
      const ref = categories[category].shift();
      if (!ref || used.has(ref)) return;
      used.add(ref);
      rotation.push(ref);
      progressed = true;
    });
    if (!progressed) break;
  }
  refs.forEach((ref) => {
    if (!used.has(ref)) rotation.push(ref);
  });
  return rotation.length ? rotation : refs;
}

function verseOfDayCategory(book) {
  if (["Matthew", "Mark", "Luke", "John", "Acts"].includes(book)) return "gospel";
  if (["Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Songs", "Lamentations"].includes(book)) return "poetry";
  if (["Isaiah", "Jeremiah", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"].includes(book)) return "prophet";
  if (book === "Revelation") return "apocalyptic";
  if (newTestamentBooks.includes(book)) return "epistle";
  return "history";
}

function spreadRefsByBook(refs) {
  const byBook = new Map();
  refs.forEach((ref) => {
    const parsed = parsePassageReference(ref);
    const book = parsed ? bookNameFromChapterKey(parsed.key) : "Other";
    if (!byBook.has(book)) byBook.set(book, []);
    byBook.get(book).push(ref);
  });

  const booksByDepth = [...byBook.keys()].sort((a, b) => {
    const diff = (byBook.get(b)?.length || 0) - (byBook.get(a)?.length || 0);
    return diff || books.indexOf(a) - books.indexOf(b);
  });
  const spread = [];
  while (booksByDepth.some((book) => byBook.get(book)?.length)) {
    booksByDepth.forEach((book) => {
      const ref = byBook.get(book)?.shift();
      if (ref) spread.push(ref);
    });
  }
  return spread;
}

function verseOfDayStep(poolLength) {
  const candidates = [41, 43, 37, 47, 53, 29, 31, 59, 61, 67, 23, 19, 17];
  return candidates.find((step) => step < poolLength && greatestCommonDivisor(step, poolLength) === 1) || 1;
}

function greatestCommonDivisor(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function referenceExists(ref) {
  const parsed = parsePassageReference(ref);
  if (!parsed) return false;
  const available = new Set((bibleData[parsed.key]?.verses || []).map((verse) => verse.n));
  if (!available.size && bibleData[parsed.key]) return parsed.verses.every((verse) => Number.isFinite(verse) && verse > 0);
  return parsed.verses.every((verse) => available.has(verse));
}

function parseReference(value) {
  const parsed = parsePassageReference(value);
  return parsed ? { key: parsed.key, verse: parsed.verse } : null;
}

function firstVerseFromReference(value) {
  return parsePassageReference(value)?.verse || "";
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
  const chapter = bibleData[parsed.key];
  state.isVerseOfDayActive = false;
  state.reference = parsed.key;
  state.verse = parsed.verse;
  state.selectedVerses = parsed.verses.length > 1 ? parsed.verses : [];
  if (chapter.verses.length && !chapter.verses.some((verse) => verse.n === state.verse)) state.verse = chapter.verses[0].n;
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
  scheduleCloudSync();
}

function activateWorkspace(target) {
  pendingLibraryEnter = !state.libraryOpen;
  state.activeRail = target;
  state.libraryOpen = true;
  localStorage.setItem("lw_library_open", "true");
  scheduleCloudSync();
  state.pendingPanelFocus = isCompactScreen() || isShortLandscapeScreen() ? null : target;
  renderPreservingReaderScroll();
}

function closeLibrary() {
  const readerScroll = captureReaderScroll();
  animateBeforeRemoval(".library", () => {
    state.libraryOpen = false;
    localStorage.setItem("lw_library_open", "false");
    scheduleCloudSync();
    render();
    restoreReaderScroll(readerScroll);
    requestAnimationFrame(() => {
      restoreReaderScroll(readerScroll);
      requestAnimationFrame(() => restoreReaderScroll(readerScroll));
    });
  }, { duration: 320 });
}

function adjustTextScale(delta) {
  state.textScale = clampTextScale(state.textScale + delta);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  scheduleCloudSync();
  render();
}

function resetTextScale() {
  state.textScale = 1;
  localStorage.setItem("lw_text_scale", "1");
  scheduleCloudSync();
  render();
}

let pendingFocusChromeEnter = false;
let pendingLibraryEnter = false;

function toggleFocusMode() {
  const enteringFocus = !state.focusMode;
  const applyFocusMode = () => {
    state.focusMode = enteringFocus;
    if (state.focusMode) state.mobileControlsOpen = false;
    else pendingFocusChromeEnter = true;
    localStorage.setItem("lw_focus_mode", String(state.focusMode));
    scheduleCloudSync();
    renderPreservingReaderScroll();
  };
  if (!enteringFocus) {
    applyFocusMode();
    return;
  }
  animateBeforeRemoval(
    ".rail, .library, .chapter-tools-region, .footer-region",
    applyFocusMode,
    { className: "focus-chrome-exit", duration: 240 },
  );
}

function toggleVerseNavCollapsed() {
  state.verseNavCollapsed = !state.verseNavCollapsed;
  localStorage.setItem("lw_verse_nav_collapsed", String(state.verseNavCollapsed));
  const region = document.querySelector(".chapter-tools-region");
  const content = document.getElementById("verseSelectorBar");
  const toggle = document.getElementById("verseNavCollapseToggle");
  region?.classList.toggle("collapsed", state.verseNavCollapsed);
  content?.toggleAttribute("inert", state.verseNavCollapsed);
  if (content) content.setAttribute("aria-hidden", String(state.verseNavCollapsed));
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!state.verseNavCollapsed));
    toggle.setAttribute("aria-label", state.verseNavCollapsed ? "Show verse selector bar" : "Hide verse selector bar");
    toggle.dataset.tooltip = state.verseNavCollapsed ? "Show verse selector" : "Hide verse selector";
  }
}

function toggleFooterCollapsed() {
  state.footerCollapsed = !state.footerCollapsed;
  localStorage.setItem("lw_footer_collapsed", String(state.footerCollapsed));
  const shell = document.querySelector(".app-shell");
  const region = document.querySelector(".footer-region");
  const content = document.getElementById("footerBar");
  const toggle = document.getElementById("footerCollapseToggle");
  shell?.classList.toggle("footer-collapsed", state.footerCollapsed);
  region?.classList.toggle("collapsed", state.footerCollapsed);
  content?.toggleAttribute("inert", state.footerCollapsed);
  if (content) content.setAttribute("aria-hidden", String(state.footerCollapsed));
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(!state.footerCollapsed));
    toggle.setAttribute("aria-label", state.footerCollapsed ? "Show footer bar" : "Hide footer bar");
    toggle.dataset.tooltip = state.footerCollapsed ? "Show footer" : "Hide footer";
  }
}

function toggleMobileControls() {
  if (state.mobileControlsOpen) {
    animateBeforeRemoval(
      ".app-shell.mobile-controls-open :is(.search, .versions, #shortcutsButton, .account-menu, .settings-menu)",
      () => {
        state.mobileControlsOpen = false;
        renderWithMobileTopbarResize();
      },
      { className: "mobile-control-exit", duration: 180 },
    );
    return;
  }
  state.mobileControlsOpen = true;
  renderWithMobileTopbarResize();
}

function renderWithMobileTopbarResize() {
  const previousHeight = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
  render();
  const topbar = document.querySelector(".topbar");
  if (!topbar || !previousHeight || !isCompactScreen()) return;
  const nextHeight = topbar.getBoundingClientRect().height;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion || Math.abs(nextHeight - previousHeight) < 1) return;
  topbar.style.overflow = "hidden";
  const animation = topbar.animate(
    [{ height: `${previousHeight}px` }, { height: `${nextHeight}px` }],
    { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
  );
  animation.finished
    .catch(() => {})
    .finally(() => {
      topbar.style.removeProperty("overflow");
    });
}

function toggleShortcuts(forceOpen) {
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !state.shortcutsOpen;
  if (state.shortcutsOpen && !nextOpen) {
    animateBeforeRemoval(".shortcut-overlay.open", () => {
      state.shortcutsOpen = false;
      render();
    }, { duration: 220 });
    return;
  }
  state.shortcutsOpen = nextOpen;
  render();
}

function closeHeaderVersionMenu() {
  if (!state.headerVersionMenuOpen) return;
  animateBeforeRemoval(".primary-version-menu", () => {
    state.headerVersionMenuOpen = false;
    renderPreservingReaderScroll();
  }, { duration: 180 });
}

function closeSettingsPopover() {
  if (!state.settingsOpen) return;
  animateBeforeRemoval(".settings-popover.open, .mobile-settings-popover", () => {
    state.settingsOpen = false;
    renderPreservingReaderScroll();
  }, { duration: 190 });
}

function closePresentationSettings() {
  if (!state.presentationSettingsOpen) return;
  animateBeforeRemoval(".presentation-settings-popover.open", () => {
    state.presentationSettingsOpen = false;
    render();
  }, { duration: 190 });
}

function markTutorialSeen() {
  state.tutorialIntroVisible = false;
  localStorage.setItem(tutorialStorageKey, "true");
}

function dismissTutorialIntro() {
  animateBeforeRemoval(".tutorial-welcome-overlay", () => {
    markTutorialSeen();
    renderPreservingReaderScroll();
  }, { duration: 220 });
}

function startTutorial() {
  markTutorialSeen();
  state.shortcutsOpen = false;
  state.settingsOpen = false;
  state.presentationSettingsOpen = false;
  state.headerVersionMenuOpen = false;
  state.tutorialActive = true;
  state.tutorialStep = 0;
  state.tutorialMode = state.mode === "big" ? "presentation" : "app";
  if (state.mode === "big") state.presentationControlsVisible = true;
  renderPreservingReaderScroll();
}

function finishTutorial() {
  animateBeforeRemoval(".tutorial-card", () => {
    state.tutorialActive = false;
    state.tutorialStep = 0;
    renderPreservingReaderScroll();
  }, { duration: 180 });
}

function advanceTutorial() {
  if (state.tutorialStep >= activeTutorialSteps().length - 1) {
    animateBeforeRemoval(".tutorial-card", () => {
      state.tutorialActive = false;
      state.tutorialStep = 0;
      renderPreservingReaderScroll();
      showToast("Tour complete");
    }, { duration: 180 });
    return;
  }
  state.tutorialStep += 1;
  renderPreservingReaderScroll();
}

function retreatTutorial() {
  state.tutorialStep = Math.max(0, state.tutorialStep - 1);
  renderPreservingReaderScroll();
}

function currentTutorialStep() {
  const steps = activeTutorialSteps();
  return steps[Math.min(Math.max(state.tutorialStep, 0), steps.length - 1)] || steps[0];
}

function activeTutorialSteps() {
  return state.tutorialMode === "presentation" ? presentationTutorialSteps : tutorialSteps;
}

function resolveTutorialTarget(step = currentTutorialStep()) {
  return step.target
    .split(",")
    .map((selector) => selector.trim())
    .map((selector) => document.querySelector(selector))
    .find((element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
}

function updateTutorialSpotlight() {
  if (!state.tutorialActive) return;
  const spotlight = document.getElementById("tutorialSpotlight");
  const card = document.getElementById("tutorialCard");
  if (!spotlight || !card) return;
  const target = resolveTutorialTarget();
  if (!target) {
    spotlight.classList.add("hidden");
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("right");
    card.style.removeProperty("bottom");
    return;
  }
  const rect = target.getBoundingClientRect();
  const pad = isCompactScreen() ? 7 : 9;
  const left = Math.max(8, rect.left - pad);
  const top = Math.max(8, rect.top - pad);
  const width = Math.min(window.innerWidth - left - 8, rect.width + pad * 2);
  const height = Math.min(window.innerHeight - top - 8, rect.height + pad * 2);
  spotlight.classList.remove("hidden");
  spotlight.style.left = `${left}px`;
  spotlight.style.top = `${top}px`;
  spotlight.style.width = `${width}px`;
  spotlight.style.height = `${height}px`;

  if (isCompactScreen()) {
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("right");
    card.style.removeProperty("bottom");
    return;
  }

  const cardRect = card.getBoundingClientRect();
  const gap = 18;
  const desiredLeft = rect.left + rect.width / 2 - cardRect.width / 2;
  const clampedLeft = Math.min(Math.max(18, desiredLeft), window.innerWidth - cardRect.width - 18);
  const canPlaceBelow = rect.bottom + gap + cardRect.height < window.innerHeight - 18;
  const desiredTop = canPlaceBelow ? rect.bottom + gap : rect.top - cardRect.height - gap;
  const clampedTop = Math.min(Math.max(18, desiredTop), window.innerHeight - cardRect.height - 18);
  card.style.left = `${clampedLeft}px`;
  card.style.top = `${clampedTop}px`;
  card.style.right = "auto";
  card.style.bottom = "auto";
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

  // Leave browser and operating-system shortcuts alone. This keeps common
  // commands such as Cmd/Ctrl+F, Cmd/Ctrl+P, Cmd/Ctrl+R, and Alt+Arrow working.
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "Escape") {
    if (state.tutorialActive) {
      event.preventDefault();
      return finishTutorial();
    }
    if (state.tutorialIntroVisible) {
      event.preventDefault();
      return dismissTutorialIntro();
    }
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
      return closeSettingsPopover();
    }
    if (state.headerVersionMenuOpen) {
      event.preventDefault();
      return closeHeaderVersionMenu();
    }
    if (state.presentationSearchOpen) {
      event.preventDefault();
      state.presentationSearchOpen = false;
      return render();
    }
    if (state.presentationSettingsOpen) {
      event.preventDefault();
      return closePresentationSettings();
    }
    if (state.mode === "big") {
      event.preventDefault();
      return returnFromPresentationToBible();
    }
  }

  if (typing || state.shortcutsOpen || state.tutorialActive || state.tutorialIntroVisible) return;

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
    n: "Annotations",
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
    Annotations: "#notesSection",
    Bookmarks: "#bookmarksSection",
    History: "#historySection",
    "Cross-Refs": "#crossRefsSection",
    Strong: "#strongSection",
  };
  const selector = focusMap[target] || "#crossRefsSection";
  const element = document.querySelector(selector);
  if (!element) return;
  const libraryPanel = element.closest(".library");

  if (target === "Verse" || target === "Search") {
    libraryPanel?.scrollTo({ top: 0, behavior: "auto" });
    element.focus?.({ preventScroll: true });
    return;
  }

  if (libraryPanel) {
    const libraryBounds = libraryPanel.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    libraryPanel.scrollTo({
      top: Math.max(0, libraryPanel.scrollTop + elementBounds.top - libraryBounds.top),
      behavior: "auto",
    });
  }
  if (target === "Notes" || target === "Annotations") {
    document.getElementById("noteBox")?.focus({ preventScroll: true });
  }
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
  state.isVerseOfDayActive = false;
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
  const scripture = document.querySelector(".scripture");
  const selected = scripture?.querySelector(`[data-verse="${state.verse}"]`)
    || document.querySelector(`[data-verse="${state.verse}"]`);
  if (!selected) return;
  if (scripture && scripture.scrollHeight > scripture.clientHeight) {
    const scriptureBounds = scripture.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    const centeredTop = scripture.scrollTop
      + selectedBounds.top
      - scriptureBounds.top
      - ((scripture.clientHeight - selectedBounds.height) / 2);
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
    scripture.scrollTo({ top: Math.max(0, centeredTop), behavior });
    return;
  }
  selected.scrollIntoView({ block: "center", behavior: "smooth" });
}

function moveVerse(direction) {
  const verses = currentChapter().verses.map((verse) => verse.n);
  const index = verses.indexOf(state.verse);
  state.verse = verses[Math.max(0, Math.min(verses.length - 1, index + direction))];
  state.isVerseOfDayActive = false;
  recordHistory();
  render();
}

function moveChapter(direction) {
  const keys = Object.keys(bibleData);
  const index = keys.indexOf(state.reference);
  state.reference = keys[Math.max(0, Math.min(keys.length - 1, index + direction))];
  state.verse = currentChapter().verses[0].n;
  state.selectedVerses = [];
  state.isVerseOfDayActive = false;
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
  scheduleCloudSync();
  render();
}

function saveNote() {
  const note = document.getElementById("noteBox").value.trim();
  const ref = activePassageLabel();
  if (note) state.notes[ref] = note;
  else delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  scheduleCloudSync();
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
  scheduleCloudSync();
  showToast("Bookmark updated");
  render();
}

function deleteBookmark(ref) {
  state.bookmarks = state.bookmarks.filter((item) => item !== ref);
  localStorage.setItem("lw_bookmarks", JSON.stringify(state.bookmarks));
  scheduleCloudSync();
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
  scheduleCloudSync();
  showToast(note ? "Note updated" : "Note deleted");
  render();
}

function deleteNote(ref) {
  delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  scheduleCloudSync();
  showToast("Note deleted");
  render();
}

function openHighlightNote(ref) {
  if (!setReferenceFromString(ref)) return;
  state.activeRail = "Annotations";
  state.libraryOpen = true;
  state.pendingPanelFocus = "Annotations";
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
  scheduleCloudSync();
  showToast("Highlight removed");
  renderPreservingReaderScroll();
}

function deleteHistoryItem(ref) {
  state.history = state.history.filter((item) => (typeof item === "string" ? item : item.ref) !== ref);
  localStorage.setItem("lw_history", JSON.stringify(state.history));
  scheduleCloudSync();
  showToast("History item deleted");
  render();
}

function clearHistory() {
  state.history = [];
  localStorage.setItem("lw_history", JSON.stringify(state.history));
  scheduleCloudSync();
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
  renderPreservingReaderScroll();
}

function applyHighlight(color) {
  const verses = selectedVerseNumbers();
  if (!verses.length) return;
  const normalizedColor = normalizeHighlightColor(color);
  const shouldRemove = color === "none";
  const highlightColor = highlightColors.includes(color) ? color : normalizedColor;
  if (!shouldRemove && !highlightColor) return;
  verses.forEach((verseNumber) => {
    const ref = `${state.reference}:${verseNumber}`;
    if (highlightColor) state.highlights[ref] = highlightColor;
    else delete state.highlights[ref];
  });
  if (normalizedColor) {
    state.customHighlightColor = normalizedColor;
    localStorage.setItem("lw_custom_highlight_color", normalizedColor);
  }
  localStorage.setItem("lw_highlights", JSON.stringify(state.highlights));
  scheduleCloudSync();
  showToast(shouldRemove ? "Highlight removed" : "Highlight added");
  renderPreservingReaderScroll();
}

function selectedVerseNumbers() {
  return state.selectedVerses.length ? state.selectedVerses : [state.verse];
}

function dismissSelectionBarOnOutsideClick(event) {
  if (!state.selectedVerses.length) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest(".selection-bar, .cross-ref-popup, .strong-popup")) return;
  state.selectedVerses = [];
  renderPreservingReaderScroll();
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
  return `${reference} ${translationDisplayCode(state.versions[0])}\n${lines.map(({ n, text }) => `${n}. ${text}`).join("\n")}`;
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

function syncModeUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("mode") === state.mode && !url.searchParams.has("view")) return;
  url.searchParams.set("mode", state.mode);
  url.searchParams.delete("view");
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
  const passage = presentation.querySelector(".presentation-passage");
  const copy = presentation.querySelector(".presentation-copy");
  if (!viewport || !passage || !copy) return;

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

  const fits = () => passage.scrollHeight <= viewport.clientHeight * 0.92 && passage.scrollWidth <= viewport.clientWidth * 0.98;
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
    await loadBibleParagraphMetadata();
    const bundledVersions = new Set(["BSB", ...state.versions.filter(isBundledTranslation)]);
    await Promise.all([...bundledVersions].map(loadBibleVersion));
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
  if (isRemoteTranslation(version)) {
    await ensureRemoteBibleVersion(version, state.reference);
    return;
  }
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

function remoteVersionLoadKey(version, chapterKey) {
  return `${version}:${chapterKey}`;
}

function supabaseFunctionUrl(functionName, params = {}) {
  const config = window.BigScreenBibleSupabase || {};
  if (!config.url || !config.anonKey) return "";
  const baseUrl = config.url.replace(/\/$/, "");
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}/functions/v1/${functionName}?${searchParams}`;
}

function remoteFunctionUrl(version, chapterKey) {
  const provider = translationProvider(version);
  if (!provider.edgeFunction) return "";
  const params = provider === bibleProviders.apiBible
    ? { version, ref: chapterKey }
    : { ref: chapterKey };
  return supabaseFunctionUrl(provider.edgeFunction, params);
}

function trackApiBibleView(fumsToken) {
  if (!fumsToken || trackedFumsTokens.has(fumsToken)) return;
  trackedFumsTokens.add(fumsToken);
  if (state.authUser?.id) window.fums?.("config", { userId: state.authUser.id });
  window.fums?.("trackView", fumsToken);
}

async function ensureRemoteBibleVersion(version, chapterKey) {
  if (!isRemoteTranslation(version)) return;
  const loadKey = remoteVersionLoadKey(version, chapterKey);
  if (remoteVersionData.has(loadKey) || loadingVersions.has(loadKey)) return;

  const config = window.BigScreenBibleSupabase || {};
  const provider = translationProvider(version);
  const url = remoteFunctionUrl(version, chapterKey);
  if (!url || !config.anonKey) {
    remoteVersionErrors.set(loadKey, "Remote Bible version is not configured.");
    return;
  }

  loadingVersions.add(loadKey);
  remoteVersionErrors.delete(loadKey);
  try {
    const response = await fetch(url, {
      cache: provider === bibleProviders.apiBible ? "no-store" : "default",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `${version} request failed`);
    }
    const verses = Array.isArray(payload.verses) ? payload.verses : [];
    if (!verses.length) throw new Error(`${version} returned no verses`);
    remoteVersionData.set(loadKey, { ...payload, verses });
    mergeRemoteVersionChapter(version, chapterKey, verses);
    if (provider.tracksFums) trackApiBibleView(payload.fumsToken);
  } catch (error) {
    console.error(error);
    remoteVersionErrors.set(loadKey, error.message || `${version} could not be loaded`);
  } finally {
    loadingVersions.delete(loadKey);
    renderPreservingReaderScroll();
  }
}

function apiBibleAttributionMarkup(versions, className = "") {
  const notices = [];
  const seen = new Set();
  versions.forEach((version) => {
    if (translationProvider(version) !== bibleProviders.apiBible) return;
    const payload = remoteVersionData.get(remoteVersionLoadKey(version, state.reference));
    const copyright = String(payload?.copyright || "").trim();
    if (!copyright || seen.has(copyright)) return;
    seen.add(copyright);
    notices.push(`<span>${escapeHtml(copyright)}</span>`);
  });
  if (!notices.length) return "";
  const classes = ["scripture-attribution", className].filter(Boolean).join(" ");
  return `
    <aside class="${classes}" aria-label="Bible translation copyright">
      ${notices.join("")}
    </aside>
  `;
}

function mergeRemoteVersionChapter(version, chapterKey, verses) {
  const chapter = bibleData[chapterKey];
  if (!chapter) return;
  verses.forEach(({ n, text, paragraphStart }) => {
    if (!Number.isFinite(Number(n)) || !text) return;
    let verse = chapter.verses.find((item) => item.n === Number(n));
    if (!verse) {
      verse = { n: Number(n) };
      chapter.verses.push(verse);
    }
    verse[version] = text;
    if (typeof paragraphStart === "boolean") {
      verse.paragraphStart = verse.paragraphStart || {};
      verse.paragraphStart[version] = paragraphStart;
    }
  });
  chapter.verses.sort((a, b) => a.n - b.n);
}

async function loadBibleParagraphMetadata() {
  await loadBibleBundleScript("paragraphs", {
    globalName: "BIGSCREEN_BIBLE_PARAGRAPHS",
    optional: true,
  });
  bibleParagraphs = window.BIGSCREEN_BIBLE_PARAGRAPHS || null;
}

function loadBibleBundleScript(name, options = {}) {
  const globalName = options.globalName || (name === "index" ? "BIGSCREEN_BIBLE_INDEX" : `BIGSCREEN_BIBLE_${name}`);
  if (window[globalName]) return Promise.resolve();

  const scriptId = `bible-data-${name}`;
  const existing = document.getElementById(scriptId);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => {
        if (options.optional) {
          resolve();
          return;
        }
        reject(new Error(`${name} Bible data failed to load`));
      }, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `./assets/bibles/${name}.js`;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => {
      const error = new Error(`${name} Bible data failed to load`);
      if (options.optional) {
        console.info(error.message);
        resolve();
        return;
      }
      reject(error);
    }, { once: true });
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
        if (sourceVerse.paragraphStart === true) {
          verse.paragraphStart = verse.paragraphStart || {};
          verse.paragraphStart[version] = true;
        }
      });
    });
  });
  applyParagraphMetadata(merged);
  Object.values(merged).forEach((chapter) => chapter.verses.sort((a, b) => a.n - b.n));
  bibleData = merged;
  remoteVersionData.forEach((payload, loadKey) => {
    const [version, ...chapterParts] = loadKey.split(":");
    mergeRemoteVersionChapter(version, chapterParts.join(":"), payload.verses || []);
  });
}

function applyParagraphMetadata(merged) {
  const versions = bibleParagraphs?.versions || {};
  Object.entries(versions).forEach(([version, chapters]) => {
    Object.entries(chapters || {}).forEach(([chapterKey, starts]) => {
      const chapter = merged[chapterKey];
      if (!chapter || !Array.isArray(starts)) return;
      const startSet = new Set(starts.map((value) => Number(value)).filter(Number.isFinite));
      chapter.verses.forEach((verse) => {
        if (!startSet.has(verse.n)) return;
        verse.paragraphStart = verse.paragraphStart || {};
        verse.paragraphStart[version] = true;
      });
    });
  });
}

function chapterKeys() {
  const sourceBooks = bibleIndex?.books?.length ? bibleIndex.books.map(({ name, chapters }) => [name, chapters]) : bookDefinitions;
  return sourceBooks.flatMap(([book, chapters]) => Array.from({ length: chapters }, (_, index) => `${book} ${index + 1}`));
}

const compactWidthQuery = window.matchMedia?.("(max-width: 840px)");
compactWidthQuery?.addEventListener("change", () => {
  state.settingsOpen = false;
  state.headerVersionMenuOpen = false;
  renderPreservingReaderScroll();
});
const shortLandscapeQuery = window.matchMedia?.("(orientation: landscape) and (max-width: 1024px) and (max-height: 560px)");
shortLandscapeQuery?.addEventListener("change", () => {
  state.settingsOpen = false;
  state.headerVersionMenuOpen = false;
  renderPreservingReaderScroll();
});
window.addEventListener("scroll", updateReaderTopButton, { passive: true });
window.addEventListener("scroll", revealMobileSettingsButton, { passive: true });
window.addEventListener("scroll", updateTutorialSpotlight, { passive: true });
window.addEventListener("scroll", positionAccountPopover, { passive: true });
window.addEventListener("scroll", positionSettingsPopover, { passive: true });
window.addEventListener("resize", () => {
  updateTutorialSpotlight();
  positionAccountPopover();
  positionSettingsPopover();
});
document.addEventListener("click", (event) => {
  if (!state.headerVersionMenuOpen || event.target.closest?.(".primary-version-control, .version-manager")) return;
  closeHeaderVersionMenu();
});
document.addEventListener("click", dismissSelectionBarOnOutsideClick);
document.addEventListener("fullscreenchange", render);
document.addEventListener("webkitfullscreenchange", render);
const streakUpdatedToday = recordReadingStreak();
state.streakPopupVisible = state.showStreakPopup && streakUpdatedToday;
watchSystemTheme();
initializeSupabaseAuth();
initializeBibleData();
