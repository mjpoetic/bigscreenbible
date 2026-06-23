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

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log(`Usage:
  node scripts/build-red-letter-metadata.mjs VERSION=/path/to/usfm-folder

Example:
  node scripts/build-red-letter-metadata.mjs WEB=./sources/engwebp_usfm KJV=./sources/eng-kjv_usfm

Output:
  assets/bibles/red-letters.js`);
  process.exit(args.length ? 0 : 1);
}

const versions = {};
const sources = {};
const diagnostics = [];

for (const arg of args) {
  const [rawVersion, ...sourceParts] = arg.split("=");
  const sourcePath = sourceParts.join("=");
  const version = rawVersion?.toUpperCase();
  if (!version || !sourcePath) throw new Error(`Expected VERSION=path, got: ${arg}`);
  const resolved = path.resolve(sourcePath);
  if (!fs.existsSync(resolved)) throw new Error(`Source path does not exist for ${version}: ${resolved}`);
  const bundledText = loadBundledTranslation(version);
  versions[version] = parseUsfmSource(resolved, bundledText, version);
  sources[version] = sourcePath;
}

const payload = {
  source: "Generated from USFM words-of-Jesus markers.",
  sourceFormat: "Chapter and verse keys map to character ranges in the bundled verse text.",
  generatedAt: new Date().toISOString(),
  sources,
  versions,
};

const outputPath = path.resolve("assets/bibles/red-letters.js");
fs.writeFileSync(outputPath, `window.BIGSCREEN_BIBLE_RED_LETTERS = ${JSON.stringify(payload, null, 2)};\n`);
console.log(`Wrote ${outputPath}`);
Object.entries(versions).forEach(([version, chapters]) => {
  const verseCount = Object.values(chapters).reduce((total, verses) => total + Object.keys(verses).length, 0);
  console.log(`${version}: ${verseCount} annotated verses`);
});
if (diagnostics.length) {
  console.warn(`Skipped ${diagnostics.length} unmatched annotations:`);
  diagnostics.slice(0, 20).forEach((message) => console.warn(`  ${message}`));
}

function loadBundledTranslation(version) {
  const bundlePath = path.resolve(`assets/bibles/${version}.js`);
  if (!fs.existsSync(bundlePath)) throw new Error(`Bundled translation does not exist: ${bundlePath}`);
  const source = fs.readFileSync(bundlePath, "utf8");
  const equalsIndex = source.indexOf("=");
  const json = source.slice(equalsIndex + 1).replace(/;\s*$/, "");
  return JSON.parse(json);
}

function parseUsfmSource(sourcePath, bundledText, version) {
  const files = fs.statSync(sourcePath).isDirectory()
    ? fs.readdirSync(sourcePath)
      .filter((file) => /\.(usfm|sfm|txt)$/i.test(file))
      .map((file) => path.join(sourcePath, file))
    : [sourcePath];
  const output = {};

  files.forEach((file) => {
    const verses = collectUsfmVerses(fs.readFileSync(file, "utf8"));
    Object.entries(verses).forEach(([chapterKey, sourceVerses]) => {
      const targetChapter = bundledText.chapters?.[chapterKey];
      if (!targetChapter) return;
      sourceVerses.forEach(({ n, content }) => {
        if (!content.includes("\\wj")) return;
        const target = targetChapter.verses?.find((verse) => Number(verse.n) === n)?.text;
        if (!target) return;
        const parsed = visibleTextAndRanges(content);
        const ranges = mergeAdjacentRanges(
          alignRedRanges(parsed.text, parsed.ranges, target),
          target,
        );
        if (!ranges.length) {
          diagnostics.push(`${version} ${chapterKey}:${n}`);
          return;
        }
        output[chapterKey] = output[chapterKey] || {};
        output[chapterKey][n] = ranges;
      });
    });
  });

  return output;
}

function collectUsfmVerses(text) {
  const chapters = {};
  let bookCode = "";
  let chapter = 0;
  let currentVerse = null;

  const flush = () => {
    if (!currentVerse || !bookCode || !chapter) return;
    const book = bookCodeToName[bookCode];
    if (!book) return;
    const key = `${book} ${chapter}`;
    chapters[key] = chapters[key] || [];
    chapters[key].push(currentVerse);
  };

  text.split(/\r?\n/).forEach((rawLine) => {
    const idMatch = rawLine.match(/^\\id\s+([1-3]?[A-Z]{2,3})\b/i);
    if (idMatch) {
      bookCode = idMatch[1].toUpperCase().replace(/^0/, "");
      return;
    }
    const chapterMatch = rawLine.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      flush();
      currentVerse = null;
      chapter = Number(chapterMatch[1]);
      return;
    }
    const verseMatch = rawLine.match(/\\v\s+(\d+)\s*(.*)$/);
    if (verseMatch) {
      flush();
      currentVerse = { n: Number(verseMatch[1]), content: verseMatch[2] || "" };
      return;
    }
    if (currentVerse && rawLine.trim() && !/^\\(?:s|ms|r|d|cl|mt|toc)\b/.test(rawLine.trim())) {
      currentVerse.content += ` ${rawLine.trim()}`;
    }
  });
  flush();
  return chapters;
}

function visibleTextAndRanges(source) {
  const withoutNotes = source
    .replace(/\\f\s[\s\S]*?\\f\*/g, "")
    .replace(/\\x\s[\s\S]*?\\x\*/g, "")
    .replace(/\\fig\s[\s\S]*?\\fig\*/g, "");
  const simplifiedWords = withoutNotes
    .replace(/\\\+?w\s+([^|\\]*?)(?:\|[^\\]*?)?\\\+?w\*/g, "$1");
  const tokens = simplifiedWords.split(/(\\wj\*?)/g);
  const chars = [];
  let red = false;

  tokens.forEach((token) => {
    if (token === "\\wj") {
      red = true;
      return;
    }
    if (token === "\\wj*") {
      red = false;
      return;
    }
    const visible = token
      .replace(/\\[+a-z0-9-]+\*?/gi, "")
      .replace(/\|[a-z][^\\\s]*/gi, "")
      .replace(/¶/g, "");
    for (const character of visible) chars.push({ character, red });
  });

  const normalized = [];
  chars.forEach(({ character, red: isRed }) => {
    if (/\s/u.test(character)) {
      if (!normalized.length || normalized.at(-1).character === " ") return;
      normalized.push({ character: " ", red: isRed });
      return;
    }
    normalized.push({ character, red: isRed });
  });
  while (normalized[0]?.character === " ") normalized.shift();
  while (normalized.at(-1)?.character === " ") normalized.pop();

  const text = normalized.map(({ character }) => character).join("");
  const ranges = [];
  normalized.forEach(({ red: isRed }, index) => {
    if (!isRed) return;
    const previous = ranges.at(-1);
    if (previous?.end === index) previous.end = index + 1;
    else ranges.push({ start: index, end: index + 1 });
  });
  return { text, ranges };
}

function alignRedRanges(sourceText, sourceRanges, targetText) {
  if (sourceText === targetText) return sourceRanges;
  if (sourceRanges.length === 1 && sourceRanges[0].start === 0 && sourceRanges[0].end === sourceText.length) {
    return [{ start: 0, end: targetText.length }];
  }
  const output = [];
  let targetCursor = 0;
  const canonicalTarget = canonicalText(targetText);
  let canonicalCursor = 0;
  sourceRanges.forEach(({ start, end }) => {
    const phrase = sourceText.slice(start, end).trim();
    if (!phrase) return;
    const index = targetText.indexOf(phrase, targetCursor);
    if (index >= 0) {
      output.push({ start: index, end: index + phrase.length });
      targetCursor = index + phrase.length;
      canonicalCursor = canonicalTarget.map.findIndex((targetIndex) => targetIndex >= targetCursor);
      if (canonicalCursor < 0) canonicalCursor = canonicalTarget.text.length;
      return;
    }

    const canonicalPhrase = canonicalText(phrase).text;
    if (!canonicalPhrase) return;
    const canonicalIndex = canonicalTarget.text.indexOf(canonicalPhrase, canonicalCursor);
    let canonicalStart = canonicalIndex;
    let canonicalEnd = canonicalIndex + canonicalPhrase.length;
    if (canonicalIndex < 0 && canonicalPhrase.length >= 20) {
      const prefix = canonicalPhrase.slice(0, 8);
      const suffix = canonicalPhrase.slice(-12);
      canonicalStart = canonicalTarget.text.indexOf(prefix, canonicalCursor);
      const suffixIndex = canonicalTarget.text.indexOf(suffix, Math.max(canonicalCursor, canonicalStart + prefix.length));
      canonicalEnd = suffixIndex < 0 ? -1 : suffixIndex + suffix.length;
    }
    if (canonicalStart < 0 || canonicalEnd <= canonicalStart) return;
    const rangeStart = canonicalTarget.map[canonicalStart];
    const lastCharacterIndex = canonicalTarget.map[canonicalEnd - 1];
    if (!Number.isFinite(rangeStart) || !Number.isFinite(lastCharacterIndex)) return;
    const rangeEnd = lastCharacterIndex + 1;
    output.push({ start: rangeStart, end: rangeEnd });
    targetCursor = rangeEnd;
    canonicalCursor = canonicalEnd;
  });
  return output;
}

function canonicalText(value) {
  const text = [];
  const map = [];
  Array.from(String(value || "")).forEach((character, index) => {
    if (!/[\p{L}\p{N}]/u.test(character)) return;
    text.push(character.toLocaleLowerCase("en"));
    map.push(index);
  });
  return { text: text.join(""), map };
}

function mergeAdjacentRanges(ranges, text) {
  return ranges.reduce((merged, range) => {
    const previous = merged.at(-1);
    if (previous && /^\s*$/u.test(text.slice(previous.end, range.start))) {
      previous.end = range.end;
      return merged;
    }
    merged.push({ ...range });
    return merged;
  }, []);
}
