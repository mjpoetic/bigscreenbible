import { normalizePsalm119AcrosticVerses } from "../_shared/psalm119-acrostic.ts";

export type EsvVerse = {
  n: number;
  text: string;
  paragraphStart: boolean;
  sectionHeadings?: Array<{ text: string; level: number }>;
};

export function cleanVerseText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function headingLevelForLine(line: string) {
  return line.length > 52 ? 2 : 1;
}

function extractEsvHeadings(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-=_—–\s]+$/.test(line))
    .map((line) => ({
      text: cleanVerseText(line),
      level: headingLevelForLine(line),
    }));
}

function splitTrailingEsvHeadings(text: string) {
  const headingSeparator = /(?:^|\r?\n)[ \t]*_{3,}[ \t]*(?:\r?\n|$)/;
  const match = headingSeparator.exec(text);
  if (!match) return { verseText: text, headings: [] };

  return {
    verseText: text.slice(0, match.index),
    headings: extractEsvHeadings(text.slice(match.index + match[0].length)),
  };
}

export function parseEsvVerses(
  passages: string[],
  options: { normalizePsalm119?: boolean } = {},
) {
  const body = passages.join("\n").replace(/\u00a0/g, " ");
  const verses: EsvVerse[] = [];
  const markerPattern = /\[(\d+)\]\s*([\s\S]*?)(?=\s*\[\d+\]|$)/g;
  let match: RegExpExecArray | null;
  let previousEnd = 0;
  let pendingHeadings: Array<{ text: string; level: number }> = [];

  while ((match = markerPattern.exec(body))) {
    const n = Number(match[1]);
    const leadingText = body.slice(previousEnd, match.index);
    const leadingHeadings = extractEsvHeadings(leadingText);
    const { verseText, headings: trailingHeadings } = splitTrailingEsvHeadings(
      match[2],
    );
    const text = cleanVerseText(verseText);
    const sectionHeadings = pendingHeadings.concat(leadingHeadings);
    const paragraphStart = verses.length === 0 ||
      /\n\s*\n/.test(leadingText) ||
      /(?:^|\n)[ \t]{2,}$/.test(leadingText);
    if (Number.isFinite(n) && text) {
      verses.push({
        n,
        text,
        paragraphStart,
        ...(sectionHeadings.length ? { sectionHeadings } : {}),
      });
    }
    pendingHeadings = trailingHeadings;
    previousEnd = markerPattern.lastIndex;
  }

  if (verses.length) {
    return options.normalizePsalm119
      ? normalizePsalm119AcrosticVerses(verses)
      : verses;
  }

  const fallbackText = cleanVerseText(body);
  return fallbackText
    ? [{ n: 1, text: fallbackText, paragraphStart: true }]
    : [];
}
