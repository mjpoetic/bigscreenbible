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
const searchScopeDefinitions = [
  { code: "all", label: "All Bible", shortLabel: "All" },
  { code: "book", label: "Current book", shortLabel: "Bk" },
  { code: "chapter", label: "Current chapter", shortLabel: "Ch" },
  { code: "ot", label: "Old Testament", shortLabel: "OT" },
  { code: "nt", label: "New Testament", shortLabel: "NT" },
  { code: "law", label: "Law", shortLabel: "Law" },
  { code: "history", label: "History", shortLabel: "His" },
  { code: "psalms", label: "Psalms", shortLabel: "Psa" },
  { code: "wisdom", label: "Wisdom", shortLabel: "Wis" },
  { code: "prophets", label: "Prophets", shortLabel: "Pro" },
  { code: "gospels", label: "Gospels", shortLabel: "Gos" },
  { code: "acts", label: "Acts", shortLabel: "Act" },
  { code: "epistles", label: "Epistles", shortLabel: "Epi" },
  { code: "revelation", label: "Revelation", shortLabel: "Rev" },
];
const searchScopeCodes = searchScopeDefinitions.map(({ code }) => code);
const searchScopeBookGroups = {
  law: books.slice(0, books.indexOf("Joshua")),
  history: books.slice(books.indexOf("Joshua"), books.indexOf("Job")),
  psalms: ["Psalm"],
  wisdom: ["Job", "Proverbs", "Ecclesiastes", "Song of Songs"],
  prophets: books.slice(books.indexOf("Isaiah"), books.indexOf("Matthew")),
  gospels: ["Matthew", "Mark", "Luke", "John"],
  acts: ["Acts"],
  epistles: books.slice(books.indexOf("Romans"), books.indexOf("Revelation")),
  revelation: ["Revelation"],
};

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
    showsAttribution: true,
  },
  youVersion: {
    type: "remote",
    edgeFunction: "youversion-passage",
    supportsSearch: false,
    showsAttribution: true,
  },
};

const translations = [
  { code: "AMP", name: "Amplified Bible", provider: "youVersion" },
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

const printLayouts = [
  { code: "standard", name: "Standard", description: "One verse per line, matching the current print layout." },
  { code: "paragraph", name: "Paragraph", description: "Natural paragraph flow when paragraph breaks are available for the selected Bible version." },
  { code: "big-screen", name: "Big Screen", description: "Large quotation-style Scripture with the reference above it." },
];
const printLayoutCodes = printLayouts.map((layout) => layout.code);

const themePresets = [
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
const themeChromeColors = {
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
};
const defaultScriptureFont = "literata";
const scriptureFonts = [
  { code: "literata", name: "Literata" },
  { code: "libre", name: "Libre Baskerville" },
  { code: "lora", name: "Lora" },
  { code: "crimson", name: "Crimson Text" },
  { code: "noto-sans", name: "Noto Sans" },
  { code: "figtree", name: "Figtree" },
  { code: "source-sans", name: "Source Sans 3" },
  { code: "manrope", name: "Manrope" },
  { code: "atkinson-hyperlegible-next", name: "Atkinson Hyperlegible Next" },
  { code: "custom", name: "Custom device font" },
];
const scriptureFontCodes = scriptureFonts.map((font) => font.code);
const legacyScriptureFontCodes = {
  merriweather: "literata",
  "ibm-plex-sans": "manrope",
};
const defaultInterfaceTextSize = "default";
const defaultPresentationTextScale = 1;
const interfaceTextSizes = [
  { code: "default", name: "Default", percent: 100 },
  { code: "large", name: "Large", percent: 112 },
  { code: "larger", name: "Larger", percent: 125 },
];
const interfaceTextSizeCodes = interfaceTextSizes.map((size) => size.code);
const defaultAutoScrollSpeed = "normal";
const autoScrollSpeeds = [
  { code: "slow", name: "Slow", pixelsPerSecond: 10 },
  { code: "normal", name: "Normal", pixelsPerSecond: 24 },
  { code: "fast", name: "Fast", pixelsPerSecond: 48 },
];
const autoScrollSpeedCodes = autoScrollSpeeds.map((speed) => speed.code);

function normalizedScriptureFont(font) {
  const normalized = legacyScriptureFontCodes[font] || font;
  return scriptureFontCodes.includes(normalized) ? normalized : defaultScriptureFont;
}

function normalizedInterfaceTextSize(size) {
  return interfaceTextSizeCodes.includes(size) ? size : defaultInterfaceTextSize;
}

function normalizedAutoScrollSpeed(speed) {
  return autoScrollSpeedCodes.includes(speed) ? speed : defaultAutoScrollSpeed;
}

let bibleData = {};
let bibleIndex = null;
let bibleParagraphs = null;
let bibleSectionHeadings = null;
let bibleRedLetters = null;
let dataLoading = true;
let dataError = "";
let strongLexicon = {};
let strongLexiconStatus = "idle";
let strongLexiconPromise = null;
let presentationControlsTimer = 0;
let presentationTouchStart = null;
let presentationPinchGesture = null;
let presentationScaleFeedbackTimer = 0;
let presentationEnterDirection = 0;
let presentationTransitionTimer = 0;
let readerChapterTouchStart = null;
let readerChapterPull = null;
let readerChapterPullSettleTimer = 0;
let readerChapterWheelPull = null;
let readerChapterWheelTimer = 0;
let readerChapterEdgeBuffer = null;
let chapterNavigationTransitionTimer = 0;
let chapterNavigationInProgress = false;
let readerTouchGesture = null;
let readerBlankTapStart = null;
let lastReaderBlankTap = null;
let readerGestureFeedbackTimer = 0;
let readerAutoScrollFrame = 0;
let readerAutoScrollLastTime = 0;
let readerAutoScrollPosition = 0;
let presentationResizeTimer = 0;
let readerViewportRestoreTimer = 0;
let readerAppVisibilityRestoreTimer = 0;
let readerAppVisibilityScrollState = null;
let readerPositionPersistTimer = 0;
let pendingReaderPositionPersistState = null;
let readerAppResumeRestoreDeadline = 0;
let readerUserScrollIntentUntil = 0;
let readerLifecycleHeartbeatAt = Date.now();
let lastReaderScrollAnchor = null;
let lastReaderNonTopScrollAnchor = null;
let lastReaderViewportSize = null;
const modeScrollStates = new Map();
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
let statusToastTimer = 0;
let verseOfDayRequest = null;
let activeTriviaCelebration = null;
let triviaCelebrationToken = 0;
let gameChallengeRealtimeChannel = null;
let gameRoomPresenceChannel = null;
let gameRoomPresenceId = "";
let gameChallengeRefreshTimer = 0;
let gameChallengeLoadSequence = 0;
let gameChallengeRefreshInFlight = false;
let gameChallengeRefreshQueued = false;
let gameChallengePopupNotice = null;
let gameChallengePopupQueue = [];
let dismissedGameChallengePopupKeys = null;
let triviaRandomSource = Math.random;
const streakStorageKey = "lw_reading_streak";
const bookSprintBestStorageKey = "lw_book_sprint_bests";
const triviaRoundLengths = [5, 10, 15, 20];
const bookSprintRoundLengths = [5, 10];
const tutorialStorageKey = "lw_tutorial_seen";
const pushPromptDismissedStorageKey = "lw_push_prompt_dismissed";
const gameChallengePopupDismissedStorageKey = "lw_dismissed_game_challenge_popups";
const socialConnectionsOpenStorageKey = "lw_social_connections_open";
const libraryScrollStorageKey = "lw_library_scroll_by_rail";
const readerPositionStorageKey = "lw_reader_position";
const appUpdateRestoreStorageKey = "lw_app_update_restore";
const appUpdateQueryKey = "appUpdate";
const appUpdateScrollVerseQueryKey = "appUpdateVerse";
const appUpdateScrollOffsetQueryKey = "appUpdateOffset";
const appUpdateScrollTopQueryKey = "appUpdateScroll";
const appUpdateCheckIntervalMs = 15 * 60 * 1000;
const accountSwitchNoticeDurationMs = 2000;
const readerAppResumeRestoreWindowMs = 1600;
const readerLifecycleHeartbeatIntervalMs = 300;
const readerLifecycleResumeGapMs = 1200;
const appVersion = document.querySelector('meta[name="app-version"]')?.content || "unknown";
const horizontalSwipeMaxMs = 850;
const horizontalSwipeMinPx = 56;
const horizontalSwipeDominance = 1.35;
const presentationSwipeCommitMs = 180;
const readerChapterPullStartPx = 7;
const readerChapterPullThresholdPx = 76;
const readerChapterPullMaxPx = 112;
const readerChapterPullDominance = 1.15;
const readerChapterPullBoundaryPx = 2;
const readerChapterWheelStepMaxPx = 28;
const readerChapterWheelIdleMs = 190;
const readerChapterWheelEdgeSettleMs = 260;
const readerChapterWheelSequenceGapMs = 220;
const chapterNavigationExitMs = 150;
const chapterNavigationEnterMs = 260;
const readerPinchStartPx = 10;
const readerGestureMoveTolerancePx = 18;
const readerTwoFingerTapMaxMs = 360;
const readerDoubleTapMaxMs = 380;
const readerDoubleTapDistancePx = 44;
const cloudSyncTable = "bsb_user_sync";
const socialProfileTable = "bsb_profiles";
const friendshipTable = "bsb_friendships";
const gameChallengeTable = "bsb_game_challenges";
const gameChallengePlayerTable = "bsb_game_challenge_players";
const accountDataOwnerStorageKey = "lw_account_data_owner";
const guestSnapshotStorageKey = "lw_guest_snapshot";
const accountSnapshotStoragePrefix = "lw_account_snapshot:";
const rememberedAccountsStorageKey = "lw_remembered_accounts";
const accountSessionStoragePrefix = "lw_account_session:";
const pendingAccountSwitchStorageKey = "lw_pending_account_switch";
const guestDataOwner = "guest";
const rememberedAccountLimit = 6;
const socialAvatarOptions = [
  { key: "initials", label: "Initials", icon: "user" },
  { key: "book", label: "Open Bible", icon: "book" },
  { key: "sun", label: "Sunrise", icon: "sun" },
  { key: "flame", label: "Flame", icon: "flame" },
  { key: "bookmark", label: "Bookmark", icon: "bookmark" },
  { key: "quote", label: "Quotation", icon: "quote" },
  { key: "cross", label: "Cross", icon: "cross" },
  { key: "heart", label: "Heart", icon: "heart" },
  { key: "star", label: "Star", icon: "star" },
  { key: "dove", label: "Dove", icon: "dove" },
  { key: "fish", label: "Fish", icon: "fish" },
  { key: "mountain", label: "Mountain", icon: "mountain" },
  { key: "leaf", label: "Leaf", icon: "leaf" },
  { key: "crown", label: "Crown", icon: "crown" },
  { key: "compass", label: "Compass", icon: "compass" },
  { key: "moon", label: "Moon", icon: "moon" },
];
const socialAvatarQuickOptions = socialAvatarOptions.slice(0, 6);
const socialAvatarMoreOptions = socialAvatarOptions.slice(6);
const socialAvatarKeys = socialAvatarOptions.map((option) => option.key);
const confettiModuleUrl = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.module.mjs";
const defaultVerseOfDaySourceUrl = "https://www.verseoftheday.com/";
let lastAppUpdateCheckAt = 0;
let announcedAppUpdateVersion = "";
let pendingAppUpdateRestore = null;
let appUpdateRestoreAnnouncementTimer = 0;
let appUpdateRestoreCleanupTimer = 0;
let pendingChapterChange = null;
let accountSwitchNotice = null;
let accountSwitchNoticeTimer = 0;
let handledSocialNotificationDeepLink = "";

const loadedVersionData = new Map();
const loadingVersions = new Set();
const remoteVersionData = new Map();
const remoteVersionErrors = new Map();
const remoteSearchErrors = new Map();
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

let searchRequestId = 0;
let activeSearchScopeMenu = null;

const state = {
  mode: "reader",
  reference: "John 3",
  verse: 16,
  versions: JSON.parse(localStorage.getItem("lw_versions") || '["BSB","KJV"]'),
  versionsUpdatedAt: normalizedVersionsUpdatedAt(localStorage.getItem("lw_versions_updated_at")),
  theme: savedTheme(),
  themePreset: "",
  scriptureFont: localStorage.getItem("lw_scripture_font") || defaultScriptureFont,
  customScriptureFont: localStorage.getItem("lw_custom_scripture_font") || "",
  textScale: Number(localStorage.getItem("lw_text_scale") || 1),
  interfaceTextSize: normalizedInterfaceTextSize(localStorage.getItem("lw_interface_text_size")),
  autoScrollActive: false,
  autoScrollEnabled: localStorage.getItem("lw_auto_scroll_enabled") === "true",
  autoScrollSpeed: normalizedAutoScrollSpeed(localStorage.getItem("lw_auto_scroll_speed")),
  edgeChapterNavigationEnabled: localStorage.getItem("lw_edge_chapter_navigation_enabled") !== "false",
  paragraphLayout: savedParagraphLayout(),
  printLayout: savedPrintLayout(),
  printVerseNumbers: localStorage.getItem("lw_print_verse_numbers") !== "false",
  printFullVersionName: localStorage.getItem("lw_print_full_version_name") === "true",
  sectionHeadings: localStorage.getItem("lw_section_headings") !== "false",
  redLetters: savedRedLetters(),
  strongNumbers: savedStrongNumbers(),
  sideToolbarPosition: savedSideToolbarPosition(),
  focusMode: savedFocusMode(),
  verseNavCollapsed: localStorage.getItem("lw_verse_nav_collapsed") !== "false",
  footerCollapsed: localStorage.getItem("lw_footer_collapsed") === "true",
  libraryOpen: localStorage.getItem("lw_library_open") !== "false",
  activeRail: "Verse",
  selectedStrong: "G2316",
  selectedStrongWord: "God",
  mobileControlsOpen: false,
  presentationSearchOpen: false,
  presentationSettingsOpen: false,
  presentationControlsVisible: !isCompactScreen(),
  presentationPart: 0,
  presentationTheme: localStorage.getItem("lw_presentation_theme") || defaultPresentationTheme,
  presentationTextScale: Number(localStorage.getItem("lw_presentation_text_scale") || defaultPresentationTextScale),
  startBigScreen: localStorage.getItem("lw_start_big_screen") !== "false",
  startVerseOfDay: localStorage.getItem("lw_start_verse_of_day") !== "false",
  isVerseOfDayActive: false,
  verseOfDayItem: null,
  showStreakPopup: localStorage.getItem("lw_show_streak_popup") !== "false",
  pushSupported: false,
  pushPermissionDenied: false,
  pushInitialized: false,
  pushEnabled: localStorage.getItem("lw_push_enabled") === "true",
  pushMorningTime: localStorage.getItem("lw_push_morning_time") || "07:00",
  pushEveningEnabled: localStorage.getItem("lw_push_evening_enabled") !== "false",
  pushEveningTime: localStorage.getItem("lw_push_evening_time") || "18:00",
  pushFriendRequestNotifications: localStorage.getItem("lw_push_friend_requests") !== "false",
  pushGameChallengeNotifications: localStorage.getItem("lw_push_game_challenges") !== "false",
  pushChallengeAcceptedNotifications: localStorage.getItem("lw_push_challenge_accepted") !== "false",
  challengeQuietMode: localStorage.getItem("lw_challenge_quiet_mode") === "true",
  pushStatus: "Checking notification support…",
  pushBusy: false,
  pushPromptVisible: false,
  appUpdateBusy: false,
  appUpdateRefreshing: false,
  appUpdateAvailable: false,
  appUpdateRefreshOffered: false,
  appUpdateVersion: "",
  appUpdateStatus: "Check for a newly published version without closing the app.",
  startupApplied: false,
  settingsOpen: false,
  focusReferenceOpen: false,
  focusSearchResultsOpen: false,
  focusToolsOpen: false,
  focusWorkspacePanel: "",
  settingsSectionsOpen: {
    accessibility: false,
    reading: true,
    startup: false,
    printing: false,
    updates: false,
  },
  settingsAnchor: "header",
  settingsPopupPosition: null,
  streakPopoverOpen: false,
  headerVersionMenuOpen: false,
  footerVersionMenuOpen: false,
  parallelVersionMenuIndex: null,
  parallelVersionMenuPosition: null,
  shortcutsOpen: false,
  helpSectionsOpen: {
    keyboard: false,
  },
  shortcutsPopupPosition: null,
  aboutMenuOpen: false,
  aboutMenuAnchor: "aboutMenuButton",
  tutorialIntroVisible: localStorage.getItem(tutorialStorageKey) !== "true",
  tutorialActive: false,
  tutorialStep: 0,
  tutorialMode: "app",
  tutorialRestoreState: null,
  searchQuery: "",
  searchResultsQuery: "",
  searchScope: normalizedSearchScope(localStorage.getItem("lw_search_scope")),
  searchResultsScope: normalizedSearchScope(localStorage.getItem("lw_search_scope")),
  searchResultsChapter: "John 3",
  searchResults: [],
  searchPending: false,
  inlineSearchQuery: "",
  inlineSearchChapter: "",
  inlineSearchPhraseOnly: false,
  inlineSearchHitIndex: -1,
  inlineSearchMatchCount: 0,
  inlineSearchWrapPending: false,
  pendingInlineSearchFocus: false,
  pendingInlineSearchInputFocus: "",
  pendingPanelFocus: null,
  pendingVerseFocus: false,
  pendingLibraryScrollRestore: false,
  readerReturnStack: [],
  returnSelectionToolsOpen: false,
  openAnnotationShelves: [],
  openAnnotationGroups: [],
  touchedAnnotationGroupCollections: [],
  libraryScrollByRail: savedLibraryScrollByRail(),
  selectedVerses: [],
  keyboardSelectionAnchor: null,
  noteComposerRef: "",
  noteComposerAnchor: null,
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
  authEmailCueId: "",
  authBusy: false,
  accountSwitching: false,
  accountAddOpen: false,
  accountOpen: false,
  socialProfile: null,
  socialProfileDraft: null,
  socialProfileStatus: "idle",
  socialProfileMessage: "",
  socialProfileBusy: false,
  socialProfileOpen: false,
  socialConnectionsOpen: localStorage.getItem(socialConnectionsOpenStorageKey) === "true",
  friendships: [],
  friendshipProfiles: {},
  friendshipStatus: "idle",
  friendshipMessage: "",
  friendshipActionBusyId: "",
  friendsPanelTab: "friends",
  friendSearchQuery: "",
  friendSearchResults: [],
  friendSearchStatus: "idle",
  friendSearchMessage: "",
  gameChallenges: [],
  gameChallengePlayers: {},
  gameChallengeProfiles: {},
  gameChallengeStatus: "idle",
  gameChallengeMessage: "",
  gameChallengeActionBusyId: "",
  gameChallengeRealtimeStatus: "idle",
  challengeOpponentIds: [],
  gameRoomOnlineUserIds: [],
  activeGameChallengeId: "",
  passwordChangeOpen: false,
  passwordRecoveryMode: false,
  syncStatus: "local",
  syncMessage: "",
  lastCloudSyncAt: "",
};

let activePopupDrag = null;
let pendingNoteComposerFocus = false;

if (state.triviaGameType === "reference-rush") state.triviaDifficulty = "Easy";
state.triviaCount = normalizedTriviaCount(state.triviaGameType, state.triviaCount);

const highlightColors = ["yellow", "blue", "pink", "green", "orange", "purple"];

state.versions = state.versions.filter((version) => translationCodes.includes(version));
if (state.versions.length === 0) state.versions = ["BSB", "KJV"];
if (!state.versions.some(isBundledTranslation)) state.versions.unshift("BSB");
state.themePreset = savedThemePreset(state.theme);
if (!presentationThemeCodes.includes(state.presentationTheme)) state.presentationTheme = defaultPresentationTheme;
state.scriptureFont = normalizedScriptureFont(state.scriptureFont);

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
  return false;
}

function savedRedLetters() {
  const saved = localStorage.getItem("lw_red_letters");
  if (saved === "true") return true;
  if (saved === "false") return false;
  return true;
}

function savedStrongNumbers() {
  const saved = localStorage.getItem("lw_strong_numbers");
  if (saved === "true") return true;
  if (saved === "false") return false;
  return false;
}

function savedParagraphLayout() {
  const saved = localStorage.getItem("lw_paragraph_layout");
  if (saved === "true") return true;
  if (saved === "false") return false;
  return true;
}

function savedPrintLayout() {
  const saved = localStorage.getItem("lw_print_layout");
  return printLayoutCodes.includes(saved) ? saved : "standard";
}

function savedSideToolbarPosition() {
  return localStorage.getItem("lw_side_toolbar_position") === "right" ? "right" : "left";
}

function savedReadingStreak() {
  try {
    return normalizeReadingStreak(JSON.parse(localStorage.getItem(streakStorageKey) || "{}"));
  } catch {
    return normalizeReadingStreak({});
  }
}

function savedLibraryScrollByRail() {
  try {
    const saved = JSON.parse(localStorage.getItem(libraryScrollStorageKey) || "{}");
    if (!saved || typeof saved !== "object") return {};
    return Object.fromEntries(
      Object.entries(saved)
        .filter(([, value]) => value && typeof value === "object")
        .map(([key, value]) => [key, {
          top: Math.max(0, Number(value.top) || 0),
          left: Math.max(0, Number(value.left) || 0),
        }]),
    );
  } catch {
    return {};
  }
}

function normalizeReadingStreak(value) {
  const current = Math.max(0, Number(value?.current) || 0);
  const lastVisit = isDateKey(value?.lastVisit) ? value.lastVisit : "";
  return {
    current,
    best: Math.max(0, Number(value?.best) || 0),
    totalDays: Math.max(0, Number(value?.totalDays) || 0),
    lastVisit,
    days: normalizedStreakDays([
      ...(Array.isArray(value?.days) ? value.days : []),
      ...inferredStreakDays(current, lastVisit),
    ]),
  };
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function dateFromKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateKeyOffset(key, offset) {
  const date = dateFromKey(key);
  if (!date) return "";
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function normalizedStreakDays(days) {
  return [...new Set((days || []).filter(isDateKey))].sort().slice(-180);
}

function inferredStreakDays(current, lastVisit) {
  if (!current || !isDateKey(lastVisit)) return [];
  return Array.from({ length: Math.min(current, 180) }, (_, index) => dateKeyOffset(lastVisit, -index)).filter(Boolean);
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
    days: normalizedStreakDays([...(streak.days || []), today]),
  };
  localStorage.setItem(streakStorageKey, JSON.stringify(state.streak));
  scheduleCloudSync();
  return true;
}

const icons = {
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  bookmarkAdd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10v18l-5-3.5L5 21z"/><path d="M19 3v6M16 6h6" stroke-width="2.1"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  noteAdd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 4.5h13v16h-13z" stroke-width="1.7"/><path d="M7.5 9h5M7.5 13h4.5M7.5 17h3" stroke-width="1.6"/><path d="M20 2.75v5.5M17.25 5.5h5.5" stroke-width="2.2"/></svg>',
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
  highlighter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 5.6-1.4"/><path d="m14.7 4.3 5 5"/><path d="M13.5 3.1a2.1 2.1 0 0 1 3 0l4.4 4.4a2.1 2.1 0 0 1 0 3l-8.6 8.6-7.4-7.4z"/><path d="m5 12 7 7"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="11" height="13" rx="1.5"/><path d="M5 16H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 3h9.5A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6"/><path d="M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/><path d="M17 12h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 10v7"/><path d="M12 7h.01"/></svg>',
  clear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M6.5 8.5h11"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.9a5.1 5.1 0 0 0-7.2 0L12 7.5l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 22l8.8-8.9a5.1 5.1 0 0 0 0-7.2z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"/></svg>',
  dove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 5.5c-4.4.3-7.4 2.1-8.9 5.3C9.8 8.7 7.1 7.4 3.5 7.3c1.1 3.6 3.4 6 7 7.1-.5 2.2-2 4.1-4.2 5.3 5.3.2 9.2-2.1 10.9-6.6 2.4-1.4 3.5-4 3.3-7.6z"/><path d="m17.4 8.3 2.7 1"/></svg>',
  fish: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3.2-4 6.8-6 10.8-6 1.9 0 3.7.5 5.2 1.5L22 5v14l-3-2.5a9.5 9.5 0 0 1-5.2 1.5C9.8 18 6.2 16 3 12z"/><circle cx="13.5" cy="10" r=".7" fill="currentColor" stroke="none"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 20 7.2-12 3 5 2.1-3L21 20z"/><path d="m8.4 11 1.8 1.7 1.2-1.3"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3.5C12 3.7 5.5 6.8 4.2 12.2c-1.1 4.6 2.6 7.9 6.8 6.4 5.2-1.8 8-7.4 9.5-15.1z"/><path d="M4 21c2.4-5.1 6.1-8.6 11.2-10.8"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5z"/><path d="M5 18h14M7 21h10"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="14.5" r="4.5"/><path d="M11 11l8-8"/><path d="M16 6l2 2"/><path d="M14 8l2 2"/></svg>',
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.2z"/><path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.8A6 6 0 0 1 6 12c0-.6.1-1.2.4-1.8V7.6H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.4l3.3-2.6z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2 10 10 0 0 0 3.1 7.6l3.3 2.6c.8-2.3 3-4.1 5.6-4.1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>',
  chevronDouble: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 18 6-6-6-6"/><path d="m13 18 6-6-6-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.64.8 1.03 1.51 1.03H21a2 2 0 0 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6-6 6 6"/><path d="M12 4v16"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.55.83l9.6-6.4a1 1 0 0 0 0-1.66l-9.6-6.4A1 1 0 0 0 8 5.6z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
};

const tutorialSteps = [
  {
    target: ".brand, .presentation-brand",
    spotlightTarget: ".brand-mark-image, .brand-divider, .brand-title, .brand-subtitle, .presentation-brand-mark, .presentation-brand-copy",
    spotlightGroup: true,
    spotlightPadding: 5,
    title: "Start with the logo",
    body: "Tap the Big Screen Bible logo any time you want to return to the verse of the day.",
  },
  {
    target: ".search, #presentationSearchToggle",
    spotlightPadding: 5,
    title: "Search by reference or phrase",
    body: "Type a passage like Ecc 9:5, or search a phrase when you remember the words but not the reference.",
  },
  {
    target: ".mode-tabs, .presentation-bible-toggle",
    spotlightPadding: 5,
    title: "Switch reading spaces",
    body: "Move between Reader, Parallel Study, Big Screen display, and Games from this mode area.",
  },
  {
    target: ".chapter-tools",
    spotlightTarget: ".mobile-verse-nav-selectors, .verse-nav-selectors",
    revealVerseSelector: true,
    spotlightPadding: 5,
    title: "Move around the Bible",
    body: "Use the chapter and verse controls for precise navigation. At a chapter edge, keep scrolling with a wheel or trackpad—or pull on a touchscreen—to reveal the previous or next chapter.",
  },
  {
    target: "#mobileControlsToggle, #mobileFloatingSettings, .scripture",
    spotlightTarget: "#mobileControlsToggle, #mobileFloatingSettings",
    spotlightRequired: true,
    spotlightPadding: 5,
    title: "Use touch controls on mobile",
    body: "On phones and tablets, swipe to change chapters, or pull past the top or bottom edge and release when the chapter indicator is ready. Pinch resizes Scripture. When auto-scroll is enabled in Settings, two-finger tap starts or pauses it. Double-tap blank reading space toggles Focus Mode, and tapping empty header space returns to the top.",
  },
  {
    target: ".rail, #openStudy",
    spotlightPadding: 5,
    title: "Study tools live on the side",
    body: "Bookmarks, notes, highlights, cross references, history, and search open from the side tools.",
  },
  {
    target: ".selection-bar, .verse-card.selected, .verse-row.selected",
    spotlightPadding: 5,
    title: "Select verses to act on them",
    body: "Tap a verse to copy, share, print, link, or highlight a passage without losing your place.",
  },
  {
    target: "#settingsToggle, #mobileFloatingSettings, #presentationSettingsToggle",
    spotlightPadding: 5,
    title: "Tune the experience",
    body: "Settings handle themes, fonts, text size, startup behavior, fullscreen, landscape toolbar side, and your private reading streak.",
  },
];

const presentationTutorialSteps = [
  {
    target: ".presentation-ref",
    spotlightPadding: 5,
    title: "Big Screen starts with the verse",
    body: "This mode keeps the reference, version, and Scripture clean for worship, teaching, or family reading.",
  },
  {
    target: "#presentationSearchToggle",
    spotlightPadding: 5,
    title: "Jump to another passage",
    body: "Open search to type a reference quickly without leaving the display.",
  },
  {
    target: ".presentation-controls",
    spotlightPadding: 5,
    title: "Move verse by verse",
    body: "Use Previous and Next, arrow keys, or swipe on touch devices. A swipe follows your finger and previews what is coming next.",
  },
  {
    target: "#presentationSettingsToggle",
    spotlightPadding: 5,
    title: "Change the display",
    body: "Theme, Bible version, font, text size, and fullscreen controls live inside Big Screen settings. You can also pinch the verse to resize it.",
  },
  {
    target: ".presentation-bible-toggle",
    title: "Return to the Bible workspace",
    body: "Use this button when you want the full reader, study tools, notes, highlights, and games.",
  },
];

const accountTutorialStep = {
  target: "#accountQuickButton",
  spotlightPadding: 5,
  title: "Save your bookmarks",
  body: "Create a free account to keep your bookmarks, notes, highlights, settings, and reading streak safe and available across your devices.",
};

const presentationAccountTutorialStep = {
  target: ".presentation-bible-toggle",
  spotlightPadding: 5,
  title: "Save your bookmarks",
  body: "Return to the Bible workspace, then choose Sign in to create a free account and keep your bookmarks available across your devices.",
};

state.textScale = clampTextScale(state.textScale);
state.presentationTextScale = clampPresentationTextScale(state.presentationTextScale);

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
  if (state.isVerseOfDayActive && state.verseOfDayItem) return state.verseOfDayItem.reference;
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

function isSideToolbarToggleEnabled() {
  return isShortLandscapeScreen();
}

function currentSafeAreaInsets() {
  if (!document.body) return { left: 0, right: 0 };
  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:fixed",
    "visibility:hidden",
    "pointer-events:none",
    "top:0",
    "left:0",
    "padding-left:env(safe-area-inset-left, 0px)",
    "padding-right:env(safe-area-inset-right, 0px)",
  ].join(";");
  document.body.appendChild(probe);
  const styles = getComputedStyle(probe);
  const left = Number.parseFloat(styles.paddingLeft) || 0;
  const right = Number.parseFloat(styles.paddingRight) || 0;
  probe.remove();
  return { left, right };
}

function effectiveSideToolbarPosition() {
  if (!isSideToolbarToggleEnabled()) return state.sideToolbarPosition;
  const { left, right } = currentSafeAreaInsets();
  const sideDifference = 8;
  if (left > right + sideDifference) return "right";
  if (right > left + sideDifference) return "left";
  return state.sideToolbarPosition;
}

function isSideToolbarAutoPositioned() {
  return effectiveSideToolbarPosition() !== state.sideToolbarPosition;
}

function animateBeforeRemoval(selector, callback, { className = "motion-exit", duration = 240, settleFrames = 0 } = {}) {
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
  window.setTimeout(() => {
    let remainingFrames = Math.max(0, Math.floor(settleFrames));
    const finish = () => {
      if (!remainingFrames) {
        callback();
        return;
      }
      remainingFrames -= 1;
      requestAnimationFrame(finish);
    };
    finish();
  }, duration);
}

function enforceVersionLimit() {
  const limit = versionLimit();
  if (state.versions.length <= limit) return;
  state.versions = state.versions.slice(0, limit);
  persistVersions({ changed: true });
}

function activeVersions() {
  return state.versions.slice(0, versionLimit());
}

function visibleSettingsPanel() {
  const panels = [
    document.getElementById("mobileSettingsPopover"),
    document.querySelector(".settings-popover.open"),
  ].filter(Boolean);
  return panels.find((panel) => panel.getClientRects().length) || panels[0] || null;
}

function captureSettingsPanelScroll() {
  if (!state.settingsOpen) return null;
  const panel = visibleSettingsPanel();
  if (!panel) return null;
  return {
    top: panel.scrollTop,
    left: panel.scrollLeft,
  };
}

function restoreSettingsPanelScroll(scrollState) {
  if (!scrollState || !state.settingsOpen) return;
  const panel = visibleSettingsPanel();
  if (!panel) return;
  panel.scrollTop = scrollState.top;
  panel.scrollLeft = scrollState.left;
}

function captureAccountPanelScroll() {
  if (!state.accountOpen) return null;
  const panel = document.querySelector(".account-popover.open");
  if (!panel) return null;
  return {
    top: panel.scrollTop,
    left: panel.scrollLeft,
  };
}

function restoreAccountPanelScroll(scrollState) {
  if (!scrollState || !state.accountOpen) return;
  const panel = document.querySelector(".account-popover.open");
  if (!panel) return;
  panel.scrollTop = scrollState.top;
  panel.scrollLeft = scrollState.left;
}

function render() {
  pauseReaderAutoScroll({ updateControl: false });
  closeSearchScopeMenu();
  if (state.inlineSearchQuery && normalizedSearchChapter(state.inlineSearchChapter) !== normalizedSearchChapter(state.reference)) {
    clearInlineChapterSearchState();
  }
  const settingsScrollState = captureSettingsPanelScroll();
  const accountScrollState = captureAccountPanelScroll();
  const settingsPanelRerender = Boolean(settingsScrollState);
  const accountPanelRerender = Boolean(accountScrollState);
  closeMobileVerseNavMenu();
  closeSocialAvatarPicker();
  const app = document.querySelector("#app");
  const focusEnterClass = pendingFocusChromeEnter ? "focus-chrome-enter" : "";
  const sideToolbarPosition = effectiveSideToolbarPosition();
  const selectionToolsCollapsedClass = returnSelectionToolsCollapsed() ? "selection-tools-collapsed" : "";
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
  const chapterChange = pendingChapterChange;
  pendingChapterChange = null;
  enforceVersionLimit();
  if (state.mode !== "big") state.presentationControlsVisible = true;
  app.innerHTML = `
    <main class="app-shell ${state.focusMode && state.mode !== "trivia" ? "focus-shell" : ""} ${state.footerCollapsed ? "footer-collapsed" : ""} ${state.mobileControlsOpen ? "mobile-controls-open" : ""} ${state.selectedVerses.length ? "has-selection" : ""} ${selectionToolsCollapsedClass} ${focusEnterClass}" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}" data-interface-text-size="${state.interfaceTextSize}" data-side-toolbar-position="${sideToolbarPosition}" data-side-toolbar-preference="${state.sideToolbarPosition}" style="--text-scale: ${state.textScale}">
      ${topbar(settingsPanelRerender, accountPanelRerender)}
      <section class="${mainGridClass()}" style="${textFontVars()}">
        ${state.focusMode || state.mode === "trivia" ? "" : rail()}
        ${state.focusMode || state.mode === "trivia" || !state.libraryOpen ? "" : library()}
        ${reader(chapterChange)}
        ${accountSwitchNotification()}
      </section>
      ${gameChallengePopup()}
      ${bottombar()}
      ${mobileFloatingSettings()}
      ${mobileSettingsPanel(settingsPanelRerender)}
      ${presentation()}
      ${shortcutOverlay()}
      ${aboutMenuOverlay()}
      ${noteComposerMarkup()}
      ${pushConsentPrompt()}
      ${tutorialIntro()}
      ${tutorialOverlay()}
      ${printSheet()}
      ${streakPopup()}
      ${parallelVersionMenuMarkup()}
      <div class="reader-gesture-feedback" id="readerGestureFeedback" role="status" aria-live="polite" aria-atomic="true">
        <span class="reader-gesture-feedback-mark" aria-hidden="true">Aa</span>
        <span class="reader-gesture-feedback-label"></span>
      </div>
      <div class="status-toast" id="toast"></div>
    </main>
  `;
  pendingFocusChromeEnter = false;
  pendingLibraryEnter = false;
  bindEvents();
  restoreSettingsPanelScroll(settingsScrollState);
  restoreAccountPanelScroll(accountScrollState);
  requestAnimationFrame(() => {
    positionAccountPopover();
    positionSettingsPopover();
    positionFocusSearchResults();
    positionFocusWorkspacePanel();
    positionNoteComposer();
    restoreSettingsPanelScroll(settingsScrollState);
    restoreAccountPanelScroll(accountScrollState);
    applyPopupPosition("help");
    if (state.pushPromptVisible) document.getElementById("enablePushPrompt")?.focus();
    if (gameChallengePopupIsVisible()) {
      const popupDialog = document.getElementById("gameChallengePopupDialog");
      if (popupDialog?.dataset.popupContinuing !== "true") {
        const popupPrimary = document.getElementById("gameChallengePopupPrimary");
        const popupFocusTarget = popupPrimary && !popupPrimary.disabled
          ? popupPrimary
          : document.querySelector("[data-game-challenge-popup-dismiss]:not([disabled])")
            || popupDialog;
        popupFocusTarget?.focus({ preventScroll: true });
      }
    }
    if (pendingNoteComposerFocus) {
      pendingNoteComposerFocus = false;
      const textarea = document.getElementById("noteComposerTextarea");
      textarea?.focus({ preventScroll: true });
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  });
  applyCustomScriptureFont();
  if (state.pendingVerseFocus) {
    const focusMode = state.pendingVerseFocus;
    state.pendingVerseFocus = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      scrollSelectedVerseIntoView({ block: focusMode === "nearest" ? "nearest" : "center" });
    }));
  }
  if (state.pendingInlineSearchFocus || state.pendingInlineSearchInputFocus) {
    const shouldScrollToFirstHit = state.pendingInlineSearchFocus;
    const inputId = state.pendingInlineSearchInputFocus;
    state.pendingInlineSearchFocus = false;
    state.pendingInlineSearchInputFocus = "";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (shouldScrollToFirstHit) scrollFirstInlineSearchHitIntoView();
      restoreInlineSearchInputFocus(inputId);
    }));
  }
  if (state.pendingPanelFocus) {
    const target = state.pendingPanelFocus;
    state.pendingPanelFocus = null;
    requestAnimationFrame(() => focusWorkspaceTarget(target));
  }
  if (state.pendingLibraryScrollRestore) {
    state.pendingLibraryScrollRestore = false;
    requestAnimationFrame(() => requestAnimationFrame(() => restoreSavedLibraryScroll()));
  }
  requestAnimationFrame(fitPresentationText);
  requestAnimationFrame(applyTextScaleVars);
  requestAnimationFrame(bindMobileSettingsVisibility);
  requestAnimationFrame(updateTutorialSpotlight);
  requestAnimationFrame(runPendingTriviaCelebration);
  requestAnimationFrame(() => requestAnimationFrame(restorePendingAppUpdatePosition));
  scheduleStreakPopupDismiss();
  scheduleBookSprintTimer();
  scheduleReferenceRushTimer();
}

function chapterChangeIndicator(change) {
  if (!change) return "";
  const movingForward = change.direction > 0;
  const directionLabel = movingForward ? "forward" : "back";
  return `
    <div class="chapter-change-indicator chapter-change-indicator-${directionLabel}" role="status" aria-atomic="true">
      <span class="sr-only">Moved ${directionLabel} to ${escapeHtml(change.reference)}</span>
      <span class="chapter-change-halo" aria-hidden="true">
        <span class="chapter-change-icon">${movingForward ? icons.chevron : icons.chevronLeft}</span>
      </span>
      <span class="chapter-change-label" aria-hidden="true">${escapeHtml(change.reference)}</span>
    </div>
  `;
}

function accountSwitchNotification() {
  if (!accountSwitchNotice) return "";
  const avatarMarkup = socialAvatarKeys.includes(accountSwitchNotice.avatarKey)
    ? socialProfileAvatarMarkup(accountSwitchNotice, "account-switch-avatar")
    : `<span class="account-switch-fallback-avatar">${icons.user}</span>`;
  return `
    <div class="account-switch-indicator" role="status" aria-live="polite" aria-atomic="true">
      <span class="sr-only">Switched account to ${escapeHtml(accountSwitchNotice.identity)}</span>
      <span class="chapter-change-halo account-switch-halo" aria-hidden="true">
        <span class="chapter-change-icon account-switch-icon">${avatarMarkup}</span>
      </span>
      <span class="chapter-change-label" aria-hidden="true">Switched to ${escapeHtml(accountSwitchNotice.identity)}</span>
    </div>
  `;
}

function showAccountSwitchNotification(user, destinationAccount = null) {
  const account = destinationAccount?.userId === user?.id
    ? destinationAccount
    : rememberedAccounts().find((item) => item.userId === user?.id);
  const loadedProfile = state.socialProfile?.userId === user?.id
    ? state.socialProfile
    : null;
  const profile = loadedProfile || account;
  const identity = profile?.username
    ? `@${profile.username}`
    : String(account?.email || user?.email || "your account").trim();
  accountSwitchNotice = {
    userId: String(user?.id || "").trim(),
    identity,
    username: String(profile?.username || "").trim(),
    displayName: String(profile?.displayName || "").trim(),
    avatarKey: String(profile?.avatarKey || "").trim(),
  };
  clearTimeout(accountSwitchNoticeTimer);
  state.accountOpen = false;
  renderPreservingReaderScroll();
  accountSwitchNoticeTimer = setTimeout(() => {
    accountSwitchNotice = null;
    document.querySelector(".account-switch-indicator")?.remove();
  }, accountSwitchNoticeDurationMs);
}

function syncPresentationShell() {
  const isPresentationMode = state.mode === "big";
  const themeColor = isPresentationMode
    ? presentationThemeColors[state.presentationTheme] || "#004f54"
    : themeChromeColors[state.themePreset] || themeChromeColors[defaultThemePresets[state.theme]];
  document.documentElement.dataset.theme = state.theme;
  document.body.dataset.theme = state.theme;
  document.documentElement.dataset.themePreset = state.themePreset;
  document.body.dataset.themePreset = state.themePreset;
  document.documentElement.dataset.presentationMode = isPresentationMode ? "big" : "";
  document.body.dataset.presentationMode = isPresentationMode ? "big" : "";
  document.documentElement.dataset.presentationTheme = state.presentationTheme;
  document.body.dataset.presentationTheme = state.presentationTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
}

function renderPreservingReaderScroll(options = {}) {
  const scrollState = captureReaderScroll(options);
  render();
  restoreReaderScroll(scrollState);
  requestAnimationFrame(() => {
    restoreReaderScroll(scrollState);
    requestAnimationFrame(() => restoreReaderScroll(scrollState));
  });
}

function renderFollowingSelectedVerse() {
  const scrollState = captureReaderScroll();
  render();
  restoreReaderScroll(scrollState);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    scrollSelectedVerseIntoView({ block: "nearest" });
  }));
}

function renderTriviaAnswerAndScroll() {
  renderPreservingReaderScroll();
  syncActiveChallengeProgress().catch((error) => console.warn("Challenge score update failed", error));
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

function renderAfterViewportChangePreservingReaderScroll() {
  if (document.visibilityState === "hidden") return;
  renderPreservingReaderScroll({ preferLastReaderAnchor: true });
}

function captureReaderScroll(options = {}) {
  const scripture = document.querySelector(".scripture");
  const triviaReader = document.querySelector(".trivia-reader");
  const readerAnchor = options.preferLastReaderAnchor
    ? preferredViewportReaderScrollAnchor() || currentReaderScrollAnchor()
    : currentReaderScrollAnchor();
  return {
    mode: state.mode,
    reference: state.reference,
    windowX: window.scrollX,
    windowY: window.scrollY,
    scriptureTop: scripture?.scrollTop ?? null,
    scriptureLeft: scripture?.scrollLeft ?? null,
    triviaTop: triviaReader?.scrollTop ?? null,
    triviaLeft: triviaReader?.scrollLeft ?? null,
    readerAnchor,
  };
}

function modeScrollStateKey(mode, reference) {
  return `${mode || "reader"}::${reference || ""}`;
}

function supportsModeScrollRestore(mode) {
  return ["reader", "trivia"].includes(mode);
}

function rememberModeScrollState(scrollState = captureReaderScroll({ preferLastReaderAnchor: true })) {
  if (!scrollState?.reference || !supportsModeScrollRestore(scrollState.mode)) return null;
  modeScrollStates.set(modeScrollStateKey(scrollState.mode, scrollState.reference), scrollState);
  return scrollState;
}

function savedModeScrollState(mode, reference = state.reference) {
  const scrollState = modeScrollStates.get(modeScrollStateKey(mode, reference));
  return scrollState?.reference === reference ? scrollState : null;
}

function transferReaderScrollState(scrollState, targetMode) {
  if (
    !scrollState?.readerAnchor
    || !["reader", "parallel"].includes(targetMode)
    || scrollState.reference !== state.reference
  ) return null;
  return {
    ...scrollState,
    mode: targetMode,
    scriptureTop: null,
    scriptureLeft: 0,
    triviaTop: null,
    triviaLeft: 0,
    readerAnchor: {
      ...scrollState.readerAnchor,
      mode: targetMode,
    },
  };
}

function restoreModeScrollAfterRender(scrollState) {
  if (!scrollState) return;
  restoreReaderScroll(scrollState);
  requestAnimationFrame(() => {
    restoreReaderScroll(scrollState);
    requestAnimationFrame(() => {
      restoreReaderScroll(scrollState);
      updateReaderTopButton();
    });
  });
}

function modeScrollStateForTarget(nextMode, previousScrollState) {
  if (nextMode === "parallel") {
    const readerScrollState = previousScrollState?.mode === "reader"
      ? previousScrollState
      : savedModeScrollState("reader");
    return transferReaderScrollState(readerScrollState, "parallel");
  }
  return savedModeScrollState(nextMode) || transferReaderScrollState(previousScrollState, nextMode);
}

function switchMode(nextMode) {
  if (!["reader", "parallel", "big", "trivia"].includes(nextMode)) return;
  if (nextMode === state.mode) return;
  if (nextMode !== "trivia") cleanupTriviaCelebration();
  const previousMode = state.mode;
  const previousScrollState = rememberModeScrollState();
  state.mode = nextMode;
  state.headerVersionMenuOpen = false;
  state.footerVersionMenuOpen = false;
  state.parallelVersionMenuIndex = null;
  state.parallelVersionMenuPosition = null;
  resetFocusToolSurfaces();
  const targetScrollState = modeScrollStateForTarget(nextMode, previousScrollState);
  if (state.mode === "big") {
    state.presentationPart = 0;
    state.presentationControlsVisible = false;
    state.presentationSearchOpen = false;
    state.presentationSettingsOpen = false;
  } else {
    clearTimeout(presentationControlsTimer);
    if (previousMode === "big") {
      state.presentationSearchOpen = false;
      state.presentationSettingsOpen = false;
    }
    if (["reader", "parallel"].includes(state.mode) && !targetScrollState) {
      state.pendingVerseFocus = "nearest";
    }
  }
  render();
  restoreModeScrollAfterRender(targetScrollState);
}

function currentReaderScrollAnchor() {
  const scripture = document.querySelector(".scripture");
  if (
    document.visibilityState === "hidden"
    || !scripture
    || !["reader", "parallel"].includes(state.mode)
  ) return null;
  const rows = Array.from(scripture.querySelectorAll("[data-verse]"));
  if (!rows.length) return null;

  const scriptureBounds = scripture.getBoundingClientRect();
  const targetLine = scriptureBounds.top + Math.min(Math.max(scripture.clientHeight * 0.22, 28), 96);
  const anchor = rows.find((row) => {
    const bounds = row.getBoundingClientRect();
    return bounds.bottom >= targetLine && bounds.top <= scriptureBounds.bottom;
  }) || rows.find((row) => row.getBoundingClientRect().top >= scriptureBounds.top) || rows[0];
  const anchorBounds = anchor.getBoundingClientRect();
  return {
    mode: state.mode,
    reference: state.reference,
    verse: anchor.dataset.verse,
    offset: anchorBounds.top - scriptureBounds.top,
  };
}

function refreshLastReaderScrollAnchor() {
  const anchor = currentReaderScrollAnchor();
  if (!anchor) return;
  const scripture = document.querySelector(".scripture");
  const viewportSize = { width: window.innerWidth, height: window.innerHeight };
  const viewportChanged = Boolean(
    lastReaderViewportSize
    && (lastReaderViewportSize.width !== viewportSize.width || lastReaderViewportSize.height !== viewportSize.height),
  );
  lastReaderScrollAnchor = anchor;
  if ((scripture?.scrollTop || 0) > 8) {
    lastReaderNonTopScrollAnchor = anchor;
  } else if (!viewportChanged) {
    lastReaderNonTopScrollAnchor = null;
  }
  lastReaderViewportSize = viewportSize;
}

function isMatchingReaderAnchor(anchor) {
  return Boolean(
    anchor
    && anchor.mode === state.mode
    && anchor.reference === state.reference,
  );
}

function preferredViewportReaderScrollAnchor() {
  if (isMatchingReaderAnchor(lastReaderNonTopScrollAnchor)) {
    return viewportAdjustedReaderAnchor(lastReaderNonTopScrollAnchor);
  }
  if (isMatchingReaderAnchor(lastReaderScrollAnchor)) return viewportAdjustedReaderAnchor(lastReaderScrollAnchor);
  return null;
}

function viewportAdjustedReaderAnchor(anchor) {
  return {
    ...anchor,
    offset: Math.min(Math.max(anchor.offset || 0, 28), 96),
  };
}

function normalizedStoredReaderPosition(value) {
  const mode = String(value?.mode || "");
  const reference = String(value?.reference || "");
  const verse = String(value?.readerAnchor?.verse || "");
  const offset = Number(value?.readerAnchor?.offset);
  const scriptureTop = Number(value?.scriptureTop);
  if (
    !["reader", "parallel"].includes(mode)
    || !reference
    || !/^\d+$/.test(verse)
    || !Number.isFinite(offset)
    || !Number.isFinite(scriptureTop)
  ) return null;
  return {
    mode,
    reference,
    windowX: 0,
    windowY: 0,
    scriptureTop: Math.max(0, scriptureTop),
    scriptureLeft: 0,
    triviaTop: null,
    triviaLeft: null,
    activeVerse: Math.max(1, Number(value.activeVerse) || Number(verse)),
    savedAt: Math.max(0, Number(value.savedAt) || 0),
    readerAnchor: {
      mode,
      reference,
      verse,
      offset: Math.min(Math.max(offset, -160), 160),
    },
  };
}

function savedReaderPosition() {
  try {
    return normalizedStoredReaderPosition(JSON.parse(localStorage.getItem(readerPositionStorageKey) || "null"));
  } catch {
    return null;
  }
}

function persistReaderPosition(scrollState) {
  if (
    !scrollState?.readerAnchor
    || !["reader", "parallel"].includes(scrollState.mode)
  ) return;
  const stored = normalizedStoredReaderPosition({
    ...scrollState,
    activeVerse: state.verse,
    savedAt: Date.now(),
  });
  if (!stored) return;
  try {
    localStorage.setItem(readerPositionStorageKey, JSON.stringify(stored));
  } catch {
    // Reading position persistence is best-effort when storage is unavailable.
  }
}

function scheduleReaderPositionPersistence() {
  const scrollState = captureReaderScroll({ preferLastReaderAnchor: true });
  if (!scrollState.readerAnchor) return;
  pendingReaderPositionPersistState = scrollState;
  clearTimeout(readerPositionPersistTimer);
  readerPositionPersistTimer = setTimeout(() => {
    const pending = pendingReaderPositionPersistState;
    pendingReaderPositionPersistState = null;
    persistReaderPosition(pending);
  }, 120);
}

function flushReaderPositionPersistence() {
  clearTimeout(readerPositionPersistTimer);
  pendingReaderPositionPersistState = null;
  const scrollState = captureReaderScroll({ preferLastReaderAnchor: true });
  persistReaderPosition(scrollState);
  return scrollState;
}

function isStandaloneWebApp() {
  return Boolean(
    window.navigator?.standalone
    || window.matchMedia?.("(display-mode: standalone)")?.matches,
  );
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

function libraryStateKey(rail = state.activeRail) {
  return rail === "Notes" ? "Annotations" : (rail || "Verse");
}

function rememberLibraryScroll(rail = state.activeRail) {
  const scrollState = captureLibraryScroll();
  if (!scrollState) return null;
  state.libraryScrollByRail = {
    ...state.libraryScrollByRail,
    [libraryStateKey(rail)]: scrollState,
  };
  return scrollState;
}

function persistLibraryScrollByRail() {
  localStorage.setItem(libraryScrollStorageKey, JSON.stringify(state.libraryScrollByRail));
}

function savedLibraryScroll(rail = state.activeRail) {
  return state.libraryScrollByRail?.[libraryStateKey(rail)] || null;
}

function restoreSavedLibraryScroll(rail = state.activeRail) {
  restoreLibraryScroll(savedLibraryScroll(rail));
}

function rememberOpenLibraryState() {
  captureAnnotationOpenState();
  rememberLibraryScroll();
}

function dismissLibraryAfterAction() {
  if (!state.libraryOpen) return;
  rememberOpenLibraryState();
  persistLibraryScrollByRail();
  state.libraryOpen = false;
  localStorage.setItem("lw_library_open", "false");
  scheduleCloudSync();
}

function scrollPosition(target) {
  if (target === window) return { left: window.scrollX, top: window.scrollY };
  return { left: target.scrollLeft || 0, top: target.scrollTop || 0 };
}

function applyScrollPosition(target, left, top) {
  if (target === window) {
    window.scrollTo(left, top);
    return;
  }
  target.scrollLeft = left;
  target.scrollTop = top;
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function animateScrollPosition(target, left, top, options = {}) {
  const start = scrollPosition(target);
  const nextLeft = Math.max(0, Number(left) || 0);
  const nextTop = Math.max(0, Number(top) || 0);
  const deltaLeft = nextLeft - start.left;
  const deltaTop = nextTop - start.top;
  if (Math.abs(deltaLeft) < 1 && Math.abs(deltaTop) < 1) {
    applyScrollPosition(target, nextLeft, nextTop);
    return;
  }
  const duration = options.duration || 440;
  const token = Symbol("scroll-animation");
  if (target === window) {
    window.__bsbScrollAnimation = token;
  } else {
    target.__bsbScrollAnimation = token;
  }
  const startedAt = performance.now();
  const step = (now) => {
    const activeToken = target === window ? window.__bsbScrollAnimation : target.__bsbScrollAnimation;
    if (activeToken !== token) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = easeOutCubic(progress);
    applyScrollPosition(target, start.left + (deltaLeft * eased), start.top + (deltaTop * eased));
    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }
    applyScrollPosition(target, nextLeft, nextTop);
  };
  requestAnimationFrame(step);
}

function restoreScrollPosition(target, left, top, options = {}) {
  if (options.smooth) {
    animateScrollPosition(target, left, top, options);
    return;
  }
  applyScrollPosition(target, left, top);
}

function stageSmoothReturnScroll(scrollState) {
  if (!scrollState) return;
  const scripture = document.querySelector(".scripture");
  const triviaReader = document.querySelector(".trivia-reader");
  if (scripture && scrollState.scriptureTop > 0) {
    applyScrollPosition(scripture, scrollState.scriptureLeft || 0, 0);
  }
  if (triviaReader && scrollState.triviaTop > 0) {
    applyScrollPosition(triviaReader, scrollState.triviaLeft || 0, 0);
  }
  if (scrollState.windowY > 0) {
    applyScrollPosition(window, scrollState.windowX || 0, 0);
  }
}

function restoreReaderScroll(scrollState, options = {}) {
  if (!scrollState) return;
  const scripture = document.querySelector(".scripture");
  const triviaReader = document.querySelector(".trivia-reader");
  const readerAnchor = scrollState.readerAnchor || lastReaderScrollAnchor;
  const smooth = Boolean(options.smooth) && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let scriptureTop = scrollState.scriptureTop;
  const scriptureLeft = scrollState.scriptureLeft || 0;
  if (scripture && scrollState.scriptureTop !== null) {
    restoreScrollPosition(scripture, scriptureLeft, scriptureTop, { smooth });
  }
  if (
    scripture
    && readerAnchor
    && readerAnchor.mode === state.mode
    && readerAnchor.reference === state.reference
  ) {
    const anchor = Array.from(scripture.querySelectorAll("[data-verse]"))
      .find((row) => row.dataset.verse === String(readerAnchor.verse));
    if (anchor) {
      const scriptureBounds = scripture.getBoundingClientRect();
      const anchorBounds = anchor.getBoundingClientRect();
      const nextTop = scripture.scrollTop + anchorBounds.top - scriptureBounds.top - readerAnchor.offset;
      scriptureTop = Math.max(0, nextTop);
      restoreScrollPosition(scripture, scriptureLeft || scripture.scrollLeft || 0, scriptureTop, { smooth });
    }
  }
  if (triviaReader && scrollState.triviaTop !== null) {
    restoreScrollPosition(triviaReader, scrollState.triviaLeft || 0, scrollState.triviaTop, { smooth });
  }
  restoreScrollPosition(window, scrollState.windowX, scrollState.windowY, { smooth });
  refreshLastReaderScrollAnchor();
}

function currentReaderReturnTarget() {
  return state.readerReturnStack[state.readerReturnStack.length - 1] || null;
}

function returnSelectionToolsCollapsed() {
  return Boolean(currentReaderReturnTarget() && state.selectedVerses.length && !state.returnSelectionToolsOpen);
}

function clearReaderReturnStack() {
  if (!state.readerReturnStack.length && !state.returnSelectionToolsOpen) return;
  state.readerReturnStack = [];
  state.returnSelectionToolsOpen = false;
}

function captureReaderReturnTarget() {
  if (!["reader", "parallel", "big"].includes(state.mode)) return null;
  return {
    mode: state.mode,
    focusMode: state.focusMode,
    libraryOpen: state.libraryOpen,
    activeRail: state.activeRail,
    reference: state.reference,
    verse: state.verse,
    selectedVerses: [...state.selectedVerses],
    keyboardSelectionAnchor: state.keyboardSelectionAnchor,
    presentationPart: state.presentationPart,
    isVerseOfDayActive: state.isVerseOfDayActive,
    verseOfDayItem: state.verseOfDayItem,
    label: activePassageLabel(),
    scrollState: captureReaderScroll({ preferLastReaderAnchor: true }),
  };
}

function pushReaderReturnTarget(target) {
  if (!target?.reference) return;
  const previous = currentReaderReturnTarget();
  if (
    previous
    && previous.mode === target.mode
    && previous.reference === target.reference
    && previous.verse === target.verse
    && previous.scrollState?.scriptureTop === target.scrollState?.scriptureTop
  ) return;
  state.readerReturnStack = [...state.readerReturnStack, target].slice(-12);
}

function currentPassageMatchesReturnTarget(target) {
  return Boolean(
    target
    && target.reference === state.reference
    && target.verse === state.verse
    && (!target.label || target.label === activePassageLabel())
  );
}

function pushCurrentReturnTargetForNavigation(nextReference = null, nextVerse = null) {
  const target = captureReaderReturnTarget();
  if (!target?.reference) return null;
  if (
    nextReference
    && target.reference === nextReference
    && (!Number.isFinite(nextVerse) || target.verse === nextVerse)
  ) return null;
  pushReaderReturnTarget(target);
  state.returnSelectionToolsOpen = false;
  return target;
}

function restoreReaderReturnTarget() {
  const target = state.readerReturnStack.pop();
  if (!target?.reference || !bibleData[target.reference]) return render();
  const targetMode = ["reader", "parallel", "big"].includes(target.mode) ? target.mode : "reader";
  const restoreMode = state.mode === "big" ? "big" : targetMode;
  state.mode = restoreMode;
  state.focusMode = Boolean(target.focusMode);
  state.libraryOpen = Boolean(target.libraryOpen);
  state.activeRail = target.activeRail || state.activeRail;
  state.reference = target.reference;
  state.verse = target.verse;
  state.selectedVerses = Array.isArray(target.selectedVerses) ? [...target.selectedVerses] : [];
  state.keyboardSelectionAnchor = target.keyboardSelectionAnchor || null;
  state.presentationPart = state.mode === "big" && target.mode !== "big" ? 0 : target.presentationPart || 0;
  state.isVerseOfDayActive = Boolean(target.isVerseOfDayActive && target.verseOfDayItem);
  state.verseOfDayItem = target.verseOfDayItem || state.verseOfDayItem;
  state.pendingVerseFocus = false;
  state.returnSelectionToolsOpen = false;
  pendingLibraryEnter = Boolean(target.libraryOpen);
  updateShareUrl();
  render();
  stageSmoothReturnScroll(target.scrollState);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    restoreReaderScroll(target.scrollState, { smooth: true });
    updateReaderTopButton();
  }));
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
  const annotationShelves = Array.from(document.querySelectorAll("[data-annotation-shelf]"));
  if (annotationShelves.length) {
    state.openAnnotationShelves = annotationShelves
      .filter((details) => details.open)
      .map((details) => details.dataset.annotationShelf)
      .filter(Boolean);
  }
  const annotationGroups = Array.from(document.querySelectorAll("[data-annotation-group]"));
  if (annotationGroups.length) {
    state.openAnnotationGroups = annotationGroups
      .filter((details) => details.open)
      .map((details) => details.dataset.annotationGroup)
      .filter(Boolean);
    annotationGroups.forEach((details) => markAnnotationGroupCollectionTouched(details.dataset.annotationGroup));
  }
}

function loadingScreen() {
  const message = dataError || "Loading full Bible texts...";
  return `
    <main class="app-shell focus-shell loading-shell" data-theme="${state.theme}" data-theme-preset="${state.themePreset}" data-scripture-font="${state.scriptureFont}">
      <section class="loading-reader">
        <div class="loading-card">
          <img class="loading-logo-mark" src="./assets/brand-mark.png?v=20260713-polished" width="420" height="220" alt="" />
          <h1>Big Screen Bible</h1>
          ${dataError ? "" : '<div class="loading-spinner" aria-hidden="true"></div>'}
          <p>${message}</p>
          ${dataError ? '<button class="primary-btn" onclick="location.reload()">Retry</button>' : ""}
        </div>
      </section>
    </main>
  `;
}

function mobileFloatingSettings() {
  if (state.mode === "big") return "";
  const focusTools = state.focusMode
    ? mobileFocusTools()
    : "";
  const focusReferenceSwitcher = state.focusMode
    ? `
      <div class="mobile-focus-passage-control">
        <button
          class="mobile-floating-passage ${state.focusReferenceOpen ? "active" : ""}"
          id="mobileFocusPassageToggle"
          type="button"
          aria-label="Go to another passage"
          aria-controls="mobileFocusPassagePopover"
          aria-expanded="${state.focusReferenceOpen ? "true" : "false"}"
          data-tooltip="Go to passage"
        >
          ${icons.search}
        </button>
        ${state.focusReferenceOpen ? `
          <form class="mobile-focus-passage-popover ${activeInlineSearchQuery() ? "has-inline-clear" : ""}" id="mobileFocusPassagePopover" role="search" aria-label="Go to another passage">
            <input
              id="mobileFocusPassageInput"
              type="text"
              aria-label="Bible passage"
              value="${escapeHtml(
                state.inlineSearchQuery && normalizedSearchScope(state.searchScope) === "chapter"
                  ? state.inlineSearchQuery
                  : activePassageLabel()
              )}"
              placeholder="John 3:16"
              autocomplete="off"
              autocapitalize="sentences"
              enterkeyhint="go"
            />
            ${activeInlineSearchQuery() ? `<button class="mobile-focus-inline-search-clear inline-search-clear-control" type="button" data-clear-search aria-label="${escapeHtml(inlineSearchClearAriaLabel())}" title="${escapeHtml(inlineSearchClearTitle())}"><span data-inline-search-progress aria-hidden="true">${escapeHtml(inlineSearchProgressText())}</span>${icons.clear}</button>` : ""}
            <button class="mobile-focus-search-scope" id="mobileFocusSearchScope" type="button" data-search-scope-trigger data-search-scope-control data-search-scope="${normalizedSearchScope(state.searchScope)}" aria-label="Choose Focus search scope, current ${escapeHtml(searchScopeLabel(state.searchScope, state.reference))}" aria-haspopup="listbox" aria-expanded="false" title="Search scope: ${escapeHtml(searchScopeLabel(state.searchScope, state.reference))}">
              <span class="mobile-focus-search-scope-code" data-search-scope-short aria-hidden="true">${escapeHtml(searchScopeShortLabel(state.searchScope))}</span>
              <span class="mobile-focus-search-scope-chevron" aria-hidden="true">${icons.chevron}</span>
            </button>
            <button type="submit">Go</button>
          </form>
        ` : ""}
      </div>
    `
    : "";
  return `
    ${focusTools}
    ${focusReferenceSwitcher}
    <button class="mobile-floating-settings ${state.settingsOpen ? "active" : ""}" id="mobileFloatingSettings" aria-label="Settings" data-tooltip="Settings">
      ${icons.settings}
    </button>
    ${mobileFocusSearchResults()}
    ${mobileFocusWorkspacePanel()}
  `;
}

function mobileFocusTools() {
  return `
    <div class="mobile-focus-tools-control ${state.focusToolsOpen ? "expanded" : ""}">
      <button
        class="mobile-floating-focus-tools ${state.focusToolsOpen ? "active" : ""}"
        id="mobileFocusToolsToggle"
        type="button"
        aria-label="${state.focusToolsOpen ? "Close Focus tools" : "Open Focus tools"}"
        aria-controls="mobileFocusToolsFan"
        aria-expanded="${state.focusToolsOpen ? "true" : "false"}"
        data-tooltip="Focus tools"
      >
        ${state.focusToolsOpen ? icons.clear : icons.panels}
      </button>
      ${state.focusToolsOpen ? `
        <div class="mobile-focus-tools-fan" id="mobileFocusToolsFan" role="toolbar" aria-label="Focus Mode tools">
          ${focusWorkspaceToolButtons("mobile-focus-tool-option")}
        </div>
      ` : ""}
    </div>
  `;
}

function desktopFocusTools() {
  if (!state.focusMode || state.mode === "big") return "";
  return `
    <div class="desktop-focus-tools-control ${state.focusToolsOpen ? "expanded" : ""}">
      <button
        class="desktop-focus-tools-toggle ${state.focusToolsOpen ? "active" : ""}"
        id="desktopFocusToolsToggle"
        type="button"
        aria-label="${state.focusToolsOpen ? "Close Focus tools" : "Open Focus tools"}"
        aria-controls="desktopFocusToolsFan"
        aria-expanded="${state.focusToolsOpen ? "true" : "false"}"
        data-tooltip="Focus tools"
      >
        ${state.focusToolsOpen ? icons.clear : icons.panels}
      </button>
      ${state.focusToolsOpen ? `
        <div class="desktop-focus-tools-fan" id="desktopFocusToolsFan" role="toolbar" aria-label="Focus Mode tools">
          ${focusWorkspaceToolButtons("desktop-focus-tool-option")}
        </div>
      ` : ""}
    </div>
  `;
}

function focusWorkspaceToolButtons(buttonClass) {
  const tools = [
    ["History", icons.history],
    ["Bookmarks", icons.bookmark],
    ["Annotations", icons.note],
  ];
  return tools.map(([label, icon], index) => `
    <button
      class="${buttonClass} ${state.focusWorkspacePanel === label ? "active" : ""}"
      type="button"
      data-focus-workspace="${label}"
      aria-label="Open ${label}"
      aria-pressed="${state.focusWorkspacePanel === label ? "true" : "false"}"
      data-tooltip="${label}"
      style="--focus-tool-index: ${index}"
    >
      ${icon}
    </button>
  `).join("");
}

function mobileFocusWorkspacePanel() {
  const panel = state.focusWorkspacePanel;
  if (!state.focusMode || !["History", "Bookmarks", "Annotations"].includes(panel)) return "";
  const content = panel === "History"
    ? historyPanel()
    : panel === "Bookmarks"
      ? bookmarksPanel()
      : notesPanel();
  const icon = panel === "History" ? icons.history : panel === "Bookmarks" ? icons.bookmark : icons.note;
  return `
    <section class="mobile-focus-workspace" id="mobileFocusWorkspace" role="dialog" aria-label="Focus Mode ${panel}">
      <header class="mobile-focus-workspace-head">
        <div>
          <span>Focus tools</span>
          <strong>${icon}${panel}</strong>
        </div>
        <button id="mobileFocusWorkspaceClose" type="button" aria-label="Close ${panel}">${icons.clear}</button>
      </header>
      <div class="mobile-focus-workspace-body">
        ${content}
      </div>
    </section>
  `;
}

function mobileFocusSearchResults() {
  if (!state.focusMode || !state.focusSearchResultsOpen || !state.searchResultsQuery) return "";
  return `
    <section class="mobile-focus-search-results" id="mobileFocusSearchResults" role="dialog" aria-label="Focus Mode search results" aria-busy="${state.searchPending ? "true" : "false"}">
      <header class="mobile-focus-search-results-head">
        <div>
          <span>Search results</span>
          <strong>${escapeHtml(state.searchResultsQuery)}</strong>
        </div>
        <button id="mobileFocusSearchResultsClose" type="button" aria-label="Close search results">${icons.clear}</button>
      </header>
      <div class="mobile-focus-search-results-body">
        <div class="search-results">
          ${searchResultsMarkup()}
        </div>
      </div>
    </section>
  `;
}

function positionFocusSearchResults() {
  const panel = document.getElementById("mobileFocusSearchResults");
  if (!panel) return;
  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("width");
  if (isCompactScreen()) return;
  const anchor = document.querySelector(".topbar .search");
  if (!anchor) return;
  const anchorRect = anchor.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const margin = 14;
  const width = Math.min(440, Math.max(360, anchorRect.width), viewportWidth - margin * 2);
  const left = Math.min(Math.max(margin, anchorRect.left), viewportWidth - width - margin);
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(anchorRect.bottom + 10)}px`;
  panel.style.width = `${Math.round(width)}px`;
}

function positionFocusWorkspacePanel() {
  const panel = document.getElementById("mobileFocusWorkspace");
  if (!panel) return;
  panel.style.removeProperty("left");
  panel.style.removeProperty("top");
  panel.style.removeProperty("width");
  if (isCompactScreen()) return;
  const anchor = document.querySelector(".topbar .search");
  if (!anchor) return;
  const anchorRect = anchor.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const margin = 14;
  const width = Math.min(440, Math.max(400, anchorRect.width), viewportWidth - margin * 2);
  const left = Math.min(Math.max(margin, anchorRect.left), viewportWidth - width - margin);
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(anchorRect.bottom + 70)}px`;
  panel.style.width = `${Math.round(width)}px`;
}

function pushReminderSettings(prefix = "") {
  const idPrefix = prefix ? `${prefix}` : "";
  const enabledId = `${idPrefix}PushNotificationsToggle`;
  const morningId = `${idPrefix}PushMorningTime`;
  const eveningEnabledId = `${idPrefix}PushEveningToggle`;
  const eveningId = `${idPrefix}PushEveningTime`;
  const friendRequestId = `${idPrefix}PushFriendRequestToggle`;
  const gameChallengeId = `${idPrefix}PushGameChallengeToggle`;
  const challengeAcceptedId = `${idPrefix}PushChallengeAcceptedToggle`;
  const controlsDisabled = !state.pushSupported || state.pushPermissionDenied || !state.pushEnabled || state.pushBusy;
  const timezone = escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || "local time");
  const status = state.pushEnabled && state.pushSupported && !state.pushBusy
    ? `Scheduled in ${timezone} and adjusted automatically for daylight saving time.`
    : state.pushStatus;
  return `
    <div class="setting-group push-reminder-settings">
      <span class="setting-label">Notifications</span>
      <label class="setting-checkbox">
        <input type="checkbox" id="${enabledId}" ${state.pushEnabled ? "checked" : ""} ${!state.pushSupported || state.pushPermissionDenied || state.pushBusy ? "disabled" : ""} />
        <span>Allow notifications on this device</span>
      </label>
      <span class="setting-label push-setting-subhead">Daily reminders</span>
      <div class="push-reminder-row">
        <label for="${morningId}">Morning reading</label>
        <input type="time" id="${morningId}" value="${state.pushMorningTime}" ${controlsDisabled ? "disabled" : ""} />
      </div>
      <div class="push-reminder-row push-evening-row">
        <label class="setting-checkbox" for="${eveningEnabledId}">
          <input type="checkbox" id="${eveningEnabledId}" ${state.pushEveningEnabled ? "checked" : ""} ${controlsDisabled ? "disabled" : ""} />
          <span>Evening nudge if unopened</span>
        </label>
        <input type="time" id="${eveningId}" value="${state.pushEveningTime}" ${controlsDisabled || !state.pushEveningEnabled ? "disabled" : ""} aria-label="Evening reminder time" />
      </div>
      <span class="setting-label push-setting-subhead">Friend activity</span>
      ${state.authUser ? `
        <div class="push-social-options">
          <label class="setting-checkbox">
            <input type="checkbox" id="${friendRequestId}" ${state.pushFriendRequestNotifications ? "checked" : ""} ${controlsDisabled ? "disabled" : ""} />
            <span>Friend requests</span>
          </label>
          <label class="setting-checkbox">
            <input type="checkbox" id="${gameChallengeId}" ${state.pushGameChallengeNotifications ? "checked" : ""} ${controlsDisabled ? "disabled" : ""} />
            <span>Game challenges</span>
          </label>
          <label class="setting-checkbox">
            <input type="checkbox" id="${challengeAcceptedId}" ${state.pushChallengeAcceptedNotifications ? "checked" : ""} ${controlsDisabled ? "disabled" : ""} />
            <span>Accepted challenges</span>
          </label>
        </div>
      ` : '<p class="setting-help">Sign in to receive friend-request and game-challenge notifications.</p>'}
      <p class="setting-help" aria-live="polite">${escapeHtml(status)}</p>
    </div>
  `;
}

function rememberDisclosureState(details, open = details.open) {
  const settingsKey = details.dataset.settingsSection;
  const helpKey = details.dataset.helpSection;
  if (settingsKey) state.settingsSectionsOpen[settingsKey] = open;
  if (helpKey) state.helpSectionsOpen[helpKey] = open;
}

function bindDisclosureAnimation(details) {
  const summary = details.querySelector(":scope > summary");
  const content = details.querySelector(":scope > .settings-section-content, :scope > .shortcut-list");
  if (!summary || !content) return;

  summary.addEventListener("click", (event) => {
    if (details.dataset.disclosureAnimating === "true") {
      event.preventDefault();
      return;
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reducedMotion || typeof content.animate !== "function") return;

    event.preventDefault();
    const opening = !details.open;
    const startHeight = opening ? 0 : content.getBoundingClientRect().height;
    const contentStyles = getComputedStyle(content);
    const expandedPaddingTop = contentStyles.paddingTop;
    const expandedPaddingBottom = contentStyles.paddingBottom;
    rememberDisclosureState(details, opening);
    details.dataset.disclosureAnimating = "true";
    content.style.overflow = "hidden";
    content.style.willChange = "height, opacity";

    if (opening) {
      content.style.height = "0px";
      content.style.opacity = "0";
      details.open = true;
    }

    const endHeight = opening ? content.scrollHeight : 0;
    const expandedFrame = {
      height: `${opening ? endHeight : startHeight}px`,
      paddingTop: expandedPaddingTop,
      paddingBottom: expandedPaddingBottom,
      opacity: 1,
    };
    const collapsedFrame = {
      height: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      opacity: 0,
    };
    const animation = content.animate(opening
      ? [collapsedFrame, expandedFrame]
      : [expandedFrame, collapsedFrame], {
      duration: opening ? 320 : 300,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    });

    animation.addEventListener("finish", () => {
      if (!opening) details.open = false;
      content.style.removeProperty("height");
      content.style.removeProperty("opacity");
      content.style.removeProperty("overflow");
      content.style.removeProperty("will-change");
      animation.cancel();
      delete details.dataset.disclosureAnimating;
    }, { once: true });
  });
}

function settingsDisclosure(key, label, content) {
  return `
    <details class="settings-section" data-settings-section="${key}" ${state.settingsSectionsOpen[key] ? "open" : ""}>
      <summary>${label}</summary>
      <div class="settings-section-content">
        ${content}
      </div>
    </details>
  `;
}

function readingDisplaySettings(prefix = "") {
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Fullscreen";
  const controlId = (name) => prefix ? `${prefix}${name}` : `${name[0].toLowerCase()}${name.slice(1)}`;
  const selectedAutoScrollSpeed = autoScrollSpeeds.find((speed) => speed.code === state.autoScrollSpeed) || autoScrollSpeeds[1];
  return settingsDisclosure("reading", "Reading & display", `
    <div class="setting-group">
      <div class="settings-control-row">
        <div class="text-size-control" aria-label="Text size controls">
          <button class="icon-btn" id="${controlId("DecreaseText")}" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
          <button class="text-size-reset" id="${controlId("ResetText")}" aria-label="Reset text size to 100%" data-tooltip="Reset text size"><span>Aa</span><span>${Math.round(state.textScale * 100)}%</span></button>
          <button class="icon-btn" id="${controlId("IncreaseText")}" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
        </div>
        <button class="ghost-btn fullscreen-btn" id="${controlId("FullscreenButton")}" aria-label="${fullscreenLabel}">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
      </div>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("ParagraphLayoutToggle")}" ${state.paragraphLayout ? "checked" : ""} />
        <span>Paragraph layout when available</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("SectionHeadingsToggle")}" ${state.sectionHeadings ? "checked" : ""} />
        <span>Section headings when available</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("RedLettersToggle")}" ${state.redLetters ? "checked" : ""} />
        <span>Words of Jesus in red</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("StrongNumbersToggle")}" ${state.strongNumbers ? "checked" : ""} />
        <span>Strong's number lookups</span>
      </label>
    </div>
    <div class="setting-group settings-section-subgroup">
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("EdgeChapterNavigationToggle")}" ${state.edgeChapterNavigationEnabled ? "checked" : ""} />
        <span>Pull or scroll past chapter edges</span>
      </label>
      <p class="setting-help">Changes chapters after a fresh outward pull or scroll at the top or bottom in Reader and Parallel.</p>
    </div>
    <div class="setting-group settings-section-subgroup">
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("AutoScrollEnabledToggle")}" ${state.autoScrollEnabled ? "checked" : ""} />
        <span>Enable auto-scroll controls</span>
      </label>
      <p class="setting-help">Shows the floating Play/Pause button in Reader and Parallel. You can also use the A key or a two-finger tap.</p>
      <span class="setting-label" id="${controlId("AutoScrollSpeedLabel")}">Auto-scroll speed</span>
      <div class="theme-mode-segment auto-scroll-speed-segment" role="group" aria-labelledby="${controlId("AutoScrollSpeedLabel")}" aria-disabled="${state.autoScrollEnabled ? "false" : "true"}">
        ${autoScrollSpeeds.map((speed) => `
          <button class="theme-mode-button ${speed.code === state.autoScrollSpeed ? "active" : ""}" type="button" data-auto-scroll-speed="${speed.code}" aria-pressed="${speed.code === state.autoScrollSpeed ? "true" : "false"}" ${state.autoScrollEnabled ? "" : "disabled"}>${speed.name}</button>
        `).join("")}
      </div>
      <p class="setting-help">${selectedAutoScrollSpeed.name} speed.</p>
    </div>
    <div class="setting-group settings-section-subgroup">
      <span class="setting-label" id="${controlId("SideToolbarPositionLabel")}">Landscape toolbar</span>
      <div class="theme-mode-segment side-toolbar-segment" role="group" aria-labelledby="${controlId("SideToolbarPositionLabel")}">
        <button class="theme-mode-button ${state.sideToolbarPosition === "left" ? "active" : ""}" type="button" data-side-toolbar-position="left" aria-pressed="${state.sideToolbarPosition === "left" ? "true" : "false"}">Left</button>
        <button class="theme-mode-button ${state.sideToolbarPosition === "right" ? "active" : ""}" type="button" data-side-toolbar-position="right" aria-pressed="${state.sideToolbarPosition === "right" ? "true" : "false"}">Right</button>
      </div>
    </div>
  `);
}

function accessibilitySettings(prefix = "") {
  const controlId = (name) => prefix ? `${prefix}${name}` : `${name[0].toLowerCase()}${name.slice(1)}`;
  const selectedSize = interfaceTextSizes.find((size) => size.code === state.interfaceTextSize) || interfaceTextSizes[0];
  return settingsDisclosure("accessibility", "Accessibility", `
    <div class="setting-group accessibility-settings">
      <span class="setting-label" id="${controlId("InterfaceTextSizeLabel")}">Interface text</span>
      <div class="theme-mode-segment accessibility-size-segment" role="group" aria-labelledby="${controlId("InterfaceTextSizeLabel")}">
        ${interfaceTextSizes.map((size) => `
          <button class="theme-mode-button ${size.code === state.interfaceTextSize ? "active" : ""}" type="button" data-interface-text-size-choice="${size.code}" aria-label="${size.name}, ${size.percent} percent interface text" aria-pressed="${size.code === state.interfaceTextSize ? "true" : "false"}">${size.name}</button>
        `).join("")}
      </div>
      <p class="setting-help" aria-live="polite">${selectedSize.name} (${selectedSize.percent}%). Enlarges navigation, Bible picker, Settings, and study-panel text. Scripture size stays separate.</p>
    </div>
  `);
}

function printingSettings(prefix = "") {
  const controlId = (name) => prefix ? `${prefix}${name}` : `${name[0].toLowerCase()}${name.slice(1)}`;
  const selectedLayout = printLayouts.find((layout) => layout.code === state.printLayout) || printLayouts[0];
  return settingsDisclosure("printing", "Printing", `
    <div class="setting-group">
      <span class="setting-label" id="${controlId("PrintLayoutLabel")}">Print layout</span>
      <div class="theme-mode-segment print-layout-segment" role="group" aria-labelledby="${controlId("PrintLayoutLabel")}">
        ${printLayouts.map((layout) => `
          <button class="theme-mode-button ${layout.code === state.printLayout ? "active" : ""}" type="button" data-print-layout="${layout.code}" aria-pressed="${layout.code === state.printLayout ? "true" : "false"}">${layout.name}</button>
        `).join("")}
      </div>
      <p class="setting-help">${escapeHtml(selectedLayout.description)}</p>
    </div>
    <div class="setting-group settings-section-subgroup">
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("PrintVerseNumbersToggle")}" ${state.printVerseNumbers ? "checked" : ""} />
        <span>Show verse numbers</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("PrintFullVersionNameToggle")}" ${state.printFullVersionName ? "checked" : ""} />
        <span>Use full Bible version name</span>
      </label>
    </div>
  `);
}

function startupReminderSettings(prefix = "") {
  const controlId = (name) => prefix ? `${prefix}${name}` : `${name[0].toLowerCase()}${name.slice(1)}`;
  return settingsDisclosure("startup", "Startup & reminders", `
    <div class="setting-group">
      <span class="setting-label">Startup</span>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("StartBigScreenToggle")}" ${state.startBigScreen ? "checked" : ""} />
        <span>Start in Big Screen Mode</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("StartVerseOfDayToggle")}" ${state.startVerseOfDay ? "checked" : ""} />
        <span>Start with Verse of the Day</span>
      </label>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("ShowStreakPopupToggle")}" ${state.showStreakPopup ? "checked" : ""} />
        <span>Show daily streak popup</span>
      </label>
    </div>
    <div class="setting-group settings-section-subgroup challenge-quiet-mode-settings">
      <span class="setting-label">Challenges</span>
      <label class="setting-checkbox">
        <input type="checkbox" id="${controlId("ChallengeQuietModeToggle")}" ${state.challengeQuietMode ? "checked" : ""} />
        <span>Challenge Quiet Mode</span>
      </label>
      <p class="setting-help">Keeps incoming challenge popups in Friends &amp; Challenges while you read, study, or present. Popups still appear in Games.</p>
    </div>
    ${pushReminderSettings(prefix)}
  `);
}

function appUpdateSettings(prefix = "") {
  const buttonId = prefix ? `${prefix}AppUpdateButton` : "appUpdateButton";
  const buttonLabel = state.appUpdateBusy
    ? state.appUpdateRefreshing ? "Refreshing…" : "Checking…"
    : state.appUpdateAvailable
      ? "Update now"
      : state.appUpdateRefreshOffered ? "Refresh app" : "Check for updates";
  const buttonClass = state.appUpdateAvailable ? "primary-btn" : "ghost-btn";
  return settingsDisclosure("updates", "App updates", `
    <div class="setting-group app-update-settings ${state.appUpdateAvailable ? "update-available" : ""}">
      <div class="app-update-version-row">
        <span class="setting-label">Installed version</span>
        <span class="app-update-version">${escapeHtml(appVersion)}</span>
      </div>
      <button class="${buttonClass} app-update-button" id="${buttonId}" type="button" ${state.appUpdateBusy ? "disabled" : ""}>${buttonLabel}</button>
      <p class="setting-help" aria-live="polite">${escapeHtml(state.appUpdateStatus)}</p>
    </div>
  `);
}

function appUpdateMetadataUrl() {
  const url = new URL("./app-version.json", window.location.href);
  url.searchParams.set("check", String(Date.now()));
  return url;
}

function renderAppUpdateStatus() {
  if (!state.settingsOpen || dataLoading || dataError) return;
  renderPreservingReaderScroll({ preferLastReaderAnchor: true });
}

function isPublishedAppVersionNewer(publishedVersion, installedVersion) {
  const numericVersion = /^\d+(?:\.\d+)+$/;
  if (!numericVersion.test(publishedVersion) || !numericVersion.test(installedVersion)) {
    return publishedVersion !== installedVersion;
  }
  const publishedParts = publishedVersion.split(".").map(Number);
  const installedParts = installedVersion.split(".").map(Number);
  const length = Math.max(publishedParts.length, installedParts.length);
  for (let index = 0; index < length; index += 1) {
    const publishedPart = publishedParts[index] || 0;
    const installedPart = installedParts[index] || 0;
    if (publishedPart !== installedPart) return publishedPart > installedPart;
  }
  return false;
}

async function checkForAppUpdate(options = {}) {
  if (state.appUpdateBusy) return;
  const manual = Boolean(options.manual);
  lastAppUpdateCheckAt = Date.now();
  state.appUpdateBusy = true;
  if (manual) {
    state.appUpdateStatus = "Checking the published site…";
    renderAppUpdateStatus();
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  let availableVersion = "";
  try {
    const response = await fetch(appUpdateMetadataUrl(), {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Update check failed with ${response.status}`);
    const payload = await response.json();
    const publishedVersion = String(payload?.version || "").trim();
    if (!/^[a-z0-9._-]{1,80}$/i.test(publishedVersion)) {
      throw new Error("Published app version is missing or invalid");
    }
    state.appUpdateVersion = publishedVersion;
    state.appUpdateAvailable = isPublishedAppVersionNewer(publishedVersion, appVersion);
    state.appUpdateRefreshOffered = manual && !state.appUpdateAvailable;
    state.appUpdateStatus = state.appUpdateAvailable
      ? `Version ${publishedVersion} is ready. Update now to load it.`
      : manual
        ? "You have the latest version. If anything still looks outdated, refresh the app here."
        : "Big Screen Bible is up to date.";
    if (state.appUpdateAvailable) availableVersion = publishedVersion;
  } catch (error) {
    console.warn("Big Screen Bible update check failed", error);
    if (manual) state.appUpdateStatus = "Unable to check right now. Confirm that this device is online and try again.";
  } finally {
    window.clearTimeout(timeout);
    state.appUpdateBusy = false;
    renderAppUpdateStatus();
  }

  if (availableVersion && announcedAppUpdateVersion !== availableVersion) {
    announcedAppUpdateVersion = availableVersion;
    showToast("A Big Screen Bible update is available in Settings");
  }
}

function maybeCheckForAppUpdate() {
  if (document.visibilityState !== "visible" || dataLoading || dataError || state.appUpdateBusy) return;
  if (Date.now() - lastAppUpdateCheckAt < appUpdateCheckIntervalMs) return;
  checkForAppUpdate();
}

function currentAppUpdateRestoreState(targetVersion) {
  return {
    expiresAt: Date.now() + 5 * 60 * 1000,
    targetVersion,
    mode: state.mode,
    reference: state.reference,
    verse: state.verse,
    selectedVerses: [...state.selectedVerses],
    focusMode: state.focusMode,
    libraryOpen: state.libraryOpen,
    activeRail: state.activeRail,
    presentationPart: state.presentationPart,
    isVerseOfDayActive: state.isVerseOfDayActive,
    verseOfDayItem: state.verseOfDayItem,
    scrollState: captureReaderScroll({ preferLastReaderAnchor: true }),
  };
}

function currentAppAssetUrls() {
  const urls = [...document.querySelectorAll('link[rel~="stylesheet"][href], script[src]')]
    .map((element) => element.href || element.src)
    .filter(Boolean)
    .map((value) => new URL(value, window.location.href))
    .filter((url) => url.origin === window.location.origin && url.pathname.includes("/assets/"))
    .map((url) => url.toString());
  return [...new Set(urls)];
}

async function refreshCurrentAppAssets() {
  const assetUrls = currentAppAssetUrls();
  if (!assetUrls.length) return;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    await Promise.allSettled(assetUrls.map((url) => fetch(url, {
      cache: "reload",
      credentials: "same-origin",
      signal: controller.signal,
    })));
  } finally {
    window.clearTimeout(timeout);
  }
}

async function applyAppUpdate() {
  const targetVersion = state.appUpdateVersion || appVersion;
  const restoreState = currentAppUpdateRestoreState(targetVersion);
  try {
    sessionStorage.setItem(appUpdateRestoreStorageKey, JSON.stringify(restoreState));
  } catch (error) {
    console.warn("Reading position could not be saved for the app update", error);
  }

  const url = new URL(window.location.href);
  url.searchParams.set("mode", state.mode);
  url.searchParams.set("ref", `${state.reference}:${state.verse}`);
  if (state.selectedVerses.length) url.searchParams.set("verses", verseRangeParam(state.selectedVerses));
  else url.searchParams.delete("verses");
  url.searchParams.set(appUpdateQueryKey, targetVersion);
  const readerAnchor = restoreState.scrollState?.readerAnchor;
  if (readerAnchor?.verse) {
    url.searchParams.set(appUpdateScrollVerseQueryKey, String(readerAnchor.verse));
    url.searchParams.set(appUpdateScrollOffsetQueryKey, String(Math.round(Number(readerAnchor.offset) || 0)));
  }
  if (Number.isFinite(restoreState.scrollState?.scriptureTop)) {
    url.searchParams.set(appUpdateScrollTopQueryKey, String(Math.round(restoreState.scrollState.scriptureTop)));
  }
  url.searchParams.delete("loaderPreview");
  state.appUpdateBusy = true;
  state.appUpdateRefreshing = true;
  state.appUpdateStatus = state.appUpdateAvailable
    ? `Loading version ${targetVersion}…`
    : "Refreshing the app…";
  renderAppUpdateStatus();
  await refreshCurrentAppAssets();
  window.location.replace(url.toString());
}

function consumeAppUpdateRestoreState() {
  let restoreState = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(appUpdateRestoreStorageKey) || "null");
    sessionStorage.removeItem(appUpdateRestoreStorageKey);
    if (saved && Number(saved.expiresAt) > Date.now()) restoreState = saved;
  } catch (error) {
    console.warn("Saved app update position could not be read", error);
  }

  const url = new URL(window.location.href);
  const targetVersion = url.searchParams.get(appUpdateQueryKey) || "";
  const scrollVerse = url.searchParams.get(appUpdateScrollVerseQueryKey) || "";
  const scrollOffset = Number(url.searchParams.get(appUpdateScrollOffsetQueryKey));
  const scriptureTop = Number(url.searchParams.get(appUpdateScrollTopQueryKey));
  if (!restoreState && targetVersion) {
    restoreState = {
      expiresAt: Date.now() + 60 * 1000,
      targetVersion,
      mode: state.mode,
      reference: state.reference,
      verse: state.verse,
      selectedVerses: [...state.selectedVerses],
      focusMode: state.focusMode,
      libraryOpen: state.libraryOpen,
      activeRail: state.activeRail,
      presentationPart: state.presentationPart,
      isVerseOfDayActive: state.isVerseOfDayActive,
      verseOfDayItem: state.verseOfDayItem,
      scrollState: {
        mode: state.mode,
        reference: state.reference,
        windowX: 0,
        windowY: 0,
        scriptureTop: Number.isFinite(scriptureTop) ? scriptureTop : 0,
        scriptureLeft: 0,
        triviaTop: null,
        triviaLeft: null,
        readerAnchor: scrollVerse ? {
          mode: state.mode,
          reference: state.reference,
          verse: scrollVerse,
          offset: Number.isFinite(scrollOffset) ? scrollOffset : 40,
        } : null,
      },
    };
  }
  if (targetVersion) {
    url.searchParams.delete(appUpdateQueryKey);
    url.searchParams.delete(appUpdateScrollVerseQueryKey);
    url.searchParams.delete(appUpdateScrollOffsetQueryKey);
    url.searchParams.delete(appUpdateScrollTopQueryKey);
    window.history?.replaceState?.(null, "", url);
  }
  return restoreState;
}

function applyAppUpdateRestoreState(restoreState) {
  if (!restoreState) return null;
  if (restoreState.reference && bibleData[restoreState.reference]) {
    state.reference = restoreState.reference;
    const verses = bibleData[state.reference].verses || [];
    const restoredVerse = Number(restoreState.verse);
    if (verses.some((verse) => verse.n === restoredVerse)) state.verse = restoredVerse;
  }
  if (["reader", "parallel", "big", "trivia"].includes(restoreState.mode)) state.mode = restoreState.mode;
  state.selectedVerses = Array.isArray(restoreState.selectedVerses)
    ? restoreState.selectedVerses.map(Number).filter(Number.isFinite)
    : [];
  state.focusMode = Boolean(restoreState.focusMode);
  state.libraryOpen = Boolean(restoreState.libraryOpen);
  state.activeRail = restoreState.activeRail || state.activeRail;
  state.presentationPart = Number(restoreState.presentationPart) || 0;
  state.isVerseOfDayActive = Boolean(restoreState.isVerseOfDayActive && restoreState.verseOfDayItem);
  state.verseOfDayItem = restoreState.verseOfDayItem || null;
  state.pendingVerseFocus = false;
  return restoreState.scrollState || null;
}

function restorePendingAppUpdatePosition() {
  if (!pendingAppUpdateRestore?.scrollState) return;
  restoreReaderScroll(pendingAppUpdateRestore.scrollState);
}

function stageAppUpdatePositionRestore(scrollState, restoredVersion) {
  if (!restoredVersion) return;
  pendingAppUpdateRestore = { scrollState, restoredVersion };
  window.clearTimeout(appUpdateRestoreAnnouncementTimer);
  window.clearTimeout(appUpdateRestoreCleanupTimer);
  appUpdateRestoreAnnouncementTimer = window.setTimeout(() => {
    restorePendingAppUpdatePosition();
    showToast(restoredVersion === appVersion ? `Updated to version ${appVersion}` : "Big Screen Bible refreshed");
  }, 1400);
  appUpdateRestoreCleanupTimer = window.setTimeout(() => {
    restorePendingAppUpdatePosition();
    pendingAppUpdateRestore = null;
  }, 5000);
}

function mobileSettingsPanel(settingsPanelRerender = false) {
  if (state.mode === "big" || !state.settingsOpen) return "";
  const primaryVersion = state.versions[0] || "BSB";
  const primaryVersionOptions = translationCodes
    .map((version) => `<option value="${version}" ${version === primaryVersion ? "selected" : ""}>${translationDisplayCode(version)} · ${translationLookup[version]?.name || version}</option>`)
    .join("");
  const followsSystemTheme = !localStorage.getItem("lw_theme");
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
    <div class="mobile-settings-popover draggable-popup ${settingsPanelRerender ? "settings-panel-rerender" : ""} ${popupPositionClass("settings")}" id="mobileSettingsPopover" role="dialog" aria-label="Settings" ${popupPositionStyle("settings")}>
      <div class="settings-popover-head">
        <span class="popup-drag-grip popup-drag-handle" data-popup-drag-handle="settings" aria-hidden="true" title="Drag to move settings"></span>
        <button class="settings-popover-close" id="mobileSettingsClose" type="button" aria-label="Close settings">${icons.clear}</button>
      </div>
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
      ${accessibilitySettings("mobile")}
      ${readingDisplaySettings("mobile")}
      ${printingSettings("mobile")}
      ${startupReminderSettings("mobile")}
      ${appUpdateSettings("mobile")}
      <nav class="settings-legal-links" aria-label="Legal information">
        <a href="./privacy/">Privacy Policy</a>
        <span aria-hidden="true">·</span>
        <a href="./terms/">Terms of Service</a>
      </nav>
    </div>
  `;
}

function topbar(settingsPanelRerender = false, accountPanelRerender = false) {
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
        <button class="primary-version-toggle version-add-toggle" id="versionMenuToggle" type="button" aria-label="Choose Bible versions, ${selectedVersions.length} selected" aria-haspopup="listbox" aria-expanded="${state.headerVersionMenuOpen ? "true" : "false"}" data-tooltip="Choose Bible versions">
          <span class="version-selected-label">${selectedVersions.length} Selected</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="primary-version-menu" role="listbox" aria-label="Bible version options">
          ${parallelVersionOptions}
        </div>
      </div>`
    : `
      <div class="versions primary-version-control ${state.headerVersionMenuOpen ? "open" : ""}" aria-label="Bible version">
        <button class="primary-version-toggle" id="versionMenuToggle" type="button" aria-label="Bible version ${translationDisplayCode(primaryVersion)}" aria-haspopup="listbox" aria-expanded="${state.headerVersionMenuOpen ? "true" : "false"}" data-tooltip="Bible version">
          <span>${translationDisplayCode(primaryVersion)}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div class="primary-version-menu" role="listbox" aria-label="Bible version options">
          ${primaryVersionHeaderOptions}
        </div>
      </div>`;
  const followsSystemTheme = !localStorage.getItem("lw_theme");
  const incomingFriendRequestCount = state.authUser ? friendshipCollections().incoming.length : 0;
  const incomingGameChallengeCount = state.authUser ? gameChallengeCollections().incoming.length : 0;
  const incomingSocialCount = incomingFriendRequestCount + incomingGameChallengeCount;
  const accountLabelBase = state.socialProfile?.username
    ? `Account for @${state.socialProfile.username}`
    : state.authUser ? "Account" : "Sign in";
  const incomingParts = [
    incomingFriendRequestCount
      ? `${incomingFriendRequestCount} friend ${incomingFriendRequestCount === 1 ? "request" : "requests"}`
      : "",
    incomingGameChallengeCount
      ? `${incomingGameChallengeCount} game ${incomingGameChallengeCount === 1 ? "challenge" : "challenges"}`
      : "",
  ].filter(Boolean);
  const accountLabel = incomingParts.length
    ? `${accountLabelBase}, incoming ${incomingParts.join(" and ")}`
    : accountLabelBase;
  const accountIcon = state.socialProfile?.username
    ? socialProfileAvatarMarkup(state.socialProfile, "social-profile-avatar-button")
    : icons.user;
  const accountFriendBadge = incomingSocialCount
    ? `<span class="account-friend-request-badge" aria-hidden="true">${incomingSocialCount > 9 ? "9+" : incomingSocialCount}</span>`
    : "";
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
        <img class="brand-mark-image" src="./assets/brand-mark.png?v=20260713-polished" width="420" height="220" alt="" />
        <span class="brand-divider" aria-hidden="true"></span>
        <div>
          <div class="brand-title">Big Screen</div>
          <div class="brand-subtitle">Bible</div>
        </div>
      </button>
      ${streakChip()}
      <div class="search" data-tooltip="Search Bible">
        <button class="topbar-search-scope" id="topbarSearchScope" type="button" data-search-scope-trigger data-search-scope-control data-search-scope="${normalizedSearchScope(state.searchScope)}" aria-label="Choose top search scope, current ${escapeHtml(searchScopeLabel(state.searchScope, state.reference))}" aria-haspopup="listbox" aria-expanded="false" title="Search scope: ${escapeHtml(searchScopeLabel(state.searchScope, state.reference))}">
          <span class="sr-only">Top search scope</span>
          <span class="topbar-search-icon" aria-hidden="true">${icons.search}</span>
          <span class="topbar-search-scope-code" data-search-scope-short aria-hidden="true">${escapeHtml(searchScopeShortLabel(state.searchScope))}</span>
        </button>
        <input id="referenceInput" value="${escapeHtml(state.searchQuery || referenceLabel())}" aria-label="Search Bible reference or phrase" placeholder="John 3:16 or love one another" />
        ${activeInlineSearchQuery() ? `<button class="topbar-search-clear inline-search-clear-control" type="button" data-clear-search aria-label="${escapeHtml(inlineSearchClearAriaLabel())}" data-tooltip="${escapeHtml(inlineSearchClearTitle())}"><span data-inline-search-progress aria-hidden="true">${escapeHtml(inlineSearchProgressText())}</span>${icons.clear}</button>` : ""}
        ${desktopFocusTools()}
      </div>
      <button class="icon-btn mobile-controls-toggle ${state.mobileControlsOpen ? "active" : ""}" id="mobileControlsToggle" aria-label="${state.mobileControlsOpen ? "Hide extra controls" : "Show extra controls"}" data-tooltip="${state.mobileControlsOpen ? "Hide controls" : "More controls"}">${icons.plus}<span>More</span></button>
      ${versionControls}
      <nav class="mode-tabs" aria-label="View mode">
        ${modeOptions.map(([mode, label, icon]) => `<button class="${state.mode === mode ? "active" : ""}" data-mode="${mode}" aria-label="${label}" data-tooltip="${label}">${icon}<span class="mode-label">${label}</span></button>`).join("")}
        <button class="mobile-mode-focus ${state.focusMode ? "active" : ""}" id="mobileFocusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}<span class="mode-label">Focus</span></button>
      </nav>
      <button class="icon-btn" id="shortcutsButton" aria-label="Help" data-tooltip="Help">?</button>
      <button class="icon-btn focus-toggle ${state.focusMode ? "active" : ""}" id="focusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}</button>
      <div class="account-menu ${state.accountOpen ? "open" : ""}">
        <button class="icon-btn account-quick-button ${state.authUser || state.accountOpen ? "active" : ""}" id="accountQuickButton" aria-label="${escapeHtml(accountLabel)}" data-tooltip="${escapeHtml(accountLabel)}">${accountIcon}${accountFriendBadge}</button>
        <div class="account-popover ${state.accountOpen ? "open" : ""} ${accountPanelRerender ? "account-panel-rerender" : ""}" aria-hidden="${state.accountOpen ? "false" : "true"}">
          <button class="settings-popover-close" id="accountPopoverClose" type="button" aria-label="Close account">${icons.clear}</button>
          ${accountPanel("quick")}
        </div>
      </div>
      <div class="settings-menu">
        <button class="icon-btn settings-toggle ${state.settingsOpen ? "active" : ""}" id="settingsToggle" aria-label="Settings" data-tooltip="Settings">${icons.settings}</button>
        <div class="settings-popover draggable-popup ${state.settingsOpen ? "open" : ""} ${settingsPanelRerender ? "settings-panel-rerender" : ""} ${popupPositionClass("settings")}" role="dialog" aria-label="Settings" aria-hidden="${state.settingsOpen ? "false" : "true"}" ${popupPositionStyle("settings")}>
          <div class="settings-popover-head">
            <span class="popup-drag-grip popup-drag-handle" data-popup-drag-handle="settings" aria-hidden="true" title="Drag to move settings"></span>
            <button class="settings-popover-close" id="settingsClose" type="button" aria-label="Close settings">${icons.clear}</button>
          </div>
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
          ${accessibilitySettings()}
          ${readingDisplaySettings()}
          ${printingSettings()}
          ${startupReminderSettings()}
          ${appUpdateSettings()}
          <nav class="settings-legal-links" aria-label="Legal information">
            <a href="./privacy/">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="./terms/">Terms of Service</a>
          </nav>
        </div>
      </div>
    </header>
  `;
}

function streakChip() {
  const streak = normalizeReadingStreak(state.streak);
  const tooltip = streakTooltip(streak);
  return `
    <div class="streak-menu ${state.streakPopoverOpen ? "open" : ""}">
      <button class="streak-chip ${state.streakPopoverOpen ? "active" : ""}" id="streakChip" type="button" aria-label="Reading streak. ${escapeHtml(tooltip)}" aria-expanded="${state.streakPopoverOpen ? "true" : "false"}" aria-controls="streakPopover" data-tooltip="${escapeHtml(tooltip)}">
        ${icons.flame}
        <span>
          <strong>${streak.current}</strong>
          <span>day streak</span>
        </span>
      </button>
      ${streakPopover(streak)}
    </div>
  `;
}

const streakEncouragements = [
  { ref: "Galatians 6:9", title: "Keep going", body: "The slow, faithful rhythm matters." },
  { ref: "2 Timothy 2:15", title: "Come prepared", body: "A few focused minutes can steady the whole day." },
  { ref: "Psalm 119:105", title: "Find light", body: "Return to the words that make the next step clearer." },
  { ref: "Joshua 1:8", title: "Stay near", body: "Let Scripture stay close enough to shape the day." },
  { ref: "Colossians 3:16", title: "Let it dwell", body: "Make room for the word to settle in richly." },
  { ref: "James 1:22", title: "Live it out", body: "Reading becomes fruitful as it turns into practice." },
  { ref: "Hebrews 10:23", title: "Hold fast", body: "A steady hope is built by returning again." },
];

function streakCheckedToday(streak = normalizeReadingStreak(state.streak)) {
  const today = localDateKey();
  return streak.lastVisit === today || (streak.days || []).includes(today);
}

function streakTooltip(streak = normalizeReadingStreak(state.streak)) {
  const today = localDateKey();
  if (streakCheckedToday(streak)) return `Checked in today. Come back tomorrow for Day ${streak.current + 1}.`;
  const gap = streak.lastVisit ? daysBetweenDateKeys(streak.lastVisit, today) : 0;
  const nextDay = gap === 1 ? streak.current + 1 : 1;
  return `Read today to reach Day ${nextDay}.`;
}

function currentWeekStreakDays(streak = normalizeReadingStreak(state.streak)) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - today.getDay());
  const readDays = new Set(streak.days || []);
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = localDateKey(date);
    return {
      key,
      label,
      read: readDays.has(key),
      today: key === localDateKey(today),
    };
  });
}

function currentStreakEncouragement(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return streakEncouragements[dayNumber % streakEncouragements.length];
}

function streakPopover(streak = normalizeReadingStreak(state.streak)) {
  if (!state.streakPopoverOpen) return "";
  const weekDays = currentWeekStreakDays(streak);
  const encouragement = currentStreakEncouragement();
  return `
    <div class="streak-popover" id="streakPopover" role="dialog" aria-label="Reading streak details">
      <div class="streak-popover-head">
        <div class="streak-popover-icon">${icons.flame}</div>
        <div>
          <span class="setting-label">Daily streak</span>
          <strong>${streak.current} ${streak.current === 1 ? "day" : "days"}</strong>
        </div>
      </div>
      <div class="streak-popover-stats">
        <span><strong>${streak.current}</strong><small>Current</small></span>
        <span><strong>${streak.best}</strong><small>Best</small></span>
      </div>
      <div class="streak-week" aria-label="Current week reading activity">
        ${weekDays.map((day) => `
          <span class="streak-week-day ${day.read ? "read" : ""} ${day.today ? "today" : ""}" aria-label="${day.label}: ${day.read ? "read" : "not read"}${day.today ? ", today" : ""}">
            <span>${day.label}</span>
            <span class="streak-week-mark" aria-hidden="true">${day.read ? "&#10003;" : ""}</span>
          </span>
        `).join("")}
      </div>
      <div class="streak-encouragement">
        <strong>${escapeHtml(encouragement.title)}</strong>
        <p>${escapeHtml(encouragement.body)}</p>
        <button type="button" data-streak-reference="${escapeHtml(encouragement.ref)}">Read ${escapeHtml(encouragement.ref)}</button>
      </div>
    </div>
  `;
}

function streakCard() {
  const streak = normalizeReadingStreak(state.streak);
  const lastVisitLabel = streak.lastVisit ? "Checked in today" : "Start today";
  const streakNote = `${lastVisitLabel}. This activity stays with the active browser profile and syncs when signed in.`;
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

function accountDataOwner() {
  return String(localStorage.getItem(accountDataOwnerStorageKey) || "").trim();
}

function setAccountDataOwner(owner = guestDataOwner) {
  const normalizedOwner = String(owner || guestDataOwner).trim() || guestDataOwner;
  localStorage.setItem(accountDataOwnerStorageKey, normalizedOwner);
  return normalizedOwner;
}

function accountSnapshotStorageKey(userId) {
  return `${accountSnapshotStoragePrefix}${encodeURIComponent(String(userId || "").trim())}`;
}

function readBrowserSnapshot(storageKey) {
  if (!storageKey) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!saved || typeof saved !== "object") return null;
    return normalizeCloudRow(saved);
  } catch {
    return null;
  }
}

function saveBrowserSnapshot(storageKey, snapshot) {
  if (!storageKey || !snapshot) return;
  localStorage.setItem(storageKey, JSON.stringify(normalizeCloudRow(snapshot)));
}

function guestBrowserSnapshot() {
  return readBrowserSnapshot(guestSnapshotStorageKey);
}

function accountBrowserSnapshot(userId) {
  if (!userId) return null;
  return readBrowserSnapshot(accountSnapshotStorageKey(userId));
}

function saveSnapshotForOwner(owner, snapshot) {
  if (!owner || !snapshot) return;
  if (owner === guestDataOwner) {
    saveBrowserSnapshot(guestSnapshotStorageKey, snapshot);
    return;
  }
  saveBrowserSnapshot(accountSnapshotStorageKey(owner), snapshot);
}

function blankLocalSnapshot(sourceSnapshot = captureCloudSnapshot()) {
  return {
    settings: {
      ...(sourceSnapshot?.settings || {}),
      versionsUpdatedAt: "",
    },
    bookmarks: [],
    notes: {},
    highlights: {},
    history: [],
    streak: normalizeReadingStreak({}),
  };
}

function pendingAccountSwitch() {
  return localStorage.getItem(pendingAccountSwitchStorageKey) === "true";
}

function setPendingAccountSwitch(pending) {
  if (pending) localStorage.setItem(pendingAccountSwitchStorageKey, "true");
  else localStorage.removeItem(pendingAccountSwitchStorageKey);
}

function localSnapshotForAuthenticatedUser(userId) {
  const owner = accountDataOwner();
  const currentSnapshot = captureCloudSnapshot();
  if (owner === userId) return currentSnapshot;

  if (owner === guestDataOwner) {
    saveSnapshotForOwner(guestDataOwner, currentSnapshot);
  } else if (owner) {
    saveSnapshotForOwner(owner, currentSnapshot);
  }

  const savedAccountSnapshot = accountBrowserSnapshot(userId);
  if (savedAccountSnapshot) return savedAccountSnapshot;
  if (owner === guestDataOwner && !pendingAccountSwitch()) return currentSnapshot;
  return blankLocalSnapshot(currentSnapshot);
}

function activateGuestBrowserData() {
  const currentSnapshot = captureCloudSnapshot();
  const owner = accountDataOwner();
  if (owner && owner !== guestDataOwner) saveSnapshotForOwner(owner, currentSnapshot);
  const guestSnapshot = guestBrowserSnapshot() || blankLocalSnapshot(currentSnapshot);
  setAccountDataOwner(guestDataOwner);
  applyCloudSnapshot(guestSnapshot);
}

function normalizedRememberedAccount(account = {}) {
  const userId = String(account.userId || "").trim();
  const email = String(account.email || "").trim().slice(0, 320);
  if (!userId || !email) return null;
  return {
    userId,
    email,
    provider: account.provider === "google" ? "google" : "email",
    username: normalizeProfileUsername(account.username || ""),
    displayName: String(account.displayName || "").trim().slice(0, 40),
    avatarKey: socialAvatarKeys.includes(account.avatarKey) ? account.avatarKey : "initials",
    lastUsedAt: normalizedVersionsUpdatedAt(account.lastUsedAt) || "",
  };
}

function rememberedAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(rememberedAccountsStorageKey) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .map(normalizedRememberedAccount)
      .filter(Boolean)
      .sort((a, b) => String(b.lastUsedAt).localeCompare(String(a.lastUsedAt)))
      .slice(0, rememberedAccountLimit);
  } catch {
    return [];
  }
}

function accountSessionStorageKey(userId) {
  return `${accountSessionStoragePrefix}${encodeURIComponent(String(userId || "").trim())}`;
}

function rememberedAccountSession(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(accountSessionStorageKey(normalizedUserId)) || "null");
    if (
      !saved
      || saved.userId !== normalizedUserId
      || typeof saved.access_token !== "string"
      || !saved.access_token
      || typeof saved.refresh_token !== "string"
      || !saved.refresh_token
    ) return null;
    return {
      userId: normalizedUserId,
      access_token: saved.access_token,
      refresh_token: saved.refresh_token,
      expires_at: Number(saved.expires_at) || null,
      updatedAt: normalizedVersionsUpdatedAt(saved.updatedAt) || "",
    };
  } catch {
    return null;
  }
}

function rememberAuthenticatedSession(session) {
  const userId = String(session?.user?.id || "").trim();
  if (!userId || !session?.access_token || !session?.refresh_token) return;
  localStorage.setItem(accountSessionStorageKey(userId), JSON.stringify({
    userId,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Number(session.expires_at) || null,
    updatedAt: new Date().toISOString(),
  }));
}

function removeRememberedAccountSession(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return;
  localStorage.removeItem(accountSessionStorageKey(normalizedUserId));
}

async function rememberCurrentAccountSession(client = createSupabaseClient()) {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const session = data?.session || null;
  rememberAuthenticatedSession(session);
  return session;
}

function authProviderForUser(user = state.authUser) {
  const provider = String(
    user?.app_metadata?.provider
    || user?.identities?.[0]?.provider
    || "email",
  ).toLowerCase();
  return provider === "google" ? "google" : "email";
}

function rememberAuthenticatedAccount(user = state.authUser, profile = null) {
  const existingAccount = rememberedAccounts().find((item) => item.userId === user?.id);
  const account = normalizedRememberedAccount({
    userId: user?.id,
    email: user?.email,
    provider: authProviderForUser(user),
    username: profile?.username || existingAccount?.username,
    displayName: profile?.displayName || existingAccount?.displayName,
    avatarKey: profile?.avatarKey || existingAccount?.avatarKey,
    lastUsedAt: new Date().toISOString(),
  });
  if (!account) return;
  const nextAccounts = [
    account,
    ...rememberedAccounts().filter((item) => item.userId !== account.userId),
  ].slice(0, rememberedAccountLimit);
  localStorage.setItem(rememberedAccountsStorageKey, JSON.stringify(nextAccounts));
}

function forgetRememberedAccount(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return;
  const nextAccounts = rememberedAccounts().filter((item) => item.userId !== normalizedUserId);
  localStorage.setItem(rememberedAccountsStorageKey, JSON.stringify(nextAccounts));
  localStorage.removeItem(accountSnapshotStorageKey(normalizedUserId));
  removeRememberedAccountSession(normalizedUserId);
  showToast("Account forgotten on this browser");
  renderPreservingReaderScroll();
}

function rememberedAccountsCard(prefix = "", options = {}) {
  const excludedUserId = String(options.excludeUserId || "").trim();
  const accounts = rememberedAccounts().filter((account) => account.userId !== excludedUserId);
  if (!accounts.length) return "";
  const suffix = prefix ? `${prefix}-` : "";
  return `
    <section class="account-card remembered-accounts-card" aria-labelledby="${suffix}rememberedAccountsTitle">
      <div class="account-card-head">
        <span class="setting-label">Previously used</span>
        <strong id="${suffix}rememberedAccountsTitle">Choose an account</strong>
      </div>
      <p>Accounts marked “Ready to switch” open without asking you to sign in again.</p>
      <div class="remembered-account-list">
        ${accounts.map((account) => {
          const accountProfile = {
            username: account.username || account.email.split("@")[0],
            displayName: account.displayName,
            avatarKey: account.avatarKey,
          };
          const identity = account.username ? `@${account.username}` : account.email;
          const providerLabel = account.provider === "google" ? "Google account" : "Email account";
          const sessionReady = Boolean(rememberedAccountSession(account.userId));
          return `
            <div class="remembered-account-row">
              <button
                class="remembered-account-use"
                type="button"
                data-use-account="${escapeHtml(account.userId)}"
                data-account-prefix="${escapeHtml(prefix)}"
                aria-label="Use ${escapeHtml(identity)}"
              >
                ${socialProfileAvatarMarkup(accountProfile, "remembered-account-avatar")}
                <span>
                  <strong>${escapeHtml(identity)}</strong>
                  <small>${escapeHtml(providerLabel)} · ${sessionReady ? "Ready to switch" : "Sign in required"}</small>
                </span>
                ${icons.chevron}
              </button>
              <button
                class="remembered-account-forget"
                type="button"
                data-forget-account="${escapeHtml(account.userId)}"
                aria-label="Forget ${escapeHtml(identity)} on this browser"
              >Forget</button>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

async function useRememberedAccount(userId, prefix = "") {
  const account = rememberedAccounts().find((item) => item.userId === userId);
  if (!account) return;
  const savedSession = rememberedAccountSession(account.userId);
  if (savedSession) {
    await activateRememberedAccount(account, savedSession);
    return;
  }
  state.accountAddOpen = true;
  state.accountSwitching = Boolean(state.authUser);
  state.authMessage = "This saved session has expired. Sign in once to reconnect this account.";
  renderPreservingReaderScroll();
  if (account.provider === "google") {
    await signInWithGoogle();
    return;
  }
  const suffix = prefix ? `${prefix}-` : "";
  requestAnimationFrame(() => {
    const emailInput = document.getElementById(`${suffix}accountEmail`);
    const passwordInput = document.getElementById(`${suffix}accountPassword`);
    if (emailInput) emailInput.value = account.email;
    passwordInput?.focus?.();
  });
}

function normalizeProfileUsername(value = "") {
  return String(value).trim().replace(/^@+/, "").toLowerCase();
}

function socialProfileValidationMessage(username, displayName = "") {
  if (!username) return "Choose a username.";
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(username)) {
    return "Use 3–20 characters, beginning with a letter. Lowercase letters, numbers, and underscores are allowed.";
  }
  if (["admin", "administrator", "bigscreenbible", "big_screen_bible", "moderator", "staff", "support", "system"].includes(username)) {
    return "That username is reserved. Choose another.";
  }
  if (String(displayName).trim().length > 40) return "Keep the display name to 40 characters or fewer.";
  return "";
}

function defaultSocialProfileDraft(user = state.authUser) {
  const metadataName = String(user?.user_metadata?.full_name || user?.user_metadata?.name || "").trim().slice(0, 40);
  return {
    username: "",
    displayName: metadataName,
    avatarKey: "initials",
    isDiscoverable: true,
    allowFriendRequests: true,
  };
}

function normalizedSocialProfile(row = {}) {
  const username = normalizeProfileUsername(row.username);
  const displayName = row.display_name ?? row.displayName;
  const avatarKey = row.avatar_key ?? row.avatarKey;
  const isDiscoverable = row.is_discoverable ?? row.isDiscoverable;
  const allowFriendRequests = row.allow_friend_requests ?? row.allowFriendRequests;
  return {
    userId: row.user_id || row.userId || state.authUser?.id || "",
    username,
    displayName: String(displayName || "").trim().slice(0, 40),
    avatarKey: socialAvatarKeys.includes(avatarKey) ? avatarKey : "initials",
    isDiscoverable: isDiscoverable !== false,
    allowFriendRequests: allowFriendRequests !== false,
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function socialProfileDraft(profile = state.socialProfile) {
  if (!profile) return defaultSocialProfileDraft();
  const normalized = normalizedSocialProfile(profile);
  return {
    username: normalized.username,
    displayName: normalized.displayName,
    avatarKey: normalized.avatarKey,
    isDiscoverable: normalized.isDiscoverable,
    allowFriendRequests: normalized.allowFriendRequests,
  };
}

function socialProfileInitials(profile = state.socialProfile) {
  const source = String(profile?.displayName || profile?.username || state.authUser?.email?.split("@")[0] || "BS").trim();
  const words = source.split(/[\s_-]+/).filter(Boolean);
  const initials = words.length > 1
    ? `${words[0][0] || ""}${words[words.length - 1]?.[0] || ""}`
    : String(words[0] || "BS").slice(0, 2);
  return initials.toUpperCase();
}

function socialProfileAvatarMarkup(profile = state.socialProfile, className = "") {
  const avatarKey = socialAvatarKeys.includes(profile?.avatarKey) ? profile.avatarKey : "initials";
  const option = socialAvatarOptions.find((item) => item.key === avatarKey) || socialAvatarOptions[0];
  const content = avatarKey === "initials"
    ? `<span>${escapeHtml(socialProfileInitials(profile))}</span>`
    : icons[option.icon];
  return `<span class="social-profile-avatar avatar-${avatarKey} ${className}" aria-hidden="true">${content}</span>`;
}

function socialProfileCard(prefix = "") {
  if (!state.authUser) return "";
  const suffix = prefix ? `${prefix}-` : "";
  if (state.socialProfileStatus === "loading") {
    return `
      <section class="account-card social-profile-card" aria-busy="true">
        <div class="account-card-head">
          <span class="setting-label">Social profile</span>
          <strong>Loading your profile…</strong>
        </div>
        <p>Your private study data remains separate from your social identity.</p>
      </section>
    `;
  }
  const draft = state.socialProfileDraft || socialProfileDraft();
  const hasProfile = Boolean(state.socialProfile?.username);
  const profileForAvatar = {
    username: draft.username,
    displayName: draft.displayName,
    avatarKey: draft.avatarKey,
  };
  const avatarChoices = socialAvatarQuickOptions.map((option) => `
    <button
      class="social-avatar-choice ${draft.avatarKey === option.key ? "active" : ""}"
      type="button"
      role="radio"
      aria-checked="${draft.avatarKey === option.key}"
      aria-label="${escapeHtml(option.label)} avatar"
      data-profile-avatar="${option.key}"
      ${state.socialProfileBusy ? "disabled" : ""}
    >
      ${socialProfileAvatarMarkup({ ...profileForAvatar, avatarKey: option.key })}
    </button>
  `).join("");
  const moreAvatarSelected = socialAvatarMoreOptions.some((option) => option.key === draft.avatarKey);
  const profileStatus = state.socialProfileMessage || (hasProfile
    ? `Your profile is saved as @${state.socialProfile.username}.`
    : "Create the identity friends will see. Your email is never shown.");
  return `
    <details class="account-card social-profile-card" data-social-profile-disclosure ${state.socialProfileOpen ? "open" : ""}>
      <summary class="social-profile-summary">
        <span class="social-profile-heading">
          ${socialProfileAvatarMarkup(profileForAvatar, "social-profile-avatar-preview")}
          <span class="account-card-head">
            <span class="setting-label">Social profile</span>
            <strong>${hasProfile ? `@${escapeHtml(state.socialProfile.username)}` : "Choose your identity"}</strong>
          </span>
        </span>
        <span class="social-profile-disclosure-icon" aria-hidden="true">${icons.chevron}</span>
      </summary>
      <div class="social-profile-content">
        <p id="${suffix}socialProfileStatus" role="status" aria-live="polite">${escapeHtml(profileStatus)}</p>
        <form class="account-form social-profile-form" id="${suffix}socialProfileForm">
          <label class="social-profile-field" for="${suffix}profileUsername">
            <span>Username</span>
            <span class="social-username-input">
              <span aria-hidden="true">@</span>
              <input
                id="${suffix}profileUsername"
                name="username"
                value="${escapeHtml(draft.username)}"
                inputmode="text"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                minlength="3"
                maxlength="20"
                pattern="[a-z][a-z0-9_]{2,19}"
                aria-describedby="${suffix}profileUsernameHelp"
                ${state.socialProfileBusy ? "disabled" : ""}
                required
              />
            </span>
            <small id="${suffix}profileUsernameHelp">3–20 characters. Start with a letter; use lowercase letters, numbers, or underscores.</small>
          </label>
          <label class="social-profile-field" for="${suffix}profileDisplayName">
            <span>Display name <small>optional</small></span>
            <input
              id="${suffix}profileDisplayName"
              name="displayName"
              value="${escapeHtml(draft.displayName)}"
              autocomplete="name"
              maxlength="40"
              placeholder="Name shown to friends"
              ${state.socialProfileBusy ? "disabled" : ""}
            />
          </label>
          <fieldset class="social-avatar-field">
            <legend>Avatar</legend>
            <div class="social-avatar-picker-row">
              <div class="social-avatar-options" role="radiogroup" aria-label="Quick profile avatar choices">
                ${avatarChoices}
              </div>
              <button
                class="social-avatar-more-toggle ${moreAvatarSelected ? "active" : ""}"
                id="${suffix}profileAvatarMore"
                type="button"
                aria-label="More avatar choices"
                aria-expanded="false"
                aria-controls="${suffix}socialAvatarMorePicker"
                data-profile-avatar-more
                data-profile-avatar-prefix="${escapeHtml(prefix)}"
                data-tooltip="More avatars"
                ${state.socialProfileBusy ? "disabled" : ""}
              >${icons.more}</button>
            </div>
          </fieldset>
          <div class="social-profile-privacy">
            <label>
              <input id="${suffix}profileDiscoverable" type="checkbox" ${draft.isDiscoverable ? "checked" : ""} ${state.socialProfileBusy ? "disabled" : ""} />
              <span><strong>Appear in people search</strong><small>Only signed-in people will be able to find this profile.</small></span>
            </label>
            <label>
              <input id="${suffix}profileFriendRequests" type="checkbox" ${draft.allowFriendRequests ? "checked" : ""} ${state.socialProfileBusy ? "disabled" : ""} />
              <span><strong>Allow friend requests</strong><small>Discoverable profiles can send you a request when this is on.</small></span>
            </label>
          </div>
          <button class="primary-btn compact-account-btn social-profile-save" type="submit" ${state.socialProfileBusy ? "disabled" : ""}>
            ${state.socialProfileBusy ? "Saving…" : hasProfile ? "Save profile" : "Create profile"}
          </button>
        </form>
      </div>
    </details>
  `;
}

function normalizedFriendship(row = {}) {
  return {
    id: String(row.id || ""),
    requesterId: String(row.requester_id || row.requesterId || ""),
    addresseeId: String(row.addressee_id || row.addresseeId || ""),
    status: row.status === "accepted" ? "accepted" : "pending",
    respondedAt: row.responded_at || row.respondedAt || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function friendshipOtherUserId(friendship, userId = state.authUser?.id || "") {
  if (!friendship || !userId) return "";
  return friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId;
}

function friendshipCollections(userId = state.authUser?.id || "") {
  const relationships = Array.isArray(state.friendships) ? state.friendships : [];
  return {
    friends: relationships.filter((item) => item.status === "accepted"),
    incoming: relationships.filter((item) => item.status === "pending" && item.addresseeId === userId),
    outgoing: relationships.filter((item) => item.status === "pending" && item.requesterId === userId),
  };
}

function friendshipForUser(profileUserId, userId = state.authUser?.id || "") {
  return state.friendships.find((item) => friendshipOtherUserId(item, userId) === profileUserId) || null;
}

function friendshipProfile(userId) {
  return state.friendshipProfiles[userId] || state.gameChallengeProfiles[userId] || null;
}

function gameChallengeTitle(gameType) {
  return {
    trivia: "Bible Trivia",
    "verse-order": "Verse Order",
    "reference-rush": "Reference Rush",
    "book-sprint": "Book Sprint",
    "who-said-it": "Who Said It?",
  }[gameType] || "Bible game";
}

function normalizedGameChallenge(row = {}) {
  return {
    id: String(row.id || ""),
    challengerId: String(row.challenger_id || row.challengerId || ""),
    challengedId: String(row.challenged_id || row.challengedId || ""),
    gameType: String(row.game_type || row.gameType || "trivia"),
    category: String(row.category || "Mixed"),
    difficulty: String(row.difficulty || "All"),
    roundCount: Number(row.round_count || row.roundCount || 10),
    version: String(row.version || "BSB"),
    timed: Boolean(row.timed),
    maxPlayers: Math.min(10, Math.max(2, Number(row.max_players || row.maxPlayers || 2))),
    seed: Number(row.seed || 1),
    status: String(row.status || "pending"),
    respondedAt: row.responded_at || row.respondedAt || "",
    startedAt: row.started_at || row.startedAt || "",
    completedAt: row.completed_at || row.completedAt || "",
    expiresAt: row.expires_at || row.expiresAt || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function normalizedGameChallengePlayer(row = {}) {
  return {
    challengeId: String(row.challenge_id || row.challengeId || ""),
    userId: String(row.user_id || row.userId || ""),
    isHost: Boolean(row.is_host ?? row.isHost),
    inviteStatus: String(row.invite_status || row.inviteStatus || "accepted"),
    respondedAt: row.responded_at || row.respondedAt || "",
    score: Math.max(0, Number(row.score) || 0),
    progress: Math.max(0, Number(row.progress) || 0),
    ready: Boolean(row.ready),
    completedAt: row.completed_at || row.completedAt || "",
    elapsedMs: row.elapsed_ms === null || row.elapsed_ms === undefined
      ? null
      : Math.max(0, Number(row.elapsed_ms) || 0),
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function gameChallengeOtherUserId(challenge, userId = state.authUser?.id || "") {
  if (!challenge || !userId) return "";
  return gameChallengePlayersFor(challenge.id)
    .find((player) => player.userId !== userId && ["invited", "accepted"].includes(player.inviteStatus))
    ?.userId || (challenge.challengerId === userId ? challenge.challengedId : challenge.challengerId);
}

function gameChallengePlayer(challengeId, userId = state.authUser?.id || "") {
  return state.gameChallengePlayers[challengeId]?.find((player) => player.userId === userId) || null;
}

function gameChallengePlayersFor(challengeId, { acceptedOnly = false } = {}) {
  const players = Array.isArray(state.gameChallengePlayers[challengeId])
    ? state.gameChallengePlayers[challengeId]
    : [];
  return acceptedOnly
    ? players.filter((player) => player.inviteStatus === "accepted")
    : players;
}

function gameChallengeAcceptedPlayers(challengeId) {
  return gameChallengePlayersFor(challengeId, { acceptedOnly: true });
}

function gameChallengeIsExpired(challenge) {
  const expiresAt = Date.parse(challenge?.expiresAt || "");
  return challenge?.status === "pending" && Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function gameChallengeCollections(userId = state.authUser?.id || "") {
  const challenges = Array.isArray(state.gameChallenges) ? state.gameChallenges : [];
  const membership = (challenge) => gameChallengePlayer(challenge.id, userId);
  return {
    incoming: challenges.filter((challenge) => (
      challenge.status === "pending"
      && membership(challenge)?.inviteStatus === "invited"
      && !gameChallengeIsExpired(challenge)
    )),
    outgoing: challenges.filter((challenge) => (
      challenge.status === "pending"
      && challenge.challengerId === userId
      && !gameChallengeIsExpired(challenge)
    )),
    lobbies: challenges.filter((challenge) => (
      challenge.status === "pending"
      && membership(challenge)?.inviteStatus === "accepted"
      && !gameChallengeIsExpired(challenge)
    )),
    live: challenges.filter((challenge) => (
      challenge.status === "accepted"
      && membership(challenge)?.inviteStatus === "accepted"
    )),
    completed: challenges.filter((challenge) => (
      challenge.status === "completed"
      && membership(challenge)?.inviteStatus === "accepted"
    )),
  };
}

function gameChallengeSummary(challenge) {
  const parts = [gameChallengeTitle(challenge.gameType)];
  if (challenge.gameType === "trivia" && challenge.category) parts.push(challenge.category);
  if (challenge.gameType !== "verse-order" && challenge.difficulty) parts.push(challenge.difficulty);
  const roundLabel = {
    "verse-order": "verses",
    "reference-rush": "verses",
    "book-sprint": "rounds",
    "who-said-it": "quotes",
  }[challenge.gameType] || "questions";
  parts.push(`${challenge.roundCount} ${roundLabel}`);
  return parts.join(" · ");
}

function dismissedGameChallengePopups() {
  if (dismissedGameChallengePopupKeys) return dismissedGameChallengePopupKeys;
  try {
    const saved = JSON.parse(localStorage.getItem(gameChallengePopupDismissedStorageKey) || "[]");
    dismissedGameChallengePopupKeys = new Set(
      Array.isArray(saved) ? saved.filter((key) => typeof key === "string").slice(-50) : [],
    );
  } catch {
    dismissedGameChallengePopupKeys = new Set();
  }
  return dismissedGameChallengePopupKeys;
}

function gameChallengePopupNoticeKey(notice) {
  if (!notice) return "";
  return [notice.userId, notice.kind, notice.challengeId, notice.actorUserId || "", notice.status].join(":");
}

function rememberDismissedGameChallengePopup(notice) {
  const key = gameChallengePopupNoticeKey(notice);
  if (!key) return;
  const dismissed = dismissedGameChallengePopups();
  dismissed.add(key);
  const recent = Array.from(dismissed).slice(-50);
  dismissedGameChallengePopupKeys = new Set(recent);
  localStorage.setItem(gameChallengePopupDismissedStorageKey, JSON.stringify(recent));
}

function gameChallengePopupCandidates(
  previousChallenges = [],
  challenges = [],
  userId = "",
  previousPlayers = {},
  players = state.gameChallengePlayers,
) {
  if (!userId) return [];
  const previousChallengeIds = new Set(previousChallenges.map((challenge) => challenge.id));
  const replies = challenges.flatMap((challenge) => {
    if (challenge.challengerId !== userId || !previousChallengeIds.has(challenge.id)) return [];
    const previousByUser = new Map(
      (previousPlayers[challenge.id] || []).map((player) => [player.userId, player]),
    );
    return (players[challenge.id] || [])
      .filter((player) => (
        !player.isHost
        && previousByUser.get(player.userId)?.inviteStatus === "invited"
        && ["accepted", "declined"].includes(player.inviteStatus)
      ))
      .map((player) => ({
        userId,
        actorUserId: player.userId,
        kind: "reply",
        challengeId: challenge.id,
        status: player.inviteStatus,
      }));
  });
  const incoming = challenges
    .filter((challenge) => (
      challenge.status === "pending"
      && (players[challenge.id] || []).some((player) => (
        player.userId === userId && player.inviteStatus === "invited"
      ))
      && !gameChallengeIsExpired(challenge)
    ))
    .map((challenge) => ({
      userId,
      actorUserId: challenge.challengerId,
      kind: "incoming",
      challengeId: challenge.id,
      status: "invited",
    }));
  return [...replies, ...incoming];
}

function gameChallengePopupNoticeIsValid(
  notice,
  challenges = state.gameChallenges,
  userId = state.authUser?.id || "",
) {
  if (!notice || notice.userId !== userId) return false;
  const challenge = challenges.find((item) => item.id === notice.challengeId);
  if (!challenge) return false;
  if (notice.kind === "incoming") {
    return challenge.status === "pending"
      && gameChallengePlayer(challenge.id, userId)?.inviteStatus === "invited"
      && !gameChallengeIsExpired(challenge);
  }
  return notice.kind === "reply"
    && challenge.challengerId === userId
    && ["accepted", "declined"].includes(notice.status)
    && gameChallengePlayer(challenge.id, notice.actorUserId)?.inviteStatus === notice.status;
}

function queueGameChallengePopupNotice(notice) {
  const key = gameChallengePopupNoticeKey(notice);
  if (
    !key
    || dismissedGameChallengePopups().has(key)
    || gameChallengePopupNoticeKey(gameChallengePopupNotice) === key
    || gameChallengePopupQueue.some((queued) => gameChallengePopupNoticeKey(queued) === key)
  ) return;
  gameChallengePopupQueue.push(notice);
}

function showNextGameChallengePopup() {
  const userId = state.authUser?.id || "";
  while (gameChallengePopupQueue.length) {
    const candidate = gameChallengePopupQueue.shift();
    if (
      gameChallengePopupNoticeIsValid(candidate, state.gameChallenges, userId)
      && !dismissedGameChallengePopups().has(gameChallengePopupNoticeKey(candidate))
    ) {
      gameChallengePopupNotice = candidate;
      return;
    }
  }
  gameChallengePopupNotice = null;
}

function reconcileGameChallengePopupNotices(
  previousChallenges = [],
  challenges = state.gameChallenges,
  userId = state.authUser?.id || "",
  previousPlayers = {},
  players = state.gameChallengePlayers,
) {
  if (!gameChallengePopupNoticeIsValid(gameChallengePopupNotice, challenges, userId)) {
    gameChallengePopupNotice = null;
  }
  gameChallengePopupQueue = gameChallengePopupQueue.filter((notice) => (
    gameChallengePopupNoticeIsValid(notice, challenges, userId)
  ));
  gameChallengePopupCandidates(previousChallenges, challenges, userId, previousPlayers, players)
    .forEach(queueGameChallengePopupNotice);
  if (!gameChallengePopupNotice) showNextGameChallengePopup();
}

function gameChallengePopupShouldInterrupt(
  notice,
  challengeQuietMode = state.challengeQuietMode,
  mode = state.mode,
) {
  return !(notice?.kind === "incoming" && challengeQuietMode && mode !== "trivia");
}

function gameChallengePopupIsVisible() {
  if (!gameChallengePopupNoticeIsValid(gameChallengePopupNotice)) return false;
  if (!gameChallengePopupShouldInterrupt(gameChallengePopupNotice)) return false;
  return !(
    state.pushPromptVisible
    || state.tutorialActive
    || state.tutorialIntroVisible
    || state.shortcutsOpen
    || state.aboutMenuOpen
  );
}

function dismissGameChallengePopup({ render = true } = {}) {
  const dismissedNotice = gameChallengePopupNotice;
  if (dismissedNotice) rememberDismissedGameChallengePopup(dismissedNotice);
  gameChallengePopupNotice = null;
  if (
    dismissedNotice?.kind === "incoming"
    && state.activeGameChallengeId === dismissedNotice.challengeId
    && gameChallengePlayer(dismissedNotice.challengeId)?.inviteStatus === "invited"
  ) {
    state.activeGameChallengeId = "";
    state.gameChallengeMessage = "Invitation saved for later in Friends & Challenges.";
    teardownGameRoomPresence();
  }
  showNextGameChallengePopup();
  if (render) renderPreservingReaderScroll();
}

function gameChallengePopup() {
  if (!gameChallengePopupIsVisible()) return "";
  const notice = gameChallengePopupNotice;
  const noticeKey = gameChallengePopupNoticeKey(notice);
  const continuingPopup = document.getElementById("gameChallengePopupDialog")
    ?.dataset.challengeNoticeKey === noticeKey;
  const challenge = state.gameChallenges.find((item) => item.id === notice.challengeId);
  if (!challenge) return "";
  const profile = friendshipProfile(notice.actorUserId || gameChallengeOtherUserId(challenge));
  const person = profile || {
    username: "",
    displayName: "A friend",
    avatarKey: "initials",
  };
  const personName = person.displayName || (person.username ? `@${person.username}` : "A friend");
  const personHandle = person.username ? `@${person.username}` : "";
  const incoming = notice.kind === "incoming";
  const accepted = notice.status === "accepted";
  const title = incoming
    ? `${personName} invited you`
    : accepted ? `${personName} joined your room` : `${personName} may play later`;
  const body = incoming
    ? "Join the waiting room for a live game with friends?"
    : accepted
      ? "Open the waiting room to see who is ready."
      : "They passed on this room. You can invite them again another time.";
  const primaryAction = incoming ? "accept" : accepted ? "join" : "";
  const primaryLabel = incoming
    ? state.gameChallengeActionBusyId === challenge.id ? "Joining…" : "Join room"
    : accepted ? "Open lobby" : "Got it";
  const popupBusy = Boolean(state.gameChallengeActionBusyId);
  return `
    <section class="game-challenge-popup-overlay open ${continuingPopup ? "continuing" : ""}">
      <article
        class="game-challenge-popup ${incoming ? "incoming" : `reply-${notice.status}`}"
        id="gameChallengePopupDialog"
        data-challenge-notice-key="${escapeHtml(noticeKey)}"
        data-popup-continuing="${continuingPopup}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameChallengePopupTitle"
        aria-describedby="gameChallengePopupDescription"
        tabindex="-1"
      >
        <div class="game-challenge-popup-icon" aria-hidden="true">${icons.trivia}</div>
        <div class="shortcut-eyebrow">${incoming ? "Game room invitation" : "Room update"}</div>
        <div class="game-challenge-popup-person">
          ${socialProfileAvatarMarkup(person, "game-challenge-popup-avatar")}
          <div>
            <strong>${escapeHtml(personName)}</strong>
            ${personHandle ? `<span>${escapeHtml(personHandle)}</span>` : ""}
          </div>
        </div>
        <h2 id="gameChallengePopupTitle">${escapeHtml(title)}</h2>
        <p id="gameChallengePopupDescription">${escapeHtml(body)}</p>
        <div class="game-challenge-popup-summary">${escapeHtml(gameChallengeSummary(challenge))}</div>
        <div class="game-challenge-popup-actions">
          ${primaryAction ? `
            <button
              class="primary-btn"
              id="gameChallengePopupPrimary"
              type="button"
              data-game-challenge-action="${primaryAction}"
              data-game-challenge-id="${escapeHtml(challenge.id)}"
              ${popupBusy ? "disabled" : ""}
            >${escapeHtml(primaryLabel)}</button>
          ` : `
            <button class="primary-btn" id="gameChallengePopupPrimary" type="button" data-game-challenge-popup-dismiss ${popupBusy ? "disabled" : ""}>${primaryLabel}</button>
          `}
          ${incoming || accepted
            ? `<button class="ghost-btn" type="button" data-game-challenge-popup-dismiss ${popupBusy ? "disabled" : ""}>Maybe later</button>`
            : ""}
        </div>
        ${incoming ? '<p class="game-challenge-popup-note">Maybe later keeps this invitation waiting in Friends &amp; Challenges.</p>' : ""}
      </article>
    </section>
  `;
}

function gameChallengeActionButton(action, label, challenge, { primary = false, danger = false } = {}) {
  const busy = Boolean(state.gameChallengeActionBusyId);
  const classNames = [
    primary ? "primary-btn" : "ghost-btn",
    "friend-action-button",
    danger ? "friend-action-danger" : "",
  ].filter(Boolean).join(" ");
  return `
    <button
      class="${classNames}"
      type="button"
      data-game-challenge-action="${action}"
      data-game-challenge-id="${escapeHtml(challenge.id)}"
      ${busy ? "disabled" : ""}
    >${state.gameChallengeActionBusyId === challenge.id ? "Working…" : escapeHtml(label)}</button>
  `;
}

function gameChallengeRow(challenge, kind) {
  const players = gameChallengePlayersFor(challenge.id);
  const acceptedPlayers = players.filter((player) => player.inviteStatus === "accepted");
  const invitedPlayers = players.filter((player) => player.inviteStatus === "invited");
  const hostProfile = friendshipProfile(challenge.challengerId);
  const otherPlayer = acceptedPlayers.find((player) => player.userId !== state.authUser?.id)
    || invitedPlayers.find((player) => player.userId !== state.authUser?.id);
  const profile = challenge.challengerId === state.authUser?.id
    ? friendshipProfile(otherPlayer?.userId)
    : hostProfile;
  let actions = "";
  let note = gameChallengeSummary(challenge);
  if (kind === "incoming") {
    actions = `
      ${gameChallengeActionButton("accept", "Accept", challenge, { primary: true })}
      ${gameChallengeActionButton("decline", "Decline", challenge)}
    `;
    note = `${note} · ${acceptedPlayers.length} joined · Invited you`;
  } else if (kind === "lobby") {
    actions = `
      ${gameChallengeActionButton("lobby", "Open lobby", challenge, { primary: true })}
      ${challenge.challengerId === state.authUser?.id
        ? gameChallengeActionButton("cancel", "Cancel room", challenge)
        : ""}
    `;
    note = `${note} · ${acceptedPlayers.length} joined${invitedPlayers.length ? ` · ${invitedPlayers.length} invited` : ""}`;
  } else if (kind === "live") {
    actions = `
      ${gameChallengeActionButton("join", state.activeGameChallengeId === challenge.id ? "In game" : "Join game", challenge, { primary: true })}
      ${challenge.challengerId === state.authUser?.id
        ? gameChallengeActionButton("end", "End", challenge, { danger: true })
        : ""}
    `;
    note = `${note} · ${acceptedPlayers.length} players · Live now`;
  } else {
    actions = gameChallengeActionButton("view", "Results", challenge);
    const selfPlayer = acceptedPlayers.find((player) => player.userId === state.authUser?.id);
    const place = gameChallengePlayerRank(challenge, selfPlayer, acceptedPlayers);
    note = `${gameChallengeSummary(challenge)} · ${place ? `Placed #${place} of ${acceptedPlayers.length}` : `${acceptedPlayers.length} players`}`;
  }
  return friendshipPersonRow(profile, actions, note);
}

function gameChallengesCard() {
  if (!state.authUser || !state.socialProfile) return "";
  const collections = gameChallengeCollections();
  const incomingRows = collections.incoming.map((challenge) => gameChallengeRow(challenge, "incoming")).join("");
  const lobbyRows = collections.lobbies.map((challenge) => gameChallengeRow(challenge, "lobby")).join("");
  const liveRows = collections.live.map((challenge) => gameChallengeRow(challenge, "live")).join("");
  const completedRows = collections.completed.slice(0, 3).map((challenge) => gameChallengeRow(challenge, "completed")).join("");
  const empty = !incomingRows && !lobbyRows && !liveRows && !completedRows;
  const liveLabel = state.gameChallengeRealtimeStatus === "subscribed" ? "Live updates on" : "Connecting live updates…";
  return `
    <section class="account-card game-challenges-card" aria-busy="${state.gameChallengeStatus === "loading"}">
      <div class="game-challenges-heading">
        <div class="account-card-head">
          <span class="setting-label">Challenges</span>
          <strong>${collections.live.length ? `${collections.live.length} active` : liveLabel}</strong>
        </div>
        ${collections.incoming.length
          ? `<span class="friend-request-count" aria-label="${collections.incoming.length} incoming game ${collections.incoming.length === 1 ? "challenge" : "challenges"}">${collections.incoming.length}</span>`
          : ""}
      </div>
      <p class="friends-status" role="status" aria-live="polite">${escapeHtml(
        state.gameChallengeStatus === "loading" ? "Loading challenges…" : state.gameChallengeMessage,
      )}</p>
      ${incomingRows ? `<div class="friend-list-group"><div class="friend-list-heading"><strong>Incoming</strong><span>${collections.incoming.length}</span></div>${incomingRows}</div>` : ""}
      ${lobbyRows ? `<div class="friend-list-group"><div class="friend-list-heading"><strong>Waiting rooms</strong><span>${collections.lobbies.length}</span></div>${lobbyRows}</div>` : ""}
      ${liveRows ? `<div class="friend-list-group"><div class="friend-list-heading"><strong>Ready to play</strong><span>${collections.live.length}</span></div>${liveRows}</div>` : ""}
      ${completedRows ? `<details class="challenge-history"><summary>Recent results</summary>${completedRows}</details>` : ""}
      ${empty ? '<p class="friend-empty-state">Challenge a friend from the Friends list or Games setup.</p>' : ""}
    </section>
  `;
}

function friendshipPersonRow(profile, actions = "", note = "") {
  const person = profile || {
    username: "",
    displayName: "Profile unavailable",
    avatarKey: "initials",
  };
  const username = person.username ? `@${escapeHtml(person.username)}` : "Profile unavailable";
  const displayName = person.displayName ? `<strong>${escapeHtml(person.displayName)}</strong>` : "";
  return `
    <article class="friend-person-row">
      ${socialProfileAvatarMarkup(person, "friend-person-avatar")}
      <div class="friend-person-copy">
        ${displayName}
        <span>${username}</span>
        ${note ? `<small>${escapeHtml(note)}</small>` : ""}
      </div>
      ${actions ? `<div class="friend-person-actions">${actions}</div>` : ""}
    </article>
  `;
}

function friendshipActionButton(action, label, { friendshipId = "", profileId = "", primary = false, danger = false } = {}) {
  const busyKey = friendshipId || (profileId ? `profile:${profileId}` : "");
  const isBusy = Boolean(state.friendshipActionBusyId);
  const classNames = [
    primary ? "primary-btn" : "ghost-btn",
    "friend-action-button",
    danger ? "friend-action-danger" : "",
  ].filter(Boolean).join(" ");
  return `
    <button
      class="${classNames}"
      type="button"
      data-friend-action="${action}"
      ${friendshipId ? `data-friendship-id="${escapeHtml(friendshipId)}"` : ""}
      ${profileId ? `data-friend-profile-id="${escapeHtml(profileId)}"` : ""}
      ${isBusy ? "disabled" : ""}
    >${state.friendshipActionBusyId === busyKey ? "Working…" : escapeHtml(label)}</button>
  `;
}

function friendshipSearchResultRow(profile) {
  const relationship = friendshipForUser(profile.userId);
  if (!relationship) {
    if (!profile.allowFriendRequests) {
      return friendshipPersonRow(profile, '<span class="friend-state-label">Requests off</span>', "Not accepting friend requests");
    }
    return friendshipPersonRow(
      profile,
      friendshipActionButton("send", "Add friend", { profileId: profile.userId, primary: true }),
    );
  }
  if (relationship.status === "accepted") {
    return friendshipPersonRow(profile, '<span class="friend-state-label friend-state-success">Friends</span>');
  }
  if (relationship.requesterId === state.authUser?.id) {
    return friendshipPersonRow(
      profile,
      friendshipActionButton("cancel", "Cancel", { friendshipId: relationship.id }),
      "Request sent",
    );
  }
  return friendshipPersonRow(
    profile,
    `
      ${friendshipActionButton("accept", "Accept", { friendshipId: relationship.id, primary: true })}
      ${friendshipActionButton("decline", "Decline", { friendshipId: relationship.id })}
    `,
    "Sent you a request",
  );
}

function friendsPanelContent(prefix = "") {
  const suffix = prefix ? `${prefix}-` : "";
  const collections = friendshipCollections();
  if (state.friendsPanelTab === "requests") {
    const incomingRows = collections.incoming.map((friendship) => {
      const profile = friendshipProfile(friendshipOtherUserId(friendship));
      return friendshipPersonRow(
        profile,
        `
          ${friendshipActionButton("accept", "Accept", { friendshipId: friendship.id, primary: true })}
          ${friendshipActionButton("decline", "Decline", { friendshipId: friendship.id })}
        `,
        "Sent you a request",
      );
    }).join("");
    const outgoingRows = collections.outgoing.map((friendship) => {
      const profile = friendshipProfile(friendshipOtherUserId(friendship));
      return friendshipPersonRow(
        profile,
        friendshipActionButton("cancel", "Cancel", { friendshipId: friendship.id }),
        "Waiting for a response",
      );
    }).join("");
    return `
      <div class="friend-list-group">
        <div class="friend-list-heading"><strong>Incoming</strong><span>${collections.incoming.length}</span></div>
        ${incomingRows || '<p class="friend-empty-state">No incoming requests.</p>'}
      </div>
      <div class="friend-list-group">
        <div class="friend-list-heading"><strong>Sent</strong><span>${collections.outgoing.length}</span></div>
        ${outgoingRows || '<p class="friend-empty-state">No sent requests.</p>'}
      </div>
    `;
  }
  if (state.friendsPanelTab === "find") {
    const searchRows = state.friendSearchResults.map(friendshipSearchResultRow).join("");
    const searchStatus = state.friendSearchStatus === "loading"
      ? "Searching…"
      : state.friendSearchMessage || "Search by username. Enter at least two characters.";
    return `
      <form class="friend-search-form" id="${suffix}friendSearchForm" role="search">
        <label for="${suffix}friendSearchInput">Find people</label>
        <div>
          <input
            id="${suffix}friendSearchInput"
            value="${escapeHtml(state.friendSearchQuery)}"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            maxlength="20"
            placeholder="@username"
            aria-describedby="${suffix}friendSearchHelp"
          />
          <button class="primary-btn friend-search-button" type="submit" ${state.friendSearchStatus === "loading" ? "disabled" : ""}>Search</button>
        </div>
        <small id="${suffix}friendSearchHelp">${escapeHtml(searchStatus)}</small>
      </form>
      <div class="friend-search-results" aria-live="polite">
        ${searchRows}
      </div>
    `;
  }
  const friendRows = collections.friends.map((friendship) => {
    const profileId = friendshipOtherUserId(friendship);
    const profile = friendshipProfile(profileId);
    return friendshipPersonRow(
      profile,
      `
        ${friendshipActionButton("challenge", "Challenge", { profileId, primary: true })}
        ${friendshipActionButton("remove", "Remove", { friendshipId: friendship.id, danger: true })}
      `,
    );
  }).join("");
  return friendRows || '<p class="friend-empty-state">No friends yet. Use Find people to send your first request.</p>';
}

function friendsCard(prefix = "") {
  if (!state.authUser) return "";
  if (!state.socialProfile) {
    return `
      <section class="account-card friends-card">
        <div class="account-card-head">
          <span class="setting-label">Friends</span>
          <strong>Create your social profile first</strong>
        </div>
        <p>Choose a username above before finding people or receiving friend requests.</p>
      </section>
    `;
  }
  const collections = friendshipCollections();
  const requestCount = collections.incoming.length;
  const tabs = [
    ["friends", `Friends · ${collections.friends.length}`],
    ["requests", requestCount ? `Requests · ${requestCount}` : "Requests"],
    ["find", "Find people"],
  ];
  return `
    <section class="account-card friends-card" aria-busy="${state.friendshipStatus === "loading"}">
      <div class="friends-card-heading">
        <div class="account-card-head">
          <span class="setting-label">Friends</span>
          <strong>${collections.friends.length} ${collections.friends.length === 1 ? "connection" : "connections"}</strong>
        </div>
        ${requestCount ? `<span class="friend-request-count" aria-label="${requestCount} incoming friend ${requestCount === 1 ? "request" : "requests"}">${requestCount}</span>` : ""}
      </div>
      <div class="friends-tabs" role="tablist" aria-label="Friends">
        ${tabs.map(([tab, label]) => `
          <button
            type="button"
            role="tab"
            aria-selected="${state.friendsPanelTab === tab}"
            class="${state.friendsPanelTab === tab ? "active" : ""}"
            data-friends-tab="${tab}"
          >${escapeHtml(label)}</button>
        `).join("")}
      </div>
      <p class="friends-status" role="status" aria-live="polite">${escapeHtml(
        state.friendshipStatus === "loading" ? "Loading friends…" : state.friendshipMessage,
      )}</p>
      <div class="friends-panel-content">
        ${state.friendshipStatus === "loading"
          ? '<p class="friend-empty-state">Loading your connections…</p>'
          : friendsPanelContent(prefix)}
      </div>
    </section>
  `;
}

function setSocialConnectionsOpen(open) {
  state.socialConnectionsOpen = Boolean(open);
  localStorage.setItem(socialConnectionsOpenStorageKey, state.socialConnectionsOpen ? "true" : "false");
}

function socialConnectionsSection(prefix = "") {
  if (!state.authUser) return "";
  const friendships = friendshipCollections();
  const challenges = gameChallengeCollections();
  const friendRequestCount = friendships.incoming.length;
  const challengeCount = challenges.incoming.length;
  const incomingCount = friendRequestCount + challengeCount;
  const incomingLabels = [
    friendRequestCount
      ? `${friendRequestCount} friend ${friendRequestCount === 1 ? "request" : "requests"}`
      : "",
    challengeCount
      ? `${challengeCount} game ${challengeCount === 1 ? "challenge" : "challenges"}`
      : "",
  ].filter(Boolean);
  const activityLabel = incomingLabels.length
    ? `${incomingLabels.join(" and ")} waiting`
    : "No new friend activity";
  return `
    <details
      class="social-connections-card ${incomingCount ? "has-incoming-activity" : ""}"
      data-social-connections-disclosure
      ${state.socialConnectionsOpen ? "open" : ""}
    >
      <summary class="social-connections-summary">
        <span class="account-card-head">
          <strong>Friends &amp; challenges</strong>
          <small>${friendships.friends.length} ${friendships.friends.length === 1 ? "connection" : "connections"}</small>
        </span>
        <span class="social-connections-summary-actions">
          ${incomingCount ? `
            <span class="social-connections-activity" aria-label="${escapeHtml(activityLabel)}">
              <span aria-hidden="true">${incomingCount > 9 ? "9+" : incomingCount}</span>
              <small>New</small>
            </span>
          ` : ""}
          <span class="social-connections-disclosure-icon" aria-hidden="true">${icons.chevron}</span>
        </span>
      </summary>
      <div class="social-connections-content">
        ${friendsCard(prefix)}
        ${gameChallengesCard()}
      </div>
    </details>
  `;
}

function accountSignInCard(prefix = "", options = {}) {
  const suffix = prefix ? `${prefix}-` : "";
  const emailId = `${suffix}accountEmail`;
  const showEmailCue = state.authEmailCueId === emailId;
  const addingAccount = options.addingAccount === true;
  const status = state.authMessage || (
    addingAccount
      ? "Sign in once to add another account to this browser."
      : "Sign in or create an account to carry your settings, bookmarks, notes, highlights, and streak across devices."
  );
  return `
    <section class="account-card">
      <div class="account-card-head">
        <span class="setting-label">Account sync</span>
        <strong>${addingAccount ? "Add another account" : "Sign in or create account"}</strong>
      </div>
      <p>${escapeHtml(status)}</p>
      <form class="account-form" id="${suffix}accountForm">
        <input class="${showEmailCue ? "account-email-cue" : ""}" id="${emailId}" type="email" autocomplete="email" placeholder="${showEmailCue ? "Email required" : "Email"}" aria-label="Email" ${showEmailCue ? 'aria-invalid="true"' : ""} required />
        <input id="${suffix}accountPassword" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" required />
        <div class="account-actions">
          <button class="primary-btn compact-account-btn" type="submit" data-auth-action="signin" ${state.authBusy ? "disabled" : ""}>Sign in</button>
          <button class="ghost-btn compact-account-btn" type="submit" data-auth-action="signup" ${state.authBusy ? "disabled" : ""}>Create account</button>
        </div>
      </form>
      <div class="account-divider"><span>or</span></div>
      <button class="ghost-btn google-account-btn" id="${suffix}googleSignInButton" type="button" ${state.authBusy ? "disabled" : ""}>${icons.google}<span>Continue with Google</span></button>
      <p class="account-legal-notice">By creating an account, you agree to the <a href="./terms/">Terms of Service</a> and acknowledge the <a href="./privacy/">Privacy Policy</a>.</p>
      <button class="account-secondary-action" id="${suffix}forgotPasswordButton" type="button" ${state.authBusy ? "disabled" : ""}>Forgot your password?</button>
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
    if (state.accountSwitching) {
      return `
        ${streakCard()}
        <section class="account-card account-switcher-card">
          <div class="account-card-head">
            <span class="setting-label">Current account</span>
            <strong>${escapeHtml(email)}</strong>
          </div>
          <p>Your current account stays signed in while you choose another one.</p>
          <div class="account-actions">
            <button class="primary-btn compact-account-btn" id="${suffix}addAccountButton" type="button" ${state.authBusy ? "disabled" : ""}>${state.accountAddOpen ? "Hide sign in" : "Add another account"}</button>
            <button class="ghost-btn compact-account-btn" id="${suffix}cancelAccountSwitchButton" type="button" ${state.authBusy ? "disabled" : ""}>Back</button>
          </div>
        </section>
        ${rememberedAccountsCard(prefix, { excludeUserId: state.authUser.id })}
        ${state.accountAddOpen ? accountSignInCard(prefix, { addingAccount: true }) : ""}
      `;
    }
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
      ${socialProfileCard(prefix)}
      ${socialConnectionsSection(prefix)}
      <section class="account-card account-card-signed-in">
        <div class="account-card-head">
          <span class="setting-label">Account sync</span>
          <strong>${escapeHtml(email)}</strong>
        </div>
        <p>${escapeHtml(status)}</p>
        <div class="account-actions">
          <button class="ghost-btn compact-account-btn" id="${suffix}syncNowButton" type="button" ${state.authBusy ? "disabled" : ""}>Sync now</button>
          <button class="ghost-btn compact-account-btn" id="${suffix}switchAccountButton" type="button" ${state.authBusy ? "disabled" : ""}>${state.accountSwitching ? "Switching…" : "Switch account"}</button>
        </div>
        <button class="account-secondary-action" id="${suffix}signOutButton" type="button" ${state.authBusy ? "disabled" : ""}>Sign out on this device</button>
        ${passwordTools}
        <nav class="account-legal-links" aria-label="Legal information">
          <a href="./privacy/">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="./terms/">Terms of Service</a>
        </nav>
      </section>
    `;
  }

  return `
    ${streakCard()}
    ${rememberedAccountsCard(prefix)}
    ${accountSignInCard(prefix)}
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
  const passageButton = document.getElementById("mobileFocusPassageToggle");
  const focusToolsButton = document.getElementById("mobileFocusToolsToggle");
  const topButton = document.getElementById("readerTopButton");
  if (!settingsButton && !passageButton && !focusToolsButton && !topButton) return;
  settingsButton?.classList.remove("mobile-settings-idle");
  passageButton?.classList.remove("mobile-settings-idle");
  focusToolsButton?.classList.remove("mobile-settings-idle");
  topButton?.classList.remove("reader-top-idle");
  clearTimeout(mobileSettingsIdleTimer);
  if (state.settingsOpen || state.focusReferenceOpen || state.focusSearchResultsOpen || state.focusToolsOpen || state.focusWorkspacePanel || state.mode === "big" || !isCompactScreen()) return;
  mobileSettingsIdleTimer = setTimeout(() => {
    if (state.settingsOpen || state.focusReferenceOpen || state.focusSearchResultsOpen || state.focusToolsOpen || state.focusWorkspacePanel) return;
    document.getElementById("mobileFloatingSettings")?.classList.add("mobile-settings-idle");
    document.getElementById("mobileFocusPassageToggle")?.classList.add("mobile-settings-idle");
    document.getElementById("mobileFocusToolsToggle")?.classList.add("mobile-settings-idle");
    const currentTopButton = document.getElementById("readerTopButton");
    if (currentTopButton?.classList.contains("available")) {
      currentTopButton.classList.add("reader-top-idle");
    }
  }, 3200);
}

function resetFocusToolSurfaces() {
  state.focusToolsOpen = false;
  state.focusWorkspacePanel = "";
}

function bindMobileSettingsVisibility() {
  revealMobileSettingsButton();
  document.querySelector(".scripture")?.addEventListener("scroll", revealMobileSettingsButton, { passive: true });
}

function activeAutoScrollSpeed() {
  return autoScrollSpeeds.find((speed) => speed.code === state.autoScrollSpeed) || autoScrollSpeeds[1];
}

function readerAutoScrollSurface() {
  if (!["reader", "parallel"].includes(state.mode)) return null;
  return document.querySelector(".scripture");
}

function updateReaderAutoScrollControl() {
  const button = document.getElementById("readerAutoScrollButton");
  if (!button) return;
  const speed = activeAutoScrollSpeed();
  const action = state.autoScrollActive ? "Pause" : "Start";
  button.classList.toggle("active", state.autoScrollActive);
  button.setAttribute("aria-pressed", state.autoScrollActive ? "true" : "false");
  button.setAttribute("aria-label", `${action} auto-scroll at ${speed.name.toLowerCase()} speed`);
  button.dataset.tooltip = `${action} auto-scroll (A)`;
  button.innerHTML = state.autoScrollActive ? icons.pause : icons.play;
}

function pauseReaderAutoScroll({ announce = false, updateControl = true } = {}) {
  const wasActive = state.autoScrollActive;
  state.autoScrollActive = false;
  readerAutoScrollLastTime = 0;
  readerAutoScrollPosition = 0;
  if (readerAutoScrollFrame) cancelAnimationFrame(readerAutoScrollFrame);
  readerAutoScrollFrame = 0;
  if (updateControl) updateReaderAutoScrollControl();
  if (announce && wasActive) showToast("Auto-scroll paused");
  return wasActive;
}

function readerAutoScrollStep(timestamp) {
  if (!state.autoScrollActive) return;
  const scripture = readerAutoScrollSurface();
  if (!scripture || document.visibilityState === "hidden") {
    pauseReaderAutoScroll();
    return;
  }
  const maxScrollTop = Math.max(0, scripture.scrollHeight - scripture.clientHeight);
  if (maxScrollTop <= 1 || readerAutoScrollPosition >= maxScrollTop - 0.5) {
    pauseReaderAutoScroll();
    showToast("End of chapter");
    return;
  }
  if (!readerAutoScrollLastTime) readerAutoScrollLastTime = timestamp;
  const elapsedMs = Math.min(100, Math.max(0, timestamp - readerAutoScrollLastTime));
  readerAutoScrollLastTime = timestamp;
  readerAutoScrollPosition = Math.min(
    maxScrollTop,
    readerAutoScrollPosition + (activeAutoScrollSpeed().pixelsPerSecond * elapsedMs) / 1000,
  );
  scripture.scrollTop = readerAutoScrollPosition;
  if (readerAutoScrollPosition >= maxScrollTop - 0.5) {
    pauseReaderAutoScroll();
    showToast("End of chapter");
    return;
  }
  readerAutoScrollFrame = requestAnimationFrame(readerAutoScrollStep);
}

function startReaderAutoScroll({ announce = true } = {}) {
  if (!state.autoScrollEnabled) {
    if (announce) showToast("Enable auto-scroll in Settings first");
    return false;
  }
  const scripture = readerAutoScrollSurface();
  if (!scripture) return false;
  const maxScrollTop = Math.max(0, scripture.scrollHeight - scripture.clientHeight);
  if (maxScrollTop <= 1) {
    if (announce) showToast("This passage does not need auto-scroll");
    return false;
  }
  if (scripture.scrollTop >= maxScrollTop - 1) {
    if (announce) showToast("End of chapter");
    return false;
  }
  state.autoScrollActive = true;
  readerAutoScrollLastTime = 0;
  readerAutoScrollPosition = scripture.scrollTop;
  updateReaderAutoScrollControl();
  readerAutoScrollFrame = requestAnimationFrame(readerAutoScrollStep);
  if (announce) showToast(`Auto-scroll started · ${activeAutoScrollSpeed().name}`);
  return true;
}

function toggleReaderAutoScroll({ announce = true } = {}) {
  if (state.autoScrollActive) {
    pauseReaderAutoScroll({ announce });
    return false;
  }
  return startReaderAutoScroll({ announce });
}

function setReaderAutoScrollSpeed(speed) {
  const normalized = normalizedAutoScrollSpeed(speed);
  if (normalized === state.autoScrollSpeed) return;
  state.autoScrollSpeed = normalized;
  localStorage.setItem("lw_auto_scroll_speed", state.autoScrollSpeed);
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function setReaderAutoScrollEnabled(enabled) {
  const nextEnabled = Boolean(enabled);
  if (nextEnabled === state.autoScrollEnabled) return;
  state.autoScrollEnabled = nextEnabled;
  localStorage.setItem("lw_auto_scroll_enabled", String(state.autoScrollEnabled));
  scheduleCloudSync();
  if (!state.autoScrollEnabled) pauseReaderAutoScroll({ updateControl: false });
  renderPreservingReaderScroll();
}

function setEdgeChapterNavigationEnabled(enabled) {
  const nextEnabled = Boolean(enabled);
  if (nextEnabled === state.edgeChapterNavigationEnabled) return;
  state.edgeChapterNavigationEnabled = nextEnabled;
  localStorage.setItem("lw_edge_chapter_navigation_enabled", String(state.edgeChapterNavigationEnabled));
  scheduleCloudSync();
  if (!state.edgeChapterNavigationEnabled) {
    cancelReaderChapterPull();
    cancelReaderChapterWheelPull({ settle: false });
  }
  renderPreservingReaderScroll();
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

function scrollReaderToTop() {
  if (!["reader", "parallel"].includes(state.mode)) return false;
  const scripture = document.querySelector(".scripture");
  if (!scripture) return false;
  pauseReaderAutoScroll();
  noteReaderScrollIntent();
  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  if (scripture.scrollHeight > scripture.clientHeight + 1) {
    scripture.scrollTo({ top: 0, behavior });
  } else {
    window.scrollTo({ top: 0, behavior });
  }
  return true;
}

function handleTopbarScrollTap(event) {
  const interactiveTarget = event.target.closest?.([
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "label",
    "[role='button']",
    "[role='dialog']",
    "[contenteditable='true']",
    ".primary-version-menu",
    ".account-popover",
  ].join(", "));
  if (interactiveTarget) return;
  scrollReaderToTop();
}

function bindReaderTopButton() {
  const scripture = document.querySelector(".scripture");
  const button = document.getElementById("readerTopButton");
  if (!scripture || !button) return;
  updateReaderTopButton();
  refreshLastReaderScrollAnchor();
  scripture.addEventListener("scroll", updateReaderTopButton, { passive: true });
  scripture.addEventListener("scroll", handleReaderScrollPositionChange, { passive: true });
  scripture.addEventListener("touchstart", noteReaderScrollIntent, { passive: true });
  scripture.addEventListener("pointerdown", noteReaderScrollIntent, { passive: true });
  scripture.addEventListener("wheel", noteReaderScrollIntent, { passive: true });
  button.addEventListener("click", () => {
    button.classList.remove("reader-top-idle");
    scrollReaderToTop();
  });
}

function bindReaderReturnButton() {
  const button = document.getElementById("readerReturnButton");
  if (!button) return;
  applyReaderReturnButtonLabel(button);
  button.addEventListener("click", () => {
    restoreReaderReturnTarget();
  });
}

function bindReaderSelectionToolsButton() {
  const button = document.getElementById("readerSelectionToolsButton");
  if (!button) return;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.returnSelectionToolsOpen = true;
    renderPreservingReaderScroll();
  });
}

function preserveReaderScrollAfterViewportChange() {
  if (
    document.visibilityState === "hidden"
    || !["reader", "parallel"].includes(state.mode)
  ) return;
  const previousAnchor = preferredViewportReaderScrollAnchor();
  const scrollState = captureReaderScroll({ preferLastReaderAnchor: true });
  if (previousAnchor) {
    scrollState.readerAnchor = previousAnchor;
  } else if (scrollState.readerAnchor) {
    lastReaderScrollAnchor = scrollState.readerAnchor;
  }
  clearTimeout(readerViewportRestoreTimer);

  const restore = () => {
    restoreReaderScroll(scrollState);
    updateReaderTopButton();
  };
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  readerViewportRestoreTimer = setTimeout(restore, 180);
}

function rememberReaderScrollBeforeAppSwitch() {
  if (!["reader", "parallel"].includes(state.mode)) return;
  const scrollState = flushReaderPositionPersistence();
  const previousAnchor = preferredViewportReaderScrollAnchor();
  if (previousAnchor) scrollState.readerAnchor = previousAnchor;
  persistReaderPosition(scrollState);
  readerAppVisibilityScrollState = scrollState;
  clearTimeout(readerViewportRestoreTimer);
  clearTimeout(readerAppVisibilityRestoreTimer);
  readerAppResumeRestoreDeadline = 0;
}

function restoreReaderScrollAfterAppSwitch(options = {}) {
  const scrollState = readerAppVisibilityScrollState
    || (options.allowStored ? savedReaderPosition() : null);
  if (
    !scrollState
    || scrollState.mode !== state.mode
    || scrollState.reference !== state.reference
  ) {
    readerAppVisibilityScrollState = null;
    return;
  }
  readerAppVisibilityScrollState = scrollState;
  clearTimeout(readerViewportRestoreTimer);
  clearTimeout(readerAppVisibilityRestoreTimer);
  readerAppResumeRestoreDeadline = Date.now() + readerAppResumeRestoreWindowMs;

  const restore = () => {
    if (document.visibilityState === "hidden") return;
    restoreReaderScroll(scrollState);
    updateReaderTopButton();
  };
  const restoreUntilSettled = () => {
    restore();
    if (Date.now() < readerAppResumeRestoreDeadline) {
      readerAppVisibilityRestoreTimer = setTimeout(restoreUntilSettled, 180);
      return;
    }
    if (readerAppVisibilityScrollState === scrollState) {
      readerAppVisibilityScrollState = null;
    }
  };
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  readerAppVisibilityRestoreTimer = setTimeout(restoreUntilSettled, 180);
}

function cancelReaderAppResumeRestore() {
  readerAppResumeRestoreDeadline = 0;
  clearTimeout(readerAppVisibilityRestoreTimer);
  readerAppVisibilityScrollState = null;
}

function noteReaderScrollIntent() {
  readerUserScrollIntentUntil = Date.now() + 2400;
  cancelReaderAppResumeRestore();
}

function protectedReaderPosition() {
  const scrollState = readerAppVisibilityScrollState || savedReaderPosition();
  if (
    !scrollState
    || scrollState.mode !== state.mode
    || scrollState.reference !== state.reference
  ) return null;
  return scrollState;
}

function handleReaderScrollPositionChange() {
  const scripture = document.querySelector(".scripture");
  const protectedPosition = scripture?.scrollTop <= 8 ? protectedReaderPosition() : null;
  const unexpectedTopReset = Boolean(
    scripture
    && scripture.scrollTop <= 8
    && (protectedPosition?.scriptureTop || 0) > 8
    && Date.now() > readerUserScrollIntentUntil
  );
  if (unexpectedTopReset) {
    readerAppVisibilityScrollState = protectedPosition;
    restoreReaderScrollAfterAppSwitch();
    return;
  }
  refreshLastReaderScrollAnchor();
  scheduleReaderPositionPersistence();
}

function readerLifecycleHeartbeatTick() {
  const now = Date.now();
  const elapsed = now - readerLifecycleHeartbeatAt;
  readerLifecycleHeartbeatAt = now;
  if (
    isStandaloneWebApp()
    && elapsed > readerLifecycleResumeGapMs
    && !dataLoading
    && !dataError
    && ["reader", "parallel"].includes(state.mode)
  ) {
    restoreReaderScrollAfterAppSwitch({ allowStored: true });
  }
}

function restoreSavedReaderPositionAfterStartup() {
  if (!isStandaloneWebApp()) return;
  const navigation = window.performance?.getEntriesByType?.("navigation")?.[0];
  if (!document.wasDiscarded && navigation?.type !== "reload") return;
  restoreReaderScrollAfterAppSwitch({ allowStored: true });
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
  const currentSide = effectiveSideToolbarPosition();
  const nextSide = currentSide === "right" ? "left" : "right";
  const autoPositioned = isSideToolbarAutoPositioned();
  const sideToggleLabel = autoPositioned ? "Toolbar avoiding Dynamic Island" : `Move toolbar ${nextSide}`;
  const sideToggleIcon = nextSide === "left" ? icons.chevronLeft : icons.chevron;
  const sideToggleEnabled = isSideToolbarToggleEnabled() && !autoPositioned;
  const sideToggleDisabledAttrs = sideToggleEnabled ? "" : ' disabled aria-disabled="true"';
  return `<aside class="rail">${items.map(([label, icon]) => {
    const active = state.activeRail === label || (label === "Annotations" && state.activeRail === "Notes");
    return `<button class="${active ? "active" : ""}" data-rail="${label}" aria-label="${label}" data-tooltip="${label}">${icon}</button>`;
  }).join("")}
    <button class="rail-position-toggle rail-position-toggle-${nextSide}" type="button" data-side-toolbar-position="${nextSide}" aria-label="${sideToggleLabel}" data-tooltip="${sideToggleLabel}"${sideToggleDisabledAttrs}>${sideToggleIcon}</button>
  </aside>`;
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
    <div class="library-drawer ${pendingLibraryEnter ? "drawer-enter" : ""}">
      <aside class="library">
        <div class="panel-minihead">
          <span>${title}</span>
          <button class="icon-btn" id="closeLibrary" aria-label="${escapeHtml(closeLabel)}" data-tooltip="${escapeHtml(closeLabel)}">×</button>
        </div>
        ${libraryContent()}
      </aside>
    </div>
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
      <span>Verse of the Day comes from VerseoftheDay.com / Heartlight via RSS, with the local curated schedule as a fallback.</span>
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
          ? refs.map((ref) => `<button class="ref-item" data-goto="${escapeHtml(ref.goto)}" data-link-navigation="true"><div class="ref-title">${escapeHtml(ref.label)}</div><div class="ref-copy">${escapeHtml(ref.preview)}</div></button>`).join("")
          : `<div class="empty-state">No cross references are bundled for ${escapeHtml(referenceLabel())}.</div>`}
      </div>
      <div class="source-note">
        Cross references from <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noopener">OpenBible.info</a>, CC-BY.
      </div>
    </section>
  `;
}

function searchPanel() {
  const searchInputValue = state.searchQuery || state.searchResultsQuery;
  const inlineSearchActive = Boolean(activeInlineSearchQuery());
  const canClearResults = inlineSearchActive || state.searchResultsQuery || state.searchResults.length;
  const scope = normalizedSearchScope(state.searchScope);
  const scopeLabel = searchScopeLabel(scope, state.reference);
  return `
    <section class="study-section panel-section" id="searchSection">
      <form class="study-search ${canClearResults ? "has-clear" : ""} ${inlineSearchActive ? "has-inline-clear" : ""}" id="studySearchForm">
        <input id="studySearchInput" value="${escapeHtml(searchInputValue)}" placeholder="Search words, phrases, or questions" aria-label="Search Bible words, phrases, or questions" />
        <div class="search-submit-control">
          <button class="ghost-btn search-submit-button" id="studySearchButton" type="submit" aria-label="Search ${escapeHtml(scopeLabel)}">
            <span>Search</span>
            <span class="search-button-scope" id="studySearchButtonScope" data-search-scope-short>${escapeHtml(searchScopeShortLabel(scope))}</span>
          </button>
          <button class="search-scope-menu" id="studySearchScope" type="button" data-search-scope-trigger data-search-scope-control data-search-scope="${scope}" aria-label="Choose search scope, current ${escapeHtml(scopeLabel)}" aria-haspopup="listbox" aria-expanded="false" title="Search scope: ${escapeHtml(scopeLabel)}">
            <span class="sr-only">Search scope</span>
            <span class="search-scope-chevron" aria-hidden="true">${icons.chevron}</span>
          </button>
        </div>
        ${canClearResults ? inlineSearchActive
          ? `<button class="icon-btn search-clear inline-search-clear-control" id="clearSearchResults" type="button" data-clear-search aria-label="${escapeHtml(inlineSearchClearAriaLabel())}" data-tooltip="${escapeHtml(inlineSearchClearTitle())}"><span data-inline-search-progress aria-hidden="true">${escapeHtml(inlineSearchProgressText())}</span>${icons.clear}</button>`
          : `<button class="icon-btn search-clear" id="clearSearchResults" type="button" data-clear-search aria-label="Clear search results" data-tooltip="Clear results">${icons.clear}</button>`
        : ""}
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

function noteComposerMarkup() {
  const ref = state.noteComposerRef;
  if (!ref) return "";
  const note = String(state.notes[ref] || "");
  const preview = truncatePreview(passagePreviewForReference(ref));
  return `
    <section class="note-composer" id="noteComposer" role="dialog" aria-modal="false" aria-labelledby="noteComposerTitle">
      <header class="note-composer-head">
        <div>
          <span class="note-composer-eyebrow">Passage note</span>
          <h2 id="noteComposerTitle">${escapeHtml(ref)}</h2>
        </div>
        <button class="icon-btn note-composer-close" id="closeNoteComposer" type="button" aria-label="Close note">${icons.clear}</button>
      </header>
      ${preview ? `<p class="note-composer-passage">${escapeHtml(preview)}</p>` : ""}
      <form class="note-composer-form" id="noteComposerForm">
        <label class="sr-only" for="noteComposerTextarea">Note for ${escapeHtml(ref)}</label>
        <textarea id="noteComposerTextarea" placeholder="Write a note about this passage…">${escapeHtml(note)}</textarea>
        <div class="note-composer-actions">
          ${note.trim() ? `<button class="text-btn danger-text note-composer-delete" id="deleteNoteComposer" type="button">Delete</button>` : `<span></span>`}
          <button class="text-btn note-composer-cancel" id="cancelNoteComposer" type="button">Cancel</button>
          <button class="ghost-btn note-composer-save" type="submit">${note.trim() ? "Update note" : "Save note"}</button>
        </div>
      </form>
    </section>
  `;
}

function noteComposerAnchor(element) {
  if (!(element instanceof Element)) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
}

function openNoteComposer(ref = activePassageLabel(), anchor = null) {
  const parsed = parsePassageReference(ref);
  if (!parsed) return showToast("Choose a verse or passage before adding a note");
  state.noteComposerRef = String(ref).trim();
  state.noteComposerAnchor = noteComposerAnchor(anchor);
  pendingNoteComposerFocus = true;
  renderPreservingReaderScroll();
}

function closeNoteComposer() {
  state.noteComposerRef = "";
  state.noteComposerAnchor = null;
  pendingNoteComposerFocus = false;
  renderPreservingReaderScroll();
}

function positionNoteComposer() {
  const composer = document.getElementById("noteComposer");
  if (!composer || isCompactScreen()) return;
  const margin = 14;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const anchor = state.noteComposerAnchor || {
    top: viewportHeight / 2,
    right: viewportWidth / 2,
    bottom: viewportHeight / 2,
    left: viewportWidth / 2,
  };
  const width = composer.offsetWidth;
  const height = composer.offsetHeight;
  const left = Math.min(Math.max(margin, anchor.left), Math.max(margin, viewportWidth - width - margin));
  const below = anchor.bottom + 10;
  const above = anchor.top - height - 10;
  const top = below + height <= viewportHeight - margin
    ? below
    : Math.max(margin, above);
  composer.style.left = `${Math.round(left)}px`;
  composer.style.top = `${Math.round(top)}px`;
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

function reader(chapterChange = null) {
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
            <div class="compact-reference">${escapeHtml(activePassageLabel())}${state.isVerseOfDayActive && state.verseOfDayItem ? "" : ` · ${activeVersions().map(translationDisplayCode).join(" / ")}`}</div>
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
              <label class="verse-nav-select verse-nav-chapter-select" data-tooltip="Choose chapter">
                <span class="sr-only">Chapter</span>
                <select class="full-control" id="chapterSelectInline">${chapterKeys.map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}</select>
                <span class="verse-nav-select-chevron" aria-hidden="true">${icons.chevron}</span>
              </label>
              <span class="verse-nav-divider" aria-hidden="true"></span>
              <label class="verse-nav-select verse-nav-verse-select" data-tooltip="Choose verse">
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
              <button class="icon-btn" id="bookmarkBtn" aria-label="Add bookmark" data-tooltip="Add bookmark">${icons.bookmarkAdd}</button>
              <button class="icon-btn" id="noteBtn" aria-label="Add note" data-tooltip="Add note">${icons.noteAdd}</button>
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
      <article class="scripture ${state.mode === "parallel" ? "parallel-mode" : ""} ${readerChapterTransitionClass(chapterChange)}">
        ${state.mode === "parallel" ? parallelView() : readerView()}
      </article>
      ${readerChapterPullIndicators()}
      ${chapterChangeIndicator(chapterChange)}
      ${state.mode === "reader" || state.mode === "parallel" ? `
        ${readerAutoScrollButton()}
        ${readerSelectionToolsButton()}
        ${readerReturnButton()}
        <button class="reader-top-button" id="readerTopButton" type="button" aria-label="Back to top" data-tooltip="Back to top">
          ${icons.arrowUp}
        </button>
      ` : ""}
    </section>
  `;
}

function adjacentChapterReference(direction) {
  const keys = Object.keys(bibleData);
  const index = keys.indexOf(state.reference);
  if (index < 0) return "";
  return keys[index + (direction > 0 ? 1 : -1)] || "";
}

function readerChapterTransitionClass(change) {
  if (!change || !canUseReaderChapterSwipe()) return "";
  return change.direction > 0
    ? "chapter-transition-enter-forward"
    : "chapter-transition-enter-back";
}

function readerChapterPullIndicator(direction, reference) {
  if (!reference) return "";
  const movingForward = direction > 0;
  const directionClass = movingForward ? "next" : "previous";
  const action = movingForward ? "Next chapter" : "Previous chapter";
  return `
    <div class="reader-chapter-pull-indicator reader-chapter-pull-${directionClass}" id="readerChapterPull${movingForward ? "Next" : "Previous"}" aria-hidden="true">
      <span class="reader-chapter-pull-meter">
        <span class="reader-chapter-pull-icon">${icons.chevron}</span>
      </span>
      <span class="reader-chapter-pull-copy">
        <span class="reader-chapter-pull-action" data-default-label="${action}">${action}</span>
        <strong>${escapeHtml(reference)}</strong>
      </span>
    </div>
  `;
}

function readerChapterPullIndicators() {
  if (!state.edgeChapterNavigationEnabled || !canUseReaderChapterSwipe()) return "";
  return `
    ${readerChapterPullIndicator(-1, adjacentChapterReference(-1))}
    ${readerChapterPullIndicator(1, adjacentChapterReference(1))}
    <span class="sr-only" id="readerChapterPullStatus" role="status" aria-live="polite" aria-atomic="true"></span>
  `;
}

function readerAutoScrollButton() {
  if (!state.autoScrollEnabled) return "";
  const speed = autoScrollSpeeds.find((option) => option.code === state.autoScrollSpeed) || autoScrollSpeeds[1];
  const active = state.autoScrollActive;
  const action = active ? "Pause" : "Start";
  return `
    <button
      class="reader-auto-scroll-button ${active ? "active" : ""}"
      id="readerAutoScrollButton"
      type="button"
      aria-label="${action} auto-scroll at ${speed.name.toLowerCase()} speed"
      aria-pressed="${active ? "true" : "false"}"
      data-tooltip="${action} auto-scroll (A)"
    >
      ${active ? icons.pause : icons.play}
    </button>
  `;
}

function readerSelectionToolsButton() {
  if (!returnSelectionToolsCollapsed()) return "";
  const count = state.selectedVerses.length;
  return `
    <button class="reader-selection-tools-button" id="readerSelectionToolsButton" type="button" aria-label="Show selection tools for ${count} selected ${count === 1 ? "verse" : "verses"}" data-tooltip="Selection tools">
      ${icons.highlighter}
    </button>
  `;
}

function readerReturnButton() {
  const target = currentReaderReturnTarget();
  if (!target) return "";
  const tooltip = readerReturnTooltip(target);
  return `
    <button class="reader-return-button" id="readerReturnButton" type="button" aria-label="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}">
      ${icons.arrowLeft}
    </button>
  `;
}

function readerReturnLabel(target = currentReaderReturnTarget()) {
  const label = target?.label || (target ? `${target.reference}:${target.verse}` : "previous passage");
  return compactPassageLabel(label);
}

function readerReturnTooltip(target = currentReaderReturnTarget()) {
  return `Back to ${readerReturnLabel(target)}`;
}

function applyReaderReturnButtonLabel(button, target = currentReaderReturnTarget()) {
  if (!button || !target) return;
  const tooltip = readerReturnTooltip(target);
  button.setAttribute("aria-label", tooltip);
  button.dataset.tooltip = tooltip;
}

function presentationReturnButton() {
  const target = currentReaderReturnTarget();
  if (!target) return "";
  const tooltip = readerReturnTooltip(target);
  return `<button class="ghost-btn presentation-nav-button presentation-return-button" id="readerReturnButton" aria-label="${escapeHtml(tooltip)}" data-tooltip="${escapeHtml(tooltip)}">${icons.arrowLeft}</button>`;
}

function compactPassageLabel(label) {
  const parsed = parsePassageReference(label);
  if (!parsed) return label;
  return formatReferenceLabel(compactChapterLabel(parsed.key), parsed.verses);
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
      pushCurrentReturnTargetForNavigation(value, bibleData[value]?.verses?.[0]?.n);
      state.reference = value;
      state.verse = currentChapter().verses[0].n;
      state.selectedVerses = [];
    } else {
      const nextVerse = Number(value);
      pushCurrentReturnTargetForNavigation(state.reference, nextVerse);
      state.verse = nextVerse;
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
  const redLetterRanges = wordsOfJesusRanges(verse, version);
  const searchRanges = inlineSearchRangesForText(
    text,
    activeInlineSearchQuery(),
    state.inlineSearchPhraseOnly,
  );
  if (!state.strongNumbers) return renderScriptureText(text, redLetterRanges, 0, version, searchRanges);
  return renderTextWithStrongNumbers(
    text,
    getStrongEntries(verse, version),
    redLetterRanges,
    version,
    searchRanges,
  );
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

function activeInlineSearchQuery() {
  if (!state.inlineSearchQuery) return "";
  return normalizedSearchChapter(state.inlineSearchChapter) === normalizedSearchChapter(state.reference)
    ? state.inlineSearchQuery
    : "";
}

function inlineSearchRangesForText(text, query, phraseOnly = false) {
  const value = String(text || "");
  const criteria = parseSearchQuery(query);
  if (!value || (!criteria.tokens.length && !criteria.exactPhrase)) return [];

  const phraseWords = String(criteria.exactPhrase || criteria.phrase || "").split(" ").filter(Boolean);
  if (phraseWords.length) {
    const phrasePattern = phraseWords.map(escapeRegExp).join("[^A-Za-z0-9]+");
    const phraseRegex = new RegExp(`\\b${phrasePattern}\\b`, "gi");
    const phraseRanges = [];
    let phraseMatch;
    while ((phraseMatch = phraseRegex.exec(value))) {
      phraseRanges.push({ start: phraseMatch.index, end: phraseMatch.index + phraseMatch[0].length });
      if (!phraseMatch[0].length) phraseRegex.lastIndex += 1;
    }
    if (phraseRanges.length) return phraseRanges;
  }

  if (phraseOnly) return [];

  const terms = uniqueList([...(criteria.highlightTerms || []), ...criteria.tokens])
    .flatMap((term) => normalizeSearchText(term).split(" "))
    .filter(Boolean);
  if (!terms.length) return [];
  const ranges = [];
  const wordPattern = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g;
  let wordMatch;
  while ((wordMatch = wordPattern.exec(value))) {
    const normalizedWord = normalizeSearchText(wordMatch[0]);
    if (!terms.some((term) => wordsCloseEnough(term, normalizedWord))) continue;
    ranges.push({ start: wordMatch.index, end: wordMatch.index + wordMatch[0].length });
  }
  return ranges;
}

function getStrongEntries(verse, version) {
  const entries = Array.isArray(verse.strong?.[version])
    ? verse.strong[version]
    : Array.isArray(verse.strong)
      ? verse.strong
      : sampleStrongRefs[`${state.reference}:${verse.n}`] || [];
  return entries.map(normalizeStrongEntry).filter(({ word, codes }) => word && codes.length);
}

function normalizeStrongEntry(entry) {
  const word = Array.isArray(entry) ? entry[0] : entry?.word;
  const codes = Array.isArray(entry)
    ? entry[1]
    : entry?.codes || entry?.code;
  return {
    word: String(word || ""),
    codes: normalizeStrongCodes(codes),
  };
}

function normalizeStrongCodes(value) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values
    .map(normalizeStrongCode)
    .filter((code) => /^[HG]\d+$/.test(code)))];
}

function renderTextWithStrongNumbers(text, entries, redLetterRanges = [], version = "", searchRanges = []) {
  if (!entries.length) return renderScriptureText(text, redLetterRanges, 0, version, searchRanges);

  let output = "";
  let cursor = 0;
  entries.forEach(({ word, codes }) => {
    if (!word || !codes.length) return;
    const availableCodes = codes.filter(hasStrongEntry);
    if (!availableCodes.length) return;
    const index = text.indexOf(word, cursor);
    if (index === -1) return;
    const primaryCode = availableCodes[0];
    const codesLabel = availableCodes.join(", ");
    output += renderScriptureText(text.slice(cursor, index), redLetterRanges, cursor, version, searchRanges);
    output += `<button class="strong-word" data-strong="${escapeHtml(primaryCode)}" data-strong-codes="${escapeHtml(availableCodes.join(","))}" data-strong-word="${escapeHtml(word)}" aria-label="Open Strong's ${escapeHtml(codesLabel)} for ${escapeHtml(word)}">${renderScriptureText(word, redLetterRanges, index, version, searchRanges)}</button>`;
    cursor = index + word.length;
  });
  output += renderScriptureText(text.slice(cursor), redLetterRanges, cursor, version, searchRanges);
  return output;
}

function setStrongNumbers(enabled, rerender = false) {
  state.strongNumbers = enabled;
  localStorage.setItem("lw_strong_numbers", enabled ? "true" : "false");
  const lexiconLoad = enabled ? loadStrongLexicon() : null;
  scheduleCloudSync();
  if (rerender) renderPreservingReaderScroll();
  return lexiconLoad;
}

function setSideToolbarPosition(position) {
  const nextPosition = position === "right" ? "right" : "left";
  if (state.sideToolbarPosition === nextPosition) return;
  state.sideToolbarPosition = nextPosition;
  localStorage.setItem("lw_side_toolbar_position", nextPosition);
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function handleSideToolbarPositionClick(event) {
  const button = event.target.closest?.("button[data-side-toolbar-position]");
  if (!button) return;
  if (button.disabled) return;
  event.preventDefault();
  setSideToolbarPosition(button.dataset.sideToolbarPosition);
}

function setSectionHeadings(enabled) {
  state.sectionHeadings = Boolean(enabled);
  localStorage.setItem("lw_section_headings", state.sectionHeadings ? "true" : "false");
  scheduleCloudSync();
  renderPreservingReaderScroll();
}

function wordsOfJesusRanges(verse, version) {
  const ranges = verse?.wordsOfJesus?.[version];
  return Array.isArray(ranges) ? ranges : [];
}

function renderScriptureText(text, ranges = [], baseOffset = 0, version = "", searchRanges = []) {
  if (version === "AMP") return renderAmpInlineReferences(text, ranges, baseOffset, searchRanges);
  return renderRedLetterText(text, ranges, baseOffset, searchRanges);
}

function renderAmpInlineReferences(text, ranges = [], baseOffset = 0, searchRanges = []) {
  const value = String(text || "");
  const referencePattern = /\[([^\[\]]{1,160})\]/g;
  let cursor = 0;
  let output = "";
  let match;

  while ((match = referencePattern.exec(value))) {
    const referenceMarkup = ampInlineReferenceMarkup(match[1]);
    if (!referenceMarkup) continue;
    output += renderRedLetterText(value.slice(cursor, match.index), ranges, baseOffset + cursor, searchRanges);
    output += `<span class="scripture-inline-reference" aria-label="Scripture references">[${referenceMarkup}]</span>`;
    cursor = match.index + match[0].length;
  }

  output += renderRedLetterText(value.slice(cursor), ranges, baseOffset + cursor, searchRanges);
  return output;
}

function ampInlineReferenceMarkup(value) {
  const tokens = String(value || "")
    .split(";")
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) return "";

  let previousBook = "";
  const parts = tokens.map((token) => {
    const part = ampInlineReferencePart(token, previousBook);
    if (!part) return null;
    previousBook = part.book;
    return part;
  });
  if (!parts.length || parts.some((part) => !part)) return "";

  return parts
    .map((part) => `<button class="scripture-inline-reference-link" type="button" data-scripture-reference="${escapeHtml(part.reference)}" aria-label="Open ${escapeHtml(part.reference)}">${escapeHtml(part.display)}</button>`)
    .join('<span class="scripture-inline-reference-separator">; </span>');
}

function ampInlineReferencePart(value, previousBook = "") {
  const display = String(value || "").trim().replace(/[–—]/g, "-").replace(/\s+/g, " ");
  if (!display) return null;
  const reference = /^\d{1,3}(?::[0-9,\-\s]+)?$/.test(display) && previousBook
    ? `${previousBook} ${display}`
    : display;
  const parsed = parsePassageReference(reference);
  return parsed
    ? { book: bookNameFromChapterKey(parsed.key), display, reference: normalizeHeadingReference(reference) }
    : null;
}

function renderRedLetterText(text, ranges = [], baseOffset = 0, searchRanges = []) {
  const value = String(text || "");
  if (!value) return "";
  const chunkStart = baseOffset;
  const chunkEnd = baseOffset + value.length;
  const redRanges = state.redLetters ? ranges : [];
  const boundaries = new Set([0, value.length]);
  const addBoundaries = (items) => items.forEach((range) => {
    const start = Math.max(chunkStart, Number(range?.start));
    const end = Math.min(chunkEnd, Number(range?.end));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
    boundaries.add(start - chunkStart);
    boundaries.add(end - chunkStart);
  });
  addBoundaries(redRanges);
  addBoundaries(searchRanges);
  const points = [...boundaries].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    if (end <= start) return "";
    const absoluteStart = chunkStart + start;
    const isRedLetter = redRanges.some((range) => absoluteStart >= Number(range?.start) && absoluteStart < Number(range?.end));
    const isSearchHit = searchRanges.some((range) => absoluteStart >= Number(range?.start) && absoluteStart < Number(range?.end));
    let markup = escapeHtml(value.slice(start, end));
    if (isSearchHit) markup = `<mark class="inline-search-hit">${markup}</mark>`;
    if (isRedLetter) markup = `<span class="words-of-jesus">${markup}</span>`;
    return markup;
  }).join("");
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

const pushDeviceTokenStorageKey = "lw_push_device_token";
let lastPushVisitSentAt = 0;

function validPushTime(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
}

function pushApiSupported() {
  return Boolean(
    window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,
  );
}

function pushPreferences() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    morningTime: state.pushMorningTime,
    eveningEnabled: state.pushEveningEnabled,
    eveningTime: state.pushEveningTime,
    friendRequestNotifications: state.pushFriendRequestNotifications,
    gameChallengeNotifications: state.pushGameChallengeNotifications,
    challengeAcceptedNotifications: state.pushChallengeAcceptedNotifications,
  };
}

async function pushFunctionRequest(method = "POST", body = null) {
  const config = window.BigScreenBibleSupabase || {};
  const url = supabaseFunctionUrl("push-subscriptions");
  if (!url || !config.anonKey) throw new Error("Notification service is not configured");
  let accessToken = "";
  const client = createSupabaseClient();
  if (client) {
    const { data } = await client.auth.getSession();
    accessToken = data?.session?.access_token || "";
  }
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      apikey: config.anonKey,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Notification service request failed");
  return payload;
}

async function requestSocialPushDelivery() {
  const config = window.BigScreenBibleSupabase || {};
  const url = supabaseFunctionUrl("send-push-notifications");
  const client = createSupabaseClient();
  if (!url || !config.anonKey || !client) return;
  const { data } = await client.auth.getSession();
  const accessToken = data?.session?.access_token || "";
  if (!accessToken) return;
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "deliver-social" }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Social notification delivery could not start");
  }
}

function queueSocialPushDelivery() {
  requestSocialPushDelivery().catch((error) => {
    console.warn("Immediate social notification delivery failed; scheduled retry remains active", error);
  });
}

function applicationServerKey(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
}

async function pushServiceWorkerRegistration() {
  await navigator.serviceWorker.register("./push-sw.js", { scope: "./" });
  return navigator.serviceWorker.ready;
}

function clearLocalPushSubscription() {
  state.pushEnabled = false;
  localStorage.setItem("lw_push_enabled", "false");
  localStorage.removeItem(pushDeviceTokenStorageKey);
}

function pushPromptEligible() {
  return Boolean(
    state.authUser
    && state.pushInitialized
    && state.pushSupported
    && !state.pushEnabled
    && !state.pushPermissionDenied
    && Notification.permission !== "denied"
    && localStorage.getItem(pushPromptDismissedStorageKey) !== "true"
    && !dataLoading
    && !dataError
    && !state.tutorialIntroVisible
    && !state.tutorialActive
    && !state.shortcutsOpen
    && !state.aboutMenuOpen
    && !state.passwordRecoveryMode
    && !state.passwordChangeOpen
  );
}

function maybeOfferPushNotifications() {
  if (state.pushPromptVisible || !pushPromptEligible()) return;
  state.pushPromptVisible = true;
  state.accountOpen = false;
  state.settingsOpen = false;
  renderPreservingReaderScroll();
}

function acceptPushPermissionPrompt() {
  state.pushPromptVisible = false;
  localStorage.removeItem(pushPromptDismissedStorageKey);
  enablePushNotifications();
}

function dismissPushPermissionPrompt() {
  localStorage.setItem(pushPromptDismissedStorageKey, "true");
  animateBeforeRemoval(".push-consent-overlay", () => {
    state.pushPromptVisible = false;
    renderPreservingReaderScroll();
  }, { duration: 220 });
}

async function initializePushNotifications() {
  state.pushSupported = pushApiSupported();
  state.pushInitialized = true;
  if (!validPushTime(state.pushMorningTime)) state.pushMorningTime = "07:00";
  if (!validPushTime(state.pushEveningTime)) state.pushEveningTime = "18:00";
  if (!state.pushSupported) {
    clearLocalPushSubscription();
    state.pushStatus = "This browser does not support site notifications. On iPhone or iPad, add the site to the Home Screen first.";
    return;
  }
  if (Notification.permission === "denied") {
    state.pushPermissionDenied = true;
    clearLocalPushSubscription();
    state.pushStatus = "Notifications are blocked in this browser’s site settings.";
    return;
  }

  const deviceToken = localStorage.getItem(pushDeviceTokenStorageKey) || "";
  if (!state.pushEnabled || !deviceToken || Notification.permission !== "granted") {
    if (state.pushEnabled && (!deviceToken || Notification.permission !== "granted")) clearLocalPushSubscription();
    state.pushStatus = "Enable notifications for daily reminders and signed-in friend activity.";
    return;
  }

  try {
    const registration = await pushServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      clearLocalPushSubscription();
      state.pushStatus = "This device’s notification subscription expired. Enable reminders again to reconnect it.";
      return;
    }
    state.pushEnabled = true;
    state.pushStatus = "Notifications are enabled on this device.";
    notePushVisit(true);
  } catch (error) {
    state.pushStatus = error?.message || "Notifications could not be initialized.";
  }
}

async function enablePushNotifications() {
  if (!pushApiSupported() || state.pushBusy) return;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    state.pushPermissionDenied = permission === "denied";
    clearLocalPushSubscription();
    state.pushStatus = permission === "denied"
      ? "Notifications are blocked in this browser’s site settings."
      : "Notification permission was not granted.";
    return renderPreservingReaderScroll();
  }

  state.pushBusy = true;
  state.pushStatus = "Connecting this device…";
  renderPreservingReaderScroll();
  try {
    const config = await pushFunctionRequest("GET");
    if (!config.enabled || !config.publicKey) throw new Error("Push notifications are not configured on the server yet");
    const registration = await pushServiceWorkerRegistration();
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(config.publicKey),
    });
    const result = await pushFunctionRequest("POST", {
      action: "subscribe",
      subscription: subscription.toJSON(),
      preferences: pushPreferences(),
    });
    if (!result.deviceToken) throw new Error("The notification service did not return a device token");
    localStorage.setItem(pushDeviceTokenStorageKey, result.deviceToken);
    localStorage.setItem("lw_push_enabled", "true");
    state.pushEnabled = true;
    state.pushPermissionDenied = false;
    state.pushStatus = "Notifications are enabled on this device.";
    localStorage.removeItem(pushPromptDismissedStorageKey);
    showToast("Notifications enabled");
  } catch (error) {
    clearLocalPushSubscription();
    state.pushStatus = error?.message || "Notifications could not be enabled.";
    showToast("Could not enable notifications");
  } finally {
    state.pushBusy = false;
    renderPreservingReaderScroll();
  }
}

async function disablePushNotifications() {
  if (state.pushBusy) return;
  state.pushBusy = true;
  localStorage.setItem(pushPromptDismissedStorageKey, "true");
  state.pushStatus = "Turning off reminders…";
  renderPreservingReaderScroll();
  const deviceToken = localStorage.getItem(pushDeviceTokenStorageKey) || "";
  let serverUnsubscribeFailed = false;
  try {
    if (deviceToken) {
      await pushFunctionRequest("POST", { action: "unsubscribe", deviceToken });
    }
  } catch (error) {
    serverUnsubscribeFailed = true;
    console.warn("Push server unsubscribe failed", error);
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration("./");
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    state.pushStatus = serverUnsubscribeFailed
      ? "Reminders are off on this device. The expired server subscription will be cleaned up automatically."
      : "Notifications are off.";
    showToast("Notifications off");
  } catch (error) {
    state.pushStatus = "Reminders are off on this device. The expired server subscription will be cleaned up automatically.";
    console.warn("Browser push unsubscribe failed", error);
  } finally {
    clearLocalPushSubscription();
    state.pushBusy = false;
    renderPreservingReaderScroll();
  }
}

async function savePushPreferences() {
  localStorage.setItem("lw_push_morning_time", state.pushMorningTime);
  localStorage.setItem("lw_push_evening_enabled", String(state.pushEveningEnabled));
  localStorage.setItem("lw_push_evening_time", state.pushEveningTime);
  localStorage.setItem("lw_push_friend_requests", String(state.pushFriendRequestNotifications));
  localStorage.setItem("lw_push_game_challenges", String(state.pushGameChallengeNotifications));
  localStorage.setItem("lw_push_challenge_accepted", String(state.pushChallengeAcceptedNotifications));
  const deviceToken = localStorage.getItem(pushDeviceTokenStorageKey) || "";
  if (!state.pushEnabled || !deviceToken) return;
  try {
    await pushFunctionRequest("POST", {
      action: "update",
      deviceToken,
      preferences: pushPreferences(),
    });
  } catch (error) {
    state.pushStatus = error?.message || "Notification preferences could not be saved.";
    showToast("Could not save notification settings");
  }
}

async function unlinkPushSubscriptionFromCurrentAccount() {
  const deviceToken = localStorage.getItem(pushDeviceTokenStorageKey) || "";
  if (!state.pushEnabled || !deviceToken || !state.authUser) return true;
  try {
    await pushFunctionRequest("POST", { action: "unlink-user", deviceToken });
    return true;
  } catch (error) {
    console.warn("Push subscription account unlink failed", error);
    try {
      const registration = await navigator.serviceWorker.getRegistration("./");
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch (unsubscribeError) {
      console.warn("Browser push fallback unsubscribe failed", unsubscribeError);
    }
    clearLocalPushSubscription();
    state.pushStatus = "Notifications were turned off to protect this account on the signed-out device.";
    return false;
  }
}

async function notePushVisit(force = false) {
  const deviceToken = localStorage.getItem(pushDeviceTokenStorageKey) || "";
  if (!state.pushEnabled || !deviceToken || document.visibilityState === "hidden") return;
  const now = Date.now();
  if (!force && now - lastPushVisitSentAt < 15 * 60 * 1000) return;
  lastPushVisitSentAt = now;
  try {
    await pushFunctionRequest("POST", {
      action: "opened",
      deviceToken,
      timezone: pushPreferences().timezone,
    });
  } catch (error) {
    console.warn("Push visit update failed", error);
  }
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
  rememberAuthenticatedSession(session);
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
    const existingOwner = accountDataOwner();
    const showInitialAccountSwitch = Boolean(
      session?.user
      && pendingAccountSwitch()
      && existingOwner
      && existingOwner !== guestDataOwner
      && existingOwner !== session.user.id
    );
    if (session?.user) {
      if (!existingOwner) {
        setAccountDataOwner(session.user.id);
        saveSnapshotForOwner(session.user.id, captureCloudSnapshot());
      }
      rememberAuthenticatedAccount(session.user);
      rememberAuthenticatedSession(session);
    } else if (existingOwner && existingOwner !== guestDataOwner) {
      activateGuestBrowserData();
    } else {
      setAccountDataOwner(guestDataOwner);
      if (!guestBrowserSnapshot()) saveSnapshotForOwner(guestDataOwner, captureCloudSnapshot());
    }
    state.syncStatus = session?.user ? "loading" : "local";
    state.syncMessage = session?.user ? "Loading your saved settings..." : "Sign in to carry your settings across devices.";
    if (session?.user) {
      await Promise.all([loadCloudSync(), loadSocialProfile(), loadFriendships(), loadGameChallenges()]);
      subscribeToGameChallenges();
      notePushVisit(true);
      applySocialNotificationDeepLink();
      maybeOfferPushNotifications();
      if (showInitialAccountSwitch) showAccountSwitchNotification(session.user);
    }
    client.auth.onAuthStateChange((event, session) => {
      const previousUserId = state.authUser?.id || "";
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
        rememberAuthenticatedAccount(state.authUser);
        rememberAuthenticatedSession(session);
        state.accountSwitching = false;
        state.accountAddOpen = false;
        state.syncStatus = "loading";
        state.syncMessage = "Loading your saved settings...";
        Promise.all([loadCloudSync(), loadSocialProfile(), loadFriendships(), loadGameChallenges()])
          .then(() => {
            subscribeToGameChallenges();
            notePushVisit(true);
            applySocialNotificationDeepLink();
            maybeOfferPushNotifications();
          })
          .catch((error) => {
            console.warn("Signed-in account data load failed", error);
            state.syncStatus = "error";
            state.syncMessage = "Signed in, but some account data could not load yet.";
            renderPreservingReaderScroll();
          });
      } else {
        if (event === "SIGNED_OUT" && previousUserId) removeRememberedAccountSession(previousUserId);
        state.pushPromptVisible = false;
        resetSocialProfileState();
        resetFriendshipState();
        resetGameChallengeState();
        activateGuestBrowserData();
        state.syncStatus = "local";
        state.syncMessage = "Signed out. Guest data is active on this browser.";
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

function resetSocialProfileState() {
  state.socialProfile = null;
  state.socialProfileDraft = null;
  state.socialProfileStatus = "idle";
  state.socialProfileMessage = "";
  state.socialProfileBusy = false;
  state.socialProfileOpen = false;
}

function resetFriendshipState() {
  state.friendships = [];
  state.friendshipProfiles = {};
  state.friendshipStatus = "idle";
  state.friendshipMessage = "";
  state.friendshipActionBusyId = "";
  state.friendsPanelTab = "friends";
  state.friendSearchQuery = "";
  state.friendSearchResults = [];
  state.friendSearchStatus = "idle";
  state.friendSearchMessage = "";
}

function teardownGameChallengeRealtime() {
  clearTimeout(gameChallengeRefreshTimer);
  gameChallengeRefreshTimer = 0;
  const client = state.authClient;
  const channel = gameChallengeRealtimeChannel;
  gameChallengeRealtimeChannel = null;
  state.gameChallengeRealtimeStatus = "idle";
  if (client && channel) client.removeChannel(channel).catch(() => {});
}

function teardownGameRoomPresence() {
  const client = state.authClient;
  const channel = gameRoomPresenceChannel;
  gameRoomPresenceChannel = null;
  gameRoomPresenceId = "";
  state.gameRoomOnlineUserIds = [];
  if (client && channel) client.removeChannel(channel).catch(() => {});
}

function resetGameChallengeState() {
  gameChallengeLoadSequence += 1;
  gameChallengeRefreshQueued = false;
  teardownGameChallengeRealtime();
  teardownGameRoomPresence();
  state.gameChallenges = [];
  state.gameChallengePlayers = {};
  state.gameChallengeProfiles = {};
  state.gameChallengeStatus = "idle";
  state.gameChallengeMessage = "";
  state.gameChallengeActionBusyId = "";
  state.challengeOpponentIds = [];
  state.activeGameChallengeId = "";
  gameChallengePopupNotice = null;
  gameChallengePopupQueue = [];
}

function gameChallengeErrorMessage(error) {
  if (
    error?.code === "PGRST202"
    && String(error?.message || "").includes("create_bsb_game_room")
  ) {
    return "Game rooms need the latest server update. Please try again after it is deployed.";
  }
  if (error?.code === "23505") return "You already have a pending or active challenge with that friend.";
  if (error?.code === "23514") return "That challenge setup is not valid.";
  if (error?.code === "42501") return "Only accepted friends can create or update this challenge.";
  return error?.message || "Game challenges could not be updated. Please try again.";
}

async function loadGameChallenges({ render = true, announce = false } = {}) {
  const loadSequence = ++gameChallengeLoadSequence;
  const client = createSupabaseClient();
  if (!client) return;
  const session = await authenticatedSupabaseSession(client);
  if (loadSequence !== gameChallengeLoadSequence) return;
  const userId = session?.user?.id;
  if (!userId) {
    resetGameChallengeState();
    return;
  }
  const previousChallenges = Array.isArray(state.gameChallenges)
    ? state.gameChallenges.map((challenge) => ({ ...challenge }))
    : [];
  const previousPlayers = Object.fromEntries(
    Object.entries(state.gameChallengePlayers || {}).map(([challengeId, players]) => [
      challengeId,
      players.map((player) => ({ ...player })),
    ]),
  );
  const previousIncomingIds = new Set(gameChallengeCollections(userId).incoming.map((challenge) => challenge.id));
  const previousActiveChallengeId = state.activeGameChallengeId;
  const previousPopupKey = gameChallengePopupNoticeKey(gameChallengePopupNotice);
  state.gameChallengeStatus = "loading";
  if (render && !state.gameChallenges.length && !state.triviaGame?.challengeId) {
    renderPreservingReaderScroll();
  }
  try {
    const { data: memberships, error: membershipError } = await client
      .from(gameChallengePlayerTable)
      .select("challenge_id, user_id, is_host, invite_status, responded_at, score, progress, ready, completed_at, elapsed_ms, created_at, updated_at")
      .eq("user_id", userId)
      .in("invite_status", ["invited", "accepted"])
      .order("updated_at", { ascending: false })
      .limit(100);
    if (membershipError) throw membershipError;
    const challengeIds = [...new Set((memberships || []).map((player) => player.challenge_id).filter(Boolean))];
    let challengeRows = [];
    let playerRows = [];
    if (challengeIds.length) {
      const [
        { data: rooms, error: roomsError },
        { data: players, error: playersError },
      ] = await Promise.all([
        client
          .from(gameChallengeTable)
          .select("id, challenger_id, challenged_id, game_type, category, difficulty, round_count, version, timed, max_players, seed, status, responded_at, started_at, completed_at, expires_at, created_at, updated_at")
          .in("id", challengeIds)
          .order("updated_at", { ascending: false }),
        client
          .from(gameChallengePlayerTable)
          .select("challenge_id, user_id, is_host, invite_status, responded_at, score, progress, ready, completed_at, elapsed_ms, created_at, updated_at")
          .in("challenge_id", challengeIds),
      ]);
      if (roomsError) throw roomsError;
      if (playersError) throw playersError;
      challengeRows = rooms || [];
      playerRows = players || [];
    }
    let challenges = challengeRows.map(normalizedGameChallenge);
    const playersByChallenge = playerRows
      .map(normalizedGameChallengePlayer)
      .reduce((groups, player) => {
        if (!groups[player.challengeId]) groups[player.challengeId] = [];
        groups[player.challengeId].push(player);
        return groups;
      }, {});
    const profileIds = [...new Set(
      playerRows.map((player) => String(player.user_id || "")).filter((profileId) => profileId && profileId !== userId),
    )];
    let profileRows = [];
    if (profileIds.length) {
      const { data: profiles, error: profilesError } = await client
        .from(socialProfileTable)
        .select("user_id, username, display_name, avatar_key, is_discoverable, allow_friend_requests, created_at, updated_at")
        .in("user_id", profileIds);
      if (profilesError) throw profilesError;
      profileRows = profiles || [];
    }
    let challengeProfiles = Object.fromEntries(
      profileRows.map((row) => {
        const profile = normalizedSocialProfile(row);
        return [profile.userId, profile];
      }),
    );
    if (loadSequence !== gameChallengeLoadSequence) return;
    const previousActiveChallenge = previousChallenges
      .find((challenge) => challenge.id === previousActiveChallengeId);
    const preserveRunningChallenge = Boolean(
      previousActiveChallenge
      && previousActiveChallenge.status === "accepted"
      && state.triviaGame?.challengeId === previousActiveChallengeId
      && !challenges.some((challenge) => challenge.id === previousActiveChallengeId),
    );
    if (preserveRunningChallenge) {
      challenges = [previousActiveChallenge, ...challenges];
      playersByChallenge[previousActiveChallengeId] = previousPlayers[previousActiveChallengeId] || [];
      challengeProfiles = { ...state.gameChallengeProfiles, ...challengeProfiles };
    }
    state.gameChallenges = challenges;
    state.gameChallengePlayers = playersByChallenge;
    state.gameChallengeProfiles = challengeProfiles;
    reconcileGameChallengePopupNotices(
      previousChallenges,
      challenges,
      userId,
      previousPlayers,
      playersByChallenge,
    );
    const refreshedActiveChallenge = activeGameChallenge();
    if (
      previousActiveChallengeId
      && (!refreshedActiveChallenge || !["pending", "accepted", "completed"].includes(refreshedActiveChallenge.status))
    ) {
      state.activeGameChallengeId = "";
      if (state.triviaGame?.challengeId === previousActiveChallengeId) state.triviaGame = null;
      teardownGameRoomPresence();
      showToast("The live challenge ended");
    }
    state.gameChallengeStatus = "ready";
    state.gameChallengeMessage = "";
    if (announce) {
      const incoming = gameChallengeCollections(userId).incoming;
      const newest = incoming.find((challenge) => !previousIncomingIds.has(challenge.id));
      if (newest) {
        const profile = friendshipProfile(newest.challengerId);
        showToast(`${profile?.displayName || profile?.username || "A friend"} invited you to ${gameChallengeTitle(newest.gameType)}`);
      }
    }
    maybeStartActiveGameChallenge({ render: false });
    if (state.activeGameChallengeId) {
      subscribeToActiveGameRoomPresence().catch((error) => console.warn("Game room presence failed", error));
    }
  } catch (error) {
    if (loadSequence !== gameChallengeLoadSequence) return;
    console.warn("Game challenge load failed", error);
    state.gameChallengeStatus = "error";
    state.gameChallengeMessage = gameChallengeErrorMessage(error);
  } finally {
    if (render && loadSequence === gameChallengeLoadSequence) {
      const activeGameStayedOpen = Boolean(
        previousActiveChallengeId
        && state.activeGameChallengeId === previousActiveChallengeId
        && state.triviaGame?.challengeId === previousActiveChallengeId
        && state.mode === "trivia"
        && !state.accountOpen
        && previousPopupKey === gameChallengePopupNoticeKey(gameChallengePopupNotice),
      );
      if (!activeGameStayedOpen || !refreshLiveGameChallengeScoreboard()) {
        renderPreservingReaderScroll();
      }
    }
  }
}

async function refreshGameChallengesFromRealtime() {
  if (gameChallengeRefreshInFlight) {
    gameChallengeRefreshQueued = true;
    return;
  }
  gameChallengeRefreshInFlight = true;
  try {
    do {
      gameChallengeRefreshQueued = false;
      await loadGameChallenges({ announce: true });
    } while (gameChallengeRefreshQueued);
  } finally {
    gameChallengeRefreshInFlight = false;
  }
}

function scheduleGameChallengeRefresh() {
  clearTimeout(gameChallengeRefreshTimer);
  gameChallengeRefreshTimer = setTimeout(() => {
    gameChallengeRefreshTimer = 0;
    refreshGameChallengesFromRealtime()
      .catch((error) => console.warn("Live challenge refresh failed", error));
  }, 140);
}

function subscribeToGameChallenges() {
  teardownGameChallengeRealtime();
  const client = createSupabaseClient();
  const userId = state.authUser?.id;
  if (!client || !userId) return;
  state.gameChallengeRealtimeStatus = "connecting";
  gameChallengeRealtimeChannel = client
    .channel(`bsb-game-challenges-${userId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: gameChallengeTable,
    }, scheduleGameChallengeRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: gameChallengePlayerTable,
    }, scheduleGameChallengeRefresh)
    .subscribe((status) => {
      state.gameChallengeRealtimeStatus = status === "SUBSCRIBED" ? "subscribed" : status.toLowerCase();
      if (state.accountOpen) renderPreservingReaderScroll();
    });
}

function syncGameRoomPresenceState() {
  if (!gameRoomPresenceChannel) return;
  const presence = gameRoomPresenceChannel.presenceState();
  const onlineUserIds = [...new Set(
    Object.values(presence || {})
      .flat()
      .map((entry) => String(entry?.userId || ""))
      .filter(Boolean),
  )].sort();
  const previousOnlineUserIds = [...state.gameRoomOnlineUserIds].sort();
  if (
    onlineUserIds.length === previousOnlineUserIds.length
    && onlineUserIds.every((userId, index) => userId === previousOnlineUserIds[index])
  ) return;
  state.gameRoomOnlineUserIds = onlineUserIds;
  if (state.mode === "trivia" && activeGameChallenge()?.status === "pending") {
    renderPreservingReaderScroll();
  }
}

async function trackActiveGameRoomPresence() {
  if (!gameRoomPresenceChannel || !gameRoomPresenceId) return;
  const player = gameChallengePlayer(gameRoomPresenceId);
  if (!player || player.inviteStatus !== "accepted") return;
  await gameRoomPresenceChannel.track({
    userId: state.authUser?.id || "",
    ready: player.ready,
    mode: state.mode,
    at: new Date().toISOString(),
  });
}

async function subscribeToActiveGameRoomPresence() {
  const challenge = activeGameChallenge();
  const userId = state.authUser?.id || "";
  const player = challenge ? gameChallengePlayer(challenge.id, userId) : null;
  if (!challenge || !userId || player?.inviteStatus !== "accepted") {
    teardownGameRoomPresence();
    return;
  }
  if (gameRoomPresenceChannel && gameRoomPresenceId === challenge.id) {
    await trackActiveGameRoomPresence();
    return;
  }
  teardownGameRoomPresence();
  const client = createSupabaseClient();
  if (!client) return;
  await client.realtime.setAuth();
  const channel = client
    .channel(`bsb-game-room:${challenge.id}`, {
      config: {
        private: true,
        presence: { key: userId },
      },
    })
    .on("presence", { event: "sync" }, syncGameRoomPresenceState)
    .on("presence", { event: "join" }, syncGameRoomPresenceState)
    .on("presence", { event: "leave" }, syncGameRoomPresenceState)
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        trackActiveGameRoomPresence().catch((error) => console.warn("Game room presence track failed", error));
      }
    });
  gameRoomPresenceChannel = channel;
  gameRoomPresenceId = challenge.id;
}

function activeGameChallenge() {
  return state.gameChallenges.find((challenge) => challenge.id === state.activeGameChallengeId) || null;
}

function challengeGameConfigFromState() {
  const version = state.versions.find(isBundledTranslation) || "BSB";
  return {
    game_type: state.triviaGameType,
    category: state.triviaGameType === "trivia" ? state.triviaCategory : "Mixed",
    difficulty: state.triviaGameType === "verse-order" ? "All" : state.triviaDifficulty,
    round_count: normalizedTriviaCount(state.triviaGameType, state.triviaCount),
    version,
    timed: state.triviaGameType === "reference-rush" && state.referenceRushTimed,
  };
}

async function sendGameChallenge(opponentIds = state.challengeOpponentIds) {
  const client = createSupabaseClient();
  const friendIds = new Set(
    friendshipCollections().friends.map((friendship) => friendshipOtherUserId(friendship)).filter(Boolean),
  );
  const inviteeIds = [...new Set(Array.isArray(opponentIds) ? opponentIds : [opponentIds])]
    .filter((userId) => friendIds.has(userId))
    .slice(0, 9);
  if (!client || !inviteeIds.length || state.gameChallengeActionBusyId) return;
  state.gameChallengeActionBusyId = "room:create";
  state.gameChallengeMessage = `Creating a room for ${inviteeIds.length + 1} players…`;
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const challengerId = session?.user?.id;
    if (!challengerId) throw new Error("Sign in again before challenging a friend.");
    const config = challengeGameConfigFromState();
    const { data: roomId, error } = await client.rpc("create_bsb_game_room", {
      invitee_ids: inviteeIds,
      room_game_type: config.game_type,
      room_category: config.category,
      room_difficulty: config.difficulty,
      room_round_count: config.round_count,
      room_version: config.version,
      room_timed: config.timed,
    });
    if (error) throw error;
    queueSocialPushDelivery();
    state.gameChallengeActionBusyId = "";
    await loadGameChallenges({ render: false });
    state.activeGameChallengeId = String(roomId || "");
    state.mode = "trivia";
    state.gameChallengeMessage = "Room created. Invitations expire in 24 hours.";
    await subscribeToActiveGameRoomPresence();
    showToast(`Game room created for ${inviteeIds.length + 1}`);
  } catch (error) {
    console.warn("Game room create failed", error);
    state.gameChallengeActionBusyId = "";
    state.gameChallengeMessage = gameChallengeErrorMessage(error);
    showToast("Game room not created");
  } finally {
    renderPreservingReaderScroll();
  }
}

async function updateGameChallengeResponse(challengeId, action) {
  const client = createSupabaseClient();
  if (!client || !challengeId || state.gameChallengeActionBusyId) return;
  if (!["accept", "decline", "cancel", "end"].includes(action)) return;
  state.gameChallengeActionBusyId = challengeId;
  state.gameChallengeMessage = action === "accept" ? "Joining room…" : "Updating room…";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) throw new Error("Sign in again before updating this challenge.");
    if (["accept", "decline"].includes(action)) {
      const { count, error } = await client
        .from(gameChallengePlayerTable)
        .update({
          invite_status: action === "accept" ? "accepted" : "declined",
          responded_at: new Date().toISOString(),
        }, { count: "exact" })
        .eq("challenge_id", challengeId)
        .eq("user_id", userId)
        .eq("invite_status", "invited");
      if (error) throw error;
      if (!count) throw new Error("That room invitation is no longer available.");
    } else {
      const { data, error } = await client
        .from(gameChallengeTable)
        .update({ status: "cancelled", responded_at: new Date().toISOString() })
        .eq("id", challengeId)
        .eq("challenger_id", userId)
        .in("status", ["pending", "accepted"])
        .select("id")
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error("That game room is no longer available.");
    }
    if (action === "accept") queueSocialPushDelivery();
    state.gameChallengeActionBusyId = "";
    if (action === "end") {
      state.activeGameChallengeId = "";
      if (state.triviaGame?.challengeId === challengeId) state.triviaGame = null;
    }
    await loadGameChallenges({ render: false });
    if (action === "accept") {
      state.activeGameChallengeId = challengeId;
      state.mode = "trivia";
      state.accountOpen = false;
      await subscribeToActiveGameRoomPresence();
      state.gameChallengeMessage = "You joined the waiting room.";
      showToast("Joined the game room");
    } else if (action === "end") {
      state.gameChallengeMessage = "Game room ended.";
      showToast("Game room ended");
    } else {
      state.gameChallengeMessage = action === "cancel" ? "Game room cancelled." : "Invitation declined.";
      showToast(action === "cancel" ? "Game room cancelled" : "Maybe another time");
    }
  } catch (error) {
    console.warn("Game room response failed", error);
    state.gameChallengeActionBusyId = "";
    state.gameChallengeMessage = gameChallengeErrorMessage(error);
    showToast("Challenge not updated");
  } finally {
    renderPreservingReaderScroll();
  }
}

async function joinGameChallenge(challengeId) {
  const challenge = state.gameChallenges.find((item) => item.id === challengeId);
  if (!challenge) return;
  state.activeGameChallengeId = challengeId;
  state.mode = "trivia";
  state.focusMode = false;
  state.accountOpen = false;
  state.triviaGameType = challenge.gameType;
  state.triviaCategory = challenge.category;
  state.triviaDifficulty = challenge.difficulty;
  state.triviaCount = challenge.roundCount;
  state.referenceRushTimed = challenge.timed;
  await subscribeToActiveGameRoomPresence();
  if (challenge.status === "pending") {
    state.triviaGame = null;
    renderPreservingReaderScroll();
    return;
  }
  if (challenge.status === "completed" || challenge.startedAt) {
    startLoadedGameChallenge(challenge);
    return;
  }
  renderPreservingReaderScroll();
}

async function setGameRoomReady(challengeId, ready) {
  const client = createSupabaseClient();
  if (!client || !challengeId || state.gameChallengeActionBusyId) return;
  state.gameChallengeActionBusyId = challengeId;
  state.gameChallengeMessage = ready ? "Marking you ready…" : "Updating your ready state…";
  renderPreservingReaderScroll();
  try {
    const { data, error } = await client
      .from(gameChallengePlayerTable)
      .update({ ready })
      .eq("challenge_id", challengeId)
      .eq("user_id", state.authUser?.id)
      .eq("invite_status", "accepted")
      .select("challenge_id")
      .single();
    if (error) throw error;
    if (!data?.challenge_id) throw new Error("That waiting room is no longer available.");
    state.gameChallengeActionBusyId = "";
    await loadGameChallenges({ render: false });
    await trackActiveGameRoomPresence();
    state.gameChallengeMessage = ready ? "You’re ready." : "Ready state cleared.";
  } catch (error) {
    console.warn("Game room ready update failed", error);
    state.gameChallengeActionBusyId = "";
    state.gameChallengeMessage = gameChallengeErrorMessage(error);
    showToast("Ready state not updated");
  } finally {
    renderPreservingReaderScroll();
  }
}

async function startGameRoom(challengeId) {
  const client = createSupabaseClient();
  if (!client || !challengeId || state.gameChallengeActionBusyId) return;
  state.gameChallengeActionBusyId = challengeId;
  state.gameChallengeMessage = "Starting game…";
  renderPreservingReaderScroll();
  try {
    const { data, error } = await client.rpc("start_bsb_game_room", { room_id: challengeId });
    if (error) throw error;
    if (!data) throw new Error("That waiting room could not start.");
    state.gameChallengeActionBusyId = "";
    await loadGameChallenges({ render: false });
    state.activeGameChallengeId = challengeId;
    const challenge = activeGameChallenge();
    if (challenge) startLoadedGameChallenge(challenge);
    showToast("Game started");
  } catch (error) {
    console.warn("Game room start failed", error);
    state.gameChallengeActionBusyId = "";
    state.gameChallengeMessage = gameChallengeErrorMessage(error);
    showToast("Game not started");
  } finally {
    renderPreservingReaderScroll();
  }
}

function seededTriviaRandom(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function withTriviaRandomSeed(seed, callback) {
  const previous = triviaRandomSource;
  triviaRandomSource = seededTriviaRandom(seed);
  try {
    return callback();
  } finally {
    triviaRandomSource = previous;
  }
}

function challengeCurrentRoundAnswered(game) {
  if (!game || game.complete) return false;
  if (game.type === "trivia") return game.selectedAnswer !== null;
  if (game.type === "who-said-it") return game.questions?.[game.index]?.selectedAnswer !== null;
  if (game.type === "reference-rush") return game.puzzles?.[game.index]?.selectedReference !== null;
  return Boolean(game.puzzles?.[game.index]?.answered);
}

function challengeGameProgress(game = state.triviaGame) {
  if (!game) return 0;
  const roundLength = triviaRoundLength(game);
  if (game.complete) return roundLength;
  return Math.min(roundLength, game.index + (challengeCurrentRoundAnswered(game) ? 1 : 0));
}

function challengeGameElapsedMs(game = state.triviaGame) {
  if (!game?.challengeId) return null;
  const challenge = activeGameChallenge();
  const startedAt = Date.parse(challenge?.startedAt || "");
  if (!Number.isFinite(startedAt)) return null;
  const finishedAt = game.complete ? Date.now() : null;
  return finishedAt ? Math.max(0, finishedAt - startedAt) : null;
}

async function syncActiveChallengeProgress({ completed = false } = {}) {
  const game = state.triviaGame;
  const challengeId = game?.challengeId;
  const userId = state.authUser?.id;
  if (!challengeId || !userId) return;
  const client = createSupabaseClient();
  if (!client) return;
  const payload = {
    score: Math.max(0, Number(game.score) || 0),
    progress: challengeGameProgress(game),
  };
  if (completed || game.complete) {
    payload.completed_at = new Date().toISOString();
    payload.elapsed_ms = challengeGameElapsedMs(game);
  }
  const { error } = await client
    .from(gameChallengePlayerTable)
    .update(payload)
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);
  if (error) {
    console.warn("Live challenge progress sync failed", error);
    state.gameChallengeMessage = "Your score could not sync yet.";
  }
}

function restoreChallengeGameProgress(game, player) {
  if (!game || !player) return;
  const roundLength = triviaRoundLength(game);
  game.score = player.score;
  if (player.completedAt) {
    game.index = Math.max(0, roundLength - 1);
    game.complete = true;
    game.celebrationPending = false;
    return;
  }
  game.index = Math.min(Math.max(0, player.progress), Math.max(0, roundLength - 1));
}

function startLoadedGameChallenge(challenge, { render = true } = {}) {
  if (!challenge || !["accepted", "completed"].includes(challenge.status)) return;
  state.activeGameChallengeId = challenge.id;
  state.mode = "trivia";
  state.focusMode = false;
  state.triviaGameType = challenge.gameType;
  state.triviaCategory = challenge.category;
  state.triviaDifficulty = challenge.difficulty;
  state.triviaCount = challenge.roundCount;
  state.referenceRushTimed = challenge.timed;
  withTriviaRandomSeed(challenge.seed, () => startTriviaGame({ render: false }));
  if (!state.triviaGame) return;
  state.triviaGame.challengeId = challenge.id;
  const startedAt = Date.parse(challenge.startedAt || "");
  if (Number.isFinite(startedAt)) {
    if (state.triviaGame.type === "reference-rush" && state.triviaGame.timed) {
      state.triviaGame.startedAt = startedAt;
      state.triviaGame.deadlineAt = startedAt + state.triviaGame.durationMs;
    }
    if (state.triviaGame.type === "book-sprint") state.triviaGame.startedAt = startedAt;
  }
  restoreChallengeGameProgress(state.triviaGame, gameChallengePlayer(challenge.id));
  if (render) renderPreservingReaderScroll();
}

function maybeStartActiveGameChallenge({ render = true } = {}) {
  const challenge = activeGameChallenge();
  if (!challenge || !challenge.startedAt) return;
  if (state.triviaGame?.challengeId === challenge.id) return;
  startLoadedGameChallenge(challenge, { render });
}

function handleGameChallengeAction(button) {
  const action = button.dataset.gameChallengeAction;
  const challengeId = button.dataset.gameChallengeId || "";
  if (["accept", "decline", "cancel", "end"].includes(action)) {
    if (action === "end" && !window.confirm("End this live challenge for every player?")) return;
    return updateGameChallengeResponse(challengeId, action);
  }
  if (action === "ready") return setGameRoomReady(challengeId, true);
  if (action === "not-ready") return setGameRoomReady(challengeId, false);
  if (action === "start-room") return startGameRoom(challengeId);
  if (["join", "view", "lobby"].includes(action)) {
    if (button.closest(".game-challenge-popup")) dismissGameChallengePopup();
    return joinGameChallenge(challengeId);
  }
}

function trapGameChallengePopupFocus(event) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === dialog || document.activeElement === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function captureSocialProfileDraft(prefix = "") {
  const suffix = prefix ? `${prefix}-` : "";
  const usernameInput = document.getElementById(`${suffix}profileUsername`);
  const displayNameInput = document.getElementById(`${suffix}profileDisplayName`);
  const discoverableInput = document.getElementById(`${suffix}profileDiscoverable`);
  const friendRequestsInput = document.getElementById(`${suffix}profileFriendRequests`);
  const current = state.socialProfileDraft || socialProfileDraft();
  const next = {
    username: usernameInput ? normalizeProfileUsername(usernameInput.value) : current.username,
    displayName: displayNameInput ? displayNameInput.value.trim().slice(0, 40) : current.displayName,
    avatarKey: socialAvatarKeys.includes(current.avatarKey) ? current.avatarKey : "initials",
    isDiscoverable: discoverableInput ? discoverableInput.checked : current.isDiscoverable,
    allowFriendRequests: friendRequestsInput ? friendRequestsInput.checked : current.allowFriendRequests,
  };
  state.socialProfileDraft = next;
  return next;
}

function socialProfileErrorMessage(error) {
  if (error?.code === "23505") return "That username is already taken. Choose another.";
  if (error?.code === "23514") return "One of the profile choices is not valid. Review the form and try again.";
  if (error?.code === "42501") return "Your profile could not be saved because account access is not ready yet.";
  return error?.message || "Your social profile could not be saved. Please try again.";
}

async function loadSocialProfile() {
  const client = createSupabaseClient();
  if (!client) return;
  const session = await authenticatedSupabaseSession(client);
  const userId = session?.user?.id;
  if (!userId) {
    resetSocialProfileState();
    return;
  }
  state.socialProfileStatus = "loading";
  state.socialProfileMessage = "";
  renderPreservingReaderScroll();
  try {
    const { data, error } = await client
      .from(socialProfileTable)
      .select("user_id, username, display_name, avatar_key, is_discoverable, allow_friend_requests, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    state.socialProfile = data ? normalizedSocialProfile(data) : null;
    state.socialProfileDraft = socialProfileDraft(state.socialProfile);
    state.socialProfileStatus = "ready";
    state.socialProfileMessage = data ? "" : "Choose a unique username to create your social profile.";
    state.socialProfileOpen = !data;
    rememberAuthenticatedAccount(state.authUser, state.socialProfile);
  } catch (error) {
    console.warn("Social profile load failed", error);
    state.socialProfileStatus = "error";
    state.socialProfileMessage = socialProfileErrorMessage(error);
  } finally {
    renderPreservingReaderScroll();
  }
}

function friendshipErrorMessage(error) {
  if (error?.code === "23505") return "A friend request or friendship already exists with that person.";
  if (error?.code === "23514") return "That friend request is not valid.";
  if (error?.code === "42501") return "That profile is not accepting friend requests.";
  return error?.message || "Friends could not be updated. Please try again.";
}

async function loadFriendships({ render = true } = {}) {
  const client = createSupabaseClient();
  if (!client) return;
  const session = await authenticatedSupabaseSession(client);
  const userId = session?.user?.id;
  if (!userId) {
    resetFriendshipState();
    return;
  }
  state.friendshipStatus = "loading";
  if (render) renderPreservingReaderScroll();
  try {
    const { data, error } = await client
      .from(friendshipTable)
      .select("id, requester_id, addressee_id, status, responded_at, created_at, updated_at")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const friendships = (data || []).map(normalizedFriendship);
    const profileIds = [...new Set(friendships.map((item) => friendshipOtherUserId(item, userId)).filter(Boolean))];
    let profileRows = [];
    if (profileIds.length) {
      const { data: profiles, error: profilesError } = await client
        .from(socialProfileTable)
        .select("user_id, username, display_name, avatar_key, is_discoverable, allow_friend_requests, created_at, updated_at")
        .in("user_id", profileIds);
      if (profilesError) throw profilesError;
      profileRows = profiles || [];
    }
    state.friendships = friendships;
    state.friendshipProfiles = Object.fromEntries(
      profileRows.map((row) => {
        const profile = normalizedSocialProfile(row);
        return [profile.userId, profile];
      }),
    );
    state.friendshipStatus = "ready";
  } catch (error) {
    console.warn("Friendships load failed", error);
    state.friendshipStatus = "error";
    state.friendshipMessage = friendshipErrorMessage(error);
  } finally {
    if (render) renderPreservingReaderScroll();
  }
}

async function searchFriends(event, prefix = "") {
  event.preventDefault();
  if (!state.socialProfile) return showToast("Create your social profile first");
  const suffix = prefix ? `${prefix}-` : "";
  const input = document.getElementById(`${suffix}friendSearchInput`);
  const query = normalizeProfileUsername(input?.value || "").replace(/[^a-z0-9_]/g, "").slice(0, 20);
  state.friendSearchQuery = query;
  state.friendSearchResults = [];
  if (query.length < 2) {
    state.friendSearchStatus = "idle";
    state.friendSearchMessage = "Enter at least two username characters.";
    renderPreservingReaderScroll();
    return;
  }
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  state.friendSearchStatus = "loading";
  state.friendSearchMessage = "";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) throw new Error("Sign in again before searching for people.");
    const { data, error } = await client
      .from(socialProfileTable)
      .select("user_id, username, display_name, avatar_key, is_discoverable, allow_friend_requests, created_at, updated_at")
      .gte("username", query)
      .lt("username", `${query}\uffff`)
      .eq("is_discoverable", true)
      .neq("user_id", userId)
      .order("username", { ascending: true })
      .limit(20);
    if (error) throw error;
    state.friendSearchResults = (data || []).map(normalizedSocialProfile);
    state.friendSearchStatus = "ready";
    state.friendSearchMessage = state.friendSearchResults.length
      ? `${state.friendSearchResults.length} ${state.friendSearchResults.length === 1 ? "profile" : "profiles"} found.`
      : `No discoverable profiles begin with @${query}.`;
  } catch (error) {
    console.warn("Friend search failed", error);
    state.friendSearchStatus = "error";
    state.friendSearchMessage = friendshipErrorMessage(error);
  } finally {
    renderPreservingReaderScroll();
  }
}

async function finishFriendshipAction(message) {
  await loadFriendships({ render: false });
  if (state.friendshipStatus !== "ready") {
    state.friendshipActionBusyId = "";
    throw new Error(state.friendshipMessage || "Friends could not be refreshed.");
  }
  state.friendshipMessage = message;
  state.friendshipActionBusyId = "";
  renderPreservingReaderScroll();
}

async function sendFriendRequest(profileId) {
  const client = createSupabaseClient();
  if (!client || !profileId || profileId === state.authUser?.id || state.friendshipActionBusyId) return;
  state.friendshipActionBusyId = `profile:${profileId}`;
  state.friendshipMessage = "Sending friend request…";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const requesterId = session?.user?.id;
    if (!requesterId) throw new Error("Sign in again before sending a friend request.");
    const { error } = await client
      .from(friendshipTable)
      .insert({ requester_id: requesterId, addressee_id: profileId });
    if (error) throw error;
    queueSocialPushDelivery();
    await finishFriendshipAction("Friend request sent.");
    showToast("Friend request sent");
  } catch (error) {
    console.warn("Friend request send failed", error);
    state.friendshipActionBusyId = "";
    state.friendshipMessage = friendshipErrorMessage(error);
    showToast("Request not sent");
    renderPreservingReaderScroll();
  }
}

async function acceptFriendRequest(friendshipId) {
  const client = createSupabaseClient();
  if (!client || !friendshipId || state.friendshipActionBusyId) return;
  state.friendshipActionBusyId = friendshipId;
  state.friendshipMessage = "Accepting friend request…";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) throw new Error("Sign in again before accepting a friend request.");
    const { data, error } = await client
      .from(friendshipTable)
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("addressee_id", userId)
      .eq("status", "pending")
      .select("id")
      .single();
    if (error) throw error;
    if (!data?.id) throw new Error("That request is no longer pending.");
    await finishFriendshipAction("Friend request accepted.");
    showToast("Friend added");
  } catch (error) {
    console.warn("Friend request accept failed", error);
    state.friendshipActionBusyId = "";
    state.friendshipMessage = friendshipErrorMessage(error);
    showToast("Request not accepted");
    renderPreservingReaderScroll();
  }
}

async function deleteFriendship(friendshipId, action = "remove") {
  const client = createSupabaseClient();
  if (!client || !friendshipId || state.friendshipActionBusyId) return;
  const messages = {
    cancel: ["Friend request cancelled.", "Request cancelled"],
    decline: ["Friend request declined.", "Request declined"],
    remove: ["Friend removed.", "Friend removed"],
  };
  const [statusMessage, toastMessage] = messages[action] || messages.remove;
  state.friendshipActionBusyId = friendshipId;
  state.friendshipMessage = action === "remove" ? "Removing friend…" : "Updating request…";
  renderPreservingReaderScroll();
  try {
    const { error } = await client
      .from(friendshipTable)
      .delete()
      .eq("id", friendshipId);
    if (error) throw error;
    await finishFriendshipAction(statusMessage);
    showToast(toastMessage);
  } catch (error) {
    console.warn("Friendship delete failed", error);
    state.friendshipActionBusyId = "";
    state.friendshipMessage = friendshipErrorMessage(error);
    showToast("Friends not updated");
    renderPreservingReaderScroll();
  }
}

function handleFriendAction(button) {
  const action = button.dataset.friendAction;
  const friendshipId = button.dataset.friendshipId || "";
  const profileId = button.dataset.friendProfileId || "";
  if (action === "challenge" && profileId) {
    state.challengeOpponentIds = [profileId];
    state.accountOpen = false;
    state.mode = "trivia";
    state.focusMode = false;
    state.triviaGame = null;
    renderPreservingReaderScroll();
    requestAnimationFrame(() => document.querySelector(`[data-challenge-friend="${CSS.escape(profileId)}"]`)?.focus());
    return;
  }
  if (action === "send") return sendFriendRequest(profileId);
  if (action === "accept") return acceptFriendRequest(friendshipId);
  if (["cancel", "decline", "remove"].includes(action)) return deleteFriendship(friendshipId, action);
}

async function saveSocialProfile(event, prefix = "") {
  event.preventDefault();
  if (!state.authUser) return showToast("Sign in before creating a profile");
  const draft = captureSocialProfileDraft(prefix);
  const validationMessage = socialProfileValidationMessage(draft.username, draft.displayName);
  if (validationMessage) {
    state.socialProfileMessage = validationMessage;
    renderPreservingReaderScroll();
    return showToast("Review your profile");
  }
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  const creatingProfile = !state.socialProfile;
  state.socialProfileBusy = true;
  state.socialProfileMessage = state.socialProfile ? "Saving your profile…" : "Creating your profile…";
  renderPreservingReaderScroll();
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) throw new Error("Sign in again before saving your profile.");
    const payload = {
      user_id: userId,
      username: draft.username,
      display_name: draft.displayName || null,
      avatar_key: draft.avatarKey,
      is_discoverable: draft.isDiscoverable,
      allow_friend_requests: draft.allowFriendRequests,
    };
    const { data, error } = await client
      .from(socialProfileTable)
      .upsert(payload, { onConflict: "user_id" })
      .select("user_id, username, display_name, avatar_key, is_discoverable, allow_friend_requests, created_at, updated_at")
      .single();
    if (error) throw error;
    state.socialProfile = normalizedSocialProfile(data);
    state.socialProfileDraft = socialProfileDraft(state.socialProfile);
    state.socialProfileStatus = "ready";
    state.socialProfileMessage = `Profile saved as @${state.socialProfile.username}.`;
    rememberAuthenticatedAccount(state.authUser, state.socialProfile);
    if (creatingProfile) state.socialProfileOpen = false;
    showToast("Social profile saved");
  } catch (error) {
    console.warn("Social profile save failed", error);
    state.socialProfileStatus = "error";
    state.socialProfileMessage = socialProfileErrorMessage(error);
    showToast("Profile not saved");
  } finally {
    state.socialProfileBusy = false;
    renderPreservingReaderScroll();
  }
}

function selectSocialProfileAvatar(avatarKey, prefix = "") {
  if (!socialAvatarKeys.includes(avatarKey) || state.socialProfileBusy) return;
  const draft = captureSocialProfileDraft(prefix);
  state.socialProfileDraft = { ...draft, avatarKey };
  state.socialProfileMessage = "Avatar selected. Save your profile to keep this change.";
  renderPreservingReaderScroll();
}

function closeSocialAvatarPicker(options = {}) {
  const popup = document.querySelector(".social-avatar-picker-popup");
  if (!popup) return;
  const anchorId = popup.dataset.avatarPickerAnchor || "";
  const anchor = anchorId ? document.getElementById(anchorId) : null;
  anchor?.setAttribute("aria-expanded", "false");
  popup.remove();
  document.removeEventListener("click", closeSocialAvatarPickerOnOutside, true);
  document.removeEventListener("keydown", closeSocialAvatarPickerOnEscape);
  document.removeEventListener("scroll", closeSocialAvatarPickerOnViewport, true);
  window.removeEventListener("resize", closeSocialAvatarPickerOnViewport);
  if (options.restoreFocus) anchor?.focus();
}

function closeSocialAvatarPickerOnOutside(event) {
  const popup = document.querySelector(".social-avatar-picker-popup");
  if (!popup || popup.contains(event.target)) return;
  const anchorId = popup.dataset.avatarPickerAnchor || "";
  if (anchorId && document.getElementById(anchorId)?.contains(event.target)) return;
  closeSocialAvatarPicker();
}

function closeSocialAvatarPickerOnEscape(event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeSocialAvatarPicker({ restoreFocus: true });
}

function closeSocialAvatarPickerOnViewport() {
  closeSocialAvatarPicker();
}

function positionSocialAvatarPicker(anchor, popup) {
  const anchorRect = anchor.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const edge = 12;
  const gap = 8;
  const left = Math.min(
    Math.max(edge, anchorRect.right - popupRect.width),
    Math.max(edge, viewportWidth - popupRect.width - edge),
  );
  const spaceBelow = viewportHeight - anchorRect.bottom - edge;
  const top = spaceBelow >= popupRect.height + gap
    ? anchorRect.bottom + gap
    : Math.max(edge, anchorRect.top - popupRect.height - gap);
  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
}

function openSocialAvatarPicker(anchor, prefix = "") {
  const existing = document.querySelector(".social-avatar-picker-popup");
  if (existing?.dataset.avatarPickerAnchor === anchor.id) {
    closeSocialAvatarPicker({ restoreFocus: true });
    return;
  }
  closeSocialAvatarPicker();
  const draft = captureSocialProfileDraft(prefix);
  const profileForAvatar = {
    username: draft.username,
    displayName: draft.displayName,
    avatarKey: draft.avatarKey,
  };
  const suffix = prefix ? `${prefix}-` : "";
  const popup = document.createElement("div");
  popup.className = "social-avatar-picker-popup";
  popup.id = `${suffix}socialAvatarMorePicker`;
  popup.dataset.avatarPickerAnchor = anchor.id;
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", "More avatar choices");
  popup.innerHTML = `
    <div class="social-avatar-picker-heading">
      <strong>More avatars</strong>
      <button class="social-avatar-picker-close" type="button" aria-label="Close more avatar choices">${icons.clear}</button>
    </div>
    <div class="social-avatar-more-options" role="radiogroup" aria-label="Additional profile avatar choices">
      ${socialAvatarMoreOptions.map((option) => `
        <button
          class="social-avatar-choice ${draft.avatarKey === option.key ? "active" : ""}"
          type="button"
          role="radio"
          aria-checked="${draft.avatarKey === option.key}"
          aria-label="${escapeHtml(option.label)} avatar"
          data-profile-avatar-extra="${option.key}"
        >
          ${socialProfileAvatarMarkup({ ...profileForAvatar, avatarKey: option.key })}
        </button>
      `).join("")}
    </div>
  `;
  (document.querySelector(".app-shell") || document.body).appendChild(popup);
  anchor.setAttribute("aria-expanded", "true");
  positionSocialAvatarPicker(anchor, popup);
  popup.querySelector(".social-avatar-picker-close")?.addEventListener("click", () => {
    closeSocialAvatarPicker({ restoreFocus: true });
  });
  popup.querySelectorAll("[data-profile-avatar-extra]").forEach((button) => {
    button.addEventListener("click", () => {
      const avatarKey = button.dataset.profileAvatarExtra;
      const anchorId = anchor.id;
      closeSocialAvatarPicker();
      selectSocialProfileAvatar(avatarKey, prefix);
      requestAnimationFrame(() => document.getElementById(anchorId)?.focus());
    });
  });
  requestAnimationFrame(() => {
    (popup.querySelector('[aria-checked="true"]') || popup.querySelector("[data-profile-avatar-extra]"))?.focus();
    document.addEventListener("click", closeSocialAvatarPickerOnOutside, true);
    document.addEventListener("keydown", closeSocialAvatarPickerOnEscape);
    document.addEventListener("scroll", closeSocialAvatarPickerOnViewport, true);
    window.addEventListener("resize", closeSocialAvatarPickerOnViewport);
  });
}

function toggleAccountMenu(forceOpen = null) {
  const nextOpen = forceOpen === null ? !state.accountOpen : Boolean(forceOpen);
  if (!nextOpen) closeSocialAvatarPicker();
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
  if (
    state.accountOpen
    && state.authUser
    && state.friendshipStatus !== "loading"
  ) {
    loadFriendships().catch((error) => console.warn("Friendship refresh failed", error));
    loadGameChallenges().catch((error) => console.warn("Game challenge refresh failed", error));
  }
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

function toggleStreakPopover(forceOpen = null) {
  const nextOpen = forceOpen === null ? !state.streakPopoverOpen : Boolean(forceOpen);
  if (state.streakPopoverOpen && !nextOpen) {
    animateBeforeRemoval(".streak-popover", () => {
      state.streakPopoverOpen = false;
      renderPreservingReaderScroll();
    }, { duration: 170 });
    return;
  }
  state.streakPopoverOpen = nextOpen;
  if (state.streakPopoverOpen) {
    state.settingsOpen = false;
    state.accountOpen = false;
    state.headerVersionMenuOpen = false;
  }
  renderPreservingReaderScroll();
}

function openStreakEncouragement(reference) {
  const returnTarget = captureReaderReturnTarget();
  if (!reference || !setReferenceFromString(reference)) return showToast("Reference is not available");
  if (returnTarget && !currentPassageMatchesReturnTarget(returnTarget)) {
    pushReaderReturnTarget(returnTarget);
    state.returnSelectionToolsOpen = false;
  }
  if (state.mode === "trivia") state.mode = "reader";
  state.streakPopoverOpen = false;
  state.pendingVerseFocus = true;
  recordHistory();
  render();
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
  if (state.settingsPopupPosition && popupDraggingEnabled()) {
    applyPopupPosition("settings");
    return;
  }
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

function popupDraggingEnabled() {
  return typeof window.PointerEvent !== "undefined";
}

function popupPositionState(kind) {
  return kind === "settings" ? state.settingsPopupPosition : state.shortcutsPopupPosition;
}

function setPopupPositionState(kind, position) {
  if (kind === "settings") state.settingsPopupPosition = position;
  else state.shortcutsPopupPosition = position;
}

function popupPositionClass(kind) {
  return popupPositionState(kind) ? "is-drag-positioned" : "";
}

function popupPositionStyle(kind) {
  const position = popupPositionState(kind);
  if (!position) return "";
  const sizeStyles = [
    Number.isFinite(position.width) ? `--popup-width: ${Math.round(position.width)}px;` : "",
    Number.isFinite(position.maxHeight) ? `--popup-max-height: ${Math.round(position.maxHeight)}px;` : "",
  ].filter(Boolean).join(" ");
  return `style="--popup-left: ${Math.round(position.left)}px; --popup-top: ${Math.round(position.top)}px; ${sizeStyles}"`;
}

function draggablePopupElement(kind) {
  if (kind === "help") return document.querySelector(".shortcut-panel.draggable-popup");
  const candidates = [
    document.querySelector(".mobile-settings-popover.draggable-popup"),
    document.querySelector(".settings-popover.open.draggable-popup"),
  ].filter(Boolean);
  return candidates.find(isElementVisible) || candidates[0] || null;
}

function clampPopupPosition(element, position) {
  const viewport = fixedPopoverViewport();
  const gutter = 12;
  const viewportLeft = viewport.offsetLeft || 0;
  const viewportTop = viewport.offsetTop || 0;
  const minLeft = viewportLeft + gutter;
  const minTop = viewportTop + gutter;
  const maxLeft = Math.max(minLeft, viewportLeft + viewport.width - element.offsetWidth - gutter);
  const maxTop = Math.max(minTop, viewportTop + viewport.height - element.offsetHeight - gutter);
  return {
    ...position,
    left: Math.round(Math.min(maxLeft, Math.max(minLeft, position.left))),
    top: Math.round(Math.min(maxTop, Math.max(minTop, position.top))),
  };
}

function applyPopupPosition(kind) {
  const position = popupPositionState(kind);
  const element = draggablePopupElement(kind);
  if (!position || !element || !popupDraggingEnabled()) return;
  element.classList.add("is-drag-positioned");
  element.style.setProperty("--popup-left", `${Math.round(position.left)}px`);
  element.style.setProperty("--popup-top", `${Math.round(position.top)}px`);
  if (Number.isFinite(position.width)) element.style.setProperty("--popup-width", `${Math.round(position.width)}px`);
  if (Number.isFinite(position.maxHeight)) element.style.setProperty("--popup-max-height", `${Math.round(position.maxHeight)}px`);
  const clamped = clampPopupPosition(element, position);
  setPopupPositionState(kind, clamped);
  element.style.setProperty("--popup-left", `${clamped.left}px`);
  element.style.setProperty("--popup-top", `${clamped.top}px`);
}

function clearRenderedPopupPosition(kind) {
  const element = draggablePopupElement(kind);
  if (!element) return;
  element.classList.remove("is-drag-positioned", "is-popup-dragging");
  element.style.removeProperty("--popup-left");
  element.style.removeProperty("--popup-top");
  element.style.removeProperty("--popup-width");
  element.style.removeProperty("--popup-max-height");
}

function refreshDraggedPopupPositions() {
  if (!popupDraggingEnabled()) {
    if (activePopupDrag) finishPopupDrag();
    setPopupPositionState("settings", null);
    setPopupPositionState("help", null);
    clearRenderedPopupPosition("settings");
    clearRenderedPopupPosition("help");
    return;
  }
  applyPopupPosition("settings");
  applyPopupPosition("help");
}

function beginPopupDrag(event) {
  if (!popupDraggingEnabled() || event.button !== 0) return;
  if (event.target.closest?.("button, a, input, select, textarea, label")) return;
  const handle = event.currentTarget;
  const kind = handle.dataset.popupDragHandle;
  const element = draggablePopupElement(kind);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const viewport = fixedPopoverViewport();
  const position = {
    left: (viewport.offsetLeft || 0) + rect.left,
    top: (viewport.offsetTop || 0) + rect.top,
    width: rect.width,
    maxHeight: Math.min(rect.height, Math.max(180, viewport.height - 24)),
  };
  setPopupPositionState(kind, position);
  applyPopupPosition(kind);
  activePopupDrag = {
    kind,
    element,
    handle,
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };
  element.classList.add("is-popup-dragging");
  handle.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", movePopupDrag, { passive: false });
  window.addEventListener("pointerup", finishPopupDrag);
  window.addEventListener("pointercancel", finishPopupDrag);
  event.preventDefault();
}

function movePopupDrag(event) {
  if (!activePopupDrag || event.pointerId !== activePopupDrag.pointerId) return;
  const viewport = fixedPopoverViewport();
  const nextPosition = clampPopupPosition(activePopupDrag.element, {
    ...popupPositionState(activePopupDrag.kind),
    left: (viewport.offsetLeft || 0) + event.clientX - activePopupDrag.offsetX,
    top: (viewport.offsetTop || 0) + event.clientY - activePopupDrag.offsetY,
  });
  setPopupPositionState(activePopupDrag.kind, nextPosition);
  activePopupDrag.element.style.setProperty("--popup-left", `${nextPosition.left}px`);
  activePopupDrag.element.style.setProperty("--popup-top", `${nextPosition.top}px`);
  event.preventDefault();
}

function finishPopupDrag(event) {
  if (!activePopupDrag || (event?.pointerId != null && event.pointerId !== activePopupDrag.pointerId)) return;
  const { element, handle, pointerId } = activePopupDrag;
  element.classList.remove("is-popup-dragging");
  if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
  activePopupDrag = null;
  window.removeEventListener("pointermove", movePopupDrag);
  window.removeEventListener("pointerup", finishPopupDrag);
  window.removeEventListener("pointercancel", finishPopupDrag);
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

function parallelVersionMenuPositionFor(trigger) {
  const viewport = fixedPopoverViewport();
  const triggerRect = trigger.getBoundingClientRect();
  const gutter = 8;
  const viewportLeft = viewport.offsetLeft || 0;
  const viewportTop = viewport.offsetTop || 0;
  const top = Math.round(viewportTop + triggerRect.bottom + gutter);
  const menuWidth = Math.min(310, Math.max(0, viewport.width - gutter * 2));
  const maxLeft = viewportLeft + viewport.width - menuWidth - gutter;
  const left = Math.max(viewportLeft + gutter, Math.min(Math.round(viewportLeft + triggerRect.left), maxLeft));
  const maxHeight = Math.max(96, Math.round(viewport.height - (top - viewportTop) - gutter));
  return { top, left, maxHeight };
}

async function handleAccountSubmit(event, prefix = "") {
  event.preventDefault();
  const submitter = event.submitter;
  const action = submitter?.dataset.authAction || "signin";
  const suffix = prefix ? `${prefix}-` : "";
  const email = document.getElementById(`${suffix}accountEmail`)?.value.trim();
  const password = document.getElementById(`${suffix}accountPassword`)?.value || "";
  if (!email || !password) return;
  state.authEmailCueId = "";
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  const outgoingUserId = state.authUser?.id || "";
  state.authBusy = true;
  state.authMessage = action === "signup" ? "Creating your account..." : "Signing you in...";
  renderPreservingReaderScroll();
  try {
    if (state.authUser) {
      const outgoingSnapshot = captureCloudSnapshot();
      await rememberCurrentAccountSession(client);
      saveSnapshotForOwner(outgoingUserId, outgoingSnapshot);
      setPendingAccountSwitch(true);
      clearTimeout(cloudSyncTimer);
      try {
        await upsertCloudSnapshot(outgoingSnapshot, { quiet: true });
      } catch (error) {
        console.warn("Final account sync before adding an account failed", error);
      }
      await unlinkPushSubscriptionFromCurrentAccount();
    }
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
    if (session?.user) {
      rememberAuthenticatedAccount(session.user);
      rememberAuthenticatedSession(session);
      state.accountSwitching = false;
      state.accountAddOpen = false;
      await Promise.all([loadCloudSync(), loadSocialProfile()]);
      maybeOfferPushNotifications();
      if (outgoingUserId && outgoingUserId !== session.user.id) {
        showAccountSwitchNotification(session.user);
      }
    }
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
  const emailId = `${suffix}accountEmail`;
  const email = document.getElementById(emailId)?.value.trim();
  if (!email) {
    state.authEmailCueId = emailId;
    state.authMessage = "Enter your email first, then choose Forgot your password.";
    renderPreservingReaderScroll();
    requestAnimationFrame(() => document.getElementById(emailId)?.focus({ preventScroll: true }));
    return showToast("Enter your email first");
  }
  state.authEmailCueId = "";
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
    if (state.authUser) {
      const outgoingUserId = state.authUser.id;
      const outgoingSnapshot = captureCloudSnapshot();
      await rememberCurrentAccountSession(client);
      saveSnapshotForOwner(outgoingUserId, outgoingSnapshot);
      setPendingAccountSwitch(true);
      clearTimeout(cloudSyncTimer);
      try {
        await upsertCloudSnapshot(outgoingSnapshot, { quiet: true });
      } catch (error) {
        console.warn("Final account sync before Google sign in failed", error);
      }
      await unlinkPushSubscriptionFromCurrentAccount();
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        ...(rememberedAccounts().length || pendingAccountSwitch()
          ? { queryParams: { prompt: "select_account" } }
          : {}),
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

async function activateRememberedAccount(account, savedSession = rememberedAccountSession(account?.userId)) {
  const client = createSupabaseClient();
  if (!client) return showToast("Supabase is not connected yet");
  if (!account?.userId || !savedSession) return;
  let previousSession = null;
  let previousUserId = state.authUser?.id || "";
  const snapshot = captureCloudSnapshot();
  state.authBusy = true;
  state.authMessage = `Switching to ${account.email}…`;
  state.syncMessage = "Opening the selected account…";
  renderPreservingReaderScroll();
  try {
    previousSession = await rememberCurrentAccountSession(client);
    previousUserId = previousSession?.user?.id || previousUserId;
    if (previousUserId) saveSnapshotForOwner(previousUserId, snapshot);
    setPendingAccountSwitch(true);
    clearTimeout(cloudSyncTimer);
    if (previousUserId && previousUserId !== account.userId) {
      try {
        await upsertCloudSnapshot(snapshot, { quiet: true });
      } catch (error) {
        console.warn("Final account sync before switching failed", error);
      }
      await unlinkPushSubscriptionFromCurrentAccount();
    }
    const { data, error } = await client.auth.setSession({
      access_token: savedSession.access_token,
      refresh_token: savedSession.refresh_token,
    });
    if (error) throw error;
    const session = data?.session || null;
    if (!session?.user || session.user.id !== account.userId) {
      throw new Error("The saved session did not match the selected account.");
    }
    rememberAuthenticatedSession(session);
    rememberAuthenticatedAccount(session.user);
    state.authUser = session.user;
    state.accountSwitching = false;
    state.accountAddOpen = false;
    state.authMessage = "";
    state.syncStatus = "loading";
    state.syncMessage = "Loading your saved settings…";
    showAccountSwitchNotification(session.user, account);
  } catch (error) {
    console.warn("Saved account switch failed", error);
    removeRememberedAccountSession(account.userId);
    if (previousSession?.access_token && previousSession?.refresh_token) {
      try {
        const { data: restoredData, error: restoreError } = await client.auth.setSession({
          access_token: previousSession.access_token,
          refresh_token: previousSession.refresh_token,
        });
        if (restoreError) throw restoreError;
        rememberAuthenticatedSession(restoredData?.session);
        state.authUser = restoredData?.session?.user || null;
      } catch (restoreError) {
        console.warn("Previous account session could not be restored", restoreError);
      }
    }
    state.accountSwitching = Boolean(state.authUser);
    state.accountAddOpen = true;
    state.authMessage = "That saved session is no longer valid. Sign in once to reconnect the account.";
    state.syncMessage = state.authUser
      ? "Your current account is still active."
      : "Sign in to reconnect this account.";
    showToast("Sign in required for this account");
  } finally {
    state.authBusy = false;
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
  const user = state.authUser;
  const snapshot = captureCloudSnapshot();
  if (user?.id) saveSnapshotForOwner(user.id, snapshot);
  setPendingAccountSwitch(false);
  state.authBusy = true;
  state.syncMessage = "Saving this account before sign out…";
  renderPreservingReaderScroll();
  try {
    clearTimeout(cloudSyncTimer);
    if (user?.id) {
      try {
        await upsertCloudSnapshot(snapshot, { quiet: true });
      } catch (error) {
        console.warn("Final account sync before sign out failed", error);
      }
    }
    if (user?.id) removeRememberedAccountSession(user.id);
    await unlinkPushSubscriptionFromCurrentAccount();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
    state.authUser = null;
    resetSocialProfileState();
    resetFriendshipState();
    resetGameChallengeState();
    activateGuestBrowserData();
    state.pushPromptVisible = false;
    state.accountOpen = true;
    state.accountSwitching = false;
    state.accountAddOpen = false;
    state.passwordChangeOpen = false;
    state.passwordRecoveryMode = false;
    state.authMessage = "";
    state.syncStatus = "local";
    state.syncMessage = "Signed out. Guest data is active on this browser.";
  } catch (error) {
    console.warn("Sign out failed", error);
    try {
      await rememberCurrentAccountSession(client);
    } catch (sessionError) {
      console.warn("Signed-in session could not be re-cached", sessionError);
    }
    state.authMessage = "Could not sign out yet. Please try again.";
  } finally {
    state.authBusy = false;
    renderPreservingReaderScroll();
  }
}

function switchAccount() {
  if (!state.authUser) return;
  rememberCurrentAccountSession().catch((error) => {
    console.warn("Current account session could not be cached", error);
  });
  saveSnapshotForOwner(state.authUser.id, captureCloudSnapshot());
  setPendingAccountSwitch(true);
  state.accountSwitching = true;
  state.accountAddOpen = rememberedAccounts().every((account) => account.userId === state.authUser.id);
  state.authMessage = "";
  renderPreservingReaderScroll();
  requestAnimationFrame(() => {
    document.querySelector(".remembered-account-use, [id$='addAccountButton']")?.focus?.();
  });
}

function toggleAddAccount() {
  state.accountAddOpen = !state.accountAddOpen;
  state.authMessage = "";
  renderPreservingReaderScroll();
  if (state.accountAddOpen) {
    requestAnimationFrame(() => document.querySelector("[id$='accountEmail']")?.focus?.());
  }
}

function cancelAccountSwitch() {
  state.accountSwitching = false;
  state.accountAddOpen = false;
  state.authMessage = "";
  setPendingAccountSwitch(false);
  renderPreservingReaderScroll();
}

function captureCloudSnapshot() {
  return {
    settings: {
      versions: state.versions,
      versionsUpdatedAt: state.versionsUpdatedAt,
      themeMode: localStorage.getItem("lw_theme") || "system",
      themePresetLight: localStorage.getItem("lw_theme_preset_light") || defaultThemePresets.light,
      themePresetDark: localStorage.getItem("lw_theme_preset_dark") || defaultThemePresets.dark,
      scriptureFont: state.scriptureFont,
      customScriptureFont: state.customScriptureFont,
      customHighlightColor: state.customHighlightColor,
      textScale: state.textScale,
      interfaceTextSize: state.interfaceTextSize,
      autoScrollEnabled: state.autoScrollEnabled,
      autoScrollSpeed: state.autoScrollSpeed,
      edgeChapterNavigationEnabled: state.edgeChapterNavigationEnabled,
      paragraphLayout: state.paragraphLayout,
      printLayout: state.printLayout,
      printVerseNumbers: state.printVerseNumbers,
      printFullVersionName: state.printFullVersionName,
      sectionHeadings: state.sectionHeadings,
      redLetters: state.redLetters,
      strongNumbers: state.strongNumbers,
      sideToolbarPosition: state.sideToolbarPosition,
      focusMode: state.focusMode,
      libraryOpen: state.libraryOpen,
      presentationTheme: state.presentationTheme,
      presentationTextScale: state.presentationTextScale,
      startBigScreen: state.startBigScreen,
      startVerseOfDay: state.startVerseOfDay,
      showStreakPopup: state.showStreakPopup,
      challengeQuietMode: state.challengeQuietMode,
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
  const versionSettings = latestVersionSettings(cloud.settings, localSnapshot.settings);
  return {
    settings: {
      ...localSnapshot.settings,
      ...cloud.settings,
      ...versionSettings,
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

function normalizedVersions(versions = [], fallback = ["BSB", "KJV"]) {
  const normalized = uniqueList(Array.isArray(versions) ? versions : [])
    .filter((version) => translationCodes.includes(version));
  const selected = normalized.length
    ? normalized
    : uniqueList(fallback).filter((version) => translationCodes.includes(version));
  if (selected.length && !selected.some(isBundledTranslation)) selected.unshift("BSB");
  return selected.length ? selected : ["BSB", "KJV"];
}

function normalizedVersionsUpdatedAt(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function latestVersionSettings(cloudSettings = {}, localSettings = {}) {
  const cloudUpdatedAt = normalizedVersionsUpdatedAt(cloudSettings.versionsUpdatedAt);
  const localUpdatedAt = normalizedVersionsUpdatedAt(localSettings.versionsUpdatedAt);
  if (!cloudUpdatedAt && !localUpdatedAt) {
    return {
      versions: mergeVersions(cloudSettings.versions, localSettings.versions),
      versionsUpdatedAt: "",
    };
  }
  const useLocal = !cloudUpdatedAt || (localUpdatedAt && localUpdatedAt >= cloudUpdatedAt);
  const selectedSettings = useLocal ? localSettings : cloudSettings;
  return {
    versions: normalizedVersions(selectedSettings.versions),
    versionsUpdatedAt: useLocal ? localUpdatedAt : cloudUpdatedAt,
  };
}

function persistVersions({ changed = false } = {}) {
  if (changed) state.versionsUpdatedAt = new Date().toISOString();
  localStorage.setItem("lw_versions", JSON.stringify(state.versions));
  if (state.versionsUpdatedAt) localStorage.setItem("lw_versions_updated_at", state.versionsUpdatedAt);
  else localStorage.removeItem("lw_versions_updated_at");
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
    days: normalizedStreakDays([...(cloud.days || []), ...(local.days || [])]),
  };
}

function applyCloudSnapshot(snapshot) {
  const settings = snapshot.settings || {};
  state.versions = normalizedVersions(settings.versions);
  state.versionsUpdatedAt = normalizedVersionsUpdatedAt(settings.versionsUpdatedAt);
  state.theme = settings.themeMode === "dark" || settings.themeMode === "light" ? settings.themeMode : savedTheme();
  state.themePreset = settings[`themePreset${state.theme === "dark" ? "Dark" : "Light"}`] || savedThemePreset(state.theme);
  state.scriptureFont = normalizedScriptureFont(settings.scriptureFont);
  state.customScriptureFont = sanitizeFontName(settings.customScriptureFont || "");
  state.customHighlightColor = normalizeHighlightColor(settings.customHighlightColor) || state.customHighlightColor;
  state.textScale = clampTextScale(Number(settings.textScale) || 1);
  state.interfaceTextSize = normalizedInterfaceTextSize(
    settings.interfaceTextSize || localStorage.getItem("lw_interface_text_size"),
  );
  state.autoScrollEnabled = typeof settings.autoScrollEnabled === "boolean"
    ? settings.autoScrollEnabled
    : localStorage.getItem("lw_auto_scroll_enabled") === "true";
  state.autoScrollSpeed = normalizedAutoScrollSpeed(
    settings.autoScrollSpeed || localStorage.getItem("lw_auto_scroll_speed"),
  );
  state.edgeChapterNavigationEnabled = typeof settings.edgeChapterNavigationEnabled === "boolean"
    ? settings.edgeChapterNavigationEnabled
    : localStorage.getItem("lw_edge_chapter_navigation_enabled") !== "false";
  state.paragraphLayout = typeof settings.paragraphLayout === "boolean"
    ? settings.paragraphLayout
    : savedParagraphLayout();
  state.printLayout = printLayoutCodes.includes(settings.printLayout) ? settings.printLayout : savedPrintLayout();
  state.printVerseNumbers = typeof settings.printVerseNumbers === "boolean"
    ? settings.printVerseNumbers
    : localStorage.getItem("lw_print_verse_numbers") !== "false";
  state.printFullVersionName = typeof settings.printFullVersionName === "boolean"
    ? settings.printFullVersionName
    : localStorage.getItem("lw_print_full_version_name") === "true";
  state.sectionHeadings = settings.sectionHeadings !== false;
  state.redLetters = typeof settings.redLetters === "boolean" ? settings.redLetters : savedRedLetters();
  state.strongNumbers = typeof settings.strongNumbers === "boolean" ? settings.strongNumbers : savedStrongNumbers();
  state.sideToolbarPosition = settings.sideToolbarPosition === "right" ? "right" : "left";
  state.focusMode = Boolean(settings.focusMode);
  state.libraryOpen = settings.libraryOpen !== false;
  state.presentationTheme = presentationThemeCodes.includes(settings.presentationTheme) ? settings.presentationTheme : defaultPresentationTheme;
  state.presentationTextScale = clampPresentationTextScale(
    Number(settings.presentationTextScale ?? localStorage.getItem("lw_presentation_text_scale")) || defaultPresentationTextScale,
  );
  state.startBigScreen = settings.startBigScreen !== false;
  state.startVerseOfDay = settings.startVerseOfDay !== false;
  state.showStreakPopup = settings.showStreakPopup !== false;
  state.challengeQuietMode = typeof settings.challengeQuietMode === "boolean"
    ? settings.challengeQuietMode
    : localStorage.getItem("lw_challenge_quiet_mode") === "true";
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
  persistVersions();
  if (settings.themeMode === "dark" || settings.themeMode === "light") localStorage.setItem("lw_theme", settings.themeMode);
  else localStorage.removeItem("lw_theme");
  localStorage.setItem("lw_theme_preset_light", settings.themePresetLight || defaultThemePresets.light);
  localStorage.setItem("lw_theme_preset_dark", settings.themePresetDark || defaultThemePresets.dark);
  localStorage.setItem("lw_scripture_font", state.scriptureFont);
  localStorage.setItem("lw_custom_scripture_font", state.customScriptureFont);
  localStorage.setItem("lw_custom_highlight_color", state.customHighlightColor);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  localStorage.setItem("lw_interface_text_size", state.interfaceTextSize);
  localStorage.setItem("lw_auto_scroll_enabled", String(state.autoScrollEnabled));
  localStorage.setItem("lw_auto_scroll_speed", state.autoScrollSpeed);
  localStorage.setItem("lw_edge_chapter_navigation_enabled", String(state.edgeChapterNavigationEnabled));
  localStorage.setItem("lw_paragraph_layout", String(state.paragraphLayout));
  localStorage.setItem("lw_print_layout", state.printLayout);
  localStorage.setItem("lw_print_verse_numbers", String(state.printVerseNumbers));
  localStorage.setItem("lw_print_full_version_name", String(state.printFullVersionName));
  localStorage.setItem("lw_section_headings", String(state.sectionHeadings));
  localStorage.setItem("lw_red_letters", String(state.redLetters));
  localStorage.setItem("lw_strong_numbers", String(state.strongNumbers));
  localStorage.setItem("lw_side_toolbar_position", state.sideToolbarPosition);
  localStorage.setItem("lw_focus_mode", String(state.focusMode));
  localStorage.setItem("lw_library_open", String(state.libraryOpen));
  localStorage.setItem("lw_presentation_theme", state.presentationTheme);
  localStorage.setItem("lw_presentation_text_scale", String(state.presentationTextScale));
  localStorage.setItem("lw_start_big_screen", String(state.startBigScreen));
  localStorage.setItem("lw_start_verse_of_day", String(state.startVerseOfDay));
  localStorage.setItem("lw_show_streak_popup", String(state.showStreakPopup));
  localStorage.setItem("lw_challenge_quiet_mode", String(state.challengeQuietMode));
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
  saveSnapshotForOwner(accountDataOwner() || guestDataOwner, snapshot);
}

async function loadCloudSync() {
  const client = createSupabaseClient();
  if (!client) return;
  state.authBusy = true;
  state.syncStatus = "loading";
  state.syncMessage = "Loading your saved settings...";
  try {
    const session = await authenticatedSupabaseSession(client);
    const userId = session?.user?.id;
    if (!userId) {
      state.syncStatus = "local";
      state.syncMessage = "Sign in to sync across devices.";
      return;
    }
    rememberAuthenticatedAccount(session.user);
    const localSnapshot = localSnapshotForAuthenticatedUser(userId);
    setAccountDataOwner(userId);
    applyCloudSnapshot(localSnapshot);
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
    if (state.authUser?.id) setPendingAccountSwitch(false);
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
  setAccountDataOwner(userId);
  saveSnapshotForOwner(userId, snapshot);
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
  if (state.isVerseOfDayActive && state.verseOfDayItem) return verseOfDayReaderView();
  const version = state.versions[0] || "BSB";
  const chapter = currentChapter();
  const useParagraphs = shouldUseParagraphLayout(version, chapter);
  return `
    <h1 class="section-title">${chapter.title}</h1>
    ${selectionBar()}
      ${useParagraphs ? paragraphReaderView(chapter.verses, version) : chapter.verses.map((verse) => `
      ${sectionHeadingsMarkup(verse, version)}
      <p class="verse ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
        <span class="verse-marker">
          <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
          ${verseNoteIndicatorsMarkup(verse.n)}
        </span>
        <span class="verse-text">${renderStrongText(verse, version)}</span>
        ${verseCopyButton(verse.n)}
      </p>
    `).join("")}
    ${state.isVerseOfDayActive ? verseOfDayAttributionMarkup() : apiBibleAttributionMarkup([version])}
  `;
}

function verseOfDayReaderView() {
  const item = state.verseOfDayItem;
  if (!item) return "";
  return `
    <section class="verse-of-day-reader" aria-labelledby="verseOfDayReference">
      <h1 class="section-title" id="verseOfDayReference">${escapeHtml(item.reference)}</h1>
      <p class="verse-of-day-copy">${escapeHtml(item.verseText)}</p>
      <button class="ghost-btn verse-of-day-read-button" id="verseOfDayReadInBible" type="button">
        <span aria-hidden="true">${icons.book}</span>
        <span>Read in Bible</span>
      </button>
      ${verseOfDayAttributionMarkup()}
    </section>
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

function sectionHeadingsForVerse(verse, version) {
  if (!state.sectionHeadings) return [];
  const headings = verse?.sectionHeadings?.[version];
  if (!Array.isArray(headings)) return [];
  return headings
    .map((heading) => ({
      text: String(heading?.text || "").trim(),
      level: Math.max(1, Math.min(4, Number(heading?.level) || 1)),
    }))
    .filter((heading) => heading.text);
}

function groupSectionHeadings(headings) {
  return headings.reduce((groups, heading) => {
    const startsNumberedSaying = /^Saying\s+\d+$/i.test(heading.text);
    if (!groups.length || startsNumberedSaying) groups.push([]);
    groups[groups.length - 1].push(heading);
    return groups;
  }, []);
}

function sectionHeadingsMarkup(verse, version, className = "") {
  const headings = sectionHeadingsForVerse(verse, version);
  if (!headings.length) return "";
  const classes = ["scripture-heading-group", className].filter(Boolean).join(" ");
  const linkReferences = !className.split(/\s+/).includes("print-heading-group");
  return groupSectionHeadings(headings)
    .map((group) => `
      <div class="${classes}" data-heading-verse="${verse.n}">
        ${group.map((heading) => `
          <h2 class="scripture-heading scripture-heading-level-${heading.level}">${scriptureHeadingTextMarkup(heading.text, { linkReferences })}</h2>
        `).join("")}
      </div>
    `)
    .join("");
}

function scriptureHeadingTextMarkup(text, options = {}) {
  const referenceParts = options.linkReferences === false ? null : scriptureHeadingReferenceParts(text);
  if (!referenceParts) return escapeHtml(text);
  return `(${referenceParts
    .map((part) => `<button class="scripture-heading-reference-link" type="button" data-heading-reference="${escapeHtml(part.reference)}" aria-label="Open ${escapeHtml(part.display)}">${escapeHtml(part.display)}</button>`)
    .join('<span class="scripture-heading-reference-separator">; </span>')})`;
}

function scriptureHeadingReferenceParts(text) {
  const match = String(text || "").trim().match(/^\((.+)\)$/);
  if (!match) return null;
  const parts = match[1]
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((display) => {
      const reference = normalizeHeadingReference(display);
      return parsePassageReference(reference) ? { display, reference } : null;
    });
  return parts.length && parts.every(Boolean) ? parts : null;
}

function normalizeHeadingReference(value) {
  return String(value || "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
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
  const blocks = [];
  let group = [];
  const flushGroup = () => {
    if (!group.length) return;
    blocks.push(`
      <p class="scripture-paragraph">
        ${group.map((verse) => `
          <span class="paragraph-verse ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
            <span class="paragraph-verse-marker">
              <button class="verse-num paragraph-verse-num" data-verse-actions="${verse.n}" aria-label="Actions for ${state.reference}:${verse.n}" aria-expanded="false">${verse.n}</button>
              ${verseNoteIndicatorsMarkup(verse.n)}
            </span>
            <span class="verse-text">${renderStrongText(verse, version)}</span>
          </span>
        `).join(" ")}
      </p>
    `);
    group = [];
  };
  verses.forEach((verse) => {
    if (sectionHeadingsForVerse(verse, version).length) {
      flushGroup();
      blocks.push(sectionHeadingsMarkup(verse, version, "scripture-heading-group-paragraph"));
    }
    if (paragraphStartForVerse(verse, version)) flushGroup();
    group.push(verse);
  });
  flushGroup();
  return `
    <div class="scripture-paragraphs" data-paragraph-version="${escapeHtml(version)}">
      ${blocks.join("")}
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
  if (game?.type !== "book-sprint") return;
  updateLiveBookSprintTimes();
  if (!timer) return;
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

function gameChallengePlayerComparison(challenge, first, second) {
  if (challenge?.gameType === "book-sprint") {
    const firstComplete = Boolean(first?.completedAt);
    const secondComplete = Boolean(second?.completedAt);
    if (firstComplete !== secondComplete) return firstComplete ? -1 : 1;
    const firstElapsed = first?.elapsedMs === null ? Number.POSITIVE_INFINITY : Number(first?.elapsedMs);
    const secondElapsed = second?.elapsedMs === null ? Number.POSITIVE_INFINITY : Number(second?.elapsedMs);
    if (firstComplete && firstElapsed !== secondElapsed) return firstElapsed - secondElapsed;
    if ((first?.progress ?? 0) !== (second?.progress ?? 0)) {
      return (second?.progress ?? 0) - (first?.progress ?? 0);
    }
  }
  if ((first?.score ?? 0) !== (second?.score ?? 0)) return (second?.score ?? 0) - (first?.score ?? 0);
  return 0;
}

function gameChallengeRankedPlayers(challenge, players = gameChallengeAcceptedPlayers(challenge?.id)) {
  return [...players].sort((first, second) => (
    gameChallengePlayerComparison(challenge, first, second)
    || String(first?.userId || "").localeCompare(String(second?.userId || ""))
  ));
}

function gameChallengePlayerRank(challenge, player, players = gameChallengeAcceptedPlayers(challenge?.id)) {
  if (!player) return 0;
  return 1 + players.filter((other) => gameChallengePlayerComparison(challenge, other, player) < 0).length;
}

function gameChallengeResultLabel(
  challenge,
  selfPlayer,
  players = gameChallengeAcceptedPlayers(challenge?.id),
) {
  if (!selfPlayer || !players.length) return "Waiting for player results";
  const completedCount = players.filter((player) => player.completedAt).length;
  const rank = gameChallengePlayerRank(challenge, selfPlayer, players);
  if (completedCount < players.length) {
    return `${completedCount} of ${players.length} finished · You’re #${rank}`;
  }
  const tiedCount = players.filter((player) => (
    player.userId !== selfPlayer.userId
    && gameChallengePlayerComparison(challenge, player, selfPlayer) === 0
  )).length;
  return tiedCount
    ? `You tied for #${rank} of ${players.length}`
    : `You finished #${rank} of ${players.length}`;
}

function gameChallengeBookSprintElapsedMs(challenge, player, now = Date.now()) {
  if (player?.elapsedMs !== null && player?.elapsedMs !== undefined) {
    return Math.max(0, Number(player.elapsedMs) || 0);
  }
  const startedAt = Date.parse(challenge?.startedAt || "");
  return Number.isFinite(startedAt) ? Math.max(0, now - startedAt) : 0;
}

function liveBookSprintPlayerResult(challenge, player) {
  const elapsed = formatGameTime(gameChallengeBookSprintElapsedMs(challenge, player));
  return `
    <small>${player.completedAt ? "Finished" : "In progress"}</small>
    <strong
      class="live-challenge-time"
      ${player.completedAt ? "" : 'data-live-book-sprint-running="true"'}
    >${elapsed}</strong>
  `;
}

function liveGameChallengeScoreboard() {
  const challenge = activeGameChallenge();
  if (!challenge || challenge.status === "pending") return "";
  const players = gameChallengeAcceptedPlayers(challenge.id);
  const rankedPlayers = gameChallengeRankedPlayers(challenge, players);
  const selfPlayer = gameChallengePlayer(challenge.id);
  const roundCount = challenge.roundCount || 0;
  const result = gameChallengeResultLabel(challenge, selfPlayer, players);
  return `
    <section class="live-challenge-scoreboard" aria-label="Live room leaderboard">
      <div class="live-challenge-scoreboard-head">
        <span><span class="live-status-dot" aria-hidden="true"></span>${challenge.status === "completed" ? "Final standings" : "Live room"}</span>
        <strong>${escapeHtml(gameChallengeTitle(challenge.gameType))} · ${players.length} players</strong>
      </div>
      <ol class="live-challenge-players">
        ${rankedPlayers.map((player) => {
          const profile = player.userId === state.authUser?.id ? state.socialProfile : friendshipProfile(player.userId);
          const name = player.userId === state.authUser?.id
            ? "You"
            : profile?.displayName || profile?.username || "Friend";
          const rank = gameChallengePlayerRank(challenge, player, players);
          return `
            <li class="${player.completedAt ? "complete" : ""} ${player.userId === state.authUser?.id ? "is-you" : ""}">
              <span class="live-challenge-rank">#${rank}</span>
              ${socialProfileAvatarMarkup(profile, "live-challenge-avatar")}
              <span class="live-challenge-name">${escapeHtml(name)}</span>
              ${challenge.gameType === "book-sprint"
                ? liveBookSprintPlayerResult(challenge, player)
                : `
                  <small>${Math.min(roundCount, player.progress ?? 0)} / ${roundCount}</small>
                  <strong>${player.score ?? 0}</strong>
                `}
            </li>
          `;
        }).join("")}
      </ol>
      <p role="status" aria-live="polite">${escapeHtml(result)}</p>
    </section>
  `;
}

function updateLiveBookSprintTimes(challenge = activeGameChallenge()) {
  if (challenge?.gameType !== "book-sprint") return;
  const elapsed = formatGameTime(gameChallengeBookSprintElapsedMs(challenge, null));
  document.querySelectorAll("[data-live-book-sprint-running]").forEach((timer) => {
    timer.textContent = elapsed;
  });
}

function refreshLiveGameChallengeScoreboard() {
  const current = document.querySelector(".live-challenge-scoreboard");
  const markup = liveGameChallengeScoreboard();
  if (!current || !markup) return false;
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  const replacement = template.content.firstElementChild;
  if (!replacement) return false;
  current.replaceWith(replacement);
  updateLiveBookSprintTimes();
  return true;
}

function gameRoomLobbyPlayer(challenge, player) {
  const isSelf = player.userId === state.authUser?.id;
  const profile = isSelf ? state.socialProfile : friendshipProfile(player.userId);
  const name = isSelf ? "You" : profile?.displayName || profile?.username || "Friend";
  const online = isSelf || state.gameRoomOnlineUserIds.includes(player.userId);
  const status = player.inviteStatus === "invited"
    ? "Invited"
    : player.ready ? "Ready" : "Joined";
  return `
    <li class="game-room-player ${player.ready ? "is-ready" : ""} ${player.inviteStatus === "invited" ? "is-invited" : ""}">
      ${socialProfileAvatarMarkup(profile, "game-room-player-avatar")}
      <span class="game-room-player-copy">
        <strong>${escapeHtml(name)}</strong>
        <small>${player.isHost ? "Host · " : ""}${escapeHtml(status)}</small>
      </span>
      <span class="game-room-presence ${online ? "is-online" : ""}">
        <span aria-hidden="true"></span>${online ? "Online" : "Offline"}
      </span>
    </li>
  `;
}

function gameRoomLobbyCard(challenge) {
  const players = gameChallengePlayersFor(challenge.id)
    .filter((player) => ["accepted", "invited"].includes(player.inviteStatus))
    .sort((first, second) => (
      Number(second.isHost) - Number(first.isHost)
      || Number(second.inviteStatus === "accepted") - Number(first.inviteStatus === "accepted")
      || String(first.userId).localeCompare(String(second.userId))
    ));
  const acceptedPlayers = players.filter((player) => player.inviteStatus === "accepted");
  const invitedPlayers = players.filter((player) => player.inviteStatus === "invited");
  const selfPlayer = gameChallengePlayer(challenge.id);
  const isHost = challenge.challengerId === state.authUser?.id;
  const everyoneReady = acceptedPlayers.length >= 2 && acceptedPlayers.every((player) => player.ready);
  const busy = Boolean(state.gameChallengeActionBusyId);
  return `
    <section class="challenge-setup-card game-room-lobby" aria-labelledby="gameRoomLobbyTitle">
      <div>
        <span>Waiting room</span>
        <strong id="gameRoomLobbyTitle">${escapeHtml(gameChallengeTitle(challenge.gameType))}</strong>
      </div>
      <p>${acceptedPlayers.length} of ${challenge.maxPlayers} joined${invitedPlayers.length ? ` · ${invitedPlayers.length} awaiting a reply` : ""}</p>
      <ul class="game-room-player-list">
        ${players.map((player) => gameRoomLobbyPlayer(challenge, player)).join("")}
      </ul>
      <div class="game-room-lobby-actions">
        ${selfPlayer?.ready
          ? gameChallengeActionButton("not-ready", "Not ready", challenge)
          : gameChallengeActionButton("ready", "I’m ready", challenge, { primary: true })}
        ${isHost ? `
          <button
            class="primary-btn friend-action-button"
            type="button"
            data-game-challenge-action="start-room"
            data-game-challenge-id="${escapeHtml(challenge.id)}"
            ${!everyoneReady || busy ? "disabled" : ""}
          >${state.gameChallengeActionBusyId === challenge.id ? "Starting…" : "Start game"}</button>
          ${gameChallengeActionButton("cancel", "Cancel room", challenge, { danger: true })}
        ` : '<span class="game-room-host-note">The host starts when joined players are ready.</span>'}
      </div>
      <small>${everyoneReady
        ? isHost ? "Everyone who joined is ready. You can start now." : "Everyone is ready. Waiting for the host."
        : acceptedPlayers.length < 2
          ? "At least one friend must join before the room can start."
          : "Players who have not answered do not block the room."}</small>
    </section>
  `;
}

function gameChallengeSetupCard() {
  if (!state.authUser || !state.socialProfile) {
    return `
      <section class="challenge-setup-card">
        <div>
          <span>Play with friends</span>
          <strong>Sign in to send live challenges</strong>
        </div>
        <small>Create a social profile and add a friend first.</small>
      </section>
    `;
  }
  const challenge = activeGameChallenge();
  if (challenge?.status === "pending") return gameRoomLobbyCard(challenge);
  const friends = friendshipCollections().friends.map((friendship) => {
    const userId = friendshipOtherUserId(friendship);
    return { userId, profile: friendshipProfile(userId) };
  }).filter((item) => item.profile);
  if (!friends.length) {
    return `
      <section class="challenge-setup-card">
        <div>
          <span>Play with friends</span>
          <strong>Add a friend to unlock live challenges</strong>
        </div>
      </section>
    `;
  }
  const friendIds = new Set(friends.map((item) => item.userId));
  state.challengeOpponentIds = state.challengeOpponentIds
    .filter((userId) => friendIds.has(userId))
    .slice(0, 9);
  const selectedCount = state.challengeOpponentIds.length;
  const busy = Boolean(state.gameChallengeActionBusyId);
  return `
    <section class="challenge-setup-card" aria-busy="${busy}">
      <div>
        <span>Play with friends</span>
        <strong>Invite up to 9 friends to a live room</strong>
      </div>
      <div class="challenge-friend-picker" role="group" aria-label="Friends to invite">
        ${friends.map(({ userId, profile }) => {
          const selected = state.challengeOpponentIds.includes(userId);
          return `
            <button
              class="challenge-friend-choice ${selected ? "is-selected" : ""}"
              type="button"
              data-challenge-friend="${escapeHtml(userId)}"
              aria-pressed="${selected}"
              ${busy ? "disabled" : ""}
            >
              ${socialProfileAvatarMarkup(profile, "challenge-friend-avatar")}
              <span>${escapeHtml(profile.displayName || `@${profile.username}`)}</span>
              <small>${selected ? "Selected" : "Invite"}</small>
            </button>
          `;
        }).join("")}
      </div>
      <div class="challenge-setup-actions">
        <span>${selectedCount ? `${selectedCount + 1} players including you` : "Choose at least one friend"}</span>
        <button class="primary-btn" id="sendGameChallenge" type="button" ${busy || !selectedCount ? "disabled" : ""}>
          ${state.gameChallengeActionBusyId === "room:create" ? "Creating…" : "Create room"}
        </button>
      </div>
      ${state.gameChallengeMessage ? `
        <p class="challenge-setup-status" role="status" aria-live="polite">
          ${escapeHtml(state.gameChallengeMessage)}
        </p>
      ` : ""}
    </section>
  `;
}

function triviaView() {
  const questions = triviaQuestions();
  const currentChallenge = activeGameChallenge();
  const waitingForLiveChallenge = currentChallenge?.status === "pending";
  const challengeSetupLock = waitingForLiveChallenge ? 'disabled aria-disabled="true"' : "";
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
      <article class="trivia-panel ${state.activeGameChallengeId ? "is-live-challenge" : ""}">
        <div class="trivia-header">
          <div>
            <div class="trivia-eyebrow">${gameTitle}</div>
            <h1>Games</h1>
          </div>
          <div class="trivia-score-chip">${triviaScoreLabel()}</div>
        </div>
        ${liveGameChallengeScoreboard()}
        ${state.triviaGame ? triviaGameView() : `
          <div class="trivia-setup">
            <div class="trivia-mode-tabs" role="tablist" aria-label="Game type">
              <button class="${state.triviaGameType === "trivia" ? "active" : ""}" data-trivia-mode="trivia" type="button" ${challengeSetupLock}>${icons.trivia}<span>Trivia</span></button>
              <button class="${isVerseOrder ? "active" : ""}" data-trivia-mode="verse-order" type="button" ${challengeSetupLock}>${icons.book}<span>Verse Order</span></button>
              <button class="${isReferenceRush ? "active" : ""}" data-trivia-mode="reference-rush" type="button" ${challengeSetupLock}>${icons.search}<span>Reference Rush</span></button>
              <button class="${isBookSprint ? "active" : ""}" data-trivia-mode="book-sprint" type="button" ${challengeSetupLock}>${icons.timer}<span>Book Sprint</span></button>
              <button class="${isWhoSaidIt ? "active" : ""}" data-trivia-mode="who-said-it" type="button" ${challengeSetupLock}>${icons.quote}<span>Who Said It?</span></button>
            </div>
            <p>${setupCopy}</p>
            <div class="trivia-setup-controls ${isVerseOrder ? "single-control" : isReferenceRush || isBookSprint || isWhoSaidIt ? "two-controls" : ""}">
              <label class="${isVerseOrder || isReferenceRush || isBookSprint || isWhoSaidIt ? "is-hidden" : ""}">
                <span>Category</span>
                <select id="triviaCategorySelect" ${challengeSetupLock}>${categoryOptions}</select>
              </label>
              <label class="${isVerseOrder ? "is-hidden" : ""}">
                <span>Difficulty</span>
                <select id="triviaDifficultySelect" ${challengeSetupLock}>${difficultyOptions}</select>
              </label>
              <label>
                <span>Round length</span>
                <select id="triviaCountSelect" ${challengeSetupLock}>${countOptions}</select>
              </label>
            </div>
            ${isReferenceRush ? `<p class="reference-rush-level-note">${escapeHtml(referenceRushDifficultyDescription(state.triviaDifficulty))}</p>` : ""}
            ${isReferenceRush ? `
              <button class="reference-rush-timer-option ${state.referenceRushTimed ? "active" : ""}" id="referenceRushTimerToggle" type="button" aria-pressed="${state.referenceRushTimed}" ${challengeSetupLock}>
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
            ${gameChallengeSetupCard()}
            ${waitingForLiveChallenge ? "" : `<button class="primary-btn trivia-start" id="startTriviaGame">${isVerseOrder ? icons.book : isReferenceRush ? icons.search : isBookSprint ? icons.timer : isWhoSaidIt ? icons.quote : icons.trivia}<span>Start ${gameTitle}</span></button>`}
          </div>
        `}
      </article>
    </section>
  `;
}

function triviaExitControl(game = state.triviaGame) {
  const challenge = game?.challengeId ? activeGameChallenge() : null;
  const liveChallenge = Boolean(
    challenge
    && challenge.status === "accepted"
    && challenge.startedAt
    && !game.complete,
  );
  if (!liveChallenge) {
    return '<button class="ghost-btn" id="exitTriviaGame">Games menu</button>';
  }
  if (challenge.challengerId !== state.authUser?.id) {
    return '<span class="trivia-live-lock" role="status">Live challenge in progress</span>';
  }
  const busy = state.gameChallengeActionBusyId === challenge.id;
  return `
    <button
      class="ghost-btn trivia-end-challenge"
      type="button"
      data-game-challenge-action="end"
      data-game-challenge-id="${escapeHtml(challenge.id)}"
      ${busy ? "disabled" : ""}
    >${busy ? "Ending…" : "End challenge"}</button>
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
          ${triviaExitControl(game)}
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.questions.length - 1 ? "Finish round" : "Next question"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          ${triviaExitControl(game)}
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
          ${triviaExitControl(game)}
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish round" : "Next verse"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          ${triviaExitControl(game)}
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
          ${triviaExitControl(game)}
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish round" : "Next verse"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          ${triviaExitControl(game)}
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
          ${triviaExitControl(game)}
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.puzzles.length - 1 ? "Finish Book Sprint" : "Next round"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          ${triviaExitControl(game)}
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
          ${triviaExitControl(game)}
          <button class="ghost-btn" id="restartTriviaGame">Restart</button>
          <button class="primary-btn" id="nextTriviaQuestion">${game.index === game.questions.length - 1 ? "Finish round" : "Next quote"}</button>
        </div>
      ` : `
        <div class="trivia-actions">
          ${triviaExitControl(game)}
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
          ${triviaExitControl(game)}
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
        ${triviaExitControl(game)}
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
  if (game.challengeId) {
    syncActiveChallengeProgress({ completed: true }).catch((error) => console.warn("Challenge completion update failed", error));
  }
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
  if (state.isVerseOfDayActive && state.verseOfDayItem) return verseOfDayReaderView();
  const versions = activeVersions();
  return `
    ${selectionBar()}
    <div class="parallel-mobile-versions" style="--version-count: ${versions.length}" aria-label="Parallel Bible versions">
      ${versions.map((version, index) => parallelVersionSelectorMarkup(version, index, { mobile: true })).join("")}
    </div>
    <div class="parallel-table" style="--version-count: ${versions.length}">
      <div class="parallel-head"><div>V</div>${versions.map((version, index) => parallelVersionSelectorMarkup(version, index)).join("")}</div>
      ${currentChapter().verses.map((verse) => `
        ${parallelSectionHeadingsMarkup(verse, versions)}
        <div class="parallel-row ${verseStateClasses(verse.n)}" ${highlightStyleForVerse(verse.n)} data-verse="${verse.n}">
          <div class="verse-marker parallel-verse-marker">
            <button class="verse-num cross-ref-trigger" data-cross-ref-verse="${verse.n}" aria-label="Show cross references for ${state.reference}:${verse.n}">${verse.n}</button>
            ${verseNoteIndicatorsMarkup(verse.n)}
          </div>
          ${versions.map((version) => `<div class="parallel-copy" data-version="${escapeHtml(version)}">${renderStrongText(verse, version)}</div>`).join("")}
        </div>
      `).join("")}
    </div>
    ${apiBibleAttributionMarkup(versions)}
  `;
}

function parallelVersionSelectorMarkup(version, index, { mobile = false } = {}) {
  const removeButton = !mobile && index > 0
    ? `<button class="parallel-version-remove" type="button" data-remove-parallel-version="${version}" aria-label="Remove ${translationDisplayCode(version)} from Parallel Study" data-tooltip="Remove ${translationDisplayCode(version)}">${icons.clear}</button>`
    : "";
  return `
    <div class="parallel-version-selector">
      <button class="parallel-version-trigger" type="button" data-parallel-version-toggle="${index}" aria-label="Change ${translationDisplayCode(version)} Bible version" aria-haspopup="listbox" aria-expanded="${state.parallelVersionMenuIndex === index ? "true" : "false"}">
        <span>${translationDisplayCode(version)}</span>
        <span class="parallel-version-trigger-chevron" aria-hidden="true">⌄</span>
      </button>
      ${removeButton}
    </div>
  `;
}

function parallelVersionMenuMarkup() {
  const index = state.parallelVersionMenuIndex;
  const versions = activeVersions();
  const version = Number.isInteger(index) ? versions[index] : null;
  const position = state.parallelVersionMenuPosition;
  if (!version || !position) return "";
  const options = translationCodes
    .map((option) => {
      const current = option === version;
      const alreadySelected = !current && versions.includes(option);
      return `
        <button class="parallel-version-menu-option ${current ? "active" : ""}" type="button" data-parallel-version-option="${option}" data-parallel-version-index="${index}" role="option" aria-selected="${current ? "true" : "false"}" ${alreadySelected ? "disabled" : ""}>
          <strong>${translationDisplayCode(option)}</strong>
          <small>${escapeHtml(translationLookup[option]?.name || option)}</small>
        </button>
      `;
    })
    .join("");
  return `
    <div class="parallel-version-menu" role="listbox" aria-label="Choose replacement Bible version" style="--parallel-version-menu-top: ${position.top}px; --parallel-version-menu-left: ${position.left}px; --parallel-version-menu-max-height: ${position.maxHeight}px;">
      ${options}
    </div>
  `;
}

function parallelSectionHeadingsMarkup(verse, versions) {
  const hasHeading = versions.some((version) => sectionHeadingsForVerse(verse, version).length);
  if (!hasHeading) return "";
  return `
    <div class="parallel-row parallel-heading-row" data-heading-verse="${verse.n}">
      <div class="verse-num" aria-hidden="true"></div>
      ${versions.map((version) => `
        <div class="parallel-copy parallel-heading-copy" data-version="${escapeHtml(version)}">
          ${sectionHeadingsMarkup(verse, version, "parallel-heading-group")}
        </div>
      `).join("")}
    </div>
  `;
}

function verseStateClasses(verseNumber) {
  const highlightClass = highlightClassForVerse(verseNumber);
  const selected = verseNumber === state.verse;
  const passageSelected = state.selectedVerses.includes(verseNumber);
  return [
    selected ? "selected" : "",
    passageSelected ? "passage-selected" : "",
    highlightClass,
    highlightClass && (selected || passageSelected) ? "highlight-selected" : "",
  ].filter(Boolean).join(" ");
}

function noteReferencesStartingAtVerse(verseNumber) {
  return Object.entries(state.notes)
    .filter(([, note]) => String(note || "").trim())
    .map(([ref]) => ({ ref, parsed: parsePassageReference(ref) }))
    .filter(({ parsed }) => parsed?.key === state.reference && parsed.verse === Number(verseNumber))
    .sort((left, right) => left.parsed.verses.length - right.parsed.verses.length || left.ref.localeCompare(right.ref))
    .map(({ ref }) => ref);
}

function verseNoteIndicatorsMarkup(verseNumber) {
  const references = noteReferencesStartingAtVerse(verseNumber);
  if (!references.length) return "";
  return `
    <span class="verse-note-indicators" aria-label="${references.length === 1 ? "Passage note" : `${references.length} passage notes`}">
      ${references.map((ref) => `
        <button class="verse-note-indicator" type="button" data-note-reference="${escapeHtml(ref)}" aria-label="Open note for ${escapeHtml(ref)}" data-tooltip="Note · ${escapeHtml(ref)}">
          ${icons.note}
        </button>
      `).join("")}
    </span>
  `;
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
  const codes = normalizeStrongCodes(
    String(anchor.dataset.strongCodes || anchor.dataset.strong || "").split(","),
  );
  const code = codes[0] || "";
  const word = anchor.dataset.strongWord || "";
  const lookups = codes
    .map((strongCode) => strongEntry(strongCode))
    .filter(Boolean);
  state.selectedStrong = code;
  state.selectedStrongWord = word;
  const status = strongLexiconStatus === "loading"
    ? "Open Scriptures lexicon is still loading. Try this word again in a moment."
    : "No dictionary entry was found for this word yet.";
  const content = lookups.length
    ? `<div class="strong-list">${lookups.map((lookup) => strongLookupCard(lookup, word ? `${word} · ` : "")).join("")}</div>`
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
  const noteRef = `${state.reference}:${verseNumber}`;
  const hasNote = Boolean(String(state.notes[noteRef] || "").trim());
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
    <button type="button" data-menu-note aria-label="${hasNote ? "Edit" : "Add"} note for ${state.reference}:${verseNumber}">${hasNote ? icons.note : icons.noteAdd}</button>
    <button type="button" data-menu-highlight aria-label="Highlight ${state.reference}:${verseNumber}">${icons.highlighter}</button>
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
  menu.querySelector("[data-menu-note]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeVerseActionMenu(true);
    openNoteComposer(noteRef, anchor);
  });
  menu.querySelector("[data-menu-highlight]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeVerseActionMenu(true);
    openHighlightToolsForVerse(verseNumber);
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
      gotoReference(button.dataset.popupGoto, { linkNavigation: true });
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
  const query = state.searchResultsQuery;
  const scope = normalizedSearchScope(state.searchResultsScope);
  const searchChapter = state.searchResultsChapter || state.reference;
  const scopeLabel = searchScopeLabel(scope, searchChapter);
  if (!query) {
    return `<div class="empty-state">Search by phrase, word, question, or reference. Try “love one another” or “Who built the ark?”</div>`;
  }
  const eligibleQuestions = (window.bibleTriviaQuestions || []).filter((question) => (
    referenceMatchesSearchScope(question?.reference, scope, searchChapter)
  ));
  const verifiedAnswer = window.BigScreenBibleSearchQuery?.matchVerifiedAnswer(query, eligibleQuestions);
  if (!state.searchResults.length && !verifiedAnswer && !state.searchPending) {
    return `<div class="empty-state">No matches found in ${escapeHtml(scopeLabel)} for ${escapeHtml(query)}.</div>`;
  }
  const answerMarkup = verifiedAnswer ? `
    <article class="verified-answer" aria-label="Verified answer">
      <div class="verified-answer-label">Verified answer</div>
      <strong class="verified-answer-text">${escapeHtml(verifiedAnswer.answer)}</strong>
      ${verifiedAnswer.explanation ? `<p>${escapeHtml(verifiedAnswer.explanation)}</p>` : ""}
      <button class="verified-answer-reference" type="button" data-goto="${escapeHtml(verifiedAnswer.reference)}" data-search-result="true">
        <span>${escapeHtml(verifiedAnswer.reference)}</span>
        <span>Read passage <span aria-hidden="true">→</span></span>
      </button>
    </article>
  ` : "";
  const passageMarkup = state.searchResults.map((result) => `
    <button class="search-result" data-goto="${escapeHtml(result.goto || result.ref)}" data-search-result="true">
      <div class="ref-title">${escapeHtml(result.ref)} · ${escapeHtml(result.version)}${result.matchType ? ` · ${escapeHtml(result.matchType)}` : ""}</div>
      <div class="ref-copy">${highlightSearchTerms(result.text, query)}</div>
    </button>
  `).join("");
  return `
    ${answerMarkup}
    ${verifiedAnswer && passageMarkup ? `<div class="search-passages-label">Related passages</div>` : ""}
    ${passageMarkup}
    ${state.searchPending ? `<div class="empty-state search-pending">Finding related passages in ${escapeHtml(scopeLabel)}…</div>` : ""}
  `;
}

function highlightSearchTerms(text, query) {
  const safeText = escapeHtml(text);
  const criteria = parseSearchQuery(query);
  const terms = [
    ...(criteria.exactPhrase ? [criteria.exactPhrase] : []),
    ...(criteria.highlightTerms || criteria.tokens),
  ].filter(Boolean);
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
    <div class="strong-card">
      <div class="ref-title">${escapeHtml(selectedWord)}${entry.code} · ${escapeHtml(entry.lemma)}</div>
      ${entry.transliteration ? `<div class="strong-meta">Transliteration: ${escapeHtml(entry.transliteration)}</div>` : ""}
      ${entry.pronunciation ? `<div class="strong-meta">Pronunciation: ${escapeHtml(entry.pronunciation)}</div>` : ""}
      ${entry.derivation ? `<div class="ref-copy"><strong>Derivation:</strong> ${escapeHtml(entry.derivation)}</div>` : ""}
      ${entry.definition ? `<div class="ref-copy"><strong>Definition:</strong> ${escapeHtml(entry.definition)}</div>` : ""}
      ${entry.kjv ? `<div class="ref-copy"><strong>KJV usage:</strong> ${escapeHtml(entry.kjv)}</div>` : ""}
      <div class="source-note">${escapeHtml(entry.source)}</div>
    </div>
  `;
}

function bottombar() {
  const hasPassageSelection = state.selectedVerses.length > 0;
  const copyActionLabel = hasPassageSelection ? "Copy passage" : "Copy verse";
  const printActionLabel = hasPassageSelection ? "Print passage" : "Print";
  const printTooltipLabel = `${printActionLabel} · ${activePrintLayoutName()} layout`;
  const footerVersions = state.mode === "parallel"
    ? activeVersions()
    : [state.versions[0] || activeVersions()[0] || "BSB"];
  const footerPrimaryVersion = footerVersions[0] || "BSB";
  const footerSecondaryVersions = footerVersions.slice(1);
  const footerVersionOptions = translationCodes
    .map((version) => `
      <button class="primary-version-option ${version === footerPrimaryVersion ? "active" : ""}" type="button" data-footer-version-option="${version}" role="option" aria-selected="${version === footerPrimaryVersion ? "true" : "false"}">
        <span>${translationDisplayCode(version)}</span>
        <small>${escapeHtml(translationLookup[version]?.name || version)}</small>
      </button>
    `)
    .join("");
  return `
    <div class="footer-region ${state.footerCollapsed ? "collapsed" : ""}">
      <footer class="bottombar" id="footerBar" ${state.footerCollapsed ? 'inert aria-hidden="true"' : ""}>
        <button class="nav-button chapter-nav chapter-nav-prev" id="prevChapter" aria-label="Previous chapter">
          <span class="chapter-nav-icon" aria-hidden="true">‹</span>
          <span class="chapter-nav-label">Previous Chapter</span>
        </button>
        <div class="footer-center">
          <div class="fineprint">
            <div class="footer-reference">
              <div class="footer-version-control ${state.footerVersionMenuOpen ? "open" : ""}">
                <button class="footer-version-toggle" id="footerVersionMenuToggle" type="button" aria-label="Bible version ${translationDisplayCode(footerPrimaryVersion)}" aria-haspopup="listbox" aria-expanded="${state.footerVersionMenuOpen ? "true" : "false"}" title="Change Bible version">
                  <span>${translationDisplayCode(footerPrimaryVersion)}</span>
                </button>
                <div class="primary-version-menu footer-version-menu" role="listbox" aria-label="Bible version options">
                  ${footerVersionOptions}
                </div>
              </div>
              ${footerSecondaryVersions.length ? `<span class="footer-secondary-versions">/ ${footerSecondaryVersions.map(translationDisplayCode).join(" / ")}</span>` : ""}
              <span class="footer-reference-divider" aria-hidden="true">·</span>
              ${["reader", "parallel"].includes(state.mode)
                ? `<button class="footer-reference-label footer-inline-picker" id="footerReferencePicker" type="button" aria-label="Choose Bible book or chapter, currently ${escapeHtml(referenceLabel())}" title="Choose book or chapter">${referenceLabel()}</button>`
                : `<span class="footer-reference-label">${referenceLabel()}</span>`}
            </div>
          </div>
          <div class="bottom-actions">
            <button class="ghost-btn bottom-action" id="copyVerse" aria-label="${copyActionLabel}" data-tooltip="${copyActionLabel}" data-selection-action>
              <span class="bottom-action-icon" aria-hidden="true">${icons.copy}</span>
              <span class="bottom-action-label">${copyActionLabel}</span>
            </button>
            <button class="ghost-btn bottom-action" id="printPage" aria-label="${printTooltipLabel}" data-tooltip="${printTooltipLabel}" data-selection-action>
              <span class="bottom-action-icon" aria-hidden="true">${icons.print}</span>
              <span class="bottom-action-label">${printActionLabel}</span>
            </button>
            <button class="ghost-btn bottom-action bottom-about-link" id="aboutMenuButton" type="button" aria-label="About and legal information" aria-haspopup="dialog" aria-expanded="${state.aboutMenuOpen ? "true" : "false"}" data-tooltip="About">
              <span class="bottom-action-icon" aria-hidden="true">${icons.info}</span>
              <span class="bottom-action-label">About</span>
            </button>
          </div>
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
  const hasNote = Boolean(String(state.notes[label] || "").trim());
  const crossRefVerse = selectedCrossReferenceVerse();
  const crossRefLabel = `${state.reference}:${crossRefVerse}`;
  return `
    <div class="selection-bar" role="status">
      <span class="selection-bar-summary">${count} selected · ${label}</span>
      <div class="highlight-palette" aria-label="Highlight selected verses">
        ${highlightColors.map((color) => `<button class="highlight-swatch highlight-${color}" data-highlight-color="${color}" aria-label="Highlight ${color}"></button>`).join("")}
        <label class="highlight-custom-swatch" style="--custom-highlight-color: ${escapeHtml(state.customHighlightColor)}" aria-label="Choose custom highlight color" title="Custom highlight color">
          <input id="customHighlightColor" type="color" value="${escapeHtml(state.customHighlightColor)}" aria-label="Choose custom highlight color">
        </label>
        <button class="highlight-swatch highlight-remove" data-highlight-color="none" aria-label="Remove highlight">${icons.clear}</button>
      </div>
      <button class="text-btn selection-action" id="crossRefSelection" data-cross-ref-verse="${crossRefVerse}" aria-label="Show cross references for ${escapeHtml(crossRefLabel)}" data-tooltip="Cross references"><span class="selection-action-icon">${icons.layers}</span><span class="selection-action-label">Cross references</span></button>
      <button class="text-btn selection-action" id="copySelection" aria-label="Copy passage" data-tooltip="Copy passage"><span class="selection-action-icon">${icons.copy}</span><span class="selection-action-label">Copy passage</span></button>
      <button class="text-btn selection-action" id="shareSelection" aria-label="Share passage" data-tooltip="Share"><span class="selection-action-icon">${icons.share}</span><span class="selection-action-label">Share</span></button>
      <button class="text-btn selection-action" id="copySelectionLink" aria-label="Copy passage link" data-tooltip="Copy link"><span class="selection-action-icon">${icons.link}</span><span class="selection-action-label">Copy link</span></button>
      <button class="text-btn selection-action ${hasNote ? "has-note" : ""}" id="noteSelection" data-note-reference="${escapeHtml(label)}" aria-label="${hasNote ? "Edit" : "Add"} note for ${escapeHtml(label)}" data-tooltip="${hasNote ? "Edit note" : "Add note"}"><span class="selection-action-icon">${hasNote ? icons.note : icons.noteAdd}</span><span class="selection-action-label">${hasNote ? "Edit note" : "Add note"}</span></button>
      <button class="text-btn selection-action" id="printSelection" aria-label="Print passage · ${activePrintLayoutName()} layout" data-tooltip="Print · ${activePrintLayoutName()}"><span class="selection-action-icon">${icons.print}</span><span class="selection-action-label">Print</span></button>
      <button class="text-btn selection-action" id="clearSelection" aria-label="Clear selected verses" data-tooltip="Clear"><span class="selection-action-icon">${icons.clear}</span><span class="selection-action-label">Clear</span></button>
    </div>
  `;
}

function presentationTextBudget() {
  const width = Math.max(window.innerWidth || 0, 320);
  const height = Math.max(window.innerHeight || 0, 320);
  if (width <= 520) return height <= 520 ? 105 : 125;
  if (width <= 900) return height <= 520 ? 125 : 150;
  if (height <= 600) return 155;
  if (width <= 1300) return 185;
  return 220;
}

function presentationBreakPriority(text, index) {
  const before = text.slice(Math.max(0, index - 3), index).trimEnd();
  const previous = before.at(-1) || "";
  if (/[.!?]/.test(previous) || /[.!?][”’"')\]]$/.test(before)) return 4;
  if (/[;:]/.test(previous) || /[;:][”’"')\]]$/.test(before)) return 3;
  if (/[,—–]/.test(previous)) return 2;
  return 1;
}

function presentationTextParts(value) {
  return presentationTextPartsWithOffsets(value).map((part) => part.text);
}

function presentationTextPartsWithOffsets(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  const budget = presentationTextBudget();
  if (text.length <= budget * 1.15) return [{ text, start: 0, end: text.length }];

  const partCount = Math.max(2, Math.ceil(text.length / budget));
  const parts = [];
  let start = 0;

  for (let partIndex = 0; partIndex < partCount - 1; partIndex += 1) {
    const partsRemaining = partCount - partIndex;
    const ideal = start + Math.round((text.length - start) / partsRemaining);
    const average = (text.length - start) / partsRemaining;
    const minimum = start + Math.max(24, Math.floor(average * 0.55));
    const maximum = Math.min(text.length - 1, start + Math.ceil(average * 1.45));
    const candidates = [];

    for (let index = minimum; index <= maximum; index += 1) {
      if (!/\s/.test(text[index])) continue;
      const priority = presentationBreakPriority(text, index);
      candidates.push({ index, score: priority * 100 - Math.abs(index - ideal) });
    }

    const nextSpace = text.indexOf(" ", ideal);
    const chosen = candidates.sort((a, b) => b.score - a.score)[0]?.index
      ?? (nextSpace >= 0 ? nextSpace : ideal);
    const partText = text.slice(start, chosen).trim();
    parts.push({ text: partText, start, end: start + partText.length });
    start = chosen;
    while (/\s/.test(text[start])) start += 1;
  }

  const finalText = text.slice(start).trim();
  parts.push({ text: finalText, start, end: start + finalText.length });
  return parts.filter((part) => part.text);
}

function currentPresentationParts() {
  if (state.isVerseOfDayActive && state.verseOfDayItem) {
    return presentationTextParts(state.verseOfDayItem.verseText);
  }
  const verse = currentVerse();
  const version = state.versions[0] || "BSB";
  return presentationTextParts(getVerseText(verse, version));
}

function presentationPartSuffix(index) {
  return String.fromCharCode(97 + Math.min(index, 25));
}

function adjacentPresentationContent(direction) {
  const currentParts = currentPresentationParts();
  const partIndex = Math.max(0, Math.min(currentParts.length - 1, Number(state.presentationPart) || 0));
  const adjacentPartIndex = partIndex + direction;
  const currentReference = state.isVerseOfDayActive && state.verseOfDayItem
    ? state.verseOfDayItem.reference
    : referenceLabel();
  if (adjacentPartIndex >= 0 && adjacentPartIndex < currentParts.length) {
    return {
      text: currentParts[adjacentPartIndex],
      reference: `${currentReference}${currentParts.length > 1 ? presentationPartSuffix(adjacentPartIndex) : ""}`,
    };
  }

  const verses = currentChapter().verses;
  const verseIndex = verses.findIndex((verse) => verse.n === state.verse);
  const adjacentVerse = verses[verseIndex + direction];
  if (!adjacentVerse) return null;
  const version = state.versions[0] || "BSB";
  const adjacentParts = presentationTextParts(getVerseText(adjacentVerse, version));
  const targetPartIndex = direction < 0 ? Math.max(0, adjacentParts.length - 1) : 0;
  return {
    text: adjacentParts[targetPartIndex] || "",
    reference: `${state.reference}:${adjacentVerse.n}${adjacentParts.length > 1 ? presentationPartSuffix(targetPartIndex) : ""}`,
  };
}

function presentation() {
  const verse = currentVerse();
  const version = state.versions[0] || "BSB";
  const verseOfDayItem = state.isVerseOfDayActive ? state.verseOfDayItem : null;
  const parts = presentationTextPartsWithOffsets(verseOfDayItem?.verseText || getVerseText(verse, version));
  const partIndex = Math.max(0, Math.min(parts.length - 1, Number(state.presentationPart) || 0));
  const part = parts[partIndex];
  const text = part.text;
  state.presentationPart = partIndex;
  const paginated = parts.length > 1;
  const presentationReference = `${verseOfDayItem?.reference || referenceLabel()}${paginated ? presentationPartSuffix(partIndex) : ""}`;
  const fullscreenActive = isFullscreenActive();
  const fullscreenIcon = fullscreenActive ? icons.fullscreenExit : icons.fullscreenEnter;
  const fullscreenLabel = fullscreenActive ? "Exit fullscreen" : "Enter fullscreen";
  const verses = currentChapter().verses.map((item) => item.n);
  const verseIndex = verses.indexOf(state.verse);
  const canGoBack = partIndex > 0 || verseIndex > 0;
  const canGoForward = partIndex < parts.length - 1 || verseIndex < verses.length - 1;
  const previousLabel = partIndex > 0 ? "Previous part" : "Previous verse";
  const nextLabel = partIndex < parts.length - 1 ? "Next part" : "Next verse";
  const previousPreview = canGoBack ? adjacentPresentationContent(-1) : null;
  const nextPreview = canGoForward ? adjacentPresentationContent(1) : null;
  const enterDirection = presentationEnterDirection;
  presentationEnterDirection = 0;
  const enterClass = enterDirection > 0
    ? "presentation-enter-next"
    : enterDirection < 0
      ? "presentation-enter-previous"
      : "";
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
    <section class="presentation ${state.mode === "big" ? "open" : ""} ${state.presentationControlsVisible || state.presentationSearchOpen ? "controls-visible" : ""} ${state.presentationSearchOpen ? "search-active" : ""} ${enterClass}" id="presentation" data-presentation-theme="${state.presentationTheme}" style="--presentation-text-scale: ${state.presentationTextScale}">
      <div class="presentation-top">
        <div class="presentation-search-slot">
          <form class="presentation-search ${state.presentationSearchOpen ? "search-open" : ""}" id="presentationSearchForm">
            <button class="ghost-btn presentation-search-toggle" type="button" id="presentationSearchToggle" aria-label="Search passage" data-tooltip="Search passage">${icons.search}</button>
            <input id="presentationSearchInput" value="" aria-label="Search passage in presentation" placeholder="John 3:16" />
            <button class="ghost-btn presentation-search-go" type="submit">Go</button>
          </form>
        </div>
        <div class="presentation-ref">
          <a class="presentation-reference-label" id="presentationReferenceBackToBible" href="#reader" aria-label="Back to Bible at ${escapeHtml(presentationReference)}">${presentationReference}</a>
          ${verseOfDayItem ? "" : `<span class="presentation-version-label">${translationDisplayCode(version)}</span>`}
          ${paginated ? `<span class="presentation-part-position">Part ${partIndex + 1} of ${parts.length}</span>` : ""}
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
              <div class="presentation-text-size-setting">
                <span>Text size</span>
                <div class="presentation-text-size-control" role="group" aria-label="Big Screen text size controls">
                  <button type="button" id="presentationDecreaseText" aria-label="Decrease Big Screen text size">A−</button>
                  <button type="button" class="presentation-text-size-reset" id="presentationResetText" aria-label="Reset Big Screen text size to 100%"><span>Aa</span><strong>${Math.round(state.presentationTextScale * 100)}%</strong></button>
                  <button type="button" id="presentationIncreaseText" aria-label="Increase Big Screen text size">A+</button>
                </div>
              </div>
              <button class="ghost-btn presentation-fullscreen-btn" id="presentationFullscreenButton" type="button">${fullscreenIcon}<span>${fullscreenLabel}</span></button>
              <button class="ghost-btn presentation-help-btn" id="presentationHelpButton" type="button">?<span>Help & tour</span></button>
              <div class="presentation-help">
                <span>Keyboard</span>
                <div><kbd>←</kbd><kbd>→</kbd> Move through parts and verses</div>
                <div><kbd>Shift</kbd><kbd>+</kbd><kbd>−</kbd> Change text size</div>
                <div><kbd>Esc</kbd> Back to Bible</div>
              </div>
            </div>
          </div>
          <button class="ghost-btn presentation-bible-toggle" id="closePresentation" aria-label="Back to Bible" data-tooltip="Back to Bible">${icons.book}</button>
        </div>
      </div>
      <div class="presentation-text">
        ${previousPreview ? `<div class="presentation-swipe-preview presentation-swipe-preview-previous" aria-hidden="true"><span>Previous</span><strong>${escapeHtml(previousPreview.reference)}</strong><p>${escapeHtml(previousPreview.text)}</p></div>` : ""}
        <div class="presentation-passage">
          <span class="presentation-copy">${escapeHtml(text)}</span>
          ${state.isVerseOfDayActive ? `<span class="presentation-verse-of-day-label">Verse of the Day</span>` : ""}
          ${state.isVerseOfDayActive ? verseOfDayAttributionMarkup("presentation-attribution") : apiBibleAttributionMarkup([version], "presentation-attribution")}
        </div>
        ${nextPreview ? `<div class="presentation-swipe-preview presentation-swipe-preview-next" aria-hidden="true"><span>Next</span><strong>${escapeHtml(nextPreview.reference)}</strong><p>${escapeHtml(nextPreview.text)}</p></div>` : ""}
      </div>
      <div class="presentation-scale-feedback" id="presentationScaleFeedback" role="status" aria-live="polite"><span class="presentation-scale-feedback-mark" aria-hidden="true">Aa</span><span class="presentation-scale-feedback-label">${Math.round(state.presentationTextScale * 100)}%</span></div>
      <div class="presentation-bottom">
        <a class="presentation-brand" id="presentationBrandVerseOfDay" href="#verse-of-the-day" aria-label="Open verse of the day">
          <img class="presentation-brand-mark" src="./assets/brand-mark.png?v=20260713-polished" alt="" />
          <span class="presentation-brand-copy"><span>Big Screen</span><strong>Bible</strong></span>
        </a>
        <div class="presentation-controls">
          ${presentationReturnButton()}
          <button class="ghost-btn presentation-nav-button presentation-nav-button-prev" id="presentationPrev" aria-label="${previousLabel}" data-tooltip="${previousLabel}" ${canGoBack ? "" : "disabled"}>${icons.chevron}</button>
          <button class="ghost-btn presentation-nav-button" id="presentationNext" aria-label="${nextLabel}" data-tooltip="${nextLabel}" ${canGoForward ? "" : "disabled"}>${icons.chevron}</button>
        </div>
        <button class="presentation-about-link" id="presentationAboutMenuButton" type="button" aria-label="About and legal information" aria-haspopup="dialog" aria-expanded="${state.aboutMenuOpen ? "true" : "false"}" data-tooltip="About Big Screen Bible">About</button>
      </div>
    </section>
  `;
}

function printVersionLabel(version = state.versions[0]) {
  return state.printFullVersionName
    ? translationLookup[version]?.name || translationDisplayCode(version)
    : translationDisplayCode(version);
}

function activePrintLayoutName() {
  return printLayouts.find((layout) => layout.code === state.printLayout)?.name || printLayouts[0].name;
}

function printVerseNumberMarkup(verseNumber) {
  return state.printVerseNumbers ? `<sup>${verseNumber}</sup>` : "";
}

function printVerseTextMarkup({ n, text, verse }, version) {
  return `${printVerseNumberMarkup(n)}${renderRedLetterText(text, wordsOfJesusRanges(verse, version))}`;
}

function standardPrintPassageMarkup(lines, version) {
  return lines.map((line) => `
    ${sectionHeadingsMarkup(line.verse, version, "print-heading-group")}
    <p class="print-standard-verse">${printVerseTextMarkup(line, version)}</p>
  `).join("");
}

function paragraphPrintPassageMarkup(lines, version) {
  const chapter = currentChapter();
  const paragraphStarts = chapter?.verses?.filter((verse) => paragraphStartForVerse(verse, version)) || [];
  if (paragraphStarts.length <= 1 && chapter?.verses?.length > 1) {
    return standardPrintPassageMarkup(lines, version);
  }
  const blocks = [];
  let paragraph = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`
      <p class="print-paragraph">
        ${paragraph.map((line) => `<span class="print-verse">${printVerseTextMarkup(line, version)}</span>`).join("")}
      </p>
    `);
    paragraph = [];
  };

  lines.forEach((line) => {
    const headings = sectionHeadingsMarkup(line.verse, version, "print-heading-group");
    if (headings) {
      flushParagraph();
      blocks.push(headings);
    }
    if (paragraph.length && paragraphStartForVerse(line.verse, version)) flushParagraph();
    paragraph.push(line);
  });
  flushParagraph();
  return blocks.join("");
}

function bigScreenPrintPassageMarkup(lines, version) {
  return `
    <blockquote class="print-big-screen-quote">
      ${lines.map((line) => `<span class="print-verse">${printVerseTextMarkup(line, version)}</span>`).join("")}
    </blockquote>
  `;
}

function printPassageMarkup(lines, version) {
  if (state.printLayout === "paragraph") return paragraphPrintPassageMarkup(lines, version);
  if (state.printLayout === "big-screen") return bigScreenPrintPassageMarkup(lines, version);
  return standardPrintPassageMarkup(lines, version);
}

function printSheet() {
  const layoutClass = `print-layout-${state.printLayout}`;
  if (state.isVerseOfDayActive && state.verseOfDayItem) {
    const verseCopy = `${printVerseNumberMarkup(state.verse)}${escapeHtml(state.verseOfDayItem.verseText)}`;
    const passageMarkup = state.printLayout === "big-screen"
      ? `<blockquote class="print-big-screen-quote"><span class="print-verse">${verseCopy}</span></blockquote>`
      : `<p class="${state.printLayout === "paragraph" ? "print-paragraph" : "print-standard-verse"}">${verseCopy}</p>`;
    return `
      <section class="print-sheet ${layoutClass}" aria-hidden="true">
        <div class="print-brand">Big Screen Bible</div>
        <h1>${escapeHtml(state.verseOfDayItem.reference)}</h1>
        ${passageMarkup}
        ${verseOfDayAttributionMarkup("print-attribution")}
      </section>
    `;
  }
  const version = state.versions[0];
  const lines = passageLines();
  return `
    <section class="print-sheet ${layoutClass}" aria-hidden="true">
      <div class="print-brand">Big Screen Bible</div>
      <h1>${printReferenceLabel()}</h1>
      <div class="print-version">${escapeHtml(printVersionLabel(version))}</div>
      ${printPassageMarkup(lines, version)}
      ${apiBibleAttributionMarkup([version], "print-attribution")}
    </section>
  `;
}

function shortcutOverlay() {
  const platformKey = navigator.platform?.toLowerCase().includes("mac") ? "Cmd" : "Ctrl";
  const shortcuts = [
    [`${platformKey} /`, "Open Help"],
    ["Shift + ?", "Open keyboard shortcuts"],
    ["P", "Open Big Screen"],
    ["F", "Toggle focus layout"],
    ["Shift + F", "Toggle fullscreen"],
    ["A", "Start or pause Reader / Parallel auto-scroll"],
    ["Shift + +", "Increase text size in the current reading mode"],
    ["Shift + −", "Decrease text size in the current reading mode"],
    ["Shift + 0", "Reset text size in the current reading mode"],
    ["Shift + S", "Toggle Strong's lookups"],
    ["/", "Jump to reference search"],
    ["S", "Open search"],
    ["T", "Open games"],
    ["V", "Open verse picker"],
    ["N", "Open notes"],
    ["B", "Open bookmarks"],
    ["C", "Open cross references"],
    ["H", "Open highlight bar"],
    ["↑ / ↓", "Move verse by verse"],
    ["Shift ↑ / ↓", "Select verse range"],
    ["← / →", "Move chapter by chapter"],
    ["Esc", "Close overlay or go back to Bible"],
  ];
  return `
    <section class="shortcut-overlay ${state.shortcutsOpen ? "open" : ""}" aria-hidden="${state.shortcutsOpen ? "false" : "true"}">
      <div class="shortcut-panel draggable-popup ${popupPositionClass("help")}" role="dialog" aria-modal="true" aria-labelledby="shortcutTitle" ${popupPositionStyle("help")}>
        <div class="shortcut-head">
          <div>
            <div class="shortcut-eyebrow">Help center</div>
            <h2 id="shortcutTitle">Big Screen Bible Help</h2>
          </div>
          <span class="popup-drag-grip popup-drag-handle" data-popup-drag-handle="help" aria-hidden="true" title="Drag to move help"></span>
          <button class="icon-btn" id="closeShortcuts" aria-label="Close help" data-tooltip="Close">×</button>
        </div>
        <div class="help-tour-card">
          <div>
            <strong>New here?</strong>
            <p>Take a quick guided tour of the main controls. You can come back here and restart it any time.</p>
          </div>
          <button class="primary-btn" id="startHelpTour" type="button">Take tour</button>
        </div>
        <section class="gesture-guide" aria-labelledby="gestureGuideTitle">
          <div class="gesture-guide-head">
            <div>
              <div class="shortcut-eyebrow">On touch devices</div>
              <h3 id="gestureGuideTitle">Touch gestures</h3>
            </div>
            <p>Quick ways to adjust your reading space.</p>
          </div>
          <div class="gesture-guide-grid">
            <figure class="gesture-guide-card" aria-labelledby="pinchGestureTitle">
              <div class="gesture-demo-frame">
                <svg class="gesture-demo gesture-demo-pinch" viewBox="0 0 180 96" aria-hidden="true" focusable="false">
                  <rect class="gesture-demo-surface" x="8" y="8" width="164" height="80" rx="13" />
                  <g class="gesture-demo-lines">
                    <path d="M24 27h132M24 39h96M24 61h132M24 73h108" />
                  </g>
                  <g class="gesture-pinch-arrows">
                    <path d="M69 49H43m0 0 7-7m-7 7 7 7M111 49h26m0 0-7-7m7 7-7 7" />
                  </g>
                  <g class="gesture-touch gesture-touch-left">
                    <circle class="gesture-touch-halo" cx="78" cy="49" r="12" />
                    <circle class="gesture-touch-dot" cx="78" cy="49" r="5" />
                  </g>
                  <g class="gesture-touch gesture-touch-right">
                    <circle class="gesture-touch-halo" cx="102" cy="49" r="12" />
                    <circle class="gesture-touch-dot" cx="102" cy="49" r="5" />
                  </g>
                </svg>
              </div>
              <figcaption>
                <strong id="pinchGestureTitle">Pinch</strong>
                <span>Resize Scripture text</span>
              </figcaption>
            </figure>
            <figure class="gesture-guide-card" aria-labelledby="twoFingerGestureTitle">
              <div class="gesture-demo-frame">
                <svg class="gesture-demo gesture-demo-two-tap" viewBox="0 0 180 96" aria-hidden="true" focusable="false">
                  <rect class="gesture-demo-surface" x="8" y="8" width="164" height="80" rx="13" />
                  <g class="gesture-demo-lines">
                    <path d="M24 27h132M24 39h105M24 61h132M24 73h116" />
                  </g>
                  <g class="gesture-tap-pair">
                    <circle class="gesture-tap-ripple gesture-tap-ripple-left" cx="72" cy="49" r="15" />
                    <circle class="gesture-tap-ripple gesture-tap-ripple-right" cx="108" cy="49" r="15" />
                    <g class="gesture-touch gesture-touch-left">
                      <circle class="gesture-touch-halo" cx="72" cy="49" r="12" />
                      <circle class="gesture-touch-dot" cx="72" cy="49" r="5" />
                    </g>
                    <g class="gesture-touch gesture-touch-right">
                      <circle class="gesture-touch-halo" cx="108" cy="49" r="12" />
                      <circle class="gesture-touch-dot" cx="108" cy="49" r="5" />
                    </g>
                  </g>
                </svg>
              </div>
              <figcaption>
                <strong id="twoFingerGestureTitle">Two-finger tap</strong>
                <span>Start or pause auto-scroll when enabled</span>
              </figcaption>
            </figure>
            <figure class="gesture-guide-card" aria-labelledby="doubleTapGestureTitle">
              <div class="gesture-demo-frame">
                <svg class="gesture-demo gesture-demo-double-tap" viewBox="0 0 180 96" aria-hidden="true" focusable="false">
                  <rect class="gesture-demo-surface" x="8" y="8" width="164" height="80" rx="13" />
                  <g class="gesture-demo-lines gesture-demo-lines-short">
                    <path d="M24 27h79M24 39h66M24 61h79M24 73h72" />
                  </g>
                  <path class="gesture-blank-divider" d="M118 20v56" />
                  <circle class="gesture-tap-ripple gesture-double-ripple-one" cx="142" cy="49" r="15" />
                  <circle class="gesture-tap-ripple gesture-double-ripple-two" cx="142" cy="49" r="15" />
                  <g class="gesture-touch gesture-double-touch">
                    <circle class="gesture-touch-halo" cx="142" cy="49" r="12" />
                    <circle class="gesture-touch-dot" cx="142" cy="49" r="5" />
                  </g>
                </svg>
              </div>
              <figcaption>
                <strong id="doubleTapGestureTitle">Double-tap blank space</strong>
                <span>Toggle Focus Mode</span>
              </figcaption>
            </figure>
            <figure class="gesture-guide-card" aria-labelledby="headerTapGestureTitle">
              <div class="gesture-demo-frame">
                <svg class="gesture-demo gesture-demo-header-tap" viewBox="0 0 180 96" aria-hidden="true" focusable="false">
                  <rect class="gesture-demo-surface" x="8" y="8" width="164" height="80" rx="13" />
                  <path class="gesture-demo-header" d="M8 21c0-7.2 5.8-13 13-13h138c7.2 0 13 5.8 13 13v10H8Z" />
                  <g class="gesture-demo-lines gesture-demo-lines-short">
                    <path d="M24 48h132M24 60h96M24 72h122" />
                  </g>
                  <path class="gesture-demo-up-arrow" d="m82 24 8-8 8 8M90 16v11" />
                  <circle class="gesture-tap-ripple" cx="90" cy="20" r="14" />
                  <g class="gesture-touch">
                    <circle class="gesture-touch-halo" cx="90" cy="20" r="10" />
                    <circle class="gesture-touch-dot" cx="90" cy="20" r="4.5" />
                  </g>
                </svg>
              </div>
              <figcaption>
                <strong id="headerTapGestureTitle">Tap empty header space</strong>
                <span>Return to the chapter top</span>
              </figcaption>
            </figure>
          </div>
        </section>
        <div class="help-grid">
          <div><strong>Search</strong><span>Find a verse by reference or by remembered words.</span></div>
          <div><strong>Study</strong><span>Use notes, highlights, bookmarks, cross references, and history from the side tools.</span></div>
          <div><strong>Display</strong><span>Big Screen Mode is built for clean, full-screen Scripture display.</span></div>
          <div><strong>Games</strong><span>Practice Bible knowledge with trivia, verse order, and quick-reference games.</span></div>
        </div>
        <a class="help-about-link" href="./about.html">About Big Screen Bible</a>
        <details class="shortcut-keyboard-section help-section" data-help-section="keyboard" ${state.helpSectionsOpen.keyboard ? "open" : ""}>
          <summary>Keyboard shortcuts</summary>
          <div class="shortcut-list">
            ${shortcuts.map(([keys, label]) => `<div class="shortcut-row"><kbd>${keys}</kbd><span>${label}</span></div>`).join("")}
          </div>
        </details>
      </div>
    </section>
  `;
}

function aboutMenuOverlay() {
  if (!state.aboutMenuOpen) return "";
  return `
    <section class="about-menu-overlay open">
      <div class="about-menu-card" id="aboutMenuDialog" role="dialog" aria-modal="true" aria-labelledby="aboutMenuTitle" tabindex="-1">
        <div class="about-menu-head">
          <div>
            <div class="shortcut-eyebrow">Big Screen Bible</div>
            <h2 id="aboutMenuTitle">About &amp; legal</h2>
          </div>
          <button class="icon-btn" id="closeAboutMenu" type="button" aria-label="Close About and legal information" data-tooltip="Close">×</button>
        </div>
        <p class="about-menu-intro">Learn more about Big Screen Bible or review the policies that guide the service.</p>
        <nav class="about-menu-links" aria-label="About and legal pages">
          <a href="./about.html">
            <strong>About Big Screen Bible</strong>
            <span>The story, purpose, and vision behind the project.</span>
          </a>
          <a href="./privacy/">
            <strong>Privacy Policy</strong>
            <span>How account information and supported study data are handled.</span>
          </a>
          <a href="./terms/">
            <strong>Terms of Service</strong>
            <span>The terms for using Big Screen Bible and its content.</span>
          </a>
        </nav>
      </div>
    </section>
  `;
}

function pushConsentPrompt() {
  if (!state.pushPromptVisible) return "";
  return `
    <section class="tutorial-welcome-overlay push-consent-overlay open" role="dialog" aria-modal="true" aria-labelledby="pushConsentTitle">
      <div class="tutorial-welcome-card push-consent-card">
        <img class="tutorial-welcome-logo" src="./assets/brand-mark.png?v=20260713-polished" alt="" />
        <div class="shortcut-eyebrow">Stay connected</div>
        <h2 id="pushConsentTitle">Turn on notifications?</h2>
        <p>Receive daily Scripture reminders plus timely friend requests and game challenges while you are signed in.</p>
        <div class="push-consent-schedule" aria-label="Default notification choices">
          <span><strong>7:00 AM</strong> Verse of the Day</span>
          <span><strong>6:00 PM</strong> Unread reminder</span>
          <span><strong>Friend activity</strong> Requests and challenges</span>
        </div>
        <p class="push-consent-note">Times use this device’s local timezone. You can change each notification choice or turn everything off in Settings.</p>
        <div class="tutorial-actions">
          <button class="primary-btn" id="enablePushPrompt" type="button">Enable notifications</button>
          <button class="ghost-btn" id="dismissPushPrompt" type="button">Not now</button>
        </div>
      </div>
    </section>
  `;
}

function tutorialIntro() {
  if (!state.tutorialIntroVisible || state.tutorialActive || state.shortcutsOpen || state.aboutMenuOpen) return "";
  return `
    <section class="tutorial-welcome-overlay open" role="dialog" aria-modal="true" aria-labelledby="tutorialWelcomeTitle">
      <div class="tutorial-welcome-card">
        <img class="tutorial-welcome-logo" src="./assets/brand-mark.png?v=20260713-polished" alt="" />
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
  bindReaderReturnButton();
  bindReaderSelectionToolsButton();
  document.querySelector(".topbar")?.addEventListener("click", handleTopbarScrollTap);
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      switchMode(button.dataset.mode);
    });
  });
  document.querySelectorAll("[data-remove-version]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.versions.length === 1) return showToast("Keep at least one version selected");
      state.versions = state.versions.filter((version) => version !== button.dataset.removeVersion);
      persistVersions({ changed: true });
      scheduleCloudSync();
      render();
    });
  });
  document.querySelectorAll("[data-remove-parallel-version]").forEach((button) => {
    button.addEventListener("click", () => {
      const version = button.dataset.removeParallelVersion;
      if (!version || version === state.versions[0]) return;
      state.versions = state.versions.filter((item) => item !== version);
      persistVersions({ changed: true });
      scheduleCloudSync();
      renderPreservingReaderScroll();
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
    persistVersions({ changed: true });
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("footerVersionMenuToggle")?.addEventListener("click", () => {
    if (state.footerVersionMenuOpen) return closeFooterVersionMenu();
    dismissLibraryForFooterMenu();
    state.headerVersionMenuOpen = false;
    state.footerVersionMenuOpen = true;
    renderPreservingReaderScroll();
  });
  document.querySelectorAll("[data-footer-version-option]").forEach((button) => {
    button.addEventListener("click", async () => {
      const version = button.dataset.footerVersionOption;
      if (!translationCodes.includes(version)) return;
      state.footerVersionMenuOpen = false;
      await setPrimaryVersion(version, { preserveScroll: true, keepPresentationSettings: true });
    });
  });
  document.getElementById("footerReferencePicker")?.addEventListener("click", () => {
    state.footerVersionMenuOpen = false;
    state.headerVersionMenuOpen = false;
    activateWorkspace("Verse");
  });
  document.getElementById("versionMenuToggle")?.addEventListener("click", () => {
    if (state.headerVersionMenuOpen) return closeHeaderVersionMenu();
    state.footerVersionMenuOpen = false;
    state.headerVersionMenuOpen = true;
    renderPreservingReaderScroll();
  });
  document.querySelectorAll("[data-parallel-version-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.parallelVersionToggle);
      if (!Number.isInteger(index)) return;
      const closing = state.parallelVersionMenuIndex === index;
      state.parallelVersionMenuIndex = closing ? null : index;
      state.parallelVersionMenuPosition = closing ? null : parallelVersionMenuPositionFor(button);
      renderPreservingReaderScroll();
    });
  });
  document.querySelectorAll("[data-parallel-version-option]").forEach((button) => {
    button.addEventListener("click", async () => {
      const version = button.dataset.parallelVersionOption;
      const index = Number(button.dataset.parallelVersionIndex);
      if (!translationCodes.includes(version) || !Number.isInteger(index)) return;
      state.parallelVersionMenuIndex = null;
      state.parallelVersionMenuPosition = null;
      await setParallelVersionAt(index, version);
    });
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
      persistVersions({ changed: true });
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
  document.getElementById("streakChip")?.addEventListener("click", () => toggleStreakPopover());
  document.querySelector("[data-streak-reference]")?.addEventListener("click", (event) => {
    openStreakEncouragement(event.currentTarget.dataset.streakReference);
  });
  document.getElementById("settingsToggle")?.addEventListener("click", () => {
    if (state.settingsOpen) return closeSettingsPopover();
    state.focusReferenceOpen = false;
    state.focusSearchResultsOpen = false;
    resetFocusToolSurfaces();
    state.settingsPopupPosition = null;
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
    state.focusReferenceOpen = false;
    state.focusSearchResultsOpen = false;
    resetFocusToolSurfaces();
    state.settingsPopupPosition = null;
    state.settingsOpen = !state.settingsOpen;
    state.settingsAnchor = "floating";
    if (state.settingsOpen) state.accountOpen = false;
    renderPreservingReaderScroll();
    requestAnimationFrame(() => positionSettingsPopover("floating"));
  });
  document.getElementById("mobileSettingsClose")?.addEventListener("click", closeSettingsPopover);
  document.getElementById("mobileFocusPassageToggle")?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.focusReferenceOpen = !state.focusReferenceOpen;
    state.focusSearchResultsOpen = false;
    resetFocusToolSurfaces();
    if (state.focusReferenceOpen) {
      state.settingsOpen = false;
      state.settingsPopupPosition = null;
      state.accountOpen = false;
    }
    renderPreservingReaderScroll();
  });
  ["mobileFocusToolsToggle", "desktopFocusToolsToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", (event) => {
      event.stopPropagation();
      const opening = !state.focusToolsOpen;
      resetFocusToolSurfaces();
      state.focusToolsOpen = opening;
      state.focusReferenceOpen = false;
      state.focusSearchResultsOpen = false;
      state.settingsOpen = false;
      state.settingsPopupPosition = null;
      state.accountOpen = false;
      renderPreservingReaderScroll();
    });
  });
  document.querySelectorAll("[data-focus-workspace]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state.focusToolsOpen = true;
      state.focusWorkspacePanel = state.focusWorkspacePanel === button.dataset.focusWorkspace
        ? ""
        : button.dataset.focusWorkspace;
      state.focusReferenceOpen = false;
      state.focusSearchResultsOpen = false;
      state.settingsOpen = false;
      state.settingsPopupPosition = null;
      state.accountOpen = false;
      renderPreservingReaderScroll();
    });
  });
  document.getElementById("mobileFocusWorkspaceClose")?.addEventListener("click", () => {
    state.focusWorkspacePanel = "";
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileFocusSearchResultsClose")?.addEventListener("click", () => {
    state.focusSearchResultsOpen = false;
    renderPreservingReaderScroll();
  });
  document.getElementById("mobileFocusPassagePopover")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitFocusReference(document.getElementById("mobileFocusPassageInput")?.value || "", {
      sourceInputId: "mobileFocusPassageInput",
    });
  });
  document.getElementById("mobileFocusPassageInput")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitFocusReference(event.currentTarget.value, { sourceInputId: "mobileFocusPassageInput" });
  });
  ["appUpdateButton", "mobileAppUpdateButton"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (state.appUpdateAvailable || state.appUpdateRefreshOffered) applyAppUpdate();
      else checkForAppUpdate({ manual: true });
    });
  });
  document.querySelectorAll("[data-settings-section]").forEach((section) => {
    section.addEventListener("toggle", () => rememberDisclosureState(section));
    bindDisclosureAnimation(section);
  });
  document.querySelectorAll("[data-help-section]").forEach((section) => {
    section.addEventListener("toggle", () => rememberDisclosureState(section));
    bindDisclosureAnimation(section);
  });
  document.getElementById("accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event));
  document.getElementById("mobile-accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event, "mobile"));
  document.getElementById("quick-accountForm")?.addEventListener("submit", (event) => handleAccountSubmit(event, "quick"));
  document.querySelectorAll("[id$='accountEmail']").forEach((input) => {
    input.addEventListener("input", () => {
      if (state.authEmailCueId !== input.id) return;
      state.authEmailCueId = "";
      input.classList.remove("account-email-cue");
      input.removeAttribute("aria-invalid");
      input.placeholder = "Email";
    });
  });
  document.querySelectorAll("[data-use-account]").forEach((button) => {
    button.addEventListener("click", () => {
      useRememberedAccount(button.dataset.useAccount, button.dataset.accountPrefix || "");
    });
  });
  document.querySelectorAll("[data-forget-account]").forEach((button) => {
    button.addEventListener("click", () => forgetRememberedAccount(button.dataset.forgetAccount));
  });
  document.getElementById("addAccountButton")?.addEventListener("click", toggleAddAccount);
  document.getElementById("mobile-addAccountButton")?.addEventListener("click", toggleAddAccount);
  document.getElementById("quick-addAccountButton")?.addEventListener("click", toggleAddAccount);
  document.getElementById("cancelAccountSwitchButton")?.addEventListener("click", cancelAccountSwitch);
  document.getElementById("mobile-cancelAccountSwitchButton")?.addEventListener("click", cancelAccountSwitch);
  document.getElementById("quick-cancelAccountSwitchButton")?.addEventListener("click", cancelAccountSwitch);
  document.getElementById("quick-socialProfileForm")?.addEventListener("submit", (event) => saveSocialProfile(event, "quick"));
  document.querySelectorAll("[data-social-profile-disclosure]").forEach((disclosure) => {
    disclosure.addEventListener("toggle", () => {
      state.socialProfileOpen = disclosure.open;
      if (!disclosure.open) closeSocialAvatarPicker();
    });
    disclosure.querySelector("summary")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      disclosure.open = !disclosure.open;
    });
  });
  document.querySelectorAll("[data-social-connections-disclosure]").forEach((disclosure) => {
    disclosure.addEventListener("toggle", () => {
      setSocialConnectionsOpen(disclosure.open);
    });
    disclosure.querySelector("summary")?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      disclosure.open = !disclosure.open;
    });
  });
  document.getElementById("quick-profileUsername")?.addEventListener("blur", (event) => {
    event.currentTarget.value = normalizeProfileUsername(event.currentTarget.value);
  });
  document.querySelectorAll("[data-profile-avatar]").forEach((button) => {
    button.addEventListener("click", () => selectSocialProfileAvatar(button.dataset.profileAvatar, "quick"));
  });
  document.querySelectorAll("[data-profile-avatar-more]").forEach((button) => {
    button.addEventListener("click", () => {
      openSocialAvatarPicker(button, button.dataset.profileAvatarPrefix || "quick");
    });
  });
  document.getElementById("quick-friendSearchForm")?.addEventListener("submit", (event) => searchFriends(event, "quick"));
  document.querySelectorAll("[data-friends-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!["friends", "requests", "find"].includes(button.dataset.friendsTab)) return;
      state.friendsPanelTab = button.dataset.friendsTab;
      state.friendshipMessage = "";
      renderPreservingReaderScroll();
    });
  });
  document.querySelectorAll("[data-friend-action]").forEach((button) => {
    button.addEventListener("click", () => handleFriendAction(button));
  });
  document.querySelectorAll("[data-game-challenge-action]").forEach((button) => {
    button.addEventListener("click", () => handleGameChallengeAction(button));
  });
  document.querySelectorAll("[data-game-challenge-popup-dismiss]").forEach((button) => {
    button.addEventListener("click", () => dismissGameChallengePopup());
  });
  document.getElementById("gameChallengePopupDialog")?.addEventListener("keydown", trapGameChallengePopupFocus);
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
  document.getElementById("switchAccountButton")?.addEventListener("click", switchAccount);
  document.getElementById("mobile-switchAccountButton")?.addEventListener("click", switchAccount);
  document.getElementById("quick-switchAccountButton")?.addEventListener("click", switchAccount);
  document.getElementById("signOutButton")?.addEventListener("click", () => signOutAccount());
  document.getElementById("mobile-signOutButton")?.addEventListener("click", () => signOutAccount());
  document.getElementById("quick-signOutButton")?.addEventListener("click", () => signOutAccount());
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
  document.querySelectorAll("[data-interface-text-size-choice]").forEach((button) => {
    button.addEventListener("click", () => setInterfaceTextSize(button.dataset.interfaceTextSizeChoice));
  });
  document.querySelectorAll("[data-auto-scroll-speed]").forEach((button) => {
    button.addEventListener("click", () => setReaderAutoScrollSpeed(button.dataset.autoScrollSpeed));
  });
  ["autoScrollEnabledToggle", "mobileAutoScrollEnabledToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      setReaderAutoScrollEnabled(event.target.checked);
    });
  });
  ["edgeChapterNavigationToggle", "mobileEdgeChapterNavigationToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      setEdgeChapterNavigationEnabled(event.target.checked);
    });
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
  document.querySelectorAll("[data-print-layout]").forEach((button) => {
    button.addEventListener("click", () => {
      const layout = button.dataset.printLayout;
      if (!printLayoutCodes.includes(layout) || layout === state.printLayout) return;
      state.printLayout = layout;
      localStorage.setItem("lw_print_layout", layout);
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  ["printVerseNumbersToggle", "mobilePrintVerseNumbersToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.printVerseNumbers = event.target.checked;
      localStorage.setItem("lw_print_verse_numbers", state.printVerseNumbers ? "true" : "false");
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  ["printFullVersionNameToggle", "mobilePrintFullVersionNameToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.printFullVersionName = event.target.checked;
      localStorage.setItem("lw_print_full_version_name", state.printFullVersionName ? "true" : "false");
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  document.getElementById("sectionHeadingsToggle")?.addEventListener("change", (event) => {
    setSectionHeadings(event.target.checked);
  });
  document.getElementById("mobileSectionHeadingsToggle")?.addEventListener("change", (event) => {
    setSectionHeadings(event.target.checked);
  });
  document.getElementById("redLettersToggle")?.addEventListener("change", (event) => {
    setRedLetters(event.target.checked, true);
  });
  document.getElementById("mobileRedLettersToggle")?.addEventListener("change", (event) => {
    setRedLetters(event.target.checked, true);
  });
  document.getElementById("strongNumbersToggle")?.addEventListener("change", (event) => {
    setStrongNumbers(event.target.checked, true);
  });
  document.getElementById("mobileStrongNumbersToggle")?.addEventListener("change", (event) => {
    setStrongNumbers(event.target.checked, true);
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
  ["challengeQuietModeToggle", "mobileChallengeQuietModeToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.challengeQuietMode = event.target.checked;
      localStorage.setItem("lw_challenge_quiet_mode", state.challengeQuietMode ? "true" : "false");
      scheduleCloudSync();
      renderPreservingReaderScroll();
    });
  });
  ["PushNotificationsToggle", "mobilePushNotificationsToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      if (event.target.checked) enablePushNotifications();
      else disablePushNotifications();
    });
  });
  ["PushMorningTime", "mobilePushMorningTime"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      if (!validPushTime(event.target.value)) return;
      state.pushMorningTime = event.target.value;
      savePushPreferences();
    });
  });
  ["PushEveningToggle", "mobilePushEveningToggle"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state.pushEveningEnabled = event.target.checked;
      savePushPreferences();
      renderPreservingReaderScroll();
    });
  });
  ["PushEveningTime", "mobilePushEveningTime"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      if (!validPushTime(event.target.value)) return;
      state.pushEveningTime = event.target.value;
      savePushPreferences();
    });
  });
  [
    ["PushFriendRequestToggle", "pushFriendRequestNotifications"],
    ["mobilePushFriendRequestToggle", "pushFriendRequestNotifications"],
    ["PushGameChallengeToggle", "pushGameChallengeNotifications"],
    ["mobilePushGameChallengeToggle", "pushGameChallengeNotifications"],
    ["PushChallengeAcceptedToggle", "pushChallengeAcceptedNotifications"],
    ["mobilePushChallengeAcceptedToggle", "pushChallengeAcceptedNotifications"],
  ].forEach(([id, stateKey]) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      state[stateKey] = event.target.checked;
      savePushPreferences();
    });
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
  document.querySelectorAll("[data-popup-drag-handle]").forEach((handle) => {
    handle.addEventListener("pointerdown", beginPopupDrag);
  });
  document.querySelector(".shortcut-overlay")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("shortcut-overlay")) toggleShortcuts(false);
  });
  document.getElementById("aboutMenuButton")?.addEventListener("click", () => toggleAboutMenu(true, "aboutMenuButton"));
  document.getElementById("presentationAboutMenuButton")?.addEventListener("click", () => toggleAboutMenu(true, "presentationAboutMenuButton"));
  document.getElementById("closeAboutMenu")?.addEventListener("click", () => toggleAboutMenu(false));
  document.querySelector(".about-menu-overlay")?.addEventListener("click", (event) => {
    if (event.target.classList.contains("about-menu-overlay")) toggleAboutMenu(false);
  });
  document.getElementById("aboutMenuDialog")?.addEventListener("keydown", trapAboutMenuFocus);
  document.getElementById("enablePushPrompt")?.addEventListener("click", acceptPushPermissionPrompt);
  document.getElementById("dismissPushPrompt")?.addEventListener("click", dismissPushPermissionPrompt);
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
  document.getElementById("brandVerseOfDay")?.addEventListener("click", () => openVerseOfDay());
  document.getElementById("verseOfDayReadInBible")?.addEventListener("click", (event) => {
    event.stopPropagation();
    openVerseOfDayInReader();
  });
  document.getElementById("presentationBrandVerseOfDay")?.addEventListener("click", (event) => {
    event.preventDefault();
    openVerseOfDay({ mode: "big" });
  });
  document.getElementById("exitFocusInline")?.addEventListener("click", toggleFocusMode);
  document.getElementById("closeLibrary")?.addEventListener("click", closeLibrary);
  document.querySelector(".library")?.addEventListener("scroll", () => rememberLibraryScroll(), { passive: true });
  document.querySelectorAll("[data-trivia-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const pendingChallenge = activeGameChallenge();
      if (pendingChallenge?.status === "pending") {
        showToast("This setup is locked for the waiting room");
        return;
      }
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
    const pendingChallenge = activeGameChallenge();
    if (pendingChallenge?.status === "pending") {
      renderPreservingReaderScroll();
      return showToast("This setup is locked for the waiting room");
    }
    state.triviaCategory = event.target.value;
    localStorage.setItem("lw_trivia_category", state.triviaCategory);
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaDifficultySelect")?.addEventListener("change", (event) => {
    const pendingChallenge = activeGameChallenge();
    if (pendingChallenge?.status === "pending") {
      renderPreservingReaderScroll();
      return showToast("This setup is locked for the waiting room");
    }
    state.triviaDifficulty = event.target.value;
    localStorage.setItem("lw_trivia_difficulty", state.triviaDifficulty);
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("triviaCountSelect")?.addEventListener("change", (event) => {
    const pendingChallenge = activeGameChallenge();
    if (pendingChallenge?.status === "pending") {
      renderPreservingReaderScroll();
      return showToast("This setup is locked for the waiting room");
    }
    state.triviaCount = normalizedTriviaCount(state.triviaGameType, Number(event.target.value) || 10);
    localStorage.setItem("lw_trivia_count", String(state.triviaCount));
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.querySelectorAll("[data-challenge-friend]").forEach((button) => {
    button.addEventListener("click", () => {
      const userId = button.dataset.challengeFriend || "";
      if (!userId) return;
      if (state.challengeOpponentIds.includes(userId)) {
        state.challengeOpponentIds = state.challengeOpponentIds.filter((selectedId) => selectedId !== userId);
      } else if (state.challengeOpponentIds.length < 9) {
        state.challengeOpponentIds = [...state.challengeOpponentIds, userId];
      } else {
        showToast("Game rooms support up to 10 players");
        return;
      }
      renderPreservingReaderScroll();
    });
  });
  document.getElementById("sendGameChallenge")?.addEventListener("click", () => sendGameChallenge());
  document.getElementById("bookSprintSoundToggle")?.addEventListener("click", () => {
    state.bookSprintSound = !state.bookSprintSound;
    localStorage.setItem("lw_book_sprint_sound", state.bookSprintSound ? "true" : "false");
    if (state.bookSprintSound) primeBookSprintAudio();
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("referenceRushTimerToggle")?.addEventListener("click", () => {
    const pendingChallenge = activeGameChallenge();
    if (pendingChallenge?.status === "pending") {
      return showToast("This setup is locked for the waiting room");
    }
    state.referenceRushTimed = !state.referenceRushTimed;
    localStorage.setItem("lw_reference_rush_timed", state.referenceRushTimed ? "true" : "false");
    scheduleCloudSync();
    renderPreservingReaderScroll();
  });
  document.getElementById("startTriviaGame")?.addEventListener("click", startTriviaGame);
  document.getElementById("restartTriviaGame")?.addEventListener("click", () => {
    if (state.triviaGame?.challengeId) return showToast("Live challenge rounds cannot be restarted");
    startTriviaGame();
  });
  document.getElementById("exitTriviaGame")?.addEventListener("click", exitTriviaGame);
  document.getElementById("newTriviaGame")?.addEventListener("click", () => {
    cleanupTriviaCelebration();
    state.activeGameChallengeId = "";
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
      const nextReference = event.target.value;
      pushCurrentReturnTargetForNavigation(nextReference, bibleData[nextReference]?.verses?.[0]?.n);
      state.reference = nextReference;
      state.verse = currentChapter().verses[0].n;
      state.selectedVerses = [];
      state.isVerseOfDayActive = false;
      render();
    });
  });
  ["verseSelect", "verseSelectInline"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", (event) => {
      const nextVerse = Number(event.target.value);
      pushCurrentReturnTargetForNavigation(state.reference, nextVerse);
      state.verse = nextVerse;
      state.isVerseOfDayActive = false;
      if (id === "verseSelect") {
        state.pendingVerseFocus = true;
        dismissLibraryAfterAction();
      }
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
  document.querySelectorAll("[data-heading-reference]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      gotoReference(button.dataset.headingReference || "", { linkNavigation: true });
    });
  });
  document.querySelectorAll("[data-scripture-reference]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      gotoReference(button.dataset.scriptureReference || "", { linkNavigation: true });
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
  document.querySelectorAll("[data-note-reference]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openNoteComposer(button.dataset.noteReference, button);
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
      const fromFocusWorkspace = Boolean(button.closest(".mobile-focus-workspace"));
      if (fromFocusWorkspace) resetFocusToolSurfaces();
      const closeLibraryAfterNavigation = !fromFocusWorkspace && button.dataset.keepLibraryOpen !== "true";
      if (!closeLibraryAfterNavigation) rememberOpenLibraryState();
      const focusVerse = button.dataset.gotoVerse ? Number(button.dataset.gotoVerse) : NaN;
      gotoReference(button.dataset.goto, {
        focusVerse,
        libraryScroll: closeLibraryAfterNavigation ? null : captureLibraryScroll(),
        closeLibrary: closeLibraryAfterNavigation,
        linkNavigation: button.dataset.linkNavigation === "true",
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
      editNote(button.dataset.editNote, button);
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
    if (event.key === "Enter") {
      event.preventDefault();
      runReferenceOrPhraseSearch(event.currentTarget.value, { sourceInputId: "referenceInput" });
    }
  });
  document.querySelectorAll("[data-search-scope-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSearchScopeMenu(event.currentTarget);
    });
    trigger.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openSearchScopeMenu(event.currentTarget, { focusLast: event.key === "ArrowUp" });
    });
  });
  document.getElementById("studySearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runReferenceOrPhraseSearch(document.getElementById("studySearchInput")?.value || "", {
      scope: state.searchScope,
      sourceInputId: "studySearchInput",
    });
  });
  document.getElementById("studySearchInput")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    runReferenceOrPhraseSearch(event.currentTarget.value, {
      scope: state.searchScope,
      sourceInputId: "studySearchInput",
    });
  });
  document.querySelectorAll("[data-clear-search]").forEach((button) => {
    button.addEventListener("click", clearSearchResults);
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
  document.getElementById("presentationDecreaseText")?.addEventListener("click", () => adjustPresentationTextScale(-0.1, { feedback: true }));
  document.getElementById("presentationIncreaseText")?.addEventListener("click", () => adjustPresentationTextScale(0.1, { feedback: true }));
  document.getElementById("presentationResetText")?.addEventListener("click", () => resetPresentationTextScale({ feedback: true }));
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
  document.getElementById("presentation")?.addEventListener("touchstart", handlePresentationTouchStart, { passive: true });
  document.getElementById("presentation")?.addEventListener("touchmove", handlePresentationTouchMove, { passive: false });
  document.getElementById("presentation")?.addEventListener("touchend", handlePresentationTouchEnd, { passive: false });
  document.getElementById("presentation")?.addEventListener("touchcancel", cancelPresentationTouch, { passive: true });
  const scriptureTouchSurface = document.querySelector(".scripture");
  document.getElementById("readerAutoScrollButton")?.addEventListener("click", () => {
    toggleReaderAutoScroll({ announce: false });
  });
  bindReaderChapterEdgeBuffer(scriptureTouchSurface);
  scriptureTouchSurface?.addEventListener("wheel", handleReaderChapterWheel, { passive: false });
  scriptureTouchSurface?.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") pauseReaderAutoScroll();
  }, { passive: true });
  scriptureTouchSurface?.addEventListener("touchstart", handleReaderChapterPullStart, { passive: true });
  scriptureTouchSurface?.addEventListener("touchmove", handleReaderChapterPullMove, { passive: false });
  scriptureTouchSurface?.addEventListener("touchend", handleReaderChapterPullEnd, { passive: false });
  scriptureTouchSurface?.addEventListener("touchcancel", cancelReaderChapterPull, { passive: true });
  scriptureTouchSurface?.addEventListener("touchstart", handleReaderChapterSwipeStart, { passive: true });
  scriptureTouchSurface?.addEventListener("touchend", handleReaderChapterSwipeEnd, { passive: true });
  scriptureTouchSurface?.addEventListener("touchstart", handleReaderGestureStart, { passive: true });
  scriptureTouchSurface?.addEventListener("touchmove", handleReaderGestureMove, { passive: false });
  scriptureTouchSurface?.addEventListener("touchend", handleReaderGestureEnd, { passive: false });
  scriptureTouchSurface?.addEventListener("touchcancel", cancelReaderTouchGesture, { passive: true });
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
  document.getElementById("noteComposerForm")?.addEventListener("submit", saveNoteComposer);
  document.getElementById("closeNoteComposer")?.addEventListener("click", closeNoteComposer);
  document.getElementById("cancelNoteComposer")?.addEventListener("click", closeNoteComposer);
  document.getElementById("deleteNoteComposer")?.addEventListener("click", deleteNoteComposer);
  document.getElementById("noteComposer")?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeNoteComposer();
  });
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
  document.getElementById("presentationReferenceBackToBible")?.addEventListener("click", (event) => {
    event.preventDefault();
    returnFromPresentationToBible();
  });
  window.onkeydown = handleGlobalShortcuts;
}

function returnFromPresentationToBible() {
  clearTimeout(presentationControlsTimer);
  if (state.mode !== "big") {
    switchMode("reader");
    return;
  }
  state.mode = "reader";
  state.presentationSearchOpen = false;
  state.presentationSettingsOpen = false;
  state.presentationControlsVisible = false;
  state.pendingVerseFocus = true;
  updateShareUrl();
  render();
}

async function setPrimaryVersion(version, options = {}) {
  if (!translationCodes.includes(version)) return;
  state.versions = [version, ...state.versions.filter((item) => item !== version)];
  state.presentationPart = 0;
  persistVersions({ changed: true });
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

async function setParallelVersionAt(index, version) {
  const versions = activeVersions();
  if (!versions[index] || versions[index] === version) {
    return renderPreservingReaderScroll();
  }
  if (versions.includes(version)) return showToast(`${translationDisplayCode(version)} is already selected`);
  state.versions[index] = version;
  persistVersions({ changed: true });
  scheduleCloudSync();
  if (isRemoteTranslation(version)) await loadBibleVersion("BSB");
  await loadBibleVersion(version);
  rebuildBibleData();
  renderPreservingReaderScroll();
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

function setRedLetters(enabled, preserveScroll = false) {
  state.redLetters = Boolean(enabled);
  localStorage.setItem("lw_red_letters", state.redLetters ? "true" : "false");
  scheduleCloudSync();
  if (preserveScroll) renderPreservingReaderScroll();
  else render();
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

function startTriviaGame({ render = true } = {}) {
  cleanupTriviaCelebration();
  if (state.triviaGameType === "verse-order") return startVerseOrderGame({ render });
  if (state.triviaGameType === "reference-rush") return startReferenceRushGame({ render });
  if (state.triviaGameType === "book-sprint") return startBookSprintGame({ render });
  if (state.triviaGameType === "who-said-it") return startWhoSaidItGame({ render });
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
  if (render) renderPreservingReaderScroll();
}

function startReferenceRushGame({ render = true } = {}) {
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
  if (render) renderPreservingReaderScroll();
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
  const challengeVersion = activeGameChallenge()?.version;
  if (challengeVersion && isBundledTranslation(challengeVersion)) return challengeVersion;
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

function normalizedSearchScope(value) {
  const scope = String(value || "").toLowerCase();
  return searchScopeCodes.includes(scope) ? scope : "all";
}

function normalizedSearchChapter(value) {
  const parsed = parsePassageReference(String(value || ""));
  return parsed?.key || String(value || "").trim();
}

function searchScopeLabel(scope, currentChapter = "") {
  const definition = searchScopeDefinitions.find(({ code }) => code === normalizedSearchScope(scope));
  const chapter = normalizedSearchChapter(currentChapter);
  if (definition?.code === "book") {
    const book = bookFromChapterKey(chapter);
    return book ? `${definition.label} (${book})` : definition.label;
  }
  if (definition?.code === "chapter") return chapter ? `${definition.label} (${chapter})` : definition.label;
  return definition?.label || "All Bible";
}

function searchScopeShortLabel(scope) {
  return searchScopeDefinitions.find(({ code }) => code === normalizedSearchScope(scope))?.shortLabel || "All";
}

function searchScopeTriggerLabel(trigger, scopeLabel) {
  if (trigger?.id === "topbarSearchScope") return `Choose top search scope, current ${scopeLabel}`;
  if (trigger?.id === "mobileFocusSearchScope") return `Choose Focus search scope, current ${scopeLabel}`;
  return `Choose search scope, current ${scopeLabel}`;
}

function toggleSearchScopeMenu(trigger) {
  if (activeSearchScopeMenu?.trigger === trigger) {
    closeSearchScopeMenu({ restoreFocus: true });
    return;
  }
  openSearchScopeMenu(trigger);
}

function openSearchScopeMenu(trigger, options = {}) {
  if (!trigger) return;
  closeSearchScopeMenu();
  const scope = normalizedSearchScope(state.searchScope);
  const menu = document.createElement("div");
  menu.className = "search-scope-popover";
  menu.id = "searchScopePopover";
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Search scope");
  menu.innerHTML = searchScopeDefinitions.map(({ code }) => {
    const selected = code === scope;
    return `
      <button class="search-scope-option ${selected ? "selected" : ""}" type="button" role="option" aria-selected="${selected ? "true" : "false"}" data-search-scope-option="${code}">
        <span class="search-scope-option-check" aria-hidden="true">${selected ? "✓" : ""}</span>
        <span>${escapeHtml(searchScopeLabel(code, state.reference))}</span>
      </button>
    `;
  }).join("");
  document.body.appendChild(menu);
  activeSearchScopeMenu = { menu, trigger };
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-controls", menu.id);
  menu.querySelectorAll("[data-search-scope-option]").forEach((button) => {
    button.addEventListener("click", () => {
      setSearchScope(button.dataset.searchScopeOption);
      closeSearchScopeMenu({ restoreFocus: true });
    });
  });
  menu.addEventListener("keydown", handleSearchScopeMenuKeydown);
  document.addEventListener("pointerdown", closeSearchScopeMenuOnOutside, true);
  window.addEventListener("resize", positionSearchScopeMenu);
  window.addEventListener("scroll", positionSearchScopeMenu, true);
  positionSearchScopeMenu();
  const optionButtons = Array.from(menu.querySelectorAll("[data-search-scope-option]"));
  const focusTarget = options.focusLast
    ? optionButtons[optionButtons.length - 1]
    : menu.querySelector('[aria-selected="true"]') || optionButtons[0];
  requestAnimationFrame(() => {
    focusTarget?.focus({ preventScroll: true });
    focusTarget?.scrollIntoView({ block: "nearest" });
  });
}

function closeSearchScopeMenu(options = {}) {
  if (!activeSearchScopeMenu) return;
  const { menu, trigger } = activeSearchScopeMenu;
  activeSearchScopeMenu = null;
  menu.remove();
  trigger?.setAttribute("aria-expanded", "false");
  trigger?.removeAttribute("aria-controls");
  document.removeEventListener("pointerdown", closeSearchScopeMenuOnOutside, true);
  window.removeEventListener("resize", positionSearchScopeMenu);
  window.removeEventListener("scroll", positionSearchScopeMenu, true);
  if (options.restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
}

function closeSearchScopeMenuOnOutside(event) {
  if (!activeSearchScopeMenu) return;
  const { menu, trigger } = activeSearchScopeMenu;
  if (menu.contains(event.target) || trigger.contains(event.target)) return;
  closeSearchScopeMenu();
}

function handleSearchScopeMenuKeydown(event) {
  if (!activeSearchScopeMenu) return;
  const options = Array.from(activeSearchScopeMenu.menu.querySelectorAll("[data-search-scope-option]"));
  const index = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeSearchScopeMenu({ restoreFocus: true });
    return;
  }
  if (event.key === "Tab") {
    closeSearchScopeMenu();
    return;
  }
  let nextIndex = index;
  if (event.key === "ArrowDown") nextIndex = Math.min(options.length - 1, index + 1);
  else if (event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = options.length - 1;
  else return;
  event.preventDefault();
  options[nextIndex]?.focus({ preventScroll: true });
  options[nextIndex]?.scrollIntoView({ block: "nearest" });
}

function positionSearchScopeMenu() {
  if (!activeSearchScopeMenu) return;
  const { menu, trigger } = activeSearchScopeMenu;
  if (!trigger?.isConnected) return closeSearchScopeMenu();
  const margin = 12;
  const gap = 6;
  const anchor = trigger.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const width = Math.min(270, viewportWidth - margin * 2);
  const availableBelow = Math.max(0, viewportHeight - anchor.bottom - gap - margin);
  const availableAbove = Math.max(0, anchor.top - gap - margin);
  const openBelow = availableBelow >= availableAbove;
  const availableHeight = Math.max(96, openBelow ? availableBelow : availableAbove);
  menu.style.width = `${Math.round(width)}px`;
  menu.style.maxHeight = `${Math.round(Math.min(viewportHeight - margin * 2, availableHeight))}px`;
  const menuHeight = menu.getBoundingClientRect().height;
  const left = Math.min(Math.max(margin, anchor.left), viewportWidth - width - margin);
  const top = openBelow
    ? Math.min(viewportHeight - menuHeight - margin, anchor.bottom + gap)
    : Math.max(margin, anchor.top - menuHeight - gap);
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function setSearchScope(value) {
  const scope = normalizedSearchScope(value);
  const scopeLabel = searchScopeLabel(scope, state.reference);
  const shortLabel = searchScopeShortLabel(scope);
  const hadInlineChapterSearch = Boolean(state.inlineSearchQuery);
  state.searchScope = scope;
  localStorage.setItem("lw_search_scope", scope);
  document.querySelectorAll("[data-search-scope-trigger]").forEach((trigger) => {
    trigger.dataset.searchScope = scope;
    trigger.setAttribute("aria-label", searchScopeTriggerLabel(trigger, scopeLabel));
  });
  document.querySelectorAll("[data-search-scope-short]").forEach((label) => {
    label.textContent = shortLabel;
  });
  document.querySelectorAll("[data-search-scope-control]").forEach((control) => {
    control.title = `Search scope: ${scopeLabel}`;
  });
  document.getElementById("studySearchButton")?.setAttribute("aria-label", `Search ${scopeLabel}`);
  if (scope !== "chapter" && hadInlineChapterSearch) {
    clearInlineChapterSearchState();
    renderPreservingReaderScroll();
  }
}

function chapterMatchesSearchScope(chapterKey, scope, currentChapter = "") {
  const normalizedScope = normalizedSearchScope(scope);
  if (normalizedScope === "all") return true;
  const normalizedChapterKey = normalizedSearchChapter(chapterKey);
  if (normalizedScope === "book") {
    const currentBook = bookFromChapterKey(normalizedSearchChapter(currentChapter));
    return Boolean(currentBook && bookFromChapterKey(normalizedChapterKey) === currentBook);
  }
  if (normalizedScope === "chapter") {
    const normalizedCurrentChapter = normalizedSearchChapter(currentChapter);
    return Boolean(normalizedCurrentChapter && normalizedChapterKey === normalizedCurrentChapter);
  }
  const book = bookFromChapterKey(normalizedChapterKey);
  if (normalizedScope === "ot") return oldTestamentBooks.includes(book);
  if (normalizedScope === "nt") return newTestamentBooks.includes(book);
  return Boolean(searchScopeBookGroups[normalizedScope]?.includes(book));
}

function referenceMatchesSearchScope(reference, scope, currentChapter = "") {
  const normalizedScope = normalizedSearchScope(scope);
  if (normalizedScope === "all") return true;
  const parsed = parsePassageReference(reference);
  return chapterMatchesSearchScope(parsed?.key || String(reference || ""), normalizedScope, currentChapter);
}

function startBookSprintGame({ render = true } = {}) {
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
  if (render) renderPreservingReaderScroll();
}

function createBookSprintPuzzle() {
  const size = state.triviaDifficulty === "Hard" ? 7 : state.triviaDifficulty === "Medium" ? 6 : 5;
  const start = Math.floor(triviaRandomSource() * (books.length - size + 1));
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
  { difficulty: "easy", quote: "Speak, LORD, for Your servant is listening.", answer: "Samuel", choices: ["Samuel", "Eli", "David", "Solomon"], reference: "1 Samuel 3:10", explanation: "Samuel answered the LORD after Eli taught him how to respond." },
  { difficulty: "easy", quote: "My Lord and my God!", answer: "Thomas", choices: ["Thomas", "Peter", "John", "Philip"], reference: "John 20:28", explanation: "Thomas said this after seeing the risen Jesus." },
  { difficulty: "easy", quote: "As for me and my house, we will serve the LORD.", answer: "Joshua", choices: ["Joshua", "Moses", "Caleb", "Gideon"], reference: "Joshua 24:15", explanation: "Joshua called Israel to covenant faithfulness." },
  { difficulty: "medium", quote: "Create in me a clean heart, O God.", answer: "David", choices: ["David", "Solomon", "Asaph", "Moses"], reference: "Psalm 51:10", explanation: "David prayed this after his sin was exposed." },
  { difficulty: "medium", quote: "Vanity of vanities, says the Teacher.", answer: "Solomon", choices: ["Solomon", "Job", "David", "Agur"], reference: "Ecclesiastes 1:2", explanation: "Ecclesiastes is traditionally associated with Solomon's wisdom." },
  { difficulty: "easy", quote: "Let it be to me according to your word.", answer: "Mary", choices: ["Mary", "Elizabeth", "Anna", "Martha"], reference: "Luke 1:38", explanation: "Mary responded faithfully to Gabriel's announcement." },
  { difficulty: "medium", quote: "Lord, to whom shall we go? You have the words of eternal life.", answer: "Peter", choices: ["Peter", "John", "Andrew", "James"], reference: "John 6:68", explanation: "Peter answered when many disciples turned away." },
  { difficulty: "medium", quote: "Believe in the Lord Jesus, and you will be saved.", answer: "Paul and Silas", choices: ["Paul and Silas", "Peter and John", "Barnabas and Mark", "Aquila and Priscilla"], reference: "Acts 16:31", explanation: "Paul and Silas answered the Philippian jailer." },
  { difficulty: "easy", quote: "Am I my brother's keeper?", answer: "Cain", choices: ["Cain", "Esau", "Laban", "Reuben"], reference: "Genesis 4:9", explanation: "Cain spoke this after murdering Abel." },
  { difficulty: "medium", quote: "Who knows if perhaps you have come to the kingdom for such a time as this?", answer: "Mordecai", choices: ["Mordecai", "Haman", "Ezra", "Nehemiah"], reference: "Esther 4:14", explanation: "Mordecai urged Esther to act courageously." },
  { difficulty: "medium", quote: "I know that my Redeemer lives.", answer: "Job", choices: ["Job", "David", "Isaiah", "Daniel"], reference: "Job 19:25", explanation: "Job confessed hope in his Redeemer amid suffering." },
  { difficulty: "hard", quote: "Almost you persuade me to become a Christian.", answer: "Agrippa", choices: ["Agrippa", "Festus", "Felix", "Pilate"], reference: "Acts 26:28", explanation: "Agrippa responded to Paul's testimony." },
  { difficulty: "medium", quote: "Silver and gold I do not have, but what I have I give you.", answer: "Peter", choices: ["Peter", "Paul", "Stephen", "Philip"], reference: "Acts 3:6", explanation: "Peter spoke to the lame man at the temple gate." },
  { difficulty: "medium", quote: "I see the heavens opened and the Son of Man standing at the right hand of God.", answer: "Stephen", choices: ["Stephen", "Paul", "John", "Peter"], reference: "Acts 7:56", explanation: "Stephen saw this vision before his death." },
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
  { difficulty: "medium", quote: "We will serve the LORD our God, and we will listen to His voice.", answer: "The Israelites", choices: ["The Israelites", "The Levites", "Joshua's elders", "Caleb's family"], reference: "Joshua 24:24", explanation: "The people answered Joshua's covenant challenge with this promise." },
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
  { difficulty: "hard", quote: "Bring your youngest brother to me.", answer: "Joseph", choices: ["Joseph", "Judah", "Reuben", "Pharaoh"], reference: "Genesis 42:20", explanation: "Joseph tested his brothers before revealing himself." },
  { difficulty: "hard", quote: "Is the LORD among us or not?", answer: "The Israelites", choices: ["The Israelites", "The Egyptians", "The Philistines", "The disciples"], reference: "Exodus 17:7", explanation: "Israel tested the LORD at Massah and Meribah." },
  { difficulty: "hard", quote: "Who is on the LORD's side?", answer: "Moses", choices: ["Moses", "Joshua", "Aaron", "Phinehas"], reference: "Exodus 32:26", explanation: "Moses called for loyalty after the golden calf." },
  { difficulty: "hard", quote: "Would that all the LORD's people were prophets.", answer: "Moses", choices: ["Moses", "Joshua", "Samuel", "Elijah"], reference: "Numbers 11:29", explanation: "Moses welcomed the Spirit's work beyond himself." },
  { difficulty: "hard", quote: "Let me die with the Philistines.", answer: "Samson", choices: ["Samson", "Saul", "Jonathan", "Abimelech"], reference: "Judges 16:30", explanation: "Samson said this as he pushed down the pillars." },
  { difficulty: "medium", quote: "Do not call me Naomi. Call me Mara.", answer: "Naomi", choices: ["Naomi", "Ruth", "Orpah", "Hannah"], reference: "Ruth 1:20", explanation: "Naomi spoke from grief after returning to Bethlehem." },
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
  { difficulty: "easy", quote: "Where are you?", answer: "God", choices: ["God", "Adam", "Cain", "Noah"], reference: "Genesis 3:9", explanation: "God called to Adam in the garden after Adam and Eve hid." },
  { difficulty: "easy", quote: "You will not surely die.", answer: "The serpent", choices: ["The serpent", "Eve", "Cain", "Lamech"], reference: "Genesis 3:4", explanation: "The serpent contradicted God's warning in Eden." },
  { difficulty: "easy", quote: "Come into the ark, you and all your household.", answer: "God", choices: ["God", "Noah", "Shem", "Methuselah"], reference: "Genesis 7:1", explanation: "God called Noah's family into the ark before the flood." },
  { difficulty: "easy", quote: "I will set My rainbow in the cloud.", answer: "God", choices: ["God", "Noah", "Abraham", "Moses"], reference: "Genesis 9:13", explanation: "God gave the rainbow as the sign of His covenant after the flood." },
  { difficulty: "easy", quote: "God will provide Himself the lamb.", answer: "Abraham", choices: ["Abraham", "Isaac", "Jacob", "Moses"], reference: "Genesis 22:8", explanation: "Abraham answered Isaac on the way to Moriah." },
  { difficulty: "easy", quote: "I will not let You go unless You bless me.", answer: "Jacob", choices: ["Jacob", "Esau", "Abraham", "Moses"], reference: "Genesis 32:26", explanation: "Jacob said this while wrestling through the night." },
  { difficulty: "easy", quote: "Am I in the place of God?", answer: "Joseph", choices: ["Joseph", "Moses", "David", "Daniel"], reference: "Genesis 50:19", explanation: "Joseph answered his fearful brothers after Jacob died." },
  { difficulty: "easy", quote: "Who is the LORD, that I should obey His voice?", answer: "Pharaoh", choices: ["Pharaoh", "Moses", "Aaron", "Nebuchadnezzar"], reference: "Exodus 5:2", explanation: "Pharaoh rejected the LORD's command to release Israel." },
  { difficulty: "easy", quote: "Please show me Your glory.", answer: "Moses", choices: ["Moses", "Joshua", "Elijah", "Isaiah"], reference: "Exodus 33:18", explanation: "Moses asked to see God's glory after interceding for Israel." },
  { difficulty: "easy", quote: "The LORD your God, He is God in heaven above and on earth beneath.", answer: "Rahab", choices: ["Rahab", "Ruth", "Deborah", "Esther"], reference: "Joshua 2:11", explanation: "Rahab confessed faith to the spies in Jericho." },
  { difficulty: "easy", quote: "You come to me with a sword, with a spear, and with a javelin.", answer: "David", choices: ["David", "Goliath", "Saul", "Jonathan"], reference: "1 Samuel 17:45", explanation: "David answered Goliath before the battle." },
  { difficulty: "easy", quote: "Am I a dog, that you come to me with sticks?", answer: "Goliath", choices: ["Goliath", "Saul", "Nabal", "Abner"], reference: "1 Samuel 17:43", explanation: "Goliath mocked David when he saw the staff in his hand." },
  { difficulty: "easy", quote: "You are the man!", answer: "Nathan", choices: ["Nathan", "Samuel", "Elijah", "Micaiah"], reference: "2 Samuel 12:7", explanation: "Nathan confronted David after telling the parable of the ewe lamb." },
  { difficulty: "easy", quote: "I have sinned against the LORD.", answer: "David", choices: ["David", "Saul", "Ahab", "Manasseh"], reference: "2 Samuel 12:13", explanation: "David confessed after Nathan exposed his sin." },
  { difficulty: "easy", quote: "The LORD, He is God! The LORD, He is God!", answer: "The people of Israel", choices: ["The people of Israel", "Elijah", "Ahab", "The prophets of Baal"], reference: "1 Kings 18:39", explanation: "The people cried this after fire fell on Mount Carmel." },
  { difficulty: "easy", quote: "Curse God, and die!", answer: "Job's wife", choices: ["Job's wife", "Eliphaz", "Bildad", "Zophar"], reference: "Job 2:9", explanation: "Job's wife said this during Job's suffering." },
  { difficulty: "easy", quote: "Shall we receive good from God, and shall we not receive evil?", answer: "Job", choices: ["Job", "Solomon", "David", "Jeremiah"], reference: "Job 2:10", explanation: "Job answered his wife after she told him to curse God." },
  { difficulty: "easy", quote: "You will conceive in your womb and bring forth a son.", answer: "Gabriel", choices: ["Gabriel", "Elizabeth", "Zechariah", "Joseph"], reference: "Luke 1:31", explanation: "Gabriel announced Jesus' birth to Mary." },
  { difficulty: "easy", quote: "Blessed are you among women.", answer: "Elizabeth", choices: ["Elizabeth", "Mary", "Anna", "Martha"], reference: "Luke 1:42", explanation: "Elizabeth blessed Mary when Mary came to visit." },
  { difficulty: "easy", quote: "My soul magnifies the Lord.", answer: "Mary", choices: ["Mary", "Elizabeth", "Hannah", "Anna"], reference: "Luke 1:46", explanation: "Mary began her song of praise with these words." },
  { difficulty: "easy", quote: "Glory to God in the highest.", answer: "The angels", choices: ["The angels", "The shepherds", "The magi", "The disciples"], reference: "Luke 2:14", explanation: "The heavenly host praised God at Jesus' birth." },
  { difficulty: "easy", quote: "My eyes have seen Your salvation.", answer: "Simeon", choices: ["Simeon", "Zechariah", "Joseph", "John the Baptist"], reference: "Luke 2:30", explanation: "Simeon praised God while holding the child Jesus." },
  { difficulty: "easy", quote: "Behold, the Lamb of God!", answer: "John the Baptist", choices: ["John the Baptist", "Peter", "Andrew", "Philip"], reference: "John 1:29", explanation: "John identified Jesus as the Lamb of God." },
  { difficulty: "easy", quote: "If You are the Son of God, command these stones to become bread.", answer: "The devil", choices: ["The devil", "Peter", "Herod", "Pilate"], reference: "Matthew 4:3", explanation: "The tempter said this to Jesus in the wilderness." },
  { difficulty: "easy", quote: "Man shall not live by bread alone.", answer: "Jesus", choices: ["Jesus", "Moses", "John the Baptist", "Paul"], reference: "Matthew 4:4", explanation: "Jesus answered the tempter by quoting Scripture." },
  { difficulty: "easy", quote: "Blessed are the poor in spirit.", answer: "Jesus", choices: ["Jesus", "David", "Solomon", "Peter"], reference: "Matthew 5:3", explanation: "Jesus opened the Beatitudes with this blessing." },
  { difficulty: "easy", quote: "Come to Me, all you who labor and are heavy laden.", answer: "Jesus", choices: ["Jesus", "John the Baptist", "Paul", "Peter"], reference: "Matthew 11:28", explanation: "Jesus invited the weary to come to Him for rest." },
  { difficulty: "easy", quote: "Peace, be still!", answer: "Jesus", choices: ["Jesus", "Peter", "Jonah", "Moses"], reference: "Mark 4:39", explanation: "Jesus spoke to the wind and sea during the storm." },
  { difficulty: "easy", quote: "Lazarus, come out!", answer: "Jesus", choices: ["Jesus", "Martha", "Mary", "Peter"], reference: "John 11:43", explanation: "Jesus called Lazarus from the tomb." },
  { difficulty: "easy", quote: "It is finished.", answer: "Jesus", choices: ["Jesus", "Stephen", "Paul", "John"], reference: "John 19:30", explanation: "Jesus said this from the cross." },
  { difficulty: "easy", quote: "Depart from me, for I am a sinful man, Lord.", answer: "Peter", choices: ["Peter", "Andrew", "James", "John"], reference: "Luke 5:8", explanation: "Peter said this after the miraculous catch of fish." },
  { difficulty: "easy", quote: "Lord, You know all things; You know that I love You.", answer: "Peter", choices: ["Peter", "Thomas", "John", "James"], reference: "John 21:17", explanation: "Peter answered Jesus after the resurrection." },
  { difficulty: "easy", quote: "I have sinned by betraying innocent blood.", answer: "Judas", choices: ["Judas", "Peter", "Pilate", "Barabbas"], reference: "Matthew 27:4", explanation: "Judas confessed this to the chief priests and elders." },
  { difficulty: "easy", quote: "What is truth?", answer: "Pilate", choices: ["Pilate", "Herod", "Festus", "Agrippa"], reference: "John 18:38", explanation: "Pilate asked this while questioning Jesus." },
  { difficulty: "easy", quote: "Jesus, remember me when You come into Your Kingdom.", answer: "The repentant thief", choices: ["The repentant thief", "The centurion", "Peter", "Thomas"], reference: "Luke 23:42", explanation: "One criminal crucified beside Jesus asked to be remembered." },
  { difficulty: "easy", quote: "Truly this was the Son of God.", answer: "The centurion", choices: ["The centurion", "Pilate", "Peter", "John"], reference: "Matthew 27:54", explanation: "The centurion said this after seeing the events at Jesus' death." },
  { difficulty: "easy", quote: "Who are You, Lord?", answer: "Saul", choices: ["Saul", "Peter", "Thomas", "Cornelius"], reference: "Acts 9:5", explanation: "Saul asked this when Jesus confronted him on the Damascus road." },
  { difficulty: "easy", quote: "Sirs, what must I do to be saved?", answer: "The Philippian jailer", choices: ["The Philippian jailer", "Cornelius", "Nicodemus", "The rich young ruler"], reference: "Acts 16:30", explanation: "The jailer asked Paul and Silas this after the earthquake." },
  { difficulty: "easy", quote: "I have fought the good fight.", answer: "Paul", choices: ["Paul", "Peter", "John", "James"], reference: "2 Timothy 4:7", explanation: "Paul wrote this near the end of his ministry." },
  { difficulty: "medium", quote: "Here is the fire and the wood, but where is the lamb?", answer: "Isaac", choices: ["Isaac", "Abraham", "Jacob", "Joseph"], reference: "Genesis 22:7", explanation: "Isaac asked Abraham this on the way to the sacrifice." },
  { difficulty: "medium", quote: "I will go.", answer: "Rebekah", choices: ["Rebekah", "Rachel", "Leah", "Sarah"], reference: "Genesis 24:58", explanation: "Rebekah agreed to leave with Abraham's servant." },
  { difficulty: "medium", quote: "I have enough, my brother.", answer: "Esau", choices: ["Esau", "Jacob", "Laban", "Reuben"], reference: "Genesis 33:9", explanation: "Esau said this when Jacob offered him gifts." },
  { difficulty: "medium", quote: "She is more righteous than I.", answer: "Judah", choices: ["Judah", "Reuben", "Joseph", "Jacob"], reference: "Genesis 38:26", explanation: "Judah acknowledged Tamar's righteousness." },
  { difficulty: "medium", quote: "All these things are against me.", answer: "Jacob", choices: ["Jacob", "Joseph", "Reuben", "Judah"], reference: "Genesis 42:36", explanation: "Jacob lamented when Simeon was detained and Benjamin was requested." },
  { difficulty: "medium", quote: "Did I not tell you not to sin against the boy?", answer: "Reuben", choices: ["Reuben", "Judah", "Joseph", "Jacob"], reference: "Genesis 42:22", explanation: "Reuben reminded his brothers that he had warned them about Joseph." },
  { difficulty: "medium", quote: "This is one of the Hebrews' children.", answer: "Pharaoh's daughter", choices: ["Pharaoh's daughter", "Miriam", "Jochebed", "Zipporah"], reference: "Exodus 2:6", explanation: "Pharaoh's daughter said this when she found baby Moses." },
  { difficulty: "medium", quote: "Tomorrow shall be a feast to the LORD.", answer: "Aaron", choices: ["Aaron", "Moses", "Joshua", "Caleb"], reference: "Exodus 32:5", explanation: "Aaron said this during the golden calf incident." },
  { difficulty: "medium", quote: "Give me this mountain.", answer: "Caleb", choices: ["Caleb", "Joshua", "Gideon", "Jephthah"], reference: "Joshua 14:12", explanation: "Caleb asked Joshua for the hill country promised to him." },
  { difficulty: "medium", quote: "Up, for this is the day in which the LORD has delivered Sisera.", answer: "Deborah", choices: ["Deborah", "Jael", "Barak", "Miriam"], reference: "Judges 4:14", explanation: "Deborah urged Barak forward against Sisera." },
  { difficulty: "medium", quote: "If the LORD is with us, why has all this happened?", answer: "Gideon", choices: ["Gideon", "Barak", "Samson", "Jephthah"], reference: "Judges 6:13", explanation: "Gideon questioned the angel of the LORD during his call." },
  { difficulty: "medium", quote: "I have opened my mouth to the LORD, and I cannot go back.", answer: "Jephthah", choices: ["Jephthah", "Gideon", "Samson", "Saul"], reference: "Judges 11:35", explanation: "Jephthah spoke after seeing his daughter come out to meet him." },
  { difficulty: "medium", quote: "The LORD be with you.", answer: "Boaz", choices: ["Boaz", "Elimelech", "Obed", "Samuel"], reference: "Ruth 2:4", explanation: "Boaz greeted his harvesters with this blessing." },
  { difficulty: "medium", quote: "My heart rejoices in the LORD.", answer: "Hannah", choices: ["Hannah", "Miriam", "Deborah", "Mary"], reference: "1 Samuel 2:1", explanation: "Hannah prayed this after bringing Samuel to the tabernacle." },
  { difficulty: "medium", quote: "It is the LORD. Let Him do what seems good to Him.", answer: "Eli", choices: ["Eli", "Samuel", "Nathan", "David"], reference: "1 Samuel 3:18", explanation: "Eli accepted the word Samuel delivered from the LORD." },
  { difficulty: "medium", quote: "The LORD can save by many or by few.", answer: "Jonathan", choices: ["Jonathan", "David", "Saul", "Abner"], reference: "1 Samuel 14:6", explanation: "Jonathan said this before attacking the Philistine outpost." },
  { difficulty: "medium", quote: "I have played the fool.", answer: "Saul", choices: ["Saul", "David", "Ahab", "Rehoboam"], reference: "1 Samuel 26:21", explanation: "Saul admitted his wrongdoing after David spared him." },
  { difficulty: "medium", quote: "Please forgive the trespass of your servant.", answer: "Abigail", choices: ["Abigail", "Bathsheba", "Michal", "Rizpah"], reference: "1 Samuel 25:28", explanation: "Abigail appealed to David after Nabal's insult." },
  { difficulty: "medium", quote: "The half was not told me.", answer: "The queen of Sheba", choices: ["The queen of Sheba", "Bathsheba", "Huldah", "Athaliah"], reference: "1 Kings 10:7", explanation: "The queen of Sheba said Solomon's wisdom exceeded the report she had heard." },
  { difficulty: "medium", quote: "I have been very jealous for the LORD.", answer: "Elijah", choices: ["Elijah", "Elisha", "Micaiah", "Isaiah"], reference: "1 Kings 19:10", explanation: "Elijah said this at Horeb while feeling alone." },
  { difficulty: "medium", quote: "I thought he would surely come out to me.", answer: "Naaman", choices: ["Naaman", "Gehazi", "Elisha", "Ben-hadad"], reference: "2 Kings 5:11", explanation: "Naaman was angry when Elisha told him to wash in the Jordan." },
  { difficulty: "medium", quote: "Remember now how I have walked before You in truth.", answer: "Hezekiah", choices: ["Hezekiah", "Josiah", "David", "Solomon"], reference: "2 Kings 20:3", explanation: "Hezekiah prayed this after Isaiah told him he would die." },
  { difficulty: "medium", quote: "Go inquire of the LORD for me.", answer: "Josiah", choices: ["Josiah", "Hezekiah", "Ezra", "Nehemiah"], reference: "2 Kings 22:13", explanation: "Josiah sought the LORD after the Book of the Law was found." },
  { difficulty: "medium", quote: "O my God, I am ashamed and blush to lift up my face.", answer: "Ezra", choices: ["Ezra", "Nehemiah", "Daniel", "Jeremiah"], reference: "Ezra 9:6", explanation: "Ezra prayed in grief over Israel's sin." },
  { difficulty: "medium", quote: "Remember me, my God, for good.", answer: "Nehemiah", choices: ["Nehemiah", "Ezra", "Haggai", "Zechariah"], reference: "Nehemiah 13:31", explanation: "Nehemiah closed his memoir with this prayer." },
  { difficulty: "medium", quote: "There is a God in heaven who reveals secrets.", answer: "Daniel", choices: ["Daniel", "Joseph", "Mordecai", "Ezra"], reference: "Daniel 2:28", explanation: "Daniel told Nebuchadnezzar that God revealed the dream." },
  { difficulty: "medium", quote: "Is not this great Babylon, which I have built?", answer: "Nebuchadnezzar", choices: ["Nebuchadnezzar", "Belshazzar", "Darius", "Cyrus"], reference: "Daniel 4:30", explanation: "Nebuchadnezzar boasted just before his humiliation." },
  { difficulty: "medium", quote: "Your God whom you serve continually, He will deliver you.", answer: "Darius", choices: ["Darius", "Nebuchadnezzar", "Cyrus", "Artaxerxes"], reference: "Daniel 6:16", explanation: "Darius said this when Daniel was thrown into the lions' den." },
  { difficulty: "medium", quote: "I do well to be angry, even to death.", answer: "Jonah", choices: ["Jonah", "Elijah", "Jeremiah", "Habakkuk"], reference: "Jonah 4:9", explanation: "Jonah answered God while angry over the plant." },
  { difficulty: "medium", quote: "Blessed be the Lord, the God of Israel.", answer: "Zechariah", choices: ["Zechariah", "Simeon", "Joseph", "John the Baptist"], reference: "Luke 1:68", explanation: "Zechariah praised God after John the Baptist was born." },
  { difficulty: "medium", quote: "Let us now go to Bethlehem.", answer: "The shepherds", choices: ["The shepherds", "The magi", "The angels", "Joseph and Mary"], reference: "Luke 2:15", explanation: "The shepherds went to see what the Lord had made known to them." },
  { difficulty: "medium", quote: "How can a man be born when he is old?", answer: "Nicodemus", choices: ["Nicodemus", "Peter", "Thomas", "Philip"], reference: "John 3:4", explanation: "Nicodemus asked Jesus about being born again." },
  { difficulty: "medium", quote: "Lord, show us the Father, and that will be enough for us.", answer: "Philip", choices: ["Philip", "Andrew", "Peter", "Nathanael"], reference: "John 14:8", explanation: "Philip asked Jesus to show the disciples the Father." },
  { difficulty: "medium", quote: "Rabbi, You are the Son of God.", answer: "Nathanael", choices: ["Nathanael", "Peter", "Thomas", "John"], reference: "John 1:49", explanation: "Nathanael confessed faith after Jesus revealed that He knew him." },
  { difficulty: "medium", quote: "Come, see a man who told me everything I did.", answer: "The Samaritan woman", choices: ["The Samaritan woman", "Martha", "Mary Magdalene", "The Canaanite woman"], reference: "John 4:29", explanation: "The Samaritan woman invited her town to consider Jesus." },
  { difficulty: "medium", quote: "I believe that You are the Christ, the Son of God.", answer: "Martha", choices: ["Martha", "Mary Magdalene", "Elizabeth", "Mary"], reference: "John 11:27", explanation: "Martha confessed faith before Lazarus was raised." },
  { difficulty: "medium", quote: "Rabboni!", answer: "Mary Magdalene", choices: ["Mary Magdalene", "Martha", "Mary", "Salome"], reference: "John 20:16", explanation: "Mary Magdalene recognized the risen Jesus when He called her name." },
  { difficulty: "medium", quote: "Let us also go, that we may die with Him.", answer: "Thomas", choices: ["Thomas", "Peter", "John", "Philip"], reference: "John 11:16", explanation: "Thomas said this as Jesus prepared to go to Judea." },
  { difficulty: "medium", quote: "We must obey God rather than men.", answer: "Peter and the apostles", choices: ["Peter and the apostles", "Paul and Barnabas", "Stephen", "James and John"], reference: "Acts 5:29", explanation: "The apostles answered the council after being ordered not to teach in Jesus' name." },
  { difficulty: "medium", quote: "Brother Saul, receive your sight.", answer: "Ananias", choices: ["Ananias", "Barnabas", "Peter", "Philip"], reference: "Acts 22:13", explanation: "Ananias spoke to Saul after the Damascus road encounter." },
  { difficulty: "hard", quote: "I have killed a man for wounding me.", answer: "Lamech", choices: ["Lamech", "Cain", "Nimrod", "Esau"], reference: "Genesis 4:23", explanation: "Lamech boasted to his wives about violence." },
  { difficulty: "hard", quote: "Cursed be Canaan.", answer: "Noah", choices: ["Noah", "Ham", "Shem", "Abraham"], reference: "Genesis 9:25", explanation: "Noah pronounced this after the incident with Ham." },
  { difficulty: "hard", quote: "Please, my brothers, do not act so wickedly.", answer: "Lot", choices: ["Lot", "Abraham", "Isaac", "Jacob"], reference: "Genesis 19:7", explanation: "Lot pleaded with the men of Sodom outside his house." },
  { difficulty: "hard", quote: "God has made me laugh.", answer: "Sarah", choices: ["Sarah", "Rebekah", "Rachel", "Leah"], reference: "Genesis 21:6", explanation: "Sarah said this after Isaac was born." },
  { difficulty: "hard", quote: "Lord, will You kill even a righteous nation?", answer: "Abimelech", choices: ["Abimelech", "Abraham", "Lot", "Pharaoh"], reference: "Genesis 20:4", explanation: "Abimelech pleaded with God after taking Sarah." },
  { difficulty: "hard", quote: "This heap is witness between me and you today.", answer: "Laban", choices: ["Laban", "Jacob", "Esau", "Abimelech"], reference: "Genesis 31:48", explanation: "Laban said this when he and Jacob made a covenant." },
  { difficulty: "hard", quote: "What have I done to you, that you have struck me these three times?", answer: "Balaam's donkey", choices: ["Balaam's donkey", "Balaam", "The angel of the LORD", "Balak"], reference: "Numbers 22:28", explanation: "The LORD opened the donkey's mouth to speak to Balaam." },
  { difficulty: "hard", quote: "Let me die the death of the righteous.", answer: "Balaam", choices: ["Balaam", "Balak", "Moses", "Aaron"], reference: "Numbers 23:10", explanation: "Balaam said this while blessing Israel instead of cursing them." },
  { difficulty: "hard", quote: "Indeed I have sinned against the LORD.", answer: "Achan", choices: ["Achan", "Saul", "David", "Gehazi"], reference: "Joshua 7:20", explanation: "Achan confessed after the sin at Jericho was exposed." },
  { difficulty: "hard", quote: "Turn in, my lord, turn in to me.", answer: "Jael", choices: ["Jael", "Deborah", "Delilah", "Rahab"], reference: "Judges 4:18", explanation: "Jael invited Sisera into her tent." },
  { difficulty: "hard", quote: "Out of the eater came forth food.", answer: "Samson", choices: ["Samson", "Gideon", "Jephthah", "Abimelech"], reference: "Judges 14:14", explanation: "Samson posed this riddle at his wedding feast." },
  { difficulty: "hard", quote: "How the king of Israel honored himself today!", answer: "Michal", choices: ["Michal", "Bathsheba", "Abigail", "Rizpah"], reference: "2 Samuel 6:20", explanation: "Michal mocked David after he danced before the LORD." },
  { difficulty: "hard", quote: "You love those who hate you and hate those who love you.", answer: "Joab", choices: ["Joab", "Abner", "Nathan", "Ahithophel"], reference: "2 Samuel 19:6", explanation: "Joab rebuked David after Absalom's death." },
  { difficulty: "hard", quote: "My little finger is thicker than my father's waist.", answer: "Rehoboam", choices: ["Rehoboam", "Jeroboam", "Solomon", "Absalom"], reference: "1 Kings 12:10", explanation: "Rehoboam answered Israel with the young men's harsh counsel." },
  { difficulty: "hard", quote: "Behold your gods, Israel.", answer: "Jeroboam", choices: ["Jeroboam", "Aaron", "Ahab", "Manasseh"], reference: "1 Kings 12:28", explanation: "Jeroboam said this when setting up golden calves." },
  { difficulty: "hard", quote: "Have you found me, my enemy?", answer: "Ahab", choices: ["Ahab", "Saul", "Jezebel", "Ben-hadad"], reference: "1 Kings 21:20", explanation: "Ahab said this to Elijah after Naboth's vineyard was taken." },
  { difficulty: "hard", quote: "I saw the LORD sitting on His throne.", answer: "Micaiah", choices: ["Micaiah", "Isaiah", "Elijah", "Elisha"], reference: "1 Kings 22:19", explanation: "Micaiah described his vision before Ahab and Jehoshaphat." },
  { difficulty: "hard", quote: "Your servant went nowhere.", answer: "Gehazi", choices: ["Gehazi", "Naaman", "Elisha", "Hazael"], reference: "2 Kings 5:25", explanation: "Gehazi lied to Elisha after taking gifts from Naaman." },
  { difficulty: "hard", quote: "Has any of the gods of the nations delivered his land?", answer: "The Rabshakeh", choices: ["The Rabshakeh", "Sennacherib", "Hezekiah", "Isaiah"], reference: "2 Kings 18:33", explanation: "The Assyrian spokesman taunted Jerusalem during Sennacherib's siege." },
  { difficulty: "hard", quote: "To whom would the king delight to do honor more than to myself?", answer: "Haman", choices: ["Haman", "Mordecai", "Ahasuerus", "Bigthan"], reference: "Esther 6:6", explanation: "Haman assumed the king wanted to honor him." },
  { difficulty: "hard", quote: "Can a man be profitable to God?", answer: "Eliphaz", choices: ["Eliphaz", "Bildad", "Zophar", "Elihu"], reference: "Job 22:2", explanation: "Eliphaz asked this during his third speech to Job." },
  { difficulty: "hard", quote: "How then can man be just with God?", answer: "Bildad", choices: ["Bildad", "Eliphaz", "Zophar", "Elihu"], reference: "Job 25:4", explanation: "Bildad asked this in his final brief speech." },
  { difficulty: "hard", quote: "I am weary, God.", answer: "Agur", choices: ["Agur", "Solomon", "Lemuel", "Asaph"], reference: "Proverbs 30:1", explanation: "Agur's oracle opens with this weary confession." },
  { difficulty: "hard", quote: "I was no prophet, neither was I a prophet's son.", answer: "Amos", choices: ["Amos", "Hosea", "Micah", "Haggai"], reference: "Amos 7:14", explanation: "Amos answered Amaziah by describing his call." },
  { difficulty: "hard", quote: "Will a man rob God?", answer: "God", choices: ["God", "Malachi", "Haggai", "Zechariah"], reference: "Malachi 3:8", explanation: "God challenged Israel through Malachi about tithes and offerings." },
  { difficulty: "hard", quote: "Go and search diligently for the young child.", answer: "Herod", choices: ["Herod", "The magi", "Joseph", "Simeon"], reference: "Matthew 2:8", explanation: "Herod sent the magi to Bethlehem with this instruction." },
  { difficulty: "hard", quote: "How can I be sure of this?", answer: "Zechariah", choices: ["Zechariah", "Joseph", "Nicodemus", "Simeon"], reference: "Luke 1:18", explanation: "Zechariah questioned Gabriel's announcement about John." },
  { difficulty: "hard", quote: "I will pull down my barns and build bigger ones.", answer: "The rich fool", choices: ["The rich fool", "The rich young ruler", "Zacchaeus", "The unjust steward"], reference: "Luke 12:18", explanation: "The man in Jesus' parable planned bigger barns for his crops." },
  { difficulty: "hard", quote: "It is expedient for us that one man should die for the people.", answer: "Caiaphas", choices: ["Caiaphas", "Pilate", "Herod", "Annas"], reference: "John 11:50", explanation: "Caiaphas argued that Jesus should die for the nation." },
  { difficulty: "hard", quote: "It is his angel.", answer: "The believers at Mary's house", choices: ["The believers at Mary's house", "Rhoda", "Peter", "James"], reference: "Acts 12:15", explanation: "The gathered believers said this when Rhoda insisted Peter was at the door." },
  { difficulty: "hard", quote: "Paul, you are out of your mind!", answer: "Festus", choices: ["Festus", "Agrippa", "Felix", "Tertullus"], reference: "Acts 26:24", explanation: "Festus interrupted Paul's defense before Agrippa." },
  { difficulty: "hard", quote: "Great is Artemis of the Ephesians!", answer: "The Ephesian crowd", choices: ["The Ephesian crowd", "Demetrius", "Paul", "Alexander"], reference: "Acts 19:28", explanation: "The crowd shouted this during the riot in Ephesus." },
  { difficulty: "hard", quote: "Should a man like me flee?", answer: "Nehemiah", choices: ["Nehemiah", "Ezra", "Mordecai", "Jeremiah"], reference: "Nehemiah 6:11", explanation: "Nehemiah refused the trap set by his enemies." },
];

function startWhoSaidItGame({ render = true } = {}) {
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
  if (render) renderPreservingReaderScroll();
}

function whoSaidItPool() {
  return whoSaidItQuestions.filter((question) => state.triviaDifficulty === "All" || question.difficulty === state.triviaDifficulty.toLowerCase());
}

function startVerseOrderGame({ render = true } = {}) {
  const pool = shuffleItems(verseOrderPool());
  if (!pool.length) {
    showToast("No verses available for Verse Order yet");
    return;
  }
  const puzzleCount = Math.min(normalizedTriviaCount("verse-order", state.triviaCount), pool.length);
  const selectedVerses = pool.slice(0, puzzleCount);
  state.triviaGame = {
    type: "verse-order",
    version: verseOrderGameVersion(),
    puzzles: selectedVerses.map((item, index) => createVerseOrderPuzzle(item, verseOrderPieceCount(index, puzzleCount))),
    index: 0,
    score: 0,
    complete: false,
  };
  if (render) renderPreservingReaderScroll();
}

function verseOrderGameVersion() {
  const challengeVersion = activeGameChallenge()?.version;
  if (challengeVersion && isBundledTranslation(challengeVersion)) return challengeVersion;
  return state.versions.find(isBundledTranslation) || state.versions[0] || "BSB";
}

function verseOrderPool() {
  const version = verseOrderGameVersion();
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

function normalizedVerseOrderAnswerText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function verseOrderSelectionText(puzzle, ids = puzzle?.selectedIds || []) {
  const segmentsById = new Map((puzzle?.segments || []).map((segment) => [segment.id, segment]));
  return ids.map((id) => segmentsById.get(id)?.text || "").join(" ");
}

function isVerseOrderSelectionCorrect(puzzle) {
  const selectedText = normalizedVerseOrderAnswerText(verseOrderSelectionText(puzzle));
  const correctText = normalizedVerseOrderAnswerText((puzzle?.segments || []).map((segment) => segment.text).join(" "));
  return selectedText === correctText;
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
  if (state.triviaGame?.challengeId && !state.triviaGame.complete) {
    const challengeId = state.triviaGame.challengeId;
    const challenge = activeGameChallenge();
    if (challenge?.challengerId !== state.authUser?.id) {
      showToast("The host ends a live challenge for everyone");
      return;
    }
    if (!window.confirm("End this live challenge for every player?")) return;
    updateGameChallengeResponse(challengeId, "end");
    return;
  }
  cleanupTriviaCelebration();
  state.activeGameChallengeId = "";
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
  puzzle.correct = isVerseOrderSelectionCorrect(puzzle);
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
    const swapIndex = Math.floor(triviaRandomSource() * (index + 1));
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

function setInterfaceTextSize(size) {
  const normalized = normalizedInterfaceTextSize(size);
  if (normalized === state.interfaceTextSize) return;
  state.interfaceTextSize = normalized;
  localStorage.setItem("lw_interface_text_size", normalized);
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
  const shouldTrackReturn = options.returnNavigation !== false;
  const returnTarget = shouldTrackReturn ? captureReaderReturnTarget() : null;
  if (!setReferenceFromString(cleaned)) return false;
  if (shouldTrackReturn && returnTarget && !currentPassageMatchesReturnTarget(returnTarget)) {
    pushReaderReturnTarget(returnTarget);
    state.returnSelectionToolsOpen = false;
  }
  if (Number.isFinite(options.focusVerse)) state.verse = options.focusVerse;
  searchRequestId += 1;
  clearInlineChapterSearchState();
  state.searchQuery = "";
  state.searchPending = false;
  state.focusSearchResultsOpen = false;
  if (options.closeLibrary) {
    dismissLibraryAfterAction();
  }
  state.pendingVerseFocus = true;
  recordHistory();
  updateShareUrl();
  render();
  if (options.libraryScroll) requestAnimationFrame(() => restoreLibraryScroll(options.libraryScroll));
  return true;
}

function submitFocusReference(value, options = {}) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  state.focusReferenceOpen = false;
  state.isVerseOfDayActive = false;
  if (parseReference(cleaned)) {
    gotoReference(cleaned);
    return;
  }
  runPhraseSearch(cleaned, {
    focusResults: true,
    sourceInputId: options.sourceInputId || "mobileFocusPassageInput",
  });
}

async function runReferenceOrPhraseSearch(value, options = {}) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  state.isVerseOfDayActive = false;
  if (parseReference(cleaned)) {
    gotoReference(cleaned);
    return;
  }
  await runPhraseSearch(cleaned, {
    focusResults: state.focusMode && state.mode !== "big",
    scope: options.scope,
    chapter: options.chapter,
    sourceInputId: options.sourceInputId,
  });
}

async function runPhraseSearch(value, options = {}) {
  const query = value.trim().replace(/\s+/g, " ");
  if (!query) return;
  const scope = normalizedSearchScope(options.scope ?? state.searchScope);
  const searchChapter = normalizedSearchChapter(options.chapter ?? state.reference);
  if (scope === "chapter") {
    if (advanceInlineChapterSearch(query, searchChapter)) return;
    runInlineChapterSearch(query, searchChapter, { sourceInputId: options.sourceInputId });
    return;
  }
  clearInlineChapterSearchState();
  const focusResults = Boolean(options.focusResults && state.focusMode && state.mode !== "big");
  const requestId = ++searchRequestId;
  state.searchQuery = query;
  state.searchResultsQuery = query;
  state.searchScope = scope;
  state.searchResultsScope = scope;
  state.searchResultsChapter = searchChapter;
  state.searchResults = [];
  state.searchPending = true;
  localStorage.setItem("lw_search_scope", scope);
  if (focusResults) {
    state.focusReferenceOpen = false;
    state.focusSearchResultsOpen = true;
    resetFocusToolSurfaces();
    renderPreservingReaderScroll();
  } else {
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
  try {
    await ensureAllSearchVersionsLoaded();
    const results = await searchBible(query, scope, searchChapter);
    if (requestId !== searchRequestId || state.searchResultsQuery !== query) return;
    state.searchResults = results;
  } catch (error) {
    if (requestId === searchRequestId) console.warn("Bible search failed", error);
  } finally {
    if (requestId === searchRequestId && state.searchResultsQuery === query) {
      state.searchPending = false;
      if (focusResults) renderPreservingReaderScroll();
      else render();
    }
  }
}

function clearInlineChapterSearchState() {
  state.inlineSearchQuery = "";
  state.inlineSearchChapter = "";
  state.inlineSearchPhraseOnly = false;
  state.inlineSearchHitIndex = -1;
  state.inlineSearchMatchCount = 0;
  state.inlineSearchWrapPending = false;
  state.pendingInlineSearchFocus = false;
  state.pendingInlineSearchInputFocus = "";
}

function inlineSearchVersions() {
  return state.mode === "parallel" ? activeVersions() : [state.versions[0] || "BSB"];
}

function resolveInlineSearchInputId(preferredInputId = "") {
  const inputIds = ["referenceInput", "studySearchInput", "mobileFocusPassageInput"];
  if (inputIds.includes(preferredInputId)) return preferredInputId;
  const activeInputId = document.activeElement?.id || "";
  if (inputIds.includes(activeInputId)) return activeInputId;
  if (state.focusMode && state.mode !== "big") return "mobileFocusPassageInput";
  if (state.libraryOpen && state.activeRail === "Search") return "studySearchInput";
  return "referenceInput";
}

function restoreInlineSearchInputFocus(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.focus({ preventScroll: true });
  const caret = input.value.length;
  input.setSelectionRange?.(caret, caret);
}

function countInlineSearchMatches(query, phraseOnly = false) {
  const versions = inlineSearchVersions();
  return currentChapter().verses.reduce((total, verse) => total + versions.reduce((versionTotal, version) => (
    versionTotal + inlineSearchRangesForText(getVerseText(verse, version), query, phraseOnly).length
  ), 0), 0);
}

function activeInlineSearchMatchCount() {
  return activeInlineSearchQuery() ? Math.max(0, Number(state.inlineSearchMatchCount) || 0) : 0;
}

function inlineSearchProgressText() {
  const count = activeInlineSearchMatchCount();
  if (!count) return "0";
  const current = Math.max(1, Math.min(count, Number(state.inlineSearchHitIndex) + 1 || 1));
  return `${current}/${count}`;
}

function inlineSearchClearAriaLabel() {
  const count = activeInlineSearchMatchCount();
  if (!count) return "No current chapter matches. Clear search hits";
  const current = Math.max(1, Math.min(count, Number(state.inlineSearchHitIndex) + 1 || 1));
  return `Match ${current} of ${count}. Clear current chapter search hits`;
}

function inlineSearchClearTitle() {
  const count = activeInlineSearchMatchCount();
  return `${count} ${count === 1 ? "match" : "matches"} in ${state.inlineSearchChapter || state.reference} · Clear search hits`;
}

function updateInlineSearchProgress() {
  const progressText = inlineSearchProgressText();
  const ariaLabel = inlineSearchClearAriaLabel();
  const title = inlineSearchClearTitle();
  document.querySelectorAll("[data-inline-search-progress]").forEach((progress) => {
    progress.textContent = progressText;
    const button = progress.closest("[data-clear-search]");
    button?.setAttribute("aria-label", ariaLabel);
    if (button?.hasAttribute("title")) button.title = title;
    if (button?.hasAttribute("data-tooltip")) button.dataset.tooltip = title;
  });
}

function inlineSearchHasChapterPhrase(query) {
  const versions = inlineSearchVersions();
  return currentChapter().verses.some((verse) => versions.some((version) => (
    inlineSearchRangesForText(getVerseText(verse, version), query, true).length
  )));
}

function firstInlineSearchVerse(query, phraseOnly = false) {
  const versions = inlineSearchVersions();
  return currentChapter().verses.find((verse) => versions.some((version) => (
    inlineSearchRangesForText(getVerseText(verse, version), query, phraseOnly).length
  ))) || null;
}

function runInlineChapterSearch(query, searchChapter = state.reference, options = {}) {
  searchRequestId += 1;
  if (state.mode === "big") state.mode = "reader";
  state.isVerseOfDayActive = false;
  state.searchQuery = query;
  state.searchResultsQuery = "";
  state.searchScope = "chapter";
  state.searchResultsScope = "chapter";
  state.searchResultsChapter = searchChapter;
  state.searchResults = [];
  state.searchPending = false;
  state.focusReferenceOpen = Boolean(state.focusMode && state.mode !== "big");
  state.focusSearchResultsOpen = false;
  resetFocusToolSurfaces();
  state.inlineSearchQuery = query;
  state.inlineSearchChapter = searchChapter;
  state.inlineSearchPhraseOnly = inlineSearchHasChapterPhrase(query);
  state.inlineSearchHitIndex = -1;
  state.inlineSearchMatchCount = countInlineSearchMatches(query, state.inlineSearchPhraseOnly);
  state.inlineSearchWrapPending = false;
  state.pendingInlineSearchInputFocus = resolveInlineSearchInputId(options.sourceInputId);
  localStorage.setItem("lw_search_scope", "chapter");
  const firstVerse = firstInlineSearchVerse(query, state.inlineSearchPhraseOnly);
  if (!firstVerse) {
    renderPreservingReaderScroll();
    requestAnimationFrame(() => showToast(`No matches found in ${searchChapter}`));
    return;
  }
  state.verse = firstVerse.n;
  state.inlineSearchHitIndex = 0;
  state.pendingInlineSearchFocus = true;
  render();
}

function advanceInlineChapterSearch(query, searchChapter = state.reference) {
  if (
    state.inlineSearchQuery !== query
    || normalizedSearchChapter(state.inlineSearchChapter) !== normalizedSearchChapter(searchChapter)
    || normalizedSearchChapter(searchChapter) !== normalizedSearchChapter(state.reference)
  ) return false;
  const hits = [...document.querySelectorAll(".scripture mark.inline-search-hit")];
  if (!hits.length) return false;
  if (state.inlineSearchWrapPending) {
    state.inlineSearchWrapPending = false;
    scrollInlineSearchHitIntoView(0, { smooth: false });
    return true;
  }
  const nextIndex = state.inlineSearchHitIndex + 1;
  if (nextIndex >= hits.length) {
    state.inlineSearchWrapPending = true;
    showToast(`No more matches in ${searchChapter}`);
    return true;
  }
  state.inlineSearchWrapPending = false;
  scrollInlineSearchHitIntoView(nextIndex, { smooth: false });
  return true;
}

function clearSearchResults() {
  searchRequestId += 1;
  clearInlineChapterSearchState();
  state.searchQuery = "";
  state.searchResultsQuery = "";
  state.searchResultsScope = normalizedSearchScope(state.searchScope);
  state.searchResultsChapter = normalizedSearchChapter(state.reference);
  state.searchResults = [];
  state.searchPending = false;
  state.focusSearchResultsOpen = false;
  render();
}

async function ensureAllSearchVersionsLoaded() {
  const bundled = translationCodes.filter(isBundledTranslation);
  await Promise.all(bundled.map(loadBibleVersion));
}

async function searchBible(query, requestedScope = state.searchScope, requestedChapter = state.reference) {
  const primaryVersion = state.versions[0] || "BSB";
  const scope = normalizedSearchScope(requestedScope);
  const searchChapter = normalizedSearchChapter(requestedChapter);
  const criteria = parseSearchQuery(query);
  if (!criteria.tokens.length && !criteria.exactPhrase) return [];
  const searchableVersions = translationCodes.filter(isBundledTranslation);
  const primarySearchVersion = searchableVersions.includes(primaryVersion) ? primaryVersion : "BSB";
  const versionOrder = criteria.questionAnalysis?.isQuestion
    ? [primarySearchVersion]
    : [primarySearchVersion, ...searchableVersions.filter((version) => version !== primarySearchVersion)];
  const localResults = versionOrder.flatMap((version) => searchVersion(version, criteria, scope, searchChapter));
  const [remoteResults, semanticResults] = await Promise.all([
    searchRemoteVersions(query, criteria, scope, searchChapter),
    searchSemanticBible(query, criteria, scope, searchChapter),
  ]);
  const results = [...localResults, ...remoteResults, ...semanticResults];
  const seen = new Set();
  const ranked = results
    .sort((a, b) => b.score - a.score)
    .filter((result) => {
      if (!referenceMatchesSearchScope(result.goto || result.ref, scope, searchChapter)) return false;
      const key = `${result.ref}-${result.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return removeRedundantSemanticResults(balancedSearchResults(ranked, primaryVersion)).slice(0, 40);
}

function searchReferenceParts(value) {
  const match = String(value || "").match(/^(.+?)\s(\d+):(\d+)(?:\s*-\s*(\d+))?/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    start: Number(match[3]),
    end: Number(match[4] || match[3]),
  };
}

function searchReferencesOverlap(left, right) {
  const a = searchReferenceParts(left);
  const b = searchReferenceParts(right);
  return Boolean(a && b && a.book === b.book && a.chapter === b.chapter && a.start <= b.end && b.start <= a.end);
}

function removeRedundantSemanticResults(results) {
  const kept = [];
  results.forEach((result) => {
    const duplicatesEvidence = result.matchType === "Meaning match" && kept.some((candidate) => (
      candidate.matchType !== "Meaning match" && searchReferencesOverlap(candidate.ref, result.ref)
    ));
    if (!duplicatesEvidence) kept.push(result);
  });
  return kept;
}

function searchVersion(version, criteria, scope = "all", currentChapter = "") {
  const versionData = loadedVersionData.get(version);
  if (!versionData?.chapters) return [];
  const results = [];
  if (criteria.questionAnalysis?.isQuestion) {
    Object.entries(versionData.chapters).some(([chapterKey, chapter]) => {
      if (!chapterMatchesSearchScope(chapterKey, scope, currentChapter)) return false;
      const result = searchQuestionInChapter(version, chapterKey, chapter, criteria);
      if (result) results.push(result);
      return results.length >= 80;
    });
    return results;
  }
  Object.entries(versionData.chapters).some(([chapterKey, chapter]) => {
    if (!chapterMatchesSearchScope(chapterKey, scope, currentChapter)) return false;
    chapter.verses.some((verse) => {
      const text = verse.text || "";
      const match = scoreSearchText(text, criteria, version);
      if (match) {
        results.push({
          ref: `${chapterKey}:${verse.n}`,
          version,
          text,
          score: match.score,
          matchType: match.matchType,
        });
      }
      return results.length >= 80;
    });
    return results.length >= 80;
  });
  return results;
}

function searchQuestionInChapter(version, chapterKey, chapter, criteria) {
  const verses = chapter.verses || [];
  let bestResult = null;
  verses.forEach((_verse, index) => {
    const context = verses.slice(Math.max(0, index - 1), Math.min(verses.length, index + 2));
    const text = context.map((item) => `${item.n} ${item.text || ""}`).join(" ");
    const match = scoreSearchText(text, criteria, version);
    if (!match || (bestResult && bestResult.score >= match.score)) return;
    const contextNumbers = context.map((item) => item.n);
    bestResult = {
      ref: formatReferenceLabel(chapterKey, contextNumbers),
      goto: `${chapterKey}:${contextNumbers[0]}`,
      version,
      text,
      score: match.score,
      matchType: match.matchType,
    };
  });
  return bestResult;
}

function balancedSearchResults(results, primaryVersion) {
  const exactVersionOrder = uniqueList([
    primaryVersion,
    ...state.versions,
    ...translationCodes.filter(isRemoteTranslation),
    ...translationCodes,
  ]);
  const nonExactVersionOrder = uniqueList([
    "BSB",
    ...exactVersionOrder,
  ]);
  const matchTypeOrder = ["Question match", "Meaning match", "Phrase", "Words", "Close match"];
  const ordered = [];
  matchTypeOrder.forEach((matchType) => {
    const versionOrder = matchType === "Phrase" ? exactVersionOrder : nonExactVersionOrder;
    ordered.push(...balanceResultGroup(results.filter((result) => result.matchType === matchType), versionOrder));
  });
  ordered.push(...balanceResultGroup(results.filter((result) => !matchTypeOrder.includes(result.matchType)), nonExactVersionOrder));
  return ordered;
}

function balanceResultGroup(results, versionOrder) {
  const groups = new Map();
  results.forEach((result) => {
    if (!groups.has(result.version)) groups.set(result.version, []);
    groups.get(result.version).push(result);
  });
  const balanced = [];
  while ([...groups.values()].some((items) => items.length)) {
    versionOrder.forEach((version) => {
      const group = groups.get(version);
      if (group?.length) balanced.push(group.shift());
    });
  }
  return balanced;
}

async function searchRemoteVersions(query, criteria, scope = "all", currentChapter = "") {
  const candidates = criteria.questionAnalysis?.isQuestion
    ? uniqueList(state.versions.filter(isRemoteTranslation))
    : translationCodes.filter(isRemoteTranslation);
  const remoteVersions = candidates.filter((version) => translationProvider(version).supportsSearch !== false);
  if (!remoteVersions.length) return [];
  const settled = await Promise.allSettled(remoteVersions.map((version) => searchRemoteVersion(version, query, criteria, scope, currentChapter)));
  return settled.flatMap((result) => result.status === "fulfilled" ? result.value : []);
}

async function searchSemanticBible(query, criteria, scope = "all", currentChapter = "") {
  if (!criteria.questionAnalysis?.isQuestion) return [];
  const config = window.BigScreenBibleSupabase || {};
  const url = supabaseFunctionUrl("semantic-bible-search");
  if (!url || !config.anonKey) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({ query, limit: 12, threshold: 0.55 }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return [];
    return (Array.isArray(payload.results) ? payload.results : []).map((result) => {
      const ref = String(result?.ref || "").trim();
      const goto = String(result?.goto || ref).trim();
      const text = String(result?.text || "").replace(/\s+/g, " ").trim();
      const similarity = Math.max(0, Math.min(1, Number(result?.score) || 0));
      if (!ref || !goto || !text) return null;
      return {
        ref,
        goto,
        version: "WEB",
        text,
        score: 150 + similarity * 40,
        matchType: "Meaning match",
      };
    }).filter((result) => result && referenceMatchesSearchScope(result.goto || result.ref, scope, currentChapter));
  } catch (_error) {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function searchRemoteVersion(version, query, criteria, scope = "all", currentChapter = "") {
  const provider = translationProvider(version);
  const config = window.BigScreenBibleSupabase || {};
  const params = provider === bibleProviders.apiBible
    ? { action: "search", version, query, exact: criteria.exactRequested ? "true" : "false" }
    : { action: "search", query, exact: criteria.exactRequested ? "true" : "false" };
  const url = supabaseFunctionUrl(provider.edgeFunction, params);
  if (!url || !config.anonKey) return [];

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `${version} search failed`);
    remoteSearchErrors.delete(version);
    if (provider.tracksFums) trackApiBibleView(payload.fumsToken);
    return (Array.isArray(payload.results) ? payload.results : [])
      .map((result) => {
        const text = String(result?.text || "").replace(/\s+/g, " ").trim();
        const ref = String(result?.ref || result?.reference || "").trim();
        if (!text || !ref || !referenceMatchesSearchScope(ref, scope, currentChapter)) return null;
        const match = scoreSearchText(text, criteria, version, Number(result?.score) || 0);
        if (!match) return null;
        return {
          ref,
          version,
          text,
          score: match.score,
          matchType: match.matchType,
        };
      })
      .filter(Boolean);
  } catch (error) {
    remoteSearchErrors.set(version, error.message || `${version} search failed`);
    return [];
  }
}

function scoreSearchText(text, criteria, version, providerScore = 0) {
  if (criteria.questionAnalysis?.isQuestion && window.BigScreenBibleSearchQuery) {
    const questionMatch = window.BigScreenBibleSearchQuery.scoreText(text, criteria.questionAnalysis);
    if (!questionMatch) return null;
    const primaryBoost = version === (state.versions[0] || "BSB") ? 4 : 0;
    return {
      score: questionMatch.score + providerScore + primaryBoost,
      matchType: questionMatch.matchType,
    };
  }
  const normalizedText = normalizeSearchText(text);
  const phrase = criteria.exactPhrase || criteria.phrase;
  const hasPhrase = phrase.length > 2 && normalizedText.includes(phrase);
  if (criteria.exactRequested && !hasPhrase) return null;
  const verseWords = normalizedText.split(" ").filter(Boolean);
  const exactTokenCount = criteria.tokens.filter((token) => verseWords.includes(token) || normalizedText.includes(token)).length;
  const fuzzyTokenCount = criteria.tokens.filter((token) => verseWords.some((word) => wordsCloseEnough(token, word))).length;
  const hasTokens = criteria.tokens.length > 0 && exactTokenCount === criteria.tokens.length;
  const hasFuzzyTokens = criteria.tokens.length > 1 && fuzzyTokenCount === criteria.tokens.length;
  if (!hasPhrase && !hasTokens && !hasFuzzyTokens) return null;
  const primaryBoost = version === (state.versions[0] || "BSB") ? 4 : 0;
  const exactBoost = criteria.exactRequested && hasPhrase ? 220 : 0;
  return {
    score: exactBoost + (hasPhrase ? 100 : 0) + exactTokenCount * 10 + fuzzyTokenCount + providerScore + primaryBoost,
    matchType: hasPhrase ? "Phrase" : hasTokens ? "Words" : "Close match",
  };
}

function parseSearchQuery(query) {
  const normalizedQuery = String(query || "").trim().replace(/\s+/g, " ");
  const quotedPhrases = [];
  normalizedQuery.replace(/"([^"]+)"/g, (_match, phrase) => {
    const normalizedPhrase = normalizeSearchText(phrase);
    if (normalizedPhrase) quotedPhrases.push(normalizedPhrase);
    return "";
  });
  const exactPhrase = quotedPhrases[0] || "";
  const searchableText = exactPhrase || normalizedQuery;
  const questionAnalysis = exactPhrase ? null : window.BigScreenBibleSearchQuery?.analyze(normalizedQuery);
  const questionTokens = questionAnalysis?.isQuestion ? questionAnalysis.coreTokens : [];
  return {
    exactRequested: Boolean(exactPhrase),
    exactPhrase,
    phrase: normalizeSearchText(searchableText),
    tokens: questionTokens.length ? questionTokens : searchTokens(searchableText),
    highlightTerms: questionAnalysis?.isQuestion
      ? questionAnalysis.concepts.flat()
      : searchTokens(searchableText),
    questionAnalysis,
  };
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

async function applyStartupExperience() {
  if (state.startupApplied) return;
  state.startupApplied = true;
  const sharedRef = sharedReferenceFromUrl();
  const requestedMode = requestedModeFromUrl();
  if (sharedRef && setReferenceFromString(sharedRef)) {
    const selected = sharedVersesFromUrl();
    if (selected.length) state.selectedVerses = selected;
    if (requestedMode) state.mode = requestedMode;
    if (state.mode === "reader" || state.mode === "parallel") state.pendingVerseFocus = true;
    if (state.mode === "big") state.presentationControlsVisible = !isCompactScreen();
    return;
  }
  if (state.startVerseOfDay) {
    const verseOfDay = await resolvedVerseOfDay();
    if (verseOfDay.reference && setReferenceFromString(verseOfDay.reference)) {
      state.verseOfDayItem = verseOfDay.item;
      state.isVerseOfDayActive = true;
    }
  }
  if (requestedMode) state.mode = requestedMode;
  else if (state.startBigScreen) state.mode = "big";
  if (state.mode === "big") state.presentationControlsVisible = !isCompactScreen();
}

async function openVerseOfDay(options = {}) {
  const verseOfDay = await resolvedVerseOfDay();
  const returnTarget = captureReaderReturnTarget();
  if (!verseOfDay.reference) return showToast("Verse of the day is not available yet");
  if (!setReferenceFromString(verseOfDay.reference)) return;
  if (returnTarget && !currentPassageMatchesReturnTarget(returnTarget)) {
    pushReaderReturnTarget(returnTarget);
    state.returnSelectionToolsOpen = false;
  }
  state.verseOfDayItem = verseOfDay.item;
  state.isVerseOfDayActive = true;
  state.mode = options.mode || "reader";
  state.searchQuery = "";
  state.pendingVerseFocus = true;
  recordHistory();
  updateShareUrl();
  render();
}

async function resolvedVerseOfDay() {
  const item = await fetchVerseOfDayItem();
  if (item) return { reference: item.reference, item };
  return { reference: verseOfDayReference(), item: null };
}

function openVerseOfDayInReader() {
  const reference = state.verseOfDayItem?.reference;
  const returnTarget = captureReaderReturnTarget();
  if (!reference || !setReferenceFromString(reference)) return;
  if (returnTarget && !currentPassageMatchesReturnTarget(returnTarget)) {
    pushReaderReturnTarget(returnTarget);
    state.returnSelectionToolsOpen = false;
  }
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

function requestedModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedMode = (params.get("mode") || params.get("view") || "").toLowerCase();
  if (["big", "bigscreen", "big-screen", "presentation"].includes(requestedMode)) return "big";
  if (["reader", "read"].includes(requestedMode)) return "reader";
  if (["parallel", "study", "parallel-study"].includes(requestedMode)) return "parallel";
  if (["trivia", "games", "game"].includes(requestedMode)) return "trivia";
  return "";
}

function gameChallengeNotificationDestination(
  challenge,
  player,
  expired = challenge ? gameChallengeIsExpired(challenge) : false,
) {
  if (!challenge || !player) return "unavailable";
  if (expired) return "ended";
  if (challenge.status === "pending") {
    if (player.inviteStatus === "invited") return "invitation";
    if (player.inviteStatus === "accepted") return "lobby";
    return "ended";
  }
  if (challenge.status === "accepted") {
    return player.inviteStatus === "accepted"
      ? challenge.startedAt ? "game" : "lobby"
      : "ended";
  }
  if (challenge.status === "completed") {
    return player.inviteStatus === "accepted" ? "results" : "ended";
  }
  return "ended";
}

function setGameChallengeNotificationView(challenge) {
  state.activeGameChallengeId = challenge.id;
  state.accountOpen = false;
  state.mode = "trivia";
  state.triviaGame = null;
  state.triviaGameType = challenge.gameType;
  state.triviaCategory = challenge.category;
  state.triviaDifficulty = challenge.difficulty;
  state.triviaCount = challenge.roundCount;
  state.referenceRushTimed = challenge.timed;
}

function clearMatchingGameChallengePopup(challengeId) {
  if (gameChallengePopupNotice?.challengeId === challengeId) gameChallengePopupNotice = null;
  gameChallengePopupQueue = gameChallengePopupQueue.filter((notice) => notice.challengeId !== challengeId);
}

function openGameChallengeNotificationDestination(challenge, player) {
  state.focusMode = false;
  state.settingsOpen = false;
  state.accountOpen = false;
  state.mode = "trivia";
  clearMatchingGameChallengePopup(challenge?.id || "");
  const destination = gameChallengeNotificationDestination(challenge, player);

  if (destination === "unavailable") {
    state.activeGameChallengeId = "";
    state.triviaGame = null;
    state.gameChallengeMessage = "That game room is not available for this account. Try switching accounts if a different account was invited.";
    teardownGameRoomPresence();
    renderPreservingReaderScroll();
    return true;
  }

  if (destination === "ended") {
    state.activeGameChallengeId = "";
    state.triviaGame = null;
    state.gameChallengeMessage = "That game room has ended or the invitation is no longer available.";
    teardownGameRoomPresence();
    renderPreservingReaderScroll();
    return true;
  }

  setGameChallengeNotificationView(challenge);
  if (destination === "invitation") {
    gameChallengePopupNotice = {
      userId: state.authUser.id,
      actorUserId: challenge.challengerId,
      kind: "incoming",
      challengeId: challenge.id,
      status: "invited",
    };
    state.gameChallengeMessage = "New game room invitation";
    renderPreservingReaderScroll();
    return true;
  }

  subscribeToActiveGameRoomPresence()
    .catch((error) => console.warn("Game room presence failed", error));
  if (destination === "game" || destination === "results") {
    startLoadedGameChallenge(challenge);
    return true;
  }

  state.gameChallengeMessage = "Waiting room opened from your notification.";
  renderPreservingReaderScroll();
  return true;
}

function applySocialNotificationDeepLink() {
  if (!state.authUser) return false;
  const params = new URLSearchParams(window.location.search);
  const socialTarget = String(params.get("social") || "");
  const challengeId = String(params.get("challenge") || "");
  if (!socialTarget && !challengeId) return false;
  const deepLinkKey = `${state.authUser.id}:${socialTarget}:${challengeId}:${params.get("tab") || ""}`;
  if (handledSocialNotificationDeepLink === deepLinkKey) return false;
  handledSocialNotificationDeepLink = deepLinkKey;
  state.focusMode = false;
  state.settingsOpen = false;

  if (socialTarget === "friends") {
    setSocialConnectionsOpen(true);
    state.friendsPanelTab = params.get("tab") === "requests" ? "requests" : "friends";
    state.accountOpen = true;
    state.friendshipMessage = state.friendsPanelTab === "requests"
      ? "Friend requests"
      : state.friendshipMessage;
    renderPreservingReaderScroll();
    requestAnimationFrame(() => document.querySelector(".friends-card")?.scrollIntoView?.({ block: "nearest" }));
    return true;
  }

  if (socialTarget === "challenges" || challengeId) {
    const challenge = state.gameChallenges.find((item) => item.id === challengeId);
    const player = challenge ? gameChallengePlayer(challenge.id, state.authUser.id) : null;
    return openGameChallengeNotificationDestination(challenge, player);
  }

  return false;
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
  const cleaned = String(value || "").trim().replace(/[–—]/g, "-").replace(/\s+/g, " ");
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
  state.presentationPart = 0;
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
  if (state.libraryOpen && libraryStateKey(target) !== libraryStateKey(state.activeRail)) {
    rememberOpenLibraryState();
    persistLibraryScrollByRail();
  }
  pendingLibraryEnter = !state.libraryOpen;
  state.activeRail = target;
  state.libraryOpen = true;
  localStorage.setItem("lw_library_open", "true");
  scheduleCloudSync();
  state.pendingPanelFocus = isCompactScreen() || isShortLandscapeScreen() ? null : target;
  state.pendingLibraryScrollRestore = Boolean(savedLibraryScroll(target));
  renderPreservingReaderScroll();
}

function dismissLibraryForFooterMenu() {
  if (!state.libraryOpen) return;
  rememberOpenLibraryState();
  persistLibraryScrollByRail();
  state.libraryOpen = false;
  state.pendingPanelFocus = null;
  state.pendingLibraryScrollRestore = false;
  localStorage.setItem("lw_library_open", "false");
  scheduleCloudSync();
}

function closeLibrary() {
  const readerScroll = captureReaderScroll();
  rememberOpenLibraryState();
  persistLibraryScrollByRail();
  animateBeforeRemoval(".library-drawer", () => {
    state.libraryOpen = false;
    localStorage.setItem("lw_library_open", "false");
    scheduleCloudSync();
    render();
    restoreReaderScroll(readerScroll);
    requestAnimationFrame(() => {
      restoreReaderScroll(readerScroll);
      requestAnimationFrame(() => restoreReaderScroll(readerScroll));
    });
  }, { duration: 260, settleFrames: 1 });
}

function adjustTextScale(delta, { feedback = false } = {}) {
  state.textScale = clampTextScale(state.textScale + delta);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  scheduleCloudSync();
  render();
  if (feedback) requestAnimationFrame(() => showReaderTextScaleFeedback({ settle: true }));
}

function resetTextScale({ feedback = false } = {}) {
  state.textScale = 1;
  localStorage.setItem("lw_text_scale", "1");
  scheduleCloudSync();
  render();
  if (feedback) requestAnimationFrame(() => showReaderTextScaleFeedback({ settle: true }));
}

function showPresentationTextScaleFeedback({ settle = false } = {}) {
  const feedback = document.getElementById("presentationScaleFeedback");
  const label = feedback?.querySelector(".presentation-scale-feedback-label");
  if (!feedback || !label) return;
  const percent = Math.round(state.presentationTextScale * 100);
  label.textContent = `${percent}%`;
  feedback.classList.add("show");
  clearTimeout(presentationScaleFeedbackTimer);
  if (!settle) return;
  presentationScaleFeedbackTimer = setTimeout(() => feedback.classList.remove("show"), 900);
}

function applyPresentationTextScale() {
  const presentationElement = document.getElementById("presentation");
  if (!presentationElement) return;
  presentationElement.style.setProperty("--presentation-text-scale", state.presentationTextScale);
  const resetLabel = document.querySelector("#presentationResetText strong");
  if (resetLabel) resetLabel.textContent = `${Math.round(state.presentationTextScale * 100)}%`;
  fitPresentationText();
}

function persistPresentationTextScale() {
  state.presentationTextScale = clampPresentationTextScale(state.presentationTextScale);
  localStorage.setItem("lw_presentation_text_scale", String(state.presentationTextScale));
  scheduleCloudSync();
}

function adjustPresentationTextScale(delta, { feedback = false } = {}) {
  state.presentationTextScale = clampPresentationTextScale(state.presentationTextScale + delta);
  persistPresentationTextScale();
  render();
  if (feedback) requestAnimationFrame(() => showPresentationTextScaleFeedback({ settle: true }));
}

function resetPresentationTextScale({ feedback = false } = {}) {
  state.presentationTextScale = defaultPresentationTextScale;
  persistPresentationTextScale();
  render();
  if (feedback) requestAnimationFrame(() => showPresentationTextScaleFeedback({ settle: true }));
}

let pendingFocusChromeEnter = false;
let pendingLibraryEnter = false;

function toggleFocusMode() {
  const enteringFocus = !state.focusMode;
  const applyFocusMode = () => {
    state.focusReferenceOpen = false;
    state.focusSearchResultsOpen = false;
    resetFocusToolSurfaces();
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
    ".rail, .library-drawer, .chapter-tools-region, .footer-region",
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
  state.footerVersionMenuOpen = false;
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
  const scrollState = captureReaderScroll();
  const previousHeight = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
  render();
  const restoreReaderPosition = () => {
    restoreReaderScroll(scrollState);
    updateReaderTopButton();
  };
  restoreReaderPosition();
  requestAnimationFrame(() => {
    restoreReaderPosition();
    requestAnimationFrame(restoreReaderPosition);
  });
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
      restoreReaderPosition();
    });
}

function toggleShortcuts(forceOpen) {
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !state.shortcutsOpen;
  if (state.shortcutsOpen && !nextOpen) {
    animateBeforeRemoval(".shortcut-overlay.open", () => {
      state.shortcutsOpen = false;
      state.shortcutsPopupPosition = null;
      render();
    }, { duration: 220 });
    return;
  }
  if (!state.shortcutsOpen && nextOpen) state.shortcutsPopupPosition = null;
  state.shortcutsOpen = nextOpen;
  render();
}

function openKeyboardShortcutsHelp() {
  state.helpSectionsOpen.keyboard = true;
  if (!state.shortcutsOpen) state.shortcutsPopupPosition = null;
  state.shortcutsOpen = true;
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const section = document.querySelector('[data-help-section="keyboard"]');
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    section?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    section?.querySelector("summary")?.focus({ preventScroll: true });
  }));
}

function toggleAboutMenu(forceOpen, anchorId = state.aboutMenuAnchor) {
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !state.aboutMenuOpen;
  if (state.aboutMenuOpen && !nextOpen) {
    const restoreAnchor = state.aboutMenuAnchor;
    animateBeforeRemoval(".about-menu-overlay.open", () => {
      state.aboutMenuOpen = false;
      renderPreservingReaderScroll();
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(restoreAnchor)?.focus()));
    }, { duration: 220 });
    return;
  }
  state.aboutMenuAnchor = anchorId;
  state.aboutMenuOpen = nextOpen;
  state.shortcutsOpen = false;
  state.settingsOpen = false;
  state.accountOpen = false;
  state.headerVersionMenuOpen = false;
  state.footerVersionMenuOpen = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("closeAboutMenu")?.focus()));
}

function trapAboutMenuFocus(event) {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === dialog || document.activeElement === first)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeHeaderVersionMenu() {
  if (!state.headerVersionMenuOpen) return;
  animateBeforeRemoval(".topbar .primary-version-menu", () => {
    state.headerVersionMenuOpen = false;
    renderPreservingReaderScroll();
  }, { duration: 180 });
}

function closeFooterVersionMenu() {
  if (!state.footerVersionMenuOpen) return;
  animateBeforeRemoval(".footer-version-menu", () => {
    state.footerVersionMenuOpen = false;
    renderPreservingReaderScroll();
  }, { duration: 180 });
}

function closeSettingsPopover() {
  if (!state.settingsOpen) return;
  animateBeforeRemoval(".settings-popover.open, .mobile-settings-popover", () => {
    state.settingsOpen = false;
    state.settingsPopupPosition = null;
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
    maybeOfferPushNotifications();
  }, { duration: 220 });
}

function startTutorial() {
  restoreTutorialTemporaryState();
  markTutorialSeen();
  state.shortcutsOpen = false;
  state.settingsOpen = false;
  state.presentationSettingsOpen = false;
  state.headerVersionMenuOpen = false;
  state.tutorialActive = true;
  state.tutorialStep = 0;
  state.tutorialMode = state.mode === "big" ? "presentation" : "app";
  if (state.mode === "big") state.presentationControlsVisible = true;
  prepareCurrentTutorialStep();
  renderPreservingReaderScroll();
}

function finishTutorial() {
  animateBeforeRemoval(".tutorial-card", () => {
    restoreTutorialTemporaryState();
    state.tutorialActive = false;
    state.tutorialStep = 0;
    renderPreservingReaderScroll();
    maybeOfferPushNotifications();
  }, { duration: 180 });
}

function advanceTutorial() {
  if (state.tutorialStep >= activeTutorialSteps().length - 1) {
    animateBeforeRemoval(".tutorial-card", () => {
      restoreTutorialTemporaryState();
      state.tutorialActive = false;
      state.tutorialStep = 0;
      renderPreservingReaderScroll();
      showToast("Tour complete");
      maybeOfferPushNotifications();
    }, { duration: 180 });
    return;
  }
  restoreTutorialTemporaryState();
  state.tutorialStep += 1;
  prepareCurrentTutorialStep();
  renderPreservingReaderScroll();
}

function retreatTutorial() {
  restoreTutorialTemporaryState();
  state.tutorialStep = Math.max(0, state.tutorialStep - 1);
  prepareCurrentTutorialStep();
  renderPreservingReaderScroll();
}

function currentTutorialStep() {
  const steps = activeTutorialSteps();
  return steps[Math.min(Math.max(state.tutorialStep, 0), steps.length - 1)] || steps[0];
}

function activeTutorialSteps() {
  const presentationTour = state.tutorialMode === "presentation";
  const steps = presentationTour ? presentationTutorialSteps : tutorialSteps;
  if (state.authUser) return steps;
  return [...steps, presentationTour ? presentationAccountTutorialStep : accountTutorialStep];
}

function prepareCurrentTutorialStep() {
  const step = currentTutorialStep();
  if (!step?.revealVerseSelector || !state.verseNavCollapsed) return;
  state.tutorialRestoreState = {
    ...(state.tutorialRestoreState || {}),
    verseNavCollapsed: true,
  };
  state.verseNavCollapsed = false;
}

function restoreTutorialTemporaryState() {
  if (state.tutorialRestoreState?.verseNavCollapsed !== undefined) {
    state.verseNavCollapsed = state.tutorialRestoreState.verseNavCollapsed;
  }
  state.tutorialRestoreState = null;
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

function tutorialVisibleElementRect(element) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return null;
  return rect;
}

function tutorialElementsForSelectors(selectors) {
  return selectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .filter((element, index, elements) => elements.indexOf(element) === index)
    .filter((element) => tutorialVisibleElementRect(element));
}

function rectFromTutorialElements(elements) {
  const rects = elements.map(tutorialVisibleElementRect).filter(Boolean);
  if (!rects.length) return null;
  return rects.reduce((union, rect) => ({
    left: Math.min(union.left, rect.left),
    top: Math.min(union.top, rect.top),
    right: Math.max(union.right, rect.right),
    bottom: Math.max(union.bottom, rect.bottom),
  }), {
    left: rects[0].left,
    top: rects[0].top,
    right: rects[0].right,
    bottom: rects[0].bottom,
  });
}

function resolveTutorialSpotlightRect(step = currentTutorialStep()) {
  const spotlightSelectors = (step.spotlightTarget || step.target)
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
  const elements = tutorialElementsForSelectors(spotlightSelectors);
  if (elements.length) {
    const spotlightElements = step.spotlightGroup ? elements : [elements[0]];
    const rect = rectFromTutorialElements(spotlightElements);
    if (rect) return rect;
  }
  if (step.spotlightRequired) return null;
  const target = resolveTutorialTarget(step);
  return tutorialVisibleElementRect(target);
}

function updateTutorialSpotlight() {
  if (!state.tutorialActive) return;
  const spotlight = document.getElementById("tutorialSpotlight");
  const card = document.getElementById("tutorialCard");
  if (!spotlight || !card) return;
  const rect = resolveTutorialSpotlightRect();
  if (!rect) {
    spotlight.classList.add("hidden");
    card.style.removeProperty("left");
    card.style.removeProperty("top");
    card.style.removeProperty("right");
    card.style.removeProperty("bottom");
    return;
  }
  const step = currentTutorialStep();
  const pad = Number.isFinite(step.spotlightPadding) ? step.spotlightPadding : (isCompactScreen() ? 7 : 9);
  const viewportGutter = 3;
  const left = Math.max(viewportGutter, rect.left - pad);
  const top = Math.max(viewportGutter, rect.top - pad);
  const rectWidth = rect.width ?? rect.right - rect.left;
  const rectHeight = rect.height ?? rect.bottom - rect.top;
  const width = Math.min(window.innerWidth - left - viewportGutter, rectWidth + pad * 2);
  const height = Math.min(window.innerHeight - top - viewportGutter, rectHeight + pad * 2);
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
  const desiredLeft = rect.left + rectWidth / 2 - cardRect.width / 2;
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

function touchStartPoint(event) {
  if (event.touches?.length !== 1) return null;
  const touch = event.touches?.[0];
  if (!touch) return null;
  return {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
  };
}

function horizontalSwipeDirection(start, touch) {
  if (!start || !touch) return 0;
  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;
  const elapsed = Date.now() - start.time;
  if (
    elapsed > horizontalSwipeMaxMs
    || Math.abs(deltaX) < horizontalSwipeMinPx
    || Math.abs(deltaX) < Math.abs(deltaY) * horizontalSwipeDominance
  ) {
    return 0;
  }
  return deltaX < 0 ? 1 : -1;
}

function isSwipeControlTarget(target) {
  return Boolean(target?.closest?.("button, input, select, textarea, a, [contenteditable='true'], [role='button']"));
}

function isPresentationSwipeIgnored(target) {
  return Boolean(isSwipeControlTarget(target) || target?.closest?.(".presentation-settings-popover"));
}

function resetPresentationDrag({ animate = true } = {}) {
  const presentationElement = document.getElementById("presentation");
  if (!presentationElement) return;
  clearTimeout(presentationTransitionTimer);
  presentationTransitionTimer = 0;
  presentationElement.classList.remove(
    "presentation-dragging",
    "presentation-preview-next",
    "presentation-preview-previous",
    "presentation-swipe-ready",
  );
  if (animate) presentationElement.classList.add("presentation-drag-settling");
  presentationElement.style.setProperty("--presentation-drag-x", "0px");
  presentationElement.style.setProperty("--presentation-drag-progress", "0");
  if (!animate) return presentationElement.classList.remove("presentation-drag-settling");
  presentationTransitionTimer = setTimeout(() => {
    presentationElement.classList.remove("presentation-drag-settling");
    presentationElement.style.removeProperty("--presentation-drag-x");
    presentationElement.style.removeProperty("--presentation-drag-progress");
  }, 220);
}

function beginPresentationPinch(event) {
  const touches = Array.from(event.touches || []);
  if (touches.length !== 2) return false;
  presentationTouchStart = null;
  presentationPinchGesture = {
    startDistance: touchDistance(touches[0], touches[1]),
    startScale: state.presentationTextScale,
    active: false,
  };
  resetPresentationDrag({ animate: false });
  return true;
}

function handlePresentationTouchStart(event) {
  revealPresentationControls();
  const presentationElement = document.getElementById("presentation");
  if (
    state.mode !== "big"
    || state.presentationSearchOpen
    || state.presentationSettingsOpen
    || isPresentationSwipeIgnored(event.target)
    || presentationElement?.classList.contains("presentation-swipe-commit-next")
    || presentationElement?.classList.contains("presentation-swipe-commit-previous")
  ) {
    presentationTouchStart = null;
    presentationPinchGesture = null;
    return;
  }
  if (event.touches?.length === 2) {
    beginPresentationPinch(event);
    return;
  }
  presentationPinchGesture = null;
  presentationTouchStart = touchStartPoint(event);
}

function handlePresentationPinchMove(event) {
  const gesture = presentationPinchGesture;
  if (!gesture || event.touches?.length !== 2 || !gesture.startDistance) return false;
  const distance = touchDistance(event.touches[0], event.touches[1]);
  if (!gesture.active && Math.abs(distance - gesture.startDistance) >= readerPinchStartPx) gesture.active = true;
  if (!gesture.active) return false;
  if (event.cancelable) event.preventDefault();
  state.presentationTextScale = clamp(gesture.startScale * (distance / gesture.startDistance), 0.6, 1.6);
  applyPresentationTextScale();
  showPresentationTextScaleFeedback();
  return true;
}

function handlePresentationTouchMove(event) {
  if (handlePresentationPinchMove(event)) return;
  const start = presentationTouchStart;
  const touch = event.touches?.[0];
  const presentationElement = document.getElementById("presentation");
  if (!start || !touch || !presentationElement || event.touches?.length !== 1) return;
  const deltaX = touch.clientX - start.x;
  const deltaY = touch.clientY - start.y;
  if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY) * 1.05) return;
  if (event.cancelable) event.preventDefault();
  const direction = deltaX < 0 ? 1 : -1;
  const preview = presentationElement.querySelector(
    direction > 0 ? ".presentation-swipe-preview-next" : ".presentation-swipe-preview-previous",
  );
  const width = Math.max(presentationElement.clientWidth, 320);
  const distance = Math.abs(deltaX);
  const resistedDistance = preview
    ? Math.min(distance, width * 0.42)
    : Math.min(distance * 0.18, 38);
  const dragX = Math.sign(deltaX) * resistedDistance;
  const progress = preview ? Math.min(1, distance / horizontalSwipeMinPx) : Math.min(0.35, distance / width);
  presentationElement.classList.add("presentation-dragging");
  presentationElement.classList.toggle("presentation-preview-next", direction > 0 && Boolean(preview));
  presentationElement.classList.toggle("presentation-preview-previous", direction < 0 && Boolean(preview));
  presentationElement.classList.toggle("presentation-swipe-ready", Boolean(preview) && distance >= horizontalSwipeMinPx);
  presentationElement.style.setProperty("--presentation-drag-x", `${dragX}px`);
  presentationElement.style.setProperty("--presentation-drag-progress", progress.toFixed(3));
}

function finishPresentationPinch() {
  const gesture = presentationPinchGesture;
  presentationPinchGesture = null;
  presentationTouchStart = null;
  if (!gesture?.active) return;
  persistPresentationTextScale();
  applyPresentationTextScale();
  showPresentationTextScaleFeedback({ settle: true });
}

function commitPresentationSwipe(direction) {
  const presentationElement = document.getElementById("presentation");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!presentationElement || reducedMotion) {
    presentationEnterDirection = 0;
    moveVerse(direction);
    return;
  }
  presentationElement.classList.remove("presentation-dragging", "presentation-swipe-ready");
  presentationElement.classList.add(direction > 0 ? "presentation-swipe-commit-next" : "presentation-swipe-commit-previous");
  clearTimeout(presentationTransitionTimer);
  presentationTransitionTimer = setTimeout(() => {
    presentationEnterDirection = direction;
    moveVerse(direction);
  }, presentationSwipeCommitMs);
}

function handlePresentationTouchEnd(event) {
  if (presentationPinchGesture) {
    if ((event.touches?.length || 0) < 2) finishPresentationPinch();
    return;
  }
  if (state.mode !== "big" || !presentationTouchStart || state.presentationSearchOpen || state.presentationSettingsOpen) return;
  if (isPresentationSwipeIgnored(event.target)) {
    presentationTouchStart = null;
    resetPresentationDrag();
    return;
  }
  const touch = event.changedTouches?.[0];
  if (!touch) return resetPresentationDrag();
  const direction = horizontalSwipeDirection(presentationTouchStart, touch);
  presentationTouchStart = null;
  const previewSelector = direction > 0 ? ".presentation-swipe-preview-next" : ".presentation-swipe-preview-previous";
  if (!direction || !document.querySelector(previewSelector)) return resetPresentationDrag();
  if (event.cancelable) event.preventDefault();
  commitPresentationSwipe(direction);
}

function cancelPresentationTouch() {
  if (presentationPinchGesture?.active) {
    persistPresentationTextScale();
    applyPresentationTextScale();
    showPresentationTextScaleFeedback({ settle: true });
  }
  presentationPinchGesture = null;
  presentationTouchStart = null;
  resetPresentationDrag();
}

function canUseReaderChapterSwipe() {
  return state.mode === "reader" || state.mode === "parallel";
}

function canUseReaderKeyboardNavigation() {
  return state.mode === "reader" || state.mode === "parallel";
}

function canUseVerseKeyboardNavigation() {
  return state.mode === "big" || canUseReaderKeyboardNavigation();
}

function isReaderChapterSwipeIgnored(target) {
  if (target?.closest?.("[data-strong]")) return false;
  return Boolean(isSwipeControlTarget(target) || target?.closest?.(".study-popup, .mobile-verse-nav-menu"));
}

function handleReaderChapterSwipeStart(event) {
  if (!canUseReaderChapterSwipe() || isReaderChapterSwipeIgnored(event.target)) {
    readerChapterTouchStart = null;
    return;
  }
  readerChapterTouchStart = touchStartPoint(event);
}

function handleReaderChapterSwipeEnd(event) {
  if (!canUseReaderChapterSwipe() || !readerChapterTouchStart) return;
  if (event.touches?.length) {
    readerChapterTouchStart = null;
    return;
  }
  if (isReaderChapterSwipeIgnored(event.target)) {
    readerChapterTouchStart = null;
    return;
  }
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const direction = horizontalSwipeDirection(readerChapterTouchStart, touch);
  readerChapterTouchStart = null;
  if (!direction) return;
  moveChapter(direction);
}

function readerChapterPullProgress(distance) {
  return Math.min(1, Math.max(
    0,
    (distance - readerChapterPullStartPx) / (readerChapterPullThresholdPx - readerChapterPullStartPx),
  ));
}

function readerChapterPullIntent(pull, touch) {
  if (!pull || !touch) return null;
  const deltaX = touch.clientX - pull.startX;
  const deltaY = touch.clientY - pull.startY;
  const distance = Math.abs(deltaY);
  if (
    distance < readerChapterPullStartPx
    || distance < Math.abs(deltaX) * readerChapterPullDominance
  ) return null;
  const direction = deltaY > 0 ? -1 : 1;
  const reference = direction < 0 ? pull.previousReference : pull.nextReference;
  if (!reference) return null;
  return {
    direction,
    reference,
    distance: Math.min(readerChapterPullMaxPx, distance),
    progress: readerChapterPullProgress(distance),
    armed: distance >= readerChapterPullThresholdPx,
  };
}

function readerChapterPullElement(direction) {
  return document.getElementById(direction > 0 ? "readerChapterPullNext" : "readerChapterPullPrevious");
}

function resetReaderChapterPullIndicators() {
  document.querySelectorAll(".reader-chapter-pull-indicator").forEach((indicator) => {
    indicator.classList.remove("visible", "armed", "wheel-input");
    indicator.style.removeProperty("opacity");
    indicator.style.removeProperty("--pull-angle");
    indicator.style.removeProperty("--pull-shift");
    indicator.style.removeProperty("--pull-scale");
    const action = indicator.querySelector(".reader-chapter-pull-action");
    if (action) action.textContent = action.dataset.defaultLabel || "";
  });
  const status = document.getElementById("readerChapterPullStatus");
  if (status) status.textContent = "";
}

function updateReaderChapterPullVisual(pull, intent) {
  const indicator = readerChapterPullElement(intent.direction);
  if (!indicator) return;
  const otherIndicator = readerChapterPullElement(-intent.direction);
  otherIndicator?.classList.remove("visible", "armed");
  const progress = intent.progress;
  const shift = (1 - progress) * (intent.direction > 0 ? 12 : -12);
  indicator.classList.add("visible");
  indicator.classList.toggle("armed", intent.armed);
  indicator.classList.toggle("wheel-input", pull.source === "wheel");
  indicator.style.opacity = String(Math.min(1, 0.18 + progress * 0.82));
  indicator.style.setProperty("--pull-angle", `${Math.round(progress * 360)}deg`);
  indicator.style.setProperty("--pull-shift", `${shift.toFixed(1)}px`);
  indicator.style.setProperty("--pull-scale", String(0.94 + progress * 0.06));
  const action = indicator.querySelector(".reader-chapter-pull-action");
  if (action) {
    const chapterDirection = intent.direction > 0 ? "next chapter" : "previous chapter";
    action.textContent = pull.source === "wheel"
      ? (intent.armed ? `Pause for ${chapterDirection}` : `Keep scrolling for ${chapterDirection}`)
      : (intent.armed ? `Release for ${chapterDirection}` : action.dataset.defaultLabel);
  }
  if (intent.armed !== pull.armed) {
    const status = document.getElementById("readerChapterPullStatus");
    if (status) {
      status.textContent = intent.armed
        ? `${pull.source === "wheel" ? "Pause" : "Release"} to open ${intent.reference}`
        : "";
    }
  }
  pull.surface.classList.remove("reader-chapter-pull-settling");
  pull.surface.classList.add("reader-chapter-pulling");
  const elasticDistance = Math.min(38, Math.max(0, intent.distance - readerChapterPullStartPx) * 0.36);
  pull.surface.style.setProperty(
    "--reader-pull-offset",
    `${intent.direction < 0 ? elasticDistance : -elasticDistance}px`,
  );
}

function readerSurfaceAtPullBoundary(surface, direction) {
  const maxScrollTop = Math.max(0, surface.scrollHeight - surface.clientHeight);
  return direction < 0
    ? surface.scrollTop <= readerChapterPullBoundaryPx
    : surface.scrollTop >= maxScrollTop - readerChapterPullBoundaryPx;
}

function handleReaderChapterPullStart(event) {
  clearTimeout(readerChapterPullSettleTimer);
  if (
    !state.edgeChapterNavigationEnabled
    || !canUseReaderChapterSwipe()
    || event.touches?.length !== 1
    || isReaderChapterSwipeIgnored(event.target)
  ) {
    cancelReaderChapterPull();
    return;
  }
  const surface = event.currentTarget;
  const touch = event.touches[0];
  const maxScrollTop = Math.max(0, surface.scrollHeight - surface.clientHeight);
  const previousReference = surface.scrollTop <= readerChapterPullBoundaryPx
    ? adjacentChapterReference(-1)
    : "";
  const nextReference = surface.scrollTop >= maxScrollTop - readerChapterPullBoundaryPx
    ? adjacentChapterReference(1)
    : "";
  if (!previousReference && !nextReference) {
    readerChapterPull = null;
    return;
  }
  readerChapterPull = {
    surface,
    touchId: touch.identifier,
    startX: touch.clientX,
    startY: touch.clientY,
    previousReference,
    nextReference,
    source: "touch",
    active: false,
    armed: false,
    direction: 0,
  };
}

function handleReaderChapterPullMove(event) {
  const pull = readerChapterPull;
  if (!pull) return;
  if (event.touches?.length !== 1) {
    cancelReaderChapterPull();
    return;
  }
  const touch = Array.from(event.touches).find((item) => item.identifier === pull.touchId);
  if (!touch) {
    cancelReaderChapterPull();
    return;
  }
  const intent = readerChapterPullIntent(pull, touch);
  if (!intent) {
    const horizontalDistance = Math.abs(touch.clientX - pull.startX);
    const verticalDistance = Math.abs(touch.clientY - pull.startY);
    if (!pull.active && horizontalDistance > readerChapterPullStartPx && horizontalDistance > verticalDistance) {
      readerChapterPull = null;
    }
    return;
  }
  if (!readerSurfaceAtPullBoundary(pull.surface, intent.direction)) {
    cancelReaderChapterPull();
    return;
  }
  if (event.cancelable) event.preventDefault();
  pauseReaderAutoScroll();
  readerChapterTouchStart = null;
  readerBlankTapStart = null;
  pull.active = true;
  pull.direction = intent.direction;
  updateReaderChapterPullVisual(pull, intent);
  pull.armed = intent.armed;
}

function settleReaderChapterPull(pull = readerChapterPull) {
  readerChapterPull = null;
  resetReaderChapterPullIndicators();
  const surface = pull?.surface;
  if (!surface) return;
  surface.classList.remove("reader-chapter-pulling");
  surface.classList.add("reader-chapter-pull-settling");
  surface.style.setProperty("--reader-pull-offset", "0px");
  clearTimeout(readerChapterPullSettleTimer);
  readerChapterPullSettleTimer = setTimeout(() => {
    surface.classList.remove("reader-chapter-pull-settling");
    surface.style.removeProperty("--reader-pull-offset");
  }, 220);
}

function handleReaderChapterPullEnd(event) {
  const pull = readerChapterPull;
  if (!pull) return;
  if (event.touches?.length) {
    cancelReaderChapterPull();
    return;
  }
  if (pull.active && event.cancelable) event.preventDefault();
  const direction = pull.direction;
  const shouldMove = pull.active && pull.armed && direction !== 0;
  readerChapterTouchStart = null;
  if (!shouldMove) {
    settleReaderChapterPull(pull);
    return;
  }
  readerChapterPull = null;
  resetReaderChapterPullIndicators();
  pull.surface.classList.remove("reader-chapter-pulling", "reader-chapter-pull-settling");
  pull.surface.style.removeProperty("--reader-pull-offset");
  moveChapter(direction);
}

function cancelReaderChapterPull() {
  if (!readerChapterPull) {
    resetReaderChapterPullIndicators();
    return;
  }
  settleReaderChapterPull(readerChapterPull);
}

function normalizedReaderChapterWheelDelta(deltaY, deltaMode = 0, pageHeight = 800) {
  const multiplier = deltaMode === 1 ? 16 : deltaMode === 2 ? Math.max(1, pageHeight) : 1;
  return Math.min(readerChapterWheelStepMaxPx, Math.abs(deltaY) * multiplier);
}

function updateReaderChapterEdgeBuffer(surface, now = Date.now()) {
  if (!surface) {
    readerChapterEdgeBuffer = null;
    return null;
  }
  if (!readerChapterEdgeBuffer || readerChapterEdgeBuffer.surface !== surface) {
    readerChapterEdgeBuffer = {
      surface,
      topSince: 0,
      bottomSince: 0,
      lastWheelAt: 0,
    };
  }
  const maxScrollTop = Math.max(0, surface.scrollHeight - surface.clientHeight);
  const atTop = surface.scrollTop <= readerChapterPullBoundaryPx;
  const atBottom = surface.scrollTop >= maxScrollTop - readerChapterPullBoundaryPx;
  readerChapterEdgeBuffer.topSince = atTop
    ? (readerChapterEdgeBuffer.topSince || now)
    : 0;
  readerChapterEdgeBuffer.bottomSince = atBottom
    ? (readerChapterEdgeBuffer.bottomSince || now)
    : 0;
  return readerChapterEdgeBuffer;
}

function bindReaderChapterEdgeBuffer(surface) {
  if (!surface) {
    readerChapterEdgeBuffer = null;
    return;
  }
  updateReaderChapterEdgeBuffer(surface);
  surface.addEventListener("scroll", () => updateReaderChapterEdgeBuffer(surface), { passive: true });
}

function readerChapterWheelBufferReady(buffer, direction, now = Date.now()) {
  if (!buffer) return false;
  const edgeSince = direction < 0 ? buffer.topSince : buffer.bottomSince;
  const edgeIsSettled = Boolean(edgeSince) && now - edgeSince >= readerChapterWheelEdgeSettleMs;
  const wheelSequenceIsFresh = !buffer.lastWheelAt
    || now - buffer.lastWheelAt >= readerChapterWheelSequenceGapMs;
  return edgeIsSettled && wheelSequenceIsFresh;
}

function delayReaderChapterWheelEdge(buffer, direction, now) {
  if (!buffer) return;
  if (direction < 0) buffer.topSince = now;
  else buffer.bottomSince = now;
  buffer.lastWheelAt = now;
}

function finishReaderChapterWheelPull() {
  const pull = readerChapterWheelPull;
  readerChapterWheelPull = null;
  clearTimeout(readerChapterWheelTimer);
  readerChapterWheelTimer = 0;
  if (!pull) return;
  if (!pull.armed) {
    settleReaderChapterPull(pull);
    return;
  }
  resetReaderChapterPullIndicators();
  pull.surface.classList.remove("reader-chapter-pulling", "reader-chapter-pull-settling");
  pull.surface.style.removeProperty("--reader-pull-offset");
  moveChapter(pull.direction);
}

function cancelReaderChapterWheelPull({ settle = true } = {}) {
  const pull = readerChapterWheelPull;
  readerChapterWheelPull = null;
  clearTimeout(readerChapterWheelTimer);
  readerChapterWheelTimer = 0;
  if (!pull) return;
  if (settle) {
    settleReaderChapterPull(pull);
    return;
  }
  resetReaderChapterPullIndicators();
  pull.surface.classList.remove("reader-chapter-pulling", "reader-chapter-pull-settling");
  pull.surface.style.removeProperty("--reader-pull-offset");
}

function handleReaderChapterWheel(event) {
  pauseReaderAutoScroll();
  if (
    !state.edgeChapterNavigationEnabled
    || !canUseReaderChapterSwipe()
    || chapterNavigationInProgress
    || event.ctrlKey
    || event.shiftKey
    || !event.deltaY
    || Math.abs(event.deltaX) > Math.abs(event.deltaY)
  ) return;
  const surface = event.currentTarget;
  const now = Date.now();
  const edgeBuffer = updateReaderChapterEdgeBuffer(surface, now);
  const direction = event.deltaY > 0 ? 1 : -1;
  const reference = adjacentChapterReference(direction);
  if (!reference || !readerSurfaceAtPullBoundary(surface, direction)) {
    if (edgeBuffer) edgeBuffer.lastWheelAt = now;
    if (readerChapterWheelPull) cancelReaderChapterWheelPull();
    return;
  }
  const continuingPull = readerChapterWheelPull
    && readerChapterWheelPull.surface === surface
    && readerChapterWheelPull.direction === direction;
  if (!continuingPull && !readerChapterWheelBufferReady(edgeBuffer, direction, now)) {
    delayReaderChapterWheelEdge(edgeBuffer, direction, now);
    if (readerChapterWheelPull) cancelReaderChapterWheelPull();
    return;
  }
  if (edgeBuffer) edgeBuffer.lastWheelAt = now;
  if (event.cancelable) event.preventDefault();
  if (readerChapterPull) cancelReaderChapterPull();
  if (
    readerChapterWheelPull
    && (readerChapterWheelPull.surface !== surface || readerChapterWheelPull.direction !== direction)
  ) cancelReaderChapterWheelPull({ settle: false });
  if (!readerChapterWheelPull) {
    readerChapterWheelPull = {
      surface,
      direction,
      reference,
      source: "wheel",
      distance: 0,
      active: true,
      armed: false,
    };
  }
  const pull = readerChapterWheelPull;
  pull.distance = Math.min(
    readerChapterPullMaxPx,
    pull.distance + normalizedReaderChapterWheelDelta(event.deltaY, event.deltaMode, surface.clientHeight),
  );
  const visualDistance = readerChapterPullStartPx + pull.distance;
  const intent = {
    direction,
    reference,
    distance: visualDistance,
    progress: readerChapterPullProgress(visualDistance),
    armed: visualDistance >= readerChapterPullThresholdPx,
  };
  updateReaderChapterPullVisual(pull, intent);
  pull.armed = intent.armed;
  clearTimeout(readerChapterWheelTimer);
  readerChapterWheelTimer = setTimeout(finishReaderChapterWheelPull, readerChapterWheelIdleMs);
}

function touchDistance(first, second) {
  if (!first || !second) return 0;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function touchPoint(touch) {
  return {
    x: touch.clientX,
    y: touch.clientY,
  };
}

function touchMovedBeyond(start, touch, tolerance = readerGestureMoveTolerancePx) {
  if (!start || !touch) return true;
  return Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > tolerance;
}

function readerGestureTouchesAllowed(touches, surface) {
  return Array.from(touches || []).every((touch) => (
    surface.contains(touch.target)
    && !isReaderChapterSwipeIgnored(touch.target)
  ));
}

function isUnusedReaderTapTarget(target, surface) {
  if (!target || !surface?.contains(target)) return false;
  return !target.closest?.([
    "[data-verse]",
    "button",
    "a",
    "input",
    "select",
    "textarea",
    "[contenteditable='true']",
    "[role='button']",
    ".section-title",
    ".scripture-heading",
    ".scripture-attribution",
    ".verse-of-day-reader",
  ].join(", "));
}

function updateReaderGestureMovement(gesture, touches) {
  if (!gesture) return;
  Array.from(touches || []).forEach((touch) => {
    const start = gesture.startPoints.get(touch.identifier);
    if (touchMovedBeyond(start, touch)) gesture.moved = true;
  });
}

function showReaderTextScaleFeedback({ settle = false } = {}) {
  const feedback = document.getElementById("readerGestureFeedback");
  const label = feedback?.querySelector(".reader-gesture-feedback-label");
  if (!feedback || !label) return;
  const percent = Math.round(state.textScale * 100);
  if (label.textContent !== `${percent}%`) label.textContent = `${percent}%`;
  feedback.classList.add("show");
  clearTimeout(readerGestureFeedbackTimer);
  if (!settle) return;
  readerGestureFeedbackTimer = setTimeout(() => feedback.classList.remove("show"), 900);
}

function restoreReaderAfterTextScale(scrollState) {
  if (!scrollState) return;
  restoreReaderScroll(scrollState);
  requestAnimationFrame(() => {
    restoreReaderScroll(scrollState);
    requestAnimationFrame(() => restoreReaderScroll(scrollState));
  });
}

function finishReaderPinch(gesture) {
  state.textScale = clampTextScale(state.textScale);
  localStorage.setItem("lw_text_scale", String(state.textScale));
  applyTextScaleVars();
  scheduleCloudSync();
  restoreReaderAfterTextScale(gesture?.scrollState);
  showReaderTextScaleFeedback({ settle: true });
}

function toggleReaderFocusFromGesture() {
  if (!canUseReaderChapterSwipe()) return;
  const enteringFocus = !state.focusMode;
  toggleFocusMode();
  setTimeout(() => showToast(state.focusMode ? "Focus Mode on" : "Focus Mode off"), enteringFocus ? 280 : 0);
}

function toggleReaderAutoScrollFromGesture() {
  if (!canUseReaderChapterSwipe()) return;
  toggleReaderAutoScroll();
}

function beginReaderTwoFingerGesture(event, surface) {
  const touches = Array.from(event.touches || []);
  if (touches.length !== 2 || !readerGestureTouchesAllowed(touches, surface)) {
    readerTouchGesture = null;
    return;
  }
  readerChapterTouchStart = null;
  readerBlankTapStart = null;
  lastReaderBlankTap = null;
  readerTouchGesture = {
    startedAt: Date.now(),
    startDistance: touchDistance(touches[0], touches[1]),
    startScale: state.textScale,
    startPoints: new Map(touches.map((touch) => [touch.identifier, touchPoint(touch)])),
    moved: false,
    pinchActive: false,
    scrollState: captureReaderScroll(),
  };
}

function beginReaderBlankTap(event, surface) {
  const touch = event.touches?.[0];
  if (!touch || !isUnusedReaderTapTarget(event.target, surface)) {
    readerBlankTapStart = null;
    lastReaderBlankTap = null;
    return;
  }
  readerBlankTapStart = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    mode: state.mode,
    reference: state.reference,
  };
}

function handleReaderGestureStart(event) {
  if (!canUseReaderChapterSwipe()) return;
  const surface = event.currentTarget;
  if (event.touches?.length === 1) {
    pauseReaderAutoScroll();
    readerTouchGesture = null;
    beginReaderBlankTap(event, surface);
    return;
  }
  if (event.touches?.length === 2) {
    beginReaderTwoFingerGesture(event, surface);
    return;
  }
  cancelReaderTouchGesture();
}

function handleReaderGestureMove(event) {
  if (readerBlankTapStart && touchMovedBeyond(readerBlankTapStart, event.touches?.[0])) {
    readerBlankTapStart = null;
  }
  const gesture = readerTouchGesture;
  if (!gesture) return;
  updateReaderGestureMovement(gesture, event.touches);
  if (event.touches?.length !== 2) return;
  const distance = touchDistance(event.touches[0], event.touches[1]);
  if (!gesture.pinchActive && Math.abs(distance - gesture.startDistance) >= readerPinchStartPx) {
    gesture.pinchActive = true;
    pauseReaderAutoScroll();
  }
  if (!gesture.pinchActive || !gesture.startDistance) return;
  if (event.cancelable) event.preventDefault();
  state.textScale = clamp(gesture.startScale * (distance / gesture.startDistance), 0.8, 1.6);
  applyTextScaleVars();
  showReaderTextScaleFeedback();
}

function finishReaderBlankTap(event) {
  const tap = readerBlankTapStart;
  readerBlankTapStart = null;
  const touch = event.changedTouches?.[0];
  if (
    !tap
    || !touch
    || Date.now() - tap.time > readerTwoFingerTapMaxMs
    || touchMovedBeyond(tap, touch)
  ) return;
  const previous = lastReaderBlankTap;
  const current = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now(),
    mode: tap.mode,
    reference: tap.reference,
  };
  const isDoubleTap = Boolean(
    previous
    && current.time - previous.time <= readerDoubleTapMaxMs
    && previous.mode === current.mode
    && previous.reference === current.reference
    && Math.hypot(current.x - previous.x, current.y - previous.y) <= readerDoubleTapDistancePx
  );
  if (!isDoubleTap) {
    lastReaderBlankTap = current;
    return;
  }
  lastReaderBlankTap = null;
  if (event.cancelable) event.preventDefault();
  toggleReaderFocusFromGesture();
}

function handleReaderGestureEnd(event) {
  const gesture = readerTouchGesture;
  if (gesture?.pinchActive) {
    readerTouchGesture = null;
    readerBlankTapStart = null;
    if (event.cancelable) event.preventDefault();
    finishReaderPinch(gesture);
    return;
  }
  if (gesture) {
    updateReaderGestureMovement(gesture, event.changedTouches);
    if (event.touches?.length) return;
    readerTouchGesture = null;
    readerBlankTapStart = null;
    if (!gesture.moved && Date.now() - gesture.startedAt <= readerTwoFingerTapMaxMs) {
      if (event.cancelable) event.preventDefault();
      toggleReaderAutoScrollFromGesture();
    }
    return;
  }
  if (!event.touches?.length) finishReaderBlankTap(event);
}

function cancelReaderTouchGesture() {
  if (readerTouchGesture?.pinchActive) finishReaderPinch(readerTouchGesture);
  cancelReaderChapterPull();
  readerTouchGesture = null;
  readerBlankTapStart = null;
  readerChapterTouchStart = null;
}

function handleGlobalShortcuts(event) {
  const key = event.key.toLowerCase();
  const modifiedSlash = (event.metaKey || event.ctrlKey) && event.key === "/";
  const typing = isTypingTarget(event.target);

  if (gameChallengePopupIsVisible()) {
    if (event.key === "Escape") {
      event.preventDefault();
      dismissGameChallengePopup();
    }
    return;
  }

  if (modifiedSlash) {
    event.preventDefault();
    toggleShortcuts();
    return;
  }

  if (!typing && event.key === "?") {
    event.preventDefault();
    openKeyboardShortcutsHelp();
    return;
  }

  // Leave browser and operating-system shortcuts alone. This keeps common
  // commands such as Cmd/Ctrl+F, Cmd/Ctrl+P, Cmd/Ctrl+R, and Alt+Arrow working.
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "Escape") {
    if (state.pushPromptVisible) {
      event.preventDefault();
      return dismissPushPermissionPrompt();
    }
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
    if (state.aboutMenuOpen) {
      event.preventDefault();
      return toggleAboutMenu(false);
    }
    if (state.shortcutsOpen) {
      event.preventDefault();
      return toggleShortcuts(false);
    }
    if (state.streakPopoverOpen) {
      event.preventDefault();
      return toggleStreakPopover(false);
    }
    if (state.settingsOpen) {
      event.preventDefault();
      return closeSettingsPopover();
    }
    if (state.focusReferenceOpen) {
      event.preventDefault();
      state.focusReferenceOpen = false;
      return renderPreservingReaderScroll();
    }
    if (state.focusSearchResultsOpen) {
      event.preventDefault();
      state.focusSearchResultsOpen = false;
      return renderPreservingReaderScroll();
    }
    if (state.focusWorkspacePanel) {
      event.preventDefault();
      state.focusWorkspacePanel = "";
      return renderPreservingReaderScroll();
    }
    if (state.focusToolsOpen) {
      event.preventDefault();
      resetFocusToolSurfaces();
      return renderPreservingReaderScroll();
    }
    if (state.headerVersionMenuOpen) {
      event.preventDefault();
      return closeHeaderVersionMenu();
    }
    if (state.footerVersionMenuOpen) {
      event.preventDefault();
      return closeFooterVersionMenu();
    }
    if (Number.isInteger(state.parallelVersionMenuIndex)) {
      event.preventDefault();
      state.parallelVersionMenuIndex = null;
      state.parallelVersionMenuPosition = null;
      return renderPreservingReaderScroll();
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

  if (typing || state.pushPromptVisible || state.shortcutsOpen || state.aboutMenuOpen || state.tutorialActive || state.tutorialIntroVisible) return;

  if (event.shiftKey && event.code === "Equal") {
    event.preventDefault();
    if (state.mode === "big") return adjustPresentationTextScale(0.1, { feedback: true });
    return adjustTextScale(0.1, { feedback: true });
  }
  if (event.shiftKey && event.code === "Minus") {
    event.preventDefault();
    if (state.mode === "big") return adjustPresentationTextScale(-0.1, { feedback: true });
    return adjustTextScale(-0.1, { feedback: true });
  }
  if (event.shiftKey && event.code === "Digit0") {
    event.preventDefault();
    if (state.mode === "big") return resetPresentationTextScale({ feedback: true });
    return resetTextScale({ feedback: true });
  }
  if (event.shiftKey && key === "s") {
    event.preventDefault();
    const enabled = !state.strongNumbers;
    const lexiconLoad = setStrongNumbers(enabled, true);
    const showFeedback = () => requestAnimationFrame(() => showToast(`Strong's lookups ${enabled ? "on" : "off"}`));
    if (lexiconLoad) lexiconLoad.finally(showFeedback);
    else showFeedback();
    return;
  }
  if (!event.shiftKey && key === "a" && canUseReaderKeyboardNavigation()) {
    event.preventDefault();
    return toggleReaderAutoScroll();
  }

  if ((event.key === "ArrowUp" || event.key === "ArrowDown") && canUseVerseKeyboardNavigation()) {
    event.preventDefault();
    return moveVerse(event.key === "ArrowDown" ? 1 : -1, {
      extendSelection: event.shiftKey && canUseReaderKeyboardNavigation(),
      followVerse: canUseReaderKeyboardNavigation(),
    });
  }
  if (event.key === "ArrowLeft" && state.mode === "big") {
    event.preventDefault();
    return moveVerse(-1);
  }
  if (event.key === "ArrowRight" && state.mode === "big") {
    event.preventDefault();
    return moveVerse(1);
  }
  if (event.key === "ArrowLeft" && canUseReaderKeyboardNavigation()) {
    event.preventDefault();
    return moveChapter(-1);
  }
  if (event.key === "ArrowRight" && canUseReaderKeyboardNavigation()) {
    event.preventDefault();
    return moveChapter(1);
  }
  if (key === "p") {
    event.preventDefault();
    return switchMode("big");
  }
  if (key === "f") {
    event.preventDefault();
    if (event.shiftKey) return toggleFullscreen();
    return toggleFocusMode();
  }
  if (key === "t") {
    event.preventDefault();
    return switchMode("trivia");
  }
  if (event.key === "/") {
    event.preventDefault();
    return shortcutWorkspace("Search");
  }
  if (key === "h") {
    event.preventDefault();
    return invokeHighlightBar();
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
  if (target === "Search" && state.focusMode && state.mode !== "big") {
    return focusFocusModeSearch();
  }
  if (state.mode === "big") state.mode = "reader";
  if (state.focusMode) {
    state.focusMode = false;
    localStorage.setItem("lw_focus_mode", "false");
  }
  activateWorkspace(target);
}

function focusFocusModeSearch() {
  const focusInput = () => {
    const input = document.getElementById("referenceInput");
    input?.focus({ preventScroll: true });
    input?.select();
  };
  if (state.focusReferenceOpen || state.focusSearchResultsOpen || state.focusToolsOpen || state.focusWorkspacePanel) {
    state.focusReferenceOpen = false;
    state.focusSearchResultsOpen = false;
    resetFocusToolSurfaces();
    renderPreservingReaderScroll();
    requestAnimationFrame(focusInput);
    return;
  }
  focusInput();
}

function invokeHighlightBar() {
  if (!canUseReaderKeyboardNavigation()) return;
  if (state.selectedVerses.length) {
    focusHighlightPalette();
    return;
  }
  state.selectedVerses = [state.verse];
  state.isVerseOfDayActive = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(focusHighlightPalette);
}

function focusHighlightPalette() {
  document.querySelector("[data-highlight-color]")?.focus({ preventScroll: true });
}

function openHighlightToolsForVerse(verseNumber) {
  if (!canUseReaderKeyboardNavigation()) return;
  state.verse = verseNumber;
  state.selectedVerses = [verseNumber];
  state.keyboardSelectionAnchor = null;
  state.isVerseOfDayActive = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(focusHighlightPalette);
}

function isTypingTarget(target) {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function clampTextScale(value) {
  return Math.round(Math.min(1.6, Math.max(0.8, Number(value) || 1)) * 10) / 10;
}

function clampPresentationTextScale(value) {
  return Math.round(Math.min(1.6, Math.max(0.6, Number(value) || defaultPresentationTextScale)) * 10) / 10;
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
  } else {
    verse = scaled(26, 1.86, 58);
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

  if (target === "Verse" || target === "Search" || target === "History" || target === "Cross-Refs") {
    libraryPanel?.scrollTo({ top: 0, behavior: "auto" });
    if (target === "Verse" || target === "Search") element.focus?.({ preventScroll: true });
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
  pushCurrentReturnTargetForNavigation(reference, bibleData[reference]?.verses?.[0]?.n);
  state.reference = reference;
  state.verse = currentChapter().verses[0].n;
  state.presentationPart = 0;
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
  const exactMatch = bookAliases[cleaned] || bookAliases[compact];
  if (exactMatch) return exactMatch;

  // Keep very short or ambiguous prefixes from silently opening the wrong book.
  if (cleaned.replace(/[^a-z]/g, "").length < 3) return null;
  const prefixMatches = books.filter((book) => {
    const normalizedBook = book.toLowerCase();
    return normalizedBook.startsWith(cleaned) || normalizedBook.replace(/\s+/g, "").startsWith(compact);
  });
  return prefixMatches.length === 1 ? prefixMatches[0] : null;
}

function scrollSelectedVerseIntoView(options = {}) {
  const block = options.block || "center";
  const scripture = document.querySelector(".scripture");
  const selected = scripture?.querySelector(`[data-verse="${state.verse}"]`)
    || document.querySelector(`[data-verse="${state.verse}"]`);
  if (!selected) return;
  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  if (scripture && scripture.scrollHeight > scripture.clientHeight) {
    const scriptureBounds = scripture.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    const followMargin = 24;
    let nextTop = scripture.scrollTop
      + selectedBounds.top
      - scriptureBounds.top
      - ((scripture.clientHeight - selectedBounds.height) / 2);
    if (block === "nearest") {
      const selectedTop = selectedBounds.top - scriptureBounds.top;
      const selectedBottom = selectedBounds.bottom - scriptureBounds.top;
      if (selectedTop < followMargin) {
        nextTop = scripture.scrollTop + selectedTop - followMargin;
      } else if (selectedBottom > scripture.clientHeight - followMargin) {
        nextTop = scripture.scrollTop + selectedBottom - scripture.clientHeight + followMargin;
      } else {
        return;
      }
    }
    scripture.scrollTo({ top: Math.max(0, nextTop), behavior });
    return;
  }
  selected.scrollIntoView({ block, behavior });
}

function scrollFirstInlineSearchHitIntoView() {
  scrollInlineSearchHitIntoView(0, { smooth: false });
}

function scrollInlineSearchHitIntoView(index, { smooth = true } = {}) {
  const scripture = document.querySelector(".scripture");
  const hits = [...(scripture?.querySelectorAll("mark.inline-search-hit") || [])];
  const hit = hits[index];
  if (!hit) return false;
  state.inlineSearchMatchCount = hits.length;
  hits.forEach((item) => item.classList.remove("inline-search-hit-first"));
  hit.classList.add("inline-search-hit-first");
  state.inlineSearchHitIndex = index;
  updateInlineSearchProgress();
  const verseNumber = Number(hit.closest("[data-verse]")?.getAttribute("data-verse"));
  if (Number.isFinite(verseNumber)) state.verse = verseNumber;
  const behavior = !smooth || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  if (scripture.scrollHeight > scripture.clientHeight) {
    const scriptureBounds = scripture.getBoundingClientRect();
    const hitBounds = hit.getBoundingClientRect();
    const nextTop = scripture.scrollTop
      + hitBounds.top
      - scriptureBounds.top
      - ((scripture.clientHeight - hitBounds.height) / 2);
    const targetTop = Math.max(0, nextTop);
    if (behavior === "auto") scripture.scrollTop = targetTop;
    else scripture.scrollTo({ top: targetTop, behavior });
    return true;
  }
  hit.scrollIntoView({ block: "center", behavior });
  return true;
}

function moveVerse(direction, options = {}) {
  if (state.mode === "big") {
    const parts = currentPresentationParts();
    const partIndex = Math.max(0, Math.min(parts.length - 1, Number(state.presentationPart) || 0));
    if (direction < 0 && partIndex > 0) {
      state.presentationPart = partIndex - 1;
      render();
      return;
    }
    if (direction > 0 && partIndex < parts.length - 1) {
      state.presentationPart = partIndex + 1;
      render();
      return;
    }
  }

  const verses = currentChapter().verses.map((verse) => verse.n);
  const index = verses.indexOf(state.verse);
  const nextIndex = Math.max(0, Math.min(verses.length - 1, index + direction));
  if (nextIndex === index) return;
  const previousVerse = state.verse;
  state.verse = verses[nextIndex];
  state.presentationPart = 0;
  if (state.mode === "big" && direction < 0) {
    state.presentationPart = Math.max(0, currentPresentationParts().length - 1);
  }
  state.isVerseOfDayActive = false;
  if (options.extendSelection) extendKeyboardVerseSelection(previousVerse, state.verse);
  else state.keyboardSelectionAnchor = null;
  recordHistory();
  if (options.followVerse) return renderFollowingSelectedVerse();
  render();
}

function extendKeyboardVerseSelection(anchorFallback, activeVerse) {
  const available = currentChapter().verses.map((verse) => verse.n);
  if (!state.selectedVerses.length || !available.includes(state.keyboardSelectionAnchor)) {
    state.keyboardSelectionAnchor = anchorFallback;
  }
  const anchorIndex = available.indexOf(state.keyboardSelectionAnchor);
  const activeIndex = available.indexOf(activeVerse);
  if (anchorIndex === -1 || activeIndex === -1) return;
  const [from, to] = [anchorIndex, activeIndex].sort((a, b) => a - b);
  state.selectedVerses = available.slice(from, to + 1);
}

function applyChapterMove(direction, nextReference, { animated = false } = {}) {
  pendingChapterChange = {
    direction: direction > 0 ? 1 : -1,
    reference: nextReference,
  };
  state.reference = nextReference;
  state.verse = currentChapter().verses[0].n;
  state.presentationPart = 0;
  state.selectedVerses = [];
  state.keyboardSelectionAnchor = null;
  state.isVerseOfDayActive = false;
  recordHistory();
  render();
  clearTimeout(chapterNavigationTransitionTimer);
  if (!animated) {
    chapterNavigationInProgress = false;
    chapterNavigationTransitionTimer = 0;
    return;
  }
  chapterNavigationTransitionTimer = setTimeout(() => {
    chapterNavigationInProgress = false;
    chapterNavigationTransitionTimer = 0;
  }, chapterNavigationEnterMs);
}

function moveChapter(direction) {
  if (chapterNavigationInProgress) return false;
  const nextReference = adjacentChapterReference(direction);
  if (!nextReference) return false;
  if (readerChapterWheelPull) cancelReaderChapterWheelPull({ settle: false });
  const surface = canUseReaderChapterSwipe() ? document.querySelector(".scripture") : null;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!surface || reducedMotion) {
    applyChapterMove(direction, nextReference);
    return true;
  }
  chapterNavigationInProgress = true;
  surface.classList.remove("reader-chapter-pulling", "reader-chapter-pull-settling");
  surface.style.removeProperty("--reader-pull-offset");
  surface.classList.add(direction > 0 ? "chapter-transition-out-forward" : "chapter-transition-out-back");
  surface.setAttribute("aria-busy", "true");
  clearTimeout(chapterNavigationTransitionTimer);
  chapterNavigationTransitionTimer = setTimeout(() => {
    applyChapterMove(direction, nextReference, { animated: true });
  }, chapterNavigationExitMs);
  return true;
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
  persistNote(ref, note);
  render();
  requestAnimationFrame(() => showToast(note ? "Note saved" : "Note deleted"));
}

function persistNote(ref, note) {
  const cleaned = String(note || "").trim();
  if (cleaned) state.notes[ref] = cleaned;
  else delete state.notes[ref];
  localStorage.setItem("lw_notes", JSON.stringify(state.notes));
  scheduleCloudSync();
  return cleaned;
}

function saveNoteComposer(event) {
  event.preventDefault();
  const ref = state.noteComposerRef;
  const note = persistNote(ref, document.getElementById("noteComposerTextarea")?.value);
  state.noteComposerRef = "";
  state.noteComposerAnchor = null;
  pendingNoteComposerFocus = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(() => showToast(note ? "Note saved" : "Note deleted"));
}

function deleteNoteComposer() {
  const ref = state.noteComposerRef;
  if (!ref) return;
  persistNote(ref, "");
  state.noteComposerRef = "";
  state.noteComposerAnchor = null;
  pendingNoteComposerFocus = false;
  renderPreservingReaderScroll();
  requestAnimationFrame(() => showToast("Note deleted"));
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

function editNote(ref, anchor = null) {
  openNoteComposer(ref, anchor);
}

function deleteNote(ref) {
  persistNote(ref, "");
  if (state.noteComposerRef === ref) {
    state.noteComposerRef = "";
    state.noteComposerAnchor = null;
  }
  renderPreservingReaderScroll();
  requestAnimationFrame(() => showToast("Note deleted"));
}

function openHighlightNote(ref) {
  const returnTarget = captureReaderReturnTarget();
  if (!setReferenceFromString(ref)) return;
  if (returnTarget && !currentPassageMatchesReturnTarget(returnTarget)) {
    pushReaderReturnTarget(returnTarget);
    state.returnSelectionToolsOpen = false;
  }
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
  const text = passageShareText(verseNumbers);
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyText(text);
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
  state.keyboardSelectionAnchor = null;
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
  state.keyboardSelectionAnchor = null;
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

function selectedCrossReferenceVerse() {
  return selectedVerseNumbers()[0] || state.verse;
}

function dismissSelectionBarOnOutsideClick(event) {
  if (!state.selectedVerses.length) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest(".selection-bar, .reader-selection-tools-button, [data-selection-action], .cross-ref-popup, .strong-popup, .note-composer")) return;
  state.selectedVerses = [];
  renderPreservingReaderScroll();
}

function passageLines(verseNumbers = selectedVerseNumbers()) {
  if (state.isVerseOfDayActive && state.verseOfDayItem) {
    return [{ n: state.verse, text: state.verseOfDayItem.verseText }];
  }
  const selected = new Set(verseNumbers);
  return currentChapter().verses
    .filter((verse) => selected.has(verse.n))
    .map((verse) => ({ n: verse.n, text: getVerseText(verse, state.versions[0]), verse }));
}

function passageText(verseNumbers = selectedVerseNumbers()) {
  if (state.isVerseOfDayActive && state.verseOfDayItem) {
    return `${state.verseOfDayItem.reference}\n${state.verseOfDayItem.verseText}`;
  }
  const lines = passageLines(verseNumbers);
  const reference = formatReferenceLabel(state.reference, verseNumbers);
  return `${reference} ${translationDisplayCode(state.versions[0])}\n${lines.map(({ n, text }) => `${n}. ${text}`).join("\n")}`;
}

function passageShareText(verseNumbers = selectedVerseNumbers()) {
  const lines = passageLines(verseNumbers);
  const quote = lines
    .map(({ n, text }) => verseNumbers.length > 1 ? `${n}. ${String(text || "").trim()}` : String(text || "").trim())
    .filter(Boolean)
    .join("\n");
  const reference = state.isVerseOfDayActive && state.verseOfDayItem
    ? state.verseOfDayItem.reference
    : formatReferenceLabel(state.reference, verseNumbers);
  const version = translationDisplayCode(state.versions[0]);
  return `“${quote}”\n— ${reference} (${version})\n\n${passageShareUrl(verseNumbers)}`;
}

function passageShareUrl(verseNumbers = selectedVerseNumbers()) {
  const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || "https://bigscreenbible.com/";
  const url = new URL(canonicalUrl);
  url.searchParams.set("ref", `${state.reference}:${verseNumbers[0]}`);
  if (verseNumbers.length > 1) url.searchParams.set("verses", verseRangeParam(verseNumbers));
  else url.searchParams.delete("verses");
  if (["reader", "parallel", "big"].includes(state.mode)) url.searchParams.set("mode", state.mode);
  return url.toString();
}

function updateShareUrl() {
  if (!window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("ref", state.isVerseOfDayActive && state.verseOfDayItem
    ? state.verseOfDayItem.reference
    : referenceLabel());
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
  const shell = toast.closest(".app-shell");
  clearTimeout(statusToastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  shell?.classList.add("toast-visible");
  statusToastTimer = setTimeout(() => {
    toast.classList.remove("show");
    shell?.classList.remove("toast-visible");
  }, 1600);
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
  const naturalFontSize = Number.parseFloat(getComputedStyle(copy).fontSize) || 64;
  const baseFontSize = naturalFontSize * clamp(state.presentationTextScale, 0.6, 1.6);
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
  if (maxScale < 1 || state.presentationTextScale !== defaultPresentationTextScale) {
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
  if (state.mode === "big") {
    clearTimeout(presentationResizeTimer);
    presentationResizeTimer = setTimeout(render, 120);
  } else {
    fitPresentationText();
    if (isCompactScreen() || isShortLandscapeScreen()) preserveReaderScrollAfterViewportChange();
  }
});
window.addEventListener("orientationchange", () => {
  if (state.mode === "big") {
    clearTimeout(presentationResizeTimer);
    presentationResizeTimer = setTimeout(render, 120);
    return;
  }
  if (isCompactScreen() || isShortLandscapeScreen()) renderAfterViewportChangePreservingReaderScroll();
});

function buildBookAliases() {
  const aliases = {};
  const add = (book, ...values) => values.forEach((value) => {
    aliases[normalizeAliasKey(value)] = book;
  });

  books.forEach((book) => add(book, book, book.replace(/^\d\s+/, "$&"), book.replace(/\s+/g, "")));
  add("Genesis", "gen", "ge", "gn");
  add("Exodus", "ex", "exo", "exod");
  add("Leviticus", "lev", "le");
  add("Numbers", "num", "numb", "nu", "nm");
  add("Deuteronomy", "deut", "dt", "deu");
  add("Joshua", "jos", "josh");
  add("Judges", "jdg", "judg");
  add("Ruth", "ru");
  add("1 Samuel", "1sam", "1sa", "1 sam", "1 sa");
  add("2 Samuel", "2sam", "2sa", "2 sam", "2 sa");
  add("1 Kings", "1ki", "1kgs", "1 kin", "1kin", "1 kgs", "1 king", "1 kings");
  add("2 Kings", "2ki", "2kgs", "2 kin", "2kin", "2 kgs", "2 king", "2 kings");
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
  add("Mark", "mrk", "mk", "mar");
  add("Luke", "luk", "lk");
  add("John", "jhn", "jn");
  add("Acts", "act", "ac");
  add("Romans", "rom", "ro", "rm");
  add("1 Corinthians", "1cor", "1co", "1 cor", "1 corinthians");
  add("2 Corinthians", "2cor", "2co", "2 cor", "2 corinthians");
  add("Galatians", "gal");
  add("Ephesians", "eph");
  add("Philippians", "phi", "phil", "php");
  add("Colossians", "col");
  add("1 Thessalonians", "1th", "1thess", "1 thess", "1 thessalonians");
  add("2 Thessalonians", "2th", "2thess", "2 thess", "2 thessalonians");
  add("1 Timothy", "1tim", "1ti", "1 tim", "1 timothy");
  add("2 Timothy", "2tim", "2ti", "2 tim", "2 timothy");
  add("Titus", "tit");
  add("Philemon", "phm", "phile", "philem");
  add("Hebrews", "heb");
  add("James", "jas", "jam", "jm");
  add("1 Peter", "1pet", "1pe", "1 peter");
  add("2 Peter", "2pet", "2pe", "2 peter");
  add("1 John", "1jn", "1 jn", "1john", "1 john");
  add("2 John", "2jn", "2 jn", "2john", "2 john");
  add("3 John", "3jn", "3 jn", "3john", "3 john");
  add("Jude", "jud");
  add("Revelation", "rev", "re", "rv");
  return aliases;
}

function normalizeAliasKey(value) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

async function initializeBibleData() {
  render();
  if (state.strongNumbers) loadStrongLexicon();
  try {
    await loadBibleBundleScript("index");
    bibleIndex = window.BIGSCREEN_BIBLE_INDEX;
    if (!bibleIndex) throw new Error("Bible index script did not initialize");
    await Promise.all([
      loadBibleParagraphMetadata(),
      loadBibleSectionHeadingMetadata(),
      loadBibleRedLetterMetadata(),
    ]);
    const bundledVersions = new Set(["BSB", ...state.versions.filter(isBundledTranslation)]);
    await Promise.all([...bundledVersions].map(loadBibleVersion));
    rebuildBibleData();
    await applyStartupExperience();
    const updateRestoreState = consumeAppUpdateRestoreState();
    const updateScrollState = applyAppUpdateRestoreState(updateRestoreState);
    stageAppUpdatePositionRestore(updateScrollState, updateRestoreState?.targetVersion || "");
    dataLoading = false;
    render();
    if (!updateScrollState) restoreSavedReaderPositionAfterStartup();
    maybeOfferPushNotifications();
    window.setTimeout(maybeCheckForAppUpdate, 1200);
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
  const baseUrl = String(config.functionsUrl || config.url).replace(/\/$/, "");
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}/functions/v1/${functionName}?${searchParams}`;
}

function normalizeVerseOfDaySourceUrl(value, fallbackUrl = defaultVerseOfDaySourceUrl) {
  try {
    const parsedUrl = new URL(String(value || "").trim() || fallbackUrl);
    const approvedHosts = new Set([
      "verseoftheday.com",
      "www.verseoftheday.com",
      "heartlight.org",
      "www.heartlight.org",
    ]);
    if (parsedUrl.protocol === "https:" && approvedHosts.has(parsedUrl.hostname)) {
      return parsedUrl.toString();
    }
  } catch {
    // Fall through to the direct VerseoftheDay link.
  }
  return fallbackUrl;
}

function normalizeVerseOfDayItem(payload) {
  const reference = String(payload?.reference || "").trim();
  const verseText = String(payload?.verseText || "").replace(/\s+/g, " ").trim();
  const sourceUrl = normalizeVerseOfDaySourceUrl(payload?.sourceUrl);
  const publishedAt = String(payload?.publishedAt || "").trim();
  const parsedReference = parsePassageReference(reference);
  if (
    !parsedReference || !bibleData[parsedReference.key] || !verseText ||
    verseText.length > 2000 || Number.isNaN(Date.parse(publishedAt))
  ) return null;

  return { reference, verseText, sourceUrl, publishedAt };
}

async function fetchVerseOfDayItem() {
  if (state.verseOfDayItem) return state.verseOfDayItem;
  if (verseOfDayRequest) return verseOfDayRequest;

  verseOfDayRequest = (async () => {
    const config = window.BigScreenBibleSupabase || {};
    const url = supabaseFunctionUrl("verse-of-the-day");
    if (!url || !config.anonKey) return null;
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Verse of the Day request failed");
      const item = normalizeVerseOfDayItem(payload);
      if (!item) throw new Error("Verse of the Day returned invalid data");
      state.verseOfDayItem = item;
      return item;
    } catch (error) {
      console.warn("[Verse of the Day] Using curated fallback", error);
      return null;
    }
  })();

  return verseOfDayRequest;
}

function remoteFunctionUrl(version, chapterKey) {
  const provider = translationProvider(version);
  if (!provider.edgeFunction) return "";
  const params = provider === bibleProviders.apiBible || provider === bibleProviders.youVersion
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
      cache: "no-store",
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
    if (!translationProvider(version).showsAttribution) return;
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

function verseOfDayAttributionMarkup(className = "") {
  const item = state.isVerseOfDayActive ? state.verseOfDayItem : null;
  if (!state.isVerseOfDayActive && !item?.sourceUrl) return "";
  const sourceUrl = normalizeVerseOfDaySourceUrl(item?.sourceUrl);
  const attributionText = item?.sourceUrl
    ? "Verse of the Day courtesy of VerseoftheDay.com / Heartlight."
    : "Today's Verse on VerseoftheDay.com / Heartlight.";
  const classes = ["verse-of-day-attribution", className].filter(Boolean).join(" ");
  return `
    <aside class="${classes}" aria-label="Verse of the Day source">
      <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${attributionText}</a>
    </aside>
  `;
}

function mergeRemoteVersionChapter(version, chapterKey, verses) {
  const chapter = bibleData[chapterKey];
  if (!chapter) return;
  verses.forEach(({ n, text, paragraphStart, sectionHeadings, wordsOfJesus }) => {
    if (!Number.isFinite(Number(n)) || !text) return;
    let verse = chapter.verses.find((item) => item.n === Number(n));
    if (!verse) {
      verse = { n: Number(n) };
      chapter.verses.push(verse);
    }
    verse[version] = normalizeRemoteProviderText(version, text);
    if (typeof paragraphStart === "boolean") {
      verse.paragraphStart = verse.paragraphStart || {};
      verse.paragraphStart[version] = paragraphStart;
    }
    if (Array.isArray(sectionHeadings)) {
      verse.sectionHeadings = verse.sectionHeadings || {};
      verse.sectionHeadings[version] = sectionHeadings
        .map((heading) => ({
          text: normalizeRemoteProviderText(version, heading?.text),
          level: Math.max(1, Math.min(4, Number(heading?.level) || 1)),
        }))
        .filter((heading) => heading.text);
    }
    if (Array.isArray(wordsOfJesus) && wordsOfJesus.length) {
      verse.wordsOfJesus = verse.wordsOfJesus || {};
      verse.wordsOfJesus[version] = wordsOfJesus;
    }
  });
  chapter.verses.sort((a, b) => a.n - b.n);
}

function normalizeRemoteProviderText(version, value) {
  const text = String(value || "").trim();
  if (translationProvider(version) !== bibleProviders.apiBible) return text;
  return text
    .replace(/\bL\s+ord(?=[A-Z])/g, "Lord ")
    .replace(/\bL\s+ord\b/g, "Lord");
}

async function loadBibleParagraphMetadata() {
  await loadBibleBundleScript("paragraphs", {
    globalName: "BIGSCREEN_BIBLE_PARAGRAPHS",
    optional: true,
  });
  bibleParagraphs = window.BIGSCREEN_BIBLE_PARAGRAPHS || null;
}

async function loadBibleSectionHeadingMetadata() {
  await loadBibleBundleScript("headings", {
    globalName: "BIGSCREEN_BIBLE_HEADINGS",
    optional: true,
    version: "20260624-bundled-section-headings",
  });
  bibleSectionHeadings = window.BIGSCREEN_BIBLE_HEADINGS || null;
}

async function loadBibleRedLetterMetadata() {
  await loadBibleBundleScript("red-letters", {
    globalName: "BIGSCREEN_BIBLE_RED_LETTERS",
    optional: true,
    version: "20260623-derived-red-letters",
  });
  bibleRedLetters = window.BIGSCREEN_BIBLE_RED_LETTERS || null;
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
    const bundleVersion = options.version || appVersion;
    script.src = `./assets/bibles/${name}.js?v=${encodeURIComponent(bundleVersion)}`;
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
        if (Array.isArray(sourceVerse.sectionHeadings)) {
          verse.sectionHeadings = verse.sectionHeadings || {};
          verse.sectionHeadings[version] = sourceVerse.sectionHeadings
            .map((heading) => ({
              text: String(heading?.text || "").trim(),
              level: Math.max(1, Math.min(4, Number(heading?.level) || 1)),
            }))
            .filter((heading) => heading.text);
        }
        if (Array.isArray(sourceVerse.wordsOfJesus)) {
          verse.wordsOfJesus = verse.wordsOfJesus || {};
          verse.wordsOfJesus[version] = sourceVerse.wordsOfJesus;
        }
      });
    });
  });
  applyParagraphMetadata(merged);
  applySectionHeadingMetadata(merged);
  applyRedLetterMetadata(merged);
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

function applySectionHeadingMetadata(merged) {
  const versions = bibleSectionHeadings?.versions || {};
  Object.entries(versions).forEach(([version, chapters]) => {
    Object.entries(chapters || {}).forEach(([chapterKey, headingVerses]) => {
      const chapter = merged[chapterKey];
      if (!chapter || !headingVerses || typeof headingVerses !== "object") return;
      chapter.verses.forEach((verse) => {
        const headings = headingVerses[verse.n];
        if (!Array.isArray(headings) || !headings.length) return;
        const normalized = headings
          .map((heading) => ({
            text: String(heading?.text || "").trim(),
            level: Math.max(1, Math.min(4, Number(heading?.level) || 1)),
          }))
          .filter((heading) => heading.text);
        if (!normalized.length) return;
        verse.sectionHeadings = verse.sectionHeadings || {};
        verse.sectionHeadings[version] = mergeSectionHeadings(verse.sectionHeadings[version], normalized);
      });
    });
  });
}

function mergeSectionHeadings(existingHeadings, newHeadings) {
  const merged = Array.isArray(existingHeadings) ? [...existingHeadings] : [];
  newHeadings.forEach((heading) => {
    if (!merged.some((item) => item.text === heading.text && item.level === heading.level)) {
      merged.push(heading);
    }
  });
  return merged;
}

function applyRedLetterMetadata(merged) {
  const versions = bibleRedLetters?.versions || {};
  Object.entries(versions).forEach(([version, chapters]) => {
    Object.entries(chapters || {}).forEach(([chapterKey, annotatedVerses]) => {
      const chapter = merged[chapterKey];
      if (!chapter || !annotatedVerses || typeof annotatedVerses !== "object") return;
      chapter.verses.forEach((verse) => {
        const ranges = annotatedVerses[verse.n];
        if (!Array.isArray(ranges) || !ranges.length) return;
        verse.wordsOfJesus = verse.wordsOfJesus || {};
        verse.wordsOfJesus[version] = ranges;
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
  state.focusReferenceOpen = false;
  state.focusSearchResultsOpen = false;
  resetFocusToolSurfaces();
  state.headerVersionMenuOpen = false;
  state.footerVersionMenuOpen = false;
  state.parallelVersionMenuIndex = null;
  state.parallelVersionMenuPosition = null;
  renderAfterViewportChangePreservingReaderScroll();
});
const shortLandscapeQuery = window.matchMedia?.("(orientation: landscape) and (max-width: 1024px) and (max-height: 560px)");
shortLandscapeQuery?.addEventListener("change", () => {
  state.settingsOpen = false;
  state.focusReferenceOpen = false;
  state.focusSearchResultsOpen = false;
  resetFocusToolSurfaces();
  state.headerVersionMenuOpen = false;
  state.footerVersionMenuOpen = false;
  state.parallelVersionMenuIndex = null;
  state.parallelVersionMenuPosition = null;
  renderAfterViewportChangePreservingReaderScroll();
});
window.addEventListener("scroll", updateReaderTopButton, { passive: true });
window.addEventListener("scroll", revealMobileSettingsButton, { passive: true });
window.addEventListener("scroll", updateTutorialSpotlight, { passive: true });
window.addEventListener("scroll", positionAccountPopover, { passive: true });
window.addEventListener("scroll", positionSettingsPopover, { passive: true });
window.addEventListener("statusTap", scrollReaderToTop);
window.addEventListener("blur", () => {
  pauseReaderAutoScroll();
  if (isStandaloneWebApp()) rememberReaderScrollBeforeAppSwitch();
});
window.addEventListener("focus", () => {
  if (isStandaloneWebApp()) restoreReaderScrollAfterAppSwitch({ allowStored: true });
});
window.addEventListener("resize", () => {
  refreshDraggedPopupPositions();
  updateTutorialSpotlight();
  positionAccountPopover();
  positionSettingsPopover();
  positionFocusSearchResults();
  positionFocusWorkspacePanel();
  positionNoteComposer();
});
window.visualViewport?.addEventListener("resize", () => {
  refreshDraggedPopupPositions();
  positionSettingsPopover();
  positionFocusWorkspacePanel();
  positionNoteComposer();
});
window.visualViewport?.addEventListener("scroll", refreshDraggedPopupPositions);
document.addEventListener("click", (event) => {
  if (!state.headerVersionMenuOpen || event.target.closest?.(".primary-version-control, .version-manager")) return;
  closeHeaderVersionMenu();
});
document.addEventListener("click", (event) => {
  if (!state.footerVersionMenuOpen || event.target.closest?.(".footer-version-control")) return;
  closeFooterVersionMenu();
});
document.addEventListener("click", (event) => {
  if (!Number.isInteger(state.parallelVersionMenuIndex) || event.target.closest?.(".parallel-version-selector, .parallel-version-menu")) return;
  state.parallelVersionMenuIndex = null;
  state.parallelVersionMenuPosition = null;
  renderPreservingReaderScroll();
});
document.addEventListener("click", (event) => {
  if (!state.streakPopoverOpen || event.target.closest?.(".streak-menu")) return;
  toggleStreakPopover(false);
});
document.addEventListener("click", (event) => {
  if (!state.focusReferenceOpen || event.target.closest?.(".mobile-focus-passage-control, .search-scope-popover")) return;
  state.focusReferenceOpen = false;
  renderPreservingReaderScroll();
});
document.addEventListener("click", (event) => {
  if (!state.focusSearchResultsOpen || event.target.closest?.(".mobile-focus-search-results, .mobile-focus-passage-control, .topbar .search")) return;
  state.focusSearchResultsOpen = false;
  renderPreservingReaderScroll();
});
document.addEventListener("click", (event) => {
  if ((!state.focusToolsOpen && !state.focusWorkspacePanel) || event.target.closest?.(".mobile-focus-tools-control, .desktop-focus-tools-control, .mobile-focus-workspace")) return;
  resetFocusToolSurfaces();
  renderPreservingReaderScroll();
});
document.addEventListener("click", handleSideToolbarPositionClick);
document.addEventListener("click", dismissSelectionBarOnOutsideClick);
document.addEventListener("fullscreenchange", render);
document.addEventListener("webkitfullscreenchange", render);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    pauseReaderAutoScroll();
    rememberReaderScrollBeforeAppSwitch();
    return;
  }
  restoreReaderScrollAfterAppSwitch({ allowStored: isStandaloneWebApp() });
  notePushVisit();
  maybeCheckForAppUpdate();
});
window.addEventListener("pagehide", rememberReaderScrollBeforeAppSwitch);
window.addEventListener("pageshow", () => {
  restoreReaderScrollAfterAppSwitch({ allowStored: isStandaloneWebApp() });
  notePushVisit();
  maybeCheckForAppUpdate();
});
window.setInterval(readerLifecycleHeartbeatTick, readerLifecycleHeartbeatIntervalMs);
window.setInterval(() => {
  notePushVisit();
  maybeCheckForAppUpdate();
}, appUpdateCheckIntervalMs);
const streakUpdatedToday = recordReadingStreak();
state.streakPopupVisible = state.showStreakPopup && streakUpdatedToday;
watchSystemTheme();
const startupLoaderPreview = new URLSearchParams(window.location.search).has("loaderPreview");
if (startupLoaderPreview) {
  document.documentElement.dataset.loaderPreview = "true";
} else {
  initializePushNotifications().finally(() => {
    if (!dataLoading && !dataError) renderPreservingReaderScroll();
    maybeOfferPushNotifications();
  });
  initializeSupabaseAuth();
  initializeBibleData();
}
