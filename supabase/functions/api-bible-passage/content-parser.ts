import { normalizePsalm119AcrosticVerses } from "../_shared/psalm119-acrostic.ts";

export type ApiBibleContentNode = {
  name?: string;
  type?: string;
  text?: string;
  attrs?: {
    number?: string;
    style?: string;
    verseId?: string;
    verseOrgIds?: string[];
  };
  items?: ApiBibleContentNode[];
};

type SectionHeading = {
  text: string;
  level: number;
};

type ParsedVerse = {
  n: number;
  text: string;
  paragraphStart: boolean;
  sectionHeadings?: SectionHeading[];
  wordsOfJesus?: Array<{ start: number; end: number }>;
};

type ParagraphState = {
  firstVerse: number;
  currentVerse: number;
  textAdded: boolean;
  leadingHeadings: SectionHeading[];
  trailingHeadings: SectionHeading[];
};

type Psalm119AcrosticStart = {
  verse: number;
  label: string;
  hebrew: string;
  variants: string[];
};

type ParseVerseContentOptions = {
  chapterHeading?: string;
};

const psalm119AcrosticLabels = new Set([
  "aleph",
  "beth",
  "gimel",
  "daleth",
  "he",
  "heh",
  "vav",
  "waw",
  "zayin",
  "cheth",
  "heth",
  "teth",
  "yod",
  "yodh",
  "kaf",
  "kaph",
  "lamed",
  "lamedh",
  "mem",
  "nun",
  "samech",
  "samekh",
  "ayin",
  "pe",
  "peh",
  "tsadde",
  "tsaddi",
  "tsadhe",
  "tsade",
  "tsadi",
  "tzaddi",
  "qof",
  "qoph",
  "resh",
  "shin",
  "taw",
  "tav",
]);

const psalm119AcrosticStarts: Psalm119AcrosticStart[] = [
  { verse: 1, label: "Aleph", hebrew: "א", variants: ["aleph"] },
  { verse: 9, label: "Beth", hebrew: "ב", variants: ["beth"] },
  { verse: 17, label: "Gimel", hebrew: "ג", variants: ["gimel"] },
  { verse: 25, label: "Daleth", hebrew: "ד", variants: ["daleth"] },
  { verse: 33, label: "He", hebrew: "ה", variants: ["he", "heh"] },
  { verse: 41, label: "Waw", hebrew: "ו", variants: ["waw", "vav"] },
  { verse: 49, label: "Zayin", hebrew: "ז", variants: ["zayin"] },
  { verse: 57, label: "Heth", hebrew: "ח", variants: ["heth", "cheth"] },
  { verse: 65, label: "Teth", hebrew: "ט", variants: ["teth"] },
  { verse: 73, label: "Yodh", hebrew: "י", variants: ["yodh", "yod"] },
  { verse: 81, label: "Kaph", hebrew: "כ", variants: ["kaph", "kaf"] },
  { verse: 89, label: "Lamedh", hebrew: "ל", variants: ["lamedh", "lamed"] },
  { verse: 97, label: "Mem", hebrew: "מ", variants: ["mem"] },
  { verse: 105, label: "Nun", hebrew: "נ", variants: ["nun"] },
  { verse: 113, label: "Samekh", hebrew: "ס", variants: ["samekh", "samech"] },
  { verse: 121, label: "Ayin", hebrew: "ע", variants: ["ayin"] },
  { verse: 129, label: "Pe", hebrew: "פ", variants: ["pe", "peh"] },
  {
    verse: 137,
    label: "Tsadhe",
    hebrew: "צ",
    variants: ["tsadhe", "tsadde", "tsaddi", "tsade", "tsadi", "tzaddi"],
  },
  { verse: 145, label: "Qoph", hebrew: "ק", variants: ["qoph", "qof"] },
  { verse: 153, label: "Resh", hebrew: "ר", variants: ["resh"] },
  {
    verse: 161,
    label: "Shin",
    hebrew: "ש",
    variants: ["shin", "sin and shin", "sin and"],
  },
  { verse: 169, label: "Taw", hebrew: "ת", variants: ["taw", "tav"] },
];

function verseNumberFromId(value: unknown) {
  const match = String(value || "").match(/\.(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function isPsalm119VerseId(value: unknown) {
  return /^PSA\.119\.\d+$/i.test(String(value || ""));
}

function cleanHeadingText(value: string) {
  return cleanProviderSmallCapsText(value).replace(/\s+/g, " ").trim();
}

function headingKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanVerseText(value: string) {
  return cleanProviderSmallCapsText(value).replace(/\s*¶+\s*/g, " ");
}

function cleanProviderSmallCapsText(value: string) {
  return value
    .replace(/\bL\s+ord(?=[A-Z])/g, "Lord ")
    .replace(/\bL\s+ord\b/g, "Lord");
}

function joinNodeText(parts: string[]) {
  return parts.reduce((joined, part) => {
    if (!part) return joined;
    const separator = needsBoundarySpace(joined, part) ? " " : "";
    return `${joined}${separator}${part}`;
  }, "");
}

function collectNodeText(node: ApiBibleContentNode): string {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  return joinNodeText((node.items || []).map(collectNodeText));
}

function headingLevel(style: string) {
  const numericLevel = Number(style.match(/\d+/)?.[0]);
  if (Number.isFinite(numericLevel) && numericLevel > 0) {
    return Math.min(numericLevel, 4);
  }
  return 1;
}

function sectionHeadingFromBlock(
  node: ApiBibleContentNode,
): SectionHeading | null {
  const style = String(node?.attrs?.style || "").toLowerCase();
  const isHeadingStyle = /^(s\d?|ms\d?|mr|r|d|sp)$/.test(style);
  if (node?.name !== "para" || !isHeadingStyle) return null;
  const text = cleanHeadingText(collectNodeText(node));
  return text ? { text, level: headingLevel(style) } : null;
}

function acrosticHeadingFromText(value: string): SectionHeading | null {
  const text = cleanHeadingText(value);
  if (!text) return null;
  const normalized = text.toLowerCase().replace(/[^a-z]/g, "");
  return psalm119AcrosticLabels.has(normalized) ? { text, level: 1 } : null;
}

function psalm119AcrosticForStartVerse(verse: number) {
  return psalm119AcrosticStarts.find((heading) => heading.verse === verse);
}

function psalm119AcrosticForPreviousVerse(verse: number) {
  return psalm119AcrosticStarts.find((heading) => heading.verse === verse + 1);
}

function splitPsalm119AcrosticText(text: string, verse: number) {
  const leading = psalm119AcrosticForStartVerse(verse);
  if (leading) {
    const pattern = new RegExp(
      `^\\s*(${leading.variants.join("|")})(?=\\s|[.:;,-]|$)`,
      "i",
    );
    const match = text.match(pattern);
    if (match) {
      return {
        leadingHeading: { text: leading.label, level: 1 },
        text: text.slice(match[0].length),
      };
    }
  }

  const trailing = psalm119AcrosticForPreviousVerse(verse);
  if (trailing) {
    const pattern = new RegExp(
      `(?:\\s|[.:;,-])(${trailing.variants.join("|")})\\s*$`,
      "i",
    );
    const match = text.match(pattern);
    if (match) {
      return {
        trailingHeading: { text: trailing.label, level: 1 },
        text: text.slice(0, match.index).trimEnd(),
      };
    }
  }

  return { text };
}

function needsBoundarySpace(existing: string, incoming: string) {
  const previousCharacter = existing.at(-1) || "";
  const nextCharacter = incoming.at(0) || "";
  if (!previousCharacter || !nextCharacter) return false;
  if (/\s/u.test(previousCharacter) || /\s/u.test(nextCharacter)) return false;
  if (/\bL$/u.test(existing) && /^ord\b/u.test(incoming)) return false;

  // Keep punctuation attached to the word it belongs to.
  if (/^[,.;:!?…%)\]}”’']/u.test(nextCharacter)) return false;
  if (/[([{“‘]$/u.test(previousCharacter)) return false;

  // Preserve compounds and paths when a formatting node splits at the join.
  if (/[-‐‑‒–—/\\]$/u.test(previousCharacter)) return false;
  if (/^[-‐‑‒–—/\\]/u.test(nextCharacter)) return false;

  return true;
}

function removeDuplicateChapterHeadings(
  verses: ParsedVerse[],
  chapterHeading: string | undefined,
) {
  const duplicateKey = headingKey(chapterHeading || "");
  if (!duplicateKey) return verses;
  verses.forEach((verse) => {
    if (!verse.sectionHeadings?.length) return;
    const filtered = verse.sectionHeadings.filter((heading) =>
      headingKey(heading.text) !== duplicateKey
    );
    if (filtered.length) verse.sectionHeadings = filtered;
    else delete verse.sectionHeadings;
  });
  return verses;
}

export function parseVerseContent(
  content: ApiBibleContentNode[],
  options: ParseVerseContentOptions = {},
) {
  const verseParts = new Map<
    number,
    Array<{ text: string; wordsOfJesus: boolean }>
  >();
  const paragraphStarts = new Set<number>();
  const sectionHeadings = new Map<number, SectionHeading[]>();
  let pendingHeadings: SectionHeading[] = [];
  let sawPsalm119Verse = false;

  const appendText = (
    verseNumber: number,
    text: string,
    wordsOfJesus: boolean,
  ) => {
    const cleanedText = cleanVerseText(text);
    if (!verseNumber || !cleanedText.trim()) return;
    const parts = verseParts.get(verseNumber) || [];
    const existing = parts.map((part) => part.text).join("");
    const separator = needsBoundarySpace(existing, cleanedText) ? " " : "";
    const incoming = `${separator}${cleanedText}`;
    const previous = parts.at(-1);
    if (previous?.wordsOfJesus === wordsOfJesus) previous.text += incoming;
    else parts.push({ text: incoming, wordsOfJesus });
    verseParts.set(verseNumber, parts);
  };

  const visit = (
    node: ApiBibleContentNode,
    paragraphState: ParagraphState,
    wordsOfJesus = false,
  ) => {
    if (!node || typeof node !== "object") return;

    if (node.name === "verse") {
      if (isPsalm119VerseId(node.attrs?.verseId)) sawPsalm119Verse = true;
      const verseNumber = Number(node.attrs?.number) ||
        verseNumberFromId(node.attrs?.verseId);
      if (verseNumber) {
        paragraphState.currentVerse = verseNumber;
        if (!paragraphState.firstVerse) paragraphState.firstVerse = verseNumber;
      }
      return;
    }

    if (node.type === "text" && typeof node.text === "string") {
      const attributedVerse = verseNumberFromId(node.attrs?.verseId) ||
        verseNumberFromId(node.attrs?.verseOrgIds?.[0]);
      const psalm119Attributed = isPsalm119VerseId(node.attrs?.verseId) ||
        isPsalm119VerseId(node.attrs?.verseOrgIds?.[0]);
      if (psalm119Attributed) sawPsalm119Verse = true;
      if (psalm119Attributed && attributedVerse) {
        const splitText = splitPsalm119AcrosticText(node.text, attributedVerse);
        if (splitText.leadingHeading) {
          paragraphState.leadingHeadings.push(splitText.leadingHeading);
        }
        if (splitText.trailingHeading) {
          paragraphState.trailingHeadings.push(splitText.trailingHeading);
        }
        if (cleanHeadingText(splitText.text)) {
          appendText(attributedVerse, splitText.text, wordsOfJesus);
          paragraphState.textAdded = true;
        }
        return;
      }
      if (!attributedVerse) {
        const acrosticHeading = acrosticHeadingFromText(node.text);
        if (acrosticHeading) {
          if (paragraphState.currentVerse) {
            paragraphState.trailingHeadings.push(acrosticHeading);
          } else paragraphState.leadingHeadings.push(acrosticHeading);
          return;
        }
      }
      const verseNumber = attributedVerse || paragraphState.currentVerse;
      appendText(verseNumber, node.text, wordsOfJesus);
      if (verseNumber) paragraphState.textAdded = true;
      return;
    }

    const childWordsOfJesus = wordsOfJesus ||
      (node.name === "char" && node.attrs?.style === "wj");
    (node.items || []).forEach((item) =>
      visit(item, paragraphState, childWordsOfJesus)
    );
  };

  content.forEach((block) => {
    const sectionHeading = sectionHeadingFromBlock(block);
    if (sectionHeading) {
      pendingHeadings.push(sectionHeading);
      return;
    }

    const paragraphState: ParagraphState = {
      firstVerse: 0,
      currentVerse: 0,
      textAdded: false,
      leadingHeadings: [],
      trailingHeadings: [],
    };
    visit(block, paragraphState);
    if (
      paragraphState.firstVerse &&
      (pendingHeadings.length || paragraphState.leadingHeadings.length)
    ) {
      const existing = sectionHeadings.get(paragraphState.firstVerse) || [];
      sectionHeadings.set(
        paragraphState.firstVerse,
        existing.concat(pendingHeadings, paragraphState.leadingHeadings),
      );
      pendingHeadings = [];
    }
    if (!paragraphState.firstVerse && !paragraphState.textAdded) {
      const text = cleanHeadingText(collectNodeText(block));
      if (text) pendingHeadings.push({ text, level: 1 });
    }
    if (paragraphState.trailingHeadings.length) {
      pendingHeadings.push(...paragraphState.trailingHeadings);
    }
    if (block?.name === "para" && paragraphState.firstVerse) {
      paragraphStarts.add(paragraphState.firstVerse);
    }
  });

  const verses = [...verseParts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([n, parts]) => {
      const joined = parts.map((part) => part.text).join("");
      const leadingWhitespace = joined.length - joined.trimStart().length;
      const text = joined.trim();
      let cursor = -leadingWhitespace;
      const wordsOfJesus: Array<{ start: number; end: number }> = [];
      parts.forEach((part) => {
        const start = Math.max(0, cursor);
        cursor += part.text.length;
        const end = Math.min(text.length, cursor);
        if (!part.wordsOfJesus || end <= start) return;
        const previous = wordsOfJesus.at(-1);
        if (previous?.end === start) previous.end = end;
        else wordsOfJesus.push({ start, end });
      });
      return {
        n,
        text,
        paragraphStart: paragraphStarts.has(n),
        ...(sectionHeadings.has(n)
          ? { sectionHeadings: sectionHeadings.get(n) }
          : {}),
        ...(wordsOfJesus.length ? { wordsOfJesus } : {}),
      };
    })
    .filter(({ text }) => text.length > 0);

  const normalizedVerses = removeDuplicateChapterHeadings(
    verses,
    options.chapterHeading,
  );

  return sawPsalm119Verse
    ? normalizePsalm119AcrosticVerses(normalizedVerses)
    : normalizedVerses;
}
