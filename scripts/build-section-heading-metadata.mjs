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

const acrosticHeadings = new Map([
  ["ALEPH", "Aleph"],
  ["BETH", "Beth"],
  ["GIMEL", "Gimel"],
  ["DALETH", "Daleth"],
  ["HE", "He"],
  ["WAW", "Waw"],
  ["ZAYIN", "Zayin"],
  ["HETH", "Heth"],
  ["TETH", "Teth"],
  ["YODH", "Yodh"],
  ["KAPH", "Kaph"],
  ["LAMEDH", "Lamedh"],
  ["MEM", "Mem"],
  ["NUN", "Nun"],
  ["SAMEKH", "Samekh"],
  ["AYIN", "Ayin"],
  ["PE", "Pe"],
  ["TSADHE", "Tsadhe"],
  ["QOPH", "Qoph"],
  ["RESH", "Resh"],
  ["SIN AND SHIN", "Sin and Shin"],
  ["TAW", "Taw"],
]);

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log(`Usage:
  node scripts/build-section-heading-metadata.mjs VERSION=/path/to/usfm-folder

Example:
  node scripts/build-section-heading-metadata.mjs BSB=./sources/engbsb_usfm

Output:
  assets/bibles/headings.js`);
  process.exit(args.length ? 0 : 1);
}

const versions = {};
const sources = {};

for (const arg of args) {
  const [version, ...sourceParts] = arg.split("=");
  const sourcePath = sourceParts.join("=");
  if (!version || !sourcePath) throw new Error(`Expected VERSION=path, got: ${arg}`);
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) throw new Error(missingSourceMessage(version, sourcePath, resolved));
  versions[version.toUpperCase()] = parseSource(resolved);
  sources[version.toUpperCase()] = sourcePath;
}

const payload = {
  source: "Generated from source files that include USFM section heading markers.",
  sourceFormat: "Chapter keys map to verse numbers with heading arrays attached before that verse.",
  generatedAt: new Date().toISOString(),
  sources,
  versions,
};

const outputPath = path.resolve("assets/bibles/headings.js");
fs.writeFileSync(outputPath, `window.BIGSCREEN_BIBLE_HEADINGS = ${JSON.stringify(payload, null, 2)};\n`);
console.log(`Wrote ${outputPath}`);

function missingSourceMessage(version, sourcePath, resolved) {
  return [
    `Source path does not exist for ${version.toUpperCase()}: ${resolved}`,
    "",
    `The path "${sourcePath}" needs to point to an unzipped USFM folder on your computer.`,
    "The examples in the README are placeholders until those source files are downloaded into the project.",
    "",
    "Try this from the project folder to see what source folders are available:",
    "  find sources -maxdepth 2 -type d | sort",
    "",
    "Then rerun this script using the exact folder names that command shows.",
  ].join("\n");
}

function parseSource(sourcePath) {
  const stat = fs.statSync(sourcePath);
  const files = stat.isDirectory()
    ? fs.readdirSync(sourcePath)
      .filter((file) => /\.(usfm|sfm|txt)$/i.test(file))
      .map((file) => path.join(sourcePath, file))
    : [sourcePath];

  return files.reduce((chapters, file) => {
    const text = fs.readFileSync(file, "utf8");
    mergeChapters(chapters, parseUsfm(text));
    return chapters;
  }, {});
}

function parseUsfm(text) {
  const chapters = {};
  let book = "";
  let chapter = "";
  let pendingHeadings = [];

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
      pendingHeadings = [];
      return;
    }

    const heading = parseHeading(line);
    if (heading) {
      pendingHeadings.push(heading);
      return;
    }

    const verseMatch = line.match(/\\v\s+(\d+)/);
    if (!verseMatch || !book || !chapter || !pendingHeadings.length) return;
    addHeadings(chapters, book, chapter, Number(verseMatch[1]), pendingHeadings);
    pendingHeadings = [];
  });

  return chapters;
}

function parseHeading(line) {
  const match = line.match(/^\\(s|ms|mr|d|r|qa)(\d*)\s+(.+)$/i);
  if (!match) return null;
  const marker = match[1].toLowerCase();
  const text = normalizeHeadingText(match[3]);
  if (!text) return null;
  return {
    text,
    level: headingLevel(marker, match[2]),
  };
}

function headingLevel(marker, markerLevel) {
  if (marker === "r" || marker === "d" || marker === "qa") return 2;
  const level = Number(markerLevel);
  if (Number.isFinite(level) && level > 0) return Math.min(4, level);
  return 1;
}

function normalizeHeadingText(value) {
  const trimmed = String(value || "").trim();
  const acrostic = acrosticHeadings.get(trimmed.toUpperCase());
  if (acrostic) return acrostic;
  return trimmed
    .replace(/\\f\b[\s\S]*?\\f\*/g, "")
    .replace(/\\x\b[\s\S]*?\\x\*/g, "")
    .replace(/\\w\s+([^|\\]+)(?:\|[^\\]*)?\\w\*/g, "$1")
    .replace(/\\\+?[a-z0-9]+\*?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookCode(code) {
  return String(code).trim().toUpperCase().replace(/^0/, "");
}

function addHeadings(chapters, bookCode, chapter, verse, headings) {
  const bookName = bookCodeToName[bookCode];
  if (!bookName || !Number.isFinite(verse)) return;
  const key = `${bookName} ${Number(chapter)}`;
  chapters[key] = chapters[key] || {};
  chapters[key][verse] = chapters[key][verse] || [];
  headings.forEach((heading) => {
    if (!chapters[key][verse].some((item) => item.text === heading.text && item.level === heading.level)) {
      chapters[key][verse].push(heading);
    }
  });
}

function mergeChapters(target, source) {
  Object.entries(source).forEach(([chapter, verses]) => {
    target[chapter] = target[chapter] || {};
    Object.entries(verses).forEach(([verse, headings]) => {
      target[chapter][verse] = target[chapter][verse] || [];
      headings.forEach((heading) => {
        if (!target[chapter][verse].some((item) => item.text === heading.text && item.level === heading.level)) {
          target[chapter][verse].push(heading);
        }
      });
    });
  });
}
