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

type ParagraphState = {
  firstVerse: number;
  currentVerse: number;
  textAdded: boolean;
  leadingHeadings: SectionHeading[];
  trailingHeadings: SectionHeading[];
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

function verseNumberFromId(value: unknown) {
  const match = String(value || "").match(/\.(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function cleanHeadingText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function collectNodeText(node: ApiBibleContentNode): string {
  if (!node || typeof node !== "object") return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  return (node.items || []).map(collectNodeText).join(" ");
}

function headingLevel(style: string) {
  const numericLevel = Number(style.match(/\d+/)?.[0]);
  if (Number.isFinite(numericLevel) && numericLevel > 0) return Math.min(numericLevel, 4);
  return 1;
}

function sectionHeadingFromBlock(node: ApiBibleContentNode): SectionHeading | null {
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

function needsBoundarySpace(existing: string, incoming: string) {
  const previousCharacter = existing.at(-1) || "";
  const nextCharacter = incoming.at(0) || "";
  if (!previousCharacter || !nextCharacter) return false;
  if (/\s/u.test(previousCharacter) || /\s/u.test(nextCharacter)) return false;

  // Keep punctuation attached to the word it belongs to.
  if (/^[,.;:!?…%)\]}”’']/u.test(nextCharacter)) return false;
  if (/[([{“‘]$/u.test(previousCharacter)) return false;

  // Preserve compounds and paths when a formatting node splits at the join.
  if (/[-‐‑‒–—/\\]$/u.test(previousCharacter)) return false;
  if (/^[-‐‑‒–—/\\]/u.test(nextCharacter)) return false;

  return true;
}

export function parseVerseContent(content: ApiBibleContentNode[]) {
  const verseParts = new Map<number, Array<{ text: string; wordsOfJesus: boolean }>>();
  const paragraphStarts = new Set<number>();
  const sectionHeadings = new Map<number, SectionHeading[]>();
  let pendingHeadings: SectionHeading[] = [];

  const appendText = (verseNumber: number, text: string, wordsOfJesus: boolean) => {
    if (!verseNumber || !text) return;
    const parts = verseParts.get(verseNumber) || [];
    const existing = parts.map((part) => part.text).join("");
    const separator = needsBoundarySpace(existing, text) ? " " : "";
    const incoming = `${separator}${text}`;
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
      if (!attributedVerse) {
        const acrosticHeading = acrosticHeadingFromText(node.text);
        if (acrosticHeading) {
          if (paragraphState.currentVerse) paragraphState.trailingHeadings.push(acrosticHeading);
          else paragraphState.leadingHeadings.push(acrosticHeading);
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
    (node.items || []).forEach((item) => visit(item, paragraphState, childWordsOfJesus));
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
    if (paragraphState.firstVerse && (pendingHeadings.length || paragraphState.leadingHeadings.length)) {
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

  return [...verseParts.entries()]
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
        ...(sectionHeadings.has(n) ? { sectionHeadings: sectionHeadings.get(n) } : {}),
        ...(wordsOfJesus.length ? { wordsOfJesus } : {}),
      };
    })
    .filter(({ text }) => text.length > 0);
}
