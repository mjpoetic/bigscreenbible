/* OSHB occurrence layer. Source/attribution: ./oshb/README.md and manifest.json.
 * Grammar follows morphhb/parsing/HebrewMorphologyCodes.html at the revision below.
 * This module deliberately does not translate or transliterate Hebrew. */
(() => {
  "use strict";
  const revision = "3d15126fb1ef74867fc1434be1942e837932691f";
  const books = {
    Genesis: "Gen", Exodus: "Exod", Leviticus: "Lev", Numbers: "Num", Deuteronomy: "Deut",
    Joshua: "Josh", Judges: "Judg", Ruth: "Ruth", "1 Samuel": "1Sam", "2 Samuel": "2Sam",
    "1 Kings": "1Kgs", "2 Kings": "2Kgs", "1 Chronicles": "1Chr", "2 Chronicles": "2Chr",
    Ezra: "Ezra", Nehemiah: "Neh", Esther: "Esth", Job: "Job", Psalm: "Ps", Proverbs: "Prov",
    Ecclesiastes: "Eccl", "Song of Songs": "Song", Isaiah: "Isa", Jeremiah: "Jer", Lamentations: "Lam",
    Ezekiel: "Ezek", Daniel: "Dan", Hosea: "Hos", Joel: "Joel", Amos: "Amos", Obadiah: "Obad",
    Jonah: "Jonah", Micah: "Mic", Nahum: "Nah", Habakkuk: "Hab", Zephaniah: "Zeph",
    Haggai: "Hag", Zechariah: "Zech", Malachi: "Mal",
  };
  const requests = new Map();

  function parseReference(reference) {
    const match = /^(.*?) ([1-9]\d*):([1-9]\d*)$/.exec(String(reference || ""));
    if (!match || !Object.hasOwn(books, match[1])) return null;
    return { book: match[1], file: books[match[1]], key: `${match[2]}:${match[3]}` };
  }

  async function loadVerse(reference, assetVersion = revision) {
    const ref = parseReference(reference);
    if (!ref) return null;
    if (!requests.has(ref.file)) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const request = fetch(`./assets/oshb/${ref.file}.json?v=${revision}-${encodeURIComponent(assetVersion)}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("OSHB book unavailable");
          return response.json();
        })
        .then((data) => {
          if (data.schema !== 1 || data.revision !== revision || data.book !== ref.book || !data.verses) {
            throw new Error("OSHB book revision/schema mismatch");
          }
          return data;
        })
        .catch(() => {
          requests.delete(ref.file); // A later click may retry after connectivity returns.
          return null;
        })
        .finally(() => clearTimeout(timer));
      requests.set(ref.file, request);
    }
    const data = await requests.get(ref.file);
    return data?.verses[ref.key] || null;
  }

  // Keep pointing and source Unicode ordering. Remove only segmentation marks,
  // cantillation and meteg for the readable surface; raw text remains in JSON.
  function displaySurface(surface) {
    return String(surface || "").replace(/[\/\u0591-\u05af\u05bd]/g, "");
  }

  function matchOccurrences(verse, code, context = {}) {
    const words = (verse?.words || []).filter((word) => word[2].includes(code) && word[4].startsWith("H"));
    if (!words.length) return { kind: "none", words: [] };
    // Unique lemma in both the trusted English mapping and the Hebrew verse.
    // Repeated lemmas are never assigned by order or by taking the first match.
    const unique = ["BSB", "KJV"].includes(context.version)
      && context.uniqueCodes?.includes(code) && words.length === 1
      && !verse.variant && !words[0][5];
    return { kind: unique ? "unique" : "verse", words };
  }

  const stems = {
    q: "Qal", N: "Niphal", p: "Piel", P: "Pual", h: "Hiphil", H: "Hophal", t: "Hithpael",
    o: "Polel", O: "Polal", r: "Hithpolel", m: "Poel", M: "Poal", k: "Palel", K: "Pulal",
    Q: "Qal passive", l: "Pilpel", L: "Polpal", f: "Hithpalpel", D: "Nithpael", j: "Pealal",
    i: "Pilel", u: "Hothpaal", c: "Tiphil", v: "Hishtaphel", w: "Nithpalel", z: "Hithpoel",
  };
  const conjugations = {
    p: "perfect", q: "sequential perfect", i: "imperfect", w: "sequential imperfect",
    h: "cohortative", j: "jussive", v: "imperative", r: "active participle", s: "passive participle",
    a: "infinitive absolute", c: "infinitive construct",
  };
  const genders = { m: "masculine", f: "feminine", b: "common gender", c: "common gender", x: "" };
  const numbers = { s: "singular", p: "plural", d: "dual", x: "" };
  const states = { a: "absolute", c: "construct", d: "determined", x: "" };
  const persons = { 1: "first person", 2: "second person", 3: "third person", x: "" };
  const nounTypes = { c: "Common noun", g: "Gentilic noun", p: "Proper noun" };
  const adjectiveTypes = { a: "Adjective", c: "Cardinal number", g: "Gentilic adjective", o: "Ordinal number" };
  const pronounTypes = { d: "Demonstrative pronoun", f: "Indefinite pronoun", i: "Interrogative pronoun", p: "Personal pronoun", r: "Relative pronoun" };
  const particles = { a: "Affirmation", d: "Definite article", e: "Exhortation", i: "Interrogative particle",
    j: "Interjection", m: "Demonstrative particle", n: "Negative particle", o: "Direct object marker", r: "Relative particle" };

  function decodeSegment(segment) {
    const unknown = "Grammar unavailable";
    function features(value, tables) {
      if (value.length !== tables.length) return null;
      const values = tables.map((table, index) => table[value[index]]);
      return values.some((value) => value === undefined) ? null : values.filter(Boolean).join(", ");
    }
    function phrase(label, value, tables) {
      if (!label) return unknown;
      const detail = features(value, tables);
      return detail === null ? unknown : [label, detail].filter(Boolean).join(", ");
    }
    if (segment === "C") return "Conjunction";
    if (segment === "D") return "Adverb";
    if (segment === "R") return "Preposition";
    if (segment === "Rd") return "Preposition + definite article";
    if (segment === "Np") return "Proper noun";
    if (segment === "Pf") return "Indefinite pronoun";
    if (/^T.$/.test(segment)) return particles[segment[1]] || unknown;
    if (segment === "Sd") return "Directional he suffix";
    if (segment === "Sh") return "Paragogic he suffix";
    if (segment === "Sn") return "Paragogic nun suffix";
    if (segment.startsWith("Sp")) return phrase("Pronominal suffix", segment.slice(2), [persons, genders, numbers]);
    if (segment[0] === "N") return phrase(nounTypes[segment[1]], segment.slice(2), [genders, numbers, states]);
    if (segment[0] === "A") return phrase(adjectiveTypes[segment[1]], segment.slice(2), [genders, numbers, states]);
    if (segment[0] === "P") return phrase(pronounTypes[segment[1]], segment.slice(2), [persons, genders, numbers]);
    if (segment[0] === "V") {
      const stem = stems[segment[1]], conjugation = conjugations[segment[2]];
      if (!stem || !conjugation) return unknown;
      const label = `${stem} ${conjugation}`;
      if (["a", "c"].includes(segment[2])) return segment.length === 3 ? label : unknown;
      return phrase(label, segment.slice(3), ["r", "s"].includes(segment[2])
        ? [genders, numbers, states] : [persons, genders, numbers]);
    }
    return unknown;
  }

  function decodeMorphology(code) {
    if (!/^H\S+$/.test(code || "")) return "Grammar unavailable";
    return code.slice(1).split("/").map(decodeSegment).join(" + ");
  }

  window.BigScreenBibleHebrew = Object.freeze({ revision, parseReference, loadVerse, displaySurface, matchOccurrences, decodeMorphology });
})();
