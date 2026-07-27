import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const defaultTablePath = path.join(rootDir, "sources", "bsb_tables.tsv");
const defaultBundlePath = path.join(rootDir, "assets", "bibles", "BSB.js");
const tablePath = path.resolve(process.argv[2] || defaultTablePath);
const bundlePath = path.resolve(process.argv[3] || defaultBundlePath);
const officialTableUrl = "https://bereanbible.com/bsb_tables.tsv";

if (!fs.existsSync(tablePath)) {
  throw new Error([
    `BSB translation table not found: ${tablePath}`,
    `Download the official TSV from ${officialTableUrl}`,
    `Then run: node scripts/build-bsb-strong-metadata.mjs ${path.relative(rootDir, tablePath)}`,
  ].join("\n"));
}
if (!fs.existsSync(bundlePath)) {
  throw new Error(`BSB bundle not found: ${bundlePath}`);
}

const bible = loadBibleBundle(bundlePath, "BIGSCREEN_BIBLE_BSB");
const tableVerses = await readTranslationTable(tablePath);
const diagnostics = {
  verses: 0,
  taggedVerses: 0,
  entries: 0,
  multiCodeEntries: 0,
  tableTaggedSegments: 0,
  mappedTaggedSegments: 0,
  tableTaggedTokens: 0,
  mappedTaggedTokens: 0,
  pendingForwardCodes: 0,
  unmatched: [],
};

Object.entries(bible.chapters).forEach(([chapterKey, chapter]) => {
  chapter.verses.forEach((verse) => {
    diagnostics.verses += 1;
    const reference = `${chapterKey}:${verse.n}`;
    const segments = tableVerses.get(reference) || [];
    const { entries, stats } = alignStrongSegments(verse.text, segments);

    diagnostics.tableTaggedSegments += stats.tableTaggedSegments;
    diagnostics.mappedTaggedSegments += stats.mappedTaggedSegments;
    diagnostics.tableTaggedTokens += stats.tableTaggedTokens;
    diagnostics.mappedTaggedTokens += stats.mappedTaggedTokens;
    if (stats.unmatched.length && diagnostics.unmatched.length < 40) {
      stats.unmatched.forEach((phrase) => {
        if (diagnostics.unmatched.length < 40) {
          diagnostics.unmatched.push(`${reference} | ${phrase}`);
        }
      });
    }

    if (entries.length) {
      verse.strong = entries.map(({ phrase, codes }) => [
        phrase,
        codes.length === 1 ? codes[0] : codes,
      ]);
      diagnostics.taggedVerses += 1;
      diagnostics.entries += entries.length;
      diagnostics.multiCodeEntries += entries.filter(({ codes }) => codes.length > 1).length;
    } else {
      delete verse.strong;
    }
  });
});

diagnostics.pendingForwardCodes = tableVerses.pendingForwardCodes || 0;
validateDiagnostics(diagnostics);
validateKnownMappings(bible);

bible.strongSource = officialTableUrl;
bible.strongSourceFormat = "Official BSB Translation Tables TSV";
delete bible.strongGeneratedAt;
fs.writeFileSync(
  bundlePath,
  `window.BIGSCREEN_BIBLE_BSB=${JSON.stringify(bible)};\n`,
);

const segmentCoverage = percentage(
  diagnostics.mappedTaggedSegments,
  diagnostics.tableTaggedSegments,
);
const tokenCoverage = percentage(
  diagnostics.mappedTaggedTokens,
  diagnostics.tableTaggedTokens,
);
console.log([
  `Updated ${path.relative(rootDir, bundlePath)} from ${path.relative(rootDir, tablePath)}.`,
  `${diagnostics.taggedVerses}/${diagnostics.verses} verses contain Strong's mappings.`,
  `${diagnostics.entries} phrase mappings (${diagnostics.multiCodeEntries} with multiple Strong's numbers).`,
  `Mapped ${segmentCoverage} of tagged table segments and ${tokenCoverage} of their English tokens.`,
  diagnostics.unmatched.length
    ? `First unmatched tagged segments:\n- ${diagnostics.unmatched.join("\n- ")}`
    : "All tagged English segments aligned.",
].join("\n"));

function loadBibleBundle(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context);
  const value = context.window[globalName];
  if (!value?.chapters) {
    throw new Error(`${globalName} did not initialize from ${filePath}`);
  }
  return value;
}

async function readTranslationTable(filePath) {
  const verses = new Map();
  const input = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  let firstLine = true;
  let reference = "";
  let segments = [];
  let previousVisibleSegment = null;
  let pendingForwardCodes = [];

  const finishVerse = () => {
    if (reference && segments.length) verses.set(reference, segments);
    segments = [];
    previousVisibleSegment = null;
    if (pendingForwardCodes.length) {
      verses.pendingForwardCodes = (verses.pendingForwardCodes || 0) +
        pendingForwardCodes.length;
    }
    pendingForwardCodes = [];
  };

  for await (const rawLine of input) {
    if (firstLine) {
      firstLine = false;
      continue;
    }
    const columns = rawLine.replace(/\r$/, "").split("\t");
    const nextReference = String(columns[12] || "").trim();
    if (nextReference && nextReference !== reference) {
      finishVerse();
      reference = normalizeReference(nextReference);
    }
    if (!reference) continue;

    const rawPhrase = String(columns[18] || "").trim();
    const code = normalizedTableCode(columns[10], columns[11]);
    if (!rawPhrase) continue;

    if (/^\.\s*\.\s*\.$/.test(rawPhrase)) {
      if (code && previousVisibleSegment) addUnique(previousVisibleSegment.codes, code);
      continue;
    }

    const hasForwardMarker = /(^|\s|\()vvv(?=\s|$)/.test(rawPhrase);
    if (hasForwardMarker && code) addUnique(pendingForwardCodes, code);

    let phrase = rawPhrase
      .replace(/(^|\s|\()vvv(?=\s|$)/g, "$1")
      .replace(/^(?:\.\s*){3}/, "")
      .trim();
    if (!phrase || phrase === "-") continue;

    phrase = visibleTablePhrase(phrase);
    if (!tokenize(phrase).length) continue;

    const codes = hasForwardMarker ? [] : [
      ...pendingForwardCodes,
      ...(code ? [code] : []),
    ];
    if (!hasForwardMarker) pendingForwardCodes = [];
    const segment = { phrase, codes: unique(codes) };
    segments.push(segment);
    previousVisibleSegment = segment;
  }
  finishVerse();
  return verses;
}

function normalizeReference(value) {
  return value
    .replace(/^Psalms\b/, "Psalm")
    .replace(/^Song of Solomon\b/, "Song of Songs");
}

function normalizedTableCode(hebrew, greek) {
  const hebrewNumber = String(hebrew || "").trim();
  if (/^\d+$/.test(hebrewNumber)) return `H${Number(hebrewNumber)}`;
  const greekNumber = String(greek || "").trim();
  if (/^\d+$/.test(greekNumber)) return `G${Number(greekNumber)}`;
  return "";
}

function visibleTablePhrase(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const tokens = [];
  const pattern = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;
  let match;
  while ((match = pattern.exec(String(value || "")))) {
    tokens.push({
      value: normalizeToken(match[0]),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

function normalizeToken(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/’/g, "'");
}

function alignStrongSegments(text, segments) {
  const actualTokens = tokenize(text);
  const tableTokens = [];
  segments.forEach((segment, segmentIndex) => {
    tokenize(segment.phrase).forEach((token) => {
      tableTokens.push({ ...token, segmentIndex });
    });
  });
  const tokenMap = longestCommonTokenMap(tableTokens, actualTokens);
  const entries = [];
  const stats = {
    tableTaggedSegments: 0,
    mappedTaggedSegments: 0,
    tableTaggedTokens: 0,
    mappedTaggedTokens: 0,
    unmatched: [],
  };

  segments.forEach((segment, segmentIndex) => {
    if (!segment.codes.length) return;
    const indexes = [];
    tableTokens.forEach((token, tableIndex) => {
      if (token.segmentIndex !== segmentIndex) return;
      stats.tableTaggedTokens += 1;
      const actualIndex = tokenMap.get(tableIndex);
      if (actualIndex !== undefined) {
        indexes.push(actualIndex);
        stats.mappedTaggedTokens += 1;
      }
    });
    stats.tableTaggedSegments += 1;
    const expectedLength = tokenize(segment.phrase).length;
    const fullyMapped = indexes.length === expectedLength &&
      indexes.every((value, index) => index === 0 || value === indexes[index - 1] + 1);
    if (!fullyMapped || !indexes.length) {
      stats.unmatched.push(segment.phrase);
      return;
    }

    const start = actualTokens[indexes[0]].start;
    const end = actualTokens[indexes.at(-1)].end;
    const phrase = text.slice(start, end);
    const previous = entries.at(-1);
    if (previous && previous.start === start && previous.end === end) {
      segment.codes.forEach((code) => addUnique(previous.codes, code));
    } else {
      entries.push({
        phrase,
        codes: unique(segment.codes),
        start,
        end,
      });
    }
    stats.mappedTaggedSegments += 1;
  });

  return { entries, stats };
}

function longestCommonTokenMap(tableTokens, actualTokens) {
  const rows = tableTokens.length + 1;
  const columns = actualTokens.length + 1;
  const scores = Array.from({ length: rows }, () => new Uint16Array(columns));
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      scores[row][column] = tableTokens[row - 1].value === actualTokens[column - 1].value
        ? scores[row - 1][column - 1] + 1
        : Math.max(scores[row - 1][column], scores[row][column - 1]);
    }
  }

  const result = new Map();
  let row = tableTokens.length;
  let column = actualTokens.length;
  while (row > 0 && column > 0) {
    if (tableTokens[row - 1].value === actualTokens[column - 1].value) {
      result.set(row - 1, column - 1);
      row -= 1;
      column -= 1;
    } else if (scores[row - 1][column] >= scores[row][column - 1]) {
      row -= 1;
    } else {
      column -= 1;
    }
  }
  return result;
}

function validateDiagnostics(values) {
  const segmentCoverage = values.tableTaggedSegments
    ? values.mappedTaggedSegments / values.tableTaggedSegments
    : 0;
  const tokenCoverage = values.tableTaggedTokens
    ? values.mappedTaggedTokens / values.tableTaggedTokens
    : 0;
  if (segmentCoverage < 0.97 || tokenCoverage < 0.99) {
    throw new Error(
      `BSB Strong's alignment coverage is too low: ${
        percentage(values.mappedTaggedSegments, values.tableTaggedSegments)
      } segments, ${percentage(values.mappedTaggedTokens, values.tableTaggedTokens)} tokens.`,
    );
  }
}

function validateKnownMappings(value) {
  const fixtures = [
    ["Genesis 1", 1, "God", ["H430"]],
    ["Genesis 1", 1, "the heavens", ["H8064"]],
    ["Genesis 1", 11, "seed-bearing", ["H2232", "H2233"]],
    ["Genesis 2", 11, "of Havilah", ["H2341"]],
    ["Daniel 1", 7, "Abednego", ["H5664"]],
    ["Song of Songs 1", 1, "Solomon’s", ["H8010"]],
  ];
  fixtures.forEach(([chapterKey, verseNumber, phrase, codes]) => {
    const verse = value.chapters[chapterKey]?.verses.find(({ n }) => n === verseNumber);
    const entry = verse?.strong?.find(([word]) => word === phrase);
    if (!entry) throw new Error(`Missing expected BSB Strong's mapping: ${chapterKey}:${verseNumber} ${phrase}`);
    const actualCodes = Array.isArray(entry[1]) ? entry[1] : [entry[1]];
    codes.forEach((code) => {
      if (!actualCodes.includes(code)) {
        throw new Error(`Expected ${chapterKey}:${verseNumber} ${phrase} to include ${code}`);
      }
    });
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function addUnique(values, value) {
  if (value && !values.includes(value)) values.push(value);
}

function percentage(numerator, denominator) {
  return denominator ? `${(numerator / denominator * 100).toFixed(2)}%` : "0.00%";
}
