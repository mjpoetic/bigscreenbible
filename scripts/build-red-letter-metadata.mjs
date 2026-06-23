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
  node scripts/build-red-letter-metadata.mjs VERSION=/path/to/usfm-folder [--derive=VERSION:SOURCE,...]

Example:
  node scripts/build-red-letter-metadata.mjs WEB=./sources/engwebp_usfm KJV=./sources/eng-kjv_usfm --derive=BSB:WEB,BBE:WEB,ASV:WEB

Output:
  assets/bibles/red-letters.js`);
  process.exit(args.length ? 0 : 1);
}

const versions = {};
const sources = {};
const diagnostics = [];
const transferDiagnostics = [];
const derivedRangeOverrides = {
  BSB: {
    "Matthew 9:6": [
      "But so that you may know that the Son of Man has authority on earth to forgive sins...”",
      "“Get up, pick up your mat, and go home.”",
    ],
    "Matthew 21:31": [
      "Which of the two did the will of his father?”",
      "“Truly I tell you, the tax collectors and prostitutes are entering the kingdom of God before you.",
    ],
    "Matthew 27:46": ["“Eli, Eli, lema sabachthani?”", "“My God, My God, why have You forsaken Me?”"],
    "Matthew 28:9": ["“Greetings!”"],
    "Mark 5:41": ["“Talitha koum!”", "“Little girl, I say to you, get up!”"],
    "Mark 7:34": ["“Ephphatha!”", "“Be opened!”"],
    "Mark 13:14": [
      "So when you see the abomination of desolation standing where it should not be ",
      "then let those who are in Judea flee to the mountains.",
    ],
    "Mark 15:34": ["“Eloi, Eloi, lema sabachthani?”", "“My God, My God, why have You forsaken Me?”"],
    "Luke 5:24": [
      "But so that you may know that the Son of Man has authority on the earth to forgive sins...”",
      "“I tell you, get up, pick up your mat, and go home.”",
    ],
    "Luke 8:8": [
      "Still other seed fell on good soil, where it sprang up and produced a crop—a hundredfold.”",
      "“He who has ears to hear, let him hear.”",
    ],
    "Luke 8:45": ["“Who touched Me?”"],
    "John 7:36": ["‘You will look for Me, but you will not find Me,’", "‘Where I am, you cannot come’"],
    "John 16:17": [
      "‘In a little while you will not see Me, and then after a little while you will see Me’",
      "‘Because I am going to the Father’",
    ],
    "John 21:15": ["“Simon son of John, do you love Me more than these?”", "“Feed My lambs.”"],
    "John 21:16": ["“Simon son of John, do you love Me?”", "“Shepherd My sheep.”"],
    "John 21:17": [
      "“Simon son of John, do you love Me?”",
      "“Do you love Me?”",
      "“Feed My sheep.",
    ],
    "Revelation 1:8": ["“I am the Alpha and the Omega,”", "who is and was and is to come—the Almighty."],
    "Revelation 21:5": ["“Behold, I make all things new.”", "“Write this down, for these words are faithful and true.”"],
  },
  BBE: {
    "Matthew 9:6": [
      "But so that you may see that on earth the Son of man has authority for the forgiveness of sins,",
      "Get up, and take up your bed, and go to your house.",
    ],
    "Matthew 21:31": [
      "Which of the two did his father's pleasure?",
      "Truly I say to you, that tax-farmers and loose women are going into the kingdom of God before you.",
    ],
    "Matthew 27:46": ["Eli, Eli, lama sabachthani?", "My God, my God, why are you turned away from me?"],
    "Matthew 8:3": ["It is my pleasure; be clean."],
    "Matthew 9:30": ["Let no man have knowledge of it."],
    "Matthew 15:10": ["Give ear, and let my words be clear to you:"],
    "Matthew 26:25": ["Yes."],
    "Matthew 28:9": ["Be glad."],
    "Mark 5:41": ["Talitha cumi", "My child, I say to you, Get up."],
    "Mark 7:34": ["Ephphatha", "Be open."],
    "Mark 13:14": [
      "But when you see the unclean thing which makes destruction, in the place where it has no right to be ",
      "then let those who are in Judaea go quickly to the mountains:",
    ],
    "Mark 15:34": ["Eloi, Eloi, lama sabachthani?", "My God, my God, why are you turned away from me?"],
    "Luke 5:24": [
      "But so that you may see that on earth the Son of man has authority for the forgiveness of sins,",
      "I say to you, Get up, and take up your bed, and go into your house.",
    ],
    "Luke 5:13": ["It is my pleasure; be clean."],
    "Luke 7:13": ["Be not sad."],
    "Luke 7:43": ["Your decision is right."],
    "Luke 8:8": [
      "And some falling on good earth, came up and gave fruit a hundred times as much.",
      "He who has ears, let him give ear.",
    ],
    "Luke 8:45": ["Who was touching me?"],
    "John 7:36": ["You will be looking for me and will not see me", "where I am you may not come"],
    "John 1:43": ["Come and be my disciple."],
    "John 6:43": ["Do not say things against me, one to another."],
    "John 19:28": ["Give me water."],
    "John 16:17": [
      "After a little time, you will see me no longer; and then again, after a little time, you will see me?",
      "I am going to the Father?",
    ],
    "John 21:15": [
      "Simon, son of John, is your love for me greater than the love of these others?",
      "Then give my lambs food.",
    ],
    "John 21:16": ["Simon, son of John, have you any love for me?", "Then take care of my sheep"],
    "John 21:17": ["Simon, son of John, am I dear to you?", "Am I dear to you?", "Then give my sheep food."],
    "Revelation 1:8": ["I am the First and the Last", "who is and was and is to come, the Ruler of all."],
    "Revelation 21:5": ["See, I make all things new.", "Put it in the book; for these words are certain and true."],
  },
  ASV: {
    "Matthew 9:6": [
      "But that ye may know that the Son of man hath authority on earth to forgive sins",
      "Arise, and take up thy bed, and go unto thy house.",
    ],
    "Matthew 21:31": [
      "Which of the two did the will of his father?",
      "Verily I say unto you, that the publicans and the harlots go into the kingdom of God before you.",
    ],
    "Matthew 27:46": ["Eli, Eli, lama sabachthani?", "My God, my God, why hast thou forsaken me?"],
    "Matthew 15:16": ["Are ye also even yet without understanding?"],
    "Matthew 27:11": ["Thou sayest."],
    "Matthew 28:9": ["All hail."],
    "Mark 5:41": ["Talitha cumi", "Damsel, I say unto thee, Arise."],
    "Mark 10:51": ["What wilt thou that I should do unto thee?"],
    "Mark 15:2": ["Thou sayest."],
    "Mark 7:34": ["Ephphatha", "Be opened."],
    "Mark 13:14": [
      "But when ye see the abomination of desolation standing where he ought not ",
      "then let them that are in Judæa flee unto the mountains:",
    ],
    "Mark 15:34": ["Eloi, Eloi, lama sabachthani?", "My God, my God, why hast thou forsaken me?"],
    "Luke 5:24": [
      "But that ye may know that the Son of man hath authority on earth to forgive sins",
      "I say unto thee, Arise, and take up thy couch, and go unto thy house.",
    ],
    "Luke 8:8": [
      "And other fell into the good ground, and grew, and brought forth fruit a hundredfold.",
      "He that hath ears to hear, let him hear.",
    ],
    "Luke 8:45": ["Who is it that touched me?"],
    "Luke 23:3": ["Thou sayest."],
    "John 7:36": ["Ye shall seek me, and shall not find me", "where I am, ye cannot come"],
    "John 18:4": ["Whom seek ye?"],
    "John 18:7": ["Whom seek ye?"],
    "John 20:15": ["Woman, why weepest thou? whom seekest thou?"],
    "John 16:17": [
      "A little while, and ye behold me not; and again a little while, and ye shall see me:",
      "Because I go to the Father?",
    ],
    "John 21:15": ["Simon, son of John, lovest thou me more than these?", "Feed my lambs."],
    "John 21:16": ["Simon, son of John, lovest thou me?", "Tend my sheep."],
    "John 21:17": ["Simon, son of John, lovest thou me?", "Lovest thou me?", "Feed my sheep."],
    "Revelation 1:8": ["I am the Alpha and the Omega", "who is and who was and who is to come, the Almighty."],
    "Revelation 21:5": ["Behold, I make all things new.", "Write: for these words are faithful and true."],
  },
};
const deriveArgument = args.find((arg) => arg.startsWith("--derive="));
const sourceArguments = args.filter((arg) => !arg.startsWith("--derive="));

for (const arg of sourceArguments) {
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

if (deriveArgument) {
  deriveArgument.slice("--derive=".length).split(",").filter(Boolean).forEach((mapping) => {
    const [rawTarget, rawSource] = mapping.split(":");
    const target = rawTarget?.toUpperCase();
    const source = rawSource?.toUpperCase();
    if (!target || !source || !versions[source]) {
      throw new Error(`Expected --derive=TARGET:SOURCE with a generated source version, got: ${mapping}`);
    }
    versions[target] = deriveTranslationRanges(source, target, versions[source]);
    sources[target] = `Derived from ${source} words-of-Jesus annotations and aligned to bundled ${target} text.`;
  });
}

const payload = {
  source: "Generated from USFM words-of-Jesus markers, with explicitly configured translation-aligned derivatives.",
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
if (transferDiagnostics.length) {
  console.warn(`Review ${transferDiagnostics.length} low-confidence derived annotations:`);
  transferDiagnostics.slice(0, 40).forEach((message) => console.warn(`  ${message}`));
}

function loadBundledTranslation(version) {
  const bundlePath = path.resolve(`assets/bibles/${version}.js`);
  if (!fs.existsSync(bundlePath)) throw new Error(`Bundled translation does not exist: ${bundlePath}`);
  const source = fs.readFileSync(bundlePath, "utf8");
  const equalsIndex = source.indexOf("=");
  const json = source.slice(equalsIndex + 1).replace(/;\s*$/, "");
  return JSON.parse(json);
}

function deriveTranslationRanges(sourceVersion, targetVersion, sourceChapters) {
  const sourceBible = loadBundledTranslation(sourceVersion);
  const targetBible = loadBundledTranslation(targetVersion);
  const output = {};

  Object.entries(sourceChapters).forEach(([chapterKey, annotatedVerses]) => {
    const sourceChapter = sourceBible.chapters?.[chapterKey];
    const targetChapter = targetBible.chapters?.[chapterKey];
    if (!sourceChapter || !targetChapter) return;

    Object.entries(annotatedVerses).forEach(([verseNumber, sourceRanges]) => {
      const number = Number(verseNumber);
      const sourceText = sourceChapter.verses?.find((verse) => Number(verse.n) === number)?.text;
      const targetText = targetChapter.verses?.find((verse) => Number(verse.n) === number)?.text;
      if (!sourceText || !targetText || !Array.isArray(sourceRanges)) return;
      const overrideKey = `${chapterKey}:${number}`;
      const override = derivedRangeOverrides[targetVersion]?.[overrideKey];
      const result = override
        ? rangesFromSubstrings(targetText, override)
        : transferRanges(sourceText, sourceRanges, targetText);
      if (!result.ranges.length || result.confidence < 0.48) {
        transferDiagnostics.push(`${targetVersion} ${chapterKey}:${number} could not be aligned`);
        return;
      }
      if (result.confidence < 0.48) {
        transferDiagnostics.push(
          `${targetVersion} ${chapterKey}:${number} confidence ${result.confidence.toFixed(2)} | ${result.preview}`,
        );
      }
      output[chapterKey] = output[chapterKey] || {};
      output[chapterKey][number] = result.ranges;
    });
  });
  return output;
}

function rangesFromSubstrings(text, snippets) {
  let cursor = 0;
  const ranges = [];
  for (const snippet of snippets) {
    const index = text.indexOf(snippet, cursor);
    if (index < 0) return { ranges: [], confidence: 0, preview: `Missing override: ${snippet}` };
    ranges.push({ start: index, end: index + snippet.length });
    cursor = index + snippet.length;
  }
  return { ranges, confidence: 1, preview: snippets.join(" | ") };
}

function transferRanges(sourceText, sourceRanges, targetText) {
  if (
    sourceRanges.length === 1 &&
    sourceRanges[0].start === 0 &&
    sourceRanges[0].end === sourceText.length
  ) {
    return { ranges: [{ start: 0, end: targetText.length }], confidence: 1, preview: targetText };
  }

  const quotedTransfer = transferQuotedRanges(sourceText, sourceRanges, targetText);
  if (quotedTransfer) return quotedTransfer;
  if (sourceRanges.length === 1) {
    const optimizedTransfer = optimizeSingleRange(sourceText, sourceRanges[0], targetText);
    if (optimizedTransfer) return optimizedTransfer;
  } else {
    const optimizedTransfers = sourceRanges.map((range) => optimizeSingleRange(sourceText, range, targetText));
    if (optimizedTransfers.every(Boolean)) {
      const optimizedRanges = optimizedTransfers
        .flatMap((result) => result.ranges)
        .sort((a, b) => a.start - b.start);
      if (optimizedRanges.every((range, index) => index === 0 || range.start >= optimizedRanges[index - 1].end)) {
        return {
          ranges: mergeAdjacentRanges(optimizedRanges, targetText),
          confidence: Math.min(...optimizedTransfers.map((result) => result.confidence)),
          preview: optimizedRanges.map(({ start, end }) => targetText.slice(start, end)).join(" | "),
        };
      }
    }
  }

  const sourceTokens = wordTokens(sourceText);
  const targetTokens = wordTokens(targetText);
  const matches = tokenMatches(sourceTokens, targetTokens);
  const ranges = sourceRanges.map((range) => {
    const start = range.start === 0
      ? 0
      : projectedBoundary("start", range.start, sourceText, sourceTokens, targetText, targetTokens, matches);
    const end = range.end === sourceText.length
      ? targetText.length
      : projectedBoundary("end", range.end, sourceText, sourceTokens, targetText, targetTokens, matches);
    return { start, end };
  }).filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start);

  const normalizedRanges = mergeAdjacentRanges(
    ranges.map((range) => ({
      start: Math.max(0, Math.min(targetText.length, range.start)),
      end: Math.max(0, Math.min(targetText.length, range.end)),
    })).sort((a, b) => a.start - b.start),
    targetText,
  );
  const matchedSourceTokens = new Set(matches.map(([sourceIndex]) => sourceIndex));
  const boundaryTokens = sourceRanges.flatMap((range) =>
    sourceTokens
      .map((token, index) => ({ token, index }))
      .filter(({ token }) => token.end > range.start && token.start < range.end)
      .map(({ index }) => index)
  );
  const matchedBoundaryTokens = boundaryTokens.filter((index) => matchedSourceTokens.has(index)).length;
  const lexicalCoverage = boundaryTokens.length ? matchedBoundaryTokens / boundaryTokens.length : 0;
  const topologyCoverage = normalizedRanges.length / sourceRanges.length;
  const confidence = Math.min(1, lexicalCoverage * 0.72 + topologyCoverage * 0.28);
  const preview = normalizedRanges.map(({ start, end }) => targetText.slice(start, end)).join(" | ");
  return { ranges: normalizedRanges, confidence, preview };
}

function wordTokens(text) {
  return [...String(text || "").matchAll(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)].map((match) => ({
    text: normalizedWord(match[0]),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function normalizedWord(value) {
  const normalized = String(value || "")
    .toLocaleLowerCase("en")
    .replace(/[’']/g, "");
  if (normalized.length > 6) return normalized.replace(/(?:eth|est)$/u, "");
  if (normalized.length > 4) return normalized.replace(/(?:es|s)$/u, "");
  return normalized;
}

function transferQuotedRanges(sourceText, sourceRanges, targetText) {
  const sourceQuotes = quoteRanges(sourceText);
  const targetQuotes = quoteRanges(targetText);
  if (!sourceQuotes.length || !targetQuotes.length) return null;

  const sourceRedText = sourceRanges.map(({ start, end }) => sourceText.slice(start, end)).join(" ");
  const sourcePlainText = textOutsideRanges(sourceText, sourceRanges);
  const mapped = targetQuotes.filter(({ start, end }) => {
    const quoteText = targetText.slice(start, end);
    const redScore = segmentSimilarity(quoteText, sourceRedText);
    const plainScore = segmentSimilarity(quoteText, sourcePlainText);
    return redScore >= 0.12 && redScore > plainScore * 1.08;
  });
  if (mapped.length < sourceRanges.length) return null;
  return {
    ranges: mergeAdjacentRanges(mapped, targetText),
    confidence: 0.96,
    preview: mapped.map(({ start, end }) => targetText.slice(start, end)).join(" | "),
  };
}

function quoteRanges(text) {
  const ranges = [];
  let start = -1;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "“" && start < 0) {
      start = index;
      continue;
    }
    if (text[index] === "”" && start >= 0) {
      ranges.push({ start, end: index + 1 });
      start = -1;
    }
  }
  if (start >= 0) ranges.push({ start, end: text.length });
  return ranges;
}

function optimizeSingleRange(sourceText, sourceRange, targetText) {
  const sourceSegments = [
    sourceText.slice(0, sourceRange.start),
    sourceText.slice(sourceRange.start, sourceRange.end),
    sourceText.slice(sourceRange.end),
  ];
  const boundaries = segmentBoundaries(targetText);
  const starts = sourceRange.start === 0 ? [0] : boundaries;
  const ends = sourceRange.end === sourceText.length ? [targetText.length] : boundaries;
  let best = null;

  starts.forEach((start) => {
    ends.forEach((end) => {
      if (end <= start) return;
      const targetSegments = [
        targetText.slice(0, start),
        targetText.slice(start, end),
        targetText.slice(end),
      ];
      const prefixScore = sourceRange.start === 0 ? 1 : segmentSimilarity(sourceSegments[0], targetSegments[0]);
      const redScore = segmentSimilarity(sourceSegments[1], targetSegments[1]);
      const suffixScore = sourceRange.end === sourceText.length ? 1 : segmentSimilarity(sourceSegments[2], targetSegments[2]);
      const lengthScore = segmentLengthSimilarity(sourceSegments[1], targetSegments[1]);
      const score = prefixScore * 1.15 + redScore * 1.7 + suffixScore * 1.15 + lengthScore * 0.35;
      if (!best || score > best.score) {
        best = { start, end, score, prefixScore, redScore, suffixScore, lengthScore };
      }
    });
  });
  if (!best) return null;
  const confidence = Math.min(
    1,
    best.redScore * 0.5 +
      best.prefixScore * 0.18 +
      best.suffixScore * 0.18 +
      best.lengthScore * 0.14,
  );
  return {
    ranges: [{ start: best.start, end: best.end }],
    confidence,
    preview: targetText.slice(best.start, best.end),
  };
}

function segmentBoundaries(text) {
  const boundaries = new Set([0, text.length]);
  wordTokens(text).forEach(({ start, end }) => {
    boundaries.add(start);
    boundaries.add(end);
  });
  for (let index = 0; index < text.length; index += 1) {
    if (/[.!?;:]/u.test(text[index])) {
      let boundary = index + 1;
      while (boundary < text.length && /\s/u.test(text[boundary])) boundary += 1;
      boundaries.add(boundary);
    }
  }
  return [...boundaries].sort((a, b) => a - b);
}

function segmentSimilarity(left, right) {
  const leftCounts = tokenCounts(left);
  const rightCounts = tokenCounts(right);
  const leftTotal = [...leftCounts.values()].reduce((sum, count) => sum + count, 0);
  const rightTotal = [...rightCounts.values()].reduce((sum, count) => sum + count, 0);
  if (!leftTotal && !rightTotal) return 1;
  if (!leftTotal || !rightTotal) return 0;
  let overlap = 0;
  leftCounts.forEach((count, token) => {
    overlap += Math.min(count, rightCounts.get(token) || 0);
  });
  return (2 * overlap) / (leftTotal + rightTotal);
}

function segmentLengthSimilarity(left, right) {
  const leftLength = wordTokens(left).length;
  const rightLength = wordTokens(right).length;
  if (!leftLength && !rightLength) return 1;
  return Math.min(leftLength, rightLength) / Math.max(1, leftLength, rightLength);
}

function tokenCounts(text) {
  const counts = new Map();
  wordTokens(text).forEach(({ text: token }) => counts.set(token, (counts.get(token) || 0) + 1));
  return counts;
}

function textOutsideRanges(text, ranges) {
  let cursor = 0;
  let output = "";
  ranges.forEach(({ start, end }) => {
    output += `${text.slice(cursor, start)} `;
    cursor = end;
  });
  return `${output}${text.slice(cursor)}`.trim();
}

function tokenMatches(sourceTokens, targetTokens) {
  const rows = sourceTokens.length + 1;
  const columns = targetTokens.length + 1;
  const lengths = Array.from({ length: rows }, () => new Uint16Array(columns));

  for (let sourceIndex = 1; sourceIndex < rows; sourceIndex += 1) {
    for (let targetIndex = 1; targetIndex < columns; targetIndex += 1) {
      lengths[sourceIndex][targetIndex] = sourceTokens[sourceIndex - 1].text === targetTokens[targetIndex - 1].text
        ? lengths[sourceIndex - 1][targetIndex - 1] + 1
        : Math.max(lengths[sourceIndex - 1][targetIndex], lengths[sourceIndex][targetIndex - 1]);
    }
  }

  const matches = [];
  let sourceIndex = sourceTokens.length;
  let targetIndex = targetTokens.length;
  while (sourceIndex > 0 && targetIndex > 0) {
    if (sourceTokens[sourceIndex - 1].text === targetTokens[targetIndex - 1].text) {
      matches.push([sourceIndex - 1, targetIndex - 1]);
      sourceIndex -= 1;
      targetIndex -= 1;
    } else if (lengths[sourceIndex - 1][targetIndex] >= lengths[sourceIndex][targetIndex - 1]) {
      sourceIndex -= 1;
    } else {
      targetIndex -= 1;
    }
  }
  return matches.reverse();
}

function projectedBoundary(kind, sourceBoundary, sourceText, sourceTokens, targetText, targetTokens, matches) {
  const sourceInside = sourceTokens
    .map((token, index) => ({ token, index }))
    .find(({ token }) => kind === "start" ? token.end > sourceBoundary : token.start >= sourceBoundary);
  const before = [...matches].reverse().find(([sourceIndex]) =>
    sourceTokens[sourceIndex].end <= sourceBoundary
  );
  const after = matches.find(([sourceIndex]) =>
    sourceTokens[sourceIndex].start >= sourceBoundary
  );

  let boundary;
  if (kind === "start" && sourceInside) {
    const alignedInside = matches.find(([sourceIndex]) => sourceIndex >= sourceInside.index);
    if (alignedInside) boundary = targetTokens[alignedInside[1]].start;
  }
  if (!Number.isFinite(boundary) && kind === "end") {
    const sourceBefore = sourceTokens
      .map((token, index) => ({ token, index }))
      .filter(({ token }) => token.end <= sourceBoundary)
      .at(-1);
    const alignedInside = sourceBefore
      ? [...matches].reverse().find(([sourceIndex]) => sourceIndex <= sourceBefore.index)
      : null;
    if (alignedInside) boundary = targetTokens[alignedInside[1]].end;
  }
  if (!Number.isFinite(boundary) && before && after) {
    boundary = kind === "start" ? targetTokens[after[1]].start : targetTokens[before[1]].end;
  }
  if (!Number.isFinite(boundary) && after) boundary = targetTokens[after[1]].start;
  if (!Number.isFinite(boundary) && before) boundary = targetTokens[before[1]].end;
  if (!Number.isFinite(boundary)) boundary = Math.round(sourceBoundary / sourceText.length * targetText.length);

  return includeBoundaryPunctuation(kind, boundary, targetText);
}

function includeBoundaryPunctuation(kind, boundary, text) {
  if (kind === "start") {
    let index = boundary;
    while (index > 0 && /[\s“‘"'([{—–:-]/u.test(text[index - 1])) index -= 1;
    const openingQuote = Math.max(text.lastIndexOf("“", boundary), text.lastIndexOf("\"", boundary));
    const closingQuote = Math.max(text.lastIndexOf("”", boundary), text.lastIndexOf("\"", boundary - 1));
    if (openingQuote >= 0 && openingQuote >= closingQuote && boundary - openingQuote <= 3) return openingQuote;
    return index;
  }
  let index = boundary;
  while (index < text.length && /[\s”’"'!?.,;:)\]}—–-]/u.test(text[index])) index += 1;
  return index;
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
