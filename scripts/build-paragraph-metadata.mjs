#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const bookCodeToName = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job", PSA: "Psalm",
  PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Songs", ISA: "Isaiah",
  JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel",
  HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah",
  MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
  ZEC: "Zechariah", MAL: "Malachi", MAT: "Matthew", MRK: "Mark", LUK: "Luke",
  JHN: "John", ACT: "Acts", ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
  GAL: "Galatians", EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy",
  "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon", HEB: "Hebrews",
  JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Revelation",
};

const paragraphMarkers = new Set([
  "p", "m", "mi", "nb", "cls", "li", "li1", "li2", "li3", "li4",
  "q", "q1", "q2", "q3", "q4", "qa", "qc", "qm", "qm1", "qm2", "qm3",
  "pc", "pi", "pi1", "pi2", "pi3", "pm", "pmc", "pmo", "pmr", "pr",
]);

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log(`Usage:
  node scripts/build-paragraph-metadata.mjs VERSION=/path/to/usfm-folder VERSION=/path/to/file.usfx.xml

Example:
  node scripts/build-paragraph-metadata.mjs WEB=./sources/engwebp_usfm BSB=./sources/engbsb.usfx.xml

Output:
  assets/bibles/paragraphs.js`);
  process.exit(args.length ? 0 : 1);
}

const versions = {};
const sources = {};

for (const arg of args) {
  const [version, ...sourceParts] = arg.split("=");
  const sourcePath = sourceParts.join("=");
  if (!version || !sourcePath) throw new Error(`Expected VERSION=path, got: ${arg}`);
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) throw new Error(`Source path does not exist: ${resolved}`);
  versions[version.toUpperCase()] = parseSource(resolved);
  sources[version.toUpperCase()] = sourcePath;
}

const payload = {
  source: "Generated from source files that include USFM/USFX paragraph markers.",
  sourceFormat: "Chapter keys map to verse numbers that begin paragraphs.",
  generatedAt: new Date().toISOString(),
  sources,
  versions,
};

const outputPath = path.resolve("assets/bibles/paragraphs.js");
fs.writeFileSync(outputPath, `window.BIGSCREEN_BIBLE_PARAGRAPHS = ${JSON.stringify(payload, null, 2)};\n`);
console.log(`Wrote ${outputPath}`);

function parseSource(sourcePath) {
  const stat = fs.statSync(sourcePath);
  const files = stat.isDirectory()
    ? fs.readdirSync(sourcePath)
      .filter((file) => /\.(usfm|sfm|txt|xml)$/i.test(file))
      .map((file) => path.join(sourcePath, file))
    : [sourcePath];

  return files.reduce((chapters, file) => {
    const text = fs.readFileSync(file, "utf8");
    const parsed = /\.xml$/i.test(file) || /<usfx|<book\b|<chapter\b|<verse\b/.test(text.slice(0, 1000))
      ? parseUsfx(text)
      : parseUsfm(text);
    mergeChapters(chapters, parsed);
    return chapters;
  }, {});
}

function parseUsfm(text) {
  const chapters = {};
  let book = "";
  let chapter = "";
  let pendingParagraph = true;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const idMatch = line.match(/^\\id\s+([1-3]?[A-Z]{2,3})\b/i);
    if (idMatch) {
      book = normalizeBookCode(idMatch[1]);
      return;
    }

    const chapterMatch = line.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      chapter = chapterMatch[1];
      pendingParagraph = true;
    }

    const markerMatches = [...line.matchAll(/\\([a-z0-9]+)\*?(?:\s|$)/gi)].map((match) => match[1].toLowerCase());
    if (markerMatches.some((marker) => paragraphMarkers.has(marker))) pendingParagraph = true;

    const verseMatch = line.match(/\\v\s+(\d+)/);
    if (!verseMatch || !book || !chapter) return;
    const verse = Number(verseMatch[1]);
    if (verse === 1 || pendingParagraph) addStart(chapters, book, chapter, verse);
    pendingParagraph = false;
  });

  return chapters;
}

function parseUsfx(text) {
  const chapters = {};
  let book = "";
  let chapter = "";
  let pendingParagraph = true;
  const tokenPattern = /<book\b[^>]*(?:id|code)=["']([^"']+)["'][^>]*>|<c\b[^>]*(?:id|number)=["']?(\d+)["']?[^>]*>|<chapter\b[^>]*(?:id|number)=["']?(\d+)["']?[^>]*>|<p\b[^>]*>|<v\b[^>]*(?:id|number)=["']?(\d+)["']?[^>]*>|<verse\b[^>]*(?:id|number)=["']?(\d+)["']?[^>]*>/gi;

  let match;
  while ((match = tokenPattern.exec(text))) {
    if (match[1]) {
      book = normalizeBookCode(match[1]);
      continue;
    }
    if (match[2] || match[3]) {
      chapter = match[2] || match[3];
      pendingParagraph = true;
      continue;
    }
    if (match[0].startsWith("<p")) {
      pendingParagraph = true;
      continue;
    }
    const verse = Number(match[4] || match[5]);
    if (!book || !chapter || !Number.isFinite(verse)) continue;
    if (verse === 1 || pendingParagraph) addStart(chapters, book, chapter, verse);
    pendingParagraph = false;
  }

  return chapters;
}

function normalizeBookCode(code) {
  return String(code).trim().toUpperCase().replace(/^0/, "");
}

function addStart(chapters, bookCode, chapter, verse) {
  const bookName = bookCodeToName[bookCode];
  if (!bookName) return;
  const key = `${bookName} ${Number(chapter)}`;
  chapters[key] = chapters[key] || [];
  if (!chapters[key].includes(verse)) chapters[key].push(verse);
}

function mergeChapters(target, source) {
  Object.entries(source).forEach(([chapter, starts]) => {
    const merged = new Set([...(target[chapter] || []), ...starts]);
    target[chapter] = [...merged].sort((a, b) => a - b);
  });
}
