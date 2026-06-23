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

function verseNumberFromId(value: unknown) {
  const match = String(value || "").match(/\.(\d+)$/);
  return match ? Number(match[1]) : 0;
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
  let currentVerse = 0;

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
    paragraphState: { firstVerse: number },
    wordsOfJesus = false,
  ) => {
    if (!node || typeof node !== "object") return;

    if (node.name === "verse") {
      const verseNumber = Number(node.attrs?.number) ||
        verseNumberFromId(node.attrs?.verseId);
      if (verseNumber) {
        currentVerse = verseNumber;
        if (!paragraphState.firstVerse) paragraphState.firstVerse = verseNumber;
      }
      return;
    }

    if (node.type === "text" && typeof node.text === "string") {
      const attributedVerse = verseNumberFromId(node.attrs?.verseId) ||
        verseNumberFromId(node.attrs?.verseOrgIds?.[0]);
      appendText(attributedVerse || currentVerse, node.text, wordsOfJesus);
      return;
    }

    const childWordsOfJesus = wordsOfJesus ||
      (node.name === "char" && node.attrs?.style === "wj");
    (node.items || []).forEach((item) => visit(item, paragraphState, childWordsOfJesus));
  };

  content.forEach((block) => {
    const paragraphState = { firstVerse: 0 };
    visit(block, paragraphState);
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
        ...(wordsOfJesus.length ? { wordsOfJesus } : {}),
      };
    })
    .filter(({ text }) => text.length > 0);
}
