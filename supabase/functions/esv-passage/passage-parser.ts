import { normalizePsalm119AcrosticVerses } from "../_shared/psalm119-acrostic.ts";

export type EsvVerse = {
  n: number;
  text: string;
  paragraphStart: boolean;
  sectionHeadings?: Array<{ text: string; level: number }>;
  footnotes?: Array<{ id: string; text: string; reference?: string }>;
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
): EsvVerse[] {
  // Parse each passage separately: the API restarts note numbering per passage.
  if (passages.length > 1) {
    return passages.flatMap((passage) => parseEsvVerses([passage], options));
  }
  const passage = String(passages[0] || "").replace(/\u00a0/g, " ");
  const footer = /(?:^|\n)[ \t]*Footnotes[ \t]*\r?\n/i.exec(passage);
  const body = footer ? passage.slice(0, footer.index) : passage;
  const notes = new Map<string, { id: string; text: string; reference: string }>();
  if (footer) {
    const noteBody = passage.slice(footer.index + footer[0].length);
    const notePattern = /(?:^|\n)[ \t]*\((\d+)\)[ \t]+(\d+:\d+(?:[–-]\d+)?)\s+([\s\S]*?)(?=\n[ \t]*\(\d+\)[ \t]+\d+:\d+|$)/g;
    for (const note of noteBody.matchAll(notePattern)) {
      const text = cleanVerseText(note[3].replace(/\*([^*]+)\*/g, "$1"));
      if (text) notes.set(note[1], { id: note[1], reference: note[2], text });
    }
  }
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
    const footnotes: NonNullable<EsvVerse["footnotes"]> = [];
    const text = cleanVerseText(verseText.replace(/\((\d+)\)/g, (caller, id) => {
      const note = notes.get(id);
      if (!note) return caller;
      if (!footnotes.some((item) => item.id === id)) footnotes.push(note);
      return "";
    }));
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
        ...(footnotes.length ? { footnotes } : {}),
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
