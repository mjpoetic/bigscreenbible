const books = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Songs",
  "Isaiah",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Romans",
  "1 Corinthians",
  "1 John",
  "Revelation",
];

const oldTestamentBooks = books.slice(0, books.indexOf("Matthew"));
const newTestamentBooks = books.slice(books.indexOf("Matthew"));
const testamentGroups = [
  ["Old Testament", oldTestamentBooks],
  ["New Testament", newTestamentBooks],
];

const bookAliases = {
  gen: "Genesis",
  ge: "Genesis",
  gn: "Genesis",
  ex: "Exodus",
  exo: "Exodus",
  lev: "Leviticus",
  le: "Leviticus",
  num: "Numbers",
  nu: "Numbers",
  deut: "Deuteronomy",
  dt: "Deuteronomy",
  jos: "Joshua",
  josh: "Joshua",
  jdg: "Judges",
  judg: "Judges",
  ru: "Ruth",
  ruth: "Ruth",
  "1sam": "1 Samuel",
  "1sa": "1 Samuel",
  "1 sam": "1 Samuel",
  "1 sa": "1 Samuel",
  "2sam": "2 Samuel",
  "2sa": "2 Samuel",
  "2 sam": "2 Samuel",
  "2 sa": "2 Samuel",
  "1ki": "1 Kings",
  "1kgs": "1 Kings",
  "1 kings": "1 Kings",
  "2ki": "2 Kings",
  "2kgs": "2 Kings",
  "2 kings": "2 Kings",
  "1chr": "1 Chronicles",
  "1ch": "1 Chronicles",
  "1 chron": "1 Chronicles",
  "1 chronicles": "1 Chronicles",
  "2chr": "2 Chronicles",
  "2ch": "2 Chronicles",
  "2 chron": "2 Chronicles",
  "2 chronicles": "2 Chronicles",
  ezr: "Ezra",
  ezra: "Ezra",
  neh: "Nehemiah",
  ne: "Nehemiah",
  est: "Esther",
  esth: "Esther",
  job: "Job",
  ps: "Psalms",
  psa: "Psalms",
  psm: "Psalms",
  psalm: "Psalms",
  psalms: "Psalms",
  pro: "Proverbs",
  prov: "Proverbs",
  proverb: "Proverbs",
  proverbs: "Proverbs",
  ecc: "Ecclesiastes",
  eccl: "Ecclesiastes",
  eccles: "Ecclesiastes",
  ecclesiastes: "Ecclesiastes",
  song: "Song of Songs",
  sos: "Song of Songs",
  songofsongs: "Song of Songs",
  isa: "Isaiah",
  is: "Isaiah",
  matt: "Matthew",
  mt: "Matthew",
  mat: "Matthew",
  mark: "Mark",
  mrk: "Mark",
  mk: "Mark",
  luke: "Luke",
  luk: "Luke",
  lk: "Luke",
  john: "John",
  jhn: "John",
  jn: "John",
  rom: "Romans",
  ro: "Romans",
  romans: "Romans",
  "1cor": "1 Corinthians",
  "1co": "1 Corinthians",
  "1 cor": "1 Corinthians",
  "1 corinthians": "1 Corinthians",
  "1jn": "1 John",
  "1 jn": "1 John",
  "1john": "1 John",
  "1 john": "1 John",
  rev: "Revelation",
  re: "Revelation",
  revelation: "Revelation",
};

const translations = [
  { code: "KJV", name: "King James Version", status: "bundled" },
  { code: "BSB", name: "Berean Standard Bible", status: "bundled" },
  { code: "WEB", name: "World English Bible", status: "bundled" },
  { code: "ASV", name: "American Standard Version", status: "bundled" },
  { code: "ESV", name: "English Standard Version", status: "licensed" },
  { code: "NLT", name: "New Living Translation", status: "licensed" },
  { code: "NKJV", name: "New King James Version", status: "licensed" },
  { code: "NASB", name: "New American Standard Bible", status: "licensed" },
  { code: "AMP", name: "Amplified Bible", status: "licensed" },
];

const translationCodes = translations.map((translation) => translation.code);
const translationLookup = Object.fromEntries(translations.map((translation) => [translation.code, translation]));

const bibleData = {
  "John 3": {
    title: "The New Birth",
    verses: [
      {
        n: 1,
        KJV: "There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:",
        BSB: "Now there was a man of the Pharisees named Nicodemus, a leader of the Jews.",
        WEB: "Now there was a man of the Pharisees named Nicodemus, a ruler of the Jews.",
        ASV: "Now there was a man of the Pharisees, named Nicodemus, a ruler of the Jews:",
        strong: [{ word: "Nicodemus", code: "G3530" }],
      },
      {
        n: 2,
        KJV: "The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God.",
        BSB: "He came to Jesus at night and said, Rabbi, we know that You are a teacher who has come from God. For no one could perform the signs You are doing if God were not with him.",
        WEB: "The same came to him by night, and said to him, Rabbi, we know that you are a teacher come from God.",
        ASV: "The same came unto him by night, and said to him, Rabbi, we know that thou art a teacher come from God.",
        strong: [{ word: "Rabbi", code: "G4461" }],
      },
      {
        n: 3,
        KJV: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.",
        BSB: "Jesus replied, Truly, truly, I tell you, no one can see the kingdom of God unless he is born again.",
        WEB: "Jesus answered him, Most certainly, I tell you, unless one is born anew, he cannot see God's Kingdom.",
        ASV: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except one be born anew, he cannot see the kingdom of God.",
        strong: [{ word: "again", code: "G509" }],
      },
      {
        n: 4,
        KJV: "Nicodemus saith unto him, How can a man be born when he is old?",
        BSB: "How can a man be born when he is old? Nicodemus asked. Can he enter his mother's womb a second time to be born?",
        WEB: "Nicodemus said to him, How can a man be born when he is old?",
        ASV: "Nicodemus saith unto him, How can a man be born when he is old?",
        strong: [],
      },
      {
        n: 5,
        KJV: "Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.",
        BSB: "Jesus answered, Truly, truly, I tell you, no one can enter the kingdom of God unless he is born of water and the Spirit.",
        WEB: "Jesus answered, Most certainly I tell you, unless one is born of water and spirit, he cannot enter into God's Kingdom.",
        ASV: "Jesus answered, Verily, verily, I say unto thee, Except one be born of water and the Spirit, he cannot enter into the kingdom of God.",
        strong: [
          { word: "water", code: "G5204" },
          { word: "Spirit", code: "G4151" },
        ],
      },
      {
        n: 6,
        KJV: "That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.",
        BSB: "Flesh is born of flesh, but spirit is born of the Spirit.",
        WEB: "That which is born of the flesh is flesh. That which is born of the Spirit is spirit.",
        ASV: "That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.",
        strong: [{ word: "flesh", code: "G4561" }],
      },
      {
        n: 7,
        KJV: "Marvel not that I said unto thee, Ye must be born again.",
        BSB: "Do not be amazed that I said, You must be born again.",
        WEB: "Do not marvel that I said to you, You must be born anew.",
        ASV: "Marvel not that I said unto thee, Ye must be born anew.",
        strong: [],
      },
      {
        n: 16,
        KJV: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        BSB: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
        WEB: "For God so loved the world that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.",
        ASV: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.",
        strong: [
          { word: "God", code: "G2316" },
          { word: "loved", code: "G25" },
          { word: "world", code: "G2889" },
          { word: "life", code: "G2222" },
        ],
      },
      {
        n: 17,
        KJV: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
        BSB: "For God did not send His Son into the world to condemn the world, but to save the world through Him.",
        WEB: "For God did not send his Son into the world to judge the world, but that the world should be saved through him.",
        ASV: "For God sent not the Son into the world to judge the world; but that the world should be saved through him.",
        strong: [{ word: "saved", code: "G4982" }],
      },
    ],
  },
  "Psalm 23": {
    title: "The Lord My Shepherd",
    verses: [
      {
        n: 1,
        KJV: "The LORD is my shepherd; I shall not want.",
        BSB: "The LORD is my shepherd; I shall not want.",
        WEB: "Yahweh is my shepherd: I shall lack nothing.",
        ASV: "Jehovah is my shepherd; I shall not want.",
        strong: [{ word: "shepherd", code: "H7462" }],
      },
      {
        n: 2,
        KJV: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
        BSB: "He makes me lie down in green pastures; He leads me beside quiet waters.",
        WEB: "He makes me lie down in green pastures. He leads me beside still waters.",
        ASV: "He maketh me to lie down in green pastures; He leadeth me beside still waters.",
        strong: [{ word: "waters", code: "H4325" }],
      },
      {
        n: 3,
        KJV: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
        BSB: "He restores my soul; He guides me in the paths of righteousness for the sake of His name.",
        WEB: "He restores my soul. He guides me in the paths of righteousness for his name's sake.",
        ASV: "He restoreth my soul: He guideth me in the paths of righteousness for his name's sake.",
        strong: [{ word: "restoreth", code: "H7725" }],
      },
      {
        n: 4,
        KJV: "Yea, though I walk through the valley of the shadow of death, I will fear no evil.",
        BSB: "Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.",
        WEB: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me.",
        ASV: "Yea, though I walk through the valley of the shadow of death, I will fear no evil; for thou art with me.",
        strong: [{ word: "fear", code: "H3372" }],
      },
      {
        n: 6,
        KJV: "Surely goodness and mercy shall follow me all the days of my life.",
        BSB: "Surely goodness and mercy will follow me all the days of my life, and I will dwell in the house of the LORD forever.",
        WEB: "Surely goodness and loving kindness shall follow me all the days of my life.",
        ASV: "Surely goodness and lovingkindness shall follow me all the days of my life.",
        strong: [{ word: "mercy", code: "H2617" }],
      },
    ],
  },
  "Romans 8": {
    title: "Life in the Spirit",
    verses: [
      {
        n: 1,
        KJV: "There is therefore now no condemnation to them which are in Christ Jesus.",
        BSB: "Therefore, there is now no condemnation for those who are in Christ Jesus.",
        WEB: "There is therefore now no condemnation to those who are in Christ Jesus.",
        ASV: "There is therefore now no condemnation to them that are in Christ Jesus.",
        strong: [{ word: "condemnation", code: "G2631" }],
      },
      {
        n: 28,
        KJV: "And we know that all things work together for good to them that love God.",
        BSB: "And we know that God works all things together for the good of those who love Him, who are called according to His purpose.",
        WEB: "We know that all things work together for good for those who love God.",
        ASV: "And we know that to them that love God all things work together for good.",
        strong: [
          { word: "work", code: "G4903" },
          { word: "good", code: "G18" },
        ],
      },
      {
        n: 39,
        KJV: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God.",
        BSB: "Neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.",
        WEB: "Nor height, nor depth, nor any other created thing will be able to separate us from God's love.",
        ASV: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God.",
        strong: [{ word: "love", code: "G26" }],
      },
    ],
  },
};

const crossRefs = {
  "John 3:16": [
    ["Numbers 21:9", "As Moses lifted up the serpent in the wilderness, so the Son of Man is lifted up."],
    ["John 1:14", "The Word became flesh and dwelt among us."],
    ["Romans 5:8", "God shows his love toward us while we were still sinners."],
    ["1 John 4:9", "The love of God was revealed through his Son."],
  ],
  "Psalm 23:1": [
    ["John 10:11", "I am the good shepherd."],
    ["Ezekiel 34:15", "I myself will be the shepherd of my sheep."],
  ],
  "Romans 8:28": [
    ["Genesis 50:20", "God meant it for good."],
    ["Ephesians 1:11", "He works all things after the counsel of his will."],
  ],
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
  textScale: Number(localStorage.getItem("lw_text_scale") || 1),
  focusMode: savedFocusMode(),
  libraryOpen: localStorage.getItem("lw_library_open") !== "false",
  studyOpen: localStorage.getItem("lw_study_open") !== "false",
  activeRail: "Verse",
  selectedStrong: "G2316",
  panelOpen: false,
  mobileControlsOpen: false,
  presentationSearchOpen: false,
  shortcutsOpen: false,
  pendingPanelFocus: null,
  pendingVerseFocus: false,
  selectedVerses: [],
  bookmarks: JSON.parse(localStorage.getItem("lw_bookmarks") || '["John 3:16","Psalm 23:1"]'),
  notes: JSON.parse(localStorage.getItem("lw_notes") || '{"John 3:16":"This verse is the heart of the Gospel. Mark for Sabbath worship display."}'),
};

state.versions = state.versions.filter((version) => translationCodes.includes(version));
if (state.versions.length === 0) state.versions = ["KJV", "WEB"];

function savedTheme() {
  const theme = localStorage.getItem("lw_theme");
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function watchSystemTheme() {
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!query) return;
  query.addEventListener("change", (event) => {
    if (localStorage.getItem("lw_theme")) return;
    state.theme = event.matches ? "dark" : "light";
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
};

state.textScale = clampTextScale(state.textScale);

function currentChapter() {
  return bibleData[state.reference] || bibleData["John 3"];
}

function currentVerse() {
  return currentChapter().verses.find((verse) => verse.n === state.verse) || currentChapter().verses[0];
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

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <main class="app-shell ${state.panelOpen ? "panel-open" : ""} ${state.focusMode ? "focus-shell" : ""} ${state.mobileControlsOpen ? "mobile-controls-open" : ""}" data-theme="${state.theme}" style="--text-scale: ${state.textScale}">
      ${topbar()}
      <section class="${mainGridClass()}">
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
}

function topbar() {
  const modeOptions = [
    ["reader", "Reader", icons.book],
    ["parallel", "Parallel Study", icons.parallel],
    ["big", "Big Screen", icons.screen],
  ];
  const focusLabel = state.focusMode ? "Show panels" : "Focus reading";
  const themeLabel = state.theme === "dark" ? "Light mode" : "Dark mode";
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
        ${state.versions.map((version) => `<span class="version-pill">${version}<button data-remove-version="${version}" aria-label="Remove ${version}" data-tooltip="Remove ${version}">x</button></span>`).join("")}
        <select id="versionSelect" aria-label="Add Bible version">
          <option>Add</option>
          ${translationCodes.filter((version) => !state.versions.includes(version)).map((version) => `<option value="${version}">${version}</option>`).join("")}
        </select>
      </div>
      <nav class="mode-tabs" aria-label="View mode">
        ${modeOptions.map(([mode, label, icon]) => `<button class="${state.mode === mode ? "active" : ""}" data-mode="${mode}" aria-label="${label}" data-tooltip="${label}">${icon}<span class="mode-label">${label}</span></button>`).join("")}
      </nav>
      <div class="text-size-control" aria-label="Text size controls">
        <button class="icon-btn" id="decreaseText" aria-label="Decrease text size" data-tooltip="Decrease text size">A-</button>
        <button class="text-size-reset" id="resetText" aria-label="Reset text size to 100%" data-tooltip="Reset text size">Aa ${Math.round(state.textScale * 100)}%</button>
        <button class="icon-btn" id="increaseText" aria-label="Increase text size" data-tooltip="Increase text size">A+</button>
      </div>
      <button class="icon-btn" id="shortcutsButton" aria-label="Keyboard shortcuts" data-tooltip="Keyboard shortcuts">?</button>
      <button class="icon-btn focus-toggle ${state.focusMode ? "active" : ""}" id="focusToggle" aria-label="${focusLabel}" data-tooltip="${focusLabel}">${state.focusMode ? icons.panels : icons.focus}</button>
      <button class="icon-btn theme-toggle" id="themeToggle" aria-label="${themeLabel}" data-tooltip="${themeLabel}">${state.theme === "dark" ? icons.sun : icons.moon}</button>
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
  return `
    <aside class="library">
      <div class="panel-minihead">
        <span>Verse</span>
        <button class="icon-btn" id="closeLibrary" aria-label="Hide verse picker" data-tooltip="Hide verse picker">×</button>
      </div>
      <div class="select-row">
        <select id="chapterSelect">
          ${Object.keys(bibleData).map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}
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
              ${group.map((book) => `<button class="book-row ${state.reference.startsWith(book) ? "active" : ""}" data-book="${book}"><span>${book}</span><span>${availableReferenceForBook(book) ? "Open" : "Ready"}</span></button>`).join("")}
            </div>
          </details>
        `).join("")}
      </div>
      <div class="library-footer">
        <strong>${state.versions.join(" + ")}</strong>
        <span>KJV, BSB, WEB, and ASV are bundled samples. ESV, NLT, NKJV, NASB, and AMP are wired for a licensed text provider.</span>
      </div>
    </aside>
  `;
}

function reader() {
  const chapter = currentChapter();
  return `
    <section class="reader">
      <div class="chapter-tools ${state.focusMode ? "compact" : ""}">
        <button class="icon-btn" id="prevVerse" aria-label="Previous verse" data-tooltip="Previous verse">‹</button>
        <button class="icon-btn" id="nextVerse" aria-label="Next verse" data-tooltip="Next verse">›</button>
        <div class="spacer"></div>
        <div class="compact-reference">${referenceLabel()} · ${state.versions.join(" / ")}</div>
        <select class="full-control" id="chapterSelectInline">${Object.keys(bibleData).map((key) => `<option ${key === state.reference ? "selected" : ""}>${key}</option>`).join("")}</select>
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
  let text = getVerseText(verse, version);
  if (isLicensedPlaceholder(verse, version)) {
    return `${text}<span class="license-note">${translationLookup[version].name} requires a licensed Bible text source before full verse text can display.</span>`;
  }
  verse.strong.forEach((entry) => {
    text = text.replace(entry.word, `<mark>${entry.word}</mark><button class="strong" data-strong="${entry.code}">${entry.code}</button>`);
  });
  return text;
}

function getVerseText(verse, version) {
  if (verse[version]) return verse[version];
  const translation = translationLookup[version];
  if (translation?.status === "licensed") return `${version} text source pending for ${state.reference}:${verse.n}.`;
  return verse.KJV;
}

function isLicensedPlaceholder(verse, version) {
  return !verse[version] && translationLookup[version]?.status === "licensed";
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
  return `
    <div class="parallel-table" style="--version-count: ${state.versions.length}">
      <div class="parallel-head"><div>V</div>${state.versions.map((version) => `<div>${version}</div>`).join("")}</div>
      ${currentChapter().verses.map((verse) => `
        <div class="parallel-row ${verse.n === state.verse ? "selected" : ""} ${state.selectedVerses.includes(verse.n) ? "passage-selected" : ""}" data-verse="${verse.n}">
          <div class="verse-num">${verse.n}</div>
          ${state.versions.map((version) => `<div class="parallel-copy">${renderStrongText(verse, version)}</div>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function studyPanel() {
  const refs = crossRefs[referenceLabel()] || crossRefs["John 3:16"];
  const [lemma, definition] = strongs[state.selectedStrong] || ["lookup", "Select a Strong's number in the text to inspect the lexical entry."];
  const strongClass = strongs[state.selectedStrong] ? "strong-card active-strong-card" : "strong-card";
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
          ${refs.map(([ref, copy]) => `<button class="ref-item" data-ref="${ref}"><div class="ref-title">${ref}</div><div class="ref-copy">${copy}</div></button>`).join("")}
        </div>
      </section>
      <section class="study-section" id="strongSection">
        <div class="study-heading">${icons.search} Strong's Lookup</div>
        <div class="${strongClass}" id="strongLookup">
          <div class="ref-title">${state.selectedStrong} · ${lemma}</div>
          <div class="ref-copy">${definition}</div>
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

function bottombar() {
  return `
    <footer class="bottombar">
      <button class="nav-button" id="prevChapter">‹ Previous Chapter</button>
      <div class="fineprint">${state.versions.join(" / ")} · ${referenceLabel()}</div>
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
  const text = getVerseText(verse, state.versions[0]);
  const verses = currentChapter().verses.map((item) => item.n);
  const verseIndex = verses.indexOf(state.verse);
  const canGoBack = verseIndex > 0;
  const canGoForward = verseIndex < verses.length - 1;
  return `
    <section class="presentation ${state.mode === "big" ? "open" : ""}" id="presentation">
      <div class="presentation-top">
        <div class="presentation-ref">${referenceLabel()} · ${state.versions[0]}</div>
        <div class="presentation-actions ${state.presentationSearchOpen ? "search-open" : ""}">
          <form class="presentation-search" id="presentationSearchForm">
            <button class="ghost-btn presentation-search-toggle" type="button" id="presentationSearchToggle" aria-label="Search passage" data-tooltip="Search passage">${icons.search}</button>
            <input id="presentationSearchInput" value="${referenceLabel()}" aria-label="Search passage in presentation" />
            <button class="ghost-btn presentation-search-go" type="submit">Go</button>
          </form>
          <button class="ghost-btn" id="closePresentation">Exit</button>
        </div>
      </div>
      <div class="presentation-text">${text}</div>
      <div class="presentation-bottom">
        <span>Big Screen Bible</span>
        <div class="presentation-controls">
          <button class="ghost-btn" id="presentationPrev" ${canGoBack ? "" : "disabled"}>Previous</button>
          <button class="ghost-btn" id="presentationNext" ${canGoForward ? "" : "disabled"}>Next</button>
        </div>
        <span>${isLicensedPlaceholder(verse, state.versions[0]) ? "Licensed text source needed" : "Use arrow controls to move verse by verse"}</span>
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
    document.getElementById(id)?.addEventListener("change", (event) => {
      if (event.target.value !== "Add") state.versions.push(event.target.value);
      localStorage.setItem("lw_versions", JSON.stringify(state.versions));
      render();
    });
  });
  document.getElementById("themeToggle")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("lw_theme", state.theme);
    render();
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
      if (state.focusMode) {
        state.focusMode = false;
        localStorage.setItem("lw_focus_mode", "false");
      }
      state.studyOpen = true;
      state.panelOpen = true;
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
      render();
    });
  });
  document.querySelectorAll("[data-goto]").forEach((button) => button.addEventListener("click", () => gotoReference(button.dataset.goto)));
  document.querySelectorAll("[data-ref]").forEach((button) => button.addEventListener("click", () => showToast(`${button.dataset.ref} queued for comparison`)));
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
  document.getElementById("presentationSearchToggle")?.addEventListener("click", () => {
    state.presentationSearchOpen = !state.presentationSearchOpen;
    render();
    if (state.presentationSearchOpen) requestAnimationFrame(() => document.getElementById("presentationSearchInput")?.focus());
  });
  document.getElementById("presentationSearchForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    gotoReference(document.getElementById("presentationSearchInput")?.value || "");
    if (state.mode === "big") state.presentationSearchOpen = false;
  });
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
    state.mode = "reader";
    state.presentationSearchOpen = false;
    render();
  });
  window.onkeydown = handleGlobalShortcuts;
}

function gotoReference(value) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  const match = cleaned.match(/^((?:[1-3]\s*)?[A-Za-z. ]+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return showToast("Try a reference like John 3:16");
  const book = normalizeBookName(match[1]);
  if (!book) return showToast(`I do not recognize ${match[1].trim()} yet`);
  const key = `${book} ${match[2]}`;
  if (!bibleData[key]) return showToast(`${key} is ready for the full data layer`);
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
    if (state.presentationSearchOpen) {
      event.preventDefault();
      state.presentationSearchOpen = false;
      return render();
    }
    if (state.mode === "big") {
      event.preventDefault();
      state.mode = "reader";
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

function focusWorkspaceTarget(target) {
  const focusMap = {
    Verse: "#chapterSelect",
    Search: "#referenceInput",
    Notes: "#notesSection",
    Bookmarks: "#bookmarksSection",
    "Cross-Refs": "#crossRefsSection",
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
  if (!reference) return showToast(`${book} is ready for the full data layer`);
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

watchSystemTheme();
render();
